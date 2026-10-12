import type { Text } from './i18n';

export type ExamLevel = 1 | 2 | 3;
export type ExamCourseId = 'pitch' | 'polyphony' | 'melody' | 'rhythm' | 'dictation' | 'sight-reading' | 'performance';
export type ExamSource = { title: string; url: string; year: string; pages: string; checked: string };
export type ExamProfile = { id: string; title: Text; program: Text; summary: Text; sources: ExamSource[]; scope: { title: Text; detail: Text; courses: ExamCourseId[] }[]; lessons: string[][]; limits: Text };
export type MockAnswer = { choice: string | null; correct: boolean; at: number };
export type ExamMock = { id: string; profileId: string; level: ExamLevel; seed: number; startedAt: number; deadline: number; answers: MockAnswer[]; plays: number[]; heard: boolean[] };
export type MockResult = ExamMock & { finishedAt: number; reason: 'completed' | 'expired' | 'ended' };
export type ExamRehearsal = { id: string; courseId: ExamCourseId; level: ExamLevel; seed: number; at: number; checks: boolean[]; note: string };
export type ExamProgress = { version: 1; selectedProfile: string; active: ExamMock | null; results: MockResult[]; rehearsals: ExamRehearsal[] };
