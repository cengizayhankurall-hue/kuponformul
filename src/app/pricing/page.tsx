'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isMockMode, mockService, DEFAULT_PACKAGES, UserProfile } from '@/lib/supabase';
import { Check, ShieldCheck, Zap, Star } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingPkgId, setLoadingPkgId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (isMockMode) {
        const { data: { session } } = await mockService.getSession();
        if (session && session.user) {
          setUser(session.user);
        }
      }
    }
    loadUser();
  }, []);

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      // Giriş yapmamışsa yönlendir
      router.push('/auth');
      return;
    }

    setLoadingPkgId(packageId);
    try {
      if (isMockMode) {
        // 2 saniye ödeme simülasyonu yapalım
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await mockService.purchasePackage(user.id, packageId);
        alert('Tebrikler! Ödemeniz başarıyla alındı ve premium üyeliğiniz anında aktifleştirildi.');
        router.push('/dashboard');
        router.refresh();
      } else {
        // Gerçek ödeme kapısı entegrasyonu (PayTR/iyzico yönlendirmesi)
        // Buradan backend'e bir ödeme oturumu isteği atılacak
      }
    } catch (err: any) {
      alert('Ödeme sırasında bir hata oluştu: ' + err.message);
    } finally {
      setLoadingPkgId(null);
    }
  };

  const packageIcons = {
    'pkg-weekly-gold': <Zap className="h-6 w-6 text-yellow-500" />,
    'pkg-monthly-platinum': <ShieldCheck className="h-6 w-6 text-green-400" />,
    'pkg-season-vip': <Star className="h-6 w-6 text-purple-400" />
  };

  // Paketlerin özellikleri listesi
  const pkgFeatures = {
    'pkg-weekly-gold': [
      '14 ve 13 Garanti Formülleri',
      'Temel Filtreleme Araçları',
      'TXT Formatında Çıktı Alma',
      'Haftalık Güncel Maç Listesi'
    ],
    'pkg-monthly-platinum': [
      '14, 13 ve 12 Garanti Formülleri',
      'Gelişmiş Oran ve Sürpriz Filtreleri',
      'Halk Oylaması Oynanma Oranları',
      'Ardışıklık Sınırlandırıcılar',
      'TXT Formatında Sınırsız Çıktı'
    ],
    'pkg-season-vip': [
      'Tüm Sezon Boyunca Kesintisiz VIP Erişim',
      'Tüm Filtreler ve Garanti Modelleri',
      'Özel Maç Analiz Destek Grubu',
      'Sunucu Tarafında Ekstra Hızlı Hesaplama',
      '7/24 Teknik Destek Önceliği'
    ]
  };

  return (
    <div className="bg-neutral-950 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-base font-semibold text-green-400 uppercase tracking-wide">Üyelik Paketleri</h2>
          <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Kupon Maliyetlerinizi Hemen Düşürün
          </p>
          <p className="mt-4 text-lg text-neutral-400">
            Hangi paketi seçerseniz seçin, tek bir haftada kupon tasarrufundan abonelik ücretini amorti edebilirsiniz.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {DEFAULT_PACKAGES.map((pkg) => {
            const isPopular = pkg.id === 'pkg-monthly-platinum';
            const features = pkgFeatures[pkg.id as keyof typeof pkgFeatures] || [];
            
            return (
              <div
                key={pkg.id}
                className={`bg-neutral-900/60 backdrop-blur-md rounded-2xl border transition relative flex flex-col justify-between ${
                  isPopular 
                    ? 'border-green-500/50 shadow-green-500/5 ring-1 ring-green-500/30' 
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-bold py-1 px-3.5 rounded-full uppercase tracking-wider">
                    En Çok Tercih Edilen
                  </span>
                )}

                {/* Card Header */}
                <div className="p-8 border-b border-neutral-850">
                  <div className="flex items-center space-x-2.5 mb-4">
                    {packageIcons[pkg.id as keyof typeof packageIcons]}
                    <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                  </div>
                  <p className="text-xs text-neutral-400 min-h-[32px]">{pkg.description}</p>
                  
                  <div className="mt-6 flex items-baseline">
                    <span className="text-4xl font-extrabold text-white">₺{pkg.price_try}</span>
                    <span className="ml-1 text-sm font-semibold text-neutral-400">
                      / {pkg.duration_days} Gün
                    </span>
                  </div>
                </div>

                {/* Card Features */}
                <div className="p-8 flex-grow">
                  <ul className="space-y-4">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-3 text-sm text-neutral-300">
                        <Check className="h-4.5 w-4.5 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Action */}
                <div className="p-8 pt-0">
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loadingPkgId !== null}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                      isPopular
                        ? 'bg-green-500 text-black hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/10'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                    } disabled:opacity-50`}
                  >
                    <span>
                      {loadingPkgId === pkg.id 
                        ? 'Ödeme Alınıyor...' 
                        : user 
                          ? 'Şimdi Satın Al' 
                          : 'Katılmak İçin Giriş Yap'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Notice */}
        <div className="mt-16 text-center text-xs text-neutral-500 flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span>256-Bit SSL Sertifikalı Güvenli Ödeme Altyapısı</span>
          </div>
          <p>Kredi kartı veya Banka kartı ile taksitli ödeme yapabilirsiniz. Faturalarınız e-posta adresinize gönderilir.</p>
        </div>

      </div>
    </div>
  );
}
