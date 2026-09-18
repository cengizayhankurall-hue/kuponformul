'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Search,
  Calendar,
  Zap,
  BarChart3,
  Sun,
  Moon,
  Target,
  RefreshCw,
  Layers,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface GoalMatch {
  id: string;
  matchId: string;
  eventId: string;
  code: string;
  date: string;
  time: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  odd45Ust: number;
  odd45Alt: number | null;
  oddHerIkiYari15Ust: number;
  oddHerIkiYari15Alt: number | null;
  diff: number;
  isCloseDiff: boolean;
  odds: {
    ms1: string;
    ms0: string;
    ms2: string;
    alt25: string;
    ust25: string;
    kgVar: string;
    kgYok: string;
  };
}

interface ApiResponse {
  success: boolean;
  stats: {
    totalUnplayed: number;
    totalWithBothOdds: number;
    diff020Count: number;
    diff010Count: number;
    exactMatchCount: number;
  };
  availableDates: string[];
  availableLeagues: string[];
  matches: GoalMatch[];
  cachedAt: string;
}

function formatTurkishDate(dateStr: string) {
  try {
    let day = 0, month = 0, year = 0;
    if (dateStr.includes('.')) {
      const [d, m, y] = dateStr.split('.').map(Number);
      day = d; month = m; year = y;
    } else if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/').map(Number);
      day = d; month = m; year = y;
    } else {
      return dateStr;
    }
    const date = new Date(year, month - 1, day);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${day} ${months[month - 1]} (${days[date.getDay()]})`;
  } catch {
    return dateStr;
  }
}

export default function GolAnaliziPage() {
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);

  // Filters
  const [diffFilter, setDiffFilter] = useState<'0.20' | '0.10' | 'exact' | 'all'>('0.20');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const url = forceRefresh ? '/api/gol-analizi?refresh=true' : '/api/gol-analizi';
      const res = await fetch(url);
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

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Filtered Matches
  const filteredMatches = useMemo(() => {
    if (!data?.matches) return [];

    return data.matches.filter(m => {
      // Diff Filter
      if (diffFilter === '0.20' && m.diff > 0.20) return false;
      if (diffFilter === '0.10' && m.diff > 0.10) return false;
      if (diffFilter === 'exact' && m.diff !== 0.00) return false;

      // Date Filter
      if (selectedDate !== 'all' && m.date !== selectedDate) return false;

      // League Filter
      if (selectedLeague !== 'all' && m.league !== selectedLeague) return false;

      // Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inHome = m.homeTeam.toLowerCase().includes(q);
        const inAway = m.awayTeam.toLowerCase().includes(q);
        const inLeague = m.league.toLowerCase().includes(q);
        const inCode = m.code.toLowerCase().includes(q);
        if (!inHome && !inAway && !inLeague && !inCode) return false;
      }

      return true;
    });
  }, [data, diffFilter, selectedDate, selectedLeague, searchTerm]);

  // Date pill counts based on active diff filter
  const dateCounts = useMemo(() => {
    if (!data?.matches) return {};
    const counts: Record<string, number> = { all: 0 };

    data.matches.forEach(m => {
      let matchPassesDiff = true;
      if (diffFilter === '0.20' && m.diff > 0.20) matchPassesDiff = false;
      if (diffFilter === '0.10' && m.diff > 0.10) matchPassesDiff = false;
      if (diffFilter === 'exact' && m.diff !== 0.00) matchPassesDiff = false;

      if (matchPassesDiff) {
        counts.all = (counts.all || 0) + 1;
        if (m.date) {
          counts[m.date] = (counts[m.date] || 0) + 1;
        }
      }
    });

    return counts;
  }, [data, diffFilter]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        
        {/* HERO HEADER */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 mb-8 transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 border-slate-800 shadow-2xl' 
            : 'bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/30 border-slate-200 shadow-md'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  <Target className="w-3.5 h-3.5" />
                  Özel Oran Korelasyonu
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                  isDark ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-sky-100 text-sky-800 border-sky-200'
                }`}>
                  <Flame className="w-3.5 h-3.5" />
                  Fark ≤ 0.20 Kriteri
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                  isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  <Calendar className="w-3.5 h-3.5" />
                  Oynanmamış / Güncel Bülten
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                <span>⚽ 4.5 Üst & İki Yarı 1.5 Üst Analizi</span>
              </h1>
              
              <p className={`text-xs sm:text-sm max-w-3xl ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                <strong>Toplam Gol 4.5 Gol Üst</strong> oranı ile <strong>Her İki Yarıda da 1.5 Gol Üst</strong> oranları arasındaki farkı <strong>0.20 ve altında</strong> olan oynanmamış tüm maçların özel bülten listesi.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-center">
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
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
                <span>{refreshing ? 'Taranıyor...' : 'Yenile'}</span>
              </button>

              <button
                onClick={toggleTheme}
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

          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-8">
            
            {/* Card 1: Taranan Bülten Maçı */}
            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Taranan Bülten Maçı</span>
                <BarChart3 className="w-4 h-4 text-sky-500" />
              </div>
              <div className={`text-2xl md:text-3xl font-black mt-2 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                {data?.stats?.totalUnplayed || 0} <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Maç</span>
              </div>
              <div className={`text-[11px] mt-1 truncate ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>
                Gelecek 4 Günlük Program
              </div>
            </div>

            {/* Card 2: Çift Oran Açılan */}
            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Çift Market Açılan</span>
                <Layers className="w-4 h-4 text-amber-500" />
              </div>
              <div className={`text-2xl md:text-3xl font-black mt-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                {data?.stats?.totalWithBothOdds || 0} <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Maç</span>
              </div>
              <div className={`text-[11px] mt-1 truncate ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>
                4.5 Üst & 2Y 1.5 Üst Aktif
              </div>
            </div>

            {/* Card 3: Fark <= 0.20 (Hedef Kriter) */}
            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-emerald-950/40 border-emerald-800/40' : 'bg-emerald-50/80 border-emerald-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>Fark ≤ 0.20 Olanlar</span>
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div className={`text-2xl md:text-3xl font-black mt-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {data?.stats?.diff020Count || 0} <span className={`text-xs font-medium ${isDark ? 'text-emerald-500/70' : 'text-emerald-600'}`}>Maç</span>
              </div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-emerald-500/80' : 'text-emerald-700 font-semibold'}`}>
                🎯 Hedef Kriter Maçları
              </div>
            </div>

            {/* Card 4: Fark <= 0.10 (Çok Yakın) */}
            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>Fark ≤ 0.10 (Çok Yakın)</span>
                <Zap className="w-4 h-4 text-purple-500" />
              </div>
              <div className={`text-2xl md:text-3xl font-black mt-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                {data?.stats?.diff010Count || 0} <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Maç</span>
              </div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>
                Neredeyse Eşit Oranlar
              </div>
            </div>

          </div>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="space-y-4 mb-6">
          
          {/* Search Box */}
          <div className="relative">
            <Search className={`absolute left-4 top-3.5 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Takım, lig veya maç kodu ara (Örn: Real Madrid, Premier League, 34762)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-2xl py-3 pl-11 pr-10 text-sm transition shadow-sm ${
                isDark 
                  ? 'bg-slate-900/70 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-emerald-500/50' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-emerald-500 shadow-sm font-medium'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute right-3.5 top-3 p-1 rounded-full transition ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Date Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className={`text-xs font-bold shrink-0 mr-1 ${isDark ? 'text-slate-500' : 'text-slate-700'}`}>Tarih:</span>
            
            {/* Tüm Günler */}
            <button
              onClick={() => setSelectedDate('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition cursor-pointer flex items-center gap-2 ${
                selectedDate === 'all'
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : isDark
                    ? 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/40'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm font-bold'
              }`}
            >
              <Calendar className="w-3 h-3 opacity-70" />
              <span>Tüm Günler</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedDate === 'all' 
                  ? isDark ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/30 text-white font-black'
                  : isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-700 font-bold'
              }`}>
                {dateCounts.all || 0}
              </span>
            </button>

            {/* Dynamic Day Pills */}
            {(data?.availableDates || []).map(d => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition cursor-pointer flex items-center gap-2 ${
                  selectedDate === d
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                      : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : isDark
                      ? 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/40'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm font-bold'
                }`}
              >
                <Calendar className="w-3 h-3 opacity-70" />
                <span>{formatTurkishDate(d)}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedDate === d
                    ? isDark ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/30 text-white font-black'
                    : isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-700 font-bold'
                }`}>
                  {dateCounts[d] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Diff Range & League Filters */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Diff Filter */}
            <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`text-[11px] font-bold px-2 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-700'}`}>
                <SlidersHorizontal className="w-3 h-3" />
                Oran Farkı:
              </span>
              
              <button
                onClick={() => setDiffFilter('0.20')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  diffFilter === '0.20'
                    ? isDark ? 'bg-emerald-500 text-slate-950 shadow-sm font-black' : 'bg-emerald-600 text-white shadow-sm font-black'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                }`}
              >
                🎯 Fark ≤ 0.20 (Hedef Kriter)
              </button>

              <button
                onClick={() => setDiffFilter('0.10')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  diffFilter === '0.10'
                    ? isDark ? 'bg-purple-500 text-white shadow-sm font-black' : 'bg-purple-600 text-white shadow-sm font-black'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                }`}
              >
                ⚡ Fark ≤ 0.10 (Çok Yakın)
              </button>

              <button
                onClick={() => setDiffFilter('exact')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  diffFilter === 'exact'
                    ? isDark ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                }`}
              >
                ✨ Tam Eşit (0.00)
              </button>

              <button
                onClick={() => setDiffFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  diffFilter === 'all'
                    ? isDark ? 'bg-sky-500 text-white shadow-sm font-bold' : 'bg-sky-600 text-white shadow-sm font-bold'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                }`}
              >
                Tümü ({data?.stats?.totalWithBothOdds || 0})
              </button>
            </div>

            {/* League Dropdown */}
            {(data?.availableLeagues || []).length > 1 && (
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition outline-none cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800 shadow-sm'
                }`}
              >
                <option value="all">Tüm Ligler ({(data?.availableLeagues || []).length})</option>
                {(data?.availableLeagues || []).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* MATCHES LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Bülten maçları taranıyor ve oranlar hesaplanıyor...</span>
          </div>
        ) : filteredMatches.length > 0 ? (
          <>
            <div className={`flex items-center justify-between text-xs font-bold mb-4 px-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>
                Kritere uyan <strong className="text-emerald-500 font-extrabold">{filteredMatches.length}</strong> maç listeleniyor
              </span>
              <span className="text-[11px] opacity-70">
                En düşük farktan yükseğe sıralı
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMatches.map((m) => {
                const isExact = m.diff === 0.00;
                const isUltraClose = m.diff <= 0.10;

                return (
                  <div
                    key={m.id || m.eventId}
                    className={`p-5 rounded-3xl border transition-all hover:shadow-xl relative overflow-hidden ${
                      isDark
                        ? 'bg-gradient-to-br from-slate-900/90 via-[#111625]/80 to-slate-900/90 border-slate-800 hover:border-emerald-500/50'
                        : 'bg-white border-slate-200 hover:border-emerald-400 shadow-md'
                    }`}
                  >
                    {/* TOP INFO BAR */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* FARK BADGE */}
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${
                          isExact
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : isUltraClose
                              ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-sky-100 text-sky-900 border border-sky-300'
                        }`}>
                          <Target className="w-3 h-3" />
                          <span>FARK: {m.diff.toFixed(2)}</span>
                        </span>

                        {m.code && (
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                            isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}>
                            Kod: {m.code}
                          </span>
                        )}

                        <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {m.date} • {m.time}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-black uppercase tracking-wider truncate block max-w-[160px] ${
                          isDark ? 'text-sky-400' : 'text-sky-700'
                        }`} title={m.league}>
                          {m.league}
                        </span>
                      </div>
                    </div>

                    {/* TEAMS */}
                    <div className={`p-4 rounded-2xl border my-3 ${
                      isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200/90'
                    }`}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-base md:text-lg font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {m.homeTeam}
                          </span>
                          <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ev Sahibi</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-base md:text-lg font-black truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {m.awayTeam}
                          </span>
                          <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Deplasman</span>
                        </div>
                      </div>
                    </div>

                    {/* MAIN HIGHLIGHT: 4.5 ÜST vs HER İKİ YARI 1.5 ÜST COMPARISON BOX */}
                    <div className={`p-3.5 rounded-2xl border mb-3 ${
                      isDark 
                        ? 'bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-teal-950/30 border-emerald-900/40' 
                        : 'bg-gradient-to-r from-emerald-50 via-slate-50 to-teal-50 border-emerald-200'
                    }`}>
                      <div className="grid grid-cols-2 gap-3">
                        
                        {/* 4.5 Üst Box */}
                        <div className={`p-3 rounded-xl border text-center transition ${
                          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                          <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            ⚽ Toplam 4.5 Gol Üst
                          </div>
                          <div className="text-2xl font-black text-emerald-500">
                            {m.odd45Ust.toFixed(2)}
                          </div>
                          {m.odd45Alt && (
                            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>
                              Alt Oranı: {m.odd45Alt.toFixed(2)}
                            </div>
                          )}
                        </div>

                        {/* Her İki Yarı 1.5 Üst Box */}
                        <div className={`p-3 rounded-xl border text-center transition ${
                          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                          <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
                            ⏱️ Her İki Yarı 1.5 Üst
                          </div>
                          <div className="text-2xl font-black text-teal-500">
                            {m.oddHerIkiYari15Ust.toFixed(2)}
                          </div>
                          {m.oddHerIkiYari15Alt && (
                            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>
                              Alt Oranı: {m.oddHerIkiYari15Alt.toFixed(2)}
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Correlation Visual Bar */}
                      <div className="mt-3 pt-2.5 border-t border-dashed border-emerald-500/20 flex items-center justify-between text-xs font-bold px-1">
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Oran Farkı Seviyesi:
                        </span>
                        <span className={`font-black ${
                          isExact 
                            ? 'text-amber-500' 
                            : isUltraClose 
                              ? 'text-emerald-500' 
                              : isDark ? 'text-sky-400' : 'text-sky-700'
                        }`}>
                          {isExact ? '✨ Birebir Eşit (0.00)' : isUltraClose ? `🔥 Çok Yakın (${m.diff.toFixed(2)})` : `🎯 Fark: ${m.diff.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    {/* BULLETIN STANDARD ODDS (MS1, MS0, MS2, 2.5 ÜST, KG VAR) */}
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[11px] pt-1">
                      <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-800 font-bold'}`}>
                        <span className={`block text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>MS 1</span>
                        <span>{m.odds.ms1}</span>
                      </div>

                      <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-800 font-bold'}`}>
                        <span className={`block text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>MS 0</span>
                        <span>{m.odds.ms0}</span>
                      </div>

                      <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-800 font-bold'}`}>
                        <span className={`block text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>MS 2</span>
                        <span>{m.odds.ms2}</span>
                      </div>

                      <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-800 font-bold'}`}>
                        <span className={`block text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>2.5 ÜST</span>
                        <span>{m.odds.ust25}</span>
                      </div>

                      <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-800 font-bold'}`}>
                        <span className={`block text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>KG VAR</span>
                        <span>{m.odds.kgVar}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className={`text-center py-20 rounded-3xl border ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <Target className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
            <h4 className={`text-base font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Seçilen Filtreye Uygun Maç Bulunamadı</h4>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Fark filtresini (Tümü) genişleterek veya farklı bir tarih seçerek tekrar deneyin.</p>
          </div>
        )}

      </main>
    </div>
  );
}
