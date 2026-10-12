import { useEffect, useRef, useState } from 'react';
import { Headphones, Pause, Play, Volume2 } from 'lucide-react';
import { text, tx, ui, usesLoop, usesPair, type Locale } from '../content';
import { formatHz, type Question } from '../model';
import { AudioEngine, type AudioStatus, type Variant } from '../audio';

export function AudioPlayer({ engine, question, locale, volume, onVolume, onHeard, heard, reviewed }: {
  engine: AudioEngine; question: Question; locale: Locale; volume: number; onVolume: (value: number) => void; onHeard?: (v: Variant) => void; heard?: Variant[]; reviewed?: boolean;
}) {
  const [status, setStatus] = useState<AudioStatus>(engine.status);
  const [variant, setVariant] = useState<Variant>('a');
  const pair = usesPair(question.kind);
  const comparing = !!question.comparisonFrequency || !!question.mix?.comparison || !!question.music?.comparisonChoice;
  const [mono, setMono] = useState(false);
  const callback = useRef(onHeard); callback.current = onHeard;
  useEffect(() => engine.subscribe(setStatus), [engine]);
  useEffect(() => { engine.stop(); engine.setMono(false); setMono(false); setVariant('a'); return () => { engine.stop(); engine.setMono(false); }; }, [engine, question.seed, question.kind, question.source, question.comparisonFrequency, JSON.stringify(question.mix), JSON.stringify(question.music), question.customId]);
  const play = async (v: Variant = variant) => {
    if (v !== 'context' && v !== 'resolution') setVariant(v);
    await engine.play(question, v, () => callback.current?.(v));
  };
  const toggle = () => { if (status === 'playing' || status === 'preparing') engine.stop(); else void play(); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (engine.capturing || event.repeat) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if ((event.target as HTMLElement).closest('input,button,select,textarea,[role="dialog"]') || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.code === 'Space') { event.preventDefault(); toggle(); }
      else if (pair && (comparing ? ['a', 'b', 'c'] : ['a', 'b']).includes(event.key.toLowerCase())) { event.preventDefault(); void play(event.key.toLowerCase() as Variant); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });
  return <div className={`audio-player ${status === 'playing' ? 'is-playing' : ''}`}>
    <div className="player-top"><span className="eyebrow">{tx(text('DİNLEME ALANI', 'LISTENING SPACE'), locale)}</span><span className="audio-mark" aria-hidden="true"><Headphones size={16} /></span></div>
    <div className="waveform" aria-hidden="true">{Array.from({ length: 49 }, (_, i) => <i key={i} style={{ height: `${10 + Math.abs(Math.sin(i * 2.6) * Math.cos(i * 0.29)) * 64}px`, animationDelay: `${i * 0.023}s` }} />)}</div>
    {pair && <div className={`ab-controls ${comparing ? 'has-comparison' : ''}`} role="group" aria-label={tx(comparing ? text('A/B/C karşılaştırma', 'A/B/C comparison') : text('A/B dinleme', 'A/B listening'), locale)}>
      {((comparing ? ['a', 'b', 'c'] : ['a', 'b']) as Variant[]).map(v => <button key={v} className={`ab-button ${variant === v ? 'selected' : ''}`} aria-pressed={variant === v} onClick={() => void play(v)} disabled={status === 'preparing'}><span className="ab-letter">{v.toUpperCase()}</span><span className="ab-copy">{tx(question.mix ? v === 'a' ? question.kind === 'masking' ? text('Orijinal miks', 'Original mix') : ui.reference : v === 'c' ? text('Seçtiğin ayar', 'Your setting') : text('İşlenmiş örnek', 'Processed sample') : question.kind === 'eq' ? v === 'a' ? ui.original : v === 'c' ? ui.choiceEq : comparing ? ui.targetEq : ui.changed : question.kind === 'loudness' ? v === 'a' ? ui.reference : ui.comparison : question.kind === 'rhythm' ? v === 'a' ? ui.rhythmA : ui.rhythmB : v === 'a' ? ui.melodyA : ui.melodyB, locale)}{question.kind === 'eq' && comparing && v !== 'a' && <small>{formatHz(v === 'b' ? question.frequency! : question.comparisonFrequency!)}</small>}{heard?.includes(v) && <small>{tx(text('✓ Dinlendi', '✓ Listened'), locale)}</small>}</span><Volume2 size={17} /></button>)}
    </div>}
    {question.music && <div className="music-listen-tools">
      {comparing && <div className="music-comparison" role="group" aria-label={tx(text('Yanıt karşılaştırması', 'Answer comparison'), locale)}>{(['a', 'c'] as Variant[]).map(v => <button className="button secondary" key={v} disabled={engine.capturing || status === 'preparing'} onClick={() => void play(v)}>{tx(v === 'a' ? text('Soruyu tekrar dinle', 'Replay the question') : text('Yanıtını dinle', 'Hear your answer'), locale)}</button>)}</div>}
      {['tonic', 'degree', 'function', 'melodic-dictation'].includes(question.kind) && <button className="text-button" onClick={() => void play('context')} disabled={engine.capturing || status === 'preparing'}>{tx(text('Tonal bağlamı dinle', 'Hear the tonal context'), locale)}</button>}
      {question.kind === 'degree' && reviewed && <button className="text-button" onClick={() => void play('resolution')}>{tx(text('Tonik’e dönüş örneği', 'Return-to-tonic example'), locale)}</button>}
      {question.kind === 'tonic' && <div className="tonal-candidates" role="group" aria-label={tx(text('Aday sesleri dinle', 'Audition candidate notes'), locale)}>{question.options.map(o => <button className="button secondary" key={o.id} onClick={() => void engine.playCandidate(question, o.id)} disabled={status === 'preparing'}><Play size={15} />{tx(o.label, locale)}</button>)}</div>}
      {question.music.response !== 'choice' && <p className="rhythm-cue">{question.music.tempo} BPM · {tx(question.music.response === 'melody' ? text('Kadans → 4 sayım → melodi', 'Cadence → 4 counts → melody') : text('4 sayım → 1 ölçü', '4 counts → 1 bar'), locale)}</p>}
    </div>}
    {question.mix && <div className="mix-listen-tools">
      <div role="group" aria-label={tx(text('Dinleme modu', 'Listening mode'), locale)}>{[false, true].map(value => <button key={String(value)} aria-pressed={mono === value} onClick={() => { engine.setMono(value); setMono(value); }}>{value ? 'Mono' : 'Stereo'}</button>)}</div>
      {question.kind === 'masking' && <button className="text-button" onClick={() => void play('solo')}>{tx(text('Melodiyi tek dinle', 'Solo melody'), locale)}</button>}
    </div>}
    <div className="player-bottom"><button className="play-button" disabled={engine.capturing} onClick={toggle} aria-label={tx(status === 'playing' || status === 'preparing' ? ui.pause : ui.play, locale)}>{status === 'playing' || status === 'preparing' ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}<span>{tx(status === 'preparing' ? ui.preparing : status === 'playing' ? ui.pause : ui.play, locale)}</span></button>
      <label className="volume-control"><Volume2 size={18} /><span className="sr-only">{tx(ui.volume, locale)}</span><input aria-label={tx(ui.volume, locale)} type="range" min="0.05" max="0.8" step="0.01" value={volume} onChange={e => onVolume(Number(e.target.value))} /></label>
    </div>
    {question.kind === 'rhythm' && <p className="rhythm-cue">{question.tempo} BPM · {tx(text('4 sayım, ardından 1 ölçü · A ve B’yi tamamla', '4 count-in beats, then 1 bar · finish both A and B'), locale)}</p>}
    {onHeard && usesLoop(question.kind) && <p className="rhythm-cue">{tx(text('A ve B’nin her birini en az 1 saniye dinle. Geçişte zaman çizgisi korunur; durdurmak eksik dinleme süresini sıfırlar.', 'Listen to A and B for at least 1 second each. Switching keeps the timeline; stopping resets incomplete listening time.'), locale)}</p>}
    {status === 'error' && <p className="notice" role="alert">{tx(ui.audioError, locale)}</p>}
  </div>;
}
