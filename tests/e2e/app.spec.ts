import { isMusicianship } from '../../src/music-types';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { eqSourceIds, eqSources, lessons, usesLoop, usesPair } from '../../src/content';
import { advanceQuestion, answerQuestion, initialProgress, makeQuestion, STORAGE_KEY, type Progress } from '../../src/model';
import { createBackup, MAX_BACKUP_BYTES } from '../../src/backup';
import { readFile } from 'node:fs/promises';

async function progress(page: Page): Promise<Progress> { return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY); }
async function chooseLesson(page: Page, lessonId: string) {
  const lesson = lessons.find(l => l.id === lessonId)!;
  await page.goto('/');
  await page.locator('.sidebar').getByRole('button', { name: 'Yollar', exact: true }).click();
  await page.locator('.full-path').nth(['mix', 'music', 'exam'].indexOf(lesson.path)).getByRole('button', { name: 'Yolu keşfet' }).click();
  const section = page.getByTestId(`lesson-${lesson.id}`).locator('xpath=ancestor::details');
  if (!(await section.evaluate(el => (el as HTMLDetailsElement).open))) await section.locator('summary').click();
  await page.getByTestId(`lesson-${lesson.id}`).getByRole('button', { name: 'Pratiğe başla' }).click();
  await expect(page.getByRole('heading', { name: lesson.title.tr, exact: true })).toBeVisible();
  const check = page.locator('.stereo-check input');
  if (await check.count()) await check.check();
  await page.getByRole('button', { name: 'Hazırım, dinleyelim' }).click();
}
async function listen(page: Page) {
  const p = await progress(page), lesson = lessons.find(l => l.id === p.session!.lessonId)!;
  const player = page.locator('.exercise .audio-player');
  if (usesPair(lesson.skill)) {
    await player.locator('.ab-button').nth(0).click();
    await expect(player.locator('.ab-button').nth(0)).toContainText('✓ Dinlendi',{timeout:12_000});
    if (!usesLoop(lesson.skill)) await expect(player.getByRole('button', { name: 'Dinle', exact: true })).toBeVisible({ timeout: 10_000 });
    await player.locator('.ab-button').nth(1).click();
  } else await player.getByRole('button', { name: 'Dinle', exact: true }).click();
  await expect(page.locator('.answer-option').first()).toBeEnabled({ timeout: 10_000 });
}
async function recordAudio(page: Page) {
  await page.addInitScript(() => {
    const evidence: { when: number; rms: number; peak: number; loop: boolean; signature: number; rhythmSlots: number[] }[] = [];
    (window as unknown as { audioEvidence: typeof evidence }).audioEvidence = evidence;
    const original = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(when = 0, offset = 0, duration?: number) {
      if (this.buffer) {
        const data = this.buffer.getChannelData(0);
        let squares = 0, peak = 0, signature = 0;
        for (const [i, value] of data.entries()) { squares += value * value; peak = Math.max(peak, Math.abs(value)); if (i < 4000) signature += value * Math.sin(i * 0.71); }
        const rhythmSlots: number[] = [];
        if (!this.loop && Math.abs(this.buffer.duration - 5) < 0.001) {
          for (let slot = 0; slot < 16; slot++) {
            const start = Math.round((2.4 + slot * 0.15) * this.buffer.sampleRate);
            const window = data.slice(start, start + Math.round(0.065 * this.buffer.sampleRate));
            const energy = window.reduce((sum, value) => sum + value * value, 0) / window.length;
            if (Math.sqrt(energy) > 0.035) rhythmSlots.push(slot);
          }
        }
        evidence.push({ when, rms: Math.sqrt(squares / data.length), peak, loop: this.loop, signature, rhythmSlots });
      }
      if (duration === undefined) return original.call(this, when, offset);
      return original.call(this, when, offset, duration);
    };
  });
}
function backupFixture(id: string, finish = false) {
  let p: Progress = { ...initialProgress(), session: { id, lessonId: 'eq-1', seed: 123, index: 0, started: true, answers: [], source: 'keys' } };
  for (let i = 0; i < (finish ? 5 : 1); i++) {
    p = answerQuestion(p, makeQuestion('eq-1', 123, i).correct, `2026-10-08T20:00:0${i}.000Z`);
    if (finish) p = advanceQuestion(p, '2026-10-08T20:01:00.000Z');
  }
  return p;
}
const uploadBackup = (page: Page, data: unknown) => page.locator('input[type="file"]').setInputFiles({ name: 'freq-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });

async function openProfile(page: Page) {
  await page.locator('.sidebar').getByRole('button', { name: 'Profil', exact: true }).click();
}

test('completes a five-question EQ practice and resumes without double scoring', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pratiğe başla', exact: true }).click();
  await expect(page.getByText('Önce örnek dinle', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hazırım, dinleyelim' }).click();
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.answer-option').first()).toBeDisabled();
    await listen(page);
    const p = await progress(page), s = p.session!;
    const q = makeQuestion(s.lessonId, s.seed, s.index);
    await page.getByTestId(`answer-${q.correct}`).click();
    await expect(page.getByText('Evet, duydun.', { exact: true })).toBeVisible();
    if (i === 0) {
      await page.reload();
      await expect(page.getByText('Evet, duydun.', { exact: true })).toBeVisible();
      expect((await progress(page)).attempts).toHaveLength(1);
    }
    await page.getByRole('button', { name: i === 4 ? 'Pratiği bitir' : 'Sonraki soru', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Bugün kulağına zaman ayırdın.' })).toBeVisible();
  const p = await progress(page);
  expect(p.session).toBeNull(); expect(p.results).toHaveLength(1); expect(p.attempts).toHaveLength(5);
  expect(p.results[0].correct).toBe(5);
});

for (const lesson of lessons.filter(l => !isMusicianship(l.skill) || ['tonic', 'degree', 'function'].includes(l.skill))) {
  test(`${lesson.id}: real audio, incorrect feedback and safe replay`, async ({ page }) => {
    await chooseLesson(page, lesson.id);
    await listen(page);
    const p = await progress(page), s = p.session!;
    const q = makeQuestion(s.lessonId, s.seed, 0);
    const wrong = q.options.find(o => o.id !== q.correct)!;
    await page.getByTestId(`answer-${wrong.id}`).click();
    await expect(page.getByText('Birlikte tekrar dinleyelim.', { exact: true })).toBeVisible();
    await expect(page.getByTestId(`answer-${q.correct}`)).toHaveClass(/is-correct/);
    expect((await progress(page)).attempts[0].correct).toBe(false);
    await page.locator('.exercise .audio-player').getByRole('button', { name: 'Dinle', exact: true }).click();
    await expect(page.locator('.exercise .audio-player')).toHaveClass(/is-playing/);
    expect((await progress(page)).attempts).toHaveLength(1);
  });
}

test('actual EQ buffers are level matched, unclipped and start at the same audio-clock time', async ({ page }) => {
  await recordAudio(page);
  await chooseLesson(page, 'eq-3');
  await listen(page);
  const evidence = await page.evaluate(() => (window as unknown as { audioEvidence: { when: number; rms: number; peak: number; loop: boolean }[] }).audioEvidence.filter(x => x.loop).slice(-2));
  expect(evidence).toHaveLength(2);
  expect(evidence[0].rms).toBeGreaterThan(0.01);
  expect(Math.abs(20 * Math.log10(evidence[0].rms / evidence[1].rms))).toBeLessThan(0.001);
  expect(evidence[0].when).toBe(evidence[1].when);
  expect(Math.max(...evidence.map(e => e.peak))).toBeLessThanOrEqual(0.720001);
});

for (const level of [1, 2, 3]) {
  test(`loudness-${level}: real buffers preserve the deliberate dB difference and align`, async ({ page }) => {
    await recordAudio(page);
    const lessonId = `loudness-${level}`, expectedDb = [6, -3, 1][level - 1];
    let seed = 0;
    while (makeQuestion(lessonId, seed, 0).levelDb !== expectedDb) seed++;
    const p: Progress = { ...initialProgress(), session: { id: `level-${level}`, lessonId, seed, index: 0, started: true, answers: [], source: 'drums' } };
    await page.addInitScript(({ key, p }) => localStorage.setItem(key, JSON.stringify(p)), { key: STORAGE_KEY, p });
    await page.goto('/'); await listen(page);
    const evidence = await page.evaluate(() => (window as unknown as { audioEvidence: { when: number; rms: number; peak: number; loop: boolean }[] }).audioEvidence.filter(x => x.loop).slice(-2));
    expect(evidence).toHaveLength(2);
    expect(20 * Math.log10(evidence[1].rms / evidence[0].rms)).toBeCloseTo(expectedDb, 4);
    expect(evidence[0].when).toBe(evidence[1].when);
    expect(Math.max(...evidence.map(e => e.peak))).toBeLessThanOrEqual(0.720001);
    await expect(page.locator('.level-feedback')).toHaveCount(0);
    await page.getByTestId(`answer-${makeQuestion(lessonId, seed, 0).correct}`).click();
    await expect(page.locator('.level-feedback')).toContainText(`${expectedDb > 0 ? '+' : ''}${expectedDb} dB`);
    expect((await progress(page)).attempts[0].source).toBe('drums');
    if (level === 3) {
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(v => v.id)).toEqual([]);
      await page.screenshot({ path: 'test-results/previews/loudness-mobile.png', fullPage: true });
    }
  });
}

test('rhythm requires both complete samples, cancels interrupted listening and keeps the answer on reload', async ({ page }) => {
  await recordAudio(page);
  await chooseLesson(page, 'rhythm-3');
  const player = page.locator('.exercise .audio-player');
  await expect(page.locator('.rhythm-feedback')).toHaveCount(0);
  await player.locator('.ab-button').nth(0).click();
  await expect(player).toHaveClass(/is-playing/);
  // Switching immediately interrupts A; finishing B must not count A as heard.
  await player.locator('.ab-button').nth(1).click();
  await expect(player.getByRole('button', { name: 'Dinle', exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.answer-option').first()).toBeDisabled();
  await player.locator('.ab-button').nth(0).click();
  await expect(page.locator('.answer-option').first()).toBeEnabled({ timeout: 10_000 });
  const before = (await progress(page)).session!, q = makeQuestion(before.lessonId, before.seed, 0);
  const rendered = await page.evaluate(() => (window as unknown as { audioEvidence: { rhythmSlots: number[] }[] }).audioEvidence.filter(e => e.rhythmSlots.length));
  expect(rendered.map(e => e.rhythmSlots)).toEqual([q.rhythmA, q.rhythmB, q.rhythmA]);
  await page.getByTestId(`answer-${q.correct}`).click();
  await expect(page.locator('.rhythm-feedback [role="img"]')).toHaveCount(2);
  await page.locator('.topbar').getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Are the two rhythm patterns the same?' })).toBeVisible();
  const saved = (await progress(page)).session;
  await page.reload();
  expect((await progress(page)).session).toEqual(saved);
  expect((await progress(page)).attempts).toHaveLength(1);
  await expect(page.locator('.rhythm-feedback')).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(v => v.id)).toEqual([]);
  await page.screenshot({ path: 'test-results/previews/rhythm-mobile.png', fullPage: true });
});

test('learning paths group each three-level section and show accurate counts on mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.path-card').first()).toContainText('27 pratik · 6 bölüm');
  await page.locator('.path-card').first().click();
  await expect(page.locator('.lesson-section')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'EQ ve frekans', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ses yüksekliği', exact: true })).toBeVisible();
  await expect(page.locator('.lesson-row')).toHaveCount(27);
  await expect(page.locator('.lesson-section[open] .lesson-row')).toHaveCount(6);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(v => v.id)).toEqual([]);
  await page.screenshot({ path: 'test-results/previews/mixing-path-mobile.png', fullPage: true });
});

for (const source of eqSourceIds) {
  test(`${source}: source selection persists and real EQ buffers remain level matched`, async ({ page }) => {
    await recordAudio(page); await page.goto('/');
    await page.getByRole('button', { name: 'Pratiğe başla', exact: true }).click();
    await page.getByRole('radio', { name: new RegExp(eqSources[source].title.tr) }).check();
    const initial = (await progress(page)).session!;
    await page.reload();
    await expect(page.getByRole('radio', { name: new RegExp(eqSources[source].title.tr) })).toBeChecked();
    expect((await progress(page)).session!.seed).toBe(initial.seed);
    if (source === 'keys') {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: 'test-results/previews/source-picker-mobile.png', fullPage: true });
      const overflow = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('main *')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 1).map(el => ({ tag: el.tagName, class: el.className, right: Math.round(el.getBoundingClientRect().right) })).slice(0, 10));
      expect(overflow).toEqual([]);
      await page.setViewportSize({ width: 1280, height: 720 });
    }
    await page.getByRole('button', { name: 'Hazırım, dinleyelim' }).click();
    await expect(page.getByText(eqSources[source].title.tr, { exact: true })).toBeVisible();
    await listen(page);
    const evidence = await page.evaluate(() => (window as unknown as { audioEvidence: { when: number; rms: number; peak: number; loop: boolean }[] }).audioEvidence.filter(x => x.loop).slice(-2));
    expect(evidence).toHaveLength(2);
    expect(Math.abs(20 * Math.log10(evidence[0].rms / evidence[1].rms))).toBeLessThan(0.001);
    expect(Math.max(...evidence.map(e => e.peak))).toBeLessThanOrEqual(0.720001);
    const q = makeQuestion(initial.lessonId, initial.seed, initial.index);
    await page.getByTestId(`answer-${q.correct}`).click();
    expect((await progress(page)).attempts[0].source).toBe(source);
  });
}

