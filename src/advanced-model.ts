import { text } from './i18n';
import type { EqSource, Lesson, Text } from './content';
import type { Question } from './model';
import type { MixEffect, MixSettings, MixSpec } from './mix-types';

type Choice = { id: string; label: Text; setting: MixSettings; detail?: Text };
const compress = (changes: MixSettings = {}): MixSettings => ({ threshold: -24, ratio: 6, attackMs: 12, releaseMs: 180, ...changes });
export function makeAdvancedQuestion(lesson: Lesson, seed: number, source: EqSource, rng: () => number): Question {
  const level = lesson.level;
  let effect: MixEffect = 'compression', reference: MixSettings = {}, choices: Choice[] = [], prompt: Text, focus: Text;
  if (lesson.skill === 'compression') {
    reference = compress({ ratio: level === 3 ? 4 : 1 });
    choices = level === 1 ? [{ id: 'none', label: text('Kompresyon yok', 'No compression'), setting: compress({ ratio: 1 }) }, { id: 'compressed', label: text('Kompresyon var', 'Compressed'), setting: compress({ ratio: 8 }) }] : [2, 4, 8].map(ratio => ({ id: String(ratio), label: level === 3 ? ratio < 4 ? text('Daha az', 'Less') : ratio === 4 ? text('Aynı', 'Same') : text('Daha fazla', 'More') : text(`${ratio}:1`, `${ratio}:1`), setting: compress({ ratio }) }));
    prompt = text(level === 1 ? 'B’de kompresyon var mı?' : level === 2 ? 'B’nin kompresyon oranı hangisi?' : 'B, A’ya göre ne kadar sıkıştırılmış?', level === 1 ? 'Is B compressed?' : level === 2 ? 'What is B’s compression ratio?' : 'How compressed is B compared with A?');
    focus = text('Vuruş ile gövdenin ilişkisini dinle. Ortalama ses seviyesi eşit; daha yüksek olanı seçmiyoruz.', 'Listen to the relationship between hits and body. Average level is matched; this is about dynamics.');
  } else if (lesson.skill === 'attack' || lesson.skill === 'release') {
    const attack = lesson.skill === 'attack';
    const values = attack ? [[1, 60], [3, 35], [8, 20]][level - 1] : [[20, 600], [70, 350], [120, 240]][level - 1];
    reference = compress({ attackMs: attack ? 12 : 5 });
    choices = values.map((value, i) => ({ id: i ? 'slow' : 'fast', label: i ? text('Daha yavaş', 'Slower') : text('Daha hızlı', 'Faster'), setting: compress({ attackMs: attack ? value : 5, releaseMs: attack ? 180 : value }) }));
    prompt = text(`B’nin ${attack ? 'atak' : 'bırakma'} tepkisi A’ya göre nasıl?`, `How does B’s ${attack ? 'attack' : 'release'} compare with A?`);
    focus = attack ? text('İlk kenarı dinle: B’de vuruş daha çok bastırılıyor mu, daha çok geçiyor mu?', 'Listen to the leading edge: is more of the hit suppressed or allowed through in B?') : text('Vuruştan sonraki gövdeyi ve sonraki vuruşa kadar geri dönüşü dinle.', 'Listen to the body after a hit and the recovery before the next one.');
  } else if (lesson.skill === 'masking') {
    effect = 'masking'; reference = { cutDb: 0 };
    const frequencies = level === 1 ? [300, 1000, 3000] : level === 2 ? [250, 700, 1500, 3500] : [250, 700, 1500, 3500];
    choices = frequencies.map(frequency => ({ id: String(frequency), label: text(frequency >= 1000 ? `${frequency / 1000} kHz` : `${frequency} Hz`, frequency >= 1000 ? `${frequency / 1000} kHz` : `${frequency} Hz`), setting: { frequency, cutDb: [-9, -6, -3][level - 1] } }));
    prompt = text('B’de eşliğin hangi bölgesi azaltıldı?', 'Which region of the backing was reduced in B?');
    focus = text('Hedef melodi değişmiyor. Solo ile melodiyi tanı; eşliğin hangi bölgesinde yer açıldığını miks içinde dinle.', 'The target melody stays unchanged. Learn it solo, then hear where space was made in the backing, in context.');
  } else if (lesson.skill === 'stereo') {
    if (level === 1) {
      effect = 'pan'; reference = { pan: 0 };
      choices = [-0.7, 0, 0.7].map(pan => ({ id: pan < 0 ? 'left' : pan > 0 ? 'right' : 'centre', label: pan < 0 ? text('Solda', 'Left') : pan > 0 ? text('Sağda', 'Right') : text('Ortada', 'Centre'), setting: { pan } }));
      prompt = text('B stereo alanın neresinde?', 'Where is B in the stereo field?');
      focus = text('Sol ve sağ kulak arasındaki seviyeyi karşılaştır; cihazının mono ayarı kapalı olmalı.', 'Compare the level at your left and right ears; disable your device’s mono setting.');
    } else if (level === 2) {
      effect = 'width'; reference = { width: 1 };
      choices = [0.25, 1, 1.8].map(width => ({ id: width < 1 ? 'narrow' : width > 1 ? 'wide' : 'same', label: width < 1 ? text('Daha dar', 'Narrower') : width > 1 ? text('Daha geniş', 'Wider') : text('Aynı genişlik', 'Same width'), setting: { width } }));
      prompt = text('B’nin genişliği A’ya göre nasıl?', 'How wide is B compared with A?');
      focus = text('Sesin merkezden iki yana yayılmasını dinle. Mono’da yan bileşenler toplanarak kaybolur.', 'Hear how the sound spreads from the centre. In mono the side components cancel in the sum.');
    } else {
      effect = 'phase'; reference = { invert: false };
      choices = [false, true].map(invert => ({ id: invert ? 'cancelled' : 'preserved', label: invert ? text('Mono’da iptal oluyor', 'Cancels in mono') : text('Mono’da korunuyor', 'Survives in mono'), setting: { invert } }));
      prompt = text('B, mono toplamda korunuyor mu?', 'Does B survive the mono sum?');
      focus = text('B’yi seç, Mono’yu aç, ardından A’ya dön. İptal varsa ses neredeyse kaybolur; tekrar Stereo’ya dönerek doğrula.', 'Select B, turn on Mono, then return to A. Cancellation makes the sound nearly disappear; switch back to Stereo to confirm.');
    }
  } else if (lesson.skill === 'reverb') {
    effect = 'reverb'; reference = { decay: 1.5, preDelayMs: 0, wet: 0 };
    const values = level === 1 ? [0.12, 0.45] : level === 2 ? [0.5, 1.5, 3] : [0, 30, 80];
    choices = values.map((value, i) => ({ id: String(value), label: level === 1 ? i ? text('Çok reverb', 'More reverb') : text('Az reverb', 'Less reverb') : text(`${value} ${level === 2 ? 's' : 'ms'}`, `${value} ${level === 2 ? 's' : 'ms'}`), setting: { decay: level === 2 ? value : 1.5, preDelayMs: level === 3 ? value : 0, wet: level === 1 ? value : 0.35 } }));
    prompt = [text('B’de ne kadar reverb var?', 'How much reverb is in B?'), text('B’nin reverb kuyruğu ne kadar uzun?', 'How long is B’s reverb tail?'), text('B’de ek ön gecikme ne kadar?', 'How much added pre-delay is in B?')][level - 1];
    focus = text('Son vuruştan sonra kalan kuyruğu dinle. Döngüdeki sessiz bölüm kuyruğu kesmeden karşılaştırmanı sağlar.', 'Listen after the final hit. The quiet part of the loop lets you compare the tail without cutting it off.');
  } else {
    effect = 'delay'; reference = { delayMs: 250, feedback: 0.4, wet: 0 };
    const values = level === 1 ? [125, 250, 500] : level === 2 ? [0.15, 0.4, 0.65] : [0, 1];
    choices = values.map(value => ({ id: String(value), label: level === 1 ? text(`${value} ms`, `${value} ms`) : level === 2 ? text(`${Math.round(value * 100)}% feedback`, `${Math.round(value * 100)}% feedback`) : value ? text('Ping-pong', 'Ping-pong') : text('Merkezde tekrar', 'Centred echoes'), setting: { delayMs: level === 1 ? value : 250, feedback: level === 2 ? value : 0.4, wet: 0.35, pingPong: level === 3 && value === 1 } }));
    prompt = [text('B’de tekrar aralığı ne kadar?', 'What is B’s echo spacing?'), text('B’de hangi feedback duyuluyor?', 'Which feedback setting do you hear in B?'), text('B’nin tekrarları nasıl dağılıyor?', 'How are B’s echoes positioned?')][level - 1];
    focus = text('Kaynak bittikten sonraki tekrarları dinle; zaman, sönme ve konumu ayrı ayrı karşılaştır.', 'Listen to the echoes after the source ends; compare spacing, fading and position separately.');
  }
  const chosen = choices[Math.floor(rng() * choices.length)];
  const spec: MixSpec = { effect, reference, target: chosen.setting, alternatives: Object.fromEntries(choices.map(c => [c.id, c.setting])), prompt, focus };
  const reasoning = lesson.skill === 'compression' ? chosen.setting.ratio === 1 ? text('1:1 oranında eşik üstü azaltma yoktur; B referansla aynı dinamiklere sahiptir.', 'At 1:1 there is no above-threshold reduction; B has the reference dynamics.') : text('Oran büyüdükçe eşik üstündeki bölümler daha fazla azaltılır. Eşitlenmiş seviyede vuruş/gövde ilişkisini karşılaştır.', 'A higher ratio reduces above-threshold parts more. With levels matched, compare the relationship between hits and body.')
    : lesson.skill === 'attack' ? text(chosen.id === 'fast' ? 'B’de azaltma daha hızlı uygulanır; ilk kenar daha fazla bastırılabilir. A/B/C ile vuruşun başına odaklan.' : 'B’de azaltma daha yavaş uygulanır; ilk kenarın daha çoğu geçebilir. A/B/C ile vuruşun başına odaklan.', chosen.id === 'fast' ? 'B applies reduction sooner, which can suppress more of the leading edge. Focus on the start of the hit with A/B/C.' : 'B applies reduction later, which can let more of the leading edge through. Focus on the start of the hit with A/B/C.')
    : lesson.skill === 'release' ? text(chosen.id === 'fast' ? 'B’de azaltma daha çabuk geri bırakılır. Vuruştan sonraki gövdenin dönüşünü dinle.' : 'B’de azaltma daha uzun sürer. Vuruştan sonra ve sonraki vuruşa kadar kalan azaltmayı dinle.', chosen.id === 'fast' ? 'B lets go of reduction sooner. Listen for the body recovering after the hit.' : 'B holds reduction longer. Listen after the hit and into the next one.')
    : lesson.skill === 'masking' ? text('Kesme yalnızca eşlik katmanındadır. Solo hedefi tanı, sonra melodinin eşlik içindeki belirginliğini karşılaştır.', 'Only the backing layer is cut. Learn the target solo, then compare how clearly it stands out in the backing.')
    : lesson.skill === 'stereo' ? level === 3 ? text(chosen.setting.invert ? 'Sağ kanal ters polaritededir. B’yi Mono’ya alınca ilişkili kanallar birbirini iptal eder; Stereo’ya dönerek kontrol et.' : 'Kanallar aynı polaritededir. B’yi Mono’ya alınca merkez ses korunur.', chosen.setting.invert ? 'The right channel has inverted polarity. In Mono the correlated channels cancel; return to Stereo to check.' : 'The channels have matching polarity. The centred sound survives when you switch B to Mono.') : level === 2 ? text('Yan bileşenin miktarı değişir; pan konumu ayrı bir özelliktir. Mono toplamında yan bileşen kaybolur.', 'Side amount changes; pan position is a separate property. Side cancels in the mono sum.') : text('Sol ve sağ kanalların seviye ilişkisi konumu belirler. Stereo modunda iki kulağı karşılaştır.', 'The level relationship between left and right determines position. Compare both ears in Stereo mode.')
    : lesson.skill === 'reverb' ? text(level === 1 ? 'Kuyruk ve ön gecikme sabit; B’de yalnızca eklenen reverb miktarı değişir.' : level === 2 ? 'Miktar ve ön gecikme sabit; son vuruştan sonra nominal kuyruğun nasıl söndüğünü dinle.' : 'Miktar ve kuyruk sabit; ek ön gecikme ilk vuruşu yansımalardan ayırır.', level === 1 ? 'Decay and pre-delay stay fixed; only the added reverb amount changes in B.' : level === 2 ? 'Amount and pre-delay stay fixed; listen to the nominal tail fading after the final hit.' : 'Amount and decay stay fixed; added pre-delay separates the hit from reflections.')
    : text(level === 1 ? 'Tekrarlar arasındaki zamanı dinle; 120 BPM’de 125/250/500 ms onaltılık/sekizlik/bir vuruşa karşılık gelir.' : level === 2 ? 'Feedback her sonraki tekrara taşınan miktardır; daha yüksek değer daha uzun tekrar dizisi bırakır.' : 'Ping-pong tekrarları sol/sağ arasında dolaştırır; merkez delay iki kanalda ortada kalır.', level === 1 ? 'Listen to echo spacing; at 120 BPM, 125/250/500 ms correspond to a sixteenth/eighth/beat.' : level === 2 ? 'Feedback is the amount carried into the next echo; a higher value leaves a longer series of repetitions.' : 'Ping-pong moves echoes between left and right; centred delay stays in the middle on both channels.');
  return { kind: lesson.skill, seed, source, notesA: [], notesB: [], correct: chosen.id, options: choices.map(({ id, label, detail }) => ({ id, label, detail })), mix: spec,
    explanation: reasoning };
}
