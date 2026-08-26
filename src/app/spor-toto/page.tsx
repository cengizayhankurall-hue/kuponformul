'use client';

import React, { useEffect, useState } from 'react';
import { isMockMode, mockService, UserProfile, dbService, NewsAnnouncement } from '@/lib/supabase';
import { MatchPrediction, FilterSettings, calculateOddsProbabilities, generateSmartIddaaSelections } from '@/lib/formulaHelper';
import { ScrapedMatch } from '@/app/api/fetch-matches/route';
import { 
  Download, Play, RotateCcw, Award, Sparkles, AlertTriangle, 
  HelpCircle, ChevronDown, Check, TrendingUp, Sun, Moon, Save, Copy, ChevronLeft, ChevronRight,
  Activity, RefreshCw, Lock, Shield, ExternalLink, X
} from 'lucide-react';
import Link from 'next/link';

const KOLON_BEDELI = 10; // Spor Toto Kolon Bedeli (TL)

function parsePastedBulletin(text: string): ScrapedMatch[] {
  const lines = text.split('\n');
  const parsedMatches: ScrapedMatch[] = [];
  let index = 0;
  
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    
    // Yüzdelikleri bul (örn: %59 %26 %15 veya 59 26 15)
    const pctMatches = line.match(/%?(\d+)\s*%?(\d+)\s*%?(\d+)\s*$/);
    const percentages: [number, number, number] = [33, 33, 34];
    let restOfLine = line;
    
    if (pctMatches) {
      percentages[0] = parseInt(pctMatches[1]) || 33;
      percentages[1] = parseInt(pctMatches[2]) || 33;
      percentages[2] = parseInt(pctMatches[3]) || 34;
      restOfLine = line.substring(0, line.lastIndexOf(pctMatches[0])).trim();
    }
    
    // Satır başındaki "1." veya "1 " gibi sayıları temizle
    let cleanLine = restOfLine.replace(/^\d+[\s\.\-)]+/, '').trim();
    
    // Ev sahibi ve deplasmanı ayır
    const sep = cleanLine.includes(' - ') ? ' - ' : (cleanLine.includes(' v ') ? ' v ' : ' vs ');
    const parts = cleanLine.split(sep);
    
    let home = 'Ev Sahibi';
    let away = 'Deplasman';
    if (parts.length >= 2) {
      home = parts[0].trim();
      away = parts[1].trim();
    } else {
      home = cleanLine || `Maç ${index + 1}`;
    }
    
    parsedMatches.push({
      matchIndex: index,
      homeTeam: home,
      awayTeam: away,
      dateTime: 'Belirtilmedi',
      probabilities: percentages
    });
    
    index++;
    if (index >= 15) break;
  }
  
  // 15 maça tamamla
  while (parsedMatches.length < 15) {
    const idx = parsedMatches.length;
    parsedMatches.push({
      matchIndex: idx,
      homeTeam: `Ev Sahibi ${idx + 1}`,
      awayTeam: `Deplasman ${idx + 1}`,
      dateTime: 'Belirtilmedi',
      probabilities: [33, 33, 34]
    });
  }
  
  return parsedMatches;
}