test('wrong EQ answer opens three synchronized level-matched comparisons with no extra scoring', async ({ page }) => {
  await recordAudio(page); await chooseLesson(page, 'eq-3'); await listen(page);
  const s = (await progress(page)).session!, q = makeQuestion(s.lessonId, s.seed, s.index);
  const wrong = q.options.find(o => o.id !== q.correct)!;
  await page.getByTestId(`answer-${wrong.id}`).click();
  const player = page.locator('.exercise .audio-player');
  await expect(player.locator('.ab-button')).toHaveCount(3);
  await expect(player.getByRole('button', { name: /Seçtiğin EQ/ })).toContainText(wrong.id === '100' ? '100 Hz' : wrong.label.tr);
  await player.getByRole('button', { name: /Seçtiğin EQ/ }).click();
  await expect(player).toHaveClass(/is-playing/);
  const evidence = await page.evaluate(() => (window as unknown as { audioEvidence: { when: number; rms: number; peak: number; loop: boolean; signature: number }[] }).audioEvidence.filter(x => x.loop).slice(-3));
  expect(evidence).toHaveLength(3);
  expect(new Set(evidence.map(e => e.when)).size).toBe(1);
  expect(new Set(evidence.map(e => e.signature)).size).toBe(3);
  for (const e of evidence) { expect(Math.abs(20 * Math.log10(evidence[0].rms / e.rms))).toBeLessThan(0.001); expect(e.peak).toBeLessThanOrEqual(0.720001); }
  await page.locator('main').focus(); await page.keyboard.press('b');
  await expect(player.getByRole('button', { name: /Doğru EQ/ })).toHaveAttribute('aria-pressed', 'true');
  expect((await progress(page)).attempts).toHaveLength(1);
  await page.reload();
  await expect(page.getByRole('button', { name: /Seçtiğin EQ/ })).toBeVisible();
  expect((await progress(page)).attempts).toHaveLength(1);
});

