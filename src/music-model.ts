import { text, tx, type Locale, type Text } from './i18n';
import type { Lesson } from './content';
import type { Question, Option } from './model';
import type { MusicSpec, MusicSkill } from './music-types';
import { scoreTaps } from './rhythm-scoring';
export const MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const degreeMidi = (tonic: number, degree: number) => tonic + MAJOR[degree - 1];
export const melodyChoice = (degrees: number[]) => `melody:${degrees.join(',')}`;
export const rhythmChoice = (slots: number[]) => `rhythm:${slots.join(',')}`;
export const tapChoice = (times: number[]) => `tap:${times.map(Math.round).join(',')}`;
export function readSequence(choice: string, prefix: string): number[] | null {
  if (choice.length > 300 || !choice.startsWith(`${prefix}:`)) return null;
  const tail = choice.slice(prefix.length + 1);
  if (!tail) return [];
  if (!/^-?\d+(,-?\d+)*$/.test(tail)) return null;
  const values = tail.split(',').map(Number);
  return values.every(Number.isSafeInteger) && `${prefix}:${values.join(',')}` === choice ? values : null;
}
export function evaluateAnswer(q: Question, choice: string): boolean | null {
  const m = q.music;
  if (!m || m.response === 'choice') return q.options.some(o => o.id === choice) ? choice === q.correct : null;
  if (m.response === 'melody') {
    const values = readSequence(choice, 'melody');
    if (!values || values.length !== m.degrees.length || values.some(v => !m.allowedDegrees.includes(v))) return null;
    return choice === q.correct;
  }
  if (m.response === 'rhythm') {
    const values = readSequence(choice, 'rhythm');
    if (!values || values.length === 0 || values.length > 4 * m.subdivision || values.some((v, i) => v < 0 || v >= 4 * m.subdivision || (i > 0 && v <= values[i - 1]))) return null;
    return choice === q.correct;
  }
  const values = readSequence(choice, 'tap');
  const bar = 4 * 60000 / m.tempo;
  if (!values || !values.length || values.length > 32 || values.some((v, i) => v < -250 || v > bar + 250 || (i > 0 && v <= values[i - 1]))) return null;
  return scoreTaps(m.slots, m.subdivision, m.tempo, values, m.tolerance).correct;
}
export function answerLabel(q: Question, choice: string, locale: Locale): string {
  const option = q.options.find(o => o.id === choice);
  if (option) return tx(option.label, locale);
  if (q.music?.response === 'melody') return (readSequence(choice, 'melody') ?? []).map(v => v === 0 ? tx(text('sus', 'rest'), locale) : v).join(' → ');
  if (q.music?.response === 'rhythm') return (readSequence(choice, 'rhythm') ?? []).map(v => positionLabel(v, q.music!.subdivision)).join(' · ');
  if (q.music?.response === 'tap') return choice === q.correct ? q.music.slots.map(v => positionLabel(v, q.music!.subdivision)).join(' · ') : `${readSequence(choice, 'tap')?.length ?? 0} ${tx(text('vuruş', 'hits'), locale)}`;
  return choice;
}
export const positionLabel = (slot: number, subdivision: number) => `${Math.floor(slot / subdivision) + 1}${slot % subdivision ? ` ${subdivision === 2 ? '&' : ['', 'e', '&', 'a'][slot % subdivision]}` : ''}`;
export const keyName = (midi: number) => ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][midi % 12];
export function makeMusicQuestion(lesson: Lesson, seed: number, rng: () => number): Question {
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];
  const skill = lesson.skill as MusicSkill, level = lesson.level;
  const tonic = level === 1 ? pick([55, 60, 62]) : 53 + Math.floor(rng() * 12);
  const chord = (degrees: number[], inversion = 0) => { const notes: number[] = []; for (const d of degrees) { let n = degreeMidi(tonic, d); while (notes.length && n <= notes.at(-1)!) n += 12; notes.push(n); } for (let i = 0; i < inversion; i++) notes.push(notes.shift()! + 12); return notes; };
  const context = [chord([1, 3, 5]), chord([4, 6, 1]), chord([5, 7, 2, 4]), chord([1, 3, 5])];
  if (level > 1) context.forEach((notes, i) => { if (i % 2 === 0) notes.push(notes.shift()! + 12); });
  const m: MusicSpec = { skill, level, tonic, tempo: [90, 90, 100][level - 1], subdivision: [1, 2, 4][level - 1], context, phrase: [], target: [], candidates: {}, degrees: [], allowedDegrees: [], slots: [], response: 'choice', tolerance: [100, 80, 65][level - 1], prompt: text('', ''), focus: text('', '') };
  let correct = '', options: Option[] = [], explanation: Text = text('', '');
  if (skill === 'tonic') {
    const phraseDegrees = level === 1 ? [3, 5, 2, 1] : level === 2 ? [1, 3, 5, pick([2, 3, 5])] : [5, 3, 2, pick([4, 6, 7])];
    m.phrase = phraseDegrees.map(d => degreeMidi(tonic, d) + (level === 3 ? 12 : 0));
    const candidates = [1, pick([2, 3]), pick([5, 6, 7])];
    for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
    options = candidates.map((d, i) => { const id = `note-${i + 1}`; m.candidates[id] = [[degreeMidi(tonic, d)]]; if (d === 1) correct = id; return { id, label: text(`Ses ${i + 1}`, `Note ${i + 1}`) }; });
    m.prompt = text('Hangi ses bu tonalitenin merkezi?', 'Which note is this key’s tonal centre?');
    m.focus = text('Kadans ve melodi → aday sesleri dinle → eve dönüş hissini seç.', 'Cadence and melody → audition the candidates → choose the sense of home.');
    explanation = text(`Tonik ${keyName(tonic)}; majör dizinin 1. derecesi. Melodinin son derecesi ${phraseDegrees.at(-1)}. Kadansın kurduğu merkezi, yalnızca son notayla karıştırma.`, `The tonic is ${keyName(tonic)}, degree 1 of the major key. The melody ends on degree ${phraseDegrees.at(-1)}. Keep the centre established by the cadence distinct from the last note.`);
  } else if (skill === 'degree') {
    m.allowedDegrees = level === 1 ? [1, 3, 5] : level === 2 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7];
    const degree = pick(m.allowedDegrees); correct = String(degree); m.degrees = [degree]; m.target = [[degreeMidi(tonic, degree)]];
    options = m.allowedDegrees.map(d => ({ id: String(d), label: text(`${d}. derece`, `Degree ${d}`), detail: d === 1 ? text('Tonik · merkez', 'Tonic · home') : undefined }));
    m.prompt = text('Sorulan nota kaçıncı derece?', 'Which scale degree is the target note?');
    m.focus = text('Kadans → kısa boşluk → tek nota. Dereceyi tonik referansıyla duy.', 'Cadence → short gap → one note. Hear the degree relative to the tonic.');
    explanation = text(`${keyName(tonic)} majörde ${degree}. derece. “Tonik’e dönüş” düğmesi ${degree} → 1 ilişkisini gösterir; bu tek mümkün melodik çözülme değildir.`, `Degree ${degree} in ${keyName(tonic)} major. “Return to tonic” demonstrates ${degree} → 1; this is not the only possible melodic resolution.`);
  } else if (skill === 'function') {
    if (level < 3) {
      const chords = { tonic: chord([1, 3, 5], level === 2 ? 1 : 0), predominant: chord(level === 1 ? [4, 6, 1] : [2, 4, 6], level === 2 ? 1 : 0), dominant: chord(level === 1 ? [5, 7, 2] : [5, 7, 2, 4], level === 2 ? 1 : 0) };
      m.candidates = Object.fromEntries(Object.entries(chords).map(([id, notes]) => [id, [notes]]));
      options = [{ id: 'tonic', label: text('Tonik · I', 'Tonic · I') }, { id: 'predominant', label: text(`Hazırlık · ${level === 1 ? 'IV' : 'ii'}`, `Predominant · ${level === 1 ? 'IV' : 'ii'}`) }, { id: 'dominant', label: text(`Dominant · ${level === 1 ? 'V' : 'V7'}`, `Dominant · ${level === 1 ? 'V' : 'V7'}`) }];
      correct = pick(options).id; m.target = m.candidates[correct];
      m.prompt = text('Son akor burada hangi işlevde?', 'What is the final chord’s function here?');
    } else {
      m.candidates = { authentic: [chord([5, 7, 2, 4]), chord([1, 3, 5])], plagal: [chord([4, 6, 1]), chord([1, 3, 5])], deceptive: [chord([5, 7, 2, 4]), chord([6, 1, 3])] };
      options = [{ id: 'authentic', label: text('V7 → I · toniğe dönüş', 'V7 → I · tonic arrival') }, { id: 'plagal', label: text('IV → I · plagal dönüş', 'IV → I · plagal arrival') }, { id: 'deceptive', label: text('V7 → vi · beklenmedik dönüş', 'V7 → vi · deceptive arrival') }];
      correct = pick(options).id; m.target = m.candidates[correct]; m.prompt = text('Son iki akorun dönüşü hangisi?', 'Which arrival do the last two chords form?');
    }
    m.focus = text('Kadansı duy. Boşluktan sonra sorulan akor veya iki akor gelir.', 'Hear the cadence. After the gap, the target chord or two-chord arrival follows.');
    explanation = text(`${keyName(tonic)} majör bağlamında: ${options.find(o => o.id === correct)!.label.tr}. İşlev tonal bağlama bağlıdır; çevrimler akorun bas notasını değiştirir. Bu örnekler tüm kadans çeşitlerinin sınıflandırması değildir.`, `In ${keyName(tonic)} major: ${options.find(o => o.id === correct)!.label.en}. Function depends on context; inversions change the bass note. These examples do not classify every cadence type.`);
  } else if (skill === 'melodic-dictation') {
    m.response = 'melody'; m.allowedDegrees = level === 1 ? [1, 3, 5] : level === 2 ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 7];
    m.degrees = Array.from({ length: [3, 4, 6][level - 1] }, (_, i) => i === 0 ? 1 : pick(m.allowedDegrees.filter(d => d > 0)));
    if (level === 3) m.degrees[1 + Math.floor(rng() * 4)] = 0;
    correct = melodyChoice(m.degrees);
    m.prompt = text('Duyduğun melodiyi derecelerle yaz.', 'Write the melody using scale degrees.');
    m.focus = text(`${keyName(tonic)} majör bağlamı → dört sayım → ${m.degrees.length} eşit vuruş. 1 = tonik.`, `${keyName(tonic)} major context → four counts → ${m.degrees.length} equal beats. 1 = tonic.`);
    explanation = text('Her kutu bir vuruş. Sayılar bu tonalitedeki dereceler; sus o konumda nota olmadığını gösterir. Aşağıda konum konum karşılaştır ve seçtiğin melodiyi yeniden dinle.', 'Each box is one beat. Numbers are degrees in this key; a rest indicates no note at that position. Compare each position below and replay your melody.');
  } else {
    const patterns = level === 1 ? [[0, 1, 2, 3], [0, 2, 3], [0, 1, 3], [0, 2]] : level === 2 ? [[0, 2, 3, 6], [0, 1, 4, 6], [0, 3, 4, 7], [0, 2, 5, 6]] : [[0, 3, 4, 6, 8, 12, 15], [0, 2, 4, 7, 8, 11, 14], [0, 1, 6, 8, 10, 12, 15], [0, 4, 5, 8, 11, 12, 14]];
    m.slots = [...pick(patterns)]; m.response = skill === 'rhythm-repeat' ? 'tap' : 'rhythm';
    correct = m.response === 'tap' ? tapChoice(m.slots.map(slot => slot * 60000 / m.tempo / m.subdivision)) : rhythmChoice(m.slots);
    m.prompt = m.response === 'tap' ? text('Dinlediğin ritmi tekrar çal.', 'Reproduce the rhythm you heard.') : text('Duyduğun ritmin yerlerini yaz.', 'Write the positions of the rhythm you heard.');
    m.focus = text(`${m.tempo} BPM · 4/4 · vuruş başına ${m.subdivision} bölüm. İnce ses nabız, alçak ses kalıp.`, `${m.tempo} BPM · 4/4 · ${m.subdivision} divisions per beat. High clicks give the pulse, low clicks the pattern.`);
    explanation = m.response === 'tap' ? text(`Önce vuruş sayısı, sonra her vuruşun göreli zamanlaması değerlendirilir. Bu seviyede her vuruş için tolerans ±${m.tolerance} ms. Sabit gecikme en çok ±250 ms dengelenir.`, `We first check hit count, then each hit’s relative timing. This level allows ±${m.tolerance} ms per hit. A constant offset is compensated by at most ±250 ms.`) : text('Dolu konum ses, boş konum sessizlik. Kalıbı dört vuruş grubunda karşılaştır; sayım sesleri yanıta dahil değildir.', 'Filled positions are hits; empty positions are silence. Compare the pattern in four beat groups; count-in clicks are not part of the answer.');
  }
  return { kind: skill, seed, notesA: [], notesB: [], music: m, correct, options, explanation };
}
