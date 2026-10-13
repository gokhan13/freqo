# Freq 0.12 — dış eleştirinin değerlendirmesi ve düzeltmeler

12 Ekim 2026. İncelenen başlangıç: 0.11 önizleme. Kaynak: 0.11 üzerine yazılmış 48 maddelik eleştiri. Her madde kodda ya da gerçek tarayıcıda yeniden üretilmeye çalışıldı; aşağıda her biri için varılan hüküm ve yapılan iş yazılıdır. "Ertelendi" denen maddelerde eleştiri haklı bulunmuş, ama düzeltme bu turun dışında bırakılmıştır; nedeni yanında yazar.

## Özet

- 48 maddenin 30'u düzeltildi, 7'si kısmen düzeltildi, 11'i ertelendi. Haksız bulunan madde yok.
- En ağır üç sorun veriyle ilgiliydi (1–3): güncelleme geçmişi açıklamasız görünmez kılıyordu, eski yedekler yanlış seslere yanıt gibi kabul edilebiliyordu, sıfırlama görünmeyen eski kayıtları yedeksiz siliyordu. Üçü de kökten değiştirildi.
- Ertelenenlerin çoğu müzik ve sınav yollarına aittir; karar gereği bu yollar şimdilik olduğu gibi kalıyor.

## Veri ve güncelleme

| # | Eleştiri | Hüküm | Yapılan |
| --- | --- | --- | --- |
| 1 | Güncelleme, geçmişi açıklama yapmadan görünmez kılıyor | Haklı, kritik | Toptan sıfırlama kaldırıldı. Her dersin bir içerik sürümü var; güncellemede yalnızca yeniden kurulan derslerin yanıtları kayıttan ayrılır, geri kalan her şey (müzik, sınav, tercihler, yarım oturumlar) taşınır. İlk açılışta kaç yanıtın neden ayrıldığını söyleyen bir bildirim çıkar. Kaydın özgün hali tarayıcıda arşivlenir ve Profil'den indirilebilir. Arşiv yazılamazsa kayıt değiştirilmez, kullanıcıya sorulur |
| 2 | Eski yedekler, başka seslere verilmiş yanıtları kabul ediyor | Haklı, kritik | Yedekler içerik sürümleriyle damgalanır (biçim 5). Eski yedekte yeniden kurulan derslerin yanıtları doğrulamadan önce ayrılır; yedek tümden reddedilmez. İçe alma penceresi kaç yanıtın alınmadığını söyler |
| 3 | Sıfırlama, yedek düğmesinin kapsamadığı eski kayıtları da siliyor | Haklı, kritik | Sıfırlama yalnızca güncel ilerlemeyi siler. Eski sürüm arşivleri ayrı bir kutudadır; kendi indirme ve (onaylı) silme düğmeleri vardır |
| 44 | Uzun dönemde kayıt ve hesap kırılgan | Kısmen düzeltildi | Soru üretimi ve ders araması önbelleğe alındı; 5.000 yanıtta plan, rapor ve beceri tahmini süreleri belirgin düştü (ölçümler [doğrulama](dogrulama.md) kaydında). Ses düzeyi ya da dil değişince plan yeniden hesaplanmıyor. Yedek sınırı tarayıcı alanıyla uyumlu 5 MiB. Kaydın tek bir `localStorage` anahtarında durması değişmedi: IndexedDB'ye geçiş ayrı ve riskli bir adımdır |
| 45 | Yedek birleştirme çakışması fazla geniş | Haklı | Yedek geri yüklenirken bu cihazdaki yarım oturum korunur; yedekteki farklı yarım oturum "yarıda bırakıldı" olarak geçmişe eklenir. Tamamlanmış geçmiş artık yarım oturum yüzünden bloke olmaz. Pencere bunu önceden söyler |

## Ölçme ve değerlendirme