test('restore merges records, survives reload, and does not count duplicate backups twice', async ({ page }) => {
  const original = backupFixture('here', true), incoming = backupFixture('there', true);
  await page.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, { key: STORAGE_KEY, value: JSON.stringify(original) });
  await page.goto('/'); await openProfile(page);
  await uploadBackup(page, createBackup(incoming));
  await expect(page.getByRole('dialog')).toBeVisible();
  expect((await progress(page)).attempts).toHaveLength(5);
  await page.getByRole('button', { name: 'Birleştir ve yükle' }).click();
  await expect(page.getByText('Yedek birleştirildi. Aynı kayıtlar tekrar sayılmadı.', { exact: true })).toBeVisible();
  expect((await progress(page)).attempts).toHaveLength(10);
  await uploadBackup(page, createBackup(incoming)); await page.getByRole('button', { name: 'Birleştir ve yükle' }).click();
  expect((await progress(page)).attempts).toHaveLength(10); expect((await progress(page)).results).toHaveLength(2);
  await page.reload(); await openProfile(page);
  expect((await progress(page)).attempts).toHaveLength(10);
  expect((await progress(page)).results).toHaveLength(2);
});

test('legacy backup restores an unfinished session and cancellation keeps current records', async ({ page }) => {
  await page.goto('/'); await openProfile(page);
  const legacy = backupFixture('restored'); delete legacy.session!.source; delete legacy.attempts[0].source; delete legacy.eqSource;
  await uploadBackup(page, legacy); await page.getByRole('button', { name: 'Vazgeç', exact: true }).click();
  expect((await progress(page)).attempts).toHaveLength(0);
  await uploadBackup(page, legacy); await page.getByRole('button', { name: 'Birleştir ve yükle' }).click();
  await page.reload();
  await expect(page.getByText('Evet, duydun.', { exact: true })).toBeVisible();
  expect((await progress(page)).session!.id).toBe('restored');
});

