import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress, makeQuestion, STORAGE_KEY, type Progress } from '../../src/model';
import { melodyChoice, readSequence, rhythmChoice } from '../../src/music-model';
async function saved(page: Page): Promise<Progress> { return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY); }
async function open(page: Page, lessonId: string, seed = 7) {
  const p: Progress = { ...initialProgress(), path: 'music', session: { id: `music-${lessonId}`, lessonId, seed, index: 0, started: true, answers: [] } };
  await page.addInitScript(({ key, p }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(p)); }, { key: STORAGE_KEY, p });
  await page.goto('/'); return makeQuestion(lessonId, seed, 0);
}
async function listen(page: Page) {
  const player = page.locator('.exercise .audio-player');
  await player.getByRole('button', { name: 'Dinle', exact: true }).click();
  await expect(player.getByRole('button', { name: 'Dinle', exact: true })).toBeVisible({ timeout: 10_000 });
}
async function fillMelody(page: Page, degrees: number[]) {
  for (const [i, degree] of degrees.entries()) { await page.getByTestId(`melody-slot-${i}`).click(); await page.getByTestId(`degree-${degree}`).click(); }
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); }
async function accessible(page: Page) { expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]); }
for (const level of [1, 2, 3]) {
  test(`melodic dictation level ${level}: editable entry, actual audio replay and saved wrong response`, async ({ page }) => {
    const q = await open(page, `melodic-dictation-${level}`), degrees = [...q.music!.degrees];
    await expect(page.getByTestId('submit-music')).toBeDisabled();
    await expect(page.locator('.degree-notation')).toHaveCount(0);
    await listen(page); degrees[0] = 3; await fillMelody(page, degrees);
    await page.getByRole('button', { name: 'Taslağını dinle' }).click(); await expect(page.locator('.audio-player')).toHaveClass(/is-playing/);
    await page.getByTestId('submit-music').click();
    await expect(page.locator('.feedback')).toContainText('Birlikte tekrar dinleyelim.');
    expect((await saved(page)).session?.answers[0].choice).toBe(melodyChoice(degrees));
    await expect(page.locator('.degree-notation .different')).toHaveCount(1);
    await page.getByRole('button', { name: 'Yanıtını dinle', exact: true }).click(); await expect(page.locator('.audio-player')).toHaveClass(/is-playing/);
    await page.reload(); await expect(page.locator('.feedback')).toBeVisible(); expect((await saved(page)).attempts).toHaveLength(1);
    await page.setViewportSize({ width: 320, height: 900 }); await noOverflow(page); await accessible(page);
    if (level === 3) await page.screenshot({ path: 'test-results/previews/music-melody-mobile.png', fullPage: true });
  });
  test(`rhythmic dictation level ${level}: beat grid, editing, preview, feedback and reload`, async ({ page }) => {
    const q = await open(page, `rhythmic-dictation-${level}`);
    await expect(page.getByTestId('submit-music')).toBeDisabled(); await listen(page);
    const slots = [...q.music!.slots].filter(slot => slot !== 0);
    await page.getByTestId('rhythm-slot-0').click(); await page.getByTestId('rhythm-slot-0').click();
    for (const slot of slots) await page.getByTestId(`rhythm-slot-${slot}`).click();
    await page.getByRole('button', { name: 'Taslağını dinle' }).click();
    await page.getByTestId('submit-music').click(); await expect(page.locator('.feedback')).toContainText('Yazdığın kalıp');
    expect((await saved(page)).session!.answers[0]).toMatchObject({ choice: rhythmChoice(slots), correct: false });
    await page.getByRole('button', { name: 'Yanıtını dinle', exact: true }).click(); await expect(page.locator('.audio-player')).toHaveClass(/is-playing/);
    await page.reload(); expect((await saved(page)).session!.answers[0].choice).toBe(rhythmChoice(slots));
    await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page); await accessible(page);
    if (level === 3) await page.screenshot({ path: 'test-results/previews/music-rhythm-mobile.png', fullPage: true });
  });
  test(`rhythm reproduction level ${level}: audio-clock pointer/Space timing, explicit submit and reload`, async ({ page }) => {
    const q = makeQuestion(`rhythm-repeat-${level}`, 7, 0), m = q.music!;
    await page.addInitScript(({ tempo, slots, subdivision }) => {
      const observation=window as typeof window & { freqTestTapRanges:number[][] };
      observation.freqTestTapRanges=[];
      const original = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function(when = 0, offset = 0, duration?: number) {
        if (this.buffer && this.buffer.duration > 9) {
          const ctx = this.context as AudioContext, target = when + 12 * 60 / tempo;
          const times = slots.map(slot => target + slot * 60 / tempo / subdivision + 0.08);
          let i = 0;
          const dispatch = () => {
            while (i < times.length && ctx.currentTime >= times[i]) {
              const pad = document.querySelector('[data-testid="tap-pad"]') as HTMLButtonElement;
              const before=Math.round((ctx.currentTime-target)*1000);
              if (i % 2 === 0) pad?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, isPrimary: true }));
              else { pad?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, code: 'Space', key: ' ' })); pad?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, code: 'Space', key: ' ', repeat: true })); pad?.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, code: 'Space', key: ' ' })); }
              observation.freqTestTapRanges.push([before,Math.round((ctx.currentTime-target)*1000)]);
              i++;
            }
            if (i < times.length) requestAnimationFrame(dispatch);
          };
          requestAnimationFrame(dispatch);
        }
        if (duration === undefined) return original.call(this, when, offset); return original.call(this, when, offset, duration);
      };
    }, { tempo: m.tempo, slots: m.slots, subdivision: m.subdivision });
    await open(page, `rhythm-repeat-${level}`); await listen(page);
    await page.getByTestId('start-tap').click(); await expect(page.locator('.audio-player .play-button')).toBeDisabled();
    await expect(page.locator('.tap-phase')).toContainText('Tekrar tamamlandı', { timeout: 15_000 });
    expect((await saved(page)).attempts).toHaveLength(0);
    await expect(page.getByTestId('submit-music')).toBeEnabled();
    await page.getByRole('button', { name: 'Tekrarını dinle', exact: true }).click();
    expect((await saved(page)).attempts).toHaveLength(0);
    const ranges=await page.evaluate(()=>(window as typeof window & {freqTestTapRanges:number[][]}).freqTestTapRanges);
    expect(ranges).toHaveLength(m.slots.length);
    await page.getByTestId('submit-music').click();
    const answer = (await saved(page)).session!.answers[0], taps = readSequence(answer.choice, 'tap')!;
    expect(taps).toHaveLength(m.slots.length); expect(taps[0]).toBeGreaterThanOrEqual(80);
    // Bracket the actual event handler with an independent read of the audio
    // clock. Focus and rendering may take time; no arbitrary latency is assumed.
    for(const [i,ms] of taps.entries()){expect(ms).toBeGreaterThanOrEqual(ranges[i][0]);expect(ms).toBeLessThanOrEqual(ranges[i][1]);}
    // Validate the actual input. RAF dispatch may run late on a loaded host;
    // an out-of-tolerance event must be scored as wrong rather than accepted.
    const offsets=taps.map((ms,i)=>ms-m.slots[i]*60000/m.tempo/m.subdivision),ordered=[...offsets].sort((a,b)=>a-b);
    const middle=Math.floor(ordered.length/2),median=ordered.length%2?ordered[middle]:(ordered[middle-1]+ordered[middle])/2;
    const offset=Math.max(-250,Math.min(250,median)),expectedCorrect=offsets.every(v=>Math.abs(v-offset)<=m.tolerance);
    expect(answer.correct).toBe(expectedCorrect);await expect(page.locator('.feedback')).toContainText(expectedCorrect?'Evet, duydun.':'Birlikte tekrar dinleyelim.');
    await expect(page.locator('.timing-table tbody tr')).toHaveCount(m.slots.length);
    await expect(page.getByRole('button', { name: 'Yanıtını dinle', exact: true })).toBeVisible();
    await page.reload(); expect((await saved(page)).session!.answers[0]).toEqual(answer); expect((await saved(page)).attempts).toHaveLength(1);
    await page.setViewportSize({ width: 320, height: 900 }); await noOverflow(page); await accessible(page);
    if (level === 3) await page.screenshot({ path: 'test-results/previews/music-tap-feedback-mobile.png', fullPage: true });
  });
}
test('interrupted reference, candidate audition and tonal-context playback cannot unlock the answer', async ({ page }) => {
  await open(page, 'tonic-2');
  await page.locator('.tonal-candidates button').first().click(); await expect(page.locator('.answer-option').first()).toBeDisabled();
  await page.getByRole('button', { name: 'Tonal bağlamı dinle' }).click();
  await expect(page.locator('.audio-player .play-button')).toContainText('Dinle', { timeout: 4000 });
  await expect(page.locator('.answer-option').first()).toBeDisabled();
  await page.locator('.audio-player .play-button').click(); await page.locator('.audio-player .play-button').click();
  await expect(page.locator('.answer-option').first()).toBeDisabled();
  await listen(page); await expect(page.locator('.answer-option').first()).toBeEnabled();
});
test('tap cancellation, visibility stop and retry do not create a partial score', async ({ page }) => {
  await open(page, 'rhythm-repeat-1'); await listen(page);
  await page.getByTestId('start-tap').click(); await page.getByRole('button', { name: 'Tekrarı durdur' }).click();
  await expect(page.locator('.tap-phase')).toContainText('puan'); expect((await saved(page)).attempts).toHaveLength(0);
  await page.getByTestId('start-tap').click();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.locator('.tap-phase')).toContainText('durduruldu'); await expect(page.getByTestId('submit-music')).toBeDisabled();
  await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: false }));
  await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page); await accessible(page);
});
test('music sections, labelled guidance, language and independent skill cards are discoverable', async ({ page }) => {
  await page.goto('/'); await page.locator('.sidebar').getByRole('button', { name: 'Yollar', exact: true }).click();
  await page.locator('.full-path').nth(1).getByRole('button', { name: 'Yolu keşfet' }).click();
  await expect(page.locator('.path-detail-meta')).toContainText('24 pratik · 6 bölüm'); await expect(page.locator('.lesson-row')).toHaveCount(24);
  await expect(page.locator('.lesson-section[open] .lesson-row')).toHaveCount(6);
  await page.screenshot({ path: 'test-results/previews/music-path-desktop.png', fullPage: true });
  const section = page.getByTestId('lesson-melodic-dictation-3').locator('xpath=ancestor::details'); await section.locator('summary').click();
  await page.getByTestId('lesson-melodic-dictation-3').getByRole('button', { name: 'Pratiğe başla' }).click();
  await expect(page.locator('.guided-example .degree-notation')).toBeVisible(); expect((await saved(page)).attempts).toHaveLength(0);
  await page.getByRole('button', { name: 'EN', exact: true }).click(); await expect(page.locator('.example-answer')).toContainText('Worked example');
  await page.getByRole('button', { name: 'Ready, let’s listen' }).click(); await expect(page.locator('h1')).toContainText('Write the melody');
  await page.locator('.sidebar').getByRole('button', { name: 'My skills' }).click(); await expect(page.locator('.skill-card')).toHaveCount(20);
  await expect(page.locator('.skill-card')).toContainText(['Melodic dictation', 'Rhythmic dictation', 'Rhythm reproduction']);
});
test('melodic dictation supports keyboard entry and completing a practice', async ({ page }) => {
  test.setTimeout(60_000); // Five complete cadence/count-in/melody examples take over 35 seconds.
  await open(page, 'melodic-dictation-1');
  for (let i = 0; i < 5; i++) {
    await listen(page); const s = (await saved(page)).session!, q = makeQuestion(s.lessonId, s.seed, s.index);
    for (const degree of q.music!.degrees) await page.keyboard.press(String(degree));
    await page.getByTestId('submit-music').click(); await expect(page.locator('.feedback')).toContainText('Evet, duydun.');
    await page.getByRole('button', { name: i === 4 ? 'Pratiği bitir' : 'Sonraki soru', exact: true }).click();
  }
  expect((await saved(page)).results[0].correct).toBe(5);
  await page.locator('.sidebar').getByRole('button', { name: 'Becerilerim' }).click();
  await page.locator('.history-options button').first().click();
  await expect(page.locator('.history-detail .degree-notation')).toBeVisible();
  await page.locator('.history-detail .play-button').click(); await expect(page.locator('.history-detail .audio-player')).toHaveClass(/is-playing/);
  expect((await saved(page)).attempts).toHaveLength(5);
  await page.reload(); expect((await saved(page)).attempts.filter(a => a.response)).toHaveLength(5);
});
for (const base of ['/', '/freq/']) {
  test(`musical dictation works offline at ${base}`, async ({ page, context }) => {
    const lessonId = base === '/' ? 'rhythmic-dictation-3' : 'melodic-dictation-3';
    const p: Progress = { ...initialProgress(), path: 'music', session: { id: `offline-${lessonId}`, lessonId, seed: 7, index: 0, started: true, answers: [] } };
    await page.goto(base); await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.evaluate(({ key, p }) => localStorage.setItem(key, JSON.stringify(p)), { key: STORAGE_KEY, p }); await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await context.setOffline(true); await page.reload(); await listen(page);
    const q = makeQuestion(lessonId, 7, 0);
    if (q.music!.response === 'melody') await fillMelody(page, q.music!.degrees);
    else for (const slot of q.music!.slots) await page.getByTestId(`rhythm-slot-${slot}`).click();
    await page.getByTestId('submit-music').click(); await expect(page.locator('.feedback')).toContainText('Evet, duydun.');
    expect((await saved(page)).attempts).toHaveLength(1);
  });
}

test('candidate audio failure shows an error and does not remain preparing', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(AudioContext.prototype, 'state', { configurable: true, get: () => 'suspended' });
    AudioContext.prototype.resume = async () => {};
  });
  await open(page, 'tonic-1'); await page.locator('.tonal-candidates button').first().click();
  await expect(page.locator('.audio-player [role="alert"]')).toBeVisible();
  await expect(page.locator('.audio-player .play-button')).toContainText('Dinle');
  await expect(page.locator('.answer-option').first()).toBeDisabled(); expect((await saved(page)).attempts).toHaveLength(0);
});
