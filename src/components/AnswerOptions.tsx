import { useEffect, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { text, tx, type Locale } from '../i18n';
import { eqMatchControls, eqUsesDirection, eqUsesMatching } from '../eq-model';
import type { Question } from '../model';

const compactHz = (hz: number) => (hz >= 1000 ? `${hz / 1000}k` : String(hz));
const signedDb = (db: number) => `${db > 0 ? '+' : '−'}${Math.abs(db)}`;

/** Number keys answer only when every option has its own digit. */
export const hasNumberShortcuts = (question: Question) => question.options.length <= 9;

type Props = {
  question: Question;
  locale: Locale;
  /** The submitted answer, if any. */
  choice?: string | null;
  /** Mark the correct and incorrect options. Placement keeps them hidden until the end. */
  reveal: boolean;
  disabled: boolean;
  onChoose: (id: string) => void;
  testId?: string;
  /** Labelled examples highlight the setting being auditioned instead of scoring it. */
  selected?: string;
  /** Matching: the learner's current, unsubmitted setting, so it can be heard as C. */
  onPreview?: (id: string | null) => void;
};

/**
 * Single-choice answers. EQ questions that also ask for the direction lay their options out
 * like an equaliser: one row of boosts above one row of cuts, a column per band. Matching
 * questions become a small EQ: pick a band and an amount, listen, then submit.
 */
export function AnswerOptions(props: Props) {
  const {
    question,
    locale,
    choice,
    reveal,
    disabled,
    onChoose,
    testId = 'answer',
    selected,
  } = props;
  const state = (id: string) =>
    reveal && id === question.correct
      ? 'is-correct'
      : reveal && choice === id
        ? 'is-incorrect'
        : '';
  if (eqUsesMatching(question)) return <MatchEditor {...props} testId={testId} />;
  if (eqUsesDirection(question)) {
    const rows = [
      { prefix: 'boost', label: text('Yükseltme', 'Boost'), sign: '+' },
      { prefix: 'cut', label: text('Kesme', 'Cut'), sign: '−' },
    ];
    return (
      <div className="eq-grid" data-testid="eq-grid" onKeyDown={moveWithArrows}>
        {rows.map(row => (
          <div
            className={`eq-grid-row eq-grid-${row.prefix}`}
            role="group"
            aria-label={tx(row.label, locale)}
            key={row.prefix}
          >
            <span className="eq-grid-label" aria-hidden="true">
              <b>{row.sign}</b>
              {tx(row.label, locale)}
            </span>
            <div className="eq-grid-bands">
              {question.options
                .filter(option => option.id.startsWith(`${row.prefix}:`))
                .map(option => (
                  <button
                    key={option.id}
                    data-testid={`${testId}-${option.id}`}
                    className={`answer-option eq-grid-cell ${state(option.id)}`}
                    aria-pressed={selected === undefined ? undefined : selected === option.id}
                    disabled={disabled}
                    aria-label={tx(option.label, locale)}
                    onClick={() => onChoose(option.id)}
                  >
                    {compactHz(Number(option.id.split(':')[1]))}
                    {state(option.id) === 'is-correct' && <Check size={14} />}
                    {state(option.id) === 'is-incorrect' && <X size={14} />}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`answer-options options-${question.options.length}`}>
      {question.options.map((option, i) => (
        <button
          key={option.id}
          data-testid={`${testId}-${option.id}`}
          className={`answer-option ${state(option.id)}`}
          disabled={disabled}
          onClick={() => onChoose(option.id)}
        >
          <span className="answer-key">{i + 1}</span>
          <span className="answer-copy">
            <strong>{tx(option.label, locale)}</strong>
            {option.detail && <span>{tx(option.detail, locale)}</span>}
          </span>
          {state(option.id) === 'is-correct' && <Check size={21} />}
          {state(option.id) === 'is-incorrect' && <X size={21} />}
        </button>
      ))}
    </div>
  );
}

/** Arrow keys walk a band grid the way they would walk the faders of an equaliser. */
function moveWithArrows(event: React.KeyboardEvent<HTMLDivElement>) {
  const step = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[
    event.key
  ];
  if (!step) return;
  const rows = [...event.currentTarget.querySelectorAll('.eq-grid-bands')].map(row => [
    ...row.querySelectorAll<HTMLButtonElement>('button'),
  ]);
  const row = rows.findIndex(cells => cells.includes(document.activeElement as HTMLButtonElement));
  if (row < 0) return;
  const column = rows[row].indexOf(document.activeElement as HTMLButtonElement);
  const target = rows[row + step[0]]?.[Math.min(column + step[1], rows[row + step[0]].length - 1)];
  if (!target || column + step[1] < 0) return;
  event.preventDefault();
  target.focus();
}

function MatchEditor({
  question,
  locale,
  choice,
  reveal,
  disabled,
  onChoose,
  testId,
  onPreview,
}: Props) {
  const { bands, gains, id } = eqMatchControls(question);
  const submitted = choice ? choice.split(':').slice(1).map(Number) : null;
  const [band, setBand] = useState<number | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const current = band !== null && gain !== null ? id(band, gain) : null;
  useEffect(() => onPreview?.(current), [current]);
  const [targetBand, targetGain] = question.correct.split(':').slice(1).map(Number);
  const mark = (value: number, target: number, chosen: number | undefined) =>
    reveal && value === target ? 'is-correct' : reveal && value === chosen ? 'is-incorrect' : '';
  const locked = !!submitted;
  const t = (tr: string, en: string) => tx(text(tr, en), locale);
  return (
    <div className="eq-grid eq-match" data-testid="eq-match" onKeyDown={moveWithArrows}>
      <div className="eq-grid-row" role="group" aria-label={t('Bant', 'Band')}>
        <span className="eq-grid-label" aria-hidden="true">
          {t('Bant', 'Band')}
        </span>
        <div className="eq-grid-bands">
          {bands.map(hz => (
            <button
              key={hz}
              data-testid={`${testId}-band-${hz}`}
              className={`answer-option eq-grid-cell ${mark(hz, targetBand, submitted?.[0])}`}
              aria-pressed={(submitted?.[0] ?? band) === hz}
              aria-label={hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`}
              disabled={locked}
              onClick={() => setBand(hz)}
            >
              {compactHz(hz)}
            </button>
          ))}
        </div>
      </div>
      <div className="eq-grid-row" role="group" aria-label={t('Miktar', 'Amount')}>
        <span className="eq-grid-label" aria-hidden="true">
          {t('Miktar · dB', 'Amount · dB')}
        </span>
        <div className="eq-grid-bands eq-match-gains">
          {gains.map(db => (
            <button
              key={db}
              data-testid={`${testId}-gain-${db}`}
              className={`answer-option eq-grid-cell ${mark(db, targetGain, submitted?.[1])}`}
              aria-pressed={(submitted?.[1] ?? gain) === db}
              aria-label={`${signedDb(db)} dB`}
              disabled={locked}
              onClick={() => setGain(db)}
            >
              {signedDb(db)}
            </button>
          ))}
        </div>
      </div>
      {!locked && (
        <div className="eq-match-actions">
          <p className="small-copy">
            {current
              ? t(
                  'C senin ayarını çalar. B ile C aynı duyulana kadar değiştir.',
                  'C plays your setting. Change it until B and C sound the same.',
                )
              : t(
                  'Bir bant ve bir miktar seç; ayarın C olarak dinlenebilir.',
                  'Choose a band and an amount; your setting becomes C.',
                )}
          </p>
          <button
            className="button"
            data-testid={`${testId}-submit`}
            disabled={disabled || !current}
            onClick={() => current && onChoose(current)}
          >
            {t('Yanıtı gönder', 'Submit answer')}
            <ArrowRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
