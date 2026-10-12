# Doğrulama kayıtları

## 0.9 önizleme — gelişim ekranı ve gerçek PDF raporu

12 Ekim 2026 (Europe/Istanbul), Node.js 24.19.0, sistem Chromium'u ve Poppler ile. Son uygulama kaynakları, testler ve üretim çıktısı tarayıcı turunda sabit tutuldu; 115 dosyanın hash'i tur sonunda yeniden kontrol edildi. [Kullanım ve sınırlar](gelisim-raporu.md), [araştırma](research/gelisim-raporu-arastirmasi.md).

| Kontrol | Sonuç |
| --- | --- |
| Birim testleri | **326 / 326 geçti**, 11 dosya; önceki 287 kontrole 31 rapor/kaynak ve sekiz gerçek PDF kontrolü eklendi |
| TypeScript ve üretim build'i | `npm run build` geçti; rapor ve çalışma kaynakları ihtiyaç olduğunda, PDF motoru indirme sırasında yükleniyor |
| Tam tarayıcı turu | **141 / 141 geçti**, iki worker, 6.7m; 11 yeni rapor senaryosu dahil |
| Rapor sayıları ve kapsam | Normal pratik, hata tekrarı, başlangıç, geçilen soru, kısmi oturum, deneme ve öz değerlendirme ayrı; seçili yol ve İstanbul takvim günleri ekranda/PDF'de korunuyor |
| Gelişim karşılaştırması | Aynı yol/aşama/kaynak, farklı soru, ayrı oturum ve duyulan örnek koşulları; az veri, eski ses detaysız kayıt ve gelecekteki tarih sonuç uydurmuyor |
| Sonraki çalışma | Gerekçeli en fazla üç odak, 20 beceri kılavuzu ve esnek yedi gün; önerilen aşama, seçili kişisel yol ve yarım dersi değiştirme onayı geçiyor |
| Gerçek PDF | A4 sayfalar, seçilebilir Türkçe/İngilizce karakterler, tarih/kapsam/sayılar, sayfa sonları ve tıklanabilir kaynaklar Poppler ile incelendi; uzun metin ve taşma sınırları kontrol edildi |
| PDF hata / tekrar | Hatalı yerel font isteği hayalî indirme üretmiyor; yeniden deneme geçerli dosya oluşturuyor. Font yapısı/SHA-256 ve gömme doğrulanıyor |
| Veri korunması | Rapor/PDF ilerlemeyi değiştirmiyor; kota veya kurtarılabilir bozuk kayıt uyarısı gerçek PDF'ye ekleniyor. Diskteki orijinal ve bu sekmenin yedekleri aynı kalıyor |
| Kaynak dili / ücret | Türkçe kaynaklar TR ve EN PDF'de önce geliyor; uygun Türkçe eşleşme yoksa İngilizce açıkça etiketleniyor. Ücretsiz çalışma yolu ve isteğe bağlı ücretli kitap ayrı |
| Mobil / erişilebilirlik | 320/390 px TR/EN raporda yatay sayfa taşması yok; otomatik WCAG 2 A/AA ve 2.1 AA kontrolleri geçti. Sayısal grafik tablosu bulunuyor |
| Çevrimdışı | Hem kökte hem `/freq/` altında ilk PDF indirme, rapor daha önce açılmadan tamamlanmış kurulumdan sonra internetsiz geçti |
| Eski uygulama akışları | Mevcut 130 tarayıcı senaryosu son üretim çıktısında yeniden geçti. Soru/ses, kişisel model, yedek ve sınav modelleri değiştirilmedi; `content.ts` farkı yalnız 0.9 sürüm etiketidir |
| Bağımlılıklar | Sabit `jspdf@4.2.1`; kayıtlı prod/dev bağımlılıklarında `npm audit --json` bilinen açık sayısı **0** |
| Üretim önbelleği | 24 dosya; kapsamlı önbellek sürümü `b1a622755373`; `sw.js` ile hazır web çıktısı 25 dosya |
| Reusable cloud kurulum | Frozen lockfile kurulumu ve build yeni script ile geçti. Poppler kontrol/kurulumu ve test sırası install/start taslağına kaydedildi; taslak kaydı yayın değildir |

Tarayıcı turu gerçek Web Audio saatleri ve gerçek PDF dosyaları kullanır. Ses dinleme koşulları, ritim toleransı ve sınav süreleri gevşetilmedi; test kapatılmadı. Örnek PDF ve ekran görüntülerindeki kayıtlar geçerli **simüle test verisidir**, bir kullanıcının öğrenme sonucu değildir.

Rapor bu önizlemede ücretsizdir; ödeme, rapor kredisi, sponsor veya affiliate sistemi çalıştırılmadı. İlk ücretsiz/yeni dönem ücret modeli yalnız gelecek tasarımıdır. Araştırma resmî ürün belgeleri ve eğitim kaynaklarına dayanır; Freq'in öğrenme etkisinin deneysel doğrulaması değildir. Türkçe her konu için doğrulanmış kaynak bulunmadı; kitapların tümü okunmadı, bütün videoların oynatımı/konuşma dili/altyazısı doğrulanmadı. Kartlar bu kapsamı belirtir.

