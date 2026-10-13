import {
  getLesson,
  text,
  usesLoop,
  type EqSource,
  type PathId,
  type SkillId,
  type Text,
} from './content';
import { mockLessonIds } from './exam-model';
import type { ExamLevel, MockResult } from './exam-types';
import type { Progress } from './model';
import {
  personalSkills,
  refQuestion,
  reviewCards,
  skillEstimate,
  skillLessons,
  soundIdentity,
  studyEvidence,
  type Evidence,
  type SkillEstimate,
  refFacts,
} from './personal-model';
import type { PersonalSession, QuestionRef } from './personal-types';

export type ReportPath = PathId | 'all';
export type ReportPeriod = 'all' | '30d' | '7d';
export type ReportOptions = {
  path?: ReportPath;
  period?: ReportPeriod;
  now?: number;
  timeZone?: string;
};
export type ReportTrend = {
  status: 'available' | 'insufficient';
  reason: Text;
  lessonId: string | null;
  source: EqSource | null;
  path: PathId | null;
  recentCount: number;
  previousCount: number;
  recentAccuracy: number | null;
  previousAccuracy: number | null;
  deltaPoints: number | null;
};
export type ReportSkill = {
  skill: SkillId;
  path: PathId;
  lessonId: string;
  level: number;
  maxLevel: number;
  practiceCount: number;
  correct: number;
  accuracy: number | null;
  distinctSounds: number;
  independentLogicalCount: number;
  legacyCount: number;
  sessionCount: number;
  reviewCount: number;
  reviewCorrect: number;
  reviewAccuracy: number | null;
  dueCount: number;
  openCount: number;
  estimateReason: SkillEstimate['reason'];
  estimateExplanation: Text;
  firstSuggestedLevel: number;
  currentSuggestedLevel: number;
  trend: ReportTrend;
};
export type ReportPriority = {
  skill: SkillId;
  lessonId: string;
  severity: 'focus' | 'consolidate' | 'explore';
  evidence: Text;
  nextGoal: Text;
  goal: { freshQuestions: number; sessions: number; dueReviews: number };
};
export type ReportDay = {
  date: string;
  practiceCount: number;
  correct: number;
  reviewCount: number;
  reviewCorrect: number;
  placementCount: number;
  skippedCount: number;
  completedSessions: number;
  partialSessions: number;
  mockCount: number;
  selfAssessmentCount: number;
};
export type ReportExam = {
  results: {
    id: string;
    profileId: string;
    level: ExamLevel;
    finishedAt: number;
    reason: MockResult['reason'];
    answered: number;
    skipped: number;
    correct: number;
    total: number;
    accuracy: number | null;
  }[];
  completedCount: number;
  endedCount: number;
  expiredCount: number;
  questionCount: number;
  correct: number;
  accuracy: number | null;
  selfAssessment: { count: number; checked: number; totalChecks: number };
  active: boolean;
};
export type ProgressReport = {
  version: 1;
  generatedAt: number;
  timeZone: string;
  path: ReportPath;
  period: ReportPeriod;
  range: { startAt: number | null; endAt: number };
  summary: {
    practiceCount: number;
    practiceCorrect: number;
    practiceAccuracy: number | null;
    completedSessions: number;
    partialSessions: number;
    assessedSkills: number;
    supportedSkills: number;
    independentLogicalCount: number;
    distinctSounds: number;
    legacyCount: number;
    activeDays: number;
    skippedPersonalResponses: number;
  };
  review: {
    count: number;
    correct: number;
    accuracy: number | null;
    dueCount: number;
    openCount: number;
  };
  placement: {
    count: number;
    correct: number;
    accuracy: number | null;
    completedSessions: number;
    partialSessions: number;
    skippedCount: number;
  };
  skills: ReportSkill[];
  priorities: ReportPriority[];
  daily: ReportDay[];
  exam: ReportExam;
};

type RoutedEvidence = Evidence & { path: PathId };
const DAY = 86_400_000;
/** Share of each trend window that must be answers asked in both windows. */
const TREND_OVERLAP = 0.6;
const percent = (correct: number, count: number) =>
  count ? Math.round((correct / count) * 100) : null;
