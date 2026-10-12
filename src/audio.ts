import { makeCandidateAudio, makeMusicAudio } from './music-dsp';
import { degreeMidi } from './music-model';
import { random, type Question } from './model';
import { usesLoop, type EqSource } from './content';
import { isRecording, recordedMaterial, recording } from './recordings';
import { monoSum, renderMix, signalInfo, type SignalInfo } from './mix-dsp';
import type { Material, Stereo } from './mix-types';

export type Variant = 'a' | 'b' | 'c' | 'solo' | 'context' | 'resolution' | 'capture';
export type AudioStatus = 'idle' | 'preparing' | 'playing' | 'error';
export const MIN_LOOP_EXPOSURE = 1;
type Pair = { a: AudioBuffer; b: AudioBuffer; c?: AudioBuffer; solo?: AudioBuffer; context?: AudioBuffer; resolution?: AudioBuffer; capture?: AudioBuffer; evidence?: { a: SignalInfo; b: SignalInfo; c?: SignalInfo } };
export const rms = (data: Float32Array) => Math.sqrt(data.reduce((sum, x) => sum + x * x, 0) / Math.max(1, data.length));
export const peak = (data: Float32Array) => data.reduce((max, x) => Math.max(max, Math.abs(x)), 0);

// All versions get one shared headroom adjustment after RMS matching.
export function matchLevelGroup(buffers: Float32Array[]) {
  if (!buffers.length) return;
  const reference = rms(buffers[0]);
  for (const data of buffers.slice(1)) {
    const level = rms(data), ratio = level > 1e-9 ? reference / level : 1;
    for (let i = 0; i < data.length; i++) data[i] *= ratio;
  }
  const scale = Math.min(1, 0.72 / Math.max(...buffers.map(peak), 1e-9));
  for (const data of buffers) for (let i = 0; i < data.length; i++) data[i] *= scale;
}
export function matchLevels(a: Float32Array, b: Float32Array) {
  matchLevelGroup([a, b]);
  return { dryRms: rms(a), wetRms: rms(b), maxPeak: Math.max(peak(a), peak(b)) };
}

// Preserve the intentional relative level; apply only shared clipping headroom.
export function makeLevelPair(data: Float32Array, db: number) {
  const a = new Float32Array(data);
  const b = Float32Array.from(data, sample => sample * Math.pow(10, db / 20));
  const scale = Math.min(1, 0.72 / Math.max(peak(a), peak(b), 1e-9));
  for (let i = 0; i < a.length; i++) { a[i] *= scale; b[i] *= scale; }
  return { a, b };
}

// Sample-clock rendering: four count-in beats, then a four-beat bar.
// No timer or UI frame rate participates in rhythm timing.
export function makeRhythm(rate: number, slots: number[], subdivision: number, tempo: number): Float32Array<ArrayBuffer> {
  const beat = 60 / tempo;
  const data = new Float32Array(Math.ceil((8 * beat + 0.2) * rate));
  const hit = (time: number, hz: number, amplitude: number) => {
    const start = Math.round(time * rate), length = Math.round(0.065 * rate);
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const envelope = Math.min(1, t / 0.002) * Math.pow(1 - i / length, 3);
      data[start + i] += Math.sin(2 * Math.PI * hz * t) * envelope * amplitude;
    }
  };
  for (let i = 0; i < 4; i++) {
    hit(i * beat, i === 0 ? 1320 : 880, 0.22);
    hit((4 + i) * beat, 660, 0.055);
  }
  for (const slot of slots) hit((4 + slot / subdivision) * beat, 220, 0.36);
  return data;
}

