import { getLesson, paths, text, tx, type Locale, type SkillId, type Text } from './content';
import { learningResources, studyGuides, type LearningResource } from './report-resources';
import type { ProgressReport, ReportPath, ReportPeriod } from './report-model';

export const reportPathLabel = (path: ReportPath): Text =>
  path === 'all' ? text('Tüm çalışma yolları', 'All study paths') : paths[path].title;
export const reportPeriodLabel = (period: ReportPeriod): Text =>
  period === 'all'
    ? text('Tüm geçmiş', 'All history')
    : period === '30d'
      ? text('Son 30 gün', 'Last 30 days')
      : text('Son 7 gün', 'Last 7 days');
export const percentage = (value: number | null) => (value === null ? '—' : `${value}%`);
export const reportDate = (at: number, locale: Locale, timeZone: string, withTime = false) =>
  new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(at);
export const resourceKind = (r: LearningResource): Text =>
  r.kind === 'book'
    ? text('Kitap', 'Book')
    : r.kind === 'video'
      ? text('Video ders', 'Video lesson')
      : r.kind === 'practice'
        ? text('Ücretsiz pratik', 'Free practice')
        : text('Okuma', 'Reading');
export const resourceCost = (r: LearningResource): Text =>
  r.price === 'free' ? text('Ücretsiz', 'Free') : text('Ücretli · isteğe bağlı', 'Paid · optional');
export const resourceLanguage = (r: LearningResource): Text =>
  r.language === 'tr' ? text('Türkçe', 'Turkish') : text('İngilizce', 'English');

/** Turkish-first by default, independently of UI language. Organic curation only. Cost/language never change the learner's weak-skill ranking. */
export function resourcesForSkill(
  skill: SkillId,
  preferredLanguage: Locale = 'tr',
): LearningResource[] {
  const ids = studyGuides[skill].resourceIds;
  const candidates = ids
    .map(id => learningResources.find(r => r.id === id))
    .filter((r): r is LearningResource => !!r && r.skills.includes(skill));
  const nativeFirst = (a: LearningResource, b: LearningResource) =>
    Number(b.language === preferredLanguage) - Number(a.language === preferredLanguage);
  const free = candidates.filter(r => r.price === 'free').sort(nativeFirst);
  const selected = free.slice(0, 2);
  const book = free.find(r => r.kind === 'book');
  if (book && !selected.includes(book)) selected.splice(1, 1, book);
  return [
    ...selected,
    ...candidates
      .filter(r => r.price === 'paid')
      .sort(nativeFirst)
      .slice(0, 1),
  ];
}

export type StudyWeekDay = {
  day: number;
  title: Text;
  detail: Text;
  skill: SkillId | null;
  lessonId: string | null;
  action: 'lesson' | 'personal' | 'lab' | 'exam' | null;
};
export function studyWeek(report: ProgressReport): StudyWeekDay[] {
  const [first, second = first, third = first] = report.priorities;
  if (!first) return [];
  const focusPath = report.path === 'all' ? getLesson(first.lessonId).path : report.path;
  return [
    {
      day: 1,
      title: text('İpucunu öğren', 'Learn the listening cue'),
      detail: text(
        'Öncelikli dersin açıklamalı örneğini dinle. Farkı kendi sözlerinle anlat; ardından beş yeni soru çöz.',
        'Listen to the priority lesson’s guided example. Describe the difference in your own words, then answer five fresh questions.',
      ),
      skill: first.skill,
      lessonId: first.lessonId,
      action: 'lesson',
    },
    {
      day: 2,
      title: text('İkinci odak ve kısa tekrar', 'Second focus and a short review'),
      detail: text(
        'İkinci önerilen konuyu çalış. Kişisel planda zamanı gelmiş tekrarları yap; erken doğru tekrar takvimi ilerletmez.',
        'Work on the second suggested topic. Complete due reviews in your personal plan; an early correct review does not advance its schedule.',
      ),
      skill: second.skill,
      lessonId: second.lessonId,
      action: 'lesson',
    },
    {
      day: 3,
      title: text('Farklı sesle yeniden dene', 'Try a different sound'),
      detail: text(
        'Birinci odağa dön. Miks için başka bir kaynak; müzik için yeni tonik veya kalıp kullan. Aynı soruyu hatırlamakla yeni sesi duymayı ayır.',
        'Return to the first focus. Use another source for mixing, or a fresh key or pattern for music. Distinguish remembering a question from hearing a new sound.',
      ),
      skill: first.skill,
      lessonId: first.lessonId,
      action: 'lesson',
    },
    {
      day: 4,
      title: text('Bir ücretsiz kaynağı uygula', 'Apply one free resource'),
      detail: text(
        'Aşağıdaki kaynaklardan bir ders seç. İzledikten/okuduktan sonra dinleme ipucunu yeniden üret; kaynak tüketmek tek başına pratik sayılmaz.',
        'Choose one lesson from the resources below. Reproduce its listening cue after watching or reading; consuming a resource alone is not practice.',
      ),
      skill: first.skill,
      lessonId: null,
      action: null,
    },
    {
      day: 5,
      title: text('Dengeli yeni pratik', 'Balanced fresh practice'),
      detail: text(
        'Üçüncü odağı veya az çalıştığın bir konuyu dene. Kısa oturumlar arasında mola ver; kulak yorulunca daha uzun oturum yapma.',
        'Try the third focus or a less-practised topic. Take breaks between short sessions; avoid extending a session when listening feels tiring.',
      ),
      skill: third.skill,
      lessonId: third.lessonId,
      action: 'lesson',
    },
    {
      day: 6,
      title: text('Gerçek bağlama taşı', 'Transfer to a real context'),
      detail:
        focusPath === 'mix'
          ? text(
              'Kendi kaydın laboratuvarında tek bir değişkeni dene; seviyeleri eşitle ve A/B farkını açıklayarak kaydet.',
              'Try one variable in Your recording, match levels, and describe the A/B difference.',
            )
          : focusPath === 'exam'
            ? text(
                'Kapsam haritasını kontrol et. Söyleme, solfej ve icrayı öğretmenle prova et; öz değerlendirmeyi otomatik puanla karıştırma.',
                'Check the programme scope map. Rehearse singing, solfège and performance with a teacher; keep self-assessment separate from automatic scores.',
              )
            : text(
                'Yeni bir melodide veya ritimde öğrendiğin ipucunu uygula. Söyleme/icra için öğretmen geri bildirimi al.',
                'Apply the cue to a new melody or rhythm. Get teacher feedback on singing or performance.',
              ),
      skill: first.skill,
      lessonId: null,
      action: focusPath === 'mix' ? 'lab' : focusPath === 'exam' ? 'exam' : null,
    },
    {
      day: 7,
      title: text('Yeni kanıtla kontrol et', 'Check with fresh evidence'),
      detail: text(
        'Aynı aşama ve kaynakta iki ayrı oturumdan yeni soruları karşılaştır. Az veri varsa kesin sonuç çıkarma; raporu yeniden oluşturup bir sonraki odağı seç.',
        'Compare fresh questions from two sessions at the same stage and source. Avoid firm conclusions from sparse data; regenerate the report and choose your next focus.',
      ),
      skill: first.skill,
      lessonId: null,
      action: 'personal',
    },
  ];
}

