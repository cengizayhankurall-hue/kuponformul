'use client';

import React from 'react';
import Link from 'next/link';

export default function KvkkPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-slate-800 dark:text-slate-200">
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Kişisel Verilerin Korunması</h1>
        <p className="text-slate-500 dark:text-slate-400">Son güncellenme tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
      </div>

      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-3">1. Veri Sorumlusu</h2>
          <p>
            Kupon Formülü (Bundan böyle "Platform" olarak anılacaktır) olarak, 6698 Sayılı Kişisel Verilerin Korunması Kanunu 
            ("KVKK") uyarınca, veri sorumlusu sıfatıyla, kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-3">2. İşlenen Kişisel Veriler</h2>
          <p>
            Platformumuza üye olurken ve platformu kullanırken aşağıdaki verileriniz işlenmektedir:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 dark:text-slate-300">
            <li>Kimlik ve İletişim Bilgileri (Ad, Soyad, E-posta adresi)</li>
            <li>İşlem Güvenliği Bilgileri (IP Adresi, Giriş zamanı, Tarayıcı bilgileri)</li>
            <li>Platform Kullanım Bilgileri (Kaydedilen kuponlar, seçilen garantiler, platformdaki analiz süreçleri)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-3">3. Kişisel Verilerin İşlenme Amacı</h2>
          <p>
            Toplanan kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 dark:text-slate-300">
            <li>Kullanıcı hesabı oluşturulması ve hesap güvenliğinin sağlanması.</li>
            <li>Kullanıcıya özel (kaydedilmiş) kupon ve istatistiklerin saklanması.</li>
            <li>Hizmetlerimizin iyileştirilmesi ve teknik sorunların giderilmesi.</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi ve hukuki uyuşmazlıkların çözümü.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-3">4. İletişim</h2>
          <p>
            KVKK kapsamındaki haklarınız ve taleplerinizle ilgili bizimle iletişime geçebilirsiniz:<br />
            <strong>E-Posta:</strong> iletisim@kuponformulu.com
          </p>
        </section>

        <div className="pt-8 text-center sm:text-left">
          <Link href="/" className="inline-block px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-lg transition-colors">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
