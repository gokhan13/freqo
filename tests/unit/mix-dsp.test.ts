import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { advancedLessons } from '../../src/advanced-content';
import { makeQuestion, withAnswerComparison } from '../../src/model';
import { centre, compressStereo, echo, matchStereoLevels, monoSum, panStereo, renderMix, reverberate, signalInfo, stereoPeak, stereoRms, widen } from '../../src/mix-dsp';
import { encodeWav } from '../../src/wav';
import type { Material, Stereo } from '../../src/mix-types';

const power = (data: Float32Array) => Math.sqrt(data.reduce((sum, value) => sum + value * value, 0) / Math.max(1, data.length));
const difference = (a: Stereo, b: Stereo) => stereoRms([Float32Array.from(a[0], (v, i) => v - b[0][i]), Float32Array.from(a[1], (v, i) => v - b[1][i])]);
function decoded(name: string) {
  const bytes = readFileSync(`public/audio/${name}.wav`);
  expect(bytes.toString('ascii', 0, 4)).toBe('RIFF'); expect(bytes.toString('ascii', 8, 12)).toBe('WAVE');
  expect(bytes.readUInt16LE(20)).toBe(1); expect(bytes.readUInt16LE(22)).toBe(1);
  expect(bytes.readUInt32LE(24)).toBe(22050); expect(bytes.readUInt16LE(34)).toBe(16);
  return Float32Array.from({ length: bytes.readUInt32LE(40) / 2 }, (_, i) => bytes.readInt16LE(44 + i * 2) / 32768);
}
const material: Material = { lead: decoded('recorded-lead'), bed: decoded('recorded-bed'), hits: decoded('recorded-hits') };
const rate = 22050;

