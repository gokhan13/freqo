import { text, type Text } from './i18n';
export { text, tx, type Locale, type Text } from './i18n';
import { advancedLessons, isAdvanced, mixSkillNames } from './advanced-content';
import { eqLessons } from './eq-content';
import { musicLessons, musicSkillNames } from './music-content';
import type { MusicSkill } from './music-types';
import type { MixSkill } from './mix-types';
import { examCourses } from './exam-content';
export type PathId = 'mix' | 'music' | 'exam';
export type SkillId =
  | 'eq'
  | 'loudness'
  | 'direction'
  | 'interval'
  | 'chord'
  | 'rhythm'
  | 'memory'
  | MixSkill
  | MusicSkill;
export const usesLoop = (skill: SkillId) =>
  skill === 'eq' || skill === 'loudness' || isAdvanced(skill);
export const usesPair = (skill: SkillId) =>
  usesLoop(skill) || skill === 'memory' || skill === 'rhythm';
export type EqSource = 'studio' | 'drums' | 'keys' | 'acoustic' | 'recorded-drums' | 'pink';
export const eqSources: Record<EqSource, { title: Text; description: Text }> = {
  acoustic: {
    title: text('Akustik piyano', 'Acoustic piano'),
    description: text(
      'Gerçek piyano ve vurmalı kayıtlarından düzenleme · CC0.',
      'An arrangement of recorded piano and percussion · CC0.',
    ),
  },
  'recorded-drums': {
    title: text('Kaydedilmiş vurmalılar', 'Recorded percussion'),
    description: text(
      'Gerçek kick, trampet ve claves · CC0.',
      'Recorded bass drum, snare and claves · CC0.',
    ),
  },
  studio: {
    title: text('Elektronik groove', 'Electronic groove'),
    description: text('Davul, bas ve arpej dengesi.', 'A balance of drums, bass and arpeggios.'),
  },
  drums: {
    title: text('Ritim ağırlıklı', 'Rhythm focused'),
    description: text('Vuruşlar, gövde ve hi-hat dokusu.', 'Hits, body and hi-hat texture.'),
  },
  keys: {
    title: text('Arpej ağırlıklı', 'Arpeggio focused'),
    description: text(
      'Nota katmanları, bas ve parlaklık.',
      'Layers of notes, bass and brightness.',
    ),
  },
  pink: {
    title: text('Pembe gürültü', 'Pink noise'),
    description: text(
      'Her oktavda eşit enerji: frekans çalışmasının referans sesi.',
      'Equal energy in every octave: the reference sound for frequency work.',
    ),
  },
};
export const eqSourceIds: EqSource[] = [
  'studio',
  'drums',
  'keys',
  'acoustic',
  'recorded-drums',
  'pink',
];
/** Steady noise has no hits, layers or space, so it serves tone and level work only. */
export const sourcesFor = (skill: SkillId): EqSource[] =>
  skill === 'eq' || skill === 'loudness' ? eqSourceIds : eqSourceIds.filter(s => s !== 'pink');
/** The learner's preferred source, or the default when a lesson cannot use it. */
export const sourceFor = (skill: SkillId, source: EqSource | undefined): EqSource =>
  source && sourcesFor(skill).includes(source) ? source : 'studio';
/** These sources sound the same for every question; the synthesised loops vary with the seed. */
export const isFixedSource = (source: EqSource) =>
  source === 'acoustic' || source === 'recorded-drums' || source === 'pink';
export type Lesson = {
  id: string;
  path: PathId;
  level: number;
  skill: SkillId;
  title: Text;
  description: Text;
  learn: Text;
  listen: Text;
  tip: Text;
};

