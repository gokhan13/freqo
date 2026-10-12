import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { ArrowLeft, Download, Upload, X } from 'lucide-react';
import { text, tx, type EqSource, type Locale } from '../content';
import { AudioEngine } from '../audio';
import { makeQuestion, type Question } from '../model';
import type { MixEffect, MixSettings } from '../mix-types';
import { encodeWav } from '../wav';
import { AudioPlayer } from './AudioPlayer';
import { MixFeedback } from './MixFeedback';
import { SourcePicker } from './SourcePicker';

const effectNames: Record<MixEffect, ReturnType<typeof text>> = {
  compression: text('Kompresyon / attack / release', 'Compression / attack / release'), masking: text('Masking: eşlik EQ', 'Masking: backing EQ'),
  pan: text('Stereo konum', 'Stereo position'), width: text('Stereo genişlik', 'Stereo width'), phase: text('Polarite ve mono', 'Polarity & mono'),
  reverb: text('Reverb', 'Reverb'), delay: text('Delay', 'Delay'),
};
const defaults: Record<MixEffect, MixSettings> = {
  compression: { threshold: -24, ratio: 4, attackMs: 12, releaseMs: 180 }, masking: { frequency: 1000, cutDb: -6 },
  pan: { pan: 0.5 }, width: { width: 1.4 }, phase: { invert: false },
  reverb: { decay: 1.5, preDelayMs: 30, wet: 0.35 }, delay: { delayMs: 250, feedback: 0.4, wet: 0.35, pingPong: false },
};
const controls: Partial<Record<MixEffect, [keyof MixSettings, ReturnType<typeof text>, number, number, number, string][]>> = {
  compression: [['threshold', text('Eşik', 'Threshold'), -40, -6, 1, 'dB'], ['ratio', text('Oran', 'Ratio'), 1, 10, 0.5, ':1'], ['attackMs', text('Atak', 'Attack'), 1, 80, 1, 'ms'], ['releaseMs', text('Bırakma', 'Release'), 20, 800, 10, 'ms']],
  masking: [['frequency', text('Eşlik frekansı', 'Backing frequency'), 250, 3500, 50, 'Hz'], ['cutDb', text('Eşlikte kesme', 'Backing cut'), -15, 0, 1, 'dB']],
  pan: [['pan', text('Sol −1 · orta 0 · sağ +1', 'Left −1 · centre 0 · right +1'), -1, 1, 0.05, '']],
  width: [['width', text('Yan bileşen miktarı', 'Side amount'), 0, 2, 0.1, '×']],
  reverb: [['decay', text('Kuyruk', 'Decay'), 0.3, 3, 0.1, 's'], ['preDelayMs', text('Ön gecikme', 'Pre-delay'), 0, 100, 5, 'ms'], ['wet', text('Efekt miktarı', 'Effect amount'), 0, 0.7, 0.05, '×']],
  delay: [['delayMs', text('Tekrar aralığı', 'Echo spacing'), 80, 600, 10, 'ms'], ['feedback', text('Feedback', 'Feedback'), 0, 0.7, 0.05, '×'], ['wet', text('Efekt miktarı', 'Effect amount'), 0, 0.7, 0.05, '×']],
};
type FileInfo = { id: string; name: string; duration: number; channels: number };

