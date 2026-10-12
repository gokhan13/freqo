import { expect, test, type Download, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createBackup, readBackup } from '../../src/backup';
import { getLesson, usesLoop, type EqSource } from '../../src/content';
import { finishMock, initialExamProgress, startMock } from '../../src/exam-model';
import {
  advanceQuestion,
  answerQuestion,
  initialProgress,
  makeQuestion,
  STORAGE_KEY,
  type Progress,
} from '../../src/model';
import {
  advancePersonal,
  answerPersonal,
  refQuestion,
  startPersonal,
} from '../../src/personal-model';
import { buildProgressReport } from '../../src/report-model';

const DAY = 86_400_000;
const readProgress = (page: Page): Promise<Progress> =>
  page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);

async function install(page: Page, progress: Progress, path = '/') {
  // Strict backup validation proves these are normal application records, rather than
  // invented scores or an altered browser clock.
  const validated = readBackup(JSON.stringify(createBackup(progress)));
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
    },
    { key: STORAGE_KEY, value: validated },
  );
  await page.goto(path);
}

async function openReport(page: Page) {
  await page.locator('.sidebar').getByRole('button', { name: 'Becerilerim', exact: true }).click();
  await page.getByRole('button', { name: 'Gelişim raporunu aç', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gelişim raporun', exact: true })).toBeVisible();
  await expect(
    page.locator('.sidebar').getByRole('button', { name: 'Becerilerim', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
}

function round(
  progress: Progress,
  id: string,
  lessonId: string,
  corrects: boolean[],
  at: number,
  seed: number,
  source: EqSource = 'studio',
): Progress {
  let p: Progress = {
    ...progress,
    session: {
      id,
      lessonId,
      seed,
      index: 0,
      started: true,
      answers: [],
      ...(usesLoop(getLesson(lessonId).skill) ? { source } : {}),
    },
  };
  for (const [index, correct] of corrects.entries()) {
    const q = makeQuestion(lessonId, seed, index, source);
    p = answerQuestion(
      p,
      correct ? q.correct : q.options.find(o => o.id !== q.correct)!.id,
      new Date(at + index * 100 + 1).toISOString(),
    );
    p = advanceQuestion(p, new Date(at + index * 100 + 2).toISOString());
  }
  return p;
}

function completePersonal(progress: Progress, at: number, skipIndex?: number): Progress {
  let p = progress;
  while (p.personal?.active) {
    const s = p.personal.active;
    p = answerPersonal(
      p,
      s.index === skipIndex ? null : refQuestion(s.items[s.index]).correct,
      at + s.index * 100 + 1,
    );
    p = advancePersonal(p, at + s.index * 100 + 2);
  }
  return p;
}

function fixture() {
  const now = Date.now();
  let progress = round(
    initialProgress(),
    'older-mix',
    'eq-1',
    [true, true, true, true, true],
    now - 20 * DAY,
    101,
    'keys',
  );
  progress = round(
    progress,
    'recent-mix',
    'eq-1',
    [false, false, true, false, true],
    now - 2 * DAY,
    203,
    'acoustic',
  );
  progress = round(
    progress,
    'recent-music',
    'degree-1',
    [true, true, true, true, true],
    now - DAY,
    305,
  );
  const reviewAt = now - 4 * 60 * 60_000;
  progress = startPersonal(progress, 'review', 'mix', reviewAt, 407, 'error-review');
  const reviewCount = progress.personal!.active!.items.length;
  progress = completePersonal(progress, reviewAt);
  const placementAt = now - 3 * 60 * 60_000;
  progress = startPersonal(progress, 'placement', 'mix', placementAt, 509, 'placement');
  progress = completePersonal(progress, placementAt, 1);
  const mockAt = now - 2 * 60 * 60_000;
  const exam = finishMock(
    { ...initialExamProgress(), active: startMock('common', 1, mockAt, 611, 'ended-mock') },
    'ended',
    mockAt + 1000,
  );
  progress = {
    ...progress,
    exam: {
      ...exam,
      rehearsals: [
        {
          id: 'jury-note',
          courseId: 'performance',
          level: 1,
          seed: 713,
          at: now - 60 * 60_000,
          checks: [true, false, true],
          note: 'Private rehearsal note should not be copied into a report.',
        },
      ],
    },
  };
  return { progress: readBackup(JSON.stringify(createBackup(progress))), reviewCount, now };
}

async function inspectPdf(page: Page, download: Download) {
  expect(download.suggestedFilename()).toMatch(
    /^freq-report-\d{4}-\d{2}-\d{2}-(all|mix|music|exam)-(tr|en)\.pdf$/,
  );
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = await readFile(path!);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(20_000);
  const mime = await page.evaluate(
    async url => (await fetch(url)).headers.get('content-type'),
    download.url(),
  );
  expect(mime).toBe('application/pdf');
  const info = spawnSync('pdfinfo', [path!], { encoding: 'utf8' });
  expect(info.status, info.stderr).toBe(0);
  const extracted = spawnSync('pdftotext', ['-layout', path!, '-'], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  expect(extracted.status, extracted.stderr).toBe(0);
  expect(Number(info.stdout.match(/Pages:\s+(\d+)/)?.[1])).toBeGreaterThanOrEqual(2);
  expect(info.stdout).toMatch(/Page size:\s+595(?:\.\d+)? x 841(?:\.\d+)? pts \(A4\)/);
  return { text: extracted.stdout.replace(/\s+/gu, ' ').trim(), info: info.stdout, bytes };
}

async function downloadPdf(page: Page, button = 'PDF olarak indir', artifact?: string) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: button, exact: true }).click();
  const download = await pending;
  if (artifact) {
    const path = test.info().outputPath(artifact);
    await download.saveAs(path);
    await test
      .info()
      .attach(`Simulated fixture · ${artifact}`, { path, contentType: 'application/pdf' });
  }
  const result = await inspectPdf(page, download);
  await expect(
    page.locator('.progress-report [aria-live="polite"]').getByRole('status'),
  ).toContainText('PDF hazır; indirme başlatıldı.');
  return result;
}

async function downloadTabRecords(page: Page): Promise<Progress> {
  const pending = page.waitForEvent('download');
  await page
    .locator('.storage-notice')
    .getByRole('button', { name: 'Bu sekmedeki veriyi indir', exact: true })
    .click();
  const download = await pending,
    path = await download.path();
  expect(await download.failure()).toBeNull();
  expect(path).toBeTruthy();
  return readBackup(await readFile(path!, 'utf8'));
}

test('empty progress report is truthful, bilingual, accessible and usable at 320 and 390 pixels', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Gelişimini incele', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gelişim raporun', exact: true })).toBeVisible();
  for (const width of [320, 390])
    for (const locale of ['tr', 'en'] as const) {
      await page.setViewportSize({ width, height: 844 });
      await page.getByRole('button', { name: locale === 'tr' ? 'TR' : 'EN', exact: true }).click();
      await expect(
        page.getByRole('heading', {
          name: locale === 'tr' ? 'Gelişim raporun' : 'Your progress report',
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator('.report-summary article').nth(0).locator('strong')).toHaveText(
        '0',
      );
      await expect(page.locator('.report-summary article').nth(1).locator('strong')).toHaveText(
        '—',
      );
      await expect(page.locator('.report-interpretation')).toContainText(
        locale === 'tr'
          ? 'Henüz normal pratik yanıtı yok.'
          : 'No ordinary practice answers are recorded yet.',
      );
      await expect(page.locator('.report-priority')).toHaveCount(3);
      await expect(page.locator('.report-techniques').first().locator('li')).toHaveCount(3);
      await expect(
        page.getByRole('combobox', {
          name: locale === 'tr' ? 'Rapor yolu' : 'Report path',
          exact: true,
        }),
      ).toHaveValue('mix');
      await expect(
        page.getByRole('combobox', {
          name: locale === 'tr' ? 'Rapor dönemi' : 'Report period',
          exact: true,
        }),
      ).toHaveValue('all');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
          .violations,
      ).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`empty-report-${width}-${locale}.png`),
        fullPage: true,
      });
    }
});

