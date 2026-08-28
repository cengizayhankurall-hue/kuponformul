'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Search, RefreshCw, AlertTriangle, TrendingUp, ChevronLeft, ChevronRight, Clock, Sparkles, Activity, X, Sun, Moon, Bot, Award, CheckCircle, XCircle, Check } from 'lucide-react';
import { supabase, dbService } from '@/lib/supabase';

interface IddaaMatch {
  id?: string;
  code: string;
  league: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  ms1: string;
  msX: string;
  ms2: string;
  iy1?: string;
  iyX?: string;
  iy2?: string;
  kgVar?: string;
  kgYok?: string;
  cs1X: string;
  cs12: string;
  csX2: string;
  iyAlt15?: string;
  iyUst15?: string;
  alt15?: string;
  ust15?: string;
  alt25: string;
  ust25: string;
  alt35?: string;
  ust35?: string;
  isLive?: boolean;
  liveStatus?: number;
  score?: string;
}

const isMatchStarted = (dateStr: string, timeStr: string) => {
  try {
    if (!dateStr || !timeStr) return false;
    const parts = dateStr.split('.').map(Number);
    const day = parts[0];
    const month = parts[1];
    const year = parts[2] || new Date().getFullYear();
    const [hour, minute] = timeStr.split(':').map(Number);
    const matchDate = new Date(year, month - 1, day, hour, minute);
    return matchDate.getTime() < Date.now();
  } catch (e) {
    return false;
  }
};

const getMatchStatus = (dateStr: string, timeStr: string, isLive?: boolean, liveStatus?: any): 'NOT_STARTED' | 'LIVE' | 'FINISHED' => {
  try {
    if (liveStatus === 4 || liveStatus === '4' || liveStatus === 'MS' || liveStatus === 'Bitti') {
      return 'FINISHED';
    }
    if (isLive || liveStatus === 1 || liveStatus === 2 || liveStatus === 3 || liveStatus === 'İlk Yarı' || liveStatus === 'Devre Arası' || liveStatus === 'İkinci Yarı') {
      return 'LIVE';
    }
    if (!dateStr || !timeStr) return 'NOT_STARTED';
    const parts = dateStr.split('.').map(Number);
    const day = parts[0];
    const month = parts[1];
    const year = parts[2] || new Date().getFullYear();
    const [hour, minute] = timeStr.split(':').map(Number);
    const matchDate = new Date(year, month - 1, day, hour, minute);
    const diffMs = Date.now() - matchDate.getTime();
    
    if (diffMs < 0) {
      return 'NOT_STARTED';
    } else if (diffMs <= 115 * 60 * 1000) {
      // 0 - 115 dakika arası (Oynanıyor / Canlı)
      return 'LIVE';
    } else {
      // 115 dakikadan fazla geçmişse (Bitti / MS)
      return 'FINISHED';
    }
  } catch (e) {
    return 'NOT_STARTED';
  }
};