test('invalid and conflicting backups keep records unchanged', async ({ page }) => {
  const original = backupFixture('here', true);
  await page.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, { key: STORAGE_KEY, value: JSON.stringify(original) });
  await page.goto('/'); await openProfile(page);
  await uploadBackup(page, {}); await expect(page.getByText(/geçerli bir Freq yedeği değil/)).toBeVisible();
  expect((await progress(page)).attempts).toHaveLength(5);
  const corrupt = structuredClone(original); corrupt.attempts[0].correct = false;
  await uploadBackup(page, createBackup(corrupt)); await expect(page.getByText(/geçerli bir Freq yedeği değil/)).toBeVisible();
  expect((await progress(page)).attempts).toEqual(original.attempts);
  // A valid file with the same record identity and different timestamp must
  // reach merge conflict handling, rather than fail answer integrity first.
  const conflict = structuredClone(original); conflict.attempts[0].at = '2026-10-08T20:00:00.001Z';
  await uploadBackup(page, createBackup(conflict)); await expect(page.getByText(/çelişen kayıtlar/)).toBeVisible();
  expect((await progress(page)).attempts).toEqual(original.attempts);
});

test('the downloaded backup restores exact records and a saved question through the actual file input', async ({ page }) => {
  await chooseLesson(page, 'eq-2'); await listen(page);
  const s = (await progress(page)).session!, q = makeQuestion(s.lessonId, s.seed, s.index);
  await page.getByTestId(`answer-${q.correct}`).click(); await openProfile(page);
  const before = await progress(page);
  const downloadReady = page.waitForEvent('download');
  await page.getByRole('button', { name: 'İlerlemeyi indir', exact: true }).click();
  const download = await downloadReady;
  const raw = await readFile((await download.path())!, 'utf8');
  expect(JSON.parse(raw)).toMatchObject({ format: 'freq-backup', schemaVersion: 2, progress: before });
  await page.getByRole('button', { name: 'İlerlemeyi sıfırla', exact: true }).click();
  await page.getByRole('button', { name: 'Evet, sil', exact: true }).click();
  expect((await progress(page)).attempts).toHaveLength(0);
  await openProfile(page); await uploadBackup(page, JSON.parse(raw));
  await page.getByRole('button', { name: 'Birleştir ve yükle' }).click();
  expect((await progress(page)).attempts).toEqual(before.attempts);
  expect((await progress(page)).session).toEqual(before.session);
  await page.reload(); await expect(page.getByText('Evet, duydun.', { exact: true })).toBeVisible();
});