describe('stereo dynamics and spatial processing', () => {
  it('compresses above-threshold peaks and links channel gains without altering balance', () => {
    const input: Stereo = [new Float32Array(16000).fill(0.6), new Float32Array(16000).fill(0.3)];
    const output = compressStereo(input, 16000, { threshold: -24, ratio: 8, attackMs: 2, releaseMs: 180 });
    expect(output[0][15000]).toBeLessThan(0.15);
    expect(output[0][15000] / output[1][15000]).toBeCloseTo(2, 5);
    expect(compressStereo(input, 16000, { ratio: 1 })).toEqual(input);
  });
  it('fast attack suppresses the leading edge; slow release carries reduction into the quiet gap', () => {
    const input = new Float32Array(16000).fill(0.03); input.fill(0.65, 0, 1600);
    const fast = compressStereo(centre(input), 16000, { attackMs: 1, releaseMs: 20 });
    const slowAttack = compressStereo(centre(input), 16000, { attackMs: 60, releaseMs: 20 });
    const slowRelease = compressStereo(centre(input), 16000, { attackMs: 1, releaseMs: 600 });
    expect(power(fast[0].slice(16, 160))).toBeLessThan(power(slowAttack[0].slice(16, 160)));
    expect(power(fast[0].slice(3200, 4800))).toBeGreaterThan(power(slowRelease[0].slice(3200, 4800)) * 2);
  });
  it('equal-power pan preserves total channel energy and reaches the appropriate channel', () => {
    const input = new Float32Array([0.2, -0.5, 0.1]);
    const left = panStereo(input, -1), right = panStereo(input, 1), middle = panStereo(input, 0);
    expect(power(left[1])).toBe(0); expect(power(right[0])).toBeLessThan(1e-9);
    expect(stereoRms(left)).toBeCloseTo(stereoRms(middle), 7); expect(stereoRms(right)).toBeCloseTo(stereoRms(middle), 7);
  });
  it('M/S width preserves mid, and a polarity flip cancels correlated channels in mono', () => {
    const input: Stereo = [new Float32Array([0.5, -0.2, 0.3]), new Float32Array([0.1, 0.4, -0.3])];
    const wide = widen(input, 1.8);
    for (let i = 0; i < input[0].length; i++) expect(monoSum(wide)[i]).toBeCloseTo(monoSum(input)[i], 6);
    const opposite: Stereo = [input[0], Float32Array.from(input[0], v => -v)];
    expect(power(monoSum(opposite))).toBe(0); expect(signalInfo(opposite).correlation).toBeCloseTo(-1, 8);
    expect(signalInfo(centre(input[0])).correlation).toBeCloseTo(1, 8);
    expect(stereoPeak(opposite)).toBeGreaterThan(0);
  });
  it('delay onset, feedback and ping-pong channels follow exact sample positions', () => {
    const input = new Float32Array(16000); input[0] = 0.5;
    const centred = echo(centre(input), 16000, { delayMs: 125, wet: 0.5, feedback: 0.4 });
    expect(centred[0][1999]).toBe(0); expect(centred[0][2000]).toBeCloseTo(0.25, 6);
    expect(centred[0][4000]).toBeCloseTo(0.1, 6); expect(centred[0][6000]).toBeCloseTo(0.04, 6);
    const ping = echo(centre(input), 16000, { delayMs: 125, wet: 0.5, feedback: 0.4, pingPong: true });
    expect(ping[1][2000]).toBe(0); expect(ping[0][2000]).toBeCloseTo(0.25 * Math.SQRT2, 6);
    expect(ping[0][4000]).toBe(0); expect(ping[1][4000]).toBeCloseTo(0.1 * Math.SQRT2, 6);
  });
  it('reverb pre-delay shifts the wet response and longer decay retains a longer tail', () => {
    const input = new Float32Array(16000 * 4); input[0] = 0.5;
    const dry = centre(input), first = reverberate(dry, 16000, { wet: 0.5, decay: 1.5 });
    const delayed = reverberate(dry, 16000, { wet: 0.5, decay: 1.5, preDelayMs: 80 });
    for (let i = 1; i < 1280; i++) expect(delayed[0][i]).toBe(0);
    expect([...delayed[0].slice(1281, 3200)]).toEqual([...first[0].slice(1, 1920)]);
    const short = reverberate(dry, 16000, { wet: 0.5, decay: 0.5 });
    const long = reverberate(dry, 16000, { wet: 0.5, decay: 3 });
    expect(power(long[0].slice(16000, 32000))).toBeGreaterThan(power(short[0].slice(16000, 32000)) * 10);
    expect(reverberate(dry, 16000, { wet: 0 })).toEqual(dry);
  });
  it('joint RMS matching uses one shared peak trim and leaves solo at its in-mix scale', () => {
    const a = centre(new Float32Array([0.2, -0.6, 0.4])), b = centre(new Float32Array([0.9, -3, 0.3]));
    const solo = centre(new Float32Array([0.1, -0.3, 0.2]));
    matchStereoLevels([a, b], solo);
    expect(stereoRms(a)).toBeCloseTo(stereoRms(b), 6); expect(stereoPeak(b)).toBeLessThanOrEqual(0.720001);
    expect(stereoRms(solo) / stereoRms(a)).toBeCloseTo(0.5, 6);
    const silence = centre(new Float32Array(8)); matchStereoLevels([silence, centre(new Float32Array(8))]);
    expect(stereoRms(silence)).toBe(0);
  });
  it('custom stereo polarity processing preserves the actual left channel', () => {
    const input: Stereo = [new Float32Array([0.1, 0.3, -0.2]), new Float32Array([0.3, 0.1, -0.2])];
    const q = makeQuestion('stereo-3', 123, 0); q.mix!.target.invert = true;
    const result = renderMix({ lead: monoSum(input), bed: new Float32Array(3), hits: new Float32Array(3) }, rate, q.mix!, q.seed, 'acoustic', input);
    expect(result.a[0]).toEqual(input[0]); expect(result.b[0]).toEqual(input[0]);
    expect(result.b[1]).toEqual(Float32Array.from(input[1], v => -v));
  });
  it('custom masking preserves both target channels and processes only the stereo backing', () => {
    const target: Stereo = [new Float32Array([0.2, 0.1, -0.3, 0.2]), new Float32Array([-0.1, 0.3, -0.2, 0.1])];
    const bed: Stereo = [new Float32Array([0.1, -0.2, 0.1, 0.1]), new Float32Array([-0.2, 0.1, 0.2, 0.1])];
    const spec = makeQuestion('masking-2', 333, 0).mix!;
    const empty = new Float32Array(4);
    const result = renderMix({ lead: monoSum(target), bed: monoSum(bed), hits: empty, backingStereo: bed }, rate, spec, 333, 'acoustic', target);
    const scale = result.solo![0][0] / target[0][0];
    for (const channel of [0, 1] as const) for (let i = 0; i < 4; i++) {
      expect(result.solo![channel][i]).toBeCloseTo(target[channel][i] * scale, 6);
      expect(result.a[channel][i]).toBeCloseTo((target[channel][i] + bed[channel][i] * 0.8) * scale, 6);
    }
    expect(difference(result.a, result.b)).toBeGreaterThan(0.001);
    expect(result.solo![0]).not.toEqual(result.solo![1]);
  });
});

