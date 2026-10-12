import { useEffect, useRef, useState } from 'react';
import { text, tx, type Locale } from '../i18n';
import { tapChoice } from '../music-model';
import type { Question } from '../model';
import type { AudioEngine } from '../audio';
type Phase = 'idle' | 'count' | 'example' | 'prepare' | 'record' | 'done' | 'cancelled' | 'error';
const labels = {
  idle: text('Hazır olduğunda tekrarı başlat.', 'Start reproduction when ready.'), count: text('Örnek için dört sayım', 'Four counts for the example'),
  example: text('Örneği dinle', 'Listen to the example'), prepare: text('Hazırlık: dört sayım', 'Prepare: four counts'), record: text('Şimdi sen çal', 'Your turn to tap'),
  done: text('Tekrar tamamlandı. İncele veya yeniden dene.', 'Reproduction complete. Review or retry.'), cancelled: text('Tekrar durduruldu; puana yazılmadı.', 'Reproduction stopped; no score was saved.'), error: text('Ses başlatılamadı. Tekrar dene.', 'Audio could not start. Try again.'),
};
export function TapRecorder({ question, engine, locale, enabled, onSubmit }: { question: Question; engine: AudioEngine; locale: Locale; enabled: boolean; onSubmit: (choice: string) => void }) {
  const [phase, setPhase] = useState<Phase>('idle'), [beatNumber, setBeatNumber] = useState(0), [taps, setTaps] = useState<number[]>([]);
  const run = useRef<{ start: number; end: number; token: number } | null>(null);
  const values = useRef<number[]>([]), token = useRef(0), finished = useRef(false);
  const t = (v: Parameters<typeof tx>[0]) => tx(v, locale);
  const active = ['count', 'example', 'prepare', 'record'].includes(phase);
  useEffect(() => {
    const unsubscribe = engine.subscribe(status => {
      if (run.current && (status === 'idle' || status === 'error') && !finished.current) { token.current++; run.current = null; values.current = []; setTaps([]); setPhase(status === 'error' ? 'error' : 'cancelled'); }
    });
    let frame = 0;
    const update = () => {
      if (run.current) {
        const beat = 60 / question.music!.tempo, elapsed = (engine.currentTime - run.current.start) / beat;
        const nextPhase: Phase = elapsed < 4 ? 'count' : elapsed < 8 ? 'example' : elapsed < 12 ? 'prepare' : 'record';
        setPhase(nextPhase); setBeatNumber(Math.min(4, Math.max(1, elapsed >= 16 ? 4 : Math.floor(Math.max(0, elapsed) % 4) + 1)));
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => { unsubscribe(); cancelAnimationFrame(frame); token.current++; run.current = null; engine.stop(); };
  }, [engine, question]);
  const begin = async () => {
    finished.current = false; values.current = []; setTaps([]); run.current = null;
    const current = ++token.current; setPhase('count');
    const played = await engine.play(question, 'capture', () => {
      if (current !== token.current) return;
      finished.current = true; run.current = null; setTaps([...values.current]); setPhase('done');
    });
    if (current !== token.current) { engine.stop(); return; }
    if (!played || !engine.activeTiming) { setPhase('error'); return; }
    run.current = { start: engine.activeTiming.start, end: engine.activeTiming.responseEnd!, token: current };
  };
  const tap = () => {
    const timing = run.current;
    if (!timing) return;
    const responseStart = timing.start + 12 * 60 / question.music!.tempo;
    const ms = Math.round((engine.currentTime - responseStart) * 1000), end = (timing.end - responseStart) * 1000;
    if (ms < -250 || ms > end + 250 || values.current.length >= 32 || (values.current.length && ms <= values.current.at(-1)!)) return;
    values.current.push(ms); setTaps([...values.current]);
  };
  useEffect(() => {
    if (!active) return;
    const key = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('[role="dialog"]') || (e.target instanceof Element && e.target.closest('input,textarea,select'))) return;
      // Preserve Space activation on Cancel. Every other Space controls the tapping pad.
      if ((e.target instanceof Element && e.target.closest('[data-tap-cancel]'))) return;
      e.preventDefault(); if (!e.repeat) tap();
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });
  return <div className="tap-recorder" data-testid="tap-recorder"><div className="tap-phase" role="status" aria-live="polite">{t(labels[phase])}</div>{active && <div className="tap-count" aria-hidden="true">{beatNumber || '…'}<span>/ 4</span></div>}
    <button type="button" className={`tap-pad ${phase === 'record' ? 'recording' : ''}`} data-testid="tap-pad" disabled={!active} onPointerDown={event => { if (event.button !== 0 || !event.isPrimary) return; event.preventDefault(); event.currentTarget.focus(); tap(); }} onKeyUp={event => { if (active && event.code === 'Space') event.preventDefault(); }} onClick={event => { if (event.detail === 0) tap(); }} aria-label={t(text('Ritim vuruşu: dokun veya boşluk tuşuna bas', 'Rhythm hit: tap or press space'))}>{t(text('DOKUN', 'TAP'))}<span>{t(text('veya boşluk tuşu', 'or space bar'))}</span></button>
    <p className="tap-hit-count" aria-live="off">{t(text('Çaldığın vuruş', 'Your hits'))}: <strong>{taps.length}</strong></p><div className="editor-actions">{active ? <button className="button secondary" data-tap-cancel onClick={() => { token.current++; run.current = null; values.current = []; setTaps([]); engine.stop(); setPhase('cancelled'); }}>{t(text('Tekrarı durdur', 'Stop reproduction'))}</button> : <button className="button secondary" data-testid="start-tap" disabled={!enabled} onClick={() => void begin()}>{t(phase === 'done' ? text('Yeniden dene', 'Try again') : text('Tekrarı başlat', 'Start reproduction'))}</button>}<>{phase === 'done' && <button className="button secondary" disabled={!taps.length} onClick={() => void engine.play({ ...question, music: { ...question.music!, comparisonChoice: tapChoice(taps) } }, 'c')}>{t(text('Tekrarını dinle', 'Hear your reproduction'))}</button>}</><button className="button" data-testid="submit-music" disabled={phase !== 'done' || !enabled || !taps.length} onClick={() => onSubmit(tapChoice(taps))}>{t(text('Tekrarı gönder', 'Submit reproduction'))}</button></div>
    <p className="small-copy">{t(text('Dokunuşlar yalnızca senin ölçünde alınır. Puan, Gönder’e bastığında kaydedilir. Mikrofon açılmaz.', 'Hits are collected only around your response bar. A score is saved when you submit. The microphone stays off.'))}</p>
  </div>;
}