| # | Eleştiri | Hüküm | Yapılan |
| --- | --- | --- | --- |
| 4 | Bant haritası yanlış teşhis koyuyor (frekans doğru, yön ters → "bant %0") | Haklı | Harita yeniden yazıldı ve "EQ profili" oldu. Bir yanıtın parçaları ayrı sayılır: bölge, biçim, frekans, yön, miktar, bant genişliği. Bant, yön ya da miktar ne olursa olsun bulunduysa bulunmuş sayılır. Eleştirideki senaryo birim testidir |
| 5 | Haritanın dili kanıttan güçlü ("genellikle") | Haklı | En zayıf bant ancak toplam 20 frekans yanıtı, o bantta 8 yanıt ve genel orana göre 15 puan fark varsa adlandırılır. Yön eğilimi ancak o bantta 5 kaçırma ve bunların %80'i aynı yöndeyse söylenir. "Genellikle" kaldırıldı; sayılar yazılır. 5 yanıtın altında yüzde gösterilmez |
| 16 | EQ'nun farklı becerileri tek seviye numarasına sıkışmış | Kısmen | Numara artık "ders sırasındaki yer" olarak adlandırılıyor ve kart, EQ kulağının tek ölçüsü olmadığını söylüyor; parçalar EQ profilinde ayrı. Her boyut için ayrı seviye tutmak kişiselleştirme modelini değiştirir: ertelendi |
| 17 | Çok farklı görevlerde aynı kaba eşikler; iki oturum aynı gün olabilir | Kısmen | Geçiş eşiği artık şans oranına bağlı: iki seçenekli görevde 10'da 9, beş ve üstü seçenekte 10'da 7, diğerlerinde 10'da 8. İki oturumun ayrı günlerde olması şartı eklenmedi: tek günde yoğun çalışan birini bekletmenin doğru olup olmadığı veriyle görülmeli |
| 21 | Gelişim karşılaştırması, uyarlamalı soru dağılımından etkileniyor | Haklı | Pencerelerden biri kişisel pratik içeriyorsa karşılaştırma yanıt bazında dengelenir: yalnızca iki pencerede de sorulan yanıtlar, eşit ağırlıkla. Örtüşme %60'ın altındaysa rakam verilmez ve nedeni yazılır |
| 22 | Beceri kartındaki büyük yüzde rapordan daha gevşek | Haklı | Kart yalnızca önerilen aşamanın son yanıtlarını sayar, sayıyı yanında gösterir, 5 yanıtın altında yüzde vermez |
| 41 | Görsel ağırlık büyük sayılardan yana | Kısmen | Az veride yüzde gizlenir, yüzdenin yanında doğru/toplam yazar, EQ profilinde "henüz az yanıt" görünür. Genel tipografi hiyerarşisi değişmedi |

## Soru adaleti ve içerik

| # | Eleştiri | Hüküm | Yapılan |
| --- | --- | --- | --- |
| 11 | Masking'de hedef melodi doğru yanıtın frekansıyla süzülüyor; tek dinleme yanıtı ele veriyor | Haklı | Melodi artık yanıttan bağımsız, süzülmeden çalar |
| 12 | Komşu bant sorusunda seçenek penceresi tahmini %20 yerine %24,95'e çıkarıyor | Haklı | Önce pencere çekilir, sonra hedef pencerenin içinden eşit olasılıkla seçilir. Hedefin konumu artık bilgi taşımaz; dağılım birim testidir |
| 13 | Duyulabilirlik denetimi (70 dB SPL varsayımı) adaleti garanti etmez | Haklı | Mekanizma aynı, iddia düzeltildi: bu bir "enerji ön denetimi"dir, açıkça yanıtlanamaz soruları ayıklar. Kulaklık, işitme, oda ve komşu bantların maskelemesi kapsamında değildir. Kod ve belgelerdeki "adil soru garantisi" dili kaldırıldı |
| 14 | EQ başlangıç değerlendirmesi yalnızca ilk iki aşamayı yokluyor | Haklı | Yoklamalar merdivene yayıldı: ilk soru 4. aşamadan, doğruysa ikincisi 7. aşamadan gelir |
| 15 | Değerlendirmeyi tekrarlamak ileri kullanıcıyı geri gönderiyor | Haklı | Yeniden değerlendirme zaman çizgisinde bir olaydır: seviyeyi yükseltebilir, düşüremez; önceki pratik yok sayılmaz |
| 18 | Kişiselleştirme hatanın nedenini kullanmıyor | Kısmen | Seçim artık hangi yanlış yanıtın verildiğini (karıştırma) ve hatanın ne kadar yeni olduğunu kullanıyor. Hatanın türünü (yön mü, miktar mı, frekans mı) seçime bağlamak 16. maddeyle birlikte ertelendi |
| 26 | En ileri eşleştirme alanı dar (48 ayar) | Haklı, ertelendi | Q'lu ve çok bantlı eşleştirme sıradaki görev türleridir. Dersin kapsamını olduğundan geniş gösteren metin düzeltildi |
| 27 | İleri kompresyon çoğunlukla sınıflandırma | Haklı, ertelendi | Kompresyon eşleştirme ayrı bir görev türüdür; sıradaki iş |
| 36 | Bir EQ cümlesi matematiksel olarak yanlış ("tam bir oktav") | Haklı | Düzeltildi |
| 37 | Bazı miks tercihleri evrensel kural gibi yazılmış | Haklı | Raf/filtre, kesme ve küçük hamle metinleri "çoğu zaman", "sık kullanılan" düzeyine çekildi |

