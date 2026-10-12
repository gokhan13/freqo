import type { Text } from './i18n';

export type MixSkill = 'compression' | 'attack' | 'release' | 'masking' | 'stereo' | 'reverb' | 'delay';
export type MixEffect = 'compression' | 'masking' | 'pan' | 'width' | 'phase' | 'reverb' | 'delay';
export type MixSettings = {
  threshold?: number; ratio?: number; attackMs?: number; releaseMs?: number;
  frequency?: number; cutDb?: number; pan?: number; width?: number; invert?: boolean;
  decay?: number; preDelayMs?: number; wet?: number; delayMs?: number; feedback?: number; pingPong?: boolean;
};
export type MixSpec = {
  effect: MixEffect; reference: MixSettings; target: MixSettings;
  alternatives: Record<string, MixSettings>; comparison?: MixSettings;
  prompt: Text; focus: Text;
};
export type Stereo = [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>];
export type Material = { lead: Float32Array<ArrayBuffer>; bed: Float32Array<ArrayBuffer>; hits: Float32Array<ArrayBuffer>; backingStereo?: Stereo };
