'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Zap, 
  Target, 
  History, 
  Award, 
  Sun, 
  Moon, 
  SlidersHorizontal, 
  HelpCircle,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Clock,
  Layers,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { MatchIyMsAnalysis, IyMsOutcomeStats, PastSimilarMatch, IyMsPastMatch } from '../api/iy-ms-analizi/route';

interface IyMsApiResponse {
  success: boolean;
  timestamp: number;
  availableDates: string[];
  availableLeagues: string[];
  stats: { totalAnalyzed: number; highConfidenceCount: number; surpriseCount: number };
  matches: MatchIyMsAnalysis[];
  pastStats?: {
    date: string;
    totalFinished: number;
    topHitCount: number;
    topHitRate: number;
    surpriseHitCount: number;
    outcomeCounts: Record<string, number>;
  };
  pastMatches?: IyMsPastMatch[];
}

export default function IyMsAnaliziPage() {
  const [data, setData] = useState<IyMsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // View Mode: 'all' (Bülten + Dünün Sonuçları), 'upcoming' (Sadece Gelecek), 'past' (Dünün Sonuçları)
  const [viewMode, setViewMode] = useState<'all' | 'upcoming' | 'past'>('all');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'high_confidence' | 'surprise' | 'x_fav' | 'fav_direct'>('all');
  const [selectedUpcomingDate, setSelectedUpcomingDate] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded past matches cards
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});

  // Manuel Simulator State
  const [showSimulator, setShowSimulator] = useState(false);
  const [simOdds, setSimOdds] = useState({
    ms1: '1.45',
    ms0: '3.60',
    ms2: '5.00',
    iy1: '1.95',
    iy0: '2.20',
    iy2: '5.00'
  });
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const url = forceRefresh ? '/api/iy-ms-analizi?refresh=true' : '/api/iy-ms-analizi';
      const res = await fetch(url);
      const json: IyMsApiResponse = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('İY/MS Analizi veri çekme hatası:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    try {
      const res = await fetch('/api/iy-ms-analizi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simOdds)
      });
      const json = await res.json();
      if (json.success) {
        setSimResult(json);
      }
    } catch (err) {
      console.error('Simülasyon hatası:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const toggleExpand = (matchId: string) => {
    setExpandedMatches(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  // Format Date Helper
  const formatTurkishDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [d, m, y] = dateStr.split('.').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        weekday: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered Upcoming Matches (Sadece sampleSize > 0 olanlar)
  const filteredUpcomingMatches = useMemo(() => {
    if (!data?.matches) return [];

    return data.matches.filter(m => {
      // 0 Benzer Maç Olanları Kesinlikle Gösterme
      if ((m.sampleSize || 0) < 1) return false;

      // 1. Category Filter
      if (categoryFilter === 'high_confidence') {
        if ((m.topOutcome?.rate || 0) < 45) return false;
      } else if (categoryFilter === 'surprise') {
        if (!m.surpriseOutcome) return false;
      } else if (categoryFilter === 'x_fav') {
        const topKey = m.topOutcome?.key;
        if (topKey !== 'X/1' && topKey !== 'X/2') return false;
      } else if (categoryFilter === 'fav_direct') {
        const topKey = m.topOutcome?.key;
        if (topKey !== '1/1' && topKey !== '2/2') return false;
      }

      // 2. Date Filter
      if (selectedUpcomingDate !== 'all' && m.date !== selectedUpcomingDate) return false;

      // 3. League Filter
      if (selectedLeague !== 'all' && m.league !== selectedLeague) return false;

      // 4. Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inHome = m.homeTeam.toLowerCase().includes(q);
        const inAway = m.awayTeam.toLowerCase().includes(q);
        const inLeague = m.league.toLowerCase().includes(q);
        if (!inHome && !inAway && !inLeague) return false;
      }

      return true;
    });
  }, [data, categoryFilter, selectedUpcomingDate, selectedLeague, searchTerm]);

  // Filtered Past Matches (Dünün Sonuçları)
  const filteredPastMatches = useMemo(() => {
    if (!data?.pastMatches) return [];

    return data.pastMatches.filter(m => {
      // 0 Benzer Maç Olanları Kesinlikle Gösterme
      if ((m.sampleSize || 0) < 1) return false;

      // 1. Category Filter
      if (categoryFilter === 'high_confidence') {
        if ((m.topOutcome?.rate || 0) < 45) return false;
      } else if (categoryFilter === 'surprise') {
        if (!m.surpriseOutcome) return false;
      } else if (categoryFilter === 'x_fav') {
        const topKey = m.topOutcome?.key;
        if (topKey !== 'X/1' && topKey !== 'X/2') return false;
      } else if (categoryFilter === 'fav_direct') {
        const topKey = m.topOutcome?.key;
        if (topKey !== '1/1' && topKey !== '2/2') return false;
      }

      // 2. League Filter
      if (selectedLeague !== 'all' && m.league !== selectedLeague) return false;

      // 3. Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inHome = m.homeTeam.toLowerCase().includes(q);
        const inAway = m.awayTeam.toLowerCase().includes(q);
        const inLeague = m.league.toLowerCase().includes(q);
        if (!inHome && !inAway && !inLeague) return false;
      }

      return true;
    });
  }, [data, categoryFilter, selectedLeague, searchTerm]);

  // Combined Matches depending on viewMode
  const displayedMatches = useMemo(() => {
    if (viewMode === 'upcoming') {
      return filteredUpcomingMatches.map(m => ({ ...m, isPastMatch: false }));
    }
    if (viewMode === 'past') {
      return filteredPastMatches.map(m => ({ ...m, isPastMatch: true }));
    }
    // 'all' -> Past matches first or mixed
    const past = filteredPastMatches.map(m => ({ ...m, isPastMatch: true }));
    const upcoming = filteredUpcomingMatches.map(m => ({ ...m, isPastMatch: false }));
    return [...past, ...upcoming];
  }, [viewMode, filteredUpcomingMatches, filteredPastMatches]);

  // Date Counts for Upcoming Matches
  const dateCounts = useMemo(() => {
    if (!data?.matches) return {};
    const validMatches = data.matches.filter(m => (m.sampleSize || 0) > 0);
    const counts: Record<string, number> = { all: validMatches.length };
    validMatches.forEach(m => {
      if (m.date) {
        counts[m.date] = (counts[m.date] || 0) + 1;
      }
    });
    return counts;
  }, [data]);

  const OUTCOME_LABELS: Record<string, string> = {
    '1/1': 'İY 1 / MS 1',
    'X/1': 'İY X / MS 1',
    '2/1': 'İY 2 / MS 1',
    '1/X': 'İY 1 / MS X',
    'X/X': 'İY X / MS X',
    '2/X': 'İY 2 / MS X',
    '1/2': 'İY 1 / MS 2',
    'X/2': 'İY X / MS 2',
    '2/2': 'İY 2 / MS 2'
  };

  const getIyMsEstimatedOdds = (ms1: number, ms0: number, ms2: number, iy1: number, iy0: number, iy2: number): Record<string, number> => {
    const m1 = ms1 || 2.0;
    const m0 = ms0 || 3.0;
    const m2 = ms2 || 3.0;
    const i1 = iy1 || (m1 < 2 ? m1 * 1.25 : 2.6);
    const i0 = iy0 || (m0 < 3 ? 1.9 : 2.1);
    const i2 = iy2 || (m2 < 2 ? m2 * 1.25 : 3.4);

    return {
      '1/1': Number(Math.max(1.15, (i1 * 0.78) + (m1 * 0.38)).toFixed(2)),
      'X/1': Number(Math.max(3.20, (i0 * 0.92) + (m1 * 1.75)).toFixed(2)),
      '2/1': Number(Math.max(18.0, (i2 * 3.0) + (m1 * 3.5)).toFixed(2)),
      '1/X': Number(Math.max(11.0, (i1 * 3.0) + (m0 * 2.0)).toFixed(2)),
      'X/X': Number(Math.max(3.30, (i0 * 1.10) + (m0 * 0.60)).toFixed(2)),
      '2/X': Number(Math.max(11.0, (i2 * 3.0) + (m0 * 2.0)).toFixed(2)),
      '1/2': Number(Math.max(18.0, (i1 * 3.0) + (m2 * 3.5)).toFixed(2)),
      'X/2': Number(Math.max(3.20, (i0 * 0.92) + (m2 * 1.75)).toFixed(2)),
      '2/2': Number(Math.max(1.15, (i2 * 0.78) + (m2 * 0.38)).toFixed(2))
    };
  };

  const pastStats = data?.pastStats;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        
        {/* HERO HEADER */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 mb-6 transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/20 border-slate-800 shadow-2xl' 
            : 'bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/30 border-slate-200 shadow-md'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm ${
                  isDark ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                }`}>
                  <Zap className="w-3.5 h-3.5" />
                  388.000+ Geçmiş Maç Hafızası
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  6'lı Oran Kombinasyonu (MS + İY)
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                  isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-200'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  9 İhtimalli İY/MS Tahmin Robotu
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                <span>⚡ İlk Yarı / Maç Sonu (İY/MS) Analizi</span>
              </h1>
              
              <p className={`text-xs sm:text-sm max-w-3xl ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                Günün bültenindeki maçların <strong>MS 1 - X - 2</strong> ve <strong>İY 1 - X - 2</strong> oran kombinasyonlarını, geçmiş 388.000+ maçlık arşivle birebir eşleştirerek <strong>1/1, X/1, 2/1, 1/X, 1/2 vb. 9 sonucun</strong> matematiksel dağılımını hesaplar.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-center flex-wrap">
              <button
                onClick={() => setShowSimulator(prev => !prev)}
                className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                  showSimulator
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/30 shadow-lg'
                    : isDark
                      ? 'bg-slate-900/80 border-slate-800 text-indigo-400 hover:bg-slate-800'
                      : 'bg-white border-slate-300 text-indigo-600 hover:bg-slate-100'
                }`}
                title="Manuel Oran Simülatörünü Aç/Kapat"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{showSimulator ? 'Simülatörü Gizle' : 'Manuel Oran Simülatörü'}</span>
              </button>

              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
                title="Bülteni Yeniden Tara"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
                <span>{refreshing ? 'Taranıyor...' : 'Yenile'}</span>
              </button>

              <button
                onClick={() => setIsDark(prev => !prev)}
                className={`p-2.5 rounded-2xl border transition duration-150 cursor-pointer shadow-sm flex items-center justify-center ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-800 text-yellow-400 hover:bg-slate-800'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
                title={isDark ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5 text-slate-700" />}
              </button>
            </div>
          </div>

          {/* MANUEL ORAN SİMÜLATÖRÜ PANELİ */}
          {showSimulator && (
            <div className={`mt-6 pt-6 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-black/40 border-indigo-900/40' : 'bg-indigo-50/50 border-indigo-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400">
                      Özel Oran Simülatörü (Dilediğin 6 Oranı Gir, 388.000 Maçı Tara)
                    </h3>
                  </div>
                </div>

                <form onSubmit={handleSimulate} className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div>
                      <label className="text-[11px] font-bold block mb-1 opacity-70">MS 1 Oranı</label>
                      <input
                        type="number"
                        step="0.01"
                        value={simOdds.ms1}
                        onChange={e => setSimOdds(p => ({ ...p, ms1: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl text-sm font-bold border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                        placeholder="Örn: 1.45"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1 opacity-70">MS 0 (X) Oranı</label>
                      <input
                        type="number"
                        step="0.01"
                        value={simOdds.ms0}
                        onChange={e => setSimOdds(p => ({ ...p, ms0: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl text-sm font-bold border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                        placeholder="Örn: 3.60"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1 opacity-70">MS 2 Oranı</label>
                      <input
                        type="number"
                        step="0.01"
                        value={simOdds.ms2}
                        onChange={e => setSimOdds(p => ({ ...p, ms2: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl text-sm font-bold border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                        placeholder="Örn: 5.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1 opacity-70 text-cyan-400">İY 1 Oranı</label>
                      <input
                        type="number"
                        step="0.01"
                        value={simOdds.iy1}
                        onChange={e => setSimOdds(p => ({ ...p, iy1: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl text-sm font-bold border ${
                          isDark ? 'bg-slate-900 border-cyan-800 text-cyan-300' : 'bg-white border-cyan-300 text-cyan-800'
                        }`}
                        placeholder="Örn: 1.95"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1 opacity-70 text-cyan-400">İY 0 (X) Oranı</label>
                      <input
                        type="number"
                        step="0.01"
                        value={simOdds.iy0}
                        onChange={e => setSimOdds(p => ({ ...p, iy0: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl text-sm font-bold border ${
                          isDark ? 'bg-slate-900 border-cyan-800 text-cyan-300' : 'bg-white border-cyan-300 text-cyan-800'
                        }`}
                        placeholder="Örn: 2.20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1 opacity-70 text-cyan-400">İY 2 Oranı</label>
                      <input
                        type="number"
                        step="0.01"
                        value={simOdds.iy2}
                        onChange={e => setSimOdds(p => ({ ...p, iy2: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl text-sm font-bold border ${
                          isDark ? 'bg-slate-900 border-cyan-800 text-cyan-300' : 'bg-white border-cyan-300 text-cyan-800'
                        }`}
                        placeholder="Örn: 5.00"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={simLoading}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition cursor-pointer shadow-md flex items-center gap-2"
                    >
                      {simLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>{simLoading ? 'Arşiv Taranıyor...' : 'Geçmiş Maçları Analiz Et'}</span>
                    </button>
                  </div>
                </form>

                {/* SİMÜLASYON SONUÇLARI */}
                {simResult && (
                  <div className="mt-5 pt-5 border-t border-indigo-900/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-emerald-400">
                        ✅ Eşleşen {simResult.sampleSize} Geçmiş Maç Bulundu ({simResult.matchTier === 'exact_ms_iy' ? 'Birebir MS+İY Eşleşmesi' : 'Yakın Oran Eşleşmesi'})
                      </span>
                      {simResult.topOutcome && (
                        <span className="text-xs font-bold">
                          En Yüksek İhtimal: <strong className="text-amber-400 text-sm">{simResult.topOutcome.key} (%{simResult.topOutcome.rate})</strong>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                      {['1/1', 'X/1', '2/1', '1/X', 'X/X', '2/X', '1/2', 'X/2', '2/2'].map((key) => {
                        const stat = simResult.stats?.[key] || { rate: 0, count: 0 };
                        const isTop = simResult.topOutcome?.key === key;
                        const isSurprise = ['1/X', '2/X', '1/2', '2/1'].includes(key) && stat.rate >= 12;
                        const estOdds = getIyMsEstimatedOdds(
                          parseFloat(simOdds.ms1) || 0,
                          parseFloat(simOdds.ms0) || 0,
                          parseFloat(simOdds.ms2) || 0,
                          parseFloat(simOdds.iy1) || 0,
                          parseFloat(simOdds.iy0) || 0,
                          parseFloat(simOdds.iy2) || 0
                        );

                        return (
                          <div
                            key={key}
                            className={`p-2.5 rounded-xl border text-center transition ${
                              isTop
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 ring-2 ring-amber-500/30'
                                : isSurprise
                                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 ring-1 ring-purple-500/30'
                                  : isDark
                                    ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                                    : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="text-[11px] font-black">{key}</div>
                            <div className="text-base font-black mt-0.5">%{stat.rate}</div>
                            <div className="text-[11px] font-black text-emerald-400 my-0.5">
                              {estOdds[key] ? estOdds[key].toFixed(2) : '-'}
                            </div>
                            <div className="text-[9px] opacity-70 font-semibold">{stat.count} Maç</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE TABS (Tümünü Göster / Gelecek Bülten / Dünün Sonuçları) */}
          <div className="flex items-center gap-2.5 mt-6 pt-5 border-t border-slate-800/40 flex-wrap">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
                viewMode === 'all'
                  ? isDark
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-indigo-500/20 shadow-lg'
                    : 'bg-slate-900 text-white shadow-md'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tümünü Göster (Bülten + Dünün Sonuçları)</span>
            </button>

            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
                viewMode === 'upcoming'
                  ? isDark
                    ? 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg'
                    : 'bg-indigo-600 text-white shadow-md'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Gelecek Bülten ({filteredUpcomingMatches.length})</span>
            </button>

            <button
              onClick={() => setViewMode('past')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
                viewMode === 'past'
                  ? isDark
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 shadow-lg font-black'
                    : 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Dünün Sonuçları ({data?.pastMatches?.length || 0})</span>
            </button>
          </div>

          {/* DÜNÜN İY/MS BAŞARI KARNESİ */}
          {(viewMode === 'all' || viewMode === 'past') && pastStats && (
            <div className={`mt-6 pt-5 border-t border-slate-800/40`}>
              <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
                <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  <Award className="w-4 h-4 text-amber-500" />
                  Dünün ({pastStats.date}) İY/MS Sonuç Karnesi ({pastStats.totalFinished} Biten Maç)
                </span>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Top Tahmin İsabeti: <strong className="text-emerald-400 text-sm">%{pastStats.topHitRate}</strong> ({pastStats.topHitCount}/{pastStats.totalFinished})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                <div className={`p-3.5 rounded-2xl border text-center transition ${isDark ? 'bg-emerald-950/30 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200 shadow-sm'}`}>
                  <div className="text-[11px] font-bold text-emerald-400 mb-0.5">Top Tahmin İsabeti</div>
                  <div className="text-2xl font-black text-emerald-400">%{pastStats.topHitRate}</div>
                  <div className="text-[10px] opacity-70 font-semibold">{pastStats.topHitCount} / {pastStats.totalFinished} Maç</div>
                </div>

                <div className={`p-3.5 rounded-2xl border text-center transition ${isDark ? 'bg-purple-950/30 border-purple-900/40' : 'bg-purple-50 border-purple-200 shadow-sm'}`}>
                  <div className="text-[11px] font-bold text-purple-400 mb-0.5">Sürpriz İsabeti</div>
                  <div className="text-2xl font-black text-purple-400">{pastStats.surpriseHitCount}</div>
                  <div className="text-[10px] opacity-70 font-semibold">1/X, 2/X, 1/2, 2/1</div>
                </div>

                {/* Outcome counts breakdown */}
                {['1/1', 'X/1', '2/1', '1/2'].map((oc) => (
                  <div key={oc} className={`p-3.5 rounded-2xl border text-center transition ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="text-[11px] font-bold text-slate-400 mb-0.5">{oc} Gelen</div>
                    <div className="text-2xl font-black text-amber-400">{pastStats.outcomeCounts?.[oc] || 0}</div>
                    <div className="text-[10px] opacity-70 font-semibold">Maç</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* İSTATİSTİK ÖZET ROZETLERİ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/40">
            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50 border-indigo-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-indigo-400">Gelecek Bülten Maçı</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">{filteredUpcomingMatches.length}</div>
              <div className="text-[10px] opacity-70 font-semibold">MS + İY Oranları Açık</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50 border-amber-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-amber-400">Yüksek Güvenilirlik (%45+)</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{data?.stats?.highConfidenceCount || 0}</div>
              <div className="text-[10px] opacity-70 font-semibold">Geçmişte En Çok Gelenler</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-purple-950/20 border-purple-900/40' : 'bg-purple-50 border-purple-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-purple-400">Yüksek Oranlı Sürprizler</div>
              <div className="text-2xl font-black text-purple-400 mt-1">{data?.stats?.surpriseCount || 0}</div>
              <div className="text-[10px] opacity-70 font-semibold">1/X, 2/X, 1/2, 2/1 Fırsatları</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-emerald-400">Taranan Arşiv</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">388.879</div>
              <div className="text-[10px] opacity-70 font-semibold">Bitmiş Resmi Maç</div>
            </div>
          </div>
        </div>

        {/* KATEGORİ SEÇİM SEKMELERİ */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
              categoryFilter === 'all'
                ? isDark ? 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg' : 'bg-slate-900 text-white'
                : isDark ? 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Tüm Maçlar</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              categoryFilter === 'all' ? 'bg-white/20 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-700'
            }`}>
              {displayedMatches.length}
            </span>
          </button>

          <button
            onClick={() => setCategoryFilter('high_confidence')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
              categoryFilter === 'high_confidence'
                ? isDark ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 shadow-lg' : 'bg-amber-500 text-slate-950'
                : isDark ? 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>En Güçlü İhtimaller (%45+)</span>
          </button>

          <button
            onClick={() => setCategoryFilter('surprise')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
              categoryFilter === 'surprise'
                ? isDark ? 'bg-purple-600 text-white shadow-purple-500/20 shadow-lg' : 'bg-purple-600 text-white'
                : isDark ? 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Bombayı Patlat (1/X, 2/1, 1/2)</span>
          </button>

          <button
            onClick={() => setCategoryFilter('x_fav')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
              categoryFilter === 'x_fav'
                ? isDark ? 'bg-teal-500 text-slate-950 shadow-teal-500/20 shadow-lg' : 'bg-teal-600 text-white'
                : isDark ? 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>İlk Yarı Berabere (X/1 ve X/2)</span>
          </button>

          <button
            onClick={() => setCategoryFilter('fav_direct')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
              categoryFilter === 'fav_direct'
                ? isDark ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 shadow-lg' : 'bg-emerald-600 text-white'
                : isDark ? 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Direkt Favoriler (1/1 ve 2/2)</span>
          </button>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="space-y-4 mb-6">
          {/* Search Box */}
          <div className="relative">
            <Search className={`absolute left-4 top-3.5 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Takım veya lig ara (Örn: Real Madrid, Premier League)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-2xl py-3 pl-11 pr-10 text-sm transition shadow-sm ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' 
                  : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
          </div>

          {/* Date & League Pills Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
            {/* Date Pills (Gelecek Bülten Tarihleri) */}
            {viewMode !== 'past' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedUpcomingDate('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 ${
                    selectedUpcomingDate === 'all'
                      ? isDark ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-900 text-white border-slate-900'
                      : isDark ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/60' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Tüm Günler</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    selectedUpcomingDate === 'all' ? 'bg-white/20 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {dateCounts.all || 0}
                  </span>
                </button>

                {(data?.availableDates || []).map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedUpcomingDate(d)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 ${
                      selectedUpcomingDate === d
                        ? isDark ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : isDark ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/60' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    <span>{formatTurkishDate(d)}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      selectedUpcomingDate === d ? 'bg-white/20 text-white font-black' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {dateCounts[d] || 0}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {viewMode === 'past' && pastStats && (
              <div className="flex items-center gap-2">
                <span className={`px-3.5 py-2 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
                  isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Dünün Sonuçları ({formatTurkishDate(pastStats.date)})</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 font-black">
                    {filteredPastMatches.length} Maç
                  </span>
                </span>
              </div>
            )}

            {/* League Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                aria-label="Lig Seçimi"
                className={`px-3 py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">Tüm Ligler ({data?.availableLeagues?.length || 0})</option>
                {(data?.availableLeagues || []).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className={`text-center py-20 rounded-3xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold">388.000+ Geçmiş Maç Veritabanı Taranıyor...</h3>
            <p className={`text-xs mt-1 max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Bültendeki maçların MS ve İY oranları geçmiş maçlarla eşleştiriliyor ve 9 sonuç olasılığı hesaplanıyor.
            </p>
          </div>
        ) : (
          <div>
            {displayedMatches.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayedMatches.map((m: any) => {
                  const isExpanded = !!expandedMatches[m.id];
                  const top = m.topOutcome;
                  const surprise = m.surpriseOutcome;
                  const isPast = !!m.isPastMatch || m.status === 'MS';

                  return (
                    <div
                      key={m.id}
                      className={`p-5 rounded-3xl border transition-all hover:shadow-xl relative overflow-hidden ${
                        isPast
                          ? m.isTopHit
                            ? isDark
                              ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/95 to-slate-900/95 border-emerald-500/40 shadow-emerald-500/5'
                              : 'bg-emerald-50/30 border-emerald-300 shadow-md'
                            : isDark
                              ? 'bg-gradient-to-br from-slate-900/95 via-[#111625]/90 to-slate-900/95 border-slate-800'
                              : 'bg-white border-slate-200 shadow-md'
                          : isDark
                            ? 'bg-gradient-to-br from-slate-900/95 via-[#111625]/90 to-slate-900/95 border-slate-800 hover:border-indigo-500/40'
                            : 'bg-white border-slate-200 hover:border-indigo-400 shadow-md'
                      }`}
                    >
                      {/* TOP INFO BAR */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            m.matchTier === 'exact_ms_iy'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                              : m.matchTier === 'close_ms_iy'
                                ? isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                : isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-sky-100 text-sky-900 border border-sky-300'
                          }`}>
                            <Zap className="w-3 h-3" />
                            <span>{m.sampleSize} Benzer Maç</span>
                          </span>

                          <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {m.date} {m.time ? `• ${m.time}` : ''}
                          </span>

                          {isPast && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Dünün Maçı
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className={`text-xs font-black uppercase tracking-wider truncate block max-w-[160px] ${
                            isDark ? 'text-indigo-400' : 'text-indigo-700'
                          }`} title={m.league}>
                            {m.league}
                          </span>
                        </div>
                      </div>

                      {/* DÜNÜN BİTEN MAÇ SKOR & SONUÇ BANNERI */}
                      {isPast && (
                        <div className={`p-3 rounded-2xl border mb-3 flex items-center justify-between gap-2 ${
                          m.isTopHit
                            ? isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                            : isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm md:text-base">
                              MS: <strong className="text-amber-400">{m.score}</strong>
                            </span>
                            <span className="text-xs opacity-75 font-semibold">
                              (İY: {m.iyScore})
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase ${
                              m.actualOutcome === '1/1' || m.actualOutcome === '2/2'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : m.actualOutcome === 'X/1' || m.actualOutcome === 'X/2'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              Sonuç: {m.actualOutcome}
                            </span>
                          </div>

                          <div>
                            {m.isTopHit ? (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Tahmin Kazandı (%{top?.rate})</span>
                              </span>
                            ) : m.isSurpriseHit ? (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-purple-500 text-white flex items-center gap-1 shadow-sm">
                                <Flame className="w-3.5 h-3.5" />
                                <span>Sürpriz Kazandı!</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-bold opacity-70 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{m.actualOutcome} Geldi</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TEAMS BOX */}
                      <div className={`p-4 rounded-2xl border my-3 ${
                        isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200/90'
                      }`}>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-base md:text-lg font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {m.homeTeam}
                            </span>
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ev</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-base md:text-lg font-black truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {m.awayTeam}
                            </span>
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Dep</span>
                          </div>
                        </div>
                      </div>

                      {/* 6 TEMEL ORAN GÖSTERGE BARLARI */}
                      <div className={`p-3 rounded-2xl border mb-3 text-xs ${
                        isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-100/70 border-slate-200'
                      }`}>
                        <div className="grid grid-cols-2 gap-2 text-center font-bold">
                          {/* MS Oranları */}
                          <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="text-[10px] text-slate-400 font-black uppercase mb-1">Maç Sonu (MS)</div>
                            <div className="flex items-center justify-around gap-1 text-xs">
                              <div><span className="opacity-60 text-[10px]">1:</span> <strong className="text-emerald-400">{m.odds.ms1 ? m.odds.ms1.toFixed(2) : '-'}</strong></div>
                              <div><span className="opacity-60 text-[10px]">X:</span> <strong className="text-amber-400">{m.odds.ms0 ? m.odds.ms0.toFixed(2) : '-'}</strong></div>
                              <div><span className="opacity-60 text-[10px]">2:</span> <strong className="text-sky-400">{m.odds.ms2 ? m.odds.ms2.toFixed(2) : '-'}</strong></div>
                            </div>
                          </div>

                          {/* İY Oranları */}
                          <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="text-[10px] text-cyan-400 font-black uppercase mb-1">İlk Yarı (İY)</div>
                            <div className="flex items-center justify-around gap-1 text-xs">
                              <div><span className="opacity-60 text-[10px]">1:</span> <strong className="text-cyan-400">{m.odds.iy1 ? m.odds.iy1.toFixed(2) : '-'}</strong></div>
                              <div><span className="opacity-60 text-[10px]">X:</span> <strong className="text-cyan-400">{m.odds.iy0 ? m.odds.iy0.toFixed(2) : '-'}</strong></div>
                              <div><span className="opacity-60 text-[10px]">2:</span> <strong className="text-cyan-400">{m.odds.iy2 ? m.odds.iy2.toFixed(2) : '-'}</strong></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 9 İHTİMALLİ İY/MS SONUÇ ORAN DAĞILIMI */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                            İY / MS Olasılık Karnesi (9 İhtimal)
                          </span>
                          {top && (
                            <span className="text-[11px] font-black text-amber-400 flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              Favori: {top.key} (%{top.rate})
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1 text-center text-[11px]">
                          {['1/1', 'X/1', '2/1', '1/X', 'X/X', '2/X', '1/2', 'X/2', '2/2'].map((key) => {
                            const stat = m.stats?.[key] || { rate: 0, count: 0 };
                            const isTop = top?.key === key && stat.rate > 0;
                            const isSurprise = surprise?.key === key;
                            const isWinningOutcome = isPast && m.actualOutcome === key;
                            const estOdds = getIyMsEstimatedOdds(
                              m.odds.ms1,
                              m.odds.ms0,
                              m.odds.ms2,
                              m.odds.iy1,
                              m.odds.iy0,
                              m.odds.iy2
                            );

                            return (
                              <div
                                key={key}
                                className={`p-1.5 sm:p-2 rounded-xl border transition ${
                                  isWinningOutcome
                                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/60 font-black shadow-emerald-500/20 shadow-md'
                                    : isTop
                                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 ring-1 ring-amber-500/30 font-black'
                                      : isSurprise
                                        ? 'bg-purple-500/20 border-purple-500/60 text-purple-300 ring-1 ring-purple-500/30 font-black'
                                        : isDark
                                          ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                                          : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="text-[10px] font-bold opacity-80">{key}</span>
                                  {isWinningOutcome && (
                                    <span className="text-[8px] font-black text-emerald-400">✓</span>
                                  )}
                                </div>
                                <div className={`text-sm font-black mt-0.5 ${
                                  isWinningOutcome ? 'text-emerald-300 font-black text-base' : isTop ? 'text-amber-400' : isSurprise ? 'text-purple-300' : ''
                                }`}>
                                  %{stat.rate}
                                </div>
                                <div className="text-[10px] font-black text-emerald-400 my-0.5">
                                  {estOdds[key] ? estOdds[key].toFixed(2) : '-'}
                                </div>
                                <div className="text-[9px] opacity-50">{stat.count} Maç</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* SURPRISE BADGE IF APPLICABLE */}
                      {surprise && (
                        <div className={`p-2.5 rounded-xl border mb-3 flex items-center justify-between text-xs ${
                          isDark ? 'bg-purple-950/30 border-purple-900/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-900'
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold">
                            <Flame className="w-3.5 h-3.5 text-purple-400" />
                            <span>Sürpriz İY/MS Fırsatı: <strong>{surprise.key}</strong> (%{surprise.rate} oranında geldi)</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20">
                            {surprise.count} Maç
                          </span>
                        </div>
                      )}

                      {/* EXPANDABLE PAST MATCHES BUTTON */}
                      <button
                        onClick={() => toggleExpand(m.id)}
                        className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isExpanded
                            ? isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-200 text-slate-900 border-slate-300'
                            : isDark ? 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" />
                          <span>Bu Oranlara Sahip Geçmiş Maçları Listele ({m.recentMatches?.length || 0} Maç)</span>
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* EXPANDED PAST MATCHES LIST */}
                      {isExpanded && (
                        <div className={`mt-3 p-3.5 rounded-2xl border space-y-2 text-xs ${
                          isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="font-bold opacity-75 text-[11px] mb-2 flex items-center justify-between">
                            <span>Geçmiş Benzer Maçlar ve Skorları</span>
                            <span>İY • MS Sonuçları</span>
                          </div>

                          {m.recentMatches && m.recentMatches.length > 0 ? (
                            m.recentMatches.map((pm: any, idx: number) => (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <div className="font-bold text-xs truncate">
                                    {pm.homeTeam} - {pm.awayTeam}
                                  </div>
                                  <div className="text-[10px] opacity-60">
                                    {pm.date} • {pm.league}
                                  </div>
                                </div>

                                <div className="text-right shrink-0 flex items-center gap-2">
                                  <div className="text-right">
                                    <div className="font-black text-xs text-amber-400">
                                      MS: {pm.msScore}
                                    </div>
                                    <div className="text-[10px] opacity-70">
                                      İY: {pm.iyScore}
                                    </div>
                                  </div>

                                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                    pm.outcome === '1/1' || pm.outcome === '2/2'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : pm.outcome === 'X/1' || pm.outcome === 'X/2'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  }`}>
                                    {pm.outcome}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 opacity-50 text-xs">
                              Detaylı geçmiş maç kaydı bulunamadı.
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-16 rounded-3xl border ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <Zap className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
                <h4 className={`text-base font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Maç Bulunamadı</h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Filtreleri veya arama kriterini değiştirerek tekrar deneyebilirsiniz.</p>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