export function MixLab({ engine, locale, volume, onVolume, onBack }: { engine: AudioEngine; locale: Locale; volume: number; onVolume: (value: number) => void; onBack: () => void }) {
  const t = (value: ReturnType<typeof text>) => tx(value, locale);
  const [effect, setEffect] = useState<MixEffect>('compression');
  const [settings, setSettings] = useState(defaults.compression);
  const [source, setSource] = useState<EqSource>('acoustic');
  const [file, setFile] = useState<FileInfo | null>(null), [backing, setBacking] = useState<FileInfo | null>(null);
  const [busy, setBusy] = useState(false), [exporting, setExporting] = useState(false), [error, setError] = useState('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; engine.clearCustom(); engine.setMono(false); }; }, [engine]);
  const question: Question = useMemo(() => {
    const id = effect === 'pan' ? 'stereo-1' : effect === 'width' ? 'stereo-2' : effect === 'phase' ? 'stereo-3' : `${effect}-1`;
    const base = makeQuestion(id, 1618, 0, source);
    const reference: MixSettings = effect === 'compression' ? { ...settings, ratio: 1 } : effect === 'masking' ? { cutDb: 0 } : effect === 'pan' ? { pan: 0 } : effect === 'width' ? { width: 1 } : effect === 'phase' ? { invert: false } : { ...settings, wet: 0 };
    return { ...base, options: [], correct: '', customId: file?.id, mix: { ...base.mix!, reference, target: settings, alternatives: {} } };
  }, [effect, settings, source, file?.id]);
  const ready = !busy && (!file || effect !== 'masking' || !!backing);
  const read = async (event: ChangeEvent<HTMLInputElement>, isBacking = false) => {
    const selected = event.target.files?.[0]; event.target.value = '';
    if (!selected) return;
    setBusy(true); setError('');
    try {
      const info = await engine.loadFile(selected, isBacking);
      if (!alive.current) return;
      if (isBacking) { setBacking(info); setFile(current => current ? { ...current, id: info.id } : null); }
      else { setFile(info); setBacking(null); }
    } catch (caught) {
      if (alive.current && (caught as Error).message !== 'cancelled') setError(t(text('Dosya okunamadı. 20 MB altında, en az 0.25 saniyelik mono/stereo WAV veya tarayıcının desteklediği bir ses dosyası seç. Mevcut kaynak korunuyor.', 'Could not read the file. Choose a mono/stereo WAV or a browser-supported audio file under 20 MB and at least 0.25 seconds long. The current source is preserved.')));
    } finally { if (alive.current) setBusy(false); }
  };
  const download = async () => {
    setExporting(true); setError('');
    try {
      const buffer = await engine.processedPreview(question);
      if (!alive.current) return;
      const channels = Array.from({ length: buffer.numberOfChannels }, (_, channel) => buffer.getChannelData(channel));
      const url = URL.createObjectURL(new Blob([encodeWav(channels, buffer.sampleRate)], { type: 'audio/wav' }));
      const link = document.createElement('a'); link.href = url; link.download = `freq-${effect}-preview.wav`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { if (alive.current) setError(t(text('Örnek hazırlanamadı. Dinle düğmesiyle tekrar dene.', 'Could not render the preview. Try Listen again.'))); }
    finally { if (alive.current) setExporting(false); }
  };
  return <div className="mix-lab">
    <button className="text-button back-link" onClick={onBack}><ArrowLeft size={17} />{t(text('Miks yoluna dön', 'Back to the mixing path'))}</button>
    <div className="page-heading"><div className="eyebrow">{t(text('SERBEST DİNLEME', 'FREE LISTENING'))}</div><h1>{t(text('Kendi kaydınla çalış.', 'Work with your recording.'))}</h1><p className="lead">{t(text('Hazır akustik örneği veya kendi dosyanı karşılaştır. A referans, B senin ayarın. Ayarı değiştirince tekrar Dinle’ye bas; bu alanda puan veya doğru yanıt yok.', 'Compare the acoustic example or your own file. A is the reference; B uses your settings. Press Listen after changing a setting; this space has no score or correct answer.'))}</p></div>
    <section className="lab-source setting-card"><h2>{t(text('Dinleyeceğin kayıt', 'Your recording'))}</h2>
      <p>{t(text('Dosya cihazında işlenir; sunucuya gönderilmez ve yedeğe eklenmez. İlk 8 saniye kullanılır; reverb/delay için kuyruk eklenir. En fazla 20 MB, mono/stereo ses.', 'Files are processed on this device, without upload or inclusion in backups. The first 8 seconds are used, with a tail added for reverb/delay. Up to 20 MB, mono/stereo audio.'))}</p>
      <label className="button secondary file-button"><Upload size={17} />{t(text('Ses dosyanı seç', 'Choose your audio file'))}<input type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.ogg" disabled={busy} onChange={event => void read(event)} /></label>
      {file && <div className="file-details"><span>{file.name} · {file.duration.toFixed(1)} s · {file.channels === 1 ? 'Mono' : 'Stereo'}</span><button className="text-button" onClick={() => { engine.clearCustom(); setFile(null); setBacking(null); setError(''); }}><X size={15} />{t(text('Hazır örneğe dön', 'Return to the bundled sample'))}</button></div>}
      {file && effect === 'masking' && <><p>{t(text('Masking için ayrı eşlik kaydını seç. İki dosya aynı noktadan başlamalı; melodinin yalnızca eşlik EQ’suna karşı nasıl duyulduğunu karşılaştıracağız.', 'For masking, choose a separate backing track. Both files should start at the same timeline position; compare the unchanged melody against EQ on the backing only.'))}</p><label className="button secondary file-button"><Upload size={17} />{t(text('Eşlik dosyasını seç', 'Choose the backing file'))}<input type="file" accept="audio/*,.wav,.mp3,.flac" disabled={busy} onChange={event => void read(event, true)} /></label>{backing && <p className="small-copy">{backing.name}</p>}</>}
      {busy && <p role="status">{t(text('Kayıt hazırlanıyor…', 'Preparing the recording…'))}</p>}
      {error && <p className="notice" role="alert">{error}</p>}
      {!file && <SourcePicker value={source} locale={locale} onChange={value => { engine.stop(); setSource(value); }} />}
    </section>
    <div className="lab-columns"><section className="setting-card"><label className="effect-select">{t(text('Ne üzerinde çalışacağız?', 'What will you explore?'))}<select value={effect} onChange={event => { const next = event.target.value as MixEffect; engine.stop(); setEffect(next); setSettings(defaults[next]); }}>{Object.entries(effectNames).map(([id, name]) => <option key={id} value={id}>{t(name)}</option>)}</select></label>
      <div className="lab-controls">{controls[effect]?.map(([key, label, min, max, step, unit]) => <label key={key}><span>{t(label)}<output>{Number(settings[key]).toFixed(step < 1 ? 2 : 0)} {unit}</output></span><input type="range" aria-label={t(label)} min={min} max={max} step={step} value={Number(settings[key])} onChange={event => setSettings(current => ({ ...current, [key]: Number(event.target.value) }))} /></label>)}</div>
      {effect === 'phase' && <label className="lab-checkbox"><input type="checkbox" checked={!!settings.invert} onChange={event => setSettings({ invert: event.target.checked })} />{t(text('Sağ kanalın polaritesini ters çevir', 'Invert the right channel polarity'))}</label>}
      {effect === 'delay' && <label className="lab-checkbox"><input type="checkbox" checked={!!settings.pingPong} onChange={event => setSettings(current => ({ ...current, pingPong: event.target.checked }))} />Ping-pong</label>}
      {effect === 'width' && file?.channels === 1 && <p className="small-copy">{t(text('Bu dosya mono: mevcut yan bileşen yok. Genişlik karşılaştırması için stereo kayıt seç.', 'This file is mono and has no side component. Choose a stereo recording to compare width.'))}</p>}
      <p className="small-copy">{t(text('A/B ortalama seviyeleri eşitlenir. Efekt miktarı kuru sese eklenen miktardır; bu kısa önizleme eğitim içindir.', 'Average A/B levels are matched. Effect amount is added to the dry signal; this short preview is for learning.'))}</p>
    </section><section className="lab-listening">{ready ? <><AudioPlayer engine={engine} question={question} locale={locale} volume={volume} onVolume={onVolume} /><MixFeedback question={question} engine={engine} locale={locale} /><button className="button secondary" onClick={() => void download()} disabled={exporting}><Download size={17} />{t(exporting ? text('Hazırlanıyor…', 'Rendering…') : text('İşlenmiş örneği indir', 'Download the processed preview'))}</button></> : <p className="notice">{t(text('Dinlemek için kayıtların hazırlanmasını tamamla; masking’de hedef ve eşlik birlikte gerekir.', 'Finish preparing the recordings; masking needs both a target and a backing track.'))}</p>}</section></div>
  </div>;
}