Gerçek iPhone/Android, kablolu/Bluetooth, manuel VoiceOver/TalkBack, PDF/UA etiketli erişilebilirlik, öğretmen değerlendirmesi ve gecikmeli/yeni kayıtta öğrenme pilotu tamamlanmadı. Bu yerel kontroller uzak CI veya canlı Pages yayınının başarı kaydı değildir. Kurumların tam sınav kapsamı, native mağaza paketleri ve geniş multitrack kütüphanesi önceki devam işidir.


## 0.8 önizleme — derin denetim ve düzeltmeler

10 Ekim 2026 UTC, Node.js 24.19.0 ve sistem Chromium'u ile. Son kaynak, test ve üretim dosyaları tarayıcı turunda sabit tutuldu; 76 dosyanın hash'i tur sonunda tekrar kontrol edildi. Ayrıntılı [eleştiri ve düzeltmeler](kalite-denetimi.md).

| Kontrol | Sonuç |
| --- | --- |
| Birim testleri | **287 / 287 geçti**, dokuz dosya; 0.7'ye göre 18 yeni kontrol (15 denetim, üç ses yaşam döngüsü) |
| TypeScript ve üretim build'i | `npm run build` geçti; `tsc -b`, Vite ve çevrimdışı önbellek üretimi tamamlandı |
| Son sabit çıktıda tam tarayıcı turu | **130 / 130 geçti**, iki worker, 6.5m; dokuz yeni denetim senaryosu dahil |
| Önceki 0.7 soru üreticisi | 54 ders × 200 tohum × beş soru: **54.000 soru birebir aynı**; bu turda değiştirilen ses yaşam döngüsü ve kurtarma soru üretmez |
| Uzun kullanım geçmişi | Eski 100 kişisel / 2.000 cevap / 200 ders sonucu / 30 deneme sınırını aşınca değerlendirme, hata ve sonuç kaybolmuyor; yeniden okuma/birleştirme geçiyor |
| Bozuk kayıt kurtarma | Orijinal JSON byte düzeyinde korunuyor ve indiriliyor. Açık kurtarma sonrası tutarsız oturum kapalı; eksik cevap uydurulmadan bir sonraki kayıt/yedek geçerli |
| Çoklu sekme | Uyumlu cevap tek kayıtta birleşiyor; dil tercihi ileri-geri yazma döngüsü oluşturmuyor. Farklı yarım oturumda otomatik yazma duruyor; iki kopya ayrı indiriliyor |
| Kota / eski istemci | Enjekte edilen kayıt kotası hatasında cevap bellekte ve geçerli yedekte kalıyor. v1 kaynak korunarak v2 alanına geçiliyor; eski v1 sekmesinin yazması yeni geçmişi budayamıyor |
| Öğrenme kanıtı | Aynı ritmin farklı seed'leri tek ses sayılıyor; referansı eksik eski cevap seviye artırmıyor veya ses çeşitliliği üretmiyor. İleri aşama başarısı, iki seçenekli 9/10 ve adil odak kuralları geçiyor |
| Tekrar / istatistik | Aynı ders/ses hatası tek kart; eski kökenler aynı takvimi güncelliyor. Erken doğru takvimi ilerletmiyor. Hata tekrarları ham pratik yüzdesine katılmıyor; beceri düğmesi önerilen aşamayı açıyor |
| A/B dinleme | Hızlı düğme geçişi cevap açmıyor. Her döngü varyantında gerçek `AudioContext` saati en az bir saniye ilerlemeli; sonlu örnek tamamen bitmeli |
| Ses yaşam döngüsü | Doğal tamamlanma iptal sayılmıyor; tamamlanma içinden yeni ses başlatılabiliyor, eski kaynak temizliği yeni oynatmayı durdurmuyor |
| PWA kapsamları | Kök ve `/freq/` önbelleği aynı tarayıcıda birlikte korunuyor; diğer kapsamın örnek kaydı silinmiyor. İki yayın internetsiz yeniden açılıyor |
| Mobil / TR-EN / erişilebilirlik | Yeni bozuk-kayıt, çakışma, beceri ve resmî kapsam ekranlarının axe kontrolleri geçti; mevcut 320/390 px, klavye ve iki dil akışları tam turda geçti |
| Sınav kaynakları | MSGSÜ 2026–2027 resmî kılavuzunun Opera (25–26) ve Müzik teorisi (17–19) kapsamları doğrulandı; iki profilin yedek/devam ve farklı kaynaklı kapsamı geçiyor. Tam kurum denemesi değildir |
| Pazar araştırması izi | 43 ürünlük matris; 14 yorum akışı / 390 indeks satırı, ham CSV sayımıyla aynı. Kapsam ve hash kaydı depoya eklendi; temsili araştırma veya bütün rakiplerin kullanım testi değildir |
| Bağımlılıklar | `npm audit --json` başarılı; kayıtlı prod/dev bağımlılıklarında bilinen açık sayısı **0** |
| Üretim önbelleği | 14 dosya; kapsamlı ad içinde sürüm `9a5a81359645`; hazır web çıktısı `sw.js` ile 15 dosya |

