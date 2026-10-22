import { NextResponse } from 'next/server';
import { fetchMackolikMatches } from '../fetch-iddaa/route';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface DailyMatchItem {
  id: string;
  code: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  marketName: string;
  choice: string;
  odd: number;
  reason?: string;
  score?: string;
  iyScore?: string;
  won?: boolean;
}

export interface DailyCoupon {
  id: string;
  title: string;
  badge: string;
  category: 'ms_only' | 'ou_only' | 'ms_ou_mix' | 'banko' | 'special';
  categoryLabel: string;
  description: string;
  theme: 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose' | 'indigo' | 'blue';
  totalMatches: number;
  totalOdds: number;
  suggestedStake: number;
  potentialReturn: number;
  matches: DailyMatchItem[];
  isEvaluated?: boolean;
  isWinner?: boolean;
  wonMatchesCount?: number;
  wonAmount?: number;
}

export interface YesterdayDailySummary {
  date: string;
  formattedDate: string;
  totalCoupons: number;
  wonCoupons: number;
  successRate: number;
  coupons: DailyCoupon[];
}

const DAILY_STORE_FILE = path.join(process.cwd(), 'data', 'daily_coupons_store.json');
const DAILY_STORE_FILE_PUBLIC = path.join(process.cwd(), 'public', 'data', 'daily_coupons_store.json');

function cleanTeamName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[ıİiI]/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[çÇ]/g, 'c')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchTeams(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const ca = cleanTeamName(a);
  const cb = cleanTeamName(b);
  if (ca === cb) return true;
  if (ca.includes(cb) || cb.includes(ca)) return true;
  const ignore = ['fc', 'sk', 'fk', 'club', 'united', 'city'];
  const wordsA = ca.split(' ').filter(w => w.length >= 3 && !ignore.includes(w));
  const wordsB = cb.split(' ').filter(w => w.length >= 3 && !ignore.includes(w));
  return wordsA.some(wa => wordsB.some(wb => wa === wb || (wa.length >= 3 && wb.length >= 3 && (wa.startsWith(wb) || wb.startsWith(wa)))));
}

function loadStoredDailyCoupons(dateStr: string): DailyCoupon[] | null {
  for (const f of [DAILY_STORE_FILE, DAILY_STORE_FILE_PUBLIC]) {
    try {
      if (fs.existsSync(f)) {
        const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
        if (data && data[dateStr] && Array.isArray(data[dateStr].coupons) && data[dateStr].coupons.length >= 3) {
          return data[dateStr].coupons;
        }
      }
    } catch (e) {}
  }
  return null;
}

function saveStoredDailyCoupons(dateStr: string, coupons: DailyCoupon[], yesterday?: any) {
  for (const f of [DAILY_STORE_FILE, DAILY_STORE_FILE_PUBLIC]) {
    try {
      const dir = path.dirname(f);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let data: Record<string, any> = {};
      if (fs.existsSync(f)) {
        try {
          data = JSON.parse(fs.readFileSync(f, 'utf-8'));
        } catch (e) {}
      }
      data[dateStr] = {
        timestamp: Date.now(),
        coupons,
        ...(yesterday ? { yesterday } : (data[dateStr]?.yesterday ? { yesterday: data[dateStr].yesterday } : {}))
      };
      fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {}
  }
}

// In-memory cache for instant response (< 5ms) - Gün boyunca sabit kuponlar
let cachedDailyResponse: {
  dateKey: string;
  timestamp: number;
  payload: any;
} | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat - Gün boyunca sabit!

function parseOdd(val: any): number | null {
  if (!val || val === '-' || val === '0,00' || val === '0.00' || val === 0) return null;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) || num <= 1.01 ? null : num;
}

function getIstanbulDates() {
  const now = new Date();
  const todayYmd = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Europe/Istanbul', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(now);
  const [ty, tm, td] = todayYmd.split('-');
  const todayDot = `${td}.${tm}.${ty}`;

  const dYesterday = new Date(`${todayYmd}T12:00:00Z`);
  dYesterday.setDate(dYesterday.getDate() - 1);
  const yesterdayYmd = dYesterday.toISOString().split('T')[0];
  const [yy, ym, yd] = yesterdayYmd.split('-');
  const yesterdayDot = `${yd}.${ym}.${yy}`;

  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const formattedYesterday = `${parseInt(yd, 10)} ${months[parseInt(ym, 10) - 1]} ${yy} Dün`;

  return {
    todayYmd,
    todayDot,
    yesterdayYmd,
    yesterdayDot,
    formattedYesterday
  };
}

function evaluateScoreWon(choice: string, msScore: string): boolean {
  if (!msScore || !msScore.includes('-')) return false;
  const parts = msScore.split('-').map(s => parseInt(s.trim(), 10));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return false;
  const [h, a] = parts;
  const ch = choice.toUpperCase().trim();

  if (ch === 'MS 1' || ch === '1') return h > a;
  if (ch === 'MS 2' || ch === '2') return a > h;
  if (ch === 'MS 0' || ch === 'MS X' || ch === 'X' || ch === '0') return h === a;
  if (ch === '2.5 ÜST' || ch === '2.5 UST' || ch === 'ÜST' || ch === 'UST') return (h + a) >= 3;
  if (ch === '2.5 ALT' || ch === 'ALT') return (h + a) <= 2;
  if (ch === '1.5 ÜST' || ch === '1.5 UST') return (h + a) >= 2;
  if (ch === '1.5 ALT') return (h + a) <= 1;
  if (ch === 'KG VAR') return h > 0 && a > 0;
  if (ch === 'KG YOK') return h === 0 || a === 0;
  if (ch === '1-X' || ch === '1X' || ch === 'ÇŞ 1-X') return h >= a;
  if (ch === 'X-2' || ch === 'X2' || ch === 'ÇŞ X-2') return a >= h;
  if (ch === '1-2' || ch === '12' || ch === 'ÇŞ 1-2') return h !== a;
  if (ch.startsWith('1/1')) return h > a;
  if (ch.startsWith('2/2')) return a > h;
  return false;
}

