import type { Text } from './i18n';
export const musicSkills = ['tonic', 'degree', 'function', 'melodic-dictation', 'rhythmic-dictation', 'rhythm-repeat'] as const;
export type MusicSkill = typeof musicSkills[number];
export const isMusicianship = (skill: string): skill is MusicSkill => musicSkills.includes(skill as MusicSkill);
export type MusicSpec = {
  skill: MusicSkill; level: number; tonic: number; tempo: number; subdivision: number;
  prompt: Text; focus: Text; context: number[][]; phrase: number[]; target: number[][];
  candidates: Record<string, number[][]>; degrees: number[]; allowedDegrees: number[]; slots: number[];
  response: 'choice' | 'melody' | 'rhythm' | 'tap'; tolerance: number; comparisonChoice?: string;
};