İlk sekiz denetim testi 0.7 üzerinde **8 / 8 başarısız** oldu; düzeltmelerden sonra geçti. Ek eski-yedek kontrolü de düzeltmeden önce **1 başarısız / 14 başarılı** idi: ses referansı olmayan eski doğru cevaplar seviyeyi yükseltiyordu. Artış artık on özgün soru referansı gerektirir. Eski uyumluluk testinin otomatik yükselme beklentisi bu daha ihtiyatlı kurala göre değiştirildi; %80 geçmiş doğruluk, kayıtların korunması ve hayalî tekrar sesi üretilmemesi ayrıca kontrol ediliyor.

İlk tam aday turu 123 / 130 geçti. Yedi hata aynı doğal ses bitişi regresyonundan kaynaklandı; tamamlanma/idle sırası ve oynatma kimliği koruması düzeltildi. Üç yaşam döngüsü testi eklendi; etkilenen yedi senaryo ayrı geçti ve son tam 130 testlik tur eksiksiz tamamlandı. Dinleme sınırı, son teslim anı, ritim toleransı veya yanıt gizleme gevşetilmedi; test kapatılmadı. Ses yaşam döngüsü birim testleri denetlenebilir taşıma/saati ve gerçek PCM'i kullanır; tarayıcı turu gerçek Web Audio ile çalışır.

Gerçek iPhone/Android, kablolu/Bluetooth, VoiceOver/TalkBack, eğitimci/jüri kontrolü ve öğrenme/aktarımı ölçen pilot yapılmadı. Native mağaza paketleri hazır değil. Tek resmî kılavuz/iki program kapsamı, diğer kurumların araştırması veya bütün sınavın öğretimi anlamına gelmez. Yerel sonuçlar uzak CI veya canlı Pages yayını başarı kaydı değildir. [Deneme ve manuel yayın](deneme-ve-yayin.md).

## 0.7 önizleme — kişiye uygun çalışma

10 Ekim 2026, Node.js 24.19.0 ve sistem Chromium'u ile. Son üretim çıktısı sabit tutuldu; tarayıcı turu sırasında yeniden build yapılmadı.

| Kontrol | Sonuç |
| --- | --- |
| Birim testleri | **269 / 269 geçti**, yedi dosya; 28 yeni kişiselleştirme kontrolü |
| TypeScript ve üretim build'i | `npm run build` geçti; `tsc -b`, Vite ve çevrimdışı önbellek üretimi tamamlandı |
| Tam tarayıcı turu | **121 / 121 geçti**, iki worker, 4,5 dakika; dokuz yeni kişisel çalışma senaryosu dahil |
| Önceki 0.6 soru üreticisi | 54 ders × 200 tohum × beş soru: **54.000 soru birebir aynı** |
| Başlangıç değerlendirmesi | Üç yolun tüm soruları, ikinci probun uyarlanması, gerçek mevcut seviyeler, ara verme/yenileme, boş bırakma, tamamlanmayan değerlendirmenin eski öneriyi koruması |
| Seviye önerisi | Yeni soru kanıtı, farklı oturum şartı, tek aşamalı dersler, bir aşamalı artış/azalış, en temel aşamada öğretim desteği; aynı etkin soru tohumunun farklı kayıt biçimleri iki kez sayılmıyor |
| Tekrar takvimi | İlk 10 dakika; zamanında başarıyla 1 / 3 / 7 gün ve kapanma; erken doğru cevap takvimi ilerletmiyor, yanlış aynı kartı sıfırlıyor, boş cevap takvimi değiştirmiyor |
| Tam ses ve girişler | Özgün kaynakla tekrar; A/B tam dinleme koşulu; melodik/ritmik giriş ve ritim tekrarı ekranına geçiş; değerlendirmede erken doğru/yanlış veya taslak önizleme yok |
| Yanlış miks karşılaştırması | Seçilen C ayarı canlı geri bildirimde ve saklanan sonuçta aynı ses/parametre karşılaştırmasıyla açılıyor |
| Yedek ve geçmiş | Gerçek JSON indirme/yükleme, tekrarlı birleştirme, tarihlerin korunması, eski yedek uyumu, aynı çalışmanın ileri kopyası ve çelişkilerin reddi; özgün ders oturumu korunuyor |
| Mobil / TR-EN / erişilebilirlik | 390 px yatay taşma yok; ayrıntılar açılır bölümlerde; kişisel plan, sonuç ve giriş ekranlarında axe kontrolleri geçti; odak soru/sonuca taşınıyor |
| Çevrimdışı | Önbellek kurulduktan sonra kişisel pratik ve yenileme internet kapalıyken çalıştı; önceki kök ve `/freq/` kontrolleri de tam turda geçti |
| Üretim önbelleği | 14 dosya; sürüm `9e48d5b1f188` |

