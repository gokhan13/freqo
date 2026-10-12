import { AudioLines, Check } from 'lucide-react';
import { eqSourceIds, eqSources, tx, ui, type EqSource, type Locale } from '../content';

export function SourcePicker({ value, locale, onChange }: { value: EqSource; locale: Locale; onChange: (source: EqSource) => void }) {
  return <fieldset className="source-picker">
    <legend>{tx(ui.source, locale)}</legend>
    <p>{tx(ui.sourceCopy, locale)}</p>
    <div className="source-options">{eqSourceIds.map(source => <label key={source} className={`source-option ${value === source ? 'selected' : ''}`}>
      <input type="radio" name="eq-source" value={source} checked={value === source} onChange={() => onChange(source)} />
      <AudioLines size={20} aria-hidden="true" />
      <span><strong>{tx(eqSources[source].title, locale)}</strong><span>{tx(eqSources[source].description, locale)}</span></span>
      {value === source && <Check size={17} aria-hidden="true" />}
    </label>)}</div>
    <span className="small-copy">{tx(ui.sourceOriginal, locale)}</span>
  </fieldset>;
}
