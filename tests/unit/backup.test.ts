import { describe, expect, it } from 'vitest';
import { createBackup, MAX_BACKUP_BYTES, mergeProgress, readBackup } from '../../src/backup';
import { advanceQuestion, answerQuestion, initialProgress, makeQuestion, type Progress } from '../../src/model';
import { usesLoop } from '../../src/content';
import { advancedLessons } from '../../src/advanced-content';

function practice(id: string, answered = 1): Progress {
  let p: Progress = { ...initialProgress(), session: { id, lessonId: 'eq-1', seed: 12345, index: 0, started: true, source: 'drums', answers: [] } };
  for (let i = 0; i < answered; i++) {
    p = answerQuestion(p, makeQuestion('eq-1', 12345, i, 'drums').correct, `2026-10-08T20:00:0${i}.000Z`);
    if (i < answered - 1) p = advanceQuestion(p);
  }
  return p;
}
const load = (p: Progress) => readBackup(JSON.stringify(createBackup(p)));
const errorCode = (fn: () => unknown) => { try { fn(); } catch (error) { return (error as { code: string }).code; } throw new Error('Expected rejection'); };

describe('backup format', () => {
  it.each(['loudness-1', 'rhythm-3', ...advancedLessons.map(l => l.id)])('round trips and completes %s without duplicate scoring', lessonId => {
    const loop = usesLoop(lessonId.split('-')[0] as Parameters<typeof usesLoop>[0]);
    let p: Progress = { ...initialProgress(), session: { id: 'new-practice', lessonId, seed: 2026, index: 0, started: true, answers: [], ...(loop ? { source: 'acoustic' as const } : {}) } };
    for (let i = 0; i < 5; i++) {
      const q = makeQuestion(lessonId, 2026, i, p.session!.source);
      p = answerQuestion(p, q.correct, `2026-10-08T20:00:0${i}.000Z`);
      p = mergeProgress(p, load(p));
      expect(p.attempts).toHaveLength(i + 1);
      p = advanceQuestion(p);
    }
    expect(load(p)).toEqual(p);
    expect(p.results[0]).toMatchObject({ lessonId, correct: 5, ...(loop ? { source: 'acoustic' } : {}) });
  });
  it('rejects inconsistent loudness source metadata in a backup', () => {
    const p: Progress = { ...initialProgress(), session: { id: 'level-source', lessonId: 'loudness-1', seed: 2026, index: 0, started: true, answers: [], source: 'keys' } };
    const answered = answerQuestion(p, makeQuestion('loudness-1', 2026, 0).correct);
    answered.attempts[0].source = 'drums';
    expect(errorCode(() => load(answered))).toBe('conflict');
  });
  it('round trips a saved practice including its source and exact answer', () => {
    const p = practice('a', 3);
    expect(load(p)).toEqual(p);
  });
  it('reads 0.1 plain JSON without a source field', () => {
    const p = practice('a');
    delete p.eqSource; delete p.session!.source; delete p.attempts[0].source;
    const restored = readBackup(JSON.stringify(p));
    expect(restored.session).toEqual(p.session);
    expect(restored.eqSource).toBe('studio');
    expect(restored.attempts).toHaveLength(1);
  });
  it.each(['{}', '[]', 'null', '{', '{"format":"other"}', '{"version":1}'])('rejects non-backups without returning empty progress: %s', raw => {
    expect(errorCode(() => readBackup(raw))).toBe('invalid');
  });
  it.each([{ format: 'freq-backup', schemaVersion: 3 }, { version: 2 }])('identifies an unsupported future schema', future => {
    expect(errorCode(() => readBackup(JSON.stringify(future)))).toBe('future');
  });
  it('rejects unknown lessons, corrupt sessions and unknown source ids', () => {
    const p = practice('a');
    const corrupts = [{ ...p, attempts: [{ ...p.attempts[0], lessonId: 'missing' }] }, { ...p, session: { ...p.session, index: 4 } }, { ...p, eqSource: 'missing' }, { ...p, session: { ...p.session, source: 'missing' } }];
    for (const corrupt of corrupts) expect(errorCode(() => readBackup(JSON.stringify(corrupt)))).toBe('invalid');
  });
  it('rejects an internally inconsistent session rather than losing its answers', () => {
    const p = practice('a'); p.attempts = [];
    expect(errorCode(() => load(p))).toBe('conflict');
  });
  it('limits UTF-8 byte length before parsing', () => {
    expect(errorCode(() => readBackup('ş'.repeat(MAX_BACKUP_BYTES / 2 + 1)))).toBe('large');
  });
});

describe('merging progress', () => {
  it('is idempotent even when imported more than once', () => {
    const p = practice('a', 3);
    const once = mergeProgress(p, load(p));
    expect(mergeProgress(once, load(p))).toEqual(once);
    expect(once.attempts).toHaveLength(3);
  });
  it('keeps different sessions and current preferences', () => {
    const current = { ...practice('a'), locale: 'en' as const, path: 'music' as const, volume: 0.2 };
    const incoming = advanceQuestion(practice('b', 5));
    const merged = mergeProgress(current, incoming);
    expect(merged.attempts).toHaveLength(6);
    expect(merged.session).toEqual(current.session);
    expect(merged).toMatchObject({ locale: 'en', path: 'music', volume: 0.2 });
    expect(load(merged)).toEqual(merged);
  });
  it('restores an unfinished session when this device has none', () => {
    const incoming = practice('b');
    const merged = mergeProgress(initialProgress(), incoming);
    expect(merged.session).toEqual(incoming.session);
    expect(load(merged)).toEqual(merged);
  });
  it('uses the more advanced copy of the same session without double scoring', () => {
    const merged = mergeProgress(practice('a', 1), practice('a', 3));
    expect(merged.session?.index).toBe(2);
    expect(merged.session?.answers).toHaveLength(3);
    expect(merged.attempts).toHaveLength(3);
    expect(load(merged)).toEqual(merged);
  });
  it('does not reopen a session already completed in a backup', () => {
    const completed = advanceQuestion(practice('a', 5), '2026-10-08T20:00:08.000Z');
    const merged = mergeProgress(practice('a', 1), completed);
    expect(merged.session).toBeNull();
    expect(merged.results).toHaveLength(1);
    expect(merged.attempts).toHaveLength(5);
  });
  it('rejects conflicting immutable answers without mutating the original', () => {
    const current = practice('a'); const original = JSON.stringify(current);
    const incoming = practice('a'); incoming.attempts[0].correct = false;
    expect(errorCode(() => mergeProgress(current, incoming))).toBe('conflict');
    expect(JSON.stringify(current)).toBe(original);
  });
  it('rejects reusing a session id for a different question seed', () => {
    const current = practice('a', 0), incoming = practice('a', 0);
    incoming.session!.seed++;
    expect(errorCode(() => mergeProgress(current, incoming))).toBe('conflict');
  });
  it('rejects extra future answers when their resumable session is absent', () => {
    const incoming = practice('a', 3); incoming.session = null;
    expect(errorCode(() => mergeProgress(practice('a', 1), incoming))).toBe('conflict');
  });
});
