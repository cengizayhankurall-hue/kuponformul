'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  AlertTriangle,
  Search,
  Calendar,
  Zap,
  TrendingDown,
  BarChart3,
  Sun,
  Moon,
  ShieldAlert,
  X
} from 'lucide-react';

interface FavoriteMatch {
  id: string;
  date: string;
  time: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  iyScore: string;
  favoriteType: 'MS 1 (Ev Sahibi)' | 'MS 2 (Deplasman)';
  favoriteOdd: number;
  isBusted: boolean;
  actualResult: string;
  outcomeType: '0' | 'reverse' | 'won';
  odds: {
    ms1: string;
    ms0: string;
    ms2: string;
    iy1: string;
    iy0: string;
    iy2: string;
    alt25: string;
    ust25: string;
    kgVar: string;
    kgYok: string;
  };
}

function formatTurkishDate(dateStr: string) {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${d} ${months[m - 1]} (${days[date.getDay()]})`;
  } catch {
    return dateStr;
  }
}

export default function PatlayanOranlarPage() {
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);
  const [allFavorites, setAllFavorites] = useState<FavoriteMatch[]>([]);
  const [distinctDates, setDistinctDates] = useState<string[]>([]);
  const [datePoolCounts, setDatePoolCounts] = useState<Record<string, number>>({});
  const [totalPoolCount, setTotalPoolCount] = useState<number>(0);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | '0' | 'reverse'>('all');
  const [oddRangeFilter, setOddRangeFilter] = useState<'all' | 'ultra' | 'mid'>('all'); // all: 1.05-1.45, ultra: 1.05-1.25, mid: 1.26-1.45
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/patlayan-oranlar');
      const data = await res.json();
      if (data.success) {
        setAllFavorites(data.favorites || []);
        setDistinctDates(data.distinctDates || []);
        setDatePoolCounts(data.datePoolCounts || {});
        setTotalPoolCount(data.totalMatchesInPool || 0);
      }
    } catch (err) {
      console.error('Veri çekme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Distinct leagues for filter
  const availableLeagues = useMemo(() => {
    const set = new Set<string>();
    allFavorites.forEach(m => {
      if (m.league) set.add(m.league);
    });
    return ['all', ...Array.from(set).sort()];
  }, [allFavorites]);

  // DYNAMIC STATS COMPUTATION BASED ON ACTIVE DATE & ODD RANGE FILTERS
  const dynamicStats = useMemo(() => {
    let poolTotal = 0;
    if (selectedDate === 'all') {
      poolTotal = totalPoolCount;
    } else {
      poolTotal = datePoolCounts[selectedDate] || 0;
    }

    const matchingFavorites = allFavorites.filter(m => {
      if (selectedDate !== 'all' && m.date !== selectedDate) return false;
      if (oddRangeFilter === 'ultra' && (m.favoriteOdd < 1.05 || m.favoriteOdd > 1.25)) return false;
      if (oddRangeFilter === 'mid' && (m.favoriteOdd <= 1.25 || m.favoriteOdd > 1.45)) return false;
      return true;
    });

    const totalFavCount = matchingFavorites.length;
    const bustedFavorites = matchingFavorites.filter(m => m.isBusted);
    const totalBustedCount = bustedFavorites.length;
    const bustedRate = totalFavCount > 0 ? ((totalBustedCount / totalFavCount) * 100).toFixed(1) : '0';

    let rangeLabel = '1.05 - 1.45';
    if (oddRangeFilter === 'ultra') rangeLabel = '1.05 - 1.25 (Ağır Favori)';
    if (oddRangeFilter === 'mid') rangeLabel = '1.26 - 1.45';

    let dateLabel = 'Son 3 Gün';
    if (selectedDate !== 'all') {
      dateLabel = formatTurkishDate(selectedDate);
    }

    return {
      poolTotal,
      totalFavCount,
      totalBustedCount,
      bustedRate,
      rangeLabel,
      dateLabel,
      favPercentage: poolTotal > 0 ? Math.round((totalFavCount / poolTotal) * 100) : 0
    };
  }, [allFavorites, selectedDate, oddRangeFilter, totalPoolCount, datePoolCounts]);

  // Filtered Busted Matches for the Card List
  const filteredBustedMatches = useMemo(() => {
    return allFavorites.filter(m => {
      if (!m.isBusted) return false;
      if (selectedDate !== 'all' && m.date !== selectedDate) return false;
      if (outcomeFilter !== 'all' && m.outcomeType !== outcomeFilter) return false;
      if (oddRangeFilter === 'ultra' && (m.favoriteOdd < 1.05 || m.favoriteOdd > 1.25)) return false;
      if (oddRangeFilter === 'mid' && (m.favoriteOdd <= 1.25 || m.favoriteOdd > 1.45)) return false;
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
  }, [allFavorites, selectedDate, outcomeFilter, oddRangeFilter, selectedLeague, searchTerm]);

  // Counts for Date pills based on current oddRangeFilter
  const datePillCounts = useMemo(() => {
    const calcForDate = (d: string) => {
      return allFavorites.filter(m => {
        if (!m.isBusted) return false;
        if (d !== 'all' && m.date !== d) return false;
        if (oddRangeFilter === 'ultra' && (m.favoriteOdd < 1.05 || m.favoriteOdd > 1.25)) return false;
        if (oddRangeFilter === 'mid' && (m.favoriteOdd <= 1.25 || m.favoriteOdd > 1.45)) return false;
        return true;
      }).length;
    };

    const counts: Record<string, number> = {
      all: calcForDate('all')
    };

    distinctDates.forEach(d => {
      counts[d] = calcForDate(d);
    });

    return counts;
  }, [allFavorites, oddRangeFilter, distinctDates]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER & HERO */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 mb-8 transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-rose-950/20 border-slate-800 shadow-2xl' 
            : 'bg-gradient-to-br from-white via-rose-50/40 to-amber-50/30 border-slate-200 shadow-md'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm ${
                  isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Risk & Patlama Analizi
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                  isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  <Flame className="w-3.5 h-3.5" />
                  Son 3 Günün Arşivi
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                💥 Patlayan Favori Oranlar Analizi
              </h1>
              <p className={`text-xs sm:text-sm max-w-3xl ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                Oranı <strong>1.05 ile 1.45 arasında</strong> açılan ancak kazanamayıp berabere (MS 0) kalan veya ters galibiyetle sonuçlanan tüm favori maçlar ve detaylı bülten oranları.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-2xl border transition duration-150 cursor-pointer shadow-sm flex items-center justify-center ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-800 text-yellow-400 hover:bg-slate-800'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm'
                }`}
                title={isDark ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5 text-slate-700" />}
              </button>
            </div>
          </div>

          {/* STATS OVERVIEW CARDS (DINAMIK OLARAK GÜNCELLENIR) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-8">
            
            {/* Card 1: Taranan Toplam Maç */}
            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Taranan Toplam Maç</span>
                <BarChart3 className="w-4 h-4 text-sky-500" />
              </div>
              <div className={`text-2xl md:text-3xl font-black mt-2 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                {dynamicStats.poolTotal} <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Maç</span>
              </div>
              <div className={`text-[11px] mt-1 truncate ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>{dynamicStats.dateLabel}</div>
            </div>

            {/* Card 2: Favori Maç */}
            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold truncate ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Favori ({dynamicStats.rangeLabel})</span>
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
              <div className={`text-2xl md:text-3xl font-black mt-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                {dynamicStats.totalFavCount} <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Maç</span>
              </div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>Havuzun %{dynamicStats.favPercentage}'si</div>
            </div>

            {/* Card 3: Patlayan Favoriler */}
            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>Patlayan Favoriler</span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <div className={`text-2xl md:text-3xl font-black mt-2 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                {dynamicStats.totalBustedCount} <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Maç</span>
              </div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>Berabere veya Sürpriz</div>
            </div>

            {/* Card 4: Genel Patlama Oranı */}
            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>Filtre Patlama Oranı</span>
                <AlertTriangle className="w-4 h-4 text-purple-500" />
              </div>
              <div className={`text-2xl md:text-3xl font-black mt-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                %{dynamicStats.bustedRate}
              </div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>
                {dynamicStats.totalFavCount > 0 ? `${dynamicStats.totalFavCount} favoriden ${dynamicStats.totalBustedCount}'i patladı` : 'Veri yok'}
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
              placeholder="Takım veya lig ara (Örn: Liverpool, Chelsea, Real Madrid, Premier League)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-2xl py-3 pl-11 pr-10 text-sm transition shadow-sm ${
                isDark 
                  ? 'bg-slate-900/70 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-rose-500/50' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-rose-500 shadow-sm font-medium'
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

          {/* Date Filter Pills (Dinamik Son 3 Gün) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className={`text-xs font-bold shrink-0 mr-1 ${isDark ? 'text-slate-500' : 'text-slate-700'}`}>Tarih:</span>
            
            {/* Tüm Günler */}
            <button
              onClick={() => setSelectedDate('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition cursor-pointer flex items-center gap-2 ${
                selectedDate === 'all'
                  ? isDark
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm'
                    : 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : isDark
                    ? 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/40'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm font-bold'
              }`}
            >
              <Calendar className="w-3 h-3 opacity-70" />
              <span>Tüm Günler (Son 3 Gün)</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedDate === 'all' 
                  ? isDark ? 'bg-rose-500 text-slate-950 font-black' : 'bg-white/30 text-white font-black'
                  : isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-700 font-bold'
              }`}>
                {datePillCounts.all || 0}
              </span>
            </button>

            {/* Dinamik Gün Butonları */}
            {distinctDates.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition cursor-pointer flex items-center gap-2 ${
                  selectedDate === d
                    ? isDark
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm'
                      : 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : isDark
                      ? 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/40'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm font-bold'
                }`}
              >
                <Calendar className="w-3 h-3 opacity-70" />
                <span>{formatTurkishDate(d)}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedDate === d
                    ? isDark ? 'bg-rose-500 text-slate-950 font-black' : 'bg-white/30 text-white font-black'
                    : isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-700 font-bold'
                }`}>
                  {datePillCounts[d] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Outcome Filter & Odd Range */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Outcome Filter */}
            <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`text-[11px] font-bold px-2 ${isDark ? 'text-slate-500' : 'text-slate-700'}`}>Bitiş Türü:</span>
              <button
                onClick={() => setOutcomeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  outcomeFilter === 'all'
                    ? isDark ? 'bg-sky-500 text-white shadow-sm' : 'bg-sky-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                }`}
              >
                Hepsi
              </button>
              <button
                onClick={() => setOutcomeFilter('0')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  outcomeFilter === '0'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                }`}
              >
                ⭕ Berabere (MS 0)
              </button>
              <button
                onClick={() => setOutcomeFilter('reverse')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  outcomeFilter === 'reverse'
                    ? isDark ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                }`}
              >
                🔄 Ters Galibiyet (1 veya 2)
              </button>
            </div>

            {/* Odd Range Filter */}
            <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`text-[11px] font-bold px-2 ${isDark ? 'text-slate-500' : 'text-slate-700'}`}>Oran Aralığı:</span>
              <button
                onClick={() => setOddRangeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  oddRangeFilter === 'all'
                    ? isDark ? 'bg-purple-500 text-white shadow-sm' : 'bg-purple-600 text-white shadow-sm font-bold'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                }`}
              >
                1.05 - 1.45
              </button>
              <button
                onClick={() => setOddRangeFilter('ultra')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  oddRangeFilter === 'ultra'
                    ? 'bg-rose-600 text-white shadow-sm font-bold'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                }`}
              >
                🔥 Ağır Favori (1.05 - 1.25)
              </button>
              <button
                onClick={() => setOddRangeFilter('mid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  oddRangeFilter === 'mid'
                    ? isDark ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-600 text-white shadow-sm font-bold'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                }`}
              >
                1.26 - 1.45
              </button>
            </div>

            {/* League Dropdown */}
            {availableLeagues.length > 2 && (
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition outline-none cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800 shadow-sm'
                }`}
              >
                <option value="all">Tüm Ligler ({availableLeagues.length - 1})</option>
                {availableLeagues.filter(l => l !== 'all').map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* MATCHES LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-4" />
            <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Son 3 günün maçları taranıyor...</span>
          </div>
        ) : filteredBustedMatches.length > 0 ? (
          <>
            <div className={`flex items-center justify-between text-xs font-bold mb-4 px-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>
                Filtreye uygun <strong className="text-rose-500 font-extrabold">{filteredBustedMatches.length}</strong> patlayan maç listeleniyor
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredBustedMatches.map((m) => {
                const isHomeFav = m.favoriteType.includes('Ev Sahibi');
                const isDraw = m.outcomeType === '0';

                return (
                  <div
                    key={m.id}
                    className={`p-5 rounded-3xl border transition-all hover:shadow-xl relative overflow-hidden ${
                      isDark
                        ? 'bg-gradient-to-br from-slate-900/90 via-[#111625]/80 to-slate-900/90 border-slate-800 hover:border-rose-500/50'
                        : 'bg-white border-slate-200 hover:border-rose-400 shadow-md'
                    }`}
                  >
                    {/* TOP INFO BAR */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                          isDraw
                            ? isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isDark ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}>
                          {isDraw ? '⭕ MS 0 (BERABERE)' : '🔄 TERS GALİBİYET'}
                        </span>
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {m.date} • {m.time}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-black uppercase tracking-wider truncate block max-w-[180px] ${
                          isDark ? 'text-sky-400' : 'text-sky-700'
                        }`} title={m.league}>
                          {m.league}
                        </span>
                      </div>
                    </div>

                    {/* TEAMS & SCORES */}
                    <div className={`p-4 rounded-2xl border my-3 ${
                      isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200/90'
                    }`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-1.5">
                          {/* Ev Sahibi */}
                          <div className="flex items-center gap-2">
                            <span className={`text-sm md:text-base font-black truncate ${
                              isHomeFav 
                                ? 'text-rose-500' 
                                : isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                              {m.homeTeam}
                            </span>
                            {isHomeFav && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                                isDark 
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                Favori ({m.favoriteOdd.toFixed(2)})
                              </span>
                            )}
                          </div>

                          {/* Deplasman */}
                          <div className="flex items-center gap-2">
                            <span className={`text-sm md:text-base font-black truncate ${
                              !isHomeFav 
                                ? 'text-rose-500' 
                                : isDark ? 'text-slate-300' : 'text-slate-800'
                            }`}>
                              {m.awayTeam}
                            </span>
                            {!isHomeFav && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                                isDark 
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                Favori ({m.favoriteOdd.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* SCORE BADGES */}
                        <div className="flex flex-col items-center gap-1 shrink-0 text-right">
                          <div className="text-xl md:text-2xl font-black text-rose-600 tracking-wider">
                            {m.score}
                          </div>
                          <span className={`text-[11px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                            İY: {m.iyScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BUSTED RESULT SUMMARY */}
                    <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between mb-3 border ${
                      isDark ? 'bg-rose-950/20 border-rose-900/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Patlama Detayı:</span>
                      </div>
                      <span className="font-extrabold">
                        {m.favoriteType} ({m.favoriteOdd.toFixed(2)}) ➡️ {m.actualResult}
                      </span>
                    </div>

                    {/* FULL ODDS BAR */}
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[11px] pt-1">
                      <div className={`p-1.5 rounded-lg border ${
                        isHomeFav 
                          ? isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-black' : 'bg-rose-100 border-rose-300 text-rose-900 font-black' 
                          : isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-800 font-bold'
                      }`}>
                        <span className={`block text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>MS 1</span>
                        <span>{m.odds.ms1}</span>
                      </div>

                      <div className={`p-1.5 rounded-lg border ${
                        isDraw 
                          ? isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-black' : 'bg-amber-100 border-amber-300 text-amber-900 font-black' 
                          : isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-800 font-bold'
                      }`}>
                        <span className={`block text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>MS 0</span>
                        <span>{m.odds.ms0}</span>
                      </div>

                      <div className={`p-1.5 rounded-lg border ${
                        !isHomeFav 
                          ? isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-black' : 'bg-rose-100 border-rose-300 text-rose-900 font-black' 
                          : isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-800 font-bold'
                      }`}>
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
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
            <h4 className={`text-base font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Seçilen Filtrelere Uygun Maç Bulunamadı</h4>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Lütfen tarih, lig veya oran aralığı filtrelerini genişleterek tekrar deneyin.</p>
          </div>
        )}

      </main>
    </div>
  );
}
