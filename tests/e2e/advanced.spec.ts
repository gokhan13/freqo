import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { eqSources } from '../../src/content';
import { makeQuestion, STORAGE_KEY, type Progress } from '../../src/model';
import { encodeWav } from '../../src/wav';

const progress = (page: Page): Promise<Progress> => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
async function openMix(page: Page) {
  await page.goto('/');
  const nav = page.locator(await page.locator('.sidebar').isVisible() ? '.sidebar' : '.mobile-nav');
  await nav.getByRole('button', { name: 'Yollar', exact: true }).click();
  await page.locator('.full-path').first().getByRole('button', { name: 'Yolu keşfet' }).click();
}
async function openLab(page: Page) { await openMix(page); await page.getByRole('button', { name: 'Laboratuvarı aç' }).click(); }
async function openLesson(page: Page, lessonId: string) {
  await openMix(page);
  const row = page.getByTestId(`lesson-${lessonId}`), section = row.locator('xpath=ancestor::details');
  if (!(await section.evaluate(el => (el as HTMLDetailsElement).open))) await section.locator('summary').click();
  await row.getByRole('button', { name: 'Pratiğe başla', exact: true }).click();
}
async function begin(page: Page) {
  const check = page.locator('.stereo-check input'); if (await check.count()) await check.check();
  await page.getByRole('button', { name: 'Hazırım, dinleyelim' }).click();
}
async function listen(page: Page) {
  const player = page.locator('.exercise .audio-player');
  await player.locator('.ab-button').nth(0).click();
  await expect(player).toHaveClass(/is-playing/);
  await expect(player.locator('.ab-button').nth(0)).toContainText('✓ Dinlendi');
  await player.locator('.ab-button').nth(1).click();
  await expect(page.locator('.answer-option').first()).toBeEnabled();
}
type Evidence = { when: number; channels: number; duration: number; rms: number; monoRms: number; peak: number; signature: number; left: number; right: number; loop: boolean };
async function capture(page: Page) {
  await page.addInitScript(() => {
    const evidence: Evidence[] = [];
    (window as unknown as { mixEvidence: Evidence[] }).mixEvidence = evidence;
    const original = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(when = 0, offset = 0, duration?: number) {
      const buffer = this.buffer;
      if (buffer) {
        let squares = 0, monoSquares = 0, peak = 0, signature = 0, left = 0, right = 0;
        for (let i = 0; i < buffer.length; i++) {
          const l = buffer.getChannelData(0)[i], r = buffer.getChannelData(buffer.numberOfChannels - 1)[i];
          left += l * l; right += r * r; squares += l * l + r * r; monoSquares += ((l + r) / 2) ** 2;
          peak = Math.max(peak, Math.abs(l), Math.abs(r));
          if (i < 12000) signature += l * Math.sin(i * 0.07) + r * Math.cos(i * 0.11);
        }
        evidence.push({ when, channels: buffer.numberOfChannels, duration: buffer.duration, rms: Math.sqrt(squares / (buffer.length * 2)), monoRms: Math.sqrt(monoSquares / buffer.length), peak, signature, left, right, loop: this.loop });
      }
      if (duration === undefined) return original.call(this, when, offset);
      return original.call(this, when, offset, duration);
    };
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(this: AudioNode, destination: AudioNode | AudioParam, ...args: number[]) {
      if (this instanceof GainNode && destination instanceof AudioDestinationNode) (window as unknown as { mixMaster: GainNode }).mixMaster = this;
      return (connect as (...args: unknown[]) => AudioNode).call(this, destination, ...args);
    } as typeof connect;
  });
}
const evidence = (page: Page): Promise<Evidence[]> => page.evaluate(() => (window as unknown as { mixEvidence: Evidence[] }).mixEvidence);
function fixture(name = 'my-private-recording.wav', stereo = true) {
  const rate = 22050, length = rate * 10;
  const left = Float32Array.from({ length }, (_, i) => {
    const t = i / rate, phase = t % 0.5;
    return (Math.sin(2 * Math.PI * 440 * t) * 0.35 + Math.sin(2 * Math.PI * 160 * t) * 0.12) * (0.08 + Math.exp(-phase * 15)) * (Math.floor(t * 2) % 2 ? 0.6 : 1);
  });
  const right = Float32Array.from(left, (v, i) => v * 0.8 + 0.08 * Math.sin(2 * Math.PI * 650 * i / rate));
  return { name, mimeType: 'audio/wav', buffer: Buffer.from(encodeWav(stereo ? [left, right] : [left], rate)) };
}

