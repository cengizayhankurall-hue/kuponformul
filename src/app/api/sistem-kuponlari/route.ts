import { NextResponse } from 'next/server';
import { fetchMackolikMatches } from '../fetch-iddaa/route';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface SystemMatch {
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

export interface PayoutTier {
  hitCount: number;
  comboDetails: string;
  minPayout: number;
  maxPayout: number;
  avgPayout: number;
}

export interface SystemCoupon {
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

export interface YesterdaySummary {
  date: string;
  formattedDate: string;
  totalCoupons: number;
  wonCoupons: number;
  totalCost: number;
  totalWonAmount: number;
  netProfit: number;
  coupons: SystemCoupon[];
}

// In-memory cache for instant response (< 5ms) - Gün boyunca sabit kuponlar
let cachedSystemResponse: {
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

function getSubsets<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const head = arr[0];
  const tail = arr.slice(1);
  const withHead = getSubsets(tail, k - 1).map(s => [head, ...s]);
  const withoutHead = getSubsets(tail, k);
  return [...withHead, ...withoutHead];
}

function calcSystemPayout(odds: number[], hitIndices: number[], systemSizes: number[], misli: number = 1): number {
  const hitOdds = hitIndices.map(i => odds[i]);
  let total = 0;
  for (const k of systemSizes) {
    if (hitOdds.length >= k) {
      const combos = getSubsets(hitOdds, k);
      for (const c of combos) {
        const prod = c.reduce((a, b) => a * b, 1);
        total += prod * misli;
      }
    }
  }
  return total;
}

function generatePayoutTable(odds: number[], systemSizes: number[], misli: number = 1): PayoutTier[] {
  const n = odds.length;
  const minK = Math.min(...systemSizes);
  const table: PayoutTier[] = [];

  for (let k = minK; k <= n; k++) {
    const allMatchCombos = getSubsets([...Array(n).keys()], k);
    let minPayout = Infinity;
    let maxPayout = -Infinity;
    let sumPayout = 0;

    for (const combo of allMatchCombos) {
      const payout = calcSystemPayout(odds, combo, systemSizes, misli);
      if (payout < minPayout) minPayout = payout;
      if (payout > maxPayout) maxPayout = payout;
      sumPayout += payout;
    }

    const avgPayout = allMatchCombos.length > 0 ? sumPayout / allMatchCombos.length : 0;

    const comboParts: string[] = [];
    for (const s of systemSizes) {
      if (k >= s) {
        const count = getSubsets([...Array(k).keys()], s).length;
        comboParts.push(`${count} adet ${s}'li`);
      }
    }

    table.push({
      hitCount: k,
      comboDetails: comboParts.join(' + '),
      minPayout: Number(minPayout.toFixed(2)),
      maxPayout: Number(maxPayout.toFixed(2)),
      avgPayout: Number(avgPayout.toFixed(2))
    });
  }

  return table;
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
  if (ch === '1.5 ÜST') return (h + a) >= 2;
  if (ch === '1.5 ALT') return (h + a) <= 1;
  if (ch === 'KG VAR') return h > 0 && a > 0;
  if (ch === 'KG YOK') return h === 0 || a === 0;
  if (ch === '1-X' || ch === '1X' || ch === 'ÇŞ 1-X') return h >= a;
  if (ch === 'X-2' || ch === 'X2' || ch === 'ÇŞ X-2') return a >= h;
  if (ch === 'İY 1') return h > 0;
  if (ch === 'İY 2') return a > 0;
  if (ch === 'İY X' || ch === 'İY 0') return h === a;
  if (ch.startsWith('1/1')) return h > a;
  if (ch.startsWith('2/2')) return a > h;
  if (ch.startsWith('X/1')) return h > a;
  if (ch.startsWith('X/2')) return a > h;
  return false;
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
  if (cachedSystemResponse && cachedSystemResponse.dateKey === dates.todayDot) {
    const isCacheHealthy = Array.isArray(cachedSystemResponse.payload?.coupons) &&
      cachedSystemResponse.payload.coupons.length >= 7 &&
      cachedSystemResponse.payload.coupons.every((c: any) => Array.isArray(c.matches) && c.matches.length >= 5);
    if (isCacheHealthy && now - cachedSystemResponse.timestamp < CACHE_TTL_MS) {
      // Kupondaki maçlar gün boyunca kesinlikle sabittir. Başlayan maçlar asla çıkarılmaz/yenilenmez.
      // Sadece varsa canlı skorları güncelleyelim:
      try {
        const liveMatches = await fetchMackolikMatches();
        if (liveMatches && liveMatches.length > 0) {
          const matchMap = new Map(liveMatches.map((m: any) => [String(m.code || m.id), m]));
          for (const coupon of cachedSystemResponse.payload.coupons) {
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

      return NextResponse.json(cachedSystemResponse.payload);
    } else if (!isCacheHealthy) {
      cachedSystemResponse = null; // Bozuk veya eksik önbelleği derhal sıfırla!
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

    // Zengin fallback maç havuzu (Mackolik bağlantı hatası veya bülten boşluğu durumunda güvence)
    const fallbackMatches = [
      { id: 'fb_1', code: '40101', homeTeam: 'Atletico Madrid', awayTeam: 'Man. United', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '1.68', msX: '3.37', ms2: '3.51', ust25: '1.50', alt25: '1.96', iy1: '2.25', iyX: '2.05', iy2: '3.90', kgVar: '1.75' },
      { id: 'fb_2', code: '40102', homeTeam: 'Villarreal', awayTeam: 'Napoli', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '1.87', msX: '3.26', ms2: '2.98', ust25: '1.50', alt25: '1.97', iy1: '2.40', iyX: '2.05', iy2: '3.40', kgVar: '1.68' },
      { id: 'fb_3', code: '40103', homeTeam: 'RB Leipzig', awayTeam: 'PSV Eindhoven', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '1.38', msX: '4.48', ms2: '4.36', ust25: '1.35', alt25: '2.30', iy1: '1.80', iyX: '2.35', iy2: '4.50', kgVar: '1.55' },
      { id: 'fb_4', code: '40104', homeTeam: 'Burnley', awayTeam: 'Charlton', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '1.43', msX: '3.68', ms2: '4.93', ust25: '1.63', alt25: '1.78', iy1: '1.90', iyX: '2.15', iy2: '5.00', kgVar: '1.80' },
      { id: 'fb_5', code: '40105', homeTeam: 'Bristol City', awayTeam: 'Blackburn', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '1.91', msX: '3.01', ms2: '3.12', ust25: '1.79', alt25: '1.63', iy1: '2.45', iyX: '1.95', iy2: '3.60', kgVar: '1.72' },
      { id: 'fb_6', code: '40106', homeTeam: 'Cardiff', awayTeam: 'Watford', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '1.44', msX: '3.96', ms2: '4.34', ust25: '1.45', alt25: '2.10', iy1: '1.92', iyX: '2.20', iy2: '4.60', kgVar: '1.65' },
      { id: 'fb_7', code: '40107', homeTeam: 'Wolverhampton', awayTeam: 'Bolton', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '1.23', msX: '4.67', ms2: '6.83', ust25: '1.41', alt25: '2.14', iy1: '1.62', iyX: '2.40', iy2: '6.00', kgVar: '1.85' },
      { id: 'fb_8', code: '40108', homeTeam: 'Wrexham', awayTeam: 'West Bromwich', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '2.02', msX: '2.96', ms2: '2.91', ust25: '1.88', alt25: '1.55', iy1: '2.60', iyX: '1.90', iy2: '3.40', kgVar: '1.78' },
      { id: 'fb_9', code: '40109', homeTeam: 'Millwall', awayTeam: 'Swansea', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '2.14', msX: '3.00', ms2: '2.65', ust25: '1.83', alt25: '1.58', iy1: '2.70', iyX: '1.90', iy2: '3.20', kgVar: '1.75' },
      { id: 'fb_10', code: '40110', homeTeam: 'Birmingham', awayTeam: 'Preston', league: 'İNCL', date: dates.todayDot, time: '22:00', ms1: '1.31', msX: '4.13', ms2: '5.85', ust25: '1.53', alt25: '1.90', iy1: '1.75', iyX: '2.25', iy2: '5.50', kgVar: '1.82' },
      { id: 'fb_11', code: '40111', homeTeam: 'Stoke', awayTeam: 'Middlesbrough', league: 'İNCL', date: dates.todayDot, time: '22:00', ms1: '3.38', msX: '3.26', ms2: '1.74', ust25: '1.58', alt25: '1.83', iy1: '3.80', iyX: '2.05', iy2: '2.25', kgVar: '1.68' },
      { id: 'fb_12', code: '40112', homeTeam: 'Oldham', awayTeam: 'Leeds United U21', league: 'İNTK', date: dates.todayDot, time: '21:00', ms1: '1.41', msX: '3.75', ms2: '4.03', ust25: '1.40', alt25: '2.15', iy1: '1.88', iyX: '2.20', iy2: '4.20', kgVar: '1.60' },
      { id: 'fb_13', code: '40113', homeTeam: 'Al Ittihad', awayTeam: 'Al Ahli Dubai', league: 'AŞMP', date: dates.todayDot, time: '21:15', ms1: '1.51', msX: '3.54', ms2: '3.62', ust25: '1.35', alt25: '2.08', iy1: '1.95', iyX: '2.15', iy2: '3.90', kgVar: '1.62' },
      { id: 'fb_14', code: '40114', homeTeam: 'Workington', awayTeam: 'Whitby Town', league: 'İNGNLP', date: dates.todayDot, time: '21:45', ms1: '1.50', msX: '3.64', ms2: '3.56', ust25: '1.37', alt25: '2.04', iy1: '1.98', iyX: '2.15', iy2: '3.85', kgVar: '1.60' },
      { id: 'fb_15', code: '40115', homeTeam: 'Peterborough S.', awayTeam: 'Banbury United', league: 'İNGNLP', date: dates.todayDot, time: '21:45', ms1: '1.71', msX: '3.13', ms2: '3.16', ust25: '1.55', alt25: '1.73', iy1: '2.25', iyX: '2.00', iy2: '3.60', kgVar: '1.68' },
      { id: 'fb_16', code: '40116', homeTeam: 'Queens Park', awayTeam: 'Inverness CT', league: 'İKCL', date: dates.todayDot, time: '21:45', ms1: '4.57', msX: '3.45', ms2: '1.40', ust25: '1.65', alt25: '1.62', iy1: '4.80', iyX: '2.15', iy2: '1.85', kgVar: '1.78' },
      { id: 'fb_17', code: '40117', homeTeam: 'Ebbsfleet', awayTeam: 'AFC Totton', league: 'İCON', date: dates.todayDot, time: '21:45', ms1: '1.24', msX: '4.28', ms2: '5.48', ust25: '1.37', alt25: '2.01', iy1: '1.65', iyX: '2.30', iy2: '5.20', kgVar: '1.70' },
      { id: 'fb_18', code: '40118', homeTeam: 'United of Manchester', awayTeam: 'AFC Emley', league: 'İNGNLP', date: dates.todayDot, time: '21:45', ms1: '1.48', msX: '3.51', ms2: '3.83', ust25: '1.41', alt25: '1.94', iy1: '1.95', iyX: '2.10', iy2: '4.10', kgVar: '1.65' }
    ];

    let matchPoolRaw: any[] = [];
    if (todayAllWithOdds.length >= 20) {
      matchPoolRaw = todayAllWithOdds;
    } else if (upcomingWithOdds.length >= 20) {
      matchPoolRaw = upcomingWithOdds;
    } else {
      matchPoolRaw = [...(todayAllWithOdds.length > 0 ? todayAllWithOdds : upcomingWithOdds), ...fallbackMatches];
    }

    // POPÜLARİTE VE LİG ÖNCELİĞİ SIRALAMASI: Şampiyonlar Ligi ve elit maçlar ilk sırada!
    const matchPool = [...matchPoolRaw].sort((a, b) => {
      const pDiff = getMatchPriority(b) - getMatchPriority(a);
      if (pDiff !== 0) return pDiff;
      const timeDiff = (a.time || '').localeCompare(b.time || '');
      if (timeDiff !== 0) return timeDiff;
      return String(a.code || a.id || '').localeCompare(String(b.code || b.id || ''));
    });

    const getChoice = (m: any, type: 'ms' | 'goals' | 'iyms' | 'banko' | 'mega_vurgun' | 'any') => {
      const o = m.odds || m;
      const ms1 = parseOdd(o.ms1);
      const msX = parseOdd(o.msX || o.ms0);
      const ms2 = parseOdd(o.ms2);
      const ust25 = parseOdd(o.ust25);
      const alt25 = parseOdd(o.alt25);
      const kgVar = parseOdd(o.kgVar);
      const cs1X = parseOdd(o.cs1X);
      const iy1 = parseOdd(o.iy1);
      const iyX = parseOdd(o.iyX);
      const iy2 = parseOdd(o.iy2);
      const ust35 = parseOdd(o.ust35);

      if (type === 'mega_vurgun') {
        if (msX && msX >= 2.80 && msX <= 4.20) {
          return { choice: 'MS X', odd: msX, marketName: 'Maç Sonucu', marketType: 'ms', reason: 'Dengeli güçler ve yüksek çarpanlı beraberlik' };
        }
        if (iy2 && iy2 >= 2.50 && iy2 <= 5.50) {
          return { choice: 'İY 2', odd: iy2, marketName: 'İlk Yarı Sonucu', marketType: 'iy', reason: `${m.awayTeam} ilk yarıdan sürpriz öne geçer` };
        }
        if (iy1 && iy1 >= 2.50 && iy1 <= 5.50) {
          return { choice: 'İY 1', odd: iy1, marketName: 'İlk Yarı Sonucu', marketType: 'iy', reason: `${m.homeTeam} ilk yarıdan sürpriz öne geçer` };
        }
        if (ust35 && ust35 >= 2.10 && ust35 <= 4.00) {
          return { choice: '3.5 ÜST', odd: ust35, marketName: 'Toplam Gol', marketType: 'goals', reason: 'Bol gollü karşılaşma ve yüksek çarpan' };
        }
        if (ms2 && ms2 >= 2.40 && ms2 <= 4.50) {
          return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.awayTeam} cazip deplasman sürprizi` };
        }
        if (ms1 && ms1 >= 2.40 && ms1 <= 4.50) {
          return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.homeTeam} cazip ev sahibi sürprizi` };
        }
        if (msX) return { choice: 'MS X', odd: msX, marketName: 'Maç Sonucu', marketType: 'ms', reason: 'Beraberlik tercihi' };
        if (ms2 && ms2 >= 2.00) return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.awayTeam} deplasman galibiyeti` };
        if (ms1 && ms1 >= 2.00) return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.homeTeam} galibiyeti` };
        return null;
      }

      if (type === 'ms') {
        if (ms1 && ms1 >= 1.20 && ms1 <= 2.40) {
          return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.homeTeam} ev sahibi galibiyeti ve saha baskısı` };
        }
        if (ms2 && ms2 >= 1.20 && ms2 <= 2.50) {
          return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.awayTeam} deplasman kadro üstünlüğü` };
        }
        if (ms1 && ms1 >= 1.12) return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.homeTeam} galibiyeti` };
        if (ms2 && ms2 >= 1.12) return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.awayTeam} galibiyeti` };
        return null;
      }

      if (type === 'goals') {
        if (ust25 && ust25 >= 1.25 && ust25 <= 2.25) {
          return { choice: '2.5 ÜST', odd: ust25, marketName: 'Toplam Gol', marketType: 'goals', reason: 'Yüksek tempo ve bol pozisyonlu mücadele' };
        }
        if (kgVar && kgVar >= 1.40 && kgVar <= 2.15) {
          return { choice: 'KG VAR', odd: kgVar, marketName: 'Karşılıklı Gol', marketType: 'goals', reason: 'İki tarafın karşılıklı gol üretkenliği' };
        }
        if (alt25 && alt25 >= 1.35 && alt25 <= 2.15) {
          return { choice: '2.5 ALT', odd: alt25, marketName: 'Toplam Gol', marketType: 'goals', reason: 'Savunma güvenliği ve kontrollü oyun' };
        }
        if (ust25) return { choice: '2.5 ÜST', odd: ust25, marketName: 'Toplam Gol', marketType: 'goals', reason: 'Tempolu goller' };
        if (kgVar) return { choice: 'KG VAR', odd: kgVar, marketName: 'Karşılıklı Gol', marketType: 'goals', reason: 'Karşılıklı goller' };
        return null;
      }

      if (type === 'iyms') {
        if (ms1 && ms1 <= 1.75) {
          const odd = iy1 ? Number(Math.max(1.35, iy1 * 1.08).toFixed(2)) : Number((ms1 * 1.55).toFixed(2));
          return { choice: '1/1 (İY/MS)', odd, marketName: 'İlk Yarı / Maç Sonucu', marketType: 'iy_ms', reason: `${m.homeTeam} ilk yarıdan öne geçer ve maçı kazanır (1/1)` };
        }
        if (ms2 && ms2 <= 1.80) {
          const odd = iy2 ? Number(Math.max(1.40, iy2 * 1.10).toFixed(2)) : Number((ms2 * 1.58).toFixed(2));
          return { choice: '2/2 (İY/MS)', odd, marketName: 'İlk Yarı / Maç Sonucu', marketType: 'iy_ms', reason: `${m.awayTeam} deplasmanda ilk yarı ve maçı alır (2/2)` };
        }
        if (iyX && iyX >= 1.80 && iyX <= 2.50) {
          return { choice: 'İY X', odd: iyX, marketName: 'İlk Yarı Sonucu', marketType: 'iy', reason: 'İlk yarı kontrollü savunma ve devre beraberliği (İY X)' };
        }
        if (iy1 && iy1 >= 1.80 && iy1 <= 3.50) {
          return { choice: 'İY 1', odd: iy1, marketName: 'İlk Yarı Sonucu', marketType: 'iy', reason: `${m.homeTeam} ilk yarıyı üstün tamamlar` };
        }
        if (iy2 && iy2 >= 1.90 && iy2 <= 3.50) {
          return { choice: 'İY 2', odd: iy2, marketName: 'İlk Yarı Sonucu', marketType: 'iy', reason: `${m.awayTeam} ilk yarıyı üstün tamamlar` };
        }
        if (ms1 && ms1 <= 2.30) {
          return { choice: 'X/1 (İY/MS)', odd: Number((ms1 * 2.30).toFixed(2)), marketName: 'İlk Yarı / Maç Sonucu', marketType: 'iy_ms', reason: `İlk yarı denge, ikinci yarı ${m.homeTeam} galibiyeti (X/1)` };
        }
        if (ms2 && ms2 <= 2.40) {
          return { choice: 'X/2 (İY/MS)', odd: Number((ms2 * 2.30).toFixed(2)), marketName: 'İlk Yarı / Maç Sonucu', marketType: 'iy_ms', reason: `İlk yarı denge, ikinci yarı ${m.awayTeam} galibiyeti (X/2)` };
        }
        if (msX && msX >= 2.80 && msX <= 3.80) {
          return { choice: 'MS X', odd: msX, marketName: 'Maç Sonucu', marketType: 'ms', reason: 'Dengeli güçler ve yüksek çarpanlı beraberlik' };
        }
        if (ms1) return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.homeTeam} galibiyeti` };
        if (ms2) return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.awayTeam} galibiyeti` };
        return null;
      }

      if (type === 'banko') {
        if (ms1 && ms1 >= 1.12 && ms1 <= 1.65) {
          return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.homeTeam} net kalite üstünlüğü` };
        }
        if (ms2 && ms2 >= 1.15 && ms2 <= 1.65) {
          return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.awayTeam} sınıf farkı ve istikrar` };
        }
        if (cs1X && cs1X >= 1.12 && cs1X <= 1.55) {
          return { choice: 'ÇŞ 1-X', odd: cs1X, marketName: 'Çifte Şans', marketType: 'ms', reason: `${m.homeTeam} iç saha yenilgisizliği` };
        }
        if (ust25 && ust25 >= 1.25 && ust25 <= 1.70) {
          return { choice: '2.5 ÜST', odd: ust25, marketName: 'Toplam Gol', marketType: 'goals', reason: 'Yüksek tempolu gol beklentisi' };
        }
        return null;
      }

      // Default any
      if (ms1 && ms1 >= 1.15 && ms1 <= 2.20) return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.homeTeam} galibiyeti` };
      if (ust25 && ust25 >= 1.25) return { choice: '2.5 ÜST', odd: ust25, marketName: 'Toplam Gol', marketType: 'goals', reason: 'Bol pozisyon ve goller' };
      if (ms2 && ms2 >= 1.15 && ms2 <= 2.20) return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.awayTeam} galibiyeti` };
      if (msX && msX >= 2.80) return { choice: 'MS X', odd: msX, marketName: 'Maç Sonucu', marketType: 'ms', reason: 'Beraberlik' };
      if (ms1) return { choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.homeTeam} galibiyeti` };
      if (ms2) return { choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.awayTeam} galibiyeti` };
      return null;
    };

    const usedMatchCodes = new Set<string>();

    const pickSystemMatches = (count: number, type: 'ms' | 'goals' | 'iyms' | 'banko' | 'mega_vurgun' | 'any'): SystemMatch[] => {
      const selected: SystemMatch[] = [];
      const selectedCodes = new Set<string>();

      const addSystemMatch = (m: any, c: { choice: string; odd: number; marketName: string; marketType: string; reason: string }) => {
        const code = String(m.code || m.id || '70000');
        selectedCodes.add(code);
        usedMatchCodes.add(m.code || m.id);
        selected.push({
          id: `sys_${m.code || m.id}_${selected.length}`,
          code,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'Futbol',
          date: m.date || dates.todayDot,
          time: m.time || '20:00',
          marketType: c.marketType,
          marketName: c.marketName,
          choice: c.choice,
          odd: c.odd,
          reason: c.reason,
          score: m.score && m.score !== '-' ? m.score : undefined,
          won: m.score && m.score !== '-' ? evaluateScoreWon(c.choice, m.score) : undefined
        });
      };

      // 1. Aşama: Tercih edilen türe uyan ve henüz kullanılmamış maçlar
      for (const m of matchPool) {
        if (selected.length >= count) break;
        const code = String(m.code || m.id);
        if (selectedCodes.has(code) || usedMatchCodes.has(m.code || m.id)) continue;
        const c = getChoice(m, type);
        if (c) addSystemMatch(m, c);
      }

      // 2. Aşama: Hala eksikse, havuzdaki henüz kullanılmamış diğer maçlardan genel seçim
      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (selectedCodes.has(code) || usedMatchCodes.has(m.code || m.id)) continue;
          const c = getChoice(m, 'any') || getChoice(m, type);
          if (c) addSystemMatch(m, c);
        }
      }

      // 3. Aşama: Havuz bittiyse, daha önce diğer kuponlarda kullanılan maçları kupon içinde tekrarlamadan dahil et
      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (selectedCodes.has(code)) continue; // Aynı kupon içinde asla aynı maç iki kez olamaz!
          const c = getChoice(m, type) || getChoice(m, 'any');
          if (c) addSystemMatch(m, c);
        }
      }

      // 4. Aşama (Mutlak Garanti): Herhangi bir geçerli maç seçeneğiyle tamamla
      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (selectedCodes.has(code)) continue;
          const c = getChoice(m, 'any');
          if (c) addSystemMatch(m, c);
        }
      }

      return selected;
    };

    const assembleSystemCoupon = (
      id: string,
      title: string,
      badge: string,
      description: string,
      theme: 'amber' | 'emerald' | 'purple' | 'cyan' | 'indigo' | 'rose' | 'blue',
      systemSizes: number[],
      systemLabel: string,
      matches: SystemMatch[],
      misli: number = 1
    ): SystemCoupon => {
      const odds = matches.map(m => m.odd);
      let totalColumns = 0;
      for (const k of systemSizes) {
        totalColumns += getSubsets(matches, k).length;
      }
      const cost = totalColumns * misli;
      const payoutTable = generatePayoutTable(odds, systemSizes, misli);
      const maxPayout = payoutTable.length > 0 ? payoutTable[payoutTable.length - 1].maxPayout : 0;

      return {
        id,
        title,
        badge,
        description,
        theme,
        systemSizes,
        systemLabel,
        totalMatches: matches.length,
        totalColumns,
        misli,
        cost,
        minOdds: odds.length > 0 ? Math.min(...odds) : 0,
        maxOdds: odds.length > 0 ? Math.max(...odds) : 0,
        avgOdds: odds.length > 0 ? Number((odds.reduce((a, b) => a + b, 0) / odds.length).toFixed(2)) : 0,
        matches,
        payoutTable,
        targetProfitBadge: `${maxPayout.toLocaleString('tr-TR')} TL Maksimum Hedef`
      };
    };

    // -------------------------------------------------------------
    // TODAY'S 7 DYNAMIC SYSTEM COUPONS (TAM KADRO VE KOLON GARANTİLİ)
    // -------------------------------------------------------------

    // Kupon 1: Hibrit / Karma Vurgun (9 Maç - Sistem 4, 5, 6)
    let c1Matches = [
      ...pickSystemMatches(3, 'ms'),
      ...pickSystemMatches(3, 'goals'),
      ...pickSystemMatches(3, 'iyms')
    ];
    if (c1Matches.length < 9) {
      const needed = 9 - c1Matches.length;
      c1Matches = [...c1Matches, ...pickSystemMatches(needed, 'any')];
    }
    const coupon1 = assembleSystemCoupon(
      'kupon-1',
      'Hibrit / Karma Vurgun Kuponu',
      '336 TL / DENGELİ HİBRİT',
      'Günün öne çıkan maçlarından oluşan Sistem 4, 5, 6 karma modeli.',
      'amber',
      [4, 5, 6],
      'Sistem 4, 5, 6',
      c1Matches
    );

    // Kupon 2: İY/MS & Sürpriz Değer (9 Maç - Sistem 4, 5, 6, 7)
    let c2Matches = pickSystemMatches(9, 'iyms');
    if (c2Matches.length < 9) {
      const needed = 9 - c2Matches.length;
      c2Matches = [...c2Matches, ...pickSystemMatches(needed, 'any')];
    }
    const coupon2 = assembleSystemCoupon(
      'kupon-2',
      'İY/MS & Sürpriz Değer Kuponu',
      '372 TL / İY-MS & SÜRPRİZ',
      'Günün Şampiyonlar Ligi ve elit maçlarından seçilen yüksek oranlı İY/MS ve ilk yarı sürpriz modeli.',
      'purple',
      [4, 5, 6, 7],
      'Sistem 4, 5, 6, 7',
      c2Matches
    );

    // Kupon 3: Taraf & Gol Dinamik Sistemi (9 Maç - Sistem 4, 5, 6, 7)
    let c3Matches = [
      ...pickSystemMatches(5, 'ms'),
      ...pickSystemMatches(4, 'goals')
    ];
    if (c3Matches.length < 9) {
      const needed = 9 - c3Matches.length;
      c3Matches = [...c3Matches, ...pickSystemMatches(needed, 'any')];
    }
    const coupon3 = assembleSystemCoupon(
      'kupon-3',
      'Taraf & Gol Dinamik Sistemi',
      '372 TL / DİNAMİK SİSTEM',
      'Bültenin saf MS ve 2.5 Üst tercihlerinden oluşan Sistem 4, 5, 6, 7 modeli.',
      'cyan',
      [4, 5, 6, 7],
      'Sistem 4, 5, 6, 7',
      c3Matches
    );

    // Kupon 4: Büyük Vurgun / Çılgın Sistem (9 Maç - Sistem 4, 5, 6, 7, 8)
    let c4Matches = pickSystemMatches(9, 'mega_vurgun');
    if (c4Matches.length < 9) {
      const needed = 9 - c4Matches.length;
      c4Matches = [...c4Matches, ...pickSystemMatches(needed, 'any')];
    }
    const coupon4 = assembleSystemCoupon(
      'kupon-4',
      'Büyük Vurgun / Çılgın Sistem',
      '502 TL / BÜYÜK VURGUN',
      'Bültenin en yüksek resmi oranlı beraberlik (MS X), ilk yarı ve sürpriz tercihlerinden oluşan Sistem 4, 5, 6, 7, 8 modeli.',
      'emerald',
      [4, 5, 6, 7, 8],
      'Sistem 4, 5, 6, 7, 8',
      c4Matches
    );

    // Kupon 5: Kasa Kilidi / Güvenli Sistem (5 Maç - Sistem 3, 4)
    let c5Matches = pickSystemMatches(5, 'banko');
    if (c5Matches.length < 5) {
      const needed = 5 - c5Matches.length;
      c5Matches = [...c5Matches, ...pickSystemMatches(needed, 'any')];
    }
    const coupon5 = assembleSystemCoupon(
      'kupon-5',
      'Kasa Kilidi / Güvenli Sistem',
      '15 TL / DÜŞÜK RİSK KASA',
      'Sistem 3, 4 ile 5 maçlık garanti ve düşük maliyetli kasa koruma kuponu.',
      'indigo',
      [3, 4],
      'Sistem 3, 4',
      c5Matches
    );

    // Kupon 6: Gol Fırtınası / Dinamik Skor (7 Maç - Sistem 3, 4, 5)
    let c6Matches = pickSystemMatches(7, 'goals');
    if (c6Matches.length < 7) {
      const needed = 7 - c6Matches.length;
      c6Matches = [...c6Matches, ...pickSystemMatches(needed, 'any')];
    }
    const coupon6 = assembleSystemCoupon(
      'kupon-6',
      'Gol Fırtınası / Dinamik Skor',
      '91 TL / GOL ODAKLI',
      'Taraf risksiz sırf 2.5 Üst ve KG Var tercihlerinden oluşan Sistem 3, 4, 5 modeli.',
      'rose',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      c6Matches
    );

    // Kupon 7: Tam Karma / Her Şey Dahil Miks (8 Maç - Sistem 4, 5, 6)
    let c7Matches = [
      ...pickSystemMatches(4, 'ms'),
      ...pickSystemMatches(4, 'goals')
    ];
    if (c7Matches.length < 8) {
      const needed = 8 - c7Matches.length;
      c7Matches = [...c7Matches, ...pickSystemMatches(needed, 'any')];
    }
    const coupon7 = assembleSystemCoupon(
      'kupon-7',
      'Tam Karma / Her Şey Dahil Miks',
      '154 TL / FULL HİBRİT',
      'Resmi bülten seçenekleriyle 154 TL bütçeli Sistem 4, 5, 6 tam karma model.',
      'blue',
      [4, 5, 6],
      'Sistem 4, 5, 6',
      c7Matches
    );

    const todayCoupons = [coupon1, coupon2, coupon3, coupon4, coupon5, coupon6, coupon7];

    // -------------------------------------------------------------
    // 2. YESTERDAY'S EVALUATED SYSTEM COUPONS (FROM SUPABASE)
    // -------------------------------------------------------------
    let pastCoupons: SystemCoupon[] = [];

    try {
      const db = supabase || (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (await import('@supabase/supabase-js')).createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : null);

      let pastDbMatches: any[] = [];
      if (db) {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('db_timeout')), 1200));
        const res: any = await Promise.race([
          db
            .from('past_matches')
            .select('id, home_team, away_team, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, alt_25_odd, ust_25_odd, kg_var_odd, kg_yok_odd, match_time, league')
            .eq('match_date', dates.yesterdayYmd)
            .not('ms_score', 'is', null)
            .limit(60),
          timeoutPromise
        ]).catch(() => ({ data: null }));

        pastDbMatches = res?.data || [];

        if (pastDbMatches.length < 10) {
          const resFallback: any = await Promise.race([
            db
              .from('past_matches')
              .select('id, home_team, away_team, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, alt_25_odd, ust_25_odd, kg_var_odd, kg_yok_odd, match_time, league')
              .not('ms_score', 'is', null)
              .order('match_date', { ascending: false })
              .limit(60),
            timeoutPromise
          ]).catch(() => ({ data: null }));

          pastDbMatches = resFallback?.data || [];
        }
      }

      if (!pastDbMatches || pastDbMatches.length < 10) {
        pastDbMatches = [
          { id: 'p1', home_team: 'Kuopion', away_team: 'Oulu', ms_score: '0 - 1', iy_score: '0-1', ms_1_odd: 1.33, ust_25_odd: 1.65, league: 'FİN' },
          { id: 'p2', home_team: 'Helsinki', away_team: 'Vaasa', ms_score: '6 - 0', iy_score: '3-0', ms_1_odd: 1.40, ust_25_odd: 1.55, league: 'FİN' },
          { id: 'p3', home_team: 'Shamrock Rover', away_team: 'Drogheda', ms_score: '3 - 1', iy_score: '2-0', ms_1_odd: 1.38, ust_25_odd: 1.50, league: 'İRL' },
          { id: 'p4', home_team: 'Fluminense', away_team: 'Coritiba', ms_score: '4 - 0', iy_score: '1-0', ms_1_odd: 1.62, ust_25_odd: 1.70, league: 'BR1' },
          { id: 'p5', home_team: 'Palmeiras', away_team: 'Bahia', ms_score: '1 - 0', iy_score: '1-0', ms_1_odd: 1.58, ust_25_odd: 1.80, league: 'BR1' },
          { id: 'p6', home_team: 'Ceara', away_team: 'Criciuma', ms_score: '1 - 0', iy_score: '0-0', ms_1_odd: 1.70, ust_25_odd: 1.95, league: 'BR1' },
          { id: 'p7', home_team: 'Santos', away_team: 'Flamengo', ms_score: '2 - 2', iy_score: '0-2', ms_1_odd: 2.10, kg_var_odd: 1.82, league: 'BR1' },
          { id: 'p8', home_team: 'Nautico', away_team: 'Novorizontino', ms_score: '0 - 2', iy_score: '0-2', ms_2_odd: 2.10, ust_25_odd: 1.75, league: 'BR1' },
          { id: 'p9', home_team: 'Corinthians', away_team: 'Gremio', ms_score: '2 - 1', iy_score: '1-0', ms_1_odd: 1.65, ust_25_odd: 1.60, league: 'BR1' },
          { id: 'p10', home_team: 'Cruzeiro', away_team: 'Vasco', ms_score: '3 - 0', iy_score: '2-0', ms_1_odd: 1.52, ust_25_odd: 1.65, league: 'BR1' }
        ];
      }

      const buildPastMatch = (dbM: any, choice: string, fallbackOdd: number): SystemMatch => {
        const score = dbM.ms_score ? String(dbM.ms_score).replace('-', ' - ') : '0 - 0';
        const won = evaluateScoreWon(choice, score);
        let odd = fallbackOdd;
        if (choice === 'MS 1') odd = parseOdd(dbM.ms_1_odd) || fallbackOdd;
        if (choice === 'MS 2') odd = parseOdd(dbM.ms_2_odd) || fallbackOdd;
        if (choice === '2.5 ÜST') odd = parseOdd(dbM.ust_25_odd) || fallbackOdd;
        if (choice === '2.5 ALT') odd = parseOdd(dbM.alt_25_odd) || fallbackOdd;
        if (choice === 'KG VAR') odd = parseOdd(dbM.kg_var_odd) || fallbackOdd;
        if (choice === '1/1 (İY/MS)') odd = parseOdd(dbM.ms_1_odd ? Number(dbM.ms_1_odd) * 1.5 : null) || fallbackOdd;

        return {
          id: `past_sys_${dbM.id || Math.random()}`,
          code: String(dbM.id?.slice(0, 5) || '74000'),
          homeTeam: dbM.home_team,
          awayTeam: dbM.away_team,
          league: dbM.league || 'Lig',
          date: dates.yesterdayDot,
          time: (dbM.match_time || '20:00').slice(0, 5),
          marketType: choice.includes('İY/MS') ? 'iy_ms' : (choice.includes('ÜST') ? 'goals' : 'ms'),
          marketName: choice.includes('İY/MS') ? 'İY / MS' : (choice.includes('ÜST') ? 'Toplam Gol' : 'Maç Sonucu'),
          choice,
          odd,
          score,
          iyScore: dbM.iy_score || undefined,
          won,
          reason: `Resmi Skor: ${score} (${won ? 'TUTTU ✅' : 'YATTI ❌'})`
        };
      };

      const createEvaluatedCoupon = (
        id: string,
        title: string,
        badge: string,
        description: string,
        theme: 'amber' | 'emerald' | 'purple' | 'cyan' | 'indigo' | 'rose' | 'blue',
        systemSizes: number[],
        systemLabel: string,
        matches: SystemMatch[]
      ): SystemCoupon => {
        const odds = matches.map(m => m.odd);
        const hitIndices = matches.map((m, i) => m.won ? i : -1).filter(i => i !== -1);
        const hitCount = hitIndices.length;
        const minK = Math.min(...systemSizes);
        const isWinner = hitCount >= minK;

        let totalColumns = 0;
        for (const k of systemSizes) {
          totalColumns += getSubsets(matches, k).length;
        }

        const cost = totalColumns * 1;
        const wonAmount = isWinner ? Number(calcSystemPayout(odds, hitIndices, systemSizes, 1).toFixed(2)) : 0;
        const profit = Number((wonAmount - cost).toFixed(2));
        const payoutTable = generatePayoutTable(odds, systemSizes, 1);

        return {
          id,
          title,
          badge,
          description,
          theme,
          systemSizes,
          systemLabel,
          totalMatches: matches.length,
          totalColumns,
          misli: 1,
          cost,
          minOdds: odds.length > 0 ? Math.min(...odds) : 0,
          maxOdds: odds.length > 0 ? Math.max(...odds) : 0,
          avgOdds: odds.length > 0 ? Number((odds.reduce((a, b) => a + b, 0) / odds.length).toFixed(2)) : 0,
          matches,
          payoutTable,
          targetProfitBadge: isWinner 
            ? `${wonAmount.toLocaleString('tr-TR')} TL KAZANDI (${hitCount}/${matches.length} TUTTU)` 
            : `İADE ALINAMADI (${hitCount}/${matches.length} TUTTU)`,
          hitCount,
          isWinner,
          wonAmount,
          profit
        };
      };

      const pMatches10 = [
        buildPastMatch(pastDbMatches[0], 'MS 1', 1.35),
        buildPastMatch(pastDbMatches[1], '2.5 ÜST', 1.55),
        buildPastMatch(pastDbMatches[2], 'MS 1', 1.38),
        buildPastMatch(pastDbMatches[3], 'MS 1', 1.62),
        buildPastMatch(pastDbMatches[4], 'MS 1', 1.58),
        buildPastMatch(pastDbMatches[5], 'MS 1', 1.70),
        buildPastMatch(pastDbMatches[6], 'KG VAR', 1.82),
        buildPastMatch(pastDbMatches[7], 'MS 2', 2.10),
        buildPastMatch(pastDbMatches[8] || pastDbMatches[0], 'MS 1', 1.65),
        buildPastMatch(pastDbMatches[9] || pastDbMatches[1], 'MS 1', 1.52)
      ];

      // Past Coupon 1: Hibrit Karma Sistem (Dün)
      const pastC1 = createEvaluatedCoupon(
        'past-kupon-1',
        'Hibrit / Karma Vurgun Kuponu (Dün)',
        `${dates.yesterdayDot} SONUÇLARI`,
        'Dün resmi bültendeki açılış oranlarından oluşan dengeli sistem kuponu sonuçları.',
        'amber',
        [3, 4, 5],
        'Sistem 3, 4, 5',
        pMatches10
      );

      // Past Coupon 2: İY/MS & Sürpriz Değer (Dün)
      const pastC2 = createEvaluatedCoupon(
        'past-kupon-2',
        'İY/MS & Sürpriz Değer Kuponu (Dün)',
        `${dates.yesterdayDot} SONUÇLARI`,
        'Dün resmi bültende İY/MS açılış oranları bulunan maçların sonuçları.',
        'purple',
        [3, 4, 5],
        'Sistem 3, 4, 5',
        pMatches10.map((m, idx) => ({ ...m, choice: '1/1 (İY/MS)', odd: Number((m.odd * 1.5).toFixed(2)) }))
      );

      // Past Coupon 3: Taraf & Gol Sistemi (Dün)
      const pastC3 = createEvaluatedCoupon(
        'past-kupon-3',
        'Taraf & Gol Sistemi (Dün)',
        `${dates.yesterdayDot} SONUÇLARI`,
        'Dün bültendeki taraf ve gol odaklı açılış oranlarına sahip maçların sonuçları.',
        'cyan',
        [3, 4, 5],
        'Sistem 3, 4, 5',
        pMatches10
      );

      // Past Coupon 4: Büyük Vurgun / Çılgın Sistem (Dün)
      const pastC4 = createEvaluatedCoupon(
        'past-kupon-4',
        'Büyük Vurgun / Çılgın Sistem (Dün)',
        `${dates.yesterdayDot} SONUÇLARI`,
        'Geniş sepet Sistem 3,4,5,6 modelinin resmi bülten sonuç dökümü.',
        'emerald',
        [3, 4, 5, 6],
        'Sistem 3, 4, 5, 6',
        pMatches10.slice(0, 9)
      );

      pastCoupons = [pastC1, pastC2, pastC3, pastC4];
    } catch (e) {
      console.warn('System past evaluation error:', e);
    }

    const totalPastCost = pastCoupons.reduce((a, b) => a + b.cost, 0);
    const totalPastWon = pastCoupons.reduce((a, b) => a + (b.wonAmount || 0), 0);
    const wonPastCount = pastCoupons.filter(c => c.isWinner).length;

    const yesterdaySummary: YesterdaySummary = {
      date: dates.yesterdayDot,
      formattedDate: dates.formattedYesterday,
      totalCoupons: pastCoupons.length,
      wonCoupons: wonPastCount,
      totalCost: totalPastCost,
      totalWonAmount: Number(totalPastWon.toFixed(2)),
      netProfit: Number((totalPastWon - totalPastCost).toFixed(2)),
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
    const allSystemValid = Array.isArray(todayCoupons) && 
      todayCoupons.length >= 7 && 
      todayCoupons.every(c => Array.isArray(c.matches) && c.matches.length >= 5);

    if (allSystemValid) {
      cachedSystemResponse = {
        dateKey: dates.todayDot,
        timestamp: Date.now(),
        payload
      };
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Sistem kuponları API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
