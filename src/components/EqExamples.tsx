import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { AudioEngine } from '../audio';
import type { EqSource, Lesson } from '../content';
import { eqExampleOptions, eqTargetMove, formatHz, makeEqExample } from '../eq-model';
import { bandAudible } from '../source-spectrum';
import { text, tx, ui, type Locale } from '../content';
import { AnswerOptions } from './AnswerOptions';
import { AudioPlayer } from './AudioPlayer';
import { EqCurve } from './EqCurve';

/** Every labelled move of an EQ stage can be auditioned before the scored questions. */
export function EqExamples({
  lesson,
  source,
  engine,
  locale,
  volume,
  onVolume,
}: {
  lesson: Lesson;
  source: EqSource;
  engine: AudioEngine;
  locale: Locale;
  volume: number;
  onVolume: (value: number) => void;
}) {
  const options = useMemo(() => eqExampleOptions(lesson), [lesson]);
  const [choice, setChoice] = useState(options[0].id);
  useEffect(() => setChoice(options[0].id), [options]);
  const example =
    makeEqExample(lesson, choice, source) ?? makeEqExample(lesson, options[0].id, source)!;
  const select = (id: string) => {
    engine.stop();
    setChoice(id);
  };
  const grid = options.some(option => option.id.includes(':'));
  // Bands this source barely carries are never the answer to a scored question.
  const faint = [
    ...new Set(
      options.flatMap(option => {
        const question = makeEqExample(lesson, option.id, source);
        const move = question && eqTargetMove(question);
        return move && move.shape === 'peaking' && !bandAudible(source, move.frequency, move.q)
          ? [move.frequency]
          : [];
      }),
    ),
  ];
  return (
    <>
      <p>
        {tx(
          text(
            'Seçenekleri sırayla seçip B’yi dinle. Bu etiketli örnekler bantları tanıman içindir; puanlanan soruda yanıt gizlenir.',
            'Select each option and listen to B. These labelled examples help you learn the bands; the answer is hidden in the scored question.',
          ),
          locale,
        )}
      </p>
      {grid ? (
        <AnswerOptions
          question={example}
          locale={locale}
          reveal={false}
          disabled={false}
          onChoose={select}
          testId="example"
          selected={example.correct}
        />
      ) : (
        <div
          className="known-examples"
          role="group"
          aria-label={tx(text('Etiketli EQ örnekleri', 'Labelled EQ examples'), locale)}
        >
          {options.map(option => (
            <button
              className="button secondary"
              key={option.id}
              data-testid={`example-${option.id}`}
              aria-pressed={example.correct === option.id}
              onClick={() => select(option.id)}
            >
              {tx(option.label, locale)}
              {example.correct === option.id && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
      {faint.length > 0 && (
        <p className="small-copy" data-testid="faint-bands">
          {tx(
            text(
              `Bu kaynak ${faint.map(formatHz).join(', ')} çevresinde çok az enerji taşıyor; bu bant puanlanan sorularda sorulmaz. Dinlemek için başka bir kaynak seç.`,
              `This source carries very little energy around ${faint.map(formatHz).join(', ')}; scored questions never ask for it. Choose another source to hear it.`,
            ),
            locale,
          )}
        </p>
      )}
      <div className="example-answer">
        <Check size={17} />
        {tx(ui.correctAnswer, locale)}:{' '}
        <strong>{tx(example.options.find(o => o.id === example.correct)!.label, locale)}</strong>
      </div>
      <AudioPlayer
        engine={engine}
        question={example}
        locale={locale}
        volume={volume}
        onVolume={onVolume}
      />
      <EqCurve question={example} locale={locale} />
    </>
  );
}
