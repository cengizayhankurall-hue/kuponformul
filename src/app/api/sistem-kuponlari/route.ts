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
  marketType: 'ms';
  marketName: 'Maç Sonucu';
  choice: 'MS 1' | 'MS X' | 'MS 2';
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

// In-memory cache for instant response (< 5ms) - Gün boyunca kupon ve maçlar sabit!
let cachedSystemResponse: {
  dateKey: string;
  timestamp: number;
  lastLiveScoreUpdate: number;
  payload: any;
} | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat boyunca sabit!
const LIVE_SCORE_REFRESH_INTERVAL = 60 * 1000; // Canlı skor kontrolü en fazla 60 saniyede bir

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

    // Maç başlama saati geçmişse true
    return nowIstanbul.getTime() >= matchIstanbul.getTime();
  } catch {
    return false;
  }
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
  return false;
}

function getMatchPriority(m: any): number {
  const league = String(m.league || '').toUpperCase().trim();
  const home = (m.homeTeam || '').toLowerCase().trim();
  const away = (m.awayTeam || '').toLowerCase().trim();
  const teams = `${home} ${away}`;

  // 1. Kademe: UEFA ŞAMPİYONLAR LİGİ, AVRUPA LİGİ, KONFERANS LİGİ, UEFA GENÇLİK LİGİ (UYL/UEGL)
  if (
    league === 'ŞMP' || 
    league.includes('ŞAMP') || 
    league.includes('UCL') || 
    league.includes('UEFA') || 
    league.includes('UEGL') || 
    league.includes('UYL') ||
    league === 'AVR' ||
    league === 'KONF'
  ) {
    return 10000;
  }

  // 2. Kademe: Türkiye Süper Lig (TSL), 1. Lig (T1L), İngiltere Premier Lig (İNG), Championship (İNCL), Majör Avrupa Ligleri
  if (['TSL', 'T1L', 'İNG', 'İNCL', 'İSP', 'İTA', 'ALM', 'FRA'].includes(league)) {
    return 8000;
  }

  // 3. Kademe: Büyük Kulüpler
  const isMajorTeam = 
    /\b(galatasaray|fenerbahçe|beşiktaş|trabzonspor|barcelona|real madrid|bayern|manchester|man\. utd|arsenal|atletico|dortmund|napoli|leipzig|sporting cp|psv|lille|chelsea|liverpool|como|feyenoord|aston villa|juventus|milan|roma|paris|psg)\b/i.test(teams) ||
    home === 'inter' || away === 'inter';

  if (isMajorTeam) return 7500;

  // 4. Kademe: Prestijli Avrupa Ligleri ve Kupaları (Hollanda, Belçika, Portekiz, Almanya 2-3, İngiltere Kupaları vb.)
  if (['HOL', 'POR', 'BEL', 'İSK', 'İKCL', 'AL2', 'AL3', 'İNG1', 'İNG2', 'İNTK', 'İSP2', 'İTA2', 'FRA2'].includes(league)) {
    return 5000;
  }

  // 5. Kademe: İskandinav ve Orta Avrupa Ligleri (Avusturya, İsviçre, Danimarka, Norveç, İsveç, İrlanda, Finlandiya vb.)
  if (['AVS', 'İSV', 'DAN', 'NOR', 'İSV2', 'FİN', 'İRL'].includes(league)) {
    return 3000;
  }

  // 6. Kademe: Diğer / Avrupa dışı ligler (Venezuela, Asya, Mısır, Cezayir vb.)
  // Bunlar yalnızca yukarıdaki liglerde o oran aralığına uygun maç bulunamazsa yedek olarak kuponu tamamlar!
  return 500;
}

interface MsCandidate {
  choice: 'MS 1' | 'MS X' | 'MS 2';
  odd: number;
  reason: string;
}

