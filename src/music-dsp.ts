import { degreeMidi, readSequence } from './music-model';
import type { MusicSpec } from './music-types';
export type MusicVariant = 'a' | 'c' | 'context' | 'resolution' | 'capture';
export type MusicEvent = { at: number; duration: number; notes?: number[]; hz?: number; amplitude: number };
export type MusicTimeline = { events: MusicEvent[]; duration: number; responseStart?: number; responseEnd?: number };
export function musicTimeline(m: MusicSpec, variant: MusicVariant = 'a'): MusicTimeline {
  const events: MusicEvent[] = [];
  const beat = 60 / m.tempo;
  const note = (at: number, notes: number[], duration = 0.42) => events.push({ at, duration, notes, amplitude: notes.length > 1 ? 0.18 / Math.sqrt(notes.length) : 0.28 });
  const click = (at: number, hz: number, amplitude: number) => events.push({ at, duration: 0.055, hz, amplitude });
  const count = (at: number) => { for (let i = 0; i < 4; i++) click(at + i * beat, i === 0 ? 1320 : 880, 0.2); };
  const pulse = (at: number) => { for (let i = 0; i < 4; i++) click(at + i * beat, 660, 0.045); };
  const pattern = (at: number, slots: number[]) => { pulse(at); slots.forEach(slot => click(at + slot * beat / m.subdivision, 220, 0.36)); };
  if (variant === 'capture') {
    count(0); pattern(4 * beat, m.slots); count(8 * beat); pulse(12 * beat);
    return { events, responseStart: 12 * beat, responseEnd: 16 * beat, duration: 16 * beat + 0.3 };
  }
  if (m.response === 'rhythm' || m.response === 'tap') {
    count(0);
    if (variant === 'c' && m.comparisonChoice) {
      const slots = readSequence(m.comparisonChoice, 'rhythm');
      if (slots) pattern(4 * beat, slots);
      else { pulse(4 * beat); (readSequence(m.comparisonChoice, 'tap') ?? []).forEach(ms => click(4 * beat + ms / 1000, 220, 0.36)); }
    } else pattern(4 * beat, m.slots);
    return { events, duration: 8 * beat + 0.3 };
  }
  m.context.forEach((chord, i) => note(i * 0.5, chord, 0.44));
  if (variant === 'context') return { events, duration: 2.15 };
  let at = 2.3;
  if (variant === 'resolution') { note(at, [degreeMidi(m.tonic, m.degrees[0])]); note(at + 0.6, [m.tonic]); return { events, duration: at + 1.2 }; }
  if (m.response === 'melody') {
    count(at); at += 4 * beat;
    const degrees = variant === 'c' && m.comparisonChoice ? readSequence(m.comparisonChoice, 'melody') ?? m.degrees : m.degrees;
    degrees.forEach((degree, i) => { if (degree) note(at + i * beat, [degreeMidi(m.tonic, degree)], beat * 0.72); });
    return { events, duration: at + degrees.length * beat + 0.2 };
  }
  if (variant === 'c' && m.comparisonChoice) {
    const candidate = m.candidates[m.comparisonChoice] ?? (m.skill === 'degree' ? [[degreeMidi(m.tonic, Number(m.comparisonChoice))]] : []);
    candidate.forEach((chord, i) => note(at + i * 0.65, chord, 0.55));
    return { events, duration: at + candidate.length * 0.65 + 0.2 };
  }
  if (m.skill === 'tonic') { m.phrase.forEach((midi, i) => note(at + i * 0.48, [midi], 0.4)); return { events, duration: at + m.phrase.length * 0.48 + 0.2 }; }
  m.target.forEach((chord, i) => note(at + i * 0.65, chord, 0.55));
  return { events, duration: at + m.target.length * 0.65 + 0.2 };
}
export function renderMusicTimeline(timeline: MusicTimeline, rate: number): Float32Array<ArrayBuffer> {
  const data = new Float32Array(Math.ceil(timeline.duration * rate));
  for (const event of timeline.events) {
    const start = Math.round(event.at * rate), length = Math.ceil(event.duration * rate);
    const frequencies = event.notes?.map(midi => 440 * 2 ** ((midi - 69) / 12)) ?? [event.hz!];
    for (let i = 0; i < length && start + i < data.length; i++) {
      const t = i / rate;
      const envelope = event.hz ? Math.min(1, t / 0.002) * (1 - i / length) ** 3 : Math.min(1, t / 0.01) * Math.min(1, (event.duration - t) / 0.045) * Math.exp(-t * 1.1);
      let value = 0;
      for (const hz of frequencies) value += Math.sin(2 * Math.PI * hz * t) + (event.notes ? 0.16 * Math.sin(4 * Math.PI * hz * t) : 0);
      if (start + i >= 0) data[start + i] += value * envelope * event.amplitude;
    }
  }
  // Dense, incorrect tap responses can overlap clicks. Keep their replay within headroom.
  // Ordinary tones/patterns already fit and retain their fixed gain.
  let peak = 0; for (const value of data) peak = Math.max(peak, Math.abs(value));
  if (peak > 0.72) { const gain = 0.72 / peak; for (let i = 0; i < data.length; i++) data[i] *= gain; }
  return data;
}
export const makeMusicAudio = (rate: number, spec: MusicSpec, variant: MusicVariant = 'a') => renderMusicTimeline(musicTimeline(spec, variant), rate);
export const makeCandidateAudio = (rate: number, notes: number[][]) => renderMusicTimeline({ events: notes.map((chord, i) => ({ at: i * 0.65, duration: 0.55, notes: chord, amplitude: chord.length > 1 ? 0.18 / Math.sqrt(chord.length) : 0.28 })), duration: notes.length * 0.65 + 0.2 }, rate);
