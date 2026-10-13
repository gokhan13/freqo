import { describe, expect, it } from 'vitest';
import {
  BACKUP_SCHEMA,
  BackupError,
  MAX_BACKUP_BYTES,
  createBackup,
  mergeProgress,
  readBackup,
  readBackupDetailed,
} from '../../src/backup';
import { lessons } from '../../src/content';
import {
  LEGACY_CONTENT,
  PLACEMENT_KEY,
  currentContent,
  isStale,
  lessonRevision,
} from '../../src/content-revision';
import { startMock } from '../../src/exam-model';
import {
  RETIRED_STORAGE_KEYS,
  STORAGE_KEY,
  STORED_CONTENT,
  advanceQuestion,
  answerQuestion,
  initialProgress,
  makeQuestion,
  newSession,
  parseProgress,
  type Progress,
} from '../../src/model';
import {
  advancePersonal,
  answerPersonal,
  refQuestion,
  startPersonal,
  studyEvidence,
} from '../../src/personal-model';
import { readSavedProgress } from '../../src/useProgressStorage';

const T = Date.parse('2026-10-01T10:00:00Z');
const code = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return error instanceof BackupError ? error.code : 'other';
  }
  return null;
};
/** One finished, all-correct round of a lesson. */
function round(p: Progress, lessonId: string, id: string, at = T): Progress {
  p = { ...p, session: { ...newSession(lessonId, 'studio'), id, seed: 4242, started: true } };
  for (let i = 0; i < 5; i++) {
    const q = makeQuestion(lessonId, 4242, i, p.session!.source);
    p = answerQuestion(p, q.correct, new Date(at + i * 1000).toISOString());
    p = advanceQuestion(p, new Date(at + i * 1000 + 500).toISOString());
  }
  return p;
}
/** The record as an earlier version would have stored it: no content map. */
const written = (p: Progress) => {
  const { content: _content, ...rest } = p;
  return rest;
};
const envelope = (p: Progress, schemaVersion: number) =>
  JSON.stringify({
    format: 'freq-backup',
    schemaVersion,
    exportedAt: '2026-10-01T12:00:00.000Z',
    progress: written(p),
  });
const everything = (): Progress => {
  let p: Progress = { ...initialProgress(), locale: 'en', path: 'music', volume: 0.6 };
  p = round(p, 'eq-3', 'eq');
  p = round(p, 'eq-8', 'thirds', T + 60_000);
  p = round(p, 'compression-2', 'comp', T + 120_000);
  p = round(p, 'masking-1', 'mask', T + 180_000);
  p = round(p, 'loudness-1', 'loud', T + 240_000);
  p = round(p, 'degree-1', 'degree', T + 300_000);
  return p;
};
const kept = (p: Progress) => [...new Set(p.attempts.map(a => a.lessonId))].sort();

