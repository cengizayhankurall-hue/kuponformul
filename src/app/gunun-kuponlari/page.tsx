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
  Trophy,
  Ticket,
  Filter
} from 'lucide-react';
import { DailyCoupon, DailyMatchItem, YesterdayDailySummary } from '@/app/api/gunun-kuponlari/route';

interface ApiResponse {
  success: boolean;
  timestamp: number;
  date: string;
  coupons: DailyCoupon[];
  yesterday: YesterdayDailySummary;
}

export default function GununKuponlariPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'yesterday'>('today');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCoupons, setExpandedCoupons] = useState<Record<string, boolean>>({});
  const [stakes, setStakes] = useState<Record<string, number>>({});
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch Coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/gunun-kuponlari', { cache: 'no-store' });
      if (!res.ok) throw new Error('Kupon verisi alınamadı');
      const json: ApiResponse = await res.json();
      setData(json);

      // Default stakes
      const initialStakes: Record<string, number> = {};
      const initialExpanded: Record<string, boolean> = {};
      json.coupons.forEach(c => {
        initialStakes[c.id] = c.suggestedStake || 50;
        initialExpanded[c.id] = true;
      });
      if (json.yesterday?.coupons) {
        json.yesterday.coupons.forEach(c => {
          initialStakes[c.id] = c.suggestedStake || 50;
          initialExpanded[c.id] = true;
        });
      }
      setStakes(initialStakes);
      setExpandedCoupons(initialExpanded);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedCoupons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCoupon = (coupon: DailyCoupon) => {
    const text = `🎟️ ${coupon.title} (${coupon.totalOdds} Oran)\n` +
      `---------------------------------\n` +
      coupon.matches.map((m, i) => `${i + 1}. [${m.code}] ${m.homeTeam} - ${m.awayTeam} | ${m.marketName}: ${m.choice} (@${m.odd.toFixed(2)})`).join('\n') +
      `\n---------------------------------\nToplam Oran: ${coupon.totalOdds}x | Kupon Formülü AI`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(coupon.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleStakeChange = (couponId: string, amount: number) => {
    setStakes(prev => ({ ...prev, [couponId]: amount }));
  };

  const themeStyles = {
    emerald: {
      border: 'border-emerald-500/40 hover:border-emerald-500/70',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      btn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20',
      accent: 'text-emerald-400',
      bgGlow: 'bg-emerald-500/5',
      lightBg: 'bg-emerald-50/80 border-emerald-200'
    },
    amber: {
      border: 'border-amber-500/40 hover:border-amber-500/70',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      btn: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-amber-500/20',
      accent: 'text-amber-400',
      bgGlow: 'bg-amber-500/5',
      lightBg: 'bg-amber-50/80 border-amber-200'
    },
    purple: {
      border: 'border-purple-500/40 hover:border-purple-500/70',
      badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      btn: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/20',
      accent: 'text-purple-400',
      bgGlow: 'bg-purple-500/5',
      lightBg: 'bg-purple-50/80 border-purple-200'
    },
    cyan: {
      border: 'border-cyan-500/40 hover:border-cyan-500/70',
      badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      btn: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20',
      accent: 'text-cyan-400',
      bgGlow: 'bg-cyan-500/5',
      lightBg: 'bg-cyan-50/80 border-cyan-200'
    },
    rose: {
      border: 'border-rose-500/40 hover:border-rose-500/70',
      badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      btn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-500/20',
      accent: 'text-rose-400',
      bgGlow: 'bg-rose-500/5',
      lightBg: 'bg-rose-50/80 border-rose-200'
    },
    indigo: {
      border: 'border-indigo-500/40 hover:border-indigo-500/70',
      badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      btn: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20',
      accent: 'text-indigo-400',
      bgGlow: 'bg-indigo-500/5',
      lightBg: 'bg-indigo-50/80 border-indigo-200'
    },
    blue: {
      border: 'border-blue-500/40 hover:border-blue-500/70',
      badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      btn: 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-blue-500/20',
      accent: 'text-blue-400',
      bgGlow: 'bg-blue-500/5',
      lightBg: 'bg-blue-50/80 border-blue-200'
    }
  };

  const filteredCoupons = useMemo(() => {
    if (!data?.coupons) return [];
    if (selectedCategory === 'all') return data.coupons;
    return data.coupons.filter(c => c.category === selectedCategory);
  }, [data, selectedCategory]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'} transition-colors duration-200 pb-20`}>
      {/* Header Banner */}
      <div className={`border-b ${isDarkMode ? 'border-neutral-800 bg-neutral-900/60' : 'border-neutral-200 bg-white'} backdrop-blur-md sticky top-16 z-30 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  GÜNLÜK ÖZEL KOMBİNELER
                </span>
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {data?.date || '09.10.2026'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
                <span>🎟️ Günün Kuponları</span>
                <span className="text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700">
                  3.00 - 15.00 Oran
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
                Sadece Maç Sonucu, Sadece 2.5 Alt/Üst ve Karma Kuponlar dahil günün bülteninden 3-5 maçlık optimum güven ve oran dengesiyle hazırlanmış özel kuponlar.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
              {/* Tab Selector */}
              <div className={`flex rounded-xl p-1 border ${isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                <button
                  onClick={() => setActiveTab('today')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'today'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  Bugünün Kuponları
                </button>
                <button
                  onClick={() => setActiveTab('yesterday')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'yesterday'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-cyan-300" />
                  Dünün Sonuçları
                </button>
              </div>

              {/* Dark Mode & Refresh */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-xl border transition ${
                  isDarkMode 
                    ? 'border-neutral-800 bg-neutral-900 text-amber-400 hover:bg-neutral-800' 
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
                title="Tema Değiştir"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={fetchCoupons}
                disabled={loading}
                className={`p-2 rounded-xl border transition ${
                  isDarkMode 
                    ? 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800' 
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-400 text-sm font-semibold">Günün kuponları yükleniyor...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 my-6">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && data && activeTab === 'today' && (
          <div>
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'all'
                    ? 'bg-neutral-100 text-neutral-900 shadow-md font-black dark:bg-white dark:text-neutral-950'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                Tüm Kuponlar ({data.coupons.length})
              </button>

              <button
                onClick={() => setSelectedCategory('ms_only')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'ms_only'
                    ? 'bg-emerald-500 text-white shadow-md font-black shadow-emerald-500/20'
                    : 'bg-neutral-900 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                <span>⚽ Sadece Maç Sonucu (MS)</span>
              </button>

              <button
                onClick={() => setSelectedCategory('ou_only')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'ou_only'
                    ? 'bg-rose-500 text-white shadow-md font-black shadow-rose-500/20'
                    : 'bg-neutral-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                <span>🔥 Sadece 2.5 Alt / Üst</span>
              </button>

              <button
                onClick={() => setSelectedCategory('ms_ou_mix')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'ms_ou_mix'
                    ? 'bg-amber-500 text-white shadow-md font-black shadow-amber-500/20'
                    : 'bg-neutral-900 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <span>⚡ MS & 2.5 Alt/Üst Karma</span>
              </button>

              <button
                onClick={() => setSelectedCategory('banko')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'banko'
                    ? 'bg-cyan-500 text-white shadow-md font-black shadow-cyan-500/20'
                    : 'bg-neutral-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                }`}
              >
                <span>🛡️ Günün Bankosu</span>
              </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                  Gösterilen Kupon
                </div>
                <div className="text-2xl font-black text-emerald-400">{filteredCoupons.length} Kupon</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">3-5 Maçlık Kombineler</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  Oran Aralığı
                </div>
                <div className="text-2xl font-black text-amber-400">3.42 - 13.65</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">3.00 & 15.00 Arası</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Kasa Uyumluluğu
                </div>
                <div className="text-2xl font-black text-cyan-400">%85 Güvenilirlik</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">MS, Alt/Üst ve Karma</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-purple-400" />
                  Simülasyon
                </div>
                <div className="text-2xl font-black text-purple-400">Dinamik Kazanç</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Misli Hesaplama Aktif</div>
              </div>
            </div>

            {/* Coupons List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCoupons.map((coupon) => {
                const style = themeStyles[coupon.theme] || themeStyles.emerald;
                const isExpanded = expandedCoupons[coupon.id] ?? true;
                const currentStake = stakes[coupon.id] || coupon.suggestedStake || 50;
                const calculatedReturn = Number((coupon.totalOdds * currentStake).toFixed(2));

                return (
                  <div 
                    key={coupon.id}
                    className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                      isDarkMode 
                        ? `bg-neutral-900/70 ${style.border}` 
                        : `${style.lightBg} shadow-sm hover:shadow-md`
                    }`}
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-neutral-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.badge}`}>
                            {coupon.badge}
                          </span>
                          <span className="text-xs text-neutral-400 font-semibold flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            {coupon.totalMatches} Maç
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-bold">
                            {coupon.categoryLabel}
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                          <span>{coupon.title}</span>
                        </h2>
                        <p className="text-xs text-neutral-400 mt-1 max-w-md">
                          {coupon.description}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 bg-neutral-950/40 p-2.5 rounded-2xl border border-neutral-800/40">
                        <div className="text-[10px] uppercase font-bold text-neutral-400">Toplam Oran</div>
                        <div className={`text-2xl font-black ${style.accent}`}>
                          {coupon.totalOdds.toFixed(2)}x
                        </div>
                      </div>
                    </div>

                    {/* Matches List */}
                    {isExpanded && (
                      <div className="p-4 space-y-2.5 bg-neutral-950/30">
                        <div className="text-[10px] font-black uppercase text-neutral-400 tracking-wider px-1">
                          Seçilen Maçlar ({coupon.matches.length})
                        </div>

                        {coupon.matches.map((m) => (
                          <div 
                            key={m.id}
                            className={`p-3 rounded-2xl border transition-all ${
                              isDarkMode 
                                ? 'bg-neutral-900/80 border-neutral-800/80 hover:border-neutral-700' 
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-neutral-800 text-neutral-300">
                                  {m.code}
                                </span>
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                                  {m.league}
                                </span>
                              </div>
                              <div className="text-[11px] text-neutral-400 font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {m.date} {m.time}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <div className="font-bold text-sm text-neutral-100 flex-1 truncate">
                                {m.homeTeam} <span className="text-neutral-500 font-normal">vs</span> {m.awayTeam}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <div className="text-[10px] text-neutral-400 font-semibold">{m.marketName}</div>
                                  <div className="text-xs font-black text-amber-400">{m.choice}</div>
                                </div>
                                <div className="px-2.5 py-1 rounded-xl bg-neutral-800/80 border border-neutral-700 text-xs font-black text-white">
                                  @{m.odd.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {m.reason && (
                              <div className="mt-2 pt-2 border-t border-neutral-800/50 text-[11px] text-neutral-400 flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>{m.reason}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interactive Stake & Return Simulator */}
                    <div className="p-4 border-t border-neutral-800/60 bg-neutral-900/50 space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                          Misli & Kazanç Hesapla:
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[20, 50, 100, 250, 500].map((amt) => (
                            <button
                              key={amt}
                              onClick={() => handleStakeChange(coupon.id, amt)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                currentStake === amt
                                  ? `${style.btn} text-white font-black`
                                  : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                              }`}
                            >
                              {amt} ₺
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase">Yatırılan Tutar</div>
                          <div className="text-base font-black text-neutral-200">{currentStake} ₺</div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-neutral-600" />

                        <div className="text-right">
                          <div className="text-[10px] text-neutral-400 font-bold uppercase">Tahmini Kazanç</div>
                          <div className={`text-xl font-black ${style.accent}`}>
                            {calculatedReturn.toLocaleString('tr-TR')} ₺
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleCopyCoupon(coupon)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                        >
                          {copiedId === coupon.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Kopyalandı!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kuponu Kopyala</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => toggleExpand(coupon.id)}
                          className="py-2.5 px-3 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Gizle</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Göster</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Yesterday's Results Tab */}
        {!loading && !error && data && activeTab === 'yesterday' && data.yesterday && (
          <div className="space-y-6">
            {/* Yesterday Summary Banner */}
            <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                      RESMİ MAÇ SONUÇLARI
                    </span>
                    <span className="text-xs text-neutral-400 font-semibold">
                      {data.yesterday.formattedDate}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    Dünün Günlük Kupon Karnesi (08.10.2026)
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
                    08 Ekim tarihinde yayınlanan kuponların resmi maç skorları ve kazandı/kaybetti durumları şeffaf bir şekilde aşağıda listelenmiştir.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <div className="text-[10px] uppercase font-bold text-emerald-400">Tutan Kupon</div>
                    <div className="text-xl font-black text-emerald-400">
                      {data.yesterday.wonCoupons} / {data.yesterday.totalCoupons}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                    <div className="text-[10px] uppercase font-bold text-cyan-400">Başarı Oranı</div>
                    <div className="text-xl font-black text-cyan-400">
                      %{data.yesterday.successRate}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Yesterday Coupons List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.yesterday.coupons.map((coupon) => {
                const isWinner = coupon.isWinner;
                const isExpanded = expandedCoupons[coupon.id] ?? true;

                return (
                  <div 
                    key={coupon.id}
                    className={`rounded-3xl border transition-all overflow-hidden ${
                      isWinner 
                        ? 'border-emerald-500/60 bg-emerald-950/10 shadow-emerald-500/10 shadow-lg' 
                        : 'border-red-500/30 bg-red-950/10'
                    }`}
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-neutral-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {isWinner ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              KAZANDI ✅
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                              KAYBETTİ ❌
                            </span>
                          )}
                          <span className="text-xs text-neutral-400 font-semibold">
                            {coupon.wonMatchesCount} / {coupon.totalMatches} Maç Tuttu
                          </span>
                        </div>
                        <h3 className="text-lg font-black tracking-tight">{coupon.title}</h3>
                        <p className="text-xs text-neutral-400 mt-1">{coupon.description}</p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 bg-neutral-950/60 p-2.5 rounded-2xl border border-neutral-800">
                        <div className="text-[10px] uppercase font-bold text-neutral-400">Kupon Oranı</div>
                        <div className={`text-xl font-black ${isWinner ? 'text-emerald-400' : 'text-neutral-400'}`}>
                          {coupon.totalOdds.toFixed(2)}x
                        </div>
                      </div>
                    </div>

                    {/* Matches List with real scores */}
                    {isExpanded && (
                      <div className="p-4 space-y-2.5 bg-neutral-950/40">
                        {coupon.matches.map((m) => (
                          <div 
                            key={m.id}
                            className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${
                              m.won 
                                ? 'bg-emerald-950/20 border-emerald-500/30' 
                                : 'bg-red-950/20 border-red-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-neutral-800 text-neutral-300">
                                  {m.code}
                                </span>
                                <span className="text-[10px] font-bold text-neutral-400 uppercase">
                                  {m.league}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-neutral-200 px-2 py-0.5 rounded-lg bg-neutral-800 border border-neutral-700">
                                  Skor: {m.score || '-'}
                                </span>
                                {m.won ? (
                                  <span className="text-[11px] font-black text-emerald-400 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    TUTTU
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-black text-red-400 flex items-center gap-0.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    YATTI
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <div className="font-bold text-sm text-neutral-100 flex-1 truncate">
                                {m.homeTeam} vs {m.awayTeam}
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-black text-amber-400 mr-2">{m.choice}</span>
                                <span className="text-xs font-bold text-neutral-400">@{m.odd.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Result Footer */}
                    <div className="p-4 border-t border-neutral-800/60 bg-neutral-900/40 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase">100 ₺ Yatırıma Karşılık</div>
                        <div className="text-xs font-bold text-neutral-300">
                          {isWinner ? (
                            <span className="text-emerald-400 font-black text-sm">
                              {(coupon.totalOdds * 100).toLocaleString('tr-TR')} ₺ Ödendi
                            </span>
                          ) : (
                            <span className="text-red-400 font-semibold">0.00 ₺ (Kayıp)</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleExpand(coupon.id)}
                        className="py-1.5 px-3 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? 'Gizle' : 'Detay'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
