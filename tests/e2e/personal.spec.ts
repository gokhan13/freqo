import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ui, usesLoop, usesPair } from '../../src/content';
import { initialProgress, answerQuestion, STORAGE_KEY, type Progress } from '../../src/model';
import { refQuestion, startPersonal, answerPersonal, advancePersonal, personalPlan, reviewCards } from '../../src/personal-model';
import { createBackup } from '../../src/backup';

const read=(page:Page):Promise<Progress>=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),STORAGE_KEY);
async function install(page:Page,p:Progress){await page.addInitScript(({key,p})=>localStorage.getItem(key)||localStorage.setItem(key,JSON.stringify(p)),{key:STORAGE_KEY,p});await page.goto('/');}
async function open(page:Page){if(!await page.getByRole('button',{name:'Kişisel planı aç',exact:true}).count())await page.locator('.sidebar').getByRole('button',{name:'Bugün',exact:true}).click();await page.getByRole('button',{name:'Kişisel planı aç',exact:true}).click();}
async function hear(page:Page){
  const p=await read(page),s=p.personal!.active!,q=refQuestion(s.items[s.index]),player=page.locator('.personal-exercise .audio-player');
  const stereo=page.locator('.personal-exercise .stereo-check input');if(await stereo.count())await stereo.check();
  if(usesPair(q.kind)){
    await player.locator('.ab-button').nth(0).click();
    await expect(player.locator('.ab-button').nth(0)).toContainText('✓ Dinlendi',{timeout:12_000});
    if(!usesLoop(q.kind))await expect(player.getByRole('button',{name:'Dinle',exact:true})).toBeVisible({timeout:12_000});
    await player.locator('.ab-button').nth(1).click();
  }else await player.getByRole('button',{name:'Dinle',exact:true}).click();
  if(q.options.length)await expect(page.locator('.personal-exercise .answer-option').first()).toBeEnabled({timeout:12_000});
}
async function next(page:Page){await page.getByRole('button',{name:'Sonraki soru',exact:true}).click();}
function wrongManual(at=Date.now()-700_000){let p:Progress={...initialProgress(),session:{id:'old-mix',lessonId:'eq-1',seed:123,index:0,started:true,answers:[],source:'recorded-drums'}};const q=refQuestion({lessonId:'eq-1',seed:123,index:0,source:'recorded-drums'});p=answerQuestion(p,q.options.find(o=>o.id!==q.correct)!.id,new Date(at).toISOString());return p;}

test('personal plan is bilingual, accessible, responsive and keeps manual lessons available',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');await open(page);
  await expect(page.getByRole('heading',{name:'Sana uygun bir sonraki adım.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Başlangıcımı belirle'})).toBeDisabled();
  await expect(page.locator('.personal-skill')).toHaveCount(9);await expect(page.locator('.personal-levels')).not.toHaveAttribute('open');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/personal-plan-mobile.png',fullPage:true});
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.getByRole('button',{name:'EN',exact:true}).click();await expect(page.getByRole('heading',{name:'Your next step, at your pace.'})).toBeVisible();
  await page.locator('.personal-path select').first().selectOption('exam');await expect(page.getByText('12 questions · no time limit',{exact:false})).toBeVisible();
  await expect(page.locator('.personal-skill')).toHaveCount(6);
  await page.getByRole('button',{name:'Learn this lesson first',exact:true}).click();await expect(page.locator('.lesson-intro')).toBeVisible();
});

