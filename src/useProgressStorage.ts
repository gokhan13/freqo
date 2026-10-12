import { useEffect, useRef, useState } from 'react';
import { mergeProgress, readBackup, recoverProgress, BackupError } from './backup';
import { initialProgress, STORAGE_KEY, LEGACY_STORAGE_KEY, type Progress } from './model';

export type StorageProblem = { kind: 'invalid' | 'conflict'; raw: string | null };
export function readSavedProgress(raw: string | null): { progress: Progress; problem: StorageProblem | null } {
  if (raw === null) return { progress: initialProgress(), problem: null };
  try { return { progress: readBackup(raw), problem: null }; }
  catch {
    let progress: Progress;
    try { progress=recoverProgress(raw); } catch { progress=initialProgress(); }
    return { progress, problem: { kind: 'invalid', raw } };
  }
}
const hasRecords = (p: Progress) => !!(p.session || p.attempts.length || p.results.length || p.personal?.active || p.personal?.results.length || p.exam?.active || p.exam?.results.length || p.exam?.rehearsals.length);

/** Preserve both copies on a conflict. Never overwrite a damaged record on startup. */
export function useProgressStorage() {
  const [initial] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); const source = raw ?? localStorage.getItem(LEGACY_STORAGE_KEY); return { ...readSavedProgress(source), raw, error: false }; }
    catch { return { progress: initialProgress(), problem: null, raw: null, error: true }; }
  });
  const [progress, setProgress] = useState(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  const [storageProblem, setStorageProblem] = useState<StorageProblem | null>(initial.problem);
  const seenRaw = useRef(initial.raw);
  const current = useRef(progress); current.current = progress;
  const blocked = useRef(storageProblem); blocked.current = storageProblem;
  const block = (problem: StorageProblem) => { blocked.current = problem; setStorageProblem(problem); };

  useEffect(() => {
    if (storageProblem || blocked.current) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== seenRaw.current) {
        // Also check before writing: a storage event may still be queued.
        const incoming = readSavedProgress(raw);
        if (incoming.problem) { block(incoming.problem); return; }
        if (!hasRecords(incoming.progress) && hasRecords(progress)) throw new BackupError('conflict');
        const merged = mergeProgress(progress, incoming.progress);
        seenRaw.current = raw;
        if (JSON.stringify(merged) !== JSON.stringify(progress)) { setProgress(merged); return; }
      }
      const next = JSON.stringify(progress);
      if (next !== raw) localStorage.setItem(STORAGE_KEY, next);
      seenRaw.current = next;
      setStorageError(false);
    } catch (error) {
      if (error instanceof BackupError) block({ kind: 'conflict', raw: localStorage.getItem(STORAGE_KEY) });
      else setStorageError(true);
    }
  }, [progress, storageProblem]);

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== STORAGE_KEY && event.key !== null) return;
      let raw: string | null;
      try { raw = localStorage.getItem(STORAGE_KEY); } catch { setStorageError(true); return; }
      if (raw === seenRaw.current) return;
      seenRaw.current = raw;
      if (blocked.current) { block({ ...blocked.current, raw }); return; }
      const incoming = readSavedProgress(raw);
      if (incoming.problem) { block(incoming.problem); return; }
      try {
        if (!hasRecords(incoming.progress) && hasRecords(current.current)) throw new BackupError('conflict');
        const merged = mergeProgress(current.current, incoming.progress);
        // External preference edits must not cause two tabs to rewrite each other forever.
        const next = { ...merged, locale: incoming.progress.locale, path: incoming.progress.path, volume: incoming.progress.volume, eqSource: incoming.progress.eqSource };
        if (JSON.stringify(next) !== JSON.stringify(current.current)) { current.current=next; setProgress(next); }
      } catch { block({ kind: 'conflict', raw }); }
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);

  const acceptRecovery = () => {
    try { seenRaw.current = localStorage.getItem(STORAGE_KEY); } catch { setStorageError(true); return; }
    blocked.current = null; setStorageProblem(null);
    setProgress(p => ({ ...p }));
  };
  const clearHistory = () => {
    try { localStorage.removeItem(LEGACY_STORAGE_KEY); localStorage.removeItem(STORAGE_KEY); seenRaw.current=null; } catch { setStorageError(true); }
    blocked.current=null; setStorageProblem(null);
    setProgress(p=>({...initialProgress(),locale:p.locale,path:p.path,volume:p.volume}));
  };
  return { progress, setProgress, storageError, storageProblem, acceptRecovery, clearHistory };
}
