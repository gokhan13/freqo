import {
  getLesson,
  lessons,
  text,
  usesLoop,
  type PathId,
  type SkillId,
  type Text,
  isFixedSource,
  sourceFor,
} from './content';
import { makeQuestion, random, type Progress, type Question } from './model';
import { evaluateAnswer } from './music-model';
import { musicTimeline } from './music-dsp';
import type {
  PersonalAnswer,
  PersonalMode,
  PersonalProgress,
  PersonalResult,
  PersonalSession,
  QuestionRef,
} from './personal-types';

const DAY = 86_400_000;
const RETRY = 10 * 60_000;
export const personalSkills: Record<PathId, SkillId[]> = {
  mix: [
    'eq',
    'loudness',
    'compression',
    'attack',
    'release',
    'masking',
    'stereo',
    'reverb',
    'delay',
  ],
  music: [
    'direction',
    'interval',
    'chord',
    'rhythm',
    'tonic',
    'degree',
    'function',
    'melodic-dictation',
    'rhythmic-dictation',
    'rhythm-repeat',
  ],
  exam: ['memory', 'interval', 'chord', 'degree', 'melodic-dictation', 'rhythmic-dictation'],
};
export const initialPersonalProgress = (): PersonalProgress => ({
  version: 1,
  active: null,
  results: [],
});
export const skillLessons = (skill: SkillId) =>
  lessons.filter(l => l.skill === skill).sort((a, b) => a.level - b.level);
export const refQuestion = (ref: QuestionRef) =>
  makeQuestion(ref.lessonId, ref.seed, ref.index, ref.source);
export const refIdentity = (ref: QuestionRef) =>
  JSON.stringify([
    ref.lessonId,
    ref.seed,
    ref.index,
    usesLoop(getLesson(ref.lessonId).skill) ? (ref.source ?? 'studio') : null,
  ]);
const exampleIdentity = (ref: QuestionRef) =>
  JSON.stringify([
    ref.lessonId,
    (ref.seed + ref.index * 2654435761) >>> 0,
    usesLoop(getLesson(ref.lessonId).skill) ? (ref.source ?? 'studio') : null,
  ]);
/**
 * What the history needs to know about a question, kept after the first look. Plans and
 * reports ask the same thing about every stored answer on every change; rebuilding each
 * question each time made a long history slow.
 */
type RefFacts = { sound: string; correct: string; options: number };
const facts = new Map<string, RefFacts>();
export function refFacts(ref: QuestionRef): RefFacts {
  const key = refIdentity(ref);
  let known = facts.get(key);
  if (!known) {
    const q = refQuestion(ref);
    known = { sound: soundOf(q), correct: q.correct, options: q.options.length };
    // A history never comes near this; the bound only keeps a stray loop from growing it.
    if (facts.size >= 100_000) facts.clear();
    facts.set(key, known);
  }
  return known;
}
function soundOf(q: Question): string {
  if (q.music) return JSON.stringify([q.kind, musicTimeline(q.music)]);
  if (usesLoop(q.kind))
    return JSON.stringify([
      q.kind,
      q.source,
      isFixedSource(q.source ?? 'studio') ? null : q.seed,
      q.shape,
      q.frequency,
      q.gain,
      q.q,
      q.levelDb,
      q.mix?.effect,
      q.mix?.reference,
      q.mix?.target,
    ]);
  return JSON.stringify([q.kind, q.notesA, q.notesB, q.rhythmA, q.rhythmB, q.tempo, q.subdivision]);
}
/** Compare the sound, not the random identifier. Rhythm playback ignores key and seed. */
export const soundIdentity = (ref: QuestionRef): string => refFacts(ref).sound;
const freshRef = (
  lessonId: string,
  seed: number,
  index: number,
  source?: QuestionRef['source'],
): QuestionRef => ({
  lessonId,
  seed: (seed + index * 2654435761) >>> 0,
  index: 0,
  ...(usesLoop(getLesson(lessonId).skill)
    ? { source: sourceFor(getLesson(lessonId).skill, source) }
    : {}),
});

