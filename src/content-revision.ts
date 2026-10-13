import { lessons } from './content';
import { isAdvanced } from './advanced-content';

/**
 * How often each lesson's questions or sounds have been rebuilt.
 *
 * A stored answer only says something about the revision it was given to: after a rebuild the
 * same seed is a different sound. Whenever a lesson's generator or audio changes, raise its
 * number here. Answers to an older revision are then set aside on the next load, instead of
 * being read as answers to the new sound.
 */
export function lessonRevision(id: string): number {
  const lesson = lessons.find(l => l.id === id);
  if (!lesson) return 0;
  // 0.10 rebuilt EQ; 0.11 added the audibility gate; 0.12 rebalanced the options of eq-8.
  if (lesson.skill === 'eq') return id === 'eq-8' ? 3 : 2;
  // 0.11 added side conditions; 0.12 stopped shaping the target melody by the answer.
  if (lesson.skill === 'masking') return 2;
  // 0.11 added side conditions to dynamics, stereo and space.
  if (isAdvanced(lesson.skill)) return 1;
  return 0;
}
/**
 * The starting assessment of the mixing path draws its questions by a rule; when the rule
 * changes, a stored assessment no longer matches it. 0.12 probes long ladders higher up.
 */
export const PLACEMENT_KEY = '@placement';
export const PLACEMENT_REVISION = 1;
/** Lesson id → revision; lessons that were never rebuilt are left out. */
export type ContentMap = Record<string, number>;
export const currentContent = (): ContentMap => ({
  ...Object.fromEntries(
    lessons.map(l => [l.id, lessonRevision(l.id)] as const).filter(([, revision]) => revision > 0),
  ),
  [PLACEMENT_KEY]: PLACEMENT_REVISION,
});
/** What records written before the content map existed were answered against. */
export const LEGACY_CONTENT: Record<'0.9' | '0.10' | '0.11', ContentMap> = {
  '0.9': {},
  '0.10': Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`eq-${i + 1}`, 1])),
  '0.11': Object.fromEntries(
    lessons
      .filter(l => l.skill === 'eq' || isAdvanced(l.skill))
      .map(l => [l.id, l.skill === 'eq' ? 2 : 1]),
  ),
};
export const isStale = (lessonId: string, content: ContentMap) =>
  (content[lessonId] ?? 0) !== lessonRevision(lessonId);
export const isContentMap = (v: unknown): v is ContentMap =>
  !!v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.values(v).every(n => Number.isInteger(n) && (n as number) >= 0);
