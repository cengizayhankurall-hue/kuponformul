'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Calendar, 
  Copy, 
  Check, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  XCircle,
  Clock,
  Calculator,
  ShieldCheck,
  Coins,
  ArrowRight,
  Info,
  History,
  Trophy,
  BookmarkPlus,
  BookmarkCheck,
  Loader2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { supabase, isMockMode, mockService, dbService } from '@/lib/supabase';

interface SystemMatch {
  id: string;
  code: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  marketType?: 'ms' | 'goals' | 'iyms';
  marketName?: string;
  choice: string;
  odd: number;
  reason?: string;
  score?: string;
  iyScore?: string;
  won?: boolean;
}

interface PayoutTier {
  hitCount: number;
  comboDetails: string;
  minPayout: number;
  maxPayout: number;
  avgPayout: number;
}

interface SystemCoupon {
  id: string;
  title: string;
  badge: string;
  description: string;
  theme: 'amber' | 'emerald' | 'purple' | 'cyan' | 'indigo' | 'rose' | 'blue';
  systemSizes: number[];
  systemLabel: string;
  totalMatches: number;
  totalColumns: number;
  misli: number;
  cost: number;
  minOdds: number;
  maxOdds: number;
  avgOdds: number;
  matches: SystemMatch[];
  payoutTable: PayoutTier[];
  targetProfitBadge: string;
  hitCount?: number;
  isWinner?: boolean;
  wonAmount?: number;
  profit?: number;
}

interface YesterdaySummary {
  date: string;
  formattedDate: string;
  totalCoupons: number;
  wonCoupons: number;
  totalCost: number;
  totalWonAmount: number;
  netProfit: number;
  coupons: SystemCoupon[];
}

interface ApiResponse {
  success: boolean;
  timestamp: number;
  date: string;
  coupons: SystemCoupon[];
  yesterday: YesterdaySummary;
}