export const paths = {
  mix: {
    title: text('Miks ve prodüksiyon', 'Mixing & production'),
    short: text('Miks', 'Mixing'),
    description: text(
      'EQ, dinamikler ve mekânı duy. Daha bilinçli miks kararları ver.',
      'Hear EQ, dynamics and space. Make more deliberate mixing decisions.',
    ),
    label: text('STÜDYO KULAĞI', 'STUDIO EARS'),
    color: 'lime',
  },
  music: {
    title: text('Müzik kulağı', 'Musicianship'),
    short: text('Müzik kulağı', 'Musicianship'),
    description: text(
      'Melodi, armoni ve ritmi adım adım dinle.',
      'Listen to melody, harmony and rhythm, one step at a time.',
    ),
    label: text('MÜZİĞİN TEMELLERİ', 'MUSICAL FOUNDATIONS'),
    color: 'blue',
  },
  exam: {
    title: text('Sınava hazırlık', 'Audition preparation'),
    short: text('Sınava hazırlık', 'Audition prep'),
    description: text(
      'Hedefinin kapsamını tanı. İşitme dersleri, jüri provaları ve süreli denemelerle hazırlan.',
      'Know your target. Prepare with aural lessons, jury rehearsals and timed mocks.',
    ),
    label: text('SINAV ATÖLYESİ', 'AUDITION STUDIO'),
    color: 'peach',
  },
} as const;

