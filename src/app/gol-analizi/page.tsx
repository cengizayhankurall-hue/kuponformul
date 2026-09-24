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
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  History,
  Clock,
  ChevronRight,
  ShieldCheck,
  Check,
  Timer
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

interface PastGoalMatch extends GoalMatch {
  score?: string;
  halfTimeScore?: string;
  status?: string;
  totalGoals?: number;
  isHtOver15?: boolean;
  isUst25Won?: boolean;
  isUst35Won?: boolean;
  isUst45Won?: boolean;
  isUst55Won?: boolean;
  isUst65Won?: boolean;
  isKgVarWon?: boolean;
  isHerIkiYari15UstWon?: boolean;
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
  pastStats?: {
    totalPlayed: number;
    ht15Won?: number;
    ht15Rate?: number;
    ust25Won: number;
    ust25Rate: number;
    ust35Won: number;
    ust35Rate: number;
    ust45Won: number;
    ust45Rate: number;
    ust55Won?: number;
    ust55Rate?: number;
    ust65Won?: number;
    ust65Rate?: number;
    herIkiYari15Won: number;
    herIkiYari15Rate: number;
    kgVarWon: number;
    kgVarRate: number;
    avgGoals: number;
  };
  pastMatches?: PastGoalMatch[];
  cachedAt: string;
  isRefreshing?: boolean;
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

  // View mode: 'all' (Hem Gelecek Hem Bitenler) | 'upcoming' (Sadece Gelecek) | 'past' (Sadece Bitenler)
  const [viewMode, setViewMode] = useState<'all' | 'upcoming' | 'past'>('all');

  // Filters
  const [diffFilter, setDiffFilter] = useState<'0.20' | '0.10' | 'exact' | 'all'>('0.20');
  const [selectedUpcomingDate, setSelectedUpcomingDate] = useState<string>('all');
  const [selectedPastDate, setSelectedPastDate] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();

