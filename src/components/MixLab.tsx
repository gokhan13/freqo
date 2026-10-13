import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { ArrowLeft, Download, Upload, X } from 'lucide-react';
import { sourcesFor, text, tx, type EqSource, type Locale } from '../content';
import { AudioEngine } from '../audio';
import { makeQuestion, type Question } from '../model';
import type { MixEffect, MixSettings } from '../mix-types';
import { encodeWav } from '../wav';
import { AudioPlayer } from './AudioPlayer';
import { MixFeedback } from './MixFeedback';
import { EqMoveCurve } from './EqCurve';
import { formatHz, type EqMove } from '../eq-model';
import { SourcePicker } from './SourcePicker';

const effectNames: Record<MixEffect, ReturnType<typeof text>> = {
  eq: text('EQ: tek bant, raf ya da filtre', 'EQ: one band, shelf or filter'),
  compression: text('Kompresyon / attack / release', 'Compression / attack / release'),
  masking: text('Masking: eşlik EQ', 'Masking: backing EQ'),
  pan: text('Stereo konum', 'Stereo position'),
  width: text('Stereo genişlik', 'Stereo width'),
  phase: text('Polarite ve mono', 'Polarity & mono'),
  reverb: text('Reverb', 'Reverb'),
  delay: text('Delay', 'Delay'),
};
const defaults: Record<MixEffect, MixSettings> = {
  eq: { shape: 'peaking', frequency: 1000, gainDb: 6, q: 1.4 },
  compression: { threshold: -24, ratio: 4, attackMs: 12, releaseMs: 180 },
  masking: { frequency: 1000, cutDb: -6 },
  pan: { pan: 0.5 },
  width: { width: 1.4 },
  phase: { invert: false },
  reverb: { decay: 1.5, preDelayMs: 30, wet: 0.35 },
  delay: { delayMs: 250, feedback: 0.4, wet: 0.35, pingPong: false },
};
const controls: Partial<
  Record<MixEffect, [keyof MixSettings, ReturnType<typeof text>, number, number, number, string][]>
> = {
  compression: [
    ['threshold', text('Eşik', 'Threshold'), -40, -6, 1, 'dB'],
    ['ratio', text('Oran', 'Ratio'), 1, 10, 0.5, ':1'],
    ['attackMs', text('Atak', 'Attack'), 1, 80, 1, 'ms'],
    ['releaseMs', text('Bırakma', 'Release'), 20, 800, 10, 'ms'],
  ],
  masking: [
    ['frequency', text('Eşlik frekansı', 'Backing frequency'), 250, 3500, 50, 'Hz'],
    ['cutDb', text('Eşlikte kesme', 'Backing cut'), -15, 0, 1, 'dB'],
  ],
  pan: [
    ['pan', text('Sol −1 · orta 0 · sağ +1', 'Left −1 · centre 0 · right +1'), -1, 1, 0.05, ''],
  ],
  width: [['width', text('Yan bileşen miktarı', 'Side amount'), 0, 2, 0.1, '×']],
  reverb: [
    ['decay', text('Kuyruk', 'Decay'), 0.3, 3, 0.1, 's'],
    ['preDelayMs', text('Ön gecikme', 'Pre-delay'), 0, 100, 5, 'ms'],
    ['wet', text('Efekt miktarı', 'Effect amount'), 0, 0.7, 0.05, '×'],
  ],
  delay: [
    ['delayMs', text('Tekrar aralığı', 'Echo spacing'), 80, 600, 10, 'ms'],
    ['feedback', text('Feedback', 'Feedback'), 0, 0.7, 0.05, '×'],
    ['wet', text('Efekt miktarı', 'Effect amount'), 0, 0.7, 0.05, '×'],
  ],
};
type FileInfo = { id: string; name: string; duration: number; total: number; channels: number };
const eqShapes: [NonNullable<MixSettings['shape']>, ReturnType<typeof text>][] = [
  ['peaking', text('Çan', 'Bell')],
  ['lowshelf', text('Bas rafı', 'Low shelf')],
  ['highshelf', text('Tiz rafı', 'High shelf')],
  ['highpass', text('Alçak kesen', 'High-pass')],
  ['lowpass', text('Yüksek kesen', 'Low-pass')],
];
// The frequency slider moves in twelfths of an octave, placed so that 1 kHz and its octaves
// are steps: about 40 Hz at one end, 16 kHz at the other.
const KILOHERTZ_STEP = 56,
  STEPS = KILOHERTZ_STEP + 48;