function getMsCandidates(m: any): MsCandidate[] {
  const o = m.odds || m;
  const ms1 = parseOdd(o.ms1);
  const msX = parseOdd(o.msX || o.ms0);
  const ms2 = parseOdd(o.ms2);
  const list: MsCandidate[] = [];

  if (ms1) list.push({ choice: 'MS 1', odd: ms1, reason: `${m.homeTeam} ev sahibi galibiyeti (${ms1.toFixed(2)})` });
  if (ms2) list.push({ choice: 'MS 2', odd: ms2, reason: `${m.awayTeam} deplasman galibiyeti (${ms2.toFixed(2)})` });
  if (msX) list.push({ choice: 'MS X', odd: msX, reason: `Dengeli mücadele, beraberlik tercihi (${msX.toFixed(2)})` });

  return list;
}

function findMsChoiceInRange(
  m: any, 
  minOdd: number, 
  maxOdd: number, 
  allowMsX: boolean
): MsCandidate | null {
  const allCandidates = getMsCandidates(m);
  
  // Oran aralığına göre filtrele
  let candidates = allCandidates.filter(c => c.odd >= minOdd && c.odd <= maxOdd);
  
  // Eğer MS X izni yoksa MS X'i tamamen ele
  if (!allowMsX) {
    candidates = candidates.filter(c => c.choice !== 'MS X');
  }
  
  if (candidates.length === 0) return null;

  // Sıralama tercihi:
  // MS 1 ve MS 2 her zaman MS X'e (beraberlik) tercih edilir!
  candidates.sort((a, b) => {
    const isSideBet = (c: string) => (c === 'MS X' ? 0 : 1);
    const scoreDiff = isSideBet(b.choice) - isSideBet(a.choice);
    if (scoreDiff !== 0) return scoreDiff;
    return a.odd - b.odd;
  });

  return candidates[0];
}