test('unsupported and oversized backup files give actionable errors without changing progress', async ({ page }) => {
  await page.goto('/'); await openProfile(page);
  const before = await progress(page);
  await uploadBackup(page, { format: 'freq-backup', schemaVersion: 3 });
  await expect(page.getByText(/daha yeni bir Freq sürümüyle/)).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({ name: 'large.json', mimeType: 'application/json', buffer: Buffer.alloc(MAX_BACKUP_BYTES + 1) });
  await expect(page.getByText(/Yedek dosyası çok büyük/)).toBeVisible();
  expect(await progress(page)).toEqual(before);
});

test('restore dialog and comparison pass accessibility checks at mobile width', async ({ page }) => {
  await chooseLesson(page, 'eq-1'); await listen(page);
  const s = (await progress(page)).session!, q = makeQuestion(s.lessonId, s.seed, s.index);
  await page.getByTestId(`answer-${q.options.find(o => o.id !== q.correct)!.id}`).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const audit = async () => expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(v => v.id)).toEqual([]);
  await audit(); await page.screenshot({ path: 'test-results/previews/comparison-mobile.png', fullPage: true });
  await page.locator('.mobile-nav').getByRole('button', { name: 'Profil', exact: true }).click();
  await uploadBackup(page, createBackup(backupFixture('restore-preview', true))); await audit();
  await expect(page.locator('.workspace')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('language switch preserves the active question and records', async ({ page }) => {
  await chooseLesson(page, 'interval-2');
  const before = (await progress(page)).session;
  await page.locator('.topbar').getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What is the interval between the notes?' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect((await progress(page)).session).toEqual(before);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'What is the interval between the notes?' })).toBeVisible();
});

test('storage denial still permits practice and gives clear feedback', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('blocked', 'QuotaExceededError'); }; });
  await page.goto('/');
  await expect(page.getByText(/Tarayıcı kayıt yapamıyor/)).toBeVisible();
  await page.getByRole('button', { name: 'Pratiğe başla', exact: true }).click();
  await page.getByRole('button', { name: 'Hazırım, dinleyelim' }).click();
  await page.locator('.ab-button').nth(0).click(); await expect(page.locator('.ab-button').nth(0)).toContainText('✓ Dinlendi'); await page.locator('.ab-button').nth(1).click();
  await expect(page.locator('.answer-option').first()).toBeEnabled();
  await page.locator('.answer-option').first().click();
  await expect(page.locator('.feedback')).toBeVisible();
});