İlk kişisel tarayıcı turunda iki sorun bulundu: kardeş ses/giriş bileşenlerindeki aynı React anahtarı, soru geçişlerinde yinelenen ses paneli oluşturuyordu; stereo doğrulanınca onay kutusunun anında kaldırılması etkileşimi bozuyordu. Bileşen anahtarları ayrıldı, mevcut stereo sorusunun kontrolü görünür tutuldu. Son tur aynı geçişleri ve tek ses panelini doğruladı.

İlk geniş tur 119 / 120 geçti. Eski yedek testi doğruluk bayrağını değiştirip birleştirme çelişkisi bekliyordu; yeni arşivlenmiş soru cevabı bu bozulmayı artık dosya doğrulamasında yakalıyor. Test hem bozuk cevap reddini hem de içeriği geçerli fakat mevcut kayda göre tarihi çelişen dosyanın birleştirme reddini ayrı kontrol edecek şekilde güçlendirildi. Son 121 testlik tam tur eksiksiz geçti; kontroller devre dışı bırakılmadı, puanlama toleransları değiştirilmedi.

Gerçek iPhone/Android, Bluetooth, VoiceOver/TalkBack ve eğitimci pilotu yapılmadı. İki başlangıç sorusu, uyarlama eşikleri ve tekrar aralıkları Freq çalışma kurallarıdır; kalibre edilmiş genel yetenek veya kabul puanı değildir. Farklı tohumlar dar içerik ailelerinde benzer örnekler üretebilir; daha geniş içerikte aktarım pilotu ilerleyen kapsamdır. [Kişiselleştirme tasarımı](research/kisisellestirme-tasarimi.md). Kuruma özel resmî kılavuz doğrulaması ayrı bekleyen iştir.

## 0.6 önizleme

10 Ekim 2026, Node.js 24 ve sistem Chromium'u ile. Bu kayıt genel sınav atölyesini doğrular; kurumların resmî sınav kapsamı henüz doğrulanmadı.

| Kontrol | Sonuç |
| --- | --- |
| Birim testleri | 241 / 241 geçti; eski 219 kontrole 22 sınav içeriği/model/yedek kontrolü eklendi |
| TypeScript ve son üretim build'i | Geçti; 14 dosyalık çevrimdışı önbellek, son sürüm `7a12998d2c99` |
| Önceki 0.5 soru üreticisi | 54 ders × 200 tohum × beş soru: 54.000 soru birebir aynı |
| Son sabit çıktıda tam tarayıcı turu | 111 / 112 geçti; bir eski ritim testinin geciken otomatik girdiyi koşulsuz doğru sayan beklentisi başarısız oldu |
| Son ders/notasyon düzenlemesinden sonra sınav + müzik turu | 26 / 27 geçti; yeni sınav alanının 11 kontrolü ve müziğin 15 kontrolü geçti. Kalan ritim kontrolünde testin olay öncesi ölçümüne eklediği 5 ms varsayımı başarısız oldu |
| Ritim test ölçümü düzeltmesinden sonra | Üç seviye 3 / 3 geçti; gerçek olay işleme aralığı ve kaydedilen ses saati zamanları karşılaştırılıyor. Puanlama/tolerans değişmedi |
| Üç seviyeli denemeler | Deterministik soru planı, tam dinleme, dinleme sınırı, başarısız başlatma iadesi, boş/yanlış/doğru cevap ve tek sonuç kaydı |
| Süre ve geri yükleme | Son teslim anında cevap puanlanmıyor; kapalı sayfadan dönüşte kalanlar boş kaydediliyor; yarım deneme ilk son teslim zamanıyla gerçek JSON dosyası üzerinden geri alınıyor |
| Deneme sonucu | Yanıtlar deneme sırasında kapalı; bitince soru/yanıt sesi, derece/ritim geri bildirimi ve eksik beceriye pratik bağlantısı |
| Prova kayıtları | Üç kutuluk öz değerlendirme ve not; yeniden açma/yedek doğrulama; otomatik beceri puanından ayrı |
| Yeni kayıtların güvenilirliği | Yanlış doğruluk bayrağı, değiştirilmiş süre, gelecekteki dinleme, çelişen cevap, aynı kimlikli farklı sonuç reddediliyor; anahtar sırası normalize, birleştirme idempotent |
| Mobil / erişilebilirlik | 320/390 px yeni sınav, solfej, prova ve sonuç ekranlarında taşma yok; seçilen WCAG 2 A/AA ve 2.1 AA kurallarında ihlal yok |
| Son mobil solfej düzenlemesi | İki ölçü dar ekranda ayrı satırlar; toplam sekiz nota ve nota adları korunuyor; son sınav turunda doğrulandı |
| Çevrimdışı sınav | Yeni dersler ve süreli denemede gerçek ses ilk önbellek kurulumundan sonra internetsiz çalışıyor |
| Üniversite kılavuzları | Doğrulanmadı; çalışan ağ politikasında üniversite alanları yok. Sekiz kurum / 16 ana-alt alan izni taslağa eklendi; 53 önceki araştırma izni ve paket preset'i korunuyor |

