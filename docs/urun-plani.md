# Ürün planı ve ilk sürüm sınırı

## Kararlaştırılan hedef

Ana odak miks ve prodüksiyon kulağı. Temel müzik kulağı ve konservatuvar / müzik bölümüne hazırlık kendi yollarında yer alır. Türkçe ve İngilizce içerik; web, iOS ve Android hedefleri. Ana ekran aktif yolu, kişisel çalışma planına erişimi ve ders pratiğini gösterir; beceri ayrıntıları kişisel planın içinde açılır. Navigasyon: Bugün, Yollar, Becerilerim, Profil.

## Çalışan sürüm: 0.9 önizleme (`0.9.0-preview.1`)

54 pratik / 20 beceri, önce öğretim ardından pratik. Her derste yanıtı görünen bir örnek var. EQ ve ses yüksekliğinde iki örneği, hafıza ve ritimde iki tam örneği dinlemeden yanıt düğmeleri açılmaz. Doğru/yanlış sonrası tekrar dinleme serbesttir; tekrar dinleme puanı değiştirmez. Yarım bırakılmış oturum korunur. Başka pratiğe geçerken uyarı gösterilir; eski yanıtlar beceri kaydında kalır.

0.2'de miks kaynağı seçimi ve yanlış yanıtı ses olarak karşılaştırma eklendi. Üç kaynak farklı sentez dokuları sunar. Yanlış frekans seçilince C örneği o frekansa aynı gain/Q uygular; orijinal, hedef ve seçim aynı anda başlayan, ortalama seviyeleri eşitlenmiş döngülerdir. Kaynak değişikliği başlangıçta yapılır; soru sırasında birden çok değişken eklenmez.

0.3'te yollar içerik ailelerine göre bölümlendi. Ses yüksekliği alıştırmalarında aynı kaynağın yalnızca seviyesi değiştirilir veya aynı bırakılır; göreli fark bilerek korunur. Ritim alıştırmalarında sayımdan sonra dört vuruşlu bir ölçü karşılaştırılır. Vuruş sayısı, tempo ve ses rengi sabittir; bir vuruşun yeri bir alt bölüme kayabilir. Çizim bağımsız soruda cevap verilmeden gösterilmez. Bu alıştırma dinleyerek ayırt etmedir; ritim tekrarı veya dokunma puanı değildir. Her iki yeni beceri ayrı ölçülür ve yedeklenir.

Profil'den yedek geri yükleme, mevcut kayıtları birleştirir. Kimliği aynı olan kayıtlar tekrar sayılmaz; çelişkiler ve iki farklı yarım oturum yüklemeyi durdurur. Eski 0.1 yedekleri ve yarım oturumlar desteklenir. Dosyalar sunucuya gönderilmez. Sayıya bağlı budama kaldırıldı; gerçek tarayıcı kotası aşılırsa kayıt uyarısı ve indirme eylemi görünür. İçeri alma sınırı 16 MiB'dır.

Miks: EQ bölümünde üç frekans bölgesi → beş frekans noktası → dar bant / yükseltme-kesme; ses yüksekliği bölümünde 6 → 3 → 1 dB. Müzik: melodi ve armonide yön → aralık → majör/minör; ritimde sekizlik bölünme → sus/ters vuruş → onaltılık hareket. Hazırlık: üç → dört → beş notalı karşılaştırma. Bu son yol, gerçek bir kurum sınavının yerine geçen bir deneme değildir.

İlk mobil deneyim HTTPS üstünde kurulabilen PWA. Native mağaza uygulamaları ayrı bir teslimat aşaması. Soru modeli (`src/model.ts`) ve dil içerikleri (`src/content.ts`) tarayıcıdan bağımsız tutuldu; native ses ve kalıcı kayıt adaptörleri henüz yazılmadı.

## Miks yolunun devamı

