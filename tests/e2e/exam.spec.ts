import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress, STORAGE_KEY, type Progress } from '../../src/model';
import { initialExamProgress, mockQuestion, startMock } from '../../src/exam-model';
import { examProfiles } from '../../src/exam-content';
import { readFile } from 'node:fs/promises';
import { melodyChoice, rhythmChoice } from '../../src/music-model';

async function saved(page:Page):Promise<Progress>{return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),STORAGE_KEY);}
async function open(page:Page,active=false,seed=17){
  const progress={...initialProgress(),path:'exam' as const,exam:{...initialExamProgress(),...(active?{active:startMock('common',1,Date.now(),seed,'e2e-mock')}:{})}};
  await page.addInitScript(({key,progress})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(progress));},{key:STORAGE_KEY,progress});
  await page.goto('/');
  if(!active)await page.locator('.path-card').filter({hasText:'Sınava hazırlık'}).click();
}
async function listen(page:Page){await page.getByRole('button',{name:'Soruyu dinle',exact:true}).click();await expect(page.getByRole('button',{name:'Soruyu dinle',exact:true})).toBeEnabled({timeout:12_000});}
async function accessible(page:Page){expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}

test('audition studio offers three-level lessons, source profiles and bilingual mobile navigation',async({page})=>{
  await open(page);await expect(page.getByRole('heading',{name:'Hedefini tanı, çalışmanı seç.'})).toBeVisible();
  await expect(page.locator('.exam-select select option')).toHaveCount(examProfiles.length);
  await page.getByRole('button',{name:'Hazırlık dersleri',exact:true}).click();await expect(page.locator('.exam-course-card')).toHaveCount(7);
  await page.locator('.exam-course-card').filter({hasText:'Deşifre ve solfej'}).click();
  await expect(page.locator('.exam-staff svg')).toBeVisible();await page.getByRole('button',{name:'3 · Yoğun',exact:true}).click();await expect(page.locator('.exam-staff svg ellipse')).toHaveCount(8);
  await page.getByRole('button',{name:'EN',exact:true}).click();await expect(page.getByRole('heading',{name:'Sight-reading and solfège'})).toBeVisible();
  await page.setViewportSize({width:320,height:900});await accessible(page);await page.screenshot({path:'test-results/previews/exam-sight-reading-mobile.png',fullPage:true});
});
test('rehearsal self-assessment survives reload and is included in downloadable backups without scoring',async({page})=>{
  await open(page);await page.getByRole('button',{name:'Hazırlık dersleri',exact:true}).click();await page.locator('.exam-course-card').filter({hasText:'İki, üç ve dört ses'}).click();
  await page.getByRole('button',{name:'3 · Yoğun',exact:true}).click();await page.locator('.exam-lesson .play-button').click();await expect(page.locator('.exam-lesson .audio-player')).toHaveClass(/is-playing/);
  await page.getByLabel('Pes sesi buldum.').check();await page.getByLabel('Ses sırasını korudum.').check();await page.locator('.exam-note textarea').fill('Ara seslere odaklan.');
  await page.getByRole('button',{name:'Öz değerlendirmeyi kaydet'}).click();await expect(page.getByRole('button',{name:'Prova kaydedildi'})).toBeDisabled();
  const p=await saved(page);expect(p.exam?.rehearsals[0]).toMatchObject({level:3,courseId:'polyphony',checks:[true,false,true],note:'Ara seslere odaklan.'});expect(p.attempts).toHaveLength(0);
  await page.reload();await page.locator('.path-card').filter({hasText:'Sınava hazırlık'}).click();await page.getByRole('button',{name:'Hazırlık dersleri',exact:true}).click();await page.locator('.exam-course-card').filter({hasText:'İki, üç ve dört ses'}).click();await expect(page.locator('.exam-rehearsal-history')).toContainText('Ara seslere odaklan.');
  await page.setViewportSize({width:390,height:844});await accessible(page);
});
test('mock requires complete A/B hearing, preserves quota on reload and hides answers until early finish',async({page})=>{
  await open(page,true);await expect(page.locator('.exam-mock .answer-option').first()).toBeDisabled();
  await page.getByRole('button',{name:'Soruyu dinle',exact:true}).click();await page.getByRole('button',{name:'Durdur',exact:true}).click();await expect(page.getByTestId('exam-listen-count')).toContainText('1/3');
  await expect(page.locator('.exam-mock .answer-option').first()).toBeDisabled();await listen(page);await expect(page.locator('.exam-mock .answer-option').first()).toBeEnabled();
  const before=await saved(page);expect(before.exam?.active?.plays[0]).toBe(2);expect(before.exam?.active?.heard[0]).toBe(true);
  await page.reload();await expect(page.getByTestId('exam-listen-count')).toContainText('2/3');await expect(page.locator('.exam-mock .answer-option').first()).toBeEnabled();
  const q=mockQuestion(before.exam!.active!);await page.getByRole('button',{name:q.options.find(o=>o.id===q.correct)!.label.tr,exact:true}).click();await expect(page.locator('.exam-mock')).toContainText('Soru 2/6');await expect(page.locator('.feedback,.exam-review')).toHaveCount(0);
  await page.getByRole('button',{name:'Denemeyi bitir',exact:true}).click();await page.getByRole('button',{name:'Bitir ve incele',exact:true}).click();await expect(page.locator('.exam-result-score strong')).toHaveText('1/6');await expect(page.locator('.exam-focus')).toBeVisible();
  const p=await saved(page);expect(p.exam?.results[0].reason).toBe('ended');expect(p.exam?.active).toBeNull();expect(p.attempts).toHaveLength(0);
  await page.setViewportSize({width:320,height:900});await accessible(page);await page.screenshot({path:'test-results/previews/exam-review-mobile.png',fullPage:true});
});
test('three started hearings exhaust quota, interrupted hearings cannot unlock an answer',async({page})=>{
  await open(page,true);
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'Soruyu dinle',exact:true}).click();await page.getByRole('button',{name:'Durdur',exact:true}).click();}
  await expect(page.getByRole('button',{name:'Soruyu dinle',exact:true})).toBeDisabled();await expect(page.locator('.exam-mock .answer-option').first()).toBeDisabled();
  await page.getByRole('button',{name:'Boş bırak ve ilerle'}).click();await expect(page.locator('.exam-mock')).toContainText('Soru 2/6');expect((await saved(page)).exam!.active!.answers[0]).toMatchObject({choice:null,correct:false});
});
test('expired mock is finalized once after a closed page with no late-answer score',async({page})=>{
  const active=startMock('common',1,Date.now()-400_000,17,'expired-test');const progress={...initialProgress(),exam:{...initialExamProgress(),active}};
  await page.addInitScript(({key,progress})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(progress));},{key:STORAGE_KEY,progress});await page.goto('/');
  await expect(page.locator('.exam-review')).toBeVisible();expect((await saved(page)).exam!.results[0]).toMatchObject({reason:'expired',finishedAt:active.deadline});
  await page.reload();expect((await saved(page)).exam!.results).toHaveLength(1);expect((await saved(page)).exam!.active).toBeNull();
});
test('normal UI can prepare and start a timer without replacing an ordinary saved practice',async({page})=>{
  await open(page);await page.getByRole('button',{name:'Denemeler',exact:true}).click();await page.getByRole('button',{name:'2 · Gelişen',exact:true}).click();
  await page.getByRole('button',{name:'Denemeyi hazırla'}).click();expect((await saved(page)).exam!.active).toBeNull();await page.getByRole('button',{name:'Süreyi başlat'}).click();
  await expect(page.getByTestId('exam-mock')).toBeVisible();const p=await saved(page);expect(p.exam!.active!.level).toBe(2);expect(p.exam!.active!.deadline-p.exam!.active!.startedAt).toBe(480_000);
  await page.getByRole('button',{name:'Bugün',exact:true}).click();await expect(page.locator('.exam-resume')).toBeVisible();await page.getByRole('button',{name:'Denemeye dön'}).click();await expect(page.locator('.exam-mock')).toBeVisible();
});
test('complete mock includes editable rhythm and melody entries, final review and a saved single result',async({page})=>{
  test.setTimeout(80_000);await open(page,true);
  for(let i=0;i<6;i++){
    const p=await saved(page),q=mockQuestion(p.exam!.active!);await listen(page);
    if(q.music?.response==='melody'){
      for(const [j,d] of q.music.degrees.entries()){await page.getByTestId(`melody-slot-${j}`).click();await page.getByTestId(`degree-${d}`).click();}
      expect(melodyChoice(q.music.degrees)).toBe(q.correct);await expect(page.getByRole('button',{name:'Taslağını dinle'})).toHaveCount(0);await page.getByTestId('submit-music').click();
    }else if(q.music?.response==='rhythm'){
      for(const slot of q.music.slots)await page.getByTestId(`rhythm-slot-${slot}`).click();expect(rhythmChoice(q.music.slots)).toBe(q.correct);await page.getByTestId('submit-music').click();
    }else await page.getByRole('button',{name:q.options.find(o=>o.id===q.correct)!.label.tr,exact:true}).click();
    if(i<5)await expect(page.locator('.exam-review')).toHaveCount(0);
  }
  await expect(page.locator('.exam-result-score strong')).toHaveText('6/6');expect((await saved(page)).exam!.results).toHaveLength(1);
  await page.getByLabel('İncelenecek soru').selectOption('4');await expect(page.locator('.degree-notation')).toBeVisible();await page.locator('.exam-review .play-button').click();await expect(page.locator('.exam-review .audio-player')).toHaveClass(/is-playing/);
  await page.setViewportSize({width:390,height:844});await accessible(page);
});
test('audio startup failure refunds its quota and leaves answers locked',async({page})=>{
  await page.addInitScript(()=>{AudioContext.prototype.resume=async()=>{throw new Error('test unavailable audio');};});await open(page,true);
  await page.getByRole('button',{name:'Soruyu dinle',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Ses başlatılamadı');await expect(page.getByTestId('exam-listen-count')).toContainText('0/3');await expect(page.locator('.exam-mock .answer-option').first()).toBeDisabled();
});
test('audition lessons and timed mock work offline after installation',async({page,context})=>{
  await open(page);await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();
  await page.locator('.path-card').filter({hasText:'Sınava hazırlık'}).click();await page.getByRole('button',{name:'Hazırlık dersleri',exact:true}).click();await expect(page.locator('.exam-course-card')).toHaveCount(7);await page.getByRole('button',{name:'Denemeler',exact:true}).click();await page.getByRole('button',{name:'Denemeyi hazırla'}).click();await page.getByRole('button',{name:'Süreyi başlat'}).click();await listen(page);await expect(page.locator('.exam-mock .answer-option').first()).toBeEnabled();
});
test('real backup download and repeated restore preserve a timed mock and its original deadline',async({page})=>{
  await open(page,true);await page.getByRole('button',{name:'Boş bırak ve ilerle'}).click();
  await page.getByRole('button',{name:'Profil',exact:true}).click();const before=await saved(page);
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'İlerlemeyi indir'}).click();const download=await downloading;
  const bytes=await readFile((await download.path())!);expect(JSON.parse(bytes.toString()).progress.exam).toEqual(before.exam);
  for(let i=0;i<2;i++){
    await page.locator('input[type=file]').setInputFiles({name:'exam-backup.json',mimeType:'application/json',buffer:bytes});
    await expect(page.getByRole('dialog')).toContainText('Süreli deneme de geri alınacak');
    await page.getByRole('button',{name:'Birleştir ve yükle'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
    expect((await saved(page)).exam).toEqual(before.exam);
  }
  await page.getByRole('button',{name:'Bugün',exact:true}).click();await page.getByRole('button',{name:'Denemeye dön'}).click();await expect(page.locator('.exam-mock')).toContainText('Soru 2/6');
});
test('hidden-tab audio interruption releases the player without completing or refunding a hearing',async({page})=>{
  await open(page,true);await page.getByRole('button',{name:'Soruyu dinle',exact:true}).click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.getByRole('button',{name:'Soruyu dinle',exact:true})).toBeEnabled();await expect(page.locator('.exam-mock .answer-option').first()).toBeDisabled();expect((await saved(page)).exam!.active!.plays[0]).toBe(1);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await listen(page);await expect(page.locator('.exam-mock .answer-option').first()).toBeEnabled();
});