İlk kontrollerde aynı anda birim ve tarayıcı yükü, eski bir sample testi için 5 saniye sınırını aşırdı. Testler sürerken build klasörünün yenilenmesi de bir HTTP 404 ve bir service worker beklemesi yarattı. Birim testleri tek başına, üretim çıktısı sabit tutularak tarayıcı testleri yeniden çalıştırıldı; bu sorunlar son sabit turda görülmedi. Zaman sınırları artırılmadı ve hiçbir kontrol kapatılmadı.

Son sabit tam turdaki ritim olayında otomatik RAF gönderimi ilk vuruşu yaklaşık 100 ms geç üretti; uygulama ±65 ms sınırını aşan bu vuruşu doğru olarak reddetti. Test artık planlanan gönderim zamanını gerçek zaman sanmıyor: her pointer/Space olayının öncesinde ve sonrasında bağımsız AudioContext saati gözlemi alıyor, uygulamanın kaydı bu aralığın içinde olmalı. Gözlenen girişin ofset/sapmalarıyla sonuç ve geri bildirim ayrıca karşılaştırılıyor. Basılı Space tekrarları, açık gönderme, kalıcı kayıt ve yenileme kontrolleri korunuyor. Uygulamaya yanıt veya sahte ses saati enjekte edilmiyor. Son üç seviyelik tur geçti; düzeltmeden sonra 112 testlik tam tur yeniden çalıştırılmadı.

Son UI düzenlemesi yalnız mobil porte satırlarını değiştirdi; eski soru/ses modelleri değiştirilmedi. Gerçek iPhone/Android, Bluetooth/kablolu gecikme, manuel ekran okuyucu, öğretmen/jüriyle içerik ve öğrenme etkisi pilotları yapılmadı. Solfej örneği Do majör / Sol anahtarı / 4/4 dörtlüklerle, otomatik dikte derece/konum girişiyle sınırlı. Kuruma özel yıl/program paketleri, resmî ağırlıklarla değerlendirme ve tam sınav simülasyonu tamamlanmış değildir. [Araştırma durumu](research/sinav-hazirligi-arastirma-durumu.md).

## 0.5

10 Ekim 2026 (Europe/Istanbul), Node.js 24 ve sistem Chromium’u ile.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve üretim build’i | Geçti; 14 statik dosya çevrimdışı önbelleğe dahil |
| Soru, ilerleme, yedek ve ses/DSP testleri | Son tur 219 / 219 geçti |
| Tam tarayıcı / gerçek Web Audio turu | 100 / 100 geçti |
| Son tepe payı, ses hata durumu ve yönerge düzeltmelerinden sonra müzik akışları | 16 / 16 geçti; yeni ses hata testi dahil |
| Önceki 0.4 soru üreticisi | 36 ders × 200 tohum × beş soru = 36.000 soru birebir aynı |
| Yeni içerik ve düzen | 18 yeni pratik; toplam 54 pratik / 20 beceri; müzik 24 pratik / altı bölüm; eski başlangıç önerileri korunuyor |
| Tonal işitme | Değişen tonikler, göreli derece/perde, tonikte bitmeyen cümleler; aday ve yalnız bağlam dinlemek yanıtı açmıyor |
| Ses üretimi | 44.1/48 kHz; derece frekansı spektral kontrol, suslarda sessizlik, hedef/yanıt notaları ve ritim konumları tutarlı; son tepe payı testinde sık yanlış dokunuşlar da kırpılmıyor |
| Dikte | Üçer seviyede yazma/düzenleme, taslak/yanıt sesi, konum geri bildirimi, tek sefer puanlama, dil ve yenileme |
| Ritim tekrarı | Üç seviyede gerçek Web Audio saatine göre pointerdown ve Space olayları; basılı Space tekrarları sayılmıyor; gönderme öncesi puan yok; kayıt, tekrar sesi, sapma tablosu ve yenileme |
| Ritim değerlendirme | Sabit ±240 ms örnek ofsetler dengeleniyor; eksik/fazla vuruş, tempo sapması, yerel hata ve tolerans sınırları ayrı kontrol edildi |
| İptal ve ses hatası | Tekrarı durdurma, görünürlük/ses askısı puan oluşturmuyor; aday ses başlatılamazsa hata mesajı var, hazırlanıyor durumunda takılmıyor |
| Yeni yedekler / arşiv | 18 dersin beş cevabı ve tamamlanmış sonuçları, dikte dizileri ve dokunma zamanları korunuyor; birleştirme idempotent, çelişen/bozuk cevaplar reddediliyor |
| Tekrar çalışma | Becerilerim altında son beş müzik cevabı tamamlanan oturumdan sonra açılıyor; dinleme puanı artırmıyor |
| Mobil / erişilebilirlik | 320/390 px yeni giriş ve geri bildirimlerde taşma yok; seçilen WCAG 2 A/AA ve 2.1 AA kurallarında ihlal yok; klavye diktesi beş soruluk oturumu tamamlıyor |
| Çevrimdışı / alt klasör | Yeni ritmik dikte kök URL’de, melodik dikte /freq/ altında çevrimdışı ses ve puanlama ile çalışıyor |
| Eski özellikler | İleri miks, dosya/WAV, A/B/C, stereo, kaynaklar, yedek, mobil, klavye, offline akışları tam turda geçti |

