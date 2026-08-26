'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isMockMode, mockService, supabase, UserProfile, Subscription, DEFAULT_PACKAGES } from '@/lib/supabase';
import { User, Award, Calendar, CreditCard, ArrowRight, ShieldCheck, ShieldAlert, UserX, Trash2, Ticket, Play } from 'lucide-react';
import Link from 'next/link';
import { dbService } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [iddaaCoupons, setIddaaCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCouponTab, setActiveCouponTab] = useState<'toto' | 'iddaa'>('toto');

  useEffect(() => {
    async function loadDashboard() {
      try {
        if (isMockMode) {
          const { data: { session } } = await mockService.getSession();
          if (session && session.user) {
            setUser(session.user);
            const activeSub = await mockService.getActiveSubscription(session.user.id);
            setSub(activeSub);
            
            const history = await mockService.getTransactions(session.user.id);
            setTxs(history);
            
            const userCoupons = await dbService.getSavedCoupons(session.user.id);
            if (userCoupons.data) setCoupons(userCoupons.data);

            await dbService.evaluateIddaaCoupons(session.user.id);
            const iddaa = await dbService.getIddaaSavedCoupons(session.user.id);
            if (iddaa.data) setIddaaCoupons(iddaa.data);
          } else {
            // Giriş yapılmadıysa login sayfasına yolla
            router.push('/auth');
          }
        } else {
          // Gerçek Supabase yüklemesi
          if (!supabase) return;
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || 'Kullanıcı',
              phone: session.user.user_metadata?.phone || ''
            });
            const userCoupons = await dbService.getSavedCoupons(session.user.id);
            if (userCoupons.data) setCoupons(userCoupons.data);

            await dbService.evaluateIddaaCoupons(session.user.id);
            const iddaa = await dbService.getIddaaSavedCoupons(session.user.id);
            if (iddaa.data) setIddaaCoupons(iddaa.data);
          } else {
            router.push('/auth');
          }
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const handleDeleteIddaaCoupon = async (id: string) => {
    if (confirm('Bu iddaa kuponunu silmek istediğinize emin misiniz?')) {
      const { error } = await dbService.deleteIddaaCoupon(id);
      if (error) {
        alert('HATA: Kupon silinemedi!\nDetay: ' + error.message);
      } else {
        setIddaaCoupons(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm('Bu kuponu silmek istediğinize emin misiniz?')) {
      const { error } = await dbService.deleteCoupon(id);
      if (error) {
        alert('HATA: Kupon silinemedi! (Supabase Veritabanı izinleri (RLS) eksik olabilir. Lütfen yetki komutunu çalıştırdığınızdan emin olun.)\nDetay: ' + error.message);
      } else {
        setCoupons(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const handlePlayCoupon = (coupon: any) => {
    if (typeof window !== 'undefined') {
      const payload = JSON.stringify({
        selections: coupon.predictions,
        guarantee: coupon.guarantee_level,
        generated_columns: coupon.generated_columns,
        columns_count: coupon.columns_count
      });
      sessionStorage.setItem('st_load_coupon', payload);
      localStorage.setItem('stt_draft_coupon', payload);
      router.push('/spor-toto?action=load');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-neutral-400">
        Yüklüyor...
      </div>
    );
  }

  if (!user) {
    return null; // Yönlendirme gerçekleşti
  }

  // Tarih biçimlendirme
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-neutral-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        
        {/* Eksik Profil Uyarısı */}
        {user && !user.phone && (
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-yellow-500 font-semibold text-lg">Profil Bilgileriniz Eksik!</h3>
                <p className="text-yellow-200/70 text-sm mt-1">
                  Sistemimizi tam kapasiteyle kullanabilmek ve üyelik işlemleriniz için lütfen telefon numaranızı ekleyin.
                </p>
              </div>
            </div>
            <Link
              href="/auth/complete-profile"
              className="whitespace-nowrap inline-flex items-center space-x-2 py-2 px-4 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg text-sm transition"
            >
              <span>Profili Tamamla</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl flex items-center gap-2">
              Merhaba, {user.full_name}!
            </h1>
            <p className="text-neutral-400 mt-1 text-sm">
              Bu panelden abonelik durumunuzu ve ödeme geçmişinizi yönetebilirsiniz.
            </p>
          </div>
          
          <Link
            href="/"
            className="inline-flex items-center space-x-2 py-2.5 px-5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl text-sm transition"
          >
            <span>Kupon Hazırla</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Dashboard Grid */}
        <div className="mb-8">
          {/* Account Details Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-neutral-400" />
                Profil Detayları
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="p-4 border border-neutral-800 rounded-xl bg-neutral-950/50">
                  <span className="text-neutral-500 text-xs block mb-1">Ad Soyad</span>
                  <p className="text-white font-medium">{user.full_name}</p>
                </div>
                <div className="p-4 border border-neutral-800 rounded-xl bg-neutral-950/50">
                  <span className="text-neutral-500 text-xs block mb-1">E-posta Adresi</span>
                  <p className="text-white font-medium break-all">{user.email}</p>
                </div>
                <div className="p-4 border border-neutral-800 rounded-xl bg-neutral-950/50">
                  <span className="text-neutral-500 text-xs block mb-1">Telefon</span>
                  <p className="text-white font-medium break-all">{user.phone || 'Belirtilmedi'}</p>
                </div>
                <div className="p-4 border border-green-500/30 rounded-xl bg-green-500/5 flex justify-between items-center">
                  <div>
                    <span className="text-neutral-500 text-xs block mb-1">Hesap Türü</span>
                    <p className="text-green-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> 
                      Sınırsız Üyelik (Ücretsiz)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Saved Coupons List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-sky-400" />
              Kaydedilen Kuponlarım
            </h2>
            <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button onClick={() => setActiveCouponTab('toto')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeCouponTab === 'toto' ? 'bg-sky-500 text-white' : 'text-neutral-400 hover:text-white'}`}>Toto</button>
              <button onClick={() => setActiveCouponTab('iddaa')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeCouponTab === 'iddaa' ? 'bg-emerald-500 text-white' : 'text-neutral-400 hover:text-white'}`}>İddaa</button>
            </div>
          </div>

          {activeCouponTab === 'toto' && (
            coupons.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-semibold">
                      <th className="pb-3">Hafta (Bülten)</th>
                      <th className="pb-3 text-center">Sistem</th>
                      <th className="pb-3 text-center">Kolon Sayısı</th>
                      <th className="pb-3">Tarih</th>
                      <th className="pb-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b border-neutral-850 text-neutral-200 hover:bg-neutral-800/30 transition">
                        <td className="py-3 font-semibold text-white">{coupon.round_id || 'Güncel Hafta'}</td>
                        <td className="py-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {coupon.guarantee_level}G
                          </span>
                        </td>
                        <td className="py-3 text-center text-sky-400 font-bold">{coupon.columns_count} Kolon</td>
                        <td className="py-3 text-xs text-neutral-400">{formatDate(coupon.created_at)}</td>
                        <td className="py-3 text-right flex justify-end gap-2 items-center">
                          <button 
                            onClick={() => handlePlayCoupon(coupon)}
                            className="px-3 py-1.5 flex items-center gap-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition text-xs font-bold"
                            title="Seçimleri yükle ve Ana Sayfaya dön"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Hemen Oyna
                          </button>
                          <button 
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Kuponu Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 text-sm bg-neutral-950/50 rounded-xl border border-neutral-800/50">
                <Ticket className="h-8 w-8 mx-auto mb-2 opacity-20" />
                Henüz profilinize kaydettiğiniz bir Toto kuponu bulunmuyor.
              </div>
            )
          )}

          {activeCouponTab === 'iddaa' && (
            iddaaCoupons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {iddaaCoupons.map(coupon => (
                  <div key={coupon.id} className="p-4 bg-neutral-800/40 rounded-xl border border-neutral-700 relative overflow-hidden">
                     <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-lg ${coupon.status === 'won' ? 'bg-emerald-500 text-white' : coupon.status === 'lost' ? 'bg-rose-500 text-white' : 'bg-slate-500 text-white'}`}>
                       {coupon.status === 'won' ? 'KAZANDI' : coupon.status === 'lost' ? 'KAYBETTİ' : 'BEKLİYOR'}
                     </div>
                     <h4 className="font-bold text-sm mb-3 text-emerald-400">
                       İddaa Kuponu ({formatDate(coupon.created_at)})
                     </h4>
                     <div className="space-y-2 mb-4">
                        {coupon.matches.map((m: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 flex justify-between items-center text-xs gap-2">
                            <div>
                              <div className="text-neutral-400 text-[10px] flex items-center gap-1.5 flex-wrap">
                                <span>{m.date} {m.time}</span>
                                {m.msScore && (
                                  <span className="bg-neutral-800 text-sky-400 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                                    MS: {m.msScore} {m.iyScore ? `(İY: ${m.iyScore})` : ''}
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-white mt-0.5">{m.homeTeam} - {m.awayTeam}</div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-emerald-400">{m.pickLabel}</span>
                                <span className="text-neutral-400 font-black">({typeof m.pickOdd === 'number' ? m.pickOdd.toFixed(2) : m.pickOdd})</span>
                              </div>
                              {m.result === 'won' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Kazandı ✓
                                </span>
                              )}
                              {m.result === 'lost' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  Kaybetti ✗
                                </span>
                              )}
                              {(!m.result || m.result === 'pending') && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  Bekliyor
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                     </div>
                     <div className="flex justify-between items-center pt-3 border-t border-neutral-700">
                       <div>
                         <div className="text-xs text-neutral-400">Miktar: <span className="text-white font-bold">{coupon.stake} TL</span></div>
                         <div className="text-xs text-neutral-400">Toplam Oran: <span className="text-emerald-400 font-bold">{coupon.total_odds}</span></div>
                       </div>
                       <div className="text-right flex items-center justify-end gap-3">
                         <div className="flex flex-col items-end">
                           <div className="text-[10px] text-neutral-500">Olası Kazanç</div>
                           <div className="font-black text-emerald-400 text-lg">{coupon.potential_win} TL</div>
                         </div>
                         <button onClick={() => handleDeleteIddaaCoupon(coupon.id)} className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition" title="Kuponu Sil">
                           <Trash2 className="h-4 w-4" />
                         </button>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 text-sm bg-neutral-950/50 rounded-xl border border-neutral-800/50">
                <Ticket className="h-8 w-8 mx-auto mb-2 opacity-20" />
                Henüz profilinize kaydettiğiniz bir İddaa kuponu bulunmuyor.
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}
