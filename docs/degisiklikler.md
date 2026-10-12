# Sürüm değişiklikleri

## 0.9 önizleme — gelişim ve çalışma raporu (`0.9.0-preview.1`)

- Becerilerim'den gelişim raporu; Bugün ve pratik sonucundan kısa erişim. Yol ve Tüm geçmiş / Son 30 gün / Son 7 gün filtreleri, normal pratik özeti ve son kayıtlı günlerin etkinlik grafiği.
- Yeni soru/ses çeşitliliği, kısmi oturum ve eski ses ayrıntısı olmayan kayıtlar görünür. Başlangıç, hata tekrarı, süreli deneme ve icra öz değerlendirmesi normal pratikten ayrı; aynı yol/aşama/kaynakta yeterli örnek varsa değişim yüzde puanla gösterilir.
- En fazla üç gerekçeli odak, 20 beceride dinleme ipucu ve somut çalışma kılavuzu, esnek yedi günlük plan, yeni örnekle kontrol ve ilgili derse geçiş.
- Türkçe kaynaklar öncelikli, gerektiğinde İngilizce tamamlayıcılar; format/dil/ücret/kontrol tarihi ve erişim sınırları. Ücretsiz kaynaklar ve isteğe bağlı kitap başvuruları; sponsor veya komisyon sıralaması yok.
- İstek üzerine cihazda gerçek PDF indirme; seçilebilir Türkçe/İngilizce metin, sayfa düzeni, kapsam ve tıklanabilir kaynaklar. İlk çevrimiçi kurulumdan sonra çevrimdışı kullanım; başarısız üretimde kayıtları koruyarak yeniden deneme.
- Rapor bu sürümde ücretsizdir. Ödeme, reklam ve satış ortaklığı etkin değildir; ilk ücretsiz rapor/yeni dönem ücret modeli ve sponsor ayrımı ileride değerlendirilecek ürün seçenekleridir.

[Kullanım ve sınırlar](gelisim-raporu.md), [araştırma ve ürün değerlendirmesi](research/gelisim-raporu-arastirmasi.md), [kaynak kataloğu](research/rapor-kaynaklari.json).

## 0.8 önizleme — derin denetim

- Sayıya bağlı geçmiş budaması kaldırıldı. Kota hatasında veri bellekte kalır ve indirilebilir; bozuk orijinal kayıt otomatik olarak değiştirilmez.
- Sekmelerde uyumlu cevaplar birleşir, çakışmada iki kopya korunur. Eski açık uygulama sekmesine karşı ayrı v2 kayıt alanı ve sürüm 2 yedek zarfı eklendi.
- Seviye önerisi gerçek ses çeşitliliğini ve iki seçenekli görevlerde 9/10 eşiğini kullanır. Ses ayrıntısı olmayan eski kayıtlar korunur ama ses çeşitliliği veya artış kanıtı sayılmaz. İleri aşamadaki sürdürülen başarı tanınır, zayıf beceri günlük odağı tekeline almaz.
- Aynı ders/ses hataları tek tekrar kartında birleşir. Genel ve beceri doğruluğu hata tekrarlarından ayrıldı; pratik düğmesi önerilen aşamayı açar.
- A/B döngüsü her varyantta en az bir saniye gerçek ses saati gerektirir. Sonlu ses tamamlanması ve sonraki oynatmanın korunması düzeltildi.
- PWA önbelleği yayın kapsamına ayrıldı; ekran okuyucu alanlarına ayrı adlar verildi.
- Resmî MSGSÜ 2026–2027 Opera/Müzik teorisi kapsam haritaları, açık öğretim sınırları ve 390 yorumluk araştırma indeksi eklendi.

[Ayrıntılı eleştiri/düzeltme](kalite-denetimi.md), [doğrulama](dogrulama.md).

## 0.7 önizleme

- Bugün ekranında kişisel plan; ayrı ve sade çalışma alanında başlangıç değerlendirmesi, pratik ve hata tekrarları. Ses kaynağı ve beceri ayrıntıları açılır bölümlerde.
- Miks 9 beceri / 18 soru, müzik 10 beceri / 20 soru, hazırlık 6 ölçülebilir beceri / 12 soru. İkinci soru ilk yanıta göre ayarlanır; geçici başlangıç önerisi. Tamamlanmayan değerlendirme ve tamamen geçilen beceriler önceki seviyeyi değiştirmez.
- Beceriye göre uyarlama: farklı oturumlarda yeni soru kanıtı, birer aşamalı artış/azalış, gerekçeli öneri. Aynı örneği ezberlemek ve hata tekrarı seviye yükseltmez; hız puanlanmaz.
- Tam ses ayrıntısıyla yanlışlardan tekrar. 10 dakika → 1 / 3 / 7 gün; erken doğru tekrar takvimi ilerletmez, yanlış aynı kartı sıfırlar. Günlük beş soruda en fazla iki zamanı gelen tekrar; kalanlar yeni örnekler.
- Yarım kişisel çalışma, son 100 kişisel sonuç ve tekrar referansları yerel kayıt/yedeğe dahil. İdempotent birleştirme, çelişki kontrolü ve eski yedek uyumu. Genel jüri notları ve başlangıç değerlendirmesi pratik doğruluğundan ayrı.
- Yeni ders yanıtları tüm becerilerde seed/cevap/kaynakla saklanır. Önceki 54 dersin 54.000 sorusu 0.6 ile birebir aynı; mevcut ders ve süreli deneme akışları korunur.

