import { describe, expect, it } from 'vitest';
import { musicLessons } from '../../src/music-content';
import { advanceQuestion, answerQuestion, initialProgress, makeQuestion, parseProgress, withAnswerComparison, type Progress } from '../../src/model';
import { degreeMidi, evaluateAnswer, melodyChoice, readSequence, rhythmChoice, tapChoice } from '../../src/music-model';
import { makeMusicAudio, musicTimeline } from '../../src/music-dsp';
import { scoreTaps } from '../../src/rhythm-scoring';
import { createBackup, mergeProgress, readBackup } from '../../src/backup';
const magnitude = (data: Float32Array, rate: number, at: number, hz: number, duration = 0.1) => {
  let re = 0, im = 0; const length = Math.round(duration * rate), start = Math.round(at * rate);
  for (let i = 0; i < length; i++) { re += data[start + i] * Math.cos(2 * Math.PI * hz * i / rate); im += data[start + i] * Math.sin(2 * Math.PI * hz * i / rate); }
  return 2 * Math.hypot(re, im) / length;
};
describe('musicianship answers and persisted practice', () => {
  it.each(musicLessons)('$id: five answers, reload and idempotent backup preserve the response', lesson => {
    let p: Progress = { ...initialProgress(), session: { id: lesson.id, lessonId: lesson.id, seed: 123, index: 0, started: true, answers: [] } };
    for (let i = 0; i < 5; i++) {
      const q = makeQuestion(lesson.id, 123, i); const original = JSON.stringify(q);
      expect(evaluateAnswer(q, 'invalid')).toBeNull(); expect(answerQuestion(p, 'invalid')).toBe(p);
      p = answerQuestion(p, q.correct); expect(p.session?.answers[i].correct).toBe(true);
      const once = p; expect(answerQuestion(p, q.correct)).toBe(once);
      expect(JSON.stringify(q)).toBe(original);
      const reload = parseProgress(JSON.stringify(p)); expect(reload).toEqual(p);
      const backup = readBackup(JSON.stringify(createBackup(p))); expect(backup).toEqual(p);
      expect(mergeProgress(p, backup)).toEqual(p);
      p = advanceQuestion(reload);
    }
    expect(p.results[0]).toMatchObject({ total: 5, correct: 5 }); expect(p.attempts).toHaveLength(5); expect(p.attempts.every(a => a.response?.seed === 123)).toBe(true);
    expect(readBackup(JSON.stringify(createBackup(p)))).toEqual(p);
  });
  it('rejects malformed, overlong, duplicate, out-of-range and incomplete written responses', () => {
    const melody = makeQuestion('melodic-dictation-3', 7, 0), rhythm = makeQuestion('rhythmic-dictation-3', 7, 0), tap = makeQuestion('rhythm-repeat-3', 7, 0);
    for (const value of ['melody:1,2', 'melody:1,2,3,4,5,8', 'melody:1,2,3,4,5,NaN', 'melody:01,2,3,4,5,6']) expect(evaluateAnswer(melody, value)).toBeNull();
    for (const value of ['rhythm:', 'rhythm:0,0', 'rhythm:3,2', 'rhythm:-1,0', 'rhythm:0,16']) expect(evaluateAnswer(rhythm, value)).toBeNull();
    for (const value of ['tap:', 'tap:0,0', 'tap:0,-1', 'tap:NaN', 'tap:-251,0', 'tap:99999', `tap:${Array.from({ length: 33 }, (_, i) => i * 10).join(',')}`]) expect(evaluateAnswer(tap, value)).toBeNull();
    expect(readSequence(`tap:${'1,'.repeat(300)}0`, 'tap')).toBeNull();
  });
  it('keeps an incorrect written answer and rejects a forged score on reload', () => {
    const q = makeQuestion('melodic-dictation-1', 11, 0);
    const degrees = [...q.music!.degrees]; degrees[1] = degrees[1] === 3 ? 5 : 3;
    const choice = melodyChoice(degrees);
    let p: Progress = { ...initialProgress(), session: { id: 'wrong', lessonId: 'melodic-dictation-1', seed: 11, index: 0, started: true, answers: [] } };
    p = answerQuestion(p, choice); expect(p.session?.answers[0]).toMatchObject({ choice, correct: false });
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
    p.session!.answers[0].correct = true; expect(parseProgress(JSON.stringify(p)).session).toBeNull();
    expect(withAnswerComparison(q, choice).music?.comparisonChoice).toBe(choice);
    expect(withAnswerComparison(q, q.correct)).toBe(q); expect(withAnswerComparison(q, 'invalid')).toBe(q);
  });
  it('rejects conflicting archived music responses, even when both answers are wrong', () => {
    const q = makeQuestion('melodic-dictation-1', 11, 0);
    const p: Progress = { ...initialProgress(), session: { id: 'conflict', lessonId: 'melodic-dictation-1', seed: 11, index: 0, started: true, answers: [] } };
    const one = answerQuestion(p, melodyChoice([3, 3, 3])); const two = answerQuestion(p, melodyChoice([5, 5, 5]));
    expect(one.attempts[0].correct).toBe(false); expect(two.attempts[0].correct).toBe(false);
    two.attempts[0].at = one.attempts[0].at; two.session!.answers[0].at = one.session!.answers[0].at;
    expect(() => mergeProgress(one, two)).toThrow();
    const forged = structuredClone(one); forged.attempts[0].response!.choice = 'melody:9,9,9';
    expect(() => readBackup(JSON.stringify(createBackup(forged)))).toThrow();
  });
  it('uses relative degrees in different keys, including non-tonic melody endings', () => {
    const roots = new Set<number>();
    for (let seed = 0; seed < 100; seed++) {
      const q = makeQuestion('degree-3', seed, 0); roots.add(q.music!.tonic);
      expect(q.music!.target[0][0] - q.music!.tonic).toBe([0, 2, 4, 5, 7, 9, 11][Number(q.correct) - 1]);
      const tonic = makeQuestion('tonic-3', seed, 0); expect(tonic.music!.phrase.at(-1)! % 12).not.toBe(tonic.music!.tonic % 12);
      expect(tonic.music!.candidates[tonic.correct][0][0]).toBe(tonic.music!.tonic);
    }
    expect(roots.size).toBe(12);
  });
});
describe('rhythm reproduction scoring', () => {
  const slots = [0, 2, 5, 6], expected = slots.map(v => v * 300);
  it.each([-240, -100, 0, 100, 240])('compensates a consistent %i ms offset without changing the rhythm', offset => {
    const score = scoreTaps(slots, 2, 100, expected.map(t => t + offset), 80);
    expect(score.correct).toBe(true); expect(score.offset).toBe(offset); expect(score.meanError).toBe(0);
  });
  it('does not hide local mistakes, changing tempo, missing or extra hits', () => {
    expect(scoreTaps(slots, 2, 100, [0, 600, 1710, 1800], 80).correct).toBe(false);
    expect(scoreTaps(slots, 2, 100, expected.map(t => t * 1.25), 80).correct).toBe(false);
    for (const actual of [expected.slice(1), [...expected, 2100]]) { const score = scoreTaps(slots, 2, 100, actual, 80); expect(score.correct).toBe(false); expect(score.meanError).toBeNull(); }
  });
  it('checks the tolerance boundary and caps compensation', () => {
    expect(scoreTaps([0, 1, 2], 1, 100, [0, 600, 1280], 80).correct).toBe(true);
    expect(scoreTaps([0, 1, 2], 1, 100, [0, 600, 1281], 80).correct).toBe(false);
    const late = scoreTaps(slots, 2, 100, expected.map(t => t + 500), 80); expect(late.offset).toBe(250); expect(late.correct).toBe(false);
    expect(scoreTaps(slots, 2, 100, [0, 600, Infinity, 1800], 80).correct).toBe(false);
  });
});
describe('rendered musical audio', () => {
  it.each(musicLessons)('$id: finite deterministic audio with headroom at both device rates', lesson => {
    const q = makeQuestion(lesson.id, 22, 0), m = q.music!;
    for (const rate of [44100, 48000]) {
      const data = makeMusicAudio(rate, m);
      const repeated = makeMusicAudio(rate, m); expect(data.every((v, i) => v === repeated[i])).toBe(true);
      expect(data.length / rate).toBeLessThan(10);
      expect(data.every(Number.isFinite)).toBe(true); let peak = 0, energy = 0; for (const v of data) { peak = Math.max(peak, Math.abs(v)); energy += v * v; }
      expect(peak).toBeLessThan(0.72); expect(energy / data.length).toBeGreaterThan(0.0001);
    }
  });
  it('renders the actual degree pitch, and changes it for a wrong response', () => {
    const q = makeQuestion('degree-3', 32, 0), m = q.music!; const rate = 48000;
    const targetHz = 440 * 2 ** ((degreeMidi(m.tonic, Number(q.correct)) - 69) / 12);
    const data = makeMusicAudio(rate, m); expect(magnitude(data, rate, 2.36, targetHz)).toBeGreaterThan(0.16);
    const wrong = q.options.find(o => o.id !== q.correct)!.id, compared = withAnswerComparison(q, wrong);
    const wrongHz = 440 * 2 ** ((degreeMidi(m.tonic, Number(wrong)) - 69) / 12);
    const student = makeMusicAudio(rate, compared.music!, 'c');
    expect(magnitude(student, rate, 2.36, wrongHz)).toBeGreaterThan(0.16);
    expect(magnitude(student, rate, 2.36, targetHz)).toBeLessThan(0.04);
  });
  it('retains and replays the actual timing of an accepted reproduction', () => {
    const q = makeQuestion('rhythm-repeat-2', 7, 0), m = q.music!;
    const times = m.slots.map(slot => Math.round(slot * 60000 / m.tempo / m.subdivision + 80)), choice = tapChoice(times);
    expect(evaluateAnswer(q, choice)).toBe(true);
    const replay = withAnswerComparison(q, choice); expect(replay.music!.comparisonChoice).toBe(choice);
    musicTimeline(replay.music!, 'c').events.filter(e => e.hz === 220).forEach((event, i) => expect(event.at).toBeCloseTo(4 * 60 / m.tempo + times[i] / 1000, 12));
  });
  it('limits headroom for a dense incorrect tap replay while keeping the target intact', () => {
    const q = makeQuestion('rhythm-repeat-3', 7, 0);
    const response = tapChoice(Array.from({ length: 32 }, (_, i) => i * 3));
    expect(evaluateAnswer(q, response)).toBe(false); const original = makeMusicAudio(48000, q.music!);
    const compared = withAnswerComparison(q, response), data = makeMusicAudio(48000, compared.music!, 'c');
    expect(data.reduce((max, v) => Math.max(max, Math.abs(v)), 0)).toBeLessThanOrEqual(0.720001);
    expect(makeMusicAudio(48000, compared.music!).every((v, i) => v === original[i])).toBe(true);
  });
  it('renders rests as silence, and the submitted melody uses its actual notes', () => {
    const q = makeQuestion('melodic-dictation-3', 32, 0), m = q.music!, rate = 44100, timeline = musicTimeline(m);
    const start = 2.3 + 4 * 60 / m.tempo, rest = m.degrees.indexOf(0);
    const data = makeMusicAudio(rate, m), at = start + rest * 60 / m.tempo + 0.08;
    expect(data.slice(Math.round(at * rate), Math.round((at + 0.1) * rate)).every(v => v === 0)).toBe(true);
    expect(timeline.events.filter(e => e.notes && e.at >= start)).toHaveLength(5);
    const degrees = [...m.degrees]; degrees[rest] = 3;
    const comparison = withAnswerComparison(q, melodyChoice(degrees));
    expect(magnitude(makeMusicAudio(rate, comparison.music!, 'c'), rate, at, 440 * 2 ** ((degreeMidi(m.tonic, 3) - 69) / 12))).toBeGreaterThan(0.15);
  });
  it.each([1, 2, 3])('level %i: rhythmic hits occupy the exact sample-clock positions', level => {
    const m = makeQuestion(`rhythmic-dictation-${level}`, 32, 0).music!;
    for (const rate of [44100, 48000]) {
      const data = makeMusicAudio(rate, m), beat = 60 / m.tempo;
      for (let slot = 0; slot < 4 * m.subdivision; slot++) {
        const energy = magnitude(data, rate, (4 + slot / m.subdivision) * beat + 0.005, 220, 0.04);
        expect(energy > 0.02).toBe(m.slots.includes(slot));
      }
    }
    const capture = musicTimeline({ ...m, response: 'tap' }, 'capture');
    expect(capture.responseStart).toBeCloseTo(12 * 60 / m.tempo, 12); expect(capture.responseEnd).toBeCloseTo(16 * 60 / m.tempo, 12);
    capture.events.filter(e => e.hz === 220).forEach((event, i) => expect(event.at).toBeCloseTo((4 + m.slots[i] / m.subdivision) * 60 / m.tempo, 12));
    expect(capture.events.some(e => e.hz === 220 && e.at >= capture.responseStart!)).toBe(false);
  });
  it('plays the written rhythm, including edits, without modifying the target', () => {
    const q = makeQuestion('rhythmic-dictation-2', 7, 0), chosen = [0, 1, 7];
    const comparison = withAnswerComparison(q, rhythmChoice(chosen));
    expect(musicTimeline(comparison.music!, 'c').events.filter(e => e.hz === 220).map(e => e.at)).toEqual(chosen.map(slot => (4 + slot / 2) * 60 / q.music!.tempo));
    expect(comparison.music!.slots).toEqual(q.music!.slots);
    expect(tapChoice([0.4, 650.6])).toBe('tap:0,651');
  });
});
