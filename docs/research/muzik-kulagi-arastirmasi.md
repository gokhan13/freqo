# Müzik kulağını genişletme: öğretim ve uygulama kararları

İnceleme: **10 Ekim 2026, Europe/Istanbul**. 0.5 kapsamı: tonal merkez, derece, işlevsel işitme, melodik/ritmik dikte ve ritim tekrarı. Önceki [43 ürünlük pazar araştırması](pazar-arastirmasi.md) ve tarihli yorum bulguları temel alındı; bu tur tonal bağlam ve ritmik dikte için erişilebilen resmî açıklamalar ayrıca okundu. Rakiplerin ücretli kursları satın alınmadı, karşılaştırmalı öğrenme deneyi yapılmadı.

## Kaynakların söylediği ve Freq'in kararı

| Referans | Doğrulanan bilgi | 0.5 tasarım kararı |
| --- | --- | --- |
| [Functional Ear Trainer v2](https://www.miles.be/software/functional-ear-trainer-v2/) | Majör/minör tonalitede ses tanıma için öğrenme kursu ve alıştırmalar | Notayı yalnız aralık olarak sormadan önce tonal bağlamı duyur; başlangıç sesi değişsin |
| [FET Advanced, geliştirmesi durdurulmuş sürüm](https://www.miles.be/software/functional-ear-trainer-advanced-discontinued/) | Kadans ardından iki ses ve derece/aralık soruları | Kadans → hedef ses sırasını kullan; bu tarihsel sürüm güncel mobil ürünle karıştırılmasın |
| [teoria: ritmik dikte yardım sayfası](https://www.teoria.com/en/help/exercises/rdp.php) | Duyulan ritmik kalıpları seçerek porteye yazma | Duyduğunu üretme görevini A/B ayırt etmeden ayrı tut; Freq ilk aşamada vuruş/boşluk haritası kullanır |
| [teoria egzersiz kataloğu](https://www.teoria.com/en/exercises/) | Ritmik dikte, dört sesli dikte, armonik analiz ve yürüyüş çalışmaları ayrı konular | Basit arayüz için bağımsız bölümler; kısa başlangıç diktesini tam notasyon eğitimi diye sunma |
| EarMaster, FET, Complete Ear Trainer, Perfect Ear; önceki araştırmadaki resmî sayfa/mağaza ve tarihli yorumlar | Kademe, yönerge, oturum koruma, yanlış yanıtı dinleme ve erişilebilirlik ihtiyaçları; rakiplerde mevcut benzer özellikler | Önce açıklamalı örnek, serbest seviye seçimi, doğru/yanlış ses karşılaştırması, ayrı beceri kaydı ve klavye girişi |

EarMaster'ın güncel özellik sayfası ve TonedEar derece sayfası bu tur 403 döndürdü. Denenen iki eski EarMaster bağlantısı 404 aldı. Bunların güncel içeriği okunmuş sayılmadı; EarMaster ile ilgili kapsam önceki araştırmanın açıkça işaretlenmiş kanıtlarına dayanır. [Erişim, hash ve yönlendirme kayıtları](muzik-kulagi-kaynaklari.json) başarılı/başarısız istekleri ayırır. HTML/JavaScript kabuğundan etkileşimli bir özelliğin davranışı çıkarılmadı. Rakip metinleri, müzikleri veya kodları kopyalanmadı.

## Altı becerinin öğretim sırası

1. **Tonal merkez:** I–IV–V7–I ile majör bağlam; ardından kısa melodi. Kullanıcı üç aday sesi ayrı dinler. Birinci seviyede melodi tonikte biter; ikinci/üçüncü seviyede son nota tonik değildir. Tonik adı yalnız yanıt sonrasında gösterilir. Aday sırası değişir, mutlak perde tahmini gerekmez.
2. **Dereceler:** 1/3/5 → 1–5 → 1–7. Sayılar göreli derecelerdir. “Do her zaman merkezdir” ifadesi kullanılmaz; Türkçedeki sabit nota adlarıyla hareketli solfej birbirine karıştırılmaz. Yanıt sonrası derece → 1 örneği yalnız bir ilişki gösterimidir; tek zorunlu melodik çözülme iddiası yoktur.
3. **İşlev:** I/IV/V → I/ii/V7 ve çevrimler → V7–I / IV–I / V7–vi dönüşleri. Hazırlık akoru ve dominant yalnız kurulan majör bağlamda değerlendirilir. Bas notası = kök, minör = daima aynı işlev veya her V–I = kusursuz otantik kadans gibi yanlış genellemeler yapılmaz.
4. **Melodik dikte:** 3 eşit vuruş ve 1/3/5 → 4 vuruş ve 1–5 → 6 vuruş, yedi derece ve bir sus. İlk nota 1'dir; başlangıç desteği bilinçlidir. Her konum düzenlenebilir; taslak dinlenebilir. Sonrasında hedef ve yazılan derece her konumda gösterilir. Ritim aynı kalır; tek sesli perde sırası çalışılır.
5. **Ritmik dikte:** Bir 4/4 ölçü; dörtlük → sekizlik → onaltılık konumlar. Dolu kutu bir ses başlangıcı, boş kutu ses başlangıcı yokluğu demektir. Nota uzunluğu, bağ ve artikülasyon yazılmaz. Bu harita tam porte/duration transkripsiyonu değildir.
6. **Ritim tekrarı:** Dört sayım → örnek ölçü → dört hazırlık sayımı → kullanıcının ölçüsü. Ekrana dokunma ve Space eşdeğer girişlerdir; mikrofon veya performans sesi kaydı kullanılmaz. Tekrar durdurulabilir, puanlamadan yeniden denenebilir ve ancak Gönder ile değerlendirilir.

Temel yön/aralık/akor ve A/B ritim dersleri korunur. Müzik yolu altı açılır bölüm ve 24 pratik içerir. Toplam içerik 54 pratik / 20 beceridir. Makam/usul bu majör modele ek isimler takılarak üretilmez; seyir, karar/güçlü, bağlama bağlı entonasyon, usul ve icra örnekleri için uzman/icracı ortaklığı gereklidir.

## Ses ve değerlendirme

Tonal kadans, hedef, sayım ve kalıplar örnek saatiyle buffer'a işlenir. Sentez seslerinde kısa attack/release zarfları ani kesikleri azaltır. Çok sık yanlış dokunuşların tekrar sesinde örtüşen klikler 0.72 tepe payına ölçeklenir; zamanları korunur. Normal örnekler sabit kazançta kalır; ses üretimi internetsiz çalışır. Hazır miks kayıtları bu görevlerin perde doğruluğunu ölçmek için kullanılmaz. Yeni görevler eski soru üreticisinin rastgele sayı sırasını değiştirmez.

Dikte cevabı sınırlı ve kanonik bir derece/konum dizisi olarak tutulur. Konum bazında geri bildirim verilse de pratik puanı tam dizi eşleşmesidir; kısmi öğrenme başarısı veya bilimsel yeterlik puanı olarak sunulmaz. Yanlış yanıt tekrar çalınırken aynı kadans, sayım ve tempo korunur. Taslak yalnız ekran belleğindedir; çıkınca temizlenir. Gönderilmiş yanıt ve tekrar zamanları tamamlanan pratikten sonra da yerel soru kaydında/yedekte korunur. Becerilerim son beş müzik yanıtını hedef ve kendi cevabıyla yeniden çalıştırır; son 2.000 yanıt saklama sınırı geçerlidir.

Ritim girişleri `AudioContext.currentTime` ile zamanlanır. Animasyon kareleri yalnız görsel sayacı günceller; sesin ya da kayıt zamanının kaynağı değildir. Vuruş sayısı eşitse beklenen ve çalınan sıralı vuruşlar eşlenir. Farkların medyanı tek sabit ofset olarak en çok ±250 ms dengelenir. Kalan **her** vuruş sapması seviye toleransını (±100 / ±80 / ±65 ms) karşılamalıdır. Ortalama sapma tek başına puanı belirlemez. Eksik/fazla vuruşta ayrıntılı zaman eşleme yapılmaz ve yanıt yanlış olur. Bu eşikler ürün varsayımıdır; uzman ve kullanıcı pilotuyla ayarlanmalıdır.

Bu yöntem sabit küçük çıkış/giriş gecikmelerinin göreli kalıbı bozmasını azaltır. **Donanım gecikmesini ölçmez veya kalibre etmez.** Değişken Bluetooth gecikmesi, tarayıcı ana iş parçacığının duraksaması, işletim sistemi ve ses zamanının nicemlenmesi sınırlardır. Sabit telafi sonrası sapma tablosu ve vuruş sayısı açıkça gösterilir. Fiziksel cihazlarda pilot olmadan profesyonel ölçüm doğruluğu veya sınav yeterliği vaat edilmez.

İptal, sayfadan çıkış, gizleme ve ses bağlamının askıya alınması tamamlanmamış tekrarı puana dönüştürmez. Basılı tutulan Space tekrarları sayılmaz. Dokunmanın pointerdown anı kullanılır; fare bırakma/click süresi ritim ölçüsü değildir. Puanlamaya girecek diziler sayı, aralık, uzunluk ve sıra bakımından doğrulanır; yedek yükleme de aynı değerlendiriciyi kullanır.

## Bundan sonraki içerik ve pilot

Minör/kromatik bağlam, register kontrolü, farklı tınılar, gerçek cümlelerde işlev, daha uzun/çeşitli dikte, nota süreleri/porte, sesle tekrar, kurum formatları ve öğretmen araçları ayrı aşamalardır. Kullanıcı zorlanınca seçeneği azaltan adaptif ara ders henüz yoktur; mevcut üç seviye doğrudan seçilebilir.

Pilot: müzik öğretmeniyle örneklem dinleme ve cevap anahtarı kontrolü; başlangıç kullanıcılarıyla yönerge anlaşılırlığı; iPhone Safari/Android Chrome, kablolu/Bluetooth, VoiceOver/TalkBack; eksik/fazla vuruş ve ritim sapması geri bildirimi. Otomatik testler öğrenme etkisi veya fiziksel ses kalitesi deneyi yerine geçmez. [Doğrulama kaydı](../dogrulama.md).