export const lessons: Lesson[] = [
  ...eqLessons,
  ...[1, 2, 3].map((level): Lesson => ({
    id: `loudness-${level}`,
    path: 'mix',
    skill: 'loudness',
    level,
    title: [
      text('Belirgin seviye farkları', 'Clear level differences'),
      text('Küçük seviye farkları', 'Smaller level differences'),
      text('1 dB farkını dinle', 'Listen for a 1 dB difference'),
    ][level - 1],
    description: text(
      `${[6, 3, 1][level - 1]} dB farkla daha yüksek, daha düşük veya aynı seviyeyi ayırt et.`,
      `Identify louder, softer or equal levels with a ${[6, 3, 1][level - 1]} dB difference.`,
    ),
    learn: text(
      'Daha yüksek ses, daha iyiymiş gibi algılanabilir. Burada aynı kaynağın yalnızca seviyesi değişir; EQ, nota ve zamanlama aynı kalır. Bu kez örneklerin seviyeleri bilerek eşitlenmez.',
      'A louder sound can seem better. Here only the level of the same source changes; EQ, pitch and timing stay the same. These samples are deliberately not level matched.',
    ),
    listen: text(
      'A referans, B karşılaştırma. A/B arasında geçiş yap: B daha yüksek mi, daha düşük mü, aynı mı? Karşılaştırırken ses ayarını sabit tut.',
      'A is the reference and B the comparison. Switch between A/B: is B louder, softer or the same? Keep your volume setting fixed while comparing.',
    ),
    tip: text(
      'Bu fark göreli bir sinyal seviyesi farkıdır; kulaklığındaki mutlak ses basıncını ölçmez. Rahat bir ses seviyesi kullan; farkı duymak için sesi yükseltmen gerekmez.',
      'This is a relative signal level difference, not a measurement of sound pressure at your headphones. Use a comfortable volume; you do not need to turn it up to hear the difference.',
    ),
  })),
  ...advancedLessons,
  {
    id: 'direction-1',
    path: 'music',
    skill: 'direction',
    level: 1,
    title: text('Sesin yönü', 'Pitch direction'),
    description: text(
      'İkinci ses yükseliyor mu, alçalıyor mu?',
      'Does the second note rise or fall?',
    ),
    learn: text(
      'İnce sesin frekansı daha yüksek, kalın sesin frekansı daha düşüktür. Ses yüksekliği ile nota yüksekliği farklı şeylerdir.',
      'Higher pitches have higher frequencies. Lower pitches have lower frequencies. Loudness and pitch are different properties.',
    ),
    listen: text(
      'İki notayı sırayla dinle. İkinci notanın yönünü seç. Bazen iki nota aynıdır.',
      'Listen to two notes in sequence. Choose the direction of the second note. Sometimes both notes are the same.',
    ),
    tip: text(
      'Birinci notayı zihninde tut; ikinci nota geldiğinde sesin hareketini takip et.',
      'Keep the first note in mind and follow the movement when the second arrives.',
    ),
  },
  {
    id: 'interval-2',
    path: 'music',
    skill: 'interval',
    level: 2,
    title: text('Aralıkları tanı', 'Recognise intervals'),
    description: text(
      'İki ses arasındaki mesafeyi dinle.',
      'Listen to the distance between two notes.',
    ),
    learn: text(
      'Aralık, iki nota arasındaki uzaklıktır. Bu çalışmada büyük ikili (2), büyük üçlü (4), tam dörtlü (5), tam beşli (7) ve oktav (12 yarım ses) var.',
      'An interval is the distance between two notes. Here we use a major second (2), major third (4), perfect fourth (5), perfect fifth (7) and octave (12 semitones).',
    ),
    listen: text(
      'Yukarı çıkan iki notayı dinle ve aralığı seç. Başlangıç notası her soruda değişebilir.',
      'Listen to two ascending notes and choose the interval. The starting pitch can change on each question.',
    ),
    tip: text(
      'Sabit bir şarkıya bağımlı kalmadan mesafenin sesini tanımaya çalış.',
      'Try to recognise the sound of the distance without relying on a single song.',
    ),
  },
  {
    id: 'chord-3',
    path: 'music',
    skill: 'chord',
    level: 3,
    title: text('Majör ve minör', 'Major & minor'),
    description: text(
      'Akorun üçlüsündeki farkı keşfet.',
      'Discover the difference in the chord’s third.',
    ),
    learn: text(
      'Majör akor kökten 4 ve 7 yarım ses, minör akor 3 ve 7 yarım ses uzaklıktaki notalardan oluşur. Üçlü değişir; beşli aynı kalır.',
      'A major triad uses notes 4 and 7 semitones above the root; a minor triad uses 3 and 7. The third changes while the fifth stays the same.',
    ),
    listen: text(
      'Üç notanın birlikte çaldığı akoru dinle. Majör mü, minör mü?',
      'Listen to a chord with three simultaneous notes. Is it major or minor?',
    ),
    tip: text(
      'Yalnızca “mutlu / üzgün” etiketlerine dayanma. Üçlünün kökle ilişkisini dinle.',
      'Listen to the third in relation to the root rather than relying only on “happy / sad” labels.',
    ),
  },
  ...[1, 2, 3].map((level): Lesson => ({
    id: `rhythm-${level}`,
    path: 'music',
    skill: 'rhythm',
    level,
    title: [
      text('Vuruş ve bölünme', 'Beats & subdivisions'),
      text('Sus ve ters vuruş', 'Rests & offbeats'),
      text('Onaltılık hareketler', 'Sixteenth-note movement'),
    ][level - 1],
    description: text(
      'Aynı tempoda iki ritim kalıbını karşılaştır.',
      'Compare two rhythm patterns at the same tempo.',
    ),
    learn: text(
      level === 3
        ? 'Dört vuruşlu bir ölçüde her vuruş dört parçaya bölünür: 1 e & a. Bir vuruşun bir alt bölüme kaymasını dinle.'
        : 'Dört vuruşlu bir ölçüde her vuruş iki parçaya bölünür: 1 & 2 & 3 & 4 &. Vuruş aralarındaki boşlukları ve seslerin yerini dinle.',
      level === 3
        ? 'Each beat in a four-beat bar divides into four: 1 e & a. Listen for a hit moving by one subdivision.'
        : 'Each beat in a four-beat bar divides into two: 1 & 2 & 3 & 4 &. Listen to the gaps and the positions of the hits.',
    ),
    listen: text(
      'Önce dört sayım sesi, ardından bir ölçülük ritim duyacaksın. A ve B’yi sonuna kadar dinle. Kalıplar aynı mı, bir vuruşun yeri değişti mi?',
      'You will hear four count-in clicks, then one bar of rhythm. Listen to A and B all the way through. Are the patterns the same, or did one hit move?',
    ),
    tip: text(
      'Her iki örnekte tempo, ses rengi ve vuruş sayısı aynıdır. Değişim yalnızca bir vuruşun yerindedir. Bu çalışma ritim ayırt etmedir; dokunma zamanlaması veya ritim tekrar puanı ölçülmez.',
      'Both samples have the same tempo, timbre and number of hits. Only the position of one hit can change. This trains rhythm discrimination; it does not score tapping or rhythm reproduction.',
    ),
  })),
  ...musicLessons,
  ...[1, 2, 3].map((level): Lesson => ({
    id: `memory-${level}`,
    path: 'exam',
    skill: 'memory',
    level,
    title: text(`${level + 2} notalı hafıza`, `${level + 2}-note memory`),
    description: text(
      'İki kısa melodi arasındaki değişimi yakala.',
      'Catch the change between two short melodies.',
    ),
    learn: text(
      'Kısa bir melodiyi belleğinde tutmak, dikte ve tekrar çalışmalarına bir başlangıçtır. Burada aynı ritimde iki melodi karşılaştırılır.',
      'Keeping a short melody in memory is a starting point for dictation and repetition. Here you compare two melodies with the same rhythm.',
    ),
    listen: text(
      'A melodisini, ardından B melodisini dinle. B aynı mı, yoksa bir notası farklı mı?',
      'Listen to melody A and then melody B. Is B the same, or has one note changed?',
    ),
    tip: text(
      'Bu bir kurumun gerçek giriş sınavı değildir. Okulun duyurduğu sınav kapsamı ayrıca çalışılmalıdır.',
      'This is not a simulation of a specific institution’s entrance exam. Study the scope published by your chosen school separately.',
    ),
  })),
];