test('saved practice, reviews, placement and mocks remain separate in the UI and a genuine Unicode PDF', async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({
    type: 'fixture',
    description:
      'The example PDF and screenshot use simulated, valid study records; they are not real user learning history.',
  });
  const { progress, reviewCount } = fixture();
  await install(page, progress);
  await openReport(page);
  await page.getByRole('combobox', { name: 'Rapor yolu', exact: true }).selectOption('all');
  const before = await readProgress(page);
  await expect(page.locator('.report-summary article').nth(0).locator('strong')).toHaveText('15');
  await expect(page.locator('.report-summary article').nth(0).locator('small')).toHaveText(
    '12 doğru',
  );
  await expect(page.locator('.report-summary article').nth(1).locator('strong')).toHaveText('80%');
  await expect(page.locator('.report-record-grid article').nth(0)).toContainText(
    `${reviewCount} yanıt · 100%`,
  );
  await expect(page.locator('.report-record-grid article').nth(1)).toContainText('17/17 doğru');
  await expect(page.locator('.report-record-grid article').nth(1)).toContainText('1 geçilen soru');
  await expect(page.locator('.report-record-grid article').nth(2)).toContainText('1 deneme · 0%');
  await expect(page.locator('.report-record-grid article').nth(3)).toContainText('1 not');
  const pdf = await downloadPdf(page, 'PDF olarak indir', 'example-report-tr.pdf');
  expect(pdf.text).toContain('Çalışma ve ilerleme raporu');
  expect(pdf.text).toContain('Doğru pratik yanıtı: 12');
  expect(pdf.text).toContain('80%');
  expect(pdf.text).toContain('Doğru/yanıt: 17/17 · 100%');
  expect(pdf.text).toContain(`Doğru/yanıt: ${reviewCount}/${reviewCount} · 100%`);
  expect(pdf.text).toContain('İşaretlenen/toplam kontrol: 2/3');
  expect(pdf.text).toContain('Eski yanıtlardan yeni ses çeşitliliği');
  expect(pdf.text).toContain('Kaynak bağlantıları');
  expect(pdf.text).toContain('Mixing Secrets for the Small Studio');
  expect(pdf.text).toContain('Ücretsiz');
  expect(pdf.text).toContain('Ücretli · isteğe bağlı');
  expect(pdf.text).toContain('https://www.izotope.com/community/blog/');
  expect(pdf.bytes.toString('latin1')).toContain('/URI (https://');
  expect(pdf.info).toContain('Freq · Çalışma ve ilerleme raporu');
  expect(pdf.text).not.toContain('Private rehearsal note');
  expect(await readProgress(page)).toEqual(before);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const screenshot = testInfo.outputPath('example-report-tr-simulated-fixture-390.png');
  await page.screenshot({ path: screenshot });
  await testInfo.attach('Simulated fixture · populated Turkish report at 390px', {
    path: screenshot,
    contentType: 'image/png',
  });
});

