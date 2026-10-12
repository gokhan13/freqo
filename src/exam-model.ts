import { examCourses, getExamProfile, mockListenLimit, mockSecondsPerQuestion } from './exam-content';
import { makeQuestion, random } from './model';
import { evaluateAnswer } from './music-model';
import type { ExamCourseId, ExamLevel, ExamMock, ExamProgress, ExamRehearsal, MockResult } from './exam-types';

export const initialExamProgress = (): ExamProgress => ({ version: 1, selectedProfile: 'common', active: null, results: [], rehearsals: [] });
export const mockLessonIds = (s: Pick<ExamMock, 'profileId'|'level'>) => getExamProfile(s.profileId)!.lessons[s.level-1];
export const mockQuestion = (s: ExamMock, index = s.answers.length) => makeQuestion(mockLessonIds(s)[index], s.seed, index);
export function startMock(profileId: string, level: ExamLevel, now = Date.now(), seed = crypto.getRandomValues(new Uint32Array(1))[0], id: string = crypto.randomUUID()): ExamMock {
  const lessons = getExamProfile(profileId)?.lessons[level-1];
  if (!lessons || !Number.isSafeInteger(now) || now < 0) throw new Error('Invalid mock configuration');
  return { id, profileId, level, seed, startedAt: now, deadline: now + lessons.length * mockSecondsPerQuestion * 1000, answers: [], plays: lessons.map(() => 0), heard: lessons.map(() => false) };
}
export function finishMock(p: ExamProgress, reason: MockResult['reason'], now = Date.now()): ExamProgress {
  const s = p.active;
  if (!s) return p;
  const expires = now >= s.deadline, count = mockLessonIds(s).length;
  if (reason === 'expired' && !expires) return p;
  if (reason === 'completed' && s.answers.length !== count && !expires) return p;
  const at = expires ? s.deadline : now;
  const answers = [...s.answers, ...Array.from({ length: count - s.answers.length }, () => ({ choice: null, correct: false, at }))];
  const result: MockResult = { ...s, answers, finishedAt: at, reason: expires ? 'expired' : reason };
  return { ...p, active: null, results: [...p.results.filter(r => r.id !== s.id), result] };
}
export const expireMock = (p: ExamProgress, now = Date.now()) => p.active && now >= p.active.deadline ? finishMock(p, 'expired', now) : p;
export function registerMockPlay(p: ExamProgress, now = Date.now()): ExamProgress {
  const current = expireMock(p, now), s = current.active;
  if (!s) return current;
  const index = s.answers.length;
  if (s.plays[index] >= mockListenLimit) return current;
  return { ...current, active: { ...s, plays: s.plays.map((n,i) => i === index ? n+1 : n) } };
}
export function completeMockPlay(p: ExamProgress, id: string, index: number, now = Date.now()): ExamProgress {
  const current = expireMock(p, now), s = current.active;
  if (!s || s.id !== id || s.answers.length !== index || !s.plays[index]) return current;
  return { ...current, active: { ...s, heard: s.heard.map((v,i) => i === index ? true : v) } };
}
export function refundMockPlay(p: ExamProgress, id: string, index: number): ExamProgress {
  const s=p.active;
  if(!s || s.id!==id || s.answers.length!==index) return p;
  return {...p,active:{...s,plays:s.plays.map((v,i)=>i===index?Math.max(0,v-1):v)}};
}
export function submitMockAnswer(p: ExamProgress, choice: string | null, now = Date.now()): ExamProgress {
  const current = expireMock(p, now), s = current.active;
  if (!s) return current;
  const index = s.answers.length;
  if (choice !== null && !s.heard[index]) return current;
  const correct = choice === null ? false : evaluateAnswer(mockQuestion(s), choice);
  if (correct === null) return current;
  const next = { ...current, active: { ...s, answers: [...s.answers, { choice, correct, at: now }] } };
  return next.active.answers.length === mockLessonIds(s).length ? finishMock(next, 'completed', now) : next;
}

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const time = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= 8640000000000000;
const level = (v: unknown): v is ExamLevel => v === 1 || v === 2 || v === 3;
export function validMock(v: unknown, completed = false): v is ExamMock {
  if (!object(v) || typeof v.id !== 'string' || !v.id.length || v.id.length > 128 || typeof v.profileId !== 'string' || !getExamProfile(v.profileId) || !level(v.level) || !Number.isInteger(v.seed) || (v.seed as number) < 0 || (v.seed as number) > 0xffffffff || !time(v.startedAt) || !time(v.deadline)) return false;
  const s = v as unknown as ExamMock, count = mockLessonIds(s).length;
  if (s.deadline !== s.startedAt + count * mockSecondsPerQuestion * 1000 || !Array.isArray(s.plays) || s.plays.length !== count || !s.plays.every(n => Number.isInteger(n) && n >= 0 && n <= mockListenLimit) || !Array.isArray(s.heard) || s.heard.length !== count || !s.heard.every((h,i) => typeof h === 'boolean' && (!h || s.plays[i] > 0)) || !Array.isArray(s.answers) || (completed ? s.answers.length !== count : s.answers.length >= count)) return false;
  if (s.plays.some((n,i)=> i > s.answers.length && n > 0)) return false;
  return s.answers.every((a,i) => object(a) && time(a.at) && a.at >= s.startedAt && a.at <= s.deadline && (!i || a.at >= s.answers[i-1].at) && (a.choice === null ? a.correct === false : typeof a.choice === 'string' && a.at < s.deadline && s.heard[i] && evaluateAnswer(mockQuestion(s,i),a.choice) === a.correct));
}
export function validMockResult(v: unknown): v is MockResult {
  if (!object(v) || !time(v.finishedAt) || !['completed','expired','ended'].includes(v.reason as string) || !validMock(v,true)) return false;
  const r = v as unknown as MockResult;
  return r.finishedAt >= r.startedAt && r.finishedAt <= r.deadline && r.answers.every(a=>a.at<=r.finishedAt) && (r.reason === 'expired' ? r.finishedAt === r.deadline : r.finishedAt < r.deadline);
}
export const validRehearsal = (v: unknown): v is ExamRehearsal => object(v) && typeof v.id === 'string' && v.id.length>0 && v.id.length<=128 && examCourses.some(c=>c.id===v.courseId) && level(v.level) && Number.isInteger(v.seed) && (v.seed as number)>=0 && (v.seed as number)<=0xffffffff && time(v.at) && Array.isArray(v.checks) && v.checks.length===3 && v.checks.every(c=>typeof c==='boolean') && typeof v.note==='string' && v.note.length<=500;
export function readExamProgress(v: unknown): ExamProgress | null {
  if(!object(v) || v.version!==1 || typeof v.selectedProfile!=='string' || !getExamProfile(v.selectedProfile) || v.active!==null && !validMock(v.active) || !Array.isArray(v.results) || !v.results.every(validMockResult) || !Array.isArray(v.rehearsals) || !v.rehearsals.every(validRehearsal)) return null;
  if(new Set(v.results.map(r=>r.id)).size!==v.results.length || new Set(v.rehearsals.map(r=>r.id)).size!==v.rehearsals.length || v.active && v.results.some(r=>r.id===(v.active as ExamMock).id)) return null;
  const copyMock=(s:ExamMock):ExamMock=>({id:s.id,profileId:s.profileId,level:s.level,seed:s.seed,startedAt:s.startedAt,deadline:s.deadline,answers:s.answers.map(a=>({choice:a.choice,correct:a.correct,at:a.at})),plays:[...s.plays],heard:[...s.heard]});
  return {version:1,selectedProfile:v.selectedProfile,active:v.active?copyMock(v.active as ExamMock):null,results:v.results.map(r=>({...copyMock(r),finishedAt:r.finishedAt,reason:r.reason})),rehearsals:v.rehearsals.map(r=>({id:r.id,courseId:r.courseId,level:r.level,seed:r.seed,checks:[...r.checks],note:r.note,at:r.at}))};
}

