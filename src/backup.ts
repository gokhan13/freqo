import { getLesson, usesLoop } from './content';
import { finishMock, initialExamProgress, readExamProgress } from './exam-model';
import type { ExamProgress } from './exam-types';
import { readPersonalProgress } from './personal-validation';
import { initialPersonalProgress, refIdentity } from './personal-model';
import type { PersonalProgress, PersonalSession } from './personal-types';
import { LEGACY_CONTENT, type ContentMap } from './content-revision';
import { retireStale } from './retire';
import {
  isEqSource,
  parseProgress,
  validAttempt,
  validResult,
  type Attempt,
  type Progress,
  type Result,
} from './model';

// Browsers keep about 5 MiB per site in localStorage; a larger backup could not be saved.
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export type BackupErrorCode = 'invalid' | 'future' | 'large' | 'conflict';
export class BackupError extends Error {
  constructor(public code: BackupErrorCode) {
    super(`Freq backup: ${code}`);
  }
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
export const BACKUP_SCHEMA = 5;
/** What a backup without a content map was answered against, by its envelope version. */
const writtenBy = (schema: unknown): ContentMap =>
  schema === 3
    ? LEGACY_CONTENT['0.10']
    : schema === 4
      ? LEGACY_CONTENT['0.11']
      : LEGACY_CONTENT['0.9'];
export const createBackup = (progress: Progress) => ({
  format: 'freq-backup',
  schemaVersion: BACKUP_SCHEMA,
  exportedAt: new Date().toISOString(),
  progress,
});

function sourceOf(record: Attempt | Result) {
  return usesLoop(getLesson(record.lessonId).skill) ? (record.source ?? 'studio') : null;
}
function sameAttempt(a: Attempt, b: Attempt) {
  return (
    a.lessonId === b.lessonId &&
    a.correct === b.correct &&
    a.at === b.at &&
    sourceOf(a) === sourceOf(b) &&
    a.response?.seed === b.response?.seed &&
    a.response?.choice === b.response?.choice
  );
}
function sameResult(a: Result, b: Result) {
  return (
    a.lessonId === b.lessonId &&
    a.correct === b.correct &&
    a.total === b.total &&
    a.at === b.at &&
    sourceOf(a) === sourceOf(b)
  );
}
function unique<T>(records: T[], key: (record: T) => string, same: (a: T, b: T) => boolean): T[] {
  const byId = new Map<string, T>();
  for (const record of records) {
    const id = key(record),
      previous = byId.get(id);
    if (previous && !same(previous, record)) throw new BackupError('conflict');
    byId.set(id, previous ?? record);
  }
  return [...byId.values()];
}
const attemptKey = (a: Attempt) => JSON.stringify([a.sessionId, a.index]);
function checkConsistency(p: Progress) {
  const attempts = new Map(p.attempts.map(a => [attemptKey(a), a]));
  const bySession = new Map<string, Attempt[]>();
  for (const a of p.attempts) {
    const group = bySession.get(a.sessionId) ?? [];
    group.push(a);
    bySession.set(a.sessionId, group);
  }
  const originals = new Map(
    p.attempts.filter(a => a.response).map(a => [`manual:${a.sessionId}:${a.index}`, a]),
  );
  for (const s of [
    ...(p.personal?.results ?? []),
    ...(p.personal?.active ? [p.personal.active] : []),
  ])
    for (const ref of s.items)
      if (ref.review) {
        const a = originals.get(ref.review.id);
        if (
          a &&
          (a.correct ||
            Date.parse(a.at) !== ref.review.createdAt ||
            refIdentity(ref) !==
              refIdentity({
                lessonId: a.lessonId,
                seed: a.response!.seed,
                index: a.index,
                source: a.source,
              }))
        )
          throw new BackupError('conflict');
      }
  if (p.session) {
    const s = p.session;
    if (p.attempts.some(a => a.sessionId === s.id && a.index >= s.answers.length))
      throw new BackupError('conflict');
    s.answers.forEach((answer, index) => {
      const a = attempts.get(JSON.stringify([s.id, index]));
      if (
        !a ||
        a.lessonId !== s.lessonId ||
        a.correct !== answer.correct ||
        a.at !== answer.at ||
        (a.response && (a.response.seed !== s.seed || a.response.choice !== answer.choice)) ||
        (usesLoop(getLesson(s.lessonId).skill) && sourceOf(a) !== (s.source ?? 'studio'))
      )
        throw new BackupError('conflict');
    });
  }
  for (const r of p.results) {
    const recorded = bySession.get(r.id) ?? [];
    if (
      recorded.some(a => a.lessonId !== r.lessonId || sourceOf(a) !== sourceOf(r)) ||
      (recorded.length === r.total && recorded.filter(a => a.correct).length !== r.correct)
    )
      throw new BackupError('conflict');
  }
}

export type BackupRead = {
  progress: Progress;
  /** Answers to lessons rebuilt since the record was written; they are not carried over. */
  retired: number;
};
/**
 * Strict: a malformed file never silently becomes empty progress. Answers to rebuilt lessons
 * are set aside before validation, because an old answer can validate against a new sound.
 * `written` overrides what a record without a content map is assumed to answer; storage
 * passes the content of the key it read, an imported bare file is assumed to be the oldest.
 */
export function readBackupDetailed(raw: string, written?: ContentMap): BackupRead {
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) throw new BackupError('large');
  let root: unknown;
  try {
    root = JSON.parse(raw);
  } catch {
    throw new BackupError('invalid');
  }
  if (!object(root)) throw new BackupError('invalid');
  let stored: unknown = root,
    assumed = written ?? LEGACY_CONTENT['0.9'];
  if (root.format === 'freq-backup') {
    if (typeof root.schemaVersion === 'number' && root.schemaVersion > BACKUP_SCHEMA)
      throw new BackupError('future');
    if (
      ![1, 2, 3, 4, 5].includes(root.schemaVersion as number) ||
      typeof root.exportedAt !== 'string' ||
      !Number.isFinite(Date.parse(root.exportedAt))
    )
      throw new BackupError('invalid');
    stored = root.progress;
    assumed = written ?? writtenBy(root.schemaVersion);
  } else if ('format' in root) throw new BackupError('invalid');
  if (!object(stored)) throw new BackupError('invalid');
  if (typeof stored.version === 'number' && stored.version > 1) throw new BackupError('future');
  const { value, retired } = retireStale(stored, assumed);
  if (
    value.version !== 1 ||
    !['tr', 'en'].includes(value.locale as string) ||
    !['mix', 'music', 'exam'].includes(value.path as string) ||
    typeof value.volume !== 'number' ||
    !Number.isFinite(value.volume) ||
    value.volume < 0.05 ||
    value.volume > 0.8 ||
    (value.eqSource !== undefined && !isEqSource(value.eqSource)) ||
    !Array.isArray(value.attempts) ||
    !value.attempts.every(validAttempt) ||
    !Array.isArray(value.results) ||
    !value.results.every(validResult) ||
    value.session === undefined
  )
    throw new BackupError('invalid');
  const p = parseProgress(JSON.stringify(value));
  if (value.exam !== undefined && !readExamProgress(value.exam)) throw new BackupError('invalid');
  if (value.personal !== undefined && !readPersonalProgress(value.personal))
    throw new BackupError('invalid');
  if (value.session !== null && !p.session) throw new BackupError('invalid');
  p.attempts = unique(p.attempts, attemptKey, sameAttempt);
  p.results = unique(p.results, r => r.id, sameResult);
  checkConsistency(p);
  return { progress: p, retired };
}
export const readBackup = (raw: string, written?: ContentMap): Progress =>
  readBackupDetailed(raw, written).progress;

