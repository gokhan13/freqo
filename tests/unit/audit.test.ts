import { describe, expect, it } from 'vitest';
import { initialProgress, makeQuestion, answerQuestion, advanceQuestion, parseProgress, type Progress } from '../../src/model';
import { startPersonal, answerPersonal, advancePersonal, endPersonal, skillEstimate, reviewCards, personalPlan, refQuestion } from '../../src/personal-model';
import { createBackup, readBackup, mergeProgress, recoverProgress } from '../../src/backup';
import { initialExamProgress, startMock, finishMock } from '../../src/exam-model';
import { getExamProfile } from '../../src/exam-content';

const T = Date.parse('2026-10-10T10:00:00Z');
const roundTrip = (p: Progress) => readBackup(JSON.stringify(createBackup(p)));
function assessed() {
  let p = startPersonal(initialProgress(), 'placement', 'mix', T, 123, 'assessment');
  while (p.personal!.active) {
    const s = p.personal!.active;
    p = answerPersonal(p, refQuestion(s.items[s.index]).correct, T + s.index * 100 + 1);
    p = advancePersonal(p, T + s.index * 100 + 2);
  }
  return p;
}
function fixed(id: string) {
  const p = { ...initialProgress(), session: { id, lessonId: 'eq-1', seed: 123, index: 0, started: true, answers: [] } };
  return answerQuestion(p, makeQuestion('eq-1', 123, 0).correct, new Date(T).toISOString());
}

describe('audit: durable records', () => {
  it('recovers an inconsistent session without writing fabricated attempts or creating an invalid next backup', () => {
    const p=fixed('damaged');p.attempts=[];const raw=JSON.stringify(p);
    const recovered=recoverProgress(raw);
    expect(recovered.session).toBeNull();expect(recovered.attempts).toHaveLength(0);
    expect(roundTrip(recovered)).toEqual(recovered);expect(JSON.stringify(p)).toBe(raw);
  });
  it('preserves valid answers while dropping contradictory summaries and both copies of a conflicting immutable answer', () => {
    let p=fixed('summary');
    for(let i=1;i<5;i++){p=advanceQuestion(p);p=answerQuestion(p,makeQuestion('eq-1',123,i).correct,new Date(T+i*100).toISOString());}
    p=advanceQuestion(p);p.results[0].correct=0;
    const recovered=recoverProgress(JSON.stringify(p));expect(recovered.attempts).toHaveLength(5);expect(recovered.results).toHaveLength(0);expect(roundTrip(recovered)).toEqual(recovered);
    const conflicting={...recovered,attempts:[...recovered.attempts,{...recovered.attempts[0],at:new Date(T+1).toISOString()}]};
    const safe=recoverProgress(JSON.stringify(conflicting));expect(safe.attempts).toHaveLength(4);expect(roundTrip(safe)).toEqual(safe);
  });
  it('keeps placement and an unanswered error beyond the former 100-session boundary', () => {
    let p = assessed();
    p = startPersonal(p, 'practice', 'mix', T + 10_000, 456, 'error');
    const q = refQuestion(p.personal!.active!.items[0]);
    p = answerPersonal(p, q.options.find(o => o.id !== q.correct)!.id, T + 10_001);
    p = endPersonal(p, T + 10_002);
    const cards = reviewCards(p);
    for (let i = 0; i < 105; i++) {
      p = startPersonal(p, 'placement', 'mix', T + 20_000 + i * 100, i, `empty-${i}`);
      p = endPersonal(p, T + 20_001 + i * 100);
    }
    expect(skillEstimate(p, 'loudness').level).toBe(2);
    expect(reviewCards(p)).toEqual(cards);
    expect(p.personal!.results).toHaveLength(107);
    expect(roundTrip(p)).toEqual(p);
    expect(mergeProgress(initialProgress(), roundTrip(p)).personal).toEqual(p.personal);
  });
  it('keeps ordinary answers and results across the old 2000/200 limits, including merge and reload', () => {
    let p = fixed('active');
    const sample = p.attempts[0];
    p = { ...p, attempts: Array.from({ length: 2005 }, (_, i) => ({ ...sample, sessionId: `old-${i}` })).concat(p.attempts), results: Array.from({ length: 205 }, (_, i) => ({ id: `finished-${i}`, lessonId: 'eq-1', total: 5, correct: 5, at: new Date(T).toISOString() })) };
    p = advanceQuestion(p);
    p = answerQuestion(p, makeQuestion('eq-1', 123, 1).correct, new Date(T + 100).toISOString());
    expect(p.attempts).toHaveLength(2007);
    expect(parseProgress(JSON.stringify(p)).attempts).toHaveLength(2007);
    const merged = mergeProgress(initialProgress(), roundTrip(p));
    expect(merged.attempts).toHaveLength(2007);
    expect(merged.results).toHaveLength(205);
    expect(roundTrip(merged)).toEqual(merged);
  });
  it('keeps older mock results beyond 30 attempts', () => {
    let exam = initialExamProgress();
    for (let i = 0; i < 35; i++) exam = finishMock({ ...exam, active: startMock('common', 1, T + i * 1000, i, `mock-${i}`) }, 'ended', T + i * 1000 + 1);
    expect(exam.results).toHaveLength(35);
    const p = { ...initialProgress(), exam };
    expect(roundTrip(p)).toEqual(p);
    expect(mergeProgress(initialProgress(), p).exam).toEqual(exam);
  });
});