test('mix assessment adapts the second probe, resumes, shows no early answers and completes without practice scores',async({page})=>{
  test.setTimeout(100_000);await page.goto('/');await open(page);await page.locator('.stereo-check input').check();await page.getByRole('button',{name:'Başlangıcımı belirle',exact:true}).click();
  for(let i=0;i<18;i++){
    await expect(page.locator('.personal-exercise .answer-option').first()).toBeDisabled();await hear(page);
    const p=await read(page),s=p.personal!.active!,q=refQuestion(s.items[s.index]);await page.getByTestId(`personal-answer-${q.correct}`).click();
    await expect(page.locator('.personal-exercise .feedback')).toHaveCount(0);await expect(page.locator('.personal-exercise .is-correct')).toHaveCount(0);
    if(i===0){expect((await read(page)).personal!.active!.items[1].lessonId).toBe('eq-2');await page.reload();await expect(page.getByText('Yanıtın kaydedildi. Sonraki beceriye devam edebilirsin.',{exact:true})).toBeVisible();}
    await page.getByRole('button',{name:i===17?'Sonucu gör':'Sonraki soru',exact:true}).click();
  }
  await expect(page.locator('.personal-result')).toBeVisible();const p=await read(page);expect(p.attempts).toHaveLength(0);expect(p.results).toHaveLength(0);expect(p.personal!.results[0].status).toBe('completed');
  await expect(page.locator('.personal-result-score strong')).toHaveText('18/18');await expect(page.locator('.personal-placement-levels li').first()).toContainText('Seviye 2');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/personal-assessment-mobile.png',fullPage:true});
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('personal practice reviews exact errors, scores once, advances the spaced schedule and preserves fixed sessions',async({page})=>{
  test.setTimeout(80_000);await install(page,wrongManual());await open(page);const original=(await read(page)).session;
  await page.getByRole('button',{name:'Kişisel pratiğe başla',exact:true}).click();let p=await read(page);expect(p.personal!.active!.items[0].review!.id).toBe('manual:old-mix:0');expect(p.personal!.active!.items[0].source).toBe('recorded-drums');
  for(let i=0;i<5;i++){
    await hear(page);p=await read(page);const s=p.personal!.active!,q=refQuestion(s.items[i]);await page.getByTestId(`personal-answer-${q.correct}`).click();
    if(i===0){await expect(page.locator('.personal-exercise .feedback.correct')).toBeVisible();await page.reload();await expect(page.locator('.personal-exercise .feedback.correct')).toBeVisible();expect((await read(page)).personal!.active!.answers).toHaveLength(1);}
    await page.getByRole('button',{name:i===4?'Sonucu gör':'Sonraki soru',exact:true}).click();
  }
  p=await read(page);expect(p.session).toEqual(original);expect(p.attempts).toHaveLength(1);expect(p.personal!.results).toHaveLength(1);expect(reviewCards(p)[0].successes).toBe(1);expect(reviewCards(p)[0].dueAt).toBe(p.personal!.results[0].answers[0].at+86_400_000);
  await expect(page.locator('.personal-result-score strong')).toHaveText('5/5');expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

test('pausing and ending an incomplete assessment preserve the earlier baseline and separate skipped answers',async({page})=>{
  await page.goto('/');await open(page);await page.locator('.personal-path select').selectOption('music');await page.getByRole('button',{name:'Başlangıcımı belirle',exact:true}).click();
  await page.getByRole('button',{name:'Bilmiyorum / bu soruyu geç',exact:true}).click();await next(page);await page.getByRole('button',{name:'Kaydet ve ara ver',exact:true}).click();
  await expect(page.getByRole('button',{name:'Kişisel çalışmaya dön',exact:true})).toBeVisible();await page.getByRole('button',{name:'Kişisel çalışmaya dön',exact:true}).click();
  await page.getByRole('button',{name:'Bu çalışmayı sonlandır',exact:true}).click();await page.getByRole('button',{name:'Sonlandır ve kaydet',exact:true}).click();
  const p=await read(page);expect(p.personal!.active).toBeNull();expect(p.personal!.results[0].status).toBe('ended');expect(p.personal!.results[0].answers[0].choice).toBeNull();
  await expect(page.locator('.personal-result')).toContainText('Yarım değerlendirme seviyelerini değiştirmedi.');expect(personalPlan(p,'music').focus.level).toBe(1);
});

test('assessment dictation has no candidate preview and interrupted listening cannot unlock an answer',async({page})=>{
  let p=startPersonal({...initialProgress(),path:'music'},'placement','music',Date.now(),123,'typed');
  for(let i=0;i<14;i++){p=answerPersonal(p,null,Date.now());p=advancePersonal(p,Date.now());}
  await install(page,p);await expect(page.locator('.personal-exercise .audio-player')).toHaveCount(1);await expect(page.locator('.music-editor')).toBeVisible();await expect(page.getByRole('button',{name:'Taslağını dinle'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Yanıtı gönder',exact:true})).toBeDisabled();const player=page.locator('.personal-exercise .audio-player');
  await player.getByRole('button',{name:'Dinle',exact:true}).click();await player.getByRole('button',{name:ui.pause.tr,exact:true}).click();
  await expect(page.locator('.personal-exercise .listen-first')).toBeVisible();expect((await read(page)).personal!.active!.answers).toHaveLength(14);
});

test('personal assessment submits melodic and rhythmic dictation and keeps one audio panel across entry modes',async({page})=>{
  test.setTimeout(80_000);
  let p=startPersonal({...initialProgress(),path:'music'},'placement','music',Date.now(),456,'entries');
  for(let i=0;i<14;i++){p=answerPersonal(p,null,Date.now());p=advancePersonal(p,Date.now());}
  await install(page,p);
  for(let slot=14;slot<18;slot++){
    await expect(page.locator('.personal-exercise .audio-player')).toHaveCount(1);
    if(slot===15||slot===17){await page.getByRole('button',{name:'Bilmiyorum / bu soruyu geç',exact:true}).click();await next(page);continue;}
    await hear(page);const s=(await read(page)).personal!.active!,q=refQuestion(s.items[s.index]);
    if(q.music!.response==='melody')for(const [i,degree]of q.music!.degrees.entries()){await page.getByTestId(`melody-slot-${i}`).click();await page.getByTestId(`degree-${degree}`).click();}
    else for(const value of q.music!.slots)await page.getByTestId(`rhythm-slot-${value}`).click();
    await page.getByTestId('submit-music').click();expect((await read(page)).personal!.active!.answers[slot].correct).toBe(true);await expect(page.locator('.personal-exercise .music-feedback')).toHaveCount(0);await next(page);
  }
  await expect(page.locator('.tap-recorder')).toBeVisible();await expect(page.locator('.personal-exercise .audio-player')).toHaveCount(1);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  const before=await read(page);await page.reload();expect((await read(page)).personal!.active!.answers).toEqual(before.personal!.active!.answers);
});

test('personal mistakes survive actual JSON export/import and repeated import keeps one session and unchanged due times',async({page})=>{
  await page.goto('/');await open(page);await page.getByRole('button',{name:'Kişisel pratiğe başla',exact:true}).click();await hear(page);let p=await read(page),q=refQuestion(p.personal!.active!.items[0]);await page.getByTestId(`personal-answer-${q.options.find(o=>o.id!==q.correct)!.id}`).click();
  await page.locator('.sidebar').getByRole('button',{name:'Profil',exact:true}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:ui.export.tr,exact:true}).click();const download=await downloadPromise;const file=await download.path();expect(file).toBeTruthy();
  const before=await read(page);for(let i=0;i<2;i++){await page.locator('input[type=file]').setInputFiles(file!);await page.getByRole('dialog').getByRole('button',{name:ui.importAction.tr,exact:true}).click();await expect(page.getByText(ui.importSuccess.tr,{exact:true})).toBeVisible();}
  p=await read(page);expect(p.personal).toEqual(before.personal);expect(reviewCards(p)).toEqual(reviewCards(before));
  const malformed=structuredClone(createBackup(p));malformed.progress.personal!.active!.answers[0].correct=true;await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(malformed))});await expect(page.getByRole('dialog')).toHaveCount(0);expect((await read(page)).personal).toEqual(before.personal);
});

test('personal practice can start and reload offline after the app is cached',async({page,context})=>{
  await page.goto('/');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);
  await open(page);await page.getByRole('button',{name:'Kişisel pratiğe başla',exact:true}).click();await hear(page);const before=await read(page);await page.reload();await expect(page.locator('.personal-exercise')).toBeVisible();expect((await read(page)).personal!.active!.id).toBe(before.personal!.active!.id);await context.setOffline(false);
});

test('advanced mix mistakes show the chosen C settings in both live feedback and saved result review',async({page})=>{
  let p:Progress={...initialProgress(),session:{id:'dynamics',lessonId:'compression-1',seed:123,index:0,started:true,answers:[],source:'acoustic'}};
  const q=refQuestion({lessonId:'compression-1',seed:123,index:0,source:'acoustic'}),choice=q.options.find(o=>o.id!==q.correct)!.id;
  p=answerQuestion(p,choice,new Date(Date.now()-700_000).toISOString());await install(page,p);await open(page);await page.getByRole('button',{name:'Yanlışlarımı çalış',exact:true}).click();
  await hear(page);await page.getByTestId(`personal-answer-${choice}`).click();await expect(page.locator('.personal-exercise .mix-setting-rows > div')).toHaveCount(3);
  await page.getByRole('button',{name:'Sonucu gör',exact:true}).click();await expect(page.locator('.personal-result .mix-setting-rows > div')).toHaveCount(3);await expect(page.locator('.personal-result .mix-setting-rows > div').last()).toContainText('C');
  await page.locator('.personal-result .ab-button').nth(2).click();await expect(page.locator('.personal-result .signal-readings')).toContainText('C');
  expect((await read(page)).personal!.results).toHaveLength(1);expect(reviewCards(await read(page))).toHaveLength(1);
});