export default function HomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<ScrapedMatch[]>([]);
  const [selections, setSelections] = useState<string[][]>(Array(15).fill([]).map(() => []));
  const [guarantee, setGuarantee] = useState<15 | 14 | 13 | 12>(14);
  const [loadingMatches, setLoadingMatches] = useState(true);
  
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  
  // Filtreler varsayılan değerleri
  const [filters, setFilters] = useState<FilterSettings>({
    homeWins: [3, 9],
    draws: [2, 6],
    awayWins: [2, 7],
    maxConsecutiveHome: 4,
    maxConsecutiveDraw: 3,
    maxConsecutiveAway: 4,
    probabilitySum: [550, 950],
    favoriteLosses: [0, 5]
  });

  // Filtre aktiflik durumları
  const [homeWinsActive, setHomeWinsActive] = useState(true);
  const [drawsActive, setDrawsActive] = useState(true);
  const [awayWinsActive, setAwayWinsActive] = useState(true);
  const [probabilityActive, setProbabilityActive] = useState(true);
  const [consecutiveActive, setConsecutiveActive] = useState(false);
  const [favoriteActive, setFavoriteActive] = useState(false);

  // İddaa Oran Modu (Toto halk yüzdeleri yerine İddaa maç oranlarının olasılıklarını kullanır)
  const [useIddaaOddsMode, setUseIddaaOddsMode] = useState(false);

  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Hesaplama sonuçları
  const [results, setResults] = useState<{
    columns: string[][];
    totalBeforeFilters: number;
    totalAfterFilters: number;
    probabilities?: Record<number, number>;
  } | null>(null);

  const [isPremium, setIsPremium] = useState(false);

  // Geçmiş bültenler ve ikramiyeler için
  const [rounds, setRounds] = useState<{ id: number; name: string }[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [pastPayouts, setPastPayouts] = useState<any | null>(null);
  const [currentWeekName, setCurrentWeekName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'news' | 'create'>('news');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const [showVideoModal, setShowVideoModal] = useState(false);
  
  // Nesine Sunucudan Aktar Modal Durumları
  const [showNesineModal, setShowNesineModal] = useState(false);
  const [nesineSessionId, setNesineSessionId] = useState<string>('');
  const [nesineUsername, setNesineUsername] = useState('');
  const [nesinePassword, setNesinePassword] = useState('');
  const [nesineCaptcha, setNesineCaptcha] = useState('');
  const [captchaImg, setCaptchaImg] = useState<string | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [nesineCouponName, setNesineCouponName] = useState('14G Formül Kuponu');
  const [savingToNesine, setSavingToNesine] = useState(false);
  const [nesineSaveResult, setNesineSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchNesineCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError(null);
      setCaptchaImg(null);
      const res = await fetch('/api/nesine/captcha');
      const data = await res.json();
      if (data.success && data.captchaImage) {
        setCaptchaImg(data.captchaImage);
        setNesineSessionId(data.sessionId || '');
      } else {
        setCaptchaError(data.error || 'Güvenlik kodu alınamadı.');
      }
    } catch (e: any) {
      setCaptchaError('Bağlantı hatası: ' + e.message);
    } finally {
      setCaptchaLoading(false);
    }
  };

  const handleOpenNesineModal = () => {
    setShowNesineModal(true);
    setNesineSaveResult(null);
    setNesineCaptcha('');
    fetchNesineCaptcha();
  };

  const handleSaveToNesine = async () => {
    if (!nesineUsername || !nesinePassword) {
      setNesineSaveResult({ success: false, message: 'Lütfen Nesine Üye No / T.C. Kimlik ve Şifrenizi giriniz.' });
      return;
    }
    if (!nesineCaptcha) {
      setNesineSaveResult({ success: false, message: 'Lütfen güvenlik kodunu (Captcha) giriniz.' });
      return;
    }
    if (!results || !results.columns || results.columns.length === 0) {
      setNesineSaveResult({ success: false, message: 'Kaydedilecek kolon bulunamadı.' });
      return;
    }

    setSavingToNesine(true);
    setNesineSaveResult(null);

    try {
      const res = await fetch('/api/nesine/save-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: nesineSessionId,
          username: nesineUsername,
          password: nesinePassword,
          captcha: nesineCaptcha,
          couponName: nesineCouponName,
          columns: results.columns
        })
      });

      const data = await res.json();
      if (data.success) {
        setNesineSaveResult({ success: true, message: data.message });
      } else {
        setNesineCaptcha('');
        setNesineSaveResult({ success: false, message: data.error || 'Kaydetme işlemi başarısız oldu.' });
        fetchNesineCaptcha();
      }
    } catch (err: any) {
      setNesineCaptcha('');
      setNesineSaveResult({ success: false, message: 'Bağlantı hatası: ' + err.message });
      fetchNesineCaptcha();
    } finally {
      setSavingToNesine(false);
    }
  };

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPlayingCoupon, setIsPlayingCoupon] = useState(false);

  const handleFetchNesineRates = () => {
    if (typeof window !== 'undefined') {
      window.postMessage({ type: 'ST_GET_NESINE_RATES' }, '*');
      setSuccessMsg("Canlı oranlar arka planda çekiliyor, lütfen bekleyin...");
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };
  
  // Haberler (Slider)
  const [news, setNews] = useState<NewsAnnouncement[]>([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  // Oturum Yükle
  useEffect(() => {
    async function loadUser() {
      if (isMockMode) {
        const { data: { session } } = await mockService.getSession();
        if (session && session.user) {
          setUser(session.user);
          const activeSub = await mockService.getActiveSubscription(session.user.id);
          setIsPremium(!!activeSub);
        }
      } else {
        const { supabase } = await import('@/lib/supabase');
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || 'Kullanıcı',
              phone: session.user.user_metadata?.phone || ''
            });
            setIsPremium(true); // Ücretsiz sınırsız erişim
          }
        }
      }
    }
    loadUser();
  }, []);

  // Haftalar listesini yükle
  useEffect(() => {
    async function loadRounds() {
      try {
        const res = await fetch('/api/fetch-matches?allRounds=true');
        const data = await res.json();
        if (data.success && data.rounds) {
          setRounds(data.rounds);
        }
      } catch (err) {
        console.error('Rounds fetch error:', err);
      }
    }
    loadRounds();
  }, []);

  // YZ Asistanı için anlık context'i güncelle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).sttTotoContext = {
        matches,
        selections,
        guarantee,
        results,
        filters
      };
    }
  }, [matches, selections, guarantee, results, filters]);

  // Haberleri Yükle
  useEffect(() => {
    async function loadNews() {
      const res = await dbService.getActiveNews('spor-toto');
      if (res.data && res.data.length > 0) {
        setNews(res.data);
      } else {
        // Fallback static news if none active
        setNews([{
          id: 'static-1',
          title: 'KUPON FORMÜLÜ SİHİRBAZI KILAVUZU',
          description: 'Spor Toto kupon maliyetlerinizi düşürmek için formül ve filtrelerin nasıl kullanılacağını adım adım öğrenin. 15, 14 ve 13 garanti sistemlerinin çalışma prensiplerini detaylı video eğitimimizi izleyerek hemen keşfedin.',
          badge_text: 'Kılavuz & İpuçları',
          button_text: 'Eğitim Videosunu İzle',
          button_action: 'modal:video',
          bg_image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60',
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

  // Eklenti ile iletişim kurup gerçek Nesine oranlarını almak için
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'ST_NESINE_RATES_SUCCESS') {
        const rates = event.data.payload;
        if (Array.isArray(rates) && rates.length >= 15) {
          setMatches(prevMatches => {
            return prevMatches.map((m, idx) => {
              if (rates[idx]) {
                return {
                  ...m,
                  probabilities: rates[idx] as [number, number, number]
                };
              }
              return m;
            });
          });
          setSuccessMsg("Eklenti üzerinden canlı oranlar başarıyla alındı!");
          setTimeout(() => setSuccessMsg(null), 3000);
        }
      } else if (event.data && event.data.type === 'ST_NESINE_RATES_ERROR') {
        console.warn("Canlı oranlar eklenti üzerinden alınamadı, yerel/sahte oranlar kullanılmaya devam ediliyor.");
      } else if (event.data && event.data.type === 'ST_COUPON_SENT_SUCCESS') {
        setIsPlayingCoupon(false);
        setSuccessMsg("Kupon eklentiye başarıyla gönderildi, bahis sitesi açılıyor...");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    };

    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, []);

  // Maçları API'den çek
  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch('/api/fetch-matches');
        const data = await res.json();
        if (data.success && data.matches) {
          setMatches(data.matches);
          setCurrentWeekName(data.week || 'Güncel Bülten');
          const savedData = sessionStorage.getItem('st_load_coupon') || localStorage.getItem('stt_draft_coupon');
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              if (parsed.selections && parsed.selections.length > 0) {
                setSelections(parsed.selections);
              }
              if (parsed.guarantee) {
                setGuarantee(parsed.guarantee);
              }
              if (parsed.generated_columns && parsed.generated_columns.length > 0) {
                setResults({
                  columns: parsed.generated_columns,
                  totalBeforeFilters: parsed.columns_count || parsed.generated_columns.length,
                  totalAfterFilters: parsed.generated_columns.length
                });
              } else {
                // Seçimlerin state'e oturması için kısa bir süre bekleyip otomatik hesaplamayı tetikliyoruz
                setTimeout(() => {
                  const btn = document.getElementById('btn-calculate');
                  if (btn && !btn.hasAttribute('disabled')) {
                    btn.click();
                  }
                }, 300);
              }
              setActiveTab('create');
              sessionStorage.removeItem('st_load_coupon');
              localStorage.removeItem('stt_draft_coupon');
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/spor-toto');
              }
            } catch (err) {
              setSelections(prev => prev.some(col => col.length > 0) ? prev : Array(data.matches.length).fill([]).map(() => []));
            }
          } else {
            // React Strict Mode'da ikinci kez çalışıp ekranı boşaltmaması için:
            // Sadece ekran boşsa sıfırla, doluysa (yani az önce yüklendiyse) dokunma.
            setSelections(prev => {
              if (prev && prev.some(col => col.length > 0)) return prev;
              return Array(data.matches.length).fill([]).map(() => []);
            });
          }

          // 1. Nesine'den canlı yüzdeleri çek
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.postMessage({ type: 'ST_GET_NESINE_RATES' }, '*');
            }
          }, 1000);

          // 2. Gerçek İddaa bülten oranlarını çek ve maçlarla eşleştir
          fetch('/api/fetch-iddaa')
            .then(res => res.json())
            .then(iddaaData => {
              if (iddaaData.success && Array.isArray(iddaaData.matches)) {
                const iddaaList = iddaaData.matches;
                setMatches(prevMatches => {
                  return prevMatches.map(m => {
                    const cleanT1 = m.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanT2 = m.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const found = iddaaList.find((im: any) => {
                      const im1 = (im.homeTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                      const im2 = (im.awayTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                      return (im1.includes(cleanT1) || cleanT1.includes(im1)) && (im2.includes(cleanT2) || cleanT2.includes(im2));
                    });
                    if (found && found.ms1 && found.ms1 !== '-' && found.ms1 !== '0') {
                      return {
                        ...m,
                        odds: [
                          parseFloat(found.ms1).toFixed(2),
                          parseFloat(found.msX || found.ms0).toFixed(2),
                          parseFloat(found.ms2).toFixed(2)
                        ]
                      };
                    }
                    return m;
                  });
                });
              }
            })
            .catch(err => console.error('Fetch iddaa odds for toto error:', err));
        }
      } catch (err) {
        console.error('Matches fetch error:', err);
      } finally {
        setLoadingMatches(false);
      }
    }
    loadMatches();
  }, []);

  // YZ Asistanı tarafından oluşturulan kuponu tabloya uygula
  useEffect(() => {
    const handleApplySelections = (e: any) => {
      if (e.detail && Array.isArray(e.detail.selections)) {
        setSelections(e.detail.selections);
        setSuccessMsg("🤖 YZ Asistanı 15 maçlık kuponunuzu veritabanı analizlerine göre tabloya otomatik doldurdu!");
        setTimeout(() => setSuccessMsg(null), 4500);
      }
    };
    window.addEventListener('ST_APPLY_AI_SELECTIONS', handleApplySelections);
    return () => window.removeEventListener('ST_APPLY_AI_SELECTIONS', handleApplySelections);
  }, []);



  // Liderlik tablosunu çek
  useEffect(() => {
    async function fetchLeaderboard() {
      if (matches.length === 0) return;
      const roundKey = selectedRoundId || currentWeekName || 'Aktif';
      const board = await dbService.getLeaderboard(roundKey, matches);
      setLeaderboard(board);
    }
    fetchLeaderboard();
  }, [selectedRoundId, currentWeekName, matches]);
  const toggleSelection = (matchIdx: number, val: string) => {
    if (selectedRoundId) return; // Geçmiş bültenlerde seçim değiştirilemez
    const newSels = [...selections];
    const current = newSels[matchIdx] || [];
    if (current.includes(val)) {
      newSels[matchIdx] = current.filter(x => x !== val);
    } else {
      newSels[matchIdx] = [...current, val].sort();
    }
    setSelections(newSels);
    setResults(null); // Seçim değiştiğinde sonuçları sıfırla
    setError(null);
  };

  // Oynanma oranlarını el ile değiştirebilmek için
  const handleProbabilityChange = (matchIdx: number, outcomeIdx: number, value: number) => {
    const newMatches = [...matches];
    if (newMatches[matchIdx]) {
      const newProbs = [...newMatches[matchIdx].probabilities];
      newProbs[outcomeIdx] = Math.max(0, Math.min(100, value));
      newMatches[matchIdx] = {
        ...newMatches[matchIdx],
        probabilities: newProbs as [number, number, number]
      };
      setMatches(newMatches);
      setResults(null);
      setError(null);
      setSuccessMsg(null);
    }
  };

  // Haftalık seçim değiştiğinde geçmiş sonuçları yüklemek için
  const handleRoundChange = async (roundId: string) => {
    setSelectedRoundId(roundId);
    setResults(null);
    setError(null);
    setSuccessMsg(null);

    if (!roundId) {
      // Güncel haftayı yeniden çek
      setLoadingMatches(true);
      try {
        const res = await fetch('/api/fetch-matches');
        const data = await res.json();
        if (data.success && data.matches) {
          setMatches(data.matches);
          setSelections(Array(data.matches.length).fill([]).map(() => []));
        }
      } catch (err) {
        console.error('Error fetching current round matches:', err);
      } finally {
        setLoadingMatches(false);
      }
      setPastPayouts(null);
      return;
    }

    // Geçmiş haftanın maçlarını ve sonuçlarını çek
    setLoadingMatches(true);
    try {
      const res = await fetch(`/api/fetch-matches?roundId=${roundId}`);
      const data = await res.json();
      if (data.success && data.matches) {
        setMatches(data.matches);
        setPastPayouts(data.payouts);
        // Varsayılan olarak her maçta gerçekleşmiş (tutan) sonucu seçili hale getir
        const defaultSelections = data.matches.map((m: any) => {
          return m.outcome ? [m.outcome] : ['1'];
        });
        setSelections(defaultSelections);
      }
    } catch (err) {
      console.error('Error fetching past round matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Toplam kolon sayısı hesaplayıcı
  const getBaseColumnNumber = () => {
    return selections.reduce((acc, current) => acc * (current.length || 1), 1);
  };

  // Tüm seçimleri temizle
  const handleClearAll = () => {
    setSelections(Array(15).fill([]).map(() => []));
    setResults(null);
    setError(null);
    setSuccessMsg(null);
  };

  const hasIddaaOdds = matches.length > 0 && matches.some(m => m.odds && m.odds[0] && m.odds[1] && m.odds[2] && m.odds[0] !== '-' && m.odds[1] !== '-' && m.odds[2] !== '-');

  // İddaa Oran Modu Açma/Kapatma
  const toggleIddaaOddsMode = () => {
    if (!hasIddaaOdds) return;
    const nextVal = !useIddaaOddsMode;
    setUseIddaaOddsMode(nextVal);
    setResults(null);
    if (nextVal) {
      // 1. İddaa bülten oranlarına göre 25.000 TL (2.500 Kolon) tavanlı 3 Kademeli Akıllı Toto Kuponu oluştur
      if (matches.length > 0) {
        const smartSelections = generateSmartIddaaSelections(matches, 2500);
        setSelections(smartSelections);
      }

      // 2. İddaa moduna geçildiğinde alt filtreleri serbest (kapalı) bırak, kullanıcı dilerse tek tek açabilir
      setHomeWinsActive(false);
      setDrawsActive(false);
      setAwayWinsActive(false);
      setProbabilityActive(false);
      setConsecutiveActive(false);
      setFavoriteActive(false);
      setSuccessMsg("İddaa Oran Modu Aktif: 25.000 ₺ tavanlı akıllı Toto kuponu otomatik oluşturuldu.");
    } else {
      setHomeWinsActive(true);
      setDrawsActive(true);
      setAwayWinsActive(true);
      setProbabilityActive(true);
      setSuccessMsg("Spor Toto Modu Aktif: Kolonlar Spor Toto oynanma yüzdelerine göre hesaplanacak.");
    }
  };

  // En yüksek olasılıklı bankoları seç
  const handleSelectBankos = () => {
    if (matches.length === 0) return;
    const defaultSelections = matches.map((m) => {
      const probs = useIddaaOddsMode ? calculateOddsProbabilities(m.odds, m.probabilities) : m.probabilities;
      const maxIdx = probs.indexOf(Math.max(...probs));
      const outcomes = ['1', 'X', '2'];
      return [outcomes[maxIdx]];
    });
    setSelections(defaultSelections);
    setResults(null);
  };

  // Nesine / İddaa oranlarına göre ağırlıklı rastgele kupon doldur
  const handleRandomFill = (mode: 1 | 2) => {
    if (matches.length === 0) return;
    const newSels = matches.map((m) => {
      const probs = useIddaaOddsMode ? calculateOddsProbabilities(m.odds, m.probabilities) : m.probabilities;
      
      const getRandomOutcome = () => {
        const total = probs[0] + probs[1] + probs[2];
        const r = Math.random() * total;
        if (r < probs[0]) return '1';
        if (r < probs[0] + probs[1]) return 'X';
        return '2';
      };

      if (mode === 1) {
        return [getRandomOutcome()];
      } else {
        const first = getRandomOutcome();
        // %40 ihtimalle çifte şans (2 tahmin) seç
        if (Math.random() < 0.40) {
          let second = getRandomOutcome();
          while (second === first) {
            second = getRandomOutcome();
          }
          return [first, second].sort();
        }
        return [first];
      }
    });
    setSelections(newSels);
    setResults(null);
    setError(null);
    setSuccessMsg(null);
  };

  // Yapıştırılan bülteni içe aktar
  const handleImportPasted = () => {
    if (!pasteText.trim()) return;
    const parsed = parsePastedBulletin(pasteText);
    if (parsed.length > 0) {
      setMatches(parsed);
      // Varsayılan olarak her maça en yüksek olasılıklı tahmini ata
      const defaultSelections = parsed.map((m) => {
        const probs = useIddaaOddsMode ? calculateOddsProbabilities(m.odds, m.probabilities) : m.probabilities;
        const maxIdx = probs.indexOf(Math.max(...probs));
        const outcomes = ['1', 'X', '2'];
        return [outcomes[maxIdx]];
      });
      setSelections(defaultSelections);
      setResults(null);
      setShowPasteModal(false);
      setPasteText('');
    }
  };

  // Filtreleri otomatik ayarla (Nesine/Bülten olasılıklarına göre)
  const handleAutoAdjustFilters = () => {
    if (!matches || matches.length === 0) {
      setError("Filtreleri otomatik ayarlamak için önce bülten verisi bulunmalıdır.");
      return;
    }
    
    let expectedHome = 0;
    let expectedDraw = 0;
    let expectedAway = 0;
    let expectedProbSum = 0;
    
    matches.forEach(m => {
      const probs = useIddaaOddsMode ? calculateOddsProbabilities(m.odds) : m.probabilities;
      const pHome = probs[0] || 33;
      const pDraw = probs[1] || 33;
      const pAway = probs[2] || 34;
      
      expectedHome += pHome / 100;
      expectedDraw += pDraw / 100;
      expectedAway += pAway / 100;
      expectedProbSum += Math.max(pHome, pDraw, pAway);
    });
    
    const homeMin = Math.max(0, Math.floor(expectedHome - 2));
    const homeMax = Math.min(15, Math.ceil(expectedHome + 2));
    
    const drawMin = Math.max(0, Math.floor(expectedDraw - 1.5));
    const drawMax = Math.min(15, Math.ceil(expectedDraw + 1.5));
    
    const awayMin = Math.max(0, Math.floor(expectedAway - 2));
    const awayMax = Math.min(15, Math.ceil(expectedAway + 2));
    
    const probMin = Math.round(expectedProbSum * 0.85);
    const probMax = Math.round(expectedProbSum * 1.10);
    
    setFilters({
      homeWins: [homeMin, homeMax],
      draws: [drawMin, drawMax],
      awayWins: [awayMin, awayMax],
      maxConsecutiveHome: 4,
      maxConsecutiveDraw: 3,
      maxConsecutiveAway: 4,
      probabilitySum: [probMin, probMax]
    });
    
    setHomeWinsActive(true);
    setDrawsActive(true);
    setAwayWinsActive(true);
    setProbabilityActive(true);
    setConsecutiveActive(false);
    setFavoriteActive(false);
    
    setResults(null);
    setSuccessMsg(useIddaaOddsMode ? "Filtreler İddaa oran olasılıklarına göre otomatik ayarlandı!" : "Filtreler bülten oynanma yüzdelerine göre otomatik olarak ayarlandı!");
    setError(null);
  };

  // Tüm filtreleri tek tıkla kapat
  const handleDisableAllFilters = () => {
    setHomeWinsActive(false);
    setDrawsActive(false);
    setAwayWinsActive(false);
    setProbabilityActive(false);
    setConsecutiveActive(false);
    setFavoriteActive(false);
    setResults(null);
    setSuccessMsg("Tüm filtreler kapatıldı (engelsiz formül modu).");
    setError(null);
  };

  // Formül Hesapla API çağrısı
  const handleCalculate = async () => {
    setError(null);
    setSuccessMsg(null);
    setSaveSuccess(false); // Yeni formül uygulandığında kayıt butonunu tekrar aktif et
    
    // Her maç için en az bir seçim yapıldı mı kontrolü
    const missing = selections.findIndex(x => x.length === 0);
    if (missing !== -1) {
      setError(`Lütfen ${missing + 1}. maç için en az bir tahmin seçeneği işaretleyin.`);
      return;
    }

    setCalculating(true);

    try {
      const matchPredictions: MatchPrediction[] = selections.map((sel, idx) => ({
        matchIndex: idx,
        selected: sel,
        probabilities: useIddaaOddsMode
          ? calculateOddsProbabilities(matches[idx]?.odds)
          : (matches[idx]?.probabilities || [33, 33, 34])
      }));

      const compiledFilters = {
        homeWins: homeWinsActive ? filters.homeWins : [0, 15],
        draws: drawsActive ? filters.draws : [0, 15],
        awayWins: awayWinsActive ? filters.awayWins : [0, 15],
        maxConsecutiveHome: consecutiveActive ? filters.maxConsecutiveHome : 15,
        maxConsecutiveDraw: consecutiveActive ? filters.maxConsecutiveDraw : 15,
        maxConsecutiveAway: consecutiveActive ? filters.maxConsecutiveAway : 15,
        probabilitySum: probabilityActive ? filters.probabilitySum : [0, 1500],
        favoriteLosses: favoriteActive ? filters.favoriteLosses : undefined
      };

      const res = await fetch('/api/generate-formula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          predictions: matchPredictions,
          filters: compiledFilters,
          guarantee,
          userId: user?.id || null,
          isMockPremium: isPremium
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'PREMIUM_REQUIRED') {
          setError(data.message);
          // Premium modalı tetiklenebilir
        } else {
          setError(data.error || 'Formül hesaplanırken beklenmedik bir hata oluştu.');
        }
        return;
      }

      if (data.success) {
        if (data.columnCount === 0) {
          setError('Seçtiğiniz filtre kurallarına uyan hiçbir kombinasyon bulunamadı. Lütfen filtrelerinizi gevşetin (Örn: Beraberlik sayısını veya Ev sahibi limitini genişletin).');
        } else {
          setResults({
            columns: data.columns,
            totalBeforeFilters: data.totalBeforeFilters,
            totalAfterFilters: data.totalAfterFilters,
            probabilities: data.probabilities
          });
          setSuccessMsg(`Formül başarıyla uygulandı! ${data.columnCount} kupon üretildi.`);
        }
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
    } finally {
      setCalculating(false);
    }
  };

  // TXT Dosyasını İndir
  const handleDownloadTxt = () => {
    if (!results || results.columns.length === 0) return;

    // Her satırda 15 karakter (örn: 1X211X121111X12) olacak şekilde TXT oluşturur
    const content = results.columns.map(col => col.join('')).join('\r\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `st_extra_kupon_${results.columns.length}_kolon.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Kodu Kopyala
  const handleCopyCode = async () => {
    if (!results || results.columns.length === 0) return;
    try {
      const content = results.columns.map(col => col.join('')).join('\n');
      await navigator.clipboard.writeText(content);
      setSuccessMsg('Kupon kodları kopyalandı! Şimdi bahis sitesine gidip yapıştırabilirsiniz.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError('Kopyalama başarısız oldu. Lütfen TXT indirme seçeneğini kullanın.');
    }
  };

  // Kuponu Veritabanına / Profile Kaydet
  const handleSaveCoupon = async () => {
    if (!user) {
      setError('Kupon kaydetmek için lütfen önce giriş yapın.');
      return;
    }
    if (!results || results.columns.length === 0) {
      setError('Kaydedilecek geçerli bir kupon bulunamadı. Lütfen önce formülü uygulayın.');
      return;
    }
    
    setSavingCoupon(true);
    setError(null);
    setSuccessMsg(null);
    setSaveSuccess(false);

    try {
      const roundKey = selectedRoundId || currentWeekName || 'Aktif';
      const { error: saveErr } = await dbService.saveCoupon(
        user.id,
        user.email,
        roundKey,
        selections,
        results.columns.length,
        guarantee,
        results.columns,
        matches
      );

      if (saveErr) {
        setError('Kupon kaydedilirken hata oluştu: ' + saveErr.message);
      } else {
        setSaveSuccess(true);
        setSuccessMsg('Kupon başarıyla profilinize kaydedildi!');
        // Liderlik tablosunu anlık güncellemek için tetikleyelim
        const board = await dbService.getLeaderboard(roundKey, matches);
        setLeaderboard(board);
      }
    } catch (err: any) {
      setError('Kupon kaydedilemedi: ' + err.message);
    } finally {
      setSavingCoupon(false);
    }
  };

  const baseColumns = getBaseColumnNumber();
  const normalCost = baseColumns * KOLON_BEDELI;

  const isDark = theme === 'dark';
  const cardClass = isDark
    ? 'bg-[#1e293b]/50 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden'
    : 'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden';
  const cardNoOverflowClass = isDark
    ? 'bg-[#1e293b]/50 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl'
    : 'bg-white border border-slate-200 rounded-2xl shadow-sm';
  const textMutedClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBgClass = isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-b from-[#0f172a] via-[#15203b] to-[#0c1222] text-white'
        : 'bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800'
    }`}>
      {/* Decorative Radial Glowing Blobs (only in dark mode for premium look) */}
      {isDark && (
        <>
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.04] rounded-full filter blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/3 -left-20 w-[400px] h-[400px] bg-cyan-500/[0.04] rounded-full filter blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 -right-20 w-[350px] h-[350px] bg-indigo-600/[0.03] rounded-full filter blur-[110px] pointer-events-none" />
        </>
      )}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero Section */}
      <div className={`mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center border-b pb-6 gap-4 ${
        isDark ? 'border-slate-800/40' : 'border-slate-200'
      }`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight flex items-center gap-2 ${
            isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400' : 'text-slate-900'
          }`}>
            Akıllı Spor Toto Formülü <Sparkles className="h-6 w-6 text-sky-400 animate-pulse" />
          </h1>
          <p className={`${textMutedClass} mt-1 text-sm`}>
            Seçimlerinizi yapın, filtreleri uygulayın ve 14/13 garanti optimizasyonu ile kupon bedelini düşürün.
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition duration-150 cursor-pointer shadow-sm flex items-center justify-center ${
              isDark
                ? 'bg-[#1e293b]/70 border-slate-700/60 text-yellow-400 hover:text-yellow-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title={isDark ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 ${
            isDark ? 'bg-[#1e293b]/70 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hafta:</span>
            <select
              value={selectedRoundId}
              onChange={(e) => handleRoundChange(e.target.value)}
              className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}
            >
               <option value="" className="bg-[#0f172a] text-white font-bold">
                 Güncel Bülten ({currentWeekName ? currentWeekName.replace(/^\d{4}\/\d{4}\s+/, '') : 'Aktif'})
               </option>
               {rounds
                 .filter((r) => {
                   const cleanCurrent = currentWeekName.replace(/^\d{4}\/\d{4}\s+/, '').trim().toLowerCase();
                   const cleanRoundName = r.name.trim().toLowerCase();
                   return cleanCurrent !== cleanRoundName;
                 })
                 .map((r) => (
                   <option key={r.id} value={r.id} className="bg-[#0f172a] text-white font-semibold">
                     {r.name}
                   </option>
                 ))}
            </select>
          </div>
          {activeTab === 'create' && !selectedRoundId && (
            <>
              <button
                onClick={() => setShowPasteModal(true)}
                className="px-3.5 py-1.5 border border-sky-500/20 hover:border-sky-500/40 bg-sky-500/10 text-sky-400 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Bülten Yapıştır
              </button>
              <button
                onClick={handleSelectBankos}
                className="px-3.5 py-1.5 border border-slate-700/40 hover:border-slate-705 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Bankoları İşaretle
              </button>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-1.5 border border-slate-700/40 hover:border-slate-705 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Temizle
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800/80 mb-8 max-w-md p-1 bg-slate-900/60 rounded-xl select-none mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'news'
              ? 'bg-sky-500 text-black shadow-[0_0_12px_rgba(56,189,248,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Bülten & Haberler
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'create'
              ? 'bg-sky-500 text-black shadow-[0_0_12px_rgba(56,189,248,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          Kupon Oluştur (Formül)
        </button>
      </div>

      {activeTab === 'news' ? (
        <div className="space-y-8 animate-fadeIn w-full">
          {/* NEWS BANNER CAROUSEL */}
          <div className={`${
            isDark 
              ? 'bg-[#1e293b]/50 border-slate-700/50' 
              : 'bg-white border-slate-200 shadow-sm text-slate-800'
          } border rounded-2xl p-6 shadow-2xl space-y-4 overflow-hidden relative min-h-[300px]`}>
            {isDark && <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-cyan-500/10 pointer-events-none" />}
            
            <div className={`flex items-center justify-between border-b pb-3 relative z-10 ${
              isDark ? 'border-slate-800/60' : 'border-slate-100'
            }`}>
              <span className="text-xs font-bold text-sky-500 tracking-widest uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                Haberler & Duyurular
              </span>
              
              {news.length > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentNewsIndex(prev => prev === 0 ? news.length - 1 : prev - 1)} className="p-1 rounded-md bg-neutral-800/50 hover:bg-neutral-700 transition"><ChevronLeft className="h-4 w-4 text-white" /></button>
                  <button onClick={() => setCurrentNewsIndex(prev => (prev + 1) % news.length)} className="p-1 rounded-md bg-neutral-800/50 hover:bg-neutral-700 transition"><ChevronRight className="h-4 w-4 text-white" /></button>
                </div>
              )}
            </div>
            
            {news.length > 0 && (
              <div key={news[currentNewsIndex].id} className="grid md:grid-cols-5 gap-6 items-center animate-fadeIn relative z-10">
                <div className="md:col-span-3 space-y-4">
                  <h2 className={`text-2xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {news[currentNewsIndex].title}
                  </h2>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>
                    {news[currentNewsIndex].description}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => {
                        if (news[currentNewsIndex].button_action === 'modal:video') {
                          setShowVideoModal(true);
                        } else if (news[currentNewsIndex].button_action === 'tab:create') {
                          setActiveTab('create');
                        } else if (news[currentNewsIndex].button_action.startsWith('link:')) {
                          window.open(news[currentNewsIndex].button_action.split('link:')[1], '_blank');
                        }
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-black text-xs font-black rounded-xl transition cursor-pointer shadow-lg shadow-sky-500/20"
                    >
                      <Play className="h-4 w-4 fill-black" />
                      {news[currentNewsIndex].button_text}
                    </button>
                    <button
                      onClick={() => setActiveTab('create')}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl transition cursor-pointer shadow-lg ${
                        isDark 
                          ? 'bg-slate-850 hover:bg-slate-800 text-white shadow-slate-950/40 border border-slate-700/50' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                      }`}
                    >
                      Hemen Kupon Oluştur
                      <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                    </button>
                  </div>
                </div>
                
                <div 
                  onClick={() => {
                    if (news[currentNewsIndex].button_action === 'modal:video') {
                      setShowVideoModal(true);
                    }
                  }}
                  className={`md:col-span-2 relative h-48 rounded-xl overflow-hidden border flex items-center justify-center group ${news[currentNewsIndex].button_action === 'modal:video' ? 'cursor-pointer' : ''} ${
                    isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-100'
                  }`}
                >
                  {news[currentNewsIndex].bg_image_url && (
                    <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url('${news[currentNewsIndex].bg_image_url}')` }} />
                  )}
                  <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent' : 'bg-gradient-to-t from-slate-100 via-slate-100/40 to-transparent'}`} />
                  <div className="relative z-10 text-center px-4 space-y-2">
                    {news[currentNewsIndex].button_action === 'modal:video' && (
                      <span className="p-3 bg-sky-500 text-black rounded-full inline-block group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Play className="h-6 w-6 fill-black ml-0.5" />
                      </span>
                    )}
                    <span className={`block text-xs font-bold tracking-wide drop-shadow-md ${isDark ? 'text-white' : 'text-slate-900'}`}>{news[currentNewsIndex].title}</span>
                    <span className="block text-[10px] text-sky-550 font-bold uppercase tracking-wider">{news[currentNewsIndex].badge_text}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Dots */}
            {news.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                {news.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentNewsIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentNewsIndex ? 'bg-sky-500 w-4' : 'bg-neutral-600 hover:bg-neutral-500'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past Payouts Quick Cards for News View */}
          {selectedRoundId && pastPayouts && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <span className="text-[10px] uppercase font-bold text-sky-500 tracking-wider">15 Bilen İkramiye</span>
                <span className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {pastPayouts.fifteenWinPrize ? `${pastPayouts.fifteenWinPrize.toLocaleString('tr-TR')} ₺` : '0 ₺'}
                </span>
                <span className={`text-[10px] mt-0.5 ${textMutedClass}`}>
                  {pastPayouts.fifteenWinCount ? `${pastPayouts.fifteenWinCount.toLocaleString('tr-TR')} kişi` : '0 kişi'}
                </span>
              </div>
              
              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">14 Bilen İkramiye</span>
                <span className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {pastPayouts.fourteenWinPrize ? `${pastPayouts.fourteenWinPrize.toLocaleString('tr-TR')} ₺` : '0 ₺'}
                </span>
                <span className={`text-[10px] mt-0.5 ${textMutedClass}`}>
                  {pastPayouts.fourteenWinCount ? `${pastPayouts.fourteenWinCount.toLocaleString('tr-TR')} kişi` : '0 kişi'}
                </span>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">13 Bilen İkramiye</span>
                <span className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {pastPayouts.thirteenWinPrize ? `${pastPayouts.thirteenWinPrize.toLocaleString('tr-TR')} ₺` : '0 ₺'}
                </span>
                <span className={`text-[10px] mt-0.5 ${textMutedClass}`}>
                  {pastPayouts.thirteenWinCount ? `${pastPayouts.thirteenWinCount.toLocaleString('tr-TR')} kişi` : '0 kişi'}
                </span>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">12 Bilen İkramiye</span>
                <span className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {pastPayouts.twelveWinPrize ? `${pastPayouts.twelveWinPrize.toLocaleString('tr-TR')} ₺` : '0 ₺'}
                </span>
                <span className={`text-[10px] mt-0.5 ${textMutedClass}`}>
                  {pastPayouts.twelveWinCount ? `${pastPayouts.twelveWinCount.toLocaleString('tr-TR')} kişi` : '0 kişi'}
                </span>
              </div>
            </div>
          )}
          
          {/* Top 10 Leaderboard */}
          {selectedRoundId && leaderboard && leaderboard.length > 0 && (
            <div className={`border rounded-2xl p-6 shadow-2xl space-y-4 ${
              isDark ? 'bg-[#1e293b]/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${
                isDark ? 'border-slate-800/60' : 'border-slate-100'
              }`}>
                <span className="text-sm font-black text-sky-500 uppercase flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  EN İYİ KUPONLAR - TOP 10
                </span>
                <span className={`text-[10px] ${textMutedClass}`}>
                  {selectedRoundId ? 'Bu Haftanın En İyileri' : 'Güncel Haftanın En İyileri'}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b font-bold tracking-wider uppercase text-[10px] ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}>
                      <th className="py-2.5 px-2 w-8 text-center">#</th>
                      <th className="py-2.5 px-4">Üye</th>
                      <th className="py-2.5 px-4 text-center">Doğru Tahmin</th>
                      <th className="py-2.5 px-4 text-center">Kolon Sayısı</th>
                      <th className="py-2.5 px-4 text-center">Sistem</th>
                      <th className="py-2.5 px-4 text-center">İkramiye/Başarı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {leaderboard.map((user, idx) => (
                      <tr key={user.id} className={`transition-colors hover:bg-slate-800/20 ${
                        idx < 3 && isDark ? 'bg-sky-900/10' : ''
                      } ${idx < 3 && !isDark ? 'bg-sky-50' : ''}`}>
                        <td className="py-3 px-2 text-center font-bold">
                          {idx === 0 ? <span className="text-yellow-500">1</span> : 
                           idx === 1 ? <span className="text-slate-300">2</span> : 
                           idx === 2 ? <span className="text-amber-600">3</span> : 
                           <span className={textMutedClass}>{idx + 1}</span>}
                        </td>
                        <td className={`py-3 px-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {user.maskedName || 'Gizli Üye'}
                          {idx === 0 && <Award className="inline h-3.5 w-3.5 text-yellow-500 ml-1.5 -mt-0.5" />}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                            user.correctCount >= 14 ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') : 
                            user.correctCount === 13 ? (isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700') :
                            (isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-200 text-slate-600')
                          }`}>
                            {user.correctCount} / 15
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-center font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {user.columns_count.toLocaleString('tr-TR')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            {user.guarantee_level}G
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {user.payoutTierWon ? (
                            <span className="text-yellow-500 flex items-center justify-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              {user.payoutTierWon} Bilen
                            </span>
                          ) : (
                            <span className={textMutedClass}>Sonuç Bekleniyor</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BULLETIN WATCH VIEW */}
          <div className={cardClass}>
            <div className={`border-b px-4 py-3.5 flex justify-between items-center flex-wrap gap-2.5 ${
              isDark ? 'border-slate-800/60 bg-[#1e293b]/40' : 'border-slate-200 bg-slate-50'
            }`}>
              <div>
                <span className={`text-sm font-extrabold tracking-wide ${isDark ? 'text-white' : 'text-slate-805'}`}>Haftalık Spor Toto Maç Bülteni</span>
                <p className={`text-[10px] mt-0.5 ${textMutedClass}`}>Maç listesi ve güncel oynanma oranları.</p>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <button
                  onClick={handleFetchNesineRates}
                  className="px-3 py-1.5 bg-sky-500 text-black hover:bg-sky-400 text-xs font-extrabold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                >
                  <Activity className="h-3.5 w-3.5" />
                  Canlı Oranları Al
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-3.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 hover:text-sky-400 text-xs font-bold rounded-lg border border-sky-500/25 transition cursor-pointer"
                >
                  Kupon Filtreleme Sihirbazına Git ➔
                </button>
              </div>
            </div>
            
            {loadingMatches ? (
              <div className="p-12 text-center text-slate-450 animate-pulse">Bülten yükleniyor...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'border-slate-800 bg-[#1e293b]/20 text-slate-400' : 'border-slate-200 bg-slate-100/70 text-slate-600'
                    }`}>
                      <th className="py-3 pl-4 text-left w-12">No</th>
                      <th className="py-3 text-left px-4">Ev Sahibi</th>
                      <th className="py-3 text-center w-20">Skor</th>
                      <th className="py-3 text-left px-4">Deplasman</th>
                      {selectedRoundId && <th className="py-3 text-center w-24">Sonuç</th>}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/30' : 'divide-slate-200/75'}`}>
                    {matches.map((match, idx) => (
                      <tr key={match.matchIndex} className={`transition text-sm ${isDark ? 'hover:bg-slate-800/10' : 'hover:bg-slate-50'}`}>
                        <td className="py-3 pl-4 text-left font-bold text-slate-500">{match.matchIndex + 1}</td>
                        <td className={`py-3 text-left px-4 font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{match.homeTeam}</td>
                        <td className="py-3 text-center">
                          {(match as any).score ? (
                            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-550 border border-sky-500/25 rounded text-xs font-extrabold">{(match as any).score}</span>
                          ) : (
                            <span className={textMutedClass}>-</span>
                          )}
                        </td>
                        <td className={`py-3 text-left px-4 font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{match.awayTeam}</td>
                        {selectedRoundId && (
                          <td className="py-3 text-center">
                            {(match as any).outcome ? (
                              <span className="px-2.5 py-1 bg-blue-500 text-white font-extrabold rounded text-xs">{(match as any).outcome}</span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Matches Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#1e293b]/50 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] animate-fadeIn">
              
              {/* Table Utility Toolbar */}
              {!loadingMatches && !selectedRoundId && (
                <div className="flex items-center justify-between border-b border-slate-700/40 bg-[#1e293b]/40 px-4 py-3 flex-wrap gap-2.5">
                  <span className="text-xs font-bold text-slate-400 tracking-wide">Tahmin Yardımcısı</span>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleFetchNesineRates}
                      className="px-2.5 py-1.5 text-[10px] font-extrabold bg-sky-500 text-black hover:bg-sky-400 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                    >
                      <Activity className="h-3 w-3" />
                      Canlı Oranları Güncelle
                    </button>
                    <button
                      onClick={handleSelectBankos}
                      className="px-2.5 py-1.5 text-[10px] font-bold bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg border border-slate-700/45 hover:border-sky-500/50 hover:text-sky-400 transition cursor-pointer shadow-sm"
                    >
                      Bankoları Doldur
                    </button>
                    <button
                      onClick={() => handleRandomFill(1)}
                      className="px-2.5 py-1.5 text-[10px] font-bold bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg border border-slate-700/45 hover:border-sky-500/50 hover:text-sky-400 transition cursor-pointer shadow-sm"
                    >
                      Rastgele Oyna (Tekli)
                    </button>
                    <button
                      onClick={() => handleRandomFill(2)}
                      className="px-2.5 py-1.5 text-[10px] font-bold bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg border border-slate-700/45 hover:border-sky-500/50 hover:text-sky-400 transition cursor-pointer shadow-sm"
                    >
                      Rastgele Oyna (Çiftli)
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="px-2.5 py-1.5 text-[10px] font-bold border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg transition cursor-pointer"
                    >
                      Seçimleri Temizle
                    </button>
                  </div>
                </div>
              )}

              {loadingMatches ? (
                <div className="p-12 text-center text-slate-400">Bülten yükleniyor...</div>
              ) : (
                <div className="overflow-x-auto font-sans">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'border-slate-800 bg-[#1e293b]/20 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-655'
                      }`}>
                        <th className="py-2.5 pl-4 text-center w-12">NU.</th>
                        <th className="py-2.5 text-center">TERCİH</th>
                        {selectedRoundId && <th className="py-2.5 text-center w-20">SONUÇ</th>}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800/30' : 'divide-slate-200/75'}`}>
                      {matches.map((match, idx) => {
                        const sel = selections[idx] || [];
                        const matchProbs = useIddaaOddsMode ? calculateOddsProbabilities(match.odds, match.probabilities) : match.probabilities;
                        
                        return (
                          <tr key={match.matchIndex} className={`transition text-sm ${
                            isDark ? 'hover:bg-slate-800/10' : 'hover:bg-slate-50'
                          }`}>
                            {/* Nu */}
                            <td className={`py-1 text-center font-extrabold w-12 border-r ${
                              isDark ? 'text-slate-500 bg-slate-900/40 border-slate-850' : 'text-slate-500 bg-slate-100/50 border-slate-200'
                            }`}>
                              {match.matchIndex + 1}
                            </td>
                            
                            {/* Selection Row: [ Home Team ] [ X ] [ Away Team ] */}
                            <td className="py-1.5 px-3">
                              <div className="flex items-center gap-1.5 w-full max-w-2xl mx-auto">
                                
                                {/* Home Team Button (1) */}
                                <button
                                  onClick={() => toggleSelection(idx, '1')}
                                  disabled={!!selectedRoundId}
                                  className={`flex-1 flex flex-col items-center justify-center py-1 px-2.5 rounded-lg border text-xs font-bold transition duration-150 ${
                                    selectedRoundId ? 'cursor-default' : 'cursor-pointer'
                                  } ${
                                    sel.includes('1')
                                      ? (selectedRoundId 
                                          ? (isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-200 text-slate-800 border-slate-300')
                                          : 'bg-gradient-to-r from-sky-400 to-blue-500 text-black border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]')
                                      : (selectedRoundId
                                          ? (isDark ? 'bg-slate-900/30 text-slate-600 border-slate-900/50' : 'bg-slate-50/50 text-slate-400 border-slate-100')
                                          : (isDark ? 'bg-slate-900/65 text-slate-200 border-slate-700/45 hover:border-sky-500/50 hover:bg-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-500/50 hover:bg-slate-100'))
                                  }`}
                                >
                                  <span className="truncate max-w-[135px]">{match.homeTeam}</span>
                                  <span className={`text-[10px] ${useIddaaOddsMode ? 'text-amber-400 font-bold' : 'font-normal opacity-70'}`}>
                                    % {matchProbs[0]} {match.odds && match.odds[0] ? `(${match.odds[0]})` : ''}
                                  </span>
                                </button>

                                {/* Draw Button (X) */}
                                <button
                                  onClick={() => toggleSelection(idx, 'X')}
                                  disabled={!!selectedRoundId}
                                  className={`w-20 flex flex-col items-center justify-center py-1 rounded-lg border text-xs font-black transition duration-150 ${
                                    selectedRoundId ? 'cursor-default' : 'cursor-pointer'
                                  } ${
                                    sel.includes('X')
                                      ? (selectedRoundId 
                                          ? (isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-200 text-slate-800 border-slate-300')
                                          : 'bg-gradient-to-r from-sky-400 to-blue-500 text-black border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]')
                                      : (selectedRoundId
                                          ? (isDark ? 'bg-slate-900/30 text-slate-600 border-slate-900/50' : 'bg-slate-50/50 text-slate-400 border-slate-100')
                                          : (isDark ? 'bg-slate-900/65 text-slate-200 border-slate-700/45 hover:border-sky-500/50 hover:bg-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-500/50 hover:bg-slate-100'))
                                  }`}
                                >
                                  <span>X</span>
                                  <span className={`text-[10px] ${useIddaaOddsMode ? 'text-amber-400 font-bold' : 'font-normal opacity-70'}`}>
                                    % {matchProbs[1]} {match.odds && match.odds[1] ? `(${match.odds[1]})` : ''}
                                  </span>
                                </button>

                                {/* Away Team Button (2) */}
                                <button
                                  onClick={() => toggleSelection(idx, '2')}
                                  disabled={!!selectedRoundId}
                                  className={`flex-1 flex flex-col items-center justify-center py-1 px-2.5 rounded-lg border text-xs font-bold transition duration-150 ${
                                    selectedRoundId ? 'cursor-default' : 'cursor-pointer'
                                  } ${
                                    sel.includes('2')
                                      ? (selectedRoundId 
                                          ? (isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-200 text-slate-800 border-slate-300')
                                          : 'bg-gradient-to-r from-sky-400 to-blue-500 text-black border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]')
                                      : (selectedRoundId
                                          ? (isDark ? 'bg-slate-900/30 text-slate-600 border-slate-900/50' : 'bg-slate-50/50 text-slate-400 border-slate-100')
                                          : (isDark ? 'bg-slate-900/65 text-slate-200 border-slate-700/45 hover:border-sky-500/50 hover:bg-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-500/50 hover:bg-slate-100'))
                                  }`}
                                >
                                  <span className="truncate max-w-[135px]">{match.awayTeam}</span>
                                  <span className={`text-[10px] ${useIddaaOddsMode ? 'text-amber-400 font-bold' : 'font-normal opacity-70'}`}>
                                    % {matchProbs[2]} {match.odds && match.odds[2] ? `(${match.odds[2]})` : ''}
                                  </span>
                                </button>

                              </div>
                            </td>
                            {selectedRoundId && (
                              <td className={`py-1.5 px-3 text-center border-l w-20 font-black text-sm ${
                                isDark ? 'border-slate-800/60 text-sky-400 bg-slate-900/10' : 'border-slate-200 text-slate-800 bg-slate-100/30'
                              }`}>
                                {(match as any).outcome || '-'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        {/* Right Column: Settings & Optimizations */}
        <div className="space-y-6">
          
          {/* Cost Analyzer Indicator Card */}
          <div className={`backdrop-blur-md border rounded-2xl p-6 relative overflow-hidden ${isDark ? 'bg-[#1e293b]/50 border-slate-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h2 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <TrendingUp className="h-5 w-5 text-sky-400" />
              Maliyet Analizörü
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Ham Kupon (Seçimler):</span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {baseColumns.toLocaleString('tr-TR')} Kolon ({normalCost.toLocaleString('tr-TR')} ₺)
                </span>
              </div>
              
              {results && results.totalAfterFilters !== undefined && (
                <div className={`flex justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Filtrelerden Geçen:</span>
                  <span className="font-semibold text-yellow-500">
                    {results.totalAfterFilters.toLocaleString('tr-TR')} Kolon ({(results.totalAfterFilters * KOLON_BEDELI).toLocaleString('tr-TR')} ₺)
                  </span>
                </div>
              )}

              {results && (
                <div className={`flex justify-between text-sm border-t pt-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
                  <span className="text-sky-400 font-semibold">{guarantee}G Formüllü Kupon:</span>
                  <span className="font-bold text-sky-400">
                    {results.columns.length.toLocaleString('tr-TR')} Kolon ({(results.columns.length * KOLON_BEDELI).toLocaleString('tr-TR')} ₺)
                  </span>
                </div>
              )}

              {results && (
                <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl text-center">
                  <span className="text-xs text-neutral-400 block">Elde Ettiğiniz Tasarruf</span>
                  <span className="text-xl font-extrabold text-sky-400 block mt-0.5">
                    %{(100 - (results.columns.length / baseColumns) * 100).toFixed(1)} 
                    <span className="text-xs font-normal text-neutral-400 ml-1">
                      (₺{(normalCost - results.columns.length * KOLON_BEDELI).toLocaleString('tr-TR')} tasarruf)
                    </span>
                  </span>
                </div>
              )}

              {results && results.probabilities && (
                <div className={`mt-4 pt-4 border-t space-y-2 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Başarı İhtimalleri</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="p-1.5 rounded bg-green-500/10 border border-green-500/20 text-center">
                      <span className="block text-[9px] text-green-500 font-semibold">15 Bilme</span>
                      <span className="block text-xs font-black text-green-400">% {results.probabilities[15].toFixed(2)}</span>
                    </div>
                    <div className="p-1.5 rounded bg-sky-500/10 border border-sky-500/20 text-center">
                      <span className="block text-[9px] text-sky-500 font-semibold">14 Bilme</span>
                      <span className="block text-xs font-black text-sky-400">% {results.probabilities[14].toFixed(2)}</span>
                    </div>
                    <div className="p-1.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-center">
                      <span className="block text-[9px] text-yellow-500 font-semibold">13 Bilme</span>
                      <span className="block text-xs font-black text-yellow-400">% {results.probabilities[13].toFixed(2)}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-500/10 border border-slate-500/20 text-center">
                      <span className="block text-[9px] text-slate-400 font-semibold">12 Bilme</span>
                      <span className="block text-xs font-black text-slate-300">% {results.probabilities[12].toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Past Payouts Results Card */}
          {selectedRoundId && pastPayouts && (
            <div className={`backdrop-blur-md border rounded-2xl p-6 space-y-4 shadow-yellow-500/[0.015] ${isDark ? 'bg-[#1e293b]/50 border-slate-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Award className="h-5 w-5 text-yellow-500 animate-pulse" />
                Haftalık İkramiye Sonuçları
              </h2>
              <div className={`divide-y text-xs ${isDark ? 'divide-neutral-800' : 'divide-slate-200'}`}>
                <div className="py-2.5 flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>15 Bilen İkramiye:</span>
                  <span className="font-bold text-yellow-500">
                    {pastPayouts.fifteenWinPrize ? `${pastPayouts.fifteenWinPrize.toLocaleString('tr-TR')} ₺` : '0 ₺'} 
                    <span className="text-[10px] text-neutral-500 font-normal ml-1">({pastPayouts.fifteenWinCount} kişi)</span>
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>14 Bilen İkramiye:</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {pastPayouts.fourteenWinPrize ? `${pastPayouts.fourteenWinPrize.toLocaleString('tr-TR')} ₺` : '0 ₺'} 
                    <span className="text-[10px] text-neutral-500 font-normal ml-1">({pastPayouts.fourteenWinCount} kişi)</span>
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>13 Bilen İkramiye:</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {pastPayouts.thirteenWinPrize ? `${pastPayouts.thirteenWinPrize.toLocaleString('tr-TR')} ₺` : '0 ₺'} 
                    <span className="text-[10px] text-neutral-500 font-normal ml-1">({pastPayouts.thirteenWinCount} kişi)</span>
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>12 Bilen İkramiye:</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {pastPayouts.twelveWinPrize ? `${pastPayouts.twelveWinPrize.toLocaleString('tr-TR')} ₺` : '0 ₺'} 
                    <span className="text-[10px] text-neutral-500 font-normal ml-1">({pastPayouts.twelveWinCount} kişi)</span>
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-neutral-500 text-center border-t border-neutral-800 pt-3">
                Kapanış Tarihi: {new Date(pastPayouts.gameRoundCloseDate).toLocaleString('tr-TR')}
              </div>
            </div>
          )}

          {/* Form Configuration Card */}
          <div className={`backdrop-blur-md border rounded-2xl p-6 space-y-6 ${isDark ? 'bg-[#1e293b]/50 border-slate-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-sm'}`}>
            
            {/* 1. Guarantee Selection */}
            <div>
              <label className={`block text-sm font-bold mb-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Garanti Seviyesi
              </label>
              <div className={`grid grid-cols-4 gap-1.5 p-1 rounded-xl border ${isDark ? 'bg-[#070b14] border-slate-800/60' : 'bg-slate-100 border-slate-300'}`}>
                {[15, 14, 13, 12].map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGuarantee(g as any);
                      setResults(null);
                    }}
                    className={`py-2 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                      guarantee === g
                        ? 'bg-sky-500 text-black shadow-[0_0_10px_rgba(56,189,248,0.35)] font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {g}G
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1.5">
                {guarantee === 15 && '15G: Filtrelerden geçen tüm kolonları oynarsınız (Tam Kupon).'}
                {guarantee === 14 && '14G: Tahminler doğru çıkarsa en az bir kolonda kesinlikle 14 doğru garanti.'}
                {guarantee === 13 && '13G: Tahminler doğru çıkarsa en az bir kolonda kesinlikle 13 doğru garanti.'}
                {guarantee === 12 && '12G: Tahminler doğru çıkarsa en az bir kolonda kesinlikle 12 doğru garanti.'}
              </p>
            </div>

            {/* İddaa Oran Modu Toggle Card */}
            <div className={`p-3 rounded-xl border transition-all duration-300 ${
              !hasIddaaOdds
                ? 'opacity-60 bg-slate-900/10 border-dashed border-slate-700/30'
                : (useIddaaOddsMode 
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.12)]' 
                    : (isDark ? 'bg-[#070b14]/70 border-slate-800/60' : 'bg-slate-50 border-slate-200'))
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                    !hasIddaaOdds
                      ? 'bg-slate-800/50 text-slate-500'
                      : (useIddaaOddsMode ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'))
                  }`}>
                    İD
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-extrabold ${!hasIddaaOdds ? 'text-slate-500' : (useIddaaOddsMode ? 'text-amber-400' : (isDark ? 'text-white' : 'text-slate-900'))}`}>
                        İddaa Oranlarına Göre Oyna
                      </span>
                      {!hasIddaaOdds ? (
                        <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">
                          ORANLAR BEKLENİYOR
                        </span>
                      ) : useIddaaOddsMode ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          AKTİF
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-neutral-400 block leading-tight">
                      {!hasIddaaOdds 
                        ? 'Bültendeki maçların İddaa oranları açıldığında aktif olacaktır' 
                        : (useIddaaOddsMode 
                            ? 'İddaa maç oranlarının olasılıkları hesaplanıyor' 
                            : 'Toto halk yüzdeleri yerine İddaa oranlarını baz alır')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!hasIddaaOdds}
                  onClick={toggleIddaaOddsMode}
                  className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    !hasIddaaOdds
                      ? 'cursor-not-allowed opacity-30 bg-slate-700'
                      : (useIddaaOddsMode ? 'cursor-pointer bg-amber-500' : (isDark ? 'cursor-pointer bg-slate-800' : 'cursor-pointer bg-slate-300'))
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow transition duration-200 ease-in-out ${
                      useIddaaOddsMode && hasIddaaOdds ? 'translate-x-5 bg-black' : 'translate-x-0.5 bg-white'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 2. Advanced Filters */}
            <div className={`border-t pt-4 space-y-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Gelişmiş Filtreler</span>
                <div className="flex items-center gap-1.5">
                  {(homeWinsActive || drawsActive || awayWinsActive || probabilityActive || consecutiveActive || favoriteActive) && (
                    <button
                      onClick={handleDisableAllFilters}
                      className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[9px] font-extrabold rounded border border-red-500/20 transition cursor-pointer flex items-center gap-0.5"
                      title="Tüm alt filtreleri kapatır"
                    >
                      <X className="h-2.5 w-2.5" />
                      Filtreleri Kapat
                    </button>
                  )}
                  <button
                    onClick={handleAutoAdjustFilters}
                    className="px-2 py-0.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 text-[9px] font-extrabold rounded border border-sky-500/20 transition cursor-pointer flex items-center gap-0.5"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    Otomatik Ayarla
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {/* Home wins */}
                <div className="${isDark ? 'bg-neutral-950/30 border-neutral-850/50' : 'bg-slate-50 border-slate-200'} p-2 px-3 rounded-lg border flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-1.5 min-w-[125px]">
                    <button
                      onClick={() => {
                        setHomeWinsActive(!homeWinsActive);
                        setResults(null);
                      }}
                      className={`relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        homeWinsActive ? 'bg-sky-500' : 'bg-neutral-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                          homeWinsActive ? 'translate-x-2.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[11px] ${homeWinsActive ? (isDark ? 'text-neutral-200 font-semibold' : 'text-slate-800 font-semibold') : (isDark ? 'text-neutral-500' : 'text-slate-400')}`}>
                      Ev Sahibi (1) Sayısı
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 justify-end">
                    <input
                      type="number"
                      min={0}
                      max={15}
                      disabled={!homeWinsActive}
                      value={filters.homeWins[0]}
                      onChange={(e) => {
                        setFilters({ ...filters, homeWins: [parseInt(e.target.value) || 0, filters.homeWins[1]] });
                        setResults(null);
                      }}
                      className={`w-9 ${isDark ? 'bg-neutral-950 border-neutral-850 text-white' : 'bg-white border-slate-300 text-slate-900'} text-center border rounded py-0.5 text-xs focus:outline-none focus:border-sky-500/50 transition ${
                        !homeWinsActive ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="text-neutral-600 text-[10px]">-</span>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      disabled={!homeWinsActive}
                      value={filters.homeWins[1]}
                      onChange={(e) => {
                        setFilters({ ...filters, homeWins: [filters.homeWins[0], parseInt(e.target.value) || 0] });
                        setResults(null);
                      }}
                      className={`w-9 ${isDark ? 'bg-neutral-950 border-neutral-850 text-white' : 'bg-white border-slate-300 text-slate-900'} text-center border rounded py-0.5 text-xs focus:outline-none focus:border-sky-500/50 transition ${
                        !homeWinsActive ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Draws */}
                <div className="${isDark ? 'bg-neutral-950/30 border-neutral-850/50' : 'bg-slate-50 border-slate-200'} p-2 px-3 rounded-lg border flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-1.5 min-w-[125px]">
                    <button
                      onClick={() => {
                        setDrawsActive(!drawsActive);
                        setResults(null);
                      }}
                      className={`relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        drawsActive ? 'bg-sky-500' : 'bg-neutral-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                          drawsActive ? 'translate-x-2.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[11px] ${drawsActive ? (isDark ? 'text-neutral-200 font-semibold' : 'text-slate-800 font-semibold') : (isDark ? 'text-neutral-500' : 'text-slate-400')}`}>
                      Beraberlik (X) Sayısı
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 justify-end">
                    <input
                      type="number"
                      min={0}
                      max={15}
                      disabled={!drawsActive}
                      value={filters.draws[0]}
                      onChange={(e) => {
                        setFilters({ ...filters, draws: [parseInt(e.target.value) || 0, filters.draws[1]] });
                        setResults(null);
                      }}
                      className={`w-9 ${isDark ? 'bg-neutral-950 border-neutral-850 text-white' : 'bg-white border-slate-300 text-slate-900'} text-center border rounded py-0.5 text-xs focus:outline-none focus:border-sky-500/50 transition ${
                        !drawsActive ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="text-neutral-600 text-[10px]">-</span>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      disabled={!drawsActive}
                      value={filters.draws[1]}
                      onChange={(e) => {
                        setFilters({ ...filters, draws: [filters.draws[0], parseInt(e.target.value) || 0] });
                        setResults(null);
                      }}
                      className={`w-9 ${isDark ? 'bg-neutral-950 border-neutral-850 text-white' : 'bg-white border-slate-300 text-slate-900'} text-center border rounded py-0.5 text-xs focus:outline-none focus:border-sky-500/50 transition ${
                        !drawsActive ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Away wins */}
                <div className="${isDark ? 'bg-neutral-950/30 border-neutral-850/50' : 'bg-slate-50 border-slate-200'} p-2 px-3 rounded-lg border flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-1.5 min-w-[125px]">
                    <button
                      onClick={() => {
                        setAwayWinsActive(!awayWinsActive);
                        setResults(null);
                      }}
                      className={`relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        awayWinsActive ? 'bg-sky-500' : 'bg-neutral-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                          awayWinsActive ? 'translate-x-2.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[11px] ${awayWinsActive ? (isDark ? 'text-neutral-200 font-semibold' : 'text-slate-800 font-semibold') : (isDark ? 'text-neutral-500' : 'text-slate-400')}`}>
                      Deplasman (2) Sayısı
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 justify-end">
                    <input
                      type="number"
                      min={0}
                      max={15}
                      disabled={!awayWinsActive}
                      value={filters.awayWins[0]}
                      onChange={(e) => {
                        setFilters({ ...filters, awayWins: [parseInt(e.target.value) || 0, filters.awayWins[1]] });
                        setResults(null);
                      }}
                      className={`w-9 ${isDark ? 'bg-neutral-950 border-neutral-850 text-white' : 'bg-white border-slate-300 text-slate-900'} text-center border rounded py-0.5 text-xs focus:outline-none focus:border-sky-500/50 transition ${
                        !awayWinsActive ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="text-neutral-600 text-[10px]">-</span>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      disabled={!awayWinsActive}
                      value={filters.awayWins[1]}
                      onChange={(e) => {
                        setFilters({ ...filters, awayWins: [filters.awayWins[0], parseInt(e.target.value) || 0] });
                        setResults(null);
                      }}
                      className={`w-9 ${isDark ? 'bg-neutral-950 border-neutral-850 text-white' : 'bg-white border-slate-300 text-slate-900'} text-center border rounded py-0.5 text-xs focus:outline-none focus:border-sky-500/50 transition ${
                        !awayWinsActive ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Probability sum limit */}
                <div className="${isDark ? 'bg-neutral-950/30 border-neutral-850/50' : 'bg-slate-50 border-slate-200'} p-2 px-3 rounded-lg border flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-1.5 min-w-[125px]">
                    <button
                      onClick={() => {
                        setProbabilityActive(!probabilityActive);
                        setResults(null);
                      }}
                      className={`relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        probabilityActive ? 'bg-sky-500' : 'bg-neutral-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                          probabilityActive ? 'translate-x-2.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[11px] ${probabilityActive ? (isDark ? 'text-neutral-200 font-semibold' : 'text-slate-800 font-semibold') : (isDark ? 'text-neutral-500' : 'text-slate-400')}`}>
                      Oran Yüzde Toplamı
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 justify-end">
                    <input
                      type="number"
                      min={0}
                      max={1500}
                      disabled={!probabilityActive}
                      value={filters.probabilitySum[0]}
                      onChange={(e) => {
                        setFilters({ ...filters, probabilitySum: [parseInt(e.target.value) || 0, filters.probabilitySum[1]] });
                        setResults(null);
                      }}
                      className={`w-12 ${isDark ? 'bg-neutral-950 border-neutral-850 text-white' : 'bg-white border-slate-300 text-slate-900'} text-center border rounded py-0.5 text-xs focus:outline-none focus:border-sky-500/50 transition ${
                        !probabilityActive ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                      placeholder="Min"
                    />
                    <span className="text-neutral-600 text-[10px]">-</span>
                    <input
                      type="number"
                      min={0}
                      max={1500}
                      disabled={!probabilityActive}
                      value={filters.probabilitySum[1]}
                      onChange={(e) => {
                        setFilters({ ...filters, probabilitySum: [filters.probabilitySum[0], parseInt(e.target.value) || 0] });
                        setResults(null);
                      }}
                      className={`w-12 ${isDark ? 'bg-neutral-950 border-neutral-850 text-white' : 'bg-white border-slate-300 text-slate-900'} text-center border rounded py-0.5 text-xs focus:outline-none focus:border-sky-500/50 transition ${
                        !probabilityActive ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Favorite losses */}
                <div className="${isDark ? 'bg-neutral-950/30 border-neutral-850/50' : 'bg-slate-50 border-slate-200'} p-2 px-3 rounded-lg border flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-1.5 min-w-[125px]">
                    <button
                      onClick={() => {
                        setFavoriteActive(!favoriteActive);
                        setResults(null);
                      }}
                      className={`relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        favoriteActive ? 'bg-sky-500' : 'bg-neutral-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                          favoriteActive ? 'translate-x-2.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[11px] ${favoriteActive ? (isDark ? 'text-neutral-200 font-semibold' : 'text-slate-800 font-semibold') : (isDark ? 'text-neutral-500' : 'text-slate-400')}`} title="Favori takımın kazanamadığı (sürpriz) maç sayısı">
                      Sürpriz Maç Sayısı
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 justify-end">
                    <input
                      type="number"
                      min={0}
                      max={15}
                      disabled={!favoriteActive}
                      value={filters.favoriteLosses?.[0] ?? 0}
                      onChange={(e) => {
                        setFilters({ ...filters, favoriteLosses: [parseInt(e.target.value) || 0, filters.favoriteLosses?.[1] ?? 5] });
                        setResults(null);
                      }}
                      className={`w-9 ${isDark ? 'bg-neutral-950 border-neutral-850 text-white' : 'bg-white border-slate-300 text-slate-900'} text-center border rounded py-0.5 text-xs focus:outline-none focus:border-sky-500/50 transition ${
                        !favoriteActive ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="text-neutral-600 text-[10px]">-</span>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      disabled={!favoriteActive}
                      value={filters.favoriteLosses?.[1] ?? 5}
                      onChange={(e) => {
                        setFilters({ ...filters, favoriteLosses: [filters.favoriteLosses?.[0] ?? 0, parseInt(e.target.value) || 0] });
                        setResults(null);
                      }}
                      className={`w-9 ${isDark ? 'bg-neutral-950 border-neutral-850 text-white' : 'bg-white border-slate-300 text-slate-900'} text-center border rounded py-0.5 text-xs focus:outline-none focus:border-sky-500/50 transition ${
                        !favoriteActive ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Consecutive limits */}
                <div className="bg-neutral-950/30 p-2 px-3 rounded-lg border border-neutral-850/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setConsecutiveActive(!consecutiveActive);
                          setResults(null);
                        }}
                        className={`relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          consecutiveActive ? 'bg-sky-500' : 'bg-neutral-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                            consecutiveActive ? 'translate-x-2.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className={`text-[11px] ${consecutiveActive ? 'text-neutral-200 font-semibold' : 'text-neutral-500'}`}>
                        Ardışık Limitleri
                      </span>
                    </div>
                  </div>
                  
                  {consecutiveActive && (
                    <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-neutral-850/30">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-neutral-500">1:</span>
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={filters.maxConsecutiveHome}
                          onChange={(e) => {
                            setFilters({ ...filters, maxConsecutiveHome: parseInt(e.target.value) || 1 });
                            setResults(null);
                          }}
                          className="w-8 text-center bg-neutral-950 border border-neutral-850 rounded py-0.5 text-xs text-white focus:outline-none focus:border-sky-500/50"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-neutral-500">X:</span>
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={filters.maxConsecutiveDraw}
                          onChange={(e) => {
                            setFilters({ ...filters, maxConsecutiveDraw: parseInt(e.target.value) || 1 });
                            setResults(null);
                          }}
                          className="w-8 text-center bg-neutral-950 border border-neutral-850 rounded py-0.5 text-xs text-white focus:outline-none focus:border-sky-500/50"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-neutral-500">2:</span>
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={filters.maxConsecutiveAway}
                          onChange={(e) => {
                            setFilters({ ...filters, maxConsecutiveAway: parseInt(e.target.value) || 1 });
                            setResults(null);
                          }}
                          className="w-8 text-center bg-neutral-950 border border-neutral-850 rounded py-0.5 text-xs text-white focus:outline-none focus:border-sky-500/50"
                        />
                      </div>
                    </div>
                  )}
                </div>

            </div>
          </div>

            {/* Notifications & Error messages */}
            {error && (
              <div className="p-3 bg-red-900/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {error.includes('Premium Paket') && (
                  <Link
                    href="/pricing"
                    className="w-full text-center py-1.5 px-3 bg-red-500 text-black hover:bg-red-400 font-bold rounded-lg transition uppercase tracking-wider text-[10px]"
                  >
                    Paketleri İncele
                  </Link>
                )}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 text-xs flex items-center gap-1.5">
                <Check className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 3. Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                id="btn-calculate"
                onClick={handleCalculate}
                disabled={calculating || !!selectedRoundId}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-extrabold text-sm rounded-xl hover:shadow-lg hover:shadow-sky-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="h-4.5 w-4.5 fill-black" />
                <span>{selectedRoundId ? 'Geçmiş Haftada Formül Uygulanamaz' : (calculating ? 'Hesaplanıyor...' : 'Formülü Uygula')}</span>
              </button>

              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDownloadTxt}
                  disabled={!results || results.columns.length === 0}
                  className={`w-1/2 flex items-center justify-center space-x-2 py-3 font-bold text-[11px] sm:text-xs rounded-xl border transition disabled:opacity-30 cursor-pointer ${
                    isDark
                      ? 'bg-neutral-850 hover:bg-neutral-800 text-white border-neutral-800 disabled:hover:bg-neutral-850'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 disabled:hover:bg-slate-100'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  <span>Dosya İndir</span>
                </button>

                <button
                  onClick={handleCopyCode}
                  disabled={!results || results.columns.length === 0}
                  className={`w-1/2 flex items-center justify-center space-x-2 py-3 font-bold text-[11px] sm:text-xs rounded-xl border transition disabled:opacity-30 cursor-pointer ${
                    isDark
                      ? 'bg-neutral-850 hover:bg-neutral-800 text-white border-neutral-800 disabled:hover:bg-neutral-850'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 disabled:hover:bg-slate-100'
                  }`}
                >
                  <Copy className="h-4 w-4" />
                  <span>Kodu Kopyala</span>
                </button>
              </div>

              <div className="flex gap-2 w-full">
                <button
                  onClick={handleSaveCoupon}
                  disabled={!results || results.columns.length === 0 || savingCoupon || saveSuccess}
                  className={`w-1/2 flex items-center justify-center space-x-1.5 py-3 font-bold text-xs rounded-xl border transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    saveSuccess 
                      ? (isDark ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-green-50 text-green-700 border-green-200')
                      : (isDark ? 'bg-[#1e293b]/50 hover:bg-[#1e293b] text-sky-400 border-sky-500/20 hover:border-sky-500/50' : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 hover:border-sky-300')
                  }`}
                >
                  {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  <span>{savingCoupon ? 'Kaydediliyor...' : (saveSuccess ? 'Kaydedildi' : 'Kuponu Kaydet')}</span>
                </button>
                
                <button
                  onClick={handleOpenNesineModal}
                  disabled={!results || results.columns.length === 0}
                  className={`w-1/2 flex items-center justify-center space-x-1.5 py-3 font-bold text-xs rounded-xl border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                    isDark
                      ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 text-yellow-400'
                      : 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 text-orange-600'
                  }`}
                >
                  <Play className="h-4 w-4" />
                  <span>Nesine'ye Aktar</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
      )}

    </div>

      {showPasteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative overflow-hidden">
            
            {/* Glowing element inside modal */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="text-lg font-bold text-white">Bülteni Kopyala & Yapıştır</h3>
            <p className="text-xs text-neutral-400">
              Spor Toto sitelerindeki (Bilyoner vb.) 15 maçlık bülten metnini kopyalayıp buraya yapıştırın. Takım adları ve oynanma yüzdeleri otomatik olarak çözülecektir.
            </p>
            
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Örnek Format:&#10;1. Sirius - Mjallby %59 %26 %15&#10;2. Degerfors - Malmö %15 %26 %59"
              className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500 font-mono resize-none"
            />

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteText('');
                }}
                className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={handleImportPasted}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold rounded-lg transition cursor-pointer"
              >
                İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${
            isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
          } border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative`}>
            <button
              onClick={() => setShowVideoModal(false)}
              className={`absolute top-4 right-4 text-lg font-bold cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ✕
            </button>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Kupon Formülü Eğitim Videoları</h3>
            <div className={`aspect-video rounded-xl flex flex-col items-center justify-center border p-6 relative overflow-hidden ${
              isDark ? 'bg-slate-950 border-slate-805' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="absolute inset-0 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80')] opacity-10" />
              <Play className="h-12 w-12 text-sky-500 animate-pulse mb-3" />
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Eğitim Videosu</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Detaylı video kılavuzumuz çok yakında burada olacaktır.</p>
            </div>
          </div>
        </div>
      )}

      {/* ST Extra Tarzı Nesine Sunucudan Aktarma Modalı */}
      {showNesineModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fadeIn">
          <div className={`${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          } border rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative overflow-hidden`}>
            
            {/* Kapat Butonu */}
            <button
              onClick={() => setShowNesineModal(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-full transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Nesine Başlık Barı */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-yellow-400 text-slate-950 font-black text-sm tracking-wider rounded-lg shadow-sm">
                NESİNE
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Nesine'ye Otomatik Aktar</h3>
                <p className="text-[11px] text-slate-400">Kuponunuz Nesine hesabınızdaki "Kayıtlı Kuponlarım"a eklenir.</p>
              </div>
            </div>

            {/* Kupon Özeti Kartı */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Kupon İsmi</span>
                <span className="font-bold">{nesineCouponName}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Toplam Kolon</span>
                <span className="font-bold text-sky-500">{results?.columns?.length || 0} Kolon</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Toplam Maliyet</span>
                <span className="font-bold text-emerald-500">{(results?.columns?.length || 0) * KOLON_BEDELI} TL</span>
              </div>
            </div>

            {/* Bilgilendirme / Güvenlik Notu */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-[11px] flex items-start gap-2">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Güvenli Aktarma:</strong> Kuponunuz Nesine'ye <u>kayıtlı kupon</u> olarak aktarılır. Bakiyenizden hemen para çekilmez; Nesine'ye girip kendiniz onaylarsınız.
              </span>
            </div>

            {/* Giriş Formu */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nesine Üye No / T.C. Kimlik
                </label>
                <input
                  type="text"
                  value={nesineUsername}
                  onChange={(e) => setNesineUsername(e.target.value)}
                  placeholder="Örn: 12345678"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-yellow-400 transition font-medium ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nesine Şifresi
                </label>
                <input
                  type="password"
                  value={nesinePassword}
                  onChange={(e) => setNesinePassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-yellow-400 transition font-medium ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Güvenlik Doğrulama Kodu (Captcha)
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="h-12 w-40 shrink-0 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shadow-inner p-1">
                    {captchaImg ? (
                      <img src={captchaImg} alt="Captcha" className="h-full w-full object-contain filter contrast-125" />
                    ) : captchaLoading ? (
                      <span className="text-xs text-sky-400 font-semibold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> KOD ALINIYOR...
                      </span>
                    ) : (
                      <span className="text-xs text-red-400 text-center px-1 font-medium">Yenile'ye Basın</span>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={fetchNesineCaptcha}
                    disabled={captchaLoading}
                    title="Güvenlik Kodunu Yenile"
                    className={`p-3 rounded-xl border-2 transition cursor-pointer shrink-0 ${
                      isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
                    } disabled:opacity-50`}
                  >
                    <RefreshCw className={`w-4 h-4 ${captchaLoading ? 'animate-spin text-sky-400' : ''}`} />
                  </button>

                  <input
                    type="text"
                    maxLength={5}
                    value={nesineCaptcha}
                    onChange={(e) => setNesineCaptcha(e.target.value.toUpperCase())}
                    placeholder="KODU GİRİN"
                    className={`w-full px-3 py-2.5 rounded-xl text-base uppercase tracking-widest text-center font-black border-2 focus:outline-none focus:border-yellow-400 transition ${
                      isDark ? 'bg-slate-950 border-slate-700 text-yellow-400 placeholder:text-slate-600 placeholder:text-xs placeholder:font-normal' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Sonuç Bildirimi */}
            {nesineSaveResult && (
              <div className={`p-3 rounded-xl text-xs font-medium border flex items-start gap-2 ${
                nesineSaveResult.success 
                  ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                  : 'bg-red-500/10 border-red-500/30 text-red-500'
              }`}>
                {nesineSaveResult.success ? <Check className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <span>{nesineSaveResult.message}</span>
                  {nesineSaveResult.success && (
                    <a
                      href="https://www.nesine.com/kuponlarim/sportoto-kayitli?page=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sky-400 font-bold underline mt-1.5 block hover:text-sky-300"
                    >
                      Nesine Kayıtlı Kuponlarıma Git <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Ana Buton */}
            <div className="space-y-3 pt-1">
              <button
                onClick={handleSaveToNesine}
                disabled={savingToNesine}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingToNesine ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Nesine'ye Aktarılıyor...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Şifre & Captcha ile Sunucudan Kaydet</span>
                  </>
                )}
              </button>

              {/* ST Extra tarzı Chrome Eklentisi ile Tek Tıkla Gönderme */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-[11px] text-slate-400 font-medium">⚡ ST Extra Yöntemi (Şifresiz / Kotsuz / Anında):</p>
                <button
                  type="button"
                  onClick={() => {
                    if (results && results.columns) {
                      window.postMessage({ type: "ST_PLAY_COUPON", payload: results.columns }, "*");
                      setShowNesineModal(false);
                    }
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 font-bold text-xs rounded-xl border border-yellow-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>Chrome Eklentisi ile Tek Tıkla Nesine'ye Gönder</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Oynanma yüzdesini iddaa oranına dönüştüren yardımcı fonksiyon (Mevcut yapıyı bozmadan eklenmiştir)
function calculateOdds(prob: number): string {
  if (!prob || prob <= 0) return '9.99';
  let odds = (100 / prob) * 0.88;
  if (odds < 1.05) odds = 1.05;
  if (odds > 25) odds = 25;
  return odds.toFixed(2);
}