export type AnswerStat = {
  /** Plain counts of fresh questions whose correct answer this was. */
  answered: number;
  wrong: number;
  /** The same, with each answer weighted by how recent it is. */
  recentAnswered: number;
  recentWrong: number;
  /** Recency-weighted times this answer was given when another was correct. */
  recentConfused: number;
};
// Each newer answer to a lesson shrinks the weight of the older ones by this factor, so a
// band that was hard twenty questions ago and is fine now stops being chased.
const RECENCY = 0.93;
/**
 * How the learner has done on each possible answer of a lesson, fresh questions only. An
 * error says two things: the correct answer was missed, and the chosen one was mistaken
 * for it. Both are counted, so the pair that gets confused is the pair that gets practised.
 */
export function answerStats(lessonId: string, evidence: Evidence[]) {
  const own = evidence.filter(e => e.lessonId === lessonId && !e.review && e.ref);
  const stats = new Map<string, AnswerStat>();
  const entry = (id: string) => {
    let stat = stats.get(id);
    if (!stat) {
      stat = { answered: 0, wrong: 0, recentAnswered: 0, recentWrong: 0, recentConfused: 0 };
      stats.set(id, stat);
    }
    return stat;
  };
  own.forEach((e, i) => {
    const { correct, options } = refFacts(e.ref!),
      weight = RECENCY ** (own.length - 1 - i),
      target = entry(correct);
    target.answered++;
    target.recentAnswered += weight;
    if (e.correct) return;
    target.wrong++;
    target.recentWrong += weight;
    // Free entries (dictation, tapping) are not one of a fixed set of answers to confuse.
    if (options > 0 && e.choice && e.choice !== correct) entry(e.choice).recentConfused += weight;
  });
  return stats;
}
/**
 * How many of the last ten fresh answers must be right before a harder stage is suggested.
 * The bar follows how easily the task is guessed: nine for a two-way choice, eight for three
 * or four options and for written or tapped answers, seven where five or more options make
 * a lucky run of that length about as unlikely as the others.
 */
export function requiredCorrect(refs: QuestionRef[]): number {
  const options = refs.map(ref => refFacts(ref).options);
  if (options.some(count => count === 2)) return 9;
  return options.every(count => count >= 5) ? 7 : 8;
}
const CANDIDATES = 4;
/**
 * Fresh questions that lean towards the answers this learner misses or has not met yet.
 * Training aimed at a trainee's own weak spots improves more than a fixed routine (Kim et al.
 * 2013). Each slot draws a few candidates and keeps one, weighted by need: nothing is ever
 * excluded, and a session avoids repeating the same sound.
 */
export function targetedRefs(
  lessonId: string,
  seed: number,
  count: number,
  source: QuestionRef['source'],
  evidence: Evidence[],
): QuestionRef[] {
  const stats = answerStats(lessonId, evidence);
  // An unmet answer weighs 3.5, a reliably known one close to 1, one that is missed or
  // wrongly chosen again and again up to 6. Being mistaken for another answer counts half.
  const need = (answer: string) => {
    const stat = stats.get(answer),
      confused = (stat?.recentConfused ?? 0) / 2;
    return (
      1 +
      (5 * ((stat?.recentWrong ?? 0) + confused + 0.5)) /
        ((stat?.recentAnswered ?? 0) + confused + 1)
    );
  };
  const rng = random((seed ^ 0x9e3779b9) >>> 0);
  const chosen: QuestionRef[] = [],
    sounds = new Set<string>();
  for (let i = 0; i < count; i++) {
    // Keep drawing until there are candidates this session has not played yet; a lesson with
    // fewer sounds than questions runs out, and then a repeat is allowed.
    const candidates: QuestionRef[] = [];
    let unheard: QuestionRef[] = [];
    for (let k = 0; k < CANDIDATES * 6 && unheard.length < CANDIDATES; k++) {
      const ref = freshRef(lessonId, seed, i + k * count, source);
      candidates.push(ref);
      if (!sounds.has(soundIdentity(ref))) unheard.push(ref);
    }
    unheard = unheard.filter(
      (ref, at) => unheard.findIndex(r => soundIdentity(r) === soundIdentity(ref)) === at,
    );
    const pool = unheard.length ? unheard : candidates.slice(0, CANDIDATES);
    const weights = pool.map(ref => need(refFacts(ref).correct));
    let remaining = rng() * weights.reduce((sum, weight) => sum + weight, 0),
      at = 0;
    while (at < pool.length - 1 && (remaining -= weights[at]) > 0) at++;
    chosen.push(pool[at]);
    sounds.add(soundIdentity(pool[at]));
  }
  return chosen;
}