test('path and date filters change the visible observations and exported PDF metadata without changing progress', async ({
  page,
}) => {
  const { progress } = fixture();
  await install(page, progress);
  await openReport(page);
  const before = await readProgress(page);
  const path = page.getByRole('combobox', { name: 'Rapor yolu', exact: true }),
    period = page.getByRole('combobox', { name: 'Rapor dönemi', exact: true });
  await path.selectOption('mix');
  await period.selectOption('7d');
  await expect(page.locator('.report-summary article').nth(0).locator('strong')).toHaveText('5');
  await expect(page.locator('.report-summary article').nth(1).locator('strong')).toHaveText('40%');
  await path.selectOption('music');
  await period.selectOption('30d');
  await expect(page.locator('.report-summary article').nth(0).locator('strong')).toHaveText('5');
  await expect(page.locator('.report-summary article').nth(1).locator('strong')).toHaveText('100%');
  const pdf = await downloadPdf(page);
  expect(pdf.text).toContain('Çalışma yolu: Müzik kulağı');
  expect(pdf.text).toContain('Dönem: Son 30 gün');
  expect(pdf.info).toMatch(/Subject:\s+Müzik kulağı · Son 30 gün/);
  expect(await readProgress(page)).toEqual(before);
});

for (const problem of ['write-denied', 'recoverable-record'] as const)
  test(`actual PDF preserves the ${problem} notice and both record copies`, async ({ page }) => {
    const { progress } = fixture();
    const saved = problem === 'write-denied' ? { ...progress, locale: 'en' as const } : progress;
    const raw = JSON.stringify(
      problem === 'recoverable-record' ? { ...saved, attempts: [...saved.attempts, null] } : saved,
    );
    await page.addInitScript(
      ({ key, raw, denyWrites }) => {
        localStorage.setItem(key, raw);
        if (denyWrites) {
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function (name, value) {
            if (name === key)
              throw new DOMException('Quota exhausted in this test', 'QuotaExceededError');
            return original.call(this, name, value);
          };
        }
      },
      { key: STORAGE_KEY, raw, denyWrites: problem === 'write-denied' },
    );
    await page.goto('/');
    if (problem === 'write-denied') {
      // A normal preference edit forces a real failed persistence attempt. The
      // readable on-disk English copy remains separate from this Turkish tab.
      await page.getByRole('button', { name: 'TR', exact: true }).click();
      await expect(page.locator('.storage-notice')).toContainText('Tarayıcı kayıt yapamıyor.');
    } else await expect(page.locator('.storage-notice')).toContainText('Orijinal kayıt korunuyor');
    await openReport(page);
    await page.getByRole('combobox', { name: 'Rapor yolu', exact: true }).selectOption('all');
    const notice =
      problem === 'write-denied'
        ? 'Bu rapor bu sekmedeki verilere dayanır. Tarayıcı yeni kayıtları saklayamıyor; sayfayı kapatmadan ilerleme yedeğini de indir.'
        : 'Bu rapor bu sekmedeki okunabilir verilere dayanır. Kayıt sorunu çözülene kadar yeni yanıtlar diske yazılmıyor; ilerleme yedeğini de indir.';
    await expect(page.locator('.report-record-notice')).toHaveText(notice);
    await expect(page.locator('.report-summary article').nth(0).locator('strong')).toHaveText('15');
    const tabBefore = await downloadTabRecords(page);
    expect(tabBefore).toEqual(progress);
    const diskBefore = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
    expect(diskBefore).toBe(raw);
    const pdf = await downloadPdf(page);
    expect(pdf.text).toContain('Kayıt durumu');
    expect(pdf.text).toContain(notice);
    expect(pdf.text).toContain('Doğru pratik yanıtı: 12');
    await expect(page.locator('.report-record-notice')).toHaveText(notice);
    await expect(page.locator('.storage-notice')).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(diskBefore);
    expect(await downloadTabRecords(page)).toEqual(tabBefore);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

test('skill guides expose Turkish-first relevant resources and label English fallbacks', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.sidebar').getByRole('button', { name: 'Becerilerim', exact: true }).click();
  const before = await readProgress(page);
  const rhythm = page
    .locator('.skill-card')
    .filter({ has: page.getByRole('heading', { name: 'Ritim', exact: true }) });
  await rhythm.getByText('Nasıl çalışmalıyım?', { exact: true }).click();
  const rhythmGuide = rhythm.locator('.skill-study-guide'),
    resources = rhythmGuide.locator('.report-resource');
  await expect(rhythmGuide.getByText('Dinleme ipucu:', { exact: true })).toBeVisible();
  await expect(rhythmGuide.locator('ol > li')).toHaveCount(3);
  await expect(resources.first()).toContainText('Ücretsiz · Türkçe');
  await expect(
    resources.first().getByRole('link', { name: 'Notaların Süre Değerleri 1' }),
  ).toHaveAttribute('href', 'https://acikders.ankara.edu.tr/mod/url/view.php?id=58726');
  await expect(resources.first().getByRole('link')).toHaveAttribute('target', '_blank');
  await expect(resources.nth(1)).toContainText('Ücretsiz · İngilizce');
  await expect(resources.nth(1)).toContainText('Open Music Theory');
  const eq = page
    .locator('.skill-card')
    .filter({ has: page.getByRole('heading', { name: 'EQ ve frekans', exact: true }) });
  await eq.getByText('Nasıl çalışmalıyım?', { exact: true }).click();
  await expect(eq.locator('.report-resource').first()).toContainText('Ücretsiz · İngilizce');
  await expect(eq.locator('.report-resource').last()).toContainText(
    'Ücretli · isteğe bağlı · İngilizce',
  );
  expect(await readProgress(page)).toEqual(before);
});

test('personal-plan links use the selected study route, and all-path reports retain the chosen route', async ({
  page,
}) => {
  const { progress } = fixture();
  await install(page, progress);
  await openReport(page);
  const before = await readProgress(page);
  await page.getByRole('combobox', { name: 'Rapor yolu', exact: true }).selectOption('exam');
  expect((await readProgress(page)).path).toBe('mix');
  await page
    .locator('.report-priority')
    .first()
    .getByRole('button', { name: 'Kişisel plana git', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Sana uygun bir sonraki adım.', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Çalışma yolun', exact: true })).toHaveValue(
    'exam',
  );
  await expect(page.locator('.personal-skill')).toHaveCount(6);
  expect(await readProgress(page)).toEqual({ ...before, path: 'exam' });
  await openReport(page);
  await page.getByRole('combobox', { name: 'Rapor yolu', exact: true }).selectOption('all');
  await page
    .locator('.report-priority')
    .first()
    .getByRole('button', { name: 'Kişisel plana git', exact: true })
    .click();
  await expect(page.getByRole('combobox', { name: 'Çalışma yolun', exact: true })).toHaveValue(
    'exam',
  );
  expect(await readProgress(page)).toEqual({ ...before, path: 'exam' });
});