test('malformed saved data recovers to a usable app', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{"version":1,"locale":"en","session":{"lessonId":"nope"},"attempts":[null]}'), STORAGE_KEY);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A better mix starts with better listening.' })).toBeVisible();
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Frequency regions', exact: true })).toBeVisible();
});

test('production app and audio work offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Pratiğe başla', exact: true }).click();
  await page.getByRole('button', { name: 'Hazırım, dinleyelim' }).click();
  await listen(page);
  await expect(page.locator('.audio-player')).toHaveClass(/is-playing/);
  await context.setOffline(false);
});

test('keyboard answers and mobile layout remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await page.screenshot({ path: 'test-results/previews/home-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Pratiğe başla', exact: true }).click();
  await page.getByRole('button', { name: 'Hazırım, dinleyelim' }).click();
  await page.locator('main').focus(); await page.keyboard.press('a'); await expect(page.locator('.exercise .ab-button').nth(0)).toContainText('✓ Dinlendi'); await page.locator('main').focus(); await page.keyboard.press('b');
  await expect(page.locator('.answer-option').first()).toBeEnabled();
  await page.locator('main').focus(); await page.keyboard.press('1');
  await expect(page.locator('.feedback')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/previews/practice-mobile.png', fullPage: true });
});

test('desktop home renders without errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'İyi bir miks, iyi bir dinlemeyle başlar.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/previews/home-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('subdirectory build installs and works offline', async ({ page, context }) => {
  await page.goto('/freq/');
  await expect(page.getByRole('heading', { name: 'İyi bir miks, iyi bir dinlemeyle başlar.' })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/freq/sw.js'))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Pratiğe başla', exact: true }).click();
  await page.getByRole('button', { name: 'Hazırım, dinleyelim' }).click();
  await listen(page);
  await expect(page.locator('.audio-player')).toHaveClass(/is-playing/);
});

test('core screens pass automated accessibility checks', async ({ page }) => {
  const audit = async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  };
  await page.goto('/'); await audit();
  await page.getByRole('button', { name: 'Pratiğe başla', exact: true }).click(); await audit();
  await page.getByRole('button', { name: 'Hazırım, dinleyelim' }).click(); await audit();
  await listen(page); await page.locator('.answer-option').first().click(); await audit();
  await page.locator('.sidebar').getByRole('button', { name: 'Profil', exact: true }).click(); await audit();
});