export default function IddaaPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<IddaaMatch[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [extensionStatus, setExtensionStatus] = useState<'checking' | 'detected' | 'not_detected'>('checking');
  const [activeSource, setActiveSource] = useState<'Bülten (Doğrudan)' | 'Canlı (Eklenti)' | 'Nesine (Eklenti)' | 'Maçkolik (Eklenti)' | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('Tümü');
  const [selectedDate, setSelectedDate] = useState<string>('Tümü');
  const [hideStarted, setHideStarted] = useState(false); // Do not hide matches by default
  
  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [cartStake, setCartStake] = useState<number>(10);
  const [isSavingCart, setIsSavingCart] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // News State
  const [news, setNews] = useState<any[]>([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  


  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Analysis Modal State
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisMatch, setAnalysisMatch] = useState<any | null>(null);
  const [analysisData, setAnalysisData] = useState<any | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Detailed odds popup state
  const [detailedOdds, setDetailedOdds] = useState<any[] | null>(null);
  const [loadingOdds, setLoadingOdds] = useState(false);
  const [oddsError, setOddsError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'main' | 'goals' | 'halves' | 'combos' | 'players'>('main');

  // Daily AI Coupons
  const [dailyCoupons, setDailyCoupons] = useState<any[] | null>(null);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponsError, setCouponsError] = useState<string | null>(null);

  // Daily AI Picks (Vitrin)
  const [dailyPicks, setDailyPicks] = useState<{banko: any[], value: any[]} | null>(null);
  const [loadingDailyPicks, setLoadingDailyPicks] = useState(false);
  const [dailyPicksModalOpen, setDailyPicksModalOpen] = useState(false);
  const [picksModalLeague, setPicksModalLeague] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [activeDailyPicksTab, setActiveDailyPicksTab] = useState<'banko' | 'value'>('banko');
  const [dailyPicksError, setDailyPicksError] = useState<string | null>(null);
  const [dailyPicksTab, setDailyPicksTab] = useState<'today' | 'yesterday'>('today');
  const [selectedDaysAgo, setSelectedDaysAgo] = useState<number>(1);
  const [yesterdayStatusFilter, setYesterdayStatusFilter] = useState<'all' | 'won' | 'lost'>('all');
  const [yesterdayPicksData, setYesterdayPicksData] = useState<any>(null);
  const [loadingYesterdayPicks, setLoadingYesterdayPicks] = useState(false);

  const handleLoadYesterdayPicks = async (daysAgo: number = 1) => {
    setDailyPicksTab('yesterday');
    setSelectedDaysAgo(daysAgo);
    
    if (loadingYesterdayPicks) return;
    if (yesterdayPicksData && yesterdayPicksData._daysAgo === daysAgo) {
      return;
    }
    
    setLoadingYesterdayPicks(true);
    try {
      const res = await fetch(`/api/generate-daily-picks/yesterday?daysAgo=${daysAgo}`);
      const data = await res.json();
      if (data.success) {
        setYesterdayPicksData({ ...data, _daysAgo: daysAgo });
      }
    } catch (err) {
      console.error('Error fetching yesterday picks:', err);
    } finally {
      setLoadingYesterdayPicks(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Haberleri Yükle
  useEffect(() => {
    async function loadNews() {
      const res = await dbService.getActiveNews('iddaa');
      if (res.data && res.data.length > 0) {
        setNews(res.data);
      } else {
        setNews([{
          id: 'static-1',
          title: 'YAPAY ZEKA İDDAA ASİSTANI YAYINDA',
          description: 'İddaa bültenindeki maçların istatistiklerini, güven oranlarını ve en çok kazandıran tahminleri yapay zekaya sorun.',
          badge_text: 'Yeni Özellik',
          button_text: 'Nasıl Kullanılır?',
          button_action: 'modal:video',
          bg_image_url: 'https://images.unsplash.com/photo-1518605368461-1e1e11425121?w=600&auto=format&fit=crop&q=60',
          is_active: true,
          sort_order: 1
        }]);
      }
    }
    loadNews();
  }, []);

  // Slider Interval
  useEffect(() => {
    if (news.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [news.length]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const isDark = theme === 'dark';

  const openAnalysisModal = async (match: any) => {
    setAnalysisMatch(match);
    setAnalysisModalOpen(true);
    setLoadingAnalysis(true);
    setAnalysisData(null);
    try {
      const eventId = match.eventId || match.id;
      let enrichedMatch = { ...match };

      // 1. Fetch detailed odds to enrich all markets (3.5 A/Ü, KG, İY, ÇŞ vb.)
      try {
        const oddsRes = await fetch(`/api/fetch-match-odds?id=${eventId}`);
        if (oddsRes.ok) {
          const oddsResData = await oddsRes.json();
          const matchesArr = oddsResData.data?.data?.matches || oddsResData.data?.matches || [];
          if (oddsResData.success && matchesArr.length > 0) {
            const bookies = matchesArr[0].bookies || [];
            const iddaaBookie = bookies.find((b: any) => b.name === 'İddaa' || b.name === 'Nesine') || bookies[0];
            if (iddaaBookie && iddaaBookie.markets) {
              const detailedOdds = iddaaBookie.markets;
              const getOdd = (marketNames: string[], outcomeSearch: string) => {
                const normalize = (n: string) => n.toLowerCase().replace(/,/g, '.').replace(/\s+/g, '').replace(/gol/g, '').replace(/ü/g, 'u').replace(/ı/g, 'i');
                const market = detailedOdds.find((m: any) => {
                  const mName = normalize(m.name);
                  return marketNames.some(s => {
                    const sName = normalize(s);
                    return mName === sName;
                  }) && m.outcomes?.some((o:any) => normalize(o.name) === normalize(outcomeSearch) || normalize(o.name).includes(normalize(outcomeSearch)));
                });
                return market?.outcomes?.find((o:any) => normalize(o.name) === normalize(outcomeSearch) || normalize(o.name).includes(normalize(outcomeSearch)))?.value || null;
              };

              enrichedMatch = {
                ...match,
                cs1X: getOdd(['Çifte Şans', 'Cifte Sans'], '1-X') || getOdd(['Çifte Şans', 'Cifte Sans'], '1X') || match.cs1X,
                cs12: getOdd(['Çifte Şans', 'Cifte Sans'], '1-2') || getOdd(['Çifte Şans', 'Cifte Sans'], '12') || match.cs12,
                csX2: getOdd(['Çifte Şans', 'Cifte Sans'], 'X-2') || getOdd(['Çifte Şans', 'Cifte Sans'], 'X2') || match.csX2,
                alt15: getOdd(['1.5 Alt/Üst', 'Alt/Üst 1.5', '1,5 Alt/Üst'], 'Alt') || match.alt15,
                ust15: getOdd(['1.5 Alt/Üst', 'Alt/Üst 1.5', '1,5 Alt/Üst'], 'Üst') || match.ust15,
                alt25: getOdd(['2.5 Alt/Üst', 'Alt/Üst 2.5', '2,5 Alt/Üst'], 'Alt') || match.alt25,
                ust25: getOdd(['2.5 Alt/Üst', 'Alt/Üst 2.5', '2,5 Alt/Üst'], 'Üst') || match.ust25,
                alt35: getOdd(['3.5 Alt/Üst', 'Alt/Üst 3.5', '3,5 Alt/Üst'], 'Alt') || match.alt35,
                ust35: getOdd(['3.5 Alt/Üst', 'Alt/Üst 3.5', '3,5 Alt/Üst'], 'Üst') || match.ust35,
                iy_alt15: getOdd(['1. Yarı 1.5 Alt/Üst', 'İlk Yarı 1.5 Alt/Üst', '1. Yarı 1,5 Alt/Üst'], 'Alt') || match.iy_alt15 || match.iyAlt15,
                iy_ust15: getOdd(['1. Yarı 1.5 Alt/Üst', 'İlk Yarı 1.5 Alt/Üst', '1. Yarı 1,5 Alt/Üst'], 'Üst') || match.iy_ust15 || match.iyUst15,
                iy1: getOdd(['1. Yarı Sonucu', 'İlk Yarı Sonucu'], '1') || match.iy1,
                iyX: getOdd(['1. Yarı Sonucu', 'İlk Yarı Sonucu'], 'X') || match.iyX,
                iy2: getOdd(['1. Yarı Sonucu', 'İlk Yarı Sonucu'], '2') || match.iy2,
                kgVar: getOdd(['Karşılıklı Gol'], 'Var') || match.kgVar,
                kgYok: getOdd(['Karşılıklı Gol'], 'Yok') || match.kgYok,
              };
            }
          }
        }
      } catch (e) {}

      setAnalysisMatch(enrichedMatch);

      // 2. Perform fast backend statistical analysis on all enriched markets
      const res = await fetch('/api/analyze-odds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match: enrichedMatch })
      });
      const analyzeData = await res.json();

      if (analyzeData && analyzeData.success) {
        setAnalysisData(analyzeData.stats);
      } else {
        setAnalysisData({ error: analyzeData?.message || analyzeData?.error || 'Analiz verisi alınamadı' });
      }
    } catch (err: any) {
      setAnalysisData({ error: err.message });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Fetch detailed odds when selectedMatch changes
  useEffect(() => {
    if (!selectedMatch) {
      setDetailedOdds(null);
      setOddsError(null);
      return;
    }
    
    // Sonsuz döngüyü engellemek için, zaten zenginleştirilmişse tekrar çekme
    if (selectedMatch._enriched) return;

    const fetchDetailedOdds = async () => {
      setLoadingOdds(true);
      setOddsError(null);
      try {
        const eventId = selectedMatch.eventId || selectedMatch.id;
        const res = await fetch(`/api/fetch-match-odds?id=${eventId}`);
        if (!res.ok) {
          setOddsError('Oranlar yüklenemedi');
          setLoadingOdds(false);
          return;
        }
        const resData = await res.json();
        const matchesArr = resData.data?.data?.matches || resData.data?.matches || [];
        if (resData.success && matchesArr.length > 0) {
          const bookies = matchesArr[0].bookies || [];
          const iddaaBookie = bookies.find((b: any) => b.name === 'İddaa' || b.name === 'Nesine') || bookies[0];
          if (iddaaBookie && iddaaBookie.markets) {
            setDetailedOdds(iddaaBookie.markets);
            
            // Oranları zenginleştir
            const marketsArray = iddaaBookie.markets;
            const getOddFromMarkets = (marketNames: string[], outcomeSearch: string) => {
              const normalize = (n: string) => n.toLowerCase().replace(/,/g, '.').replace(/\s+/g, '').replace(/gol/g, '').replace(/ü/g, 'u').replace(/ı/g, 'i');
              const market = marketsArray.find((m: any) => {
                const mName = normalize(m.name);
                return marketNames.some(s => {
                  const sName = normalize(s);
                  return mName === sName;
                }) && m.outcomes?.some((o:any) => normalize(o.name) === normalize(outcomeSearch) || normalize(o.name).includes(normalize(outcomeSearch)));
              });
              return market?.outcomes?.find((o:any) => normalize(o.name) === normalize(outcomeSearch) || normalize(o.name).includes(normalize(outcomeSearch)))?.value || null;
            };

            const enriched = {
              ...selectedMatch,
              _enriched: true,
              alt15: getOddFromMarkets(['1.5 Alt/Üst', 'Alt/Üst 1.5', '1,5 Alt/Üst'], 'Alt') || selectedMatch.alt15,
              ust15: getOddFromMarkets(['1.5 Alt/Üst', 'Alt/Üst 1.5', '1,5 Alt/Üst'], 'Üst') || selectedMatch.ust15,
              alt25: getOddFromMarkets(['2.5 Alt/Üst', 'Alt/Üst 2.5', '2,5 Alt/Üst'], 'Alt') || selectedMatch.alt25,
              ust25: getOddFromMarkets(['2.5 Alt/Üst', 'Alt/Üst 2.5', '2,5 Alt/Üst'], 'Üst') || selectedMatch.ust25,
              alt35: getOddFromMarkets(['3.5 Alt/Üst', 'Alt/Üst 3.5', '3,5 Alt/Üst'], 'Alt') || selectedMatch.alt35,
              ust35: getOddFromMarkets(['3.5 Alt/Üst', 'Alt/Üst 3.5', '3,5 Alt/Üst'], 'Üst') || selectedMatch.ust35,
              iy_alt15: getOddFromMarkets(['1. Yarı 1.5 Alt/Üst', 'İlk Yarı 1.5 Alt/Üst', '1. Yarı 1,5 Alt/Üst'], 'Alt') || selectedMatch.iy_alt15 || selectedMatch.iyAlt15,
              iy_ust15: getOddFromMarkets(['1. Yarı 1.5 Alt/Üst', 'İlk Yarı 1.5 Alt/Üst', '1. Yarı 1,5 Alt/Üst'], 'Üst') || selectedMatch.iy_ust15 || selectedMatch.iyUst15,
              iy1: getOddFromMarkets(['1. Yarı Sonucu', 'İlk Yarı Sonucu'], '1') || selectedMatch.iy1,
              iyX: getOddFromMarkets(['1. Yarı Sonucu', 'İlk Yarı Sonucu'], 'X') || selectedMatch.iyX,
              iy2: getOddFromMarkets(['1. Yarı Sonucu', 'İlk Yarı Sonucu'], '2') || selectedMatch.iy2,
              kgVar: getOddFromMarkets(['Karşılıklı Gol'], 'Var') || selectedMatch.kgVar,
              kgYok: getOddFromMarkets(['Karşılıklı Gol'], 'Yok') || selectedMatch.kgYok,
              cs1X: getOddFromMarkets(['Çifte Şans', 'Cifte Sans'], '1-X') || getOddFromMarkets(['Çifte Şans', 'Cifte Sans'], '1X') || selectedMatch.cs1X,
              cs12: getOddFromMarkets(['Çifte Şans', 'Cifte Sans'], '1-2') || getOddFromMarkets(['Çifte Şans', 'Cifte Sans'], '12') || selectedMatch.cs12,
              csX2: getOddFromMarkets(['Çifte Şans', 'Cifte Sans'], 'X-2') || getOddFromMarkets(['Çifte Şans', 'Cifte Sans'], 'X2') || selectedMatch.csX2,
            };
            setSelectedMatch(enriched);
            
          } else {
            setDetailedOdds([]);
          }
        } else {
          setDetailedOdds([]);
        }
      } catch (err: any) {
        console.error(err);
        setOddsError('Canlı oranlar eklenti üzerinden alınamadı.');
      } finally {
        setLoadingOdds(false);
      }
    };

    fetchDetailedOdds();
    setSelectedTab('main'); // Reset to first tab on change
  }, [selectedMatch]);

  const toggleCartItem = (match: any, pickLabel: string, pickOdd: string | number) => {
    if (!pickOdd || pickOdd === '0' || pickOdd === '-') return;
    setCart(prev => {
      const exists = prev.find(item => item.matchId === match.id && item.pickLabel === pickLabel);
      if (exists) return prev.filter(item => !(item.matchId === match.id && item.pickLabel === pickLabel));
      const filtered = prev.filter(item => item.matchId !== match.id);
      if (filtered.length >= 40) { alert('En fazla 40 maç ekleyebilirsiniz!'); return prev; }
      return [...filtered, { matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam, date: match.date, time: match.time, pickLabel, pickOdd: parseFloat(String(pickOdd)) }];
    });
  };

  const saveCart = async (targetCart = cart, targetStake = cartStake) => {
    if (targetCart.length === 0) return;
    setIsSavingCart(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) { alert('Kupon kaydetmek için giriş yapmalısınız.'); return; }
      const totalOdds = targetCart.reduce((acc, item) => acc * item.pickOdd, 1).toFixed(2);
      const potentialWin = (parseFloat(totalOdds) * targetStake).toFixed(2);
      
      const { error } = await supabase!
        .from('iddaa_saved_coupons')
        .insert([{
          user_id: session.user.id,
          matches: targetCart,
          total_odds: parseFloat(totalOdds),
          stake: parseFloat(targetStake.toString()),
          potential_win: parseFloat(potentialWin),
          status: 'pending'
        }]);

      if (error) { 
        alert('HATA: Kupon kaydedilemedi!\nDetay: ' + error.message); 
      } else { 
        setToastMessage('Kupon başarıyla kaydedildi!');
        setTimeout(() => setToastMessage(null), 3000);
        if(targetCart === cart) setCart([]); 
      }
    } catch(e: any) { alert('Bir hata oluştu: ' + e.message); } finally { setIsSavingCart(false); }
  };

  const handleGenerateCoupons = async () => {
    if (matches.length === 0) return;
    setLoadingCoupons(true);
    setCouponsError(null);
    setDailyCoupons(null);
    
    try {
      const today = new Date();
      const todayStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
      const validMatches = matches.filter(m => m.date === todayStr && !isMatchStarted(m.date, m.time) && m.ms1 !== '0' && m.ms1 !== '-');
      const res = await fetch('/api/generate-coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: validMatches })
      });
      const data = await res.json();
      if (data.success) {
        setDailyCoupons(data.coupons);
      } else {
        setCouponsError(data.error || data.message || 'Kuponlar oluşturulamadı');
      }
    } catch (err: any) {
      setCouponsError(err.message || 'Bir hata oluştu');
    } finally {
      setLoadingCoupons(false);
    }
  };
  // PREFETCH: Sayfa yüklendiğinde arkaplanda Günün ve Dünün tahminlerini çek
  useEffect(() => {
    if (matches && matches.length > 0 && dailyPicks === null && !loadingDailyPicks) {
      const validMatches = matches.filter(m => !isMatchStarted(m.date, m.time) && m.ms1 !== '0' && m.ms1 !== '-');
      if (validMatches.length > 0) {
        setLoadingDailyPicks(true);
        fetch('/api/generate-daily-picks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matches: validMatches })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
               setDailyPicks(data.picks || { banko: data.bankoPicks || [], value: data.valuePicks || [] });
            } else {
               setDailyPicks({ banko: [], value: [] });
            }
          })
          .catch((err) => {
             console.error(err);
             setDailyPicks({ banko: [], value: [] }); // Set empty object to avoid infinite loop
          })
          .finally(() => setLoadingDailyPicks(false));
      } else {
        setDailyPicks({ banko: [], value: [] });
      }
    }
  }, [matches, dailyPicks, loadingDailyPicks]);

  useEffect(() => {
    if (matches && matches.length > 0 && yesterdayPicksData === null && !loadingYesterdayPicks) {
      setLoadingYesterdayPicks(true);
      fetch(`/api/generate-daily-picks/yesterday?daysAgo=1`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setYesterdayPicksData(data);
          } else {
            setYesterdayPicksData({ success: true, picks: [] });
          }
        })
        .catch((err) => {
           console.error(err);
           setYesterdayPicksData({ success: true, picks: [] });
        })
        .finally(() => setLoadingYesterdayPicks(false));
    }
  }, [matches, yesterdayPicksData, loadingYesterdayPicks]);

  const handleGenerateDailyPicks = async (league: string | null = null, initialTab: 'today' | 'yesterday' = 'today') => {
    setDailyPicksTab(initialTab);
    setPicksModalLeague(league);
    setDailyPicksModalOpen(true);
    
    if (initialTab === 'yesterday') {
      handleLoadYesterdayPicks(selectedDaysAgo || 1);
      return;
    }

    if (matches.length === 0) return;
    
    // Eğer daha önce arkaplanda yüklendiyse veya hala yükleniyorsa, tekrar istek atma!
    if (dailyPicks !== null || loadingDailyPicks) return;
    
    setLoadingDailyPicks(true);
    setDailyPicksError(null);
    setDailyPicks(null);
    
    try {
      const validMatches = matches.filter(m => !isMatchStarted(m.date, m.time) && m.ms1 !== '0' && m.ms1 !== '-');
      const res = await fetch('/api/generate-daily-picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: validMatches })
      });
      const data = await res.json();
      if (data.success) {
        setDailyPicks(data.picks || { banko: data.bankoPicks || [], value: data.valuePicks || [] });
      } else {
        setDailyPicksError(data.error || 'Tahminler oluşturulamadı');
      }
    } catch (err: any) {
      setDailyPicksError(err.message || 'Bir hata oluştu');
    } finally {
      setLoadingDailyPicks(false);
    }
  };

  // Categorize markets helper
  const categories = useMemo(() => {
    if (!detailedOdds) return { main: [], goals: [], halves: [], combos: [], players: [] };
    const main: any[] = [];
    const goals: any[] = [];
    const halves: any[] = [];
    const combos: any[] = [];
    const players: any[] = [];

    detailedOdds.forEach(m => {
      if (!m.outcomes || m.outcomes.length === 0) return;
      const name = m.name.toLowerCase();
      if (name.includes('oyuncu') || name.includes('şut') || name.includes('korner') || name.includes('kart') || name.includes('faul') || name.includes('pas') || name.includes('ofsayt') || name.includes('kaleci') || name.includes('asist') || name.includes('taç') || name.includes('kurtarış')) {
        players.push(m);
      } else if (name.includes(' ve ') || name.includes('kombinasyon') || name.includes('yarı/maç') || name.includes('iy/ms') || name.includes('ilk yarı/maç') || name.includes('ilk yarı / maç') || name.includes('kombi') || name.includes('kg &') || name.includes('ms &')) {
        combos.push(m);
      } else if (name.includes('1. yarı') || name.includes('2. yarı') || name.includes('1.yarı') || name.includes('2.yarı') || name.includes('ilk yarı') || name.includes('yarıda') || name.includes('yarı kazanır') || name.includes('iki yarı') || name.includes('devre') || name.includes('en çok gol olacak yarı')) {
        halves.push(m);
      } else if (name.includes('gol') || name.includes('alt') || name.includes('üst') || name.includes('skor') || name.includes('handikap') || name.includes('tek/çift') || name.includes('farkla')) {
        goals.push(m);
      } else {
        main.push(m);
      }
    });

    return { main, goals, halves, combos, players };
  }, [detailedOdds]);

  // Listen to messages from extension injector
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'ST_IDDAA_BULLETIN_SUCCESS') {
        const payload = event.data.payload;
        
        // 1. Extension üzerinden Maçkolik çoklu gün verisi geldiyse
        if (payload && payload.source === 'mackolik' && Array.isArray(payload.days)) {
          const parsedMatches: any[] = [];
          const cleanOdds = (val: any) => {
            if (!val || val === '0,00' || val === '0.00' || val === '-') return '-';
            return String(val).replace(',', '.');
          };

          payload.days.forEach((txt: string) => {
            try {
              const obj = new Function(`return ${txt}`)();
              (obj.m || []).forEach((g: any) => {
                (g.m || []).forEach((m: any) => {
                  if (m[1] && m[3]) {
                    const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
                    if (state === 4) return;
                    const isLive = state === 1 || state === 2 || state === 3;
                    const liveScore = isLive 
                      ? `${m[8] !== undefined && m[8] !== '' ? m[8] : '0'} - ${m[9] !== undefined && m[9] !== '' ? m[9] : '0'}` 
                      : undefined;
                    const liveStatus = state === 1 ? '1. Yarı' : state === 2 ? 'Devre Arası' : state === 3 ? '2. Yarı' : (isLive ? 'Canlı' : undefined);
                    const liveMinute = isLive ? (m[10] || m[11] || (state === 2 ? 'DA' : undefined)) : undefined;

                    parsedMatches.push({
                      id: String(m[0]),
                      eventId: String(m[0]),
                      code: String(m[4] || String(m[0]).slice(0, 5)),
                      league: String(m[26] || 'Diğer').trim(),
                      date: String(m[7] || '').trim(),
                      time: String(m[6] || '').trim(),
                      homeTeam: String(m[1]).trim(),
                      awayTeam: String(m[3]).trim(),
                      score: liveScore,
                      liveStatus,
                      liveMinute,
                      ms1: cleanOdds(m[16]),
                      msX: cleanOdds(m[17]),
                      ms2: cleanOdds(m[18]),
                      cs1X: cleanOdds(m[19]),
                      cs12: cleanOdds(m[20]),
                      csX2: cleanOdds(m[21]),
                      alt25: cleanOdds(m[22]),
                      ust25: cleanOdds(m[23]),
                      iy1: cleanOdds(m[33]),
                      iyX: cleanOdds(m[34]),
                      iy2: cleanOdds(m[35]),
                      kgVar: cleanOdds(m[39]),
                      kgYok: cleanOdds(m[40]),
                      iyAlt15: cleanOdds(m[42]),
                      iyUst15: cleanOdds(m[43]),
                      alt15: cleanOdds(m[44]),
                      ust15: cleanOdds(m[45]),
                      alt35: cleanOdds(m[46]),
                      ust35: cleanOdds(m[47]),
                      isLive,
                      source: 'Maçkolik (Eklenti)'
                    });
                  }
                });
              });
            } catch (e) {}
          });

          if (parsedMatches.length > 0) {
            const uniqueMap = new Map();
            parsedMatches.forEach(m => { if (!uniqueMap.has(m.id)) uniqueMap.set(m.id, m); });
            const deduped = Array.from(uniqueMap.values());
            setMatches(deduped);
            setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
            setExtensionStatus('detected');
            setActiveSource('Maçkolik (Eklenti)');
            setLoading(false);
            setError(null);
            return;
          }
        }

        // 2. Extension üzerinden Nesine bülten verisi geldiyse
        const rawNesine = payload?.data || payload;
        if (rawNesine && rawNesine.sg && Array.isArray(rawNesine.sg.EA)) {
          const parsed = rawNesine.sg.EA.filter((m: any) => m.TYPE === 1).map((m: any) => {
            // Find MS market (MTID === 1)
            const msMarket = m.MA?.find((market: any) => market.MTID === 1);
            const ms1 = msMarket?.OCA?.find((o: any) => o.N === 1)?.O?.toFixed(2) || '-';
            const msX = msMarket?.OCA?.find((o: any) => o.N === 2)?.O?.toFixed(2) || '-';
            const ms2 = msMarket?.OCA?.find((o: any) => o.N === 3)?.O?.toFixed(2) || '-';

            // Find Double Chance market (MTID === 3)
            const csMarket = m.MA?.find((market: any) => market.MTID === 3);
            const cs1X = csMarket?.OCA?.find((o: any) => o.N === 1)?.O?.toFixed(2) || '-';
            const cs12 = csMarket?.OCA?.find((o: any) => o.N === 2)?.O?.toFixed(2) || '-';
            const csX2 = csMarket?.OCA?.find((o: any) => o.N === 3)?.O?.toFixed(2) || '-';

            // Find Under/Over 2.5 (MTID === 804)
            const ouMarket = m.MA?.find((market: any) => market.MTID === 804);
            const alt25 = ouMarket?.OCA?.find((o: any) => o.N === 1 || o.ON?.includes('Alt'))?.O?.toFixed(2) || '-';
            const ust25 = ouMarket?.OCA?.find((o: any) => o.N === 2 || o.ON?.includes('Üst'))?.O?.toFixed(2) || '-';

            return {
              id: String(m.NID || m.C || ''),
              code: String(m.C || m.NID || ''),
              league: m.LN || m.ENN || 'Diğer',
              date: m.D || '',
              time: m.T || '',
              homeTeam: m.HN || '',
              awayTeam: m.AN || '',
              ms1,
              msX,
              ms2,
              cs1X,
              cs12,
              csX2,
              alt25,
              ust25
            };
          }).filter((m: IddaaMatch) => m.homeTeam && m.awayTeam);

          setMatches(parsed);
          setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
          setExtensionStatus('detected');
          setActiveSource('Nesine (Eklenti)');
          setLoading(false);
          setError(null);
        } else {
          setError('Bülten verileri çözümlenemedi. Lütfen tekrar deneyin.');
          setLoading(false);
        }
      } else if (event.data.type === 'ST_IDDAA_BULLETIN_ERROR') {
        setError(event.data.error || 'Bülten çekilirken eklentide bir hata oluştu.');
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch Bulletin helper: Direct 100% server-side fetch
  const fetchBulletin = async () => {
    setLoading(true);
    setError(null);
    setActiveSource(null);

    try {
      const res = await fetch('/api/fetch-iddaa');
      const data = await res.json();

      if (data.success && Array.isArray(data.matches)) {
        if (data.matches.length > 0) {
          setMatches(data.matches);
          setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
          setActiveSource('Bülten (Doğrudan)');
          setLoading(false);
          return;
        } else {
          // If empty array on initial boot, retry once after 1.5 seconds
          setTimeout(async () => {
            try {
              const retryRes = await fetch('/api/fetch-iddaa');
              const retryData = await retryRes.json();
              if (retryData.success && Array.isArray(retryData.matches) && retryData.matches.length > 0) {
                setMatches(retryData.matches);
                setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
                setActiveSource('Bülten (Doğrudan)');
              }
            } catch (e) {
            } finally {
              setLoading(false);
            }
          }, 1500);
          return;
        }
      } else {
        throw new Error(data.error || 'Bülten verisi alınamadı');
      }
    } catch (err: any) {
      console.error('Bülten çekim hatası:', err);
      setError('Bülten ve canlı maçlar çekilirken bir hata oluştu: ' + (err.message || 'Bağlantı hatası'));
      setLoading(false);
    }
  };

  // Initial load & Background Live Poller (Every 20s)
  useEffect(() => {
    fetchBulletin();

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/fetch-iddaa');
        const data = await res.json();
        if (data.success && Array.isArray(data.matches) && data.matches.length > 0) {
          setMatches(data.matches);
          setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
        }
      } catch (e) {
        // silent
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Leagues for filter pills with priority for major leagues and date sensitivity
  const leagues = useMemo(() => {
    if (matches.length === 0) return ['Tümü'];
    
    // Filter matches by selected date / live status
    const pool = matches.filter(m => {
      const status = getMatchStatus(m.date, m.time, m.isLive, m.liveStatus);
      if (status === 'FINISHED') return false;
      if (selectedDate === '🔴 Canlı') return status === 'LIVE';
      if (status === 'LIVE') return false;
      if (selectedDate !== 'Tümü') return m.date === selectedDate;
      return true;
    });
    if (pool.length === 0) return ['Tümü'];

    const counts: Record<string, number> = {};
    pool.forEach(m => {
      if (m.league) counts[m.league] = (counts[m.league] || 0) + 1;
    });

    const PRIORITY_LEAGUES = [
      'TSL', 'T1L', 'ŞMP', 'AVKL', 'KONF', 'İNP', 'İSP', 'AL1', 'İTA', 'FR1', 'HOLL', 'POR', 'ALSK'
    ];

    const uniqueLeagues = Object.keys(counts);

    // Sort: priority leagues first, then by frequency descending
    const sorted = uniqueLeagues.sort((a, b) => {
      const aPrio = PRIORITY_LEAGUES.indexOf(a);
      const bPrio = PRIORITY_LEAGUES.indexOf(b);
      if (aPrio !== -1 && bPrio !== -1) return aPrio - bPrio;
      if (aPrio !== -1) return -1;
      if (bPrio !== -1) return 1;
      return (counts[b] || 0) - (counts[a] || 0);
    });

    return ['Tümü', ...sorted];
  }, [matches, selectedDate]);

  // Dates for filter pills
  const availableDates = useMemo(() => {
    if (matches.length === 0) return ['Tümü'];
    const dates = new Set<string>();
    matches.forEach(m => {
      const status = getMatchStatus(m.date, m.time, m.isLive, m.liveStatus);
      if (status === 'NOT_STARTED' && m.date) dates.add(m.date);
    });
    
    const sorted = Array.from(dates).sort((a, b) => {
      const [d1, m1, y1] = a.split('.').map(Number);
      const [d2, m2, y2] = b.split('.').map(Number);
      return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
    });
      
    return ['🔴 Canlı', 'Tümü', ...sorted];
  }, [matches]);

  // Reset selected league if it doesn't exist in current date's leagues
  useEffect(() => {
    if (selectedLeague !== 'Tümü' && !leagues.includes(selectedLeague)) {
      setSelectedLeague('Tümü');
    }
  }, [leagues, selectedLeague]);

  // Filtered and searched matches
  const filteredMatches = useMemo(() => {
      const filtered = matches.filter(m => {
        const status = getMatchStatus(m.date, m.time, m.isLive, m.liveStatus);
        
        // CRITICAL: Biten maçlar (FINISHED) güncel bültende KESİNLİKLE görünmemeli!
        if (status === 'FINISHED') return false;

        if (selectedDate === '🔴 Canlı') {
          if (status !== 'LIVE') return false;
        } else {
          // "Tümü" veya seçili tarihlerde (26.08.2026 vb.) oynanmakta olan / başlayan maçlar GÖRÜNMEZ, sadece BAŞLAMAMIŞ maçlar görünür!
          if (status === 'LIVE') return false;

          if (selectedDate !== 'Tümü' && m.date !== selectedDate) {
            return false;
          }
        }
        if (selectedLeague !== 'Tümü' && m.league !== selectedLeague) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return m.homeTeam.toLowerCase().includes(q) || m.awayTeam.toLowerCase().includes(q);
        }
        return true;
      });

      return filtered;
  }, [matches, selectedLeague, selectedDate, searchQuery]);

  const handleAnalyzeLeague = () => {
    if (selectedLeague !== 'Tümü') {
      handleGenerateDailyPicks(selectedLeague);
    }
  };


  return (
    <div className={`min-h-[calc(100vh-64px)] font-sans pb-16 flex flex-col transition-colors duration-200 ${isDark ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-emerald-400 font-bold text-sm tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Banner Section (News) */}
        {news.length > 0 && (
          <div className="shrink-0 w-full mb-4 mt-4 md:mt-2">
            <div className={`relative w-full h-[140px] md:h-[160px] rounded-2xl overflow-hidden group border ${isDark ? 'border-slate-800' : 'border-slate-200'} shadow-lg shadow-black/5`}>
              {news.map((item, idx) => (
                <div 
                  key={item.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentNewsIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] group-hover:scale-110"
                    style={{ backgroundImage: `url(${item.bg_image_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60'})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />
                  
                  <div className="relative h-full flex flex-col justify-center px-6 md:px-12 max-w-3xl">
                    {item.badge_text && (
                      <span className="inline-block px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider w-fit mb-3">
                        {item.badge_text}
                      </span>
                    )}
                    <h2 className="text-xl md:text-3xl font-black text-white mb-2 tracking-tight leading-tight">
                      {item.title}
                    </h2>
                    {item.description && (
                      <p className="text-xs md:text-sm text-slate-300 line-clamp-2 md:line-clamp-1 opacity-90 font-medium">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="absolute bottom-4 left-6 md:left-12 z-20 flex gap-2">
                {news.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentNewsIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === currentNewsIndex ? 'w-8 bg-sky-400' : 'w-2 bg-slate-500/50 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* HEADER SECTION */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border p-6 rounded-2xl transition-colors duration-200 ${isDark ? 'bg-slate-900/30 border-slate-800/60' : 'bg-white border-slate-200/80 shadow-sm'}`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-sky-400 to-blue-500 text-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-sky-500/10">
                <Sparkles className="h-3 w-3" />
                İddaa Entegrasyonu
              </span>
            </div>
            <h1 className={`text-3xl font-black tracking-tight mt-2 drop-shadow-sm transition-colors duration-200 ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Güncel İddaa Bülteni
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {lastUpdated && (
              <div className={`text-right text-[11px] self-center transition ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Son Güncelleme: <span className={`font-semibold transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{lastUpdated}</span>
              </div>
            )}
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition duration-150 cursor-pointer shadow-sm flex items-center justify-center ${
                isDark
                  ? 'bg-slate-900/50 border-slate-800 text-yellow-400 hover:text-yellow-300 hover:bg-slate-850'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={isDark ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={fetchBulletin}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-350 hover:to-blue-450 text-black text-xs font-black rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Bülteni Yenile
            </button>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Takım adı, lig veya maç kodu ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-xl py-3 pl-10 pr-10 text-sm transition shadow-inner ${
                  isDark 
                    ? 'bg-[#111827]/80 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-sky-500/50 focus:ring-sky-500/30' 
                    : 'bg-white border-slate-200 text-slate-850 placeholder-slate-400 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/10'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-3 top-3 p-1 rounded-full transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                  title="Aramayı Temizle"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Date Filter Pills */}
          {availableDates.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {availableDates.map((dt) => (
                <button
                  key={dt}
                  onClick={() => setSelectedDate(dt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 ${
                    selectedDate === dt
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 font-extrabold shadow-sm shadow-purple-500/5'
                      : isDark
                        ? 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/30 hover:text-slate-200'
                        : 'bg-white text-slate-655 border-slate-200 hover:bg-slate-100 hover:text-slate-800 shadow-sm'
                  }`}
                >
                  {dt !== 'Tümü' && <Clock className="w-3 h-3 opacity-70" />}
                  {dt}
                </button>
              ))}
            </div>
          )}

          {/* League Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {leagues.map(l => (
              <button
                key={l}
                onClick={() => setSelectedLeague(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 ${
                  selectedLeague === l 
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 font-extrabold shadow-sm shadow-sky-500/5' 
                    : isDark
                      ? 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/30 hover:text-slate-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800 shadow-sm'
                }`}
              >
                {selectedLeague === l && <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />}
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ERROR / NOT DETECTED PANEL */}
        {error && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-4 animate-fadeIn">
            <AlertTriangle className="h-10 w-10 text-red-500 shrink-0" />
            <div className="flex-grow text-center md:text-left">
              <h4 className="font-bold text-red-400 text-sm">Bülten Çekilemedi</h4>
              <p className="text-xs text-slate-300 mt-0.5">{error}</p>
            </div>
            {extensionStatus === 'not_detected' && (
              <a 
                href="/nasil-kullanilir" 
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-bold rounded-lg transition"
              >
                Eklenti Kurulum Kılavuzu ➔
              </a>
            )}
          </div>
        )}

        {/* AI DAILY COUPONS PANEL */}
        <div className={`mb-6 p-5 rounded-2xl border transition-colors shadow-sm ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Yapay Zeka Günün Bankoları</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Yapay zeka bülteni tarar ve günün en ideal kombinasyonları ile favori tahminlerini çıkarır.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
              <button
                onClick={() => handleGenerateDailyPicks(null, 'today')}
                disabled={loadingDailyPicks || matches.length === 0}
                className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer ${
                  isDark 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-none' 
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {loadingDailyPicks ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                Tüm Tahminleri Gör
              </button>
              <button
                onClick={() => handleGenerateDailyPicks(null, 'yesterday')}
                className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md border ${
                  isDark 
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border-emerald-500/30' 
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                }`}
              >
                <Award className="w-4 h-4 text-emerald-400" />
                Dünkü Sonuçlar & Başarı
              </button>
              <button
                onClick={handleGenerateCoupons}
                disabled={loadingCoupons || matches.length === 0}
                className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer ${
                  isDark 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {loadingCoupons ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Kuponları Oluştur
              </button>
            </div>
          </div>

          {couponsError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-bold mb-4">
              {couponsError}
            </div>
          )}

          {dailyCoupons && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyCoupons.map((coupon, cIdx) => (
                <div key={cIdx} className={`p-4 rounded-xl border relative overflow-hidden ${
                  isDark 
                    ? cIdx === 0 ? 'bg-[#0f172a] border-sky-500/30' : 'bg-[#0f172a] border-purple-500/30'
                    : cIdx === 0 ? 'bg-white border-sky-200' : 'bg-white border-purple-200'
                }`}>
                  <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-lg ${
                    cIdx === 0 ? 'bg-sky-500 text-white' : 'bg-purple-500 text-white'
                  }`}>
                    Toplam Oran: {coupon.odds.toFixed(2)}
                  </div>
                  <h4 className={`font-bold text-sm mb-3 flex items-center gap-2 ${
                    cIdx === 0 ? (isDark ? 'text-sky-400' : 'text-sky-600') : (isDark ? 'text-purple-400' : 'text-purple-600')
                  }`}>
                    {cIdx === 0 ? '🛡️' : '🎯'} {coupon.title}
                  </h4>
                  {coupon.matches.length > 0 ? (
                    <div className="space-y-2">
                      {coupon.matches.map((m: any, mIdx: number) => (
                        <div key={mIdx} className={`p-2 rounded-lg border flex justify-between items-center ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div>
                            <div className={`text-[10px] mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.date} {m.time}</div>
                            <div className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{m.match}</div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>% {m.percent}</span>
                            <div className="flex gap-2 items-baseline mt-1">
                              <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.label}</span>
                              <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({m.odd.toFixed(2)})</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => saveCart(coupon.matches.map((m: any) => ({ matchId: Date.now() + Math.random(), homeTeam: m.match.split(' - ')[0] || '', awayTeam: m.match.split(' - ')[1] || '', date: m.date, time: m.time, pickLabel: m.label, pickOdd: m.odd })), 10)} className="w-full mt-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition text-xs">Kuponu Kaydet</button>
                    </div>
                  ) : (
                    <div className={`text-xs italic p-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Kriterlere uygun yeterli maç bulunamadı.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOADING SKELETON */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`h-16 w-full border rounded-xl animate-pulse flex items-center justify-between px-6 transition-colors duration-200 ${isDark ? 'bg-slate-900/30 border-slate-800/50' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                <div className="flex gap-4 items-center">
                  <div className={`h-6 w-10 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                  <div className={`h-4 w-48 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                </div>
                <div className="flex gap-2">
                  <div className={`h-8 w-14 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                  <div className={`h-8 w-14 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                  <div className={`h-8 w-14 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* BULLETIN TABLE PANEL */
          <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors duration-200 ${isDark ? 'bg-slate-900/25 border-slate-800/80' : 'bg-white border-slate-200/80'}`}>
            
            {/* DESKTOP TABLE VIEW (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm border-collapse text-left">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider select-none transition-colors duration-200 ${isDark ? 'border-slate-850 text-slate-500 bg-slate-900/40' : 'border-slate-200 text-slate-500 bg-slate-100/50'}`}>
                    <th className="py-3 px-4 w-32">Tarih / Lig</th>
                    <th className="py-3 px-6">Maç Eşleşmesi</th>
                    <th className="py-3 px-4 text-center w-52">Maç Sonucu (1-X-2)</th>
                    <th className="py-3 px-4 text-center w-52">Çifte Şans</th>
                    <th className="py-3 px-4 text-center w-36">Gol 2.5 A/Ü</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-200 ${isDark ? 'divide-slate-850' : 'divide-slate-100'}`}>
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match, idx) => {
                      const matchStatus = getMatchStatus(match.date, match.time, match.isLive, match.liveStatus);
                      return (
                        <tr 
                          key={match.id || `${match.code}-${idx}`} 
                          onClick={() => setSelectedMatch(match)}
                          className={`border-b transition select-none cursor-pointer hover:bg-slate-800/30 dark:hover:bg-slate-800/30 ${
                            matchStatus === 'FINISHED'
                              ? 'opacity-60 bg-slate-900/10 dark:bg-slate-950/20'
                              : ''
                          } ${
                            isDark 
                              ? 'border-slate-850/80 text-slate-200' 
                              : 'border-slate-100 text-slate-700 hover:bg-slate-50/85'
                          }`}
                        >
                          {/* Date & League */}
                          <td className="py-4 px-4 text-xs space-y-1">
                            <div className={`flex items-center gap-1.5 font-medium transition ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                              <span>{match.date} {match.time}</span>
                              {matchStatus === 'LIVE' && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-extrabold text-[9px] border border-red-500/30 inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                  CANLI {match.liveStatus ? `• ${match.liveStatus}` : ''}
                                </span>
                              )}
                              {matchStatus === 'FINISHED' && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 font-bold text-[9px] border border-slate-500/30">
                                  MS
                                </span>
                              )}
                            </div>
                            <div className={`font-bold text-[10px] uppercase tracking-wide truncate max-w-[120px] transition ${isDark ? 'text-sky-500/80' : 'text-sky-600/90'}`} title={match.league}>
                              {match.league.replace('Kupası', 'Kup.').replace('Şampiyonası', 'Şamp.')}
                            </div>
                          </td>
                          
                          {/* Match Matchup */}
                          <td className="py-4 px-6 font-bold text-xs sm:text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                                <span className={`truncate transition ${isDark ? 'text-white' : 'text-slate-900'}`}>{match.homeTeam}</span>
                                <span className={`truncate transition ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{match.awayTeam}</span>
                              </div>
                              <div className="w-16 flex justify-center shrink-0">
                                {matchStatus === 'LIVE' && match.score ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 font-black text-xs border border-red-500/40 whitespace-nowrap shadow-sm shadow-red-500/20 text-center min-w-[48px]">
                                    {match.score}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border transition ${
                                  isDark 
                                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20' 
                                    : 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100/60'
                                }`}>
                                  Tüm Oranlar
                                </span>
                                <span onClick={(e) => { e.stopPropagation(); openAnalysisModal(match); }} className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border transition ${
                                  isDark 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/60'
                                }`}>
                                  <Activity className="w-3 h-3" />
                                  Analizi Gör
                                </span>
                              </div>
                            </div>
                          </td>
                          
                          {/* MS Odds */}
                          <td className="py-4 px-4">
                            <div className={`flex items-center gap-1 p-1 rounded-lg border transition ${
                              isDark 
                                ? 'bg-[#0f172a]/65 border-slate-800/40' 
                                : 'bg-slate-100/80 border-slate-200/60'
                            }`}>
                              <div onClick={(e) => { e.stopPropagation(); toggleCartItem(match, 'MS 1', match.ms1); }} className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition cursor-pointer ${cart.find(c => c.matchId === match.id && c.pickLabel === 'MS 1') ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-200/50 text-slate-500 hover:bg-slate-300'}`}>1<span className={`block text-xs font-extrabold mt-0.5 transition ${cart.find(c => c.matchId === match.id && c.pickLabel === 'MS 1') ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>{match.ms1}</span></div>
                              <div onClick={(e) => { e.stopPropagation(); toggleCartItem(match, 'MS X', match.msX); }} className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition cursor-pointer ${cart.find(c => c.matchId === match.id && c.pickLabel === 'MS X') ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-200/50 text-slate-500 hover:bg-slate-300'}`}>X<span className={`block text-xs font-extrabold mt-0.5 transition ${cart.find(c => c.matchId === match.id && c.pickLabel === 'MS X') ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>{match.msX}</span></div>
                              <div onClick={(e) => { e.stopPropagation(); toggleCartItem(match, 'MS 2', match.ms2); }} className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition cursor-pointer ${cart.find(c => c.matchId === match.id && c.pickLabel === 'MS 2') ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-200/50 text-slate-500 hover:bg-slate-300'}`}>2<span className={`block text-xs font-extrabold mt-0.5 transition ${cart.find(c => c.matchId === match.id && c.pickLabel === 'MS 2') ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>{match.ms2}</span></div>
                            </div>
                          </td>
  
                          {/* CS Odds */}
                          <td className="py-4 px-4">
                            <div className={`flex items-center gap-1 p-1 rounded-lg border transition ${
                              isDark 
                                ? 'bg-[#0f172a]/65 border-slate-800/40' 
                                : 'bg-slate-100/80 border-slate-200/60'
                            }`}>
                              <div onClick={(e) => { e.stopPropagation(); toggleCartItem(match, 'ÇŞ 1-X', match.cs1X); }} className={`flex-1 text-center py-1 text-[9px] font-bold rounded transition cursor-pointer ${cart.find(c => c.matchId === match.id && c.pickLabel === 'ÇŞ 1-X') ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-200/50 text-slate-500 hover:bg-slate-300'}`}>1-X<span className={`block text-xs font-extrabold mt-0.5 transition ${cart.find(c => c.matchId === match.id && c.pickLabel === 'ÇŞ 1-X') ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-800'}`}>{match.cs1X}</span></div>
                              <div onClick={(e) => { e.stopPropagation(); toggleCartItem(match, 'ÇŞ 1-2', match.cs12); }} className={`flex-1 text-center py-1 text-[9px] font-bold rounded transition cursor-pointer ${cart.find(c => c.matchId === match.id && c.pickLabel === 'ÇŞ 1-2') ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-200/50 text-slate-500 hover:bg-slate-300'}`}>1-2<span className={`block text-xs font-extrabold mt-0.5 transition ${cart.find(c => c.matchId === match.id && c.pickLabel === 'ÇŞ 1-2') ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-800'}`}>{match.cs12}</span></div>
                              <div onClick={(e) => { e.stopPropagation(); toggleCartItem(match, 'ÇŞ X-2', match.csX2); }} className={`flex-1 text-center py-1 text-[9px] font-bold rounded transition cursor-pointer ${cart.find(c => c.matchId === match.id && c.pickLabel === 'ÇŞ X-2') ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-200/50 text-slate-500 hover:bg-slate-300'}`}>X-2<span className={`block text-xs font-extrabold mt-0.5 transition ${cart.find(c => c.matchId === match.id && c.pickLabel === 'ÇŞ X-2') ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-800'}`}>{match.csX2}</span></div>
                            </div>
                          </td>
  
                          {/* Over/Under 2.5 */}
                          <td className="py-4 px-4">
                            <div className={`flex items-center gap-1 p-1 rounded-lg border transition ${
                              isDark 
                                ? 'bg-[#0f172a]/65 border-slate-800/40' 
                                : 'bg-slate-100/80 border-slate-200/60'
                            }`}>
                              <div onClick={(e) => { e.stopPropagation(); toggleCartItem(match, '2.5 ALT', match.alt25); }} className={`flex-1 text-center py-1 text-[9px] font-bold rounded transition cursor-pointer ${cart.find(c => c.matchId === match.id && c.pickLabel === '2.5 ALT') ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-200/50 text-slate-500 hover:bg-slate-300'}`}>Alt<span className={`block text-xs font-extrabold mt-0.5 transition ${cart.find(c => c.matchId === match.id && c.pickLabel === '2.5 ALT') ? 'text-white' : 'text-rose-400'}`}>{match.alt25}</span></div>
                              <div onClick={(e) => { e.stopPropagation(); toggleCartItem(match, '2.5 ÜST', match.ust25); }} className={`flex-1 text-center py-1 text-[9px] font-bold rounded transition cursor-pointer ${cart.find(c => c.matchId === match.id && c.pickLabel === '2.5 ÜST') ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-200/50 text-slate-500 hover:bg-slate-300'}`}>Üst<span className={`block text-xs font-extrabold mt-0.5 transition ${cart.find(c => c.matchId === match.id && c.pickLabel === '2.5 ÜST') ? 'text-white' : 'text-emerald-400'}`}>{match.ust25}</span></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                        Aranan kriterlere uygun maç bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE MATCH CARDS VIEW (Clean, Native Mobile App Layout) */}
            <div className="md:hidden divide-y divide-slate-800/40">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match, idx) => {
                  const matchStatus = getMatchStatus(match.date, match.time, match.isLive, match.liveStatus);
                  return (
                    <div 
                      key={`mob-${match.id || match.code}-${idx}`} 
                      className={`p-3 space-y-2.5 transition ${isDark ? 'bg-[#0f172a]/40 hover:bg-slate-850/40' : 'bg-white hover:bg-slate-50'}`}
                    >
                      {/* Top meta row */}
                      <div className="flex items-center justify-between text-xs gap-1.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-400 min-w-0">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="text-[11px] whitespace-nowrap">{match.date} {match.time}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold uppercase truncate max-w-[100px]">
                            {match.league}
                          </span>
                          {matchStatus === 'LIVE' && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-black text-[9px] border border-red-500/30 whitespace-nowrap shrink-0">
                              CANLI {match.liveStatus ? `• ${match.liveStatus}` : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setSelectedMatch(match)}
                            className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition cursor-pointer"
                          >
                            + Oranlar
                          </button>
                          <button
                            onClick={() => openAnalysisModal(match)}
                            className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                          >
                            <Activity className="w-3 h-3" />
                            Analiz
                          </button>
                        </div>
                      </div>

                      {/* Teams & Score Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className={`truncate text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{match.homeTeam}</div>
                          <div className={`truncate text-xs font-semibold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{match.awayTeam}</div>
                        </div>
                        {matchStatus === 'LIVE' && match.score && (
                          <div className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 font-black text-xs border border-red-500/40 shrink-0">
                            {match.score}
                          </div>
                        )}
                      </div>

                      {/* Odds Row 1: MS 1 | MS X | MS 2 */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => toggleCartItem(match, 'MS 1', match.ms1)}
                          className={`py-1.5 px-1 rounded-lg border text-center transition cursor-pointer ${
                            cart.some(c => c.matchId === match.id && c.pickLabel === 'MS 1')
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                              : isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[10px] font-bold opacity-70">1 (MS)</div>
                          <div className="text-xs font-black">{match.ms1}</div>
                        </button>
                        <button
                          onClick={() => toggleCartItem(match, 'MS X', match.msX)}
                          className={`py-1.5 px-1 rounded-lg border text-center transition cursor-pointer ${
                            cart.some(c => c.matchId === match.id && c.pickLabel === 'MS X')
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                              : isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[10px] font-bold opacity-70">X (Ber)</div>
                          <div className="text-xs font-black">{match.msX}</div>
                        </button>
                        <button
                          onClick={() => toggleCartItem(match, 'MS 2', match.ms2)}
                          className={`py-1.5 px-1 rounded-lg border text-center transition cursor-pointer ${
                            cart.some(c => c.matchId === match.id && c.pickLabel === 'MS 2')
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                              : isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[10px] font-bold opacity-70">2 (MS)</div>
                          <div className="text-xs font-black">{match.ms2}</div>
                        </button>
                      </div>

                      {/* Odds Row 2: 2.5 Alt | 2.5 Üst | ÇŞ 1-X | ÇŞ 1-2 | ÇŞ X-2 */}
                      <div className="grid grid-cols-5 gap-1 pt-0.5">
                        <button
                          onClick={() => toggleCartItem(match, '2.5 ALT', match.alt25)}
                          className={`py-1 px-0.5 rounded-lg border text-center transition cursor-pointer ${
                            cart.some(c => c.matchId === match.id && c.pickLabel === '2.5 ALT')
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                              : isDark ? 'bg-slate-900/50 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[9px] font-semibold opacity-70">2.5 Alt</div>
                          <div className="text-[11px] font-black text-rose-400">{match.alt25}</div>
                        </button>
                        <button
                          onClick={() => toggleCartItem(match, '2.5 ÜST', match.ust25)}
                          className={`py-1 px-0.5 rounded-lg border text-center transition cursor-pointer ${
                            cart.some(c => c.matchId === match.id && c.pickLabel === '2.5 ÜST')
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                              : isDark ? 'bg-slate-900/50 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[9px] font-semibold opacity-70">2.5 Üst</div>
                          <div className="text-[11px] font-black text-emerald-400">{match.ust25}</div>
                        </button>
                        <button
                          onClick={() => toggleCartItem(match, 'ÇŞ 1-X', match.cs1X)}
                          className={`py-1 px-0.5 rounded-lg border text-center transition cursor-pointer ${
                            cart.some(c => c.matchId === match.id && c.pickLabel === 'ÇŞ 1-X')
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                              : isDark ? 'bg-slate-900/50 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[9px] font-semibold opacity-70">1-X</div>
                          <div className="text-[11px] font-black">{match.cs1X}</div>
                        </button>
                        <button
                          onClick={() => toggleCartItem(match, 'ÇŞ 1-2', match.cs12)}
                          className={`py-1 px-0.5 rounded-lg border text-center transition cursor-pointer ${
                            cart.some(c => c.matchId === match.id && c.pickLabel === 'ÇŞ 1-2')
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                              : isDark ? 'bg-slate-900/50 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[9px] font-semibold opacity-70">1-2</div>
                          <div className="text-[11px] font-black">{match.cs12}</div>
                        </button>
                        <button
                          onClick={() => toggleCartItem(match, 'ÇŞ X-2', match.csX2)}
                          className={`py-1 px-0.5 rounded-lg border text-center transition cursor-pointer ${
                            cart.some(c => c.matchId === match.id && c.pickLabel === 'ÇŞ X-2')
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                              : isDark ? 'bg-slate-900/50 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[9px] font-semibold opacity-70">X-2</div>
                          <div className="text-[11px] font-black">{match.csX2}</div>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-500 font-medium text-xs">
                  Aranan kriterlere uygun maç bulunamadı.
                </div>
              )}
            </div>

          </div>
        )}
        
        {/* DETAIL MODAL POPUP */}
        {selectedMatch && (
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300 ${isDark ? 'bg-slate-950/80' : 'bg-slate-900/40'}`}
            onClick={() => setSelectedMatch(null)}
          >
            {/* Modal Container */}
            <div 
              className={`relative w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Header Scoreboard Style */}
              <div className={`border-b p-6 flex flex-col items-center text-center transition ${isDark ? 'bg-[#1e293b]/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <button 
                  onClick={() => setSelectedMatch(null)}
                  className={`absolute top-4 right-4 p-2 rounded-lg transition cursor-pointer ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-855 hover:bg-slate-200/50'}`}
                >
                  <X className="h-5 w-5" />
                </button>
                
                <span className={`px-2.5 py-0.5 font-extrabold text-[10px] rounded-full border tracking-wider mb-2 transition ${isDark ? 'bg-slate-800/80 text-sky-400 border-slate-700' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
                  KOD {selectedMatch.code}
                </span>
                
                <div className={`text-xs font-bold uppercase tracking-wider mb-3 transition ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {selectedMatch.league}
                </div>
                
                <div className="flex items-center justify-center gap-6 w-full max-w-md">
                  <div className={`flex-1 text-right text-base sm:text-lg font-black truncate transition ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedMatch.homeTeam}
                  </div>
                  <div className={`font-medium text-xs py-1 px-2.5 rounded transition ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-slate-200 text-slate-600'}`}>
                    {selectedMatch.date} {selectedMatch.time}
                  </div>
                  <div className={`flex-1 text-left text-base sm:text-lg font-black truncate transition ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedMatch.awayTeam}
                  </div>
                </div>
              </div>
              
              {/* Odds Grid Body */}
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(() => {
                    const renderTopPickBox = (pickLabel: string, value: string | number | undefined, shortLabel: string) => {
                      const isSelected = cart.some(c => c.matchId === selectedMatch.id && c.pickLabel === pickLabel);
                      return (
                        <div 
                          onClick={() => toggleCartItem(selectedMatch, pickLabel, value || 0)}
                          className={`flex-1 p-2 rounded text-center border cursor-pointer select-none transition ${
                            isSelected
                              ? 'bg-sky-500/10 border-sky-500 text-sky-500 ring-1 ring-sky-500'
                              : isDark 
                                ? 'bg-[#0b0f19]/60 border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5' 
                                : 'bg-white border-slate-200/80 hover:border-sky-500/50 hover:bg-sky-50 shadow-sm'
                          }`}
                        >
                          <span className={`block text-[10px] font-bold ${isSelected ? 'text-sky-500' : 'text-slate-500'}`}>{shortLabel}</span>
                          <span className={`text-sm font-extrabold transition ${isSelected ? 'text-sky-400' : isDark ? 'text-white' : 'text-slate-900'}`}>{value || '-'}</span>
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* Maç Sonucu Card */}
                        <div className={`border p-4 rounded-xl space-y-3 transition ${isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50/60 border-slate-200/85'}`}>
                          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Maç Sonucu (MS)
                          </div>
                          <div className="flex gap-2">
                            {renderTopPickBox('MS 1', selectedMatch.ms1, '1')}
                            {renderTopPickBox('MS X', selectedMatch.msX, 'X')}
                            {renderTopPickBox('MS 2', selectedMatch.ms2, '2')}
                          </div>
                        </div>

                        {/* İlk Yarı Sonucu Card */}
                        <div className={`border p-4 rounded-xl space-y-3 transition ${isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50/60 border-slate-200/85'}`}>
                          <div className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
                            İlk Yarı Sonucu (İY)
                          </div>
                          <div className="flex gap-2">
                            {renderTopPickBox('İY 1', selectedMatch.iy1, '1')}
                            {renderTopPickBox('İY X', selectedMatch.iyX, 'X')}
                            {renderTopPickBox('İY 2', selectedMatch.iy2, '2')}
                          </div>
                        </div>

                        {/* Alt/Üst (2.5 & 3.5) Card */}
                        <div className={`border p-4 rounded-xl space-y-3 transition ${isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50/60 border-slate-200/85'}`}>
                          <div className="text-[11px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                            Alt / Üst Gol
                          </div>
                          <div className="flex gap-2">
                            {renderTopPickBox('2.5 ALT', selectedMatch.alt25, '2.5 Alt')}
                            {renderTopPickBox('2.5 ÜST', selectedMatch.ust25, '2.5 Üst')}
                          </div>
                          <div className="flex gap-2">
                            {renderTopPickBox('3.5 ALT', selectedMatch.alt35, '3.5 Alt')}
                            {renderTopPickBox('3.5 ÜST', selectedMatch.ust35, '3.5 Üst')}
                          </div>
                        </div>

                        {/* Karşılıklı Gol Card */}
                        <div className={`border p-4 rounded-xl space-y-3 transition ${isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50/60 border-slate-200/85'}`}>
                          <div className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span>
                            Karşılıklı Gol (KG)
                          </div>
                          <div className="flex gap-2">
                            {renderTopPickBox('KG VAR', selectedMatch.kgVar, 'Var')}
                            {renderTopPickBox('KG YOK', selectedMatch.kgYok, 'Yok')}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Dynamic Detailed Odds Section */}
                <div className={`border-t pt-5 mt-5 space-y-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                    <Sparkles className="h-4 w-4" />
                    Detaylı Bahis Seçenekleri
                  </h3>

                  {loadingOdds && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <div className="h-8 w-8 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin"></div>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Detaylı oranlar yükleniyor...</span>
                    </div>
                  )}

                  {oddsError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                      <span className="text-xs text-red-400 font-medium">{oddsError}</span>
                    </div>
                  )}

                  {!loadingOdds && !oddsError && detailedOdds && (
                    <div className="space-y-4">
                      {/* Tab Navigation */}
                      <div className="flex gap-1.5 border-b pb-1 overflow-x-auto scrollbar-none border-slate-200/60 dark:border-slate-800">
                        {[
                          { id: 'main', label: 'Ana Bahisler', count: categories.main.length },
                          { id: 'goals', label: 'Gol Bahisleri', count: categories.goals.length },
                          { id: 'halves', label: 'Yarı Bahisleri', count: categories.halves.length },
                          { id: 'combos', label: 'İY/MS & Kombi', count: categories.combos.length },
                          { id: 'players', label: 'Oyuncu Bahisleri', count: categories.players.length }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 ${
                              selectedTab === tab.id
                                ? 'bg-sky-500/10 text-sky-500 border-sky-500/30'
                                : isDark
                                  ? 'bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200'
                                  : 'bg-white text-slate-550 border-transparent hover:bg-slate-100 hover:text-slate-800'
                            }`}
                          >
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${
                                selectedTab === tab.id
                                  ? 'bg-sky-50 text-sky-600 dark:bg-sky-500 dark:text-white'
                                  : isDark
                                    ? 'bg-slate-800 text-slate-400'
                                    : 'bg-slate-200 text-slate-600'
                              }`}>
                                {tab.count}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content */}
                      <div className="space-y-3 pt-2">
                        {categories[selectedTab].length === 0 ? (
                          <div className={`text-center py-8 text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Bu kategoride bahis seçeneği bulunmamaktadır.
                          </div>
                        ) : (
                          categories[selectedTab].map((market: any, mIdx: number) => (
                            <div 
                              key={`${market.code}-${mIdx}`}
                              className={`border p-4 rounded-xl space-y-3 transition ${
                                isDark 
                                  ? 'bg-slate-900/40 border-slate-800/60' 
                                  : 'bg-slate-50/60 border-slate-200/85 shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                                  {market.name}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  KOD {market.code}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {market.outcomes.map((o: any, oIdx: number) => {
                                    const pickKey = `${market.name} - ${o.name}`;
                                    const isSelected = cart.some(c => c.matchId === selectedMatch.id && c.pickLabel === pickKey);

                                    return (
                                      <div 
                                        key={oIdx}
                                        onClick={() => toggleCartItem(selectedMatch, pickKey, o.value)}
                                        className={`p-2 rounded text-center border cursor-pointer select-none transition ${
                                          isSelected
                                            ? 'bg-sky-500/10 border-sky-500 text-sky-500 ring-1 ring-sky-500'
                                            : isDark 
                                              ? 'bg-[#0b0f19]/60 border-slate-800/80 hover:border-sky-500/50 hover:bg-sky-500/5' 
                                              : 'bg-white border-slate-200/85 hover:border-sky-500/50 hover:bg-slate-50 shadow-sm'
                                        }`}
                                      >
                                        <span className={`block text-[10px] truncate font-bold ${isSelected ? 'text-sky-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} title={o.name}>
                                          {o.name}
                                        </span>
                                        <span className={`text-xs font-extrabold transition ${isSelected ? 'text-sky-400' : isDark ? 'text-white' : 'text-slate-900'}`}>
                                          {o.value || '-'}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className={`border-t p-4 flex justify-end transition ${isDark ? 'bg-[#1e293b]/20 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    isDark 
                      ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700' 
                      : 'text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border-slate-200 shadow-sm'
                  }`}
                >
                  Kapat
                </button>
              </div>

            </div>
          </div>
        )}
        
        {/* Analysis Modal */}
        {analysisModalOpen && analysisMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setAnalysisModalOpen(false)}
            />
            
            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300 ${
              isDark ? 'bg-[#0f172a] border border-slate-800' : 'bg-white border border-slate-200'
            }`}>
              
              {/* Header */}
              <div className={`p-4 border-b flex justify-between items-center transition ${isDark ? 'border-slate-800/80 bg-[#1e293b]/40' : 'border-slate-100 bg-slate-50/80'}`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg transition ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`font-black text-sm tracking-tight transition ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Akıllı Oran Analizi
                    </h3>
                    <div className={`text-[10px] font-medium transition ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {analysisMatch.homeTeam} - {analysisMatch.awayTeam}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setAnalysisModalOpen(false)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className={`flex-1 overflow-y-auto p-4 transition ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`}>
                {loadingAnalysis ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <RefreshCw className={`w-8 h-8 animate-spin mb-4 ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`} />
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Geçmiş eşleşmeler taranıyor...</p>
                  </div>
                ) : analysisData?.error ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Analiz Hatası</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{analysisData.error}</p>
                  </div>
                ) : analysisData?.total === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div className={`p-3 rounded-full mb-3 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <Search className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Benzer Eşleşme Bulunamadı</p>
                    <p className={`text-xs mt-1 max-w-[250px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Geçmiş veritabanında bu oranlara (MS: {analysisMatch.ms1} - {analysisMatch.msX} - {analysisMatch.ms2}) benzer bir maç henüz oynanmamış veya sisteme yüklenmemiş.
                    </p>
                  </div>
                ) : analysisData ? (
                  <div className="space-y-6">
                    {/* YENİ: GENİŞ ORAN ANALİZİ BAŞLIĞI */}
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-5 rounded-full ${isDark ? 'bg-purple-500' : 'bg-purple-600'}`}></div>
                      <h3 className={`font-black text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>GENİŞ ORAN ANALİZİ</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>DETAYLI İSTATİSTİKLER</span>
                    </div>

                    {/* AI Tahmini (Eğer varsa) */}
                    {analysisData.ai_predictions && analysisData.ai_predictions.length > 0 && (
                      <div className="space-y-2">
                        {analysisData.ai_predictions.map((pred: any, idx: number) => (
                          <div key={idx} className={`p-4 rounded-xl border-2 shadow flex items-center justify-between gap-4 transition ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-400/50'}`}>
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                <span className="text-sm">🤖</span> YAPAY ZEKA ÖNCELİĞİ
                              </span>
                              <div className="flex items-baseline gap-3 mt-1">
                                <span className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{pred.label}</span>
                                {pred.odd > 0 && (
                                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg border ${isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-200 text-emerald-800 border-emerald-300'}`}>
                                    Oran: {pred.odd.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-2xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>%{pred.percent}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Geniş Analiz Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { title: 'MS ORANLARINA GÖRE', data: analysisData.ms_stats },
                        { title: 'KG VAR/YOK ORANLARINA GÖRE', data: analysisData.kg_stats },
                        { title: '1.5 A/Ü ORANLARINA GÖRE', data: analysisData.au15_stats },
                        { title: '2.5 A/Ü ORANLARINA GÖRE', data: analysisData.au25_stats },
                        { title: '3.5 A/Ü ORANLARINA GÖRE', data: analysisData.au35_stats }
                      ].map((category, cIdx) => {
                        if (!category.data || category.data.total === 0) return null;
                        
                        const renderBox = (label: string, count: number, colorMode: 'blue' | 'gold' | 'green' | 'red') => {
                          const percent = Math.round((count / category.data.total) * 100);
                          let colorClass = '';
                          if (colorMode === 'blue') colorClass = isDark ? 'text-sky-400' : 'text-sky-600';
                          if (colorMode === 'gold') colorClass = isDark ? 'text-amber-400' : 'text-amber-500';
                          if (colorMode === 'green') colorClass = isDark ? 'text-emerald-400' : 'text-emerald-500';
                          if (colorMode === 'red') colorClass = isDark ? 'text-rose-400' : 'text-rose-500';

                          return (
                            <div className={`p-2 flex flex-col items-center justify-center rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50' : 'bg-white border-slate-200/80 hover:bg-slate-50 shadow-sm'} transition`}>
                              <span className={`text-[9px] font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
                              <span className={`text-sm font-black ${colorClass}`}>%{percent}</span>
                            </div>
                          );
                        };

                        return (
                          <div key={cIdx} className={`p-4 rounded-xl border ${isDark ? 'bg-[#1e293b]/30 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                            <div className="flex justify-between items-center mb-4">
                              <h4 className={`text-xs font-black uppercase ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{category.title}</h4>
                              <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{category.data.total} Maç</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              {renderBox('MS 1', category.data.ms1, 'blue')}
                              {renderBox('MS X', category.data.msX || category.data.msx, 'blue')}
                              {renderBox('MS 2', category.data.ms2, 'blue')}
                              
                              {renderBox('1.5 Ü', category.data.u15, 'gold')}
                              {renderBox('2.5 Ü', category.data.u25, 'gold')}
                              {renderBox('3.5 Ü', category.data.u35, 'gold')}
                              
                              {renderBox('1.5 A', category.data.a15, 'green')}
                              {renderBox('2.5 A', category.data.a25, 'green')}
                              {renderBox('3.5 A', category.data.a35, 'green')}
                              
                              {renderBox('KG VAR', category.data.kgvar, 'green')}
                              {renderBox('KG YOK', category.data.kgyok, 'red')}
                              
                              <div className={`p-2 flex flex-col items-center justify-center rounded-lg border ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-slate-100 border-slate-200/80'}`}>
                                <span className={`text-[9px] font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ADET</span>
                                <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{category.data.total}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className={`border-t p-4 flex justify-end transition ${isDark ? 'bg-[#1e293b]/20 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <button
                  onClick={() => setAnalysisModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    isDark 
                      ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700' 
                      : 'text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border-slate-200 shadow-sm'
                  }`}
                >
                  Kapat
                </button>
              </div>

            </div>
          </div>
        )}

      {/* Daily AI Picks Modal */}
      {dailyPicksModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setDailyPicksModalOpen(false)}
          />
          <div className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-700/50 shadow-black/50' : 'bg-white border-slate-200 shadow-xl'
          }`}>
            <div className={`shrink-0 px-6 py-5 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${dailyPicksTab === 'yesterday' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                  {dailyPicksTab === 'yesterday' ? <Award className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {dailyPicksTab === 'yesterday' 
                      ? 'Geçmiş Maç Sonuçları & Başarı Raporu' 
                      : (picksModalLeague ? `${picksModalLeague} Analizleri` : 'Yapay Zeka Favorileri')}
                  </h3>
                  <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {dailyPicksTab === 'yesterday'
                      ? 'Yapay zekanın geçmiş bültenlerde verdiği tahminlerin resmi maç sonuçlarına göre değerlendirmesi'
                      : (activeDailyPicksTab === 'banko' 
                          ? 'Yapay zekanın bültendeki her maç için belirlediği en yüksek ihtimalli öncelikli tahminler'
                          : 'Günün bülteninden seçilen ideal ve değerli oranlı tahminler')
                    }
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDailyPicksModalOpen(false)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Master Mode Switcher: [ Bugünün Tahminleri ] [ Dünkü Sonuçlar & Başarı ] */}
              <div className="flex justify-center mb-5">
                <div className={`flex p-1 rounded-2xl border shadow-inner ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                  <button
                    onClick={() => setDailyPicksTab('today')}
                    className={`px-4 md:px-6 py-2 text-xs md:text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer ${
                      dailyPicksTab === 'today'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Bugünün Tahminleri
                  </button>
                  <button
                    onClick={() => handleLoadYesterdayPicks(selectedDaysAgo || 1)}
                    className={`px-4 md:px-6 py-2 text-xs md:text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer ${
                      dailyPicksTab === 'yesterday'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    Dünkü Sonuçlar & Başarı
                  </button>
                </div>
              </div>

              {dailyPicksTab === 'today' ? (
                /* =================== TODAY PICKS TAB =================== */
                loadingDailyPicks ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-800 animate-[spin_3s_linear_infinite]" />
                      <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                    </div>
                    <h4 className={`mt-6 text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Bülten Taranıyor...</h4>
                    <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Yapay zeka günün maçlarını analiz ediyor, lütfen bekleyin.</p>
                  </div>
                ) : dailyPicksError ? (
                  <div className="text-center py-10">
                    <p className="text-red-400 text-sm">{dailyPicksError}</p>
                  </div>
                ) : dailyPicks ? (
                  <>
                    <div className="flex flex-col items-center gap-4 mb-6">
                      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full max-w-sm">
                        <button
                          onClick={() => setActiveDailyPicksTab('banko')}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition cursor-pointer ${
                            activeDailyPicksTab === 'banko'
                              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          Yüksek Güvenli Bankolar
                        </button>
                        <button
                          onClick={() => setActiveDailyPicksTab('value')}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition cursor-pointer ${
                            activeDailyPicksTab === 'value'
                              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          İdeal / Değerli Oranlar
                        </button>
                      </div>
                      
                      {!picksModalLeague && (
                        <div className="w-full max-w-md relative">
                          <input 
                            type="text" 
                            placeholder="Takım veya lig ara..." 
                            value={modalSearch}
                            onChange={(e) => setModalSearch(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none border transition ${
                              isDark ? 'bg-slate-800/50 border-slate-700 focus:border-slate-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-slate-400 text-slate-800'
                            }`}
                          />
                          <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        </div>
                      )}
                    </div>

                    {(() => {
                      const filteredModalPicks = (dailyPicks[activeDailyPicksTab] || []).filter((item: any) => {
                        if (picksModalLeague) {
                          const l1 = (item.match.league || '').toLowerCase();
                          const l2 = picksModalLeague.toLowerCase();
                          const isMatch = l1 === l2 || 
                                          l1.includes(l2) || 
                                          l2.includes(l1) ||
                                          (l2.includes('şmp') && (l1.includes('şampiyon') || l1.includes('smp') || l1.includes('champions'))) ||
                                          (l1.includes('şmp') && (l2.includes('şampiyon') || l2.includes('smp') || l2.includes('champions')));
                          if (!isMatch) return false;
                        }
                        if (!picksModalLeague && modalSearch) {
                          const q = modalSearch.toLowerCase();
                          if (!item.match.homeTeam.toLowerCase().includes(q) && 
                              !item.match.awayTeam.toLowerCase().includes(q) && 
                              !item.match.league.toLowerCase().includes(q)) {
                            return false;
                          }
                        }
                        return true;
                      });
                      
                      return filteredModalPicks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredModalPicks.map((item: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-2xl border transition-all ${
                        isDark ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-amber-500/30' : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-amber-500/30 hover:shadow-md'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border text-slate-600'
                          }`}>
                            {item.match.date} | {item.match.time} | {item.match.league}
                          </span>
                          <div className={`flex items-center gap-1.5 text-xs font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            <Sparkles className="w-3 h-3" />
                            %{item.prediction.percent}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.match.homeTeam}</div>
                          <div className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.match.awayTeam}</div>
                        </div>

                        <button 
                          onClick={() => toggleCartItem(item.match, item.prediction.label, item.prediction.odd)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40' 
                            : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                        }`}>
                          <div className={`text-sm font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            {item.prediction.label}
                          </div>
                          <div className={`text-sm font-black px-2 py-1 rounded-lg ${
                            isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-200 text-emerald-800'
                          }`}>
                            {Number(item.prediction.odd).toFixed(2)}
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Uygun Maç Bulunamadı</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {activeDailyPicksTab === 'banko' 
                        ? (picksModalLeague ? `Bu ligde yapay zeka tahmini bulunamadı.` : 'Bugünkü bültende yapay zeka tahmini bulunamadı.')
                        : (picksModalLeague ? `Bu ligde 1.40 üzeri oranlı ideal bir tahmin bulunamadı.` : 'Bugünkü bültende 1.40 üzeri oranlı ideal bir tahmin bulunamadı.')}
                    </p>
                  </div>
                );
              })()}
                </>
              ) : null
              ) : (
                /* =================== YESTERDAY RESULTS TAB =================== */
                loadingYesterdayPicks ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-800 animate-[spin_3s_linear_infinite]" />
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    </div>
                    <h4 className={`mt-6 text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Geçmiş Maçlar ve Sonuçlar Yükleniyor...</h4>
                    <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Yapay zeka dünkü tahminlerin isabet durumunu hesaplıyor, lütfen bekleyin.</p>
                  </div>
                ) : yesterdayPicksData ? (
                  <div className="space-y-6">
                    {/* Date Selector & Stats Summary Banner */}
                    <div className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {/* Date Pills */}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3].map((d) => (
                          <button
                            key={d}
                            onClick={() => handleLoadYesterdayPicks(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                              selectedDaysAgo === d
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                                : (isDark ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white' : 'bg-white text-slate-600 border-slate-200 hover:text-black')
                            }`}
                          >
                            {d === 1 ? 'Dün' : `${d} Gün Önce`}
                          </button>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 flex-wrap justify-center">
                        <div className="text-center md:text-right">
                          <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {yesterdayPicksData.formattedDate || yesterdayPicksData.targetDate}
                          </div>
                          <div className="text-sm font-extrabold flex items-center gap-2 mt-0.5">
                            <span className="text-emerald-500">{yesterdayPicksData.wonPicks || 0} Kazandı</span>
                            <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
                            <span className="text-rose-400">{(yesterdayPicksData.totalPicks || 0) - (yesterdayPicksData.wonPicks || 0)} Kaybetti</span>
                            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({yesterdayPicksData.totalPicks || 0} Maç)</span>
                          </div>
                        </div>

                        <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-sm md:text-base font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 animate-pulse">
                          <Award className="w-5 h-5" />
                          %{yesterdayPicksData.successRate || 0} Başarı
                        </div>
                      </div>
                    </div>

                    {/* Filter Buttons & Search */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                      <div className={`flex p-1 rounded-xl border w-full md:w-auto ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                        <button
                          onClick={() => setYesterdayStatusFilter('all')}
                          className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                            yesterdayStatusFilter === 'all'
                              ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Tümü ({yesterdayPicksData.picks?.length || 0})
                        </button>
                        <button
                          onClick={() => setYesterdayStatusFilter('won')}
                          className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                            yesterdayStatusFilter === 'won'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-emerald-400 hover:text-emerald-300'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Kazananlar ({yesterdayPicksData.picks?.filter((p: any) => p.won).length || 0})
                        </button>
                        <button
                          onClick={() => setYesterdayStatusFilter('lost')}
                          className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                            yesterdayStatusFilter === 'lost'
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'text-rose-400 hover:text-rose-300'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Kaybedenler ({yesterdayPicksData.picks?.filter((p: any) => !p.won).length || 0})
                        </button>
                      </div>

                      <div className="w-full md:w-64 relative">
                        <input
                          type="text"
                          placeholder="Dünkü takımlardan ara..."
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                          className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none border transition ${
                            isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                          }`}
                        />
                        <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    {/* Grid of Evaluated Matches */}
                    {(() => {
                      const filteredYesterdayPicks = (yesterdayPicksData.picks || []).filter((item: any) => {
                        if (yesterdayStatusFilter === 'won' && !item.won) return false;
                        if (yesterdayStatusFilter === 'lost' && item.won) return false;
                        if (modalSearch) {
                          const q = modalSearch.toLowerCase();
                          if (!item.homeTeam?.toLowerCase().includes(q) &&
                              !item.awayTeam?.toLowerCase().includes(q) &&
                              !item.league?.toLowerCase().includes(q)) {
                            return false;
                          }
                        }
                        return true;
                      });

                      return filteredYesterdayPicks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredYesterdayPicks.map((item: any, idx: number) => {
                            const isWon = item.won === true;
                            return (
                              <div 
                                key={idx}
                                className={`p-4 rounded-2xl border transition-all ${
                                  isWon
                                    ? (isDark 
                                        ? 'bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-400/50 shadow-sm shadow-emerald-500/5' 
                                        : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 hover:shadow-md')
                                    : (isDark 
                                        ? 'bg-rose-950/15 border-rose-500/30 hover:border-rose-400/50' 
                                        : 'bg-rose-50/50 border-rose-200 hover:border-rose-300')
                                }`}
                              >
                                {/* Header: Time & League & AI Prob */}
                                <div className="flex items-center justify-between mb-2.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-white border text-slate-600'
                                  }`}>
                                    {item.time || ''} {item.league || 'Bülten'}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs font-black text-amber-400">
                                    <Sparkles className="w-3 h-3" />
                                    %{item.percent}
                                  </div>
                                </div>

                                {/* Teams & Scores */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm font-bold truncate max-w-[170px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.homeTeam}</span>
                                    <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                                      MS {item.msScore || '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className={`text-sm font-bold truncate max-w-[170px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.awayTeam}</span>
                                    {item.iyScore && (
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        (İY {item.iyScore})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Pick & Result Status */}
                                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                  isWon
                                    ? (isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-800')
                                    : (isDark ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-800')
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black">{item.pickLabel}</span>
                                    <span className="text-[10px] font-bold opacity-75">({Number(item.pickOdd).toFixed(2)})</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs font-black tracking-wide">
                                    {isWon ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                                        <span>KAZANDI</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 text-rose-400" />
                                        <span>KAYBETTİ</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-sm text-slate-400">Bu filtrelere uygun geçmiş maç bulunamadı.</p>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-slate-400">Geçmiş maç sonuçları henüz kaydedilmedi veya bulunamadı.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div className={`fixed bottom-4 right-4 w-80 rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} z-[200]`}>
          <div className={`p-3 font-bold text-sm flex justify-between items-center ${isDark ? 'bg-slate-800 text-white' : 'bg-emerald-500 text-white'}`}>
            <span>Kuponunuz ({cart.length} Maç)</span>
            <button onClick={() => setCart([])} className="text-xs bg-black/20 px-2 py-1 rounded hover:bg-black/40 transition">Temizle</button>
          </div>
          <div className="max-h-60 overflow-y-auto p-2 space-y-2">
            {cart.map((item, i) => (
              <div key={i} className={`p-2 rounded border text-xs flex justify-between items-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col">
                  <span className="font-bold truncate w-32" title={`${item.homeTeam} - ${item.awayTeam}`}>{item.homeTeam} - {item.awayTeam}</span>
                  <span className="text-[10px] text-slate-500">{item.pickLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-500">{item.pickOdd.toFixed(2)}</span>
                  <button onClick={() => setCart(prev => prev.filter(p => p.matchId !== item.matchId))} className="text-red-500 hover:text-red-700 font-bold text-lg leading-none">×</button>
                </div>
              </div>
            ))}
          </div>
          <div className={`p-3 border-t ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">Toplam Oran:</span>
              <span className="text-lg font-black text-emerald-500">{cart.reduce((a,b)=>a*b.pickOdd,1).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-slate-500">Miktar (TL):</span>
              <input type="number" value={cartStake} onChange={(e) => setCartStake(Number(e.target.value))} min={1} className={`flex-1 px-2 py-1 rounded text-sm font-bold outline-none border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`} />
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-500">Olası Kazanç:</span>
              <span className="text-sm font-black text-emerald-500">{(cart.reduce((a,b)=>a*b.pickOdd,1) * cartStake).toFixed(2)} TL</span>
            </div>
            <button onClick={() => saveCart()} disabled={isSavingCart} className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition disabled:opacity-50">
              {isSavingCart ? 'Kaydediliyor...' : 'Kuponu Kaydet'}
            </button>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