Deneme: **Bugün → Kişisel planı aç**. Yeni alanda TR/EN, mobil, klavye, ses ve çevrimdışı kullanım. [Kişiselleştirme kuralları](research/kisisellestirme-tasarimi.md). Sınav kurumlarının resmî kılavuzlarla eşleştirilmesi ayrı bekleyen iştir.

## 0.6 önizleme

- Sınav atölyesi: Kurum ve kapsam / Hazırlık dersleri / Denemeler sekmeleri. Bu önizlemede yalnız genel Ortak hazırlık profili var; kurum kılavuzları ağ erişimi nedeniyle henüz doğrulanamadı.
- Tek ses/aralık, çok ses, ezgi, ritim, dikte, solfej ve icra için yedi ders ailesi / üçer seviye. Ses örnekleri, Do majör 4/4 porte örneği, mevcut geri bildirimli pratiklere bağlantı, öz değerlendirme ve çalışma notu.
- 6/8/10 soruluk ve dakikalık ortak işitme denemesi. En fazla üç dinleme, tam dinleme koşulu, boş bırakma ve erken bitirme; yanıtlar deneme sonunda açılır. Bu kurallar Freq ayarlarıdır.
- Sayfa kapansa da süren zamanlayıcı; yarım deneme, son 30 sonuç ve 100 prova notu yerel kayıt/JSON yedeğine dahil. Eski yedekler ve 54 pratiğin soruları korunur.
- Sonuçtan soru/yanıt sesi, konum geri bildirimi ve eksik beceriye çalışma bağlantısı. Jüri öz değerlendirmesi işitme doğruluğundan ayrı.

Deneme: Yollar → Sınava hazırlık. [Araştırma engeli ve kalan doğrulama](research/sinav-hazirligi-arastirma-durumu.md). Bu önizleme kurum sınav paketlerinin tamamlandığı anlamına gelmez.

## 0.5

- Tonal merkez, dizi dereceleri, işlevsel işitme, melodik dikte, ritmik dikte ve ritim tekrarı için üçer seviye: 18 yeni pratik. Toplam 54 pratik / 20 beceri; müzik yolu 24 pratik / altı açılır bölüm.
- Majör kadans, değişen tonikler ve aday ses dinleme. Etiketli öğretici örnekler; hedef ve seçilen cevabın sesle karşılaştırması. Sayılar göreli dereceleri gösterir.
- Düzenlenebilir derece ve ritim konumları, taslak dinleme, konum bazında geri bildirim. Tam dizi eşleşmesiyle puanlama; gönderilmeyen taslak çıkınca temizlenir.
- Dokunma/Space ile ses saatine bağlı ritim tekrarı. Açık sayım/örnek/hazırlık/yanıt aşamaları, yeniden deneme ve kullanıcı gönderince puanlama. Sabit ofset, vuruş sayısı ve sapmalar ayrı gösterilir. Mikrofon kullanılmaz.
- Yazılan cevaplar ve tekrar zamanları pratik tamamlandıktan sonra da yerel kayıtta/JSON yedeğinde korunur. Becerilerim son beş müzik yanıtını tekrar çalıştırır; tekrar dinleme puanı değiştirmez. Eski 36 dersin 36.000 sorusu 0.4 ile birebir aynı.
- Türkçe/İngilizce, mobil girişler, otomatik erişilebilirlik ve kök/alt klasör çevrimdışı kullanım; [kaynaklı müzik araştırması](research/muzik-kulagi-arastirmasi.md). Makam/usul uzman içerik aşaması olarak korunur.

Deneme: Yollar → Müzik kulağı → Tonal merkez ve dereceler / İşlevsel işitme / Dikte atölyesi / Ritim tekrarı. Bu bölüm 0.5 teslimatını anlatır. Canlı Pages için yayın workflow’unu yeniden çalıştır.

## 0.4

