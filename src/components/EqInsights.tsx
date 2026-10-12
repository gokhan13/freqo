import { useMemo } from 'react';
import { EQ_INSIGHT_MINIMUM, eqInsights } from '../eq-insights';
import { formatHz } from '../eq-model';
import { text, tx, type Locale } from '../i18n';
import type { Evidence } from '../personal-model';

const percent = (part: { answered: number; correct: number }) =>
  part.answered ? `${Math.round((part.correct / part.answered) * 100)}%` : '—';

/** A learner's own frequency map: where their ear is reliable and where it slips. */
export function EqInsights({ evidence, locale }: { evidence: Evidence[]; locale: Locale }) {
  const insights = useMemo(() => eqInsights(evidence), [evidence]);
  const t = (tr: string, en: string) => tx(text(tr, en), locale);
  const { weakest } = insights;
  return (
    <details className="eq-insights" data-testid="eq-insights">
      <summary>{t('Bant haritan', 'Your band map')}</summary>
      {insights.answered < EQ_INSIGHT_MINIMUM ? (
        <p className="small-copy">
          {t(
            `Bant haritası için en az ${EQ_INSIGHT_MINIMUM} frekans yanıtı gerekir. Şu an ${insights.answered} yanıt var.`,
            `The band map needs at least ${EQ_INSIGHT_MINIMUM} frequency answers. There are ${insights.answered} so far.`,
          )}
        </p>
      ) : (
        <>
          <table className="eq-insights-table">
            <caption className="sr-only">
              {t(
                'Oktav bantlarına göre doğru yanıt oranı',
                'Share of correct answers by octave band',
              )}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t('Bant', 'Band')}</th>
                <th scope="col">{t('Doğru', 'Correct')}</th>
                <th scope="col">{t('Yanıt', 'Answers')}</th>
              </tr>
            </thead>
            <tbody>
              {insights.bands.map(band => (
                <tr key={band.hz} className={band === weakest ? 'is-weakest' : ''}>
                  <th scope="row">{formatHz(band.hz)}</th>
                  <td>
                    <span className="eq-insights-bar" aria-hidden="true">
                      <i
                        style={{
                          width: `${band.answered ? (band.correct / band.answered) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    {percent(band)}
                  </td>
                  <td>{band.answered}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small-copy">
            {t(
              `Yükseltmelerde ${percent(insights.boosts)}, kesmelerde ${percent(insights.cuts)} doğru.`,
              `${percent(insights.boosts)} correct on boosts, ${percent(insights.cuts)} on cuts.`,
            )}{' '}
            {weakest &&
              (weakest.tooHigh > weakest.tooLow
                ? t(
                    `En çok ${formatHz(weakest.hz)} bandında zorlanıyorsun ve genellikle daha tiz bir bant seçiyorsun.`,
                    `${formatHz(weakest.hz)} is your hardest band, and you usually name a higher one.`,
                  )
                : weakest.tooLow > weakest.tooHigh
                  ? t(
                      `En çok ${formatHz(weakest.hz)} bandında zorlanıyorsun ve genellikle daha pes bir bant seçiyorsun.`,
                      `${formatHz(weakest.hz)} is your hardest band, and you usually name a lower one.`,
                    )
                  : t(
                      `En çok ${formatHz(weakest.hz)} bandında zorlanıyorsun.`,
                      `${formatHz(weakest.hz)} is your hardest band.`,
                    ))}{' '}
            {t(
              'Kişisel pratik, zorlandığın yanıtları daha sık sorar.',
              'Personal practice asks for the answers you find hard more often.',
            )}
          </p>
        </>
      )}
    </details>
  );
}