test('suggested lesson respects its current stage and asks before replacing saved manual work', async ({
  page,
}) => {
  const setup = fixture();
  let progress: Progress = {
    ...setup.progress,
    session: {
      id: 'saved-memory',
      lessonId: 'memory-1',
      seed: 817,
      index: 0,
      started: true,
      answers: [],
    },
  };
  progress = answerQuestion(
    progress,
    makeQuestion('memory-1', 817, 0).correct,
    new Date(setup.now - 1000).toISOString(),
  );
  const suggestion = buildProgressReport(progress, { now: setup.now, path: 'mix' }).priorities[0];
  await install(page, progress);
  await openReport(page);
  const before = await readProgress(page);
  await page
    .locator('.report-priority')
    .first()
    .getByRole('button', { name: 'Önerilen dersi çalış', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Yarım kalan bir pratiğin var.');
  expect(await readProgress(page)).toEqual(before);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Pratiğe devam et', exact: true })
    .click();
  await expect(page.locator('.exercise')).toBeVisible();
  expect((await readProgress(page)).session).toEqual(before.session);
  await openReport(page);
  await page
    .locator('.report-priority')
    .first()
    .getByRole('button', { name: 'Önerilen dersi çalış', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Yeni pratiğe geç', exact: true })
    .click();
  await expect(
    page
      .locator('.lesson-intro')
      .getByRole('heading', { name: getLesson(suggestion.lessonId).title.tr, exact: true }),
  ).toBeVisible();
  const after = await readProgress(page);
  expect(after.session!.lessonId).toBe(suggestion.lessonId);
  expect(after.session!.id).not.toBe(before.session!.id);
  expect(after.attempts).toEqual(before.attempts);
  expect(after.personal).toEqual(before.personal);
});

for (const path of ['/', '/freq/'])
  test(`first actual PDF export works offline after installation at ${path}`, async ({
    page,
    context,
  }) => {
    await page.goto(path);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL))
      .toMatch(new RegExp(`${path.replaceAll('/', '\\/')}sw\\.js$`));
    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button', { name: 'Gelişimini incele', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Gelişim raporun', exact: true })).toBeVisible();
    const pdf = await downloadPdf(page);
    expect(pdf.text).toContain('Henüz normal pratik yanıtı yok.');
    expect(pdf.text).toContain('Çalışma ve ilerleme raporu');
    expect(pdf.text).toContain('Ücretli seçenekler isteğe bağlıdır');
    expect((await readProgress(page)).attempts).toEqual([]);
    await context.setOffline(false);
  });