/** Recover only internally consistent records; the original stays untouched until review. */
export function recoverProgress(raw: string, written?: ContentMap): Progress {
  const p = parseProgress(raw, written);
  const nonconflicting = <T>(
    records: T[],
    key: (r: T) => string,
    same: (a: T, b: T) => boolean,
  ) => {
    const byId = new Map<string, T>(),
      conflicts = new Set<string>();
    for (const r of records) {
      const id = key(r),
        previous = byId.get(id);
      if (previous && !same(previous, r)) conflicts.add(id);
      if (!previous) byId.set(id, r);
    }
    return [...byId].filter(([id]) => !conflicts.has(id)).map(([, r]) => r);
  };
  p.attempts = nonconflicting(p.attempts, attemptKey, sameAttempt);
  p.results = nonconflicting(p.results, r => r.id, sameResult).filter(result => {
    try {
      checkConsistency({ ...p, session: null, results: [result], personal: undefined });
      return true;
    } catch {
      return false;
    }
  });
  try {
    checkConsistency({ ...p, personal: undefined });
  } catch {
    p.session = null;
  }
  try {
    checkConsistency(p);
  } catch {
    delete p.personal;
  }
  // Recovery cannot persist a record that will become corrupt again on reload.
  return readBackup(JSON.stringify(p));
}

