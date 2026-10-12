# Freq 0.8 — derin denetim, eleştiri ve düzeltmeler

10 Ekim 2026. İncelenen başlangıç: `bae8843dce42396654851b735e2b281adf729612` (0.7 önizleme). Kapsam: önceki pazar araştırması, ürün akışı, 54 pratik, ses/DSP, müzik ve sınav içeriği, kişiselleştirme, kayıt/yedek, iki dil, mobil erişilebilirlik ve çevrimdışı yayın. Son kontrol sonuçları [doğrulama kaydında](dogrulama.md).

## Açık hüküm

0.7, kullanılabilir ve düzenli bir prototipti; uzun süre güvenle kullanılacak, öğretim etkisi kanıtlanmış bir ürün değildi. Düzenli çalışma, geçmişi otomatik budayarak ilk değerlendirmeyi ve bekleyen hata tekrarlarını silebiliyordu. Aynı sesin farklı rastgele kimlikleri yeni öğrenme kanıtı sayılabiliyor, hata tekrarları genel doğruluğu şişiriyor, farklı ekranlar farklı seviyeler öneriyordu. Bunlar kişiselleştirme vaadini doğrudan zedeliyordu.

Sınav tarafındaki “genel olarak aynı sınavlar” varsayımı da yeterli değildi. Resmî MSGSÜ kılavuzunda Opera'nın ses/icra aşamaları ile Müzik teorisinin yazılı armoni, analiz, kültür ve piyano görevleri belirgin biçimde farklı. Kısa işitme denemesi bunların bütünü olarak sunulamaz. 0.8 iki kaynaklı program haritası ekler; tüm kurum sınavlarını kapsadığı izlenimini düzeltir.

Bu denetimde ürünün ciddi yazılım ve ölçüm kusurları giderildi. Daha fazla test, eğitim başarısını veya tüm cihazlarda kusursuz çalışmayı tek başına kanıtlamaz. Aşağıdaki kalan kapsam ürünün gerçek sınırıdır.

## Kusurlar ve uygulanan düzeltmeler

P0 veri kaybı/koruma, P1 öğrenme ve temel çalışma güvenilirliği, P2 kullanım ve araştırma izlenebilirliği önceliğidir.

