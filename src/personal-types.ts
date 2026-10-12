import type { EqSource, PathId } from './content';

export type PersonalMode = 'placement' | 'practice' | 'review';
export type QuestionRef = { lessonId: string; seed: number; index: number; source?: EqSource; review?: { id: string; createdAt: number } };
export type PersonalAnswer = { choice: string | null; correct: boolean; at: number };
export type PersonalSession = {
  id: string; mode: PersonalMode; path: PathId; seed: number; startedAt: number;
  items: QuestionRef[]; index: number; answers: PersonalAnswer[];
};
export type PersonalResult = PersonalSession & { finishedAt: number; status: 'completed' | 'ended' };
export type PersonalProgress = { version: 1; active: PersonalSession | null; results: PersonalResult[] };
