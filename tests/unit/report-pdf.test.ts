import { execFileSync } from 'node:child_process';
import { skillLessons } from '../../src/personal-model';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { skillNames, text, tx } from '../../src/content';
import { initialProgress } from '../../src/model';
import { buildProgressReport, type ProgressReport } from '../../src/report-model';
import { createReportPdf } from '../../src/report-pdf';
import { resourcesForSkill, studyWeek } from '../../src/report-presentation';
// The EQ ladder's second and third stages; their ids are names, not numbers.
const EQ2 = skillLessons('eq')[1].id,
  EQ3 = skillLessons('eq')[2].id;

const NOW = Date.parse('2026-10-12T20:30:00Z');
const fontBytes = new Uint8Array(
  readFileSync(new URL('../../public/fonts/DejaVuSans.ttf', import.meta.url)),
);
const directories: string[] = [];

afterEach(() => {
  directories.splice(0).forEach(directory => rmSync(directory, { recursive: true, force: true }));
  vi.unstubAllGlobals();
});

function inspect(bytes: Uint8Array) {
  const directory = mkdtempSync(join(tmpdir(), 'freq-pdf-test-'));
  directories.push(directory);
  const file = join(directory, 'report.pdf');
  writeFileSync(file, bytes);
  const extract = (args: string[]) =>
    execFileSync('pdftotext', [...args, file, '-'], { encoding: 'utf8' });
  return {
    text: extract(['-layout']),
    bbox: extract(['-bbox']),
    info: execFileSync('pdfinfo', [file], { encoding: 'utf8' }),
    source: Buffer.from(bytes).toString('latin1'),
  };
}