export default function SistemKuponlariPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'yesterday'>('today');
  const [activeCouponIndex, setActiveCouponIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground && !data) setLoading(true);
      if (isBackground) setIsRefreshing(true);
      setError(null);

      const res = await fetch('/api/sistem-kuponlari', { cache: 'no-store' });
      if (!res.ok) throw new Error('Sistem kuponu verisi alınamadı');
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error('API geçerli kupon döndürmedi');
      
      setData(json);
      try {
        localStorage.setItem('sistem_kuponlari_cache', JSON.stringify(json));
      } catch (e) {}
    } catch (err: any) {
      if (!data) {
        setError(err.message || 'Veri yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // 1. Önce localStorage'da hazır önbellek var mı kontrol et (< 1ms anında yükleme)
    try {
      const saved = localStorage.getItem('sistem_kuponlari_cache');
      if (saved) {
        const parsed: ApiResponse = JSON.parse(saved);
        if (parsed && parsed.coupons && parsed.coupons.length > 0) {
          setData(parsed);
          setLoading(false);
        }
      }
    } catch (e) {}

    // 2. Ardından API'den en güncel veriyi sessizce ve hızla çek
    fetchData(true);
  }, []);

  const handleCopyCodes = (coupon: SystemCoupon) => {
    const text = coupon.matches.map(m => `${m.code || m.id}: ${m.homeTeam} - ${m.awayTeam} -> ${m.choice} (${m.odd.toFixed(2)})`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId(coupon.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveCoupon = async (coupon: SystemCoupon) => {
    try {
      setSavingId(coupon.id);
      let userId: string | null = null;

      if (isMockMode) {
        const { data: { session } } = await mockService.getSession();
        if (session && session.user) userId = session.user.id;
      } else if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) userId = session.user.id;
      }

      if (!userId) {
        alert('Kuponu profilinize kaydetmek için lütfen önce giriş yapın.');
        window.location.href = '/auth';
        return;
      }

      const formattedMatches = coupon.matches.map(m => ({
        code: m.code,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        date: m.date,
        time: m.time,
        league: m.league,
        pickLabel: m.choice,
        pickOdd: m.odd,
        couponType: 'system',
        couponTitle: coupon.title,
        badge: coupon.badge,
        systemSizes: coupon.systemSizes,
        systemLabel: coupon.systemLabel,
        totalColumns: coupon.totalColumns,
        cost: coupon.cost
      }));

      const maxWin = coupon.payoutTable?.[coupon.payoutTable.length - 1]?.maxPayout || 0;

      const { error: saveError } = await dbService.saveIddaaCoupon({
        userId,
        matches: formattedMatches,
        totalOdds: coupon.maxOdds,
        stake: coupon.cost,
        potentialWin: maxWin
      });

      if (saveError) {
        throw new Error(saveError.message || 'Kaydedilemedi');
      }

      setSavedId(coupon.id);
      setTimeout(() => setSavedId(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Kupon kaydedilirken hata oluştu.');
    } finally {
      setSavingId(null);
    }
  };

  const currentCoupons = activeTab === 'today' ? (data?.coupons || []) : (data?.yesterday?.coupons || []);
  const activeCoupon = currentCoupons[activeCouponIndex] || currentCoupons[0];

  const getTierBadge = (odd: number) => {
    if (odd >= 1.80 && odd <= 2.20) {
      return {
        label: '1.80 - 2.20 Denge',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      };
    }
    if (odd >= 2.40 && odd <= 3.00) {
      return {
        label: '2.40 - 3.00 Değer',
        bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
      };
    }
    return {
      label: '3.10 - 6.00 Sürpriz',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };
  };

  return (
    <div className="w-full min-h-screen bg-[#070b14] text-slate-100 selection:bg-amber-500 selection:text-black pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ÜST BAŞLIK VE AÇIKLAMA */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0c1322] to-slate-950 p-6 sm:p-10 border border-slate-800/80 shadow-2xl shadow-amber-500/5">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AKILLI SİSTEM MOTORU</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Günün <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Sistem Kuponları</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                Resmi <strong className="text-amber-400">Maç Sonucu (MS 1, X, 2)</strong>, <strong className="text-emerald-400">Gol & KG</strong>, <strong className="text-purple-400">Karma Hibrit</strong> ve <strong className="text-rose-400">İlk Yarı / Maç Sonu (İY/MS)</strong> oranlarından oluşan, 
                her gün <strong className="text-slate-200">00:00 ile 23:59</strong> arasında %100 sabit kalan, 
                başlayan maçlarda bozulmayan 9&apos;ar maçlık Sistem 4, 5, 6 kuponları.
              </p>
            </div>

            <button
              onClick={() => fetchData(false)}
              disabled={loading || isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-sm font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 self-start md:self-center"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
              <span>{loading || isRefreshing ? 'Yenileniyor...' : 'Verileri Yenile'}</span>
            </button>
          </div>

          {/* HIZLI BİLGİ ŞERİDİ */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-slate-800/60">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> Kupon Çeşitleri
              </div>
              <div className="text-lg font-bold text-white mt-0.5">4 Kupon (MS, Gol, Hibrit, İY/MS)</div>
            </div>

            <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-slate-800/60">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-sky-400" /> Sistem Seçeneği
              </div>
              <div className="text-lg font-bold text-white mt-0.5">Sistem 4, 5, 6</div>
            </div>

            <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-slate-800/60">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" /> Kolon & Maliyet
              </div>
              <div className="text-lg font-bold text-white mt-0.5">336 Kolon (336 TL)</div>
            </div>

            <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-slate-800/60">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Kazanma Şartı
              </div>
              <div className="text-lg font-bold text-white mt-0.5">Min. 4 Maç Tutar</div>
            </div>
          </div>
        </div>

        {/* ANA SEKMELER: BUGÜNÜN KUPONLARI vs DÜNÜN SONUÇLARI */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 w-full sm:w-fit">
          <button
            onClick={() => {
              setActiveTab('today');
              setActiveCouponIndex(0);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'today'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bugünün Kuponları</span>
            {data?.date && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'today' ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-300'}`}>
                {data.date}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('yesterday');
              setActiveCouponIndex(0);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'yesterday'
                ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Dünün Sonuçları</span>
            {data?.yesterday?.formattedDate && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'yesterday' ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-300'}`}>
                {data.yesterday.formattedDate}
              </span>
            )}
          </button>
        </div>

        {/* HATA VEYA YÜKLENİYOR DURUMU */}
        {loading && (
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-16 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-white">Sistem Kuponları Hazırlanıyor...</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Resmi bülten maçları taranıyor; Maç Sonucu, Gol & KG ve Karma Hibrit oranları hesaplanıyor.
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-3xl bg-rose-500/10 border border-rose-500/30 p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-rose-300">Bir Hata Oluştu</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchData(false)}
              className="mt-2 px-4 py-2 bg-rose-500 text-black font-semibold rounded-xl text-sm"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* KUPON SEÇİM KARTLARI (TIKLAYINCA SEÇİLİ KUPON DETAYI AŞAĞIDA AÇILIR) */}
        {!loading && !error && currentCoupons.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Mevcut Sistem Kuponları ({currentCoupons.length} Adet)</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Detayları görmek için kuponun üzerine tıklayın 👇
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentCoupons.map((coupon, idx) => {
                const isActive = activeCoupon?.id === coupon.id;
                const isEmerald = coupon.theme === 'emerald';
                const isPurple = coupon.theme === 'purple';
                const isRose = coupon.theme === 'rose';

                return (
                  <button
                    key={coupon.id}
                    onClick={() => setActiveCouponIndex(idx)}
                    className={`p-5 sm:p-6 rounded-3xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                      isActive
                        ? isRose
                          ? 'bg-gradient-to-br from-rose-950/60 via-[#220a15] to-slate-950 border-rose-500 shadow-xl shadow-rose-500/10 ring-2 ring-rose-500/50'
                          : isPurple
                          ? 'bg-gradient-to-br from-purple-950/60 via-[#180a22] to-slate-950 border-purple-500 shadow-xl shadow-purple-500/10 ring-2 ring-purple-500/50'
                          : isEmerald
                          ? 'bg-gradient-to-br from-emerald-950/60 via-[#091b1a] to-slate-950 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/50'
                          : 'bg-gradient-to-br from-amber-950/60 via-[#19150b] to-slate-950 border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    {/* AKTİF KUPON PARILTISI */}
                    {isActive && (
                      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
                        isRose ? 'bg-rose-500/20' : isPurple ? 'bg-purple-500/20' : isEmerald ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                      }`} />
                    )}

                    <div className="relative z-10 space-y-3">
                      {/* ÜST ROZETLER */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-wider border ${
                            isActive
                              ? isRose
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                : isPurple
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                : isEmerald
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            {idx + 1}. SİSTEM KUPONU
                          </span>

                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800/90 text-slate-300 border border-slate-700/60">
                            {coupon.badge}
                          </span>
                        </div>

                        <span className="text-xs font-black px-3 py-1 rounded-xl bg-black/60 border border-slate-700 text-slate-200 font-mono">
                          {coupon.cost} TL
                        </span>
                      </div>

                      {/* BAŞLIK & AÇIKLAMA */}
                      <div>
                        <h3 className={`text-lg sm:text-xl font-black tracking-tight transition ${
                          isActive 
                            ? (isRose ? 'text-rose-300' : isPurple ? 'text-purple-300' : isEmerald ? 'text-emerald-300' : 'text-amber-300')
                            : 'text-white group-hover:text-amber-200'
                        }`}>
                          {coupon.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {coupon.description}
                        </p>
                      </div>

                      {/* ALT DETAY BİLGİSİ */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="font-semibold text-slate-300">{coupon.totalMatches} Maç</span>
                          <span>•</span>
                          <span>{coupon.systemLabel}</span>
                          <span>•</span>
                          <span>{coupon.totalColumns} Kolon</span>
                        </div>

                        {activeTab === 'yesterday' ? (
                          <div className={`font-black flex items-center gap-1 ${
                            coupon.isWinner ? 'text-emerald-400' : 'text-slate-400'
                          }`}>
                            {coupon.isWinner ? '✅ KAZANDI' : '❌ TUTMADI'} ({coupon.hitCount}/9)
                          </div>
                        ) : (
                          <div className={`font-black flex items-center gap-1 ${
                            isRose ? 'text-rose-400' : isPurple ? 'text-purple-400' : isEmerald ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            <span>Maks:</span>
                            <span className="font-mono">{coupon.targetProfitBadge.split(' ')[0]} TL</span>
                          </div>
                        )}
                      </div>

                      {/* SEÇİLİ KUPON GÖSTERGESİ */}
                      <div className="flex items-center justify-end pt-1">
                        {isActive ? (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-black ${
                            isRose ? 'text-rose-400' : isPurple ? 'text-purple-400' : isEmerald ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Kupon Seçili (Aşağıda Açıldı)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-slate-300 transition">
                            <span>Kuponu Göster</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SEÇİLİ KUPONUN DETAY PANELİ (MAÇ LİSTESİ + İKRAMİYE TABLOSU) */}
        {!loading && !error && activeCoupon && (() => {
          const coupon = activeCoupon;
          const isEmerald = coupon.theme === 'emerald';
          const isPurple = coupon.theme === 'purple';
          const isRose = coupon.theme === 'rose';
          const isHybrid = coupon.id.includes('3');
          const isIyMs = coupon.id.includes('4') || coupon.theme === 'rose';

          return (
            <div 
              key={coupon.id}
              className={`rounded-3xl bg-[#0c121e]/90 border shadow-2xl overflow-hidden transition-all duration-300 ${
                isRose
                  ? 'border-rose-500/40 shadow-rose-500/5'
                  : isPurple 
                  ? 'border-purple-500/40 shadow-purple-500/5' 
                  : isEmerald 
                  ? 'border-emerald-500/40 shadow-emerald-500/5' 
                  : 'border-amber-500/40 shadow-amber-500/5'
              }`}
            >
              {/* KART BAŞLIĞI */}
              <div className={`p-6 sm:p-8 bg-gradient-to-r border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                isRose
                  ? 'from-slate-900 via-[#210914] to-slate-900'
                  : isPurple 
                  ? 'from-slate-900 via-[#180a22] to-slate-900' 
                  : isEmerald 
                  ? 'from-slate-900 via-[#0a1818] to-slate-900' 
                  : 'from-slate-900 via-[#10192b] to-slate-900'
              }`}>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                      isRose
                        ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400'
                        : isPurple 
                        ? 'bg-purple-500/15 border border-purple-500/40 text-purple-400' 
                        : isEmerald 
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400' 
                        : 'bg-amber-500/15 border border-amber-500/40 text-amber-400'
                    }`}>
                      {coupon.badge}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      Sistem 4, 5, 6
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      336 Kolon (336 TL)
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <span>{coupon.title}</span>
                  </h2>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    {coupon.description}
                  </p>
                </div>

                {/* SAĞ TARAF AKSİYONLAR VE KAZANÇ DURUMU */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {activeTab === 'yesterday' && (
                    <div className={`px-4 py-3 rounded-2xl border text-center ${
                      coupon.isWinner 
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    }`}>
                      <div className="text-xs font-medium uppercase tracking-wider opacity-80">Dünkü Durum</div>
                      <div className="text-base font-black">
                        {coupon.targetProfitBadge}
                      </div>
                    </div>
                  )}

                  {activeTab === 'today' && (
                    <div className={`px-4 py-3 rounded-2xl border text-center ${
                      isRose
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : isPurple 
                        ? 'bg-purple-500/10 border-purple-500/30' 
                        : isEmerald 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}>
                      <div className={`text-xs font-medium uppercase tracking-wider ${
                        isRose ? 'text-rose-400/80' : isPurple ? 'text-purple-400/80' : isEmerald ? 'text-emerald-400/80' : 'text-amber-400/80'
                      }`}>
                        Maksimum Kazanç Hedefi
                      </div>
                      <div className={`text-lg font-black ${
                        isRose ? 'text-rose-300' : isPurple ? 'text-purple-300' : isEmerald ? 'text-emerald-300' : 'text-amber-300'
                      }`}>
                        {coupon.targetProfitBadge}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCodes(coupon)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold transition-all active:scale-95"
                      title="Maç kodlarını kopyala"
                    >
                      {copiedId === coupon.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-400" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSaveCoupon(coupon)}
                      disabled={savingId === coupon.id}
                      className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-black text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                        isRose
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-rose-500/20'
                          : isPurple 
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-400 hover:from-purple-400 hover:to-indigo-300 text-white shadow-purple-500/20' 
                          : isEmerald 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-emerald-500/20' 
                          : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-amber-500/20'
                      }`}
                    >
                      {savingId === coupon.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Kaydediliyor...</span>
                        </>
                      ) : savedId === coupon.id ? (
                        <>
                          <BookmarkCheck className={`w-4 h-4 ${isPurple || isRose ? 'text-white' : 'text-black'}`} />
                          <span>Kaydedildi!</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-4 h-4" />
                          <span>Kuponu Kaydet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* ORAN KURAL DAĞILIMI GÖSTERGE ÇUBUĞU */}
              {isIyMs ? (
                <div className="bg-slate-950/60 px-6 py-4 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="text-xs">
                      <span className="font-bold text-rose-400">2 Maç Denge:</span>{' '}
                      <span className="text-slate-300 font-medium">2.00 - 2.80 İY/MS (1/1, 2/2)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-pink-500/5 border border-pink-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                    <div className="text-xs">
                      <span className="font-bold text-pink-400">3 Maç Değer:</span>{' '}
                      <span className="text-slate-300 font-medium">2.85 - 5.00 İY/MS (X/1, X/2)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-400" />
                    <div className="text-xs">
                      <span className="font-bold text-fuchsia-400">4 Maç Sürpriz:</span>{' '}
                      <span className="text-slate-300 font-medium">5.10 - 16.00 İY/MS (X/1, 1/X, 2/X)</span>
                    </div>
                  </div>
                </div>
              ) : isHybrid ? (
                <div className="bg-slate-950/60 px-6 py-4 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <div className="text-xs">
                      <span className="font-bold text-purple-400">Karma Model:</span>{' '}
                      <span className="text-slate-300 font-medium">MS 1-X-2 & 2.5 / 3.5 Alt-Üst</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <div className="text-xs">
                      <span className="font-bold text-indigo-400">Oran Aralığı:</span>{' '}
                      <span className="text-slate-300 font-medium">1.80 ile 3.50 Arası Tüm Seçimler</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-violet-500/5 border border-violet-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                    <div className="text-xs">
                      <span className="font-bold text-violet-400">9 Maç Sistemi:</span>{' '}
                      <span className="text-slate-300 font-medium">Sistem 4, 5, 6 (336 Kolon)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/60 px-6 py-4 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-400">2 Maç:</span>{' '}
                      <span className="text-slate-300 font-medium">1.80 - 2.20 Arası Denge Oranı</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sky-500/5 border border-sky-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <div className="text-xs">
                      <span className="font-bold text-sky-400">2 Maç:</span>{' '}
                      <span className="text-slate-300 font-medium">2.40 - 3.00 Arası Değer Oranı</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                    isEmerald ? 'bg-teal-500/5 border border-teal-500/20' : 'bg-amber-500/5 border border-amber-500/20'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${isEmerald ? 'bg-teal-400' : 'bg-amber-400'}`} />
                    <div className="text-xs">
                      <span className={`font-bold ${isEmerald ? 'text-teal-400' : 'text-amber-400'}`}>5 Maç:</span>{' '}
                      <span className="text-slate-300 font-medium">3.10 - 6.00 Arası Sürpriz Oran</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 9 MAÇ LİSTESİ */}
              <div className="p-6 sm:p-8 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  <span>Maç / Lig & Saat</span>
                  <div className="flex items-center gap-8">
                    <span>Tercih & Oran</span>
                    <span>Durum / Skor</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {coupon.matches.map((m, idx) => {
                    const tier = getTierBadge(m.odd);
                    return (
                      <div 
                        key={m.id || idx}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <span className="w-6 text-xs font-bold text-slate-500 font-mono text-center pt-0.5 sm:pt-0">
                            {idx + 1}
                          </span>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                isRose
                                  ? 'bg-slate-800 text-rose-400 border-slate-700'
                                  : isPurple
                                  ? 'bg-slate-800 text-purple-400 border-slate-700'
                                  : isEmerald 
                                  ? 'bg-slate-800 text-emerald-400 border-slate-700' 
                                  : 'bg-slate-800 text-amber-400 border-slate-700'
                              }`}>
                                {m.code || 'BÜLTEN'}
                              </span>

                              {m.marketName && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/50">
                                  {m.marketName}
                                </span>
                              )}

                              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" /> {m.time}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 text-slate-400">
                                {m.league}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${tier.bg}`}>
                                {tier.label}
                              </span>
                            </div>

                            <div className="text-sm sm:text-base font-bold text-white tracking-wide">
                              {m.homeTeam} <span className="text-slate-500 font-normal">vs</span> {m.awayTeam}
                            </div>

                            {m.reason && (
                              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                <Info className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{m.reason}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SEÇİLEN TERCİH VE ORAN */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pl-9 sm:pl-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1.5 rounded-xl border font-black text-sm tracking-wider shadow-sm ${
                              isRose
                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                                : isPurple
                                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                                : isEmerald 
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            }`}>
                              {m.choice}
                            </span>
                            <span className="text-base font-black text-white font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                              {m.odd.toFixed(2)}
                            </span>
                          </div>

                          {/* DURUM / SKOR */}
                          <div className="min-w-[110px] text-right">
                            {m.score ? (
                              <div className="space-y-0.5">
                                <div className="text-sm font-bold font-mono text-white">
                                  {m.score}
                                </div>
                                <div className={`text-xs font-semibold flex items-center justify-end gap-1 ${
                                  m.won ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                  {m.won ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>TUTTU</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>YATTI</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>Başlamadı</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KAÇ MAÇ TUTARSA NE KADAR PARA VERİR (KAZANÇ & İKRAMİYE TABLOSU) */}
              <div className="p-6 sm:p-8 bg-slate-950/80 border-t border-slate-800">
                <div className="space-y-2 mb-6">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                    isPurple ? 'text-purple-400' : isEmerald ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    <Calculator className="w-4 h-4" />
                    <span>SİSTEM KAZANÇ VE İKRAMİYE TABLOSU</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Kaç Maç Tutarsa Ne Kadar Para Verir?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Sistem 4, 5, 6 modelinde 9 maçtan en az 4 tanesini bildiğiniz andan itibaren kuponunuz para kazanmaya başlar. 
                    Tutan maç kombinasyonlarının oranları birbiriyle çarpılır ve 1 TL kolon bedeliyle hesaplanarak toplanır.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3.5 px-4 font-bold">Tutan Maç</th>
                        <th className="py-3.5 px-4 font-bold">Kombinasyon Detayı (Kolon Sayısı)</th>
                        <th className="py-3.5 px-4 font-bold text-right">Minimum Kazanç</th>
                        <th className="py-3.5 px-4 font-bold text-right">Ortalama Kazanç</th>
                        <th className={`py-3.5 px-4 font-bold text-right ${
                          isPurple ? 'text-purple-400' : isEmerald ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          Maksimum Kazanç
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {coupon.payoutTable.map((tier) => {
                        const isYesterdayHitTier = activeTab === 'yesterday' && coupon.hitCount === tier.hitCount;
                        const isFullHit = tier.hitCount === 9;

                        return (
                          <tr 
                            key={tier.hitCount}
                            className={`transition-colors ${
                              isYesterdayHitTier 
                                ? 'bg-emerald-500/15 border-l-4 border-l-emerald-500 font-bold' 
                                : isFullHit 
                                  ? (isPurple ? 'bg-purple-500/5 hover:bg-purple-500/10' : isEmerald ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'bg-amber-500/5 hover:bg-amber-500/10') 
                                  : 'hover:bg-slate-900/50'
                            }`}
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                                  isFullHit 
                                    ? (isPurple ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : isEmerald ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30' : 'bg-amber-500 text-black shadow-md shadow-amber-500/30') 
                                    : 'bg-slate-800 text-slate-200'
                                }`}>
                                  {tier.hitCount}
                                </span>
                                <span className="font-semibold text-white">
                                  {tier.hitCount} Maç Tutarsa
                                </span>
                                {isYesterdayHitTier && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-black">
                                    DÜN TUTAN KADEME ✅
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                              {tier.comboDetails}
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono text-slate-300 whitespace-nowrap">
                              {tier.minPayout.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono text-slate-300 whitespace-nowrap">
                              {tier.avgPayout.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                            </td>

                            <td className={`py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap ${
                              isPurple ? 'text-purple-400' : isEmerald ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {tier.maxPayout.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* SİSTEM BİLGİLENDİRME KUTUSU */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
                  <Info className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isPurple ? 'text-purple-400' : isEmerald ? 'text-emerald-400' : 'text-amber-400'
                  }`} />
                  <div>
                    <strong className="text-slate-200">Sistem 4, 5, 6 Mantığı:</strong> 9 maç arasından seçilen 4&apos;lü (126 adet), 5&apos;li (126 adet) ve 6&apos;lı (84 adet) olmak üzere toplam 336 kolon oynanır. 4 maç tuttuğunda 1 kolon; 5 maç tuttuğunda 5 adet 4&apos;lü ve 1 adet 5&apos;li kolon birden kazandırır. 9 maçın tamamı geldiğinde ise 336 kolonun tamamı toplanarak maksimum ikramiye ödenir.
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* DÜNÜN ÖZET KARTI (EĞER ARŞİVDEYSEK) */}
        {activeTab === 'yesterday' && data?.yesterday && (
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{data.yesterday.formattedDate} Değerlendirmesi</span>
              </div>
              <div className="text-sm text-slate-300">
                Toplam Kupon: <strong className="text-white">{data.yesterday.totalCoupons}</strong> | 
                Yatırılan: <strong className="text-white">{data.yesterday.totalCost} TL</strong> | 
                Kazanılan: <strong className="text-emerald-400">{data.yesterday.totalWonAmount.toLocaleString('tr-TR')} TL</strong>
              </div>
            </div>

            <div className={`px-5 py-2.5 rounded-2xl font-black text-sm ${
              data.yesterday.netProfit >= 0 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              Net Kasa: {data.yesterday.netProfit >= 0 ? '+' : ''}{data.yesterday.netProfit.toLocaleString('tr-TR')} TL
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
