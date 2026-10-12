import { describe, expect, it } from 'vitest';
import { getLesson, type PathId } from '../../src/content';
import { advanceQuestion, answerQuestion, initialProgress, makeQuestion, parseProgress, type Progress } from '../../src/model';
import { advancePersonal, answerPersonal, endPersonal, personalPlan, personalSkills, placementItems, refIdentity, refQuestion, reviewCards, skillEstimate, startPersonal, studyEvidence } from '../../src/personal-model';
import { readPersonalProgress } from '../../src/personal-validation';
import { createBackup, mergeProgress, readBackup } from '../../src/backup';
const T=Date.parse('2026-10-10T10:00:00Z'),DAY=86_400_000;
const load=(p:Progress)=>readBackup(JSON.stringify(createBackup(p)));
const wrong=(p:Progress)=>{const q=refQuestion(p.personal!.active!.items[p.personal!.active!.index]);return q.options.find(o=>o.id!==q.correct)?.id??q.correct.replace(/\d/,'0');};
function placement(path:PathId='mix',correct=true,p=initialProgress(),at=T):Progress {
  p=startPersonal(p,'placement',path,at,123,'placement-'+path+'-'+at);
  while(p.personal!.active){const s=p.personal!.active,q=refQuestion(s.items[s.index]);p=answerPersonal(p,correct?q.correct:null,at+100+s.index*100);p=advancePersonal(p,at+150+s.index*100);}
  return p;
}
function manual(p:Progress,lessonId:string,id:string,corrects:boolean[],at=T):Progress {
  p={...p,session:{id,lessonId,seed:at>>>0,index:0,started:true,answers:[],source:getLesson(lessonId).path==='mix'?'acoustic':undefined}};
  for(const [i,correct] of corrects.entries()){
    const q=makeQuestion(lessonId,p.session!.seed,i,p.session!.source);
    p=answerQuestion(p,correct?q.correct:q.options.find(o=>o.id!==q.correct)!.id,new Date(at+i*100).toISOString());p=advanceQuestion(p,new Date(at+i*100+50).toISOString());
  }
  return p;
}

describe('starting assessment',()=>{
  it.each(['mix','music','exam'] as PathId[])('%s assesses every supported skill twice, uses real levels and survives every reload',path=>{
    let p=startPersonal(initialProgress(),'placement',path,T,234,'assessment');
    expect(p.personal!.active!.items).toHaveLength(personalSkills[path].length*2);
    let slot=0;
    while(p.personal!.active){const s=p.personal!.active,q=refQuestion(s.items[s.index]);p=answerPersonal(p,q.correct,T+slot*100+1);p=load(p);p=advancePersonal(p,T+slot*100+2);p=parseProgress(JSON.stringify(p));slot++;}
    expect(p.personal!.results).toHaveLength(1);expect(p.attempts).toHaveLength(0);expect(studyEvidence(p)).toHaveLength(0);
    expect(skillEstimate(p,path==='mix'?'eq':'degree').level).toBe(2);
    expect(skillEstimate(p,'chord').level).toBe(3);
  });
  it('adjusts only the second probe of the answered skill; skips never promote',()=>{
    const p=startPersonal(initialProgress(),'placement','mix',T,1,'a'),initial=p.personal!.active!.items;
    const yes=answerPersonal(p,refQuestion(initial[0]).correct,T+1),skip=answerPersonal(p,null,T+1);
    expect(yes.personal!.active!.items[1].lessonId).toBe('eq-2');expect(skip.personal!.active!.items[1].lessonId).toBe('eq-1');
    expect(yes.personal!.active!.items.slice(2)).toEqual(initial.slice(2));
    expect(skillEstimate(placement('mix',false),'eq').level).toBe(1);
  });
  it('unfinished assessment does not replace a completed baseline or practice data',()=>{
    let p=placement();p=startPersonal(p,'placement','mix',T+100_000,4,'new');p=answerPersonal(p,null,T+100_001);p=endPersonal(p,T+100_002);
    expect(skillEstimate(p,'eq').level).toBe(2);expect(p.personal!.results.at(-1)!.status).toBe('ended');expect(load(p)).toEqual(p);
  });
  it('fully skipped skills retain their previous suggestion instead of creating false placement evidence',()=>{
    const prior=placement();const next=placement('mix',false,prior,T+100_000);
    expect(skillEstimate(next,'eq')).toMatchObject({level:2,placementAt:prior.personal!.results[0].finishedAt,placementAnswered:2});
    expect(studyEvidence(next)).toHaveLength(0);
  });
  it('scores and completes once; invalid answers and out-of-order timestamps cannot mutate progress',()=>{
    let p=startPersonal(initialProgress(),'practice','mix',T,2,'a');expect(advancePersonal(p,T+1)).toBe(p);expect(answerPersonal(p,'invalid',T+1)).toBe(p);expect(answerPersonal(p,'100',T-1)).toBe(p);
    for(let i=0;i<5;i++){p=answerPersonal(p,refQuestion(p.personal!.active!.items[i]).correct,T+i*100+1);expect(answerPersonal(p,null,T+i*100+2)).toBe(p);p=advancePersonal(p,T+i*100+3);}
    expect(advancePersonal(p,T+1000)).toBe(p);expect(p.personal!.results).toHaveLength(1);expect(studyEvidence(p)).toHaveLength(5);
  });
});

