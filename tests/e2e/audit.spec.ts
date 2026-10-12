import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { initialProgress, makeQuestion, answerQuestion, STORAGE_KEY, LEGACY_STORAGE_KEY, type Progress } from '../../src/model';
import { startPersonal, answerPersonal, advancePersonal, refQuestion } from '../../src/personal-model';
import { readBackup } from '../../src/backup';

async function install(page: Page, p: Progress) {
  await page.addInitScript(({ key, p }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(p)); }, { key: STORAGE_KEY, p });
  await page.goto('/');
}
async function listen(page: Page) {
  const player = page.locator('.exercise .audio-player');
  await player.locator('.ab-button').nth(0).click();
  await expect(player.locator('.ab-button').nth(0)).toContainText('✓ Dinlendi');
  await player.locator('.ab-button').nth(1).click();
  await expect(page.locator('.answer-option').first()).toBeEnabled();
}
const fixed = (): Progress => ({ ...initialProgress(), session: { id: 'ordinary', lessonId: 'eq-1', seed: 123, index: 0, started: true, answers: [], source: 'studio' } });
async function downloaded(page: Page, name: string) {
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name, exact: true }).click();
  const download = await event;
  return readFile((await download.path())!, 'utf8');
}

test('rapid A/B clicks do not earn listening credit; credit follows the actual AudioContext clock', async ({ page }) => {
  await page.addInitScript(() => {
    const start = AudioBufferSourceNode.prototype.start;
    const trace = { context: null as BaseAudioContext | null, start: 0, credits: [] as number[] };
    (window as unknown as { listeningTrace: typeof trace }).listeningTrace = trace;
    AudioBufferSourceNode.prototype.start = function (when = 0, offset = 0, duration?: number) {
      if (this.loop) { trace.context = this.context; trace.start = when; }
      if (duration === undefined) start.call(this, when, offset); else start.call(this, when, offset, duration);
    };
    new MutationObserver(() => {
      if (trace.context && document.querySelector('.ab-button small')?.textContent?.includes('Dinlendi') && !trace.credits.length) trace.credits.push(trace.context.currentTime);
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  await install(page, fixed());
  const player = page.locator('.exercise .audio-player');
  await player.locator('.ab-button').nth(0).click();
  await player.locator('.ab-button').nth(1).click();
  await expect(page.locator('.answer-option').first()).toBeDisabled();
  await expect(player.locator('.ab-button').nth(0)).not.toContainText('✓ Dinlendi');
  await player.getByRole('button', { name: 'Durdur', exact: true }).click();
  await listen(page);
  const trace = await page.evaluate(() => { const t = (window as unknown as { listeningTrace: { start: number; credits: number[] } }).listeningTrace; return { start: t.start, credits: t.credits }; });
  expect(trace.credits[0] - trace.start).toBeGreaterThanOrEqual(1);
  await page.getByTestId('answer-' + makeQuestion('eq-1', 123, 0).correct).click();
  await expect(page.locator('.feedback')).toBeVisible();
});

test('an invalid saved section is preserved byte for byte until explicit recovery, with downloadable originals', async ({ page }) => {
  const damaged=answerQuestion(fixed(),makeQuestion('eq-1',123,0).correct,new Date().toISOString());
  const original = JSON.stringify({ ...damaged, attempts: [], personal: { version: 9, results: [], active: null } });
  await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key: STORAGE_KEY, raw: original });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Orijinal kayıt korunuyor');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(original);
  expect(await downloaded(page, 'Download original record')).toBe(original);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Use recovered records', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Unreadable sections');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const saved = await page.evaluate(key => localStorage.getItem(key)!, STORAGE_KEY);
  expect(readBackup(saved).locale).toBe('en');
  expect(readBackup(saved).personal).toBeUndefined();
  expect(readBackup(saved).session).toBeNull();
  expect(readBackup(saved).attempts).toHaveLength(0);
});

test('two tabs protect conflicting unfinished sessions and offer both complete records for download', async ({ page, context }) => {
  await install(page, fixed());
  const other = await context.newPage();
  await other.goto('/');
  await other.locator('.sidebar').getByRole('button', { name: 'Yollar', exact: true }).click();
  await other.locator('.full-path').first().getByRole('button', { name: 'Yolu keşfet' }).click();
  const row = other.getByTestId('lesson-loudness-1');
  const section = row.locator('xpath=ancestor::details');
  if (!await section.evaluate(e => (e as HTMLDetailsElement).open)) await section.locator('summary').click();
  await row.getByRole('button', { name: 'Pratiğe başla', exact: true }).click();
  await other.getByRole('dialog').getByRole('button', { name: 'Yeni pratiğe geç', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Başka bir sekmedeki kayıtla çakışma');
  const disk = await page.evaluate(key => localStorage.getItem(key)!, STORAGE_KEY);
  expect(readBackup(disk).session!.lessonId).toBe('loudness-1');
  await listen(page);
  await page.getByTestId('answer-' + makeQuestion('eq-1', 123, 0).correct).click();
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(disk);
  const local = readBackup(await downloaded(page, 'Bu sekmedeki veriyi indir'));
  expect(local.session!.lessonId).toBe('eq-1');
  expect(local.session!.answers).toHaveLength(1);
  expect(await downloaded(page, 'Orijinal kaydı indir')).toBe(disk);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await other.close();
});

test('ordinary answers synchronise between tabs without duplicate scoring or preference ping-pong', async ({ page, context }) => {
  await install(page, fixed());
  const other = await context.newPage(); await other.goto('/');
  await listen(page); await page.getByTestId('answer-' + makeQuestion('eq-1', 123, 0).correct).click();
  await expect(other.locator('.feedback.correct')).toBeVisible();
  await other.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const a = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(a.attempts).toHaveLength(1); expect(a.session.answers).toHaveLength(1);
  await other.close();
});

test('correct error reviews do not inflate ordinary accuracy and skill practice opens the suggested level', async ({ page }) => {
  const now = Date.now();
  let p = startPersonal(initialProgress(), 'placement', 'mix', now - 800_000, 123, 'baseline');
  while (p.personal!.active) { const s = p.personal!.active; p = answerPersonal(p, refQuestion(s.items[s.index]).correct, now - 799_999 + s.index * 10); p = advancePersonal(p, now - 799_998 + s.index * 10); }
  p = { ...p, session: { id: 'error', lessonId: 'eq-2', seed: 123, index: 0, started: true, answers: [] } };
  const q = makeQuestion('eq-2', 123, 0);
  p = answerQuestion(p, q.options.find(o => o.id !== q.correct)!.id, new Date(now - 700_000).toISOString());
  p = { ...p, session: null };
  p = startPersonal(p, 'review', 'mix', now - 10_000, 456, 'review');
  p = answerPersonal(p, refQuestion(p.personal!.active!.items[0]).correct, now - 9999);
  p = advancePersonal(p, now - 9998);
  await install(page, p);
  await expect(page.locator('.stats-card')).toContainText('Tekrar hariç doğru yanıt');
  await expect(page.locator('.stats-card')).toContainText('0%');
  await expect(page.locator('.stats-card')).toContainText('1 hata tekrarı');
  await page.locator('.sidebar').getByRole('button', { name: 'Becerilerim', exact: true }).click();
  const skill = page.locator('.skill-card').first();
  await expect(skill).toContainText('Seviye 2');
  await expect(skill.locator('.skill-score')).toHaveText('0%');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await skill.getByRole('button', { name: 'Bu beceriyi çalış', exact: true }).click();
  expect((await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY)).session.lessonId).toBe('eq-2');
});

test('storage quota failure preserves the completed answer in a valid downloadable backup', async ({ page }) => {
  await install(page, fixed());
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); }; });
  await listen(page); await page.getByTestId('answer-' + makeQuestion('eq-1', 123, 0).correct).click();
  await expect(page.getByRole('alert')).toContainText('Tarayıcı kayıt yapamıyor');
  const p = readBackup(await downloaded(page, 'Bu sekmedeki veriyi indir'));
  expect(p.attempts).toHaveLength(1); expect(p.session!.answers[0].correct).toBe(true);
});