M0: dinleme ve A/B koşulları. M1: frekans bölgeleri. M2: frekans, yükseltme/kesme, gain/Q. M3: timbre ve masking; solo ile bütün miks. M4: transient/sustain, kompresör attack/release, seviye eşitleme. M5: pan, genişlik, mono ve reverb/delay. M6: birden çok sorun ve ilk müdahale. M7: yeni müzikte gerekçeli uygulama. M3–M5 kısmen paralel olabilir; tek bir zorunlu sıra yaratılmaz.

0.4, M3–M5 için 21 yeni pratik ekler: kompresyon, atak, bırakma, masking, pan/genişlik/mono, reverb ve delay. Beş kaynak, etiketli örnek ayarları, yanlış yanıtta seçilen ayarı çalan C ve yanıttan sonra gerçek buffer ölçümleri bulunur. İleri bölümler açılır başlıklarla düzenlenir; karmaşık tek bir ayar ekranında toplanmaz.

CC0 tek nota/vuruş kayıtlarından hazırlanmış iki akustik düzenleme ve ayrı hedef/eşlik katmanları vardır. Kendi kaydın laboratuvarında ilk sekiz saniye cihazda işlenir; A/B, mono, solo ve işlenmiş WAV indirme kullanılır. Bu alan puansızdır, dosya yedeğe veya sunucuya gönderilmez. Daha geniş müzik/stem kütüphanesi ve M6–M7 bağlam aktarımı ilerleyen kapsamdır. [Araştırma ve ses modelleri](research/ileri-miks-arastirmasi.md).

## Müzik, hazırlık ve makam

0.5, tonal merkez, dizi dereceleri, işlevsel işitme, melodik/ritmik dikte ve ritim tekrarı için üçer seviyeli 18 pratik ekler. Müzik yolunda 24 pratik / altı bölüm bulunur. Dikte girişleri düzenlenebilir ve dinlenebilir; tekrar, dokunma/Space ile bir ölçüyü üretir. Gönderilmiş cevaplar yedeklenir ve Becerilerim altında son beş müzik yanıtı yeniden dinlenir; taslak çıkınca temizlenir. Yanıttan önce hedef çizimi gösterilmez. [Öğretim ve değerlendirme sınırları](research/muzik-kulagi-arastirmasi.md). Minör/kromatik işitme, tam porte/süre diktesi, sesle tekrar ve ileri armoni sonraki içerik ailesidir. Hazırlık paketleri kurumların ilan ettiği formatlara göre yazılır. Makam ayrı bir müzik sistemi olarak seyir, karar/güçlü, bağlama göre entonasyon ve usul içerir; Batı dizisinin farklı isimlerle sunulması yeterli değildir. İçerik için bu alanda uzman ve icracı ortaklığı gerekir.

## Sınav atölyesi önizlemesi ve bekleyen araştırma

Yedi ders ailesi / üçer seviye, öz değerlendirme notları, Sol anahtarlı Do majör 4/4 solfej örneği ve 6/8/10 soruluk süreli ortak deneme çalışır. Ders ve deneme alanları ayrı sekmelerde; eski beş soruluk hafıza pratikleri korunur. Deneme sırasında cevap açılmaz; sonunda her soru geri dinlenir ve eksik beceriye yönlendirilir. Süre, soru sayısı ve dinleme sınırı Freq varsayımıdır. Otomatik sonuç jüri/icra puanı içermez.

MSGSÜ 2026–2027 resmî kılavuzuyla Opera ve Müzik teorisi kapsam haritaları doğrulandı. Programların bütün sınavı, resmî ağırlıklarla puanlama ve diğer kurumların kapsam karşılaştırması tamamlanmadı. Hacettepe, İTÜ, İstanbul, Ankara, Dokuz Eylül, Gazi ve Marmara için program/yıl kılavuzları ayrıca incelenmeli. [Araştırma durumu](research/sinav-hazirligi-arastirma-durumu.md).

## Araştırmadan alınan tasarım kararları