for (const lessonId of ['compression-2', 'attack-3', 'release-3', 'masking-3', 'stereo-2', 'reverb-3', 'delay-3']) {
  test(`${lessonId}: recorded A/B/C share timing, joint level and headroom; choices stay hidden before answering`, async ({ page }) => {
    await capture(page); await openLesson(page, lessonId);
    await page.getByRole('radio', { name: new RegExp(eqSources.acoustic.title.tr) }).check();
    await expect(page.locator('.known-examples button')).toHaveCount(makeQuestion(lessonId, 2026, 0).options.length);
    await page.locator('.known-examples button').first().click();
    await page.locator('.guided-example .ab-button').nth(1).click();
    await expect(page.locator('.guided-example .signal-scope')).toBeVisible();
    await begin(page);
    await expect(page.locator('.exercise .mix-feedback')).toHaveCount(0);
    const s = (await progress(page)).session!, q = makeQuestion(lessonId, s.seed, s.index, s.source);
    await expect(page.locator('.exercise h1')).toHaveText(q.mix!.prompt.tr);
    await listen(page);
    await page.getByTestId(`answer-${q.options.find(o => o.id !== q.correct)!.id}`).click();
    await expect(page.locator('.exercise .ab-button')).toHaveCount(3);
    await page.locator('.exercise .ab-button').nth(2).click();
    await expect(page.locator('.exercise .signal-scope')).toBeVisible();
    const buffers = (await evidence(page)).filter(e => e.loop).slice(-3);
    expect(new Set(buffers.map(e => e.when)).size).toBe(1);
    expect(Math.abs(buffers[1].signature - buffers[2].signature)).toBeGreaterThan(0.0001);
    for (const buffer of buffers) {
      expect(buffer.channels).toBe(2); expect(buffer.peak).toBeLessThanOrEqual(0.720001);
      expect(Math.abs(20 * Math.log10(buffer.rms / buffers[0].rms))).toBeLessThan(0.001);
    }
    expect((await progress(page)).attempts).toHaveLength(1);
    expect((await progress(page)).attempts[0].source).toBe('acoustic');
    await page.locator('.topbar').getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('.exercise h1')).toHaveText(q.mix!.prompt.en);
    await page.reload();
    await expect(page.locator('.exercise .ab-button')).toHaveCount(3);
    expect((await progress(page)).attempts).toHaveLength(1);
  });
}

test('stereo setup reaches left/right channels and mono uses actual speaker downmix', async ({ page }) => {
  await capture(page); await openLesson(page, 'stereo-3');
  await expect(page.getByRole('button', { name: 'Hazırım, dinleyelim' })).toBeDisabled();
  await page.getByRole('button', { name: 'Sol kanalı dinle' }).click();
  await expect.poll(async () => (await evidence(page)).length).toBe(2);
  let last = (await evidence(page)).at(-1)!; expect(last.left).toBeGreaterThan(1); expect(last.right).toBeLessThan(1e-9);
  await page.getByRole('button', { name: 'Sağ kanalı dinle' }).click();
  await expect.poll(async () => (await evidence(page)).length).toBe(4);
  last = (await evidence(page)).at(-1)!; expect(last.right).toBeGreaterThan(1); expect(last.left).toBeLessThan(1e-9);
  await page.getByRole('checkbox', { name: /Stereo kulaklıkla/ }).check();
  await expect(page.getByRole('button', { name: 'Hazırım, dinleyelim' })).toBeEnabled();
  await page.locator('.known-examples button').filter({ hasText: 'Mono’da iptal oluyor' }).click();
  await page.locator('.guided-example .ab-button').nth(1).click();
  await expect.poll(async () => (await evidence(page)).length).toBe(6);
  last = (await evidence(page)).at(-1)!; expect(last.monoRms).toBe(0); expect(last.rms).toBeGreaterThan(0.01);
  await page.locator('.guided-example').getByRole('button', { name: 'Mono', exact: true }).click();
  expect(await page.evaluate(() => { const m = (window as unknown as { mixMaster: GainNode }).mixMaster; return [m.channelCount, m.channelCountMode, m.channelInterpretation]; })).toEqual([1, 'explicit', 'speakers']);
  await begin(page);
  await listen(page);
  expect(await page.evaluate(() => (window as unknown as { mixMaster: GainNode }).mixMaster.channelCount)).toBe(2);
});

