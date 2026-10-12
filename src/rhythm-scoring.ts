export type TapScore = { correct: boolean; expected: number[]; actual: number[]; offset: number; errors: number[]; meanError: number | null; countMatches: boolean };
export const median = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2 : 0; };
// Compensate one small constant offset. Tempo drift, missing/extra taps and local errors remain visible.
export function scoreTaps(slots: number[], subdivision: number, tempo: number, actual: number[], tolerance: number): TapScore {
  const expected = slots.map(slot => slot * 60000 / tempo / subdivision);
  const countMatches = expected.length === actual.length;
  const differences = countMatches ? actual.map((time, i) => time - expected[i]) : [];
  const offset = Math.max(-250, Math.min(250, median(differences)));
  const errors = differences.map(delta => delta - offset);
  const meanError = errors.length ? errors.reduce((sum, e) => sum + Math.abs(e), 0) / errors.length : null;
  const valid = actual.every((v, i) => Number.isFinite(v) && (i === 0 || v > actual[i - 1])) && actual.length > 0;
  return { correct: valid && countMatches && errors.every(e => Math.abs(e) <= tolerance), expected, actual, offset, errors, meanError, countMatches };
}
