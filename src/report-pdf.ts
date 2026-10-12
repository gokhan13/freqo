import type { jsPDF } from 'jspdf';
import { eqSources, getLesson, skillNames, tx, type Locale, type Text } from './content';
import { getExamProfile } from './exam-content';
import type { ProgressReport, ReportSkill } from './report-model';
import { percentage, reportDate, reportLimits, reportPathLabel, reportPeriodLabel, reportSummaryNote, resourceCost, resourceKind, resourceLanguage, resourcesForSkill, studyWeek } from './report-presentation';
import { studyGuides, type LearningResource } from './report-resources';

export type ReportPdf = { bytes: Uint8Array; filename: string; pages: number };
export type ReportPdfOptions = { fontBytes?: Uint8Array; recordNotice?: Text };

const FONT_FILE = 'DejaVuSans.ttf', FONT_NAME = 'ReportSans';
// Kept with public/fonts/font-source.json; no remote font/manifest service is used.
const FONT_SHA256 = '57f73e11f51999432bf7ab22ce55b6f945d5eca1bf824404cfa9ec2e3718c84e';
let fontPromise: Promise<Uint8Array> | undefined;

/** Reject HTML/error bodies and truncated fonts before jsPDF's error-catching plug-ins run. */
function validateFont(bytes: Uint8Array): void {
  if (bytes.byteLength < 12) throw new Error('The report font is missing or incomplete.');
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (data.getUint32(0) !== 0x00010000) throw new Error('The report font is not a supported TrueType font.');
  const count = data.getUint16(4);
  if (count < 8 || 12 + count * 16 > bytes.byteLength) throw new Error('The report font table is incomplete.');
  const tables = new Set<string>();
  for (let i = 0; i < count; i++) {
    const at = 12 + i * 16, offset = data.getUint32(at + 8), length = data.getUint32(at + 12);
    if (offset > bytes.byteLength || length > bytes.byteLength - offset) throw new Error('The report font data is incomplete.');
    tables.add(String.fromCharCode(...bytes.subarray(at, at + 4)));
  }
  for (const table of ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'loca', 'glyf', 'post']) {
    if (!tables.has(table)) throw new Error(`The report font is missing its ${table} table.`);
  }
}

async function verifyReportFont(bytes: Uint8Array): Promise<void> {
  validateFont(bytes);
  if (!globalThis.crypto?.subtle) throw new Error('The report font could not be verified on this browser.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', Uint8Array.from(bytes).buffer);
  const actual = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (actual !== FONT_SHA256) throw new Error('The report font failed its integrity check. Please reload and try again.');
}

