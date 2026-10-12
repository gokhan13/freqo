# Gelişim ekranı ve kişisel çalışma raporu: araştırma ve ürün kararı

İnceleme: **12 Ekim 2026, Europe/Istanbul**. Freq'in mevcut [kişiselleştirme tasarımı](kisisellestirme-tasarimi.md), `personal-model.ts` kayıtları ve önceki [pazar araştırması](pazar-arastirmasi.md) incelendi. Bu turda resmî ürün belgeleri ile ders yazarlarının Ankara Üniversitesi'nde yayımladığı öğretim materyalleri ayrıca okundu. Erişim tarihi, istek adresi, yönlendirme, yanıt ve SHA-256 değerleri [kaynak kayıtlarında](report-research-kaynak-kayitlari.json) tutuldu. Ücretli hesap, satış ortaklığı başvurusu veya satın alma yapılmadı.

**Öneri:** Kullanıcıya çalışma kaydını anlaşılır biçimde gösteren bir gelişim ekranı ve istediğinde indirebildiği rapor sunulsun. Raporun asıl değeri, “son kayıtlarda ne oldu → bugün ne yapabilirim → bunu yeni örnekle nasıl kontrol ederim?” zinciri olsun. Az sayıdaki uygulama sorusundan müzikal yetenek, işitme sağlığı, gerçek miks kalitesi veya sınav kazanma olasılığı çıkarılmasın. PDF üretimi ve ölçümlerin öğretim etkisi ayrı konulardır.

## Kaynakların doğruladığı bilgi ve Freq'e etkisi

