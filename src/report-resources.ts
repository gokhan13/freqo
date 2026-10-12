import { text, type Text } from './i18n';
import type { PathId, SkillId } from './content';

export type LearningResource = {
  id: string;
  title: Text;
  description: Text;
  url: string;
  kind: 'book' | 'video' | 'article' | 'practice';
  language: 'tr' | 'en';
  price: 'free' | 'paid';
  sourceChecked: string;
  skills: SkillId[];
  paths: PathId[];
  author: string;
  note?: Text;
};

export type StudyGuide = {
  cue: Text;
  steps: Text[];
  session: Text;
  transfer: Text;
  freshCheck: Text;
  resourceIds: string[];
};

const checked = '2026-10-12';
const musicPaths: PathId[] = ['music', 'exam'];
const musicSkills: SkillId[] = [
  'direction',
  'interval',
  'chord',
  'rhythm',
  'memory',
  'tonic',
  'degree',
  'function',
  'melodic-dictation',
  'rhythmic-dictation',
  'rhythm-repeat',
];
const mixSkills: SkillId[] = [
  'eq',
  'loudness',
  'compression',
  'attack',
  'release',
  'masking',
  'stereo',
  'reverb',
  'delay',
];
const tutorialNote = text(
  'İngilizce resmî anlatım sayfası ve gömülü video örnekleri. Anlatım ücretsiz; gösterilen ücretli eklentileri almak gerekmez. Video oynatma, ses dili ve Türkçe altyazı doğrulanmadı.',
  'Official English tutorial page with embedded video examples. The tutorial is free; purchasing the demonstrated plug-ins is unnecessary. Video playback, spoken language and Turkish captions were not verified.',
);