    // 90 saniyede bir arka planda sessizce taze veriyi kontrol et
    const interval = setInterval(() => {
      fetchData(false, true);
    }, 90000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async (forceRefresh = false, isSilent = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else if (!isSilent && !data) {
      setLoading(true);
    }

    try {
      const url = forceRefresh ? '/api/gol-analizi?refresh=true' : '/api/gol-analizi';
      const res = await fetch(url);
      const json: ApiResponse = await res.json();
      if (json.success) {
        setData(json);

        // Eğer sunucuda arka plan taraması devam ediyorsa, 8 saniye sonra güncel sonucu sessizce al
        if (json.isRefreshing) {
          setTimeout(() => {
            fetchData(false, true);
          }, 8000);
        }
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

  // Filtered Upcoming Matches
  const filteredUpcomingMatches = useMemo(() => {
    if (!data?.matches) return [];

    return data.matches.filter(m => {
      // Diff Filter
      if (diffFilter === '0.20' && m.diff > 0.20) return false;
      if (diffFilter === '0.10' && m.diff > 0.10) return false;
      if (diffFilter === 'exact' && m.diff !== 0.00) return false;

      // Date Filter
      if (selectedUpcomingDate !== 'all' && m.date !== selectedUpcomingDate) return false;

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
  }, [data, diffFilter, selectedUpcomingDate, selectedLeague, searchTerm]);

  // Filtered Past Matches
  const filteredPastMatches = useMemo(() => {
    if (!data?.pastMatches) return [];

    return data.pastMatches.filter(m => {
      // Diff Filter
      if (diffFilter === '0.20' && m.diff > 0.20) return false;
      if (diffFilter === '0.10' && m.diff > 0.10) return false;
      if (diffFilter === 'exact' && m.diff !== 0.00) return false;

      // Date Filter
      if (selectedPastDate !== 'all' && m.date !== selectedPastDate) return false;

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
  }, [data, diffFilter, selectedPastDate, selectedLeague, searchTerm]);

  // Dynamic success rates for filtered past matches (İY 1.5, 2.5, 3.5, 4.5, 5.5, +6 goals, KG Var, etc.)
  const pastStatsDynamic = useMemo(() => {
    const list = filteredPastMatches;
    const total = list.length;
    if (total === 0) {
      return {
        totalPlayed: 0,
        ht15Won: 0,
        ht15Rate: 0,
        ust25Won: 0,
        ust25Rate: 0,
        ust35Won: 0,
        ust35Rate: 0,
        ust45Won: 0,
        ust45Rate: 0,
        ust55Won: 0,
        ust55Rate: 0,
        ust65Won: 0,
        ust65Rate: 0,
        herIkiYari15Won: 0,
        herIkiYari15Rate: 0,
        kgVarWon: 0,
        kgVarRate: 0,
        avgGoals: '0.00'
      };
    }

    const ht15Won = list.filter(m => {
      if (m.isHtOver15 !== undefined) return m.isHtOver15;
      if (m.halfTimeScore) {
        const parts = m.halfTimeScore.split('-').map(Number);
        return (parts[0] + parts[1]) >= 2;
      }
      return false;
    }).length;

    const ust25Won = list.filter(m => (m.totalGoals || 0) >= 3).length;
    const ust35Won = list.filter(m => (m.totalGoals || 0) >= 4).length;
    const ust45Won = list.filter(m => (m.totalGoals || 0) >= 5).length;
    const ust55Won = list.filter(m => (m.totalGoals || 0) >= 6).length;
    const ust65Won = list.filter(m => (m.totalGoals || 0) >= 7).length;
    const herIkiYari15Won = list.filter(m => m.isHerIkiYari15UstWon).length;
    const kgVarWon = list.filter(m => m.isKgVarWon).length;
    const totalGoals = list.reduce((sum, m) => sum + (m.totalGoals || 0), 0);

    return {
      totalPlayed: total,
      ht15Won,
      ht15Rate: Math.round((ht15Won / total) * 100),
      ust25Won,
      ust25Rate: Math.round((ust25Won / total) * 100),
      ust35Won,
      ust35Rate: Math.round((ust35Won / total) * 100),
      ust45Won,
      ust45Rate: Math.round((ust45Won / total) * 100),
      ust55Won,
      ust55Rate: Math.round((ust55Won / total) * 100),
      ust65Won,
      ust65Rate: Math.round((ust65Won / total) * 100),
      herIkiYari15Won,
      herIkiYari15Rate: Math.round((herIkiYari15Won / total) * 100),
      kgVarWon,
      kgVarRate: Math.round((kgVarWon / total) * 100),
      avgGoals: (totalGoals / total).toFixed(2)
    };
  }, [filteredPastMatches]);

  // Date pill counts for Upcoming
  const upcomingDateCounts = useMemo(() => {
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

  // Date pill counts for Past
  const pastDatesList = useMemo(() => {
    if (!data?.pastMatches) return [];
    const set = new Set(data.pastMatches.map(m => m.date).filter(Boolean));
    return Array.from(set).sort((a, b) => {
      const [d1, m1, y1] = a.split('.').map(Number);
      const [d2, m2, y2] = b.split('.').map(Number);
      return new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime();
    });
  }, [data]);

  const pastDateCounts = useMemo(() => {
    if (!data?.pastMatches) return {};
    const counts: Record<string, number> = { all: 0 };

    data.pastMatches.forEach(m => {
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
        <div className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 mb-6 transition-all ${
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
                  Güncel Bülten + Dünün Sonuçları
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                <span>⚽ 4.5 Üst & İki Yarı 1.5 Üst Analizi</span>
              </h1>
              
              <p className={`text-xs sm:text-sm max-w-3xl ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                <strong>Toplam Gol 4.5 Gol Üst</strong> oranı ile <strong>Her İki Yarıda da 1.5 Gol Üst</strong> oranları arasındaki farkı <strong>0.20 ve altında</strong> olan maçların canlı bülteni ve geçmiş maç sonuçları başarı analizi.
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

          {/* VIEW MODE TABS */}
          <div className="flex items-center gap-2.5 mt-6 pt-5 border-t border-slate-800/40 flex-wrap">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
                viewMode === 'all'
                  ? isDark
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/20 shadow-lg'
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
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 shadow-lg'
                    : 'bg-emerald-600 text-white shadow-md'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Gelecek Bülten ({data?.stats?.diff020Count || 0})</span>
            </button>

            <button
              onClick={() => setViewMode('past')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ${
                viewMode === 'past'
                  ? isDark
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 shadow-lg'
                    : 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Dünün Sonuçları ({data?.pastMatches?.filter(m => m.diff <= 0.20)?.length || 0})</span>
            </button>
          </div>

          {/* DÜNÜN DETAYLI GOL BAŞARI KARNESİ (İY 1.5, 2.5, 3.5, 4.5, 5.5, +6, KG VAR) */}
          <div className="mt-6 pt-5 border-t border-slate-800/40">
            <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                <Award className="w-4 h-4 text-amber-500" />
                Dünün (1 Gün Öncesinin) Gol İstatistik Karnesi (Fark ≤ 0.20 Olan {pastStatsDynamic.totalPlayed} Biten Maç)
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Ortalama: <strong className="text-emerald-400 text-sm">{pastStatsDynamic.avgGoals}</strong> Gol / Maç
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 md:gap-3">
              {/* 1. İlk Yarı 1.5 Üst */}
              <div className={`p-3.5 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-cyan-950/30 border-cyan-900/40' : 'bg-cyan-50 border-cyan-200 shadow-sm'
              }`}>
                <div className="text-[11px] font-bold text-cyan-400 mb-1 flex items-center justify-center gap-1">
                  <Timer className="w-3.5 h-3.5" />
                  İY 1.5 Üst
                </div>
                <div className="text-2xl font-black text-cyan-400">%{pastStatsDynamic.ht15Rate}</div>
                <div className={`text-[10px] mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {pastStatsDynamic.ht15Won} / {pastStatsDynamic.totalPlayed} Kazandı
                </div>
              </div>

              {/* 2. Her İki Yarı 1.5 Üst */}
              <div className={`p-3.5 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-indigo-950/30 border-indigo-900/40' : 'bg-indigo-50 border-indigo-200 shadow-sm'
              }`}>
                <div className="text-[11px] font-bold text-indigo-400 mb-1 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  2Y 1.5 Üst
                </div>
                <div className="text-2xl font-black text-indigo-400">%{pastStatsDynamic.herIkiYari15Rate}</div>
                <div className={`text-[10px] mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {pastStatsDynamic.herIkiYari15Won} / {pastStatsDynamic.totalPlayed} Kazandı
                </div>
              </div>

              {/* 3. 2.5 Üst */}
              <div className={`p-3.5 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-emerald-950/30 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200 shadow-sm'
              }`}>
                <div className="text-[11px] font-bold text-emerald-400 mb-1">2.5 Gol Üst</div>
                <div className="text-2xl font-black text-emerald-400">%{pastStatsDynamic.ust25Rate}</div>
                <div className={`text-[10px] mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {pastStatsDynamic.ust25Won} / {pastStatsDynamic.totalPlayed} Kazandı
                </div>
              </div>

              {/* 4. 3.5 Üst */}
              <div className={`p-3.5 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-teal-950/30 border-teal-900/40' : 'bg-teal-50 border-teal-200 shadow-sm'
              }`}>
                <div className="text-[11px] font-bold text-teal-400 mb-1">3.5 Gol Üst</div>
                <div className="text-2xl font-black text-teal-400">%{pastStatsDynamic.ust35Rate}</div>
                <div className={`text-[10px] mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {pastStatsDynamic.ust35Won} / {pastStatsDynamic.totalPlayed} Kazandı
                </div>
              </div>

              {/* 5. 4.5 Üst */}
              <div className={`p-3.5 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-amber-950/30 border-amber-900/40' : 'bg-amber-50 border-amber-200 shadow-sm'
              }`}>
                <div className="text-[11px] font-bold text-amber-400 mb-1">4.5 Gol Üst</div>
                <div className="text-2xl font-black text-amber-400">%{pastStatsDynamic.ust45Rate}</div>
                <div className={`text-[10px] mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {pastStatsDynamic.ust45Won} / {pastStatsDynamic.totalPlayed} Kazandı
                </div>
              </div>

              {/* 6. 5.5 Üst */}
              <div className={`p-3.5 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-orange-950/30 border-orange-900/40' : 'bg-orange-50 border-orange-200 shadow-sm'
              }`}>
                <div className="text-[11px] font-bold text-orange-400 mb-1">5.5 Gol Üst</div>
                <div className="text-2xl font-black text-orange-400">%{pastStatsDynamic.ust55Rate}</div>
                <div className={`text-[10px] mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {pastStatsDynamic.ust55Won} / {pastStatsDynamic.totalPlayed} Kazandı
                </div>
              </div>

              {/* 7. +6 Gol / 6.5 Üst */}
              <div className={`p-3.5 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-purple-950/30 border-purple-900/40' : 'bg-purple-50 border-purple-200 shadow-sm'
              }`}>
                <div className="text-[11px] font-bold text-purple-400 mb-1">+6 Gol (6.5 Üst)</div>
                <div className="text-2xl font-black text-purple-400">%{pastStatsDynamic.ust65Rate}</div>
                <div className={`text-[10px] mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {pastStatsDynamic.ust65Won} / {pastStatsDynamic.totalPlayed} Kazandı
                </div>
              </div>

              {/* 8. KG Var */}
              <div className={`p-3.5 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-sky-950/30 border-sky-900/40' : 'bg-sky-50 border-sky-200 shadow-sm'
              }`}>
                <div className="text-[11px] font-bold text-sky-400 mb-1">KG Var</div>
                <div className="text-2xl font-black text-sky-400">%{pastStatsDynamic.kgVarRate}</div>
                <div className={`text-[10px] mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {pastStatsDynamic.kgVarWon} / {pastStatsDynamic.totalPlayed} Kazandı
                </div>
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

          {/* Diff Range & League Filters */}
          <div className="flex flex-wrap items-center gap-3">
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
                Tümü (Bülten: {data?.stats?.totalWithBothOdds || 0} | Biten: {data?.pastMatches?.length || 0})
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

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Bülten ve sonuçlar yükleniyor...</span>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* ======================================================== */}
            {/* SECTION 1: GELECEK BÜLTEN MAÇLARI                        */}
            {/* ======================================================== */}
            {(viewMode === 'all' || viewMode === 'upcoming') && (
              <section id="section-upcoming" className="space-y-4">
                
                {/* Section Header (Cleanly Structured) */}
                <div className="p-4 rounded-2xl border bg-slate-900/40 border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Clock className="w-5 h-5" />
                      </span>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
                          <span>🟢 Gelecek Oynanmamış Bülten</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950">
                            {filteredUpcomingMatches.length} Maç
                          </span>
                        </h2>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Gelecek günlerin oynanmamış maçları (En düşük farktan yükseğe sıralı)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Date Pills (Full Width, Wrap, No truncation) */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800/40">
                    <span className={`text-xs font-bold mr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tarih Seç:</span>
                    <button
                      onClick={() => setSelectedUpcomingDate('all')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 ${
                        selectedUpcomingDate === 'all'
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : isDark
                            ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm font-bold'
                      }`}
                    >
                      <span>Tüm Günler</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        selectedUpcomingDate === 'all' 
                          ? isDark ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/30 text-white font-black'
                          : isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-700 font-bold'
                      }`}>
                        {upcomingDateCounts.all || 0}
                      </span>
                    </button>

                    {(data?.availableDates || []).map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedUpcomingDate(d)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 ${
                          selectedUpcomingDate === d
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                              : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : isDark
                              ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm font-bold'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        <span>{formatTurkishDate(d)}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          selectedUpcomingDate === d
                            ? isDark ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/30 text-white font-black'
                            : isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-700 font-bold'
                        }`}>
                          {upcomingDateCounts[d] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {filteredUpcomingMatches.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredUpcomingMatches.map((m) => {
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

                          {/* COMPARISON BOX */}
                          <div className={`p-3.5 rounded-2xl border mb-3 ${
                            isDark 
                              ? 'bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-teal-950/30 border-emerald-900/40' 
                              : 'bg-gradient-to-r from-emerald-50 via-slate-50 to-teal-50 border-emerald-200'
                          }`}>
                            <div className="grid grid-cols-2 gap-3">
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
                                    Alt: {m.odd45Alt.toFixed(2)}
                                  </div>
                                )}
                              </div>

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
                                    Alt: {m.oddHerIkiYari15Alt.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ODDS BAR */}
                          <div className="grid grid-cols-5 gap-1.5 text-center text-[11px]">
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
                ) : (
                  <div className={`text-center py-16 rounded-3xl border ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <Target className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
                    <h4 className={`text-base font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Gelecek Bülten Maçı Bulunamadı</h4>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Fark filtresini (Tümü) genişleterek veya farklı bir tarih seçerek tekrar deneyin.</p>
                  </div>
                )}
              </section>
            )}

            {/* ======================================================== */}
            {/* SECTION 2: DÜNÜN (1 GÜN ÖNCESİ) BİTEN SONUÇLARI VE DOĞRULAMA */}
            {/* ======================================================== */}
            {(viewMode === 'all' || viewMode === 'past') && (
              <section id="section-past" className="space-y-4 pt-6 border-t-2 border-dashed border-amber-500/20">
                
                {/* Section Header (Cleanly Structured) */}
                <div className="p-4 rounded-2xl border bg-slate-900/40 border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <History className="w-5 h-5" />
                      </span>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
                          <span>🏆 Dünün (1 Gün Öncesinin) Biten Sonuçları & Doğrulama Karnesi</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950">
                            {filteredPastMatches.length} Maç Bitti
                          </span>
                        </h2>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Dün bu kıstasa uyan maçların gerçek maç skorları, ilk yarı sonuçları ve başarı durumları
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Past Date Pills */}
                  {pastDatesList.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800/40">
                      <span className={`text-xs font-bold mr-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Biten Tarih:</span>
                      <button
                        onClick={() => setSelectedPastDate('all')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 ${
                          selectedPastDate === 'all'
                            ? isDark
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                              : 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                            : isDark
                              ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm font-bold'
                        }`}
                      >
                        <span>Dünün Tüm Maçları</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          selectedPastDate === 'all' 
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-700 font-bold'
                        }`}>
                          {pastDateCounts.all || 0}
                        </span>
                      </button>

                      {pastDatesList.map(d => (
                        <button
                          key={d}
                          onClick={() => setSelectedPastDate(d)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 ${
                            selectedPastDate === d
                              ? isDark
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                                : 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                              : isDark
                                ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm font-bold'
                          }`}
                        >
                          <History className="w-3.5 h-3.5 opacity-70" />
                          <span>{formatTurkishDate(d)}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            selectedPastDate === d
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : isDark ? 'bg-slate-500/10 text-slate-500' : 'bg-slate-100 text-slate-700 font-bold'
                          }`}>
                            {pastDateCounts[d] || 0}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {filteredPastMatches.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredPastMatches.map((m) => {
                      const isExact = m.diff === 0.00;
                      const isUltraClose = m.diff <= 0.10;

                      // Check if First Half was Over 1.5
                      let isHtOver15 = m.isHtOver15;
                      if (isHtOver15 === undefined && m.halfTimeScore) {
                        const parts = m.halfTimeScore.split('-').map(Number);
                        isHtOver15 = (parts[0] + parts[1]) >= 2;
                      }

                      return (
                        <div
                          key={m.id || m.eventId}
                          className={`p-5 rounded-3xl border transition-all hover:shadow-xl relative overflow-hidden ${
                            isDark
                              ? 'bg-gradient-to-br from-slate-900/90 via-[#111625]/80 to-slate-900/90 border-slate-800 hover:border-amber-500/50'
                              : 'bg-white border-slate-200 hover:border-amber-400 shadow-md'
                          }`}
                        >
                          {/* TOP INFO BAR (BÜLTENLE BİREBİR AYNI) */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
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
                                {m.date} {m.time ? `• ${m.time}` : ''}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className={`text-xs font-black uppercase tracking-wider truncate block max-w-[160px] ${
                                isDark ? 'text-amber-400' : 'text-amber-700'
                              }`} title={m.league}>
                                {m.league}
                              </span>
                            </div>
                          </div>

                          {/* TEAMS WITH PROMINENT FINAL SCORE BOX (BÜLTEN TASARIMI) */}
                          <div className={`p-4 rounded-2xl border my-3 ${
                            isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200/90'
                          }`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-base md:text-lg font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {m.homeTeam || 'Ev Sahibi'}
                                  </span>
                                  <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ev</span>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-base md:text-lg font-black truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {m.awayTeam || 'Deplasman'}
                                  </span>
                                  <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Dep</span>
                                </div>
                              </div>

                              {/* SCORE BADGE */}
                              <div className="text-center px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 shrink-0 min-w-[90px]">
                                <div className="text-xl md:text-2xl font-black text-amber-400 tracking-wider">
                                  {m.score || 'MS'}
                                </div>
                                {m.halfTimeScore && (
                                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                    İY: {m.halfTimeScore}
                                  </div>
                                )}
                                <div className="text-[10px] text-emerald-400 font-extrabold mt-0.5">
                                  {m.totalGoals || 0} Gol
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* COMPARISON BOX (BÜLTENLE BİREBİR AYNI + KAZANDI/KAYBETTİ ROZETLERİ) */}
                          <div className={`p-3.5 rounded-2xl border mb-3 ${
                            isDark 
                              ? 'bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-teal-950/20 border-slate-800' 
                              : 'bg-gradient-to-r from-emerald-50 via-slate-50 to-teal-50 border-emerald-200'
                          }`}>
                            <div className="grid grid-cols-2 gap-3">
                              {/* 4.5 Üst Box */}
                              <div className={`p-3 rounded-xl border text-center transition ${
                                m.isUst45Won
                                  ? isDark ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-900'
                                  : isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                              }`}>
                                <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider mb-1">
                                  {m.isUst45Won ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                                  <span>⚽ Toplam 4.5 Üst</span>
                                </div>
                                <div className={`text-2xl font-black ${m.isUst45Won ? 'text-emerald-400' : 'text-slate-300'}`}>
                                  {m.odd45Ust.toFixed(2)}
                                </div>
                                <div className={`text-[10px] font-black mt-0.5 ${m.isUst45Won ? 'text-emerald-400' : 'text-rose-400/80'}`}>
                                  {m.isUst45Won ? '✅ KAZANDI (5+ Gol)' : '❌ Gelmedi'}
                                </div>
                              </div>

                              {/* Her İki Yarı 1.5 Üst Box */}
                              <div className={`p-3 rounded-xl border text-center transition ${
                                m.isHerIkiYari15UstWon
                                  ? isDark ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-900'
                                  : isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                              }`}>
                                <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider mb-1">
                                  {m.isHerIkiYari15UstWon ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                                  <span>⏱️ 2Y 1.5 Üst</span>
                                </div>
                                <div className={`text-2xl font-black ${m.isHerIkiYari15UstWon ? 'text-emerald-400' : 'text-slate-300'}`}>
                                  {m.oddHerIkiYari15Ust.toFixed(2)}
                                </div>
                                <div className={`text-[10px] font-black mt-0.5 ${m.isHerIkiYari15UstWon ? 'text-emerald-400' : 'text-rose-400/80'}`}>
                                  {m.isHerIkiYari15UstWon ? '✅ KAZANDI' : '❌ Gelmedi'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* OUTCOME MARKET PILLS: İY 1.5, 2Y 1.5, 2.5 Üst, 3.5 Üst, KG Var, 5.5 Üst */}
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-center text-[10px] sm:text-[11px]">
                            {/* İY 1.5 Üst */}
                            <div className={`p-1.5 rounded-lg border font-black flex items-center justify-center gap-0.5 ${
                              isHtOver15
                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                                : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
                            }`}>
                              {isHtOver15 ? <Check className="w-3 h-3 text-cyan-400" /> : <X className="w-3 h-3 text-slate-600" />}
                              <span>İY 1.5</span>
                            </div>

                            {/* Her İki Yarı 1.5 Üst */}
                            <div className={`p-1.5 rounded-lg border font-black flex items-center justify-center gap-0.5 ${
                              m.isHerIkiYari15UstWon
                                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                                : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
                            }`}>
                              {m.isHerIkiYari15UstWon ? <Check className="w-3 h-3 text-indigo-400" /> : <X className="w-3 h-3 text-slate-600" />}
                              <span>2Y 1.5</span>
                            </div>

                            {/* 2.5 Üst */}
                            <div className={`p-1.5 rounded-lg border font-black flex items-center justify-center gap-0.5 ${
                              m.isUst25Won
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
                            }`}>
                              {m.isUst25Won ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                              <span>2.5 ÜST</span>
                            </div>

                            {/* 3.5 Üst */}
                            <div className={`p-1.5 rounded-lg border font-black flex items-center justify-center gap-0.5 ${
                              m.isUst35Won
                                ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                                : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
                            }`}>
                              {m.isUst35Won ? <Check className="w-3 h-3 text-teal-400" /> : <X className="w-3 h-3 text-slate-600" />}
                              <span>3.5 ÜST</span>
                            </div>

                            {/* KG Var */}
                            <div className={`p-1.5 rounded-lg border font-black flex items-center justify-center gap-0.5 ${
                              m.isKgVarWon
                                ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                                : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
                            }`}>
                              {m.isKgVarWon ? <Check className="w-3 h-3 text-sky-400" /> : <X className="w-3 h-3 text-slate-600" />}
                              <span>KG VAR</span>
                            </div>

                            {/* 5.5 Üst */}
                            <div className={`p-1.5 rounded-lg border font-black flex items-center justify-center gap-0.5 ${
                              m.isUst55Won
                                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                                : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
                            }`}>
                              {m.isUst55Won ? <Check className="w-3 h-3 text-orange-400" /> : <X className="w-3 h-3 text-slate-600" />}
                              <span>5.5 ÜST</span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`text-center py-16 rounded-3xl border ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <History className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
                    <h4 className={`text-base font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Biten Maç Bulunamadı</h4>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Fark filtresini (Tümü) olarak değiştirerek tekrar deneyebilirsiniz.</p>
                  </div>
                )}
              </section>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
