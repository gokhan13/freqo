# Freq

Türkçe ve İngilizce, miks odaklı kulak pratiği. Web ve telefonda kullanılabilen prototip, sürüm **0.9 önizleme (`0.9.0-preview.1`)**. Başlangıç değerlendirmesi, beceriye göre zorluk, yanlışlardan aralıklı tekrar ve istek üzerine PDF gelişim raporu içerir. Sınav atölyesinde ortak hazırlık ve resmî 2026–2027 kılavuzundan doğrulanan MSGSÜ Opera/Müzik teorisi kapsam haritaları var. Kısa denemeler Freq işitme pratiğidir; kurum sınavının bütünü değildir. [Gelişim raporunu kullanma](docs/gelisim-raporu.md), [derin denetim, eleştiri ve düzeltmeler](docs/kalite-denetimi.md).

## Dosyalar nerede?

Bu projenin hedef deposu **bayraktarersan/freq**. Kaynak kod `src/`, görseller `public/`, araştırma ve ürün notları `docs/` altında. Cloud ortamındaki proje klasörü `/workspace/freq`.

GitHub kaynak kodu saklar. Uygulamayı telefonda bir bağlantıyla denemek için ayrıca web yayını gerekir. GitHub'a kod göndermek, web sitesini kendiliğinden yayımlamaz. Bu sürüm statik bir site olarak GitHub Pages, Netlify veya Vercel üzerinde çalışabilir.

## Bilgisayarında dene

Node.js **24 LTS** kur. Projeyi GitHub'dan klonla veya kaynak ZIP paketini aç. `freq` klasöründe terminal aç:

```sh
npm ci
npm run dev
```

Terminalde gösterilen adresi **kendi bilgisayarındaki** tarayıcıda aç. Kulaklık kullan, rahat bir ses seviyesi seç. Başka bir bilgisayardaki cloud terminalinin adresi doğrudan telefonunda açılmayabilir.

1. **Bugün → Pratiğe başla** ile frekans bölgeleri dersini aç.
2. Ses kaynağını seç; yanıtı gösterilen örneği A/B arasında geçiş yaparak dinle.
3. **Hazırım, dinleyelim** ile beş soruluk pratiğe başla.
4. Her soruda A ve B'yi dinle, değişen bölgeyi seç. Yanıttan sonra EQ eğrisi görünür. Yanlış yanıtta **C: Seçtiğin EQ** açılır; B ile C'yi karşılaştırarak kendi seçiminin nasıl duyulduğunu dinle.
5. **Yollar → Miks ve prodüksiyon → Ses yüksekliği** ile 6, 3 ve 1 dB karşılaştırmalarını dene. **Müzik kulağı → Ritim** bölümünde iki örneği sonuna kadar dinle; yanıtından sonra kalıpları incele.
6. **Miks ve prodüksiyon → Dinamikler / Masking / Stereo alan / Reverb ve delay** başlıklarını aç. Etiketli örnekleri sırayla dinle, sonra pratiğe geç. Yanlış yanıtta C senin seçtiğin ayarı çalar; ses ölçümleri yalnızca yanıttan sonra açılır. Stereo ve ping-pong için sol/sağ kulaklık kontrolünü doğrula.
7. Miks yolundaki **Laboratuvarı aç** ile hazır akustik örneği veya kendi kaydını kullan. Ayarları değiştir, A/B ve mono ile karşılaştır, işlenmiş WAV önizlemesini indir.
8. **Yollar → Müzik kulağı**: Tonal merkez ve dereceler, İşlevsel işitme, Dikte atölyesi veya Ritim tekrarı başlığını aç. Önce açıklamalı örneği dinle; diktede derece/konum kutularını doldur, ritim tekrarında dokun veya Space kullan. Yanıtını göndermeden puan oluşmaz.
9. **Yollar → Sınava hazırlık**: **Hazırlık dersleri** altında üç seviyeli ses/ezgi/ritim, dikte, solfej ve jüri provalarını aç. **Denemeler** altında 6/8/10 soruluk süreli işitme denemesi yap; yanıtları bitince incele. Kurum ve kapsam bölümünde MSGSÜ Opera/Müzik teorisi 2026–2027 kılavuzunu ve kapsam farklarını incele. Kaynak yılı sonraki başvuru dönemi için geçerli varsayılmaz.
10. **Bugün → Kişisel planı aç**: yolunu seç. Başlangıç değerlendirmesini yap veya beş soruluk kişisel pratiğe başla. Miks değerlendirmesinde stereo kontrolünü doğrula. Hatalar zamanı geldiğinde günlük plana alınır; **Yanlışlarımı çalış** ile erken de deneyebilirsin. Beceri seviyelerinin neden değiştiğini açılır ayrıntılardan gör.
11. **TR / EN** ile dili değiştir; **Becerilerim** bölümünde kendi yanıtlarını ve her becerinin **Nasıl çalışmalıyım?** kılavuzunu gör.
12. **Becerilerim → Gelişim raporunu aç**: yolunu ve Tüm geçmiş / Son 30 gün / Son 7 gün dönemini seç. En fazla üç odak, çalışma teknikleri, Türkçe öncelikli kaynaklar ve esnek yedi günlük planı incele. **PDF olarak indir** ile raporu cihazına kaydet.