| Öncelik | Somut eleştiri / kanıt | 0.8'de yapılan düzeltme |
| --- | --- | --- |
| P0 | 100 kişisel sonuçtan sonra başlangıç değerlendirmesi ve cevapsız hata kayboluyordu. Derslerde 2.000 cevap / 200 sonuç, denemelerde 30 sonuç, provalarda 100 not da sessizce budanıyordu. | Model, okuyucu ve birleştirmeden sayaç budaması kaldırıldı. Ekranlar yakın geçmişi gösteriyor; kaynak kayıt korunuyor. Gerçek tarayıcı kotası aşılırsa görünür uyarı ve bellekten indirme var. |
| P0 | Geçersiz bir kişisel/sınav bölümü okunurken atılabiliyor, otomatik kayıt orijinal verinin üstüne yazabiliyordu. Tutarsız yarım ders kurtarılsa bile bir sonraki yedek yine geçersiz olabiliyordu. | İlk açılış katı doğrulama yapıyor. Orijinal JSON korunuyor, otomatik yazma duruyor. Tutarlı kısmi kurtarma ayrıca doğrulanıyor; eksik cevap uydurulmuyor, çelişen değişmez kayıtların iki kopyası da kurtarma verisinden çıkarılıyor. Kullanıcı orijinali indirebiliyor ve kurtarılmış veriye açıkça geçiyor. |
| P0 | İki sekme birbirinin son kaydını ezebiliyor; iki farklı yarım ders veya deneme birleştirilirken biri sessizce bırakılıyordu. | Depolama olayları ve yazma öncesi değişiklik kontrolü eklendi. Uyumlu kayıtlar birleşiyor. Çakışmada otomatik yazma duruyor; bu sekmenin ve depodaki kaydın indirme eylemleri var. Ayrı iki yarım oturum birleştirmeyi reddediyor. |
| P0 | Sadece yeni sürümde budamayı kaldırmak yetmiyordu: açık bir 0.7 sekmesi aynı depoya eski budama kurallarıyla yazabilirdi. | Yeni kayıt `freq.progress.v2` anahtarında; eski v1 kayıt ilk açılışta okunuyor ve eski kopya korunuyor. Yeni yedek zarfı sürüm 2; eski uygulama bunu desteklemediği sürüm olarak reddeder. |
| P1 | Aynı yanlış ses iki farklı oturumda iki ayrı tekrar kartı üretiyordu. Kuyruk öğrenme ihtiyacı yerine kayıt sayısına göre şişiyordu. | Aynı ders ve duyulan ses tek açık kartta birleşiyor. Eski köken kimlikleri aynı kartın takvimini güncelleyebiliyor. Yeniden yanlış, ortak takvimi sıfırlıyor. Farklı dersin/ölçümün görevi ayrı kalıyor. |
| P1 | Aynı ritim kalıbının on farklı tohumu, on yeni soru sayılıp seviyeyi artırabiliyordu. İki seçenekli görevlerde 8/10 eşiği de fazla kolaydı. | Kimlik tekrarı kontrolüne gerçek ses zaman çizgisi/işlem ayarı çeşitliliği eklendi. Seviye artışındaki on cevap da özgün soru referansı gerektirir; ses detayı olmayan eski kayıtların kimliği ses çeşitliliği yerine sayılmaz. İki ayrı oturumda son on yeni soruda iki seçenekliler için 9 doğru ve en az iki ses; diğerleri için 8 doğru ve en az üç ses gerekir. Eşik ürün politikasıdır, kalibre edilmiş ustalık puanı değildir. |
| P1 | İleri dersi bilinçli seçen kullanıcının sürdürülen güçlü başarısı ilk aşama önerisini değiştirmiyordu. Geçmiş “yükseldi” gerekçesi yeni veride kalabiliyordu. | İleri aşamadaki on yeni soru aynı başarı/çeşitlilik şartlarıyla o aşamayı kanıtlayabiliyor. Gerekçe mevcut kanıta göre yenileniyor; son içerik aşamasında hayalî yeni seviye önerilmiyor. |
| P1 | Zorlanan tek beceri her yeni planda öne çıkarak hiç denenmemiş becerileri dışarıda bırakabiliyordu. | Başka zayıf veya denenmemiş konular varken son bağımsız çalışılan beceri bir sonraki odaktan çıkarılıyor. Zayıf beceri sonraki dönüşlerde kalıyor; tek konuya kilitlenme engelleniyor. |
| P1 | Hata tekrarları genel doğruluk yüzdesini yükseltiyor; beceri düğmesi kişisel öneri ikinci aşama olsa bile ilk dersi açabiliyordu. | Yeni pratik doğruluğu ve hata tekrarı sayısı ayrıldı. Ana ekran, beceri görünümü ve pratik düğmesi aynı seviye önerisini kullanıyor. Başlangıç değerlendirmesi ve icra öz değerlendirmesi bu yüzdeye katılmıyor. |
| P1 | A ve B'ye hemen basmak, ses gerçekten duyulmadan “dinlendi” işaretini açabiliyordu. | Döngü örnekleri her varyant için en az bir saniye gerçek `AudioContext` zamanı gerektiriyor. Anahtar geçişinde zaman çizgisi korunuyor, durdurmada eksik süre siliniyor. Sonlu melodi/ritim örneği hâlâ tamamen bitmeli. Bu, dikkatin gerçekten verildiğini ölçmez. |
| P1 | Bitiş temizliği, tamamlanma geri çağrısında başlatılan yeni sesi durdurabiliyordu. Denetim sırasında bildirim sırasını değiştiren bir düzenleme de yedi sınav/ritim akışında geçici iptal regresyonu oluşturdu. | Tamamlanma bildirimi önce yapılıyor; ardından yalnız aynı oynatma kimliği hâlâ etkinse temizlik yapılıyor. Üç ses yaşam döngüsü testi eklendi; etkilenen yedi tarayıcı akışı tekrar doğrulandı. |
| P1 | Kuruma özel içerik isteği, doğrulanmış kılavuz yerine genel derslerle karşılanmıştı. Kurum/program ve yıl farkı yeterince somut değildi. | MSGSÜ 2026–2027 resmî PDF'i incelendi. Opera ve Müzik teorisi profillerine ayrı aşama/konu haritası, kaynak/sayfa ve eksik kapsam açıklaması eklendi. Prova dersleri seçilen profilin konularına süzülüyor. Kısa denemeler açıkça Freq uyarlaması olarak kalıyor. |
| P2 | Adsız birden çok `aside` ekran okuyucu alanlarını ayırt etmeyi zorlaştırıyor, otomatik erişilebilirlik kontrolünü bozuyordu. Ana ekranda ders ve kişisel çalışma amacı da birbirine benziyordu. | Alanlara ayrı erişilebilir ad verildi. Açıklamalı ders kartı ile günlük kişisel planın amacı netleştirildi. Yeni durumların iki dilde mobil/axe kontrolleri eklendi. |
| P2 | Service worker aktivasyonu tüm `freq-*` önbelleklerini silerek aynı origin'deki diğer alt klasör yayınının çevrimdışı verisini kaldırabiliyordu. | Önbellek adı yayın kapsamını içeriyor; temizlik yalnız kendi kapsamındaki eski sürümleri siliyor. Kök ve `/freq/` aynı tarayıcıda birlikte çevrimdışı doğrulanıyor. Sahibi bilinmeyen eski kapsam dışı önbellekler gelişigüzel silinmiyor. |
| P2 | Pazar raporunun 390 yorumluk girdisi kaynak paketinde denetlenemiyordu; sayım, örneklem ve ürün etkinliği kolayca karıştırılabilirdi. | 14 akışın sayımları ham CSV ile kontrol edildi. Kaynak bağlantısı, tarih, sürüm ve içerik hash'inden oluşan 390 satırlı indeks ile kapsam JSON'u eklendi. Tam yorum metinleri yeniden yayımlanmadı. Sayım, temsili örneklem veya 390 ayrı nitel kodlama iddiası değildir. |

