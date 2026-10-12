# İleri miks eğitimi: araştırma ve uygulama kararları

9 Ekim 2026, Freq 0.4. Ana hedef miks kulağı; Türkçe/İngilizce, telefon ve web. Bu çalışma [önceki pazar taramasını](pazar-arastirmasi.md) ve [43 ürünlük matrisi](rakip-matrisi.csv) tamamlar. Bu aşamada üretici eğitim yazıları, herkese açık SoundGym oyun açıklamaları ve ses kütüphanesinin lisans/kaynak dosyaları okundu. Ücretli hesapların içeriği veya öğrenme sonuçları test edilmiş değildir. Ham makaleler depoya kopyalanmadı; erişilen sayfaların URL, tarih ve SHA-256 kayıtları [kaynak listesinde](ileri-miks-kaynaklari.json).

## Bulgular ve ürün karşılıkları

| Konu | Kaynaklardan öğrenilen | Freq'te uygulanan karar |
| --- | --- | --- |
| Kompresyon | Eşik, oran, atak ve bırakma birlikte etkilidir. Makeup gain karşılaştırmayı yanıltabilir. SoundGym Compressionist önce seviyeyi eşitleyip sonra parametre eşlemeyi; Dr. Compressor kısa sürelerle belirgin kompresyonu ayırt etmeyi anlatır. | Ortalama RMS eşitleme; önce kompresyon var/yok, sonra sabit koşullarda oranlar, ardından 4:1 referansa göre az/aynı/fazla. Başlangıçta tüm etiketli ayarlar dinlenebilir. |
| Attack | Transient başı ile gövde ayrımı önemlidir; hızlı atak ilk kenarı bastırabilir. Her kompresörün ms göstergesi aynı davranış demek değildir. | A sabit; B'de yalnızca attack değişir. Üç seviyede seçenekler birbirine yaklaşır. Kendi kaydında eşik/oran/atak/bırakma bağımsız denenir. |
| Release | Çok hızlı bırakma bozulma, çok yavaş bırakma devam eden azaltma yaratabilir. Uygun süre kaynak ve ritme bağlıdır. | Vuruş sonrası gövde ve bir sonraki vuruşa dönüş öğretilir. Kısa/uzun süre evrensel bir iyi/kötü yanıt olarak sunulmaz. |
| Masking | Örtüşme iki kaynak arasındaki bağlamdır; aranjman, seviye, pan ve EQ seçenekleri vardır. Her örtüşme sorun değildir. | Hedef ve eşlik ayrı katmanlar. Solo hedefi tanıtma; yalnızca eşlik EQ'sunu değiştirme; büyükten küçük kesmeye ilerleme. Kendi dosyasında iki ayrı, hizalı kayıt gerekir. |
| Pan ve stereo genişlik | Pan konumu ve genişlik aynı şey değildir. M/S'de mid/side miktarı değiştirilebilir; mono ve polarite kontrolü gerekir. | Konum → genişlik → mono uyumluluğu. Gerçek iki kanallı ses; sol/sağ kulaklık kontrolü ve kullanıcı onayı; dinlerken mono toplamı. Mono dosyada yan bileşen yoksa açıklanır. |
| Reverb | Efekt miktarı, sönme ve ön gecikme ayrı değişkenlerdir. Pre-delay kuru onset ile yansıma arasında boşluk bırakır. | Miktar → nominal kuyruk → ek ön gecikme. Her soruda tek değişken. Son vuruş sonrası dört saniyelik kuyruk alanı. |
| Delay | Tekrar zamanı, feedback ve stereo dağılım ayrı işitilir. SoundGym Delay Control ms aralığını ayırt etmeyi, Reverb Wizard farklı ayarı bulmayı kullanır. | Zaman → feedback → ping-pong. 120 BPM nota süreleriyle ms ilişkisi anlatılır; örnek tekrarlar sample saatinde üretilir. |
| Gerçek müziğe aktarım | Sentez örnekleri kontrol sağlar; farklı kayıtlarla aktarım ayrıca değerlendirilmelidir. | Üç sentez kaynağına iki gerçek akustik kayıt düzenlemesi eklendi. Miks laboratuvarı kullanıcının kendi dosyasında karşılaştırma sağlar. Bu laboratuvar otomatik miks puanı üretmez. |