Üretim çıktısını denemek için:

```sh
npm run build
npm run preview
```

`dist/` yayımlanabilir dosyalardır. `index.html` dosyasını çift tıklayarak açmak yerine HTTP sunucusu kullan; modüller ve çevrimdışı önbellek `file:` adreslerinde düzgün çalışmaz.

## Telefonunda dene

En kolay ortak deneme, `dist/` klasörünü HTTPS ile yayımlamak ve verilen bağlantıyı telefonda açmak. [Yayınlama adımları](docs/deneme-ve-yayin.md).

- iPhone: Safari → Paylaş → Ana Ekrana Ekle.
- Android: Chrome → menü → Uygulamayı yükle / Ana ekrana ekle.
- İlk ziyaret ve çevrimdışı önbelleğin kurulmasından sonra bu sürümdeki pratikler internetsiz de çalışır.
- Ekran kilitlenince veya uygulama arka plana gidince ses durur. Geri geldiğinde dinlemeyi sen başlatırsın.

Bu sürüm bir **PWA**'dır; App Store / Google Play paketi değildir. iOS ve Android mağaza uygulamaları ürün hedefidir. Henüz gerçek iPhone/Android donanımında doğrulama yapılmadı. Tarayıcı testi, kulaklıkla gerçek cihaz dinleme testinin yerine geçmez.

## Bu sürümde çalışanlar

| Yol | Seviyeler |
| --- | --- |
| Miks ve prodüksiyon | EQ ve ses yüksekliği; üçer seviyeli kompresyon, attack, release, masking, stereo, reverb ve delay: toplam 27 pratik |
| Müzik kulağı | Melodi ve armoni: ses yönü → aralıklar → majör/minör. Ritim ayırt etme; üçer seviyeli tonal merkez, derece, işlevsel işitme, melodik/ritmik dikte ve ritim tekrarı: toplam 24 pratik |
| Sınava hazırlık | Üçer seviyeli yedi hazırlık dersi, öz değerlendirmeli jüri provaları, üç seviye süreli ortak işitme denemesi; ayrıca üç melodik hafıza pratiği |

Toplam 54 pratik, 20 beceri var. Miks yolu altı açılır bölümde düzenlenir; dinamikler ve reverb/delay içinde beceri adları açıkça görünür. Yeni altı müzik becerisinin ve miks becerilerinin üçer seviyesi vardır; eski yön/aralık/akor başlangıç dersleri ayrı durur. Her pratikte açıklama, yanıtı görünen örnek, beş soru, tekrar dinleme, geri bildirim ve sonuç var. Seviyeleri doğrudan seçebilirsin. Ana ekran ve beceri haritası aynı seviye önerisini kullanır. Ders kartı açıklamalı öğrenme içindir; kişisel plan yeni pratik ve zamanı gelen hata tekrarlarını birleştirir. Beceri haritasındaki doğruluğa hata tekrarları katılmaz. Öneri, aşağıdaki başarı ve ses çeşitliliği koşullarına dayanır; bütün dersler doğrudan seçilebilir. Bu geçici ürün kuralı bilimsel olarak doğrulanmış bir ustalık ölçütü değildir.