export const reportLimits = [
  text(
    'Bu rapor kayıtlı çalışmayı açıklar; genel müzikal yetenek, tıbbi işitme testi veya sınav kabul puanı değildir.',
    'This report describes recorded practice; it is not a measure of general musical aptitude, a medical hearing test or an admission score.',
  ),
  text(
    'Doğruluk yalnız normal pratik yanıtlarıdır. Hata tekrarları, başlangıç değerlendirmesi, denemeler ve icra öz değerlendirmesi ayrı gösterilir.',
    'Accuracy covers ordinary practice answers only. Error reviews, placement, mocks and performance self-assessment are shown separately.',
  ),
  text(
    'Değişim yalnız aynı aşama, çalışma yolu ve kaynakta yeterli özgün soru varsa karşılaştırılır. Kaynak çeşitliliği ve soru sayısı sonucu sınırlar.',
    'Change is compared only when there are enough original questions at the same stage, study path and source. Sound variety and question count limit the conclusion.',
  ),
  text(
    'Zaman aralığı yanıt istatistiklerini süzer. Bugünkü aşama önerisi ve bekleyen tekrarlar, rapor anına kadar bütün geçerli geçmişi kullanır.',
    'The date range filters answer statistics. Current stage suggestions and pending reviews use all valid history up to the report time.',
  ),
  text(
    'İlk aşama, ilk verilerinden bugün yeniden tahmin edildi; o gün saklanmış bir seviye puanı değildir. Aşama değişimi, içerik önerisinin değişimidir.',
    'The first stage is re-estimated today from your earliest records, not a level score saved at the time. Stage changes describe changes in content suggestions.',
  ),
  text(
    'Rapor ve PDF cihazında hazırlanır. Kaynak bağlantıları isteğinle dış siteyi açar; videolar/kitaplar PDF’ye kopyalanmaz. Kaynak önerileri sponsor ödemesine göre sıralanmaz.',
    'The report and PDF are generated on your device. Resource links open external sites only when you choose them; videos/books are not copied into the PDF. Sponsorship does not determine resource rankings.',
  ),
];

export const reportSummaryNote = (report: ProgressReport, locale: Locale) =>
  tx(
    report.summary.practiceCount === 0
      ? text(
          'Henüz normal pratik yanıtı yok. Eksik veya güçlü beceri ilan etmek için veri yeterli değil; başlangıç önerileri ve ilk çalışma planı aşağıda.',
          'No ordinary practice answers are recorded yet. There is not enough evidence to label strengths or weaknesses; starting suggestions and an initial plan follow.',
        )
      : report.summary.practiceCount < 10
        ? text(
            'İlk kayıtların oluştu. Yüzdeyi kesin seviye ölçümü olarak yorumlama; farklı oturum ve seslerle veri biriktir.',
            'Your first records are in. Do not interpret the percentage as a definitive level measurement; gather evidence across different sessions and sounds.',
          )
        : text(
            'Öncelikler kayıtlı yanıtlardan ve bekleyen tekrarlardan çıkarıldı. Aşağıda her önerinin kanıtı, yöntemi ve yeni örnekle kontrolü var.',
            'Priorities come from recorded answers and pending reviews. Each suggestion below includes its evidence, method and a fresh-example check.',
          ),
    locale,
  );
