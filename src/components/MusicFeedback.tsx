import { text, tx, type Locale } from '../i18n';
import { answerLabel, keyName, positionLabel, readSequence } from '../music-model';
import { scoreTaps } from '../rhythm-scoring';
import type { Question } from '../model';
export function RhythmMap({ slots, subdivision, locale, label }: { slots: number[]; subdivision: number; locale: Locale; label: string }) {
  return <div className="rhythm-map" role="group" aria-label={label}>{Array.from({ length: 4 }, (_, beat) => <div className="rhythm-beat" key={beat}><span>{tx(text('Vuruş', 'Beat'), locale)} {beat + 1}</span><div>{Array.from({ length: subdivision }, (_, part) => { const slot = beat * subdivision + part; return <span className={`rhythm-cell ${slots.includes(slot) ? 'hit' : ''}`} key={slot} aria-label={`${positionLabel(slot, subdivision)}: ${tx(slots.includes(slot) ? text('ses', 'hit') : text('boş', 'gap'), locale)}`}>{slots.includes(slot) ? '●' : '—'}</span>; })}</div></div>)}</div>;
}
export function MusicFeedback({ question: q, choice, locale }: { question: Question; choice?: string; locale: Locale }) {
  const m = q.music;
  if (!m) return null;
  const t = (v: Parameters<typeof tx>[0]) => tx(v, locale);
  if (m.response === 'melody') {
    const actual = choice ? readSequence(choice, 'melody') : null;
    return <div className="music-feedback"><div className="degree-notation" aria-label={t(text('Melodinin dereceleri', 'Melody scale degrees'))}>{m.degrees.map((degree, i) => <div key={i} className={actual ? actual[i] === degree ? 'matched' : 'different' : ''}><span>{i + 1}</span><strong>{degree || t(text('Sus', 'Rest'))}</strong>{actual && <small>{t(text('Sen', 'You'))}: {actual[i] || t(text('Sus', 'Rest'))} {actual[i] === degree ? '✓' : '×'}</small>}</div>)}</div><p className="small-copy">{keyName(m.tonic)} {t(text('majör · 1 = tonik · her kutu bir vuruş', 'major · 1 = tonic · each box is one beat'))}</p></div>;
  }
  if (m.response === 'rhythm') return <div className="music-feedback"><strong>{t(text('Duyduğun kalıp', 'Target pattern'))}</strong><RhythmMap slots={m.slots} subdivision={m.subdivision} locale={locale} label={t(text('Doğru ritim', 'Correct rhythm'))} />{choice && <><strong>{t(text('Yazdığın kalıp', 'Your pattern'))}</strong><RhythmMap slots={readSequence(choice, 'rhythm') ?? []} subdivision={m.subdivision} locale={locale} label={t(text('Yazılan ritim', 'Written rhythm'))} /></>}</div>;
  if (m.response === 'tap') {
    const actual = choice ? readSequence(choice, 'tap') : null;
    const score = actual ? scoreTaps(m.slots, m.subdivision, m.tempo, actual, m.tolerance) : null;
    return <div className="music-feedback"><RhythmMap slots={m.slots} subdivision={m.subdivision} locale={locale} label={t(text('Tekrar edilecek ritim', 'Rhythm to reproduce'))} />{score && <><div className="tap-metrics"><span>{t(text('Vuruş sayısı', 'Hit count'))}<strong>{score.actual.length} / {score.expected.length}</strong></span><span>{t(text('Dengelenen ofset', 'Compensated offset'))}<strong>{Math.round(score.offset)} ms</strong></span><span>{t(text('Ortalama sapma', 'Mean timing error'))}<strong>{score.meanError === null ? '—' : `${Math.round(score.meanError)} ms`}</strong></span></div>{score.countMatches ? <div className="timing-table"><table><caption>{t(text('Sabit ofset sonrası vuruş sapmaları', 'Hit deviations after constant offset compensation'))}</caption><thead><tr><th>{t(text('Konum', 'Position'))}</th><th>{t(text('Sapma', 'Deviation'))}</th><th>±{m.tolerance} ms</th></tr></thead><tbody>{score.errors.map((error, i) => <tr key={i}><td>{positionLabel(m.slots[i], m.subdivision)}</td><td>{Math.round(error)} ms</td><td>{Math.abs(error) <= m.tolerance ? '✓' : '×'}</td></tr>)}</tbody></table></div> : <p>{t(text('Vuruş sayıları farklı. Eksik/fazla vuruşlarda tek tek zaman eşleştirmesi yapılmaz; önce kalıbın sayısını ve boşluklarını çalış.', 'Hit counts differ. We do not pair individual times when hits are missing or extra; practise the count and gaps first.'))}</p>}</>}<p className="small-copy">{t(text('Bu göreli ritim ölçümüdür; cihaz gecikmesini veya müzikal yeteneğin tamamını ölçmez.', 'This measures relative rhythm reproduction, not device latency or your overall musicianship.'))}</p></div>;
  }
  return <div className="music-feedback"><p>{t(text('Tonal referans', 'Tonal reference'))}: <strong>{keyName(m.tonic)} {t(text('majör · 1 = tonik', 'major · 1 = tonic'))}</strong>{choice && <> · {t(text('Seçtiğin', 'Your choice'))}: {answerLabel(q, choice, locale)}</>}</p></div>;
}