Miks pratiklerinde beş kaynak seçilebilir: üç özgün sentez döngüsü ve iki CC0 gerçek akustik kayıt düzenlemesi (piyano/vurmalılar). Kaynak, beş soru boyunca sabit kalır ve kayıtla birlikte korunur. VSCO 2 Community Edition kayıtlarından hazırlanmış kısa özgün düzenlemeler, tam ticari şarkı veya canlı grup multitrack’i değildir. [Krediler, lisans ve kayıt doğrulamaları](public/audio/recordings.json); [CC0 lisansı](public/audio/CC0-1.0.txt).

EQ’da A orijinal, B hedef EQ'dur. Yanlış yanıttan sonra C, seçtiğin frekansa hedefle aynı gain/Q uygulanmış halidir. A/B/C aynı ses saati anında başlar; EQ örneklerinin ortalama RMS seviyeleri eşitlenir ve ortak tepe payı uygulanır. RMS eşitleme her kaynakta algısal ses yüksekliğinin kusursuz eşit olduğu anlamına gelmez; fiziksel dinleme pilotunda ayrıca kontrol edilmeli.

Ses yüksekliği çalışmasında beş kaynak da kullanılabilir. A ve B aynı döngünün aynı zamanında çalar; B yalnızca sinyal seviyesi bakımından farklıdır veya A ile aynıdır. ±6, ±3 ve ±1 dB farklar bilerek korunur; RMS eşitleme yapılmaz. Ortak tepe payı kırpılmayı önler. Yanıttan sonra göreli dB farkı gösterilir; kulaklıktaki mutlak ses basıncı ölçülmez.

Ritimde 100 BPM ve dört sayımdan sonra bir ölçü duyulur. A/B aynı tempoda, aynı ses renginde ve aynı sayıda vuruş içerir. B ya aynıdır ya da tek vuruş bir alt bölüme kaymıştır. İki örnek tamamlanmadan yanıt açılamaz; durdurulan örnek tamamlanmış sayılmaz. Dinlenen örnek işaretlenir. Kalıpların çizimi yalnızca öğretici örnekte ve yanıt sonrasında görünür. Bu dinleyerek ritim ayırt etme pratiğidir; dokunma doğruluğu veya sınavdaki ritim tekrarı ölçülmez.

Tonal görevlerde kadans majör bağlamı kurar. Sayılar göreli derecelerdir; aday sesleri dinleyerek tonal merkez bulunur. Diktede her konum düzenlenir, taslak ve yanlış yanıt dinlenebilir. Ritim tekrarı bir ölçülük dokunma/Space girişini ses saatiyle kaydeder; vuruş sayısı ve sabit ofset sonrası her vuruşun sapması değerlendirilir. Gönderilmiş yanıtlar/yedekler korunur, gönderilmemiş taslak çıkınca temizlenir. Becerilerim ekranında son beş müzik yanıtını açıp yeniden çalışabilirsin; puan değişmez. Mikrofon kullanılmaz. Minör/kromatik içerik ve tam porte/süre diktesi henüz yoktur. [Öğretim, kaynaklar ve değerlendirme sınırları](docs/research/muzik-kulagi-arastirmasi.md).

İleri derslerde her soruda tek parametre değişir: dinamiklerde kompresyon oranı / attack / release; masking’de eşlik katmanının EQ bölgesi; stereo’da pan / side miktarı / polarite; reverb’de miktar / nominal kuyruk / ön gecikme; delay’de aralık / feedback / ping-pong. Etiketli örnekler parametre farkını önceden dinletir. Soruda ayarlar gizlidir; yanıttan sonra ayar tablosu ve gerçek buffer’ın tepe zarfı / crest factor’ı açılır. Stereo’da korelasyon da gösterilir. A/B/C iki kanalın ortak RMS enerjisiyle eşitlenir; ortak tepe payı 0.72’dir. Masking’de solo hedef, stereo’da mono toplamı dinlenebilir. Reverb/delay için dört saniyelik kuyruk alanı eklenir. Bu eğitim modelleri ticari plugin emülasyonu veya her kaynak için önerilen ayarlar değildir. [Ayrıntılı araştırma ve teknik sınırlar](docs/research/ileri-miks-arastirmasi.md).

