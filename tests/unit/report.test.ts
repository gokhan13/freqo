import { describe, expect, it } from 'vitest';
import { getLesson, skillNames, type EqSource, type SkillId } from '../../src/content';
import { EQ_LEVELS } from '../../src/eq-model';
import { finishMock, initialExamProgress, startMock } from '../../src/exam-model';
import type { ExamProgress } from '../../src/exam-types';
import { initialProgress, makeQuestion, type Attempt, type Progress } from '../../src/model';
import { refQuestion, skillLessons, soundIdentity, startPersonal } from '../../src/personal-model';
import type { PersonalResult, QuestionRef } from '../../src/personal-types';
import { buildProgressReport } from '../../src/report-model';
import { resourcesForSkill } from '../../src/report-presentation';
import { learningResources, studyGuides } from '../../src/report-resources';
// The EQ ladder's second and third stages; their ids are names, not numbers.
const EQ2 = skillLessons('eq')[1].id,
  EQ3 = skillLessons('eq')[2].id;

const NOW = Date.parse('2026-10-12T12:00:00Z'),
  DAY = 86_400_000;
function attempts(
  lessonId: string,
  corrects: boolean[],
  at = NOW - DAY,
  source?: EqSource,
  offset = 0,
): Attempt[] {
  return corrects.map((correct, i) => {
    const seed = 1000 + offset + i,
      q = makeQuestion(lessonId, seed, 0, source);
    return {
      sessionId: `round-${offset + Math.floor(i / 5)}`,
      index: i % 5,
      lessonId,
      correct,
      at: new Date(at + i * 1000).toISOString(),
      // The stored round seed must account for the round's question index.
      response: {
        seed: (seed - (i % 5) * 2654435761) >>> 0,
        choice: correct ? q.correct : q.options.find(o => o.id !== q.correct)!.id,
      },
      ...(source ? { source } : {}),
    };
  });
}
function personal(
  id: string,
  items: QuestionRef[],
  choices: (boolean | null)[],
  at: number,
  extras: Partial<PersonalResult> = {},
): PersonalResult {
  return {
    id,
    mode: 'practice',
    path: getLesson(items[0].lessonId).path,
    seed: 1,
    startedAt: at,
    items,
    index: Math.max(0, choices.length - 1),
    answers: choices.map((correct, i) => ({
      choice:
        correct === null
          ? null
          : correct
            ? refQuestion(items[i]).correct
            : refQuestion(items[i]).options.find(o => o.id !== refQuestion(items[i]).correct)!.id,
      correct: correct === true,
      at: at + i + 1,
    })),
    finishedAt: at + choices.length + 1,
    status: 'completed',
    ...extras,
  };
}
const refs = (lessonId: string, count: number, seed = 50) =>
  Array.from({ length: count }, (_, i) => ({ lessonId, seed: seed + i, index: 0 }));
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

