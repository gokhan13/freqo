import { describe, expect, it } from 'vitest';
import { examCourses, examProfiles, mockListenLimit, mockSecondsPerQuestion } from '../../src/exam-content';
import { completeMockPlay, expireMock, finishMock, initialExamProgress, mockLessonIds, mockQuestion, readExamProgress, registerMockPlay, rehearsalQuestion, refundMockPlay, startMock, submitMockAnswer, validMock, validMockResult } from '../../src/exam-model';
import { createBackup, mergeProgress, readBackup } from '../../src/backup';
import { getLesson } from '../../src/content';
import { initialProgress, parseProgress } from '../../src/model';
import type { ExamLevel, ExamProgress } from '../../src/exam-types';

const now=1791630000000;
const fresh=(level:ExamLevel=1):ExamProgress=>({...initialExamProgress(),active:startMock('common',level,now,17,'mock-test')});
const heard=(p:ExamProgress)=>completeMockPlay(registerMockPlay(p,now+1),p.active!.id,p.active!.answers.length,now+2);
const load=(p:ExamProgress)=>readBackup(JSON.stringify(createBackup({...initialProgress(),exam:p}))).exam!;

describe('audition content and mock scoring',()=>{
  it('keeps all linked practices valid and every level has a complete plan',()=>{
    expect(examCourses).toHaveLength(7);
    for(const course of examCourses){expect(course.steps).toHaveLength(3);expect(course.checks).toHaveLength(3);expect(course.practices).toHaveLength(3);for(const ids of course.practices)for(const id of ids)expect(getLesson(id)).toBeDefined();}
    for(const p of examProfiles)for(const l of p.lessons){expect(l.length).toBeGreaterThan(0);for(const id of l)expect(getLesson(id)).toBeDefined();}
  });
  it.each([1,2,3] as ExamLevel[])('completes level %i, restores every submitted answer and stores one result',level=>{
    let p=fresh(level);const count=mockLessonIds(p.active!).length;
    for(let i=0;i<count;i++){
      const q=mockQuestion(p.active!);expect(q).toEqual(mockQuestion(p.active!));
      expect(submitMockAnswer(p,q.correct,now+3)).toBe(p);
      p=heard(p);p=submitMockAnswer(p,q.correct,now+3+i);p=load(p);
    }
    expect(p.active).toBeNull();expect(p.results).toHaveLength(1);expect(p.results[0].answers.filter(a=>a.correct)).toHaveLength(count);
    expect(finishMock(p,'completed',now+100)).toBe(p);expect(expireMock(p,now+9999999)).toBe(p);
    expect(validMockResult(p.results[0])).toBe(true);
  });
  it('stops at the exact deadline and marks unanswered questions as skipped once',()=>{
    let p=heard(fresh());p=submitMockAnswer(p,mockQuestion(p.active!).correct,now+4);
    const deadline=p.active!.deadline;
    expect(expireMock(p,deadline-1)).toBe(p);
    const finished=submitMockAnswer(p,mockQuestion(p.active!).correct,deadline);
    expect(finished.active).toBeNull();expect(finished.results[0].reason).toBe('expired');expect(finished.results[0].finishedAt).toBe(deadline);
    expect(finished.results[0].answers.filter(a=>a.correct)).toHaveLength(1);
    expect(load(finished)).toEqual(finished);expect(expireMock(finished,deadline+100)).toBe(finished);
  });
  it('limits replays, counts interruptions, refunds only failed launches and ignores stale completion callbacks',()=>{
    let p=fresh();const id=p.active!.id;
    for(let i=0;i<mockListenLimit;i++)p=registerMockPlay(p,now+i);
    expect(registerMockPlay(p,now+5)).toBe(p);expect(p.active!.heard[0]).toBe(false);
    expect(completeMockPlay(p,'stale',0,now+6)).toBe(p);
    p=refundMockPlay(p,id,0);expect(p.active!.plays[0]).toBe(2);
    p=completeMockPlay(p,id,0,now+6);p=submitMockAnswer(p,null,now+7);
    expect(completeMockPlay(p,id,0,now+8)).toBe(p);expect(refundMockPlay(p,id,0)).toBe(p);expect(p.active!.heard[1]).toBe(false);
  });
  it('counts skipped and wrong responses and early finish keeps submitted answers',()=>{
    let p=heard(fresh()),q=mockQuestion(p.active!);
    const wrong=q.options.find(o=>o.id!==q.correct)!.id;
    p=submitMockAnswer(p,wrong,now+3);p=submitMockAnswer(p,null,now+4);
    const finished=finishMock(p,'ended',now+5);
    expect(finished.results[0].answers.slice(0,2)).toMatchObject([{choice:wrong,correct:false},{choice:null,correct:false}]);
    expect(finished.results[0].reason).toBe('ended');expect(load(finished)).toEqual(finished);
    expect(finishMock(fresh(),'completed',now+5).active).not.toBeNull();
  });
  it('invalid choices cannot submit and expiration cannot award late audio credit',()=>{
    let p=heard(fresh());expect(submitMockAnswer(p,'unknown',now+5)).toBe(p);
    const deadline=p.active!.deadline;p=completeMockPlay(p,p.active!.id,0,deadline);
    expect(p.active).toBeNull();expect(p.results[0].answers.filter(a=>a.correct)).toHaveLength(0);
  });
  it.each(examCourses.map(c=>c.id))('generates playable deterministic rehearsal audio for %s',id=>{
    for(const level of [1,2,3] as const){const q=rehearsalQuestion(id,level,17);expect(q).toEqual(rehearsalQuestion(id,level,17));if(id==='rhythm')expect(q.music?.slots.length).toBeGreaterThan(0);else expect(q.notesA.every(n=>Number.isFinite(n)&&n>=48&&n<=84)).toBe(true);}
    if(id==='polyphony')for(const level of [1,2,3] as const)expect(rehearsalQuestion(id,level,17).notesA).toHaveLength(level+1);
  });
});

