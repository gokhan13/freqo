import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress, makeQuestion, STORAGE_KEY, type Progress } from '../../src/model';

// The behaviours added in answer to the review of 0.11; see docs/kalite-denetimi-0.12.md.

const seeded = (page: Page, p: Progress) =>
  page.addInitScript(
    ({ key, p }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(p));
    },
    { key: STORAGE_KEY, p },
  );
const stored = (page: Page): Promise<Progress> =>
  page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
const practising = (
  lessonId: string,
  seed: number,
  source: 'pink' | 'studio' = 'pink',
): Progress => ({
  ...initialProgress(),
  eqSource: source,
  session: { id: `s-${lessonId}`, lessonId, seed, index: 0, started: true, answers: [], source },
});
const fits = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test('a first visit offers one step, and it starts the first lesson', async ({ page }) => {
  await page.goto('/');
  const step = page.getByTestId('first-step');
  await expect(step).toBeVisible();
  // No card of zeros, and one primary button on the screen.
  await expect(page.locator('.stats-card')).toHaveCount(0);
  await expect(page.locator('main .button:not(.secondary)')).toHaveCount(1);
  await step.getByRole('button', { name: 'Pratiğe başla', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hazırım, dinleyelim' })).toBeVisible();
  expect((await stored(page)).session!.lessonId).toBe('eq-1');
  // With something under way the usual home returns.
  await page.locator('.sidebar').getByRole('button', { name: 'Bugün', exact: true }).click();
  await expect(page.getByTestId('first-step')).toHaveCount(0);
  await expect(page.locator('.stats-card')).toBeVisible();
});

test('tablet navigation keeps its names, and the profile fits a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  const sidebar = page.locator('.sidebar');
  for (const name of ['Bugün', 'Yollar', 'Becerilerim', 'Profil'])
    await expect(sidebar.getByRole('button', { name, exact: true })).toBeVisible();
  await sidebar.getByRole('button', { name: 'Profil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Klavye kısayolları' })).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    ).violations.map(v => v.id),
  ).toEqual([]);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.reload();
    await page.locator('.mobile-nav').getByRole('button', { name: 'Profil', exact: true }).click();
    await expect(page.getByTestId('offline-state')).toBeVisible();
    expect(await fits(page), `profile at ${width}px`).toBe(true);
  }
});

test('single-key shortcuts can be switched off and stay off', async ({ page }) => {
  await seeded(page, practising('eq-2', 11));
  await page.goto('/');
  const player = page.locator('.exercise .audio-player');
  await expect(player).toBeVisible();
  await page.locator('main').focus();
  await page.keyboard.press('b');
  await expect(player).toHaveClass(/is-playing/);
  await page.keyboard.press('Space');
  await expect(player).not.toHaveClass(/is-playing/);
  await expect(page.locator('.keyboard-note')).toBeVisible();
  await page.locator('.sidebar').getByRole('button', { name: 'Profil', exact: true }).click();
  await page.getByTestId('shortcuts-off').click();
  await expect(page.getByTestId('shortcuts-off')).toHaveAttribute('aria-pressed', 'true');
  expect((await stored(page)).shortcuts).toBe(false);
  await page.reload();
  await expect(player).toBeVisible();
  await page.locator('main').focus();
  for (const key of ['b', 'a', 'Space', '1']) await page.keyboard.press(key);
  await page.waitForTimeout(400);
  await expect(player).not.toHaveClass(/is-playing/);
  expect((await stored(page)).session!.answers).toHaveLength(0);
  await expect(page.locator('.keyboard-note')).toBeHidden();
  // The buttons themselves still work.
  await player.locator('.ab-button').nth(1).click();
  await expect(player).toHaveClass(/is-playing/);
});

test('matching: the second question starts with nothing chosen and no C', async ({ page }) => {
  let seed = 0;
  while (makeQuestion('eq-match', seed, 0, 'pink').correct !== 'match:1000:8') seed++;
  await seeded(page, practising('eq-match', seed));
  await page.goto('/');
  const player = page.locator('.exercise .audio-player'),
    buttons = player.locator('.ab-button');
  const hearBoth = async () => {
    await buttons.nth(0).click();
    await expect(buttons.nth(0)).toContainText('✓ Dinlendi', { timeout: 12_000 });
    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toContainText('✓ Dinlendi', { timeout: 12_000 });
  };
  await hearBoth();
  await page.getByTestId('answer-band-1000').click();
  await page.getByTestId('answer-gain-8').click();
  await expect(buttons).toHaveCount(3);
  await page.getByTestId('answer-submit').click();
  await expect(page.locator('.feedback.correct')).toBeVisible();
  await page.getByRole('button', { name: 'Sonraki soru', exact: true }).click();
  await expect(page.locator('.question-progress')).toContainText('2');
  // Nothing carries over: no band or amount is pressed, C is gone, submit waits.
  await expect(page.locator('[data-testid="eq-match"] [aria-pressed="true"]')).toHaveCount(0);
  await expect(buttons).toHaveCount(2);
  await expect(page.getByTestId('answer-submit')).toBeDisabled();
  await hearBoth();
  // Choosing again brings C back for this question.
  await page.getByTestId('answer-band-500').click();
  await page.getByTestId('answer-gain--4').click();
  await expect(buttons).toHaveCount(3);
  await expect(buttons.nth(2)).toContainText('500 Hz −4 dB');
  await expect(page.getByTestId('answer-submit')).toBeEnabled();
});