const stepHz = (step: number) => Math.round(1000 * 2 ** ((step - KILOHERTZ_STEP) / 12));
const hzStep = (hz: number) => Math.round(12 * Math.log2(hz / 1000)) + KILOHERTZ_STEP;
/** The lab's EQ settings as the move the engine plays and the curve draws. */
const eqMove = (settings: MixSettings): EqMove => ({
  shape: settings.shape ?? 'peaking',
  frequency: settings.frequency ?? 1000,
  gain: settings.shape === 'highpass' || settings.shape === 'lowpass' ? 0 : (settings.gainDb ?? 0),
  q: settings.shape === 'peaking' ? (settings.q ?? 1.4) : Math.SQRT1_2,
});
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
/** The lab tool that fits a skill, so a report's suggestion opens on the right one. */
export const labEffectFor = (skill: string | null | undefined): MixEffect | undefined =>
  skill === 'eq'
    ? 'eq'
    : skill === 'compression' || skill === 'attack' || skill === 'release'
      ? 'compression'
      : skill === 'masking' || skill === 'reverb' || skill === 'delay'
        ? skill
        : skill === 'stereo'
          ? 'pan'
          : undefined;

export function MixLab({
  engine,
  locale,
  volume,
  onVolume,
  onBack,
  initial = 'compression',
}: {
  engine: AudioEngine;
  locale: Locale;
  volume: number;
  onVolume: (value: number) => void;
  onBack: () => void;
  /** The tool to open on. */
  initial?: MixEffect;
}) {
  const t = (value: ReturnType<typeof text>) => tx(value, locale);
  const [effect, setEffect] = useState<MixEffect>(initial);
  const [settings, setSettings] = useState(defaults[initial]);
  // The sound follows a slider a moment after it settles; every step would re-render audio.
  const [applied, setApplied] = useState(settings);
  useEffect(() => {
    const timer = setTimeout(() => setApplied(settings), 140);
    return () => clearTimeout(timer);
  }, [settings]);
  const picked = useRef<{ target?: File; backing?: File }>({});
  const [start, setStart] = useState(0);
  const [source, setSource] = useState<EqSource>('acoustic');
  const [file, setFile] = useState<FileInfo | null>(null),
    [backing, setBacking] = useState<FileInfo | null>(null);
  const [busy, setBusy] = useState(false),
    [exporting, setExporting] = useState(false),
    [error, setError] = useState('');
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      engine.clearCustom();
      engine.setMono(false);
    };
  }, [engine]);
  const question: Question = useMemo(() => {
    const id =
      effect === 'pan'
        ? 'stereo-1'
        : effect === 'width'
          ? 'stereo-2'
          : effect === 'phase'
            ? 'stereo-3'
            : effect === 'eq'
              ? 'compression-1'
              : `${effect}-1`;
    const base = makeQuestion(id, 1618, 0, source);
    const settings =
      effect === 'eq'
        ? (({ shape, frequency, gain, q }) => ({ shape, frequency, gainDb: gain, q }))(
            eqMove(applied),
          )
        : applied;
    const reference: MixSettings =
      effect === 'compression'
        ? { ...settings, ratio: 1 }
        : effect === 'eq'
          ? {}
          : effect === 'masking'
            ? { cutDb: 0 }
            : effect === 'pan'
              ? { pan: 0 }
              : effect === 'width'
                ? { width: 1 }
                : effect === 'phase'
                  ? { invert: false }
                  : { ...settings, wet: 0 };
    return {
      ...base,
      options: [],
      correct: '',
      customId: file?.id,
      mix: { ...base.mix!, effect, reference, target: settings, alternatives: {} },
    };
  }, [effect, applied, source, file?.id]);
  const ready = !busy && (!file || effect !== 'masking' || !!backing);
  const read = async (event: ChangeEvent<HTMLInputElement>, isBacking = false) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const info = await engine.loadFile(selected, isBacking, isBacking ? start : 0);
      if (!alive.current) return;
      if (isBacking) {
        picked.current.backing = selected;
        setBacking(info);
        setFile(current => (current ? { ...current, id: info.id } : null));
      } else {
        picked.current = { target: selected };
        setStart(0);
        setFile(info);
        setBacking(null);
      }
    } catch (caught) {
      if (alive.current && (caught as Error).message !== 'cancelled')
        setError(
          t(
            text(
              'Dosya okunamadı. 20 MB altında, en az 0.25 saniyelik mono/stereo WAV veya tarayıcının desteklediği bir ses dosyası seç. Mevcut kaynak korunuyor.',
              'Could not read the file. Choose a mono/stereo WAV or a browser-supported audio file under 20 MB and at least 0.25 seconds long. The current source is preserved.',
            ),
          ),
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  /** Loads the eight seconds that begin at `seconds`, for the recording and its backing. */
  const moveTo = async (seconds: number) => {
    const { target, backing: bed } = picked.current;
    if (!target) return;
    setBusy(true);
    setError('');
    try {
      let info = await engine.loadFile(target, false, seconds);
      if (bed) {
        const bedInfo = await engine.loadFile(bed, true, seconds);
        info = { ...info, id: bedInfo.id };
        if (alive.current) setBacking(bedInfo);
      }
      if (alive.current) setFile(info);
    } catch (caught) {
      if (alive.current && (caught as Error).message !== 'cancelled')
        setError(
          t(
            text(
              'Bu bölüm hazırlanamadı. Başka bir başlangıç noktası dene.',
              'This section could not be prepared. Try another starting point.',
            ),
          ),
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const download = async () => {
    setExporting(true);
    setError('');
    try {
      const buffer = await engine.processedPreview(question);
      if (!alive.current) return;
      const channels = Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
        buffer.getChannelData(channel),
      );
      const url = URL.createObjectURL(
        new Blob([encodeWav(channels, buffer.sampleRate)], { type: 'audio/wav' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `freq-${effect}-preview.wav`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (alive.current)
        setError(
          t(
            text(
              'Örnek hazırlanamadı. Dinle düğmesiyle tekrar dene.',
              'Could not render the preview. Try Listen again.',
            ),
          ),
        );
    } finally {
      if (alive.current) setExporting(false);
    }
  };
  return (
    <div className="mix-lab">
      <button className="text-button back-link" onClick={onBack}>
        <ArrowLeft size={17} />
        {t(text('Miks yoluna dön', 'Back to the mixing path'))}
      </button>
      <div className="page-heading">
        <div className="eyebrow">{t(text('SERBEST DİNLEME', 'FREE LISTENING'))}</div>
        <h1>{t(text('Kendi kaydınla çalış.', 'Work with your recording.'))}</h1>
        <p className="lead">
          {t(
            text(
              'Hazır akustik örneği veya kendi dosyanı karşılaştır. A referans, B senin ayarın. Ses çalarken ayarı değiştir; yeni ayar kısa bir an sonra, döngü kesilmeden duyulur. Bu alanda puan veya doğru yanıt yok.',
              'Compare the acoustic example or your own file. A is the reference; B uses your settings. Change a setting while it plays; the new setting is heard a moment later without the loop stopping. This space has no score or correct answer.',
            ),
          )}
        </p>
      </div>
      <section className="lab-source setting-card">
        <h2>{t(text('Dinleyeceğin kayıt', 'Your recording'))}</h2>
        <p>
          {t(
            text(
              'Dosya cihazında işlenir; sunucuya gönderilmez ve yedeğe eklenmez. Seçtiğin noktadan başlayan 8 saniye kullanılır; reverb/delay için kuyruk eklenir. En fazla 20 MB, mono/stereo ses.',
              'Files are processed on this device, without upload or inclusion in backups. Eight seconds from the point you choose are used, with a tail added for reverb/delay. Up to 20 MB, mono/stereo audio.',
            ),
          )}
        </p>
        <label className="button secondary file-button">
          <Upload size={17} />
          {t(text('Ses dosyanı seç', 'Choose your audio file'))}
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.flac,.m4a,.ogg"
            disabled={busy}
            onChange={event => void read(event)}
          />
        </label>
        {file && (
          <div className="file-details">
            <span>
              {file.name} · {file.duration.toFixed(1)} s · {file.channels === 1 ? 'Mono' : 'Stereo'}
            </span>
            <button
              className="text-button"
              onClick={() => {
                engine.clearCustom();
                picked.current = {};
                setStart(0);
                setFile(null);
                setBacking(null);
                setError('');
              }}
            >
              <X size={15} />
              {t(text('Hazır örneğe dön', 'Return to the bundled sample'))}
            </button>
          </div>
        )}
        {file && file.total > 8.5 && (
          <label className="lab-section-picker">
            <span>
              {t(text('Dinlenecek bölümün başlangıcı', 'Where the section starts'))}
              <output>
                {clock(start)} – {clock(Math.min(file.total, start + 8))} / {clock(file.total)}
              </output>
            </span>
            <input
              type="range"
              data-testid="lab-start"
              aria-label={t(text('Dinlenecek bölümün başlangıcı', 'Where the section starts'))}
              min={0}
              max={Math.floor(file.total - 8)}
              step={1}
              value={start}
              disabled={busy}
              onChange={event => setStart(Number(event.target.value))}
              onPointerUp={event => void moveTo(Number(event.currentTarget.value))}
              onKeyUp={event => void moveTo(Number(event.currentTarget.value))}
            />
          </label>
        )}
        {file && effect === 'masking' && (
          <>
            <p>
              {t(
                text(
                  'Masking için ayrı eşlik kaydını seç. İki dosya aynı noktadan başlamalı; melodinin yalnızca eşlik EQ’suna karşı nasıl duyulduğunu karşılaştıracağız.',
                  'For masking, choose a separate backing track. Both files should start at the same timeline position; compare the unchanged melody against EQ on the backing only.',
                ),
              )}
            </p>
            <label className="button secondary file-button">
              <Upload size={17} />
              {t(text('Eşlik dosyasını seç', 'Choose the backing file'))}
              <input
                type="file"
                accept="audio/*,.wav,.mp3,.flac"
                disabled={busy}
                onChange={event => void read(event, true)}
              />
            </label>
            {backing && <p className="small-copy">{backing.name}</p>}
          </>
        )}
        {busy && <p role="status">{t(text('Kayıt hazırlanıyor…', 'Preparing the recording…'))}</p>}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        {!file && (
          <SourcePicker
            value={source}
            sources={sourcesFor('compression')}
            locale={locale}
            onChange={value => {
              engine.stop();
              setSource(value);
            }}
          />
        )}
      </section>
      <div className="lab-columns">
        <section className="setting-card">
          <label className="effect-select">
            {t(text('Ne üzerinde çalışacağız?', 'What will you explore?'))}
            <select
              value={effect}
              onChange={event => {
                const next = event.target.value as MixEffect;
                engine.stop();
                setEffect(next);
                setSettings(defaults[next]);
                setApplied(defaults[next]);
              }}
            >
              {Object.entries(effectNames).map(([id, name]) => (
                <option key={id} value={id}>
                  {t(name)}
                </option>
              ))}
            </select>
          </label>
          {effect === 'eq' && (
            <div className="lab-controls" data-testid="lab-eq">
              <div
                className="setting-options lab-shapes"
                role="group"
                aria-label={t(text('EQ biçimi', 'EQ shape'))}
              >
                {eqShapes.map(([shape, name]) => (
                  <button
                    key={shape}
                    data-testid={`lab-shape-${shape}`}
                    className={settings.shape === shape ? 'selected' : ''}
                    aria-pressed={settings.shape === shape}
                    onClick={() => setSettings(current => ({ ...current, shape }))}
                  >
                    {t(name)}
                  </button>
                ))}
              </div>
              <label>
                <span>
                  {t(
                    settings.shape === 'peaking'
                      ? text('Merkez frekans', 'Centre frequency')
                      : text('Köşe frekansı', 'Corner frequency'),
                  )}
                  <output>{formatHz(settings.frequency ?? 1000)}</output>
                </span>
                <input
                  type="range"
                  data-testid="lab-eq-frequency"
                  aria-label={t(text('Frekans', 'Frequency'))}
                  aria-valuetext={formatHz(settings.frequency ?? 1000)}
                  min={0}
                  max={STEPS}
                  step={1}
                  value={hzStep(settings.frequency ?? 1000)}
                  onChange={event =>
                    setSettings(current => ({
                      ...current,
                      frequency: stepHz(Number(event.target.value)),
                    }))
                  }
                />
              </label>
              {settings.shape !== 'highpass' && settings.shape !== 'lowpass' && (
                <label>
                  <span>
                    {t(text('Miktar', 'Amount'))}
                    <output>
                      {(settings.gainDb ?? 0) > 0 ? '+' : ''}
                      {(settings.gainDb ?? 0).toFixed(1)} dB
                    </output>
                  </span>
                  <input
                    type="range"
                    data-testid="lab-eq-gain"
                    aria-label={t(text('Miktar', 'Amount'))}
                    min={-15}
                    max={15}
                    step={0.5}
                    value={settings.gainDb ?? 0}
                    onChange={event =>
                      setSettings(current => ({ ...current, gainDb: Number(event.target.value) }))
                    }
                  />
                </label>
              )}
              {settings.shape === 'peaking' && (
                <label>
                  <span>
                    {t(text('Bant genişliği (Q)', 'Bandwidth (Q)'))}
                    <output>{(settings.q ?? 1.4).toFixed(1)}</output>
                  </span>
                  <input
                    type="range"
                    data-testid="lab-eq-q"
                    aria-label={t(text('Bant genişliği (Q)', 'Bandwidth (Q)'))}
                    min={0.4}
                    max={8}
                    step={0.1}
                    value={settings.q ?? 1.4}
                    onChange={event =>
                      setSettings(current => ({ ...current, q: Number(event.target.value) }))
                    }
                  />
                </label>
              )}
              <EqMoveCurve move={eqMove(settings)} locale={locale} />
            </div>
          )}
          <div className="lab-controls">
            {controls[effect]?.map(([key, label, min, max, step, unit]) => (
              <label key={key}>
                <span>
                  {t(label)}
                  <output>
                    {Number(settings[key]).toFixed(step < 1 ? 2 : 0)} {unit}
                  </output>
                </span>
                <input
                  type="range"
                  aria-label={t(label)}
                  min={min}
                  max={max}
                  step={step}
                  value={Number(settings[key])}
                  onChange={event =>
                    setSettings(current => ({ ...current, [key]: Number(event.target.value) }))
                  }
                />
              </label>
            ))}
          </div>
          {effect === 'phase' && (
            <label className="lab-checkbox">
              <input
                type="checkbox"
                checked={!!settings.invert}
                onChange={event => setSettings({ invert: event.target.checked })}
              />
              {t(text('Sağ kanalın polaritesini ters çevir', 'Invert the right channel polarity'))}
            </label>
          )}
          {effect === 'delay' && (
            <label className="lab-checkbox">
              <input
                type="checkbox"
                checked={!!settings.pingPong}
                onChange={event =>
                  setSettings(current => ({ ...current, pingPong: event.target.checked }))
                }
              />
              Ping-pong
            </label>
          )}
          {effect === 'width' && file?.channels === 1 && (
            <p className="small-copy">
              {t(
                text(
                  'Bu dosya mono: mevcut yan bileşen yok. Genişlik karşılaştırması için stereo kayıt seç.',
                  'This file is mono and has no side component. Choose a stereo recording to compare width.',
                ),
              )}
            </p>
          )}
          <p className="small-copy">
            {t(
              text(
                'A/B ortalama seviyeleri eşitlenir. Efekt miktarı kuru sese eklenen miktardır; bu kısa önizleme eğitim içindir.',
                'Average A/B levels are matched. Effect amount is added to the dry signal; this short preview is for learning.',
              ),
            )}
          </p>
        </section>
        <section className="lab-listening">
          {ready ? (
            <>
              <AudioPlayer
                engine={engine}
                question={question}
                locale={locale}
                volume={volume}
                onVolume={onVolume}
                follow
              />
              <MixFeedback question={question} engine={engine} locale={locale} />
              <button
                className="button secondary"
                onClick={() => void download()}
                disabled={exporting}
              >
                <Download size={17} />
                {t(
                  exporting
                    ? text('Hazırlanıyor…', 'Rendering…')
                    : text('İşlenmiş örneği indir', 'Download the processed preview'),
                )}
              </button>
            </>
          ) : (
            <p className="notice">
              {t(
                text(
                  'Dinlemek için kayıtların hazırlanmasını tamamla; masking’de hedef ve eşlik birlikte gerekir.',
                  'Finish preparing the recordings; masking needs both a target and a backing track.',
                ),
              )}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