describe('content revisions', () => {
  it('numbers every rebuilt lesson and records the current numbers with new progress', () => {
    expect(lessonRevision('degree-1')).toBe(0);
    expect(lessonRevision('loudness-2')).toBe(0);
    expect(lessonRevision('eq-3')).toBe(2);
    expect(lessonRevision('eq-8')).toBe(3);
    expect(lessonRevision('attack-1')).toBe(1);
    expect(lessonRevision('masking-2')).toBe(2);
    expect(lessonRevision('missing')).toBe(0);
    const content = currentContent();
    expect(initialProgress().content).toEqual(content);
    expect(content[PLACEMENT_KEY]).toBe(1);
    for (const lesson of lessons)
      expect(content[lesson.id] ?? 0, lesson.id).toBe(lessonRevision(lesson.id));
    expect(isStale('eq-3', content)).toBe(false);
    expect(isStale('eq-3', LEGACY_CONTENT['0.9'])).toBe(true);
    expect(isStale('eq-3', LEGACY_CONTENT['0.11'])).toBe(false);
    expect(isStale('eq-8', LEGACY_CONTENT['0.11'])).toBe(true);
    expect(isStale('degree-1', LEGACY_CONTENT['0.9'])).toBe(false);
  });

  it('sets aside an old answer even when it would validate against the new sound', () => {
    // Exactly the trap: the same seed and the same choice are a valid, correct answer to the
    // current question, but the 0.9 question behind them was a different sound.
    const p = round(initialProgress(), 'eq-3', 'eq');
    expect(readBackup(JSON.stringify(createBackup(p))).attempts).toHaveLength(5);
    const old = readBackupDetailed(envelope(p, 2));
    expect(old.retired).toBe(5);
    expect(old.progress.attempts).toHaveLength(0);
    expect(old.progress.results).toHaveLength(0);
  });

  it('carries over everything an update did not rebuild, with preferences', () => {
    const p = everything();
    const from09 = readBackupDetailed(envelope(p, 2));
    expect(kept(from09.progress)).toEqual(['degree-1', 'loudness-1']);
    expect(from09.retired).toBe(20);
    expect(from09.progress).toMatchObject({ locale: 'en', path: 'music', volume: 0.6 });
    expect(from09.progress.results.map(r => r.lessonId).sort()).toEqual(['degree-1', 'loudness-1']);
    expect(from09.progress.content).toEqual(currentContent());
    // 0.11 already had today's EQ and dynamics; only what 0.12 rebuilt is set aside.
    const from011 = readBackupDetailed(envelope(p, 4));
    expect(kept(from011.progress)).toEqual(['compression-2', 'degree-1', 'eq-3', 'loudness-1']);
    expect(from011.retired).toBe(10);
    // 0.10 had rebuilt EQ once; 0.11 rebuilt it again and added the dynamics side conditions.
    expect(kept(readBackup(envelope(p, 3)))).toEqual(['degree-1', 'loudness-1']);
  });

  it('keeps a current backup whole and refuses a newer one', () => {
    const p = everything();
    const backup = createBackup(p);
    expect(backup.schemaVersion).toBe(BACKUP_SCHEMA);
    expect(BACKUP_SCHEMA).toBe(5);
    expect(readBackupDetailed(JSON.stringify(backup))).toEqual({ progress: p, retired: 0 });
    expect(code(() => readBackup(JSON.stringify({ ...backup, schemaVersion: 6 })))).toBe('future');
    expect(MAX_BACKUP_BYTES).toBe(5 * 1024 * 1024);
  });

  it('assumes the oldest content for a bare file, and the stored version for a stored record', () => {
    const p = everything();
    const bare = JSON.stringify(written(p));
    expect(kept(readBackup(bare))).toEqual(['degree-1', 'loudness-1']);
    expect(kept(parseProgress(bare))).toEqual(['degree-1', 'loudness-1']);
    expect(STORED_CONTENT[STORAGE_KEY]).toEqual(LEGACY_CONTENT['0.11']);
    for (const key of RETIRED_STORAGE_KEYS) expect(STORED_CONTENT[key]).toBeDefined();
    const stored = readSavedProgress(bare, STORAGE_KEY);
    expect(stored.problem).toBeNull();
    expect(stored.retired).toBe(10);
    expect(kept(stored.progress)).toEqual(['compression-2', 'degree-1', 'eq-3', 'loudness-1']);
    expect(readSavedProgress(bare, 'freq.progress.v2').retired).toBe(20);
    // A record that carries its own map is trusted over any assumption.
    expect(readSavedProgress(JSON.stringify(p), 'freq.progress.v1')).toMatchObject({
      retired: 0,
      progress: p,
    });
  });

  it('retires a personal session as a whole, and a mixing assessment drawn by the old rule', () => {
    const run = (path: 'mix' | 'music', mode: 'placement' | 'practice', id: string, at: number) => {
      let p = startPersonal(base, mode, path, at, 7, id);
      while (p.personal!.active) {
        const s = p.personal!.active;
        p = answerPersonal(p, refQuestion(s.items[s.index]).correct, at + 1 + s.index * 10);
        p = advancePersonal(p, at + 2 + s.index * 10);
      }
      base = p;
    };
    let base = initialProgress();
    run('music', 'placement', 'music-assessment', T);
    run('music', 'practice', 'music-practice', T + 100_000);
    run('mix', 'placement', 'mix-assessment', T + 200_000);
    expect(base.personal!.results).toHaveLength(3);
    const mixAnswers = base.personal!.results[2].answers.length;
    // From 0.9: the mixing assessment asks EQ and dynamics questions that were rebuilt.
    const old = readBackupDetailed(envelope(base, 2));
    expect(old.progress.personal!.results.map(r => r.id)).toEqual([
      'music-assessment',
      'music-practice',
    ]);
    expect(old.retired).toBe(mixAnswers);
    // Same lessons, older assessment rule: the mixing assessment alone goes.
    const { [PLACEMENT_KEY]: _rule, ...lessonsOnly } = currentContent();
    const before = readBackupDetailed(JSON.stringify({ ...base, content: lessonsOnly }));
    expect(before.progress.personal!.results.map(r => r.id)).toEqual([
      'music-assessment',
      'music-practice',
    ]);
    expect(studyEvidence(before.progress)).toHaveLength(5);
  });

  it('remembers that single-key shortcuts were switched off', () => {
    const p = { ...initialProgress(), shortcuts: false };
    expect(readBackup(JSON.stringify(createBackup(p))).shortcuts).toBe(false);
    expect(readBackup(JSON.stringify(createBackup(initialProgress()))).shortcuts).toBeUndefined();
  });
});

