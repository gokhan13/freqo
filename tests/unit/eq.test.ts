import { describe, expect, it } from 'vitest';
import { eqSourceIds, getLesson, lessons, sourceFor, sourcesFor } from '../../src/content';
import {
  EQ_LEVELS,
  EQ_REGIONS,
  EQ_STAGE_IDS,
  OCTAVE_BANDS,
  THIRD_OCTAVE_BANDS,
  eqChoiceSetting,
  eqComparisonMove,
  eqExampleOptions,
  eqMagnitudeDb,
  eqMatchControls,
  eqNearMiss,
  eqTargetMove,
  eqUsesDirection,
  eqUsesMatching,
  makeEqExample,
  type EqMove,
} from '../../src/eq-model';
import { BAND_MINIMUM, eqInsights } from '../../src/eq-insights';
import {
  answerQuestion,
  initialProgress,
  makeQuestion,
  newSession,
  validAttempt,
  withAnswerComparison,
  withEqPreview,
  type Progress,
} from '../../src/model';
import { evaluateAnswer } from '../../src/music-model';
import {
  answerStats,
  skillLessons,
  soundIdentity,
  startPersonal,
  studyEvidence,
  targetedRefs,
  refQuestion,
} from '../../src/personal-model';
import { bandAudible } from '../../src/source-spectrum';

const questions = (lessonId: string, count = 400, source = 'acoustic' as const) =>
  Array.from({ length: count }, (_, seed) => makeQuestion(lessonId, seed * 7919, 0, source));
const pinkQuestions = (lessonId: string, count = 400) =>
  Array.from({ length: count }, (_, seed) => makeQuestion(lessonId, seed * 7919, 0, 'pink'));

