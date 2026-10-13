import {
  currentContent,
  isContentMap,
  isStale,
  PLACEMENT_KEY,
  PLACEMENT_REVISION,
  type ContentMap,
} from './content-revision';
import { getExamProfile } from './exam-content';

const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Sets aside every stored answer to a lesson that has been rebuilt since it was given.
 *
 * Checking that an old answer still "validates" is not enough: the same seed and the same
 * choice can pass against a different sound. So nothing is re-interpreted; whatever was
 * answered against an older revision leaves the active history, and the caller keeps the
 * original record as an archive. Works on untrusted, not yet validated data.
 */
export function retireStale(
  value: Record<string, unknown>,
  fallback: ContentMap,
): { value: Record<string, unknown>; retired: number } {
  const content = isContentMap(value.content) ? value.content : fallback;
  const stale = (id: unknown) => typeof id === 'string' && isStale(id, content);
  const answered = (session: unknown) =>
    object(session) && Array.isArray(session.answers)
      ? session.answers.filter(a => object(a) && a.choice !== null).length
      : 0;
  const next: Record<string, unknown> = { ...value, content: currentContent() };
  let retired = 0;
  if (Array.isArray(value.attempts))
    next.attempts = value.attempts.filter(a => {
      const drop = object(a) && stale(a.lessonId);
      if (drop) retired++;
      return !drop;
    });
  if (Array.isArray(value.results))
    next.results = value.results.filter(r => !(object(r) && stale(r.lessonId)));
  if (object(value.session) && stale(value.session.lessonId)) next.session = null;
  if (object(value.personal)) {
    // Answers line up with a session's items, so a session goes as a whole.
    // A mixing assessment drawn by an older rule cannot be checked against the current one.
    const oldAssessment = (content[PLACEMENT_KEY] ?? 0) !== PLACEMENT_REVISION;
    const touched = (session: unknown) =>
      object(session) &&
      Array.isArray(session.items) &&
      (session.items.some(item => object(item) && stale(item.lessonId)) ||
        (oldAssessment && session.mode === 'placement' && session.path === 'mix'));
    const personal = { ...value.personal };
    if (touched(personal.active)) {
      retired += answered(personal.active);
      personal.active = null;
    }
    if (Array.isArray(personal.results))
      personal.results = personal.results.filter(result => {
        if (!touched(result)) return true;
        retired += answered(result);
        return false;
      });
    next.personal = personal;
  }
  if (object(value.exam)) {
    const touched = (mock: unknown) =>
      object(mock) &&
      typeof mock.profileId === 'string' &&
      (getExamProfile(mock.profileId)?.lessons[(mock.level as number) - 1] ?? []).some(stale);
    const exam = { ...value.exam };
    if (touched(exam.active)) {
      retired += answered(exam.active);
      exam.active = null;
    }
    if (Array.isArray(exam.results))
      exam.results = exam.results.filter(result => {
        if (!touched(result)) return true;
        retired += answered(result);
        return false;
      });
    next.exam = exam;
  }
  return { value: next, retired };
}
