import { text, type Text } from './i18n';
import type { Lesson } from './content';
import { musicSkills, type MusicSkill } from './music-types';
export const musicSkillNames: Record<MusicSkill, Text> = {
  tonic: text('Tonal merkez', 'Tonal centre'), degree: text('Dizi dereceleri', 'Scale degrees'), function: text('İşlevsel işitme', 'Functional hearing'),
  'melodic-dictation': text('Melodik dikte', 'Melodic dictation'), 'rhythmic-dictation': text('Ritmik dikte', 'Rhythmic dictation'), 'rhythm-repeat': text('Ritim tekrarı', 'Rhythm reproduction'),
};
const titles: Record<MusicSkill, Text[]> = {
  tonic: [text('Eve dönen sesi bul', 'Find the home note'), text('Son nota her zaman tonik değil', 'The last note is not always home'), text('Farklı tonlarda merkez', 'Home in different keys')],
  degree: [text('1, 3 ve 5’i duy', 'Hear 1, 3 and 5'), text('İlk beş derece', 'The first five degrees'), text('Yedi derecenin rengi', 'The colour of seven degrees')],
  function: [text('Tonik, hazırlık, dominant', 'Tonic, preparation, dominant'), text('Çevrimlerin altında işlev', 'Function beneath inversions'), text('Armonik dönüşler', 'Harmonic arrivals')],
  'melodic-dictation': [text('Üç sesi sıraya yaz', 'Write three notes in order'), text('Dört derecelik melodi', 'A four-note melody'), text('Altı adım ve sus', 'Six steps and a rest')],
  'rhythmic-dictation': [text('Dörtlük vuruşları yaz', 'Write quarter-note hits'), text('Sekizlik yerleşimler', 'Eighth-note positions'), text('Onaltılık ritim haritası', 'A sixteenth-note rhythm map')],
  'rhythm-repeat': [text('Dört vuruşta tekrar', 'Repeat across four beats'), text('Sekizlik kalıbı çal', 'Tap an eighth-note pattern'), text('Onaltılıkta zamanlama', 'Sixteenth-note timing')],
};
const description: Record<MusicSkill, Text> = {
  tonic: text('Kadans ve melodiyi dinle; üç ses arasından tonal merkezi seç.', 'Hear the cadence and melody; choose the tonal centre from three notes.'),
  degree: text('Notanın majör tonalitedeki yerini, tonik referansıyla tanı.', 'Recognise a note’s place in a major key with a tonic reference.'),
  function: text('Akorları ses renginden öte, tonal bağlamdaki rolleriyle duy.', 'Hear chords through their roles in a tonal context as well as their colour.'),
  'melodic-dictation': text('Kısa, tek sesli melodinin derecelerini adım adım yaz.', 'Write the degrees of a short monophonic melody, step by step.'),
  'rhythmic-dictation': text('Dört sayımdan sonra duyduğun bir ölçüyü vuruş ve boşluk olarak yaz.', 'After four count-in clicks, write one bar as hits and gaps.'),
  'rhythm-repeat': text('Dinlediğin bir ölçüyü ekrana dokunarak veya boşluk tuşuyla tekrar et.', 'Reproduce one bar by tapping the screen or using the space bar.'),
};
export const musicLessons: Lesson[] = musicSkills.flatMap(skill => [1, 2, 3].map(level => ({
  id: `${skill}-${level}`, path: 'music' as const, skill, level, title: titles[skill][level - 1], description: description[skill],
  learn: skill === 'tonic' || skill === 'degree' || skill === 'melodic-dictation'
    ? text('Önce I–IV–V7–I kadansı majör tonaliteyi kurar. 1, o tonalitenin merkezidir; sabit bir nota adı değildir. Başlangıç sesi değişir. Sayılar göreli dereceleri gösterir; mutlak nota tahmini gerekmez.', 'An I–IV–V7–I cadence first establishes a major key. 1 is that key’s centre, not a fixed note name. The starting pitch changes. Numbers indicate relative degrees; absolute pitch is not required.')
    : skill === 'function'
    ? text('Önce majör tonalite kurulur. I tonik, IV/ii dominantı hazırlayan akorlar, V/V7 dominant olarak çalışılır. Üçüncü seviyede V–I, IV–I ve V–vi dönüşlerini ayırt edeceğiz. Bu roller bu örneklerin bağlamına aittir.', 'A major key is established first. We practise I as tonic, IV/ii as predominant and V/V7 as dominant. Level three distinguishes V–I, IV–I and V–vi arrivals. These roles refer to the context of these examples.')
    : text('Ölçü 4/4. Dört belirgin sayım sesinden sonra kalıbı dinle. İlk seviyede her vuruş bir, ikinci seviyede iki, üçüncü seviyede dört bölümdür. Alçak sesler kalıba, ince ve hafif sesler sayım/nabıza aittir.', 'The metre is 4/4. Listen to the pattern after four distinct count-in clicks. Each beat has one division at level one, two at level two and four at level three. Low clicks are the pattern; higher, quieter clicks provide the count and pulse.'),
  listen: skill === 'melodic-dictation'
    ? text('Örneği tamamla. Bir kutu seçip dereceye dokun; yanlış yazdığını değiştir. Her kutu bir eşit vuruş; “sus” o vuruşta sessizliktir. Taslağını dinleyebilir, hazır olunca gönderebilirsin.', 'Finish the sample. Select a box and tap a degree; edit any entry. Each box is one equal beat; a rest means silence on that beat. Preview your draft, then submit when ready.')
    : skill === 'rhythmic-dictation'
    ? text('Örneği tamamla. Dört vuruş grubundaki kutulara dokun: dolu kutu ses, boş kutu sessizlik. Yazdığın kalıbı dinle; hazır olduğunda gönder.', 'Finish the sample. Tap boxes within four beat groups: a filled box is a hit and an empty box is silence. Listen to your pattern and submit when ready.')
    : skill === 'rhythm-repeat'
    ? text('Önce örneği tamamla. Tekrarı başlat: dört sayım → örnek → dört hazırlık sayımı → senin ölçün. Yeşil alanda dokun veya boşluk tuşuna bas. Kaydı incele, tekrar dene ya da gönder. Mikrofon kullanılmaz.', 'Finish the sample first. Start reproduction: four counts → example → four preparation counts → your bar. Tap or press space in the green section. Review, retry or submit. No microphone is used.')
    : skill === 'tonic'
    ? text('Kadansı ve melodiyi sonuna kadar dinle. Aday sesleri ayrı ayrı duy; “eve dönüş” hissi veren sesi seç. Tonal bağlamı istediğin kadar tekrar dinleyebilirsin.', 'Hear the complete cadence and melody. Audition the candidate notes and choose the one that feels like home. Replay the tonal context whenever you like.')
    : text('Önce kadans, kısa boşluk, sonra sorulan ses veya akor gelir. Örneği tamamla ve yanıtla. Tonal bağlamı tekrar dinleyebilirsin.', 'You hear a cadence, a short gap, then the target note or chord. Finish the sample and answer. You can replay the tonal context.'),
  tip: skill === 'rhythm-repeat'
    ? text('Küçük, sabit gecikme ±250 ms içinde dengelenir; eksik/fazla vuruş ve yerel zamanlama hataları kalır. Bu cihaz gecikmesi ölçümü değildir. Gecikme hissedersen kablolu kulaklıkla dene. Gönderilmeyen tekrar puana yazılmaz.', 'A small constant offset is compensated within ±250 ms; missing/extra hits and local timing errors remain. This is not a measurement of device latency. Try wired headphones if you feel delay. Unsubmitted reproductions do not affect your score.')
    : skill === 'melodic-dictation' || skill === 'rhythmic-dictation'
    ? text('Bu, kısa ve eşit bölümlü başlangıç diktesidir. Yanıt sonrası her konumu karşılaştır. Porte, nota süreleri, minör/kromatik içerik ve kurum sınavlarının tamamı bu bölümün kapsamını aşar.', 'This is introductory dictation using short, equal time divisions. Compare every position after answering. Staff notation, note durations, minor/chromatic material and complete institution exams go beyond this section.')
    : text('Önce bağlamı zihninde tut; sonra sorulan sesi onunla ilişkilendir. Son nota veya en kalın nota her zaman tonik değildir. Bu sürüm majör tonaliteyi çalıştırır; makam/usul ayrıca uzmanla hazırlanacak.', 'Keep the context in mind, then relate the target to it. The last or lowest note is not always the tonic. This edition practises major tonality; makam/usul will be developed separately with experts.'),
})));