// Original synthesized material: kick, bass, arpeggio, hi-hat and air.
// No network, microphone, commercial recordings or external audio assets.
export function makeLoop(rate: number, seed: number, source: 'studio' | 'drums' | 'keys' = 'studio'): Float32Array<ArrayBuffer> {
  const data = new Float32Array(rate * 4);
  const rng = random(seed);
  const roots = [55, 65.406, 73.416];
  const root = roots[Math.floor(rng() * roots.length)];
  const chord = [4, 7, 12, 16, 19, 24];
  const profile = source === 'drums' ? { kick: 0.4, bass: 0.055, tone: 0.017, hat: 0.16, air: 0.022 } : source === 'keys' ? { kick: 0.09, bass: 0.09, tone: 0.09, hat: 0.045, air: 0.017 } : { kick: 0.28, bass: 0.09, tone: 0.045, hat: 0.1, air: 0.018 };
  let previousNoise = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / rate;
    const beatTime = t % 0.5;
    const hatTime = t % 0.25;
    const noteTime = t % 0.25;
    const note = chord[Math.floor(t / 0.25) % chord.length];
    const hz = root * Math.pow(2, note / 12);
    const noise = rng() * 2 - 1;
    const highNoise = (noise - previousNoise) * 0.5;
    previousNoise = noise;
    const kick = Math.sin(2 * Math.PI * (55 * beatTime + 7 * (1 - Math.exp(-beatTime * 35)))) * Math.exp(-beatTime * 18) * profile.kick;
    const bass = (Math.sin(2 * Math.PI * root * t) + 0.3 * Math.sin(2 * Math.PI * root * 2 * t)) * profile.bass;
    const envelope = (1 - Math.exp(-noteTime * 150)) * Math.exp(-noteTime * 11);
    let tone = 0;
    for (let h = 1; h <= 6; h++) tone += Math.sin(2 * Math.PI * hz * h * t) * profile.tone / Math.pow(h, 1.3);
    const hat = highNoise * Math.exp(-hatTime * 50) * profile.hat;
    const air = highNoise * profile.air;
    const snareTime = (t + 0.25) % 0.5;
    const snare = source === 'drums' ? (noise * 0.17 + Math.sin(2 * Math.PI * 185 * snareTime) * 0.09) * Math.exp(-snareTime * 22) : 0;
    data[i] = kick + bass + tone * envelope + hat + air + snare;
  }
  // Avoid a discontinuity at the loop boundary.
  const fade = Math.round(rate * 0.006);
  for (let i = 0; i < fade; i++) { data[i] *= i / fade; data[data.length - 1 - i] *= i / fade; }
  return data;
}

