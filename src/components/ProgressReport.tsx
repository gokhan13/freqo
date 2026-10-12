import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Download,
  FileText,
  RefreshCw,
  Target,
} from 'lucide-react';
import {
  eqSources,
  getLesson,
  paths,
  skillNames,
  text,
  tx,
  type Locale,
  type Text,
} from '../content';
import type { Progress } from '../model';
import {
  buildProgressReport,
  type ProgressReport as Report,
  type ReportPath,
  type ReportPeriod,
} from '../report-model';
import { learningResources, studyGuides } from '../report-resources';
import { Resource } from './StudyResources';
import {
  percentage,
  reportDate,
  reportLimits,
  reportPathLabel,
  reportPeriodLabel,
  reportSummaryNote,
  resourcesForSkill,
  studyWeek,
} from '../report-presentation';

type Props = {
  progress: Progress;
  locale: Locale;
  recordNotice?: Text;
  onBack: () => void;
  onPractice: (id: string) => void;
  onPersonal: (path: ReportPath) => void;
  onLab: () => void;
  onExam: () => void;
};

function ActivityChart({ report, locale }: { report: Report; locale: Locale }) {
  const t = (v: Text) => tx(v, locale),
    days = report.daily.slice(-7);
  const maximum = Math.max(1, ...days.map(d => d.practiceCount + d.reviewCount));
  return (
    <section className="report-panel" aria-labelledby="report-activity-title">
      <div className="report-section-title">
        <h2 id="report-activity-title">{t(text('Çalışma ritmin', 'Your practice rhythm'))}</h2>
        <span>
          {report.summary.activeDays} {t(text('kayıtlı gün', 'recorded days'))}
        </span>
      </div>
      <p className="small-copy">
        {t(
          text(
            'Son 7 kayıtlı gündeki normal pratik ve hata tekrarları. Bu grafik çalışma miktarıdır; yetenek veya gelişim yüzdesi değildir.',
            'Ordinary practice and error reviews on the last 7 recorded days. This chart shows practice volume, not aptitude or a growth percentage.',
          ),
        )}
      </p>
      {days.length ? (
        <>
          <div
            className="report-chart"
            role="img"
            aria-label={t(
              text(
                'Kayıtlı günlere göre normal pratik ve hata tekrarı sayıları; değerler aşağıdaki tabloda da var.',
                'Ordinary practice and error-review counts by recorded day; the values are also available in the table below.',
              ),
            )}
          >
            {days.map(d => (
              <div className="report-chart-column" key={d.date}>
                <span>{d.practiceCount + d.reviewCount}</span>
                <div className="report-chart-space">
                  <div
                    className="report-chart-stack"
                    style={{ height: `${((d.practiceCount + d.reviewCount) / maximum) * 128}px` }}
                  >
                    <div
                      className="report-chart-review"
                      style={{
                        height: `${(d.reviewCount / Math.max(1, d.practiceCount + d.reviewCount)) * 100}%`,
                      }}
                    />
                    <div
                      className="report-chart-practice"
                      style={{
                        height: `${(d.practiceCount / Math.max(1, d.practiceCount + d.reviewCount)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span>{d.date.slice(5).replace('-', '/')}</span>
              </div>
            ))}
          </div>
          <div className="report-chart-legend">
            <span>
              <i />
              {t(text('Normal pratik', 'Ordinary practice'))}
            </span>
            <span>
              <i />
              {t(text('Hata tekrarı', 'Error review'))}
            </span>
          </div>
          <details className="report-details">
            <summary>{t(text('Grafik değerlerini oku', 'Read the chart values'))}</summary>
            <div className="report-table-scroll">
              <table>
                <caption className="sr-only">
                  {t(text('Son kayıtlı günlerin yanıtları', 'Answers on the latest recorded days'))}
                </caption>
                <thead>
                  <tr>
                    <th>{t(text('Gün', 'Day'))}</th>
                    <th>{t(text('Normal pratik', 'Practice'))}</th>
                    <th>{t(text('Hata tekrarı', 'Reviews'))}</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map(d => (
                    <tr key={d.date}>
                      <th scope="row">{d.date}</th>
                      <td>{d.practiceCount}</td>
                      <td>{d.reviewCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p>
          {t(
            text(
              'Seçilen dönemde kayıtlı çalışma günü yok. İlk ders veya başlangıç değerlendirmesiyle başlayabilirsin.',
              'There are no recorded study days in this period. Start with a lesson or placement assessment.',
            ),
          )}
        </p>
      )}
    </section>
  );
}

export function ProgressReport({
  progress,
  locale,
  recordNotice,
  onBack,
  onPractice,
  onPersonal,
  onLab,
  onExam,
}: Props) {
  const [path, setPath] = useState<ReportPath>(progress.path),
    [period, setPeriod] = useState<ReportPeriod>('all');
  const [now, setNow] = useState(Date.now),
    [busy, setBusy] = useState(false),
    [pdfState, setPdfState] = useState<'idle' | 'done' | 'error'>('idle');
  const mounted = useRef(true),
    working = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    setNow(Date.now());
  }, [progress]);
  const report = useMemo(
    () => buildProgressReport(progress, { path, period, now, timeZone: 'Europe/Istanbul' }),
    [progress, path, period, now],
  );
  const week = useMemo(() => studyWeek(report), [report]);
  const t = (v: Text) => tx(v, locale);
  const books = learningResources.filter(
    r => r.kind === 'book' && (path === 'all' || r.paths.includes(path)),
  );
  const refresh = () => {
    setNow(Date.now());
    setPdfState('idle');
  };
  const download = async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setPdfState('idle');
    const snapshot = buildProgressReport(progress, {
      path,
      period,
      now: Date.now(),
      timeZone: report.timeZone,
    });
    const language = locale;
    try {
      const { createReportPdf } = await import('../report-pdf');
      const result = await createReportPdf(snapshot, language, { recordNotice });
      if (!mounted.current) return;
      const url = URL.createObjectURL(
        new Blob([Uint8Array.from(result.bytes).buffer], { type: 'application/pdf' }),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setNow(snapshot.generatedAt);
      setPdfState('done');
    } catch {
      if (mounted.current) setPdfState('error');
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const severity = {
    focus: text('Önce destekli çalış', 'Start with guided work'),
    consolidate: text('Pekiştir', 'Consolidate'),
    explore: text('Yeni kanıt topla', 'Gather fresh evidence'),
  };

  return (
    <section
      className="progress-report"
      aria-label={t(text('Gelişim ve çalışma raporu', 'Progress and study report'))}
    >
      <button className="text-button back-link" onClick={onBack}>
        <ArrowLeft size={17} />
        {t(text('Becerilerime dön', 'Back to my skills'))}
      </button>
      <div className="report-heading">
        <div>
          <span className="eyebrow">
            <FileText size={16} />
            {t(text('GELİŞİMİN VE SONRAKİ ADIMIN', 'YOUR PROGRESS AND NEXT STEP'))}
          </span>
          <h1>{t(text('Gelişim raporun', 'Your progress report'))}</h1>
          <p className="lead">
            {t(
              text(
                'Neler çalıştığını gör. Kanıta göre en fazla üç odak seç, yöntemi öğren ve yeni örneklerle kontrol et.',
                'See what you have practised. Choose up to three evidence-based priorities, learn the method and check with fresh examples.',
              ),
            )}
          </p>
        </div>
        <button className="button" disabled={busy} onClick={() => void download()}>
          <Download size={18} />
          {t(
            busy
              ? text('PDF hazırlanıyor…', 'Preparing PDF…')
              : text('PDF olarak indir', 'Download PDF'),
          )}
        </button>
      </div>
      <div className="report-filters">
        <label>
          {t(text('Rapor yolu', 'Report path'))}
          <select
            value={path}
            disabled={busy}
            onChange={e => {
              setPath(e.target.value as ReportPath);
              refresh();
            }}
          >
            {(['all', 'mix', 'music', 'exam'] as ReportPath[]).map(p => (
              <option value={p} key={p}>
                {t(reportPathLabel(p))}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t(text('Rapor dönemi', 'Report period'))}
          <select
            value={period}
            disabled={busy}
            onChange={e => {
              setPeriod(e.target.value as ReportPeriod);
              refresh();
            }}
          >
            {(['all', '30d', '7d'] as ReportPeriod[]).map(p => (
              <option value={p} key={p}>
                {t(reportPeriodLabel(p))}
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary" onClick={refresh} disabled={busy}>
          <RefreshCw size={16} />
          {t(text('Raporu yenile', 'Refresh report'))}
        </button>
      </div>
      <p className="report-metadata">
        {reportDate(report.generatedAt, locale, report.timeZone, true)} · {report.timeZone} ·{' '}
        {t(
          text(
            'Bu sürümde ücretsiz · cihazında hazırlanır',
            'Free in this edition · generated on your device',
          ),
        )}
      </p>
      <div aria-live="polite" aria-atomic="true">
        {busy && (
          <p className="notice" role="status">
            {t(
              text(
                'Rapor ve Türkçe karakterleri destekleyen PDF hazırlanıyor.',
                'Preparing the report and a PDF with Unicode text support.',
              ),
            )}
          </p>
        )}
        {pdfState === 'done' && (
          <p className="notice" role="status">
            <Check size={16} />
            {t(
              text(
                'PDF hazır; indirme başlatıldı. Tarayıcının indirmeler bölümünden açabilirsin.',
                'The PDF is ready and the download has started. Open it from your browser’s downloads.',
              ),
            )}
          </p>
        )}
      </div>
      {pdfState === 'error' && (
        <div className="notice report-error" role="alert">
          <p>
            {t(
              text(
                'PDF hazırlanamadı; rapor ve kayıtların korunuyor. Yeniden dene. İlk çevrimdışı kullanım için uygulamanın çevrimiçi kurulumunu tamamla.',
                'The PDF could not be prepared; your report and records are preserved. Retry. Complete the app’s online installation before first offline use.',
              ),
            )}
          </p>
          <button className="button secondary" onClick={() => void download()} disabled={busy}>
            {t(text('PDF’yi yeniden dene', 'Retry PDF'))}
          </button>
        </div>
      )}

      {recordNotice && (
        <p className="notice report-record-notice" role="status">
          {t(recordNotice)}
        </p>
      )}
      <div className="report-summary" aria-label={t(text('Çalışma özeti', 'Practice summary'))}>
        <article>
          <span>{t(text('Normal pratik yanıtı', 'Ordinary practice answers'))}</span>
          <strong>{report.summary.practiceCount}</strong>
          <small>
            {report.summary.practiceCorrect} {t(text('doğru', 'correct'))}
          </small>
        </article>
        <article>
          <span>{t(text('Tekrar hariç doğruluk', 'Accuracy excluding reviews'))}</span>
          <strong>{percentage(report.summary.practiceAccuracy)}</strong>
          <small>{t(text('Genel yetenek puanı değildir', 'Not an overall aptitude score'))}</small>
        </article>
        <article>
          <span>{t(text('Tamamlanan çalışma', 'Completed study sessions'))}</span>
          <strong>{report.summary.completedSessions}</strong>
          <small>
            {report.summary.partialSessions} {t(text('yarım / sonlandırılmış', 'partial / ended'))}
          </small>
        </article>
        <article>
          <span>{t(text('Duyulan farklı örnek', 'Distinct audible examples'))}</span>
          <strong>{report.summary.distinctSounds}</strong>
          <small>
            {report.summary.legacyCount}{' '}
            {t(text('eski kayıtta ses detayı yok', 'legacy answers lack sound details'))}
          </small>
        </article>
      </div>
      <p className="report-interpretation">{reportSummaryNote(report, locale)}</p>
      <ActivityChart report={report} locale={locale} />

      <section className="report-priorities" aria-labelledby="report-priority-title">
        <div className="report-section-title">
          <h2 id="report-priority-title">
            {t(text('Şimdi neye yoğunlaşmalısın?', 'What should you focus on next?'))}
          </h2>
          <span>{t(text('En fazla 3 odak', 'Up to 3 priorities'))}</span>
        </div>
        {report.priorities.map((priority, index) => {
          const guide = studyGuides[priority.skill],
            row = report.skills.find(s => s.skill === priority.skill)!,
            resources = resourcesForSkill(priority.skill);
          return (
            <article className="report-priority report-panel" key={priority.skill}>
              <div className="report-priority-heading">
                <span className="report-priority-number">0{index + 1}</span>
                <div>
                  <span className="eyebrow">{t(severity[priority.severity])}</span>
                  <h3>{t(skillNames[priority.skill])}</h3>
                  <p className="small-copy">
                    {t(text('Önerilen aşama', 'Suggested stage'))} {row.level}
                    {row.maxLevel > 1 && ` / ${row.maxLevel}`}
                  </p>
                </div>
                <Target size={21} aria-hidden="true" />
              </div>
              <p>{t(priority.evidence)}</p>
              <p className="report-goal">
                <strong>{t(text('Bir sonraki hedef', 'Next goal'))}:</strong> {t(priority.nextGoal)}
              </p>
              <div className="report-priority-actions">
                <button className="button secondary" onClick={() => onPractice(priority.lessonId)}>
                  {t(text('Önerilen dersi çalış', 'Practise the suggested lesson'))}
                  <ArrowRight size={16} />
                </button>
                <button className="text-button" onClick={() => onPersonal(path)}>
                  {t(text('Kişisel plana git', 'Open personal plan'))}
                </button>
              </div>
              <details className="report-details" open={index === 0}>
                <summary>{t(text('Nasıl çalışmalı?', 'How should you practise?'))}</summary>
                <p className="report-cue">
                  <strong>{t(text('Dinleme ipucu', 'Listening cue'))}:</strong> {t(guide.cue)}
                </p>
                <ol className="report-techniques">
                  {guide.steps.map((step, i) => (
                    <li key={i}>{t(step)}</li>
                  ))}
                </ol>
                <p>
                  <strong>{t(text('Kısa oturum', 'Short session'))}:</strong> {t(guide.session)}
                </p>
                <p>
                  <strong>{t(text('Gerçek bağlamda dene', 'Try a real context'))}:</strong>{' '}
                  {t(guide.transfer)}
                </p>
                <p>
                  <strong>{t(text('Yeni örnekle kontrol', 'Fresh-example check'))}:</strong>{' '}
                  {t(guide.freshCheck)}
                </p>
                {resources.length > 0 && (
                  <>
                    <h4>
                      <BookOpen size={16} />
                      {t(text('Bu odak için kaynaklar', 'Resources for this priority'))}
                    </h4>
                    <p className="small-copy">
                      {t(
                        text(
                          'Türkçe öncelikli; uygun kaynak yoksa İngilizce. Ücretli kitap isteğe bağlıdır.',
                          'Turkish first, with English alternatives where needed. Paid books are optional.',
                        ),
                      )}
                    </p>
                    <ul className="report-resources">
                      {resources.map(r => (
                        <Resource key={r.id} resource={r} locale={locale} />
                      ))}
                    </ul>
                  </>
                )}
              </details>
            </article>
          );
        })}
      </section>

      <section className="report-panel" aria-labelledby="report-week-title">
        <h2 id="report-week-title">
          {t(text('Esnek 7 günlük çalışma planı', 'A flexible 7-day study plan'))}
        </h2>
        <p className="small-copy">
          {t(
            text(
              'Bu bir son teslim takvimi değildir. Günleri programına göre yay; kısa oturumlar ve mola kullan. Kaynakları izlemek tek başına yanıt kaydı oluşturmaz.',
              'This is not a deadline schedule. Spread the days around your routine; use short sessions and breaks. Watching resources alone does not create practice answers.',
            ),
          )}
        </p>
        <ol className="report-week">
          {week.map(day => (
            <li key={day.day}>
              <span className="eyebrow">
                {t(text('GÜN', 'DAY'))} {day.day}
              </span>
              <h3>{t(day.title)}</h3>
              {day.skill && <span className="small-copy">{t(skillNames[day.skill])}</span>}
              <p>{t(day.detail)}</p>
              {day.action === 'lesson' && day.lessonId && (
                <button className="text-button" onClick={() => onPractice(day.lessonId!)}>
                  {t(text('Dersi aç', 'Open lesson'))}
                  <ArrowRight size={15} />
                </button>
              )}
              {day.action === 'personal' && (
                <button className="text-button" onClick={() => onPersonal(path)}>
                  {t(text('Kişisel plana git', 'Open personal plan'))}
                  <ArrowRight size={15} />
                </button>
              )}
              {day.action === 'lab' && (
                <button className="text-button" onClick={onLab}>
                  {t(text('Laboratuvarı aç', 'Open the lab'))}
                  <ArrowRight size={15} />
                </button>
              )}
              {day.action === 'exam' && (
                <button className="text-button" onClick={onExam}>
                  {t(text('Sınav atölyesini aç', 'Open audition studio'))}
                  <ArrowRight size={15} />
                </button>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="report-panel report-separated" aria-labelledby="report-review-title">
        <h2 id="report-review-title">
          {t(text('Tekrar ve değerlendirme kayıtların', 'Your review and assessment records'))}
        </h2>
        <div className="report-record-grid">
          <article>
            <h3>{t(text('Hata tekrarları', 'Error reviews'))}</h3>
            <strong>
              {report.review.count} {t(text('yanıt', 'answers'))} ·{' '}
              {percentage(report.review.accuracy)}
            </strong>
            <p>
              {report.review.dueCount} {t(text('zamanı geldi', 'due'))} · {report.review.openCount}{' '}
              {t(text('takipte', 'open'))}
            </p>
          </article>
          <article>
            <h3>{t(text('Başlangıç değerlendirmesi', 'Placement assessment'))}</h3>
            <strong>
              {report.placement.correct}/{report.placement.count} {t(text('doğru', 'correct'))}
            </strong>
            <p>
              {report.placement.completedSessions} {t(text('tamamlandı', 'completed'))} ·{' '}
              {report.placement.skippedCount} {t(text('geçilen soru', 'skipped questions'))}
            </p>
          </article>
          <article>
            <h3>{t(text('Süreli denemeler', 'Timed mocks'))}</h3>
            <strong>
              {report.exam.results.length} {t(text('deneme', 'mocks'))} ·{' '}
              {percentage(report.exam.accuracy)}
            </strong>
            <p>
              {report.exam.completedCount} {t(text('tamamlandı', 'completed'))} ·{' '}
              {report.exam.expiredCount} {t(text('süre doldu', 'expired'))} ·{' '}
              {report.exam.endedCount} {t(text('sonlandırıldı', 'ended'))}
            </p>
            {report.exam.active && (
              <span className="small-copy">
                {t(
                  text(
                    'Devam eden deneme sonucu henüz kesinleşmedi.',
                    'The active mock has no final result yet.',
                  ),
                )}
              </span>
            )}
          </article>
          <article>
            <h3>
              {t(text('İcra / jüri öz değerlendirmesi', 'Performance / jury self-assessment'))}
            </h3>
            <strong>
              {report.exam.selfAssessment.count} {t(text('not', 'notes'))}
            </strong>
            <p>
              {t(
                text(
                  'Kendi gözlemin; otomatik işitme puanı değildir.',
                  'Your own observations; not an automatic aural score.',
                ),
              )}
            </p>
          </article>
        </div>
        <p className="small-copy">
          {t(
            text(
              'Bu kayıtlar yukarıdaki normal pratik yüzdesine katılmaz. Boş bırakılan kişisel sorular',
              'These records are separate from ordinary practice accuracy. Skipped personal questions',
            ),
          )}
          : {report.summary.skippedPersonalResponses}.{' '}
          {t(
            text(
              'Bekleyen tekrarlar bütün geçmişe göre gösterilir.',
              'Pending reviews use all history.',
            ),
          )}
        </p>
      </section>

      <details className="report-panel report-details">
        <summary>
          {t(
            text(
              'Beceri ayrıntıları ve karşılaştırılabilir değişim',
              'Skill details and comparable changes',
            ),
          )}
        </summary>
        <p className="small-copy">
          {t(
            text(
              'Yüzde seçilen dönemin normal pratik kayıtlarıdır. İlk aşama ilk verilerinden bugün yeniden tahmin edildi; o gün saklanmış bir seviye puanı değildir. Aşamalar içerik önerisidir, genel yetenek ölçeği değildir.',
              'Percentages describe ordinary practice in the selected period. The first stage is re-estimated today from your earliest records, not a level score saved at the time. Stages are content suggestions, not an overall aptitude scale.',
            ),
          )}
        </p>
        <div
          className="report-table-scroll"
          tabIndex={0}
          role="region"
          aria-label={t(text('Beceri raporu tablosu', 'Skill report table'))}
        >
          <table className="report-skill-table">
            <caption className="sr-only">
              {t(
                text(
                  'Beceri bazında yanıtlar, ses çeşitliliği ve eşleşen değişim',
                  'Answers, sound variety and matched changes by skill',
                ),
              )}
            </caption>
            <thead>
              <tr>
                <th>{t(text('Beceri', 'Skill'))}</th>
                <th>{t(text('İlk veriye göre → şimdi', 'Earliest data → now'))}</th>
                <th>{t(text('Yanıt / doğru', 'Answers / correct'))}</th>
                <th>{t(text('Doğruluk', 'Accuracy'))}</th>
                <th>{t(text('Farklı ses', 'Distinct sounds'))}</th>
                <th>{t(text('Eşleşen değişim', 'Matched change'))}</th>
              </tr>
            </thead>
            <tbody>
              {report.skills.map(s => (
                <tr key={s.skill}>
                  <th scope="row">
                    {t(skillNames[s.skill])}
                    <small>
                      {t(text('Ders yolu', 'Lesson path'))}: {t(paths[s.path].short)} ·{' '}
                      {s.sessionCount} {t(text('oturum', 'sessions'))}
                    </small>
                  </th>
                  <td>
                    {s.maxLevel === 1
                      ? t(text('Tek aşama', 'One stage'))
                      : `${s.firstSuggestedLevel} → ${s.currentSuggestedLevel}`}
                  </td>
                  <td>
                    {s.practiceCount} / {s.correct}
                    <small>
                      {s.legacyCount}{' '}
                      {t(text('eski ses detaysız kayıt', 'legacy records without sound details'))}
                    </small>
                  </td>
                  <td>{percentage(s.accuracy)}</td>
                  <td>{s.distinctSounds}</td>
                  <td>
                    {s.trend.status === 'available' ? (
                      <>
                        <strong>
                          {s.trend.deltaPoints! > 0 ? '+' : ''}
                          {s.trend.deltaPoints} {t(text('yüzde puan', 'percentage points'))}
                        </strong>
                        <small>
                          {s.trend.previousAccuracy}% → {s.trend.recentAccuracy}% ·{' '}
                          {s.trend.previousCount}/{s.trend.recentCount}{' '}
                          {t(text('soru', 'questions'))}
                        </small>
                        <small>
                          {t(getLesson(s.trend.lessonId!).title)}
                          {s.trend.path && ` · ${t(reportPathLabel(s.trend.path))}`}
                          {s.trend.source && ` · ${t(eqSources[s.trend.source].title)}`}
                        </small>
                        <small>{t(s.trend.reason)}</small>
                      </>
                    ) : (
                      t(s.trend.reason)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {books.length > 0 && (
        <details className="report-panel report-details">
          <summary>
            {t(text('Bu yol için kitap başvuruları', 'Book references for this path'))}
          </summary>
          <p>
            {t(
              text(
                'Kitabı baştan sona tüketmek yerine çalıştığın konuyu seçip yeni bir sesle uygula. Ücret ve dil etiketi her kaynakta ayrıdır.',
                'Choose the topic you are working on and apply it to a fresh sound rather than reading cover to cover. Each source has its own cost and language label.',
              ),
            )}
          </p>
          <ul className="report-resources">
            {books.map(r => (
              <Resource key={r.id} resource={r} locale={locale} />
            ))}
          </ul>
        </details>
      )}
      <details className="report-panel report-details">
        <summary>
          {t(
            text(
              'Raporu nasıl okumalı? Veri ve kaynak sınırları',
              'How to read the report: data and resource limits',
            ),
          )}
        </summary>
        <ul className="report-limits">
          {reportLimits.map((v, i) => (
            <li key={i}>{t(v)}</li>
          ))}
        </ul>
        <p>
          {t(
            text(
              'Sponsorlu içerik veya satış ortaklığı bu sürümde etkin değil. Bir kaynağı açmak ücretli yazılım satın almanı gerektirmez; ileride ücretli yerleşimler ayrıca etiketlenmelidir.',
              'Sponsorship and affiliate links are not active in this edition. Opening a resource does not require buying its demonstrated software; any future paid placements must be labelled separately.',
            ),
          )}
        </p>
        <p>
          {t(
            text(
              'Öğretmenine PDF’yi kendin paylaşabilirsin. Dosyada kişisel kimlik veya yüklediğin ses dosyası bulunmaz.',
              'You can choose to share the PDF with your teacher. It contains no personal identity or uploaded audio files.',
            ),
          )}
        </p>
      </details>
    </section>
  );
}
