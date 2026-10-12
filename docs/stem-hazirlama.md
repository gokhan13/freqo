# Miks yolu için stem hazırlama listesi

Freq'in miks derslerinde kullanılacak gerçek ses malzemesinin teslim şartları. Hazırlayan: Gökhan. Tarih: 12 Ekim 2026.

Amaç: 4 saniyelik, 22 kHz mono kayıtların yerine tam bantlı, stereo, kanallarına ayrılmış kısa döngüler koymak. EQ ve ses yüksekliği dersleri miksin tamamını, kompresyon/attack/release tek tek kanalları, masking hedef ile eşliği ayrı ayrı, reverb/delay ise kuru kanalları kullanır.

## 1. Kaç parça, hangi tarzlar

En az 3, ideali 6 parça. Birbirinden olabildiğince farklı olsunlar:

1. Canlı davullu pop/rock: akustik davul, bas gitar, gitar, vokal.
2. Elektronik/dans: güçlü kick, sub bas, synth'ler.
3. Hip-hop, trap veya R&B: 808, seyrek düzenleme, vokal.
4. Akustik/balad: piyano ya da gitar ile vokal, geniş dinamik.
5. Yerel enstrümanlı bir parça: bağlama, ud, yaylı, darbuka gibi.
6. Yoğun düzenleme: yaylı/nefesli ya da çok katmanlı synth.

Toplamda en az iki parçada lead vokal, en az birinde gerçek akustik davul, en az birinde güçlü sub bas olsun.

## 2. Hangi bölüm, ne kadar uzun

- Parçanın en dolu bölümü (nakarat ya da drop): bütün enstrümanlar çalıyor olsun.
- 120 BPM ve üstünde tam 8 ölçü, 120 BPM altında tam 4 ölçü. Sonuç 8–16 saniye arasında kalır.
- Dosya tam ölçü başında başlasın, tam ölçü sonunda bitsin. Başta ve sonda boşluk olmasın.
- Tempo sabit olsun (yavaşlama, hızlanma yok); bölüm başa sarınca kesintisiz dönmeli.

## 3. Kanallar

Her parça için aşağıdaki dosyalar. Hepsi aynı noktadan başlar ve örnek hassasiyetinde aynı uzunluktadır.

| Dosya | İçerik | Zorunlu mu |
| --- | --- | --- |
| `drums.wav` | Bütün davul ve perküsyon | Evet |
| `bass.wav` | Bas (sub ve 808 dahil) | Evet |
| `music.wav` | Eşlik: gitarlar, tuşlular, pad'ler, yaylılar, geri vokaller | Evet |
| `lead.wav` | Ana melodi enstrümanı (synth lead, solo gitar, bağlama…) | Varsa |
| `vocal.wav` | Lead vokal | Varsa |
| `mix.wav` | Yukarıdaki stem'lerin toplamı; master kanalı boşken alınmış | Evet |
| `kick.wav`, `snare.wav` | Kick ve trampet ayrı ayrı | İsteğe bağlı |
| `final.wav` | Aynı bölümün senin bitmiş miksin | İsteğe bağlı, çok işe yarar |

`kick` ve `snare` dinamik derslerinde işe yarar: attack ve release en net tek vuruşlu kaynakta duyulur. `final` ise EQ derslerinde ve ileride "ham ile bitmiş" karşılaştırmalarında kullanılır.

## 4. Nasıl mikslenmiş olmalı

Stem'ler balanslı ama az işlenmiş olmalı. Kompresyon, reverb ve delay'i uygulama kendisi ekleyip öğretecek.

**Kalsın:**

- Fader ve pan ayarları. Stem'ler fader sonrası (post-fader) alınsın; toplandıklarında `mix.wav` dosyasını versinler.
- Sesin karakteri olan her şey: amfi/kabin, distortion, saturation, synth'in kendi efektleri, sound design, sample'ın kendi işlemesi.
- Vokal tuning ve de-esser.
- Düzeltici EQ: low-cut, pislik temizliği, kanalın yerine oturması için yaptığın ton ayarı.
- Stilin parçası olan sidechain pompası.

**Kapat:**

- Master kanalındaki her şey: limiter, bus kompresör, EQ, genişletici.
- Kanal ve bus kompresörleri ile limiter'lar; özellikle vokal, bas ve davul bus'ı.
- Bütün reverb ve delay'ler (send ve insert).
- Stereo genişletici ve imager eklentileri.

`final.wav` bu kuralların dışındadır: kendi kompresör, EQ ve efektlerinle, yalnızca master limiter/maximizer kapalı olarak alınır.

**Seviye:**

- `mix.wav` tepe değeri yaklaşık −6 dBFS; −3 dBFS'i geçmesin. Hiçbir dosyada clip olmasın.
- Normalize kapalı. Açık olursa stem'ler arasındaki balans bozulur.
- Dither gerekmez.

## 5. Dosya biçimi

- WAV, 24-bit, stereo (interleaved).
- 48 kHz. Proje 44.1 kHz ise 44.1 kalsın; dönüştürme yapma. Bir parçanın bütün dosyaları aynı örnekleme hızında olsun.
- Bas ya da vokal gibi mono kaynaklar da stereo dosya olarak verilebilir.

## 6. Klasör ve adlandırma

Dosyaları depo klasörünün dışına, şuraya koy (ham WAV'lar git'e girmesin):

```
/Users/gokhan/Downloads/freq-main 5/stems/
  01-kisa-ad/
    drums.wav  bass.wav  music.wav  lead.wav  vocal.wav  mix.wav
    kick.wav  snare.wav  final.wav
    bilgi.txt
  02-kisa-ad/
    ...
```

Klasör adı sıra numarası ve kısa bir addan oluşsun; Türkçe karakter ve boşluk kullanma.

## 7. `bilgi.txt` içeriği

Her parça klasöründe kısa bir metin dosyası:

- Uygulamada görünecek ad (örneğin "Canlı davullu pop").
- Tarz, BPM, ölçü birimi (4/4 gibi), ölçü sayısı, ton.
- Hangi enstrüman hangi stem'de.
- Kredi satırı: kimin adı nasıl görünsün (sen, vokalist, çalanlar).
- Notlar: "kick'te sidechain var", "gitar Haas ile genişletilmiş" gibi.

## 8. Haklar

Uygulama herkese açık yayınlandığında bu ses dosyaları indirilebilir hale gelir. Bu yüzden:

- Beste, düzenleme ve kayıt hakları sende olsun ya da yazılı iznin bulunsun.
- Vokalist ve çalan müzisyenlerden bu kullanım için onay al.
- Hazır loop ve sample paketlerinin lisansına bak. Çoğu, sample'ın tek başına dağıtılmasına izin vermez. Bir stem neredeyse tamamen değiştirilmemiş hazır bir loop'tan oluşuyorsa onu kullanma. Kendi çaldığın ya da programladığın partiler ve sentezlenen sesler sorun çıkarmaz.
- Henüz yayımlanmamış ya da ticari değeri yüksek parçalar yerine bu işe ayırabileceğin malzeme seç.
- Lisansı sen belirlersin. Mevcut kayıtlar CC0; seninkiler için "tüm hakları saklı, Freq içinde kullanım izni" de yazılabilir.

## 9. Gerekmeyenler

Tam şarkı, master'lanmış sürüm, MIDI ve proje dosyası gerekmez.

## 10. Sıra

Önce tek bir parçayı eksiksiz hazırla ve klasöre koy. Biçimi ve seviyeleri kontrol edip uygulamaya bağladıktan sonra diğerlerini aynı şekilde alırsın; böylece bir hata altı parçaya birden yayılmaz.