İlk sekiz denetim regresyonu 0.7 üzerinde sekiz kez başarısız oldu. Ek eski-yedek kontrolü de düzeltmeden önce başarısız oldu: ses referansı olmayan on eski doğru cevap, ilk aşamayı ikinci aşamaya yükseltiyordu. Düzeltmeden sonra aynı kontroller geçti; mevcut kontroller kapatılmadı. Kayıt güvenliği ayrı [depolama kancasına](../src/useProgressStorage.ts) alındı; yedek tutarlılığı ve kişisel kanıt kuralları merkezi modellerde kaldı. Sonuç/cevap eşleştirmesinde oturum haritası kullanılarak her sonuç için bütün geçmişi yeniden taramak kaldırıldı.

Somut kontroller: [denetim regresyonları](../tests/unit/audit.test.ts), [ses yaşam döngüsü](../tests/unit/audio-lifecycle.test.ts), [gerçek tarayıcıdaki denetim akışları](../tests/e2e/audit.spec.ts). Eski yedek testinin yükselme beklentisi yeni kanıt kuralına göre değiştirildi; %80 ham doğruluk, cevapların korunması ve hayalî tekrar sesinin üretilmemesi ayrıca doğrulanıyor.

## Miks ve ses: güçlü taraflar, gerçek sınırlar

Mevcut DSP'de rastgele bir yeniden yazımı gerektirecek kanıt bulunmadı. Önceki kontroller gerçek PCM/buffer üzerinden kanal bağlantılı kompresyonu, attack/release davranışını, delay aralığını/feedback'i, reverb kuyruğunu, pan/M-S/mono ilişkisini, A/B/C ortak başlangıcını, RMS eşleştirmeyi ve tepe payını denetliyor. Kayıtların lisans/hash zinciri mevcut. Bu turda bu kontroller yeniden çalıştırıldı; soru üreticisi 0.7'ye karşı 54.000 soruda birebir aynı kaldı.

RMS eşitleme algısal loudness eşitliği değildir. Kompresör zaman sabitleri veya nominal reverb süresi ticari bir plugin'in karakterini kanıtlamaz. Akustik materyal, CC0 tek nota/vuruşlarından oluşturulmuş kısa düzenlemelerdir; geniş ticari şarkı/multitrack kütüphanesi değildir. Öğretimde bir parametreyi yalıtmak faydalı; gerçek mikste aynı anda birden fazla problem ve karar önceliğiyle çalışma henüz yeterli değildir.

Kendi kayıt laboratuvarı puansızdır, ilk sekiz saniyeyi işler ve WAV dışa aktarır. Bunu tam DAW veya öğrenci miksini otomatik değerlendiren öğretmen olarak sunmak yanlış olur. Sonraki içerik yatırımı daha geniş lisanslı kaynak ve daha önce duyulmamış kayıtta gerekçeli müdahale olmalı. [Ses modelleri ve kaynaklar](research/ileri-miks-arastirmasi.md).

## Müzik kulağı: kapsamı büyütmeden çeşitlilik iddiası büyütülemez

