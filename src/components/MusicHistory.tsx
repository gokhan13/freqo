import { useState } from 'react';
import { getLesson, text, tx, type Locale } from '../content';
import { makeQuestion, withAnswerComparison, type Progress } from '../model';
import { answerLabel } from '../music-model';
import { isMusicianship } from '../music-types';
import type { AudioEngine } from '../audio';
import { AudioPlayer } from './AudioPlayer';
import { MusicFeedback } from './MusicFeedback';
export function MusicHistory({ progress, engine, locale, volume, onVolume }: { progress: Progress; engine: AudioEngine; locale: Locale; volume: number; onVolume: (v: number) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const attempts = progress.attempts.filter(a => a.response && isMusicianship(getLesson(a.lessonId).skill)).slice(-5).reverse();
  const active = attempts.find(a => `${a.sessionId}:${a.index}` === selected);
  const q = active?.response ? makeQuestion(active.lessonId, active.response.seed, active.index) : null;
  if (!attempts.length) return null;
  return <section className="music-history"><h2>{tx(text('Son müzik yanıtlarını tekrar çalış', 'Revisit your recent music answers'), locale)}</h2><p className="small-copy">{tx(text('En son beş yanıt. Tekrar dinlemek puanı değiştirmez.', 'The latest five answers. Replaying does not change your score.'), locale)}</p><div className="history-options">{attempts.map(a => { const id = `${a.sessionId}:${a.index}`; return <button className="button secondary" key={id} aria-pressed={id === selected} onClick={() => { engine.stop(); setSelected(id === selected ? null : id); }}>{tx(getLesson(a.lessonId).title, locale)} · {a.index + 1} · {a.correct ? '✓' : '×'}</button>; })}</div>{q && active?.response && <div className="history-detail"><p><strong>{tx(text('Doğru yanıt', 'Correct answer'), locale)}: {answerLabel(q, q.correct, locale)}</strong></p><p>{tx(q.explanation, locale)}</p><AudioPlayer engine={engine} question={withAnswerComparison(q, active.response.choice)} reviewed locale={locale} volume={volume} onVolume={onVolume} /><MusicFeedback question={q} choice={active.response.choice} locale={locale} /></div>}</section>;
}