export const skillNames: Record<SkillId, Text> = {
  eq: text('EQ ve frekans', 'EQ & frequency'),
  loudness: text('Ses yüksekliği', 'Loudness'),
  ...mixSkillNames,
  direction: text('Ses yönü', 'Pitch direction'),
  interval: text('Aralıklar', 'Intervals'),
  chord: text('Akor niteliği', 'Chord quality'),
  rhythm: text('Ritim', 'Rhythm'),
  memory: text('Melodik hafıza', 'Melodic memory'),
  ...musicSkillNames,
};
export const getLesson = (id: string) => lessons.find(l => l.id === id)!;

export const lessonGroups: Record<PathId, { id: string; title: Text; skills: SkillId[] }[]> = {
  mix: [
    { id: 'eq', title: skillNames.eq, skills: ['eq'] },
    { id: 'loudness', title: skillNames.loudness, skills: ['loudness'] },
    {
      id: 'dynamics',
      title: text('Dinamikler', 'Dynamics'),
      skills: ['compression', 'attack', 'release'],
    },
    {
      id: 'masking',
      title: text('Masking ve ayrışma', 'Masking & separation'),
      skills: ['masking'],
    },
    { id: 'stereo', title: skillNames.stereo, skills: ['stereo'] },
    { id: 'space', title: text('Reverb ve delay', 'Reverb & delay'), skills: ['reverb', 'delay'] },
  ],
  music: [
    {
      id: 'pitch',
      title: text('Melodi ve armoni', 'Melody & harmony'),
      skills: ['direction', 'interval', 'chord'],
    },
    { id: 'rhythm', title: skillNames.rhythm, skills: ['rhythm'] },
    {
      id: 'tonality',
      title: text('Tonal merkez ve dereceler', 'Tonal centre & degrees'),
      skills: ['tonic', 'degree'],
    },
    { id: 'function', title: musicSkillNames.function, skills: ['function'] },
    {
      id: 'dictation',
      title: text('Dikte atölyesi', 'Dictation workshop'),
      skills: ['melodic-dictation', 'rhythmic-dictation'],
    },
    { id: 'reproduction', title: musicSkillNames['rhythm-repeat'], skills: ['rhythm-repeat'] },
  ],
  exam: [{ id: 'memory', title: skillNames.memory, skills: ['memory'] }],
};
export const pathCount = (path: PathId) =>
  path === 'exam'
    ? text(
        `${examCourses.length} ders · 3 deneme seviyesi`,
        `${examCourses.length} lessons · 3 mock levels`,
      )
    : text(
        `${lessons.filter(l => l.path === path).length} pratik · ${lessonGroups[path].length} bölüm`,
        `${lessons.filter(l => l.path === path).length} practices · ${lessonGroups[path].length} ${lessonGroups[path].length === 1 ? 'section' : 'sections'}`,
      );