/**
 * Merge without replacing current preferences or an unfinished local session.
 *
 * Two different unfinished sessions cannot both be resumed. Between two tabs that is a
 * conflict to resolve by hand. A restore passes `keepCurrentSessions`: the session on this
 * device stays, and the backup's unfinished one is closed with its answers kept in history,
 * so the rest of the backup is not held hostage by it.
 */
export function mergeProgress(
  current: Progress,
  incoming: Progress,
  { keepCurrentSessions = false } = {},
): Progress {
  const attempts = unique(
    [...current.attempts, ...incoming.attempts],
    attemptKey,
    sameAttempt,
  ).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const results = unique([...current.results, ...incoming.results], r => r.id, sameResult).sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  );
  const completed = new Set(results.map(r => r.id));
  let session = [current.session, incoming.session].find(s => s && !completed.has(s.id)) ?? null;
  const a = current.session,
    b = incoming.session;
  if (a && b && a.id !== b.id && !completed.has(a.id) && !completed.has(b.id)) {
    if (!keepCurrentSessions) throw new BackupError('conflict');
    session = a;
  }
  if (session && a && b && a.id === b.id) {
    if (
      a.lessonId !== b.lessonId ||
      a.seed !== b.seed ||
      (a.source ?? 'studio') !== (b.source ?? 'studio') ||
      a.answers.some(
        (answer, i) => b.answers[i] && JSON.stringify(answer) !== JSON.stringify(b.answers[i]),
      )
    )
      throw new BackupError('conflict');
    if (
      b.answers.length > a.answers.length ||
      (b.answers.length === a.answers.length &&
        (b.index > a.index || (b.index === a.index && b.started)))
    )
      session = b;
  }
  const merged = {
    ...current,
    attempts,
    results,
    session,
    ...(current.exam || incoming.exam
      ? {
          exam: mergeExamProgress(
            current.exam ?? initialExamProgress(),
            incoming.exam ?? initialExamProgress(),
            keepCurrentSessions,
          ),
        }
      : {}),
    ...(current.personal || incoming.personal
      ? {
          personal: mergePersonalProgress(
            current.personal ?? initialPersonalProgress(),
            incoming.personal ?? initialPersonalProgress(),
            keepCurrentSessions,
          ),
        }
      : {}),
  };
  checkConsistency(merged);
  // Learning evidence is durable. Limit visible history, never the source records.
  return merged;
}