/** The second probe steps up only after a correct first probe. Two answers are a starting suggestion. */
export function placementItems(
  path: PathId,
  seed: number,
  answers: PersonalAnswer[] = [],
  source: QuestionRef['source'] = 'studio',
): QuestionRef[] {
  return personalSkills[path].flatMap((skill, i) => {
    const [first, next] = placementProbes(skill, answers[i * 2]?.correct);
    return [freshRef(first.id, seed, i * 2, source), freshRef(next.id, seed, i * 2 + 1, source)];
  });
}
/**
 * Where a skill's two probes sit on its ladder. A three-stage skill is probed from the foot,
 * as before. A long ladder is probed a third of the way up, and after a correct answer
 * another third higher, so an experienced learner is not started at stage one or two. After
 * a wrong first answer the second probe is the first stage.
 */
export function placementProbes(skill: SkillId, firstCorrect?: boolean) {
  const available = skillLessons(skill),
    top = available.length - 1,
    first = Math.floor(top / 3),
    second = firstCorrect ? Math.min(top, first + Math.max(1, Math.floor(top / 3))) : 0;
  return [available[first], available[second]] as const;
}
export type Evidence = {
  id: string;
  sessionId: string;
  lessonId: string;
  correct: boolean;
  at: number;
  ref?: QuestionRef;
  review?: QuestionRef['review'];
  choice?: string;
};
export function studyEvidence(progress: Progress): Evidence[] {
  const manual: Evidence[] = progress.attempts.map(a => ({
    id: `manual:${a.sessionId}:${a.index}`,
    sessionId: a.sessionId,
    lessonId: a.lessonId,
    correct: a.correct,
    at: Date.parse(a.at),
    ...(a.response
      ? {
          ref: { lessonId: a.lessonId, seed: a.response.seed, index: a.index, source: a.source },
          choice: a.response.choice,
        }
      : {}),
  }));
  const p = progress.personal;
  const sessions: PersonalSession[] = [...(p?.results ?? []), ...(p?.active ? [p.active] : [])];
  const personal: Evidence[] = sessions
    .filter(s => s.mode !== 'placement')
    .flatMap(s =>
      s.answers.flatMap((a, i) =>
        a.choice === null
          ? []
          : [
              {
                id: `personal:${s.id}:${i}`,
                sessionId: s.id,
                lessonId: s.items[i].lessonId,
                correct: a.correct,
                at: a.at,
                ref: s.items[i],
                review: s.items[i].review,
                choice: a.choice,
              },
            ],
      ),
    );
  const unique = new Map<string, Evidence>();
  for (const e of [...manual, ...personal]) if (!unique.has(e.id)) unique.set(e.id, e);
  return [...unique.values()].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}
