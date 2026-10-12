import { useEffect, useState } from 'react';
import { text, tx, type Locale } from '../i18n';
import { answerLabel } from '../music-model';
import type { Question } from '../model';
import type { AudioEngine } from '../audio';
import { AudioPlayer } from './AudioPlayer';
import { MusicFeedback } from './MusicFeedback';
export function MusicGuide(props: { engine: AudioEngine; question: Question; locale: Locale; volume: number; onVolume: (value: number) => void }) {
  const { question, locale, engine } = props;
  const [selection, setSelected] = useState(question.correct);
  useEffect(() => setSelected(question.correct), [question]);
  const selected = question.options.some(o => o.id === selection) ? selection : question.correct;
  const m = question.music!;
  const canExplore = question.kind === 'degree' || question.kind === 'function';
  const sample = canExplore ? { ...question, correct: selected, music: { ...m, target: m.candidates[selected] ?? [[m.tonic + [0, 2, 4, 5, 7, 9, 11][Number(selected) - 1]]], degrees: question.kind === 'degree' ? [Number(selected)] : m.degrees } } : question;
  return <><div className="example-answer">{tx(text('Açıklamalı örnek', 'Worked example'), locale)}: <strong>{answerLabel(sample, sample.correct, locale)}</strong></div>{canExplore && <div className="music-guide-options" role="group" aria-label={tx(text('Etiketli örnekler', 'Labelled examples'), locale)}>{question.options.map(o => <button key={o.id} className="button secondary" aria-pressed={selected === o.id} onClick={() => { engine.stop(); setSelected(o.id); }}>{tx(o.label, locale)}</button>)}</div>}<AudioPlayer {...props} question={sample} /><MusicFeedback question={sample} locale={locale} /><p className="small-copy">{tx(text('Bu örnek puana yazılmaz. Sorularda yanıt dinlemeden önce gösterilmez.', 'This example does not affect your score. Quiz answers appear after submission.'), locale)}</p></>;
}
