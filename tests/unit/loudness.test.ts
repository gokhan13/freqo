import { describe, expect, it } from 'vitest';
import { makePinkNoise, rms } from '../../src/audio';
import { kWeightedPower, loudnessDb, loudnessMatch } from '../../src/loudness';
import { filterMono } from '../../src/mix-dsp';

const sine = (hz: number, rate: number, amplitude = 1, seconds = 1) =>
  Float32Array.from(
    { length: rate * seconds },
    (_, i) => amplitude * Math.sin((2 * Math.PI * hz * i) / rate),
  );

describe('BS.1770 K-weighted loudness', () => {
  it.each([44100, 48000])(
    'reads the standard reference: a full-scale 997 Hz sine is −3.01 LKFS at %i Hz',
    rate => {
      expect(loudnessDb([sine(997, rate)], rate)).toBeCloseTo(-3.01, 1);
    },
  );
  it('weights highs up and deep lows down relative to 1 kHz', () => {
    const level = (hz: number) => loudnessDb([sine(hz, 48000)], 48000);
    expect(level(8000) - level(1000)).toBeGreaterThan(2.5);
    expect(level(8000) - level(1000)).toBeLessThan(4.5);
    expect(level(40) - level(1000)).toBeLessThan(-3);
    expect(level(100) - level(1000)).toBeLessThan(0);
    expect(level(100) - level(1000)).toBeGreaterThan(-2);
  });
  it('sums channels and follows level changes exactly', () => {
    const tone = sine(997, 48000, 0.25);
    expect(loudnessDb([tone, tone], 48000) - loudnessDb([tone], 48000)).toBeCloseTo(3.01, 2);
    const half = Float32Array.from(tone, value => value / 2);
    expect(loudnessDb([half], 48000) - loudnessDb([tone], 48000)).toBeCloseTo(-6.02, 2);
    expect(loudnessMatch([tone], [half], 48000)).toBeCloseTo(2, 5);
  });
  it('treats silence without NaN', () => {
    const silence = new Float32Array(480);
    expect(kWeightedPower([silence], 48000)).toBe(0);
    expect(loudnessMatch([silence], [silence], 48000)).toBe(1);
    expect(loudnessMatch([sine(997, 48000)], [silence], 48000)).toBe(1);
    expect(Number.isFinite(loudnessDb([silence], 48000))).toBe(true);
  });
  it('turns a treble boost down further than plain RMS would', () => {
    const noise = makePinkNoise(48000, 1);
    const bright = filterMono(noise, 48000, 8000, 9);
    const byRms = rms(noise) / rms(bright);
    const byLoudness = loudnessMatch([noise], [bright], 48000);
    expect(byLoudness).toBeLessThan(byRms);
    // A bass boost is the other way round: RMS over-counts energy the ear weights down.
    const heavy = filterMono(noise, 48000, 40, 9);
    expect(loudnessMatch([noise], [heavy], 48000)).toBeGreaterThan(rms(noise) / rms(heavy));
  });
});

describe('pink noise source', () => {
  it('is deterministic, loops without a seam and carries equal energy per octave', () => {
    const noise = makePinkNoise(48000);
    expect(noise).toEqual(makePinkNoise(48000));
    expect(noise.length).toBe(48000 * 4);
    expect(rms(noise)).toBeCloseTo(0.1, 4);
    // The step across the loop point is no larger than an ordinary step inside the loop.
    let largest = 0;
    for (let i = 1; i < noise.length; i++)
      largest = Math.max(largest, Math.abs(noise[i] - noise[i - 1]));
    expect(Math.abs(noise[0] - noise.at(-1)!)).toBeLessThanOrEqual(largest);
    const octave = (hz: number) => {
      const band = filterMono(noise, 48000, hz, 0, true);
      return 20 * Math.log10(rms(band));
    };
    const levels = [125, 250, 500, 1000, 2000, 4000, 8000].map(octave);
    expect(Math.max(...levels) - Math.min(...levels)).toBeLessThan(1.5);
  });
});