Öğretmeden sınamak, zorluk sıçraması, yanlış yanıttan sonra karşılaştırma yetersizliği ve oturum kaybı ürün riskleri olarak ele alındı. Bunlar seçili yorumlarda görülüyor; bütün rakiplerde güncel ve aynı sorun olduğu iddia edilmiyor. TYE'de geri bildirim / düzeltme, SoundGym'de kompresyon ve multitrack, EarMaster'da Türkçe ve adaptasyon zaten mevcut. Freq'in hedefi bunları yeni icat gibi sunmak değil; düzenli bir akışta kaliteli içerik, ses doğruluğu ve gerçek miks aktarımı sağlamak.

## Kişiye uygun çalışma

0.7 başlangıç değerlendirmesi, hatalardan aralıklı tekrar ve beceri bazında zorluk önerisi ekler. Miks / müzik / hazırlıkta 18 / 20 / 12 soru, ikişer başlangıç probu; tamamlanan değerlendirme geçici seviye önerisi sağlar. Tamamen geçilen beceriler ve yarım yeniden değerlendirme mevcut öneriyi değiştirmez. Her beceride tek bir ham müzikal yetenek puanı verilmez.

Yeni soru kanıtı ve hata tekrarı ayrıdır. En az iki oturumda iki seçenekli görevlerde 9/10, diğerlerinde 8/10 ve en az 2/3 farklı duyulan örnek bir sonraki seviyeyi; 2/6 veya daha az yeni doğru önceki seviyeyi önerir. Hata tekrarının kendisi düzey yükseltmez. Günlük plan en fazla iki zamanı gelen tekrar ve yeni odak soruları içerir. Öncelik güçlük ve en uzun süredir çalışılmayan beceridir; başka zayıf/hiç çalışılmamış konular varken en son çalışılan beceri bir sonraki odakta dinlendirilir. Genel/beceri doğruluğu tekrar hariçtir; elle ileri aşamada sürdürülen güçlü başarı da öneriye alınır. Dersleri elle seçmek serbesttir. 10 dakika / 1 / 3 / 7 gün tekrar politikası ve bu eşikler ürün varsayımlarıdır. [Tasarım ve sınırlar](research/kisisellestirme-tasarimi.md).

## Gelişim raporu ve çalışma kılavuzları

0.9, Becerilerim'den açılan gelişim ekranını ve cihazda üretilen gerçek PDF raporunu ekler. Yol ve Tüm geçmiş / Son 30 gün / Son 7 gün filtresi, normal pratik özeti, etkinlik grafiği, en fazla üç gerekçeli odak ve esnek yedi günlük plan bulunur. Başlangıç, hata tekrarı, süreli deneme ve icra öz değerlendirmesi ayrı tutulur. Aşama önerisi ve bekleyen tekrarlar tüm geçerli geçmişi kullanır; seçili dönem yanıt istatistiklerini süzer.

Beceri tablosu eski/güncel içerik önerisini, soru ve ses çeşitliliğini açıklar. Eşleşen değişim yalnız aynı yol, aşama ve kaynakta yeterli farklı soru, oturum ve duyulan örnek varsa gösterilir. Bu küçük örneklem bir genel yetenek ölçeği değildir. Çalışılmamış alan zayıflık, etkinlik grafiği öğrenme yüzdesi sayılmaz. PDF dönem kapsamını korur; ayrıntı listesi sınırları kaynak geçmişini silmez.

20 becerinin her birine dinleme ipucu, somut adımlar, kısa çalışma, gerçek bağlam ve yeni örnekle kontrol kılavuzu eklendi. Türkçe kaynaklar önce, yeterli konu eşleşmesi olmadığında İngilizce tamamlayıcılar sunulur; kaynak dili, ücretsiz/ücretli durumu ve doğrulama sınırı ayrı görünür. Kitaplar isteğe bağlıdır. Öneriler eğitim uyumuna göre seçilir; sponsor sıralaması veya affiliate parametresi yoktur. [Kullanım](gelisim-raporu.md), [öğretim/raporlama araştırması](research/gelisim-raporu-arastirmasi.md), [kaynak kayıtları](research/rapor-kaynaklari.json).