Bunlar tüm rakiplerde eksik olduğu kanıtlanmış özellikler değildir. Özellikle SoundGym'de kompresyon, pan, genişlik, delay, reverb ve multitrack çalışma zaten bulunmaktadır. Freq'in kararı bu becerileri açık açıklamalar, küçük seviyeler, yanlış seçim için sesli C örneği, iki dil ve kendi dosyasıyla deneme içinde birleştirmektir. Önceki raporda belgelenen seçili yorumlar öğretmeden sınama, zorluk sıçraması, geri bildirim ve oturum devamlılığı için risk işaretleri verir; bu araştırma yeni ve temsili bir kullanıcı yorum anketi yapıldığı iddiasında bulunmaz.

## Öğretim akışı

1. Öğrenci hangi değişkeni dinleyeceğini ve hangi bölüme odaklanacağını okur.
2. Etiketli örnekler arasında geçer: her seçenek B olarak dinlenebilir; A referans aynı kalır. Bu, örneğin 2:1 ile 8:1'i hiç duymadan tam oran tahmin etmeyi azaltır.
3. Beş soruluk pratik başlar. Parametre değerleri ve ölçüm grafikleri gizlenir. A/B dinlenmeden yanıt açılamaz.
4. Yanıttan sonra doğru ayar, açıklama ve gerçek sesin ölçümleri açılır. Yanlışsa C seçilen ayarın işlenmiş sesidir; A/B/C aynı başlangıçta çalar.
5. Öğrenci tekrar dinler; tekrar dinleme puanı değiştirmez. Kendi dosyasıyla serbest denemeye geçebilir.

Miks yolu altı bölümde tutulur: EQ, ses yüksekliği, dinamikler, masking, stereo alan, reverb/delay. İleri bölümler başlangıçta kapalı, başlığından açılabilir; seviyeler kilitlenmez. Dinamiklerde kompresyon/atak/bırakma, mekânda reverb/delay adları her satırda açıkça görünür. Temel müzik ve sınava hazırlık ayrı yollarda kalır. Toplam içerik 36 pratik / 14 beceri; 21 yeni pratiğin tamamı aşağıdadır.

| Beceri | Seviye 1 | Seviye 2 | Seviye 3 |
| --- | --- | --- | --- |
| Kompresyon | 1:1 veya 8:1, var/yok | 2:1 / 4:1 / 8:1 | A=4:1; B daha az / aynı / fazla |
| Attack | 1 / 60 ms | 3 / 35 ms | 8 / 20 ms; A=12 ms |
| Release | 20 / 600 ms | 70 / 350 ms | 120 / 240 ms; A=180 ms |
| Masking | 300 / 1.000 / 3.000 Hz, −9 dB | 250 / 700 / 1.500 / 3.500 Hz, −6 dB | Aynı bölgeler, −3 dB |
| Stereo | Sol / orta / sağ | Dar / aynı / geniş | Normal veya ters sağ kanal polaritesi, mono kontrolü |
| Reverb | Az / çok ek efekt | Nominal 0.5 / 1.5 / 3 s | Ek pre-delay 0 / 30 / 80 ms |
| Delay | 125 / 250 / 500 ms | %15 / %40 / %65 feedback | Merkez / ping-pong |

Kompresör eşiği −24 dB; attack dersinde oran 6:1 ve release 180 ms; release dersinde attack 5 ms sabittir. Kompresyon dersinde attack 12 ms / release 180 ms. Parametreler pedagojik örneklerdir; kaynaklara önerilen miks reçeteleri değildir. Aynı parametrenin kaynak değişince farklı duyulması, kaynak seçiminin pratik boyunca sabit tutulmasının nedenidir. Üç seviye ve son 10 yanıtta %80 öneri kuralı henüz öğrenme pilotuyla kalibre edilmiş değildir.

## Ses doğruluğu ve teknik sınırlar