export type SkillEstimate = {
  skill: SkillId;
  level: number;
  samples: number;
  distinctExamples: number;
  accuracy: number | null;
  reason: 'new' | 'placement' | 'up' | 'down' | 'support' | 'steady';
  placementAt: number | null;
  placementAnswered: number;
  placementCorrect: number;
  lastAt: number | null;
  explanation: Text;
};
export function skillEstimate(
  progress: Progress,
  skill: SkillId,
  evidence = studyEvidence(progress),
): SkillEstimate {
  const available = skillLessons(skill);
  const placement = progress.personal?.results
    .filter(
      s =>
        s.mode === 'placement' &&
        s.status === 'completed' &&
        s.answers.some(
          (a, i) => a.choice !== null && getLesson(s.items[i].lessonId).skill === skill,
        ),
    )
    .sort((a, b) => b.finishedAt - a.finishedAt)[0];
  const probes =
    placement?.answers.filter((_, i) => getLesson(placement.items[i].lessonId).skill === skill) ??
    [];
  let pos = 0,
    // Assigned inside a closure too, so the type is stated rather than narrowed.
    reason = 'new' as SkillEstimate['reason'];
  // The stage the two probes point to: the highest one answered correctly.
  const placed = placement
    ? Math.max(
        0,
        ...placement.items.flatMap((item, i) =>
          getLesson(item.lessonId).skill === skill && placement.answers[i]?.correct
            ? [available.findIndex(l => l.id === item.lessonId)]
            : [],
        ),
      )
    : 0;
  const seen = new Set<string>();
  const higher = new Map<number, Evidence[]>();
  const strong = (data: Evidence[]) => {
    // Old scores remain visible, but their missing seeds cannot prove fresh sounds.
    if (
      data.length !== 10 ||
      data.some(e => !e.ref) ||
      new Set(data.map(e => e.sessionId)).size < 2
    )
      return false;
    const binary = data.some(e => refFacts(e.ref!).options === 2);
    return (
      data.filter(e => e.correct).length >= requiredCorrect(data.map(e => e.ref!)) &&
      new Set(data.map(e => soundIdentity(e.ref!))).size >= (binary ? 2 : 3)
    );
  };
  let window: Evidence[] = [],
    lastAt: number | null = null,
    assessed = !placement;
  // An assessment is one event in the history. It can lift the suggestion; it never lowers
  // what practice has already shown, and earlier practice is not forgotten because of it.
  const assess = () => {
    assessed = true;
    for (const item of placement!.items) seen.add(exampleIdentity(item));
    if (placed > pos || reason === 'new') {
      if (placed > pos) {
        pos = placed;
        window = [];
        higher.clear();
      }
      reason = 'placement';
    }
  };
  for (const e of evidence) {
    if (getLesson(e.lessonId).skill !== skill || e.review) continue;
    if (!assessed && e.at > placement!.finishedAt) assess();
    // Exact repeats may improve recall, but cannot independently raise difficulty.
    const identity = e.ref ? exampleIdentity(e.ref) : e.id;
    if (seen.has(identity)) continue;
    seen.add(identity);
    lastAt = e.at;
    const observed = available.findIndex(l => l.level === getLesson(e.lessonId).level);
    if (observed > pos) {
      const data = [...(higher.get(observed) ?? []), e].slice(-10);
      higher.set(observed, data);
      // Deliberate advanced practice can establish that stage, with the same safeguards.
      if (strong(data)) {
        pos = observed;
        window = [];
        higher.clear();
        reason = 'up';
      }
      continue;
    }
    if (observed !== pos) continue;
    if (reason === 'up' || reason === 'down') reason = 'steady';
    window = [...window, e].slice(-10);
    const distinct = new Set(window.map(v => v.sessionId)).size;
    if (strong(window) && pos < available.length - 1) {
      pos++;
      window = [];
      higher.clear();
      reason = 'up';
    } else if (
      window.length >= 6 &&
      distinct >= 2 &&
      window.slice(-6).filter(v => v.correct).length <= 2 &&
      pos > 0
    ) {
      pos--;
      window = [];
      reason = 'down';
    } else if (
      window.length >= 6 &&
      distinct >= 2 &&
      window.slice(-6).filter(v => v.correct).length <= 2 &&
      pos === 0
    )
      reason = 'support';
    else if (reason === 'new' || reason === 'support') reason = 'steady';
  }
  if (!assessed) assess();
  const explanation =
    reason === 'support'
      ? text(
          'İlk aşamada zorlanıyorsun. Önce dersin açıklamalı örneklerini yeniden dinle, ardından kısa tekrarlarla pekiştir.',
          'The first stage is proving difficult. Revisit the guided lesson examples, then reinforce them with short reviews.',
        )
      : available.length === 1
        ? text(
            'Bu beceride tek pratik aşaması var; yeni örneklerle pekiştir.',
            'This skill has one practice stage; reinforce it with fresh examples.',
          )
        : reason === 'up'
          ? text(
              'En az iki oturumda güçlü başarı ve farklı ses örnekleri, daha ileri bir çalışma aşamasını destekliyor.',
              'Strong accuracy across two or more sessions and varied audible examples support a more advanced practice stage.',
            )
          : reason === 'down'
            ? text(
                'En az iki oturumda son 6 yeni sorunun en fazla 2’si doğru: daha rahat bir seviye önerildi.',
                'At most 2 of the last 6 fresh questions were correct across two or more sessions: an easier level is suggested.',
              )
            : reason === 'placement'
              ? text(
                  'İki başlangıç sorusuna dayalı geçici öneri. Yeni pratiklerle netleşecek.',
                  'A tentative suggestion based on two placement probes. Fresh practice will refine it.',
                )
              : reason === 'new'
                ? text(
                    'Henüz yeterli veri yok; ilk aşamadan güvenli bir başlangıç.',
                    'There is not enough evidence yet; start with the first stage.',
                  )
                : pos === available.length - 1
                  ? text(
                      'Mevcut içeriğin son aşamasındasın. Farklı kaynaklarla pekiştir; bu sonuç genel müzikal ustalık ölçümü değildir.',
                      'You are at the final stage of the current content. Reinforce it with varied sources; this is not a measure of overall musical mastery.',
                    )
                  : text(
                      'Seviye değişikliği için farklı oturumlardan yeterli başarı ve farklı duyulan örnekler gerekiyor.',
                      'Changing level requires strong accuracy across separate sessions and varied audible examples.',
                    );
  return {
    skill,
    level: available[pos].level,
    samples: window.length,
    distinctExamples: new Set(window.flatMap(e => (e.ref ? [soundIdentity(e.ref)] : []))).size,
    accuracy: window.length
      ? Math.round((window.filter(e => e.correct).length / window.length) * 100)
      : null,
    reason,
    placementAt: placement?.finishedAt ?? null,
    placementAnswered: probes.filter(a => a.choice !== null).length,
    placementCorrect: probes.filter(a => a.correct).length,
    lastAt,
    explanation,
  };
}
export type ReviewCard = {
  id: string;
  ref: QuestionRef;
  createdAt: number;
  dueAt: number;
  successes: number;
  resolved: boolean;
};
export function reviewCards(progress: Progress, evidence = studyEvidence(progress)): ReviewCard[] {
  const byId = new Map<string, ReviewCard>();
  const bySound = new Map<string, ReviewCard>();
  const retryAt = (at: number) => Math.min(8.64e15, at + RETRY);
  for (const e of evidence) {
    if (!e.ref) continue;
    const sound = soundIdentity(e.ref);
    if (!e.review) {
      if (e.correct) continue;
      const existing = bySound.get(JSON.stringify([e.lessonId, sound]));
      const card =
        existing && !existing.resolved
          ? existing
          : {
              id: e.id,
              ref: e.ref,
              createdAt: e.at,
              dueAt: retryAt(e.at),
              successes: 0,
              resolved: false,
            };
      // A fresh mistake on an equivalent sound resets the shared schedule.
      card.successes = 0;
      card.resolved = false;
      card.dueAt = retryAt(e.at);
      byId.set(e.id, card);
      bySound.set(JSON.stringify([e.lessonId, sound]), card);
      continue;
    }
    let card = byId.get(e.review.id);
    const open = bySound.get(JSON.stringify([e.lessonId, sound]));
    if (!card || (card.resolved && open && !open.resolved)) {
      const { review: _review, ...original } = e.ref;
      card =
        open && !open.resolved
          ? open
          : {
              id: e.review.id,
              ref: original,
              createdAt: e.review.createdAt,
              dueAt: retryAt(e.review.createdAt),
              successes: 0,
              resolved: false,
            };
      byId.set(e.review.id, card);
      bySound.set(JSON.stringify([e.lessonId, sound]), card);
    }
    if (!e.correct) {
      card.successes = 0;
      card.resolved = false;
      card.dueAt = retryAt(e.at);
      bySound.set(JSON.stringify([e.lessonId, sound]), card);
    } else if (e.at >= card.dueAt && !card.resolved) {
      card.successes++;
      card.resolved = card.successes >= 4;
      card.dueAt = card.resolved
        ? e.at
        : Math.min(8.64e15, e.at + [1, 3, 7][card.successes - 1] * DAY);
    }
  }
  return [...new Set(byId.values())]
    .filter(c => !c.resolved)
    .sort((a, b) => a.dueAt - b.dueAt || a.id.localeCompare(b.id));
}
export function personalPlan(progress: Progress, path = progress.path, now = Date.now()) {
  const evidence = studyEvidence(progress);
  const estimates = personalSkills[path].map(s => skillEstimate(progress, s, evidence));
  const priority = (s: SkillEstimate) =>
    s.reason === 'down' || s.reason === 'support'
      ? 3
      : s.samples > 0 && s.accuracy !== null && s.accuracy < 60
        ? 2
        : s.lastAt === null
          ? 1
          : 0;
  const recent = evidence
    .filter(e => !e.review && personalSkills[path].includes(getLesson(e.lessonId).skill))
    .at(-1);
  const recentSkill = recent ? getLesson(recent.lessonId).skill : null;
  // A weak topic stays in the plan without monopolising consecutive sessions.
  const alternatives = estimates.filter(e => e.skill !== recentSkill && priority(e) > 0);
  const candidates = alternatives.length
    ? estimates.filter(e => e.skill !== recentSkill)
    : estimates;
  const focus = [...candidates].sort(
    (a, b) =>
      priority(b) - priority(a) ||
      (a.lastAt ?? 0) - (b.lastAt ?? 0) ||
      personalSkills[path].indexOf(a.skill) - personalSkills[path].indexOf(b.skill),
  )[0];
  const cards = reviewCards(progress, evidence).filter(c =>
    personalSkills[path].includes(getLesson(c.ref.lessonId).skill),
  );
  const due = cards.filter(c => c.dueAt <= now);
  return {
    focus,
    estimates,
    cards,
    due,
    lesson: skillLessons(focus.skill).find(l => l.level === focus.level)!,
  };
}