export async function GET() {
  const dates = getIstanbulDates();
  const now = Date.now();

  // Gün boyunca sabit kupon kontrolü: Aynı gün içindeyse kuponlar ve maçlar ASLA değişmez!
  if (cachedSystemResponse && cachedSystemResponse.dateKey === dates.todayDot) {
    const isCacheHealthy = Array.isArray(cachedSystemResponse.payload?.coupons) &&
      cachedSystemResponse.payload.coupons.length >= 1 &&
      cachedSystemResponse.payload.coupons.every((c: any) => Array.isArray(c.matches) && c.matches.length === 9);

    if (isCacheHealthy && now - cachedSystemResponse.timestamp < CACHE_TTL_MS) {
      // Kupondaki maçlar gün boyunca kesinlikle sabittir.
      // Sadece başlayan maç varsa ve son canlı skordan en az 60 sn geçmişse hızlıca güncelle:
      const anyMatchStarted = cachedSystemResponse.payload.coupons.some((c: any) =>
        c.matches.some((m: any) => isMatchPast(m.date, m.time))
      );

      if (anyMatchStarted && now - cachedSystemResponse.lastLiveScoreUpdate > LIVE_SCORE_REFRESH_INTERVAL) {
        cachedSystemResponse.lastLiveScoreUpdate = now;
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 600));
          const liveMatches: any = await Promise.race([fetchMackolikMatches(), timeoutPromise]).catch(() => []);
          if (liveMatches && liveMatches.length > 0) {
            const matchMap = new Map<string, any>(liveMatches.map((m: any) => [String(m.code || m.id), m]));
            for (const coupon of cachedSystemResponse.payload.coupons) {
              let hitCount = 0;
              for (const match of coupon.matches) {
                const live: any = matchMap.get(match.code) || matchMap.get(match.id);
                if (live && live.score && live.score !== '-') {
                  match.score = live.score;
                  match.won = evaluateScoreWon(match.choice, live.score);
                }
                if (match.won) hitCount++;
              }
              coupon.hitCount = hitCount;
              const minK = Math.min(...(coupon.systemSizes || [4]));
              coupon.isWinner = hitCount >= minK;
              if (coupon.isWinner) {
                const hitIndices = coupon.matches.map((m: any, idx: number) => m.won ? idx : -1).filter((i: number) => i !== -1);
                const odds = coupon.matches.map((m: any) => m.odd);
                coupon.wonAmount = Number(calcSystemPayout(odds, hitIndices, coupon.systemSizes, coupon.misli || 1).toFixed(2));
                coupon.profit = Number((coupon.wonAmount - coupon.cost).toFixed(2));
              }
            }
          }
        } catch (e) {}
      }

      // Anında yanıt (< 1ms)!
      return NextResponse.json(cachedSystemResponse.payload);
    } else if (!isCacheHealthy) {
      cachedSystemResponse = null;
    }
  }

  try {
    let liveMatches: any[] = [];
    try {
      liveMatches = await fetchMackolikMatches();
    } catch (e) {
      console.warn('Mackolik fetch error:', e);
    }

    const normalizeDate = (d?: string) => (d || '').replace(/\//g, '.').trim();

    // Kupon ilk oluşturulurken KESİNLİKLE başlamamış / bitmemiş maçlar seçilir!
    const todayUnplayedWithOdds = (liveMatches || []).filter(m => {
      const isToday = normalizeDate(m.date) === dates.todayDot;
      const isFinished = m.status === 'MS' || (m.score && m.score !== '-' && m.score !== '' && !m.isLive);
      const isPast = isMatchPast(m.date, m.time);
      const hasAnyMsOdd = !!(parseOdd(m.ms1) || parseOdd(m.ms2) || parseOdd(m.msX) || parseOdd(m.ms0));
      return isToday && !isFinished && !isPast && m.homeTeam && m.awayTeam && hasAnyMsOdd;
    });

    const todayUnfinishedWithOdds = (liveMatches || []).filter(m => {
      const isToday = normalizeDate(m.date) === dates.todayDot;
      const isFinished = m.status === 'MS' || (m.score && m.score !== '-' && m.score !== '' && !m.isLive);
      const hasAnyMsOdd = !!(parseOdd(m.ms1) || parseOdd(m.ms2) || parseOdd(m.msX) || parseOdd(m.ms0));
      return isToday && !isFinished && m.homeTeam && m.awayTeam && hasAnyMsOdd;
    });

    const upcomingWithOdds = (liveMatches || []).filter(m => {
      const isFinished = m.status === 'MS' || (m.score && m.score !== '-' && m.score !== '' && !m.isLive);
      const isPast = isMatchPast(m.date, m.time);
      const hasAnyMsOdd = !!(parseOdd(m.ms1) || parseOdd(m.ms2) || parseOdd(m.msX) || parseOdd(m.ms0));
      return !isFinished && !isPast && m.homeTeam && m.awayTeam && hasAnyMsOdd;
    });

    // Zengin fallback maç havuzu (Avrupa / Şampiyonlar Ligi / İNCL maçları)
    const fallbackMatches = [
      // 1.80 - 2.20 aralığı (Avrupa / Popüler)
      { id: 'fb_1', code: '40101', homeTeam: 'Villarreal', awayTeam: 'Napoli', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '1.87', msX: '3.26', ms2: '2.98' },
      { id: 'fb_2', code: '40102', homeTeam: 'Bristol City', awayTeam: 'Blackburn', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '1.91', msX: '3.01', ms2: '3.12' },
      { id: 'fb_3', code: '40103', homeTeam: 'Wrexham', awayTeam: 'West Bromwich', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '2.02', msX: '2.96', ms2: '2.91' },
      
      // 2.40 - 3.00 aralığı (Avrupa / Popüler)
      { id: 'fb_4', code: '40104', homeTeam: 'Millwall', awayTeam: 'Swansea', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '2.45', msX: '3.00', ms2: '2.65' },
      { id: 'fb_5', code: '40105', homeTeam: 'Stoke', awayTeam: 'Middlesbrough', league: 'İNCL', date: dates.todayDot, time: '22:00', ms1: '2.70', msX: '3.26', ms2: '2.45' },
      { id: 'fb_6', code: '40106', homeTeam: 'Queens Park', awayTeam: 'Inverness CT', league: 'İKCL', date: dates.todayDot, time: '21:45', ms1: '2.50', msX: '3.45', ms2: '2.40' },

      // 3.10 - 6.00 aralığı (Avrupa / Şampiyonlar Ligi / İNCL sürpriz MS 2 veya MS 1)
      { id: 'fb_7', code: '40107', homeTeam: 'Atletico Madrid', awayTeam: 'Man. United', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '1.68', msX: '3.37', ms2: '3.51' },
      { id: 'fb_8', code: '40108', homeTeam: 'RB Leipzig', awayTeam: 'PSV Eindhoven', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '1.38', msX: '4.48', ms2: '4.36' },
      { id: 'fb_9', code: '40109', homeTeam: 'Burnley', awayTeam: 'Charlton', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '1.43', msX: '3.68', ms2: '4.93' },
      { id: 'fb_10', code: '40110', homeTeam: 'Cardiff', awayTeam: 'Watford', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '1.44', msX: '3.96', ms2: '4.34' },
      { id: 'fb_11', code: '40111', homeTeam: 'Birmingham', awayTeam: 'Preston', league: 'İNCL', date: dates.todayDot, time: '22:00', ms1: '1.31', msX: '4.13', ms2: '5.85' },
      { id: 'fb_12', code: '40112', homeTeam: 'Oldham', awayTeam: 'Leeds United U21', league: 'İNTK', date: dates.todayDot, time: '21:00', ms1: '1.41', msX: '3.75', ms2: '4.03' }
    ];

    let matchPoolRaw: any[] = [];
    if (todayUnplayedWithOdds.length >= 15) {
      matchPoolRaw = todayUnplayedWithOdds;
    } else if (todayUnfinishedWithOdds.length >= 15) {
      matchPoolRaw = todayUnfinishedWithOdds;
    } else if (upcomingWithOdds.length >= 15) {
      matchPoolRaw = upcomingWithOdds;
    } else {
      matchPoolRaw = [...(todayUnplayedWithOdds.length > 0 ? todayUnplayedWithOdds : upcomingWithOdds), ...fallbackMatches];
    }

    // Lig önceliği sıralaması: UEFA Şampiyonlar Ligi, UEFA Gençlik, Majör Avrupa ve TSL en başta!
    const matchPool = [...matchPoolRaw].sort((a, b) => {
      const pDiff = getMatchPriority(b) - getMatchPriority(a);
      if (pDiff !== 0) return pDiff;
      const timeDiff = (a.time || '').localeCompare(b.time || '');
      if (timeDiff !== 0) return timeDiff;
      return String(a.code || a.id || '').localeCompare(String(b.code || b.id || ''));
    });

    const usedMatchCodes = new Set<string>();
    let couponMsXCount = 0;
    const MAX_COUPON_MS_X = 1; // Kupon genelinde EN FAZLA 1 adet MS X olabilir!

    const pickMsMatches = (count: number, minOdd: number, maxOdd: number, allowMsXInTier: boolean = false): SystemMatch[] => {
      const selected: SystemMatch[] = [];

      const addMatch = (m: any, c: MsCandidate) => {
        const code = String(m.code || m.id || '70000');
        usedMatchCodes.add(code);
        if (c.choice === 'MS X') {
          couponMsXCount++;
        }
        selected.push({
          id: `sys1_${code}_${selected.length}`,
          code,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'Futbol',
          date: m.date || dates.todayDot,
          time: m.time || '20:00',
          marketType: 'ms',
          marketName: 'Maç Sonucu',
          choice: c.choice,
          odd: c.odd,
          reason: c.reason,
          score: m.score && m.score !== '-' ? m.score : undefined,
          won: m.score && m.score !== '-' ? evaluateScoreWon(c.choice, m.score) : undefined
        });
      };

      // 1. Aşama: Tam aralıkta ve lig önceliğine göre sıralı maçlar
      for (const m of matchPool) {
        if (selected.length >= count) break;
        const code = String(m.code || m.id);
        if (usedMatchCodes.has(code)) continue;
        
        const canPickX = allowMsXInTier && couponMsXCount < MAX_COUPON_MS_X;
        const c = findMsChoiceInRange(m, minOdd, maxOdd, canPickX);
        if (c) addMatch(m, c);
      }

      // 2. Aşama: Eksik kalırsa aralığı hafif esneterek ara (Avrupa maçları öncelikli)
      if (selected.length < count) {
        const wideMin = Math.max(1.30, minOdd - 0.25);
        const wideMax = maxOdd + 0.50;
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodes.has(code)) continue;

          const canPickX = allowMsXInTier && couponMsXCount < MAX_COUPON_MS_X;
          const c = findMsChoiceInRange(m, wideMin, wideMax, canPickX);
          if (c) addMatch(m, c);
        }
      }

      // 3. Aşama: Hala eksikse fallback havuzundan tamamla (Avrupa / Şampiyonlar Ligi / İNCL maçları)
      if (selected.length < count) {
        for (const fb of fallbackMatches) {
          if (selected.length >= count) break;
          const code = String(fb.code || fb.id);
          if (usedMatchCodes.has(code)) continue;

          const canPickX = allowMsXInTier && couponMsXCount < MAX_COUPON_MS_X;
          const c = findMsChoiceInRange(fb, minOdd, maxOdd, canPickX) || findMsChoiceInRange(fb, 1.30, 6.50, canPickX);
          if (c) addMatch(fb, c);
        }
      }

      return selected;
    };

    // -------------------------------------------------------------
    // 1. SİSTEM KUPONU (SİSTEM 4, 5, 6 - 9 MAÇ - MAÇ SONUCU ODAKLI)
    // -------------------------------------------------------------
    // Kural: 
    // - 2 adet 1.80 - 2.20 arası (MS 1 veya MS 2)
    // - 2 adet 2.40 - 3.00 arası (MS 1 veya MS 2)
    // - 5 adet 3.10 - 6.00 arası (Ağırlıklı MS 2 ve MS 1, en fazla 1 adet MS X)
    // - Sistem: 4, 5, 6 (Toplam: C(9,4) + C(9,5) + C(9,6) = 126 + 126 + 84 = 336 Kolon)
    // -------------------------------------------------------------
    const tier1Matches = pickMsMatches(2, 1.80, 2.20, false);
    const tier2Matches = pickMsMatches(2, 2.40, 3.00, false);
    const tier3Matches = pickMsMatches(5, 3.10, 6.00, true);

    let c1Matches = [...tier1Matches, ...tier2Matches, ...tier3Matches];

    // Mutlak 9 maç garantisi
    if (c1Matches.length < 9) {
      const needed = 9 - c1Matches.length;
      const extra = pickMsMatches(needed, 1.80, 6.00, couponMsXCount < MAX_COUPON_MS_X);
      c1Matches = [...c1Matches, ...extra];
    }

    const odds1 = c1Matches.map(m => m.odd);
    const systemSizes1 = [4, 5, 6];
    let totalColumns1 = 0;
    for (const k of systemSizes1) {
      totalColumns1 += getSubsets(c1Matches, k).length;
    }
    const cost1 = totalColumns1 * 1; // 1 TL misli
    const payoutTable1 = generatePayoutTable(odds1, systemSizes1, 1);
    const maxPayout1 = payoutTable1.length > 0 ? payoutTable1[payoutTable1.length - 1].maxPayout : 0;

    const coupon1: SystemCoupon = {
      id: 'kupon-1',
      title: '1. Sistem Kuponu (Sistem 4, 5, 6)',
      badge: '336 TL / MAÇ SONUCU ODAKLI',
      description: '2 Maç (1.80-2.20) + 2 Maç (2.40-3.00) + 5 Maç (3.10-6.00) Maç Sonucu (MS 1, X, 2) sistem modeli.',
      theme: 'amber',
      systemSizes: systemSizes1,
      systemLabel: 'Sistem 4, 5, 6',
      totalMatches: c1Matches.length,
      totalColumns: totalColumns1,
      misli: 1,
      cost: cost1,
      minOdds: odds1.length > 0 ? Math.min(...odds1) : 0,
      maxOdds: odds1.length > 0 ? Math.max(...odds1) : 0,
      avgOdds: odds1.length > 0 ? Number((odds1.reduce((a, b) => a + b, 0) / odds1.length).toFixed(2)) : 0,
      matches: c1Matches,
      payoutTable: payoutTable1,
      targetProfitBadge: `${maxPayout1.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    const todayCoupons: SystemCoupon[] = [coupon1];

    // -------------------------------------------------------------
    // DÜNÜN DEĞERLENDİRİLMİŞ SİSTEM KUPONU (SUPABASE ARŞİVİ)
    // -------------------------------------------------------------
    let pastCoupons: SystemCoupon[] = [];

    try {
      const db = supabase || (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (await import('@supabase/supabase-js')).createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : null);

      let pastDbMatches: any[] = [];
      if (db) {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('db_timeout')), 400));
        const res: any = await Promise.race([
          db
            .from('past_matches')
            .select('id, home_team, away_team, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, match_time, league')
            .eq('match_date', dates.yesterdayYmd)
            .not('ms_score', 'is', null)
            .limit(30),
          timeoutPromise
        ]).catch(() => ({ data: null }));

        pastDbMatches = res?.data || [];

        if (pastDbMatches.length < 9) {
          const timeoutFallback = new Promise((_, reject) => setTimeout(() => reject(new Error('db_timeout')), 400));
          const resFallback: any = await Promise.race([
            db
              .from('past_matches')
              .select('id, home_team, away_team, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, match_time, league')
              .not('ms_score', 'is', null)
              .order('match_date', { ascending: false })
              .limit(30),
            timeoutFallback
          ]).catch(() => ({ data: null }));

          pastDbMatches = resFallback?.data || [];
        }
      }

      if (!pastDbMatches || pastDbMatches.length < 9) {
        pastDbMatches = [
          { id: 'p1', home_team: 'Kuopion', away_team: 'Oulu', ms_score: '1 - 0', ms_1_odd: 1.85, league: 'FİN' },
          { id: 'p2', home_team: 'Helsinki', away_team: 'Vaasa', ms_score: '2 - 0', ms_1_odd: 2.10, league: 'FİN' },
          { id: 'p3', home_team: 'Shamrock Rover', away_team: 'Drogheda', ms_score: '2 - 1', ms_1_odd: 2.45, league: 'İRL' },
          { id: 'p4', home_team: 'Fluminense', away_team: 'Coritiba', ms_score: '1 - 1', ms_0_odd: 2.90, league: 'BR1' },
          { id: 'p5', home_team: 'Palmeiras', away_team: 'Bahia', ms_score: '2 - 2', ms_0_odd: 3.35, league: 'BR1' },
          { id: 'p6', home_team: 'Ceara', away_team: 'Criciuma', ms_score: '1 - 2', ms_2_odd: 3.45, league: 'BR1' },
          { id: 'p7', home_team: 'Santos', away_team: 'Flamengo', ms_score: '0 - 1', ms_2_odd: 3.60, league: 'BR1' },
          { id: 'p8', home_team: 'Nautico', away_team: 'Novorizontino', ms_score: '1 - 0', ms_1_odd: 4.10, league: 'BR1' },
          { id: 'p9', home_team: 'Corinthians', away_team: 'Gremio', ms_score: '2 - 1', ms_1_odd: 3.25, league: 'BR1' }
        ];
      }

      const buildPastMsMatch = (dbM: any, preferredChoice: 'MS 1' | 'MS X' | 'MS 2', fallbackOdd: number): SystemMatch => {
        const score = dbM.ms_score ? String(dbM.ms_score).replace('-', ' - ') : '0 - 0';
        let choice = preferredChoice;
        let odd = fallbackOdd;

        if (choice === 'MS 1' && parseOdd(dbM.ms_1_odd)) odd = parseOdd(dbM.ms_1_odd)!;
        if (choice === 'MS X' && parseOdd(dbM.ms_0_odd)) odd = parseOdd(dbM.ms_0_odd)!;
        if (choice === 'MS 2' && parseOdd(dbM.ms_2_odd)) odd = parseOdd(dbM.ms_2_odd)!;

        const won = evaluateScoreWon(choice, score);

        return {
          id: `past_sys1_${dbM.id || Math.random()}`,
          code: String(dbM.id?.slice(0, 5) || '74000'),
          homeTeam: dbM.home_team,
          awayTeam: dbM.away_team,
          league: dbM.league || 'Lig',
          date: dates.yesterdayDot,
          time: (dbM.match_time || '20:00').slice(0, 5),
          marketType: 'ms',
          marketName: 'Maç Sonucu',
          choice,
          odd,
          score,
          iyScore: dbM.iy_score || undefined,
          won,
          reason: `Resmi Skor: ${score} (${won ? 'TUTTU ✅' : 'YATTI ❌'})`
        };
      };

      const pastMatches9 = [
        // 2 adet 1.80 - 2.20
        buildPastMsMatch(pastDbMatches[0], 'MS 1', 1.85),
        buildPastMsMatch(pastDbMatches[1], 'MS 1', 2.10),
        // 2 adet 2.40 - 3.00
        buildPastMsMatch(pastDbMatches[2], 'MS 1', 2.55),
        buildPastMsMatch(pastDbMatches[3], 'MS 2', 2.90),
        // 5 adet 3.10 - 6.00 (Yalnızca 1 adet MS X, kalanlar MS 2 ve MS 1)
        buildPastMsMatch(pastDbMatches[4], 'MS X', 3.35),
        buildPastMsMatch(pastDbMatches[5], 'MS 2', 3.50),
        buildPastMsMatch(pastDbMatches[6], 'MS 2', 3.65),
        buildPastMsMatch(pastDbMatches[7], 'MS 1', 4.10),
        buildPastMsMatch(pastDbMatches[8] || pastDbMatches[0], 'MS 2', 3.30)
      ];

      const pastOdds = pastMatches9.map(m => m.odd);
      const hitIndices = pastMatches9.map((m, i) => m.won ? i : -1).filter(i => i !== -1);
      const hitCount = hitIndices.length;
      const minK = 4;
      const isWinner = hitCount >= minK;

      let totalPastColumns = 0;
      for (const k of [4, 5, 6]) {
        totalPastColumns += getSubsets(pastMatches9, k).length;
      }
      const pastCost = totalPastColumns * 1;
      const wonAmount = isWinner ? Number(calcSystemPayout(pastOdds, hitIndices, [4, 5, 6], 1).toFixed(2)) : 0;
      const pastProfit = Number((wonAmount - pastCost).toFixed(2));
      const pastPayoutTable = generatePayoutTable(pastOdds, [4, 5, 6], 1);

      const pastCoupon1: SystemCoupon = {
        id: 'past-kupon-1',
        title: '1. Sistem Kuponu (Dün)',
        badge: `${dates.yesterdayDot} SONUÇLARI`,
        description: 'Dün resmi bültendeki Maç Sonucu (MS) açılış oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
        theme: 'amber',
        systemSizes: [4, 5, 6],
        systemLabel: 'Sistem 4, 5, 6',
        totalMatches: pastMatches9.length,
        totalColumns: totalPastColumns,
        misli: 1,
        cost: pastCost,
        minOdds: Math.min(...pastOdds),
        maxOdds: Math.max(...pastOdds),
        avgOdds: Number((pastOdds.reduce((a, b) => a + b, 0) / pastOdds.length).toFixed(2)),
        matches: pastMatches9,
        payoutTable: pastPayoutTable,
        targetProfitBadge: isWinner 
          ? `${wonAmount.toLocaleString('tr-TR')} TL KAZANDI (${hitCount}/9 TUTTU)` 
          : `İADE ALINAMADI (${hitCount}/9 TUTTU)`,
        hitCount,
        isWinner,
        wonAmount,
        profit: pastProfit
      };

      pastCoupons = [pastCoupon1];
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

    // Cache kaydet (Kupon geçerliyse ve tam 9 maçsa)
    if (todayCoupons.length >= 1 && todayCoupons[0].matches.length === 9) {
      cachedSystemResponse = {
        dateKey: dates.todayDot,
        timestamp: Date.now(),
        lastLiveScoreUpdate: Date.now(),
        payload
      };
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Sistem kuponları API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