- Kompresyon, attack, release, masking, stereo, reverb ve delay için üçer seviye: 21 yeni pratik; toplam 36 pratik / 14 beceri. Miks yolu altı açılır bölümde düzenlenir.
- Sorulardan önce tüm etiketli ayarlar dinlenebilir. Soru sırasında ayarlar ve grafik gizlenir; yanıttan sonra doğru ayar, gerçek ses zarfı / crest factor ve stereo korelasyonu açılır. Yanlış yanıtta C seçilen ayarı çalar.
- İki kanallı DSP; A/B/C aynı saatte başlar, ortak RMS eşitleme ve tepe payı kullanır. Mono kontrolü, solo hedef ve stereo kulaklık doğrulaması eklendi. Reverb/delay’de dört saniyelik kuyruk alanı var.
- VSCO 2 CC0 gerçek piyano/vurmalı kayıtlarından iki kısa düzenleme. Yerel WAV’lar, kaynak lisansı, görünür krediler, sabit commit / hash kayıtları ve bakım script’i eklendi.
- Miks laboratuvarında hazır örnek veya kendi mono/stereo dosyası: kompresyon parametreleri, ayrı eşlik EQ, pan/width/polarite, reverb/delay ve işlenmiş WAV indirme. En fazla 20 MiB / ilk sekiz saniye; ses dosyası sunucuya veya yedeğe gitmez, alandan çıkınca yeniden seçilir.
- Yedi yeni becerinin ilerlemesi, kaynak ve yarım oturumu eski yerel kayıt / yedek biçimiyle korunur. Önceki 15 dersin 15.000 sorusu 0.3 ile birebir aynı.
- [İleri miks araştırması](research/ileri-miks-arastirmasi.md), kayıt hakları ve model sınırları belgelendi. Türkçe/İngilizce, mobil ve çevrimdışı akışlar güncellendi.

Deneme: Yollar → Miks ve prodüksiyon; ileri bölüm başlıklarını veya Laboratuvarı aç düğmesini seç. Bu bölüm 0.4 teslimatını anlatır. Canlı Pages yayını için yayın workflow’unu yeniden çalıştır.

## 0.3

- Ses yüksekliği için üç seviye: ±6, ±3 ve ±1 dB veya aynı seviye. Üç kaynak seçilebilir; aynı kaynağın A/B örnekleri aynı ses saatinde çalar. Yalnızca seviye değişir; kasıtlı fark RMS eşitlemesiyle kaldırılmaz. Yanıttan sonra göreli dB farkı gösterilir.
- Ritim ayırt etme için üç seviye: sekizlik bölünme, sus/ters vuruş, onaltılık hareket. 100 BPM'de dört sayım ve bir ölçü. Aynı tempo, ses rengi ve vuruş sayısı; B'de tek vuruş bir alt bölüme kayabilir.
- Ritimde iki örnek de tamamlanmadan yanıt açılamaz. Yarıda kesilen örnek tamamlanmış sayılmaz; tamamlanan örnek işaretlenir. Ritim çizimi öğretici örnekte ve yanıt sonrasında gösterilir.
- Miks ve müzik yolları bölüm başlıkları altında düzenlendi. Her bölümün üç seviyesi var; ana ekrandaki sayılar gerçek içeriği yansıtır. Toplam 15 pratik / yedi beceri.
- Yeni beceriler ayrı ölçülür; ses kaynağı, yarım oturum ve sonuçlar yerel kayıt/yedek akışına dahildir. Önceki EQ öneri sırası ve eski oturumların soru hedefleri korunur.
- Türkçe ve İngilizce ders açıklamaları, geri bildirim ve mobil görünüm güncellendi.

Deneme: Yollar → Miks ve prodüksiyon → Ses yüksekliği; Yollar → Temel müzik kulağı → Ritim. Bu bölüm 0.3 teslimatını anlatır. Pages yayını için yayın workflow'unu yeniden çalıştır.

## 0.2

- EQ dersinin başında üç kaynak seçimi: elektronik groove, ritim ağırlıklı, arpej ağırlıklı. Özgün sentez döngüleri; gerçek kayıt/stem kütüphanesi sonraki aşamada.
- Yanlış yanıttan sonra C örneği: seçilen frekansa hedefle aynı gain/Q uygulanır. A, B ve C aynı zaman çizgisinde, ortalama seviyeleri eşitlenmiş olarak çalar. Klavyeden C ile de karşılaştırılabilir.
- Kaynak seçimi, yarım pratik ve sonuçlarla birlikte kaydedilir. Eski oturumlarda elektronik groove kullanılır; soru hedefleri korunur.
- Profil'den JSON yedeği geri yükleme. Dosya önce doğrulanır, özet gösterilir; kayıtlar birleştirilir, kopyalar tekrar sayılmaz. Çelişen kayıtlar yüklenmez. Dil/ses tercihleri ve cihazdaki farklı yarım pratik korunur.
- 0.1 düz JSON yedekleri ve 0.2 sürümlü yedek biçimi desteklenir. Dosya boyutu sınırı 2 MB, kayıt sınırı 2.000 yanıt / 200 sonuçtur.
- Mobil ders açıklamasındaki yatay taşma giderildi; modal açıkken arka plan gezinmesi ve dinleme kısayolları durur.

Yayın: kaynak kodu GitHub'dan güncelle veya yeni ZIP paketini aç. GitHub Pages kullanılıyorsa yayın workflow'unu yeniden çalıştır. Çevrimdışı uygulamanın eski pencerelerini kapatıp yeniden aç; rutin sürüm güncellemesi mevcut kayıtları korur.

## 0.1

İlk çalışan prototip: Türkçe/İngilizce, üç öğrenme yolu, dokuz seviye, açıklama ve örnek, beş soruluk pratik, yerel kayıt, EQ eğrisi ve çevrimdışı PWA.