describe('audit: honest learning evidence', () => {
  it('keeps legacy scores but cannot invent sound variety or advance a stage without original question references', () => {
    const attempts=Array.from({length:10},(_,i)=>({sessionId:`legacy-${Math.floor(i/5)}`,index:i%5,lessonId:'eq-1',correct:true,at:new Date(T+i*100).toISOString()}));
    const p=roundTrip({...initialProgress(),attempts});
    expect(skillEstimate(p,'eq').level).toBe(1);
    expect(skillEstimate({...p,attempts:p.attempts.slice(0,5)},'eq')).toMatchObject({samples:5,accuracy:100,distinctExamples:0});
    expect(skillEstimate({...p,attempts:p.attempts.map(a=>({...a,lessonId:'eq-3'}))},'eq').level).toBe(1);
    expect(p.attempts).toEqual(attempts);
  });
  it('recognises sustained, varied advanced practice instead of trapping an experienced user at stage one', () => {
    const p: Progress = { ...initialProgress(), attempts: Array.from({ length: 10 }, (_, i) => {
      const index=i%5, seed=(i-index*2654435761)>>>0, q=makeQuestion('eq-3',seed,index,'studio');
      return { sessionId:`advanced-${Math.floor(i/5)}`,index,lessonId:'eq-3',correct:true,at:new Date(T+i*100).toISOString(),source:'studio',response:{seed,choice:q.correct} };
    }) };
    expect(skillEstimate(roundTrip(p),'eq').level).toBe(3);
    const short={...p,attempts:p.attempts.slice(0,5)};
    expect(skillEstimate(short,'eq').level).toBe(1);
  });
  it('requires 9/10 in binary tasks rather than applying the easier 8/10 threshold', () => {
    const attempts = Array.from({ length:10 }, (_,i)=>{
      const index=i%5,seed=(i-index*2654435761)>>>0,q=makeQuestion('attack-1',seed,index,'studio'),correct=i<8;
      return {sessionId:`binary-${Math.floor(i/5)}`,index,lessonId:'attack-1',correct,at:new Date(T+i*100).toISOString(),source:'studio' as const,response:{seed,choice:correct?q.correct:q.options.find(o=>o.id!==q.correct)!.id}};
    });
    const p={...initialProgress(),attempts};
    expect(skillEstimate(roundTrip(p),'attack').level).toBe(1);
    const last=attempts[8],q=makeQuestion(last.lessonId,last.response.seed,last.index,last.source);
    p.attempts[8]={...last,correct:true,response:{...last.response,choice:q.correct}};
    expect(skillEstimate(roundTrip(p),'attack').level).toBe(2);
  });
  it('does not raise rhythm difficulty for ten differently seeded copies of one audible pattern', () => {
    const target = makeQuestion('rhythm-repeat-1', 0, 0).music!.slots.join(',');
    const seeds: number[] = [];
    for (let seed = 0; seeds.length < 10; seed++) if (makeQuestion('rhythm-repeat-1', seed, 0).music!.slots.join(',') === target) seeds.push(seed);
    const p: Progress = { ...initialProgress(), attempts: seeds.map((seed, i) => ({ sessionId: `rhythm-${Math.floor(i / 5)}`, index: i % 5, lessonId: 'rhythm-repeat-1', correct: true, at: new Date(T + i * 100).toISOString(), response: { seed: (seed - (i % 5) * 2654435761) >>> 0, choice: makeQuestion('rhythm-repeat-1', seed, 0).correct } })) };
    expect(roundTrip(p)).toEqual(p);
    expect(skillEstimate(p, 'rhythm-repeat').level).toBe(1);
  });
  it('consolidates recurring mistakes on the same sound into one review task', () => {
    const q = makeQuestion('eq-1', 123, 0);
    const wrong = q.options.find(o => o.id !== q.correct)!.id;
    let p: Progress = { ...initialProgress(), attempts: ['a', 'b'].map((sessionId, i) => ({ sessionId, index: 0, lessonId: 'eq-1', correct: false, at: new Date(T + i * 100).toISOString(), response: { seed: 123, choice: wrong } })) };
    expect(reviewCards(p)).toHaveLength(1);
    p = startPersonal(p, 'review', 'mix', T + 700_000, 345, 'review');
    expect(p.personal!.active!.items).toHaveLength(1);
    p = answerPersonal(p, refQuestion(p.personal!.active!.items[0]).correct, T + 700_001);
    p = advancePersonal(p, T + 700_002);
    expect(reviewCards(roundTrip(p))).toHaveLength(1);
    expect(reviewCards(p)[0].successes).toBe(1);
  });
  it('does not repeatedly prescribe the same struggling skill while every other skill is untried', () => {
    const p: Progress = { ...initialProgress(), attempts: Array.from({ length: 10 }, (_, i) => ({ sessionId: `struggle-${Math.floor(i / 5)}`, index: i % 5, lessonId: 'eq-1', correct: false, at: new Date(T + i * 100).toISOString() })) };
    expect(skillEstimate(p, 'eq').reason).toBe('support');
    expect(personalPlan(p, 'mix', T + 10_000).focus.skill).not.toBe('eq');
  });
});

