import { getLesson, lessons, usesLoop, type PathId } from './content';
import { isEqSource } from './model';
import { evaluateAnswer } from './music-model';
import { personalSkills, placementItems, refIdentity, refQuestion } from './personal-model';
import type { PersonalAnswer, PersonalProgress, PersonalResult, PersonalSession, QuestionRef } from './personal-types';

const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const time=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=8.64e15;
const seed=(v:unknown):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=0xffffffff;
const id=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<=200;
function readRef(v:unknown):QuestionRef|null {
  if(!object(v)||!lessons.some(l=>l.id===v.lessonId)||!seed(v.seed)||!Number.isInteger(v.index)||(v.index as number)<0||(v.index as number)>=5)return null;
  const lesson=getLesson(v.lessonId as string);
  if(v.source!==undefined&&(!isEqSource(v.source)||!usesLoop(lesson.skill)))return null;
  let review:QuestionRef['review'];
  if(v.review!==undefined){if(!object(v.review)||!id(v.review.id)||!time(v.review.createdAt)||!/^(manual|personal):.+:\d+$/.test(v.review.id))return null;review={id:v.review.id,createdAt:v.review.createdAt};}
  return {lessonId:lesson.id,seed:v.seed,index:v.index as number,...(v.source?{source:v.source as QuestionRef['source']} : {}),...(review?{review}:{})};
}
export function readPersonalSession(v:unknown, result=false):PersonalSession|PersonalResult|null {
  if(!object(v)||!id(v.id)||!['placement','practice','review'].includes(v.mode as string)||!['mix','music','exam'].includes(v.path as string)||!seed(v.seed)||!time(v.startedAt)||!Array.isArray(v.items)||!Array.isArray(v.answers)||!Number.isInteger(v.index))return null;
  const path=v.path as PathId;
  const count=v.mode==='placement'?personalSkills[path].length*2:v.mode==='practice'?5:null;
  if(count!==null&&v.items.length!==count||v.items.length<1||v.items.length>20||v.mode==='review'&&v.items.length>5||(v.index as number)<0||(v.index as number)>=v.items.length||v.answers.length>v.items.length)return null;
  const refs=v.items.map(readRef);if(refs.some(r=>!r))return null;
  const items=refs as QuestionRef[];
  const startedAt=v.startedAt;
  if(items.some(r=>!personalSkills[path].includes(getLesson(r.lessonId).skill)||r.review&&r.review.createdAt>startedAt))return null;
  if(v.mode==='placement'&&items.some(r=>r.review)||v.mode==='review'&&items.some(r=>!r.review)||v.mode==='practice'&&items.filter(r=>r.review).length>2)return null;
  if(new Set(items.filter(r=>r.review).map(r=>r.review!.id)).size!==items.filter(r=>r.review).length)return null;
  const answers:PersonalAnswer[]=[];
  for(const [i,a] of v.answers.entries()) {
    if(!object(a)||(a.choice!==null&&typeof a.choice!=='string')||!time(a.at)||a.at<(answers.at(-1)?.at??v.startedAt)||typeof a.correct!=='boolean'||a.correct!==(a.choice===null?false:evaluateAnswer(refQuestion(items[i]),a.choice as string)))return null;
    if(a.choice!==null&&evaluateAnswer(refQuestion(items[i]),a.choice as string)===null)return null;
    answers.push({choice:a.choice as string|null,correct:a.correct,at:a.at});
  }
  if(v.mode==='placement') {
    const expected=placementItems(path,v.seed,answers,items[0].source);
    if(items.some((r,i)=>refIdentity(r)!==refIdentity(expected[i])))return null;
  }
  const session:PersonalSession={id:v.id,mode:v.mode as PersonalSession['mode'],path,seed:v.seed,startedAt:v.startedAt,items,index:v.index as number,answers};
  if(!result)return answers.length===session.index||answers.length===session.index+1?session:null;
  if(!time(v.finishedAt)||v.finishedAt<(answers.at(-1)?.at??v.startedAt)||!['completed','ended'].includes(v.status as string))return null;
  if(v.status==='completed'&&(answers.length!==items.length||session.index!==items.length-1))return null;
  if(v.status==='ended'&&answers.length!==session.index&&answers.length!==session.index+1)return null;
  return {...session,finishedAt:v.finishedAt,status:v.status as PersonalResult['status']};
}
export function readPersonalProgress(v:unknown):PersonalProgress|null {
  if(!object(v)||v.version!==1||!Array.isArray(v.results)||v.active===undefined)return null;
  const results=v.results.map(r=>readPersonalSession(r,true) as PersonalResult|null);
  const active=v.active===null?null:readPersonalSession(v.active);
  if(results.some(r=>!r)||v.active!==null&&!active)return null;
  const valid=results as PersonalResult[];
  if(new Set(valid.map(r=>r.id)).size!==valid.length||active&&valid.some(r=>r.id===active.id))return null;
  // A review identifier always refers to the same original audio and creation time.
  const refs=new Map<string,{ref:string;at:number}>();
  for(const s of [...valid,...(active?[active]:[])])for(const r of s.items)if(r.review){const old=refs.get(r.review.id),value={ref:refIdentity(r),at:r.review.createdAt};if(old&&(old.ref!==value.ref||old.at!==value.at))return null;refs.set(r.review.id,value);}
  for(const s of [...valid,...(active?[active]:[])])if(s.mode!=='placement')s.answers.forEach((a,i)=>{
    const review=refs.get(`personal:${s.id}:${i}`);
    if(review&&(a.choice===null||a.correct||s.items[i].review||review.at!==a.at||review.ref!==refIdentity(s.items[i])))refs.set('invalid',{ref:'',at:0});
  });
  if(refs.has('invalid'))return null;
  return {version:1,active,results:valid};
}
