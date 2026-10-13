import { text, tx, type Locale } from '../i18n';
import {
  eqComparisonMove,
  eqMagnitudeDb,
  eqMoveLabel,
  eqTargetMove,
  formatHz,
  type EqMove,
} from '../eq-model';
import type { Question } from '../model';

const WIDTH = 420;
const LOW = 30;
const HIGH = 16000;
const TICKS = [100, 1000, 10000];
const x = (hz: number) => (Math.log(hz / LOW) / Math.log(HIGH / LOW)) * WIDTH;
// Cut filters fall far below the picture; the curve simply leaves through the bottom edge.
const FLOOR_DB = -15;

const response = (move: EqMove) =>
  Array.from({ length: 140 }, (_, i) => {
    const hz = LOW * Math.pow(HIGH / LOW, i / 139);
    const db = Math.max(FLOOR_DB, eqMagnitudeDb(move, hz));
    return `${((i / 139) * WIDTH).toFixed(2)},${(65 - db * 4.4).toFixed(2)}`;
  }).join(' ');

/** The response of one free EQ setting, for the lab. */
export function EqMoveCurve({ move, locale }: { move: EqMove; locale: Locale }) {
  return (
    <div className="eq-curve">
      <svg
        viewBox={`0 0 ${WIDTH} 130`}
        preserveAspectRatio="none"
        role="img"
        aria-label={tx(
          text(
            `EQ eğrisi: ${formatHz(move.frequency)} çevresinde ayarın`,
            `EQ curve: your setting around ${formatHz(move.frequency)}`,
          ),
          locale,
        )}
      >
        {[25, 65, 105].map(y => (
          <line key={y} x1="0" y1={y} x2={WIDTH} y2={y} stroke="currentColor" strokeOpacity=".12" />
        ))}
        {TICKS.map(hz => (
          <line
            key={hz}
            x1={x(hz)}
            y1="0"
            x2={x(hz)}
            y2="130"
            stroke="currentColor"
            strokeOpacity=".12"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polyline
          points={response(move)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="eq-curve-axis" aria-hidden="true">
        {TICKS.map(hz => (
          <span key={hz} style={{ left: `${(x(hz) / WIDTH) * 100}%` }}>
            {formatHz(hz)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The target move, and after a wrong answer the learner's own move as a dashed line. */
export function EqCurve({ question, locale }: { question: Question; locale: Locale }) {
  const move = eqTargetMove(question);
  if (!move) return null;
  const comparison = eqComparisonMove(question);
  const target = tx(eqMoveLabel(move, question.eqKind), locale);
  const chosen = comparison && tx(eqMoveLabel(comparison, question.eqKind), locale);
  return (
    <div className="eq-curve">
      <svg
        viewBox={`0 0 ${WIDTH} 130`}
        preserveAspectRatio="none"
        role="img"
        aria-label={
          chosen
            ? tx(
                text(
                  `EQ eğrileri. Doğru yanıt: ${target}. Senin seçimin: ${chosen}.`,
                  `EQ curves. Correct answer: ${target}. Your choice: ${chosen}.`,
                ),
                locale,
              )
            : tx(
                text(`Yanıtın EQ eğrisi: ${target}`, `EQ response for the answer: ${target}`),
                locale,
              )
        }
      >
        {[25, 65, 105].map(y => (
          <line key={y} x1="0" y1={y} x2={WIDTH} y2={y} stroke="currentColor" strokeOpacity=".12" />
        ))}
        {TICKS.map(hz => (
          <line
            key={hz}
            x1={x(hz)}
            y1="0"
            x2={x(hz)}
            y2="130"
            stroke="currentColor"
            strokeOpacity=".12"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {comparison && (
          <polyline
            className="eq-curve-choice"
            points={response(comparison)}
            fill="none"
            strokeWidth="1.8"
            strokeDasharray="5 4"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <polyline
          points={response(move)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="eq-curve-axis" aria-hidden="true">
        {TICKS.map(hz => (
          <span key={hz} style={{ left: `${(x(hz) / WIDTH) * 100}%` }}>
            {formatHz(hz)}
          </span>
        ))}
      </div>
      {chosen && (
        <p className="eq-curve-legend">
          <span className="eq-legend-target">
            {tx(text('Doğru', 'Correct'), locale)}: {target}
          </span>
          <span className="eq-legend-choice">
            {tx(text('Seçtiğin', 'Yours'), locale)}: {chosen}
          </span>
        </p>
      )}
    </div>
  );
}