**Kendi kaydınla çalışma:** laboratuvar mono/stereo ses dosyalarını cihazda okur; en fazla 20 MiB, ilk sekiz saniye. WAV önerilir; diğer biçimler tarayıcı desteğine bağlıdır. Kompresyon parametreleri, eşlik EQ, pan, width, polarite, reverb ve delay serbestçe denenir. A referans, B ayarın; işlenmiş stereo PCM16 WAV indirilebilir. Masking için zaman başlangıçları aynı olan ayrı hedef ve eşlik dosyaları gerekir. Mono kayıtta mevcut side bileşeni olmadığı açıklanır. Ses dosyaları sunucuya gönderilmez, localStorage/JSON yedeğine eklenmez ve laboratuvardan çıkınca veya yenileyince yeniden seçilir. Bu alanda puanlama veya otomatik miks değerlendirmesi yoktur.

İlerleme bu tarayıcının `localStorage` alanına kaydedilir. Hesap, sunucu, mikrofon veya bulut eşitlemesi yok. Kayıtlar dil değişiminden etkilenmez, yarım kalan oturum yeniden açılabilir. Profil'den JSON yedeği indirip **Yedekten geri yükle** ile başka tarayıcıya taşıyabilirsin. Dosya cihazında okunur; sunucuya yüklenmez.

Geri yükleme öncesinde onay özeti gösterilir. Kayıtlar mevcut ilerlemeyle birleştirilir; aynı yanıt ve sonuç iki kez sayılmaz. Mevcut dil/ses tercihleri korunur. İki farklı yarım pratik varsa birleştirme durur; mevcut oturum yoksa yedekteki geri alınır. Aynı oturumun tutarlı iki kopyası varsa daha ileri kopya kullanılır. Bozuk, çelişen, desteklenmeyen veya 16 MiB'dan büyük dosyalar mevcut kayıtları değiştirmez. 0.1 sürümünün eski JSON yedekleri de desteklenir.

Yanıt, sonuç, deneme ve öz değerlendirme geçmişi sayıya bağlı olarak budanmaz. Ekranlar yakın geçmişi gösterir; tarayıcının kayıt kotası dolarsa bellekteki veriyi indirebilirsin. Deneme süreleri sayfa kapansa da devam eder; sıradan pratik oturumu ayrı korunur. Tarayıcı verileri silinirse kayıtlar kaybolur; bu işlemden önce yedeği indir. Başka bir alan adı veya origin üzerindeki HTTPS yayını ayrı kayıt alanı oluşturur; yedeği orada geri yükleyebilirsin. Önceki sürümlerde zaten budanmış kayıtlar ancak eski bir yedekten geri alınabilir.

## Gelişim ve PDF raporu

Gelişim ekranı normal pratik, hata tekrarı, başlangıç değerlendirmesi, süreli deneme ve icra öz değerlendirmesini ayrı gösterir. Tarih filtresi dönem sonuçlarını süzer; bugünkü aşama önerisi ve bekleyen tekrarlar tüm geçerli geçmişi kullanır. Aynı yol, aşama ve kaynakta yeterli farklı soru/oturum/ses varsa karşılaştırma yüzde puan olarak gösterilir. Küçük örneklem veya çalışılmamış beceri kesin zayıflık sayılmaz; toplam yüzde genel müzikal yetenek veya sınav kabul puanı değildir.

20 becerinin kılavuzları dinleme ipucu, somut adımlar ve yeni örnekle kontrol içerir. Kaynaklar Türkçe öncelikli, gerektiğinde İngilizce tamamlayıcıdır; dil ve ücretsiz/isteğe bağlı ücretli kitap etiketi ayrı görünür. Rapor ve Türkçe karakterli gerçek PDF cihazında hazırlanır; ilk çevrimiçi kurulumdan sonra çevrimdışı çalışabilir. Dış kaynaklar internet gerektirebilir. PDF, Profil'deki JSON ilerleme yedeğinin yerine geçmez.

Bu sürümde rapor ücretsizdir; ödeme, reklam ve satış ortaklığı yoktur. Gelecekte ilk ücretsiz rapor ve ücretli yeni dönem değerlendirmesi denenebilir; aynı raporu yeniden indirme kredi tüketmemeli, sponsorlu alanlar eğitim önerilerinden ayrı etiketlenmelidir. [Kullanım ve veri sınırları](docs/gelisim-raporu.md), [kaynaklı değerlendirme ve ürün önerileri](docs/research/gelisim-raporu-arastirmasi.md), [tarihli kaynak kataloğu](docs/research/rapor-kaynaklari.json).