describe('honest progress report snapshots', () => {
  it('is deterministic, does not mutate frozen progress and uses null for unmeasured accuracy', () => {
    const progress = freeze(initialProgress()),
      before = JSON.stringify(progress);
    const report = buildProgressReport(progress, { now: NOW });
    expect(buildProgressReport(progress, { now: NOW })).toEqual(report);
    expect(JSON.stringify(progress)).toBe(before);
    expect(report).toMatchObject({
      version: 1,
      generatedAt: NOW,
      timeZone: 'Europe/Istanbul',
      path: 'all',
      period: 'all',
      summary: { practiceCount: 0, practiceAccuracy: null, activeDays: 0 },
      review: { accuracy: null },
      exam: { accuracy: null },
    });
    expect(report.priorities).toHaveLength(3);
    expect(report.priorities.every(p => p.severity === 'explore')).toBe(true);
    expect(report.skills.every(s => s.trend.status === 'insufficient')).toBe(true);
    expect(report.skills.map(s => s.skill).length).toBe(
      new Set(report.skills.map(s => s.skill)).size,
    );
  });

  it('keeps placement, review, skipped responses and partial sessions separate from raw practice', () => {
    const mistake: QuestionRef = { lessonId: 'eq-1', seed: 2, index: 0 };
    const old = personal('old', [mistake], [false], NOW - DAY);
    const reviewRef = {
      ...mistake,
      review: { id: 'personal:old:0', createdAt: old.answers[0].at },
    };
    const mixed = personal(
      'mixed',
      [reviewRef, ...refs('eq-1', 3, 800)],
      [true, true, false, null],
      NOW - 1000,
      { status: 'ended' },
    );
    const placement = personal('placement', refs('eq-1', 2), [true, null], NOW - 500, {
      mode: 'placement',
    });
    const progress = freeze({
      ...initialProgress(),
      personal: { version: 1 as const, active: null, results: [old, mixed, placement] },
    });
    const report = buildProgressReport(progress, { now: NOW, path: 'mix' });
    expect(report.summary).toMatchObject({
      practiceCount: 3,
      practiceCorrect: 1,
      practiceAccuracy: 33,
      completedSessions: 1,
      partialSessions: 1,
      skippedPersonalResponses: 2,
      assessedSkills: 1,
    });
    expect(report.review).toMatchObject({ count: 1, correct: 1, accuracy: 100 });
    expect(report.placement).toMatchObject({
      count: 1,
      correct: 1,
      accuracy: 100,
      completedSessions: 1,
      partialSessions: 0,
      skippedCount: 1,
    });
    expect(report.skills.find(s => s.skill === 'eq')).toMatchObject({
      practiceCount: 3,
      reviewCount: 1,
      sessionCount: 2,
    });
  });

  it('counts saved legacy scores without inventing reconstructable examples or promotion', () => {
    const legacy = attempts('eq-1', Array(10).fill(true)).map(({ response: _response, ...a }) => a);
    const progress = {
      ...initialProgress(),
      attempts: legacy,
      results: [
        {
          id: 'round-0',
          lessonId: 'eq-1',
          correct: 5,
          total: 5,
          at: new Date(NOW - DAY + 5000).toISOString(),
        },
      ],
    };
    const report = buildProgressReport(progress, { now: NOW });
    expect(report.summary).toMatchObject({
      practiceCount: 10,
      practiceAccuracy: 100,
      legacyCount: 10,
      independentLogicalCount: 0,
      distinctSounds: 0,
      completedSessions: 1,
      partialSessions: 1,
    });
    expect(report.skills.find(s => s.skill === 'eq')).toMatchObject({
      level: 1,
      distinctSounds: 0,
      legacyCount: 10,
      trend: { status: 'insufficient', deltaPoints: null },
    });
  });

  it('excludes future evidence and completed placements, while retaining earlier answers of a partially future session', () => {
    const futurePlacement = personal(
      'future-placement',
      [
        { lessonId: 'eq-1', seed: 1, index: 0 },
        { lessonId: EQ2, seed: 2, index: 0 },
      ],
      [true, true],
      NOW + DAY,
      { mode: 'placement' },
    );
    const spanning = personal('spanning', refs('eq-1', 2), [true, false], NOW - 100, {
      finishedAt: NOW + 100,
    });
    spanning.answers[1].at = NOW + 50;
    const progress = {
      ...initialProgress(),
      attempts: attempts(EQ2, Array(10).fill(true), NOW + DAY),
      personal: { version: 1 as const, active: null, results: [futurePlacement, spanning] },
    };
    const report = buildProgressReport(freeze(progress), { now: NOW });
    expect(report.summary).toMatchObject({
      practiceCount: 1,
      practiceAccuracy: 100,
      completedSessions: 0,
      partialSessions: 1,
    });
    expect(report.placement.count).toBe(0);
    expect(report.skills.find(s => s.skill === 'eq')).toMatchObject({
      level: 1,
      firstSuggestedLevel: 1,
      currentSuggestedLevel: 1,
    });
    expect(report.review.openCount).toBe(0);
  });

  it('attributes personal exam answers to their recorded route while manual answers retain lesson route', () => {
    const exam = personal('exam-study', refs('degree-1', 2), [true, false], NOW - 100, {
      path: 'exam',
    });
    const progress = {
      ...initialProgress(),
      attempts: attempts('degree-1', [true], NOW - 200),
      personal: { version: 1 as const, active: null, results: [exam] },
    };
    const examReport = buildProgressReport(progress, { now: NOW, path: 'exam' }),
      musicReport = buildProgressReport(progress, { now: NOW, path: 'music' });
    expect(examReport.summary).toMatchObject({
      practiceCount: 2,
      supportedSkills: 6,
      assessedSkills: 1,
    });
    expect(examReport.skills.find(s => s.skill === 'degree')).toMatchObject({
      path: 'music',
      practiceCount: 2,
      correct: 1,
    });
    expect(musicReport.summary.practiceCount).toBe(1);
    expect(musicReport.skills.find(s => s.skill === 'degree')!.correct).toBe(1);
    expect(buildProgressReport(progress, { now: NOW }).summary.practiceCount).toBe(3);
  });

  it('counts logical seed aliases once, and measures audible variation with actual soundIdentity', () => {
    const a: QuestionRef = { lessonId: 'rhythm-1', seed: 5, index: 1 },
      b: QuestionRef = { lessonId: 'rhythm-1', seed: (5 + 2654435761) >>> 0, index: 0 };
    const remaining = refs('rhythm-1', 15, 100);
    const progress = {
      ...initialProgress(),
      personal: {
        version: 1 as const,
        active: null,
        results: [
          personal('a', [a], [true], NOW - 100),
          personal('b', [b, ...remaining], Array(16).fill(true), NOW - 50),
        ],
      },
    };
    const report = buildProgressReport(freeze(progress), { now: NOW });
    expect(report.summary).toMatchObject({
      practiceCount: 17,
      independentLogicalCount: 16,
      distinctSounds: new Set([a, b, ...remaining].map(soundIdentity)).size,
    });
    expect(report.summary.distinctSounds).toBeLessThan(report.summary.independentLogicalCount);
  });

  it('compares distinct saved questions at the same stage, source and route across separate sessions', () => {
    const progress = {
      ...initialProgress(),
      attempts: attempts(
        EQ2,
        [...Array(5).fill(true), ...Array(5).fill(false), ...Array(9).fill(true), false],
        NOW - DAY,
        'studio',
      ),
    };
    const report = buildProgressReport(progress, { now: NOW, path: 'mix' });
    expect(report.skills.find(s => s.skill === 'eq')!.trend).toMatchObject({
      status: 'available',
      lessonId: EQ2,
      source: 'studio',
      path: 'mix',
      recentCount: 10,
      previousCount: 10,
      recentAccuracy: 90,
      previousAccuracy: 50,
      deltaPoints: 40,
    });
    const repeated = {
      ...progress,
      attempts: [
        ...progress.attempts,
        ...progress.attempts.map(a => ({
          ...a,
          sessionId: `repeat-${a.sessionId}`,
          at: new Date(NOW - 1000).toISOString(),
        })),
      ],
    };
    expect(
      buildProgressReport(repeated, { now: NOW }).skills.find(s => s.skill === 'eq')!.trend,
    ).toEqual(report.skills.find(s => s.skill === 'eq')!.trend);
  });

  it.each(['stage', 'source', 'route'] as const)(
    'does not imply growth from changing %s',
    change => {
      let progress: Progress;
      if (change === 'route') {
        progress = {
          ...initialProgress(),
          personal: {
            version: 1,
            active: null,
            results: [
              personal('music', refs('degree-1', 10, 100), Array(10).fill(false), NOW - DAY),
              personal('exam', refs('degree-1', 10, 200), Array(10).fill(true), NOW - 100, {
                path: 'exam',
              }),
            ],
          },
        };
      } else
        progress = {
          ...initialProgress(),
          attempts: [
            ...attempts(
              change === 'stage' ? 'eq-1' : EQ2,
              Array(10).fill(false),
              NOW - DAY,
              'studio',
            ),
            ...attempts(
              EQ2,
              Array(10).fill(true),
              NOW - 10_000,
              change === 'source' ? 'acoustic' : 'studio',
              100,
            ),
          ],
        };
      const skill = change === 'route' ? 'degree' : 'eq';
      expect(
        buildProgressReport(progress, { now: NOW }).skills.find(s => s.skill === skill)!.trend,
      ).toMatchObject({ status: 'insufficient', previousCount: 0, deltaPoints: null });
    },
  );

  it('requires separate sessions in each trend window', () => {
    const result = personal('one-session', refs('degree-1', 20), Array(20).fill(true), NOW - 100);
    const report = buildProgressReport(
      { ...initialProgress(), personal: { version: 1, active: null, results: [result] } },
      { now: NOW },
    );
    expect(report.skills.find(s => s.skill === 'degree')!.trend).toMatchObject({
      status: 'insufficient',
      recentCount: 10,
      previousCount: 10,
      deltaPoints: null,
    });
  });

  it('does not infer progress from logically distinct rhythm questions that play one repeated sound', () => {
    const sound = soundIdentity({ lessonId: 'rhythm-1', seed: 0, index: 0 }),
      repeated: QuestionRef[] = [];
    for (let seed = 0; repeated.length < 20 && seed < 1000; seed++) {
      const ref = { lessonId: 'rhythm-1', seed, index: 0 };
      if (soundIdentity(ref) === sound) repeated.push(ref);
    }
    expect(repeated).toHaveLength(20);
    const results = Array.from({ length: 4 }, (_, i) =>
      personal(
        `rhythm-${i}`,
        repeated.slice(i * 5, i * 5 + 5),
        Array(5).fill(i >= 2),
        NOW - 1000 + i * 100,
      ),
    );
    const report = buildProgressReport(
      { ...initialProgress(), personal: { version: 1, active: null, results } },
      { now: NOW },
    );
    const row = report.skills.find(s => s.skill === 'rhythm')!;
    expect(row).toMatchObject({
      practiceCount: 20,
      independentLogicalCount: 20,
      distinctSounds: 1,
      accuracy: 50,
    });
    expect(row.trend).toMatchObject({
      status: 'insufficient',
      recentCount: 10,
      previousCount: 10,
      recentAccuracy: 100,
      previousAccuracy: 0,
      deltaPoints: null,
    });
    expect(row.trend.reason.en).toContain('at least 2 audibly different');
  });

  it('requires three audible examples per window for tasks with more than two options', () => {
    const sounds = new Map<string, QuestionRef[]>();
    for (let seed = 0; seed < 2000; seed++) {
      const ref: QuestionRef = { lessonId: 'eq-1', seed, index: 0, source: 'acoustic' },
        key = soundIdentity(ref);
      sounds.set(key, [...(sounds.get(key) ?? []), ref]);
    }
    const twoSounds = [...sounds.values()].slice(0, 2);
    const items = [
      ...twoSounds[0].slice(0, 5),
      ...twoSounds[1].slice(0, 5),
      ...twoSounds[0].slice(5, 10),
      ...twoSounds[1].slice(5, 10),
    ];
    expect(items).toHaveLength(20);
    const results = Array.from({ length: 4 }, (_, i) =>
      personal(
        `eq-${i}`,
        items.slice(i * 5, i * 5 + 5),
        Array(5).fill(i >= 2),
        NOW - 1000 + i * 100,
      ),
    );
    const report = buildProgressReport(
      { ...initialProgress(), personal: { version: 1, active: null, results } },
      { now: NOW },
    );
    expect(report.skills.find(s => s.skill === 'eq')!.trend).toMatchObject({
      status: 'insufficient',
      recentAccuracy: 100,
      previousAccuracy: 0,
      deltaPoints: null,
    });
    expect(report.skills.find(s => s.skill === 'eq')!.trend.reason.en).toContain(
      'at least 3 audibly different',
    );
  });

  it('uses calendar days in the specified timezone, including DST and Istanbul midnight', () => {
    const at = Date.parse('2026-10-05T21:00:00Z'),
      before = at - 1;
    const progress = {
      ...initialProgress(),
      attempts: [
        ...attempts('eq-1', [true], at),
        ...attempts('eq-1', [false], before, undefined, 100),
      ],
    };
    const report = buildProgressReport(progress, { now: NOW, period: '7d' });
    expect(report.range.startAt).toBe(at);
    expect(report.summary.practiceCount).toBe(1);
    expect(report.daily[0].date).toBe('2026-10-06');
    const dst = buildProgressReport(initialProgress(), {
      now: Date.parse('2026-03-10T12:00:00Z'),
      period: '7d',
      timeZone: 'America/New_York',
    });
    expect(dst.range.startAt).toBe(Date.parse('2026-03-04T05:00:00Z'));
  });

  it('keeps older review backlog visible outside the selected response period', () => {
    const old = personal('old-error', refs('degree-1', 1), [false], NOW - 20 * DAY, {
      path: 'exam',
    });
    const progress = {
      ...initialProgress(),
      personal: { version: 1 as const, active: null, results: [old] },
    };
    const report = buildProgressReport(progress, { now: NOW, period: '7d', path: 'exam' });
    expect(report.summary.practiceCount).toBe(0);
    expect(report.review).toMatchObject({ count: 0, accuracy: null, dueCount: 1, openCount: 1 });
    expect(report.skills.find(s => s.skill === 'degree')!.dueCount).toBe(1);
    expect(buildProgressReport(progress, { now: NOW, path: 'music' }).review.openCount).toBe(0);
  });

  it('applies the full shared review schedule before filtering response periods, and ignores future resolution', () => {
    const mistake = personal('scheduled-error', refs('eq-1', 1), [false], NOW - 13 * DAY);
    const ref = {
      ...mistake.items[0],
      review: { id: 'personal:scheduled-error:0', createdAt: mistake.answers[0].at },
    };
    const results = [mistake];
    let reviewAt = mistake.answers[0].at + 600_000;
    for (let i = 0; i < 4; i++) {
      const result = personal(`review-${i}`, [ref], [true], reviewAt, { mode: 'review' });
      results.push(result);
      reviewAt = result.answers[0].at + [1, 3, 7, 0][i] * DAY;
    }
    const progress = freeze({
      ...initialProgress(),
      personal: { version: 1 as const, active: null, results },
    });
    const report = buildProgressReport(progress, { now: NOW, period: '7d' });
    expect(report.summary.practiceCount).toBe(0);
    expect(report.review).toMatchObject({ count: 1, correct: 1, dueCount: 0, openCount: 0 });
    const beforeResolution = buildProgressReport(progress, { now: results[3].finishedAt + 1 });
    expect(beforeResolution.review).toMatchObject({ count: 3, openCount: 1, dueCount: 0 });
  });

  it('exposes chronological suggested content stages using the existing estimate, without a pooled growth score', () => {
    const placement = personal(
      'baseline',
      [
        { lessonId: 'eq-1', seed: 1, index: 0 },
        { lessonId: EQ2, seed: 2, index: 0 },
      ],
      [true, true],
      NOW - 3 * DAY,
      { mode: 'placement' },
    );
    const progress = {
      ...initialProgress(),
      attempts: attempts(EQ2, Array(10).fill(true), NOW - DAY),
      personal: { version: 1 as const, active: null, results: [placement] },
    };
    const report = buildProgressReport(progress, { now: NOW, path: 'mix' });
    expect(report.skills.find(s => s.skill === 'eq')).toMatchObject({
      firstSuggestedLevel: 2,
      currentSuggestedLevel: 3,
      lessonId: EQ3,
      maxLevel: EQ_LEVELS,
    });
    expect(report.summary).not.toHaveProperty('growth');
  });

  it('offers measurable safe priorities without diagnosing a short run as a weakness', () => {
    const short = buildProgressReport(
      { ...initialProgress(), attempts: attempts('eq-1', Array(5).fill(false)) },
      { now: NOW, path: 'mix' },
    );
    expect(short.priorities.find(p => p.skill === 'eq')!.severity).toBe('consolidate');
    const supported = buildProgressReport(
      { ...initialProgress(), attempts: attempts('eq-1', Array(6).fill(false)) },
      { now: NOW, path: 'mix' },
    );
    expect(supported.priorities[0]).toMatchObject({
      skill: 'eq',
      lessonId: 'eq-1',
      severity: 'focus',
      goal: { freshQuestions: 10, sessions: 2 },
    });
    expect(supported.priorities).toHaveLength(3);
  });

  it('prioritizes a just-lowered stage with the existing explanation instead of alleging errors at the new stage', () => {
    const placement = personal(
      'advanced-baseline',
      [
        { lessonId: 'eq-1', seed: 1, index: 0 },
        { lessonId: EQ2, seed: 2, index: 0 },
      ],
      [true, true],
      NOW - 3 * DAY,
      { mode: 'placement' },
    );
    const progress = {
      ...initialProgress(),
      attempts: attempts(EQ2, Array(6).fill(false), NOW - DAY),
      personal: { version: 1 as const, active: null, results: [placement] },
    };
    const report = buildProgressReport(progress, { now: NOW, path: 'mix' }),
      row = report.skills.find(s => s.skill === 'eq')!;
    expect(row).toMatchObject({ estimateReason: 'down', level: 1 });
    expect(report.priorities[0]).toMatchObject({
      skill: 'eq',
      lessonId: 'eq-1',
      severity: 'focus',
      evidence: row.estimateExplanation,
    });
    expect(report.priorities[0].evidence.en).not.toContain('at the suggested stage');
    expect(report.priorities[0].goal).toMatchObject({ freshQuestions: 10, sessions: 2 });
    expect(report.priorities).toHaveLength(3);
  });

  it('keeps a supported first-stage difficulty ahead of untried skills and uses its model explanation', () => {
    const report = buildProgressReport(
      { ...initialProgress(), attempts: attempts('eq-1', Array(6).fill(false)) },
      { now: NOW, path: 'mix' },
    );
    const row = report.skills.find(s => s.skill === 'eq')!;
    expect(row.estimateReason).toBe('support');
    expect(report.priorities[0]).toMatchObject({
      skill: 'eq',
      severity: 'focus',
      evidence: row.estimateExplanation,
    });
    expect(report.priorities.slice(1).every(p => p.severity === 'explore')).toBe(true);
  });

  it('separates mock scores and self-assessment from practice accuracy', () => {
    let exam: ExamProgress = {
      ...initialExamProgress(),
      active: startMock('common', 1, NOW - DAY, 5, 'mock'),
    };
    exam = finishMock(exam, 'ended', NOW - DAY + 1000);
    const progress: Progress = {
      ...initialProgress(),
      attempts: attempts('eq-1', [true]),
      exam: {
        ...exam,
        rehearsals: [
          {
            id: 'rehearsal',
            courseId: 'performance',
            level: 1,
            seed: 1,
            at: NOW - 500,
            checks: [true, false, true],
            note: 'Private note',
          },
        ],
      },
    };
    const report = buildProgressReport(progress, { now: NOW });
    expect(report.summary).toMatchObject({ practiceCount: 1, practiceAccuracy: 100 });
    expect(report.exam).toMatchObject({
      endedCount: 1,
      correct: 0,
      accuracy: 0,
      selfAssessment: { count: 1, checked: 2, totalChecks: 3 },
    });
    expect(report.exam.results[0].answered).toBe(0);
    expect(JSON.stringify(report)).not.toContain('Private note');
    expect(buildProgressReport(progress, { now: NOW, path: 'mix' }).exam).toMatchObject({
      results: [],
      selfAssessment: { count: 0 },
    });
  });

  it('counts an active unstarted assessment as partial without fabricating answered questions', () => {
    const progress = startPersonal(
      initialProgress(),
      'placement',
      'mix',
      NOW - 100,
      4,
      'active-placement',
    );
    const report = buildProgressReport(progress, { now: NOW });
    expect(report.placement).toMatchObject({ count: 0, completedSessions: 0, partialSessions: 1 });
    expect(report.summary.practiceCount).toBe(0);
  });

  it.each([
    { path: 'other' },
    { period: '1d' },
    { now: NaN },
    { now: -1 },
    { timeZone: 'invalid/zone' },
    { timeZone: '' },
  ])('rejects invalid options %j', options => {
    expect(() =>
      buildProgressReport(initialProgress(), options as Parameters<typeof buildProgressReport>[1]),
    ).toThrow(RangeError);
  });
});