test('masking has a finite solo target and returns to aligned A/B without scoring solo as both', async ({ page }) => {
  await capture(page); await openLesson(page, 'masking-1'); await begin(page);
  await page.getByRole('button', { name: 'Melodiyi tek dinle' }).click();
  await expect.poll(async () => (await evidence(page)).length).toBe(1);
  expect((await evidence(page))[0].loop).toBe(false);
  await expect(page.locator('.answer-option').first()).toBeDisabled();
  await listen(page);
  const buffers = (await evidence(page)).slice(-2); expect(new Set(buffers.map(b => b.when)).size).toBe(1);
});

test('your stereo file stays local, renders an eight-second WAV and leaves progress untouched', async ({ page }) => {
  const requests: string[] = []; page.on('request', request => requests.push(request.url()));
  await capture(page); await openLab(page);
  const before = await progress(page);
  await page.locator('.lab-source input[type=file]').first().setInputFiles(fixture());
  await expect(page.locator('.file-details')).toContainText('my-private-recording.wav · 8.0 s · Stereo');
  await page.locator('.lab-listening .ab-button').nth(1).click();
  await expect(page.locator('.lab-listening .signal-scope')).toBeVisible();
  const buffers = (await evidence(page)).slice(-2);
  expect(buffers.every(b => b.duration === 8 && b.channels === 2)).toBe(true);
  expect(Math.abs(20 * Math.log10(buffers[0].rms / buffers[1].rms))).toBeLessThan(0.001);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'İşlenmiş örneği indir' }).click();
  const download = await downloading, bytes = await readFile((await download.path())!);
  expect(download.suggestedFilename()).toBe('freq-compression-preview.wav');
  expect(bytes.toString('ascii', 0, 4)).toBe('RIFF'); expect(bytes.readUInt16LE(22)).toBe(2);
  expect(bytes.readUInt32LE(40) / 4 / bytes.readUInt32LE(24)).toBe(8);
  expect(await progress(page)).toEqual(before); expect(JSON.stringify(await progress(page))).not.toContain('my-private');
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  await page.getByRole('combobox').selectOption('reverb');
  const tailReady = page.waitForEvent('download'); await page.getByRole('button', { name: 'İşlenmiş örneği indir' }).click();
  const tailBytes = await readFile((await (await tailReady).path())!);
  expect(tailBytes.readUInt32LE(40) / 4 / tailBytes.readUInt32LE(24)).toBe(12);
  await page.reload(); await openLab(page); await expect(page.locator('.file-details')).toHaveCount(0);
});

