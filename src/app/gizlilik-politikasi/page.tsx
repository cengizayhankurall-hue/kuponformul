'use client';

import React from 'react';
import Link from 'next/link';

export default function GizlilikPolitikasiPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-slate-800 dark:text-slate-200">
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Gizlilik Politikası</h1>
        <p className="text-slate-500 dark:text-slate-400">Son güncellenme tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
      </div>

      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-3">1. Bilgilerin Toplanması</h2>
          <p>
            Kupon Formülü'nü kullandığınızda, size hizmet sunabilmek amacıyla yalnızca temel kişisel verilerinizi (örn: e-posta, isim) 
            ve uygulama içindeki tercihlerinizi (örn: kaydedilen kuponlar) topluyoruz. Cihaz bilgisi veya IP adresi gibi verilerinizi kaydetmiyoruz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-3">2. Çerezler (Cookies)</h2>
          <p>
            Sitemiz, kullanıcı deneyimini iyileştirmek, tercihlerinizi (örn: karanlık/aydınlık tema) hatırlamak ve 
            oturum güvenliğini sağlamak için çerezleri kullanır. Tarayıcınızın ayarlarından çerezleri her zaman 
            kapatabilirsiniz, ancak bu durum sitenin bazı işlevlerini (örn: otomatik giriş, kupon kaydetme) etkileyebilir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-3">3. Veri Güvenliği ve Paylaşımı</h2>
          <p>
            Verileriniz güvenli sunucularda (Supabase) şifrelenerek saklanmaktadır. Kişisel bilgileriniz, yasal zorunluluklar 
            dışında <strong>kesinlikle üçüncü şahıslarla, reklam verenlerle veya diğer kurumlarla paylaşılmaz.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-3">4. Veri Silme Talebi</h2>
          <p>
            Hesabınızın ve kayıtlı tüm kupon ile kişisel verilerinizin kalıcı olarak silinmesini talep etmek isterseniz, 
            sistem içerisindeki profil ayarlarından veya <strong>iletisim@kuponformulu.com</strong> adresi üzerinden bize 
            ulaşabilirsiniz.
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