export function rehearsalQuestion(courseId: ExamCourseId, difficulty: ExamLevel, seed: number) {
  const rng = random(seed), pick = <T,>(values:T[]) => values[Math.floor(rng()*values.length)];
  const scale=[60,62,64,65,67,69,71];
  let position=2;
  const melody=Array.from({length:courseId==='sight-reading'?(difficulty===1?4:8):[4,6,8][difficulty-1]},()=>{position=difficulty===3?Math.floor(rng()*scale.length):Math.max(0,Math.min(scale.length-1,position+pick([-1,1])));return scale[position];});
  const notes = courseId === 'pitch' ? difficulty===1 ? [pick([60,62,64,65,67])] : [60,60+pick(difficulty===2?[2,4,5,7]:[-7,-5,-2,3,7,12])] : courseId === 'polyphony' ? difficulty===1 ? pick([[60,64],[60,67],[62,65]]) : difficulty===2 ? pick([[60,64,67],[62,65,69],[57,60,64]]) : pick([[60,64,67,71],[62,65,69,72],[57,60,64,67]]) : melody;
  if(courseId==='rhythm')return makeQuestion(`rhythmic-dictation-${difficulty}`,seed,0);
  return { kind: courseId==='polyphony'?'chord' as const:'direction' as const,seed,notesA:notes,notesB:[],options:[],correct:'',explanation:textEmpty };
}
const textEmpty = {tr:'',en:''};
