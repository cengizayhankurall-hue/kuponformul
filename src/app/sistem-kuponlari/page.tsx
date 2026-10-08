'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Copy, 
  Check, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Award, 
  Sun, 
  Moon, 
  Layers, 
  CheckCircle2, 
  XCircle,
  SlidersHorizontal,
  Clock,
  BarChart3,
  Calculator,
  ShieldCheck,
  Coins,
  ArrowRight,
  Info,
  History,
  Trophy
} from 'lucide-react';

interface SystemMatch {
  id: string;
  code: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  marketType: string;
  marketName: string;
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
  yesterday?: YesterdaySummary;
}

function getSubsets<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const head = arr[0];
  const tail = arr.slice(1);
  const withHead = getSubsets(tail, k - 1).map(s => [head, ...s]);
  const withoutHead = getSubsets(tail, k);
  return [...withHead, ...withoutHead];
}

export default function SistemKuponlariPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [viewMode, setViewMode] = useState<'today' | 'yesterday'>('today');
  const [activeTodayCouponId, setActiveTodayCouponId] = useState<string>('kupon-1');
  const [activePastCouponId, setActivePastCouponId] = useState<string>('past-kupon-1');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Canlı Simülatör (Seçili kupondaki tutan maçların indeksleri)
  const [selectedMatchIndices, setSelectedMatchIndices] = useState<Record<string, Set<number>>>({
    'kupon-1': new Set(),
    'kupon-2': new Set(),
    'kupon-3': new Set(),
    'kupon-4': new Set(),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/sistem-kuponlari?t=${Date.now()}`, { cache: 'no-store' });
      const json: ApiResponse = await res.json();
      if (json && json.success) {
        setData(json);
        if (json.coupons && json.coupons.length > 0) {
          setActiveTodayCouponId(prev => prev && json.coupons.some(c => c.id === prev) ? prev : json.coupons[0].id);
        }
        if (json.yesterday?.coupons && json.yesterday.coupons.length > 0) {
          setActivePastCouponId(prev => prev && json.yesterday!.coupons.some(c => c.id === prev) ? prev : json.yesterday!.coupons[0].id);
        }
      }
    } catch (err) {
      console.error('Sistem kuponları veri çekme hatası:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const activeCoupon = useMemo(() => {
    if (viewMode === 'today') {
      if (!data?.coupons || data.coupons.length === 0) return null;
      return data.coupons.find(c => c.id === activeTodayCouponId) || data.coupons[0];
    } else {
      if (!data?.yesterday?.coupons || data.yesterday.coupons.length === 0) return null;
      return data.yesterday.coupons.find(c => c.id === activePastCouponId) || data.yesterday.coupons[0];
    }
  }, [data, viewMode, activeTodayCouponId, activePastCouponId]);

  // Canlı Simülatör Hesabı (Bugünün Kuponları İçin)
  const simulatedPayout = useMemo(() => {
    if (!activeCoupon || viewMode !== 'today') return 0;
    const selected = selectedMatchIndices[activeCoupon.id] || new Set();
    const hitIndices = Array.from(selected);
    if (hitIndices.length === 0) return 0;

    const hitOdds = hitIndices.map(i => activeCoupon.matches[i]?.odd || 0).filter(o => o > 0);
    let total = 0;

    for (const k of activeCoupon.systemSizes) {
      if (hitOdds.length >= k) {
        const combos = getSubsets(hitOdds, k);
        for (const c of combos) {
          const prod = c.reduce((a, b) => a * b, 1);
          total += prod * (activeCoupon.misli || 1);
        }
      }
    }

    return Number(total.toFixed(2));
  }, [activeCoupon, selectedMatchIndices, viewMode]);

  const toggleMatchHit = (couponId: string, matchIdx: number) => {
    if (viewMode !== 'today') return;
    setSelectedMatchIndices(prev => {
      const currentSet = new Set(prev[couponId] || []);
      if (currentSet.has(matchIdx)) {
        currentSet.delete(matchIdx);
      } else {
        currentSet.add(matchIdx);
      }
      return { ...prev, [couponId]: currentSet };
    });
  };

  const selectAllMatches = (couponId: string, count: number) => {
    setSelectedMatchIndices(prev => {
      const newSet = new Set<number>();
      for (let i = 0; i < count; i++) newSet.add(i);
      return { ...prev, [couponId]: newSet };
    });
  };

  const clearSelectedMatches = (couponId: string) => {
    setSelectedMatchIndices(prev => ({ ...prev, [couponId]: new Set() }));
  };

  const handleCopyCoupon = (coupon: SystemCoupon) => {
    const text = [
      `🎰 ${coupon.title} (${coupon.systemLabel})`,
      `📅 Tarih: ${viewMode === 'today' ? (data?.date || 'Bugün') : (data?.yesterday?.formattedDate || 'Dün')} | Bedel: ${coupon.cost} TL (Misli 1)`,
      `🎯 Durum: ${coupon.targetProfitBadge}`,
      '----------------------------------------',
      ...coupon.matches.map((m, idx) => `${idx + 1}. [${m.code || 'ID'}] ${m.homeTeam} vs ${m.awayTeam} -> ${m.choice} (Oran: ${m.odd.toFixed(2)}) [${m.time}]`),
      '----------------------------------------',
      '🤖 Kupon Formülü Yapay Zeka Analiz Sistemi'
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedId(coupon.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(val);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'} transition-colors duration-200 font-sans pb-24`}>
      {/* HEADER */}
      <header className={`sticky top-0 z-30 border-b ${isDark ? 'bg-neutral-950/90 border-neutral-800/80 backdrop-blur-md' : 'bg-white/90 border-neutral-200 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-black shadow-lg shadow-amber-500/25">
              <Calculator className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight">Günün Sistem Kuponları</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  MİSLİ 1 VURGUNU
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'} font-medium`}>
                Sistem 3,4,5 ve 4,5,6 modelleriyle yüksek kazançlı otomatik günlük kuponlar
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition ${
                isDark 
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800' 
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-xl border transition ${
                isDark 
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white' 
                  : 'bg-white border-neutral-200 text-neutral-600 hover:text-black'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ANA SEKMELER: BUGÜNÜN KUPONLARI vs DÜNÜN SONUÇLARI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className={`p-1.5 rounded-2xl border inline-flex items-center gap-1.5 ${isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-neutral-200/80 border-neutral-300'}`}>
            <button
              onClick={() => setViewMode('today')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
                viewMode === 'today'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md shadow-amber-500/20'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Günün Canlı Kuponları ({data?.date || 'Bugün'})</span>
            </button>

            <button
              onClick={() => setViewMode('yesterday')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
                viewMode === 'yesterday'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md shadow-emerald-500/20'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Dünün Kupon Sonuçları ({data?.yesterday?.date || 'Dün'})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-400' : 'bg-neutral-100 border-neutral-200 text-neutral-700'}`}>
              📅 {viewMode === 'today' ? 'Bugünün Bülteni:' : 'Sonuçlanan Tarih:'} <strong className="text-amber-400">{viewMode === 'today' ? (data?.date || '06.10.2026') : (data?.yesterday?.date || '05.10.2026')}</strong>
            </span>
          </div>
        </div>

        {/* DÜNÜN SONUÇLARI KPI ÖZET KARTI */}
        {viewMode === 'yesterday' && data?.yesterday && (
          <div className={`p-5 sm:p-6 rounded-3xl border ${isDark ? 'bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-900/90 border-emerald-500/30' : 'bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-200'} shadow-2xl relative overflow-hidden`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Trophy className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    {data.yesterday.formattedDate} KUPON PERFORMANS RAPORU
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Dün Hazırlanan 4 Sistem Kuponundan Sonuçlar
                </h2>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-1 max-w-2xl`}>
                  Maçların tamamlanan İY ve MS skorları üzerinden Sistem 3, 4, 5 kombinasyonları otomatik hesaplanmış ve net kâr dökümü çıkarılmıştır.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className={`p-3.5 rounded-2xl border text-center ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">Toplam Kupon</div>
                  <div className="text-lg sm:text-xl font-black text-white mt-0.5">{data.yesterday.totalCoupons} Kupon</div>
                </div>

                <div className={`p-3.5 rounded-2xl border text-center ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">Kazanan Kupon</div>
                  <div className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">{data.yesterday.wonCoupons} Adet</div>
                </div>

                <div className={`p-3.5 rounded-2xl border text-center ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">Toplam Yatırılan</div>
                  <div className="text-lg sm:text-xl font-black text-neutral-300 mt-0.5">{data.yesterday.totalCost} TL</div>
                </div>

                <div className={`p-3.5 rounded-2xl border text-center ${isDark ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-emerald-100/50 border-emerald-300'}`}>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase">Toplam Kazanılan</div>
                  <div className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">{formatCurrency(data.yesterday.totalWonAmount)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GÜNÜN KUPONLARI BİLGİLENDİRME BANNERI */}
        {viewMode === 'today' && (
          <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-gradient-to-r from-amber-950/30 via-neutral-900/40 to-neutral-900/60 border-amber-500/20' : 'bg-gradient-to-r from-amber-50 via-white to-white border-amber-200'} relative overflow-hidden shadow-xl`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-amber-400 flex items-center gap-2">
                    <span>Neden Misli 1 Sistem Kuponu?</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-black">
                      80.000 TL - 200.000 TL Hedef
                    </span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-neutral-300' : 'text-neutral-600'} mt-1 leading-relaxed max-w-4xl`}>
                    Misli çarpanı basmadan (Misli 1 = 1 TL/kolon), 400 TL - 582 TL gibi makul bütçelerle 10 maçlık Sistem 3,4,5 veya 9 maçlık Sistem 3,4,5,6 kuruyoruz. <strong>3 veya 4 maç geldiğinde paranızı korur</strong>, 7 veya 8 maç patladığında ise <strong>80.000 TL ile 200.000 TL üzeri büyük vurgun</strong> sağlar!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KUPON SEÇİM SEKMELERİ (TABS) */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm font-semibold text-neutral-400">Kuponlar ve sonuçlar taranıyor...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(viewMode === 'today' ? data?.coupons : data?.yesterday?.coupons)?.map((coupon, idx) => {
                const isActive = activeCoupon?.id === coupon.id;
                let themeClasses = 'border-amber-500 bg-amber-500/10 text-amber-400';
                if (coupon.theme === 'purple') themeClasses = 'border-purple-500 bg-purple-500/10 text-purple-400';
                if (coupon.theme === 'cyan') themeClasses = 'border-cyan-500 bg-cyan-500/10 text-cyan-400';
                if (coupon.theme === 'emerald') themeClasses = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
                if (coupon.theme === 'indigo') themeClasses = 'border-indigo-500 bg-indigo-500/10 text-indigo-400';
                if (coupon.theme === 'rose') themeClasses = 'border-rose-500 bg-rose-500/10 text-rose-400';
                if (coupon.theme === 'blue') themeClasses = 'border-blue-500 bg-blue-500/10 text-blue-400';

                return (
                  <button
                    key={coupon.id}
                    onClick={() => {
                      if (viewMode === 'today') setActiveTodayCouponId(coupon.id);
                      else setActivePastCouponId(coupon.id);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                      isActive
                        ? `${themeClasses} shadow-lg shadow-black/40 ring-1 ring-amber-500/30`
                        : isDark
                        ? 'bg-neutral-900/70 border-neutral-800/80 hover:bg-neutral-800/80 text-neutral-300'
                        : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10">
                        {coupon.badge}
                      </span>
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-black/40 text-amber-400">
                        {coupon.cost} TL
                      </span>
                    </div>

                    <h4 className="text-sm font-black tracking-tight line-clamp-1 mb-1 group-hover:text-amber-400 transition">
                      {coupon.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] font-semibold opacity-75 mt-2">
                      <span>{coupon.totalMatches} Maç ({coupon.systemLabel})</span>
                      {viewMode === 'yesterday' ? (
                        <span className={`font-bold ${coupon.isWinner ? 'text-emerald-400' : 'text-neutral-400'}`}>
                          {coupon.hitCount}/{coupon.totalMatches} TUTTU
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold">{coupon.targetProfitBadge.split(' ')[0]} {coupon.targetProfitBadge.split(' ')[1]}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* SEÇİLİ KUPON DETAY PANELİ */}
            {activeCoupon && (
              <div className="space-y-6">
                {/* KUPON BAŞLIK VE KONTROL KARTI */}
                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-neutral-900/80 border-neutral-800/80' : 'bg-white border-neutral-200'} shadow-2xl backdrop-blur-md`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-800/60">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {activeCoupon.badge}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700/50">
                          {activeCoupon.systemLabel} (Misli {activeCoupon.misli})
                        </span>
                        {viewMode === 'yesterday' ? (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                            activeCoupon.isWinner 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}>
                            {activeCoupon.isWinner ? `✅ ${activeCoupon.wonAmount?.toLocaleString('tr-TR')} TL KAZANDI (${activeCoupon.hitCount}/${activeCoupon.totalMatches} Maç)` : `❌ ${activeCoupon.hitCount}/${activeCoupon.totalMatches} Maç Tuttu (İade Yok)`}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            🎯 {activeCoupon.targetProfitBadge}
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
                        <span>{activeCoupon.title}</span>
                      </h2>
                      <p className={`text-xs sm:text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'} mt-1`}>
                        {activeCoupon.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleCopyCoupon(activeCoupon)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-2 transition ${
                          copiedId === activeCoupon.id
                            ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                            : isDark
                            ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                            : 'bg-neutral-100 border-neutral-300 text-neutral-900 hover:bg-neutral-200'
                        }`}
                      >
                        {copiedId === activeCoupon.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-amber-400" />}
                        <span>{copiedId === activeCoupon.id ? 'Kupon Kopyalandı!' : 'Kuponu Kopyala'}</span>
                      </button>

                      <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-right">
                        <div className="text-[10px] uppercase font-bold text-neutral-400">Kupon Bedeli</div>
                        <div className="text-base font-black text-amber-400">{activeCoupon.cost} TL</div>
                      </div>
                    </div>
                  </div>

                  {/* KUPON İÇİ MAÇ LİSTESİ */}
                  <div className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                          <span>{viewMode === 'yesterday' ? 'Dünün Maç Sonuçları' : 'Kupon Maçları'} ({activeCoupon.matches.length} Maç)</span>
                          {viewMode === 'today' && (
                            <span className="text-[11px] font-normal text-neutral-500">(Kutucuklara tıklayarak canlı kazanç simülasyonu yapabilirsiniz)</span>
                          )}
                        </h3>
                      </div>

                      {viewMode === 'today' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => selectAllMatches(activeCoupon.id, activeCoupon.matches.length)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition"
                          >
                            Tümünü Seç
                          </button>
                          <button
                            onClick={() => clearSelectedMatches(activeCoupon.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-neutral-800 text-neutral-400 hover:text-white transition"
                          >
                            Temizle
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeCoupon.matches.map((m, idx) => {
                        const isSimHit = (selectedMatchIndices[activeCoupon.id] || new Set()).has(idx);
                        const isPastWon = m.won === true;

                        return (
                          <div
                            key={m.id || idx}
                            onClick={() => toggleMatchHit(activeCoupon.id, idx)}
                            className={`p-3.5 rounded-2xl border transition-all select-none relative overflow-hidden flex items-center justify-between gap-3 ${
                              viewMode === 'yesterday'
                                ? isPastWon
                                  ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                                  : 'bg-rose-950/20 border-rose-500/30 opacity-75'
                                : isSimHit
                                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/30 cursor-pointer'
                                : isDark
                                ? 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 cursor-pointer'
                                : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition ${
                                viewMode === 'yesterday'
                                  ? isPastWon
                                    ? 'bg-emerald-500 text-black'
                                    : 'bg-rose-500 text-white'
                                  : isSimHit
                                  ? 'bg-emerald-500 text-black'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {viewMode === 'yesterday' ? (
                                  isPastWon ? <Check className="w-4 h-4" strokeWidth={3} /> : <XCircle className="w-4 h-4" />
                                ) : isSimHit ? (
                                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                ) : (
                                  idx + 1
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                                    {m.league}
                                  </span>
                                  <span className="text-[10px] text-neutral-500 font-semibold">{m.date} • {m.time}</span>
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold truncate text-white mt-0.5">
                                  {m.homeTeam} <span className="text-neutral-500 font-normal">vs</span> {m.awayTeam}
                                </h4>
                                {m.score && (
                                  <p className="text-[11px] font-black text-amber-300 mt-0.5">
                                    Sonuç: {m.score} {m.iyScore ? `(İY: ${m.iyScore})` : ''}
                                  </p>
                                )}
                                {m.reason && !m.score && (
                                  <p className="text-[10px] text-neutral-400 truncate mt-0.5 font-medium">
                                    {m.reason}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black border ${
                                viewMode === 'yesterday'
                                  ? isPastWon
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : isSimHit
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}>
                                {m.choice}
                              </span>
                              <div className="text-xs font-black text-white mt-1">
                                Oran: {m.odd.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* BUGÜN İÇİN CANLI SİMÜLASYON KARTI */}
                    {viewMode === 'today' && (
                      <div className={`mt-5 p-4 sm:p-5 rounded-2xl border ${
                        simulatedPayout > 0
                          ? 'bg-gradient-to-r from-emerald-950/50 via-neutral-900 to-neutral-900 border-emerald-500/40 shadow-xl'
                          : isDark
                          ? 'bg-neutral-950/70 border-neutral-800'
                          : 'bg-neutral-100 border-neutral-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-3 rounded-xl ${simulatedPayout > 0 ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                              <Calculator className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-neutral-400">Canlı Simülasyon Durumu</div>
                              <div className="text-sm font-semibold text-white">
                                {(selectedMatchIndices[activeCoupon.id] || new Set()).size} Maç İşaretlendi
                                {simulatedPayout > 0 ? (
                                  <span className="text-emerald-400 font-bold ml-2">(Kupon Kazandı!)</span>
                                ) : (
                                  <span className="text-neutral-500 ml-2">(Kazanmak için en az {activeCoupon.systemSizes[0]} maç işaretleyin)</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-neutral-400 font-semibold">Anlık Kazanılan Tutar</div>
                            <div className="text-xl sm:text-2xl font-black text-emerald-400">
                              {formatCurrency(simulatedPayout)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* KURUŞU KURUŞUNA KAZANÇ TABLOSU */}
                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-neutral-900/80 border-neutral-800/80' : 'bg-white border-neutral-200'} shadow-2xl backdrop-blur-md`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-amber-400" />
                        <span>Kuruşu Kuruşuna Kazanç Tablosu ({activeCoupon.systemLabel})</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Tutan maç sayısına göre kupondaki maçların oranlarıyla hesaplanmış <strong>kesin minimum ve maksimum</strong> kazanç aralıkları.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'} font-bold uppercase text-[10px]`}>
                          <th className="py-3 px-3">Tutan Maç</th>
                          <th className="py-3 px-3">Kazanan Kuponlar</th>
                          <th className="py-3 px-3 text-right">En Az Kazanç (Dip)</th>
                          <th className="py-3 px-3 text-right">Ortalama Kazanç</th>
                          <th className="py-3 px-3 text-right text-emerald-400 font-black">En Çok Kazanç (Zirve)</th>
                          <th className="py-3 px-3 text-center">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 font-medium">
                        {activeCoupon.payoutTable.map((tier) => {
                          const isProfit = tier.minPayout >= activeCoupon.cost;
                          const isHugeWin = tier.maxPayout >= 80000;
                          const isYesterdayTierHit = viewMode === 'yesterday' && activeCoupon.hitCount === tier.hitCount;

                          return (
                            <tr
                              key={tier.hitCount}
                              className={`hover:bg-white/5 transition ${
                                isYesterdayTierHit
                                  ? 'bg-emerald-500/20 border-l-4 border-l-emerald-500 font-black'
                                  : isHugeWin
                                  ? 'bg-amber-500/10 font-bold'
                                  : isProfit
                                  ? 'bg-emerald-500/5'
                                  : ''
                              }`}
                            >
                              <td className="py-3.5 px-3 font-black text-white whitespace-nowrap">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs mr-2 font-black ${
                                  isYesterdayTierHit ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-amber-400'
                                }`}>
                                  {tier.hitCount}
                                </span>
                                Maç Tuttuğunda
                                {isYesterdayTierHit && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-black font-black">
                                    ⭐ DÜN TUTAN KADEME
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-neutral-400 whitespace-nowrap">
                                {tier.comboDetails}
                              </td>
                              <td className="py-3.5 px-3 text-right font-semibold text-neutral-200 whitespace-nowrap">
                                {formatCurrency(tier.minPayout)}
                              </td>
                              <td className="py-3.5 px-3 text-right font-semibold text-neutral-300 whitespace-nowrap">
                                {formatCurrency(tier.avgPayout)}
                              </td>
                              <td className="py-3.5 px-3 text-right font-black text-emerald-400 whitespace-nowrap text-sm sm:text-base">
                                {formatCurrency(tier.maxPayout)}
                              </td>
                              <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                {isYesterdayTierHit ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500 text-black shadow-md">
                                    KAZANÇ ALINDI
                                  </span>
                                ) : isHugeWin ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md">
                                    👑 BÜYÜK VURGUN
                                  </span>
                                ) : isProfit ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    KÂR BAŞLADI
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">
                                    Teselli İadesi
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SİSTEM REHBERİ VE TAKTİK NOTLARI */}
                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800/60' : 'bg-white border-neutral-200'} space-y-4`}>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>Sistem 3, 4, 5 Matematiği ve Altın Kurallar</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-300 leading-relaxed">
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                      <strong className="text-amber-400 block mb-1">1. Misli 1 Kuralı</strong>
                      Kupona 1'den fazla misli basılmaz. Bütçenin tamamı kombinasyon derinliğine (120 adet 3'lü, 210 adet 4'lü, 252 adet 5'li) harcanır. Böylece 10 maçın 7'si tuttuğunda 90 bin TL net kâr elde edilir.
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                      <strong className="text-emerald-400 block mb-1">2. Erken Kâr Emniyeti</strong>
                      10 maçtan sadece 3 tanesi geldiğinde 3'lü kombinasyon hemen para iadesine başlar. 4 maç geldiğinde ise 582 TL'lik maliyeti çıkarıp doğrudan kâra geçersiniz.
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                      <strong className="text-cyan-400 block mb-1">3. Karma Dağılım Avantajı</strong>
                      Sadece tek bir markete bağımlı kalmak yerine; İY/MS, Kombine (MS+Gol) ve Beraberlikleri birleştirmek kazanma frekansını 3 katına çıkarır.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