test('separate deployment scopes keep their own offline caches and do not delete another installation', async ({ page, context }) => {
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/sw.js'))).toBe(true);
  const first = await page.evaluate(()=>caches.keys());
  await page.evaluate(async()=>{const other=await caches.open('freq-%2Fother%2F-keep');await other.put('/other-proof',new Response('preserved'));});
  const nested=await context.newPage();await nested.goto('/freq/');
  await expect.poll(()=>nested.evaluate(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/freq/sw.js'))).toBe(true);
  const after=await page.evaluate(()=>caches.keys());
  expect(after).toEqual(expect.arrayContaining(first));
  expect(after).toContain('freq-%2Fother%2F-keep');
  expect(after.some(k=>k.startsWith('freq-%2F-'))).toBe(true);
  expect(after.some(k=>k.startsWith('freq-%2Ffreq%2F-'))).toBe(true);
  await context.setOffline(true);await page.reload();await nested.reload();
  await expect(page.getByRole('heading',{name:/İyi bir miks/})).toBeVisible();
  await expect(nested.getByRole('heading',{name:/İyi bir miks/})).toBeVisible();
  await nested.close();
});

test('0.7 records migrate without replacing the original; writes from an older tab cannot truncate current history', async ({ page }) => {
  const before = answerQuestion(fixed(), makeQuestion('eq-1',123,0).correct, new Date().toISOString());
  const raw = JSON.stringify(before);
  await page.addInitScript(({key,raw})=>{if(!localStorage.getItem(key))localStorage.setItem(key,raw);},{key:LEGACY_STORAGE_KEY,raw});
  await page.goto('/');await expect(page.locator('.feedback.correct')).toBeVisible();
  expect(await page.evaluate(key=>localStorage.getItem(key),LEGACY_STORAGE_KEY)).toBe(raw);
  expect(readBackup(await page.evaluate(key=>localStorage.getItem(key)!,STORAGE_KEY))).toEqual(before);
  await page.evaluate(({key,p})=>localStorage.setItem(key,JSON.stringify(p)),{key:LEGACY_STORAGE_KEY,p:initialProgress()});
  await page.reload();await expect(page.locator('.feedback.correct')).toBeVisible();
  expect(readBackup(await page.evaluate(key=>localStorage.getItem(key)!,STORAGE_KEY))).toEqual(before);
});

test('official programme scopes remain distinct, cited, and separate from Freq mock settings in both languages', async ({ page }) => {
  await page.goto('/');await page.locator('.sidebar').getByRole('button',{name:'Yollar',exact:true}).click();
  await page.locator('.full-path').nth(2).getByRole('button',{name:'Yolu keşfet'}).click();
  const select=page.locator('.exam-select select');await select.selectOption('msgsu-opera-2026');
  await expect(page.locator('.exam-source-status')).toContainText('2026–2027');
  await expect(page.locator('.exam-profile')).toContainText('3 · Kesin kabul');
  await expect(page.locator('.exam-sources')).toContainText('25–26');
  await expect(page.locator('.exam-sources a')).toHaveAttribute('href',/msgsu\.edu\.tr.*2026-2027\.pdf/);
  await select.selectOption('msgsu-theory-2026');await expect(page.locator('.exam-sources')).toContainText('17–19');
  await expect(page.locator('.exam-profile')).toContainText('2 · Yazılı düzey sınavı');
  await page.getByRole('button',{name:'EN',exact:true}).click();await expect(page.locator('.exam-source-status')).toContainText('does not fully cover');
  await page.getByRole('button',{name:'Preparation lessons',exact:true}).click();
  await expect(page.locator('.exam-source-status')).toContainText('Freq settings');
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/audit-exam-scope-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