Rapor ve PDF yerel kayıtlardan cihazda hazırlanır; hesap veya rapor sunucusu gerektirmez. İlk çevrimiçi kurulum sonrası çevrimdışı kullanım mümkündür; dış kaynaklar ayrı internet erişimi gerektirebilir. Ham ilerleme için JSON yedeği korunur. Fiziksel cihaz, ekran okuyucu, kaynakların öğretim kalitesi ve yeni örnekte öğrenme pilotu devam eder.

## Gelecek ücret ve ortaklık modeli

0.9 raporları ücretsizdir; ödeme, kredi veya reklam sistemi kurulmadı. İlk rapor ücretsiz, yeni dönem değerlendirmesi tek ödeme veya sürekli yeni değer için üyelik seçenekleri pilotla sınanabilir. Aynı raporu yeniden indirme ve başarısız üretimi tekrar deneme hak tüketmemeli. Kayıtları görmek, temel hata açıklaması ve yedek almak ücretli rapora bağımlı olmamalı.

Ücretli değer dönem yorumu, içerik veya açıkça ayrı belirtilen öğretmen desteği olabilir. Gerçek satış için hesap, doğrulanmış ödeme, satın almayı geri yükleme ve şeffaf fiyat/iptal akışı gerekir; tarayıcı sayacı güvenilir hak kaydı değildir. Sponsor ve satış ortaklığı ancak ayrı etiketli alanlarda düşünülür; eğitim odağı ve kaynakların eğitsel sırası ödemeden bağımsız kalır. Ortaklık kabulü ve gelir henüz doğrulanmadı.

## Kullanıcı pilotu

Önce iki dilde derslerin anlaşılmasını, cihazlarda sesin güvenilirliğini, zorluk geçişini ve yanlış yanıttan sonra öğrenmeyi değerlendir. Daha sonra eğitimde duyulmayan kaynaklarda ön test / son test / gecikmeli tekrar uygulanabilir. 0.7 öncesindeki sıralı 10 yanıt / %80 ders önerisi, kişisel akışta beceri bazında başlangıç, yeni örnek kanıtı ve aralıklı tekrar ile genişletildi. Bu kurallar bilimsel doğrulama veya sınav başarısı garantisi değildir.

Gerçek iPhone Safari, Android Chrome, Bluetooth ve kablolu kulaklık, arka plana alma, düşük güç modu, VoiceOver / TalkBack ve farklı işitme profilleriyle manuel test gerekir. İlk teslimattaki Chromium testleri bu matrisin tamamını kapsamaz.

## 0.8 denetimiyle değişenler

Uzun kullanımda kaynak verisini silen sayaç sınırları kaldırıldı. Kayıt kotası, bozuk JSON ve sekme çakışması görünür ve indirilebilir iki kopyayla yönetilir. v1 kayıt v2 alanına taşınır; yeni yedek zarfı sürüm 2’dir. Eski uygulama yeni kaydı budayamaz. Öğretim ve istatistiklerin birbiriyle çelişen eski önerileri birleştirildi. Asgari dinleme, bağımsız yayın önbelleği ve ekran okuyucu alanları düzeltildi.

MSGSÜ Opera ve Müzik teorisi 2026–2027 kaynakları, kurum/program kapsam haritasına eklendi. Bu, iki programın bütün sınavını simüle etmek veya diğer kurumların kapsamını doğrulamak değildir. [Denetim raporu](kalite-denetimi.md) kullanıcı beklentisi, ses, ölçüm, veri ve yayın sınırlarını birlikte açıklar. Fiziksel cihaz ve uzman öğretim pilotu, minör/kromatik içerik, tam dikte, mağaza uygulamaları ve daha geniş lisanslı kayıt kütüphanesi hedefleri devam eder.