export function makeNotes(rate: number, notes: number[], chord = false): Float32Array<ArrayBuffer> {
  const step = 0.58;
  const duration = chord ? 1.4 : notes.length * step + 0.25;
  const data = new Float32Array(Math.ceil(duration * rate));
  notes.forEach((midi, index) => {
    const hz = 440 * Math.pow(2, (midi - 69) / 12);
    const start = chord ? 0 : index * step;
    const length = chord ? 1.2 : 0.48;
    for (let i = 0; i < Math.floor(length * rate); i++) {
      const t = i / rate;
      const env = Math.min(1, t / 0.015) * Math.min(1, (length - t) / 0.08) * Math.exp(-t * 1.4);
      const value = (Math.sin(2 * Math.PI * hz * t) + 0.18 * Math.sin(2 * Math.PI * hz * 2 * t)) * env * (chord ? 0.13 : 0.3);
      data[Math.round(start * rate) + i] += value;
    }
  });
  return data;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private gains: GainNode[] = [];
  private listeners = new Set<(status: AudioStatus) => void>();
  private cache = new Map<string, Promise<Pair>>();
  private activeKey = '';
  private token = 0;
  private captureRequested = false;
  private volume = 0.35;
  private mono = false;
  private loadToken = 0;
  private custom: { id: string; stereo: Stereo; bed?: Stereo } | null = null;
  private lastEvidence: { key: string; data: NonNullable<Pair['evidence']> } | null = null;
  private exposure = new Map<Variant, { seconds: number; callback?: () => void; credited: boolean }>();
  private exposureAt = 0;
  private exposureTimer: ReturnType<typeof setInterval> | null = null;
  status: AudioStatus = 'idle';
  activeTiming: { start: number; variant: Variant; responseStart?: number; responseEnd?: number } | null = null;
  get currentTime() { return this.context?.currentTime ?? 0; }
  get capturing() { return this.captureRequested || this.activeTiming?.variant === 'capture'; }
  diagnostics: { dryRms: number; wetRms: number; maxPeak: number } | null = null;

  subscribe(listener: (status: AudioStatus) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private emit(status: AudioStatus) { this.status = status; this.listeners.forEach(fn => fn(status)); }
  private init() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.channelCountMode = 'explicit';
      this.master.channelInterpretation = 'speakers';
      this.master.channelCount = this.mono ? 1 : 2;
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
      this.context.addEventListener('statechange', () => { if (this.context?.state !== 'running' && this.status === 'playing') this.stop(); });
    }
    return this.context;
  }
  setVolume(value: number) {
    this.volume = Math.max(0.05, Math.min(0.8, value));
    if (this.context && this.master) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.015);
  }
  setMono(value: boolean) {
    this.mono = value;
    // Web Audio speaker downmix: mono = (L + R) / 2, then upmixed to both ears.
    if (this.master) this.master.channelCount = value ? 1 : 2;
  }
  clearCustom() { this.loadToken++; this.custom = null; this.cache.clear(); this.stop(); }
  getEvidence(question: Question) { return this.lastEvidence?.key === this.key(question) ? this.lastEvidence.data : null; }
  async processedPreview(question: Question) { const pair = await this.prepare(question, this.init().sampleRate); return pair.b; }
  async loadFile(file: File, backing = false) {
    if (!file.size || file.size > 20 * 1024 * 1024) throw new Error('size');
    if (backing && !this.custom) throw new Error('target');
    const token = ++this.loadToken;
    this.stop();
    const context = this.init();
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    if (token !== this.loadToken) throw new Error('cancelled');
    if (decoded.numberOfChannels > 2 || decoded.duration < 0.25) throw new Error('format');
    const length = Math.min(decoded.length, context.sampleRate * 8);
    const stereo: Stereo = [new Float32Array(decoded.getChannelData(0).slice(0, length)), new Float32Array(decoded.getChannelData(decoded.numberOfChannels === 1 ? 0 : 1).slice(0, length))];
    // Preserve the start/time relationship. Fade only the end of the preview clip.
    const fade = Math.min(length, Math.round(context.sampleRate * 0.01));
    for (const channel of stereo) for (let i = 0; i < fade; i++) channel[length - 1 - i] *= i / fade;
    const id = crypto.randomUUID();
    if (backing) {
      const length = this.custom!.stereo[0].length;
      const bed: Stereo = [new Float32Array(length), new Float32Array(length)];
      for (const channel of [0, 1] as const) bed[channel].set(stereo[channel].slice(0, length));
      this.custom = { ...this.custom!, id, bed };
    } else this.custom = { id, stereo };
    this.cache.clear();
    return { id, name: file.name, duration: length / context.sampleRate, channels: decoded.numberOfChannels };
  }
  stop() {
    if (this.exposureTimer !== null) clearInterval(this.exposureTimer);
    this.exposureTimer = null; this.exposure.clear();
    this.token++; this.captureRequested = false;
    this.sources.forEach(s => { s.onended = null; try { s.stop(); } catch { /* already ended */ } s.disconnect(); });
    this.gains.forEach(g => g.disconnect());
    this.sources = []; this.gains = []; this.activeKey = ''; this.activeTiming = null;
    this.emit('idle');
  }
  private key(q: Question) { return `${q.kind}:${q.seed}:${q.frequency}:${q.gain}:${q.q}:${q.source}:${q.comparisonFrequency}:${q.levelDb}:${q.tempo}:${q.subdivision}:${q.rhythmA?.join(',')}:${q.rhythmB?.join(',')}:${q.notesA.join(',')}:${q.notesB.join(',')}:${JSON.stringify(q.mix)}:${JSON.stringify(q.music)}:${q.customId}`; }
  private prepare(q: Question, rate: number): Promise<Pair> {
    const key = this.key(q);
    const cached = this.cache.get(key);
    if (cached) return cached;
    const work = (async () => {
      const context = this.init();
      const makeStereo = (channels: Stereo) => {
        const buffer = context.createBuffer(2, channels[0].length, rate);
        buffer.copyToChannel(channels[0], 0); buffer.copyToChannel(channels[1], 1); return buffer;
      };
      const sourceData = () => isRecording(q.source ?? 'studio') ? recording(context, q.source!) : Promise.resolve(makeLoop(rate, q.seed, q.source as 'studio' | 'drums' | 'keys'));
      if (q.music) {
        const make = (data: Float32Array<ArrayBuffer>) => { const buffer = context.createBuffer(1, data.length, rate); buffer.copyToChannel(data, 0); return buffer; };
        const a = make(makeMusicAudio(rate, q.music));
        return { a, b: a, c: q.music.comparisonChoice ? make(makeMusicAudio(rate, q.music, 'c')) : undefined,
          context: ['tonic', 'degree', 'function', 'melodic-dictation'].includes(q.kind) ? make(makeMusicAudio(rate, q.music, 'context')) : undefined, resolution: q.kind === 'degree' ? make(makeMusicAudio(rate, q.music, 'resolution')) : undefined,
          capture: q.kind === 'rhythm-repeat' ? make(makeMusicAudio(rate, q.music, 'capture')) : undefined };
      }
      if (q.mix) {
        let material: Material, customStereo: Stereo | undefined;
        if (q.customId) {
          if (!this.custom || this.custom.id !== q.customId) throw new Error('Recording needs reselecting');
          customStereo = this.custom.stereo;
          const lead = monoSum(customStereo), empty = new Float32Array(lead.length);
          material = { lead, bed: this.custom.bed ? monoSum(this.custom.bed) : empty, hits: empty, backingStereo: this.custom.bed };
        } else material = isRecording(q.source ?? 'studio') ? await recordedMaterial(context) : { lead: makeLoop(rate, q.seed + 14, 'keys'), bed: makeLoop(rate, q.seed + 712, 'studio'), hits: makeLoop(rate, q.seed, 'drums') };
        const rendered = renderMix(material, rate, q.mix, q.seed, q.source ?? 'studio', customStereo);
        return { a: makeStereo(rendered.a), b: makeStereo(rendered.b), c: rendered.c ? makeStereo(rendered.c) : undefined, solo: rendered.solo ? makeStereo(rendered.solo) : undefined,
          evidence: { a: signalInfo(rendered.a), b: signalInfo(rendered.b), c: rendered.c ? signalInfo(rendered.c) : undefined } };
      }
      if (q.kind === 'eq') {
        const data = await sourceData();
        const dry = this.init().createBuffer(1, data.length, rate);
        dry.copyToChannel(data, 0);
        const render = async (frequency: number) => {
          const offline = new OfflineAudioContext(1, data.length, rate);
          const source = offline.createBufferSource(); source.buffer = dry;
          const filter = offline.createBiquadFilter();
          filter.type = 'peaking'; filter.frequency.value = frequency;
          filter.gain.value = q.gain!; filter.Q.value = q.q!;
          source.connect(filter); filter.connect(offline.destination); source.start();
          return offline.startRendering();
        };
        const wet = await render(q.frequency!);
        const chosen = q.comparisonFrequency ? await render(q.comparisonFrequency) : undefined;
        const buffers = [dry, wet, ...(chosen ? [chosen] : [])];
        matchLevelGroup(buffers.map(b => b.getChannelData(0)));
        this.diagnostics = { dryRms: rms(dry.getChannelData(0)), wetRms: rms(wet.getChannelData(0)), maxPeak: Math.max(...buffers.map(b => peak(b.getChannelData(0)))) };
        return { a: dry, b: wet, c: chosen };
      }
      const make = (data: Float32Array) => {
        const buffer = this.init().createBuffer(1, data.length, rate);
        buffer.copyToChannel(data as Float32Array<ArrayBuffer>, 0); return buffer;
      };
      if (q.kind === 'loudness') {
        const pair = makeLevelPair(await sourceData(), q.levelDb!);
        return { a: make(pair.a), b: make(pair.b) };
      }
      if (q.kind === 'rhythm') return { a: make(makeRhythm(rate, q.rhythmA!, q.subdivision!, q.tempo!)), b: make(makeRhythm(rate, q.rhythmB!, q.subdivision!, q.tempo!)) };
      const aData = makeNotes(rate, q.notesA, q.kind === 'chord');
      const bData = makeNotes(rate, q.notesB.length ? q.notesB : q.notesA, q.kind === 'chord');
      return { a: make(aData), b: make(bData) };
    })();
    this.cache.set(key, work);
    // Limit memory to a few original/processed loop pairs.
    if (this.cache.size > 8) this.cache.delete(this.cache.keys().next().value!);
    work.catch(() => this.cache.delete(key));
    return work;
  }
  async play(q: Question, variant: Variant = 'a', onComplete?: () => void): Promise<boolean> {
    const key = this.key(q);
    if (variant !== 'solo' && usesLoop(q.kind) && this.gains.length > 0 && this.status === 'playing' && this.activeKey === key) {
      const entry = this.exposure.get(variant) ?? { seconds: 0, credited: false };
      entry.callback = onComplete; this.exposure.set(variant, entry);
      this.switchVariant(variant); return true;
    }
    this.stop();
    const token = this.token;
    this.captureRequested = variant === 'capture';
    this.emit('preparing');
    try {
      const context = this.init();
      // Called from a user gesture, before any asynchronous rendering.
      await context.resume();
      if (context.state !== 'running') throw new Error('Audio context is suspended');
      const pair = await this.prepare(q, context.sampleRate);
      if (token !== this.token) return false;
      if (pair.evidence) this.lastEvidence = { key, data: pair.evidence };
      if (!pair[variant]) throw new Error('Unavailable audio variant');
      const start = context.currentTime + 0.025;
      if (usesLoop(q.kind) && variant !== 'solo') {
        for (const [index, buffer] of [pair.a, pair.b, ...(pair.c ? [pair.c] : [])].entries()) {
          const s = context.createBufferSource(); s.buffer = buffer; s.loop = true;
          const g = context.createGain(); g.gain.value = index === ['a', 'b', 'c'].indexOf(variant) ? 1 : 0;
          s.connect(g); g.connect(this.master!); s.start(start);
          this.sources.push(s); this.gains.push(g);
        }
      } else {
        const s = context.createBufferSource(); s.buffer = pair[variant]!;
        s.connect(this.master!); s.start(start);
        // Consumers must mark natural completion before idle is emitted.
        // A completion callback may start the next sound synchronously;
        // its new token must survive cleanup of this finished source.
        s.onended = () => { if (token === this.token) { onComplete?.(); if (token === this.token) this.stop(); } };
        this.sources.push(s);
      }
      this.activeTiming = { start, variant, ...(variant === 'capture' && q.music ? { responseStart: start + 12 * 60 / q.music.tempo, responseEnd: start + 16 * 60 / q.music.tempo } : {}) };
      if (usesLoop(q.kind) && variant !== 'solo') {
        this.exposureAt = start;
        this.exposure.set(variant, { seconds: 0, callback: onComplete, credited: false });
        this.exposureTimer = setInterval(() => this.updateExposure(), 50);
      }
      this.activeKey = key; this.emit('playing'); return true;
    } catch { if (token === this.token) { this.captureRequested = false; this.emit('error'); } return false; }
  }
  async playCandidate(q: Question, id: string): Promise<boolean> {
    if (!q.music || !q.options.some(o => o.id === id)) return false;
    this.stop(); const token = this.token; this.emit('preparing');
    try {
      const context = this.init(); await context.resume();
      if (token !== this.token) return false;
      if (context.state !== 'running') throw new Error('Audio context is suspended');
      const notes = q.music.candidates[id] ?? [[degreeMidi(q.music.tonic, Number(id))]];
      const data = makeCandidateAudio(context.sampleRate, notes), buffer = context.createBuffer(1, data.length, context.sampleRate); buffer.copyToChannel(data, 0);
      const source = context.createBufferSource(); source.buffer = buffer; source.connect(this.master!); this.sources.push(source);
      source.onended = () => { if (token === this.token) this.stop(); }; source.start(context.currentTime + 0.025); this.emit('playing'); return true;
    } catch { if (token === this.token) this.emit('error'); return false; }
  }
  switchVariant(variant: Variant) {
    const selected = ['a', 'b', 'c'].indexOf(variant);
    if (!this.context || selected < 0 || selected >= this.gains.length) return;
    this.updateExposure();
    if (this.activeTiming) this.activeTiming.variant = variant;
    this.exposureAt = Math.max(this.context.currentTime, this.activeTiming?.start ?? 0);
    this.gains.forEach((g, i) => { g.gain.cancelScheduledValues(this.context!.currentTime); g.gain.setTargetAtTime(i === selected ? 1 : 0, this.context!.currentTime, 0.012); });
  }
  private updateExposure() {
    if (!this.context || !this.activeTiming || this.status !== 'playing' || this.exposureTimer === null) return;
    const entry = this.exposure.get(this.activeTiming.variant) ?? { seconds: 0, credited: false };
    const now = this.context.currentTime;
    entry.seconds += Math.max(0, now - this.exposureAt);
    this.exposureAt = Math.max(now, this.activeTiming.start);
    this.exposure.set(this.activeTiming.variant, entry);
    if (!entry.credited && entry.callback && entry.seconds >= MIN_LOOP_EXPOSURE) {
      entry.credited = true;
      entry.callback();
    }
  }
}
