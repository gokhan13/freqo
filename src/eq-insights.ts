import { getLesson } from './content';
import { OCTAVE_BANDS, eqChoiceSetting, eqTargetMove } from './eq-model';
import { refQuestion, type Evidence } from './personal-model';

/** How often one part of an EQ answer was asked for, and how often that part was right. */
export type Tally = { asked: number; right: number };
export type BandInsight = Tally & {
  hz: number;
  /** Answers that named a higher or a lower band than the one that changed. */
  tooHigh: number;
  tooLow: number;
};
/**
 * An EQ answer has parts, and they are separate abilities. Each is counted on its own, so
 * naming the right band with the wrong direction is a direction error and nothing else.
 */
export type EqInsights = {
  region: Tally;
  shape: Tally;
  /** Was the band found, whatever was said about direction or amount. */
  frequency: Tally;
  /** Boost or cut, wherever the question asked for it. */
  direction: Tally;
  /** The amount, counted only where band and direction were already right. */
  amount: Tally;
  width: Tally;
  bands: BandInsight[];
  /** Named only when the evidence carries it; see the thresholds below. */
  weakest: { band: BandInsight; lean: 'higher' | 'lower' | null } | null;
};
/** Before this many frequency answers the band table shows counts and names no weak band. */
export const BAND_MINIMUM = 20;
/** A band needs this many answers of its own before it can be called the weakest… */
export const WEAK_BAND_MINIMUM = 8;
/** …and must trail the learner's overall rate by this much. */
export const WEAK_BAND_GAP = 0.15;
/** A lean needs this many misses in the band, this share of them on one side. */
export const LEAN_MINIMUM = 5;
export const LEAN_SHARE = 0.8;

const nearestOctave = (hz: number) =>
  OCTAVE_BANDS.reduce((best, band) =>
    Math.abs(Math.log(band / hz)) < Math.abs(Math.log(best / hz)) ? band : best,
  );
const rate = (tally: Tally) => (tally.asked ? tally.right / tally.asked : 0);

export function eqInsights(evidence: Evidence[]): EqInsights {
  const tally = (): Tally => ({ asked: 0, right: 0 });
  const region = tally(),
    shape = tally(),
    frequency = tally(),
    direction = tally(),
    amount = tally(),
    width = tally();
  const bands: BandInsight[] = OCTAVE_BANDS.map(hz => ({
    hz,
    asked: 0,
    right: 0,
    tooHigh: 0,
    tooLow: 0,
  }));
  const count = (into: Tally, right: boolean) => {
    into.asked++;
    if (right) into.right++;
  };
  for (const e of evidence) {
    if (e.review || !e.ref || !e.choice || getLesson(e.lessonId).skill !== 'eq') continue;
    const question = refQuestion(e.ref),
      target = eqTargetMove(question),
      chosen = eqChoiceSetting(question, e.choice),
      kind = question.eqKind;
    if (!target || !chosen || !kind) continue;
    if (kind === 'region') count(region, e.correct);
    else if (kind === 'shape') count(shape, e.correct);
    else if (kind === 'width') count(width, e.correct);
    else {
      const found = chosen.frequency === target.frequency,
        sameSign = Math.sign(chosen.gain) === Math.sign(target.gain);
      count(frequency, found);
      // Narrower bands are counted under their nearest octave.
      const band = bands.find(b => b.hz === nearestOctave(target.frequency))!;
      count(band, found);
      if (chosen.frequency > target.frequency) band.tooHigh++;
      if (chosen.frequency < target.frequency) band.tooLow++;
      if (kind === 'direction' || kind === 'match') count(direction, sameSign);
      if (kind === 'match' && found && sameSign) count(amount, chosen.gain === target.gain);
    }
  }
  let weakest: EqInsights['weakest'] = null;
  if (frequency.asked >= BAND_MINIMUM) {
    const candidates = bands.filter(
      band => band.asked >= WEAK_BAND_MINIMUM && rate(band) <= rate(frequency) - WEAK_BAND_GAP,
    );
    if (candidates.length) {
      const band = candidates.reduce((worst, b) => (rate(b) < rate(worst) ? b : worst));
      const misses = band.tooHigh + band.tooLow;
      weakest = {
        band,
        lean:
          misses >= LEAN_MINIMUM && band.tooHigh >= misses * LEAN_SHARE
            ? 'higher'
            : misses >= LEAN_MINIMUM && band.tooLow >= misses * LEAN_SHARE
              ? 'lower'
              : null,
      };
    }
  }
  return { region, shape, frequency, direction, amount, width, bands, weakest };
}
