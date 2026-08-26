'use client';

import React from 'react';
import Link from 'next/link';
import { Target, Filter, TrendingDown, Sparkles, CheckCircle2 } from 'lucide-react';

export default function NasilKullanilirPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-slate-800 dark:text-slate-200">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
          Platform Nasıl Çalışır?
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Spor Toto'da matematiksel formüllerle maliyet düşürmenin ve İddaa'da Yapay Zeka ile kazanma şansınızı artırmanın en modern yolu.
        </p>
      </div>

      <div className="space-y-12">
        {/* Nasıl Çalışır */}
        <section className="bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Matematiksel Garanti Sistemi</h2>
          </div>
          <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              Geleneksel oynayış tarzında, seçtiğiniz maçların tüm ihtimallerini kupona yazdığınızda maliyet astronomik rakamlara ulaşır. 
              <strong> Kupon Formülü</strong>, kuponunuzdaki gereksiz ve birbiriyle çakışan kolonları matematiksel algoritmalarla eler.
            </p>
            <ul className="space-y-3 mt-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span><strong>14G (14 Garanti):</strong> Seçtiğiniz maçlar doğru geldiğinde size kesinlikle en az bir adet 14 bilen kolon verir. Maliyeti %80-90 oranında düşürür. Üstelik şansınız yaver giderse 15 bilme ihtimaliniz de her zaman vardır!</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span><strong>13G ve 12G:</strong> Bütçenizi çok daha radikal seviyelerde düşürmek isterseniz, 13 veya 12 garantili formülleri kullanarak minimum bütçeyle maksimum heyecanı yaşayabilirsiniz.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Filtreler */}
        <section className="bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Filter className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gelişmiş Filtreleme Modülleri</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Sadece formül kullanmakla kalmaz, oluşturulan on binlerce kolonu kendi futbol bilginize göre tıraşlayarak bütçenizi daha da aşağı çekebilirsiniz:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Maç Sonucu Filtresi</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">15 maçlık bültende toplam kaç maçın Ev Sahibi (1), Berabere (X) veya Deplasman (2) biteceğini aralık olarak belirleyin.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Oynanma Oranı (Yüzde) Filtresi</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Türkiye genelindeki resmi oynanma yüzdelerine göre kuponunuzun toplam zorluk derecesini (Sürpriz/Favori) belirleyin.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Art Arda Filtresi</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Kuponunuzda arka arkaya en fazla kaç tane "1", "X" veya "2" gelebileceğini kısıtlayarak mantıksız dizilimleri çöpe atın.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Koşul ve Tercih Filtreleri (Yakında)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">"Eğer Fenerbahçe berabere kalırsa, Galatasaray kesin yener" gibi birbirine bağlı mantıksal kurallar oluşturun.</p>
            </div>
          </div>
        </section>

        {/* Neden Biz */}
        <section className="bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Kupon Formülü'nün Avantajları</h2>
          </div>
          <ul className="space-y-4 text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200 block">Kusursuz Bütçe Yönetimi</strong>
                10.000 TL tutacak bir kuponu, matematiksel olarak optimize edip 500 TL'ye oynamanızı sağlar. Tüm parayı tek ihtimale yatırmak yerine riski böler.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200 block">Chrome Eklentisi ile Otomatik Kupon Yatırma</strong>
                Oluşturduğunuz binlerce kolonu tek tek elle girmekle uğraşmazsınız. Özel geliştirdiğimiz <strong>Chrome Eklentimiz</strong> sayesinde, sitemizde hazırladığınız ve elediğiniz formül sonuçlarını tek bir tıkla yasal bayi hesaplarınıza (Nesine, Bilyoner vb.) saniyeler içinde otomatik olarak aktarabilir ve oynayabilirsiniz. 
                <span className="block mt-2 text-sm bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 p-3 rounded-lg border border-sky-100 dark:border-sky-800">
                  📱 <strong>Telefondan Kullanım:</strong> Mobil cihazınızdan kupon yatırmak isterseniz, Android cihazınıza <strong>Kiwi Browser</strong> indirerek bilgisayardaki gibi eklentimizi kurabilir ve otomatik kupon aktarımını telefonda da kullanabilirsiniz!
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200 block">Bulut Tabanlı Kupon Takibi</strong>
                Kuponunuzu profilinize kaydedin, maçlar oynandıkça sistem sizin için otomatik olarak kaç bildiğinizi (15, 14, 13) hesaplasın ve Top 10 listesine girme heyecanını yaşatsın!
              </div>
            </li>
          </ul>
        </section>

        {/* İddaa Yapay Zeka */}
        <section className="bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">İddaa (Yapay Zeka) Nasıl Çalışır?</h2>
          </div>
          <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              İddaa sayfamız sıradan bir istatistik programı değil, <strong>400 bin maçlık devasa iddaa oran arşivine</strong> bağlı çalışan gerçek bir analiz motorudur.
              Sistem, herhangi bir maçın sadece isimlerine veya form durumlarına değil; açılan oranlara (MS1, MSX, MS2) bakarak tarihte benzer oranlardan açılmış on binlerce maçın nasıl sonuçlandığını saniyeler içinde hesaplar.
            </p>
            <ul className="space-y-4 mt-4">
              <li className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block mb-1">Analizi Gör (Akıllı Oran Analizi)</strong>
                  İddaa bültenindeki herhangi bir maçın yanındaki "Analizi Gör" butonuna tıkladığınızda, sistem o maçın sadece MS oranlarını değil; aynı zamanda Alt/Üst ve KG Var/Yok gibi tüm oran dizilimini alır ve 400 bin maçlık devasa veritabanında kendi kategorilerinde ayrı ayrı aratır. Çıkan detaylı sonuç tablosunda, geçmişte aynı oranlarla açılmış maçların yüzde kaçının "1.5 ÜST", "KG VAR" veya "3.5 ALT" bittiğini görebilirsiniz. Ayrıca sistem, tıpkı favoriler sayfasındaki gibi tutma olasılığı <strong>%60'ın üzerinde</strong> ve oranı <strong>1.15 - 1.65</strong> aralığında olan en güvenilir seçeneği en üstte <strong>"Yapay Zeka Önceliği"</strong> olarak vurgular.
                </div>
              </li>
              <li className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block mb-1">Tüm Tahminleri Gör (Yapay Zeka Favorileri)</strong>
                  Sayfanın üst kısmındaki bu menü, o gün oynanacak tüm maçları arka planda tarar. Tutma olasılığı <strong>%60'ın üzerinde</strong> olan ve iddaa oranı <strong>1.15 ile 1.65</strong> aralığında kalan (yani risk barındırmayan ama kupona değer katan) en sağlam "Banko" seçenekleri sizin için listeler.
                </div>
              </li>
              <li className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block mb-1">Yapay Zeka Asistanı</strong>
                  Sitenin sağ alt köşesinde bulunan asistana dilediğiniz bir maçın adını yazıp soru sorabilirsiniz (Örn: <i>"Fenerbahçe maçına ne diyorsun?"</i> veya <i>"Zalgiris maçı canlı kaç kaç?"</i>). Asistan hem size maçın anlık skorunu söyler hem de o maçın oranlarını veritabanına sorarak size özel bir bahis danışmanı gibi yorum ve yüzde sunar.
                </div>
              </li>
              <li className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block mb-1">Kuponları Oluştur</strong>
                  Sistem, bulduğu yüksek ihtimalli bankoları harmanlayarak (içine çeşitli bahis türleri ekleyip riski dağıtarak) size saniyeler içinde oynamaya hazır "Banko Kupon" ve "İdeal Kupon" sunar. Kuponlar önbellekli (cache) çalıştığı için sadece bültendeki maçlar başladıkça yenilenir, böylece kafanız karışmaz.
                </div>
              </li>
            </ul>
          </div>
        </section>

        <div className="pt-4 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/spor-toto" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all transform hover:-translate-y-1">
            Spor Toto Oyna
          </Link>
          <Link href="/iddaa" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 text-white font-black rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all transform hover:-translate-y-1">
            Yapay Zeka Analizleri
          </Link>
        </div>
      </div>
    </div>
  );
}
