import { text } from './i18n';
import type { Lesson } from './content';
import { EQ_STAGE_IDS } from './eq-model';

type Copy = Omit<Lesson, 'id' | 'path' | 'skill' | 'level'>;
// The frequency stages eq-1 … eq-8, in that order.
const frequencyStages: Copy[] = [
  {
    title: text('Frekans bölgeleri', 'Frequency regions'),
    description: text(
      'Bas, orta ve tiz arasındaki farkı keşfet.',
      'Discover the difference between lows, mids and highs.',
    ),
    learn: text(
      'Bas bölgesi sesin ağırlığını, orta bölge gövdesini, tiz bölge parlaklığını etkiler. Aynı döngünün bir bölgesini EQ ile yükselteceğiz; yükseltmenin merkezi her soruda bölgenin içinde biraz değişir.',
      'Lows affect weight, mids affect body, and highs affect brightness. We will boost one region of the same loop with EQ; the centre of the boost moves a little within the region from question to question.',
    ),
    listen: text(
      'A orijinal döngü. B, EQ uygulanmış hali. A ile B arasında geçiş yap ve B’de değişen bölgeyi seç.',
      'A is the original loop. B has EQ applied. Switch between A and B, then choose the region that changed in B.',
    ),
    tip: text(
      'Sesin daha yüksek olmasına değil, renginin nasıl değiştiğine odaklan. Örneklerin ortalama seviyeleri eşitlendi.',
      'Focus on the change in tone. The samples are matched for average level.',
    ),
  },
  {
    title: text('Frekans noktaları', 'Frequency landmarks'),
    description: text(
      'Beş frekans noktasını sesleriyle tanı.',
      'Learn the sound of five frequency landmarks.',
    ),
    learn: text(
      '100 Hz ağırlık, 300 Hz alt gövde, 1 kHz orta gövde, 3 kHz belirginlik ve 7 kHz parlaklık için dinleme referanslarıdır. Bu tanımlar ses kaynağına göre değişebilir.',
      '100 Hz, 300 Hz, 1 kHz, 3 kHz and 7 kHz are useful references for weight, low body, mid body, presence and brightness. These descriptions depend on the source.',
    ),
    listen: text(
      'B’de geniş bir bant yükseltildi. A/B karşılaştırmasıyla değişimin merkezini bul.',
      'A broad band is boosted in B. Use A/B comparison to identify its centre.',
    ),
    tip: text(
      'Her frekansı bir ses tarifiyle ilişkilendir. Yanıt verdikten sonra EQ eğrisini inceleyebilirsin.',
      'Associate each frequency with a sonic description. You can inspect the EQ curve after answering.',
    ),
  },
  {
    title: text('Oktav bantları: yükseltme', 'Octave bands: boosts'),
    description: text(
      'Sekiz oktav bandından hangisinin yükseltildiğini bul.',
      'Find which of eight octave bands is boosted.',
    ),
    learn: text(
      '63 Hz’den 8 kHz’e sekiz bant; her biri bir öncekinin iki katı. 63 Hz alt bas ve gümbürtü, 125 Hz bas gövdesi, 250 Hz dolgunluk ve boğukluk, 500 Hz kutu sesi, 1 kHz genizden gelen orta, 2 kHz sertlik ve öne çıkma, 4 kHz belirginlik, 8 kHz parlaklık ve ıslık. Bu sıfatlar kaynağa göre değişir; kendi kelimelerini bul.',
      'Eight bands from 63 Hz to 8 kHz, each double the one before. 63 Hz is sub weight and rumble, 125 Hz bass body, 250 Hz fullness and mud, 500 Hz boxiness, 1 kHz nasal mids, 2 kHz bite and forwardness, 4 kHz presence, 8 kHz brightness and sibilance. These words depend on the source; find your own.',
    ),
    listen: text(
      'B’de bir oktav genişliğinde bir bant 9 dB yükseltildi. Önce bölgeyi belirle: bas mı, orta mı, tiz mi? Sonra o bölgedeki komşu bantlar arasında karar ver.',
      'A band one octave wide is boosted by 9 dB in B. Settle the region first: lows, mids or highs? Then decide between the neighbouring bands in that region.',
    ),
    tip: text(
      'Komşu iki bandı karıştırmak normaldir. Yanlış yanıttan sonra B ile C arasında geçiş yap; aradaki fark tam bir oktavdır.',
      'Confusing two neighbouring bands is normal. After a wrong answer, switch between B and C; they are exactly one octave apart.',
    ),
  },
  {
    title: text('Oktav bantları: kesme', 'Octave bands: cuts'),
    description: text(
      'Eksilen bandı bul. Kesmeler yükseltmelerden daha zor duyulur.',
      'Find the missing band. Cuts are harder to hear than boosts.',
    ),
    learn: text(
      'Kesilen bant kendini göstermez; geriye kalan ses değişir. Bas kesilince ses incelir, orta kesilince içi boşalır ve geri çekilir, tiz kesilince örtülür. Gerçek mikste düzeltici EQ’nun çoğu kesmedir; bu çalışmada kesme 12 dB’dir.',
      'A cut band does not announce itself; what remains changes. Cutting lows thins the sound, cutting mids hollows it and pushes it back, cutting highs dulls it. Most corrective EQ in a real mix is a cut; here the cut is 12 dB.',
    ),
    listen: text(
      'A orijinal; B’de bir oktav bandı 12 dB kesildi. B’den A’ya dönerken neyin geri geldiğini dinle. Eksik olan bant odur.',
      'A is the original; one octave band is cut by 12 dB in B. Listen for what returns when you switch from B back to A. That is the missing band.',
    ),
    tip: text(
      'B’den A’ya geçiş, kesilen bandı yükseltilmiş gibi duymanı sağlar. Kararını bu yöndeki geçişte ver.',
      'Switching from B to A lets you hear the cut band as if it were boosted. Make your decision on that switch.',
    ),
  },
  {
    title: text('Yükseltme mi, kesme mi?', 'Boost or cut?'),
    description: text(
      'Hem bandı hem yönü bul: 9 dB yükseltme veya kesme.',
      'Find both the band and the direction: a 9 dB boost or cut.',
    ),
    learn: text(
      'Gerçek bir mikste EQ’nun ne yaptığını önceden bilmezsin. Önce yönü duy: B’de bir şey eklendi mi, eksildi mi? Sonra merkezi ara. İki kararı ayrı ayrı vermek, ikisini birden tahmin etmekten daha güvenilirdir.',
      'In a real mix you do not know in advance what the EQ did. Hear the direction first: was something added in B, or taken away? Then look for the centre. Making the two decisions separately is more reliable than guessing both at once.',
    ),
    listen: text(
      'B’de bir oktav bandı 9 dB yükseltildi veya kesildi. Üst satır yükseltme, alt satır kesme; bandı doğru satırda seç.',
      'One octave band is boosted or cut by 9 dB in B. The top row is boosts, the bottom row cuts; choose the band in the right row.',
    ),
    tip: text(
      'Bir bandın kesilmesi, komşu bölgelerin yükseltilmesi gibi duyulabilir. Emin değilsen A’ya dön ve hangisinin daha dolu olduğunu karşılaştır.',
      'Cutting one band can sound like boosting its neighbours. If unsure, return to A and compare which one sounds fuller.',
    ),
  },
  {
    title: text('Küçük hamleler', 'Smaller moves'),
    description: text(
      '6 dB’lik yükseltme ve kesmelerde bandı ve yönü bul.',
      'Find the band and direction of 6 dB boosts and cuts.',
    ),
    learn: text(
      'Miks sırasında yapılan EQ hamlelerinin çoğu 6 dB’den küçüktür. Fark küçüldükçe ilk izlenim daha önemli olur; uzun dinledikçe kulak iki hale de alışır.',
      'Most EQ moves made while mixing are smaller than 6 dB. As the difference shrinks, the first impression matters more; the longer you listen, the more your ear adapts to both versions.',
    ),
    listen: text(
      'B’de bir oktav bandı 6 dB yükseltildi veya kesildi. Kısa geçişlerle karşılaştır. Kararsız kalırsan birkaç saniye ara ver ve yeniden dinle.',
      'One octave band is boosted or cut by 6 dB in B. Compare with short switches. If undecided, pause for a few seconds and listen again.',
    ),
    tip: text(
      'Sesi açmak farkı büyütmez. Rahat bir seviyede kal ve geçiş anındaki değişime odaklan.',
      'Turning the volume up does not make the difference bigger. Stay at a comfortable level and focus on the change at the moment of switching.',
    ),
  },
  {
    title: text('Dar bantları duy', 'Hear narrow bands'),
    description: text(
      'Dar bir bantta 9 dB yükseltme veya kesmeyi bul.',
      'Find a 9 dB boost or cut in a narrow band.',
    ),
    learn: text(
      'Q arttıkça EQ daha dar bir bölgeyi etkiler. Dar yükseltme tınlayan, ıslık gibi bir renk ekler. Dar kesme ise çoğu zaman yalnızca kaynağın o bölgede enerjisi olduğu anlarda duyulur. Rezonans ararken kullanılan hamle budur.',
      'A higher Q affects a narrower region. A narrow boost adds a ringing, whistling colour. A narrow cut is often audible only at moments when the source has energy there. This is the move used when hunting resonances.',
    ),
    listen: text(
      'B’de dar bir bant (Q 3) 9 dB yükseltildi veya kesildi. Döngünün tamamını dinle: bant, kaynağın o bölgede çaldığı anlarda belirginleşir.',
      'A narrow band (Q 3) is boosted or cut by 9 dB in B. Listen to the whole loop: the band becomes clear at moments when the source plays in that region.',
    ),
    tip: text(
      'Dar bantlar her kaynakta aynı netlikte duyulmaz. Bir kaynakta zorlanırsan sonraki turda başka bir kaynak seç.',
      'Narrow bands are not equally clear on every source. If one source is hard, choose another for the next round.',
    ),
  },
  {
    title: text('Üçte bir oktav: komşu bantlar', 'Third octaves: neighbouring bands'),
    description: text(
      'Yan yana beş dar banttan hangisinin yükseltildiğini ayırt et.',
      'Tell which of five adjacent narrow bands is boosted.',
    ),
    learn: text(
      'Üçte bir oktav, grafik EQ’ların ve oda ölçümlerinin çözünürlüğüdür. Artık bölgeyi bulmak yetmez; 800 Hz ile 1 kHz’i, 2.5 kHz ile 3.15 kHz’i birbirinden ayırman gerekir.',
      'A third of an octave is the resolution of graphic EQs and room measurements. Finding the region is no longer enough; you need to tell 800 Hz from 1 kHz, and 2.5 kHz from 3.15 kHz.',
    ),
    listen: text(
      'B’de üçte bir oktav genişliğinde bir bant 12 dB yükseltildi. Seçenekler yan yana beş banttır; hedef her zaman ortadaki değildir.',
      'A band a third of an octave wide is boosted by 12 dB in B. The options are five adjacent bands; the target is not always the middle one.',
    ),
    tip: text(
      'Yükseltilen bandın perdesini mırıldanmayı dene. Yanlış yanıttan sonra C ile kendi seçimini dinle ve perdenin yukarı mı aşağı mı kaydığını karşılaştır.',
      'Try humming the pitch of the boosted band. After a wrong answer, hear your own choice as C and compare whether the pitch moves up or down.',
    ),
  },
];