İlk tarayıcı turunda kardeş bileşenlerde aynı React anahtarının kullanılması ve tonal bağlamdan sonra ana düğmenin bağlamı yeniden çalması bulundu; ayrı anahtarlar ve soru/bağlam oynatma ayrımıyla düzeltildi. Space olay testleri gerçek odaklanmış girişe yönlendirildi; pencere hedefli olaylar da hata üretmiyor. Beş tam kadans/sayım/melodi örneği en az 35 saniye sürdüğü için yalnız beş soruluk uçtan uca testin toplam süresi 60 saniyedir; tek örnek bekleme sınırı 10 saniye kalır.

Son tam turdan sonra yalnız yeni müzik sesinde sık yanlış dokunuşlar için tepe payı, aday sesin askıda kalması durumunda hata, dikte/tekrar yönergeleri ve hazırlık yolundaki mevcut içeriğe yönlendirme düzeltildi. 219 birim testi ve son build geçti; ilgili müzik akışlarının tamamı 16 testle yeniden doğrulandı. Eski miks ses modelleri bu son düzenlemede değişmedi.

Bu testlerdeki dokunuşlar otomatik tarayıcı olaylarıdır; insanın veya fiziksel telefonun zamanlama doğruluğu değildir. Telafi edilen ofset cihaz kalibrasyonu sayılmaz. Majör tonalite, eşit zamanlı kısa monofonik dikte ve bir 4/4 ölçü kapsamı; tam porte/süre diktesi, mikrofonla tekrar, minör/kromatik, makam/usul ve kurum sınavlarının bütünü yoktur. Gerçek iPhone/Android, kablolu/Bluetooth, manuel VoiceOver/TalkBack, müzik öğretmeniyle ses/anahtar örneklem kontrolü ve öğrenme etkisi pilotu yapılmadı. Uzak CI ve canlı yayın bu yerel sonuçlarla çalıştırılmış sayılmaz. [Kaynaklar ve model sınırları](research/muzik-kulagi-arastirmasi.md).

## 0.4

9 Ekim 2026 (Europe/Istanbul), Node.js 24 ve sistem Chromium’u ile.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve üretim build’i | Geçti; 14 statik dosya çevrimdışı önbelleğe dahil |
| Soru, ilerleme, yedek, DSP ve kayıt testleri | 146 / 146 geçti |
| Tam tarayıcı / gerçek Web Audio turu | 76 / 76 geçti |
| Son stereo masking / geri bildirim düzenlemesinden sonra ileri akışlar | 13 / 13 ilgili tarayıcı kontrolü yeniden geçti |
| Önceki 0.3 soruları | 15 ders × 200 tohum × beş soru: 15.000 soru birebir aynı |
| 21 yeni pratiğin tüm yanıt alternatifleri | Gerçek kayıt katmanlarıyla doğru / yanlış ayarlar farklı; iki kanal sonlu; ortak RMS ve en fazla 0.720001 tepe |
| Kompresör ve attack/release | Eşik üstü azaltma, kanal bağlantısı, hızlı atağın kenarı bastırması, uzun bırakmanın sessiz aralığa taşınması doğrulandı |
| Stereo / mono / polarite | Equal-power pan, M/S mid korunması, ilişkili kanallarda mono iptali, gerçek gain node’un explicit speaker downmix’i doğrulandı |
| Reverb / delay | Pre-delay wet yanıtı doğru sample miktarında kaydırıyor; uzun nominal kuyruk daha fazla geç enerji bırakıyor; delay aralığı, feedback ve ping-pong kanalları sample düzeyinde doğru |
| Gerçek kayıtlar | Beş WAV’ın SHA-256, 22.05 kHz / mono PCM16 biçimi, dört saniye süresi, sınır fade’i, RMS ve tepe sınırı kontrol edildi |
| Kayıtlı A/B/C tarayıcı buffer’ları | Yedi yeni beceride iki kanal, ortak saat başlangıcı, RMS farkı <0.001 dB ve tepe payı doğrulandı |
| Öğretim / yanıt gizleme | Etiketli örneklerde tüm seçenekler dinlenebilir; bağımsız soruda parametre tablosu ve ölçüm grafiği yok; yanlış yanıtta C seçilen ayarı çalar |
| Stereo kurulumu | Başlangıçta devam düğmesi kapalı; sol test yalnızca sola, sağ test yalnızca sağa gidiyor; kullanıcı kutuyu işaretleyince devam açılıyor |
| Kendi ses dosyası | Gerçek dosya input’u stereo WAV açıyor; ilk sekiz saniye; yalnızca aynı-origin uygulama istekleri; ilerlemeye/sunucuya/yedeğe ses veya dosya adı yazılmıyor |
| İşlenmiş WAV indirme | Gerçek indirme, RIFF/PCM16 stereo başlık, sekiz saniye; reverb’de ek dört saniye kuyruk doğrulandı |
| Ayrı eşlikle kendi masking’i | Eşlik olmadan player açılmıyor; stereo hedef/eşlik kanalları korunuyor; EQ değişiminde solo hedefin dalga şekli korunuyor |
| Hatalı / büyük ses dosyası | Decode hatası ve >20 MiB dosya geçerli mevcut kaynağı koruyor; kullanıcıya yeniden seçme açıklaması veriliyor |
| Yedi yeni becerinin yedeği | 21 dersin kaynak/yarım oturum/tam sonucu korunuyor; yeniden birleştirme puanı artırmıyor |
| Mobil / erişilebilirlik | Yeni yol, ders, geri bildirim ve laboratuvar: 390 ve 320 px; yatay taşma yok; seçilen WCAG 2 A/AA ve 2.1 AA kurallarında ihlal yok |
| Çevrimdışı / alt klasör | /freq/ altında hazır akustik laboratuvar, reverb dersi ve WAV asset yüklemeleri internetsiz çalışıyor |
| Önceki EQ / loudness / ritim / yedek / klavye | Tam turda tekrar geçti |

