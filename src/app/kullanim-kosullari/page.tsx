'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, Sparkles, Scale, Info, ArrowLeft } from 'lucide-react';

export default function KullanimKosullariPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-slate-800 dark:text-slate-200">
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-sky-500 font-bold text-xs uppercase tracking-wider mb-2">
          <Scale className="w-4 h-4" />
          Yasal Bilgilendirme ve Şartlar
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Kullanım Koşulları & Sorumluluk Reddi
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Son güncellenme tarihi: {new Date().toLocaleDateString('tr-TR')}
        </p>
      </div>

      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        
        {/* 1. Kapsam ve Hizmet Amacı */}
        <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
            <Info className="w-5 h-5" />
            1. Hizmetin Kapsamı ve Platformun Amacı
          </h2>
          <p>
            <strong>Kupon Formülü</strong>, kullanıcılarına hem <strong>Spor Toto</strong> oyunlarında matematiksel formül optimizasyonu (15G, 14G, 13G bütçe düşürme ve filtreleme) hem de <strong>İddaa</strong> bülteninde yer alan maçlara yönelik <strong>400 bin maçlık geçmiş oran arşivi</strong> üzerinden yapay zeka destekli istatistiksel analizler sunan bir veri analiz platformudur.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Platformumuz <strong>kesinlikle bir bahis, kumar veya şans oyunu oynatma sitesi DEĞİLDİR.</strong> Sitemiz üzerinden hiçbir şekilde gerçek parayla bahis kabul edilmez, oyun oynatılmaz, aracılık yapılmaz veya para transferi gerçekleştirilmez. Sitede yer alan tüm araçlar yalnızca karar destek ve istatistiksel inceleme amaçlıdır.
          </p>
        </section>

        {/* 2. İddaa Oran Analizi ve Tahminler Sorumluluk Reddi */}
        <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            2. İddaa Oran Analizi, Yapay Zeka Tahminleri ve Kuponlar
          </h2>
          <p>
            Sitemizde sunulan <em>"Akıllı Oran Analizi"</em>, <em>"Yapay Zeka Favorileri"</em>, <em>"Günün Bankoları"</em>, <em>"Hazır Kuponlar"</em> ve <em>"Yapay Zeka Asistanı"</em> gibi özellikler; geçmişte açılmış 400.000+ maçın oran dizilimleri ve sonuçlarının matematiksel olarak kıyaslanması prensibiyle çalışır.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>
              <strong>İstatistiki Olasılık:</strong> Gösterilen yüzdeler (Örn: %85 2.5 ÜST, %70 MS 1) geçmişte benzer oranlarla oynanmış maçların nasıl sonuçlandığını ifade eder, gelecekteki maçın o şekilde biteceğini garanti etmez.
            </li>
            <li>
              <strong>Tüyo / Şike / Garanti Değildir:</strong> Sistemimiz hiçbir koşulda "şike", "tüyo" veya "kesin kazanma" iddiasında bulunmaz. Spor müsabakaları doğası gereği kırmızı kartlar, hakem kararları, sakatlıklar ve beklenmedik sürpriz sonuçlar barındırır.
            </li>
            <li>
              <strong>Kullanıcı İradesi:</strong> Kullanıcıların sitedeki analizlere dayanarak yasal bahis platformlarında kendi hür iradeleriyle oynadıkları kuponlardan doğabilecek her türlü kazanç veya kayıp tamamen kullanıcının kendi sorumluluğundadır.
            </li>
          </ul>
        </section>

        {/* 3. Önemli Sorumluluk Reddi Uyarısı */}
        <section>
          <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base mb-1">ÖNEMLİ SORUMLULUK REDDİ (DISCLAIMER)</h3>
              <p className="text-sm leading-relaxed">
                Kupon Formülü platformunda paylaşılan formüller, algoritmalar, oran analizleri ve yapay zeka tahminleri <strong>HİÇBİR ŞEKİLDE KESİN KAZANÇ GARANTİSİ VERMEZ.</strong> Şans oyunları ve spor bahisleri maddi kayıp riski içerir. Platformumuz, kullanıcıların site üzerindeki verilere dayanarak alacağı kararlardan, doğrudan veya dolaylı olarak yaşayabileceği maddi/manevi zararlardan hukuki veya cezai olarak sorumlu tutulamaz.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Veri Doğruluğu ve Canlı Kaynaklar */}
        <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            3. Veri Kaynakları ve Güncellik
          </h2>
          <p>
            Bültendeki maç saatleri, takım isimleri ve açılış/canlı oranları resmi ve üçüncü taraf veri sağlayıcıları (Maçkolik, Nesine vb.) üzerinden anlık olarak çekilmektedir. Veri sağlayıcılarından kaynaklı anlık oran dalgalanmaları, oran kapanışları, ertelenen veya iptal edilen maçlardan doğabilecek uyuşmazlıklardan platformumuz sorumlu değildir.
          </p>
        </section>

        {/* 5. 18 Yaş Sınırı ve Sorumlu Oyun */}
        <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400">
            4. 18 Yaş Sınırı ve Sorumlu Oyun Politikası
          </h2>
          <p>
            Platformumuzun içerikleri yalnızca <strong>18 yaşını doldurmuş</strong> ve şans oyunları mevzuatına göre reşit sayılan bireylerin istatistiki incelemesine yöneliktir. Kullanıcıların şans oyunlarını bir gelir kapısı olarak değil, bir eğlence aracı olarak görmesi ve bütçelerini aşmayacak sorumlu oyun ilkelerine uyması tavsiye edilir.
          </p>
        </section>

        {/* 6. Üyelik, Abonelik ve Fikri Mülkiyet */}
        <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400">
            5. Fikri Mülkiyet ve Dijital Paketler
          </h2>
          <p>
            Sitede yer alan tüm yazılım kodları, formül algoritmaları, oran analiz motoru, veritabanı yapıları ve arayüz tasarımları <strong>Kupon Formülü</strong> mülkiyetindedir. İzinsiz kopyalanamaz, çoğaltılamaz, tersine mühendislik uygulanamaz veya ticari amaçla paylaşılamaz. Satın alınan dijital abonelikler kişiye özel olup devredilemez.
          </p>
        </section>

        <div className="pt-6 text-center sm:text-left flex items-center gap-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
