'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Target, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  History, 
  Award, 
  Sun, 
  Moon, 
  Layers, 
  CheckCircle2, 
  XCircle,
  SlidersHorizontal,
  Clock,
  BarChart3,
  Percent,
  Check
} from 'lucide-react';

interface ComboItem {
  name: string;
  count: number;
  rate: number;
  estOdd: string;
}

interface ScoreItem {
  score: string;
  count: number;
  rate: number;
  estOdd: string;
}

interface MatchItem {
  id: string;
  eventId: string;
  code: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  odds: {
    ms1: number;
    ms0: number;
    ms2: number;
    alt25?: number;
    ust25?: number;
    kgVar?: number;
    kgYok?: number;
  };
  sampleSize: number;
  combos: ComboItem[];
  topCombo: ComboItem | null;
  topScores: ScoreItem[];
  primaryScore: ScoreItem | null;
  secondaryScore: ScoreItem | null;
  // Dünün Maçları İçin
  status?: string;
  actualScore?: string;
  iyScore?: string;
  isComboHit?: boolean;
  isPrimaryScoreHit?: boolean;
  isSecondaryScoreHit?: boolean;
  isExactScoreHit?: boolean;
}

interface ApiResponse {
  success: boolean;
  timestamp: number;
  availableDates: string[];
  availableLeagues: string[];
  stats: {
    totalAnalyzed: number;
    highConfidenceCount: number;
  };
  matches: MatchItem[];
  pastStats?: {
    date: string;
    totalFinished: number;
    comboHitCount: number;
    comboHitRate: number;
    scoreHitCount: number;
    scoreHitRate: number;
  };
  pastMatches?: MatchItem[];
}