describe('adaptive difficulty',()=>{
  it('does not promote a lucky short run; requires 8 of 10 fresh answers across sessions',()=>{
    let p=manual(initialProgress(),'eq-1','a',[true,true,true,true,true]);expect(skillEstimate(p,'eq').level).toBe(1);
    p=manual(p,'eq-1','b',[true,true,true,false,false],T+10_000);expect(skillEstimate(p,'eq')).toMatchObject({level:2,reason:'up',samples:0});
    expect(skillEstimate(p,'loudness').level).toBe(1);
  });
  it('holds below promotion threshold and lowers one step after repeated difficulty',()=>{
    let p=manual(initialProgress(),'eq-1','a',[true,true,true,true,true]);p=manual(p,'eq-1','b',[true,true,false,false,false],T+10_000);expect(skillEstimate(p,'eq').level).toBe(1);
    p=placement('mix',true,p,T+20_000);p=manual(p,'eq-2','c',[false,false,false,true,true],T+30_000);expect(skillEstimate(p,'eq').level).toBe(2);
    p=manual(p,'eq-2','d',[false,false,false,false,false],T+40_000);expect(skillEstimate(p,'eq')).toMatchObject({level:1,reason:'down'});
  });
  it('fixed-stage skills are not given invented levels',()=>{
    const p=placement('music');expect(skillEstimate(p,'direction').level).toBe(1);expect(skillEstimate(p,'interval').level).toBe(2);expect(skillEstimate(p,'chord').level).toBe(3);
  });
  it('offers guided support when the first stage is difficult, then clears it after recovery',()=>{
    let p=manual(initialProgress(),'eq-1','first',[false,false,false,false,false]);p=manual(p,'eq-1','second',[false,false,false,false,false],T+10_000);
    expect(skillEstimate(p,'eq')).toMatchObject({level:1,reason:'support'});expect(skillEstimate(p,'eq').explanation.tr).toContain('açıklamalı örneklerini');
    p=manual(p,'eq-1','recovered',[true,true,true,true,true],T+20_000);expect(skillEstimate(p,'eq').reason).toBe('steady');
  });
  it('deduplicates exact repeated examples and duplicate saved record IDs',()=>{
    let p=manual(initialProgress(),'eq-1','a',[true,true,true,true,true]);p=manual(p,'eq-1','b',[true,true,true,true,true],T);
    expect(skillEstimate(p,'eq').level).toBe(1);p.attempts=[...p.attempts,...p.attempts];expect(studyEvidence(p)).toHaveLength(10);expect(skillEstimate(p,'eq').samples).toBe(5);
  });
  it('does not count the same effective question seed twice when base seed and index are encoded differently',()=>{
    const p=manual(initialProgress(),'eq-1','original',[true,true,true,true,true]);
    const copies=p.attempts.map((a,i)=>{const seed=(a.response!.seed+i*2654435761)>>>0;expect(makeQuestion(a.lessonId,seed,0,a.source)).toEqual(makeQuestion(a.lessonId,a.response!.seed,i,a.source));return {...a,sessionId:`copy-${i}`,index:0,at:new Date(T+10_000+i*100).toISOString(),response:{seed,choice:a.response!.choice}};});
    p.attempts.push(...copies);expect(skillEstimate(p,'eq')).toMatchObject({level:1,samples:5});
  });
  it('reassessment resets the recommendation while retaining errors and all historical scores',()=>{
    let p=manual(initialProgress(),'eq-1','a',[false,false,false,false,false]);const original=p.attempts;
    p=placement('mix',true,p,T+20_000);expect(p.attempts).toEqual(original);expect(skillEstimate(p,'eq')).toMatchObject({level:2,reason:'placement',samples:0});expect(reviewCards(p)).toHaveLength(2);
  });
  it('old records retain accuracy without proving a higher stage or inventing a replay',()=>{
    let p=manual(initialProgress(),'eq-1','a',[true,true,true,true,true]);p=manual(p,'eq-1','b',[true,true,true,false,false],T+10_000);p.attempts.forEach(a=>delete a.response);
    expect(skillEstimate(p,'eq')).toMatchObject({level:1,samples:10,accuracy:80,distinctExamples:0});expect(reviewCards(p)).toHaveLength(0);expect(load(p)).toEqual(p);
  });
  it('all paths provide a supported focus and rotate after new practice',()=>{
    let p=startPersonal(initialProgress(),'practice','mix',T,123,'focus');for(let i=0;i<5;i++){p=answerPersonal(p,refQuestion(p.personal!.active!.items[i]).correct,T+i*100+1);p=advancePersonal(p,T+i*100+2);}
    expect(personalPlan(p,'mix').focus.skill).toBe('loudness');expect(personalPlan(p,'exam').lesson.id).toBe('memory-1');
  });
});

