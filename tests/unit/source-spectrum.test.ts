import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makeLoop, makePinkNoise } from '../../src/audio';
import { eqSourceIds, type EqSource } from '../../src/content';
import {
  ABSENT,
  MIN_SENSATION_LEVEL,
  SPECTRUM,
  SPECTRUM_BANDS,
  audibleBands,
  bandAudible,
  bandShare,
  bandwidthOctaves,
  sensationLevel,
} from '../../src/source-spectrum';

function recording(name: string) {
  const bytes = readFileSync(`public/audio/${name}.wav`);
  const rate = bytes.readUInt32LE(24),
    data = new Float32Array((bytes.length - 44) / 2);
  for (let i = 0; i < data.length; i++) data[i] = bytes.readInt16LE(44 + i * 2) / 32768;
  return { data, rate };
}
// Energy through a third-octave band-pass, in dB relative to the whole signal. The filter
// runs twice over the loop so its start-up transient is not measured.
function share(data: Float32Array, rate: number, hz: number) {
  if (hz >= rate * 0.45) return ABSENT;
  const w = (2 * Math.PI * hz) / rate,
    alpha = Math.sin(w) / (2 * 4.3),
    a0 = 1 + alpha;
  const b0 = alpha / a0,
    b2 = -alpha / a0,
    a1 = (-2 * Math.cos(w)) / a0,
    a2 = (1 - alpha) / a0;
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0,
    band = 0,
    total = 0;
  for (let pass = 0; pass < 2; pass++) {
    band = 0;
    total = 0;
    for (let i = 0; i < data.length; i++) {
      const x = data[i],
        y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      band += y * y;
      total += x * x;
    }
  }
  return Math.max(ABSENT, 10 * Math.log10(band / total));
}
const seeds = Array.from({ length: 24 }, (_, i) => (i + 1) * 7919);
const buffers: Record<EqSource, { data: Float32Array; rate: number }[]> = {
  studio: seeds.map(seed => ({ data: makeLoop(48000, seed, 'studio'), rate: 48000 })),
  drums: seeds.map(seed => ({ data: makeLoop(48000, seed, 'drums'), rate: 48000 })),
  keys: seeds.map(seed => ({ data: makeLoop(48000, seed, 'keys'), rate: 48000 })),
  acoustic: [recording('acoustic')],
  'recorded-drums': [recording('recorded-drums')],
  pink: [{ data: makePinkNoise(48000), rate: 48000 }],
};

describe('source spectrum table', () => {
  it.each(eqSourceIds)(
    '%s: the stored band energies are the ones measured from the real buffers',
    source => {
      const measured = SPECTRUM_BANDS.map(hz =>
        Math.round(Math.min(...buffers[source].map(b => share(b.data, b.rate, hz)))),
      );
      // If a source changes, replace its row in src/source-spectrum.ts with this measurement.
      expect(SPECTRUM[source], `measured: ${JSON.stringify(measured)}`).toEqual(measured);
    },
    60_000,
  );
  it('widens the measured band with the width of the EQ', () => {
    expect(bandwidthOctaves(1.4)).toBeCloseTo(1, 1);
    expect(bandwidthOctaves(4.3)).toBeCloseTo(0.33, 1);
    expect(bandShare('pink', 1000, 4.3)).toBeCloseTo(-13, 0);
    // Pink noise carries the same energy in every band, so a band three times as wide
    // carries about 4.8 dB more.
    expect(bandShare('pink', 1000, 1.4) - bandShare('pink', 1000, 4.3)).toBeCloseTo(4.8, 0);
    expect(bandShare('pink', 1000, 0.5)).toBeGreaterThan(bandShare('pink', 1000, 1.4));
  });
  it('asks the reference source for every band and withholds only what a source lacks', () => {
    const octaves = [63, 125, 250, 500, 1000, 2000, 4000, 8000];
    for (const q of [0.7, 1, 1.4, 3, 4.3])
      expect(audibleBands('pink', octaves, q), `pink Q ${q}`).toEqual(octaves);
    for (const source of ['studio', 'drums', 'keys'] as const)
      expect(audibleBands(source, octaves, 1.4), source).toEqual(octaves);
    expect(bandAudible('acoustic', 63, 1.4)).toBe(false);
    expect(bandAudible('acoustic', 125, 1.4)).toBe(true);
    expect(bandAudible('acoustic', 8000, 1.4)).toBe(true);
    expect(bandAudible('acoustic', 8000, 4.3)).toBe(false);
    // The recordings were prepared at 22.05 kHz: there is nothing to ask about above 10 kHz.
    expect(bandShare('recorded-drums', 12500, 4.3)).toBe(ABSENT);
    expect(sensationLevel('acoustic', 12500, 4.3)).toBeLessThan(MIN_SENSATION_LEVEL);
    // A list with nothing audible is returned whole rather than leaving no question to ask.
    expect(audibleBands('acoustic', [12500], 4.3)).toEqual([12500]);
  });
});