/** Only this app's precached font is fetched. Failed requests are never cached. */
export function loadReportFont(): Promise<Uint8Array> {
  if (!fontPromise) {
    const pending = (async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}fonts/${FONT_FILE}`, { credentials: 'same-origin', redirect: 'error' });
      if (!response.ok) throw new Error(`The report font could not be loaded (${response.status}).`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      await verifyReportFont(bytes);
      return bytes;
    })();
    fontPromise = pending;
    void pending.catch(() => { if (fontPromise === pending) fontPromise = undefined; });
  }
  // Keep cached bytes private so a caller cannot accidentally corrupt a later export.
  return fontPromise.then(bytes => Uint8Array.from(bytes));
}

function binaryFont(bytes: Uint8Array): string {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192) value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return value;
}

const INK = '#172B2A', MUTED = '#526864', ACCENT = '#276354', PALE = '#EFF5EF';
type ParagraphOptions = { size?: number; color?: string; indent?: number; gap?: number; url?: string };

/** Every line is measured and placed independently, including unbroken URLs. */
class ReportLayout {
  readonly left = 18;
  readonly width = 174;
  readonly bottom = 274;
  y = 30;
  private glyphs = new Set<string>();
  constructor(readonly doc: jsPDF, readonly header: string, readonly footer: string) {}

  private style(size = 9.5, color = INK) { this.doc.setFont(FONT_NAME, 'normal'); this.doc.setFontSize(size); this.doc.setTextColor(color); }
  private verifyText(value: string) {
    const metadata = this.doc.getFont().metadata as { characterToGlyph?: (code: number) => number };
    for (const char of value) if (!this.glyphs.has(char) && !/\s/u.test(char)) {
      if (!metadata.characterToGlyph?.(char.codePointAt(0)!)) throw new Error(`The report font cannot render ${char}.`);
      this.glyphs.add(char);
    }
  }
  private write(value: string, x: number, y: number) { this.verifyText(value); this.doc.text(value, x, y); }

  boundedText(value: string, x: number, y: number, width: number, size: number, color: string) {
    this.style(size, color);
    this.verifyText(value);
    if (this.doc.getTextWidth(value) > width) throw new Error('A report summary value does not fit the page.');
    this.write(value, x, y);
  }

  wrap(value: string, width = this.width, size = 9.5): string[] {
    this.style(size);
    this.verifyText(value);
    const lines: string[] = [];
    for (const paragraph of value.split(/\r?\n/u)) {
      let line = '';
      for (const word of paragraph.split(/\s+/u).filter(Boolean)) {
        const joined = line ? `${line} ${word}` : word;
        if (this.doc.getTextWidth(joined) <= width) { line = joined; continue; }
        if (line) { lines.push(line); line = ''; }
        if (this.doc.getTextWidth(word) <= width) { line = word; continue; }
        for (const char of word) {
          if (this.doc.getTextWidth(line + char) > width && line) { lines.push(line); line = ''; }
          if (this.doc.getTextWidth(char) > width) throw new Error('A report character is wider than the page.');
          line += char;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  ensure(height: number) { if (this.y + height > this.bottom) this.newPage(); }
  newPage() { this.doc.addPage(); this.y = 30; }
  gap(height = 3) { this.y += height; }
  paragraph(value: string, options: ParagraphOptions = {}) {
    const { size = 9.5, color = INK, indent = 0, gap = 2, url } = options;
    const lineHeight = size * 0.352778 * 1.36;
    const lines = this.wrap(value, this.width - indent, size);
    this.ensure(Math.min(2, lines.length) * lineHeight);
    for (const line of lines) {
      this.ensure(lineHeight);
      this.style(size, color);
      this.write(line, this.left + indent, this.y);
      if (url && line) this.doc.link(this.left + indent, this.y - size * 0.352778, this.doc.getTextWidth(line), lineHeight, { url });
      this.y += lineHeight;
    }
    this.gap(gap);
  }
  heading(value: string, size = 15) {
    this.ensure(18);
    this.paragraph(value, { size, color: ACCENT, gap: 4 });
  }
  label(value: string) { this.paragraph(value, { size: 8, color: MUTED, gap: 2 }); }
  rule() {
    this.ensure(6); this.doc.setDrawColor('#D9E3DC'); this.doc.setLineWidth(0.25);
    this.doc.line(this.left, this.y, this.left + this.width, this.y); this.gap(5);
  }
  finish() {
    const count = this.doc.getNumberOfPages();
    for (let page = 1; page <= count; page++) {
      this.doc.setPage(page);
      this.style(8, MUTED);
      this.write('FREQ', this.left, 15);
      // Headers have the same width guarantees as body paragraphs.
      const header = this.wrap(this.header, this.width - 22, 7.5)[0];
      this.style(7.5, MUTED); this.write(header, this.left + 22, 15);
      this.doc.setDrawColor('#D9E3DC'); this.doc.line(this.left, 20, this.left + this.width, 20);
      this.style(7, MUTED); this.write(this.footer, this.left, 286);
      this.write(`${page}/${count}`, this.left + this.width - this.doc.getTextWidth(`${page}/${count}`), 286);
    }
    return count;
  }
}

/** A local, read-only PDF snapshot with embedded, selectable Turkish/English text. */
export async function createReportPdf(report: ProgressReport, locale: Locale, options: ReportPdfOptions = {}): Promise<ReportPdf> {
  const font = options.fontBytes ? Uint8Array.from(options.fontBytes) : undefined;
  const [module, fontBytes] = await Promise.all([import('jspdf'), font ? verifyReportFont(font).then(() => font) : loadReportFont()]);
  const doc = new module.jsPDF({ format: 'a4', unit: 'mm', compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS(FONT_FILE, binaryFont(fontBytes));
  doc.addFont(FONT_FILE, FONT_NAME, 'normal');
  doc.setFont(FONT_NAME, 'normal');
  if (doc.getFont().fontName !== FONT_NAME || !doc.getFont().metadata?.Unicode) throw new Error('The report font could not be embedded.');

  const t = (tr: string, en: string) => locale === 'tr' ? tr : en;
  const tr = (value: Text) => tx(value, locale);
  const title = t('Çalışma ve ilerleme raporu', 'Practice and progress report');
  const date = (at: number, withTime = false) => reportDate(at, locale, report.timeZone, withTime);
  const number = (value: number) => new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-GB').format(value);
  const path = tr(reportPathLabel(report.path)), period = tr(reportPeriodLabel(report.period));
  doc.setProperties({ title: `Freq · ${title}`, subject: `${path} · ${period}`, author: 'Freq', creator: 'Freq · local progress report', keywords: 'Freq, practice, progress, listening' });
  doc.setLanguage(locale === 'tr' ? 'tr' : 'en-GB');
  doc.setCreationDate(new Date(report.generatedAt));
  const layout = new ReportLayout(doc, title, `${date(report.generatedAt)} · ${report.timeZone}`);
  const p = (value: string, options?: ParagraphOptions) => layout.paragraph(value, options);
  const label = (trLabel: string, enLabel: string, value: string) => p(`${t(trLabel, enLabel)}: ${value}`);
  const countAccuracy = (correct: number, count: number, accuracy: number | null) => `${number(correct)}/${number(count)} · ${percentage(accuracy)}`;
  const stage = (lessonId: string) => { const lesson = getLesson(lessonId); return `${t('Aşama', 'Stage')} ${lesson.level} · ${tr(lesson.title)} (${lesson.id})`; };

  layout.label(t('KAYITLI ÇALIŞMA · KİŞİSEL YOL HARİTASI', 'RECORDED PRACTICE · PERSONAL STUDY PLAN'));
  layout.gap(4);
  layout.heading(title, 26);
  p(reportSummaryNote(report, locale), { size: 11, gap: 6 });
  if (options.recordNotice) {
    layout.heading(t('Kayıt durumu', 'Record status'), 11);
    p(tr(options.recordNotice), { size: 10, color: '#7B5029', gap: 5 });
  }
  label('Oluşturulma', 'Generated', date(report.generatedAt, true));
  label('Çalışma yolu', 'Study path', path);
  label('Dönem', 'Period', period);
  label('Tarih aralığı', 'Date range', report.range.startAt === null ? `${t('Başlangıçtan', 'From the beginning')} → ${date(report.range.endAt)}` : `${date(report.range.startAt)} → ${date(report.range.endAt)}`);
  label('Saat dilimi', 'Time zone', report.timeZone);
  layout.gap(4);

  const metrics = [
    [number(report.summary.practiceCount), t('Normal pratik yanıtı', 'Ordinary practice answers')],
    [percentage(report.summary.practiceAccuracy), t('Pratik doğruluğu', 'Practice accuracy')],
    [number(report.summary.completedSessions), t('Tamamlanan pratik oturumu', 'Completed practice sessions')],
    [number(report.summary.activeDays), t('Kayıtlı etkin gün', 'Recorded active days')],
  ];
  layout.ensure(48);
  const top = layout.y, cellWidth = (layout.width - 5) / 2;
  metrics.forEach(([value, caption], index) => {
    const x = layout.left + (index % 2) * (cellWidth + 5), y = top + Math.floor(index / 2) * 25;
    doc.setFillColor(PALE); doc.roundedRect(x, y - 4, cellWidth, 22, 2, 2, 'F');
    layout.boundedText(value, x + 4, y + 4, cellWidth - 8, 17, ACCENT);
    layout.boundedText(caption, x + 4, y + 11, cellWidth - 8, 8, MUTED);
  });
  layout.y = top + 49;
  p(`${t('Doğru pratik yanıtı', 'Correct practice answers')}: ${number(report.summary.practiceCorrect)} · ${t('Kısmi oturum', 'Partial sessions')}: ${number(report.summary.partialSessions)} · ${t('Atlanan kişisel yanıt', 'Skipped personal answers')}: ${number(report.summary.skippedPersonalResponses)}`);
  p(`${t('Yeniden kurulabilir farklı soru', 'Reconstructable distinct questions')}: ${number(report.summary.independentLogicalCount)} · ${t('Farklı duyulan örnek', 'Audibly different examples')}: ${number(report.summary.distinctSounds)} · ${t('Eski, yeniden kurulamayan yanıt', 'Legacy non-reconstructable answers')}: ${number(report.summary.legacyCount)}`);
  p(`${t('Gözlenen beceri', 'Observed skills')}: ${number(report.summary.assessedSkills)}/${number(report.summary.supportedSkills)}. ${t('Örnek sayısı ve ses çeşitliliği aynı ölçü değildir; az veri güçlü bir sonuç desteklemez.', 'Sample count and sound variety are different measures; sparse evidence does not support a strong conclusion.')}`, { color: MUTED });

  const references = new Map<string, { resource: LearningResource; index: number }>();
  const reference = (resource: LearningResource) => {
    if (!references.has(resource.url)) references.set(resource.url, { resource, index: references.size + 1 });
    return references.get(resource.url)!.index;
  };
  layout.newPage();
  layout.heading(t('Öncelikler ve nasıl çalışmalı', 'Priorities and how to practise'));
  p(t('Her öneri kayıtlı kanıta dayanır. Aynı aşamada yeni sesler ve ayrı oturumlarla çalış; aşama önerisi genel yetenek puanı değildir.', 'Each suggestion is grounded in saved evidence. Work with fresh sounds and separate sessions at the same stage; a stage suggestion is not an overall aptitude score.'), { color: MUTED });
  if (!report.priorities.length) p(t('Bu çalışma yolu için henüz bir öncelik önerisi yok.', 'There are no suggested priorities for this study path yet.'));
  for (const [index, priority] of report.priorities.slice(0, 3).entries()) {
    const guide = studyGuides[priority.skill];
    layout.ensure(35);
    layout.heading(`${index + 1}. ${tr(skillNames[priority.skill])}`, 13);
    layout.label(`${t('Önerilen ders', 'Suggested lesson')}: ${stage(priority.lessonId)}`);
    label('Kanıt', 'Evidence', tr(priority.evidence));
    label('Sonraki hedef', 'Next goal', tr(priority.nextGoal));
    label('Dinleme ipucu', 'Listening cue', tr(guide.cue));
    for (const [stepIndex, step] of guide.steps.entries()) p(`${stepIndex + 1}. ${tr(step)}`, { indent: 3 });
    label('Kısa oturum', 'Short session', tr(guide.session));
    label('Gerçek bağlama aktar', 'Transfer to a real context', tr(guide.transfer));
    label('Yeni örnekle kontrol', 'Fresh-example check', tr(guide.freshCheck));
    const resources = resourcesForSkill(priority.skill);
    if (resources.length) {
      layout.label(t('BU ODAK İÇİN KAYNAKLAR', 'RESOURCES FOR THIS FOCUS'));
      for (const resource of resources) {
        const ref = reference(resource);
        p(`[${ref}] ${tr(resource.title)} · ${tr(resourceCost(resource))} · ${tr(resourceLanguage(resource))}`, { color: ACCENT, url: resource.url });
        p(tr(resource.description), { size: 9, indent: 3 });
      }
    }
    layout.rule();
  }

  layout.newPage();
  layout.heading(t('7 günlük çalışma planı', '7-day study plan'));
  p(t('Günde 5–8 dakikalık kısa bir çalışma önerisi. Takvim bir başlangıçtır; yorgunluk ve programına göre günleri kaydır.', 'A short 5–8 minute daily suggestion. This schedule is a starting point; move days to suit your energy and commitments.'), { color: MUTED });
  const week = studyWeek(report);
  if (!week.length) p(t('Bir konu seçerek ilk kısa çalışmanı başlat.', 'Choose a topic to begin your first short practice.'));
  for (const day of week) {
    layout.ensure(22);
    layout.heading(`${t('Gün', 'Day')} ${day.day} · ${tr(day.title)}`, 11);
    if (day.skill) layout.label(`${tr(skillNames[day.skill])}${day.lessonId ? ` · ${stage(day.lessonId)}` : ''}`);
    p(tr(day.detail));
  }

  layout.newPage();
  layout.heading(t('Beceri bazında kayıtlı kanıt', 'Saved evidence by skill'));
  p(t('Yanıt sayıları seçilen döneme aittir. Aşama önerileri ve bekleyen tekrarlar rapor anına kadar bütün geçmişi kullanır. Farklı soru, duyulan ses çeşitliliği ve eski yanıtlar ayrı gösterilir.', 'Answer counts cover the selected period. Stage suggestions and pending reviews use all history through the report time. Distinct questions, audible sound variety and legacy answers are shown separately.'), { color: MUTED });
  const describeSkill = (row: ReportSkill) => {
    layout.ensure(40);
    layout.heading(tr(skillNames[row.skill]), 12);
    layout.label(`${t('Önerilen', 'Suggested')}: ${stage(row.lessonId)} · ${t('Ders yolu', 'Lesson path')}: ${tr(reportPathLabel(row.path))}`);
    p(`${t('Pratik doğru/yanıt', 'Practice correct/answers')}: ${countAccuracy(row.correct, row.practiceCount, row.accuracy)} · ${t('Oturum', 'Sessions')}: ${number(row.sessionCount)}`);
    p(`${t('Farklı soru', 'Distinct questions')}: ${number(row.independentLogicalCount)} · ${t('Farklı duyulan örnek', 'Audibly different examples')}: ${number(row.distinctSounds)} · ${t('Eski yanıt', 'Legacy answers')}: ${number(row.legacyCount)}`);
    p(`${t('Tekrar doğru/yanıt', 'Review correct/answers')}: ${countAccuracy(row.reviewCorrect, row.reviewCount, row.reviewAccuracy)} · ${t('Zamanı gelen/açık', 'Due/open')}: ${number(row.dueCount)}/${number(row.openCount)}`);
    p(`${t('İlk/güncel aşama önerisi', 'First/current stage suggestion')}: ${row.firstSuggestedLevel}/${row.currentSuggestedLevel} · ${t('İçerikteki son aşama', 'Last content stage')}: ${row.maxLevel}`);
    p(tr(row.estimateExplanation), { size: 9, color: MUTED });
    const trend = row.trend;
    if (trend.status === 'available') {
      const delta = trend.deltaPoints!;
      p(`${t('Karşılaştırılabilir değişim', 'Comparable change')}: ${percentage(trend.previousAccuracy)} (n=${trend.previousCount}) → ${percentage(trend.recentAccuracy)} (n=${trend.recentCount}); ${delta > 0 ? '+' : ''}${delta} ${t('yüzde puan', 'percentage points')}.`);
    } else p(`${t('Karşılaştırılabilir değişim', 'Comparable change')}: ${t('Veri yetersiz', 'Insufficient evidence')} (n=${trend.previousCount}/${trend.recentCount}).`);
    if (trend.lessonId && trend.path) p(`${t('Eşleşen kapsam', 'Matched scope')}: ${stage(trend.lessonId)} · ${tr(reportPathLabel(trend.path))} · ${trend.source ? tr(eqSources[trend.source].title) : t('Kaynak seçimi olmayan nota/ritim görevi', 'Pitch/rhythm task without a source selector')}`, { size: 9 });
    p(tr(trend.reason), { size: 9, color: MUTED });
    layout.rule();
  };
  report.skills.slice(0, 20).forEach(describeSkill);
  if (!report.skills.length) p(t('Bu çalışma yolunda kayıtlı beceri satırı yok.', 'No skill rows are available for this study path.'));
  if (report.skills.length > 20) p(t('PDF ilk 20 beceriyi gösterir. Tam liste uygulamadaki rapordadır.', 'The PDF shows the first 20 skills. The complete list is in the app report.'), { color: MUTED });

  layout.newPage();
  layout.heading(t('Ayrı ölçümler ve etkinlik', 'Separate measures and activity'));
  layout.heading(t('Hata tekrarları', 'Error reviews'), 12);
  label('Doğru/yanıt', 'Correct/answers', countAccuracy(report.review.correct, report.review.count, report.review.accuracy));
  label('Zamanı gelen/açık tekrar', 'Due/open reviews', `${number(report.review.dueCount)}/${number(report.review.openCount)}`);
  p(t('Tekrar yanıtları normal pratik yüzdesine eklenmez. Bir eski soruyu hatırlamak yeni bir sesi tanımakla aynı değildir.', 'Review answers are excluded from ordinary practice accuracy. Remembering an old question is different from recognising a fresh sound.'), { color: MUTED });
  layout.heading(t('Başlangıç değerlendirmesi', 'Placement'), 12);
  label('Doğru/yanıt', 'Correct/answers', countAccuracy(report.placement.correct, report.placement.count, report.placement.accuracy));
  label('Tamamlanan/kısmi oturum', 'Completed/partial sessions', `${number(report.placement.completedSessions)}/${number(report.placement.partialSessions)}`);
  label('Atlanan yanıt', 'Skipped answers', number(report.placement.skippedCount));
  layout.heading(t('Süreli denemeler', 'Timed mocks'), 12);
  label('Tamamlanan/erken biten/süresi dolan', 'Completed/ended/expired', `${number(report.exam.completedCount)}/${number(report.exam.endedCount)}/${number(report.exam.expiredCount)}`);
  label('Doğru/yanıt', 'Correct/answers', countAccuracy(report.exam.correct, report.exam.questionCount, report.exam.accuracy));
  label('Etkin deneme', 'Active mock', report.exam.active ? t('Evet; bitmemiş deneme sonuçlara eklenmez', 'Yes; an unfinished mock is excluded from results') : t('Yok', 'None'));
  for (const result of [...report.exam.results].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 5)) {
    const profile = getExamProfile(result.profileId);
    const reason = result.reason === 'completed' ? t('Tamamlandı', 'Completed') : result.reason === 'expired' ? t('Süre doldu', 'Expired') : t('Erken bitirildi', 'Ended early');
    p(`${date(result.finishedAt)} · ${profile ? tr(profile.title) : result.profileId} · ${t('Düzey', 'Level')} ${result.level} · ${reason}. ${t('Doğru/yanıt', 'Correct/answers')}: ${countAccuracy(result.correct, result.answered, result.accuracy)} · ${t('Atlanan', 'Skipped')}: ${result.skipped} · ${t('Toplam soru', 'Total questions')}: ${result.total}`, { size: 9 });
  }
  if (report.exam.results.length > 5) p(t('Son beş deneme gösterilir; yukarıdaki toplamlar seçilen dönemin tüm denemelerini kapsar.', 'The five latest mocks are shown; totals above include all mocks in the selected period.'), { size: 9, color: MUTED });
  layout.heading(t('İcra öz değerlendirmesi', 'Performance self-assessment'), 12);
  label('Öz değerlendirme kaydı', 'Self-assessment records', number(report.exam.selfAssessment.count));
  label('İşaretlenen/toplam kontrol', 'Checked/total checks', `${number(report.exam.selfAssessment.checked)}/${number(report.exam.selfAssessment.totalChecks)}`);
  p(t('Bunlar kişinin kendi kontrol işaretleridir; otomatik icra veya jüri puanı değildir. Söyleme ve icrada öğretmen geri bildirimi kullan.', 'These are the learner’s own check marks, not automatic performance or jury scores. Use teacher feedback for singing and performance.'), { color: MUTED });

  if (report.daily.length) {
    layout.heading(t('Günlük etkinlik özeti', 'Daily activity summary'), 12);
    p(t('En son 14 etkin gün; önceki kayıtlar toplamların içindedir. Her satır bir günlük toplamdır.', 'The latest 14 active days; earlier records remain in the totals. Each row is a daily aggregate.'), { size: 9, color: MUTED });
    for (const day of [...report.daily].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14)) {
      // Date-only keys are already local calendar dates; do not shift them through UTC.
      p(`${day.date} · ${t('Pratik', 'Practice')} ${day.correct}/${day.practiceCount} · ${t('Tekrar', 'Reviews')} ${day.reviewCorrect}/${day.reviewCount} · ${t('Başlangıç', 'Placement')} ${day.placementCount} · ${t('Atlanan', 'Skipped')} ${day.skippedCount} · ${t('Oturum tam/kısmi', 'Sessions complete/partial')} ${day.completedSessions}/${day.partialSessions} · ${t('Deneme', 'Mocks')} ${day.mockCount} · ${t('Öz değerlendirme', 'Self-assessments')} ${day.selfAssessmentCount}`, { size: 8.5 });
    }
  }

  layout.newPage();
  layout.heading(t('Yöntem ve yorum sınırları', 'Methods and interpretation limits'));
  reportLimits.forEach(value => p(`• ${tr(value)}`));
  p(t('Aşama tahmini içerik düzeyinde bir çalışma önerisidir. Eski yanıtlardan yeni ses çeşitliliği veya yeniden kurulabilir soru uydurulmaz. Bir önceki aşama önerisiyle bugünkünü karşılaştırmak tek başına gelişim kanıtı değildir.', 'Stage estimates are study suggestions within the content. Legacy answers do not invent sound variety or reconstructable questions. Comparing the first stage suggestion with today’s suggestion alone is not evidence of improvement.'), { color: MUTED });
  p(t('Kaynaklar yalnız öğrenme amacıyla seçilmiştir. Dış kaynak kullanımı bu raporun pratik istatistiklerine otomatik eklenmez. Ücretli seçenekler isteğe bağlıdır; PDF üretimi ücretsizdir.', 'Resources are selected for learning. External resource use is not automatically added to these practice statistics. Paid options are optional; PDF generation is free.'), { color: MUTED });
  if (references.size) {
    layout.heading(t('Kaynak bağlantıları', 'Resource references'));
    p(t('Bağlantılar tıklanabilir; bağlantıyı açmak internet gerektirebilir. Erişim, dil ve fiyat bilgileri belirtilen inceleme tarihi içindir.', 'Links are clickable; opening them may require internet. Access, language and cost information is dated to the stated review.'), { color: MUTED });
    for (const { resource, index } of references.values()) {
      layout.ensure(28);
      p(`[${index}] ${tr(resource.title)}`, { size: 10, color: ACCENT, url: resource.url });
      p(`${resource.author} · ${tr(resourceKind(resource))} · ${tr(resourceLanguage(resource))} · ${tr(resourceCost(resource))} · ${t('Kaynak inceleme tarihi', 'Source reviewed')}: ${resource.sourceChecked}`, { size: 8.5 });
      p(resource.url, { size: 8.5, color: ACCENT, url: resource.url });
      if (resource.note) p(tr(resource.note), { size: 8.5, color: MUTED });
      layout.gap(3);
    }
  }
  const pages = layout.finish();
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  // jsPDF catches plug-in errors internally. Require the completed embedded Unicode
  // font objects so a swallowed font-output error can never become a download.
  const serialized = binaryFont(bytes);
  if (!/\/ToUnicode \d+ 0 R/u.test(serialized) || !/\/FontFile2 \d+ 0 R/u.test(serialized) || !serialized.includes('/Subtype /Type0')) throw new Error('The report PDF could not be generated completely.');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: report.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(report.generatedAt);
  const part = (name: string) => parts.find(value => value.type === name)!.value;
  return { bytes, pages, filename: `freq-report-${part('year')}-${part('month')}-${part('day')}-${report.path}-${locale}.pdf` };
}