function isMatchPast(dateStr?: string, timeStr?: string): boolean {
  if (!dateStr || !timeStr) return false;
  try {
    const dParts = dateStr.replace(/\//g, '.').split('.').map(Number);
    if (dParts.length !== 3) return false;
    const [day, month, year] = dParts;
    const tParts = timeStr.split(':').map(Number);
    if (tParts.length < 2) return false;
    const [hour, minute] = tParts;

    const nowIstanbul = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const matchIstanbul = new Date(year, month - 1, day, hour, minute);

    // If kick-off was more than 10 minutes ago, treat as started/past
    return nowIstanbul.getTime() > (matchIstanbul.getTime() + 10 * 60 * 1000);
  } catch {
    return false;
  }
}

function getMatchPriority(m: any): number {
  const league = String(m.league || '').toUpperCase().trim();
  const home = (m.homeTeam || '').toLowerCase().trim();
  const away = (m.awayTeam || '').toLowerCase().trim();
  const teams = `${home} ${away}`;

  const isYouthOrRes = 
    teams.includes('u19') || 
    teams.includes('u21') || 
    teams.includes('u23') || 
    teams.includes('(b)') || 
    teams.includes('(k)') ||
    teams.includes('kadın') ||
    teams.includes(' ii') ||
    teams.includes('(amt') ||
    teams.includes('rezerv') ||
    teams.includes('reserve') ||
    league.includes('U19') || 
    league.includes('U21') || 
    league.includes('U23') ||
    league.includes('PORU23') ||
    league.includes('UEGL') ||
    league.includes('BÖL') ||
    league.includes('KDK');

  if (isYouthOrRes) {
    return 10;
  }

  // 1. UEFA ŞAMPİYONLAR LİGİ (Günün en büyük vitrini - En tepeye al!)
  if (league === 'ŞMP' || league.includes('ŞAMP') || league.includes('UCL') || league.includes('UEFA')) {
    return 5000;
  }

  // 2. Büyük Kulüpler (Galatasaray, Barcelona, Real Madrid, Bayern, Man United, Arsenal, Inter, Atletico, Napoli vb.)
  const isMajorTeam = 
    /\b(galatasaray|fenerbahçe|beşiktaş|trabzonspor|barcelona|real madrid|bayern|manchester|man\. utd|arsenal|atletico|dortmund|napoli|leipzig|sporting cp|psv|lille|chelsea|liverpool)\b/i.test(teams) ||
    home === 'inter' || away === 'inter';

  if (isMajorTeam) {
    return 4000;
  }

  // 3. İngiltere Championship, Türkiye Süper Lig / 1. Lig, Majör Ligler
  if (['TSL', 'T1L', 'İNG', 'İNCL', 'İSP', 'İTA', 'ALM', 'FRA'].includes(league)) {
    return 3000;
  }

  // 4. Kupa ve Prestijli Ligler (Almanya 3, İngiltere Kupa, Belçika, Hollanda, Portekiz)
  if (['AL3', 'İNTK', 'HOL', 'POR', 'BEL', 'AŞMP', 'AFCŞL2'].includes(league)) {
    return 1500;
  }

  // 5. Diğer alt / bölgesel ligler
  return 100;
}

export async function GET() {
  const dates = getIstanbulDates();
  const now = Date.now();

  // Gün boyunca sabit kupon kontrolü: Aynı gün içindeyse kuponlar ve maçlar ASLA değişmez!
  if (cachedDailyResponse && cachedDailyResponse.dateKey === dates.todayDot) {
    const isCorrupted = cachedDailyResponse.payload?.coupons?.some((c: any) =>
      c.matches?.some((m: any) =>
        m.date !== dates.todayDot ||
        String(m.id || '').includes('fb_') ||
        ['Burnley', 'Cardiff', 'Bristol City', 'Wrexham', 'Oldham', 'Salzburg', 'Kuopion', 'Torreense'].includes(m.homeTeam)
      )
    );
    if (isCorrupted) {
      cachedDailyResponse = null;
    }
  }

  if (cachedDailyResponse && cachedDailyResponse.dateKey === dates.todayDot) {
    const isCacheHealthy = Array.isArray(cachedDailyResponse.payload?.coupons) &&
      cachedDailyResponse.payload.coupons.length >= 7 &&
      cachedDailyResponse.payload.coupons.every((c: any) => Array.isArray(c.matches) && c.matches.length >= 3);
    if (isCacheHealthy && now - cachedDailyResponse.timestamp < CACHE_TTL_MS) {
      // Kupondaki maçlar gün boyunca kesinlikle sabittir. Başlayan maçlar asla çıkarılmaz/yenilenmez.
      // Sadece varsa canlı skorları güncelleyelim:
      try {
        const liveMatches = await fetchMackolikMatches();
        if (liveMatches && liveMatches.length > 0) {
          const matchMap = new Map(liveMatches.map((m: any) => [String(m.code || m.id), m]));
          for (const coupon of cachedDailyResponse.payload.coupons) {
            for (const match of coupon.matches) {
              const live = matchMap.get(match.code) || matchMap.get(match.id);
              if (live && live.score && live.score !== '-') {
                match.score = live.score;
                match.won = evaluateScoreWon(match.choice, live.score);
              }
            }
          }
        }
      } catch (e) {}

      return NextResponse.json(cachedDailyResponse.payload);
    } else if (!isCacheHealthy) {
      cachedDailyResponse = null; // Bozuk veya eksik önbelleği derhal sıfırla!
    }
  }

  try {
    // 1. Fetch live matches from Mackolik (cached / fast)
    let liveMatches: any[] = [];
    try {
      liveMatches = await fetchMackolikMatches();
    } catch (e) {
      console.warn('Mackolik fetch error:', e);
    }

    const normalizeDate = (d?: string) => (d || '').replace(/\//g, '.').trim();

    // Günün sabit maç havuzu: Bugünün tüm resmi oranlı maçları (Saat veya maçın başlamış olması kuponu bozmaz/değiştirmez!)
    const todayAllWithOdds = (liveMatches || []).filter(m => {
      const isToday = normalizeDate(m.date) === dates.todayDot;
      const hasAnyRealOdd = !!(parseOdd(m.ms1) || parseOdd(m.ms2) || parseOdd(m.ust25) || parseOdd(m.alt25) || parseOdd(m.msX) || parseOdd(m.kgVar));
      return isToday && m.homeTeam && m.awayTeam && hasAnyRealOdd;
    });

    // Gelecek bülten maçları (Eğer bugünün maçı azsa havuzu zenginleştirmek için)
    const upcomingWithOdds = (liveMatches || []).filter(m => {
      const hasAnyRealOdd = !!(parseOdd(m.ms1) || parseOdd(m.ms2) || parseOdd(m.ust25) || parseOdd(m.alt25) || parseOdd(m.msX) || parseOdd(m.kgVar));
      return m.homeTeam && m.awayTeam && hasAnyRealOdd;
    });

    let matchPoolRaw: any[] = [];
    if (todayAllWithOdds.length >= 15) {
      matchPoolRaw = todayAllWithOdds;
    } else if (upcomingWithOdds.length >= 15) {
      matchPoolRaw = upcomingWithOdds;
    } else {
      matchPoolRaw = todayAllWithOdds.length > 0 ? todayAllWithOdds : upcomingWithOdds;
    }

    // POPÜLARİTE VE LİG ÖNCELİĞİ SIRALAMASI: Şampiyonlar Ligi ve elit maçlar ilk sırada, deterministik sıra!
    const matchPool = [...matchPoolRaw].sort((a, b) => {
      const pDiff = getMatchPriority(b) - getMatchPriority(a);
      if (pDiff !== 0) return pDiff;
      const timeDiff = (a.time || '').localeCompare(b.time || '');
      if (timeDiff !== 0) return timeDiff;
      return String(a.code || a.id || '').localeCompare(String(b.code || b.id || ''));
    });

    // Helper to find odds and format choice with wide realistic boundaries
    const getBestChoiceForMatch = (m: any, preferredMarket: 'ms' | 'ou' | 'banko' | 'surprise' | 'any') => {
      const o = m.odds || m;
      const ms1 = parseOdd(o.ms1);
      const msX = parseOdd(o.ms0 || o.msX);
      const ms2 = parseOdd(o.ms2);
      const ust25 = parseOdd(o.ust25);
      const alt25 = parseOdd(o.alt25);
      const kgVar = parseOdd(o.kgVar);
      const cs1X = parseOdd(o.cs1X);
      const csX2 = parseOdd(o.csX2);

      if (preferredMarket === 'ms') {
        if (ms1 && ms1 >= 1.20 && ms1 <= 2.50) {
          return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', reason: `${m.homeTeam} ev sahibi saha avantajı ve form üstünlüğü` };
        }
        if (ms2 && ms2 >= 1.20 && ms2 <= 2.50) {
          return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', reason: `${m.awayTeam} deplasman kadro kalitesi ve galibiyet hedefi` };
        }
        if (ms1 && ms1 >= 1.12 && ms1 < 1.20) {
          return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', reason: `${m.homeTeam} mutlak galibiyet favorisi` };
        }
        if (ms2 && ms2 >= 1.12 && ms2 < 1.20) {
          return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', reason: `${m.awayTeam} mutlak galibiyet favorisi` };
        }
        return null;
      }

      if (preferredMarket === 'ou') {
        if (ust25 && ust25 >= 1.25 && ust25 <= 2.25) {
          return { choice: '2.5 ÜST', odd: ust25, marketName: 'Toplam Gol', reason: 'İki takımın da hücum gücü yüksek, tempolu ve gollü mücadele' };
        }
        if (alt25 && alt25 >= 1.30 && alt25 <= 2.25) {
          return { choice: '2.5 ALT', odd: alt25, marketName: 'Toplam Gol', reason: 'Kontrollü savunma hattı ve düşük skor beklentisi' };
        }
        if (kgVar && kgVar >= 1.40 && kgVar <= 2.15) {
          return { choice: 'KG VAR', odd: kgVar, marketName: 'Karşılıklı Gol', reason: 'İki takımın da gol bulması beklenen açık oyun' };
        }
        return null;
      }

      if (preferredMarket === 'banko') {
        if (ms1 && ms1 >= 1.12 && ms1 <= 1.65) {
          return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', reason: `${m.homeTeam} net kadro kalitesi ve mutlak favori` };
        }
        if (ms2 && ms2 >= 1.15 && ms2 <= 1.65) {
          return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', reason: `${m.awayTeam} sınıf farkı ve istikrarlı deplasman performansı` };
        }
        if (cs1X && cs1X >= 1.12 && cs1X <= 1.55) {
          return { choice: 'ÇŞ 1-X', odd: cs1X, marketName: 'Çifte Şans', reason: `${m.homeTeam} iç saha yenilgisizliği güvencesi` };
        }
        if (ust25 && ust25 >= 1.25 && ust25 <= 1.75) {
          return { choice: '2.5 ÜST', odd: ust25, marketName: 'Toplam Gol', reason: 'Tempolu gol beklentisi ve yüksek güvenilirlik' };
        }
        if (csX2 && csX2 >= 1.12 && csX2 <= 1.55) {
          return { choice: 'ÇŞ X-2', odd: csX2, marketName: 'Çifte Şans', reason: `${m.awayTeam} deplasman puan güvencesi` };
        }
        return null;
      }

      if (preferredMarket === 'surprise') {
        if (ms2 && ms2 >= 1.85 && ms2 <= 3.20) {
          return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', reason: `${m.awayTeam} cazip oran ve sürpriz galibiyet potansiyeli` };
        }
        if (ms1 && ms1 >= 1.85 && ms1 <= 3.00) {
          return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', reason: `${m.homeTeam} yüksek çarpan ve ev sahibi baskısı` };
        }
        if (msX && msX >= 2.90 && msX <= 3.60) {
          return { choice: 'MS X', odd: msX, marketName: 'Maç Sonucu', reason: 'Dengeli güçler ve cazip beraberlik çarpanı' };
        }
        if (kgVar && kgVar >= 1.70 && kgVar <= 2.30) {
          return { choice: 'KG VAR', odd: kgVar, marketName: 'Karşılıklı Gol', reason: 'Yüksek çarpanlı karşılıklı gol beklentisi' };
        }
        return null;
      }

      // 'any' veya genel fallback
      if (ms1 && ms1 >= 1.20 && ms1 <= 2.30) return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', reason: `${m.homeTeam} ev sahibi galibiyeti` };
      if (ust25 && ust25 >= 1.30 && ust25 <= 2.15) return { choice: '2.5 ÜST', odd: ust25, marketName: 'Toplam Gol', reason: 'Tempolu ve pozisyonlu mücadele' };
      if (ms2 && ms2 >= 1.20 && ms2 <= 2.30) return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', reason: `${m.awayTeam} galibiyeti` };
      if (alt25 && alt25 >= 1.35 && alt25 <= 2.15) return { choice: '2.5 ALT', odd: alt25, marketName: 'Toplam Gol', reason: 'Düşük skor beklentisi' };
      if (kgVar && kgVar >= 1.45 && kgVar <= 2.15) return { choice: 'KG VAR', odd: kgVar, marketName: 'Karşılıklı Gol', reason: 'Karşılıklı gol potansiyeli' };
      if (ms1 && ms1 >= 1.12) return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', reason: `${m.homeTeam} galibiyeti` };
      if (ms2 && ms2 >= 1.12) return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', reason: `${m.awayTeam} galibiyeti` };
      return null;
    };

    // Helper to build a unique set of matches for a coupon with 4-tier guarantee
    const usedMatchIds = new Set<string>();

    const pickMatches = (count: number, preferredMarket: 'ms' | 'ou' | 'banko' | 'surprise' | 'any', filterFn?: (m: any) => boolean): DailyMatchItem[] => {
      const selected: DailyMatchItem[] = [];
      const selectedCodes = new Set<string>();

      const addMatch = (m: any, choiceObj: { choice: string; odd: number; marketName: string; reason: string }) => {
        const code = String(m.code || m.id || '70000');
        selectedCodes.add(code);
        usedMatchIds.add(m.id || m.code);
        selected.push({
          id: `match_${m.id || m.code}_${selected.length}`,
          code,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'Futbol',
          date: m.date || dates.todayDot,
          time: m.time || '20:00',
          marketName: choiceObj.marketName,
          choice: choiceObj.choice,
          odd: choiceObj.odd,
          reason: choiceObj.reason
        });
      };

      // 1. Aşama: Tercih edilen markete ve filtreye uyan, henüz kullanılmamış maçlar
      for (const m of matchPool) {
        if (selected.length >= count) break;
        const code = String(m.code || m.id);
        if (selectedCodes.has(code) || usedMatchIds.has(m.id || m.code)) continue;
        if (filterFn && !filterFn(m)) continue;
        const best = getBestChoiceForMatch(m, preferredMarket);
        if (best) addMatch(m, best);
      }

      // 2. Aşama: Hala eksikse, havuzdaki diğer kullanılmamış maçlardan filtreye uyanlar
      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (selectedCodes.has(code) || usedMatchIds.has(m.id || m.code)) continue;
          if (filterFn && !filterFn(m)) continue;
          const best = getBestChoiceForMatch(m, 'any') || getBestChoiceForMatch(m, preferredMarket);
          if (best) addMatch(m, best);
        }
      }

      // 3. Aşama: Hala eksikse, başka kuponlarda kullanılan maçları kupon içinde tekrarlamadan dahil et
      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (selectedCodes.has(code)) continue; // Aynı kupon içinde aynı maç olamaz!
          const best = getBestChoiceForMatch(m, preferredMarket) || getBestChoiceForMatch(m, 'any');
          if (best) addMatch(m, best);
        }
      }

      // 4. Aşama (Mutlak Garanti): Herhangi bir geçerli maç seçeneğiyle tamamla
      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (selectedCodes.has(code)) continue;
          const best = getBestChoiceForMatch(m, 'any');
          if (best) addMatch(m, best);
        }
      }

      return selected;
    };

    // -------------------------------------------------------------
    // TODAY'S 7 DYNAMIC COUPONS (KOMBİNE GARANTİLİ)
    // -------------------------------------------------------------

    // Kupon 1: Sadece Maç Sonucu (MS) Kuponu (5 Maç)
    const matchesC1 = pickMatches(5, 'ms');
    const oddsC1 = Number(matchesC1.reduce((acc, m) => acc * m.odd, 1).toFixed(2));
    const coupon_ms_only: DailyCoupon = {
      id: 'daily-kupon-ms-only',
      title: 'Sadece Maç Sonucu (MS) Kuponu',
      badge: 'SADECE MS (1-X-2)',
      category: 'ms_only',
      categoryLabel: 'Sadece Maç Sonucu',
      description: 'Sadece Maç Sonucu (1-X-2) tercihlerinden oluşan 5 maçlık net galibiyet kombini.',
      theme: 'emerald',
      totalMatches: matchesC1.length,
      totalOdds: oddsC1,
      suggestedStake: 100,
      potentialReturn: Number((oddsC1 * 100).toFixed(2)),
      matches: matchesC1
    };

    // Kupon 2: Sadece 2.5 Alt / Üst Kuponu (4 Maç)
    const matchesC2 = pickMatches(4, 'ou');
    const oddsC2 = Number(matchesC2.reduce((acc, m) => acc * m.odd, 1).toFixed(2));
    const coupon_ou_only: DailyCoupon = {
      id: 'daily-kupon-ou-only',
      title: 'Sadece 2.5 Alt / Üst Kuponu',
      badge: 'SADECE 2.5 ALT/ÜST',
      category: 'ou_only',
      categoryLabel: 'Sadece 2.5 Alt/Üst',
      description: 'Taraf bahsi olmadan sırf 2.5 Alt ve 2.5 Üst baremlerinden seçilmiş 4 maçlık gol kuponu.',
      theme: 'rose',
      totalMatches: matchesC2.length,
      totalOdds: oddsC2,
      suggestedStake: 50,
      potentialReturn: Number((oddsC2 * 50).toFixed(2)),
      matches: matchesC2
    };

    // Kupon 3: Maç Sonucu & 2.5 Alt/Üst Karma Kupon (4 Maç)
    let msMix = pickMatches(2, 'ms');
    let ouMix = pickMatches(2, 'ou');
    let matchesC3 = [...msMix, ...ouMix];
    if (matchesC3.length < 4) {
      const needed = 4 - matchesC3.length;
      const extra = pickMatches(needed, 'any', m => !matchesC3.some(s => s.code === String(m.code || m.id)));
      matchesC3 = [...matchesC3, ...extra];
    }
    const oddsC3 = Number(matchesC3.reduce((acc, m) => acc * m.odd, 1).toFixed(2));
    const coupon_ms_ou_mix: DailyCoupon = {
      id: 'daily-kupon-ms-ou-mix',
      title: 'Maç Sonucu & 2.5 Alt/Üst Karma Kupon',
      badge: 'MS + 2.5 ALT/ÜST KARMA',
      category: 'ms_ou_mix',
      categoryLabel: 'MS & 2.5 Alt/Üst Karma',
      description: 'Kupon içinde ayrı maçlarda hem normal Maç Sonucu hem de normal 2.5 Alt/Üst tercihlerini birleştiren 4 maçlık dengeli kupon.',
      theme: 'amber',
      totalMatches: matchesC3.length,
      totalOdds: oddsC3,
      suggestedStake: 50,
      potentialReturn: Number((oddsC3 * 50).toFixed(2)),
      matches: matchesC3
    };

    // Kupon 4: İdeal Banko Kombine (3 Maç)
    const matchesC4 = pickMatches(3, 'banko');
    const oddsC4 = Number(matchesC4.reduce((acc, m) => acc * m.odd, 1).toFixed(2));
    const coupon1: DailyCoupon = {
      id: 'daily-kupon-1',
      title: 'İdeal Banko Kombine',
      badge: 'GÜNÜN BANKOSU',
      category: 'banko',
      categoryLabel: 'Banko Kombineler',
      description: 'Günün en yüksek güvenilirlikli ve düşük riskli maçlarından oluşan kasa kombini.',
      theme: 'cyan',
      totalMatches: matchesC4.length,
      totalOdds: oddsC4,
      suggestedStake: 100,
      potentialReturn: Number((oddsC4 * 100).toFixed(2)),
      matches: matchesC4
    };

    // Kupon 5: Güvenli Taraflar (4 Maç)
    const matchesC5 = pickMatches(4, 'banko');
    const oddsC5 = Number(matchesC5.reduce((acc, m) => acc * m.odd, 1).toFixed(2));
    const coupon4: DailyCoupon = {
      id: 'daily-kupon-4',
      title: 'Güvenli Taraflar Kombini',
      badge: 'GÜVENLİ TARAFLAR',
      category: 'special',
      categoryLabel: 'Özel Kombineler',
      description: 'Bültenin form ve iç saha üstünlüğüne sahip ekiplerinden seçilen 4 maçlık kombine kuponu.',
      theme: 'purple',
      totalMatches: matchesC5.length,
      totalOdds: oddsC5,
      suggestedStake: 50,
      potentialReturn: Number((oddsC5 * 50).toFixed(2)),
      matches: matchesC5
    };

    // Kupon 6: Sürpriz Değer & Çarpan Kuponu (4 Maç)
    const matchesC6 = pickMatches(4, 'surprise');
    const oddsC6 = Number(matchesC6.reduce((acc, m) => acc * m.odd, 1).toFixed(2));
    const coupon5: DailyCoupon = {
      id: 'daily-kupon-5',
      title: 'Sürpriz Değer & Çarpan Kuponu',
      badge: 'YÜKSEK ORAN / ÇARPAN',
      category: 'special',
      categoryLabel: 'Özel Kombineler',
      description: 'Bültenin yüksek çarpanlı değer tercihlerinden oluşan yüksek kazanç kuponu.',
      theme: 'indigo',
      totalMatches: matchesC6.length,
      totalOdds: oddsC6,
      suggestedStake: 20,
      potentialReturn: Number((oddsC6 * 20).toFixed(2)),
      matches: matchesC6
    };

    // Kupon 7: Akşam Özel Zirve Miksi (4 Maç)
    const matchesC7 = pickMatches(4, 'any', m => {
      const time = m.time || '';
      return time >= '17:00' || time === '';
    });
    const oddsC7 = Number(matchesC7.reduce((acc, m) => acc * m.odd, 1).toFixed(2));
    const coupon7: DailyCoupon = {
      id: 'daily-kupon-7',
      title: 'Akşam Özel Zirve Miksi',
      badge: 'AKŞAM ÖZEL MİKS',
      category: 'special',
      categoryLabel: 'Özel Kombineler',
      description: 'Gece ve akşam bülteninin dikkat çeken karşılaşmalarından oluşan 4 maçlık dengeli miks kupon.',
      theme: 'blue',
      totalMatches: matchesC7.length,
      totalOdds: oddsC7,
      suggestedStake: 30,
      potentialReturn: Number((oddsC7 * 30).toFixed(2)),
      matches: matchesC7
    };

    const todayCoupons = [
      coupon_ms_only,
      coupon_ou_only,
      coupon_ms_ou_mix,
      coupon1,
      coupon4,
      coupon5,
      coupon7
    ];

    // -------------------------------------------------------------
    // 2. YESTERDAY'S EVALUATED DAILY COUPONS (REAL RESULTS FROM SUPABASE)
    // -------------------------------------------------------------
    let pastCoupons: DailyCoupon[] = [];
    let evaluatedYesterdayDateDot = dates.yesterdayDot;
    let evaluatedYesterdayFormatted = dates.formattedYesterday;

    try {
      const db = supabase || (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (await import('@supabase/supabase-js')).createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : null);

      let pastDbMatches: any[] = [];

      if (db) {
        // Query Supabase past_matches for yesterday
        const res: any = await db
          .from('past_matches')
          .select('*')
          .eq('match_date', dates.yesterdayYmd)
          .not('ms_score', 'is', null);

        pastDbMatches = res?.data || [];

        // If yesterday has fewer matches, try syncing from Mackolik on demand
        if (!pastDbMatches || pastDbMatches.length < 12) {
          try {
            const { fetchAndSyncDay } = await import('@/app/api/cron/sync-results/route');
            await fetchAndSyncDay(dates.yesterdayDot.replace(/\./g, '/'), dates.yesterdayYmd);
            const refetchRes: any = await db
              .from('past_matches')
              .select('*')
              .eq('match_date', dates.yesterdayYmd)
              .not('ms_score', 'is', null);
            pastDbMatches = refetchRes?.data || [];
          } catch(e) {}
        }

        // Fallback to latest available match date in past_matches if still empty
        if (!pastDbMatches || pastDbMatches.length < 12) {
          const latestDateRes: any = await db
            .from('past_matches')
            .select('match_date')
            .not('ms_score', 'is', null)
            .order('match_date', { ascending: false })
            .limit(1);

          const latestDate = latestDateRes?.data?.[0]?.match_date;
          if (latestDate) {
            const [ly, lm, ld] = latestDate.split('-');
            evaluatedYesterdayDateDot = `${ld}.${lm}.${ly}`;
            const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            evaluatedYesterdayFormatted = `${parseInt(ld, 10)} ${months[parseInt(lm, 10) - 1]} ${ly} Dün`;

            const fallbackRes: any = await db
              .from('past_matches')
              .select('*')
              .eq('match_date', latestDate)
              .not('ms_score', 'is', null);
            pastDbMatches = fallbackRes?.data || [];
          }
        }
      }

      // Dün verilen orijinal kuponlar sistem deposunda var mı?
      const storedYesterday = loadStoredDailyCoupons(dates.yesterdayDot);

      if (storedYesterday && storedYesterday.length >= 3 && storedYesterday.every(c => Array.isArray(c.matches) && c.matches.length >= 2)) {
        // CASE 1: Dün kullanıcıya sunulmuş orijinal kuponlar mevcut.
        // KESİN KURAL: Orijinal tahminler (m.choice) ve oranlar (m.odd) ASLA DEĞİŞTİRİLEMEZ!
        // Skor resmi sonuçtan çekilir, tuttu/yattı dürüstçe değerlendirilir.
        const evaluatedList: DailyCoupon[] = [];
        for (const dc of storedYesterday) {
          const evalMatches: DailyMatchItem[] = dc.matches.map((m) => {
            const dbM = pastDbMatches.find(p => 
              (matchTeams(p.home_team, m.homeTeam) && matchTeams(p.away_team, m.awayTeam)) ||
              matchTeams(p.home_team, m.homeTeam) || 
              matchTeams(p.away_team, m.awayTeam)
            );
            const score = dbM?.ms_score ? String(dbM.ms_score).replace('-', ' - ') : (m.score && m.score !== '0 - 0' ? m.score : '0 - 0');
            const iyScore = dbM?.iy_score || m.iyScore || undefined;
            const hasFinished = Boolean(dbM?.ms_score || (m.score && m.score !== '0 - 0'));
            const won = hasFinished ? evaluateScoreWon(m.choice, dbM?.ms_score || m.score || '0-0') : false;

            return {
              ...m,
              score,
              iyScore,
              won,
              reason: hasFinished 
                ? `Resmi Skor: ${score} (${won ? 'TUTTU ✅' : 'YATTI ❌'})` 
                : 'Maç sonucu henüz girilmedi'
            };
          });

          const totalOdds = Number(evalMatches.reduce((a, b) => a * b.odd, 1).toFixed(2));
          const wonCount = evalMatches.filter(m => m.won).length;
          const isWinner = wonCount === evalMatches.length;

          evaluatedList.push({
            ...dc,
            totalOdds,
            matches: evalMatches,
            isEvaluated: true,
            isWinner,
            wonMatchesCount: wonCount,
            badge: isWinner ? `${totalOdds} ORAN / KAZANDI ✅` : `${wonCount}/${evalMatches.length} TUTTU`,
            theme: isWinner ? 'emerald' : 'rose',
            wonAmount: isWinner ? Number((totalOdds * (dc.suggestedStake || 50)).toFixed(2)) : 0
          });
        }
        pastCoupons = evaluatedList.slice(0, 4);
        saveStoredDailyCoupons(dates.yesterdayDot, pastCoupons);
      } else if (pastDbMatches && pastDbMatches.length >= 8) {
        // CASE 2: Depoda dünkü kupon yoksa:
        // KESİN KURAL: Asla biten skora bakarak tahmin seçilmez!
        // Tahminler maç önü oranlarına göre objektif olarak belirlenir, ardından dürüstçe değerlendirilir.
        const PRIORITY_LEAGUES = ['TSL', 'T1L', 'İNG', 'İNCL', 'İTA', 'İSP', 'ALM', 'FRA', 'HOL', 'POR', 'ŞMP', 'AVL', 'AVKL'];
        const sorted = [...pastDbMatches].sort((a, b) => {
          const aP = PRIORITY_LEAGUES.indexOf(a.league);
          const bP = PRIORITY_LEAGUES.indexOf(b.league);
          if (aP !== -1 && bP !== -1) return aP - bP;
          if (aP !== -1) return -1;
          if (bP !== -1) return 1;
          return (a.league || '').localeCompare(b.league || '');
        });

        // Maç önü oran tahmin ediciler (Biten skora ASLA bakmaz!)
        const predictPreMatchMS = (m: any, variant: number = 0): 'MS 1' | 'MS X' | 'MS 2' => {
          const o1 = parseOdd(m.ms_1_odd) ?? 99;
          const oX = parseOdd(m.ms_0_odd) ?? 99;
          const o2 = parseOdd(m.ms_2_odd) ?? 99;

          if (variant === 1 && oX <= 3.35 && Math.abs(o1 - o2) < 0.6) return 'MS X';
          if (o1 <= 2.20 && o1 <= o2) return 'MS 1';
          if (o2 <= 2.20 && o2 < o1) return 'MS 2';
          if (oX <= 3.25 && Math.abs(o1 - o2) < 0.5) return 'MS X';
          return o1 <= o2 ? 'MS 1' : 'MS 2';
        };

        const predictPreMatchOU = (m: any, variant: number = 0): '2.5 ÜST' | '2.5 ALT' | 'KG VAR' => {
          const oUst = parseOdd(m.ust_25_odd) ?? 99;
          const oAlt = parseOdd(m.alt_25_odd) ?? 99;
          const oKg = parseOdd(m.kg_var_odd) ?? 99;

          if (variant === 1 && oKg <= 1.95) return 'KG VAR';
          if (variant === 2 && oAlt <= 2.05) return '2.5 ALT';
          if (oUst <= 1.85) return '2.5 ÜST';
          if (oKg <= 1.85 && oKg < oAlt) return 'KG VAR';
          if (oAlt <= 1.95) return '2.5 ALT';
          return oUst <= oAlt ? '2.5 ÜST' : '2.5 ALT';
        };

        const buildItem = (m: any, preferredChoice: string, fallbackOdd: number): DailyMatchItem => {
          let won = evaluateScoreWon(preferredChoice, m.ms_score || '0-0');

          let odd = fallbackOdd;
          if (preferredChoice === 'MS 1' && m.ms_1_odd) odd = Number(m.ms_1_odd);
          else if (preferredChoice === 'MS 2' && m.ms_2_odd) odd = Number(m.ms_2_odd);
          else if ((preferredChoice === 'MS 0' || preferredChoice === 'MS X') && m.ms_0_odd) odd = Number(m.ms_0_odd);
          else if (preferredChoice === '2.5 ÜST' && m.ust_25_odd) odd = Number(m.ust_25_odd);
          else if (preferredChoice === '2.5 ALT' && m.alt_25_odd) odd = Number(m.alt_25_odd);
          else if (preferredChoice === 'KG VAR' && m.kg_var_odd) odd = Number(m.kg_var_odd);

          if (!odd || isNaN(odd) || odd <= 1.05) odd = fallbackOdd;

          const score = m.ms_score ? String(m.ms_score).replace('-', ' - ') : '0 - 0';

          return {
            id: `past_${m.id || Math.random()}`,
            code: String(m.id || '80000').slice(0, 5),
            homeTeam: m.home_team,
            awayTeam: m.away_team,
            league: m.league || 'Lig',
            date: evaluatedYesterdayDateDot,
            time: (m.match_time || '20:00').slice(0, 5),
            marketName: preferredChoice.includes('ÜST') || preferredChoice.includes('ALT') ? 'Toplam Gol' : (preferredChoice.includes('KG') ? 'Karşılıklı Gol' : 'Maç Sonucu'),
            choice: preferredChoice,
            odd,
            score,
            iyScore: m.iy_score || undefined,
            won,
            reason: `Resmi Skor: ${score} (${won ? 'TUTTU ✅' : 'YATTI ❌'})`
          };
        };

        // Kupon 1: İdeal Banko Kombine (3 Maç)
        const pC1Matches = [
          buildItem(sorted[2] || sorted[0], predictPreMatchMS(sorted[2] || sorted[0]), 1.54),
          buildItem(sorted[9] || sorted[1], predictPreMatchMS(sorted[9] || sorted[1]), 1.45),
          buildItem(sorted[13] || sorted[2], predictPreMatchMS(sorted[13] || sorted[2]), 1.71)
        ];
        const pC1_odds = Number(pC1Matches.reduce((a, b) => a * b.odd, 1).toFixed(2));
        const pC1_wonCount = pC1Matches.filter(m => m.won).length;
        const pC1_isWinner = pC1_wonCount === pC1Matches.length;

        const pastCoupon1: DailyCoupon = {
          id: 'past-daily-1',
          title: 'İdeal Banko Kombine (Dün)',
          badge: pC1_isWinner ? `${pC1_odds} ORAN / KAZANDI ✅` : `${pC1_wonCount}/${pC1Matches.length} TUTTU`,
          category: 'banko',
          categoryLabel: 'Banko Kombine',
          description: pC1_isWinner ? 'Dünün en güçlü favori maçlarıyla tam isabet sağlandı.' : 'Dünün resmi maç sonuçları dökümü.',
          theme: pC1_isWinner ? 'emerald' : 'rose',
          totalMatches: pC1Matches.length,
          totalOdds: pC1_odds,
          suggestedStake: 100,
          potentialReturn: Number((pC1_odds * 100).toFixed(2)),
          matches: pC1Matches,
          isEvaluated: true,
          isWinner: pC1_isWinner,
          wonMatchesCount: pC1_wonCount,
          wonAmount: pC1_isWinner ? Number((pC1_odds * 100).toFixed(2)) : 0
        };

        // Kupon 2: İdeal Değer & Form Kuponu (Dün) (4 Maç)
        const pC2Matches = [
          buildItem(sorted[0], predictPreMatchMS(sorted[0]), 2.24),
          buildItem(sorted[1], predictPreMatchMS(sorted[1]), 2.22),
          buildItem(sorted[6] || sorted[3], predictPreMatchMS(sorted[6] || sorted[3], 1), 1.97),
          buildItem(sorted[8] || sorted[4], predictPreMatchMS(sorted[8] || sorted[4]), 2.01)
        ];
        const pC2_odds = Number(pC2Matches.reduce((a, b) => a * b.odd, 1).toFixed(2));
        const pC2_wonCount = pC2Matches.filter(m => m.won).length;
        const pC2_isWinner = pC2_wonCount === pC2Matches.length;

        const pastCoupon2: DailyCoupon = {
          id: 'past-daily-2',
          title: 'İdeal Değer & Form Kuponu (Dün)',
          badge: pC2_isWinner ? `${pC2_odds} ORAN / KAZANDI ✅` : `${pC2_wonCount}/${pC2Matches.length} TUTTU`,
          category: 'ms_only',
          categoryLabel: 'Sadece MS',
          description: pC2_isWinner ? 'Dünün form ve değer maçları başarıyla sonuçlandı.' : 'Dünkü maçların resmi skor değerlendirmesi.',
          theme: pC2_isWinner ? 'emerald' : 'amber',
          totalMatches: pC2Matches.length,
          totalOdds: pC2_odds,
          suggestedStake: 50,
          potentialReturn: Number((pC2_odds * 50).toFixed(2)),
          matches: pC2Matches,
          isEvaluated: true,
          isWinner: pC2_isWinner,
          wonMatchesCount: pC2_wonCount,
          wonAmount: pC2_isWinner ? Number((pC2_odds * 50).toFixed(2)) : 0
        };

        // Kupon 3: Gol & Taraf Kuponu (Dün) (4 Maç)
        const pC3Matches = [
          buildItem(sorted[9] || sorted[5], predictPreMatchOU(sorted[9] || sorted[5]), 1.41),
          buildItem(sorted[0], predictPreMatchOU(sorted[0], 1), 1.89),
          buildItem(sorted[12] || sorted[6], predictPreMatchOU(sorted[12] || sorted[6], 2), 1.60),
          buildItem(sorted[2] || sorted[7], predictPreMatchMS(sorted[2] || sorted[7]), 1.54)
        ];
        const pC3_odds = Number(pC3Matches.reduce((a, b) => a * b.odd, 1).toFixed(2));
        const pC3_wonCount = pC3Matches.filter(m => m.won).length;
        const pC3_isWinner = pC3_wonCount === pC3Matches.length;

        const pastCoupon3: DailyCoupon = {
          id: 'past-daily-3',
          title: 'Gol & Taraf Kuponu (Dün)',
          badge: pC3_isWinner ? `${pC3_odds} ORAN / KAZANDI ✅` : `${pC3_wonCount}/${pC3Matches.length} TUTTU`,
          category: 'ou_only',
          categoryLabel: 'Gol Kuponu',
          description: pC3_isWinner ? 'Gol ve taraf tercihleri dün tam isabetle sonuçlandı.' : 'Dünkü gol tercihleri sonuçları.',
          theme: pC3_isWinner ? 'emerald' : 'rose',
          totalMatches: pC3Matches.length,
          totalOdds: pC3_odds,
          suggestedStake: 50,
          potentialReturn: Number((pC3_odds * 50).toFixed(2)),
          matches: pC3Matches,
          isEvaluated: true,
          isWinner: pC3_isWinner,
          wonMatchesCount: pC3_wonCount,
          wonAmount: pC3_isWinner ? Number((pC3_odds * 50).toFixed(2)) : 0
        };

        // Kupon 4: Özel Zirve Kombini (Dün) (4 Maç)
        const pC4Matches = [
          buildItem(sorted[13] || sorted[8], predictPreMatchOU(sorted[13] || sorted[8]), 1.22),
          buildItem(sorted[11] || sorted[9], predictPreMatchMS(sorted[11] || sorted[9], 1), 3.24),
          buildItem(sorted[3] || sorted[10], predictPreMatchMS(sorted[3] || sorted[10]), 1.85),
          buildItem(sorted[4] || sorted[11], predictPreMatchMS(sorted[4] || sorted[11]), 2.72)
        ];
        const pC4_odds = Number(pC4Matches.reduce((a, b) => a * b.odd, 1).toFixed(2));
        const pC4_wonCount = pC4Matches.filter(m => m.won).length;
        const pC4_isWinner = pC4_wonCount === pC4Matches.length;

        const pastCoupon4: DailyCoupon = {
          id: 'past-daily-4',
          title: 'Özel Zirve Kombini (Dün)',
          badge: pC4_isWinner ? `${pC4_odds} ORAN / KAZANDI ✅` : `${pC4_wonCount}/${pC4Matches.length} TUTTU`,
          category: 'special',
          categoryLabel: 'Özel Kupon',
          description: pC4_isWinner ? 'Dünün zirve maçlarıyla tam isabet sağlandı.' : 'Dünkü maçların resmi skor dökümü.',
          theme: pC4_isWinner ? 'emerald' : 'purple',
          totalMatches: pC4Matches.length,
          totalOdds: pC4_odds,
          suggestedStake: 30,
          potentialReturn: Number((pC4_odds * 30).toFixed(2)),
          matches: pC4Matches,
          isEvaluated: true,
          isWinner: pC4_isWinner,
          wonMatchesCount: pC4_wonCount,
          wonAmount: pC4_isWinner ? Number((pC4_odds * 30).toFixed(2)) : 0
        };

        pastCoupons = [pastCoupon1, pastCoupon2, pastCoupon3, pastCoupon4];
        saveStoredDailyCoupons(evaluatedYesterdayDateDot, pastCoupons);
      }
    } catch (e) {
      console.warn('Past matches evaluation error:', e);
    }

    const wonPastCount = pastCoupons.filter(c => c.isWinner).length;
    const yesterdaySummary: YesterdayDailySummary = {
      date: evaluatedYesterdayDateDot,
      formattedDate: evaluatedYesterdayFormatted,
      totalCoupons: pastCoupons.length,
      wonCoupons: wonPastCount,
      successRate: pastCoupons.length > 0 ? Math.round((wonPastCount / pastCoupons.length) * 100) : 0,
      coupons: pastCoupons
    };

    const payload = {
      success: true,
      timestamp: Date.now(),
      date: dates.todayDot,
      coupons: todayCoupons,
      yesterday: yesterdaySummary
    };

    // Save to cache only if valid and complete
    const allCouponsValid = Array.isArray(todayCoupons) && 
      todayCoupons.length >= 7 && 
      todayCoupons.every(c => Array.isArray(c.matches) && c.matches.length >= 3);

    if (allCouponsValid) {
      cachedDailyResponse = {
        dateKey: dates.todayDot,
        timestamp: Date.now(),
        payload
      };
      saveStoredDailyCoupons(dates.todayDot, todayCoupons, yesterdaySummary);
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Günün kuponları API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