test.describe('report font failure', () => {
  // Browser routing cannot intercept a cached service-worker response. This isolates
  // the real font request while other tests exercise the actual offline worker.
  test.use({ serviceWorkers: 'block' });
  test('failed local font fetch produces no phantom download and retry creates a valid PDF', async ({
    page,
  }) => {
    const { progress } = fixture();
    await install(page, progress);
    await openReport(page);
    const before = await readProgress(page),
      downloads: Download[] = [];
    page.on('download', download => downloads.push(download));
    let release: (() => void) | undefined;
    const fontRequest = page.waitForRequest(request =>
      request.url().endsWith('/fonts/DejaVuSans.ttf'),
    );
    await page.route('**/fonts/DejaVuSans.ttf', async route => {
      await new Promise<void>(resolve => {
        release = resolve;
      });
      await route.abort('failed');
    });
    await page.getByRole('button', { name: 'PDF olarak indir', exact: true }).click();
    const request = await fontRequest;
    expect(new URL(request.url()).origin).toBe(new URL(page.url()).origin);
    await expect(
      page.getByRole('button', { name: 'PDF hazırlanıyor…', exact: true }),
    ).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'Rapor yolu', exact: true })).toBeDisabled();
    await expect.poll(() => !!release).toBe(true);
    release!();
    await expect(page.getByRole('alert')).toContainText(
      'PDF hazırlanamadı; rapor ve kayıtların korunuyor.',
    );
    expect(downloads).toHaveLength(0);
    expect(await readProgress(page)).toEqual(before);
    await page.unroute('**/fonts/DejaVuSans.ttf');
    const pdf = await downloadPdf(page, 'PDF’yi yeniden dene');
    expect(pdf.text).toContain('Çalışma ve ilerleme raporu');
    expect(downloads).toHaveLength(1);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(await readProgress(page)).toEqual(before);
  });
});
