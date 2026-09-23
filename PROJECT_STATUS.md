# PROJE DURUM VE HAFIZA RAPORU (PROJECT STATUS)

Bu dosya, projenin mimari kararlarını, kullanıcı tercihlerini ve geliştirilen tüm kritik algoritmaları özetler.

---

## 1. GENEL MİMARİ VE TEKNOLOJİ YIĞINI
- **Framework:** Next.js 16 (App Router, Turbopack, Tailwind CSS, Lucide Icons)
- **Veritabanı:** Supabase PostgreSQL (`iddaa_matches`, `spor_toto_matches`, `profiles`, `iddaa_saved_coupons`)
- **Veri Kaynakları:**
  - **Spor Toto:** Resmi maç listesi ve oynanma yüzdeleri Nesine'den (`st.nesine.com/v2/Program`), maçların gerçek İddaa oranları Maçkolik bülteninden çekilir.
  - **İddaa Bülteni & Canlı:** 7 günlük geniş bülten (`arsiv.mackolik.com`) + Canlı sonuçlar ve canlıda açılan oranlar (`vd.mackolik.com/livedata`).

---

## 2. SPOR TOTO MOTORU (`/spor-toto`)
- **Yasal Kolon Bedeli:** 10 ₺
- **Maksimum Kupon Bütçesi (Önemli Kural):**
  - Nesine / Spor Toto tek kupon kolon tavanı: **2.500 Kolon (25.000 ₺)**.
  - "İddaa Oranlarına Göre Oyna" seçildiğinde `generateSmartIddaaSelections` fonksiyonu kuponu otomatik oluşturur:
    - İlk 5 ağır favori: **Banko (Tek: 1, X veya 2)**
    - En tahmin edilemez / yakın 2 maç: **Kapalı (1-X-2)**
    - Kalan 8 maç: **Çifte Şans**
    - Toplam ham kolon: $\approx 2.304$ Kolon (23.040 ₺) $\le 25.000$ ₺.
  - Bu sayede 14 Garanti formülü 1 saniyede hesaplanır ve kuponu $\approx 30\text{--}45$ kolona (300-450 ₺) optimize eder.
- **Filtreler:**
  - "İddaa Oranlarına Göre Oyna" açıkken alt filtreler kapalı başlar (kullanıcı isterse açar).
  - "Filtreleri Kapat" butonu ile tüm alt filtreler tek tıkla pasife alınabilir.
  - "İddaa Oran Modu" kapalıyken sistem sadece Spor Toto oynanma yüzdelerine göre çalışır.

---

## 3. İDDAA VE CANLI ORAN MOTORU (`/iddaa`)
- **Geniş Bülten + Canlı Akışı:**
  - Maç öncesi bültende olmayıp maç başladığında canlıda oran açılan maçlar anında bültene dahil edilir.
  - Oransız maçlar filtrelenir (bülteni kirletmez).
- **🔴 Canlı Filtresi ve Rozetler:**
  - Tarih filtrelerinin başında `🔴 Canlı` butonu bulunur.
  - Devam eden maçlarda `CANLI` (kırmızı yanıp sönen) rozet, bitmiş maçlarda `MS` rozeti gösterilir.
  - Başlamış/canlı maçlarda da `Analizi Gör` ve `Tüm Oranlar` butonları aktiftir.

---

## 4. VERİTABANI VE YARDIMCI SCRİPTER
- `src/lib/formulaHelper.ts`: Toto algoritmaları ve kombinasyon motoru.
- `src/app/api/fetch-matches/route.ts`: Toto maçları ve oran eşleştirme.
- `src/app/api/fetch-iddaa/route.ts`: 7 günlük İddaa bülteni + Canlı veri çekme.
- `src/app/api/analyze-odds/route.ts`: Geçmiş oran analiz motoru.
- Kök dizindeki scriptler (`check_all_tables.js`, `sync_matches.js`, `sync_gol_analizi.js`, `fix_29.js` vb.): Manuel senkronizasyon araçları.
- `.env.local`: Supabase bağlantı anahtarları.

---

## 5. GOL ANALİZİ MOTORU (`/gol-analizi`)
- **Korelasyon:** `4.5 Üst` oranı ile `Her İki Yarı da 1.5 Üst` oran farkı (Fark $\le 0.20$, Fark $\le 0.10$, Eşit 0.00).
- **Gelecek Bülten:** 7 günlük (`i=0..6`) geniş bülteni dinamik tarar, `DD.MM.YYYY` normalize tarih formatıyla sunar.
- **Geçmiş Biten Maçlar:** Son 3-4 günün tamamlanan maçlarının skor ve ilk yarı istatistikleri doğrulaması (2.5 Üst, 3.5 Üst, 4.5 Üst, 2Y 1.5 Üst, KG Var başarı oranları).
- **Önbellek & Canlılık:** Disk (`data/gol_analizi_cache.json` & `data/gol_analizi_past_cache.json`) ve bellek önbelleği. Eski tarihli önbellek tespiti yapıldığında otomatik canlı bülten yenileme.