describe('real acoustic assets and rendered lesson alternatives', () => {
  it('checks pinned adaptation hashes, audibility and boundaries for all five local recordings', () => {
    const manifest = JSON.parse(readFileSync('public/audio/recordings.json', 'utf8'));
    for (const asset of manifest.derived) {
      const bytes = readFileSync(`public/audio/${asset.file}`);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      const samples = decoded(asset.file.replace('.wav', ''));
      expect(samples).toHaveLength(88200); expect(power(samples)).toBeGreaterThan(0.01);
      expect(stereoPeak(centre(samples))).toBeLessThanOrEqual(0.650001);
      expect(samples.every(Number.isFinite)).toBe(true); expect(Math.max(...samples.slice(0, 1).map(Math.abs))).toBe(0);
      expect(Math.abs(samples.at(-1)!)).toBe(0);
    }
  });
  it.each(advancedLessons)('$id: correct and wrong settings render distinct, finite, matched stereo signals', lesson => {
    const original = makeQuestion(lesson.id, 333, 0, 'acoustic');
    for (const target of original.options) {
    const q = { ...original, correct: target.id, mix: { ...original.mix!, target: original.mix!.alternatives[target.id] } };
    for (const option of q.options.filter(o => o.id !== q.correct)) {
      const comparison = withAnswerComparison(q, option.id);
      const rendered = renderMix(material, rate, comparison.mix!, q.seed, 'acoustic');
      for (const buffer of [rendered.a, rendered.b, rendered.c!]) {
        expect(buffer[0].every(Number.isFinite) && buffer[1].every(Number.isFinite)).toBe(true);
        expect(stereoPeak(buffer)).toBeLessThanOrEqual(0.720001);
        expect(stereoRms(buffer)).toBeCloseTo(stereoRms(rendered.a), 6);
      }
      expect(difference(rendered.b, rendered.c!) / stereoRms(rendered.b)).toBeGreaterThan(0.001);
      expect(rendered.a[0].length).toBe(rate * (['reverb', 'delay'].includes(q.mix!.effect) ? 8 : 4));
      if (lesson.skill === 'masking') expect(stereoRms(rendered.solo!)).toBeGreaterThan(0.005);
    }
    }
  });
});

describe('processed preview WAV', () => {
  it('encodes a standard interleaved PCM16 stereo header and clips only out-of-range input', () => {
    const bytes = Buffer.from(encodeWav([new Float32Array([0.5, -0.5, 2]), new Float32Array([-0.25, 0.25, -2])], 48000));
    expect(bytes.toString('ascii', 0, 4)).toBe('RIFF'); expect(bytes.readUInt32LE(4)).toBe(48);
    expect(bytes.readUInt16LE(22)).toBe(2); expect(bytes.readUInt32LE(24)).toBe(48000);
    expect(bytes.readUInt32LE(28)).toBe(192000); expect(bytes.readUInt16LE(32)).toBe(4); expect(bytes.readUInt32LE(40)).toBe(12);
    expect(bytes.readInt16LE(44)).toBe(16384); expect(bytes.readInt16LE(46)).toBe(-8192);
    expect(bytes.readInt16LE(52)).toBe(32767); expect(bytes.readInt16LE(54)).toBe(-32767);
  });
});