## Arayüz ve kullanım

| # | Eleştiri | Hüküm | Yapılan |
| --- | --- | --- | --- |
| 6 | Eşleştirmede ikinci soruda seçili ayar kalıyor ama C kayboluyor | Haklı (hata) | Yanıt denetimi her soruda sıfırdan kurulur: seçim de C de temiz başlar |
| 7 | Rapor modülü yüklenemezse bütün uygulama boş kalıyor | Haklı | Rapor bir hata sınırının içinde. Yüklenemezse açıklama, "Yeniden dene" ve "Becerilerime dön" görünür; menü çalışmaya devam eder. Tarayıcı, indirilemeyen bir modülü sayfa yaşadığı sürece yeniden istemediği için "Yeniden dene" sayfayı yeniler ve doğrudan rapora döner |
| 8 | Tablette (768×1024) menü düğmelerinin erişilebilir adı yok | Haklı | Düğmelere ad eklendi; tarayıcı testi 768 pikselde denetler |
| 9 | Telefonda Profil yatay taşıyor | Haklı | Izgara çocukları daralabilir hale getirildi, taşmanın kaynağı olan süs kaldırıldı. Gerçek tarayıcıda 320 ve 390 pikselde ölçüldü: taşma yok |
| 10 | Tek harfli kısayollar her yerde etkin (WCAG 2.1.4) | Haklı | Profil'de "Klavye kısayolları" anahtarı. Kapalıyken A/B/C, rakamlar ve boşluk çalışmaz; Tab, Enter ve ok tuşları çalışır |
| 38 | İlk kullanımda çok fazla seçenek | Haklı | Kaydı olmayan kullanıcıya tek kart gösterilir: ilk ders ve tek düğme. Deneyimliler için kişisel plan bağlantısı ikincildir; sıfırlarla dolu istatistik kartı gizlenir |
| 39 | Gezinme içerikle büyümemiş (11 aşamalı liste, 5.400 piksellik Becerilerim) | Haklı | Becerilerim'de yalnızca etkin yol açık gelir, diğer yollar kapalı başlıklardır. Beşten uzun ders merdivenlerinin başında önerilen aşamaya giden bir kısayol vardır |
| 40 | Telefonda dinleme ve yanıt alanları birbirinden uzak | Haklı | Süs dalga biçimi kaldırıldı, dinleme uyarısı iki ses dinlenince kaybolur. Oynatıcı görünümden çıkınca A/B/C ve dinle düğmelerini taşıyan sabit bir çubuk belirir |
| 42 | Süs dalga biçimi bilgi taşımıyor ve yanıltıyor | Haklı | Kaldırıldı. Yerinde gerçek durum yazar: Durdu, Hazırlanıyor, Çalıyor ve çalan ses |
| 43 | "Çalışma ritmin" grafiği günler arasındaki boşluğu gizliyor | Haklı | Kayıtlı günler arasındaki boş gün sayısı sütunların arasına yazılır |
| 46 | Çevrimdışı ve güncelleme durumları görünmez | Haklı | Profil, çevrimdışı kopyanın durumunu söyler (indiriliyor, hazır, kurulamadı, yeni sürüm bekliyor) ve yeni sürüme hemen geçme düğmesi sunar; geçişte açık bütün Freq sekmeleri birlikte yenilenir. Üst çubuk çevrimdışıyken ve yeni sürüm hazırken bunu gösterir |

## Rapor ve laboratuvar

