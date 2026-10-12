import { useEffect, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { text, tx, type Locale } from '../i18n';
import { melodyChoice, positionLabel, rhythmChoice } from '../music-model';
import type { Question } from '../model';
import type { AudioEngine } from '../audio';
export function MusicAnswerEditor({ question, engine, locale, enabled, onSubmit, preview = true }: { question: Question; engine: AudioEngine; locale: Locale; enabled: boolean; onSubmit: (choice: string) => void; preview?: boolean }) {
  const m = question.music!, melodic = m.response === 'melody';
  const [degrees, setDegrees] = useState<(number | null)[]>(m.degrees.map(() => null));
  const [cursor, setCursor] = useState(0), [slots, setSlots] = useState<number[]>([]);
  const t = (v: Parameters<typeof tx>[0]) => tx(v, locale);
  const enter = (degree: number) => { setDegrees(values => values.map((value, i) => i === cursor ? degree : value)); setCursor(i => Math.min(degrees.length - 1, i + 1)); };
  useEffect(() => {
    if (!melodic || !enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('[role="dialog"]') || (e.target as HTMLElement).closest('input,textarea,select')) return;
      if (/^[0-7]$/.test(e.key) && m.allowedDegrees.includes(Number(e.key))) { e.preventDefault(); enter(Number(e.key)); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setCursor(i => Math.max(0, Math.min(degrees.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)))); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  });
  const ready = melodic ? degrees.every(d => d !== null) : slots.length > 0;
  const choice = melodic ? melodyChoice(degrees as number[]) : rhythmChoice(slots);
  return <div className="music-editor" data-testid="music-editor">
    {melodic ? <><div className="melody-entry" role="group" aria-label={t(text('Melodi konumları', 'Melody positions'))}>{degrees.map((degree, i) => <button key={i} data-testid={`melody-slot-${i}`} className={cursor === i ? 'selected' : ''} aria-pressed={cursor === i} aria-label={`${t(text('Konum', 'Position'))} ${i + 1}: ${degree === null ? t(text('boş', 'empty')) : degree === 0 ? t(text('sus', 'rest')) : degree}`} onClick={() => setCursor(i)} disabled={!enabled}><small>{i + 1}</small><strong>{degree === null ? '?' : degree === 0 ? t(text('Sus', 'Rest')) : degree}</strong></button>)}</div><div className="degree-palette" role="group" aria-label={t(text('Derece seç', 'Choose a degree'))}>{m.allowedDegrees.map(degree => <button key={degree} data-testid={`degree-${degree}`} className="button secondary" disabled={!enabled} onClick={() => enter(degree)}>{degree || t(text('Sus', 'Rest'))}</button>)}</div><p className="small-copy">{t(text('Kutu seç → derece gir. Ok tuşları: konum · 1–7: derece · 0: sus (seviye 3).', 'Choose a box → enter a degree. Arrow keys: position · 1–7: degree · 0: rest (level 3).'))}</p></> : <div className="rhythm-map rhythm-entry" role="group" aria-label={t(text('Ritim konumlarını işaretle', 'Mark rhythm positions'))}>{Array.from({ length: 4 }, (_, beat) => <div className="rhythm-beat" key={beat}><span>{t(text('Vuruş', 'Beat'))} {beat + 1}</span><div>{Array.from({ length: m.subdivision }, (_, part) => { const slot = beat * m.subdivision + part, hit = slots.includes(slot); return <button key={slot} data-testid={`rhythm-slot-${slot}`} className={`rhythm-cell ${hit ? 'hit' : ''}`} disabled={!enabled} aria-pressed={hit} aria-label={`${positionLabel(slot, m.subdivision)}: ${t(hit ? text('ses', 'hit') : text('boş', 'gap'))}`} onClick={() => setSlots(values => hit ? values.filter(v => v !== slot) : [...values, slot].sort((a, b) => a - b))}>{hit ? '●' : '—'}<small>{part === 0 ? beat + 1 : m.subdivision === 2 ? '&' : ['', 'e', '&', 'a'][part]}</small></button>; })}</div></div>)}</div>}
    <div className="editor-actions">{preview && <button className="button secondary" disabled={!enabled || !ready} onClick={() => void engine.play({ ...question, music: { ...m, comparisonChoice: choice } }, 'c')}><Play size={16} />{t(text('Taslağını dinle', 'Preview your draft'))}</button>}<button className="text-button" disabled={!enabled} onClick={() => { engine.stop(); setDegrees(m.degrees.map(() => null)); setSlots([]); setCursor(0); }}><RotateCcw size={16} />{t(text('Temizle', 'Clear'))}</button><button className="button" data-testid="submit-music" disabled={!enabled || !ready} onClick={() => onSubmit(choice)}>{t(text('Yanıtı gönder', 'Submit answer'))}</button></div><p className="small-copy">{t(text('Gönderilen yanıt kaydedilir. Göndermeden çıkarsan bu taslak temizlenir.', 'Submitted answers are saved. Leaving before submission clears this draft.'))}</p>
  </div>;
}
