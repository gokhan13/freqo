import { useEffect, useRef, useState } from 'react';
import { shortcutsOn } from '../shortcuts';
import { Headphones, Pause, Play, Volume2 } from 'lucide-react';
import { text, tx, ui, usesLoop, usesPair, type Locale } from '../content';
import type { Question } from '../model';
import { eqComparisonMove, eqMoveLabel, eqTargetMove } from '../eq-model';
import { AudioEngine, type AudioStatus, type Variant } from '../audio';

export function AudioPlayer({
  engine,
  question,
  locale,
  volume,
  onVolume,
  onHeard,
  heard,
  reviewed,
  live,
  follow,
}: {
  engine: AudioEngine;
  question: Question;
  locale: Locale;
  volume: number;
  onVolume: (value: number) => void;
  onHeard?: (v: Variant) => void;
  heard?: Variant[];
  reviewed?: boolean;
  /** C is the learner's own unsubmitted setting: it follows their changes, and B stays unnamed. */
  live?: boolean;
  /** Free listening: a changed mix setting is swapped in while the loop keeps playing. */
  follow?: boolean;
}) {
  const [status, setStatus] = useState<AudioStatus>(engine.status);
  const [variant, setVariant] = useState<Variant>('a');
  const pair = usesPair(question.kind);
  const comparing =
    !!question.comparisonFrequency ||
    !!question.mix?.comparison ||
    !!question.music?.comparisonChoice;
  const [mono, setMono] = useState(false);
  const callback = useRef(onHeard);
  callback.current = onHeard;
  const comparisonKey = `${question.comparisonFrequency}:${question.comparisonGain}:${question.comparisonQ}:${question.comparisonShape}`;
  useEffect(() => engine.subscribe(setStatus), [engine]);
  useEffect(() => {
    engine.stop();
    engine.setMono(false);
    setMono(false);
    setVariant('a');
    return () => {
      engine.stop();
      engine.setMono(false);
    };
  }, [
    engine,
    question.seed,
    question.kind,
    question.source,
    // A submitted answer's comparison restarts listening; a live setting must not.
    live ? '' : comparisonKey,
    follow ? question.mix?.effect : JSON.stringify(question.mix),
    JSON.stringify(question.music),
    question.customId,
  ]);
  const current = useRef(question);
  current.current = question;
  useEffect(() => {
    if (!live || !question.comparisonFrequency || engine.status !== 'playing') return;
    setVariant('c');
    void engine.swap(current.current, 'c', () => callback.current?.('c'));
  }, [engine, live, comparisonKey]);
  // The lab: a changed setting replaces the playing loop without stopping it. Changes that
  // arrive while one is rendering are folded into the next, so the last one always wins.
  const followKey = follow ? `${JSON.stringify(question.mix)}:${question.customId}` : '';
  const rendering = useRef(false),
    stale = useRef(false),
    playing = useRef(variant);
  playing.current = variant;
  useEffect(() => {
    if (!follow || engine.status !== 'playing') return;
    if (rendering.current) {
      stale.current = true;
      return;
    }
    rendering.current = true;
    void (async () => {
      do {
        stale.current = false;
        await engine.swap(current.current, playing.current, () =>
          callback.current?.(playing.current),
        );
      } while (stale.current && engine.status === 'playing');
      rendering.current = false;
    })();
  }, [engine, followKey]);
  // On a phone the answers sit below the player. Once its buttons scroll out of view during
  // scored practice, a small bar keeps A/B/C and play within reach (shown by CSS on narrow
  // screens only).
  const root = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);
  const dockable = !!onHeard;
  useEffect(() => {
    const watched = root.current?.querySelector('[data-dock-watch]');
    if (!dockable || !watched || typeof IntersectionObserver === 'undefined') return;
    // "Away" once less than most of the buttons can be seen above the bottom navigation.
    const observer = new IntersectionObserver(([entry]) => setAway(entry.intersectionRatio < 0.6), {
      threshold: [0, 0.6, 1],
      rootMargin: '0px 0px -70px 0px',
    });
    observer.observe(watched);
    return () => observer.disconnect();
  }, [dockable, pair]);
  const play = async (v: Variant = variant) => {
    if (v !== 'context' && v !== 'resolution') setVariant(v);
    await engine.play(question, v, () => callback.current?.(v));
  };
  const toggle = () => {
    if (status === 'playing' || status === 'preparing') engine.stop();
    else void play();
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!shortcutsOn() || engine.capturing || event.repeat) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (
        (event.target as HTMLElement).closest('input,button,select,textarea,[role="dialog"]') ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (event.code === 'Space') {
        event.preventDefault();
        toggle();
      } else if (
        pair &&
        (comparing ? ['a', 'b', 'c'] : ['a', 'b']).includes(event.key.toLowerCase())
      ) {
        event.preventDefault();
        void play(event.key.toLowerCase() as Variant);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <div ref={root} className={`audio-player ${status === 'playing' ? 'is-playing' : ''}`}>
      <div className="player-top">
        <span className="eyebrow">{tx(text('DİNLEME ALANI', 'LISTENING SPACE'), locale)}</span>
        <span className="audio-mark" aria-hidden="true">
          <Headphones size={16} />
        </span>
      </div>
      {/* What is sounding right now. The buttons carry the same state for screen readers. */}
      <p className="player-state" aria-hidden="true" data-testid="player-state">
        <i />
        {tx(
          status === 'preparing'
            ? ui.preparing
            : status === 'playing'
              ? text('Çalıyor', 'Playing')
              : text('Durdu', 'Stopped'),
          locale,
        )}
        {status === 'playing' && pair && ['a', 'b', 'c'].includes(variant) && (
          <b>{variant.toUpperCase()}</b>
        )}
      </p>
      {pair && (
        <div
          className={`ab-controls ${comparing ? 'has-comparison' : ''}`}
          data-dock-watch
          role="group"
          aria-label={tx(
            comparing
              ? text('A/B/C karşılaştırma', 'A/B/C comparison')
              : text('A/B dinleme', 'A/B listening'),
            locale,
          )}
        >
          {((comparing ? ['a', 'b', 'c'] : ['a', 'b']) as Variant[]).map(v => (
            <button
              key={v}
              className={`ab-button ${variant === v ? 'selected' : ''}`}
              aria-pressed={variant === v}
              onClick={() => void play(v)}
              disabled={status === 'preparing'}
            >
              <span className="ab-letter">{v.toUpperCase()}</span>
              <span className="ab-copy">
                {tx(
                  question.mix
                    ? v === 'a'
                      ? question.kind === 'masking'
                        ? text('Orijinal miks', 'Original mix')
                        : ui.reference
                      : v === 'c'
                        ? text('Seçtiğin ayar', 'Your setting')
                        : text('İşlenmiş örnek', 'Processed sample')
                    : question.kind === 'eq'
                      ? v === 'a'
                        ? ui.original
                        : v === 'c'
                          ? ui.choiceEq
                          : live
                            ? text('Hedef EQ', 'Target EQ')
                            : comparing
                              ? ui.targetEq
                              : ui.changed
                      : question.kind === 'loudness'
                        ? v === 'a'
                          ? ui.reference
                          : ui.comparison
                        : question.kind === 'rhythm'
                          ? v === 'a'
                            ? ui.rhythmA
                            : ui.rhythmB
                          : v === 'a'
                            ? ui.melodyA
                            : ui.melodyB,
                  locale,
                )}
                {question.kind === 'eq' && comparing && v !== 'a' && !(live && v === 'b') && (
                  <small>
                    {tx(
                      eqMoveLabel(
                        (v === 'b' ? eqTargetMove(question) : eqComparisonMove(question))!,
                        question.eqKind,
                      ),
                      locale,
                    )}
                  </small>
                )}
                {heard?.includes(v) && (
                  <small>{tx(text('✓ Dinlendi', '✓ Listened'), locale)}</small>
                )}
              </span>
              <Volume2 size={17} />
            </button>
          ))}
        </div>
      )}
      {question.music && (
        <div className="music-listen-tools">
          {comparing && (
            <div
              className="music-comparison"
              role="group"
              aria-label={tx(text('Yanıt karşılaştırması', 'Answer comparison'), locale)}
            >
              {(['a', 'c'] as Variant[]).map(v => (
                <button
                  className="button secondary"
                  key={v}
                  disabled={engine.capturing || status === 'preparing'}
                  onClick={() => void play(v)}
                >
                  {tx(
                    v === 'a'
                      ? text('Soruyu tekrar dinle', 'Replay the question')
                      : text('Yanıtını dinle', 'Hear your answer'),
                    locale,
                  )}
                </button>
              ))}
            </div>
          )}
          {['tonic', 'degree', 'function', 'melodic-dictation'].includes(question.kind) && (
            <button
              className="text-button"
              onClick={() => void play('context')}
              disabled={engine.capturing || status === 'preparing'}
            >
              {tx(text('Tonal bağlamı dinle', 'Hear the tonal context'), locale)}
            </button>
          )}
          {question.kind === 'degree' && reviewed && (
            <button className="text-button" onClick={() => void play('resolution')}>
              {tx(text('Tonik’e dönüş örneği', 'Return-to-tonic example'), locale)}
            </button>
          )}
          {question.kind === 'tonic' && (
            <div
              className="tonal-candidates"
              role="group"
              aria-label={tx(text('Aday sesleri dinle', 'Audition candidate notes'), locale)}
            >
              {question.options.map(o => (
                <button
                  className="button secondary"
                  key={o.id}
                  onClick={() => void engine.playCandidate(question, o.id)}
                  disabled={status === 'preparing'}
                >
                  <Play size={15} />
                  {tx(o.label, locale)}
                </button>
              ))}
            </div>
          )}
          {question.music.response !== 'choice' && (
            <p className="rhythm-cue">
              {question.music.tempo} BPM ·{' '}
              {tx(
                question.music.response === 'melody'
                  ? text('Kadans → 4 sayım → melodi', 'Cadence → 4 counts → melody')
                  : text('4 sayım → 1 ölçü', '4 counts → 1 bar'),
                locale,
              )}
            </p>
          )}
        </div>
      )}
      {question.mix && (
        <div className="mix-listen-tools">
          <div role="group" aria-label={tx(text('Dinleme modu', 'Listening mode'), locale)}>
            {[false, true].map(value => (
              <button
                key={String(value)}
                aria-pressed={mono === value}
                onClick={() => {
                  engine.setMono(value);
                  setMono(value);
                }}
              >
                {value ? 'Mono' : 'Stereo'}
              </button>
            ))}
          </div>
          {question.kind === 'masking' && (
            <button className="text-button" onClick={() => void play('solo')}>
              {tx(text('Melodiyi tek dinle', 'Solo melody'), locale)}
            </button>
          )}
        </div>
      )}
      <div className="player-bottom" {...(pair ? {} : { 'data-dock-watch': true })}>
        <button
          className="play-button"
          disabled={engine.capturing}
          onClick={toggle}
          aria-label={tx(
            status === 'playing' || status === 'preparing' ? ui.pause : ui.play,
            locale,
          )}
        >
          {status === 'playing' || status === 'preparing' ? (
            <Pause size={19} fill="currentColor" />
          ) : (
            <Play size={19} fill="currentColor" />
          )}
          <span>
            {tx(
              status === 'preparing' ? ui.preparing : status === 'playing' ? ui.pause : ui.play,
              locale,
            )}
          </span>
        </button>
        <label className="volume-control">
          <Volume2 size={18} />
          <span className="sr-only">{tx(ui.volume, locale)}</span>
          <input
            aria-label={tx(ui.volume, locale)}
            type="range"
            min="0.05"
            max="0.8"
            step="0.01"
            value={volume}
            onChange={e => onVolume(Number(e.target.value))}
          />
        </label>
      </div>
      {question.kind === 'rhythm' && (
        <p className="rhythm-cue">
          {question.tempo} BPM ·{' '}
          {tx(
            text(
              '4 sayım, ardından 1 ölçü · A ve B’yi tamamla',
              '4 count-in beats, then 1 bar · finish both A and B',
            ),
            locale,
          )}
        </p>
      )}
      {onHeard &&
        usesLoop(question.kind) &&
        !['a', 'b'].every(v => heard?.includes(v as Variant)) && (
          <p className="rhythm-cue">
            {tx(
              text(
                'A ve B’nin her birini en az 1 saniye dinle. Geçişte zaman çizgisi korunur; durdurmak eksik dinleme süresini sıfırlar.',
                'Listen to A and B for at least 1 second each. Switching keeps the timeline; stopping resets incomplete listening time.',
              ),
              locale,
            )}
          </p>
        )}
      {status === 'error' && (
        <p className="notice" role="alert">
          {tx(ui.audioError, locale)}
        </p>
      )}
      {away && (
        <div
          className="player-dock"
          data-testid="player-dock"
          role="group"
          aria-label={tx(text('Sabit dinleme çubuğu', 'Pinned listening bar'), locale)}
        >
          {pair &&
            ((comparing ? ['a', 'b', 'c'] : ['a', 'b']) as Variant[]).map(v => (
              <button
                key={v}
                className={variant === v ? 'selected' : ''}
                aria-pressed={variant === v}
                aria-label={tx(
                  text(`${v.toUpperCase()} sesini dinle`, `Listen to ${v.toUpperCase()}`),
                  locale,
                )}
                disabled={status === 'preparing'}
                onClick={() => void play(v)}
              >
                {v.toUpperCase()}
              </button>
            ))}
          <button
            className="dock-play"
            disabled={engine.capturing}
            onClick={toggle}
            aria-label={tx(
              status === 'playing' || status === 'preparing' ? ui.pause : ui.play,
              locale,
            )}
          >
            {status === 'playing' || status === 'preparing' ? (
              <Pause size={17} fill="currentColor" />
            ) : (
              <Play size={17} fill="currentColor" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