test('own masking requires a separate backing, preserves solo and rejects bad files without losing the source', async ({ page }) => {
  await capture(page); await openLab(page);
  await page.locator('.lab-source input[type=file]').first().setInputFiles(fixture('target.wav', true));
  await expect(page.locator('.file-details')).toContainText('target.wav');
  await page.getByRole('combobox').selectOption('masking');
  await expect(page.locator('.lab-listening .audio-player')).toHaveCount(0);
  await page.locator('.lab-source input[type=file]').nth(1).setInputFiles(fixture('backing.wav', true));
  await expect(page.locator('.lab-listening .audio-player')).toBeVisible();
  await page.getByRole('button', { name: 'Melodiyi tek dinle' }).click();
  await expect.poll(async () => (await evidence(page)).length).toBe(1);
  const soloBefore = (await evidence(page))[0];
  const cut = page.getByRole('slider', { name: 'Eşlikte kesme' });
  await cut.focus(); await cut.press('Home');
  for (let i = 0; i < 3; i++) await cut.press('ArrowRight');
  await page.getByRole('button', { name: 'Melodiyi tek dinle' }).click();
  await expect.poll(async () => (await evidence(page)).length).toBe(2);
  const soloAfter = (await evidence(page))[1];
  // A shared headroom trim may change gain; the target waveform shape remains identical.
  expect(soloBefore.signature / soloBefore.rms).toBeCloseTo(soloAfter.signature / soloAfter.rms, 4);
  await page.locator('.lab-source input[type=file]').first().setInputFiles({ name: 'broken.wav', mimeType: 'audio/wav', buffer: Buffer.from('invalid') });
  await expect(page.getByRole('alert')).toContainText('Mevcut kaynak korunuyor');
  await expect(page.locator('.file-details')).toContainText('target.wav');
  await expect(page.locator('.lab-listening .audio-player')).toBeVisible();
  await page.locator('.lab-source input[type=file]').first().setInputFiles({ name: 'too-big.wav', mimeType: 'audio/wav', buffer: Buffer.alloc(20 * 1024 * 1024 + 1) });
  await expect(page.getByRole('alert')).toBeVisible(); await expect(page.locator('.file-details')).toContainText('target.wav');
  expect((await progress(page)).attempts).toHaveLength(0);
});

test('advanced groups, feedback and lab fit narrow mobile screens and pass automated accessibility', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await openMix(page);
  await expect(page.locator('.lesson-section')).toHaveCount(6);
  await expect(page.locator('.lesson-section[open]')).toHaveCount(2);
  const audit = async () => expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  await audit(); await page.screenshot({ path: 'test-results/previews/advanced-path-mobile.png', fullPage: true });
  await openLesson(page, 'attack-3'); await audit(); await begin(page); await listen(page);
  const s = (await progress(page)).session!, q = makeQuestion(s.lessonId, s.seed, s.index);
  await page.getByTestId(`answer-${q.options.find(o => o.id !== q.correct)!.id}`).click();
  await audit(); await page.screenshot({ path: 'test-results/previews/advanced-feedback-mobile.png', fullPage: true });
  await openLab(page); await page.locator('.lab-listening .ab-button').nth(1).click(); await audit();
  await page.screenshot({ path: 'test-results/previews/mix-lab-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await audit();
  await page.getByRole('combobox').selectOption('delay'); await audit();
  await page.locator('.topbar').getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Work with your recording.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('bundled recordings, advanced lessons and lab work offline from a subdirectory', async ({ page, context }) => {
  await capture(page); await page.goto('/freq/'); await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true); await page.reload();
  await page.locator('.sidebar').getByRole('button', { name: 'Yollar', exact: true }).click();
  await page.locator('.full-path').first().getByRole('button', { name: 'Yolu keşfet' }).click();
  await page.getByRole('button', { name: 'Laboratuvarı aç' }).click();
  await page.locator('.lab-listening .ab-button').nth(1).click();
  await expect(page.locator('.lab-listening .audio-player')).toHaveClass(/is-playing/);
  await page.getByRole('button', { name: 'Miks yoluna dön' }).click();
  const row = page.getByTestId('lesson-reverb-2'); await row.locator('xpath=ancestor::details').locator('summary').click();
  await row.getByRole('button', { name: 'Pratiğe başla' }).click();
  await page.getByRole('radio', { name: new RegExp(eqSources.acoustic.title.tr) }).check(); await begin(page); await listen(page);
  await expect(page.locator('.exercise .audio-player')).toHaveClass(/is-playing/);
  await context.setOffline(false);
});