const logicalIdentity = (ref: QuestionRef) =>
  JSON.stringify([
    ref.lessonId,
    (ref.seed + ref.index * 2654435761) >>> 0,
    usesLoop(getLesson(ref.lessonId).skill) ? (ref.source ?? 'studio') : null,
  ]);
const sourceOf = (ref: QuestionRef) =>
  usesLoop(getLesson(ref.lessonId).skill) ? (ref.source ?? 'studio') : null;

/** Suggestions and the shared review schedule use complete history through this instant, never future placements. */
function estimateSnapshot(progress: Progress, now: number): Progress {
  return {
    ...progress,
    attempts: progress.attempts.filter(a => Date.parse(a.at) <= now),
    results: progress.results.filter(r => Date.parse(r.at) <= now),
    ...(progress.personal
      ? {
          personal: {
            ...progress.personal,
            results: progress.personal.results.filter(s => s.finishedAt <= now),
            active:
              progress.personal.active && progress.personal.active.startedAt <= now
                ? {
                    ...progress.personal.active,
                    answers: progress.personal.active.answers.filter(a => a.at <= now),
                  }
                : null,
          },
        }
      : {}),
  };
}

function comparableTrend(
  practice: RoutedEvidence[],
  audible: (ref: QuestionRef) => string,
): ReportTrend {
  const latest = practice.filter(e => e.ref).at(-1);
  const base: ReportTrend = {
    status: 'insufficient',
    reason: text(
      'Karşılaştırılabilir kayıtlı soru verisi yok.',
      'No comparable saved question evidence yet.',
    ),
    lessonId: latest?.lessonId ?? null,
    source: latest?.ref ? sourceOf(latest.ref) : null,
    path: latest?.path ?? null,
    recentCount: 0,
    previousCount: 0,
    recentAccuracy: null,
    previousAccuracy: null,
    deltaPoints: null,
  };
  if (!latest?.ref) return base;
  const unique = new Map<string, RoutedEvidence>();
  for (const e of practice)
    if (
      e.ref &&
      e.lessonId === latest.lessonId &&
      e.path === latest.path &&
      sourceOf(e.ref) === base.source
    ) {
      const identity = logicalIdentity(e.ref);
      if (!unique.has(identity)) unique.set(identity, e);
    }
  const data = [...unique.values()],
    recent = data.slice(-10),
    previous = data.slice(-20, -10);
  base.recentCount = recent.length;
  base.previousCount = previous.length;
  if (recent.length < 5 || previous.length < 5)
    return {
      ...base,
      reason: text(
        'Aynı çalışma yolu, aşama ve kaynakta iki pencerede en az 5 farklı kayıtlı soru gerekir (her pencere en çok 10).',
        'Each window needs at least 5 distinct saved questions on the same study path, stage and source (up to 10 per window).',
      ),
    };
  if (
    new Set(recent.map(e => e.sessionId)).size < 2 ||
    new Set(previous.map(e => e.sessionId)).size < 2
  )
    return {
      ...base,
      reason: text(
        'Her karşılaştırma penceresinde en az iki ayrı oturum gerekir.',
        'Each comparison window needs at least two separate sessions.',
      ),
    };
  const recentAccuracy = percent(recent.filter(e => e.correct).length, recent.length)!,
    previousAccuracy = percent(previous.filter(e => e.correct).length, previous.length)!;
  const minimumSounds = [...recent, ...previous].some(e => refFacts(e.ref!).options === 2) ? 2 : 3;
  const recentSounds = new Set(recent.map(e => audible(e.ref!))).size,
    previousSounds = new Set(previous.map(e => audible(e.ref!))).size;
  if (recentSounds < minimumSounds || previousSounds < minimumSounds)
    return {
      ...base,
      recentAccuracy,
      previousAccuracy,
      reason: text(
        `Her pencerede en az ${minimumSounds} farklı duyulan örnek gerekir; önceki pencerede ${previousSounds}, son pencerede ${recentSounds} var. Yüzdeler yanıt sayımıdır; tekrarlanan sesler gelişim eğilimi göstermez.`,
        `Each window needs at least ${minimumSounds} audibly different examples; the previous window has ${previousSounds} and the recent window has ${recentSounds}. The percentages count answers; repeated sounds do not establish a progress trend.`,
      ),
    };
  // Personal practice asks more often for the answers a learner misses, so its windows hold a
  // harder mix than a plain round does. Then like is compared with like: each answer on its
  // own, weighted by how often both windows asked for it.
  if ([...recent, ...previous].some(e => e.id.startsWith('personal:'))) {
    const tally = (window: RoutedEvidence[]) => {
      const byAnswer = new Map<string, { asked: number; right: number }>();
      for (const e of window) {
        const answer = refFacts(e.ref!).correct,
          row = byAnswer.get(answer) ?? { asked: 0, right: 0 };
        row.asked++;
        if (e.correct) row.right++;
        byAnswer.set(answer, row);
      }
      return byAnswer;
    };
    const now = tally(recent),
      before = tally(previous),
      shared = [...now.keys()].filter(answer => before.has(answer)).sort();
    const covered = (window: Map<string, { asked: number }>, size: number) =>
      shared.reduce((sum, answer) => sum + window.get(answer)!.asked, 0) / size;
    if (
      shared.length < 2 ||
      covered(now, recent.length) < TREND_OVERLAP ||
      covered(before, previous.length) < TREND_OVERLAP
    )
      return {
        ...base,
        reason: text(
          'Kişisel pratik, kaçırdığın yanıtları daha sık sorar; bu yüzden iki pencerenin ham yüzdeleri karşılaştırılamaz. Adil karşılaştırma için iki pencerede de sorulmuş yanıtlar yeterince örtüşmüyor.',
          'Personal practice asks more often for the answers you miss, so the raw percentages of the two windows cannot be compared. The answers asked in both windows do not overlap enough for a fair comparison.',
        ),
      };
    const weight = (answer: string) => now.get(answer)!.asked + before.get(answer)!.asked,
      total = shared.reduce((sum, answer) => sum + weight(answer), 0),
      standardised = (window: Map<string, { asked: number; right: number }>) =>
        Math.round(
          (shared.reduce(
            (sum, answer) =>
              sum + (weight(answer) * window.get(answer)!.right) / window.get(answer)!.asked,
            0,
          ) /
            total) *
            100,
        );
    const recentLike = standardised(now),
      previousLike = standardised(before);
    return {
      ...base,
      status: 'available',
      recentAccuracy: recentLike,
      previousAccuracy: previousLike,
      deltaPoints: recentLike - previousLike,
      reason: text(
        'Aynı çalışma yolu, aşama ve kaynakta farklı kayıtlı sorular karşılaştırıldı. Kişisel pratik kaçırdığın yanıtları daha sık sorduğu için yüzdeler, iki pencerede de sorulan yanıtlar eşit ağırlıkla sayılarak hesaplandı. Bu küçük örneklem genel yetenek gelişimi ölçümü değildir.',
        'Distinct saved questions on the same study path, stage and source were compared. Because personal practice asks more often for the answers you miss, the percentages weight the answers asked in both windows equally. This small sample is not a measure of overall aptitude growth.',
      ),
    };
  }
  return {
    ...base,
    status: 'available',
    recentAccuracy,
    previousAccuracy,
    deltaPoints: recentAccuracy - previousAccuracy,
    reason: text(
      'Aynı çalışma yolu, aşama ve kaynakta farklı kayıtlı sorular karşılaştırıldı. Bu küçük örneklem genel yetenek gelişimi ölçümü değildir.',
      'Distinct saved questions on the same study path, stage and source were compared. This small sample is not a measure of overall aptitude growth.',
    ),
  };
}

