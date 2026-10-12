# Freq 0.11 — araştırmaya dayalı eleştiri ve düzeltmeler

12 Ekim 2026. İncelenen başlangıç: 0.10 önizleme (sekiz aşamalı EQ). Ölçüt: [teknik kulak eğitimi araştırması](research/teknik-kulak-egitimi-arastirmasi.md) ve projenin kendi kalite koşulları ([pazar araştırması](research/pazar-arastirmasi.md), bölüm 11). Arayüz ve kullanım, masaüstünde (1280×800) ve telefonda (375×812) ekranlar tek tek ölçülerek değerlendirildi.

## Açık hüküm

0.10, ne duyulduğunu soran ama duyulanı yaptırmayan bir üründü. Literatürdeki ve rakiplerdeki çekirdek görev olan eşleştirme yoktu; EQ yalnızca çan biçimini tanıyordu; dinamik ve mekân derslerinde aynı iki üç ses dönüyordu. Sorunun adil olup olmadığı hiç denetlenmiyordu. Arayüz özenli görünüyordu ama metnin çoğu okunamayacak kadar küçüktü ve telefonda her tura başlamak için üç ekran kaydırmak gerekiyordu.

0.11 bunların düzeltilebilenlerini düzeltir. Ses malzemesinin kendisi, zorluk eğrisinin kulakla ayarı ve eşik ölçümü hâlâ açıktır; son bölümde nedenleriyle yazılıdır.

## Öğrenme tasarımı

| Eleştiri ve kanıt | Düzeltme |
| --- | --- |
| Yalnızca tanıma görevi vardı. Corey'nin yazılımı, TrainYourEars'ın *Correct* yöntemi ve SoundGym'in EQ Mirror, Balance Memory ve Compressionist oyunları öğrenciye hedefi kendi ayarıyla kurdurur. | Yeni aşama: **EQ'yu eşitle**. B hedef, C öğrencinin kendi ayarıdır. Bant ve miktar değiştikçe C, döngüdeki yerini kaybetmeden yeniden çalar. 8 bant × 6 miktar; yalnızca tam eşleşme doğru sayılır. Hedef hiçbir yerde adlandırılmaz; doğru ayar bulunduğunda C kaybolmaz. |
| EQ yalnızca çan biçimini soruyordu. Raf ve kesen filtre mikste en sık kullanılan hamlelerdir; Harman *How to Listen* alçak ve yüksek geçiren filtreleri ayrı görev olarak içerir. Bant genişliği ve miktar hiç sorulmuyordu. | Yeni aşamalar: **Raflar ve filtreler** (alçak kesen, yüksek kesen, bas rafı, tiz rafı; köşe frekansı değişir) ve **Bant genişliği** (Q 0.5, 1.4, 4). Miktar, eşleştirme aşamasında çalışılır. EQ basamakları 8'den 11'e çıktı. |
| Soru adaleti denetlenmiyordu. Ölçüm: akustik piyano kaynağında 63 Hz oktav bandı tüm sinyalin 19 dB altında; rahat dinleme seviyesinde işitme eşiğinin yalnızca 13 dB üstünde kalıyor. Aynı kaynakta dar 8 kHz bandı da öyle. Yine de soruluyordu. | Her kaynağın üçte bir oktav spektrumu ölçülüp tabloya yazıldı. Bir bant, 70 dB SPL toplam seviye varsayımıyla işitme eşiğinin (ISO 226) en az 18 dB üstünde enerji taşımıyorsa o kaynakta sorulmaz. Ders başında hangi bandın neden sorulmadığı yazılır. Tablo, gerçek seslerden yeniden ölçen bir testle korunur. |
| Frekans çalışmasının referans uyaranı yoktu. Rezonans eşikleri en düşük gürültüde ölçülür; Golden Ears, EarQuiz ve TrainYourEars pembe gürültü sunar. | **Pembe gürültü** kaynağı eklendi: dikişsiz dönen, oktav başına eşit enerjili. EQ ve ses yüksekliği derslerinde seçilir; vuruş ve mekân gerektiren derslerde sunulmaz. |
| Dinamik ve mekân derslerinde örnek sayısı çok azdı: attack ve release 2, kompresyon 2–3, reverb 2–3, delay 2–3 farklı ses. Beş soruluk turda havuzun tamamı duyuluyordu. | Her soru, sorulmayan bir yan koşulu da çeker (eşik, referans süresi, efekt miktarı, kuyruk süresi, tekrar aralığı). Gerçek kayıt kaynağında farklı örnek sayısı: attack ve release 6, kompresyon 4 / 9 / 27, masking 6 / 8 / 8, pan ve genişlik 7, reverb 18 / 9 / 9, delay 6 / 9 / 6. Yanıt seçenekleri aynı kaldı. |
| Kişiselleştirme beceri düzeyinde kalıyordu. Kim ve arkadaşları (2013, 2015) kişinin zayıf yerine yönelen eğitimin daha fazla gelişme sağladığını bildirir. | Kişisel pratik, her soru için dört aday çeker ve öğrencinin kaçırdığı ya da hiç karşılaşmadığı yanıtlara ağırlık verir. Hiçbir yanıt dışlanmaz; bir oturum aynı sesi tekrar etmez. Bütün seçmeli derslerde çalışır. |
| Hangi bantların karıştırıldığı görünmüyordu; yalnızca toplam yüzde vardı. | Becerilerim'de **bant haritası**: oktav bantlarına göre doğruluk, yükseltme ve kesme ayrımı, en zorlanılan bant ve hatanın yönü (daha tiz ya da daha pes seçme). |