export default function YuksekOranAnaliziPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // View Mode: 'all' | 'upcoming' | 'past'
  const [viewMode, setViewMode] = useState<'all' | 'upcoming' | 'past'>('all');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ms_ust' | 'ms_kg' | 'ms_x' | 'high_rate'>('all');
  const [selectedUpcomingDate, setSelectedUpcomingDate] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded match cards
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});

  // Simulator
  const [showSimulator, setShowSimulator] = useState(false);
  const [simOdds, setSimOdds] = useState({
    ms1: '1.60',
    ms0: '3.30',
    ms2: '4.20',
    alt25: '1.75',
    ust25: '1.70',
    kgVar: '1.75',
    kgYok: '1.70'
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
      const res = await fetch(`/api/yuksek-oran-analizi?t=${Date.now()}`, { cache: 'no-store' });
      const json: ApiResponse = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Veri çekme hatası:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    try {
      const res = await fetch('/api/yuksek-oran-analizi', {
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

  const toggleExpand = (id: string) => {
    setExpandedMatches(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTurkishDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [d, m, y] = dateStr.split('.').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Filtered Upcoming Matches
  const filteredUpcomingMatches = useMemo(() => {
    if (!data?.matches) return [];

    return data.matches.filter(m => {
      if ((m.sampleSize || 0) < 5) return false;

      // Category filter
      if (categoryFilter === 'ms_ust') {
        if (!m.topCombo?.name.includes('ÜST')) return false;
      } else if (categoryFilter === 'ms_kg') {
        if (!m.topCombo?.name.includes('KG VAR')) return false;
      } else if (categoryFilter === 'ms_x') {
        if (!m.topCombo?.name.includes('MS X')) return false;
      } else if (categoryFilter === 'high_rate') {
        if ((m.topCombo?.rate || 0) < 35) return false;
      }

      // Date Filter
      if (selectedUpcomingDate !== 'all' && m.date !== selectedUpcomingDate) return false;

      // League Filter
      if (selectedLeague !== 'all' && m.league !== selectedLeague) return false;

      // Search Filter
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

  // Filtered Past Matches
  const filteredPastMatches = useMemo(() => {
    if (!data?.pastMatches) return [];

    return data.pastMatches.filter(m => {
      if ((m.sampleSize || 0) < 5) return false;

      if (categoryFilter === 'ms_ust') {
        if (!m.topCombo?.name.includes('ÜST')) return false;
      } else if (categoryFilter === 'ms_kg') {
        if (!m.topCombo?.name.includes('KG VAR')) return false;
      } else if (categoryFilter === 'ms_x') {
        if (!m.topCombo?.name.includes('MS X')) return false;
      } else if (categoryFilter === 'high_rate') {
        if ((m.topCombo?.rate || 0) < 35) return false;
      }

      if (selectedLeague !== 'all' && m.league !== selectedLeague) return false;

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

  // Unified Display List
  const displayedMatches = useMemo(() => {
    if (viewMode === 'upcoming') {
      return filteredUpcomingMatches.map(m => ({ ...m, isPastMatch: false }));
    }
    if (viewMode === 'past') {
      return filteredPastMatches.map(m => ({ ...m, isPastMatch: true }));
    }
    return [
      ...filteredPastMatches.map(m => ({ ...m, isPastMatch: true })),
      ...filteredUpcomingMatches.map(m => ({ ...m, isPastMatch: false }))
    ];
  }, [viewMode, filteredUpcomingMatches, filteredPastMatches]);

  const pastStats = data?.pastStats;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3.5">
              <span className="p-3 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 rounded-2xl shadow-lg shadow-orange-500/20 shrink-0">
                <Target className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                  Yüksek Oran & Skor Kümeleme Analizi
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">YENİ</span>
                </h1>
                <p className={`text-xs md:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  388.000+ geçmiş maç veritabanından <strong>MS + 2.5/KG Kombinasyonları</strong> ve <strong>En Olası 2 Skor</strong> tahmini
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 border transition cursor-pointer shadow-sm ${
                showSimulator
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Manuel Oran Simülatörü</span>
            </button>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-200 text-slate-600'
              }`}
              title="Tema Değiştir"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className={`p-4 rounded-2xl border transition ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Bülten Maçı</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-400">{data?.stats?.totalAnalyzed || 0}</div>
            <div className="text-[11px] opacity-70 font-semibold mt-0.5">Kombine & Skor Çıkarılan</div>
          </div>

          <div className={`p-4 rounded-2xl border transition ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Yüksek Güvenilirlik (%35+)</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{data?.stats?.highConfidenceCount || 0}</div>
            <div className="text-[11px] opacity-70 font-semibold mt-0.5">En Güçlü Kombinasyonlar</div>
          </div>

          <div className={`p-4 rounded-2xl border transition ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Dünün Kombine İsabeti</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">%{pastStats?.comboHitRate || 0}</div>
            <div className="text-[11px] opacity-70 font-semibold mt-0.5">{pastStats?.comboHitCount || 0} / {pastStats?.totalFinished || 0} Maç Tuttu</div>
          </div>

          <div className={`p-4 rounded-2xl border transition ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Dünün Skor İsabeti</span>
              <Target className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-orange-400">%{pastStats?.scoreHitRate || 0}</div>
            <div className="text-[11px] opacity-70 font-semibold mt-0.5">{pastStats?.scoreHitCount || 0} / {pastStats?.totalFinished || 0} Skor Tam İsabet</div>
          </div>
        </div>

        {/* MANUEL SIMULATOR MODAL */}
        {showSimulator && (
          <div className={`p-6 rounded-3xl border mb-8 transition ${isDark ? 'bg-slate-900/90 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h3 className="text-base font-black flex items-center gap-2 mb-4 text-amber-400">
              <SlidersHorizontal className="w-5 h-5" />
              Manuel Oran Test Simülatörü
            </h3>
            <form onSubmit={handleSimulate} className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold block mb-1 opacity-75">MS 1</label>
                  <input
                    type="text"
                    value={simOdds.ms1}
                    onChange={e => setSimOdds({ ...simOdds, ms1: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-center font-black text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1 opacity-75">MS X</label>
                  <input
                    type="text"
                    value={simOdds.ms0}
                    onChange={e => setSimOdds({ ...simOdds, ms0: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-center font-black text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1 opacity-75">MS 2</label>
                  <input
                    type="text"
                    value={simOdds.ms2}
                    onChange={e => setSimOdds({ ...simOdds, ms2: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-center font-black text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1 opacity-75">2.5 ALT</label>
                  <input
                    type="text"
                    value={simOdds.alt25}
                    onChange={e => setSimOdds({ ...simOdds, alt25: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-center font-black text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1 opacity-75">2.5 ÜST</label>
                  <input
                    type="text"
                    value={simOdds.ust25}
                    onChange={e => setSimOdds({ ...simOdds, ust25: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-center font-black text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1 opacity-75">KG VAR</label>
                  <input
                    type="text"
                    value={simOdds.kgVar}
                    onChange={e => setSimOdds({ ...simOdds, kgVar: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-center font-black text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1 opacity-75">KG YOK</label>
                  <input
                    type="text"
                    value={simOdds.kgYok}
                    onChange={e => setSimOdds({ ...simOdds, kgYok: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-center font-black text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={simLoading}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <Zap className="w-4 h-4" />
                  {simLoading ? 'Arşiv Taranıyor...' : 'Kombine & Skor Analiz Et'}
                </button>
              </div>
            </form>

            {simResult && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black">
                    {simResult.sampleSize} Benzer Maç Bulundu
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Combos */}
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className="text-xs font-black uppercase text-amber-400 mb-2">En Olası Kombinasyonlar</h4>
                    <div className="space-y-2">
                      {(simResult.combos || []).map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
                          <span className="font-bold">{c.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-black">Oran: {c.estOdd}</span>
                            <span className="font-black text-emerald-400">%{c.rate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Scores */}
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className="text-xs font-black uppercase text-orange-400 mb-2">En Olası Doğru Skorlar</h4>
                    <div className="space-y-2">
                      {(simResult.topScores || []).map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
                          <span className="font-black text-sm">{s.score}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-black">Tahmin Oran: {s.estOdd}</span>
                            <span className="font-black text-emerald-400">%{s.rate} ({s.count} Maç)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE TABS */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
              viewMode === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-amber-500/20 shadow-lg'
                : isDark ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tümünü Göster</span>
          </button>

          <button
            onClick={() => setViewMode('upcoming')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
              viewMode === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg'
                : isDark ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Gelecek Bülten ({filteredUpcomingMatches.length})</span>
          </button>

          <button
            onClick={() => setViewMode('past')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
              viewMode === 'past'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg'
                : isDark ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Dünün Sonuçları & Skor İsabeti ({data?.pastMatches?.length || 0})</span>
          </button>
        </div>

        {/* DÜNÜN SONUÇLARI KARNE BANNERI */}
        {(viewMode === 'all' || viewMode === 'past') && pastStats && (
          <div className={`p-4 md:p-5 rounded-3xl border mb-6 ${isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-200 shadow-sm'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-black text-emerald-400">
                    Dünün ({pastStats.date}) Yüksek Oran & Skor İsabet Karnesi
                  </div>
                  <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Toplam {pastStats.totalFinished} bitmiş maç üzerinde kombine ve doğru skor test edildi.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold">Kombine Başarısı</div>
                  <div className="text-lg font-black text-emerald-400">
                    %{pastStats.comboHitRate} <span className="text-xs opacity-75 font-normal">({pastStats.comboHitCount}/{pastStats.totalFinished})</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold">Doğru Skor Başarısı</div>
                  <div className="text-lg font-black text-orange-400">
                    %{pastStats.scoreHitRate} <span className="text-xs opacity-75 font-normal">({pastStats.scoreHitCount}/{pastStats.totalFinished})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY & FILTER PILLS */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            Tüm Kombinasyonlar
          </button>

          <button
            onClick={() => setCategoryFilter('ms_ust')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'ms_ust'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>MS & 2.5 ÜST (2.30 - 3.00)</span>
          </button>

          <button
            onClick={() => setCategoryFilter('ms_kg')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'ms_kg'
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                : isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>MS & KG VAR (3.00 - 4.50)</span>
          </button>

          <button
            onClick={() => setCategoryFilter('ms_x')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'ms_x'
                ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                : isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>MS X & 2.5 ALT (3.60 - 4.50)</span>
          </button>

          <button
            onClick={() => setCategoryFilter('high_rate')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'high_rate'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>En Güçlü İhtimaller (%35+)</span>
          </button>
        </div>

        {/* SEARCH & CONTROLS */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className={`absolute left-4 top-3.5 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Takım veya lig ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm transition ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500'
              }`}
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
            {viewMode !== 'past' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedUpcomingDate('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                    selectedUpcomingDate === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Tüm Günler
                </button>

                {(data?.availableDates || []).map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedUpcomingDate(d)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1.5 ${
                      selectedUpcomingDate === d
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    <span>{formatTurkishDate(d)}</span>
                  </button>
                ))}
              </div>
            )}

            <div>
              <select
                value={selectedLeague}
                onChange={e => setSelectedLeague(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
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

        {/* LOADING & MATCHES LIST */}
        {loading ? (
          <div className={`text-center py-20 rounded-3xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <RefreshCw className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold">388.000+ Geçmiş Maç Veritabanı Taranıyor...</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Bültendeki maçların MS ve Gol oranları geçmiş maçlarla eşleştiriliyor, kombine ve en olası 2 skor hesaplanıyor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayedMatches.map((m: any) => {
              const isPast = m.isPastMatch || m.status === 'MS';
              const isExpanded = !!expandedMatches[m.id];

              return (
                <div
                  key={m.id}
                  className={`p-5 rounded-3xl border transition-all hover:shadow-xl relative overflow-hidden ${
                    isPast
                      ? m.isComboHit || m.isExactScoreHit
                        ? isDark
                          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/95 to-slate-900/95 border-emerald-500/40'
                          : 'bg-emerald-50/30 border-emerald-300 shadow-md'
                        : isDark
                          ? 'bg-slate-900/95 border-slate-800'
                          : 'bg-white border-slate-200 shadow-md'
                      : isDark
                        ? 'bg-slate-900/95 border-slate-800 hover:border-amber-500/40'
                        : 'bg-white border-slate-200 hover:border-amber-400 shadow-md'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                        <Zap className="w-3 h-3" />
                        <span>{m.sampleSize} Benzer Maç</span>
                      </span>

                      <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {m.date} {m.time ? `• ${m.time}` : ''}
                      </span>

                      {isPast && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Dünün Maçı
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-black uppercase tracking-wider truncate max-w-[150px] text-indigo-400" title={m.league}>
                      {m.league}
                    </span>
                  </div>

                  {/* DÜNÜN BİTEN MAÇ SKOR BANNERI */}
                  {isPast && (
                    <div className={`p-3 rounded-2xl border mb-3 flex items-center justify-between gap-2 ${
                      m.isComboHit || m.isExactScoreHit
                        ? isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                        : isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base">
                          MS: <strong className="text-amber-400">{m.actualScore}</strong>
                        </span>
                        <span className="text-xs opacity-75 font-semibold">(İY: {m.iyScore})</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {m.isComboHit && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            Kombine Kazandı
                          </span>
                        )}
                        {m.isExactScoreHit && (
                          <span className="px-2 py-0.5 rounded-lg bg-orange-500 text-slate-950 font-black text-xs flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            Skor Tam İsabet!
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Team Names */}
                  <div className={`p-4 rounded-2xl border my-3 ${
                    isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200/90'
                  }`}>
                    <div className="space-y-1.5">
                      <div className={`text-base md:text-lg font-black tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.homeTeam}</div>
                      <div className={`text-base md:text-lg font-black tracking-tight truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{m.awayTeam}</div>
                    </div>
                  </div>

                  {/* Odds Box */}
                  <div className={`p-2.5 rounded-2xl border mb-4 text-xs font-semibold grid grid-cols-5 gap-1 text-center ${
                    isDark ? 'bg-slate-950/80 border-slate-800/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div>
                      <span className={`text-[10px] font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>MS 1</span>
                      <strong className="text-amber-400 text-xs">{m.odds.ms1?.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>MS X</span>
                      <strong className="text-amber-400 text-xs">{m.odds.ms0?.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>MS 2</span>
                      <strong className="text-amber-400 text-xs">{m.odds.ms2?.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>2.5 ÜST</span>
                      <strong className="text-emerald-400 text-xs">{m.odds.ust25 ? m.odds.ust25.toFixed(2) : '-'}</strong>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>KG VAR</span>
                      <strong className="text-purple-400 text-xs">{m.odds.kgVar ? m.odds.kgVar.toFixed(2) : '-'}</strong>
                    </div>
                  </div>

                  {/* TOP COMBO & SCORE BOXES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {/* Top Combo Box */}
                    {m.topCombo && (
                      <div className={`p-3.5 rounded-2xl border ${
                        isDark ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 mb-1">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" />
                            En Olası Kombine
                          </span>
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            Oran: {m.topCombo.estOdd}
                          </span>
                        </div>
                        <div className="text-sm font-black mt-1">{m.topCombo.name}</div>
                        <div className="text-xs font-black text-emerald-400 mt-1">
                          %{m.topCombo.rate} <span className="opacity-70 text-[10px] font-normal">({m.topCombo.count} Maçta Çıktı)</span>
                        </div>
                      </div>
                    )}

                    {/* Top Scores Box */}
                    <div className={`p-3.5 rounded-2xl border ${
                      isDark ? 'bg-gradient-to-br from-orange-500/10 to-red-500/5 border-orange-500/30' : 'bg-orange-50/70 border-orange-200'
                    }`}>
                      <div className="flex items-center justify-between text-[11px] font-bold text-orange-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          En Olası 2 Skor
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {m.primaryScore && (
                          <div className="flex-1 p-1.5 rounded-xl bg-slate-900/70 border border-orange-500/30 text-center">
                            <div className="text-sm font-black text-white">{m.primaryScore.score}</div>
                            <div className="text-[10px] font-bold text-orange-400">%{m.primaryScore.rate} ({m.primaryScore.estOdd})</div>
                          </div>
                        )}
                        {m.secondaryScore && (
                          <div className="flex-1 p-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                            <div className="text-sm font-black text-slate-200">{m.secondaryScore.score}</div>
                            <div className="text-[10px] font-bold text-slate-400">%{m.secondaryScore.rate} ({m.secondaryScore.estOdd})</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* EXPAND BUTTON */}
                  <button
                    onClick={() => toggleExpand(m.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-between cursor-pointer ${
                      isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Tüm Kombinasyon ve Skor Dağılımını Göster</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* EXPANDED CONTENT */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-1.5">Kombinasyon İhtimalleri</div>
                        <div className="grid grid-cols-2 gap-2">
                          {(m.combos || []).map((c: any, i: number) => (
                            <div key={i} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                              <span className="font-bold truncate">{c.name}</span>
                              <div className="text-right shrink-0">
                                <span className="text-amber-400 font-black">{c.estOdd}</span>
                                <span className="text-emerald-400 font-black ml-2">%{c.rate}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wider text-orange-400 mb-1.5">Skor Kümeleme Dağılımı</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(m.topScores || []).map((s: any, i: number) => (
                            <div key={i} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-center">
                              <div className="font-black text-sm">{s.score}</div>
                              <div className="text-[10px] text-orange-400 font-bold">%{s.rate} ({s.estOdd})</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
