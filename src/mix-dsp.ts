import { random } from './model';
import type { Material, MixSettings, MixSpec, Stereo } from './mix-types';

export const stereoRms = (channels: Stereo) => Math.sqrt(channels.reduce((sum, data) => sum + data.reduce((s, value) => s + value * value, 0), 0) / Math.max(1, channels[0].length * 2));
export const stereoPeak = (channels: Stereo) => channels.reduce((maximum, data) => data.reduce((m, value) => Math.max(m, Math.abs(value)), maximum), 0);
export const monoSum = (channels: Stereo) => Float32Array.from(channels[0], (value, i) => (value + channels[1][i]) * 0.5);
export const centre = (data: Float32Array): Stereo => [new Float32Array(data), new Float32Array(data)];
export function signalInfo(channels: Stereo) {
  const rms = stereoRms(channels), peak = stereoPeak(channels), mono = monoSum(channels);
  let product = 0, leftPower = 0, rightPower = 0;
  for (let i = 0; i < channels[0].length; i++) { product += channels[0][i] * channels[1][i]; leftPower += channels[0][i] ** 2; rightPower += channels[1][i] ** 2; }
  const envelope = Array.from({ length: 80 }, (_, bin) => {
    const start = Math.floor(bin / 80 * channels[0].length), end = Math.floor((bin + 1) / 80 * channels[0].length);
    let maximum = 0;
    for (let i = start; i < end; i++) maximum = Math.max(maximum, Math.abs(channels[0][i]), Math.abs(channels[1][i]));
    return maximum;
  });
  return { rms, peak, crest: rms > 1e-9 ? 20 * Math.log10(peak / rms) : 0,
    monoRms: Math.sqrt(mono.reduce((sum, value) => sum + value * value, 0) / Math.max(1, mono.length)),
    correlation: leftPower * rightPower > 1e-18 ? product / Math.sqrt(leftPower * rightPower) : 0, envelope };
}
export type SignalInfo = ReturnType<typeof signalInfo>;
const silence = (length: number): Stereo => [new Float32Array(length), new Float32Array(length)];
export function matchStereoLevels(buffers: Stereo[], solo?: Stereo) {
  const reference = stereoRms(buffers[0]);
  for (const buffer of buffers.slice(1)) {
    const rms = stereoRms(buffer), scale = rms > 1e-9 ? reference / rms : 1;
    for (const data of buffer) for (let i = 0; i < data.length; i++) data[i] *= scale;
  }
  const scale = Math.min(1, 0.72 / Math.max(...buffers.map(stereoPeak), solo ? stereoPeak(solo) : 0, 1e-9));
  for (const buffer of [...buffers, ...(solo ? [solo] : [])]) for (const data of buffer) for (let i = 0; i < data.length; i++) data[i] *= scale;
}

/** Linked feed-forward peak detector, fixed 1 ms detector smoothing, 6 dB soft knee.
 * Attack/release are one-pole gain time constants, not promises about other plugins.
 */
export function compressStereo(input: Stereo, rate: number, settings: MixSettings): Stereo {
  const { threshold = -24, ratio = 6, attackMs = 12, releaseMs = 180 } = settings;
  const output = silence(input[0].length);
  const detectorCoefficient = Math.exp(-1 / (rate * 0.001));
  const attack = Math.exp(-1 / (rate * Math.max(0.0001, attackMs / 1000)));
  const release = Math.exp(-1 / (rate * Math.max(0.0001, releaseMs / 1000)));
  let detector = 0, reduction = 0;
  for (let i = 0; i < input[0].length; i++) {
    const absolute = Math.max(Math.abs(input[0][i]), Math.abs(input[1][i]));
    detector = detectorCoefficient * detector + (1 - detectorCoefficient) * absolute;
    const over = 20 * Math.log10(Math.max(detector, 1e-9)) - threshold;
    const knee = 6;
    const wanted = ratio <= 1 || over <= -knee / 2 ? 0 : over >= knee / 2 ? (1 - 1 / ratio) * over : (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee);
    const coefficient = wanted > reduction ? attack : release;
    reduction = coefficient * reduction + (1 - coefficient) * wanted;
    const gain = 10 ** (-reduction / 20);
    output[0][i] = input[0][i] * gain; output[1][i] = input[1][i] * gain;
  }
  return output;
}