const otherStages: Record<string, Copy> = {
  'eq-shape': {
    title: text('Raflar ve filtreler', 'Shelves and filters'),
    description: text(
      'Bir bölgenin silinmesi ile topluca yükseltilmesini ayırt et.',
      'Tell a region being removed from a region being lifted as a whole.',
    ),
    learn: text(
      'Mikste en sık kullanılan EQ hamleleri çan değil, filtre ve raftır. Alçak kesen filtre köşe frekansının altını giderek siler; yüksek kesen filtre üstünü. Raf ise köşenin ötesindeki her şeyi aynı miktarda kaldırır. Burada dört hamle var: alçak kesen, yüksek kesen, bas rafı yükseltme, tiz rafı yükseltme.',
      'The most common EQ moves in a mix are filters and shelves, not bells. A low-cut filter progressively removes what lies below its corner; a high-cut filter what lies above. A shelf lifts everything beyond its corner by the same amount. There are four moves here: low cut, high cut, low shelf boost, high shelf boost.',
    ),
    listen: text(
      'A orijinal; B’ye dört hamleden biri uygulandı ve köşe frekansı sorudan soruya değişir. Önce hangi uçta değişiklik olduğunu duy, sonra bir şey eklendi mi eksildi mi karar ver.',
      'A is the original; one of the four moves is applied to B, and the corner frequency changes from question to question. First hear which end changed, then decide whether something was added or taken away.',
    ),
    tip: text(
      'Seviyeler eşitlendiği için bas silindiğinde geri kalan ses biraz öne çıkar. Yüksekliğe değil, hangi ucun değiştiğine odaklan.',
      'Levels are matched, so when the lows are removed the rest comes forward a little. Focus on which end changed, not on loudness.',
    ),
  },
  'eq-width': {
    title: text('Bant genişliği', 'Bandwidth'),
    description: text(
      'Aynı frekanstaki yükseltmenin geniş mi dar mı olduğunu duy.',
      'Hear whether a boost at the same frequency is wide or narrow.',
    ),
    learn: text(
      'Q, yükseltmenin ne kadar geniş bir bölgeyi etkilediğini belirler. Geniş yükseltme sesin genel rengini değiştirir ve doğal duyulur; dar yükseltme tek bir perdeyi öne çıkarır ve tınlar. Aynı 9 dB, geniş bantta çok daha büyük bir değişiklik gibi duyulur.',
      'Q sets how wide a region the boost affects. A wide boost changes the overall colour and sounds natural; a narrow boost brings out a single pitch and rings. The same 9 dB sounds like a far bigger change in a wide band.',
    ),
    listen: text(
      'B’de bir bant 9 dB yükseltildi. Merkez frekans sorudan soruya değişir; sen genişliği seç: geniş, orta ya da dar.',
      'One band is boosted by 9 dB in B. The centre frequency changes from question to question; you choose the width: wide, medium or narrow.',
    ),
    tip: text(
      'Yükseltilen bölgede tek bir nota gibi bir tını duyuyorsan dar; komşu bölgeler de birlikte kalkıyorsa geniş.',
      'If you hear something like a single note ringing, it is narrow; if the neighbouring regions rise with it, it is wide.',
    ),
  },
  'eq-match': {
    title: text('EQ’yu eşitle', 'Match the EQ'),
    description: text(
      'Hedefi kendi EQ’nla yeniden kur: bandı ve miktarı kulağınla bul.',
      'Rebuild the target with your own EQ: find the band and the amount by ear.',
    ),
    learn: text(
      'Gerçek işte kimse seçenek sunmaz; duyduğun rengi kendi EQ’nla kurarsın. Burada B hedef, C senin ayarındır. Bandı ve miktarı değiştirdikçe C anında güncellenir. İkisi aynı duyulduğunda doğru ayarı bulmuşsundur.',
      'In real work nobody offers you options; you build the colour you hear with your own EQ. Here B is the target and C is your setting. C updates as soon as you change the band or the amount. When the two sound the same, you have found the setting.',
    ),
    listen: text(
      'Önce A ile B’yi karşılaştırıp bir tahmin yap. Sonra bandı ve miktarı seç, B ile C arasında geçiş yap. Fark kalmayınca yanıtını gönder. Yalnızca bant ve miktar birlikte doğruysa sayılır.',
      'First compare A with B and form a guess. Then choose the band and the amount and switch between B and C. Submit when no difference remains. It counts only when band and amount are both right.',
    ),
    tip: text(
      'Önce yönü, sonra bandı, en son miktarı ayarla. Miktarda kararsızsan A’dan B’ye ve A’dan C’ye geçerken rengin hangisinde daha çok değiştiğini dinle.',
      'Settle the direction first, then the band, and the amount last. If the amount is unclear, listen for whether the tone moves further going from A to B or from A to C.',
    ),
  },
};
const copy: Record<string, Copy> = {
  ...Object.fromEntries(frequencyStages.map((entry, index) => [`eq-${index + 1}`, entry])),
  ...otherStages,
};

/** One lesson per stage of eq-model.ts; a lesson's level is its place on that ladder. */
export const eqLessons: Lesson[] = EQ_STAGE_IDS.map((id, index) => ({
  id,
  path: 'mix',
  skill: 'eq',
  level: index + 1,
  ...copy[id],
}));