export function startPersonal(
  progress: Progress,
  mode: PersonalMode,
  path = progress.path,
  now = Date.now(),
  seed = crypto.getRandomValues(new Uint32Array(1))[0],
  id: string = crypto.randomUUID(),
): Progress {
  const p = progress.personal ?? initialPersonalProgress();
  if (p.active) return progress;
  const plan = personalPlan(progress, path, now),
    source = progress.eqSource ?? 'studio';
  let items: QuestionRef[];
  if (mode === 'placement') items = placementItems(path, seed, [], source);
  else {
    const reviews = (mode === 'review' ? plan.cards : plan.due)
      .slice(0, mode === 'review' ? 5 : 2)
      .map(c => ({ ...c.ref, review: { id: c.id, createdAt: c.createdAt } }));
    if (mode === 'review' && !reviews.length) return progress;
    items =
      mode === 'review'
        ? reviews
        : [
            ...reviews,
            ...targetedRefs(
              plan.lesson.id,
              seed,
              5 - reviews.length,
              source,
              studyEvidence(progress),
            ),
          ];
  }
  return {
    ...progress,
    personal: {
      ...p,
      active: { id, mode, path, seed, startedAt: now, items, index: 0, answers: [] },
    },
  };
}
export function answerPersonal(
  progress: Progress,
  choice: string | null,
  now = Date.now(),
): Progress {
  const p = progress.personal,
    s = p?.active;
  if (!p || !s || s.answers[s.index] || now < s.startedAt || now < (s.answers.at(-1)?.at ?? 0))
    return progress;
  const correct = choice === null ? false : evaluateAnswer(refQuestion(s.items[s.index]), choice);
  if (correct === null) return progress;
  const answers = [...s.answers, { choice, correct, at: now }];
  const items =
    s.mode === 'placement' ? placementItems(s.path, s.seed, answers, s.items[0].source) : s.items;
  return { ...progress, personal: { ...p, active: { ...s, answers, items } } };
}
export function advancePersonal(progress: Progress, now = Date.now()): Progress {
  const p = progress.personal,
    s = p?.active;
  if (!p || !s || !s.answers[s.index] || now < (s.answers.at(-1)?.at ?? s.startedAt))
    return progress;
  if (s.index < s.items.length - 1)
    return { ...progress, personal: { ...p, active: { ...s, index: s.index + 1 } } };
  const result: PersonalResult = { ...s, finishedAt: now, status: 'completed' };
  return { ...progress, personal: { ...p, active: null, results: [...p.results, result] } };
}
export function endPersonal(progress: Progress, now = Date.now()): Progress {
  const p = progress.personal,
    s = p?.active;
  if (!p || !s || now < (s.answers.at(-1)?.at ?? s.startedAt)) return progress;
  return {
    ...progress,
    personal: {
      ...p,
      active: null,
      results: [...p.results, { ...s, finishedAt: now, status: 'ended' as const }],
    },
  };
}