describe('audit: conflict protection', () => {
  it.each(['msgsu-opera-2026','msgsu-theory-2026'])('keeps the cited scope and a resumable Freq adaptation for %s', profileId => {
    const profile=getExamProfile(profileId)!;
    expect(profile.sources[0].year).toBe('2026–2027');
    expect(new URL(profile.sources[0].url).hostname).toBe('msgsu.edu.tr');
    const p={...initialProgress(),exam:{...initialExamProgress(),selectedProfile:profileId,active:startMock(profileId,1,T,123,'official-scope')}};
    expect(roundTrip(p)).toEqual(p);
    const result={...p,exam:finishMock(p.exam,'expired',p.exam.active.deadline)};
    const merged=mergeProgress(initialProgress(),roundTrip(result)).exam!;
    expect(merged.results).toEqual(result.exam.results);
    expect(merged.selectedProfile).toBe('common');
  });
  it('rejects two distinct unfinished ordinary sessions instead of discarding one', () => {
    expect(() => mergeProgress(fixed('a'), fixed('b'))).toThrow('conflict');
  });
  it('rejects two distinct running mocks instead of silently abandoning one', () => {
    const a = { ...initialProgress(), exam: { ...initialExamProgress(), active: startMock('common', 1, T, 123, 'a') } };
    const b = { ...initialProgress(), exam: { ...initialExamProgress(), active: startMock('common', 1, T, 456, 'b') } };
    expect(() => mergeProgress(a, b)).toThrow('conflict');
  });
});
