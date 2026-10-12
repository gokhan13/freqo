import { isMusicianship, type MusicSpec } from './music-types';
import { readExamProgress } from './exam-model';
import type { ExamProgress } from './exam-types';
import { readPersonalProgress } from './personal-validation';
import type { PersonalProgress } from './personal-types';
import { evaluateAnswer, makeMusicQuestion } from './music-model';
import { isAdvanced } from './advanced-content';
import { makeAdvancedQuestion } from './advanced-model';
import type { MixSpec } from './mix-types';
import { eqSourceIds, getLesson, lessons, text, usesLoop, type EqSource, type Locale, type PathId, type SkillId, type Text } from './content';

export const ROUND_COUNT = 5;
export type Option = { id: string; label: Text; detail?: Text };
export type Question = {
  kind: SkillId; options: Option[]; correct: string; notesA: number[]; notesB: number[];
  frequency?: number; gain?: number; q?: number; source?: EqSource; comparisonFrequency?: number; seed: number; explanation: Text;
  levelDb?: number; rhythmA?: number[]; rhythmB?: number[]; subdivision?: number; tempo?: number; mix?: MixSpec; music?: MusicSpec; customId?: string;
};
export type Answer = { choice: string; correct: boolean; at: string };
export type Session = { id: string; lessonId: string; seed: number; index: number; started: boolean; answers: Answer[]; source?: EqSource };
export type Result = { id: string; lessonId: string; correct: number; total: number; at: string; source?: EqSource };
export type Attempt = { sessionId: string; index: number; correct: boolean; at: string; lessonId: string; source?: EqSource; response?: { seed: number; choice: string } };
export type Progress = {
  version: 1; locale: Locale; path: PathId; volume: number; session: Session | null; eqSource?: EqSource;
  attempts: Attempt[]; results: Result[];
  exam?: ExamProgress;
  personal?: PersonalProgress;
};
// Separate storage prevents an older open tab from truncating expanded history.
export const LEGACY_STORAGE_KEY = 'freq.progress.v1';
export const STORAGE_KEY = 'freq.progress.v2';
export const initialProgress = (): Progress => ({ version: 1, locale: 'tr', path: 'mix', volume: 0.35, eqSource: 'studio', session: null, attempts: [], results: [] });
export const isEqSource = (v: unknown): v is EqSource => typeof v === 'string' && eqSourceIds.includes(v as EqSource);
export function random(seed: number) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function makeQuestion(lessonId: string, seed: number, index: number, source: EqSource = 'studio'): Question {
  const lesson = getLesson(lessonId);
  const questionSeed = (seed + index * 2654435761) >>> 0;
  const rng = random(questionSeed);
  const pick = <T,>(values: T[]): T => values[Math.floor(rng() * values.length)];
  const base = 52 + Math.floor(rng() * 13);
  const common = { kind: lesson.skill, notesA: [] as number[], notesB: [] as number[], seed: questionSeed };
  if (isMusicianship(lesson.skill)) return makeMusicQuestion(lesson, questionSeed, rng);
  if (isAdvanced(lesson.skill)) return makeAdvancedQuestion(lesson, questionSeed, source, rng);
  if (lesson.skill === 'eq') {
    const frequencies = lesson.level === 1 ? [120, 1000, 6000] : lesson.level === 2 ? [100, 300, 1000, 3000, 7000] : [100, 250, 700, 1500, 3500, 7000];
    const labels = [text('Bas', 'Lows'), text('Orta', 'Mids'), text('Tiz', 'Highs')];
    const details = [text('Ağırlık ve derinlik', 'Weight & depth'), text('Gövde ve belirginlik', 'Body & presence'), text('Parlaklık ve hava', 'Brightness & air')];
    const frequency = pick(frequencies);
    const gain = lesson.level === 3 ? pick([-6, 6]) : 9;
    const q = lesson.level === 1 ? 0.65 : lesson.level === 2 ? 1 : 3;
    return { ...common, frequency, gain, q, source, correct: String(frequency),
      options: frequencies.map((hz, i) => ({ id: String(hz), label: lesson.level === 1 ? labels[i] : text(formatHz(hz), formatHz(hz)), detail: lesson.level === 1 ? details[i] : undefined })),
      explanation: text(`${formatHz(frequency)} çevresine ${gain > 0 ? 'yükseltme' : 'kesme'} uygulandı (${gain > 0 ? '+' : ''}${gain} dB, Q ${q}). A/B ile rengin nasıl değiştiğini tekrar dinle.`, `A ${gain > 0 ? 'boost' : 'cut'} was applied around ${formatHz(frequency)} (${gain > 0 ? '+' : ''}${gain} dB, Q ${q}). Compare A/B again to hear the change in tone.`) };
  }
  if (lesson.skill === 'loudness') {
    const difference = [6, 3, 1][lesson.level - 1];
    const levelDb = pick([-difference, 0, difference]);
    return { ...common, source, levelDb, correct: levelDb > 0 ? 'louder' : levelDb < 0 ? 'softer' : 'same',
      options: [{ id: 'louder', label: text('B daha yüksek', 'B is louder') }, { id: 'softer', label: text('B daha düşük', 'B is softer') }, { id: 'same', label: text('Aynı seviye', 'Same level') }],
      explanation: text(levelDb === 0 ? 'A ve B aynı sinyal seviyesinde. Zamanlama, nota ve ses rengi de aynı.' : `B’nin sinyal seviyesi A’ya göre ${levelDb > 0 ? '+' : ''}${levelDb} dB. Yalnızca seviye değişti; daha yüksek olması sesin daha iyi olduğu anlamına gelmez.`, levelDb === 0 ? 'A and B have the same signal level, timing, pitch and timbre.' : `B’s signal level is ${levelDb > 0 ? '+' : ''}${levelDb} dB relative to A. Only the level changed; a louder sound does not mean a better sound.`) };
  }
  if (lesson.skill === 'rhythm') {
    const subdivision = lesson.level === 3 ? 4 : 2;
    const patterns = lesson.level === 1 ? [[0, 2, 4, 6], [0, 1, 2, 4, 6], [0, 2, 3, 4, 6]] : lesson.level === 2 ? [[0, 3, 4, 6], [0, 2, 5, 6], [0, 2, 4, 7]] : [[0, 3, 4, 6, 8, 10, 12, 14], [0, 2, 4, 7, 8, 11, 12, 15], [0, 1, 4, 6, 8, 9, 12, 14]];
    const rhythmA = [...pick(patterns)];
    const same = rng() < 0.5;
    const movable = rhythmA.slice(1).flatMap(slot => [slot - 1, slot + 1].filter(next => next > 0 && next < 4 * subdivision && !rhythmA.includes(next)).map(next => ({ slot, next })));
    const change = pick(movable);
    const rhythmB = same ? [...rhythmA] : rhythmA.map(slot => slot === change.slot ? change.next : slot).sort((a, b) => a - b);
    return { ...common, rhythmA, rhythmB, subdivision, tempo: 100, correct: same ? 'same' : 'different',
      options: [{ id: 'same', label: text('Aynı ritim', 'Same rhythm') }, { id: 'different', label: text('Bir vuruş yer değiştirdi', 'One hit moved') }],
      explanation: text(same ? 'İki kalıpta bütün vuruşlar aynı yerde. Dört sayımdan sonra gelen ölçüyü tekrar karşılaştır.' : `B’de ${rhythmPosition(change.slot, subdivision)} noktasındaki vuruş ${rhythmPosition(change.next, subdivision)} noktasına kaydı. Aşağıdaki noktalar sesin yerini, çizgiler boşluğu gösterir.`, same ? 'Every hit has the same position in both patterns. Compare the bar after the four count-in clicks again.' : `The hit at ${rhythmPosition(change.slot, subdivision)} moved to ${rhythmPosition(change.next, subdivision)} in B. The dots below show hits and the dashes show gaps.`) };
  }
  if (lesson.skill === 'direction') {
    const delta = pick([-7, -4, 0, 4, 7]);
    const correct = delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
    return { ...common, notesA: [base, base + delta], correct,
      options: [{ id: 'up', label: text('Yükseldi', 'Rose') }, { id: 'down', label: text('Alçaldı', 'Fell') }, { id: 'same', label: text('Aynı kaldı', 'Stayed the same') }],
      explanation: text(delta === 0 ? 'İki nota aynı yükseklikte. Tekrar dinlerken hareket olmadığını duy.' : `İkinci nota ${Math.abs(delta)} yarım ses ${delta > 0 ? 'yukarıda' : 'aşağıda'}. Tekrar dinlerken ikinci notanın yönüne odaklan.`, delta === 0 ? 'The notes have the same pitch. Listen again for the lack of movement.' : `The second note is ${Math.abs(delta)} semitones ${delta > 0 ? 'higher' : 'lower'}. Listen again and focus on its direction.`) };
  }
  if (lesson.skill === 'interval') {
    const intervals = [2, 4, 5, 7, 12];
    const labels = [text('Büyük ikili', 'Major second'), text('Büyük üçlü', 'Major third'), text('Tam dörtlü', 'Perfect fourth'), text('Tam beşli', 'Perfect fifth'), text('Oktav', 'Octave')];
    const interval = pick(intervals);
    return { ...common, notesA: [base, base + interval], correct: String(interval),
      options: intervals.map((v, i) => ({ id: String(v), label: labels[i], detail: text(`${v} yarım ses`, `${v} semitones`) })),
      explanation: text(`İki nota arasında ${interval} yarım ses var. İlk notayı hatırla ve ikinciye olan uzaklığı tekrar dinle.`, `The two notes are ${interval} semitones apart. Keep the first note in mind and listen to the distance again.`) };
  }
  if (lesson.skill === 'chord') {
    const minor = rng() < 0.5;
    return { ...common, notesA: [base, base + (minor ? 3 : 4), base + 7], correct: minor ? 'minor' : 'major',
      options: [{ id: 'major', label: text('Majör', 'Major') }, { id: 'minor', label: text('Minör', 'Minor') }],
      explanation: text(`Kök, ${minor ? 'küçük' : 'büyük'} üçlü ve tam beşli birlikte çalıyor. Üçlü, kökün ${minor ? 3 : 4} yarım ses üzerinde.`, `The root, ${minor ? 'minor' : 'major'} third and perfect fifth are played together. The third is ${minor ? 3 : 4} semitones above the root.`) };
  }
  const scale = [0, 2, 4, 5, 7, 9, 11];
  const degrees = Array.from({ length: lesson.level + 2 }, (_, i) => i === 0 ? 0 : Math.floor(rng() * 6));
  const notesA = degrees.map(d => base + scale[d]);
  const notesB = [...notesA];
  const same = rng() < 0.5;
  const changeAt = 1 + Math.floor(rng() * (notesA.length - 1));
  if (!same) notesB[changeAt] = base + scale[(degrees[changeAt] + 1) % scale.length];
  return { ...common, notesA, notesB, correct: same ? 'same' : 'different',
    options: [{ id: 'same', label: text('Aynı melodi', 'Same melody') }, { id: 'different', label: text('Bir nota farklı', 'One note changed') }],
    explanation: text(same ? 'İki melodinin bütün notaları aynı. A ve B’yi bir daha dinleyerek doğrula.' : `B melodisinde ${changeAt + 1}. nota değişti. A ve B’de o noktayı karşılaştır.`, same ? 'Every note in the two melodies is the same. Listen to A and B again to confirm.' : `Note ${changeAt + 1} changed in melody B. Compare that moment in A and B.`) };
}
export const formatHz = (hz: number) => hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`;
export const rhythmPosition = (slot: number, subdivision: number) => `${Math.floor(slot / subdivision) + 1}${slot % subdivision ? ` ${subdivision === 2 ? '&' : ['','e','&','a'][slot % subdivision]}` : ''}`;
export const newSession = (lessonId: string, source: EqSource = 'studio'): Session => ({ id: crypto.randomUUID(), lessonId, seed: crypto.getRandomValues(new Uint32Array(1))[0], index: 0, started: false, answers: [], ...(usesLoop(getLesson(lessonId).skill) ? { source } : {}) });
export function withEqComparison(question: Question, choice: string): Question {
  if (question.kind !== 'eq' || choice === question.correct || !question.options.some(o => o.id === choice)) return question;
  return { ...question, comparisonFrequency: Number(choice) };
}

export function withAnswerComparison(question: Question, choice: string): Question {
  if (question.music) return choice !== question.correct && evaluateAnswer(question, choice) !== null ? { ...question, music: { ...question.music, comparisonChoice: choice } } : question;
  if (!question.mix) return withEqComparison(question, choice);
  if (choice === question.correct || !question.mix.alternatives[choice]) return question;
  return { ...question, mix: { ...question.mix, comparison: question.mix.alternatives[choice] } };
}

export function answerQuestion(progress: Progress, choice: string, at = new Date().toISOString()): Progress {
  const s = progress.session;
  if (!s || !s.started || s.answers[s.index]) return progress;
  const question = makeQuestion(s.lessonId, s.seed, s.index, s.source);
  const correct = evaluateAnswer(question, choice);
  if (correct === null) return progress;
  return { ...progress, session: { ...s, answers: [...s.answers, { choice, correct, at }] },
    attempts: [...progress.attempts, { sessionId: s.id, index: s.index, lessonId: s.lessonId, correct, at, response: { seed: s.seed, choice }, ...(usesLoop(question.kind) ? { source: s.source ?? 'studio' } : {}) }] };
}
export function advanceQuestion(progress: Progress, at = new Date().toISOString()): Progress {
  const s = progress.session;
  if (!s || !s.answers[s.index]) return progress;
  if (s.index < ROUND_COUNT - 1) return { ...progress, session: { ...s, index: s.index + 1 } };
  const result: Result = { id: s.id, lessonId: s.lessonId, correct: s.answers.filter(a => a.correct).length, total: ROUND_COUNT, at, ...(usesLoop(getLesson(s.lessonId).skill) ? { source: s.source ?? 'studio' } : {}) };
  return { ...progress, session: null, results: [...progress.results, result] };
}
export function recommendedLesson(progress: Progress) {
  const pathLessons = lessons.filter(l => l.path === progress.path);
  return pathLessons.find(l => {
    const attempts = progress.attempts.filter(a => a.lessonId === l.id).slice(-10);
    return attempts.length < 10 || attempts.filter(a => a.correct).length < 8;
  }) ?? pathLessons[pathLessons.length - 1];
}
export function skillStats(progress: Progress, skill: SkillId) {
  const attempts = progress.attempts.filter(a => getLesson(a.lessonId).skill === skill).slice(-20);
  return { count: attempts.length, accuracy: attempts.length ? Math.round(attempts.filter(a => a.correct).length / attempts.length * 100) : null };
}

// Treat local storage as untrusted data. Older or malformed records never crash practice.
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const knownLesson = (v: unknown): v is string => typeof v === 'string' && lessons.some(l => l.id === v);
const validDate = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
const validSource = (v: Record<string, unknown>) => v.source === undefined || isEqSource(v.source);
const validResponse = (a: Record<string, unknown>) => {
  if (a.response === undefined) return true;
  const r = a.response;
  return object(r) && Number.isInteger(r.seed) && (r.seed as number) >= 0 && (r.seed as number) <= 0xffffffff && typeof r.choice === 'string' && evaluateAnswer(makeQuestion(a.lessonId as string, r.seed as number, a.index as number, a.source as EqSource | undefined), r.choice) === a.correct;
};
export const validAttempt = (a: unknown): a is Attempt => object(a) && knownLesson(a.lessonId) && typeof a.sessionId === 'string' && a.sessionId.length > 0 && Number.isInteger(a.index) && (a.index as number) >= 0 && (a.index as number) < ROUND_COUNT && typeof a.correct === 'boolean' && validDate(a.at) && validSource(a) && validResponse(a);
export const validResult = (r: unknown): r is Result => object(r) && typeof r.id === 'string' && r.id.length > 0 && knownLesson(r.lessonId) && Number.isInteger(r.correct) && (r.correct as number) >= 0 && (r.correct as number) <= ROUND_COUNT && r.total === ROUND_COUNT && validDate(r.at) && validSource(r);
export function parseProgress(raw: string | null): Progress {
  const fallback = initialProgress();
  if (!raw) return fallback;
  try {
    const v: unknown = JSON.parse(raw);
    if (!object(v) || v.version !== 1) return fallback;
    const p: Progress = { ...fallback, locale: v.locale === 'en' ? 'en' : 'tr',
      path: v.path === 'music' || v.path === 'exam' ? v.path : 'mix',
      volume: typeof v.volume === 'number' && Number.isFinite(v.volume) ? Math.min(0.8, Math.max(0.05, v.volume)) : fallback.volume,
      eqSource: isEqSource(v.eqSource) ? v.eqSource : 'studio' };
    const exam = readExamProgress(v.exam);
    if (exam) p.exam = exam;
    const personal = readPersonalProgress(v.personal);
    if (personal) p.personal = personal;
    if (Array.isArray(v.attempts)) p.attempts = v.attempts.filter(validAttempt).map(a => ({ sessionId: a.sessionId, index: a.index, lessonId: a.lessonId, correct: a.correct, at: a.at, ...(a.response ? { response: { seed: a.response.seed, choice: a.response.choice } } : {}), ...(a.source ? { source: a.source } : {}) }));
    if (Array.isArray(v.results)) p.results = v.results.filter(validResult).map(r => ({ id: r.id, lessonId: r.lessonId, correct: r.correct, total: r.total, at: r.at, ...(r.source ? { source: r.source } : {}) }));
    const s = v.session;
    if (object(s) && typeof s.id === 'string' && s.id.length > 0 && knownLesson(s.lessonId) && validSource(s) && Number.isInteger(s.seed) && (s.seed as number) >= 0 && (s.seed as number) <= 0xffffffff && Number.isInteger(s.index) && (s.index as number) >= 0 && (s.index as number) < ROUND_COUNT && typeof s.started === 'boolean' && Array.isArray(s.answers) && (s.answers.length === s.index || s.answers.length === (s.index as number) + 1)) {
      const valid = s.answers.every((a, i) => {
        const q = makeQuestion(s.lessonId as string, s.seed as number, i, s.source as EqSource | undefined);
        return object(a) && typeof a.choice === 'string' && evaluateAnswer(q, a.choice) !== null && a.correct === evaluateAnswer(q, a.choice) && validDate(a.at);
      });
      if (valid && (s.started || s.answers.length === 0 && s.index === 0)) p.session = { id: s.id, lessonId: s.lessonId, seed: s.seed as number, index: s.index as number, started: s.started, answers: s.answers.map(a => ({ choice: a.choice, correct: a.correct, at: a.at })), ...(s.source ? { source: s.source as EqSource } : {}) };
    }
    return p;
  } catch { return fallback; }
}