## Ses ve ölçüm

| Eleştiri ve kanıt | Düzeltme |
| --- | --- |
| Seviyeler düz RMS ile eşitleniyordu. RMS, tizdeki bir yükseltmeyi algılanan yüksekliğe göre eksik sayar; yükseltilmiş örnek daha yüksek duyulur ve yanıtı ele verir. | Eşitleme ITU-R BS.1770 K ağırlıklı ölçüme geçti (EQ ve bütün ileri miks dersleri). Test: tam ölçekli 997 Hz sinüs −3,01 LKFS okur. Ses yüksekliği dersindeki kasıtlı dB farkları aynen korunur. BS.1770 de algıyı kusursuz karşılamaz; ipucu azalır, yok olmaz. |

## Arayüz

| Eleştiri ve kanıt | Düzeltme |
| --- | --- |
| Yazılar okunamayacak kadar küçüktü. Ölçüm: ana ekranda görünen metnin %64'ü 12 pikselin, %85'i 14 pikselin altındaydı; en küçük yazı 7 pikseldi. | Yazı ölçeği yükseltildi (214 bildirim): en küçük yazı 11 piksel, akan metin 14 piksel ve üstü. Bir tarayıcı testi 11 pikselin altında yazı kalmadığını denetler. |
| Telefonda ana ekranın ilk görünümünü süs grafiği kaplıyordu. İlk düğme 720. pikseldeydi; 812 piksellik ekranda alt menünün arkasında kalıyordu. | Süs grafiği telefonda gizlendi. İlk düğme 523. piksele çıktı ve ilk ekranda görünür. |
| Türkçe arayüzde İngilizce bir etiket vardı ("LISTEN CLOSELY"). | Yerelleştirildi. |
| Ders listesi uzun basamaklara hazır değildi: 10 ve 11. aşamalar "010" ve "011" diye numaralanıyordu; telefonda her satır 194 piksel tutuyordu; öğrencinin hangi aşamada olduğu görünmüyordu. | Numaralar iki haneli. Telefonda satır 155 piksel. Her becerinin önerilen aşaması listede etiketlenir. |
| Becerilerim 20 kartı tek ızgarada, yol ayrımı olmadan gösteriyordu; miks becerileri iki ayrı yere dağılmıştı. | Kartlar yola göre gruplandı; etkin yol en üstte. |
| Telefonda pratik ekranında klavye notu ve yüksek dalga süsü yer kaplıyordu. | Klavye notu dokunmatik cihazda gizlenir; süs 116 pikselden 56 piksele indi. |