describe('error review and spacing',()=>{
  it('retains the exact source, question and mistake; plans up to two due reviews with fresh practice',()=>{
    const p=manual(initialProgress(),'eq-1','old',[false,false,false,false,false]);const cards=reviewCards(p);
    expect(cards).toHaveLength(2);expect(refQuestion(cards[0].ref).source).toBe('acoustic');expect(refQuestion(cards[0].ref).seed).toBe(makeQuestion('eq-1',T>>>0,cards[0].ref.index,'acoustic').seed);
    expect(personalPlan(p,'mix',T+599_999).due).toHaveLength(0);
    const active=startPersonal(p,'practice','mix',T+700_000,3,'plan').personal!.active!;
    expect(active.items.filter(r=>r.review)).toHaveLength(2);expect(active.items.filter(r=>!r.review)).toHaveLength(3);
  });
  it('early correct repeats do not advance due time or difficulty; due successes follow 1, 3 and 7 days',()=>{
    let p=manual(initialProgress(),'eq-1','old',[false]);const initial=reviewCards(p)[0];
    const repeat=(at:number)=>{p=startPersonal(p,'review','mix',at,at>>>0,'review-'+at);p=answerPersonal(p,refQuestion(p.personal!.active!.items[0]).correct,at+1);p=advancePersonal(p,at+2);};
    repeat(T+1000);expect(reviewCards(p)[0]).toMatchObject({successes:0,dueAt:initial.dueAt});expect(skillEstimate(p,'eq').level).toBe(1);
    repeat(initial.dueAt);let c=reviewCards(p)[0];expect(c.successes).toBe(1);expect(c.dueAt).toBe(initial.dueAt+1+DAY);
    repeat(c.dueAt);c=reviewCards(p)[0];expect(c.successes).toBe(2);expect(c.dueAt).toBe(initial.dueAt+2+4*DAY);
    repeat(c.dueAt);c=reviewCards(p)[0];expect(c.successes).toBe(3);expect(c.dueAt).toBe(initial.dueAt+3+11*DAY);
    repeat(c.dueAt);expect(reviewCards(p)).toHaveLength(0);expect(load(p)).toEqual(p);
  });
  it('review mistakes reset the same card rather than duplicating it; skips do not shift the schedule',()=>{
    let p=manual(initialProgress(),'eq-1','old',[false]);p=startPersonal(p,'review','mix',T+700_000,4,'review');const c=reviewCards(p)[0];
    let skip=answerPersonal(p,null,T+700_001);skip=advancePersonal(skip,T+700_002);expect(reviewCards(skip)[0]).toEqual(c);
    p=answerPersonal(p,wrong(p),T+700_001);p=advancePersonal(p,T+700_002);expect(reviewCards(p)).toHaveLength(1);expect(reviewCards(p)[0].dueAt).toBe(T+1_300_001);
  });
  it('new personal mistakes are reviewable, placement mistakes are excluded, and paths stay relevant',()=>{
    let p=placement('music',false);p=startPersonal(p,'practice','mix',T+100_000,2,'p');p=answerPersonal(p,wrong(p),T+100_001);p=endPersonal(p,T+100_002);
    expect(reviewCards(p)).toHaveLength(1);expect(personalPlan(p,'music',T+800_000).cards).toHaveLength(0);expect(personalPlan(p,'mix',T+800_000).due).toHaveLength(1);
  });
  it('shows every open task on its path and collapses equivalent errors',()=>{
    let p=manual(initialProgress(),'eq-1','source',[false]);const sample=p.attempts[0];
    p.attempts=Array.from({length:201},(_,i)=>({...sample,sessionId:`error-${i}`}));
    p=manual(p,'direction-1','music',[false],T+10_000);
    expect(personalPlan(p,'mix',T+800_000).cards).toHaveLength(1);
    for(let i=0;i<201;i++){const q=makeQuestion('eq-1',i,0,'studio');p.attempts.push({...sample,sessionId:`varied-${i}`,source:'studio',response:{seed:i,choice:q.options.find(o=>o.id!==q.correct)!.id}});}
    expect(personalPlan(p,'mix',T+800_000).cards).toHaveLength(202);expect(personalPlan(p,'music',T+800_000).cards).toHaveLength(1);
  });
  it('can reconstruct pending reviews when the originating personal result is no longer retained',()=>{
    let p=startPersonal(initialProgress(),'practice','mix',T,2,'origin');p=answerPersonal(p,wrong(p),T+1);p=endPersonal(p,T+2);
    p=startPersonal(p,'review','mix',T+700_000,3,'review');p=answerPersonal(p,refQuestion(p.personal!.active!.items[0]).correct,T+700_001);p=advancePersonal(p,T+700_002);
    const cards=reviewCards(p);p.personal!.results=p.personal!.results.slice(1);expect(reviewCards(p)).toEqual(cards);expect(load(p)).toEqual(p);
  });
});