// URLs point to primary author/educator pages; no affiliate parameters or sponsor ranking.
// Show only resources relevant to the selected skill, with a small per-report limit.
export const learningResources: LearningResource[] = [
  {
    id: 'izotope-eq',
    title: text(
      'Parametrik EQ: frekans, gain ve Q',
      'Parametric EQ: what it is and how to use one',
    ),
    description: text(
      'Tek bir bandın merkezini, seviyesini ve genişliğini sırayla değiştir. Before/after örneklerini miks içinde karşılaştır.',
      'Change a single band’s centre, gain and width in turn. Compare the before/after examples in the mix.',
    ),
    url: 'https://www.izotope.com/community/blog/parametric-eq',
    kind: 'video',
    language: 'en',
    price: 'free',
    sourceChecked: checked,
    skills: ['eq', 'masking'],
    paths: ['mix'],
    author: 'Chris Wainwright · iZotope',
    note: tutorialNote,
  },
  {
    id: 'izotope-masking',
    title: text('Mikste örtüşmeyi duy ve hedefe yer aç', 'Unmasking Your Mix with Neutron'),
    description: text(
      'Birbirini örten kaynakları birlikte dinle; hedefin netliğini karşılaştır. Örnekteki kesme frekansını kendi miksine reçete gibi uygulama.',
      'Hear competing sources together and compare the target’s clarity. Avoid treating the example’s cut frequency as a prescription for your mix.',
    ),
    url: 'https://www.izotope.com/community/blog/unmasking-your-mix-with-neutron',
    kind: 'video',
    language: 'en',
    price: 'free',
    sourceChecked: checked,
    skills: ['masking'],
    paths: ['mix'],
    author: 'Trevor Spencer · iZotope',
    note: tutorialNote,
  },
  {
    id: 'izotope-dynamics',
    title: text(
      'Dinamikler: kompresör, limiter ve temel kontroller',
      'Audio dynamics 101: compressors, limiters, expanders, and gates',
    ),
    description: text(
      'Eşik, oran, atak, bırakma ve çıkış seviyesini örneklerle bağla. Önce yalnız zorlandığın kontrolü incele.',
      'Connect threshold, ratio, attack, release and output level with examples. Start with the control you find difficult.',
    ),
    url: 'https://www.izotope.com/community/blog/audio-dynamics-101-compressors-limiters-expanders-and-gates',
    kind: 'video',
    language: 'en',
    price: 'free',
    sourceChecked: checked,
    skills: ['compression', 'attack', 'release', 'loudness'],
    paths: ['mix'],
    author: 'Griffin Brown · iZotope',
    note: tutorialNote,
  },
  {
    id: 'izotope-stereo',
    title: text('Mono ve stereo: dinle ve karşılaştır', 'Mono vs. Stereo in Audio Mixing'),
    description: text(
      'Pan ile genişliği ayır; mono toplamında dengenin ve merkez seslerin nasıl değiştiğini dinle.',
      'Separate panning from width; hear how the balance and centred sounds change in the mono sum.',
    ),
    url: 'https://www.izotope.com/community/blog/mono-vs-stereo',
    kind: 'video',
    language: 'en',
    price: 'free',
    sourceChecked: checked,
    skills: ['stereo'],
    paths: ['mix'],
    author: 'Chris Wainwright · iZotope',
    note: tutorialNote,
  },
  {
    id: 'izotope-space',
    title: text('Reverb ve delay: hangi farkı dinlemeli?', 'Reverb vs. delay: when to use each'),
    description: text(
      'Yoğun yankı kuyruğunu ayrı tekrarlardan ayır. Örneklerin ardından aynı kararı kendi kısa kaydında dene.',
      'Distinguish a dense reverb tail from discrete echoes. Then try the same decision on your own short recording.',
    ),
    url: 'https://www.izotope.com/community/blog/when-to-use-reverb-and-delay',
    kind: 'video',
    language: 'en',
    price: 'free',
    sourceChecked: checked,
    skills: ['reverb', 'delay'],
    paths: ['mix'],
    author: 'Audrey Martinovich · iZotope',
    note: tutorialNote,
  },
  {
    id: 'musictheory-ear',
    title: text(
      'Aralık ve akor için seçilebilir dinleme alıştırmaları',
      'Customisable interval and chord ear-training exercises',
    ),
    description: text(
      'Exercises → Ear Training altında Interval veya Chord Identification seç. Başlangıçta yalnız çalıştığın aralıkları veya majör/minör akorları aç.',
      'Under Exercises → Ear Training, choose Interval or Chord Identification. Begin with just the intervals or major/minor chords you are studying.',
    ),
    url: 'https://www.musictheory.net/exercises',
    kind: 'practice',
    language: 'en',
    price: 'free',
    sourceChecked: checked,
    skills: ['direction', 'interval', 'chord'],
    paths: musicPaths,
    author: 'musictheory.net',
    note: text(
      'Web alıştırmaları ücretsizdir; aynı sitedeki mobil uygulamalar ayrı ürünlerdir. İngilizce arayüz.',
      'The web exercises are free; the site’s mobile apps are separate products. English interface.',
    ),
  },
  {
    id: 'teoria-melody',
    title: text('Melodik dikte', 'Melodic Dictation'),
    description: text(
      'Kısa melodiyi dinle, yaz ve karşılaştır. Bu dış alıştırma porte kullanır; Freq’in eşit vuruş kutularından daha geniş bir görevdir.',
      'Listen to a short melody, write it and compare. This external exercise uses staff notation and goes beyond Freq’s equal-beat boxes.',
    ),
    url: 'https://www.teoria.com/en/exercises/md.php',
    kind: 'practice',
    language: 'en',
    price: 'free',
    sourceChecked: checked,
    skills: ['tonic', 'degree', 'memory', 'melodic-dictation'],
    paths: musicPaths,
    author: 'José Rodríguez Alvira · teoría',
  },
  {
    id: 'teoria-rhythm',
    title: text('Kalıplarla ritmik dikte', 'Rhythmic Dictation using Patterns'),
    description: text(
      'Duyduğun ritmi kalıplarla yaz. Az sayıda nota değeriyle başla; sesli sayımı ve vuruşları birlikte koru.',
      'Write the rhythm you hear using patterns. Start with a small set of note values; maintain the pulse while counting aloud.',
    ),
    url: 'https://www.teoria.com/en/exercises/rdp.php',
    kind: 'practice',
    language: 'en',
    price: 'free',
    sourceChecked: checked,
    skills: ['rhythm', 'rhythmic-dictation', 'rhythm-repeat'],
    paths: musicPaths,
    author: 'José Rodríguez Alvira · teoría',
  },
  {
    id: 'teoria-harmony',
    title: text('Kalıplarla armonik yürüyüşler', 'Harmonic Progressions using Patterns'),
    description: text(
      'Tonal bağlamı dinleyip akor yürüyüşünü yaz. Önce basit majör kadansları ve tonik–hazırlık–dominant ilişkisini çalış.',
      'Hear the tonal context and write the chord progression. Begin with simple major-key cadences and tonic–predominant–dominant relationships.',
    ),
    url: 'https://www.teoria.com/en/exercises/hpp.php',
    kind: 'practice',
    language: 'en',
    price: 'free',
    sourceChecked: checked,
    skills: ['function', 'tonic', 'degree'],
    paths: musicPaths,
    author: 'José Rodríguez Alvira · teoría',
  },
  {
    id: 'ankara-note-values',
    title: text('Notaların Süre Değerleri 1', 'Note durations 1'),
    description: text(
      'Ritim kutularından nota sürelerine geçmek için kısa bir temel konu. Videodan sonra dörtlük ve sekizlikleri sayıp el çırparak uygula.',
      'A foundational topic for moving from rhythm boxes to note durations. After the video, count and clap quarter notes and eighth notes.',
    ),
    url: 'https://acikders.ankara.edu.tr/mod/url/view.php?id=58726',
    kind: 'video',
    language: 'tr',
    price: 'free',
    sourceChecked: checked,
    skills: ['rhythm', 'rhythmic-dictation', 'rhythm-repeat'],
    paths: musicPaths,
    author: 'Salim Sever · Ankara Üniversitesi ANKADEM',
    note: text(
      'Türkçe eğitim sayfası videoyu resmî olarak sunar; misafir erişimi açık ve ücretsizdir. Bağlı YouTube videosunun oynatımı, ses dili ve altyazıları bu incelemede doğrulanmadı.',
      'The Turkish teaching page officially presents the video with free guest access. Playback, spoken language and captions of the linked YouTube video were not verified in this review.',
    ),
  },
  {
    id: 'open-music-theory',
    title: text('Open Music Theory · açık ders kitabı', 'Open Music Theory · open textbook'),
    description: text(
      'Aralıklar, ritmik değerler ve melodik dikte için ücretsiz İngilizce başvuru. Yalnız çalıştığın konuyu oku, ardından sesi söyle/çal ve yeni örneğe uygula.',
      'A free English reference for intervals, rhythmic values and melodic dictation. Read only the topic you are studying, then sing/play it and apply it to a fresh example.',
    ),
    url: 'https://github.com/openmusictheory/openmusictheory.github.io',
    kind: 'book',
    language: 'en',
    price: 'free',
    sourceChecked: checked,
    skills: musicSkills,
    paths: musicPaths,
    author: 'Kris Shaffer, Bryn Hughes, Brian Moseley · Hybrid Pedagogy Publishing',
    note: text(
      'Yazarların resmî açık kitap deposu ve CC BY–SA 4.0 lisansı doğrulandı. Bu, eski açık web sürümünün kaynak metnidir; güncel Pressbooks sürümünün erişimi doğrulanmadı. Türkçe çeviri iddiası yok.',
      'The authors’ official open-book repository and CC BY–SA 4.0 licence were verified. This is the source text of the earlier open web edition; access to the current Pressbooks edition was not verified. No Turkish translation is claimed.',
    ),
  },
  {
    id: 'mixing-secrets-book',
    title: text(
      'Mixing Secrets for the Small Studio · isteğe bağlı kitap',
      'Mixing Secrets for the Small Studio · optional book',
    ),
    description: text(
      'Mike Senior’ın denge, kompresyon, EQ, reverb, delay ve stereo konularını içeren İngilizce kitabı. Yalnız odak konunu seç; okuduktan sonra kendi kısa kaydında tek değişkenle dene.',
      'Mike Senior’s English book covers balance, compression, EQ, reverb, delay and stereo. Choose only your focus topic, then try one variable on your own short recording.',
    ),
    url: 'https://kutuphane.gazi.edu.tr/record=b1659292*tur',
    kind: 'book',
    language: 'en',
    price: 'paid',
    sourceChecked: checked,
    skills: mixSkills,
    paths: ['mix'],
    author: 'Mike Senior · Elsevier/Focal Press',
    note: text(
      'Gazi Üniversitesi kataloğundan 2011 baskısının yazar, başlık, yayıncı ve içindekiler bilgisi doğrulandı. Bağlantı kitap metni veya satış sayfası değildir; e-kitap erişimi, güncel fiyat ve stok doğrulanmadı. Ücretli kitap isteğe bağlıdır; önce kütüphane erişimini araştır.',
      'Gazi University’s catalogue verifies the author, title, publisher and contents of the 2011 edition. The link is bibliographic metadata, not the book text or a sales page; e-book access, current price and availability were not verified. The paid book is optional; check library access first.',
    ),
  },
];

