import type { EqSource } from './content';
import type { Material } from './mix-types';

const cache = new Map<string, Promise<Float32Array<ArrayBuffer>>>();
export const isRecording = (source: EqSource) => source === 'acoustic' || source === 'recorded-drums';
export async function recording(context: AudioContext, name: string) {
  const key = `${context.sampleRate}:${name}`;
  let promise = cache.get(key);
  if (!promise) {
    promise = (async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}audio/${name}.wav`);
      if (!response.ok) throw new Error('Recording could not load');
      const decoded = await context.decodeAudioData(await response.arrayBuffer());
      return new Float32Array(decoded.getChannelData(0));
    })();
    cache.set(key, promise); promise.catch(() => cache.delete(key));
  }
  return new Float32Array(await promise);
}
export async function recordedMaterial(context: AudioContext): Promise<Material> {
  const [lead, bed, hits] = await Promise.all(['recorded-lead', 'recorded-bed', 'recorded-hits'].map(name => recording(context, name)));
  return { lead, bed, hits };
}