- Dinamikler, stereo ve mekân işlemleri deterministik iki kanallı buffer'lara işlenir. A/B/C aynı ses saatinde başlar; yaklaşık 12 ms geçişli gain ramp'leri aynı noktada karşılaştırmayı sağlar.
- İki kanalın ortak RMS enerjisi eşitlenir; tüm varyantlara tek ortak tepe azaltma uygulanır. Tepe en fazla 0.72'dir. Kompresyonu yüksekliğe göre seçme ipucu azaltılır; önceki ses yüksekliği dersinin kasıtlı dB farkları korunur.
- RMS eşitleme kusursuz algısal loudness eşitliği değildir. Tepe/ortalama ve korelasyon ölçümleri sinyal değerleridir; fiziksel kulaklık ses basıncı, duyma hassasiyeti veya bir miksin kalitesi olarak yorumlanmaz.
- Kompresör, stereo bağlantılı feed-forward peak detektörü, sabit 1 ms detektör düzleştirmesi ve 6 dB soft knee kullanır. Attack/release gain azaltmasının tek kutuplu zaman sabitleridir. Ticari bir kompresör veya analog devre emülasyonu değildir; tüm üreticilerin ms/ratio davranışı aynı varsayılmaz.
- Masking hedefi başlangıçta seçilen bölgeye odaklanan eğitim katmanıdır; karşılaştırma boyunca aynı dalga şekli korunur. Filtre sadece eşliktedir. Global RMS/tepe eşitlemesi toplam gain'i değiştirebilir; hedefin mutlak seviyesinin her varyantta birebir aynı olduğu iddia edilmez. Solo, tam miks yüksekliğine ayrı normalize edilmez.
- Pan equal-power'dır. Genişlik M=(L+R)/2, S=(L−R)/2 üstünde side ölçeklemesidir; headroom/RMS işlemi öncesinde mid korunur. Polarite dersinde bilerek aşırı, mono toplamda iptal olabilen ilişkili kanallar kullanılır. Kendi stereo dosyasında sağ kanal gerçekten ters çevrilir; önce mono'ya çökertilmez.
- Mono kontrolü Web Audio'nun explicit tek kanal / speakers downmix'ini kullanır; M=(L+R)/2 sonradan iki kulağa dağıtılır. Tarayıcı fiziksel kulaklığı veya cihazın mono ayarını güvenilir biçimde tespit etmez. Kullanıcı sol/sağ testini duyarak doğrular.
- Reverb, erken yansımalar, kanal başına dört damped comb ve iki all-pass yayılım kademesinden oluşur. Decay nominal RT60 feedback hesabını kullanır; damping ve erken yansımalar yüzünden gerçek yanıtın her frekansta tam RT60'ı olduğu iddia edilmez. Bir oda impulse response'u / convolution veya üretici reverb emülasyonu değildir.
- Delay tam sample aralıklarıyla, tekrarda `wet × feedback^(n−1)` ile oluşturulur. Ping-pong tekrarları kanallar arasında dağılır. Wet yüzdesi kuru sese eklenen miktardır; toplamdan kuru sesin çıkarıldığı bir crossfade oranı değildir.
- Reverb/delay için sona dört saniye eklenir. İşlenmiş dosya bu kuyruğu içerir; çok daha uzun profesyonel render veya DAW'da gerçek zamanlı plugin değildir.

## Gerçek kayıtlar ve haklar

[VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE), `440300901dfe9275fd84e0b7763af1f8443ae62e` commit'i. CC0-1.0 LICENSE, README, kullanım metni, piyano Info/MappingChart ve dört ham WAV incelendi. Piyano Simon Dalzell / Ivy Audio'nun kaydıdır; Versilian Studios tarafından yeniden dağıtım izni kayıt bilgi dosyasında belirtilir. Kütüphane kredileri Versilian Studios / Sam Gossner ve sample cutting Elan Hickler / Soundemote'u da içerir.

Dört kaynak: upright piano, bass drum, snare ve claves. Freq bunları mono downmix, onset kırpma, 22.05 kHz yeniden örnekleme, piyano transpozisyonu ve özgün dört saniyelik düzenlemelerde kullanır. `recorded-lead`, `recorded-bed`, `recorded-hits` katmanlarından `acoustic` ve `recorded-drums` kaynakları hazırlanır. Bunlar gerçek enstrüman kayıtlarından düzenlenmiş kısa eğitim örnekleridir; bitmiş ticari şarkı veya tam canlı grup multitrack'i değildir.

Kaynak URL'leri, ham/uyarlanmış dosya SHA-256 değerleri ve uyarlama açıklaması [recordings.json](../../public/audio/recordings.json) içinde; lisans [CC0-1.0.txt](../../public/audio/CC0-1.0.txt) ile dağıtılır. Profil'de görünür krediler vardır. Beş WAV toplam yaklaşık 0.88 MB; uygulamayla ve çevrimdışı önbellekle dağıtılır, üçüncü taraf stream bağımlılığı yoktur. Yeniden hazırlama script'i [prepare-recordings.py](../../scripts/prepare-recordings.py), sabit hash doğrular; Python/NumPy/ffmpeg yalnızca bu isteğe bağlı bakım adımında gerekir.

