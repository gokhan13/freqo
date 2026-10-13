import { useEffect, useRef, useState } from 'react';
import { mergeProgress, readBackupDetailed, recoverProgress, BackupError } from './backup';
import {
  initialProgress,
  STORAGE_KEY,
  RETIRED_STORAGE_KEYS,
  STORED_CONTENT,
  type Progress,
} from './model';

/**
 * invalid: the saved record is damaged · conflict: another tab holds different work ·
 * update: answers to rebuilt lessons must leave the record, but its archive copy could not
 * be saved. In every case automatic saving stops until the learner has decided.
 */
export type StorageProblem = { kind: 'invalid' | 'conflict' | 'update'; raw: string | null };
/** Told once after an update: what was carried over and what was set aside, and why. */
export type UpdateNotice = { retired: number; carried: boolean };
export const ARCHIVE_PREFIX = 'freq.archive.';
export const NOTICE_KEY = 'freq.update-notice';

export function readSavedProgress(
  raw: string | null,
  key: string = STORAGE_KEY,
): { progress: Progress; problem: StorageProblem | null; retired: number } {
  if (raw === null) return { progress: initialProgress(), problem: null, retired: 0 };
  const written = STORED_CONTENT[key];
  try {
    const read = readBackupDetailed(raw, written);
    return { progress: read.progress, problem: null, retired: read.retired };
  } catch {
    let progress: Progress;
    try {
      progress = recoverProgress(raw, written);
    } catch {
      progress = initialProgress();
    }
    return { progress, problem: { kind: 'invalid', raw }, retired: 0 };
  }
}
const hasRecords = (p: Progress) =>
  !!(
    p.session ||
    p.attempts.length ||
    p.results.length ||
    p.personal?.active ||
    p.personal?.results.length ||
    p.exam?.active ||
    p.exam?.results.length ||
    p.exam?.rehearsals.length
  );
// The same record always archives under the same key, so a repeated start cannot duplicate it.
const archiveKey = (raw: string) => {
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) hash = ((hash << 5) + hash + raw.charCodeAt(i)) >>> 0;
  return `${ARCHIVE_PREFIX}${raw.length}-${hash.toString(36)}`;
};
/** Records of earlier versions still held by this browser, oldest first. */
export function storedArchives(): { key: string; raw: string }[] {
  const keys = [...RETIRED_STORAGE_KEYS];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(ARCHIVE_PREFIX)) keys.push(key);
  }
  return keys.flatMap(key => {
    const raw = localStorage.getItem(key);
    return raw === null ? [] : [{ key, raw }];
  });
}
function readNotice(): UpdateNotice | null {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(NOTICE_KEY) ?? 'null');
    return v &&
      typeof v === 'object' &&
      Number.isInteger((v as UpdateNotice).retired) &&
      typeof (v as UpdateNotice).carried === 'boolean'
      ? { retired: (v as UpdateNotice).retired, carried: (v as UpdateNotice).carried }
      : null;
  } catch {
    return null;
  }
}

type Start = {
  progress: Progress;
  problem: StorageProblem | null;
  raw: string | null;
  error: boolean;
  notice: UpdateNotice | null;
};
function start(): Start {
  const fresh: Start = {
    progress: initialProgress(),
    problem: null,
    raw: null,
    error: false,
    notice: null,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const read = readSavedProgress(raw);
      if (read.problem || !read.retired)
        return {
          ...fresh,
          progress: read.progress,
          problem: read.problem,
          raw,
          notice: readNotice(),
        };
      // An update rebuilt lessons this record has answers to. Before those answers leave the
      // record, the record is kept as it was.
      const notice = { retired: read.retired, carried: false };
      try {
        localStorage.setItem(archiveKey(raw), raw);
        localStorage.setItem(NOTICE_KEY, JSON.stringify(notice));
      } catch {
        return { ...fresh, progress: read.progress, problem: { kind: 'update', raw }, raw, notice };
      }
      return { ...fresh, progress: read.progress, raw, notice };
    }
    // First run of this version: carry the newest earlier record over. It stays where it is.
    for (const key of [...RETIRED_STORAGE_KEYS].reverse()) {
      const old = localStorage.getItem(key);
      if (old === null) continue;
      const read = readSavedProgress(old, key);
      const notice = { retired: read.retired, carried: true };
      try {
        localStorage.setItem(NOTICE_KEY, JSON.stringify(notice));
      } catch {
        /* The notice is shown for this visit either way. */
      }
      return { ...fresh, progress: read.progress, notice };
    }
    return { ...fresh, notice: readNotice() };
  } catch {
    return { ...fresh, error: true };
  }
}