İlk tarayıcı turunda yeni testlerin sekizi arayüzdeki “Akustik piyano” yerine “Akustik kayıt” adını arıyordu. İki eski sayım beklentisi de 0.3’ün altı pratiğine göre kalmıştı. Test seçicileri gerçek kaynak başlığından türetildi; toplam 27 / görünür temel altı pratik ayrı kontrol edildi. Son tam tur 76 test geçti. Bundan sonra stereo masking’de kullanıcı hedef ve eşlik dosyasının iki kanalı korunacak şekilde düzeltme yapıldı; yeni unit testi ve ilgili ileri akışlar ayrıca doğrulandı. Uygulama testlerinde bekleme sınırını artırarak ses yükleme sorunu örtülmedi.

Kayıtlar gerçek akustik single-note / hit örneklerinden özgün kısa düzenlemelerdir; ticari şarkı veya tam grup multitrack’i değildir. RMS sinyal enerjisidir; kusursuz algısal loudness veya fiziksel kulaklık ses basıncı değildir. Kompresör ms değerleri model zaman sabitleri, reverb süresi nominal decay’dir; ticari plugin / gerçek oda emülasyonu sayılmaz. Ayrıntılar [araştırma belgesinde](research/ileri-miks-arastirmasi.md).

Gerçek iPhone/Android, Bluetooth, manuel ekran okuyucu, fiziksel dinleme kalitesi ve öğrenme/aktarımı bu kontrollerin kapsamında değildir. Native mağaza paketleri yoktur. Uzak CI ve canlı yayın bu yerel sonuçlarla çalıştırılmış sayılmaz.

## 0.3

8 Ekim 2026 UTC, Node.js 24 ve sistem Chromium'u ile.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve üretim build'i | Geçti |
| Soru, ses ve yedek testleri | 72 / 72 geçti |
| Gerçek tarayıcı / Web Audio işlev testleri | 40 / 40 geçti |
| Önceki 0.2 soru üreticisiyle karşılaştırma | Eski dokuz derste 200 tohum × beş soru: 9.000 soru birebir aynı |
| Ses yüksekliği örnekleri | −6, −3, −1, 0, +1, +3, +6 dB farklar korunuyor; zamanlama ve ses şekli aynı |
| Tarayıcıdaki ses yüksekliği buffer'ları | +6, −3 ve +1 dB doğrulandı; A/B aynı anda başlıyor; tepe en fazla 0.720001 |
| Ritim vuruş zamanları | 44.1 ve 48 kHz'te sayım ve vuruş yerleri ses örneği düzeyinde doğrulandı |
| Tarayıcıdaki onaltılık ritim buffer'ları | Gerçek ses buffer'larından çıkarılan vuruş yerleri A/B soru kalıplarıyla aynı |
| Ritimde tam dinleme şartı | Yarıda kesilen A sayılmadı; B tamamlanınca yanıt kapalı kaldı; A tamamlanınca açıldı |
| Ritim yanıtı, dil değişimi ve yenileme | Oturum ve tek yanıt kaydı korundu; bağımsız soruda kalıp çizimi yanıt öncesi görünmedi |
| Yeni derslerin yedekleri | Ses kaynağı, tam sonuç ve yarım oturum korunuyor; ikinci yükleme puanı artırmıyor; çelişen kaynak reddediliyor |
| Mobil yol, ses yüksekliği ve ritim ekranları | 390 px'te, ayrıca onaltılık ritimde 320 px'te yatay taşma yok |
| Yeni ekranların otomatik erişilebilirliği | Seçilen WCAG 2 A/AA ve 2.1 AA kurallarında ihlal bulunmadı |
| Önceki EQ, kaynak seçimi, yedek, çevrimdışı ve alt klasör kontrolleri | Tekrar geçti |

İlk tarayıcı turunda üç ritim testi, dört sayım dahil beş saniyelik örneği varsayılan beş saniyelik bekleme sınırında tamamlayamadı. İlgili test beklemesi on saniyeye çıkarıldı; tam dinleme koşulu korunarak son turdaki 40 test geçti.