## Sınav önizlemesinin sınırı

Yedi ders / 21 seviye çalışması otomatik puanlanan 54 kısa pratikten ayrı bir öğretim/prova alanıdır. Ortak denemenin 6/8/10 dakikası ve üç dinleme sınırı Freq ayarlarıdır. Söyleme/icra öz değerlendirmesi otomatik işitme doğruluğuna katılmaz. Do majör/4-4 solfej örnekleri tam konservatuvar repertuvarını kapsamaz. MSGSÜ 2026–2027 kılavuzunun Opera (s. 25–26) ve Müzik teorisi (s. 17–19) kapsamları kaynakla doğrulandı. Diğer kurumların karşılaştırması, lisans düzey sınavı örneği ve öğretmen pilotu tamamlanmadı. Bu sürüm tam kurum sınavı simülasyonu sunmaz. [Araştırma durumu ve devam işi](docs/research/sinav-hazirligi-arastirma-durumu.md).

## Sonraki kapsam

Daha geniş lisanslı multitrack kütüphanesi, bir arada miks sorunları, yeni kayıtlarda beceri aktarımı, minör/kromatik bağlam, porte ve uzun dikte, makam/usul ve kurumlara özgü sınav paketleri sonraki içerik aşamalarıdır. Makam/usul uzmanla yazılmalı; bu sürümde bu alanlar için hazır pratik bulunmuyor. Tam kapsam ve araştırma: [ürün planı](docs/urun-plani.md), [pazar araştırması](docs/research/pazar-arastirmasi.md), [43 ürünlük matris](docs/research/rakip-matrisi.csv).

## Geliştirme ve kontroller

React + TypeScript + Vite; Web Audio API. Ses motoru tarayıcıya bağlı, soru/ilerleme ve iki dilde içerik ayrı modüllerde. Native uygulamalarda içerik ve soru modeli yeniden kullanılabilir; Web Audio motoru için ayrıca native adaptör gerekir.

PDF testleri gerçek dosyadan metin ve sayfa bilgisi okumak için **Poppler** araçlarını (`pdfinfo`, `pdftotext`) gerektirir. Ubuntu/Debian: `sudo apt-get update && sudo apt-get install -y poppler-utils`; macOS/Homebrew: `brew install poppler`. Windows için Linux/WSL geliştirme ortamı kullanılabilir. Uygulamayı çalıştırmak veya kullanıcı olarak PDF indirmek için bu araçlar gerekmez; GitHub CI ve kayıtlı cloud kurulum script’i test araçlarını hazırlar.

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Cloud ortamındaki sistem Chromium'u için `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` kullanılır. Linux'ta Playwright tarayıcısının sistem bağımlılıkları ayrıca gerekebilir.

Tarayıcı testleri gerçek Web Audio buffer'larını, beş kaynakta seviye eşleştirmeyi, A/B/C zamanlamasını, 54 pratiğin geri bildirimini, kasıtlı dB farklarını, ritim örneklerindeki vuruş yerlerini ve tam dinleme koşulunu, gerçek dosya indirme/geri yüklemeyi, kayıt/yenileme, dil değişimi, çevrimdışı kullanım, alt klasör yayını, klavye ve mobil görünümü kontrol eder. Yeni stereo DSP, attack/release, delay zamanlaması, reverb kuyruğu, gerçek kayıt hash’leri, kendi ses dosyasıyla çalışma, ayrı eşlik ve WAV indirme de doğrulanır. Müzik testleri derece-perde tutarlılığı, sus/konum zamanları, dikte girişleri, dokunma/Space tekrarı, ofset/tolerans ve iptal/yenileme akışlarını kapsar. Otomatik erişilebilirlik kontrolü manuel ekran okuyucu testinin yerine geçmez.