export const ui = {
  today: text('Bugün', 'Today'),
  paths: text('Yollar', 'Paths'),
  skills: text('Becerilerim', 'My skills'),
  profile: text('Profil', 'Profile'),
  language: text('Dil', 'Language'),
  studio: text('DİNLEME STÜDYON', 'YOUR LISTENING STUDIO'),
  welcome: text(
    'İyi bir miks, iyi bir\ndinlemeyle başlar.',
    'A better mix starts\nwith better listening.',
  ),
  welcomeSub: text(
    'Kısa bir pratik. Biraz daha keskin bir kulak. Bugünkü dinleme alanın hazır.',
    'A short practice. A sharper ear. Your listening space for today is ready.',
  ),
  active: text('AKTİF YOLUN', 'YOUR ACTIVE PATH'),
  next: text('SIRADAKİ PRATİĞİN', 'YOUR NEXT PRACTICE'),
  start: text('Pratiğe başla', 'Start practice'),
  resume: text('Pratiğe devam et', 'Resume practice'),
  minutes: text('~3 dakika', '~3 minutes'),
  questions: text('5 soru', '5 questions'),
  levels: text('Seviye', 'Level'),
  choose: text('Dinleyeceğin yolu seç.', 'Choose your listening path.'),
  chooseSub: text(
    'Tek bir odakla başla. Diğer yollar her zaman burada.',
    'Start with one focus. The other paths are always here.',
  ),
  viewPath: text('Yolu keşfet', 'Explore path'),
  allPaths: text('Tüm yollar', 'All paths'),
  total: text('Yanıtlanan soru', 'Questions answered'),
  sessions: text('Tamamlanan pratik', 'Practices completed'),
  accuracy: text('Doğru yanıt', 'Accuracy'),
  notYet: text('Henüz ölçülmedi', 'Not measured yet'),
  headphone: text(
    'Kulaklığını tak. Sesini rahat bir seviyeye al.',
    'Put on your headphones. Set a comfortable volume.',
  ),
  headphoneSub: text(
    'Özellikle bas frekanslar için kulaklık ya da uygun hoparlör kullan.',
    'Use headphones or suitable speakers, especially for bass frequencies.',
  ),
  before: text('ÖNCE BİR DAKİKA', 'A MOMENT BEFORE YOU START'),
  listenFor: text('Neyi dinleyeceksin?', 'What are you listening for?'),
  how: text('Nasıl çalışacağız?', 'How does it work?'),
  begin: text('Hazırım, dinleyelim', 'Ready, let’s listen'),
  guided: text('Önce örnek dinle', 'Hear a guided example'),
  guidedCaption: text(
    'Yanıtı açık olan örneği dinle. Hazır olduğunda bağımsız sorulara geç.',
    'Listen to an example with its answer shown, then start independent questions when ready.',
  ),
  reference: text('Referans', 'Reference'),
  comparison: text('Karşılaştırma', 'Comparison'),
  rhythmA: text('İlk ritim', 'First rhythm'),
  rhythmB: text('İkinci ritim', 'Second rhythm'),
  loudnessQuestion: text(
    'B’nin ses seviyesi A’ya göre nasıl?',
    'How does B’s level compare with A?',
  ),
  rhythmQuestion: text('İki ritim kalıbı aynı mı?', 'Are the two rhythm patterns the same?'),
  listenBoth: text(
    'A ve B’yi sonuna kadar dinle; sonra yanıtını seç.',
    'Listen to A and B all the way through, then choose an answer.',
  ),
  question: text('Soru', 'Question'),
  of: text('/', '/'),
  original: text('Orijinal', 'Original'),
  changed: text('EQ uygulanmış', 'With EQ'),
  melodyA: text('İlk melodi', 'First melody'),
  melodyB: text('İkinci melodi', 'Second melody'),
  play: text('Dinle', 'Listen'),
  pause: text('Durdur', 'Stop'),
  preparing: text('Ses hazırlanıyor…', 'Preparing audio…'),
  volume: text('Ses seviyesi', 'Volume'),
  answerFirst: text(
    'Önce örneği dinle; sonra yanıtını seç.',
    'Listen to the sample, then choose an answer.',
  ),
  mixQuestion: text('B’de hangi frekans değişti?', 'Which frequency changed in B?'),
  directionQuestion: text(
    'İkinci nota nereye hareket etti?',
    'Which way did the second note move?',
  ),
  intervalQuestion: text(
    'İki nota arasındaki aralık hangisi?',
    'What is the interval between the notes?',
  ),
  chordQuestion: text('Duyduğun akorun niteliği ne?', 'What is the quality of the chord?'),
  memoryQuestion: text('İki melodi aynı mı?', 'Are the two melodies the same?'),
  correct: text('Evet, duydun.', 'Yes, you heard it.'),
  incorrect: text('Birlikte tekrar dinleyelim.', 'Let’s listen again together.'),
  correctAnswer: text('Doğru yanıt', 'Correct answer'),
  yourAnswer: text('Senin yanıtın', 'Your answer'),
  compare: text('Karşılaştırarak öğren', 'Learn by comparing'),
  nextQuestion: text('Sonraki soru', 'Next question'),
  finish: text('Pratiği bitir', 'Finish practice'),
  back: text('Geri', 'Back'),
  exit: text('Kaydet ve çık', 'Save & exit'),
  saved: text('İlerlemen bu cihazda kaydediliyor.', 'Your progress is saved on this device.'),
  complete: text('Bugün kulağına zaman ayırdın.', 'You made time for your ears today.'),
  completeSub: text(
    'Her yanıt bir dinleme fırsatı. Tekrar dinlemek de pratiğin bir parçası.',
    'Every answer is a listening opportunity. Listening again is part of practice.',
  ),
  again: text('Bir pratik daha', 'Another practice'),
  home: text('Bugüne dön', 'Back to today'),
  skillsTitle: text('Kendi gelişimini dinle.', 'Listen to your own progress.'),
  skillsSub: text(
    'Tekrar hariç son 20 pratik yanıtı ve güncel seviye önerisi. Hata tekrarları ayrı sayılır; yüzde, farklı beceriler için bir yetenek veya sınav puanı değildir.',
    'Your last 20 practice answers excluding reviews, plus the current level suggestion. Error reviews are counted separately; the percentages are not aptitude or admission scores.',
  ),
  noData: text(
    'Birkaç pratikten sonra güçlü yanlarını ve çalışacağın alanları burada göreceksin.',
    'After a few practices, you’ll see your strengths and areas to work on here.',
  ),
  recent: text('Son pratikler', 'Recent practices'),
  local: text('Bu cihazdaki ilerleme', 'Progress on this device'),
  profileTitle: text('Dinleme alanını düzenle.', 'Make this space yours.'),
  profileSub: text(
    'Kısa, odaklı ve sana uygun bir pratik.',
    'Short, focused practice that fits you.',
  ),
  defaultPath: text('Ana öğrenme yolu', 'Main learning path'),
  setupTitle: text('Dinleme kontrolü', 'Listening check'),
  setupCopy: text(
    'Kısa bir örnek çal ve sesini rahat bir seviyeye ayarla. Telefon hoparlörü bas soruları için yeterli olmayabilir.',
    'Play a short sample and set a comfortable volume. Phone speakers may not reproduce bass questions well.',
  ),
  testSound: text('Örnek ses çal', 'Play a test sound'),
  install: text('Telefonunda kullan', 'Use on your phone'),
  installCopy: text(
    'HTTPS üzerinden açıldığında iPhone’da Safari → Paylaş → Ana Ekrana Ekle; Android’de Chrome → menü → Uygulamayı yükle / Ana ekrana ekle. İlk açılıştan sonra bu pratikler çevrimdışı da çalışır.',
    'When opened over HTTPS: on iPhone, Safari → Share → Add to Home Screen; on Android, Chrome → menu → Install app / Add to Home Screen. After the first visit, these exercises work offline too.',
  ),
  deviceOnly: text(
    'Hesap gerekmiyor. Kayıtlar bu tarayıcıda kalır; başka cihaza otomatik aktarılmaz. Tarayıcı verilerini temizlemek ilerlemeyi siler.',
    'No account needed. Records stay in this browser and do not sync to other devices. Clearing browser data deletes your progress.',
  ),
  export: text('İlerlemeyi indir', 'Download progress'),
  reset: text('İlerlemeyi sıfırla', 'Reset progress'),
  import: text('Yedekten geri yükle', 'Restore from backup'),
  importing: text('Yedek okunuyor…', 'Reading backup…'),
  importTitle: text('Yedeğini birleştirelim mi?', 'Merge your backup?'),
  importAction: text('Birleştir ve yükle', 'Merge & restore'),
  importCopy: text(
    'Kayıtlar bu cihazdaki ilerlemeyle birleştirilecek; aynı yanıtlar iki kez sayılmayacak. Dil ve ses ayarların korunacak. Mevcut yarım pratiğin varsa ona devam edeceksin.',
    'Records will merge with progress on this device; duplicate answers will not count twice. Your language and volume settings stay the same. If you have an unfinished practice here, it will stay active.',
  ),
  importInvalid: text(
    'Bu dosya geçerli bir Freq yedeği değil. Kayıtların değişmedi.',
    'This file is not a valid Freq backup. Your records have not changed.',
  ),
  importFuture: text(
    'Bu yedek daha yeni bir Freq sürümüyle oluşturulmuş. Geri yüklemek için uygulamayı güncelle.',
    'This backup was created with a newer Freq version. Update the app to restore it.',
  ),
  importLarge: text(
    'Yedek dosyası çok büyük. En fazla 16 MB boyutunda bir Freq JSON yedeği seç.',
    'The backup is too large. Choose a Freq JSON backup of up to 16 MB.',
  ),
  importRetired: text(
    'Bu yedek daha eski bir Freq önizlemesinden. Miks dersleri yeniden kurulduğu için eski yanıtlar içe alınamıyor. Mevcut kayıtların değişmedi.',
    'This backup comes from an earlier Freq preview. The mixing lessons were rebuilt, so its answers cannot be imported. Your current records have not changed.',
  ),
  importConflict: text(
    'Yedek bu cihazdaki kayıtlarla birleştirilemiyor: çelişen kayıtlar veya iki farklı yarım çalışma var. Mevcut ilerlemen korunuyor.',
    'The backup cannot be merged with this device: records conflict or there are two different unfinished sessions. Your current progress is safe.',
  ),
  importSuccess: text(
    'Yedek birleştirildi. Aynı kayıtlar tekrar sayılmadı.',
    'Backup merged. Duplicate records were not counted again.',
  ),
  importUnsaved: text(
    'Yedek bu oturumda yüklendi, ancak tarayıcı kaydedemiyor. Sayfayı kapatmadan ilerlemeyi indir.',
    'Backup loaded for this session, but the browser cannot save it. Download your progress before closing the page.',
  ),
  source: text('Ses kaynağın', 'Your sound source'),
  sourceCopy: text(
    'Bu pratiğin kaynağını seç. Farklı ses dokularıyla çalış; seçimin beş soru boyunca sabit kalacak.',
    'Choose the source for this practice. Work with different sound textures; your choice stays fixed across the five questions.',
  ),
  sourceOriginal: text(
    'Üç özgün sentez dokusu ve CC0 akustik kayıtlardan iki düzenleme.',
    'Three original synthesized textures and two arrangements from CC0 acoustic recordings.',
  ),
  targetEq: text('Doğru EQ', 'Target EQ'),
  choiceEq: text('Seçtiğin EQ', 'Your chosen EQ'),
  compareCopy: text(
    'C, senin seçtiğin EQ hamlesinin sesidir. B ve C arasında geçiş yapıp farkı duy; ardından A’ya dön.',
    'C is the sound of the EQ move you chose. Switch between B and C to hear the difference, then return to A.',
  ),
  shortcutCompare: text(
    'Klavye: boşluk dinle/durdur · A/B/C karşılaştır · Enter sonraki soru',
    'Keyboard: space listen/stop · A/B/C compare · Enter next question',
  ),
  resetTitle: text('Bu cihazdaki ilerleme silinsin mi?', 'Delete progress on this device?'),
  resetCopy: text(
    'Pratik kayıtları ve yarım kalan oturum silinecek. Önce ilerlemeni indirebilirsin.',
    'Practice history and your unfinished session will be deleted. You can download your progress first.',
  ),
  cancel: text('Vazgeç', 'Cancel'),
  delete: text('Evet, sil', 'Yes, delete'),
  storageError: text(
    'Tarayıcı kayıt yapamıyor. Pratik çalışır; sayfayı kapatırsan ilerleme kaybolabilir.',
    'This browser cannot save records. You can practise, but progress may be lost when you close the page.',
  ),
  audioError: text(
    'Ses başlatılamadı. Dinle düğmesiyle tekrar dene; başka ses uygulamalarını kapatmayı deneyebilirsin.',
    'Audio could not start. Try Listen again, or close other audio apps.',
  ),
  early: text('DİNLEME STÜDYOSU · 0.11 ÖNİZLEME', 'LISTENING STUDIO · 0.11 PREVIEW'),
  future: text('Bu yolun devamı', 'Further along this path'),
  roadmapMix: text(
    'Sırada: daha geniş kayıt kütüphanesi, çoklu sorunları teşhis ve yeni müziklerde beceri aktarımı. İleri miks pratiklerini veya Kendi kaydın alanını keşfet.',
    'Next: a larger recording library, diagnosing multiple issues and transfer to new music. Explore advanced mixing practice or Your recording.',
  ),
  roadmapMusic: text(
    'Sırada: minör/kromatik bağlam, porte ve daha uzun dikte. Makam ve usul ayrı bir içerik yolu olarak uzmanlarla hazırlanacak.',
    'Next: minor/chromatic context, staff notation and longer dictation. Makam and usul will be a separate content path authored with specialists.',
  ),
  roadmapExam: text(
    'Sınav atölyesi işitme hazırlığı ve öz değerlendirmeli jüri provaları sunar. Makam/usul, programına özel ileri repertuvar ve vokal entonasyon değerlendirmesi uzman desteği gerektirir.',
    'The audition studio offers aural preparation and jury rehearsals with self-assessment. Makam/usul, advanced programme-specific repertoire and vocal intonation assessment require specialist support.',
  ),
  selected: text('Aktif yol', 'Active path'),
  makeActive: text('Ana yolum yap', 'Set as my main path'),
  learnTip: text('KÜÇÜK BİR DİNLEME NOTU', 'A SMALL LISTENING NOTE'),
  tipHome: text(
    'Bir sesi tanımak için önce karşılaştır.',
    'To recognise a sound, first compare it.',
  ),
  tipHomeCopy: text(
    'Aynı kaynağın iki halini dinlemek, değişimin nerede olduğunu daha net duymana yardım eder.',
    'Listening to two versions of the same source helps you hear where the change is.',
  ),
  shortcutGrid: text(
    'Klavye: boşluk dinle/durdur · A/B geçiş · ok tuşları bantlar arasında gezer',
    'Keyboard: space listen/stop · A/B switch · arrow keys move between bands',
  ),
  shortcut: text(
    'Klavye: boşluk dinle/durdur · A/B geçiş · rakamlar yanıt',
    'Keyboard: space listen/stop · A/B switch · digits answer',
  ),
  skipLink: text('İçeriğe geç', 'Skip to content'),
} satisfies Record<string, Text>;