describe('EQ ladder', () => {
  it('offers one lesson per stage; the ladder order is the level order', () => {
    const eq = skillLessons('eq');
    expect(eq.map(l => l.id)).toEqual(EQ_STAGE_IDS);
    expect(EQ_STAGE_IDS).toEqual([
      'eq-1',
      'eq-shape',
      'eq-2',
      'eq-3',
      'eq-4',
      'eq-5',
      'eq-6',
      'eq-width',
      'eq-7',
      'eq-8',
      'eq-match',
    ]);
    expect(eq.map(l => l.level)).toEqual(Array.from({ length: EQ_LEVELS }, (_, i) => i + 1));
    expect(lessons.filter(l => l.path === 'mix')).toHaveLength(35);
    for (const lesson of eq)
      for (const field of ['title', 'description', 'learn', 'listen', 'tip'] as const) {
        expect(lesson[field].tr.length, `${lesson.id} ${field}`).toBeGreaterThan(3);
        expect(lesson[field].en.length, `${lesson.id} ${field}`).toBeGreaterThan(3);
      }
  });

  it('keeps each stage to one new demand', () => {
    const shape = (id: string) => {
      const all = pinkQuestions(id);
      return {
        kind: all[0].eqKind,
        options: all[0].options.length,
        gains: [...new Set(all.map(q => q.gain))].sort((a, b) => a! - b!),
        q: [...new Set(all.map(q => q.q))].sort((a, b) => a! - b!),
      };
    };
    expect(shape('eq-1')).toEqual({ kind: 'region', options: 3, gains: [9], q: [0.7] });
    expect(shape('eq-2')).toEqual({ kind: 'bands', options: 5, gains: [9], q: [1] });
    expect(shape('eq-3')).toEqual({ kind: 'bands', options: 8, gains: [9], q: [1.4] });
    expect(shape('eq-4')).toEqual({ kind: 'bands', options: 8, gains: [-12], q: [1.4] });
    expect(shape('eq-5')).toEqual({ kind: 'direction', options: 16, gains: [-9, 9], q: [1.4] });
    expect(shape('eq-6')).toEqual({ kind: 'direction', options: 16, gains: [-6, 6], q: [1.4] });
    expect(shape('eq-width')).toEqual({ kind: 'width', options: 3, gains: [9], q: [0.5, 1.4, 4] });
    expect(shape('eq-7')).toEqual({ kind: 'direction', options: 16, gains: [-9, 9], q: [3] });
    expect(shape('eq-8')).toEqual({ kind: 'neighbours', options: 5, gains: [12], q: [4.3] });
    expect(shape('eq-match')).toEqual({
      kind: 'match',
      options: 48,
      gains: [-12, -8, -4, 4, 8, 12],
      q: [1.4],
    });
    expect(pinkQuestions('eq-shape')[0]).toMatchObject({ eqKind: 'shape', options: { length: 4 } });
  });

  it('gives every stage many audibly different examples on the reference source', () => {
    const distinct = (id: string) =>
      new Set(
        Array.from({ length: 3000 }, (_, seed) =>
          soundIdentity({ lessonId: id, seed: seed * 7919, index: 0, source: 'pink' }),
        ),
      ).size;
    expect(distinct('eq-1')).toBe(16);
    expect(distinct('eq-shape')).toBe(12);
    expect(distinct('eq-3')).toBe(8);
    expect(distinct('eq-5')).toBe(16);
    expect(distinct('eq-width')).toBe(24);
    expect(distinct('eq-7')).toBe(16);
    expect(distinct('eq-8')).toBe(THIRD_OCTAVE_BANDS.length);
    expect(distinct('eq-match')).toBe(48);
  });

  it('moves the boosted centre inside a region while the answer stays the region', () => {
    for (const q of pinkQuestions('eq-1')) {
      const region = q.correct as keyof typeof EQ_REGIONS;
      expect(EQ_REGIONS[region].bands).toContain(q.frequency);
    }
    expect(new Set(pinkQuestions('eq-1').map(q => q.frequency)).size).toBe(16);
  });

  it('asks for band and direction together and scores only the exact pair', () => {
    for (const q of questions('eq-5', 200)) {
      expect(OCTAVE_BANDS).toContain(q.frequency);
      expect(q.correct).toBe(`${q.gain! > 0 ? 'boost' : 'cut'}:${q.frequency}`);
      expect(evaluateAnswer(q, q.correct)).toBe(true);
      const flipped = `${q.gain! > 0 ? 'cut' : 'boost'}:${q.frequency}`;
      expect(evaluateAnswer(q, flipped)).toBe(false);
      expect(evaluateAnswer(q, String(q.frequency))).toBeNull();
      // C replays the learner's own move: same band, opposite sign, same size.
      const c = withAnswerComparison(q, flipped);
      expect(c).toMatchObject({ comparisonFrequency: q.frequency, comparisonGain: -q.gain! });
      expect(withAnswerComparison(q, q.correct)).toBe(q);
    }
  });

  it('offers five adjacent third-octave bands and does not always centre the target', () => {
    const positions = new Set<number>();
    for (const q of pinkQuestions('eq-8')) {
      const bands = q.options.map(o => Number(o.id));
      const start = THIRD_OCTAVE_BANDS.indexOf(bands[0]);
      expect(bands).toEqual(THIRD_OCTAVE_BANDS.slice(start, start + 5));
      expect(bands).toContain(q.frequency);
      positions.add(bands.indexOf(q.frequency!));
    }
    expect([...positions].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('explains what was right about a near miss, and stays quiet otherwise', () => {
    const q = pinkQuestions('eq-5').find(v => v.gain === 9 && v.frequency === 1000)!;
    expect(eqNearMiss(q, 'cut:1000')!.en).toContain('direction was reversed');
    expect(eqNearMiss(q, 'boost:2000')!.en).toContain('just above');
    expect(eqNearMiss(q, 'boost:500')!.en).toContain('just below');
    expect(eqNearMiss(q, 'cut:2000')!.en).toContain('direction was reversed too');
    expect(eqNearMiss(q, 'boost:8000')).toBeNull();
    expect(eqNearMiss(q, q.correct)).toBeNull();
    const region = pinkQuestions('eq-1')[0];
    expect(eqNearMiss(region, region.options.find(o => o.id !== region.correct)!.id)).toBeNull();
  });

  it('lets every labelled move of a stage be auditioned with the stage’s own settings', () => {
    for (const lesson of skillLessons('eq')) {
      const options = eqExampleOptions(lesson);
      expect(options.length).toBeGreaterThan(1);
      for (const option of options) {
        const example = makeEqExample(lesson, option.id, 'drums')!;
        expect(example).toMatchObject({ kind: 'eq', correct: option.id, source: 'drums' });
        expect(eqChoiceSetting(example, option.id)).toEqual(eqTargetMove(example));
      }
      expect(makeEqExample(lesson, 'missing', 'studio')).toBeNull();
    }
    expect(eqExampleOptions(getLesson('eq-8'))).toHaveLength(THIRD_OCTAVE_BANDS.length);
    // Matching has too many settings to label, so its bands are auditioned as ±8 dB moves.
    const matching = eqExampleOptions(getLesson('eq-match'));
    expect(matching).toHaveLength(16);
    expect(makeEqExample(getLesson('eq-match'), 'cut:500', 'pink')).toMatchObject({
      eqKind: 'direction',
      frequency: 500,
      gain: -8,
    });
  });
});

describe('EQ shapes, bandwidth and matching', () => {
  const at = (move: EqMove, hz: number) => eqMagnitudeDb(move, hz);
  it('draws the response Web Audio applies for every shape', () => {
    const bell: EqMove = { shape: 'peaking', frequency: 1000, gain: 9, q: 1.4 };
    expect(at(bell, 1000)).toBeCloseTo(9, 2);
    expect(at(bell, 100)).toBeCloseTo(0, 0);
    expect(at({ ...bell, gain: -12 }, 1000)).toBeCloseTo(-12, 2);
    // A narrower bell reaches less far from its centre.
    expect(at({ ...bell, q: 4 }, 1400)).toBeLessThan(at({ ...bell, q: 0.5 }, 1400) - 3);

    const lowCut: EqMove = { shape: 'highpass', frequency: 200, gain: 0, q: Math.SQRT1_2 };
    expect(at(lowCut, 200)).toBeCloseTo(-3.01, 1);
    expect(at(lowCut, 50)).toBeLessThan(-20);
    expect(at(lowCut, 4000)).toBeCloseTo(0, 1);
    const highCut: EqMove = { ...lowCut, shape: 'lowpass', frequency: 4000 };
    expect(at(highCut, 4000)).toBeCloseTo(-3.01, 1);
    expect(at(highCut, 16000)).toBeLessThan(-20);
    expect(at(highCut, 200)).toBeCloseTo(0, 1);

    const lowShelf: EqMove = { shape: 'lowshelf', frequency: 200, gain: 9, q: Math.SQRT1_2 };
    expect(at(lowShelf, 30)).toBeCloseTo(9, 0);
    expect(at(lowShelf, 200)).toBeCloseTo(4.5, 1);
    expect(at(lowShelf, 5000)).toBeCloseTo(0, 1);
    const highShelf: EqMove = { ...lowShelf, shape: 'highshelf', frequency: 4000 };
    expect(at(highShelf, 16000)).toBeCloseTo(9, 0);
    expect(at(highShelf, 4000)).toBeCloseTo(4.5, 1);
    expect(at(highShelf, 100)).toBeCloseTo(0, 1);
  });

  it('asks shelves and cut filters with a corner that moves, and compares shapes at that corner', () => {
    const all = pinkQuestions('eq-shape');
    expect(new Set(all.map(q => q.correct))).toEqual(
      new Set(['highpass', 'lowshelf', 'lowpass', 'highshelf']),
    );
    for (const q of all) {
      expect(q.shape).toBe(q.correct);
      expect(q.gain).toBe(q.shape === 'lowshelf' || q.shape === 'highshelf' ? 9 : 0);
      expect(q.frequency! < 1000).toBe(q.shape === 'highpass' || q.shape === 'lowshelf');
    }
    const lowCut = all.find(q => q.correct === 'highpass' && q.frequency === 320)!;
    // The other low-end shape is heard at the same corner; a high-end shape at its own.
    expect(eqComparisonMove(withAnswerComparison(lowCut, 'lowshelf'))).toEqual({
      shape: 'lowshelf',
      frequency: 320,
      gain: 9,
      q: Math.SQRT1_2,
    });
    expect(eqComparisonMove(withAnswerComparison(lowCut, 'lowpass'))!.frequency).toBe(4000);
    expect(eqNearMiss(lowCut, 'lowshelf')!.en).toContain('right end of the spectrum');
    expect(eqNearMiss(lowCut, 'highshelf')).toBeNull();
  });

  it('asks only for the width of a boost and replays the chosen width at the same centre', () => {
    for (const q of pinkQuestions('eq-width', 200)) {
      expect(q.q).toBe({ wide: 0.5, medium: 1.4, narrow: 4 }[q.correct]);
      const wrong = q.options.find(o => o.id !== q.correct)!.id;
      const c = eqComparisonMove(withAnswerComparison(q, wrong))!;
      expect(c).toMatchObject({ frequency: q.frequency, gain: 9, shape: 'peaking' });
      expect(c.q).not.toBe(q.q);
    }
  });

  it('matching scores only the exact band and amount, and previews any setting, right or wrong', () => {
    const q = pinkQuestions('eq-match').find(v => v.frequency === 1000 && v.gain === 8)!;
    expect(eqUsesMatching(q)).toBe(true);
    expect(eqUsesDirection(q)).toBe(false);
    expect(q.correct).toBe('match:1000:8');
    expect(eqMatchControls(q)).toMatchObject({
      bands: OCTAVE_BANDS,
      gains: [12, 8, 4, -4, -8, -12],
    });
    expect(evaluateAnswer(q, 'match:1000:8')).toBe(true);
    expect(evaluateAnswer(q, 'match:1000:4')).toBe(false);
    expect(evaluateAnswer(q, 'match:1000:6')).toBeNull();
    // The live preview must not give the answer away by disappearing when it is right.
    expect(eqComparisonMove(withEqPreview(q, 'match:1000:8'))).toEqual(eqTargetMove(q));
    expect(eqComparisonMove(withEqPreview(q, 'match:250:-12'))).toMatchObject({
      frequency: 250,
      gain: -12,
    });
    expect(withAnswerComparison(q, q.correct)).toBe(q);
    expect(eqNearMiss(q, 'match:1000:12')!.en).toContain('4 dB too much');
    expect(eqNearMiss(q, 'match:1000:4')!.en).toContain('4 dB too little');
    expect(eqNearMiss(q, 'match:1000:-8')!.en).toContain('direction was reversed');
    expect(eqNearMiss(q, 'match:2000:8')!.en).toContain('just above');
  });
});

describe('fair questions and suitable sources', () => {
  it('never asks for a band the source barely carries', () => {
    for (const source of eqSourceIds)
      for (const id of EQ_STAGE_IDS)
        for (let seed = 0; seed < 300; seed++) {
          const q = makeQuestion(id, seed * 7919, 0, source);
          const move = eqTargetMove(q)!;
          if (move.shape !== 'peaking') continue;
          // Width questions are fair when even their narrowest setting is audible.
          expect(
            bandAudible(source, move.frequency, q.eqKind === 'width' ? 4 : move.q),
            `${id} ${source} ${move.frequency} Hz`,
          ).toBe(true);
        }
  });
  it('drops only what is missing: the piano arrangement has no deep bass, the reference has it all', () => {
    const asked = (id: string, source: (typeof eqSourceIds)[number]) =>
      new Set(
        Array.from(
          { length: 600 },
          (_, seed) => makeQuestion(id, seed * 7919, 0, source).frequency,
        ),
      );
    expect([...asked('eq-3', 'pink')].sort((a, b) => a! - b!)).toEqual(OCTAVE_BANDS);
    expect(asked('eq-3', 'acoustic').has(63)).toBe(false);
    expect(asked('eq-3', 'acoustic').size).toBe(7);
    expect(asked('eq-7', 'acoustic').has(8000)).toBe(false);
    // Every band stays on offer as an answer even when this source never asks for it.
    expect(makeQuestion('eq-3', 1, 0, 'acoustic').options.map(o => Number(o.id))).toEqual(
      OCTAVE_BANDS,
    );
  });
  it('keeps steady noise to tone and level work', () => {
    expect(sourcesFor('eq')).toContain('pink');
    expect(sourcesFor('loudness')).toContain('pink');
    for (const skill of [
      'compression',
      'attack',
      'release',
      'masking',
      'stereo',
      'reverb',
      'delay',
    ] as const)
      expect(sourcesFor(skill)).not.toContain('pink');
    expect(sourceFor('compression', 'pink')).toBe('studio');
    expect(sourceFor('eq', 'pink')).toBe('pink');
    expect(newSession('attack-1', 'pink').source).toBe('studio');
    expect(newSession('eq-3', 'pink').source).toBe('pink');
    const base = { sessionId: 's', index: 0, correct: true, at: '2026-10-12T10:00:00.000Z' };
    expect(validAttempt({ ...base, lessonId: 'eq-3', source: 'pink' })).toBe(true);
    expect(validAttempt({ ...base, lessonId: 'attack-1', source: 'pink' })).toBe(false);
    // A personal plan started with noise selected still gives dynamics a suitable source.
    const p = startPersonal(
      { ...initialProgress(), eqSource: 'pink' },
      'placement',
      'mix',
      1,
      5,
      'p',
    );
    for (const ref of p.personal!.active!.items)
      expect(sourcesFor(getLesson(ref.lessonId).skill)).toContain(ref.source);
  });
});

describe('neighbouring bands', () => {
  it('gives the options no say in the answer: each place in the window is equally likely', () => {
    // Pink noise carries every band, so nothing is filtered out and five places are in play.
    const places = [0, 0, 0, 0, 0];
    const total = 5000;
    for (let seed = 1; seed <= total; seed++) {
      const q = makeQuestion('eq-8', seed * 7919, seed % 5, 'pink');
      const bands = q.options.map(o => Number(o.id)).sort((a, b) => a - b);
      expect(bands).toHaveLength(5);
      places[bands.indexOf(Number(q.correct))]++;
    }
    // Guessing any fixed place, or the middle one, is right one time in five.
    for (const count of places) {
      expect(count / total).toBeGreaterThan(0.17);
      expect(count / total).toBeLessThan(0.23);
    }
  });
});

describe('practice that follows the learner', () => {
  const T = Date.parse('2026-10-12T10:00:00Z');
  // A learner who always hears 1 kHz and below but misses everything above it.
  function history(rounds: number): Progress {
    let p = initialProgress();
    for (let round = 0; round < rounds; round++) {
      p = {
        ...p,
        session: {
          ...newSession('eq-3', 'pink'),
          id: `r${round}`,
          seed: round * 104729,
          started: true,
        },
      };
      for (let i = 0; i < 5; i++) {
        const q = makeQuestion('eq-3', p.session!.seed, i, 'pink');
        const choice =
          q.frequency! <= 1000 ? q.correct : q.options.find(o => o.id !== q.correct)!.id;
        p = answerQuestion(p, choice, new Date(T + round * 60_000 + i * 1000).toISOString());
        p = { ...p, session: { ...p.session!, index: Math.min(4, i + 1) } };
      }
      p = { ...p, session: null };
    }
    return p;
  }
  it('counts how each answer of a lesson has gone', () => {
    const stats = answerStats('eq-3', studyEvidence(history(8)));
    expect([...stats.values()].reduce((sum, s) => sum + s.answered, 0)).toBe(40);
    expect(stats.get('500')!.wrong).toBe(0);
    expect(stats.get('4000')!.wrong).toBe(stats.get('4000')!.answered);
  });
  it('asks more often for what the learner misses, without ever excluding the rest', () => {
    const evidence = studyEvidence(history(8));
    const count = (targeted: boolean) => {
      let high = 0,
        total = 0;
      const seen = new Set<number>();
      for (let seed = 1; seed <= 400; seed++) {
        const refs = targetedRefs('eq-3', seed * 7919, 5, 'pink', targeted ? evidence : []);
        expect(new Set(refs.map(soundIdentity)).size).toBe(5);
        for (const ref of refs) {
          const hz = refQuestion(ref).frequency!;
          seen.add(hz);
          total++;
          if (hz > 1000) high++;
        }
      }
      return { share: high / total, seen };
    };
    const plain = count(false),
      targeted = count(true);
    expect(plain.share).toBeGreaterThan(0.3);
    expect(plain.share).toBeLessThan(0.45);
    // A session never repeats a sound, so five of eight bands bound how far it can lean.
    expect(targeted.share).toBeGreaterThan(plain.share + 0.05);
    expect(targeted.seen.size).toBe(8);
    // The same history and seed always build the same session.
    expect(targetedRefs('eq-3', 99, 5, 'pink', evidence)).toEqual(
      targetedRefs('eq-3', 99, 5, 'pink', evidence),
    );
  });
  // Answers every question of a stage through `pick`, which sees the question.
  function played(
    lessonId: string,
    rounds: number,
    pick: (q: ReturnType<typeof makeQuestion>) => string,
  ): Progress {
    let p = initialProgress();
    for (let round = 0; round < rounds; round++) {
      p = {
        ...p,
        session: {
          ...newSession(lessonId, 'pink'),
          id: `${lessonId}-${round}`,
          seed: round * 104729 + 7,
          started: true,
        },
      };
      for (let i = 0; i < 5; i++) {
        const q = makeQuestion(lessonId, p.session!.seed, i, 'pink');
        p = answerQuestion(p, pick(q), new Date(T + round * 60_000 + i * 1000).toISOString());
        p = { ...p, session: { ...p.session!, index: Math.min(4, i + 1) } };
      }
      p = { ...p, session: null };
    }
    return p;
  }
  const move = (q: ReturnType<typeof makeQuestion>, id: string) => eqChoiceSetting(q, id)!;
  it('keeps the band table to counts until there is enough to name a band', () => {
    const few = eqInsights(studyEvidence(history(1)));
    expect(few.frequency.asked).toBeLessThan(BAND_MINIMUM);
    expect(few.weakest).toBeNull();
  });
  it('names the weakest band only from enough answers, and a lean only when one-sided', () => {
    const insights = eqInsights(studyEvidence(history(8)));
    expect(insights.frequency.asked).toBe(40);
    // An octave-boost stage asks for the band only: direction and amount are not judged.
    expect(insights.direction.asked).toBe(0);
    expect(insights.amount.asked).toBe(0);
    for (const band of insights.bands) {
      if (!band.asked) continue;
      expect(band.right).toBe(band.hz <= 1000 ? band.asked : 0);
    }
    if (insights.weakest) {
      expect(insights.weakest.band.hz).toBeGreaterThan(1000);
      expect(insights.weakest.band.asked).toBeGreaterThanOrEqual(8);
    }
    expect(insights.bands.find(b => b.hz === 8000)!.tooHigh).toBe(0);
    // One answer in a band can never be called its tendency.
    const one = eqInsights(studyEvidence(history(8)).slice(0, 21));
    for (const band of one.bands) if (band.asked < 8) expect(one.weakest?.band).not.toBe(band);
  });
  it('counts a reversed direction as a direction error, not as a missed band', () => {
    // The learner always finds the band and always says boost for cut and cut for boost.
    const reversed = played('eq-5', 8, q => {
      const target = eqTargetMove(q)!;
      return q.options.find(o => {
        const m = move(q, o.id);
        return m.frequency === target.frequency && Math.sign(m.gain) !== Math.sign(target.gain);
      })!.id;
    });
    const evidence = studyEvidence(reversed);
    expect(evidence.every(e => !e.correct)).toBe(true);
    const insights = eqInsights(evidence);
    expect(insights.frequency).toEqual({ asked: 40, right: 40 });
    expect(insights.direction).toEqual({ asked: 40, right: 0 });
    for (const band of insights.bands) expect(band.right).toBe(band.asked);
    expect(insights.weakest).toBeNull();
  });
  it('counts a wrong amount on the right band and direction as an amount error', () => {
    const offByOne = played('eq-match', 8, q => {
      const target = eqTargetMove(q)!;
      return q.options.find(o => {
        const m = move(q, o.id);
        return (
          m.frequency === target.frequency &&
          Math.sign(m.gain) === Math.sign(target.gain) &&
          m.gain !== target.gain
        );
      })!.id;
    });
    const insights = eqInsights(studyEvidence(offByOne));
    expect(insights.frequency).toEqual({ asked: 40, right: 40 });
    expect(insights.direction).toEqual({ asked: 40, right: 40 });
    expect(insights.amount).toEqual({ asked: 40, right: 0 });
    expect(insights.weakest).toBeNull();
  });
  it('keeps region, shape and width answers out of the band table', () => {
    const p = played('eq-1', 2, q => q.correct);
    const insights = eqInsights(studyEvidence(p));
    expect(insights.region).toEqual({ asked: 10, right: 10 });
    expect(insights.frequency.asked).toBe(0);
    expect(insights.bands.every(b => b.asked === 0)).toBe(true);
  });
});