// Equal-power panning. The mono source is explicitly rendered to two channels.
export function panStereo(data: Float32Array, pan: number): Stereo {
  const angle = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4;
  return [Float32Array.from(data, value => value * Math.cos(angle)), Float32Array.from(data, value => value * Math.sin(angle))];
}
export function widen(input: Stereo, width: number): Stereo {
  const result = silence(input[0].length);
  for (let i = 0; i < input[0].length; i++) {
    const mid = (input[0][i] + input[1][i]) * 0.5, side = (input[0][i] - input[1][i]) * 0.5 * width;
    result[0][i] = mid + side; result[1][i] = mid - side;
  }
  return result;
}

/** Cookbook peaking/band-pass biquads, used on the backing and target separately. */
export function filterMono(data: Float32Array, rate: number, hz: number, db = 0, bandpass = false): Float32Array<ArrayBuffer> {
  const w = 2 * Math.PI * hz / rate, alpha = Math.sin(w) / (2 * (bandpass ? 1.1 : 1)), A = 10 ** (db / 40);
  const a0 = bandpass ? 1 + alpha : 1 + alpha / A;
  const coefficients = bandpass ? [alpha / a0, 0, -alpha / a0, -2 * Math.cos(w) / a0, (1 - alpha) / a0] : [(1 + alpha * A) / a0, -2 * Math.cos(w) / a0, (1 - alpha * A) / a0, -2 * Math.cos(w) / a0, (1 - alpha / A) / a0];
  const [b0, b1, b2, a1, a2] = coefficients;
  const output = new Float32Array(data.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < data.length; i++) {
    const x = data[i], y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    output[i] = y; x2 = x1; x1 = x; y2 = y1; y1 = y;
  }
  return output;
}

/** Deterministic stereo Schroeder-style reverb: early reflections, four damped combs,
 * two all-pass diffusion stages per channel.
 * Decay is a nominal RT60 coefficient; this is not a sampled room or plugin emulation.
 */
export function reverberate(input: Stereo, rate: number, settings: MixSettings): Stereo {
  const { decay = 1.5, preDelayMs = 0, wet = 0.35 } = settings;
  const output: Stereo = [new Float32Array(input[0]), new Float32Array(input[1])];
  if (!wet) return output;
  const pre = Math.round(rate * preDelayMs / 1000);
  for (const channel of [0, 1] as const) {
    let reflections = new Float32Array(input[channel].length);
    for (const seconds of [0.013, 0.023]) {
      const offset = pre + Math.round(rate * (seconds + channel * 0.0017));
      for (let i = offset; i < output[channel].length; i++) reflections[i] += input[channel][i - offset] * 0.35;
    }
    for (const seconds of [0.0297, 0.0371, 0.0411, 0.0437]) {
      const delay = Math.round(rate * (seconds + channel * 0.0023));
      const feedback = 10 ** (-3 * delay / rate / decay);
      const line = new Float32Array(delay);
      let low = 0;
      for (let i = 0; i < output[channel].length; i++) {
        const at = i % delay, value = line[at];
        low += (value - low) * 0.45;
        line[at] = (i >= pre ? input[channel][i - pre] : 0) + low * feedback;
        reflections[i] += value * 0.22;
      }
    }
    for (const seconds of [0.0049, 0.0017]) {
      const delay = Math.max(1, Math.round(rate * (seconds + channel * 0.0003))), line = new Float32Array(delay);
      const diffused = new Float32Array(reflections.length);
      for (let i = 0; i < reflections.length; i++) {
        const at = i % delay, value = line[at] - reflections[i] * 0.5;
        line[at] = reflections[i] + value * 0.5; diffused[i] = value;
      }
      reflections = diffused;
    }
    for (let i = 0; i < output[channel].length; i++) output[channel][i] += reflections[i] * wet;
  }
  return output;
}
export function echo(input: Stereo, rate: number, settings: MixSettings): Stereo {
  const { delayMs = 250, feedback = 0.4, wet = 0.35, pingPong = false } = settings;
  const result: Stereo = [new Float32Array(input[0]), new Float32Array(input[1])];
  const delay = Math.max(1, Math.round(rate * delayMs / 1000));
  const mono = monoSum(input);
  for (let repeat = 1; repeat * delay < input[0].length; repeat++) {
    const gain = wet * feedback ** (repeat - 1);
    if (gain < 0.00001) break;
    for (let i = repeat * delay; i < input[0].length; i++) {
      const at = i - repeat * delay;
      if (pingPong) result[repeat % 2 === 1 ? 0 : 1][i] += mono[at] * gain * Math.SQRT2;
      else { result[0][i] += input[0][at] * gain; result[1][i] += input[1][at] * gain; }
    }
  }
  return result;
}