| # | Eleştiri | Hüküm | Yapılan |
| --- | --- | --- | --- |
| 23 | Rapordaki yöntem ve kaynaklar aşamaya göre fazla genel | Kısmen | Odak kartı artık önerilen aşamanın adını, o aşamanın dinleme talimatını ve ipucunu en üstte verir; genel yöntemin genel olduğu yazılır. Kaynak listesi hâlâ beceri düzeyindedir |
| 24 | "Kişisel plana git" önerinin bağlamını kaybediyor | Haklı | Düğme önerinin ait olduğu yolun planını açar ve "Tüm yollar" süzgecinde yolun adını üzerinde taşır |
| 25 | Yedi günlük plan sabit şablon | Haklı, ertelendi | Planın 6. günü laboratuvarı ilgili araçla, 7. günü doğru yolun planıyla açar. Planın kendisini kişiye göre kurmak ayrı bir tasarım işidir |
| 28 | EQ odaklı rapor, EQ aracı olmayan laboratuvara yolluyor | Haklı | Laboratuvara parametrik EQ eklendi: çan, raflar, kesen filtreler; frekans, miktar, Q ve yanıt eğrisi. Derslerle aynı filtre matematiğini kullanır. Rapor laboratuvarı önerilen beceriye uyan araçla açar |
| 29 | Laboratuvarda sürgü değişince ses kesiliyor | Haklı | Ayar değişince döngü kesilmeden yeni ayara geçer |
| 30 | Kendi kaydında yalnızca ilk 8 saniye kullanılabiliyor | Haklı | 8 saniyelik bölümün başlangıcı bir sürgüyle seçilir; eşlik kaydı aynı noktadan yüklenir |
| 31 | Laboratuvar, yapılan düşünsel çalışmayı saklamıyor | Haklı, ertelendi | Not ve ayar kaydı ilerleme biçimine yeni bir alan gerektirir; ne saklanacağı önce kullanılarak görülmeli |

## Müzik ve sınav yolları

Karar gereği bu yollar şimdilik olduğu gibi kalıyor. Aşağıdaki maddeler haklı bulundu ve ertelendi.

| # | Eleştiri | Not |
| --- | --- | --- |
| 19 | Melodik dikte puanlaması ve kişiselleştirmesi fazla bütüncül | Nota bazında puanlama ve hata türüne göre seçim gerekir |
| 20 | Hata kartının tamamlanması kalıcı beceriyi göstermiyor | 18. maddedeki karıştırma takibi bir adım; kartların kapanma ölçütü yeniden düşünülmeli |
| 32 | Kurum ve program seçimi deneme içeriğini değiştirmiyor | Kapsam haritası doğru, deneme ortak; arayüz bunu söylüyor ama seçim beklenti yaratıyor |
| 33 | Sınavın üretim görevleri yalnızca öz değerlendirme | Otomatik perde ve ritim puanlaması ayrı bir projedir |
| 34 | Müzik müfredatının tavanı düşük | Yol derinleştirme kararı miksten yana |
| 35 | Ritim tekrarı, yerleştirme hatasını cihaz gecikmesinden ayıramıyor | Bir kalibrasyon adımı gerekir |

## Süreç

| # | Eleştiri | Hüküm | Yapılan |
| --- | --- | --- | --- |
| 47 | Yayın tarayıcı testlerine bağlı değil; gerçek cihaz ve pilot yok | Kısmen | GitHub Pages yayını artık biçim denetimi, birim testleri ve tarayıcı testleri geçmeden yapılmaz. Gerçek cihaz ve insan testi hâlâ yok |
| 48 | Kullanıcı belgeleri geride (kılavuz 0.9'da) | Haklı, ertelendi | Kılavuz, gerçek stem'ler eklendiğinde miks yolu bir kez daha değişeceği için o zaman tek seferde güncellenecek |

## Açık kalanlar

1. Ses malzemesi hâlâ sentez döngüleri ve kısa mono kayıtlar; gerçek stem'ler hazırlanıyor ([liste](stem-hazirlama.md)).
2. Zorluk eğrisi, enerji ön denetiminin eşiği ve kişisel seçimin ağırlıkları kulakla onaylanmadı.
3. Eşik ölçümü (uyarlamalı merdiven) yok.
4. Eşleştirme yalnızca tek bantlı EQ'da.
5. Her EQ boyutu için ayrı seviye ve hata türüne göre soru seçimi yok.
6. Kayıt tek bir `localStorage` anahtarında.
7. Gerçek telefonlarda ve gerçek kullanıcılarla test yapılmadı.