## Kullanım

| Eleştiri ve kanıt | Düzeltme |
| --- | --- |
| Geri tuşu uygulamadan çıkarıyordu. Ekran değişimi tarayıcı geçmişine yazılmıyordu; kurulu uygulamada Android geri hareketi uygulamayı kapatırdı. | Her ekran değişimi bir geçmiş kaydı. Geri ve ileri çalışır; yarım pratik korunur. Adres değişmez, yeniden yükleme eskisi gibi kayıtlı ilerlemeye göre açılır. |
| Tura başlamak zahmetliydi. "Hazırım, dinleyelim" düğmesi telefonda 3,1, masaüstünde 1,8 ekran aşağıdaydı ve her turda yeniden kaydırmak gerekiyordu. | Düğme ekranın altına yapışır; ders notları ne kadar uzun olursa olsun görünür kalır. |
| Klavyeyle hızlı çalışma eksikti: bant ızgarasında ok tuşları yoktu, sonraki soruya geçmek için fare gerekiyordu. | Ok tuşları ızgarada gezdirir. Geri bildirim görünürken Enter sonraki soruya geçer. |

## Mühendislik

| Eleştiri ve kanıt | Düzeltme |
| --- | --- |
| Çevrimdışı kurulum, PDF kitaplığının hiç kullanılmayan HTML ve SVG yardımcılarını da indiriyordu (yaklaşık 390 kB). | Önbellek listesinden çıkarıldı: 24 yerine 21 dosya. |
| Biçim denetimi CI'da yoktu; biçimlendirme kendiliğinden bozulabilirdi. | CI, testlerden önce `npm run format:check` çalıştırır. |
| Sorular yeniden kurulduğu için eski yanıtlar artık duyulan sesi anlatmıyor. | Kayıt alanı `freq.progress.v4`, yedek biçimi sürüm 4. Eski alanlar silinmez ama okunmaz; eski yanıtları içeren yedekler açık bir mesajla reddedilir. |

## Düzeltilmeyenler ve nedenleri

1. **Ses malzemesi.** Sentez döngüleri ve 4 saniyelik, 22 kHz mono kayıtlar hâlâ yerinde. Gerçek stem'ler hazırlanıyor ([liste](stem-hazirlama.md)); bu, ürünün en zayıf halkası olmayı sürdürüyor.
2. **Zorluk eğrisi kulakla ayarlanmadı.** dB ve Q değerleri, adalet eşiği (18 dB) ve kişisel seçimin ağırlıkları ürün varsayımıdır. Deneyimli bir kulağın dinleyerek onaylaması gerekir.
3. **Eşik ölçümü yok.** Psikoakustiğin standart yöntemi (iki doğruda zorlaştır, bir yanlışta kolaylaştır) "duyabildiğin en küçük fark kaç dB" sorusunu yanıtlar. Freq her soruyu tohumdan yeniden üretip doğruladığı için, zorluğu önceki yanıtlara bağlamak kayıt biçimini değiştirmeyi gerektirir. Ayrı bir adımdır.
4. **Eşleştirme yalnızca EQ'da.** Kompresyon eşleştirme, kanal dengesi ve çok bantlı EQ sıradaki görev türleridir.
5. **Dersler kullanıcının kendi müziğiyle çalışmıyor.** Laboratuvar çalışıyor ama puansız. Kendi dosyasıyla puanlı pratik, kaydın yeniden üretilebilmesi sorununu çözmeyi gerektirir.
6. **`App.tsx` hâlâ tek dosyada bütün ekranları taşıyor.** Davranışı değiştirmeyen bir yeniden düzenlemedir; başka değişiklikle karışmaması için tek başına yapılmalıdır.
7. **Uygulama kılavuzu 0.9'u anlatıyor.** Miks çalışması bitince bir kerede güncellenecek.
8. **Gerçek cihaz ve insan testi yapılmadı.** Bütün doğrulama masaüstü Chrome'da otomatik testlerle ve telefon boyutunda öykünmeyle yapıldı. Sesin nasıl duyulduğunu hiçbir test söylemez.