const shortMix = text(
  '5–8 dakika: iki açıklamalı karşılaştırma, beş yeni soru, bir cümle dinleme notu. Ertesi gün yeni bir kaynakla dön.',
  '5–8 minutes: two guided comparisons, five fresh questions and a one-sentence listening note. Return the next day with a different source.',
);
const shortMusic = text(
  '5–8 dakika: iki açıklamalı örnek, beş yeni soru ve yanlışın sesli karşılaştırması. Sonraki gün önce cevabı görmeden hatırla.',
  '5–8 minutes: two guided examples, five fresh questions and an audible comparison of mistakes. On the next day, recall before looking at the answer.',
);
const rhythmSession = text(
  '5–8 dakika: iki yavaş kalıp, beş yeni soru, bir yanlış kalıbın sayarak tekrarı. Uygulama dışındaki tekrarında, doğru kaldığı sürece tempoyu küçük adımlarla artır.',
  '5–8 minutes: two slow patterns, five fresh questions and one mistaken pattern repeated while counting. When practising outside the app, raise the tempo in small steps while the pattern stays accurate.',
);

export const studyGuides: Record<SkillId, StudyGuide> = {
  eq: {
    cue: text(
      'A/B arasında ağırlık, gövde ve parlaklığın nerede değiştiğini dinle.',
      'Listen for where weight, body or brightness changes between A and B.',
    ),
    steps: [
      text(
        'A’yı dinle, B’ye geçmeden hangi bölgeyi izleyeceğini söyle: bas, orta veya tiz.',
        'Hear A and name the region you will follow before switching to B: lows, mids or highs.',
      ),
      text(
        'Aynı zaman noktasında A/B geçişi yap. Önce geniş ve belirgin farklarla çalış; sonra frekans noktalarını daralt.',
        'Switch A/B at the same point in time. Start with broad, obvious differences, then narrow the frequency choices.',
      ),
      text(
        'Yanıttan sonra hedef eğriyi incele; yanlışsa C’yi B ile karşılaştır ve farkı kendi kelimelerinle yaz.',
        'After answering, inspect the target curve; compare C with B after a mistake and describe the difference in your own words.',
      ),
    ],
    session: shortMix,
    transfer: text(
      'Kendi kaydında tek EQ bandını değiştir; seviyeyi eşleyip miks içinde karar ver. Frekans sıfatlarını her kaynağın kendi bağlamıyla ilişkilendir.',
      'Change one EQ band on your own recording; match levels and decide in the mix. Relate frequency descriptions to the particular source.',
    ),
    freshCheck: text(
      'Ertesi gün farklı bir kaynakta beş duyulmamış örnek çöz. Frekans bölgesi ile yükseltme/kesme yönünü karıştırıp karıştırmadığını ayrı kaydet.',
      'The next day, try five unheard examples on a different source. Record separately whether you confused the region or the boost/cut direction.',
    ),
    resourceIds: ['izotope-eq', 'mixing-secrets-book'],
  },
  loudness: {
    cue: text(
      'Ses renginden ayrı olarak, aynı kaynağın göreli seviyesini izle.',
      'Track the relative level of the same source separately from its tone.',
    ),
    steps: [
      text(
        'Cihaz sesini rahat bir seviyede sabitle; A/B boyunca değiştirme.',
        'Set a comfortable device volume and keep it fixed throughout A/B.',
      ),
      text(
        'Aynı vuruş veya cümlede geçiş yap; B için yüksek, düşük veya aynı diye karar ver.',
        'Switch at the same hit or phrase; decide whether B is louder, softer or unchanged.',
      ),
      text(
        'Önce belirgin farkları, sonra küçük farkları çalış. Yanıttan sonra dB farkını gör ve duyduğunla ilişkilendir.',
        'Work on clear differences before small ones. After answering, relate the displayed dB difference to what you heard.',
      ),
    ],
    session: shortMix,
    transfer: text(
      'DAW’da bir efektin giriş/çıkış seviyesini eşle, sonra ses rengini yeniden değerlendir. Daha yüksek sesi otomatik olarak tercih edip etmediğini gözle.',
      'Match an effect’s input/output levels in a DAW, then reassess the tone. Notice whether you automatically prefer the louder version.',
    ),
    freshCheck: text(
      'Başka kaynakta beş yeni yüksek/düşük/aynı çifti dinle. Bu göreli sinyal farkı, kulaklığındaki ses basıncı ölçümü değildir.',
      'Hear five fresh louder/softer/equal pairs on another source. This relative signal difference does not measure sound pressure at your headphones.',
    ),
    resourceIds: ['izotope-dynamics', 'mixing-secrets-book'],
  },
  compression: {
    cue: text(
      'İlk vuruş ile gövdenin ilişkisini ve cümlenin dinamik hareketini dinle.',
      'Hear the relationship between the initial hit and body, and the phrase’s dynamic movement.',
    ),
    steps: [
      text(
        'Ortalama seviyesi eşlenmiş A/B’yi aynı anda karşılaştır; kompresyonu yüksek sesle karıştırma.',
        'Compare average-level-matched A/B at the same point; separate compression from loudness.',
      ),
      text(
        'Eşik, atak ve bırakma sabitken yalnız oranı karşılaştır. Önce sıkıştırılmış/sıkıştırılmamış ayrımını dinle.',
        'Compare only the ratio while threshold, attack and release stay fixed. First hear compressed versus uncompressed.',
      ),
      text(
        'Yanıttan sonra C ile hedef B’yi karşılaştır; vuruşun kenarı mı, gövde mi değişti diye not al.',
        'After answering, compare C with target B; note whether the hit’s edge or its body changed.',
      ),
    ],
    session: shortMix,
    transfer: text(
      'Kendi davul veya vokal kaydında tek oran değişikliğini eşlenmiş seviyede karşılaştır; kararını tüm miks içinde yeniden dinle.',
      'Compare a single ratio change on your own drum or vocal recording at matched levels; reassess the decision in the whole mix.',
    ),
    freshCheck: text(
      'Başka dokuda beş yeni örnek çöz. Aynı oran her kaynakta aynı duyulmaz; tanıdık ayara değil duyulan dinamiğe karar ver.',
      'Try five fresh examples with another texture. The same ratio sounds different on different sources; judge the audible dynamics rather than a familiar setting.',
    ),
    resourceIds: ['izotope-dynamics', 'mixing-secrets-book'],
  },
  attack: {
    cue: text(
      'Vuruşun en başındaki kenarın ne kadar geçtiğini dinle.',
      'Listen for how much of the hit’s initial edge passes through.',
    ),
    steps: [
      text(
        'Net başlangıcı olan bir kaynak seç; önce A’daki ilk vuruşu tek başına takip et.',
        'Choose a source with a clear onset; first follow the initial hit in A.',
      ),
      text(
        'Diğer kontroller sabitken hızlı ve yavaş atağı aynı noktada karşılaştır; ilk kenarla sonraki gövdeyi ayır.',
        'With other controls fixed, compare fast and slow attack at the same point; separate the initial edge from the later body.',
      ),
      text(
        'Yanlışsa C/B karşılaştırmasını yalnız ilk vuruş için dinle, sonra tam döngüye dön.',
        'After a mistake, compare C/B focusing on the first hit, then return to the full loop.',
      ),
    ],
    session: shortMix,
    transfer: text(
      'DAW’da bir davulun atak kontrolünü tek başına değiştir; transientin miksteki yerini dinle. Farklı kompresörlerin aynı ms değeri farklı davranabilir.',
      'Change only a drum compressor’s attack in a DAW; hear the transient’s place in the mix. Identical millisecond settings can behave differently on different compressors.',
    ),
    freshCheck: text(
      'Yeni davul ve tuşlu kaynaklarda aynı ipucunu ara. Beş yeni örnekte ilk kenarı duyup duymadığını yaz.',
      'Look for the same cue on fresh drum and keyboard sources. In five fresh examples, note whether you heard the initial edge.',
    ),
    resourceIds: ['izotope-dynamics', 'mixing-secrets-book'],
  },
  release: {
    cue: text(
      'Vuruştan sonra seviye ne zaman geri geliyor; sonraki vuruşa taşan azaltma var mı?',
      'When does the level recover after a hit, and does reduction carry into the next one?',
    ),
    steps: [
      text(
        'İlk vuruştan çok iki vuruş arasındaki gövdeyi ve boşluğu izle.',
        'Follow the body and gap between hits more than the initial hit.',
      ),
      text(
        'Atak ve oran sabitken kısa/uzun bırakmayı karşılaştır. Geri dönüşü ritmin nabzıyla birlikte dinle.',
        'Compare short/long release with attack and ratio fixed. Hear the recovery against the rhythm’s pulse.',
      ),
      text(
        'Yanlış cevabı hedefle karşılaştır; hangi boşlukta seviye geri geldiğini işaretle.',
        'Compare a mistaken answer with the target; identify the gap where the level recovered.',
      ),
    ],
    session: shortMix,
    transfer: text(
      'Kendi bas veya davul kaydında bırakmayı tek başına değiştir; nefes/pumping hissini bütün groove içinde değerlendir.',
      'Change only release on your own bass or drums; judge the breathing or pumping against the whole groove.',
    ),
    freshCheck: text(
      'Farklı hız ve ses dokusunda yeni örnekler dinle. Kısa veya uzun bırakmanın kendiliğinden daha iyi olduğu varsayımını kullanma.',
      'Hear fresh examples at different tempos and textures. Avoid assuming that a shorter or longer release is automatically better.',
    ),
    resourceIds: ['izotope-dynamics', 'mixing-secrets-book'],
  },
  masking: {
    cue: text(
      'Hedef melodinin miks içinde hangi bölümlerinin seçilebilir kaldığını dinle.',
      'Hear which parts of the target melody remain distinct in the mix.',
    ),
    steps: [
      text(
        'Önce solo hedefi dinle ve kısa cümleyi zihninde tut.',
        'Hear the solo target first and keep the short phrase in mind.',
      ),
      text(
        'A/B mikslerine dön; yalnız eşlikteki bir bölge değişirken hedefin aynı kaldığını dinle.',
        'Return to the A/B mixes; hear the unchanged target while one region of the backing changes.',
      ),
      text(
        'Hedefin duyulan kısmını tarif et; yanlışsa C ile B’de aynı nota/cümleyi karşılaştır.',
        'Describe what became audible in the target; after a mistake, compare the same note or phrase in C and B.',
      ),
    ],
    session: shortMix,
    transfer: text(
      'Kendi iki katmanını önce solo, sonra birlikte dinle. Önce düzenleme ve seviye dengesini dene; gerekiyorsa tek EQ bölgesini değiştir.',
      'Hear two of your own layers solo and together. Try arrangement and level balance first; change a single EQ region when useful.',
    ),
    freshCheck: text(
      'Yeni melodi/eşlik çiftinde hedefi tanı ve beş yeni soruda netliği karşılaştır. Her frekans örtüşmesi düzeltilecek bir sorun değildir.',
      'Learn the target in a fresh melody/backing pair and compare clarity over five new questions. Frequency overlap is not always a problem to fix.',
    ),
    resourceIds: ['izotope-masking', 'izotope-eq', 'mixing-secrets-book'],
  },
  stereo: {
    cue: text(
      'Konumu, genişliği ve mono toplamında kalan sesi ayrı ayrı dinle.',
      'Listen separately to position, width and what survives the mono sum.',
    ),
    steps: [
      text(
        'Stereo kulaklıkla sol/sağ kontrolünü doğrula; önce yalnız pan görevini çalış.',
        'Confirm left/right playback with stereo headphones; practise panning first.',
      ),
      text(
        'Konum sabitken dar/geniş farkını dinle. Sonra aynı örneği mono toplamıyla karşılaştır.',
        'Hear narrow/wide differences while position stays fixed. Then compare that example in the mono sum.',
      ),
      text(
        'Merkez sesin seviyesi, ton rengi veya varlığı değişiyorsa not al; tek bir genişlik etiketine indirgeme.',
        'Note changes in the centred sound’s level, tone or presence instead of reducing them to a single width label.',
      ),
    ],
    session: shortMix,
    transfer: text(
      'Kendi miksinde bir genişlik kararını hem stereo hem mono dinle; merkez vokal/basın korunup korunmadığını kontrol et.',
      'Hear one width decision in your own mix in stereo and mono; check whether the centred vocal or bass survives.',
    ),
    freshCheck: text(
      'Başka kaynakta beş yeni konum/genişlik örneği çöz. Uç polarite iptali örneğini tüm gerçek faz sorunlarının ölçümü sayma.',
      'Try five fresh position/width examples on another source. An extreme polarity-cancellation example does not measure every real-world phase problem.',
    ),
    resourceIds: ['izotope-stereo', 'mixing-secrets-book'],
  },
  reverb: {
    cue: text(
      'Son vuruştan sonra kalan yoğun kuyruğu ve kuru sesle ilk yansıma arasını dinle.',
      'Hear the dense tail after the last hit and the gap between the dry sound and first reflections.',
    ),
    steps: [
      text(
        'Döngünün sonundaki boşluğu kullan; önce yalnız reverb miktarını karşılaştır.',
        'Use the gap at the end of the loop; compare only reverb amount first.',
      ),
      text(
        'Miktar sabitken kuyruk süresini, sonra süre sabitken ön gecikmeyi çalış.',
        'With amount fixed, practise tail duration; then practise pre-delay with duration fixed.',
      ),
      text(
        'Yanıttan sonra B/C’yi son vuruş ve kuyruk üzerinden karşılaştır; tek değişkeni adlandır.',
        'After answering, compare B/C through the final hit and tail; name the single changed variable.',
      ),
    ],
    session: shortMix,
    transfer: text(
      'Kendi vokal veya vurmalı kaydında tek reverb ayarını değiştir; cümleler arasındaki boşlukları ve miksin netliğini kontrol et.',
      'Change one reverb control on your own vocal or percussion; check the spaces between phrases and the mix’s clarity.',
    ),
    freshCheck: text(
      'Daha kısa bir kaynak ve farklı tempoda beş yeni örnek dinle. Eğitimdeki decay değeri gerçek oda büyüklüğünü ölçmez.',
      'Hear five fresh examples with a shorter source and another tempo. A training decay value does not measure a real room’s size.',
    ),
    resourceIds: ['izotope-space', 'mixing-secrets-book'],
  },
  delay: {
    cue: text(
      'Ayrı tekrarların aralığı, sönmesi ve sol/sağ hareketini izle.',
      'Track the spacing, fading and left/right movement of discrete echoes.',
    ),
    steps: [
      text(
        'Nabzı say; ilk tekrarın vuruşa mı, vuruş arasına mı geldiğini dinle.',
        'Count the pulse and hear whether the first echo lands on or between beats.',
      ),
      text(
        'Zaman sabitken feedback’i, ardından zaman ve feedback sabitken merkez/ping-pong farkını karşılaştır.',
        'Compare feedback with time fixed, then centre/ping-pong with time and feedback fixed.',
      ),
      text(
        'Son boşlukta tekrarları takip et; yanlışsa C ile hedef B’nin hangi tekrarında ayrıştığını bul.',
        'Follow the echoes in the final gap; after a mistake, find the echo where C differs from target B.',
      ),
    ],
    session: shortMix,
    transfer: text(
      'Kendi kısa cümlene tempoya bağlı delay ekle; yalnız zaman, feedback veya yön kontrolünden birini değiştir.',
      'Add a tempo-synchronised delay to your own short phrase; change just time, feedback or direction.',
    ),
    freshCheck: text(
      'Yeni tempoda beş yeni örnek çöz; aynı ms değeri yeni tempoda aynı nota bölümü olmayabilir.',
      'Try five fresh examples at another tempo; the same millisecond value may represent a different note division.',
    ),
    resourceIds: ['izotope-space', 'mixing-secrets-book'],
  },
  direction: {
    cue: text(
      'İkinci notanın birinciden ince, kalın veya aynı olup olmadığını izle.',
      'Hear whether the second note is higher, lower or unchanged.',
    ),
    steps: [
      text(
        'İlk notayı dinle ve rahat aralığında hafifçe mırıldan ya da zihninde tut.',
        'Hear the first note and hum it gently in a comfortable range or retain it silently.',
      ),
      text(
        'İkinci nota geldiğinde eli yukarı/aşağı/sabit hareket ettir; ses seviyesini nota yönünden ayır.',
        'Move your hand up/down/level as the second note arrives; separate loudness from pitch movement.',
      ),
      text(
        'Yanlışsa iki notayı yeniden karşılaştır; sonra başka başlangıç notasına geç.',
        'After a mistake, compare the two notes again, then move to another starting pitch.',
      ),
    ],
    session: shortMusic,
    transfer: text(
      'Bildiğin kısa bir melodiyi söylerken yalnız iniş/çıkış çizgisini çiz; sonra kaydı dinleyip çizginle karşılaştır.',
      'Draw only the rising/falling contour while singing a familiar short melody, then compare the drawing with a recording.',
    ),
    freshCheck: text(
      'Farklı başlangıç notaları ve tınılarda beş yeni çift dinle. Tek tınının parlaklığına göre yön tahmini yapma.',
      'Hear five fresh pairs with different starting notes and timbres. Avoid guessing direction from one timbre’s brightness.',
    ),
    resourceIds: ['musictheory-ear', 'open-music-theory'],
  },
  interval: {
    cue: text(
      'İki nota arasındaki mesafeyi, başlangıç notası değişse de takip et.',
      'Follow the distance between two notes even when the starting pitch changes.',
    ),
    steps: [
      text(
        'Önce iki aralık seç; küçük bir mesafeyi daha büyük mesafeyle sırayla karşılaştır.',
        'Choose two intervals first and alternate a smaller distance with a larger one.',
      ),
      text(
        'İki notayı rahat aralıkta söyle; ardından cevabı vermeden mesafeyi adlandır.',
        'Sing the two notes in a comfortable range, then name the distance before checking.',
      ),
      text(
        'Yanlış aralığı doğru hedefle sesli karşılaştır; başlangıç notasını değiştirerek yeniden dene.',
        'Compare the mistaken interval audibly with the target; retry with another starting pitch.',
      ),
    ],
    session: shortMusic,
    transfer: text(
      'Bir şarkı cümlesinden iki notalık hareket seç; kulağınla mesafeyi bul, sonra çalgıyla kontrol et. Şarkı çağrışımını ek ipucu olarak kullan.',
      'Choose a two-note movement from a song; hear the distance, then check on an instrument. Use a song association as an additional cue.',
    ),
    freshCheck: text(
      'Beş yeni başlangıç notasından aynı aralıkları tanı. Freq’in bu görevi yukarı çıkan sınırlı aralık kümesidir; dış kaynaktaki aşağı/eşzamanlı aralıklar ayrı çalışmadır.',
      'Identify the same intervals from five fresh starting pitches. Freq uses a limited set of ascending intervals; descending/simultaneous intervals in external resources are separate practice.',
    ),
    resourceIds: ['musictheory-ear', 'open-music-theory'],
  },
  chord: {
    cue: text(
      'Majör/minör ayrımında üçüncü sesin kökle ilişkisini dinle.',
      'Hear the third’s relationship to the root when distinguishing major from minor.',
    ),
    steps: [
      text(
        'Aynı kökün majör ve minör akorlarını sırayla dinle; kök ve beşlinin aynı kaldığını kontrol et.',
        'Alternate major and minor triads on the same root; check that the root and fifth stay unchanged.',
      ),
      text(
        'Akoru tek tek seslerine ayırarak söyle veya çal; sonra üç sesi birlikte dinle.',
        'Sing or play the chord as separate notes, then hear all three together.',
      ),
      text(
        'Yanlışsa hedefle karşılaştır; mutlu/üzgün etiketinden önce üçüncünün mesafesini tarif et.',
        'After a mistake, compare with the target; describe the third’s distance before using happy/sad labels.',
      ),
    ],
    session: shortMusic,
    transfer: text(
      'Bildiğin parçanın bir majör/minör akorunu çalgıda bul; farklı köklerde tekrar kur ve birlikte dinle.',
      'Find a major/minor chord from a familiar piece on an instrument; rebuild and hear it on different roots.',
    ),
    freshCheck: text(
      'Farklı köklerde beş yeni akor dinle. Çevrim ve karmaşık akorlar bu başlangıç görevinin ötesinde ayrıca çalışılır.',
      'Hear five fresh chords on different roots. Inversions and complex chords require separate practice beyond this introductory task.',
    ),
    resourceIds: ['musictheory-ear', 'open-music-theory'],
  },
  rhythm: {
    cue: text(
      'Nabız sabitken hangi vuruşun bir alt bölüme kaydığını dinle.',
      'Hear which hit moves by a subdivision while the pulse stays fixed.',
    ),
    steps: [
      text(
        'Dört sayımla nabzı kur; A boyunca 1 & 2 & ya da 1 e & a sayımını sürdür.',
        'Establish the pulse with the count-in; keep counting 1 & 2 & or 1 e & a through A.',
      ),
      text(
        'B’yi sonuna kadar dinle; farkın olduğu vuruş grubunu önce bul, sonra konumunu adlandır.',
        'Hear B to the end; locate the beat group containing the difference before naming the position.',
      ),
      text(
        'Yanlışsa hedef ve seçtiğin kalıbı sayarak karşılaştır; susları da sayımın parçası yap.',
        'Compare the target and chosen pattern while counting; include rests in the count.',
      ),
    ],
    session: rhythmSession,
    transfer: text(
      'Bir ölçülük groove’u dinle; nabzı ayakla sürdürürken bir vuruşun yerini bilinçli değiştir ve farkı dinle.',
      'Hear a one-bar groove; keep the pulse with your foot while deliberately moving one hit and listening to the difference.',
    ),
    freshCheck: text(
      'Yeni kalıplar ve başka tempoda aynı/yer değiştirmiş ayrımını dene. Freq’in sınırlı kalıp havuzunu ezberlemek yeni ritme aktarım kanıtı değildir.',
      'Try same/shifted discrimination with fresh patterns at another tempo. Memorising Freq’s limited pattern pool does not demonstrate transfer to new rhythms.',
    ),
    resourceIds: ['ankara-note-values', 'teoria-rhythm', 'open-music-theory'],
  },
  memory: {
    cue: text(
      'Melodinin yönünü, başlangıcını ve küçük gruplarını belleğinde tut.',
      'Retain the melody’s contour, opening and small groups.',
    ),
    steps: [
      text(
        'A’yı bir bütün olarak dinle; notaları ikili/üçlü küçük gruplara ayır.',
        'Hear A as a whole and group notes into small pairs or threes.',
      ),
      text(
        'B’den önce A’yı sessizce hatırla; B’de hangi konumun değiştiğini takip et.',
        'Recall A silently before B; follow which position changes in B.',
      ),
      text(
        'Yanıttan sonra değişen konumu yeniden dinle; yalnız tüm melodiyi tekrar etmek yerine o grubu karşılaştır.',
        'After answering, rehear the changed position; compare that group instead of only repeating the full melody.',
      ),
    ],
    session: shortMusic,
    transfer: text(
      'İlk kez duyduğun kısa bir cümleyi kaydı durdurup mırıldan; sonra kaydı aç ve nota sırasını karşılaştır.',
      'Pause a newly heard short phrase and hum it, then replay the recording and compare the note order.',
    ),
    freshCheck: text(
      'Sonraki gün beş yeni melodide aynı/değişmiş ayrımını dene; tek eski melodiyi hatırlamayı genel hafıza puanı sayma.',
      'The next day, try same/changed discrimination on five fresh melodies; remembering one old melody is not a general memory score.',
    ),
    resourceIds: ['teoria-melody', 'open-music-theory'],
  },
  tonic: {
    cue: text(
      'Kadansın kurduğu eve dönüş sesini, son veya en kalın notadan ayrı dinle.',
      'Hear the home note established by the cadence separately from the final or lowest note.',
    ),
    steps: [
      text(
        'I–IV–V7–I bağlamını sonuna kadar dinle; merkez sesi rahat aralığında mırıldan.',
        'Hear the complete I–IV–V7–I context and hum the centre in a comfortable range.',
      ),
      text(
        'Adayları bu bağlama göre dinle; son melodik notaya bakmadan eve dönüşü seç.',
        'Hear the candidates against the context; choose home independently of the final melody note.',
      ),
      text(
        'Yanlışsa kadans → hedef → seçimin sırasıyla dinle; aynı bağlamda farkı tarif et.',
        'After a mistake, hear cadence → target → your choice and describe the difference in that context.',
      ),
    ],
    session: shortMusic,
    transfer: text(
      'Basit majör bir parçada cümle arasında tonal merkezi mırıldan, sonra çalgıyla kontrol et; son notanın farklı olabileceğini dinle.',
      'Hum the tonal centre between phrases of a simple major-key piece, then check on an instrument; hear when the last note differs.',
    ),
    freshCheck: text(
      'Başka tonlarda ve tonikle bitmeyen beş yeni cümle dinle. Bu majör tonalite çalışması makam işitmesini ölçmez.',
      'Hear five fresh phrases in other keys that do not all end on tonic. This major-tonality practice does not measure makam hearing.',
    ),
    resourceIds: ['teoria-harmony', 'teoria-melody', 'open-music-theory'],
  },
  degree: {
    cue: text(
      'Sorulan notayı, bağlamın merkezine göre 1–7 arasında ilişkilendir.',
      'Relate the target note to the context’s centre as a degree from 1 to 7.',
    ),
    steps: [
      text(
        'Kadansı dinle ve 1’i zihninde tut; 1 sabit bir nota adı değildir.',
        'Hear the cadence and retain degree 1; 1 is not a fixed note name.',
      ),
      text(
        'Önce 1, 3 ve 5’i; sonra kalan dereceleri karşılaştır. Sorulan sesten merkeze rahat aralıkta dönmeyi dene.',
        'Compare 1, 3 and 5 first, then add other degrees. Try returning from the target to the centre in a comfortable range.',
      ),
      text(
        'Yanlışsa doğru ve seçtiğin dereceyi aynı kadansın ardından sırayla dinle.',
        'After a mistake, hear the correct and chosen degrees in turn after the same cadence.',
      ),
    ],
    session: shortMusic,
    transfer: text(
      'Basit majör melodinin ilk birkaç notasını dereceyle söyle; tonu değiştirip aynı ilişkileri koru.',
      'Sing the first few notes of a simple major melody as degrees; change key while keeping the relationships.',
    ),
    freshCheck: text(
      'Farklı tonlarda beş yeni hedef notayı tanı; ezberlenen mutlak nota yüksekliğine göre yanıt verme.',
      'Identify five fresh target notes in different keys; avoid answering from a memorised absolute pitch.',
    ),
    resourceIds: ['teoria-melody', 'teoria-harmony', 'open-music-theory'],
  },
  function: {
    cue: text(
      'Akorun renk etiketinden önce bağlamda dinlenme, hazırlık ve dominant gerilimini izle.',
      'Follow rest, preparation and dominant tension in context before labelling the chord’s colour.',
    ),
    steps: [
      text(
        'Önce tonal bağlamı kur; I, IV/ii ve V/V7 örneklerini aynı tonda karşılaştır.',
        'Establish the key first; compare I, IV/ii and V/V7 in the same key.',
      ),
      text(
        'Bas sesini ve merkeze dönüş hissini birlikte dinle; çevrimde en kalın notayı otomatik kök sayma.',
        'Hear the bass and return to the centre together; do not automatically treat the lowest note in an inversion as the root.',
      ),
      text(
        'Yanıttan sonra hedef ve seçtiğin akoru kadans içinde karşılaştır; sonraki aşamada V–I, IV–I ve V–vi dönüşlerini ayır.',
        'After answering, compare target and chosen chords within the cadence; later distinguish V–I, IV–I and V–vi arrivals.',
      ),
    ],
    session: shortMusic,
    transfer: text(
      'Basit majör bir parçanın kısa akor yürüyüşünü çal; cümlenin nereye yöneldiğini söyle ve kadansı kulağınla kontrol et.',
      'Play a short progression from a simple major-key piece; describe its direction and check the cadence by ear.',
    ),
    freshCheck: text(
      'Yeni ton, farklı çevrim ve beş yeni yürüyüşle ilişkileri dinle. Bu roller çalışılan tonal bağlama aittir.',
      'Hear the relationships in a new key, different inversions and five fresh progressions. These roles belong to the tonal context being studied.',
    ),
    resourceIds: ['teoria-harmony', 'open-music-theory'],
  },
  'melodic-dictation': {
    cue: text(
      'Önce cümlenin yönünü, sonra her konumun derecesini ve susunu dinle.',
      'Hear the phrase’s contour first, then each position’s degree and rest.',
    ),
    steps: [
      text(
        'Kadansı ve bütün melodiyi dinle; yazmadan önce başlangıcı ve yön çizgisini hatırla.',
        'Hear the cadence and full melody; recall the opening and contour before writing.',
      ),
      text(
        'Küçük gruplar halinde derece kutularını doldur; susları boş bir tahminle geçme. Pratikte taslağını dinleyip düzenle.',
        'Fill degree boxes in small groups and identify rests deliberately. In practice, listen to your draft and revise.',
      ),
      text(
        'Yanıttan sonra her konumu hedefle karşılaştır; derece ve sıra hatalarını ayrı not al.',
        'After answering, compare every position with the target; note degree errors separately from order errors.',
      ),
    ],
    session: shortMusic,
    transfer: text(
      'Kısa yeni bir melodiyi önce dereceyle, sonra biliyorsan porteyle yaz; çalgıda çalıp kayda karşılaştır.',
      'Write a fresh short melody as degrees, then on a staff if you know notation; play it on an instrument and compare with the recording.',
    ),
    freshCheck: text(
      'Sonraki gün farklı tonda beş yeni cümleyi ilk denemeyle yaz. Freq eşit süreli kısa majör cümleler kullanır; daha uzun/minör/kromatik dikte ayrı çalışmadır.',
      'The next day, write five fresh phrases in another key on the first attempt. Freq uses short major phrases with equal durations; longer, minor or chromatic dictation is separate practice.',
    ),
    resourceIds: ['teoria-melody', 'open-music-theory'],
  },
  'rhythmic-dictation': {
    cue: text(
      'Her vuruş grubunda sesin ve sessizliğin hangi alt bölüme geldiğini dinle.',
      'Hear which subdivisions contain sound or silence in each beat group.',
    ),
    steps: [
      text(
        'Dört sayımla nabzı kur; kalıbı yazmadan önce sonuna kadar sayarak dinle.',
        'Establish the pulse with the count-in and hear the complete pattern while counting before writing.',
      ),
      text(
        'Önce vuruş gruplarını, sonra alt bölümleri doldur; dolu kutu ses, boş kutu sessizliktir.',
        'Fill beat groups first, then subdivisions; a filled box is sound and an empty box is silence.',
      ),
      text(
        'Pratikte yazdığın kalıbı dinle. Yanıttan sonra her kutuyu hedefle karşılaştır ve kayan vuruşu sayarak tekrar et.',
        'Listen to your draft in practice. After answering, compare every box with the target and repeat the shifted hit while counting.',
      ),
    ],
    session: rhythmSession,
    transfer: text(
      'Yeni bir ölçülük groove’u bölme ızgarasına yaz; sonra el çırp ve kayıtla karşılaştır. Porte biliyorsan nota değerlerine çevir.',
      'Write a fresh one-bar groove on a subdivision grid, then clap it and compare with the recording. Convert it to note values if you know staff notation.',
    ),
    freshCheck: text(
      'Yeni kalıp ve başka tempoda beş ilk deneme yap. Kutu doğruluğu gerçek porteli uzun diktenin tamamını ölçmez.',
      'Make five first attempts with fresh patterns at another tempo. Grid accuracy does not measure complete long-form staff dictation.',
    ),
    resourceIds: ['ankara-note-values', 'teoria-rhythm', 'open-music-theory'],
  },
  'rhythm-repeat': {
    cue: text(
      'Nabzı korurken kalıbın yerel zamanlamasını, eksik ve fazla vuruşlarını izle.',
      'Track local timing and missing/extra hits while keeping the pulse.',
    ),
    steps: [
      text(
        'Örneği önce bitir; tekrarın dört hazırlık sayımında nabzı kur ve kalıbı zihninde hazırla.',
        'Finish the example first; establish the pulse during the reproduction count-in and prepare the pattern mentally.',
      ),
      text(
        'Yeşil cevap alanında dokun veya boşluk tuşunu kullan; bütün ölçüyü tek seferde tamamla.',
        'Tap or use the space bar in the green answer area and finish the whole bar in one pass.',
      ),
      text(
        'İncelemede eksik/fazla vuruşu yerel erken/geç vuruştan ayır; gerekiyorsa sayarak tekrar dene, sonra gönder.',
        'During review, separate missing/extra hits from locally early/late ones; retry while counting when useful, then submit.',
      ),
    ],
    session: rhythmSession,
    transfer: text(
      'Aynı kalıbı uygulama dışında el çırparak veya çalgıyla metronoma karşı çal; kaydını dinle. Tekrar görevini yalnız ekran dokunuşuna bağlama.',
      'Perform the same pattern outside the app by clapping or playing against a metronome; listen to your recording. Practise reproduction beyond screen tapping.',
    ),
    freshCheck: text(
      'Başka tempoda yeni kalıplar dene. Küçük sabit gecikme uygulamada dengelenebilir; skor cihaz gecikmesi veya çalgı performansı ölçümü değildir.',
      'Try fresh patterns at another tempo. The app may compensate a small constant delay; the score does not measure device latency or instrumental performance.',
    ),
    resourceIds: ['ankara-note-values', 'teoria-rhythm', 'open-music-theory'],
  },
};
