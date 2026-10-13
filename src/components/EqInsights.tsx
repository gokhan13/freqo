import { useMemo } from 'react';
import { BAND_MINIMUM, eqInsights, type Tally } from '../eq-insights';
import { formatHz } from '../eq-model';
import { text, tx, type Locale, type Text } from '../i18n';
import type { Evidence } from '../personal-model';

// Below this a percentage would read as more than a handful of answers can carry.
const SHOW_PERCENT_FROM = 5;

function Row({ label, tally, locale }: { label: string; tally: Tally; locale: Locale }) {
  const enough = tally.asked >= SHOW_PERCENT_FROM;
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        {enough ? (
          <>
            <span className="eq-insights-bar" aria-hidden="true">
              <i style={{ width: `${(tally.right / tally.asked) * 100}%` }} />
            </span>
            {Math.round((tally.right / tally.asked) * 100)}%
          </>
        ) : (
          <span className="eq-insights-few">
            {tx(text('henüz az yanıt', 'too few answers yet'), locale)}
          </span>
        )}
      </td>
      <td>
        {tally.right}/{tally.asked}
      </td>
    </tr>
  );
}

/**
 * The learner's EQ profile: each part of an EQ answer on its own line, then the bands.
 * It is a pointer to where to listen next, drawn from mixed stages and sources; the
 * wording stays as modest as the evidence.
 */
export function EqInsights({ evidence, locale }: { evidence: Evidence[]; locale: Locale }) {
  const insights = useMemo(() => eqInsights(evidence), [evidence]);
  const t = (tr: string, en: string) => tx(text(tr, en), locale);
  const parts: [Text, Tally][] = [
    [text('Bölge', 'Region'), insights.region],
    [text('Biçim (raf, filtre)', 'Shape (shelf, filter)'), insights.shape],
    [text('Frekans', 'Frequency'), insights.frequency],
    [text('Yön (yükseltme, kesme)', 'Direction (boost, cut)'), insights.direction],
    [text('Miktar', 'Amount'), insights.amount],
    [text('Bant genişliği', 'Bandwidth'), insights.width],
  ];
  const asked = parts.filter(([, tally]) => tally.asked > 0);
  const { weakest } = insights;
  const head = (
    <thead>
      <tr>
        <th scope="col">{t('Ne soruldu', 'What was asked')}</th>
        <th scope="col">{t('Doğru', 'Right')}</th>
        <th scope="col">{t('Yanıt', 'Answers')}</th>
      </tr>
    </thead>
  );
  return (
    <details className="eq-insights" data-testid="eq-insights">
      <summary>{t('EQ profilin', 'Your EQ profile')}</summary>
      {asked.length === 0 ? (
        <p className="small-copy">
          {t(
            'Profil, EQ sorularını yanıtladıkça oluşur.',
            'The profile builds up as you answer EQ questions.',
          )}
        </p>
      ) : (
        <>
          <p className="small-copy">
            {t(
              'EQ tek bir beceri değildir. Her satır bir yanıtın yalnızca o parçasını sayar: doğru bandı bulup yönü ters söylemek bir yön hatasıdır, frekans hatası değil.',
              'EQ is not one skill. Each line counts only that part of an answer: finding the band and reversing the direction is a direction error, not a frequency error.',
            )}
          </p>
          <table className="eq-insights-table" data-testid="eq-parts">
            <caption className="sr-only">
              {t('EQ yanıtının parçaları', 'Parts of an EQ answer')}
            </caption>
            {head}
            <tbody>
              {asked.map(([label, tally]) => (
                <Row key={label.en} label={tx(label, locale)} tally={tally} locale={locale} />
              ))}
            </tbody>
          </table>
          {insights.frequency.asked > 0 && (
            <table className="eq-insights-table" data-testid="eq-bands">
              <caption>
                {t('Bantlara göre: bant bulundu mu?', 'By band: was the band found?')}
              </caption>
              {head}
              <tbody>
                {insights.bands
                  .filter(band => band.asked > 0)
                  .map(band => (
                    <Row key={band.hz} label={formatHz(band.hz)} tally={band} locale={locale} />
                  ))}
              </tbody>
            </table>
          )}
          <p className="small-copy" data-testid="eq-reading">
            {insights.frequency.asked < BAND_MINIMUM
              ? t(
                  `Bir bant hakkında bir şey söylemek için en az ${BAND_MINIMUM} frekans yanıtı gerekir; şu an ${insights.frequency.asked} var.`,
                  `Saying anything about one band takes at least ${BAND_MINIMUM} frequency answers; there are ${insights.frequency.asked} so far.`,
                )
              : weakest
                ? t(
                    `Şimdiye kadarki yanıtlarında en düşük oran ${formatHz(weakest.band.hz)} bandında: ${weakest.band.right}/${weakest.band.asked}.`,
                    `In your answers so far the lowest rate is at ${formatHz(weakest.band.hz)}: ${weakest.band.right}/${weakest.band.asked}.`,
                  ) +
                  (weakest.lean
                    ? ' ' +
                      t(
                        `Bu banttaki ${weakest.band.tooHigh + weakest.band.tooLow} kaçırmanın ${weakest.lean === 'higher' ? weakest.band.tooHigh : weakest.band.tooLow} tanesinde daha ${weakest.lean === 'higher' ? 'tiz' : 'pes'} bir bant seçtin.`,
                        `In ${weakest.lean === 'higher' ? weakest.band.tooHigh : weakest.band.tooLow} of your ${weakest.band.tooHigh + weakest.band.tooLow} misses there you named a ${weakest.lean === 'higher' ? 'higher' : 'lower'} band.`,
                      )
                    : '')
                : t(
                    'Bantlar arasında, eldeki yanıtlarla söylenebilecek belirgin bir fark yok.',
                    'There is no clear difference between the bands that these answers could support.',
                  )}{' '}
            {t(
              'Farklı aşamalar, kaynaklar ve miktarlar birlikte sayılır; bu bir ölçüm değil, nereye kulak vereceğini gösteren bir özettir.',
              'Different stages, sources and amounts are counted together; this is a summary of where to listen, not a measurement.',
            )}
          </p>
        </>
      )}
    </details>
  );
}