| Kaynak / erişim | Okunan bulgu | Uygulama kararı ve sınır |
| --- | --- | --- |
| [Ankara Üniversitesi, ARP208 Öğrenme Psikolojisi](https://acikders.ankara.edu.tr/course/view.php?id=4570), Eylem Gökçe Türk; [Uzun Süreli Bellek II](https://acikders.ankara.edu.tr/mod/resource/view.php?id=63657), 200 | Slayt 41 kendi sözlerinle yeniden üretmeyi; 43 geri bildirimin performansı geliştirmek için ne yapılacağını göstermesini; 44–45 aralıklı tekrarı; 54 kendini izleme, tekrar ve öğrenmede derinliği anlatıyor | “Yanlış yaptın” ifadesine duyulacak ipucu ve uygulanabilir bir işlem ekle. Aynı hata kartına dönüş ile yeni örnekte başarıyı ayır. Ders sunumu Freq'in etkililik deneyi veya kişiye özel tekrar takviminin doğrulaması değildir |
| [Ankara Üniversitesi, BÖZ205 Öğretim Tasarımı](https://acikders.ankara.edu.tr/course/view.php?id=6456), Deniz Atal; [tasarımlama](https://acikders.ankara.edu.tr/mod/resource/view.php?id=97670) ve [değerlendirme](https://acikders.ankara.edu.tr/mod/resource/view.php?id=97674), 200 | Amaç, içerik ve değerlendirmeyi ilişkilendirme; değerlendirmede anlaşılabilirlik, yapılabilirlik ve doğruluk; sınav içeriğinin hedefle ilişkisi ve sonuçların tutarlılığı | Her öneriye amaç, eylem ve kontrol ekle. Açık ürün eşiğini bilimsel yeterlik sınırı gibi sunma. Uzman içerik incelemesi ve tekrarlanabilir değerlendirme ayrı gerekliliklerdir |
| [Ankara Üniversitesi, PSİ331 Psikometri I](https://acikders.ankara.edu.tr/course/view.php?id=9576), Ergül Demir; [Ünite 5/1](https://acikders.ankara.edu.tr/mod/resource/view.php?id=149288), 200 | Slayt 4 ölçüm ile değerlendirmeyi; 5 gözlenen gösterge ile örtük özelliği; 12–13 mutlak ölçüt ile gruba göre değerlendirmeyi ayırıyor | Doğru yanıt sayısı bir gözlem; “ileri çalışmaya hazır” bir ürün yorumu. Norm grubu olmadan yüzdelik dilim, yaş/ülke karşılaştırması veya yetenek sıralaması üretme |
| [EarMaster öğretmen kılavuzu](https://www.earmaster.com/support/earmaster-cloud/guides-for-teachers.html), 200 | Tarih, çalışma kitabı ve ders filtreleri; tekil denemelerin ayrıntısı; yazdırılabilir HTML ve CSV dışa aktarımı. Ders puanı en iyi tamamlanan denemeye, modül puanı bu en iyi puanların ortalamasına dayanıyor | Tarih ve beceri kapsamını dışa aktarılan raporda koru. “En iyi deneme” bir rekor olarak gösterilebilir; öğrenme eğrisinin yerine konmamalı. Raporlama piyasada mevcut; yalnız PDF özgünlük veya öğrenme üstünlüğü değildir |
| [EarMaster Cloud](https://www.earmaster.com/products/ear-training-sight-singing/earmaster-cloud-edition.html), 200 | Öğrenci sonuçları, ödevler, öğretmen araçları ve kurum lisansı; sonuç/istatistik yazdırma veya CSV. Sayfanın kısa fiyat özeti ile ayrıntılı fiyat tablosunda farklı tutarlar var | İleride öğretmene anlaşılır beceri raporu sunmak mümkün bir ürün yönüdür. İncelenen sayfa güncel ödeme ekranı veya bağımsız öğrenme sonucu sayılmaz; bu tutarsızlıktan fiyat kararı çıkarılmadı |
| [musictheory.net egzersizleri](https://www.musictheory.net/exercises), 200 | Web egzersizlerinin ücretsiz olduğunu açıkça belirtiyor; aralık/akor/dizi işitme ve öğretmen için özelleştirilmiş kalıcı bağlantı araçları var | Öneri içinde gerçek bir ücretsiz alternatif bulunsun. Nota tanıma ile işitsel tanıma hedefleri karıştırılmasın |
| [iZotope, Parametric EQ: What it is and how to use one](https://www.izotope.com/community/blog/parametric-eq), Chris Wainwright, 1 Ekim 2026; 200 | Frekans, gain ve Q; filtre tipi/eğim; işlenmiş–işlenmemiş ses örnekleri; solo kayıttan sonra miks içinde dinleme | EQ odak önerisinde tek parametreyi karşılaştır, sonra başka kayıt ve miks bağlamıyla kontrol et. Yazı ürün tanıtımı içerir. Örnekteki 725 Hz, 168 Hz veya dB değerleri bütün kayıtlara reçete değildir; sesler bu araştırmada kulaklıkla test edilmedi |
| [Functional Ear Trainer v2](https://www.miles.be/software/functional-ear-trainer-v2/), 11 Ağustos 2019; 200 | Majör/minör bağlamda ses tanıma kursu ve özelleştirilebilir pratik; Türkçe dahil diller. Desktop sürümün güncel AIR ile çalışmadığını, eski AIR33 gerektirdiğini bildiriyor | Derece/tonik önerisini tonal bağlamla kur. Eski masaüstü sürümü güncel, sorunsuz kurulan seçenek gibi önerme; yayıncının etkililik ifadesi bağımsız araştırma sonucu değildir |
| [Harman How to Listen](https://harmanhowtolisten.blogspot.com/), Sean Olive, 3 Nisan 2011; 200 | Ses ürünü araştırması için tını, uzam ve dinamik bozulmaları ayırt etme; performansa göre güçlük; ücretsiz beta; destek verilemediği açıklaması | Kontrollü dinleme becerisi ile profesyonel miks üretmeyi ayrı hedefler olarak anlat. Tarihsel beta güncel cihaz uyumluluğu veya öğrenme garantisi değildir |
| [EarMaster satış ortaklığı](https://www.earmaster.com/community/become-an-affiliate.html), 200 | Sayfa abonelik satışında %30 komisyon, 60 günlük çerez, aylıkta ilk altı ay / yıllıkta ilk ödeme, 30 günlük bekleme ve PayPal ödeme anlatıyor | Sektörde doğrulanmış bir ortaklık örneği var. Freq için kabul, Türkiye'de ödeme uygulanabilirliği, sözleşme, iade etkisi ve gelir doğrulanmış değil. Sayfadaki şartlar gelecekte değişebilir |

Üniversite materyalleri, öğretim ilkelerini açıklayan ders kaynaklarıdır; hakemli müzik eğitimi deneylerinin sistematik taraması yapılmadı. Ders yazarının resmî materyali ve yayıncının ürün açıklaması, Freq için öğrenme etkisi veya psikometrik kalibrasyon kanıtı değildir. Üniversite platformu materyallerini CC BY-NC-SA 4.0 olarak tanımlar; burada kaynaklara bağlantı ve kısa değerlendirme sunulur. Ücretli PDF içine sunum, sayfa kopyası, örnek ses veya video aktarılmaz.

## Hangi veriden hangi sonuç çıkarılabilir?

Mevcut kişisel model iki başlangıç sorusuyla geçici aşama önerir. Yeni sorularda aşama artırma kuralı on soru, en az iki oturum ve duyulan örnek çeşitliliği ister; iki seçenekli görevlerde 9/10, diğerlerinde 8/10 kullanır. Hata tekrarları ayrı tutulur. Bunlar **Freq ürün kurallarıdır**; standartlaştırılmış test, zekâ/yetenek puanı veya gerçek sınav geçme ölçütü değildir. Başlangıç önerisi raporda iki sorunun sonucuyla görünür olmalı; gelişim verisi gibi toplanmamalı.

| Rapor öğesi | Dürüst sunum | Kaçınılacak yorum |
| --- | --- | --- |
| Çalışma miktarı | Seçili tarihte yeni sorular, tekrar yanıtları, çalışılan günler ve oturumlar ayrı sayılır | Oturumun açık kaldığı süre = etkin çalışma süresi; seri/streak = öğrenme |
| Beceri doğruluğu | “EQ / aşama 1: 6 doğru, 4 yanlış; 10 yeni soru”. Kapsam, dönem ve örnek sayısı görünür | “Miks becerin %60”, bütün becerilerin tek yetenek yüzdesi |
| Hata tekrarı | Zamanı gelen kart, çalışılan kart, doğru tekrar ve yeni örnekte sonuç ayrı | Aynı sorunun hatırlanması = başka kayıtta aktarım veya kalıcı ustalık |
| Çalışılmamış beceri | “Henüz çalışılmadı” ve ilk açıklamalı ders bağlantısı | Verisi olmayan beceri = %0, zayıflık veya kırmızı alarm |
| Küçük örneklem | “Üç yeni soru; ilk gözlem. Kesin odak sıralaması için veri az” | 1/1 = güçlü beceri; 0/1 = kesin zayıflık |
| Geçilen soru | Ayrı “geçildi” sayısı; yanıtlanmış sorulardan hesaplanan pratik doğruluğu | Kullanıcının boş bıraktığı pratiği yanlış cevapla aynı yorumlamak |
| Eski kayıt | Doğru/yanlış geçmişi gösterilir; eksik özgün soru/ses kaynağı açıklanır | Kayıt olmayan sesi, seçenekleri, hata nedenini veya çeşitliliği yeniden uydurmak |
| Kısmi oturum | Kabul edilmiş cevaplar gösterilebilir; oturum “devam ediyor / erken bitti” olarak işaretlenir | Sonuca ulaşmamış görevi tamamlanmış sınav diye sunmak |
| Sınav hazırlığı | Uygulamanın kapsadığı beceriler ve güncel kurum kaynağı ayrı | Pratik puanı = jüri, çalgı/şan performansı veya kabul olasılığı |

Boş veride bile PDF üretilebilir: çalışılan alanlar, mevcut veri sınırı, güvenli başlangıç planı ve kaynaklar bulunur. “Bütün alanlar zayıf” metni veya boş yüzde grafiği üretilmez. Başlangıç raporu eğitim planı olarak adlandırılır; gelişim karşılaştırması için ikinci bir dönem gerekir.

Ham geçmiş tüm pratikleri saklayabilir; karşılaştırma ise aynı sorunun tekrarlarını bağımsız kanıt saymamalı. Soru kimliği, duyulan örnek ve ses kaynağı bu yüzden önemlidir. Bir yedek ikinci kez içe alındığında aynı çalışma iki kez sayılmamalı. Aynı duyulan ritmi farklı rastgele kimlikle üretmek, ses havuzunu büyütmez.

## Gelişimi zaman içinde göstermek

Son 7/30 gündeki çalışma miktarı ve günlük hareket grafiği **etkinliği** gösterir. Öğrenme eğrisi ise aynı beceri, aynı aşama, aynı görev/cevap biçimi ve karşılaştırılabilir ses koşullarında yeni soruların sonucudur. Bütün dersleri tek yüzde çizgisinde birleştirmek güçlük değişimini gizler. Örneğin ilk aşamada 9/10, sonraki aşamada 6/10, daha zor içerikle çalışırken beklenebilir; otomatik olarak gerileme değildir.

İlk sürüm için iki ayrı tablo yeterlidir: dönem bazında etkinlik ve beceri bazında karşılaştırılabilir kayıt. Her nokta veya dönem kendi soru sayısını ve aşamasını göstermeli. Örnek sayısı küçükse sonuç aynen gösterilip “sınırlı gözlem” denmeli; trend sıfatı eklenmemeli. Hiç çalışma yapılmayan gün %0 başarı olarak çizilmez. Azalan çalışma sayısı “becerini kaybettin” anlamına gelmez.

Karşılaştırma için başlangıç ürünü kuralı olarak her dönemde en az 10 yeni soru ve iki oturum düşünülebilir; bu bir istatistiksel anlamlılık veya güvenirlik garantisi değildir. Hata tekrarları, yerleştirme ve kolay seviyeye dönüş ayrı satırlarla izlenir. Karşılaştırılabilir koşul yoksa rapor mevcut kayıtları açıklar ve “karşılaştırma için henüz eşleşen veri yok” der. Başarı değişimi **yüzde puan** olarak verilir: %50 → %70 = 20 yüzde puan. “%40 daha yetenekli” yorumu yapılmaz.

Gelecek pilotta kısa, eşdeğer fakat daha önce duyulmamış değerlendirme setleri; başka tını/kayıtta aktarım ve aradan zaman geçtikten sonra hatırlama ayrı ölçülebilir. Soruların ve puanlama kurallarının sürümü saklanmalı; algoritma değişikliği sessizce gelişim gibi görünmemeli. Cihaz/kulaklık farkı, ritim toleransı ve dar örnek havuzu yorumun kapsamını sınırlar. Hız ve yeniden dinleme sayısı yetenek puanına eklenmez.

## Geri bildirim ve uygulanabilir çalışma planı

Rapor en çok iki veya üç odak seçsin. Her odakta gözlem, duyulacak ipucu, küçük bir eylem, tekrar ve yeni örnekle kontrol yer alsın. Öncelik mevcut kişisel planla tutarlı olsun; veri yokluğu düşük başarıdan ayrı gösterilsin. Önceki oturumda aynı beceriye çok yüklenilmişse başka bir uygun alan seçilebilsin. Kullanıcı önerinin gerekçesini okuyabilsin ve başka derse geçebilsin.

Örnek metin: “Attack aşama 1'de son 10 yeni sorunun 4'ü doğru. Sesin başlangıcındaki darbe ile sonraki gövdeyi ayrı dinle. Açıklamalı iki örneği karşılaştır; bugün beş yeni soru çalış. Zamanı gelen hata kartına daha sonra dön. Sonraki oturumda başka bir kaynakla dene.” Kaydın gösterdiği **sonuç** belirtilebilir; yanlışın nedeni ölçülmediyse “kulaklığın kötü”, “dikkatin dağınık” veya “transiyenti duyamıyorsun” tanısı konulmaz.

| Odak | Somut teknik | Yeni örnekle kontrol ve sınır |
| --- | --- | --- |
| EQ / frekans | Referans ile işlenmiş sesi sırayla dinle. Önce değişimin daha dolgun/parlak/ince hissini tarif et; sonra frekans bölgesi seç. Laboratuvarda yalnız frekans, sonra Q veya gain değiştir | Aynı kaydı ezberlemekten sonra farklı hazır kayıtla dene. iZotope yazısındaki “önce/sonra ve miks bağlamı” yaklaşımı uygun; tek frekans değeri bütün enstrümanlara uygulanmaz |
| Loudness / kompresyon | Ses düzeyi ile dinamik hareketi ayrı çalış. Kompresyon, attack ve release derslerini aynı anda bütün parametreleri değiştirerek çözme | Hedef ipucunu yeni kayıtla anlat. Daha yüksek sesi otomatik “daha iyi miks” sayma |
| Attack / release | Attack için ilk darbe ve devam eden gövde; release için darbe sonrasındaki toparlanma ve iki darbe arasındaki hareketi karşılaştır | Farklı kaynak ve tempoda tekrar dene. Sabit örnekte başarı gerçek miks kararını bütünüyle ölçmez |
| Masking / stereo / reverb / delay | Tek ipucu seç: çakışan bölge, merkez–kenar ilişkisi, kuyruk veya tekrar. A/B/C geri bildiriminde seçtiğin cevapla hedefi dinle; farkı bir cümleyle açıkla | Başka kaynak kullan; stereo için kulaklık ayrımını doğrula. İşlem tercihleri sanatsal bağlama da bağlıdır |
| Tonik / derece / işlev | Önce kadansı dinle ve merkezi sabitle. Hedef sesi tonal bağlamla ilişkilendir; yanıt sonrası hedef ve kendi seçimini karşılaştır. Rahatsa melodiyi sesle/çalgıyla yeniden üret | Başlangıç sesi değişsin; aynı mutlak nota adını ezberlemekle göreli dereceyi karıştırma. Freq sesle yeniden üretmeyi otomatik değerlendirmiyorsa bu etkinlik puana dönüştürülmez |
| Aralık / akor | Önce az sayıda kontrast örneği öğren; sesleri karşılaştır ve farkı açıkla. Teoriyi işitme egzersiziyle eşleştir | Yeni kök/register ile dene. Tek başına aralık tanıma, tonal müzikte derece/işlev işitmeyle aynı hedef değildir |
| Melodik dikte | Kısa diziyi önce merkeze göre dinle; küçük parçalar hâlinde yaz, sonra bütünü karşılaştır. Hata yerini hedef ve kendi cevabında bul | Yeni ezgiyle tekrar et. Mevcut kısa, eşit vuruşlu görev tam transkripsiyon veya deşifre yeterliği değildir |
| Ritmik dikte / tekrar | Sabit vuruşu say; alt bölümü kur; önce kısa kalıbı yaz veya vur. Yanıt sonrası eksik/fazla vuruş ve zaman farkını ayrı incele | Başka kalıpla ve uygun cihazla dene. Vuruş başlangıcı haritası nota süresi/bağ yazımının tamamı değildir; cihaz gecikmesi yorumda görünür olmalı |
| Sınava hazırlık | Okulun güncel kılavuzuyla görev kapsamını eşleştir. Otomatik alıştırmanın yanına solfej/çalgı/şan için öğretmen gözlemi koy | Gerçek jüri formatı, süre ve insan değerlendirmesiyle deneme ayrı gerekir. Kılavuzdan Freq puanına kabul tahmini türetilmez |

Beş yeni soruluk kısa oturum ve mevcut hata kartı takvimi başlanabilir bir rutin sunar. “Günde tam 10 dakika”, 10 dakika–1/3/7 gün veya belirli bir kitapla kesin başarı vaat edilmez. Aralıklı çalışmanın genel öğretim ilkesi, her kullanıcı için bu sabit aralıkların en iyi olduğu anlamına gelmez. Kullanıcı hangi adımda zorlandığını belirtirse sonraki rapor açıklama ihtiyacını da gösterebilir; öz beyan otomatik başarı kanıtı olmaz.

## Kaynak önerisi nasıl seçilmeli?

Odak başına bir uygulanabilir ücretsiz kaynak ve ihtiyaç varsa bir kitap yeterlidir. Önce beceri/alt hedef ve düzey uyumu, ardından erişim, dil, örneklerin bulunması ve güncellik dikkate alınır. Başlık, yazar/yayıncı, format, dil, ücret/ücretsiz kapsam, kaynak adresi ve neden önerildiği görünür olmalı. Bağlantının açılması, kitabın bütünüyle okunması veya videonun pedagojik kalitesinin denenmesi gibi sunulmaz.

Kitap için satın alma bağlantısının yanında kütüphane/örnek bölüm seçeneği araştırılabilir. “PDF” kelimesi kitabın ücretsiz/yasal dağıtıldığı anlamına gelmez. Ücretsiz video varsa resmi ders sayfasına bağlanmak uygundur; yalnız YouTube kanal adıyla konuya özgü bir videonun içeriği ve erişimi doğrulanmış sayılmaz. Eski yazılım, ücretli ürünün ücretsiz demosu ve ücretsiz tam kaynak ayrı etiketlenmeli. Kitap/video kataloğunun ayrı erişim kayıtları [rapor-kaynaklari.json](rapor-kaynaklari.json) içindedir; bu belgenin kaynak kayıtları yalnız burada gerçekten incelenen sayfaları kapsar.

Kaynak sıralamasına sponsor ücreti veya satış komisyonu eklenmez. Kullanıcı öğrenme hedefine uyan ücretsiz kaynağı görebilmeli. Yeni kaynaklar için uzman kısa kalite incelemesi ve tarihli link kontrolü yapılabilir; “kişiye önerildi” ifadesi algoritmik eşleştirmeyi anlatır, uzman tarafından kişisel eğitim tanısı yapıldığı izlenimini vermez.

## Talep üzerine PDF'nin içeriği

1. Rapor tarihi, seçilen dönem/yol, kullanılan kayıtların kapsamı ve veri yeterliliği.
2. Çalışma miktarı; beceri bazında yeni soru sonuçları; hata tekrarları ayrı.
3. Karşılaştırılabilir önceki dönem varsa küçük bir tablo; yoksa eksik olan veri.
4. En fazla üç odak, her birinin gerekçesi, çalışma tekniği ve kontrol adımı.
5. Odakla eşleşen kaynaklar, tarihli bağlantılar ve ücretsiz kapsam.
6. Kısa ölçüm sınırı ve isteğe bağlı öğretmenle paylaşım için kullanıcı kontrolü.

Kullanıcı raporu istediğinde üretmek yeterlidir. Otomatik e-posta, öğretmene gönderim veya buluta veri aktarımı ayrı opt-in gerektiren gelecek işlerdir. Yerel rapor için kullanıcı adına e-posta toplamak gerekmez. Rapor dışa aktarımı, ham çalışma yedeğinin yerine geçmez; ham yedek birleştirme/kurtarma işlevi korunmalı.

PDF'de Türkçe karakterler, seçilebilir metin, düzgün satır/sayfa bölünmesi, okunaklı tablo ve çalışan bağlantılar doğrulanmalı. Sadece renk üzerinden başarı bilgisi verilmemeli. HTML rapor da okunabilir olmalı; PDF'nin açılması tek başına erişilebilir olduğu anlamına gelmez. Yazdırma penceresiyle “PDF olarak kaydet” ve doğrudan PDF dosyası indirme kullanıcıya doğru adla sunulmalı.

## Ücretsiz giriş, ücretli rapor ve ortaklık seçenekleri

İlk aşamada raporun ücretsiz çalışması, anlaşılırlık ve yeniden kullanımın gözlenmesini sağlar. “İlk rapor ücretsiz, sonraki rapor ücretli” bir gelecek seçeneğidir; uygulanmış ödeme veya garanti edilmiş gelir olarak sunulmamalı. Aynı yerel kayıtların yeniden PDF'ye çevrilmesi için sık ödeme istemek, kullanıcıya yeni değer sağladığı doğrulanmadan zayıf bir teklif olur.

Ücretli teklifin daha somut adayları: birkaç dönemi karşılaştıran gelişim değerlendirmesi, öğretmenle yorumlanan çalışma planı, daha geniş içerik, düzenli takip ve güvenilir hesap/yedekleme. İnsan tarafından verilen hizmet ile otomatik rapor ayrı fiyatlanmalı. Kullanıcı kendi verisini görebilmeli ve dışa aktarabilmeli; düşük başarı nedeniyle temel hata açıklaması satın almaya bağlanmamalı.

| Model | Test edilecek değer | Uygulama önkoşulu |
| --- | --- | --- |
| İlk rapor ücretsiz, yeni dönem raporu tek ödeme | Kullanıcının sonraki dönemde yeni bilgi ve eylem planına ödeme isteği | Fiyat/vergi/kapsamı önceden göster; aynı raporu yeniden indirmek hak tüketmesin; hatalı/eksik üretim ücret tüketmesin |
| Üyelik | Sürekli yeni içerik, dönem takibi, senkronizasyon veya öğretmen iş akışı | Yenileme/iptal, satın almayı geri yükleme, hesap ve veri hakları; PDF dosya uzantısının ötesinde düzenli değer |
| Öğretmen/kurum lisansı | Öğretmenin ödev ve beceri inceleme süresini azaltma | Kullanıcı izni, erişim rolleri, öğrenci verilerinin görünürlüğü ve sınıf kapsamı; EarMaster örneği bu pazarın varlığını gösterir |
| Sponsorlu alan | İlgili topluluğa şeffaf tanıtım; örneğin eğitim bursu veya indirim | Sponsor için ayrı bölüm ve görünür “Sponsorlu / Reklam” etiketi; rapor sonucu ve eğitim kaynakları sıralaması bağımsız |
| Satış ortaklığı | Uygun bir ek araç/kitabı isteyen kullanıcı için isteğe bağlı bağlantı | Her bağlantı yanında komisyon açıklaması; ücretsiz alternatif; program kabulü, ödeme, iade ve şartların teyidi |

Yerel tarayıcı sayacı ödeme yetkisi değildir: silinebilir, farklı cihazlarda tutarsızlaşır ve satın almayı geri yükleyemez. Gerçek “ilk ücretsiz rapor” hakkı uygulanacaksa hesap, doğrulanmış ödeme ve sunucu tarafında hak kaydı gerekir. Rapora yalnız önizleme koyup henüz kurulmamış bir sistemi “satın al” diye çalışır göstermemek gerekir. Bu belgeyle ödeme servisi, fiyat veya ortaklık kurulmuş olmaz.

Gelir bir deneme hipotezidir. Basit rapor modeli: **aktif kullanıcı × rapor isteyen oran × ücretliye geçen oran × net ücret**, ardından ödeme maliyeti, içerik/uzman emeği, destek ve iadeler düşülür. Örneğin 1.000 aktif kullanıcı × %10 rapor isteği × %20 satın alma = 20 satış; oranlar yalnız hesap örneğidir, tahmin veya araştırma bulgusu değildir. Affiliate geliri de uygun tıklama, kabul edilmiş dönüşüm, komisyon kapsamı ve iadeye bağlıdır. EarMaster'ın duyurduğu %30, kullanıcıların %30'unun satın alacağı anlamına gelmez.

Sponsorun, düşük puanı “bu ürünü almazsan düzelmez” mesajına çevirmesine izin verilmemeli. Eğitim odakları mevcut çalışma kaydından; kaynakların eğitsel sırası hedef uyumundan; reklam yerleşimi ayrı iş kuralından çıkmalı. Sponsor logoları sonuç tablosuna veya “uzman onayı” rozetine dönüşmemeli. Kullanıcı çalışma verisi sponsorla paylaşılmaz; böyle bir gelecek kullanım için ayrı ve açık izin gerekir.

## Yayın ve pilot kararları

Önce kullanıcıların rapordan **doğru bir çalışma eylemi çıkarıp çıkaramadığı** test edilmeli. Başlangıç, orta düzey miks ve sınav hazırlığı kullanıcıları ile eğitmenler; boş veri, az veri, aşama değişimi, eski yedek ve tekrar ağırlıklı geçmiş örneklerini incelemeli. Kullanıcı raporda gözlemi, öneriyi ve ölçüm sınırını birbirinden ayırabilmeli. Yanlış yorum sayısı ve rapordan seçilen sonraki ders, indirme sayısından daha öğretici ürün göstergeleridir.

Teknik kontrol ayrı yapılır: ekran/PDF sayıları eşleşiyor mu, aynı yedek çift sayılıyor mu, geçilen/tekrar soruları ayrılıyor mu, seçili tarih/yol korunuyor mu, geleceğe tarihli kayıt dışarıda mı, Türkçe glyph ve uzun kaynak URL'leri taşmadan çıkıyor mu? Bir testin geçmesi öğrenme etkisi sonucu değildir.

Öğrenme iddiası için farklı ve daha kapsamlı pilot gerekir: uygun başlangıç ölçümü, yeni/eşdeğer son ölçüm, aradan zaman geçtikten sonra kontrol, farklı kaynakta aktarım, cihaz koşulları ve ayrılan katılımcıların raporlanması. Bir ön–son artışın yalnız Freq'ten kaynaklandığını söylemek için karşılaştırma tasarımı gerekir. Ücret modelinde ise tekrar kullanım, fiyat algısı, iptal/iade ve destek maliyeti gözlenir. Eğitimde iyileşme, satın alma oranıyla ölçülmez.

## Erişim ve kapsam sınırları

Başlangıçta denenen eski EarMaster özellik/cloud/affiliate adresleri ile eski iZotope `/en/learn/` yazı adresleri 404 verdi. Ana sayfadaki bağlantılar üzerinden bulunan güncel EarMaster belgeleri ve iZotope `/community/blog/parametric-eq` okundu; hatalı adresler başarılı kaynak sayılmadı. Hacettepe açık ders ana sayfası 503 döndürdü. Google istekleri 200 olsa da JavaScript/yeniden deneme kabuğu geldi; Bing sonucu ilgili akademik çalışma sağlamadı. Bu sonuçlar akademik kaynak bulunmadığı anlamına gelmez ve içerik kanıtı sayılmadı.

Mevcut izinli ağ hedefleri ve devralınan proxy/CA kullanıldı; ağ ayarı veya izin listesi değiştirilmedi. Doğrulanmayan yayıncı alanları, video oynatma, kitapların tümü, ücretli alanlar ve Türkiye'ye özel ödeme/hukuk uygulaması bu araştırmanın dışında kaldı. Önceki pazar araştırmasındaki fiyat ve yorumlar yeni erişim gibi gösterilmedi. Bu tur bir klinik/psikometrik tanı veya kalibre edilmiş öğrenme etkisi iddiası üretmez.