function prioritiesFor(skills: ReportSkill[], evidence: RoutedEvidence[]): ReportPriority[] {
  const candidates = skills.map((row, order) => {
    const seen = new Set<string>();
    const stage = evidence
      .filter(e => !e.review && e.ref && e.lessonId === row.lessonId)
      .filter(e => {
        const id = logicalIdentity(e.ref!);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(-10);
    const sessions = new Set(stage.map(e => e.sessionId)).size;
    const supportedDifficulty =
      stage.length >= 6 && sessions >= 2 && stage.slice(-6).filter(e => e.correct).length <= 2;
    const estimatedSupport = row.estimateReason === 'down' || row.estimateReason === 'support';
    const sparse = row.independentLogicalCount < 6 || row.sessionCount < 2;
    const severity: ReportPriority['severity'] =
      estimatedSupport || supportedDifficulty
        ? 'focus'
        : row.dueCount
          ? 'consolidate'
          : sparse
            ? 'explore'
            : 'consolidate';
    const dueReviews = Math.min(3, row.dueCount),
      goal = { freshQuestions: 10, sessions: 2, dueReviews };
    const evidenceText = estimatedSupport
      ? row.estimateExplanation
      : severity === 'focus'
        ? text(
            `Önerilen aşamada en az iki oturumdaki son 6 farklı sorunun ${stage.slice(-6).filter(e => e.correct).length} tanesi doğru. Bu, bu alanda destekli çalışma önerir.`,
            `${stage.slice(-6).filter(e => e.correct).length} of the last 6 distinct questions at the suggested stage were correct across at least two sessions. Guided work is suggested for this topic.`,
          )
        : row.dueCount
          ? text(
              `${row.dueCount} hata tekrarının zamanı geldi. Tekrar yanıtları pratik yüzdesinden ayrı tutulur.`,
              `${row.dueCount} error reviews are due. Review answers are kept separate from practice accuracy.`,
            )
          : sparse
            ? text(
                `${row.practiceCount} pratik yanıtı, ${row.independentLogicalCount} yeniden kurulabilir farklı soru ve ${row.sessionCount} oturum var; güçlü bir değerlendirme için veri az.`,
                `There are ${row.practiceCount} practice answers, ${row.independentLogicalCount} reconstructable distinct questions and ${row.sessionCount} sessions; evidence is too sparse for a strong assessment.`,
              )
            : text(
                `${row.practiceCount} pratik yanıtı ve ${row.distinctSounds} farklı duyulan örnek var. Güncel içerik aşamasını yeni örneklerle pekiştir.`,
                `There are ${row.practiceCount} practice answers and ${row.distinctSounds} audibly different examples. Reinforce the current content stage with fresh examples.`,
              );
    const nextGoal = text(
      `${severity === 'focus' ? 'Önce dersin açıklamalı örneğini yeniden dinle. ' : ''}${dueReviews ? `Zamanı gelen ${dueReviews} tekrarı yap; ardından ` : ''}${row.level}. aşamada iki ayrı oturumda toplam 10 yeni soru yanıtla. Yanıtları geri bildirimle karşılaştır; daha zor aşamaya geçme hedefi koyma.`,
      `${severity === 'focus' ? 'First revisit the guided lesson example. ' : ''}${dueReviews ? `Complete ${dueReviews} due reviews, then ` : ''}answer 10 fresh questions at stage ${row.level} across two separate sessions. Compare answers with feedback; advancing difficulty is not the goal.`,
    );
    return {
      order,
      rank: severity === 'focus' ? 3 : row.dueCount ? 2 : severity === 'explore' ? 1 : 0,
      priority: {
        skill: row.skill,
        lessonId: row.lessonId,
        severity,
        evidence: evidenceText,
        nextGoal,
        goal,
      },
    };
  });
  return candidates
    .sort((a, b) => b.rank - a.rank || a.order - b.order)
    .slice(0, 3)
    .map(c => c.priority);
}

/**
 * A read-only snapshot of saved observations, not an aptitude score. Personal answers
 * belong to their recorded study route; older manual answers have only lesson.path.
 * Response counts follow the selected calendar period. Stage suggestions and review
 * backlog use all history through now. Daily rows contain recorded activity days only.
 */
export function buildProgressReport(
  progress: Progress,
  options: ReportOptions = {},
): ProgressReport {
  const path = options.path ?? 'all',
    period = options.period ?? 'all',
    now = options.now ?? Date.now();
  if (!['all', 'mix', 'music', 'exam'].includes(path) || !['all', '30d', '7d'].includes(period))
    throw new RangeError('Invalid report path or period');
  if (!Number.isSafeInteger(now) || now < 0 || now > 8.64e15)
    throw new RangeError('Invalid report snapshot time');
  if (
    options.timeZone !== undefined &&
    (typeof options.timeZone !== 'string' || !options.timeZone.trim())
  )
    throw new RangeError('Invalid report time zone');
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: options.timeZone ?? 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeZone = formatter.resolvedOptions().timeZone;
  const dayKey = (at: number) => {
    const parts = formatter.formatToParts(at),
      read = (type: string) => parts.find(p => p.type === type)!.value;
    return `${read('year')}-${read('month')}-${read('day')}`;
  };
  const endDate = dayKey(now),
    days = period === '7d' ? 7 : 30;
  const startDate =
    period === 'all'
      ? null
      : new Date(Date.parse(`${endDate}T00:00:00Z`) - (days - 1) * DAY).toISOString().slice(0, 10);
  // Find the first instant of the first selected local calendar day, including DST.
  let startAt: number | null = null;
  if (startDate) {
    const midnight = Date.parse(`${startDate}T00:00:00Z`);
    let low = Math.max(0, midnight - 2 * DAY),
      high = Math.min(now, midnight + 2 * DAY);
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (dayKey(middle) < startDate) low = middle + 1;
      else high = middle;
    }
    startAt = low;
  }
  const inRange = (at: number) =>
    Number.isFinite(at) && at <= now && at >= 0 && (startDate === null || dayKey(at) >= startDate);
  const selectedPath = (route: PathId) => path === 'all' || route === path;
  const snapshot = estimateSnapshot(progress, now);
  const personalSessions: PersonalSession[] = [
    ...(progress.personal?.results ?? []),
    ...(progress.personal?.active ? [progress.personal.active] : []),
  ];
  const routes = new Map<string, PathId>();
  for (const session of personalSessions)
    session.answers.forEach((_, index) =>
      routes.set(`personal:${session.id}:${index}`, session.path),
    );
  const allEvidence: RoutedEvidence[] = studyEvidence(progress)
    .filter(e => Number.isFinite(e.at) && e.at >= 0 && e.at <= now)
    .map(e => ({ ...e, path: routes.get(e.id) ?? getLesson(e.lessonId).path }));
  const selectedEvidence = allEvidence.filter(e => selectedPath(e.path));
  const periodEvidence = selectedEvidence.filter(e => inRange(e.at));
  const practice = periodEvidence.filter(e => !e.review),
    reviews = periodEvidence.filter(e => e.review);
  const soundCache = new Map<string, string>();
  const audible = (ref: QuestionRef) => {
    const key = logicalIdentity(ref);
    let value = soundCache.get(key);
    if (value === undefined) {
      value = soundIdentity(ref);
      soundCache.set(key, value);
    }
    return value;
  };
  const cardRoutes = new Map(allEvidence.map(e => [e.id, e.path]));
  for (const e of allEvidence)
    if (e.review && !cardRoutes.has(e.review.id)) cardRoutes.set(e.review.id, e.path);
  const cards = reviewCards(snapshot, allEvidence).filter(c =>
    selectedPath(cardRoutes.get(c.id) ?? getLesson(c.ref.lessonId).path),
  );
  const dailyMap = new Map<string, ReportDay>();
  const day = (at: number) => {
    const date = dayKey(at);
    let row = dailyMap.get(date);
    if (!row) {
      row = {
        date,
        practiceCount: 0,
        correct: 0,
        reviewCount: 0,
        reviewCorrect: 0,
        placementCount: 0,
        skippedCount: 0,
        completedSessions: 0,
        partialSessions: 0,
        mockCount: 0,
        selfAssessmentCount: 0,
      };
      dailyMap.set(date, row);
    }
    return row;
  };
  for (const e of practice) {
    const row = day(e.at);
    row.practiceCount++;
    if (e.correct) row.correct++;
  }
  for (const e of reviews) {
    const row = day(e.at);
    row.reviewCount++;
    if (e.correct) row.reviewCorrect++;
  }
  const placement = {
    count: 0,
    correct: 0,
    accuracy: null as number | null,
    completedSessions: 0,
    partialSessions: 0,
    skippedCount: 0,
  };
  const assessed = new Set(practice.map(e => getLesson(e.lessonId).skill));
  let skippedPersonalResponses = 0;
  for (const s of personalSessions)
    if (selectedPath(s.path) && s.startedAt <= now)
      for (const [index, answer] of s.answers.entries())
        if (inRange(answer.at)) {
          if (answer.choice === null) {
            skippedPersonalResponses++;
            day(answer.at).skippedCount++;
            if (s.mode === 'placement') placement.skippedCount++;
          } else if (s.mode === 'placement') {
            placement.count++;
            if (answer.correct) placement.correct++;
            day(answer.at).placementCount++;
            assessed.add(getLesson(s.items[index].lessonId).skill);
          }
        }
  placement.accuracy = percent(placement.correct, placement.count);
  let completedSessions = 0,
    partialSessions = 0;
  const countedSessions = new Set<string>();
  const sessionEvent = (key: string, at: number, completed: boolean, isPlacement = false) => {
    if (countedSessions.has(key) || !inRange(at)) return;
    countedSessions.add(key);
    if (isPlacement) {
      if (completed) placement.completedSessions++;
      else placement.partialSessions++;
    } else if (completed) {
      completedSessions++;
      day(at).completedSessions++;
    } else {
      partialSessions++;
      day(at).partialSessions++;
    }
  };
  const completedManual = new Set<string>();
  for (const r of progress.results)
    if (selectedPath(getLesson(r.lessonId).path) && Date.parse(r.at) <= now) {
      completedManual.add(r.id);
      sessionEvent(`manual:${r.id}`, Date.parse(r.at), true);
    }
  const partialManual = new Map<string, number>();
  for (const e of selectedEvidence)
    if (e.id.startsWith('manual:') && !completedManual.has(e.sessionId))
      partialManual.set(e.sessionId, Math.max(partialManual.get(e.sessionId) ?? 0, e.at));
  for (const [id, at] of partialManual) sessionEvent(`manual:${id}`, at, false);
  const activeManual = progress.session;
  if (
    activeManual?.started &&
    selectedPath(getLesson(activeManual.lessonId).path) &&
    !completedManual.has(activeManual.id)
  ) {
    const last = activeManual.answers.filter(a => Date.parse(a.at) <= now).at(-1);
    if (last) sessionEvent(`manual:${activeManual.id}`, Date.parse(last.at), false);
  }
  for (const s of progress.personal?.results ?? [])
    if (selectedPath(s.path) && s.startedAt <= now) {
      const finished = s.finishedAt <= now;
      const at = finished
        ? s.finishedAt
        : (s.answers.filter(a => a.at <= now).at(-1)?.at ?? s.startedAt);
      sessionEvent(
        `personal:${s.id}`,
        at,
        finished && s.status === 'completed',
        s.mode === 'placement',
      );
    }
  const activePersonal = progress.personal?.active;
  if (activePersonal && selectedPath(activePersonal.path) && activePersonal.startedAt <= now)
    sessionEvent(
      `personal:${activePersonal.id}`,
      activePersonal.answers.filter(a => a.at <= now).at(-1)?.at ?? activePersonal.startedAt,
      false,
      activePersonal.mode === 'placement',
    );
  const supported =
    path === 'all' ? [...new Set(Object.values(personalSkills).flat())] : personalSkills[path];
  const skills: ReportSkill[] = supported.map(skill => {
    const data = practice.filter(e => getLesson(e.lessonId).skill === skill),
      review = reviews.filter(e => getLesson(e.lessonId).skill === skill);
    const estimate = skillEstimate(snapshot, skill, allEvidence);
    const available = skillLessons(skill),
      lesson = available.find(l => l.level === estimate.level)!;
    const backlog = cards.filter(c => getLesson(c.ref.lessonId).skill === skill);
    const firstPracticeAt = allEvidence.find(
      e => !e.review && getLesson(e.lessonId).skill === skill,
    )?.at;
    const firstPlacementAt = snapshot.personal?.results
      .filter(
        s =>
          s.mode === 'placement' &&
          s.status === 'completed' &&
          s.answers.some(
            (a, i) => a.choice !== null && getLesson(s.items[i].lessonId).skill === skill,
          ),
      )
      .sort((a, b) => a.finishedAt - b.finishedAt)[0]?.finishedAt;
    const firstAt = Math.min(firstPracticeAt ?? Infinity, firstPlacementAt ?? Infinity);
    const firstSuggestedLevel = Number.isFinite(firstAt)
      ? skillEstimate(
          estimateSnapshot(progress, firstAt),
          skill,
          allEvidence.filter(e => e.at <= firstAt),
        ).level
      : available[0].level;
    const correct = data.filter(e => e.correct).length,
      reviewCorrect = review.filter(e => e.correct).length;
    return {
      skill,
      path: lesson.path,
      lessonId: lesson.id,
      level: estimate.level,
      maxLevel: available.at(-1)!.level,
      practiceCount: data.length,
      correct,
      accuracy: percent(correct, data.length),
      distinctSounds: new Set(data.flatMap(e => (e.ref ? [audible(e.ref)] : []))).size,
      independentLogicalCount: new Set(data.flatMap(e => (e.ref ? [logicalIdentity(e.ref)] : [])))
        .size,
      legacyCount: data.filter(e => !e.ref).length,
      sessionCount: new Set(data.map(e => e.sessionId)).size,
      reviewCount: review.length,
      reviewCorrect,
      reviewAccuracy: percent(reviewCorrect, review.length),
      dueCount: backlog.filter(c => c.dueAt <= now).length,
      openCount: backlog.length,
      estimateReason: estimate.reason,
      estimateExplanation: estimate.explanation,
      firstSuggestedLevel,
      currentSuggestedLevel: estimate.level,
      trend: comparableTrend(data, audible),
    };
  });
  const showExam = path === 'all' || path === 'exam';
  const mockResults: ReportExam['results'] = showExam
    ? (progress.exam?.results ?? [])
        .filter(r => inRange(r.finishedAt))
        .map(r => {
          const answers = r.answers.filter(a => a.at <= now),
            total = mockLessonIds(r).length,
            correct = answers.filter(a => a.choice !== null && a.correct).length;
          day(r.finishedAt).mockCount++;
          return {
            id: r.id,
            profileId: r.profileId,
            level: r.level,
            finishedAt: r.finishedAt,
            reason: r.reason,
            answered: answers.filter(a => a.choice !== null).length,
            skipped: answers.filter(a => a.choice === null).length,
            correct,
            total,
            accuracy: percent(correct, total),
          };
        })
        .sort((a, b) => a.finishedAt - b.finishedAt || a.id.localeCompare(b.id))
    : [];
  const rehearsals = showExam ? (progress.exam?.rehearsals ?? []).filter(r => inRange(r.at)) : [];
  for (const rehearsal of rehearsals) day(rehearsal.at).selfAssessmentCount++;
  const questionCount = mockResults.reduce((sum, r) => sum + r.total, 0),
    mockCorrect = mockResults.reduce((sum, r) => sum + r.correct, 0);
  const exam: ReportExam = {
    results: mockResults,
    completedCount: mockResults.filter(r => r.reason === 'completed').length,
    endedCount: mockResults.filter(r => r.reason === 'ended').length,
    expiredCount: mockResults.filter(r => r.reason === 'expired').length,
    questionCount,
    correct: mockCorrect,
    accuracy: percent(mockCorrect, questionCount),
    selfAssessment: {
      count: rehearsals.length,
      checked: rehearsals.reduce((sum, r) => sum + r.checks.filter(Boolean).length, 0),
      totalChecks: rehearsals.reduce((sum, r) => sum + r.checks.length, 0),
    },
    active: !!(showExam && progress.exam?.active && progress.exam.active.startedAt <= now),
  };
  const daily = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  const practiceCorrect = practice.filter(e => e.correct).length,
    reviewCorrect = reviews.filter(e => e.correct).length;
  return {
    version: 1,
    generatedAt: now,
    timeZone,
    path,
    period,
    range: { startAt, endAt: now },
    summary: {
      practiceCount: practice.length,
      practiceCorrect,
      practiceAccuracy: percent(practiceCorrect, practice.length),
      completedSessions,
      partialSessions,
      assessedSkills: supported.filter(skill => assessed.has(skill)).length,
      supportedSkills: supported.length,
      independentLogicalCount: new Set(
        practice.flatMap(e => (e.ref ? [logicalIdentity(e.ref)] : [])),
      ).size,
      distinctSounds: new Set(practice.flatMap(e => (e.ref ? [audible(e.ref)] : []))).size,
      legacyCount: practice.filter(e => !e.ref).length,
      activeDays: daily.length,
      skippedPersonalResponses,
    },
    review: {
      count: reviews.length,
      correct: reviewCorrect,
      accuracy: percent(reviewCorrect, reviews.length),
      dueCount: cards.filter(c => c.dueAt <= now).length,
      openCount: cards.length,
    },
    placement,
    skills,
    priorities: prioritiesFor(skills, selectedEvidence),
    daily,
    exam,
  };
}