/** Preserve both copies on a conflict. Never overwrite a damaged record on startup. */
export function useProgressStorage() {
  const [initial] = useState(start);
  const [progress, setProgress] = useState(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  const [storageProblem, setStorageProblem] = useState<StorageProblem | null>(initial.problem);
  const [updateNotice, setUpdateNotice] = useState(initial.notice);
  const [archives, setArchives] = useState(() => {
    try {
      return storedArchives();
    } catch {
      return [];
    }
  });
  const seenRaw = useRef(initial.raw);
  const current = useRef(progress);
  current.current = progress;
  const blocked = useRef(storageProblem);
  blocked.current = storageProblem;
  const block = (problem: StorageProblem) => {
    blocked.current = problem;
    setStorageProblem(problem);
  };

  useEffect(() => {
    if (storageProblem || blocked.current) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== seenRaw.current) {
        // Also check before writing: a storage event may still be queued.
        const incoming = readSavedProgress(raw);
        if (incoming.problem) {
          block(incoming.problem);
          return;
        }
        if (!hasRecords(incoming.progress) && hasRecords(progress))
          throw new BackupError('conflict');
        const merged = mergeProgress(progress, incoming.progress);
        seenRaw.current = raw;
        if (JSON.stringify(merged) !== JSON.stringify(progress)) {
          setProgress(merged);
          return;
        }
      }
      const next = JSON.stringify(progress);
      if (next !== raw) localStorage.setItem(STORAGE_KEY, next);
      seenRaw.current = next;
      setStorageError(false);
    } catch (error) {
      if (error instanceof BackupError)
        block({ kind: 'conflict', raw: localStorage.getItem(STORAGE_KEY) });
      else setStorageError(true);
    }
  }, [progress, storageProblem]);

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || (event.key !== STORAGE_KEY && event.key !== null))
        return;
      let raw: string | null;
      try {
        raw = localStorage.getItem(STORAGE_KEY);
      } catch {
        setStorageError(true);
        return;
      }
      if (raw === seenRaw.current) return;
      seenRaw.current = raw;
      if (blocked.current) {
        block({ ...blocked.current, raw });
        return;
      }
      const incoming = readSavedProgress(raw);
      if (incoming.problem) {
        block(incoming.problem);
        return;
      }
      try {
        if (!hasRecords(incoming.progress) && hasRecords(current.current))
          throw new BackupError('conflict');
        const merged = mergeProgress(current.current, incoming.progress);
        // External preference edits must not cause two tabs to rewrite each other forever.
        const next = {
          ...merged,
          locale: incoming.progress.locale,
          path: incoming.progress.path,
          volume: incoming.progress.volume,
          eqSource: incoming.progress.eqSource,
        };
        if (JSON.stringify(next) !== JSON.stringify(current.current)) {
          current.current = next;
          setProgress(next);
        }
      } catch {
        block({ kind: 'conflict', raw });
      }
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);

  const refreshArchives = () => {
    try {
      setArchives(storedArchives());
    } catch {
      setStorageError(true);
    }
  };
  const acceptRecovery = () => {
    try {
      seenRaw.current = localStorage.getItem(STORAGE_KEY);
    } catch {
      setStorageError(true);
      return;
    }
    blocked.current = null;
    setStorageProblem(null);
    setProgress(p => ({ ...p }));
  };
  const dismissNotice = () => {
    try {
      localStorage.removeItem(NOTICE_KEY);
    } catch {
      /* It is gone for this visit either way. */
    }
    setUpdateNotice(null);
  };
  /** Deletes current progress only. Archives of earlier versions are a separate decision. */
  const clearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(NOTICE_KEY);
      seenRaw.current = null;
    } catch {
      setStorageError(true);
    }
    blocked.current = null;
    setStorageProblem(null);
    setUpdateNotice(null);
    setProgress(p => ({
      ...initialProgress(),
      locale: p.locale,
      path: p.path,
      volume: p.volume,
      ...(p.shortcuts === false ? { shortcuts: false } : {}),
    }));
  };
  const deleteArchives = () => {
    try {
      for (const { key } of storedArchives()) localStorage.removeItem(key);
    } catch {
      setStorageError(true);
    }
    refreshArchives();
  };
  return {
    progress,
    setProgress,
    storageError,
    storageProblem,
    acceptRecovery,
    clearHistory,
    updateNotice,
    dismissNotice,
    archives,
    deleteArchives,
  };
}