Ritim çalışması dinleyerek kalıp ayırt etmedir; dokunma zamanlaması veya gerçek sınavdaki ritim tekrarı ölçülmez. dB farkı göreli sinyal seviyesidir; fiziksel ses basıncı değildir. Gerçek iPhone/Android donanımı, Bluetooth, manuel ekran okuyucu, insan tarafından dinleme kalitesi ve öğrenme etkisi bu otomatik kontrollerin kapsamına dahil değildir. Mağaza paketleri henüz yoktur. Uzak CI ve canlı site bu yerel testlerle doğrulanmış sayılmaz.

## 0.2

8 Ekim 2026 UTC, Node.js 24 ve sistem Chromium'u ile.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve üretim build'i | Geçti |
| Soru, ses materyali, eski kayıt ve yedek birleştirme testleri | 54 / 54 geçti |
| Tarayıcı / gerçek Web Audio işlev testleri | 29 / 29 geçti |
| Üç ses kaynağında seçim, yenileme ve kaynakla kayıt | Geçti |
| Üç kaynakta A/B RMS farkı | 0.001 dB altında |
| Yanlış yanıttaki A/B/C başlangıcı | Üçünde aynı zaman damgası |
| A/B/C RMS farkı ve tepe payı | 0.001 dB altında; tepe en fazla 0.720001 |
| Dosya düğmesinden gerçek yedek indirme, sıfırlama ve geri yükleme | Aynı yanıt ve yarım oturum geri geldi |
| İkinci yedek yüklemesi ve sayfa yenileme | Kayıtlar ikinci kez sayılmadı ve korundu |
| Eski 0.1 yedeği, yüklemeyi iptal, bozuk/çelişen/yeni şema/çok büyük dosya | Geçti; reddedilen dosyalar ilerlemeyi değiştirmedi |
| Mobil kaynak seçimi ve karşılaştırma ekranı | 390 px'te yatay taşma yok |
| Mobil karşılaştırma ve geri yükleme penceresi için otomatik erişilebilirlik | Seçilen WCAG 2 A/AA ve 2.1 AA kurallarında ihlal bulunmadı |
| Dokuz seviye, dil, çevrimdışı kullanım ve alt klasör yayını | Önceki işlev kontrolleri tekrar geçti |

Mobil açıklama ve örnek panelinin grid içindeki doğal genişliği ekranı taşıyordu. Çocuk panellerin küçülmesine izin verilerek düzeltildi; taşma gizlenmedi. Kaynak seçimi ekranı yeniden test edildi.

Sentez dokularının fiziksel dinleme kalitesi, iPhone/Android donanımı, Bluetooth, manuel ekran okuyucu ve gerçek müzikte eğitim etkisi hâlâ ayrı pilot kontrolleridir. Native mağaza paketleri bu sürüme dahil değildir. Uzak GitHub CI ve canlı yayın bu yerel sonuçlardan hareketle çalıştırılmış sayılmaz.

## 0.1 (önceki sürüm)

8 Ekim 2026 UTC, bu cloud ortamında Node.js 24 ve sistem Chromium'u ile.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript + üretim build'i | Geçti |
| Soru, oturum, bozuk kayıt ve ses materyali testleri | 26 / 26 geçti |
| Gerçek tarayıcı / Web Audio işlev testleri | 19 / 19 geçti |
| Türkçe / İngilizce geçişi ve kayıt koruma | Geçti |
| Dokuz seviyede ses, yanlış yanıt ve tekrar dinleme | Geçti |
| Beş soruluk oturum, yenileme ve tek sefer puanlama | Geçti |
| EQ buffer RMS farkı | 0.001 dB altında |
| EQ A/B başlama zamanı | Aynı Web Audio zaman damgası |
| EQ buffer tepe değeri | 0.720001 altında |
| Çevrimdışı yeniden açma ve ses | Geçti |
| Alt klasörden yükleme ve çevrimdışı kullanım | Geçti |
| 390 px mobil görünüm, yatay taşma ve klavye | Geçti |
| Axe otomatik WCAG 2 A/AA + 2.1 AA kontrolü | Ana ekran, ders, soru, geri bildirim ve profil için seçilen kurallarda ihlal bulunmadı |

İlk çevrimdışı testte statik sunucunun `Vary: Origin` başlığı, modül isteklerini kurulum önbelleğiyle eşleştirmeyi engelledi. Yalnızca uygulamanın kendi aynı origin build dosyalarında `ignoreVary` ile eşleştirme yapılarak düzeltildi. Son testte hem kök URL hem `/freq/` alt klasörü internetsiz açıldı ve gerçek ses çaldı.

Doğrulanmayanlar: iPhone Safari / iOS ana ekran kurulumu, Android cihaz kurulumu, fiziksel hoparlör/kulaklık ve Bluetooth, manuel VoiceOver/TalkBack, native iOS/Android paketleri, gerçek kurum sınavı kapsamı, eğitim etkisi ve farklı müziklerde beceri aktarımı. Başsız Chromium'un ses buffer üretmesi, bir insanın ses kalitesini dinleyerek onayladığı anlamına gelmez.

GitHub Actions ve web yayını için dosyalar hazırlanmıştır; uzak CI ve canlı site, bu yerel test sonuçlarıyla çalıştırılmış sayılmaz.