function fixture(): ProgressReport {
  const report = buildProgressReport(initialProgress(), {
    now: NOW,
    path: 'all',
    period: '7d',
    timeZone: 'Europe/Istanbul',
  });
  report.summary = {
    practiceCount: 20,
    practiceCorrect: 14,
    practiceAccuracy: 70,
    completedSessions: 4,
    partialSessions: 1,
    assessedSkills: 1,
    supportedSkills: report.skills.length,
    independentLogicalCount: 17,
    distinctSounds: 12,
    legacyCount: 3,
    activeDays: 2,
    skippedPersonalResponses: 2,
  };
  report.review = { count: 4, correct: 3, accuracy: 75, dueCount: 2, openCount: 5 };
  report.placement = {
    count: 6,
    correct: 4,
    accuracy: 67,
    completedSessions: 1,
    partialSessions: 1,
    skippedCount: 1,
  };
  report.exam = {
    results: [
      {
        id: 'pdf-mock',
        profileId: 'common',
        level: 1,
        finishedAt: NOW - 60_000,
        reason: 'completed',
        answered: 8,
        skipped: 2,
        correct: 5,
        total: 10,
        accuracy: 63,
      },
    ],
    completedCount: 1,
    endedCount: 0,
    expiredCount: 0,
    questionCount: 8,
    correct: 5,
    accuracy: 63,
    selfAssessment: { count: 2, checked: 7, totalChecks: 10 },
    active: true,
  };
  const eq = report.skills.find(row => row.skill === 'eq')!;
  Object.assign(eq, {
    lessonId: EQ2,
    level: 2,
    practiceCount: 20,
    correct: 14,
    accuracy: 70,
    independentLogicalCount: 17,
    distinctSounds: 12,
    legacyCount: 3,
    sessionCount: 4,
    reviewCount: 4,
    reviewCorrect: 3,
    reviewAccuracy: 75,
    dueCount: 2,
    openCount: 5,
    firstSuggestedLevel: 1,
    currentSuggestedLevel: 2,
  });
  eq.trend = {
    status: 'available',
    reason: text(
      'Aynı aşama, kaynak ve yolda küçük örneklem.',
      'A small sample at the same stage, source and path.',
    ),
    lessonId: EQ2,
    source: 'studio',
    path: 'mix',
    previousCount: 10,
    recentCount: 10,
    previousAccuracy: 50,
    recentAccuracy: 90,
    deltaPoints: 40,
  };
  report.priorities = [
    {
      skill: 'eq',
      lessonId: EQ2,
      severity: 'focus',
      evidence: text(
        'Çığ, ılık, İŞİTME, ölçü ve şüphe: çğıİöşü ÇĞÖŞÜ. 20 yanıt var.',
        '20 answers support a cautious listening suggestion.',
      ),
      nextGoal: text(
        'İki oturumda 10 yeni soru; 2 zamanı gelen tekrar.',
        '10 fresh questions across two sessions; 2 due reviews.',
      ),
      goal: { freshQuestions: 10, sessions: 2, dueReviews: 2 },
    },
    ...report.priorities.filter(priority => priority.skill !== 'eq').slice(0, 2),
  ];
  report.daily = [
    {
      date: '2026-10-12',
      practiceCount: 20,
      correct: 14,
      reviewCount: 4,
      reviewCorrect: 3,
      placementCount: 6,
      skippedCount: 2,
      completedSessions: 4,
      partialSessions: 1,
      mockCount: 1,
      selfAssessmentCount: 2,
    },
  ];
  return report;
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

describe('downloadable Unicode report PDF', () => {
  it('embeds selectable Turkish Unicode, accurate dated counts, every skill and separate measurements without mutating data', async () => {
    const report = freeze(fixture()),
      before = JSON.stringify(report);
    const fetchSpy = vi.fn(() => {
      throw new Error('PDF must not send learner records.');
    });
    vi.stubGlobal('fetch', fetchSpy);
    const pdf = await createReportPdf(report, 'tr', { fontBytes });
    const exported = inspect(pdf.bytes);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(JSON.stringify(report)).toBe(before);
    expect(pdf.filename).toBe('freq-report-2026-10-12-all-tr.pdf');
    expect(pdf.pages).toBeGreaterThan(3);
    expect(exported.info).toMatch(new RegExp(`Pages:\\s+${pdf.pages}\\b`));
    expect(exported.info).toContain('Freq · Çalışma ve ilerleme raporu');
    expect(exported.info).toContain('A4');
    expect(exported.source).toContain('/ToUnicode');
    expect(exported.source).toContain('/Lang (tr)');
    expect(exported.source).toContain('/CreationDate (D:20261012203000');
    expect(exported.text).toContain('çğıİöşü ÇĞÖŞÜ');
    expect(exported.text).toContain('Europe/Istanbul');
    expect(exported.text).toContain('12 Eki 2026');
    expect(exported.text).toContain('23:30');
    expect(exported.text).toContain('6 Eki 2026');
    expect(exported.text).toContain('Son 7 gün');
    expect(exported.text).toMatch(/Doğru pratik yanıtı: 14/);
    expect(exported.text).toMatch(/Pratik doğru\/yanıt: 14\/20 · 70%/);
    expect(exported.text).toMatch(/Farklı soru: 17 · Farklı duyulan örnek: 12 · Eski yanıt: 3/);
    expect(exported.text).toContain('50% (n=10) → 90% (n=10); +40 yüzde puan');
    expect(exported.text).toContain('Elektronik groove');
    for (const row of report.skills)
      expect(exported.text).toContain(tx(skillNames[row.skill], 'tr'));
    expect(exported.text).toContain('Hata tekrarları');
    expect(exported.text).toMatch(/Doğru\/yanıt: 3\/4 · 75%/);
    expect(exported.text).toContain('Başlangıç değerlendirmesi');
    expect(exported.text).toMatch(/Doğru\/yanıt: 4\/6 · 67%/);
    expect(exported.text).toContain('Süreli denemeler');
    expect(exported.text).toMatch(/Doğru\/yanıt: 5\/8 · 63%/);
    expect(exported.text).toContain('İcra öz değerlendirmesi');
    expect(exported.text).toContain('İşaretlenen/toplam kontrol: 7/10');
    expect(exported.text).toContain('Yöntem ve yorum sınırları');
    for (const day of studyWeek(report)) expect(exported.text).toContain(`Gün ${day.day}`);
    expect(exported.text).toContain(`1/${pdf.pages}`);
    expect(exported.text).toContain(`${pdf.pages}/${pdf.pages}`);
  }, 15_000);

  it('exports full English guidance, limits and dated, clickable, deduplicated organic resource references', async () => {
    const report = fixture();
    const pdf = await createReportPdf(report, 'en', { fontBytes });
    const exported = inspect(pdf.bytes);
    const readable = exported.text.replace(/\s+/gu, ' ');
    expect(exported.source).toContain('/Lang (en-GB)');
    expect(readable).toContain('Practice and progress report');
    expect(readable).toContain('12 Oct 2026');
    expect(readable).toContain('Listening cue:');
    expect(readable).toContain('Short session:');
    expect(readable).toContain('Transfer to a real context:');
    expect(readable).toContain('Fresh-example check:');
    expect(readable).toContain('Sponsorship does not determine resource rankings.');
    expect(readable).toContain('Paid options are optional; PDF generation is free.');
    expect(readable).toContain('Source reviewed: 2026-10-12');
    const resources = report.priorities.flatMap(priority => resourcesForSkill(priority.skill));
    for (const resource of resources) {
      expect(readable).toContain(tx(resource.title, 'en'));
      expect(exported.source).toContain(`/URI (${resource.url})`);
      expect(readable).toContain(resource.language === 'tr' ? 'Turkish' : 'English');
      expect(readable).toContain(resource.price === 'paid' ? 'Paid · optional' : 'Free');
    }
    for (const url of new Set(resources.map(resource => resource.url))) {
      // The printed URL appears once in the final references, even for shared resources.
      expect(readable.split(url).length - 1).toBe(1);
    }
  }, 15_000);

  it('keeps the Turkish rhythm video before the English book in both English and Turkish PDFs', async () => {
    const report = fixture();
    report.priorities = [
      {
        ...report.priorities[0],
        skill: 'rhythm',
        lessonId: 'rhythm-1',
        evidence: text(
          'Ritim için yeni kayıtlı örnekler topla.',
          'Gather fresh saved rhythm examples.',
        ),
        nextGoal: text(
          'İki kısa oturumda yeni ritimler dene.',
          'Try fresh rhythms across two short sessions.',
        ),
      },
    ];
    const resources = resourcesForSkill('rhythm');
    expect(resources.map(resource => resource.id)).toEqual([
      'ankara-note-values',
      'open-music-theory',
    ]);
    const [turkishVideo, englishBook] = resources;
    for (const locale of ['en', 'tr'] as const) {
      const exported = inspect((await createReportPdf(report, locale, { fontBytes })).bytes);
      const readable = exported.text.replace(/\s+/gu, ' ');
      const videoPosition = readable.indexOf(tx(turkishVideo.title, locale));
      const bookPosition = readable.indexOf(tx(englishBook.title, locale));
      expect(videoPosition).toBeGreaterThanOrEqual(0);
      expect(bookPosition).toBeGreaterThan(videoPosition);
      expect(exported.source).toContain(`/URI (${turkishVideo.url})`);
      expect(exported.source).toContain(`/URI (${englishBook.url})`);
    }
  }, 15_000);

  it('keeps long English text and unbroken tokens within A4 margins across page breaks, and limits history output', async () => {
    const report = fixture();
    report.priorities[0].evidence = text(
      'Uzun açıklama',
      `${'Detailed listening evidence should remain readable across page boundaries. '.repeat(65)} ${'UNBROKENTOKEN'.repeat(30)}`,
    );
    report.skills[0].trend.reason = text(
      'Uzun açıklama',
      'Matched stage, source and route remain necessary for every comparison. '.repeat(70),
    );
    report.daily = Array.from({ length: 30 }, (_, index) => ({
      ...report.daily[0],
      date: `2026-09-${String(index + 1).padStart(2, '0')}`,
    }));
    const exported = inspect((await createReportPdf(freeze(report), 'en', { fontBytes })).bytes);
    expect(exported.text).toContain('Resource references');
    expect(exported.text).toContain('2026-09-30');
    expect(exported.text).toContain('2026-09-17');
    expect(exported.text).not.toContain('2026-09-16');
    const words = [
      ...exported.bbox.matchAll(
        /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)"/gu,
      ),
    ];
    expect(words.length).toBeGreaterThan(1000);
    // Poppler extracts positioned glyphs, so these checks catch actual clipping/overflow.
    for (const word of words) {
      const [xMin, yMin, xMax, yMax] = word.slice(1).map(Number);
      expect(xMin).toBeGreaterThanOrEqual(50);
      expect(xMax).toBeLessThanOrEqual(546);
      expect(yMin).toBeGreaterThan(30);
      expect(yMax).toBeLessThan(823);
      if (yMin > 60 && yMin < 800) expect(yMax).toBeLessThan(785);
    }
  }, 15_000);

  it('loads only the local font and retries network or incomplete-font failures instead of producing partial PDFs', async () => {
    // Isolate the retry-safe cache from PDFs above, which deliberately inject bytes.
    const fetchSpy = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline before precache'))
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      })
      .mockResolvedValue({ ok: true, arrayBuffer: async () => Uint8Array.from(fontBytes).buffer });
    vi.stubGlobal('fetch', fetchSpy);
    const report = buildProgressReport(initialProgress(), { now: NOW, path: 'mix' });
    await expect(createReportPdf(report, 'en')).rejects.toThrow('offline before precache');
    await expect(createReportPdf(report, 'en')).rejects.toThrow('503');
    await expect(createReportPdf(report, 'en')).rejects.toThrow('incomplete');
    const pdf = await createReportPdf(report, 'en');
    expect(inspect(pdf.bytes).text).toContain('No ordinary practice answers are recorded yet.');
    await createReportPdf(report, 'tr');
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    for (const [url, options] of fetchSpy.mock.calls) {
      expect(url).toBe(`${import.meta.env.BASE_URL}fonts/DejaVuSans.ttf`);
      expect(options).toEqual({ credentials: 'same-origin', redirect: 'error' });
    }
  }, 15_000);

  it('rejects truncated injected fonts without fetching or returning a download', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(
      createReportPdf(fixture(), 'tr', { fontBytes: fontBytes.slice(0, 2000) }),
    ).rejects.toThrow('incomplete');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects missing font tables and corruption before jsPDF can swallow a font-output failure', async () => {
    const withoutPost = Uint8Array.from(fontBytes),
      view = new DataView(withoutPost.buffer);
    for (let i = 0; i < view.getUint16(4); i++) {
      const at = 12 + i * 16;
      if (String.fromCharCode(...withoutPost.subarray(at, at + 4)) === 'post')
        withoutPost.set([110, 111, 112, 101], at);
    }
    await expect(createReportPdf(fixture(), 'tr', { fontBytes: withoutPost })).rejects.toThrow(
      'post table',
    );
    const corrupted = Uint8Array.from(fontBytes);
    corrupted[corrupted.length - 1] ^= 1;
    await expect(createReportPdf(fixture(), 'tr', { fontBytes: corrupted })).rejects.toThrow(
      'integrity check',
    );
  });

  it('prints a supplied current-tab saving notice on the cover in the selected language without changing the snapshot', async () => {
    const report = freeze(fixture()),
      before = JSON.stringify(report);
    const recordNotice = freeze(
      text(
        'Bu PDF geçerli sekmedeki anlık kayıtlardan oluşturuldu. Depolama kotası dolduğu için son yanıtlar henüz cihazın kalıcı kaydına yazılamadı.',
        'This PDF uses the current tab snapshot. Storage quota is full, so recent answers have not yet been written to the device’s saved records.',
      ),
    );
    for (const locale of ['tr', 'en'] as const) {
      const exported = inspect(
        (await createReportPdf(report, locale, { fontBytes, recordNotice })).bytes,
      );
      const cover = exported.text.split('\f')[0].replace(/\s+/gu, ' ');
      expect(cover).toContain(locale === 'tr' ? 'Kayıt durumu' : 'Record status');
      expect(cover).toContain(tx(recordNotice, locale));
      expect(cover.indexOf(tx(recordNotice, locale))).toBeLessThan(
        cover.indexOf(locale === 'tr' ? 'Oluşturulma:' : 'Generated:'),
      );
      expect(cover).toContain(
        locale === 'tr' ? 'Doğru pratik yanıtı: 14' : 'Correct practice answers: 14',
      );
    }
    expect(JSON.stringify(report)).toBe(before);
  }, 15_000);
});
