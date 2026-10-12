import { Headphones } from 'lucide-react';
import { AudioEngine } from '../audio';
import { text, tx, type Locale } from '../i18n';
import { makeQuestion } from '../model';

export function StereoCheck({ engine, locale, ready, onReady }: { engine: AudioEngine; locale: Locale; ready: boolean; onReady: (value: boolean) => void }) {
  const test = (pan: number) => {
    engine.setMono(false);
    const question = makeQuestion('stereo-1', 888, 0, 'drums');
    void engine.play({ ...question, mix: { ...question.mix!, target: { pan } } }, 'b');
  };
  return <section className="stereo-check"><h2><Headphones size={20} />{tx(text('Stereo dinleme kontrolü', 'Stereo listening check'), locale)}</h2>
    <p>{tx(text('Kulaklık kullan. Sol ve sağ örnek farklı kulaklardan gelmeli; cihazındaki mono ses ayarını kapat. İki örnek aynı yerdeyse stereo sorularını bu kurulumla değerlendirme.', 'Use headphones. Left and right should reach different ears; disable your device’s mono setting. If both samples sound centred, change your listening setup before judging stereo questions.'), locale)}</p>
    <div><button className="button secondary" onClick={() => test(-1)}>{tx(text('Sol kanalı dinle', 'Hear left channel'), locale)}</button><button className="button secondary" onClick={() => test(1)}>{tx(text('Sağ kanalı dinle', 'Hear right channel'), locale)}</button></div>
    <label><input type="checkbox" checked={ready} onChange={event => { engine.stop(); onReady(event.target.checked); }} />{tx(text('Stereo kulaklıkla sol/sağ ayrımını duyabiliyorum.', 'I can hear left/right separation with stereo headphones.'), locale)}</label>
  </section>;
}
