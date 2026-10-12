import { getLesson } from './content';
import { OCTAVE_BANDS, eqChoiceSetting, eqTargetMove } from './eq-model';
import { refQuestion, type Evidence } from './personal-model';

export type BandInsight = {
  hz: number;
  answered: number;
  correct: number;
  /** Wrong answers that named a higher or a lower band than the target. */
  tooHigh: number;
  tooLow: number;
};
export type EqInsights = {
  bands: BandInsight[];
  answered: number;
  boosts: { answered: number; correct: number };
  cuts: { answered: number; correct: number };
  /** The band that most needs work, once there is enough to say so. */
  weakest: BandInsight | null;
};
export const EQ_INSIGHT_MINIMUM = 10;
const nearestOctave = (hz: number) =>
  OCTAVE_BANDS.reduce((best, band) =>
    Math.abs(Math.log(band / hz)) < Math.abs(Math.log(best / hz)) ? band : best,
  );

/**
 * Which octave bands the learner hears reliably and which they confuse, from every fresh EQ
 * answer that named a frequency. Narrower bands are counted under their nearest octave.
 */
export function eqInsights(evidence: Evidence[]): EqInsights {
  const bands = OCTAVE_BANDS.map(hz => ({ hz, answered: 0, correct: 0, tooHigh: 0, tooLow: 0 }));
  const boosts = { answered: 0, correct: 0 },
    cuts = { answered: 0, correct: 0 };
  for (const e of evidence) {
    if (e.review || !e.ref || !e.choice || getLesson(e.lessonId).skill !== 'eq') continue;
    const question = refQuestion(e.ref),
      target = eqTargetMove(question);
    // Regions, shapes and widths are not answers about a band.
    if (
      !target ||
      target.shape !== 'peaking' ||
      question.eqKind === 'region' ||
      question.eqKind === 'width'
    )
      continue;
    const band = bands.find(b => b.hz === nearestOctave(target.frequency))!,
      direction = target.gain > 0 ? boosts : cuts;
    band.answered++;
    direction.answered++;
    if (e.correct) {
      band.correct++;
      direction.correct++;
      continue;
    }
    const chosen = eqChoiceSetting(question, e.choice);
    if (chosen && chosen.frequency > target.frequency) band.tooHigh++;
    if (chosen && chosen.frequency < target.frequency) band.tooLow++;
  }
  const answered = bands.reduce((sum, band) => sum + band.answered, 0);
  const judged = bands.filter(band => band.answered >= 3 && band.correct < band.answered);
  const weakest =
    answered >= EQ_INSIGHT_MINIMUM && judged.length
      ? judged.reduce((worst, band) =>
          band.correct / band.answered < worst.correct / worst.answered ? band : worst,
        )
      : null;
  return { bands, answered, boosts, cuts, weakest };
}