describe('curated study resources', () => {
  it('defaults to Turkish-first resources without requiring a Turkish display language', () => {
    for (const skill of ['rhythm', 'rhythmic-dictation', 'rhythm-repeat'] as const) {
      const resources = resourcesForSkill(skill);
      expect(resources[0].id).toBe('ankara-note-values');
      expect(resources[0].language).toBe('tr');
      expect(resources.some(r => r.kind === 'book' && r.price === 'free')).toBe(true);
    }
  });

  it('keeps a free route to study every mixing skill alongside an optional paid book', () => {
    for (const skill of [
      'eq',
      'loudness',
      'compression',
      'attack',
      'release',
      'masking',
      'stereo',
      'reverb',
      'delay',
    ] as const) {
      const resources = resourcesForSkill(skill);
      expect(resources[0].price).toBe('free');
      expect(resources.every(r => r.skills.includes(skill))).toBe(true);
      expect(resources.some(r => r.id === 'mixing-secrets-book' && r.price === 'paid')).toBe(true);
      expect(resources.findIndex(r => r.price === 'paid')).toBe(resources.length - 1);
    }
  });

  it('covers every current skill with working catalogue references and plain HTTPS source links', () => {
    const ids = learningResources.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const resource of learningResources) {
      const url = new URL(resource.url);
      expect(url.protocol).toBe('https:');
      expect(url.username + url.password).toBe('');
      expect([...url.searchParams.keys()].some(key => /affiliate|utm_|referrer/i.test(key))).toBe(
        false,
      );
    }
    for (const skill of Object.keys(skillNames) as SkillId[]) {
      const guide = studyGuides[skill];
      expect(guide.resourceIds.every(id => ids.includes(id))).toBe(true);
      expect(resourcesForSkill(skill).some(r => r.price === 'free')).toBe(true);
    }
  });
});
