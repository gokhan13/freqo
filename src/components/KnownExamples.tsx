import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { AudioEngine } from '../audio';
import { text, tx, type Locale } from '../i18n';
import type { Question } from '../model';
import { AudioPlayer } from './AudioPlayer';
import { MixFeedback } from './MixFeedback';

/** Labelled anchors are available before the scored question, never during it. */
export function KnownExamples({ question, engine, locale, volume, onVolume }: {
  question: Question; engine: AudioEngine; locale: Locale; volume: number; onVolume: (value: number) => void;
}) {
  const [choice, setChoice] = useState(question.correct);
  useEffect(() => setChoice(question.correct), [question]);
  const selected = question.mix!.alternatives[choice] ? choice : question.correct;
  const example: Question = { ...question, correct: selected, mix: { ...question.mix!, target: question.mix!.alternatives[selected] } };
  return <>
    <p>{tx(text('Ayarları sırayla seçip B’yi dinle. Bu etiketli örnekler farkı tanıman için; puanlanan soruda ayar gizlenecek.', 'Select each setting and listen to B. These labelled examples help you learn the differences; the setting is hidden in the scored question.'), locale)}</p>
    <div className="known-examples" role="group" aria-label={tx(text('Etiketli örnek ayarları', 'Labelled example settings'), locale)}>
      {question.options.map(option => <button className="button secondary" key={option.id} aria-pressed={selected === option.id} onClick={() => { engine.stop(); setChoice(option.id); }}>{tx(option.label, locale)}{selected === option.id && <Check size={16} />}</button>)}
    </div>
    <AudioPlayer engine={engine} question={example} locale={locale} volume={volume} onVolume={onVolume} />
    <MixFeedback engine={engine} question={example} locale={locale} />
  </>;
}
