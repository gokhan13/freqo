import type { EqSource } from './content';

/**
 * Energy pre-check for frequency questions: a band is not asked on a source that carries
 * almost nothing there. It removes the plainly unanswerable questions and promises no more:
 * the 70 dB SPL playback level is an assumption, and what a learner hears also depends on
 * their headphones, their hearing, the room and masking by neighbouring bands. Whether a
 * question that passes is fair has to be judged by ear, on real playback.
 *
 * `SPECTRUM` holds each source's energy per third-octave band, in dB relative to the whole
 * signal (for the synthesised loops, the lowest value over their seeds). The numbers are
 * measured from the real buffers by tests/unit/source-spectrum.test.ts, which fails when a
 * source changes without this table.
 */
export const SPECTRUM_BANDS = [
  50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150,
  4000, 5000, 6300, 8000, 10000, 12500,
];
export const ABSENT = -99;
// prettier-ignore
export const SPECTRUM: Record<EqSource, number[]> = {
  studio: [-13, -6, -10, -10, -10, -11, -10, -11, -15, -19, -22, -25, -28, -30, -32, -34, -36, -37, -37, -36, -34, -32, -29, -28, -26],
  drums: [-15, -9, -11, -10, -9, -8, -8, -8, -12, -17, -20, -23, -25, -27, -27, -27, -27, -26, -25, -24, -23, -21, -20, -19, -18],
  keys: [-12, -6, -10, -10, -10, -13, -14, -16, -18, -21, -22, -24, -27, -29, -32, -35, -37, -38, -39, -38, -36, -34, -31, -30, -28],
  acoustic: [-29, -25, -21, -20, -18, -17, -13, -8, -6, -8, -6, -6, -9, -11, -15, -18, -21, -24, -27, -30, -33, -36, -41, -99, -99],
  'recorded-drums': [-14, -9, -3, -5, -8, -10, -12, -11, -15, -17, -17, -19, -21, -23, -25, -25, -23, -26, -28, -29, -30, -34, -37, -99, -99],
  pink: [-13, -13, -14, -13, -13, -13, -13, -13, -13, -13, -13, -13, -13, -13, -13, -13, -13, -13, -13, -13, -14, -14, -14, -15, -15],
};
// Threshold of hearing in quiet per band, dB SPL (ISO 226:2003).
// prettier-ignore
const HEARING_THRESHOLD = [44, 37.5, 31.5, 26.5, 22.1, 17.9, 14.4, 11.4, 8.6, 6.2, 4.4, 3, 2.2, 2.4, 3.5, 1.7, -1.3, -4.2, -6, -5.4, -1.5, 6, 12.6, 13.9, 12.3];
/** Assumed comfortable playback level of the whole signal, dB SPL. */
export const NOMINAL_LEVEL = 70;
/** A band must sit at least this far above the threshold of hearing to be asked. */
export const MIN_SENSATION_LEVEL = 18;

const nearestBand = (hz: number) =>
  SPECTRUM_BANDS.reduce(
    (best, band, i) =>
      Math.abs(Math.log(band / hz)) < Math.abs(Math.log(SPECTRUM_BANDS[best] / hz)) ? i : best,
    0,
  );
/** Bandwidth of a peaking filter in octaves between its half-gain points. */
export const bandwidthOctaves = (q: number) => (2 / Math.LN2) * Math.asinh(1 / (2 * q));

/** Energy inside an EQ band of the given centre and Q, in dB relative to the whole signal. */
export function bandShare(source: EqSource, hz: number, q: number): number {
  const centre = nearestBand(hz),
    half = Math.max(0, Math.round((3 * bandwidthOctaves(q) - 1) / 2));
  let power = 0;
  for (
    let i = Math.max(0, centre - half);
    i <= Math.min(SPECTRUM_BANDS.length - 1, centre + half);
    i++
  )
    power += 10 ** (SPECTRUM[source][i] / 10);
  return power > 0 ? Math.max(ABSENT, 10 * Math.log10(power)) : ABSENT;
}
/** How far above the threshold of hearing the band plays at a comfortable level, in dB. */
export const sensationLevel = (source: EqSource, hz: number, q: number) =>
  NOMINAL_LEVEL + bandShare(source, hz, q) - HEARING_THRESHOLD[nearestBand(hz)];
export const bandAudible = (source: EqSource, hz: number, q: number) =>
  sensationLevel(source, hz, q) >= MIN_SENSATION_LEVEL;
/** The bands of a list that pass the energy pre-check on this source; all if none do. */
export function audibleBands<T extends number>(
  source: EqSource,
  bands: readonly T[],
  q: number,
): T[] {
  const fair = bands.filter(hz => bandAudible(source, hz, q));
  return fair.length ? fair : [...bands];
}