Akustik WAV’lar depoda hazırdır; standart kurulumda Python veya ffmpeg gerekmez. Yalnızca kayıtları yeniden hazırlamak isteyen geliştirici için: Python 3 + NumPy + ffmpeg ile `python3 scripts/prepare-recordings.py`. Script sabit commit’teki dört ham kaydı hash kontrolüyle indirir ve `public/audio/` dosyalarını üretir.

## Kişiye uygun çalışma

Miks / müzik / hazırlık yolunda 18 / 20 / 12 başlangıç sorusu, süre sınırı olmadan ve ara vererek çalışılır. Her beceride iki cevap geçici bir öneri sağlar; tamamen geçilen becerilerin önceki önerisi korunur. Aralık, yön ve majör/minör gibi tek mevcut aşamalı derslere hayalî seviyeler verilmez. Değerlendirme pratik doğruluğuna katılmaz; genel yetenek veya sınav puanı değildir.

Her becerinin seviyesinde en az iki oturumda son 10 farklı kimlikli cevaptan iki seçenekli sorularda 9, diğerlerinde 8 doğru; ayrıca en az 2/3 farklı duyulan örnek bir aşama yükseltir; son 6 yeni cevapta en fazla 2 doğru bir aşama azaltır. Aynı soru kimliği tekrarları düzeyi artırmaz; tek bir duyulan kalıbın farklı kimlikli kopyaları da yükseltmeye yetmez. İleri dersi elle seçip aynı koşullarda başarılı olmak o aşamayı öneriye aldırabilir. Zorlanılan tek beceri arka arkaya bütün planı kaplamaz. Günlük beş sorunun en fazla ikisi zamanı gelmiş hata tekrarıdır; diğerleri odak beceriden yeni örneklerdir. Yanlış örnek ilk 10 dakika sonra, zamanında doğru cevaplarla 1 / 3 / 7 günlük aralıklarla tekrar gelir; dördüncü zamanında başarıdan sonra kapanır. Erken doğru çalışma takvimi ilerletmez. Bu eşikler Freq çalışma kurallarıdır; uzmanla kalibre edilmiş bir ölçek değildir. [Tasarım ve pilot sınırları](docs/research/kisisellestirme-tasarimi.md).

Kişisel, ders ve deneme geçmişi oturum sayısıyla otomatik silinmez; ekran yalnız yakın geçmişi gösterir. Tarayıcı alanı dolarsa kayıt durumu ve indirme eylemi görünür. Yarım çalışma ve tam soru/cevap ayrıntıları JSON yedeğine dahildir. Eski yedekler kişisel verileri silmez. İki farklı yarım ders/kişisel çalışma veya deneme veya aynı kimlikte farklı cevaplar varsa birleştirme durur; bir oturum sessizce kaybedilmez. Ders oturumu ve kişisel oturum ayrı tutulur. 0.8 yedek biçimi sürüm 2’dir; 0.8 veya daha yeni uygulamada aç. Eski sürüm 1 yedekler ve düz JSON kayıtları içeri alınabilir. Eski tarayıcı alanı ilk açılışta ayrı `freq.progress.v2` alanına taşınır; eski kopya korunur. Eski uygulama sekmesinin yazması yeni geçmişi budayamaz. Yeni ders yanlışları her beceride ses kaynağıyla saklanır; eski ses ayrıntısı olmayan hatalar için özgün ses uydurulmaz.

## Kayıt sorununda ne yapmalı?

Çakışma veya bozuk kayıt uyarısında **Bu sekmedeki veriyi indir** ve **Orijinal kaydı indir** ile iki kopyayı koru. Çakışmada kaydedilmiş kopyayı aç; bozuk bölümde kurtarılan kaydı kullanma kararı ayrıca onaylanır. Kendiliğinden sıfırlama yapılmaz. İki sekmede uyumlu cevaplar birleştirilir; aynı cevaptaki veya farklı yarım çalışmalardaki çelişki, bir kopya seçilerek geçiştirilmez. Yedek dosyasının içeri alınma sınırı 16 MB; tarayıcının kayıt kotası bundan daha küçük olabilir. Bulut eşitleme yoktur.

Yayından sonra eski sürüm görünüyorsa tüm Freq sekmelerini kapatıp yeniden aç; eski sekme açıkken yeni çevrimdışı sürüm beklemede kalabilir. Farklı yayın alt klasörlerinin önbellekleri artık birbirini silmez.