function compatiblePersonal(a: PersonalSession, b: PersonalSession) {
  if (
    a.mode !== b.mode ||
    a.path !== b.path ||
    a.seed !== b.seed ||
    a.startedAt !== b.startedAt ||
    a.items.length !== b.items.length
  )
    throw new BackupError('conflict');
  const shared = Math.min(a.answers.length, b.answers.length);
  for (let i = 0; i < a.items.length; i++) {
    if (
      (a.mode !== 'placement' || i < shared) &&
      JSON.stringify(a.items[i]) !== JSON.stringify(b.items[i])
    )
      throw new BackupError('conflict');
    if (i < shared && JSON.stringify(a.answers[i]) !== JSON.stringify(b.answers[i]))
      throw new BackupError('conflict');
  }
}
function mergePersonalProgress(
  a: PersonalProgress,
  b: PersonalProgress,
  keepCurrent: boolean,
): PersonalProgress {
  let results = unique(
    [...a.results, ...b.results],
    r => r.id,
    (x, y) => JSON.stringify(x) === JSON.stringify(y),
  );
  const finished = new Set(results.map(r => r.id));
  for (const s of [a.active, b.active])
    if (s && finished.has(s.id))
      compatiblePersonal(
        s,
        results.find(r => r.id === s.id)!,
      );
  const x = a.active && !finished.has(a.active.id) ? a.active : null,
    y = b.active && !finished.has(b.active.id) ? b.active : null;
  let active = x ?? y;
  if (x && y && x.id !== y.id) {
    if (!keepCurrent) throw new BackupError('conflict');
    // The incoming session ends where it stopped; its answers stay in the history.
    results = [
      ...results,
      { ...y, finishedAt: y.answers.at(-1)?.at ?? y.startedAt, status: 'ended' as const },
    ];
  } else if (x && y) {
    compatiblePersonal(x, y);
    active =
      y.answers.length > x.answers.length ||
      (y.answers.length === x.answers.length && y.index > x.index)
        ? y
        : x;
  }
  const merged: PersonalProgress = {
    version: 1,
    active,
    results: results.sort((x, y) => x.finishedAt - y.finishedAt || x.id.localeCompare(y.id)),
  };
  if (!readPersonalProgress(merged)) throw new BackupError('conflict');
  return merged;
}

function mergeExamProgress(a: ExamProgress, b: ExamProgress, keepCurrent: boolean): ExamProgress {
  let results = unique(
    [...a.results, ...b.results],
    r => r.id,
    (x, y) => JSON.stringify(x) === JSON.stringify(y),
  );
  const rehearsals = unique(
    [...a.rehearsals, ...b.rehearsals],
    r => r.id,
    (x, y) => JSON.stringify(x) === JSON.stringify(y),
  );
  let completed = new Set(results.map(r => r.id));
  if (
    a.active &&
    b.active &&
    a.active.id !== b.active.id &&
    !completed.has(a.active.id) &&
    !completed.has(b.active.id)
  ) {
    if (!keepCurrent) throw new BackupError('conflict');
    // The incoming mock is closed as it stands (or as expired, if its deadline has passed).
    const closed = finishMock({ ...initialExamProgress(), active: b.active }, 'ended');
    results = [...results, ...closed.results];
    completed = new Set(results.map(r => r.id));
    b = { ...b, active: null };
  }
  let active = [a.active, b.active].find(s => s && !completed.has(s.id)) ?? null;
  if (a.active && b.active && a.active.id === b.active.id && !completed.has(a.active.id)) {
    const x = a.active,
      y = b.active;
    if (
      x.profileId !== y.profileId ||
      x.level !== y.level ||
      x.seed !== y.seed ||
      x.startedAt !== y.startedAt ||
      x.deadline !== y.deadline ||
      x.answers.some((v, i) => y.answers[i] && JSON.stringify(v) !== JSON.stringify(y.answers[i]))
    )
      throw new BackupError('conflict');
    const ahead = y.answers.length > x.answers.length ? y : x;
    active = {
      ...ahead,
      plays: x.plays.map((n, i) => Math.max(n, y.plays[i])),
      heard: x.heard.map((h, i) => h || y.heard[i]),
    };
  }
  for (const state of [a.active, b.active]) {
    const r = state && results.find(v => v.id === state.id);
    if (
      r &&
      state &&
      (r.seed !== state.seed ||
        r.profileId !== state.profileId ||
        r.level !== state.level ||
        r.startedAt !== state.startedAt ||
        state.answers.some((v, i) => JSON.stringify(v) !== JSON.stringify(r.answers[i])))
    )
      throw new BackupError('conflict');
  }
  const merged = {
    ...a,
    active,
    results: results.sort((x, y) => x.finishedAt - y.finishedAt),
    rehearsals: rehearsals.sort((x, y) => x.at - y.at),
  };
  if (!readExamProgress(merged)) throw new BackupError('conflict');
  return merged;
}