Tonal merkez, dereceler, işlevsel işitme, melodik/ritmik dikte ve ritim tekrarı çalışıyor. Nota frekansı, suslar, zaman çizgisi, giriş/cevap kaydı ve puanlama ilişkisi kontrol ediliyor. Fakat majör bağlam, kısa monofonik cümleler ve sınırlı ölçü/kalıp aileleri tüm müzik işitmesini kapsamaz. Özellikle bazı ritim ailelerinde aşama başına dört temel kalıp var. 0.8 aynı kalıbın farklı tohumu ile seviye atlamayı engeller; yeni repertuvar eklediği iddia edilmez.

Eski yön/aralık/majör-minör başlangıç pratikleri tek aşamalıdır. Bunlara aynı sorunun etiketini değiştirerek üç hayalî zorluk seviyesi verilmedi. Minör/kromatik bağlam, uzun ve çok sesli dikte, tam porte/süre girişi, mikrofonla tekrar ve makam/usul henüz yok. Makamı Batı dizisinin yeniden adlandırılmasıyla doldurmak doğru değildir; uzman ve icracı desteği gerekir. [Müzik modeli ve öğretim sınırları](research/muzik-kulagi-arastirmasi.md).

Ritim tekrarı gerçek ses saatine göre ölçülür; sabit cihaz/ofset ile yerel sapmayı ayırır. Mevcut toleranslar bu denetimde gevşetilmedi. Otomatik Chromium girdileri fiziksel dokunma, Bluetooth gecikmesi veya insan icrası pilotunun yerine geçmez.

## Kişiselleştirme: öneri ile yeterlilik ölçümünü ayır

İkişer başlangıç probu, kapsamlı bir seviyelendirme sınavı olamaz. 18/20/12 soruluk yol değerlendirmeleri beceri bazında geçici başlangıç noktası sunar; güvenilirliği öğrenme pilotuyla ölçülmedi. Yeni veri öneriyi değiştirir; yarım veya tamamen boş yeniden değerlendirme önceki öneriyi silmez.

İki seçenekli bağımsız rastgele tahminlerde en az 8/10 başarının olasılığı yaklaşık %5,47, en az 9/10'unki %1,07'dir. Bu fark daha ihtiyatlı ürün eşiğini gerekçelendirir; gerçek kullanıcı davranışının bağımsız tahmin olduğu veya başarının ustalık gösterdiği sonucu çıkmaz. İki oturum ve ses çeşitliliği koşulları da kalibrasyon yerine geçmez. Doğru tekrarın seviye kanıtından ayrılması, aynı örneği hatırlamakla yeni seslerde aktarımı karıştırmayı azaltır.

10 dakika / 1 / 3 / 7 gün politikası basit ve anlaşılır; kullanıcıya özel bellek modeli değildir. 0.8 erken doğru cevabın takvimi ilerletmemesini mevcut son tarih üzerinden hesaplar; yanlış aynı kartı sıfırlar. Uzun kullanım geçmişi artık sayıyla silinmez, fakat yerel tarayıcı kotası ve geçmiş büyüdükçe işlem maliyeti gerçektir. Hesap, bulut senkronizasyonu veya sınırsız saklama eklenmedi. [Kişiselleştirme kuralları](research/kisisellestirme-tasarimi.md).

## Sınav hazırlığı: iki profil, bir kurum, kısmi öğretim

| Resmî MSGSÜ 2026–2027 kapsamı | Freq'te karşılanan kısım | Karşılanmayan önemli kısım |
| --- | --- | --- |
| Opera, kılavuz s. 25–26: işitme; ezberden eser, ses ve icra; eşlikli doğaçlama ve opera kültürü | Perde/melodi/çoklu ses/ritim alıştırmaları, ayrı hazırlık haritası ve söyleme öz değerlendirmesi | Ses ve icra jürisi, gerçek eser repertuvarı, eşlikli doğaçlama, opera kültürü sınaması ve kabul puanı |
| Müzik teorisi, s. 17–19: yazılı kültür/tarih, dikte/armoni/analiz; sözlü tonal takip, teori ve piyano | Dikte, perde/çoklu ses, başlangıç solfeji, programın gerektirdiği görevlerin kaynaklı haritası | Tam armoni/korale-partisyon analizi, modülasyon takibi, tam porte, kültür/tarih sınavı, piyano ve mülakat |

