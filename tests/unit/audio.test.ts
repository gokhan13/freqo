import { describe, expect, it } from 'vitest';
import { makeLevelPair, makeLoop, makeNotes, makeRhythm, matchLevelGroup, matchLevels, peak, rms } from '../../src/audio';
const syntheticSourceIds = ['studio', 'drums', 'keys'] as const;

describe('audio material', () => {
  it.each([-6, -3, -1, 0, 1, 3, 6])('preserves the intentional %s dB difference with identical timing and timbre', db => {
    const input = new Float32Array([0, 0.9, -0.8, 0.4, -0.2]);
    const original = new Float32Array(input);
    const { a, b } = makeLevelPair(input, db);
    expect(input).toEqual(original);
    expect(20 * Math.log10(rms(b) / rms(a))).toBeCloseTo(db, 5);
    for (let i = 0; i < a.length; i++) expect(b[i]).toBeCloseTo(a[i] * Math.pow(10, db / 20), 6);
    expect(Math.max(peak(a), peak(b))).toBeLessThanOrEqual(0.720001);
  });
  it.each([44100, 48000])('renders rhythm hits at the sample-clock positions at %s Hz', rate => {
    const slots = [0, 3, 4, 6];
    const data = makeRhythm(rate, slots, 2, 100);
    const pulse = makeRhythm(rate, [], 2, 100);
    expect(data).toEqual(makeRhythm(rate, slots, 2, 100));
    expect(data.length).toBe(Math.ceil(5 * rate));
    expect(peak(data)).toBeLessThan(0.72);
    expect(data.every(Number.isFinite)).toBe(true);
    expect(data.slice(0, Math.round(2.4 * rate))).toEqual(pulse.slice(0, Math.round(2.4 * rate)));
    for (let slot = 0; slot < 8; slot++) {
      const start = Math.round((4 + slot / 2) * 0.6 * rate);
      // Subtract the shared pulse to measure only the rhythm hit.
      const hit = Float32Array.from(data.slice(start, start + Math.round(0.065 * rate)), (value, i) => value - pulse[start + i]);
      expect(rms(hit) > 0.01).toBe(slots.includes(slot));
      expect(data[start]).toBe(pulse[start]);
      if (start > 0) expect(data[start - 1]).toBe(pulse[start - 1]);
    }
  });
  it('makes deterministic, non-silent, finite source material', () => {
    const a = makeLoop(16000, 75), b = makeLoop(16000, 75);
    expect(a).toEqual(b);
    expect(a.length).toBe(64000);
    expect(rms(a)).toBeGreaterThan(0.03);
    expect(peak(a)).toBeLessThan(1);
    expect(a.every(Number.isFinite)).toBe(true);
    expect(Math.abs(a[0])).toBe(0);
  });
  it('matches RMS while keeping shared headroom below clipping', () => {
    const a = new Float32Array([0.2, -0.6, 0.4]);
    const b = new Float32Array([0.9, -3, 0.3]);
    const result = matchLevels(a, b);
    expect(Math.abs(result.dryRms - result.wetRms)).toBeLessThan(1e-6);
    expect(result.maxPeak).toBeLessThanOrEqual(0.720001);
  });
  it('handles silence without NaN or division by zero', () => {
    const result = matchLevels(new Float32Array(20), new Float32Array(20));
    expect(result.dryRms).toBe(0);
    expect(result.wetRms).toBe(0);
    expect(result.maxPeak).toBe(0);
  });
  it('renders different pitches and complete chords without clipping', () => {
    const a = makeNotes(16000, [60, 64]);
    const b = makeNotes(16000, [60, 67]);
    expect(a.length).toBe(b.length);
    expect(a).not.toEqual(b);
    expect(peak(makeNotes(16000, [60, 64, 67], true))).toBeLessThan(1);
  });
  it.each(syntheticSourceIds)('%s source is deterministic, audible and unclipped', source => {
    const a = makeLoop(16000, 75, source);
    expect(a).toEqual(makeLoop(16000, 75, source));
    expect(rms(a)).toBeGreaterThan(0.03);
    expect(peak(a)).toBeLessThan(1);
    expect(a.every(Number.isFinite)).toBe(true);
  });
  it('source choices actually produce different material', () => {
    const buffers = syntheticSourceIds.map(source => makeLoop(16000, 75, source));
    for (let i = 0; i < buffers.length; i++) for (let j = i + 1; j < buffers.length; j++) expect(buffers[i]).not.toEqual(buffers[j]);
  });
  it('matches all three comparison buffers using shared headroom', () => {
    const buffers = [new Float32Array([0.2, -0.6, 0.4]), new Float32Array([0.9, -3, 0.3]), new Float32Array([-0.4, 1, 0.8])];
    matchLevelGroup(buffers);
    for (const buffer of buffers) {
      expect(rms(buffer)).toBeCloseTo(rms(buffers[0]), 6);
      expect(peak(buffer)).toBeLessThanOrEqual(0.720001);
    }
  });
});
