import { useEffect, useState } from 'react';
import { AudioEngine } from '../audio';
import { text, tx, type Locale } from '../i18n';
import type { Question } from '../model';
import type { MixSettings } from '../mix-types';

export function settingLabels(setting: MixSettings, locale: Locale) {
  const labels: Record<string, [string, string, string]> = {
    threshold: ['Eşik', 'Threshold', 'dB'],
    ratio: ['Oran', 'Ratio', ':1'],
    attackMs: ['Atak', 'Attack', 'ms'],
    releaseMs: ['Bırakma', 'Release', 'ms'],
    frequency: ['Eşlik EQ', 'Backing EQ', 'Hz'],
    cutDb: ['Kesme', 'Cut', 'dB'],
    decay: ['Kuyruk', 'Decay', 's'],
    preDelayMs: ['Ön gecikme', 'Pre-delay', 'ms'],
    delayMs: ['Tekrar aralığı', 'Echo spacing', 'ms'],
    gainDb: ['Miktar', 'Amount', 'dB'],
  };
  const shapes: Record<string, [string, string]> = {
    peaking: ['Çan', 'Bell'],
    lowshelf: ['Bas rafı', 'Low shelf'],
    highshelf: ['Tiz rafı', 'High shelf'],
    highpass: ['Alçak kesen', 'High-pass'],
    lowpass: ['Yüksek kesen', 'Low-pass'],
  };
  // The lab's free EQ shares `frequency` with the masking tool; its own settings name it.
  const freeEq = 'shape' in setting;
  if (!Object.keys(setting).length) return [tx(text('İşlenmemiş', 'Unprocessed'), locale)];
  return Object.entries(setting)
    .map(([key, value]) => {
      if (key === 'pan')
        return `${tx(text('Konum', 'Position'), locale)}: ${value === 0 ? tx(text('Orta', 'Centre'), locale) : Number(value) < 0 ? tx(text('Sol', 'Left'), locale) : tx(text('Sağ', 'Right'), locale)}`;
      if (key === 'width')
        return `${tx(text('Yan bileşen', 'Side amount'), locale)}: ${Math.round(Number(value) * 100)}%`;
      if (key === 'invert')
        return tx(
          value
            ? text('Sağ kanal polaritesi ters', 'Right channel polarity inverted')
            : text('Normal polarite', 'Normal polarity'),
          locale,
        );
      if (key === 'pingPong')
        return value ? 'Ping-pong' : tx(text('Merkezde tekrar', 'Centred echoes'), locale);
      if (key === 'wet' || key === 'feedback')
        return `${key === 'wet' ? tx(text('Efekt miktarı', 'Effect amount'), locale) : 'Feedback'}: ${Math.round(Number(value) * 100)}%`;
      if (key === 'shape') return shapes[String(value)]?.[locale === 'tr' ? 0 : 1] ?? '';
      if (key === 'q') return setting.shape === 'peaking' ? `Q: ${Number(value).toFixed(1)}` : '';
      if (freeEq && key === 'frequency')
        return `${tx(text('Frekans', 'Frequency'), locale)}: ${value} Hz`;
      if (key === 'gainDb' && (setting.shape === 'highpass' || setting.shape === 'lowpass'))
        return '';
      const label = labels[key];
      return label
        ? `${label[locale === 'tr' ? 0 : 1]}: ${value}${label[2] === ':1' ? '' : ' '}${label[2]}`
        : '';
    })
    .filter(Boolean);
}

export function MixFeedback({
  question,
  engine,
  locale,
}: {
  question: Question;
  engine: AudioEngine;
  locale: Locale;
}) {
  const [, setRevision] = useState(0);
  useEffect(() => engine.subscribe(() => setRevision(value => value + 1)), [engine]);
  if (!question.mix) return null;
  const evidence = engine.getEvidence(question);
  const variants = [
    ['A', question.mix.reference],
    ['B', question.mix.target],
    ...(question.mix.comparison ? [['C', question.mix.comparison]] : []),
  ] as [string, MixSettings][];
  return (
    <div className="mix-feedback">
      <div className="mix-setting-rows">
        {variants.map(([variant, settings]) => (
          <div key={variant}>
            <strong>{variant}</strong>
            <div>
              {settingLabels(settings, locale).map(label => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {!evidence && (
        <p className="small-copy">
          {tx(
            text(
              'Örnekleri tekrar dinleyince gerçek sesin grafiği açılır.',
              'Listen to the samples to show the graph of the actual audio.',
            ),
            locale,
          )}
        </p>
      )}
      {evidence && (
        <div className="signal-scope">
          <svg
            viewBox="0 0 400 140"
            role="img"
            aria-label={tx(
              text(
                'Dinlenen gerçek örneklerin tepe zarfı: A referans, B hedef, varsa C seçim',
                'Peak envelopes of the actual samples: A reference, B target, and C choice if present',
              ),
              locale,
            )}
          >
            {[30, 70, 110].map(y => (
              <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="currentColor" opacity=".12" />
            ))}
            {(['a', 'b', 'c'] as const).map(
              (variant, index) =>
                evidence[variant] && (
                  <polyline
                    key={variant}
                    fill="none"
                    stroke={['#e4e8dc', '#c8ed86', '#efba9e'][index]}
                    strokeWidth="1.6"
                    points={evidence[variant]!.envelope.map(
                      (value, i) => `${(i / 79) * 400},${130 - (value / 0.72) * 115}`,
                    ).join(' ')}
                  />
                ),
            )}
          </svg>
          <p>
            {tx(
              text(
                'Dinlenen sesin tepe zarfı · A açık, B yeşil, C turuncu',
                'Peak envelope of the played audio · A light, B green, C orange',
              ),
              locale,
            )}
          </p>
          <div className="signal-readings">
            {(['a', 'b', 'c'] as const).map(
              variant =>
                evidence[variant] && (
                  <span key={variant}>
                    <strong>{variant.toUpperCase()}</strong>{' '}
                    {tx(text('Tepe/ortalama', 'Crest factor'), locale)}{' '}
                    {evidence[variant]!.crest.toFixed(1)} dB
                    {question.kind === 'stereo' &&
                      ` · ${tx(text('Korelasyon', 'Correlation'), locale)} ${evidence[variant]!.correlation.toFixed(2)}`}
                  </span>
                ),
            )}
          </div>
        </div>
      )}
      <p className="small-copy">
        {tx(
          question.kind === 'masking'
            ? text(
                'EQ yalnızca eşlik katmanına uygulandı. Hedef melodi korunuyor.',
                'EQ was applied only to the backing layer. The target melody is unchanged.',
              )
            : text(
                'A/B/C ortalama seviyeleri birlikte eşitlendi. Gösterilen ölçümler sinyal değerleridir.',
                'Average A/B/C levels were matched together. These measurements describe the signal.',
              ),
          locale,
        )}
      </p>
    </div>
  );
}