PDF'in bütünü erişildi; hash, yıl, sayfa ve bağlantı [kaynak kaydında](research/sinav-kaynaklari.json). Bu kaydın varlığı programdaki bütün becerilerin uygulandığı anlamına gelmez. Kılavuzun ayrıca bağladığı lisans düzey sınavı örneği incelenmedi. Diğer yedi öncelikli kurumun güncel program/yıl kılavuzları ve müzik öğretmenliği karşılaştırması tamamlanmadı. Hacettepe/İTÜ erişim denemeleri bu turda da 403 verdi; İstanbul Üniversitesi ana sayfasının açılması sınav kılavuzunun incelendiği anlamına gelmez.

6/8/10 dakikalık kısa denemeler, dinleme sınırları ve puan Freq işitme formatıdır. İki yeni profil de mevcut ortak soru ailelerini kullanır; resmî soru sayısı, süre, ağırlık veya eşdeğer kabul notu uydurulmadı. Gerçek kurum denemesi için kaynak örnekler ve eğitimci/jüri denetimi gerekir. [Ayrıntılı araştırma durumu](research/sinav-hazirligi-arastirma-durumu.md).

## Pazar araştırması ve ürün dili

43 ürünlük karşılaştırma, özellik ve tasarım araştırmasıdır; bütün rakiplerin ücretli sürümlerinin bağımsız kullanım testi değildir. Seçili yorumlarda geçen zorluk sıçraması, yetersiz geri bildirim ve kayıt sorunları incelendi; her rakibin güncel sürümünde aynı eksik var sonucu çıkarılamaz. EarMaster/Auralia'nın uyarlaması, diğer miks araçlarının gelişmiş pratikleri zaten var. Freq'in katkısı, Türkçe/İngilizce ve ayrı ama tutarlı yollarla bu ihtiyaçları bir araya getirmesi olabilir; ilk kez icat edilmiş adaptasyon gibi pazarlanmamalı.

390 yorumun tam metinleri önceki çalışma arşivinde bulunuyor; GitHub kaynak paketine yalnız sayım/kapsam ve bağlantı/hash indeksi girdi. Seçili akış, zaman ve kullanıcı yanlılığı var; bu araştırma öğrenme etkisi veya pazar payı ölçmez. [Pazar raporu](research/pazar-arastirmasi.md), [yorum kapsamı](research/yorum-kapsami.json), [yorum indeksi](research/yorum-kayit-indeksi.csv).

## Yayın ve deneme gerçeği

Web ve mobil tarayıcı/PWA mevcut; App Store/Google Play native uygulamaları hazır değil. Chromium mobil emülasyonu 320/390 px taşma ve etkileşim için anlamlıdır; fiziksel Safari/Android veya VoiceOver/TalkBack testi değildir. Axe kontrolleri tüm erişilebilirlik ihtiyaçlarını kapsamaz.

Kaynak kodunu GitHub'a göndermek canlı Pages sitesini yayımlamaz. Pages iş akışı ayrıca manuel çalıştırılmalı. Hazır web paketi HTTPS/statik sunucuda denenir; `index.html` dosyasını doğrudan açmak ses/önbellek yayınına eşdeğer değildir. İlk çevrimiçi önbellek kurulumundan sonra çevrimdışı çalışma doğrulandı. Depolama çatışmasında iki kopya indirilmeli; eski sürümlerde zaten silinmiş veri uygulama tarafından yeniden üretilemez.

## Bundan sonraki doğru öncelik

1. Eğitimciyle küçük pilot: iki dilde yönerge anlaşılması, örnek/yanıt doğruluğu, başlangıç önerisi ve seviyeler arası geçiş. Eğitimde duyulmamış materyalle ön test, son test ve gecikmeli aktarım kontrolü.
2. Fiziksel cihaz matrisi: iPhone Safari, Android Chrome, kablolu/Bluetooth, arka plan ve düşük güç, VoiceOver/TalkBack. Yerel kayıt/yedek kurtarmasını da bu cihazlarda dene.
3. İçerik çeşitliliği: daha geniş lisanslı gerçek kayıtlar, bir arada miks sorunları, minör/kromatik ve uzun dikte; mevcut dar kalıplarla “sonsuz içerik” iddiası kurma.
4. Kurum paketleri: program/yıl kaynak örnekleri, gerçek görev ve ağırlıklar, öğretmen/jüriyle doğrulama. Sonra native mağaza paketleri ve hesap/senkronizasyon gibi ayrı ürün yatırımları.

Bu sıralama, yeni özellik sayısını artırmaktan önce mevcut eğitimin insan üzerindeki sonucunu ölçmeyi amaçlar. 0.8 teknik güvenilirliği ve dürüst kapsamı iyileştirir; eğitim pilotu tamamlanmış sayılmaz.