## Kendi kayıtlarıyla laboratuvar

Kullanıcı mono veya stereo ses dosyası seçer; en fazla 20 MiB ve ilk sekiz saniye. WAV en öngörülebilir biçimdir, diğer ses biçimleri tarayıcı decode desteğine bağlıdır. Kullanıcının dosyası `decodeAudioData` ile cihazda açılır; ağ isteği, sunucu yüklemesi, localStorage'a ses veya JSON yedeğine dosya ekleme yoktur. Laboratuvardan çıkınca veya yenileyince dosya yeniden seçilir. Hatalı/büyük dosya mevcut geçerli kaynağı bozmaz.

Kompresyonun dört parametresi, masking eşlik frekansı/kesme, pan, width, polarite, reverb ve delay ayarları denenebilir. A referans / B kullanıcı ayarı; mono ve solo araçları bulunur. İşlenmiş, ortalama seviyeleri eşitlenmiş B örneği stereo PCM16 WAV indirilebilir. Masking'de ayrı hedef/eşlik dosyaları aynı zaman noktasından başlamalıdır; otomatik stem ayırma yoktur. Kullanıcının stereo hedef ve eşlik dosyalarının iki kanalı korunur; eşlik EQ’su iki kanala ayrı uygulanır. Kayıtlar başlangıçtan hizalanır, kısa eşlik sıfırla doldurulur ve uzun eşlik hedef önizlemesine kırpılır.

## Sonraki değerlendirme

[Doğrulama raporu](../dogrulama.md) otomatik kontrol sonuçlarını kaydeder. Fiziksel kulaklıkla ses kalitesi, düşük seviye masking/release farklarının anlaşılması, gerçek iPhone/Android, Bluetooth, VoiceOver/TalkBack ve farklı kayıtlarla beceri aktarımı ayrı kullanıcı pilotu gerektirir. Sıradaki içerik büyümesi daha çok türde lisanslı multitrack, birden fazla sorunun bir arada olduğu görevler ve hangi müdahalenin neden seçildiğini açıklama olabilir. Bu sürüm öğrenme etkisi veya sınav başarısı iddiası taşımaz.

## Başlıca kaynaklar

- iZotope: [Audio Dynamics 101](https://www.izotope.com/community/blog/audio-dynamics-101-compressors-limiters-expanders-and-gates), [8 Common Compression Mistakes](https://www.izotope.com/community/blog/8-common-compression-mistakes-music-producers-make), [What Is a Transient?](https://www.izotope.com/community/blog/what-is-a-transient-audio-production).
- iZotope: [Unmasking Your Mix with Neutron](https://www.izotope.com/community/blog/unmasking-your-mix-with-neutron).
- iZotope: [What Is Mid/Side Processing?](https://www.izotope.com/community/blog/what-is-midside-processing), [6 Tips for Widening](https://www.izotope.com/community/blog/6-tips-for-widening-the-stereo-image-of-a-mix), [Mono vs. Stereo](https://www.izotope.com/community/blog/mono-vs-stereo).
- iZotope: [What Is Reverb?](https://www.izotope.com/community/blog/what-is-reverb), [Reverb Pre-Delay](https://www.izotope.com/community/blog/reverb-pre-delay), [When to Use Reverb and Delay](https://www.izotope.com/community/blog/when-to-use-reverb-and-delay), [Reverbs and Delays](https://www.izotope.com/community/blog/reverbs-and-delays), [Convolution Basics](https://www.izotope.com/community/blog/the-basics-of-convolution-in-audio-production).
- SoundGym: [herkese açık oyun açıklamaları](https://www.soundgym.co/games/index).
- VSCO 2: [depo ve krediler](https://github.com/sgossner/VSCO-2-CE), [sabit commit lisansı](https://github.com/sgossner/VSCO-2-CE/blob/440300901dfe9275fd84e0b7763af1f8443ae62e/LICENSE.md), [piyano kaynak bilgisi](https://github.com/sgossner/VSCO-2-CE/blob/440300901dfe9275fd84e0b7763af1f8443ae62e/Keys/Upright%20Piano/Info.txt).