describe('personal backups and validation',()=>{
  it('round trips active and completed personal study and repeatedly merges without changing schedules',()=>{
    let p=placement();p=startPersonal(p,'practice','mix',T+100_000,4,'study');p=answerPersonal(p,wrong(p),T+100_001);
    const before=reviewCards(p);const merged=mergeProgress(p,load(p));expect(mergeProgress(merged,load(p))).toEqual(merged);expect(reviewCards(merged)).toEqual(before);
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
  });
  it('merges ahead-of-device adaptive placement questions without reopening completed work',()=>{
    const initial=startPersonal(initialProgress(),'placement','mix',T,3,'same');let ahead=answerPersonal(initial,refQuestion(initial.personal!.active!.items[0]).correct,T+1);ahead=advancePersonal(ahead,T+2);
    expect(mergeProgress(initial,load(ahead)).personal!.active!.index).toBe(1);
    while(ahead.personal!.active){const s=ahead.personal!.active;ahead=answerPersonal(ahead,refQuestion(s.items[s.index]).correct,T+10+s.index*10);ahead=advancePersonal(ahead,T+11+s.index*10);}
    const merged=mergeProgress(initial,load(ahead));expect(merged.personal!.active).toBeNull();expect(merged.personal!.results).toHaveLength(1);
  });
  it('rejects conflicting active sessions and conflicting answers rather than discarding data',()=>{
    const a=startPersonal(initialProgress(),'practice','mix',T,1,'a'),b=startPersonal(initialProgress(),'practice','mix',T,2,'b');expect(()=>mergeProgress(a,b)).toThrow('conflict');
    const yes=answerPersonal(a,refQuestion(a.personal!.active!.items[0]).correct,T+1),no=answerPersonal(a,wrong(a),T+1);expect(()=>mergeProgress(yes,no)).toThrow('conflict');
  });
  it('rejects unknown lessons, fabricated correctness, altered placement questions and impossible timestamps',()=>{
    const p=placement();const changes=[(v:Progress)=>v.personal!.results[0].items[0].lessonId='bad',(v:Progress)=>v.personal!.results[0].answers[0].correct=false,(v:Progress)=>v.personal!.results[0].items[1].lessonId='eq-3',(v:Progress)=>v.personal!.results[0].answers[0].at=T-1,(v:Progress)=>v.personal!.results[0].finishedAt=T-1,(v:Progress)=>v.personal!.results[0].index=99];
    for(const change of changes){const bad=structuredClone(p);change(bad);expect(readPersonalProgress(bad.personal)).toBeNull();expect(()=>load(bad)).toThrow('invalid');expect(parseProgress(JSON.stringify(bad)).personal).toBeUndefined();}
  });
  it('normalizes unknown fields and validates original mistake identities across manual and personal data',()=>{
    let p=manual(initialProgress(),'eq-1','origin',[false]);p=startPersonal(p,'review','mix',T+700_000,2,'review');const bad=structuredClone(p);bad.personal!.active!.items[0].review!.createdAt++;
    expect(()=>load(bad)).toThrow('conflict');expect(load(p)).toEqual(p);
    const extra={...p.personal,unknown:'ignore'};expect(readPersonalProgress(extra)).toEqual(p.personal);
  });
  it('old backups keep existing personal work and preferences; exam and fixed sessions survive',()=>{
    const old=initialProgress(),p={...placement(),locale:'en' as const,path:'music' as const};const merged=mergeProgress(p,old);
    expect(merged.personal).toEqual(p.personal);expect(merged.locale).toBe('en');expect(merged.path).toBe('music');
    const fixed=manual(merged,'eq-1','fixed',[true],T+100_000);const next=startPersonal(fixed,'practice','mix',T+200_000,4,'personal');expect(next.session).toEqual(fixed.session);expect(load(next).session).toEqual(fixed.session);
  });
});