describe('exam backup validation and merging',()=>{
  it('keeps old backups compatible and exam results separate from ordinary practice scores',()=>{
    const old=initialProgress();expect(readBackup(JSON.stringify(createBackup(old)))).toEqual(old);
    const p={...old,exam:fresh()};expect(readBackup(JSON.stringify(createBackup(p)))).toEqual(p);expect(p.attempts).toHaveLength(0);
  });
  it('rejects forged correctness, deadline, future replays and inconsistent heard metadata',()=>{
    const p=submitMockAnswer(heard(fresh()),mockQuestion(fresh().active!).correct,now+3),s=p.active!;
    for(const bad of [{...s,deadline:s.deadline+1},{...s,answers:[{...s.answers[0],correct:false}]},{...s,plays:s.plays.map((n,i)=>i===3?1:n)},{...s,heard:s.heard.map((n,i)=>i===2?true:n)},{...s,plays:s.plays.map((n,i)=>i===0?4:n)}]){
      expect(validMock(bad)).toBe(false);expect(readExamProgress({...p,active:bad})).toBeNull();
      expect(()=>load({...p,active:bad})).toThrow();
      expect(parseProgress(JSON.stringify({...initialProgress(),exam:{...p,active:bad}})).exam).toBeUndefined();
    }
  });
  it('merges an advanced session, replay counts and completed results idempotently',()=>{
    const a=fresh(),b=submitMockAnswer(heard(a),mockQuestion(a.active!).correct,now+3);
    const p={...initialProgress(),exam:a},incoming={...initialProgress(),exam:b};
    const merged=mergeProgress(p,incoming);expect(merged.exam?.active?.answers).toHaveLength(1);
    expect(mergeProgress(merged,incoming)).toEqual(merged);expect(readBackup(JSON.stringify(createBackup(merged)))).toEqual(merged);
    const complete={...incoming,exam:finishMock(b,'ended',now+5)};
    const restored=mergeProgress(merged,complete);expect(restored.exam?.active).toBeNull();expect(restored.exam?.results).toHaveLength(1);
  });
  it('rejects conflicting responses and conflicting completed snapshots',()=>{
    const a=heard(fresh()),q=mockQuestion(a.active!);
    const good=submitMockAnswer(a,q.correct,now+3),bad=submitMockAnswer(a,q.options.find(o=>o.id!==q.correct)!.id,now+3);
    expect(()=>mergeProgress({...initialProgress(),exam:good},{...initialProgress(),exam:bad})).toThrow();
    const r=finishMock(good,'ended',now+4),other=finishMock(good,'ended',now+5);
    expect(()=>mergeProgress({...initialProgress(),exam:r},{...initialProgress(),exam:other})).toThrow();
  });
  it('saves self-assessment notes without scoring them and rejects corrupt checklists',()=>{
    const p={...initialExamProgress(),rehearsals:[{id:'rehearsal',courseId:'pitch' as const,level:1 as const,seed:17,at:now,checks:[true,false,true],note:'Sesleri öğretmenimle kontrol edeceğim.'}]};
    expect(load(p)).toEqual(p);
    expect(()=>load({...p,rehearsals:[{...p.rehearsals[0],checks:[true]}]})).toThrow();
  });
  it('normalizes record key order and ignores unknown fields before duplicate comparison',()=>{
    const p=finishMock(heard(fresh()),'ended',now+4);
    const reverse=(v:unknown):unknown=>Array.isArray(v)?v.map(reverse):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).reverse().map(([k,value])=>[k,reverse(value)])):v;
    const incoming=readBackup(JSON.stringify(reverse(createBackup({...initialProgress(),exam:p}))));
    expect(mergeProgress({...initialProgress(),exam:p},incoming).exam).toEqual(p);
    const parsed=readExamProgress({...p,unrelated:'ignore'});expect(parsed).not.toHaveProperty('unrelated');
  });
  it('validates result timestamps, chronological responses and oversized note data',()=>{
    const p=finishMock(fresh(),'ended',now+1),r=p.results[0];
    expect(validMockResult({...r,finishedAt:now-1})).toBe(false);
    expect(validMockResult({...r,reason:'expired'})).toBe(false);
    expect(validMock({...fresh().active!,answers:[{choice:null,correct:false,at:now-1}]})).toBe(false);
    expect(readExamProgress({...p,results:[r,r]})).toBeNull();
    expect(readExamProgress({...p,active:startMock('common',1,now,17,r.id)})).toBeNull();
    expect(p.results[0].deadline-now).toBe(mockLessonIds(r).length*mockSecondsPerQuestion*1000);
  });
});