describe('restoring over unfinished work', () => {
  const unfinished = (id: string, lessonId: string): Progress => {
    const p = {
      ...initialProgress(),
      session: { ...newSession(lessonId, 'studio'), id, seed: 99, started: true },
    };
    return answerQuestion(
      p,
      makeQuestion(lessonId, 99, 0, 'studio').correct,
      new Date(T).toISOString(),
    );
  };
  it('between tabs two different unfinished practices are a conflict; a restore keeps this device’s', () => {
    const here = unfinished('here', 'eq-3'),
      backup = round(unfinished('there', 'loudness-1'), 'degree-1', 'done', T + 60_000);
    // `round` replaced the unfinished practice; put it back as the backup's open session.
    const incoming = { ...backup, session: unfinished('there', 'loudness-1').session };
    expect(code(() => mergeProgress(here, incoming))).toBe('conflict');
    const merged = mergeProgress(here, incoming, { keepCurrentSessions: true });
    expect(merged.session!.id).toBe('here');
    // Nothing answered is lost: the backup's finished round and its open practice's answer.
    expect(merged.attempts.map(a => a.sessionId).sort()).toEqual(
      ['done', 'done', 'done', 'done', 'done', 'here', 'there'].sort(),
    );
    expect(merged.results.map(r => r.id)).toEqual(['done']);
    expect(readBackup(JSON.stringify(createBackup(merged)))).toEqual(merged);
  });
  it('closes the backup’s unfinished personal session and mock with their answers kept', () => {
    const personal = (id: string) => {
      const p = startPersonal(initialProgress(), 'practice', 'music', T, 3, id);
      return answerPersonal(p, refQuestion(p.personal!.active!.items[0]).correct, T + 10);
    };
    const mock = (id: string, now: number): Progress => ({
      ...initialProgress(),
      exam: {
        version: 1,
        selectedProfile: 'common',
        active: startMock('common', 1, now, 5, id),
        results: [],
        rehearsals: [],
      },
    });
    const here = { ...personal('here'), exam: mock('mock-here', Date.now()).exam },
      there = { ...personal('there'), exam: mock('mock-there', Date.now() - 1000).exam };
    expect(code(() => mergeProgress(here, there))).toBe('conflict');
    const merged = mergeProgress(here, there, { keepCurrentSessions: true });
    expect(merged.personal!.active!.id).toBe('here');
    expect(merged.personal!.results).toMatchObject([{ id: 'there', status: 'ended' }]);
    expect(merged.personal!.results[0].answers).toHaveLength(1);
    expect(merged.exam!.active!.id).toBe('mock-here');
    expect(merged.exam!.results.map(r => r.id)).toEqual(['mock-there']);
    expect(readBackup(JSON.stringify(createBackup(merged)))).toEqual(merged);
  });
});
