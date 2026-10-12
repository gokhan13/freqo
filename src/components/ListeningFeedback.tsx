import { text, tx, type Locale } from '../content';
import { rhythmPosition, type Question } from '../model';

export function ListeningFeedback({ question, locale }: { question: Question; locale: Locale }) {
  if (question.kind === 'loudness') {
    const db = question.levelDb!;
    return <div className="level-feedback" aria-label={tx(text('Göreli sinyal seviyeleri', 'Relative signal levels'), locale)}>
      <div><span>A</span><i style={{ width: '45%' }} /><strong>0 dB</strong></div>
      <div><span>B</span><i style={{ width: `${45 * Math.pow(10, db / 20)}%` }} /><strong>{db > 0 ? '+' : ''}{db} dB</strong></div>
      <p>{tx(text('A referansına göre · yalnızca sinyal seviyesi', 'Relative to A · signal level only'), locale)}</p>
    </div>;
  }
  if (question.kind !== 'rhythm') return null;
  const subdivision = question.subdivision!;
  return <div className="rhythm-feedback">
    <p>{question.tempo} BPM · {tx(text('4 sayım + 1 ölçü · ● ses, — boşluk', '4 count-in beats + 1 bar · ● hit, — gap'), locale)}</p>
    {[question.rhythmA!, question.rhythmB!].map((slots, row) => <div className="rhythm-row" key={row} role="img" aria-label={`${row ? 'B' : 'A'}: ${tx(text('Vuruş noktaları', 'Hit positions'), locale)} ${slots.map(slot => rhythmPosition(slot, subdivision)).join(', ')}`}>
      <strong aria-hidden="true">{row ? 'B' : 'A'}</strong>
      <div className="rhythm-cells" style={{ gridTemplateColumns: `repeat(${4 * subdivision}, minmax(0, 1fr))` }} aria-hidden="true">
        {Array.from({ length: 4 * subdivision }, (_, slot) => <span key={slot} className={`${slot % subdivision === 0 ? 'beat-start' : ''} ${question.rhythmA!.includes(slot) !== question.rhythmB!.includes(slot) ? 'moved' : ''}`}><small>{slot % subdivision === 0 ? Math.floor(slot / subdivision) + 1 : subdivision === 2 ? '&' : ['', 'e', '&', 'a'][slot % subdivision]}</small><b>{slots.includes(slot) ? '●' : '—'}</b></span>)}
      </div>
    </div>)}
  </div>;
}