export function renderMix(material: Material, rate: number, spec: MixSpec, seed: number, source: string, customStereo?: Stereo) {
  const extra = spec.effect === 'delay' || spec.effect === 'reverb' ? rate * 4 : 0;
  const length = material.lead.length + extra;
  const padded = (data: Float32Array) => { const result = new Float32Array(length); result.set(data); return result; };
  const weights = source === 'drums' || source === 'recorded-drums' ? [0.1, 0.15, 0.9] : source === 'keys' || source === 'acoustic' ? [0.8, 0.3, 0.15] : [0.4, 0.3, 0.7];
  const mono = new Float32Array(length);
  for (let i = 0; i < material.lead.length; i++) mono[i] = material.lead[i] * weights[0] + material.bed[i] * weights[1] + material.hits[i] * weights[2];
  let input = customStereo ? [padded(customStereo[0]), padded(customStereo[1])] as Stereo : centre(mono);
  const max = Math.max(stereoPeak(input), 1e-9);
  const inputScale = Math.min(1, 0.65 / max);
  for (const channel of input) for (let i = 0; i < channel.length; i++) channel[i] *= inputScale;
  if (spec.effect === 'width' && !customStereo) {
    const rng = random(seed), direction = rng() > 0.5 ? 1 : -1;
    input = [padded(material.lead), padded(material.lead)];
    for (let i = 0; i < material.lead.length; i++) {
      input[0][i] += material.bed[i] * 0.55 * direction + material.hits[i] * 0.35;
      input[1][i] -= material.bed[i] * 0.55 * direction; input[1][i] += material.hits[i] * 0.35;
    }
  }
  let solo: Stereo | undefined;
  let target: Stereo | undefined;
  if (spec.effect === 'masking') {
    target = customStereo ? [padded(customStereo[0]), padded(customStereo[1])] : centre(padded(filterMono(material.lead, rate, spec.target.frequency!, 0, true)));
    // A fixed target-to-backing relation; no processing is applied to the target.
    if (!customStereo) {
      const rms = stereoRms(target);
      const gain = Math.min(12, 0.045 / Math.max(rms, 1e-9));
      for (const data of target) for (let i = 0; i < data.length; i++) data[i] *= gain;
    }
    solo = target;
  }
  const apply = (settings: MixSettings): Stereo => {
    if (spec.effect === 'compression') return compressStereo(input, rate, settings);
    if (spec.effect === 'pan') return panStereo(monoSum(input), settings.pan ?? 0);
    if (spec.effect === 'width') return widen(input, settings.width ?? 1);
    if (spec.effect === 'phase') return [new Float32Array(input[0]), Float32Array.from(input[1], value => settings.invert ? -value : value)];
    if (spec.effect === 'reverb') return reverberate(input, rate, settings);
    if (spec.effect === 'delay') return echo(input, rate, settings);
    const backing = material.backingStereo ?? centre(material.bed), data = silence(length);
    for (const channel of [0, 1] as const) {
      const filtered = settings.cutDb ? filterMono(backing[channel], rate, settings.frequency!, settings.cutDb) : backing[channel];
      for (let i = 0; i < material.lead.length; i++) data[channel][i] = target![channel][i] + filtered[i] * 0.8 + material.hits[i] * 0.1;
    }
    return data;
  };
  const a = apply(spec.reference), b = apply(spec.target), c = spec.comparison ? apply(spec.comparison) : undefined;
  matchStereoLevels([a, b, ...(c ? [c] : [])], solo);
  return { a, b, c, solo };
}