test('on a phone the listening buttons stay within reach of the answers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 });
  let seed = 0;
  while (makeQuestion('eq-match', seed, 0, 'pink').correct !== 'match:1000:8') seed++;
  await seeded(page, practising('eq-match', seed));
  await page.goto('/');
  const dock = page.getByTestId('player-dock');
  await expect(page.locator('.exercise .ab-controls')).toBeVisible();
  await expect(dock).toHaveCount(0);
  await page.getByTestId('answer-submit').scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 600);
  await expect(dock).toBeVisible();
  await dock.getByRole('button', { name: 'B sesini dinle' }).click();
  await expect(page.locator('.exercise .audio-player')).toHaveClass(/is-playing/);
  await expect(dock.getByRole('button', { name: 'B sesini dinle' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // The bar sits above the navigation and covers neither it nor the submit button.
  const [bar, nav, submit] = await Promise.all([
    dock.boundingBox(),
    page.locator('.mobile-nav').boundingBox(),
    page.getByTestId('answer-submit').boundingBox(),
  ]);
  expect(bar!.y + bar!.height).toBeLessThanOrEqual(nav!.y + 1);
  expect(submit!.y + submit!.height).toBeLessThanOrEqual(bar!.y + 1);
  expect(await fits(page)).toBe(true);
});

test('the lab has an EQ, follows a moving control without stopping, and opens on it from an EQ suggestion', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.sidebar').getByRole('button', { name: 'Yollar', exact: true }).click();
  await page.locator('.full-path').first().getByRole('button', { name: 'Yolu keşfet' }).click();
  await page.getByRole('button', { name: 'Laboratuvarı aç' }).click();
  await page.getByRole('combobox').selectOption('eq');
  const eq = page.getByTestId('lab-eq'),
    player = page.locator('.lab-listening .audio-player');
  await expect(eq.locator('.eq-curve polyline')).toHaveCount(1);
  await player.locator('.ab-button').nth(1).click();
  await expect(player).toHaveClass(/is-playing/);
  const curve = () => eq.locator('.eq-curve polyline').getAttribute('points');
  const before = await curve();
  const frequency = page.getByTestId('lab-eq-frequency');
  await frequency.focus();
  for (let i = 0; i < 12; i++) await frequency.press('ArrowRight');
  await expect(eq).toContainText('2 kHz');
  expect(await curve()).not.toBe(before);
  // The loop went on playing through twelve changes, and B is still the one sounding.
  await page.waitForTimeout(600);
  await expect(player).toHaveClass(/is-playing/);
  await expect(player.locator('.ab-button').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.lab-listening')).toContainText('Frekans: 2000 Hz');
  // A cut filter has no amount and no Q to set.
  await page.getByTestId('lab-shape-highpass').click();
  await expect(page.getByTestId('lab-eq-gain')).toHaveCount(0);
  await expect(page.getByTestId('lab-eq-q')).toHaveCount(0);
  await expect(player).toHaveClass(/is-playing/);
  expect(
    (
      await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    ).violations.map(v => v.id),
  ).toEqual([]);
});

test.describe('a report that cannot load', () => {
  // Without a service worker the report module comes from the network, where it can fail.
  test.use({ serviceWorkers: 'block' });
  test('leaves the rest of the app working and can be tried again', async ({ page }) => {
    let failing = true;
    await page.route(/ProgressReport-[^/]+\.js$/, route =>
      failing ? route.abort() : route.continue(),
    );
    await page.goto('/');
    await page
      .locator('.sidebar')
      .getByRole('button', { name: 'Becerilerim', exact: true })
      .click();
    await page.getByRole('button', { name: 'Gelişim raporunu aç', exact: true }).click();
    const failed = page.getByTestId('report-failed');
    await expect(failed).toContainText('Rapor açılamadı');
    // The menu and the rest of the app are still there.
    await expect(page.locator('.sidebar')).toBeVisible();
    await failed.getByRole('button', { name: 'Becerilerime dön', exact: true }).click();
    await expect(page.locator('.skill-card').first()).toBeVisible();
    await page.getByRole('button', { name: 'Gelişim raporunu aç', exact: true }).click();
    await expect(failed).toBeVisible();
    // A module that failed stays failed while the page lives: trying again reloads the page
    // and comes straight back to the report.
    failing = false;
    await failed.getByRole('button', { name: 'Yeniden dene', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Gelişim raporun', exact: true })).toBeVisible();
  });
});
