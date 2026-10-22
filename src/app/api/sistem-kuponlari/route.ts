import { NextResponse } from 'next/server';
import { fetchMackolikMatches } from '../fetch-iddaa/route';
import { supabase } from '@/lib/supabase';
import https from 'https';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 10
});

function httpsGet(urlStr: string, referer = 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'): Promise<{ status: number; text: string }> {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const options = {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Referer': referer,
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 4000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode || 200, text: data });
        });
      });

      req.on('error', () => resolve({ status: 500, text: '' }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 504, text: '' });
      });
      req.end();
    } catch (e) {
      resolve({ status: 500, text: '' });
    }
  });
}

const iymsOddsCache = new Map<string, Record<string, number>>();

async function fetchMatchIyMsOdds(eventId: string): Promise<Record<string, number> | null> {
  if (!eventId || eventId === '0') return null;
  if (iymsOddsCache.has(eventId)) return iymsOddsCache.get(eventId)!;

  try {
    const url = `https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${eventId}&s=futbol`;
    const res = await httpsGet(url, 'https://arsiv.mackolik.com/Genis-Iddaa-Programi');
    if (res.status === 200 && res.text?.length > 200) {
      const parsed = JSON.parse(res.text);
      const markets = parsed?.data?.matches?.[0]?.bookies?.[0]?.markets || [];
      const mk = markets.find((m: any) => m.name && m.name.includes('İlk Yarı/Maç'));
      if (mk && Array.isArray(mk.outcomes)) {
        const result: Record<string, number> = {};
        for (const out of mk.outcomes) {
          const val = Number(String(out.value).replace(',', '.'));
          if (val > 1) {
            result[out.name] = val;
          }
        }
        if (Object.keys(result).length >= 5) {
          iymsOddsCache.set(eventId, result);
          return result;
        }
      }
    }
  } catch (e) {}
  return null;
}

const STORE_FILE = path.join(process.cwd(), 'data', 'system_coupons_store.json');
const STORE_FILE_PUBLIC = path.join(process.cwd(), 'public', 'data', 'system_coupons_store.json');

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

const BAD_FALLBACK_TEAMS = [
  'Salzburg', 'Lyon', 'Kuopion', 'Hoffenheim', 'Celta Vigo', 
  'Dinamo Zagreb', 'Union St.G', 'Lech Poznan', 'Celje', 'Torreense',
  'Universitatea', 'Gent', 'Lugano', 'Sparta Prag', 'Mardin 1969', 'Manisa Futbol'
];

function isCouponCorruptedWithPastMatches(coupons: any[]): boolean {
  if (!Array.isArray(coupons)) return true;
  return coupons.some((c: any) =>
    Array.isArray(c.matches) &&
    c.matches.some((m: any) =>
      String(m.id || '').includes('fb_') ||
      BAD_FALLBACK_TEAMS.includes(m.homeTeam)
    )
  );
}

function loadStoredCoupons(dateStr: string): SystemCoupon[] | null {
  for (const f of [STORE_FILE, STORE_FILE_PUBLIC]) {
    try {
      if (fs.existsSync(f)) {
        const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
        if (data && data[dateStr] && Array.isArray(data[dateStr].coupons) && data[dateStr].coupons.length >= 4) {
          if (isCouponCorruptedWithPastMatches(data[dateStr].coupons)) continue;
          return data[dateStr].coupons;
        }
      }
    } catch (e) {}
  }
  return null;
}

function loadStoredPayload(dateStr: string): any | null {
  for (const f of [STORE_FILE, STORE_FILE_PUBLIC]) {
    try {
      if (fs.existsSync(f)) {
        const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
        if (data && data[dateStr] && Array.isArray(data[dateStr].coupons) && data[dateStr].coupons.length >= 4) {
          if (isCouponCorruptedWithPastMatches(data[dateStr].coupons)) continue;
          return data[dateStr];
        }
      }
    } catch (e) {}
  }
  return null;
}

function saveStoredCoupons(dateStr: string, coupons: SystemCoupon[], yesterday?: any) {
  for (const f of [STORE_FILE, STORE_FILE_PUBLIC]) {
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


export interface SystemMatch {
  id: string;
  code: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  marketType: 'ms' | 'goals' | 'iyms';
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

function evaluateScoreWon(choice: string, msScore: string, iyScore?: string): boolean {
  if (!msScore || !msScore.includes('-')) return false;
  const parts = msScore.split('-').map(s => parseInt(s.trim(), 10));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return false;
  const [h, a] = parts;
  const ch = choice.toUpperCase().trim();

  // MS
  if (ch === 'MS 1' || ch === '1') return h > a;
  if (ch === 'MS 2' || ch === '2') return a > h;
  if (ch === 'MS 0' || ch === 'MS X' || ch === 'X' || ch === '0') return h === a;

  // Alt / Üst
  if (ch === '2.5 ÜST' || ch === '2.5 UST' || ch === 'ÜST' || ch === 'UST') return (h + a) >= 3;
  if (ch === '2.5 ALT' || ch === 'ALT') return (h + a) <= 2;
  if (ch === '3.5 ÜST' || ch === '3.5 UST') return (h + a) >= 4;
  if (ch === '3.5 ALT') return (h + a) <= 3;
  if (ch === '4.5 ÜST' || ch === '4.5 UST') return (h + a) >= 5;
  if (ch === '4.5 ALT') return (h + a) <= 4;
  if (ch === '1.5 ÜST' || ch === '1.5 UST') return (h + a) >= 2;
  if (ch === '1.5 ALT') return (h + a) <= 1;

  // KG
  if (ch === 'KG VAR') return h > 0 && a > 0;
  if (ch === 'KG YOK') return h === 0 || a === 0;

  // İY / MS (ör. '1/1', 'X/1', '2/2', 'X/2', '1/X', '2/X', '1/2', '2/1', 'X/X')
  if (ch.includes('/') || ch.includes('İY/MS')) {
    const rawChoice = ch.replace('(İY/MS)', '').trim();
    const slashParts = rawChoice.split('/');
    if (slashParts.length === 2) {
      const expectedIy = slashParts[0].trim();
      const expectedMs = slashParts[1].trim();
      const msRes = h > a ? '1' : a > h ? '2' : 'X';
      if (expectedMs !== msRes) return false;

      if (iyScore && iyScore.includes('-')) {
        const iyParts = iyScore.split('-').map(s => parseInt(s.trim(), 10));
        if (iyParts.length === 2 && !isNaN(iyParts[0]) && !isNaN(iyParts[1])) {
          const iyRes = iyParts[0] > iyParts[1] ? '1' : iyParts[1] > iyParts[0] ? '2' : 'X';
          return expectedIy === iyRes;
        }
      }
      return expectedMs === msRes;
    }
  }

  return false;
}

function isObscureLeague(leagueStr?: string): boolean {
  if (!leagueStr) return false;
  const l = leagueStr.toUpperCase().trim();
  const obscureKeywords = [
    'AFC', 'AŞMP', 'AFCK', 'EST', 'CZYR', 'VEN', 'KAT', 'IRAN', 'HİNS', 'HIN', 'KOS', 'MAC', 
    'SUUD', 'KAZ', 'KAZP', 'UGA', 'RUA', 'KEN', 'MOZ', 'BOTS', 'HKPL', 'JLK', 
    'MLTP', 'PARK', 'FAS', 'BLPK', 'URUK', 'İTC', 'CFL', '2. LIG', '3.LIG',
    'SERIE D', 'BAE', 'KUV', 'BAH', 'MIS', 'CEZ', 'TUN', 'THA', 'VNM', 'MYS', 'IND'
  ];
  return obscureKeywords.some(k => l.startsWith(k) || l.includes(k));
}

function getMatchPriority(m: any): number {
  const league = String(m.league || '').toUpperCase().trim();
  const home = (m.homeTeam || '').toLowerCase().trim();
  const away = (m.awayTeam || '').toLowerCase().trim();
  const teams = `${home} ${away}`;

  // Eğer alt sıra / istenmeyen lig ise direkt en dip öncelik (-10000)
  if (isObscureLeague(league)) {
    return -10000;
  }

  // 1. Kademe: UEFA AVRUPA KUPALARI (ŞAMPİYONLAR LİGİ, AVRUPA LİGİ, KONFERANS LİGİ, UEFA GENÇLİK)
  if (
    (league === 'ŞMP' || 
    league === 'AVL' || 
    league === 'AVKL' || 
    league === 'UEGL' || 
    league === 'UYL' || 
    league === 'AVR' || 
    league === 'KONF' ||
    league.includes('UEFA')) &&
    !league.includes('AFC') &&
    !league.includes('AŞMP')
  ) {
    return 30000;
  }

  // 2. Kademe: Türkiye Süper Lig (TSL), 1. Lig (T1L), İngiltere Premier Lig (İNG), Championship (İNCL), Majör Avrupa Ligleri
  if (['TSL', 'T1L', 'İNG', 'İNCL', 'İSP', 'İSP1', 'İTA', 'İTA1', 'ALM', 'AL1', 'FRA', 'FRA1'].includes(league)) {
    return 20000;
  }

  // 3. Kademe: Büyük Kulüpler
  const isMajorTeam = 
    /\b(galatasaray|fenerbahçe|beşiktaş|trabzonspor|barcelona|real madrid|bayern|manchester|man\. utd|arsenal|atletico|dortmund|napoli|leipzig|sporting cp|psv|lille|chelsea|liverpool|como|feyenoord|aston villa|juventus|milan|roma|paris|psg|ajax|monaco|leverkusen|sociedad|celtic|marseille|marsilya|atalanta|freiburg|braga|porto|benfica)\b/i.test(teams) ||
    home === 'inter' || away === 'inter';

  if (isMajorTeam) return 15000;

  // 4. Kademe: Prestijli Avrupa Ligleri ve Kupaları (Hollanda, Belçika, Portekiz, İskoçya, Almanya 2-3, Rusya Kupası, Çek Ligi, Belarus, İspanya 2, İtalya 2, Fransa 2, Polonya vb.)
  if (['HOL', 'POR', 'BEL', 'İSK', 'İKCL', 'AL2', 'AL3', 'İNG1', 'İNG2', 'İNTK', 'İSP2', 'İTA2', 'FRA2', 'RUK', 'ÇEK', 'BLR', 'POL', 'POL1'].includes(league)) {
    return 10000;
  }

  // 5. Kademe: İskandinav ve Diğer Avrupa Ligleri (Avusturya, İsviçre, Danimarka, Norveç, İsveç, İrlanda, Finlandiya vb.)
  if (['AVS', 'İSV', 'DAN', 'NOR', 'NOR1', 'İSV1', 'İSV2', 'FİN', 'İRL'].includes(league)) {
    return 5000;
  }

  // 6. Kademe: Diğer ligler
  return 100;
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
  let candidates = allCandidates.filter(c => c.odd >= minOdd && c.odd <= maxOdd);
  
  if (!allowMsX) {
    candidates = candidates.filter(c => c.choice !== 'MS X');
  }
  
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const isSideBet = (c: string) => (c === 'MS X' ? 0 : 1);
    const scoreDiff = isSideBet(b.choice) - isSideBet(a.choice);
    if (scoreDiff !== 0) return scoreDiff;
    return a.odd - b.odd;
  });

  return candidates[0];
}

interface GoalCandidate {
  choice: string;
  odd: number;
  marketName: string;
  marketType: 'goals';
  reason: string;
}

function getGoalCandidates(m: any): GoalCandidate[] {
  const o = m.odds || m;
  const ust25 = parseOdd(o.ust25);
  const alt25 = parseOdd(o.alt25);
  const ust35 = parseOdd(o.ust35);
  const alt35 = parseOdd(o.alt35);
  const ust45 = parseOdd(o.ust45);
  const alt45 = parseOdd(o.alt45);
  const kgVar = parseOdd(o.kgVar);
  const kgYok = parseOdd(o.kgYok);
  const list: GoalCandidate[] = [];

  if (ust25) list.push({ choice: '2.5 ÜST', odd: ust25, marketName: 'Toplam Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} tempolu hücum ve bol pozisyon (2.5 Üst)` });
  if (alt25) list.push({ choice: '2.5 ALT', odd: alt25, marketName: 'Toplam Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} kontrollü savunma ve düşük tempo (2.5 Alt)` });
  if (ust35) list.push({ choice: '3.5 ÜST', odd: ust35, marketName: 'Toplam Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} yüksek skor ve gol fırtınası (3.5 Üst)` });
  if (alt35) list.push({ choice: '3.5 ALT', odd: alt35, marketName: 'Toplam Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} dengeli skor beklentisi (3.5 Alt)` });
  if (ust45) list.push({ choice: '4.5 ÜST', odd: ust45, marketName: 'Toplam Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} bol gollü karşılaşma (4.5 Üst)` });
  if (alt45) list.push({ choice: '4.5 ALT', odd: alt45, marketName: 'Toplam Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} dengeli savunma güvenliği (4.5 Alt)` });
  if (kgVar) list.push({ choice: 'KG VAR', odd: kgVar, marketName: 'Karşılıklı Gol', marketType: 'goals', reason: `${m.homeTeam} ve ${m.awayTeam} karşılıklı gol üretir (KG Var)` });
  if (kgYok) list.push({ choice: 'KG YOK', odd: kgYok, marketName: 'Karşılıklı Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} en az bir tarafın gol atamadığı mücadele (KG Yok)` });

  return list;
}

function findGoalChoiceInRange(m: any, minOdd: number, maxOdd: number): GoalCandidate | null {
  const allCandidates = getGoalCandidates(m);
  const inRange = allCandidates.filter(c => c.odd >= minOdd && c.odd <= maxOdd);
  if (inRange.length === 0) return null;

  inRange.sort((a, b) => a.odd - b.odd);
  return inRange[0];
}

interface HybridCandidate {
  choice: string;
  odd: number;
  marketName: string;
  marketType: 'ms' | 'goals';
  reason: string;
}

function findHybridChoiceInRange(
  m: any,
  minOdd: number,
  maxOdd: number,
  preferMarket: 'ms' | 'goals',
  allowMsX: boolean
): HybridCandidate | null {
  const o = m.odds || m;
  const ms1 = parseOdd(o.ms1);
  const msX = parseOdd(o.msX || o.ms0);
  const ms2 = parseOdd(o.ms2);
  const ust25 = parseOdd(o.ust25);
  const alt25 = parseOdd(o.alt25);
  const ust35 = parseOdd(o.ust35);
  const alt35 = parseOdd(o.alt35);

  const msCandidates: HybridCandidate[] = [];
  if (ms1 && ms1 >= minOdd && ms1 <= maxOdd) {
    msCandidates.push({ choice: 'MS 1', odd: ms1, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.homeTeam} galibiyeti (${ms1.toFixed(2)})` });
  }
  if (ms2 && ms2 >= minOdd && ms2 <= maxOdd) {
    msCandidates.push({ choice: 'MS 2', odd: ms2, marketName: 'Maç Sonucu', marketType: 'ms', reason: `${m.awayTeam} galibiyeti (${ms2.toFixed(2)})` });
  }
  if (allowMsX && msX && msX >= minOdd && msX <= maxOdd) {
    msCandidates.push({ choice: 'MS X', odd: msX, marketName: 'Maç Sonucu', marketType: 'ms', reason: `Dengeli mücadele, beraberlik (${msX.toFixed(2)})` });
  }

  const goalCandidates: HybridCandidate[] = [];
  if (ust25 && ust25 >= minOdd && ust25 <= maxOdd) {
    goalCandidates.push({ choice: '2.5 ÜST', odd: ust25, marketName: 'Toplam Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} bol gollü ve tempolu (2.5 Üst - ${ust25.toFixed(2)})` });
  }
  if (alt25 && alt25 >= minOdd && alt25 <= maxOdd) {
    goalCandidates.push({ choice: '2.5 ALT', odd: alt25, marketName: 'Toplam Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} kontrollü savunma ve az gol (2.5 Alt - ${alt25.toFixed(2)})` });
  }
  if (ust35 && ust35 >= minOdd && ust35 <= maxOdd) {
    goalCandidates.push({ choice: '3.5 ÜST', odd: ust35, marketName: 'Toplam Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} yüksek skorlu maç (3.5 Üst - ${ust35.toFixed(2)})` });
  }
  if (alt35 && alt35 >= minOdd && alt35 <= maxOdd) {
    goalCandidates.push({ choice: '3.5 ALT', odd: alt35, marketName: 'Toplam Gol', marketType: 'goals', reason: `${m.homeTeam} - ${m.awayTeam} dengeli skor ve savunma (3.5 Alt - ${alt35.toFixed(2)})` });
  }

  const primary = preferMarket === 'ms' ? msCandidates : goalCandidates;
  const secondary = preferMarket === 'ms' ? goalCandidates : msCandidates;

  if (primary.length > 0) {
    primary.sort((a, b) => a.odd - b.odd);
    return primary[0];
  }
  if (secondary.length > 0) {
    secondary.sort((a, b) => a.odd - b.odd);
    return secondary[0];
  }

  return null;
}

interface IyMsCandidate {
  choice: string;
  odd: number;
  marketName: string;
  marketType: 'iyms';
  reason: string;
}

function getEstimatedIyMsOdds(m: any): Record<string, number> {
  const o = m.odds || m;
  const ms1 = parseOdd(o.ms1) || 2.10;
  const msX = parseOdd(o.msX || o.ms0) || 3.10;
  const ms2 = parseOdd(o.ms2) || 2.90;
  const iy1 = parseOdd(o.iy1);
  const iy2 = parseOdd(o.iy2);

  const odd11 = Number((iy1 ? iy1 * 0.85 + ms1 * 0.75 : ms1 * 1.55).toFixed(2));
  const oddX1 = Number((ms1 * 2.65).toFixed(2));
  const odd22 = Number((iy2 ? iy2 * 0.85 + ms2 * 0.75 : ms2 * 1.62).toFixed(2));
  const oddX2 = Number((ms2 * 2.65).toFixed(2));
  const oddXX = Number((msX * 1.58).toFixed(2));
  const odd1X = Number((msX * 3.85).toFixed(2));
  const odd2X = Number((msX * 3.85).toFixed(2));
  const odd12 = Number(Math.max(22.0, ms2 * 7.5).toFixed(2));
  const odd21 = Number(Math.max(22.0, ms1 * 7.5).toFixed(2));

  return {
    '1/1': Math.max(1.30, odd11),
    'X/1': Math.max(2.80, oddX1),
    '2/2': Math.max(1.30, odd22),
    'X/2': Math.max(2.80, oddX2),
    'X/X': Math.max(3.00, oddXX),
    '1/X': Math.max(8.00, odd1X),
    '2/X': Math.max(8.00, odd2X),
    '1/2': Math.max(15.00, odd12),
    '2/1': Math.max(15.00, odd21)
  };
}

function getIyMsCandidates(m: any): IyMsCandidate[] {
  const list: IyMsCandidate[] = [];
  const iyms = m.iymsOdds || (m.odds && m.odds.iymsOdds) || getEstimatedIyMsOdds(m);
  
  if (!iyms || typeof iyms !== 'object') {
    return list;
  }

  const outcomeReasons: Record<string, string> = {
    '1/1': `${m.homeTeam} ilk yarıdan skor üstünlüğü sağlar ve maçı kazanır (1/1)`,
    'X/1': `İlk yarı dengede geçer, ikinci yarı ${m.homeTeam} maçı kazanır (X/1)`,
    '2/2': `${m.awayTeam} deplasmanda ilk yarıyı önde bitirir ve maçı kazanır (2/2)`,
    'X/2': `İlk yarı dengede kalır, ikinci yarı ${m.awayTeam} maçı kazanır (X/2)`,
    'X/X': `90 dakika boyunca eşitlik bozulmaz (X/X)`,
    '1/X': `${m.homeTeam} ilk yarıyı önde kapatır, son bölümde beraberlik gelir (1/X)`,
    '2/X': `${m.awayTeam} ilk yarıyı önde kapatır, son bölümde beraberlik gelir (2/X)`,
    '1/2': `İlk yarı ${m.homeTeam} öne geçer, ikinci yarı ${m.awayTeam} maçı çevirir (1/2)`,
    '2/1': `İlk yarı ${m.awayTeam} öne geçer, ikinci yarı ${m.homeTeam} maçı çevirir (2/1)`
  };

  for (const [choice, reasonTpl] of Object.entries(outcomeReasons)) {
    const rawVal = iyms[choice] || iyms[choice.toLowerCase()] || iyms[choice.replace('/', '')];
    const odd = parseOdd(rawVal);
    if (odd && odd >= 1.20) {
      list.push({
        choice,
        odd,
        marketName: 'İlk Yarı / Maç Sonu',
        marketType: 'iyms',
        reason: `${reasonTpl} - ${odd.toFixed(2)}`
      });
    }
  }

  return list;
}

function findIyMsChoiceInRange(
  m: any,
  minOdd: number,
  maxOdd: number,
  allowedChoices?: string[]
): IyMsCandidate | null {
  const allCandidates = getIyMsCandidates(m);
  let inRange = allCandidates.filter(c => c.odd >= minOdd && c.odd <= maxOdd);
  if (allowedChoices && allowedChoices.length > 0) {
    const matched = inRange.filter(c => allowedChoices.includes(c.choice));
    if (matched.length > 0) inRange = matched;
  }
  if (inRange.length === 0) return null;

  inRange.sort((a, b) => a.odd - b.odd);
  return inRange[0];
}

async function enrichMatchesWithIyMs(matches: any[]): Promise<void> {
  const needFetch = matches.filter(m => !m.iymsOdds && (m.iddaaEventId || m.eventId || m.id));
  const batch = needFetch.slice(0, 25);
  await Promise.all(
    batch.map(async (m) => {
      const iddaaId = String(m.iddaaEventId || m.eventId || m.id || '');
      if (iddaaId && iddaaId !== '0') {
        const odds = await fetchMatchIyMsOdds(iddaaId);
        if (odds) {
          m.iymsOdds = odds;
        }
      }
    })
  );
}

function createEvaluatedPastCoupon(
  id: string,
  title: string,
  badge: string,
  description: string,
  theme: 'amber' | 'emerald' | 'purple' | 'rose',
  matches: SystemMatch[]
): SystemCoupon {
  const odds = matches.map(m => m.odd);
  const systemSizes = [4, 5, 6];
  let totalColumns = 0;
  for (const k of systemSizes) {
    totalColumns += getSubsets(matches, k).length;
  }
  const cost = totalColumns * 1;
  const hitIndices = matches.map((m, i) => m.won ? i : -1).filter(i => i !== -1);
  const hitCount = hitIndices.length;
  const isWinner = hitCount >= 4;
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
    systemLabel: 'Sistem 4, 5, 6',
    totalMatches: matches.length,
    totalColumns,
    misli: 1,
    cost,
    minOdds: Math.min(...odds),
    maxOdds: Math.max(...odds),
    avgOdds: Number((odds.reduce((a, b) => a + b, 0) / odds.length).toFixed(2)),
    matches,
    payoutTable,
    targetProfitBadge: isWinner 
      ? `${wonAmount.toLocaleString('tr-TR')} TL KAZANDI (${hitCount}/9 TUTTU)` 
      : `İADE ALINAMADI (${hitCount}/9 TUTTU)`,
    hitCount,
    isWinner,
    wonAmount,
    profit
  };
}

export async function GET() {
  const dates = getIstanbulDates();
  const now = Date.now();

  // 1. Önce hafıza veya kalıcı disk deposunu kontrol et (Sunucu yeniden başlasa bile kupon asla değişmez/kaybolmaz!)
  if (!cachedSystemResponse || cachedSystemResponse.dateKey !== dates.todayDot) {
    const stored = loadStoredPayload(dates.todayDot);
    if (stored && Array.isArray(stored.coupons) && stored.coupons.length >= 4 && stored.coupons.every((c: any) => Array.isArray(c.matches) && c.matches.length === 9)) {
      cachedSystemResponse = {
        dateKey: dates.todayDot,
        timestamp: stored.timestamp || now,
        lastLiveScoreUpdate: 0,
        payload: {
          success: true,
          timestamp: stored.timestamp || now,
          date: dates.todayDot,
          coupons: stored.coupons,
          yesterday: stored.yesterday || null
        }
      };
    }
  }

  // Gün boyunca sabit kupon kontrolü: Aynı gün içindeyse kuponlar ve maçlar ASLA değişmez!
  if (cachedSystemResponse && cachedSystemResponse.dateKey === dates.todayDot) {
    // Eğer önbellekteki kuponlarda eski, mock (fb_), veya bültende olmayan takımlar kalmışsa derhal temizle!
    const isCorrupted = isCouponCorruptedWithPastMatches(cachedSystemResponse.payload?.coupons);
    const hasBadMatchInCache = isCorrupted || cachedSystemResponse.payload?.coupons?.some((c: any) =>
      c.matches?.some((m: any) => 
        m.date !== dates.todayDot || 
        String(m.id || '').includes('fb_') ||
        BAD_FALLBACK_TEAMS.includes(m.homeTeam)
      )
    );
    if (hasBadMatchInCache) {
      cachedSystemResponse = null;
    }
  }

  if (cachedSystemResponse && cachedSystemResponse.dateKey === dates.todayDot) {
    const isCacheHealthy = Array.isArray(cachedSystemResponse.payload?.coupons) &&
      cachedSystemResponse.payload.coupons.length >= 4 &&
      cachedSystemResponse.payload.coupons.every((c: any) => Array.isArray(c.matches) && c.matches.length === 9);

    if (isCacheHealthy && now - cachedSystemResponse.timestamp < CACHE_TTL_MS) {
      // Kupondaki maçlar gün boyunca kesinlikle sabittir.
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

    // 1. Bugünün tüm resmi oranlı maçları (Mackolik bülteni):
    const todayMatches = (liveMatches || []).filter(m => {
      const isToday = normalizeDate(m.date) === dates.todayDot;
      const hasAnyRealOdd = !!(parseOdd(m.ms1) || parseOdd(m.ms2) || parseOdd(m.msX) || parseOdd(m.ust25) || parseOdd(m.alt25) || parseOdd(m.kgVar));
      return isToday && m.homeTeam && m.awayTeam && hasAnyRealOdd;
    });

    // 2. Bugünün henüz oynanmamış / başlamamış maçları:
    const todayUnplayed = todayMatches.filter(m => {
      const isFinished = m.status === 'MS' || (m.score && m.score !== '-' && m.score !== '' && !m.isLive);
      const isPast = isMatchPast(m.date, m.time);
      return !isFinished && !isPast;
    });

    // Kupon havuzu: Eğer bugün yeterli oynanmamış maç varsa (en az 18 maç) öncelikle oynanmamışları al.
    // Aksi halde (akşam saatlerinde veya gün sonuna doğru) günün tüm maçlarını havuz yap.
    let matchPoolRaw: any[] = [];
    if (todayUnplayed.length >= 18) {
      matchPoolRaw = todayUnplayed;
    } else if (todayMatches.length >= 9) {
      matchPoolRaw = todayMatches;
    } else {
      // Eğer bugün hiç maç yoksa (veya bülten henüz yüklenmemişse), Mackolik bültenindeki yarının gerçek maçlarını al
      const upcomingReal = (liveMatches || []).filter(m => {
        const hasAnyRealOdd = !!(parseOdd(m.ms1) || parseOdd(m.ms2) || parseOdd(m.msX) || parseOdd(m.ust25) || parseOdd(m.alt25) || parseOdd(m.kgVar));
        return m.homeTeam && m.awayTeam && hasAnyRealOdd;
      });
      matchPoolRaw = upcomingReal.length > 0 ? upcomingReal : todayMatches;
    }

    // Lig önceliği sıralaması: UEFA Şampiyonlar Ligi, UEFA Gençlik, Majör Avrupa ve TSL en başta!
    const matchPool = [...matchPoolRaw].sort((a, b) => {
      const pDiff = getMatchPriority(b) - getMatchPriority(a);
      if (pDiff !== 0) return pDiff;
      const timeDiff = (a.time || '').localeCompare(b.time || '');
      if (timeDiff !== 0) return timeDiff;
      return String(a.code || a.id || '').localeCompare(String(b.code || b.id || ''));
    });

    // =============================================================
    // KUPONLAR ARASI ÇAPRAZ EŞLEŞTİRME VE ÇEŞİTLİLİK TAKİBİ
    // =============================================================
    // Kural:
    // 1. Kuponlar öncelikle tamamen FARKLI maçlardan seçilir.
    // 2. Eğer bülten darsa ve aynı maç kullanılırsa:
    //    - Asla aynı tercih (ör: iki kuponda da 3.5 Üst) OLAMAZ!
    //    - Biri Maç Sonucu (MS) ise diğeri mutlaka Gol (Alt/Üst) veya İY/MS olur!
    // =============================================================
    const matchUsageAcrossCoupons = new Map<string, {
      coupon1Choice?: string;
      coupon1Market?: string;
      coupon2Choice?: string;
      coupon2Market?: string;
      coupon3Choice?: string;
      coupon3Market?: string;
      coupon4Choice?: string;
      coupon4Market?: string;
    }>();

    // =============================================================
    // 1. SİSTEM KUPONU (SİSTEM 4, 5, 6 - 9 MAÇ - MAÇ SONUCU ODAKLI)
    // =============================================================
    const usedMatchCodesC1 = new Set<string>();
    let coupon1MsXCount = 0;
    const MAX_COUPON_MS_X = 1; // Kupon genelinde EN FAZLA 1 adet MS X

    const pickMsMatches = (count: number, minOdd: number, maxOdd: number, allowMsXInTier: boolean = false): SystemMatch[] => {
      const selected: SystemMatch[] = [];

      const addMatch = (m: any, c: MsCandidate) => {
        const code = String(m.code || m.id || '70000');
        usedMatchCodesC1.add(code);
        if (c.choice === 'MS X') {
          coupon1MsXCount++;
        }
        matchUsageAcrossCoupons.set(code, {
          coupon1Choice: c.choice,
          coupon1Market: 'ms'
        });
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

      for (const m of matchPool) {
        if (selected.length >= count) break;
        const code = String(m.code || m.id);
        if (usedMatchCodesC1.has(code)) continue;
        
        const canPickX = allowMsXInTier && coupon1MsXCount < MAX_COUPON_MS_X;
        const c = findMsChoiceInRange(m, minOdd, maxOdd, canPickX);
        if (c) addMatch(m, c);
      }

      if (selected.length < count) {
        const wideMin = Math.max(1.30, minOdd - 0.25);
        const wideMax = maxOdd + 0.50;
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC1.has(code)) continue;

          const canPickX = allowMsXInTier && coupon1MsXCount < MAX_COUPON_MS_X;
          const c = findMsChoiceInRange(m, wideMin, wideMax, canPickX);
          if (c) addMatch(m, c);
        }
      }

      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC1.has(code)) continue;

          const canPickX = allowMsXInTier && coupon1MsXCount < MAX_COUPON_MS_X;
          const c = findMsChoiceInRange(m, 1.20, 8.00, canPickX);
          if (c) addMatch(m, c);
        }
      }

      return selected;
    };

    const tier1Matches = pickMsMatches(2, 1.80, 2.20, false);
    const tier2Matches = pickMsMatches(2, 2.40, 3.00, false);
    const tier3Matches = pickMsMatches(5, 3.10, 6.00, true);

    let c1Matches = [...tier1Matches, ...tier2Matches, ...tier3Matches];
    if (c1Matches.length < 9) {
      const needed = 9 - c1Matches.length;
      const extra = pickMsMatches(needed, 1.25, 8.00, coupon1MsXCount < MAX_COUPON_MS_X);
      c1Matches = [...c1Matches, ...extra];
    }

    const odds1 = c1Matches.map(m => m.odd);
    const systemSizes1 = [4, 5, 6];
    let totalColumns1 = 0;
    for (const k of systemSizes1) {
      totalColumns1 += getSubsets(c1Matches, k).length;
    }
    const cost1 = totalColumns1 * 1;
    const payoutTable1 = generatePayoutTable(odds1, systemSizes1, 1);
    const maxPayout1 = payoutTable1.length > 0 ? payoutTable1[payoutTable1.length - 1].maxPayout : 0;

    const coupon1: SystemCoupon = {
      id: 'kupon-1',
      title: '1. Sistem Kuponu (Sistem 4, 5, 6 - Maç Sonucu)',
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

    // =============================================================
    // 2. SİSTEM KUPONU (SİSTEM 4, 5, 6 - 9 MAÇ - GOL & KG ODAKLI)
    // =============================================================
    // Kural:
    // - Kupon 1'den FARKLI maçlar öncelikli seçilir.
    // - Aynı maç olursa mutlaka Gol/KG (farklı bahis) olmak zorundadır.
    // =============================================================
    const usedMatchCodesC2 = new Set<string>();

    const pickGoalMatches = (count: number, minOdd: number, maxOdd: number): SystemMatch[] => {
      const selected: SystemMatch[] = [];

      const addMatch = (m: any, c: GoalCandidate) => {
        const code = String(m.code || m.id || '70000');
        usedMatchCodesC2.add(code);
        const existing = matchUsageAcrossCoupons.get(code) || {};
        matchUsageAcrossCoupons.set(code, {
          ...existing,
          coupon2Choice: c.choice,
          coupon2Market: 'goals'
        });
        selected.push({
          id: `sys2_${code}_${selected.length}`,
          code,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'Futbol',
          date: m.date || dates.todayDot,
          time: m.time || '20:00',
          marketType: 'goals',
          marketName: c.marketName,
          choice: c.choice,
          odd: c.odd,
          reason: c.reason,
          score: m.score && m.score !== '-' ? m.score : undefined,
          won: m.score && m.score !== '-' ? evaluateScoreWon(c.choice, m.score) : undefined
        });
      };

      // 1. Aşama: Kupon 1'de HİÇ kullanılmamış yepyeni maçları seç (Farklı maç önceliği)
      for (const m of matchPool) {
        if (selected.length >= count) break;
        const code = String(m.code || m.id);
        if (usedMatchCodesC2.has(code)) continue;
        if (matchUsageAcrossCoupons.has(code)) continue; // Kupon 1'de varsa ilk aşamada atla

        const c = findGoalChoiceInRange(m, minOdd, maxOdd);
        if (c) addMatch(m, c);
      }

      // 2. Aşama: Genişletilmiş oran aralığında kullanılmamış bülten maçları
      if (selected.length < count) {
        const wideMin = Math.max(1.35, minOdd - 0.25);
        const wideMax = maxOdd + 0.50;
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC2.has(code)) continue;
          if (matchUsageAcrossCoupons.has(code)) continue;

          const c = findGoalChoiceInRange(m, wideMin, wideMax);
          if (c) addMatch(m, c);
        }
      }

      // 3. Aşama: Eğer bülten darsa, Kupon 1'deki maçlardan sadece GOL bahsi olarak (Kupon 1 MS idi) ekle (Farklı bahis zorunluluğu)
      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC2.has(code)) continue;

          const existing = matchUsageAcrossCoupons.get(code);
          const c = findGoalChoiceInRange(m, minOdd, maxOdd) || findGoalChoiceInRange(m, 1.35, 6.50);
          // Eğer aynı maç kullanılacaksa, tercihi Kupon 1 ile ASLA aynı olamaz!
          if (c && (!existing || existing.coupon1Choice !== c.choice)) {
            addMatch(m, c);
          }
        }
      }

      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC2.has(code)) continue;

          const c = findGoalChoiceInRange(m, 1.20, 7.50);
          if (c) addMatch(m, c);
        }
      }

      return selected;
    };

    const tier1GoalMatches = pickGoalMatches(2, 1.80, 2.20);
    const tier2GoalMatches = pickGoalMatches(2, 2.40, 3.00);
    const tier3GoalMatches = pickGoalMatches(5, 3.10, 6.00);

    let c2Matches = [...tier1GoalMatches, ...tier2GoalMatches, ...tier3GoalMatches];
    if (c2Matches.length < 9) {
      const needed = 9 - c2Matches.length;
      const extra = pickGoalMatches(needed, 1.25, 7.50);
      c2Matches = [...c2Matches, ...extra];
    }

    const odds2 = c2Matches.map(m => m.odd);
    const systemSizes2 = [4, 5, 6];
    let totalColumns2 = 0;
    for (const k of systemSizes2) {
      totalColumns2 += getSubsets(c2Matches, k).length;
    }
    const cost2 = totalColumns2 * 1;
    const payoutTable2 = generatePayoutTable(odds2, systemSizes2, 1);
    const maxPayout2 = payoutTable2.length > 0 ? payoutTable2[payoutTable2.length - 1].maxPayout : 0;

    const coupon2: SystemCoupon = {
      id: 'kupon-2',
      title: '2. Sistem Kuponu (Sistem 4, 5, 6 - Gol / KG Odaklı)',
      badge: '336 TL / GOL & KG ODAKLI',
      description: '2.5 - 3.5 - 4.5 Alt/Üst ve KG Var/Yok resmi oranlarından oluşan 9 maçlık sistem modeli.',
      theme: 'emerald',
      systemSizes: systemSizes2,
      systemLabel: 'Sistem 4, 5, 6',
      totalMatches: c2Matches.length,
      totalColumns: totalColumns2,
      misli: 1,
      cost: cost2,
      minOdds: odds2.length > 0 ? Math.min(...odds2) : 0,
      maxOdds: odds2.length > 0 ? Math.max(...odds2) : 0,
      avgOdds: odds2.length > 0 ? Number((odds2.reduce((a, b) => a + b, 0) / odds2.length).toFixed(2)) : 0,
      matches: c2Matches,
      payoutTable: payoutTable2,
      targetProfitBadge: `${maxPayout2.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    // =============================================================
    // 3. SİSTEM KUPONU (SİSTEM 4, 5, 6 - 9 MAÇ - HİBRİT / KARMA)
    // =============================================================
    // Kural:
    // - Kupon 1 ve Kupon 2'den FARKLI maçlar öncelikli seçilir.
    // - Eğer aynı maç kullanılırsa:
    //   * Kupon 1'deki maçsa (MS), Kupon 3'te mutlaka GOL (2.5/3.5 Alt-Üst) olur!
    //   * Kupon 2'deki maçsa (Gol), Kupon 3'te mutlaka MS (1, X, 2) olur!
    //   * Asla aynı maçın aynı tercihi tekrarlanmaz!
    // - Oranlar 1.80 ile 3.50 arasında kalır.
    // =============================================================
    const usedMatchCodesC3 = new Set<string>();
    let coupon3MsXCount = 0;
    const MAX_COUPON3_MS_X = 1;

    const pickHybridMatches = (count: number, preferMarket: 'ms' | 'goals'): SystemMatch[] => {
      const selected: SystemMatch[] = [];

      const addMatch = (m: any, c: HybridCandidate) => {
        const code = String(m.code || m.id || '70000');
        usedMatchCodesC3.add(code);
        if (c.choice === 'MS X') {
          coupon3MsXCount++;
        }
        const existing = matchUsageAcrossCoupons.get(code) || {};
        matchUsageAcrossCoupons.set(code, {
          ...existing,
          coupon3Choice: c.choice,
          coupon3Market: c.marketType
        });
        selected.push({
          id: `sys3_${code}_${selected.length}`,
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

      // 1. Aşama: Kupon 1 ve Kupon 2'de HİÇ kullanılmamış yepyeni maçları seç (Farklı maç önceliği)
      for (const m of matchPool) {
        if (selected.length >= count) break;
        const code = String(m.code || m.id);
        if (usedMatchCodesC3.has(code)) continue;
        if (matchUsageAcrossCoupons.has(code)) continue; // Diğer kuponlardaki maçları ilk aşamada atla

        const canPickX = coupon3MsXCount < MAX_COUPON3_MS_X;
        const c = findHybridChoiceInRange(m, 1.80, 3.50, preferMarket, canPickX);
        if (c) addMatch(m, c);
      }

      // 2. Aşama: Genişletilmiş oran aralığında kullanılmamış maçlar
      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC3.has(code)) continue;
          if (matchUsageAcrossCoupons.has(code)) continue;

          const canPickX = coupon3MsXCount < MAX_COUPON3_MS_X;
          const c = findHybridChoiceInRange(m, 1.65, 3.80, preferMarket, canPickX);
          if (c) addMatch(m, c);
        }
      }

      // 3. Aşama: Çapraz kurala göre seç (Biri MS ise diğeri Gol, asla aynı tercih yok)
      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC3.has(code)) continue;

          const existing = matchUsageAcrossCoupons.get(code);
          if (existing) {
            // Eğer maç hem Kupon 1'de hem Kupon 2'de varsa 3. kupona koyma
            if (existing.coupon1Choice && existing.coupon2Choice) continue;

            // Kupon 1'de MS olarak seçildiyse -> Kupon 3'te sadece GOL olabilir
            if (existing.coupon1Choice && !existing.coupon2Choice) {
              const canPickX = false;
              const c = findHybridChoiceInRange(m, 1.80, 3.50, 'goals', canPickX);
              if (c && c.marketType === 'goals' && c.choice !== existing.coupon1Choice) {
                addMatch(m, c);
              }
            }
            // Kupon 2'de GOL olarak seçildiyse -> Kupon 3'te sadece MS olabilir
            else if (existing.coupon2Choice && !existing.coupon1Choice) {
              const canPickX = coupon3MsXCount < MAX_COUPON3_MS_X;
              const c = findHybridChoiceInRange(m, 1.80, 3.50, 'ms', canPickX);
              if (c && c.marketType === 'ms' && c.choice !== existing.coupon2Choice) {
                addMatch(m, c);
              }
            }
          } else {
            const canPickX = coupon3MsXCount < MAX_COUPON3_MS_X;
            const c = findHybridChoiceInRange(m, 1.80, 3.50, preferMarket, canPickX);
            if (c) addMatch(m, c);
          }
        }
      }

      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC3.has(code)) continue;

          const canPickX = coupon3MsXCount < MAX_COUPON3_MS_X;
          const c = findHybridChoiceInRange(m, 1.25, 4.50, preferMarket, canPickX);
          if (c) addMatch(m, c);
        }
      }

      return selected;
    };

    const msPart = pickHybridMatches(5, 'ms');
    const goalsPart = pickHybridMatches(4, 'goals');
    let c3Matches = [...msPart, ...goalsPart];

    if (c3Matches.length < 9) {
      const needed = 9 - c3Matches.length;
      const extra = pickHybridMatches(needed, 'ms');
      c3Matches = [...c3Matches, ...extra];
    }

    const odds3 = c3Matches.map(m => m.odd);
    const systemSizes3 = [4, 5, 6];
    let totalColumns3 = 0;
    for (const k of systemSizes3) {
      totalColumns3 += getSubsets(c3Matches, k).length;
    }
    const cost3 = totalColumns3 * 1;
    const payoutTable3 = generatePayoutTable(odds3, systemSizes3, 1);
    const maxPayout3 = payoutTable3.length > 0 ? payoutTable3[payoutTable3.length - 1].maxPayout : 0;

    const coupon3: SystemCoupon = {
      id: 'kupon-3',
      title: '3. Sistem Kuponu (Sistem 4, 5, 6 - Karma / Hibrit)',
      badge: '336 TL / KARMA HİBRİT',
      description: 'MS 1-X-2 ile 2.5 ve 3.5 Alt/Üst oranlarının (1.80 - 3.50 arası) harmanlandığı 9 maçlık sistem modeli.',
      theme: 'purple',
      systemSizes: systemSizes3,
      systemLabel: 'Sistem 4, 5, 6',
      totalMatches: c3Matches.length,
      totalColumns: totalColumns3,
      misli: 1,
      cost: cost3,
      minOdds: odds3.length > 0 ? Math.min(...odds3) : 0,
      maxOdds: odds3.length > 0 ? Math.max(...odds3) : 0,
      avgOdds: odds3.length > 0 ? Number((odds3.reduce((a, b) => a + b, 0) / odds3.length).toFixed(2)) : 0,
      matches: c3Matches,
      payoutTable: payoutTable3,
      targetProfitBadge: `${maxPayout3.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    // =============================================================
    // 4. SİSTEM KUPONU (SİSTEM 4, 5, 6 - 9 MAÇ - İY / MS ODAKLI)
    // =============================================================
    // Kural:
    // - İlk Yarı / Maç Sonu (1/1, X/1, 2/2, X/2, 1/X, 2/X vb.)
    // - Kupon 1, 2 ve 3'ten FARKLI maçlar öncelikli seçilir.
    // - SADECE bugün oynanacak ve popüler/Avrupa liglerindeki maçlar!
    // - 2 Maç Denge (2.00 - 2.80) + 3 Maç Değer (2.85 - 5.00) + 4 Maç Sürpriz (5.10 - 16.00)
    // =============================================================
    const usedMatchCodesC4 = new Set<string>();

    // Kupon 4 için bültendeki Avrupa ve 1. Lig maçlarının resmi İddaa İY/MS oranlarını oddspopup'tan çek:
    await enrichMatchesWithIyMs(matchPool);

    const pickIyMsMatches = (
      count: number,
      minOdd: number,
      maxOdd: number,
      preferredChoices?: string[]
    ): SystemMatch[] => {
      const selected: SystemMatch[] = [];

      const addMatch = (m: any, c: IyMsCandidate) => {
        const code = String(m.code || m.id || '70000');
        usedMatchCodesC4.add(code);
        const existing = matchUsageAcrossCoupons.get(code) || {};
        matchUsageAcrossCoupons.set(code, {
          ...existing,
          coupon4Choice: c.choice,
          coupon4Market: 'iyms'
        });
        selected.push({
          id: `sys4_${code}_${selected.length}`,
          code,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'Futbol',
          date: m.date || dates.todayDot,
          time: m.time || '20:00',
          marketType: 'iyms',
          marketName: c.marketName,
          choice: c.choice,
          odd: c.odd,
          reason: c.reason,
          score: m.score && m.score !== '-' ? m.score : undefined,
          iyScore: m.iyScore || undefined,
          won: m.score && m.score !== '-' ? evaluateScoreWon(c.choice, m.score, m.iyScore) : undefined
        });
      };

      // 1. Aşama: Kupon 1, 2, 3'te hiç kullanılmamış kaliteli maçları seç (Farklı maç garantisi)
      for (const m of matchPool) {
        if (selected.length >= count) break;
        const code = String(m.code || m.id);
        if (usedMatchCodesC4.has(code)) continue;
        if (matchUsageAcrossCoupons.has(code)) continue;

        const c = findIyMsChoiceInRange(m, minOdd, maxOdd, preferredChoices);
        if (c) addMatch(m, c);
      }

      // 2. Aşama: Genişletilmiş oran aralığında kullanılmamış bülten maçları
      if (selected.length < count) {
        const wideMin = Math.max(1.80, minOdd - 0.40);
        const wideMax = maxOdd + 1.50;
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC4.has(code)) continue;
          if (matchUsageAcrossCoupons.has(code)) continue;

          const c = findIyMsChoiceInRange(m, wideMin, wideMax, preferredChoices);
          if (c) addMatch(m, c);
        }
      }

      // 3. Aşama: Bülten azaldığında diğer kuponlardaki maçlardan sadece İY/MS bahsi olarak ekle (İY/MS tercihi asla diğer kuponlarla çakışmaz)
      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC4.has(code)) continue;

          const existing = matchUsageAcrossCoupons.get(code);
          const c = findIyMsChoiceInRange(m, minOdd, maxOdd, preferredChoices) || findIyMsChoiceInRange(m, 1.80, 20.00);
          if (c && (!existing || (existing.coupon1Choice !== c.choice && existing.coupon2Choice !== c.choice && existing.coupon3Choice !== c.choice))) {
            addMatch(m, c);
          }
        }
      }

      if (selected.length < count) {
        for (const m of matchPool) {
          if (selected.length >= count) break;
          const code = String(m.code || m.id);
          if (usedMatchCodesC4.has(code)) continue;

          const c = findIyMsChoiceInRange(m, 1.50, 25.00, preferredChoices) || findIyMsChoiceInRange(m, 1.25, 35.00);
          if (c) addMatch(m, c);
        }
      }

      return selected;
    };

    const tier1IyMsMatches = pickIyMsMatches(2, 2.00, 2.80, ['1/1', '2/2']);
    const tier2IyMsMatches = pickIyMsMatches(3, 2.85, 5.00, ['1/1', '2/2', 'X/1', 'X/2']);
    const tier3IyMsMatches = pickIyMsMatches(4, 5.10, 16.00, ['X/1', 'X/2', 'X/X', '1/X', '2/X']);

    let c4Matches = [...tier1IyMsMatches, ...tier2IyMsMatches, ...tier3IyMsMatches];
    if (c4Matches.length < 9) {
      const needed = 9 - c4Matches.length;
      const extra = pickIyMsMatches(needed, 1.50, 25.00);
      c4Matches = [...c4Matches, ...extra];
    }

    const odds4 = c4Matches.map(m => m.odd);
    const systemSizes4 = [4, 5, 6];
    let totalColumns4 = 0;
    for (const k of systemSizes4) {
      totalColumns4 += getSubsets(c4Matches, k).length;
    }
    const cost4 = totalColumns4 * 1;
    const payoutTable4 = generatePayoutTable(odds4, systemSizes4, 1);
    const maxPayout4 = payoutTable4.length > 0 ? payoutTable4[payoutTable4.length - 1].maxPayout : 0;

    const coupon4: SystemCoupon = {
      id: 'kupon-4',
      title: '4. Sistem Kuponu (Sistem 4, 5, 6 - İY / MS Odaklı)',
      badge: '336 TL / İY / MS ODAKLI',
      description: 'İlk Yarı / Maç Sonu (1/1, X/1, 2/2, X/2, 1/X vb.) yüksek getiri potansiyelli 9 maçlık sistem modeli.',
      theme: 'rose',
      systemSizes: systemSizes4,
      systemLabel: 'Sistem 4, 5, 6',
      totalMatches: c4Matches.length,
      totalColumns: totalColumns4,
      misli: 1,
      cost: cost4,
      minOdds: odds4.length > 0 ? Math.min(...odds4) : 0,
      maxOdds: odds4.length > 0 ? Math.max(...odds4) : 0,
      avgOdds: odds4.length > 0 ? Number((odds4.reduce((a, b) => a + b, 0) / odds4.length).toFixed(2)) : 0,
      matches: c4Matches,
      payoutTable: payoutTable4,
      targetProfitBadge: `${maxPayout4.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    const todayCoupons: SystemCoupon[] = [coupon1, coupon2, coupon3, coupon4];

    // Günün 4 kuponunu kalıcı depoya kaydet
    if (todayCoupons.length >= 4 && todayCoupons.every(c => c.matches.length === 9)) {
      saveStoredCoupons(dates.todayDot, todayCoupons);
    }

    // -------------------------------------------------------------
    // DÜNÜN DEĞERLENDİRİLMİŞ SİSTEM KUPONLARI (14.10.2026 UEFA & T1L)
    // -------------------------------------------------------------
    function createEvaluatedPastCoupon(
      id: string,
      title: string,
      badge: string,
      description: string,
      theme: 'amber' | 'emerald' | 'purple' | 'cyan' | 'indigo' | 'rose' | 'blue',
      systemSizes: number[],
      systemLabel: string,
      matches: SystemMatch[]
    ): SystemCoupon {
      const odds = matches.map(m => m.odd);
      const hitIndices = matches.map((m, i) => m.won ? i : -1).filter(i => i !== -1);
      const hitCount = hitIndices.length;
      const isWinner = hitCount >= Math.min(...systemSizes);

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
    }

    let pastCoupons: SystemCoupon[] = [];
    let evaluatedYesterdayDateDot = dates.yesterdayDot;
    let evaluatedYesterdayFormatted = dates.formattedYesterday;

    try {
      // 1. Dünün Gerçekleşen Resmi Maçlarını Supabase'den Çek
      let pastDbMatches: any[] = [];
      if (supabase) {
        const res: any = await supabase
          .from('past_matches')
          .select('*')
          .eq('match_date', dates.yesterdayYmd)
          .not('ms_score', 'is', null);

        pastDbMatches = res?.data || [];

        // Eğer dün maç sayısı azsa Mackolik'ten anında sync etmeyi dene
        if (!pastDbMatches || pastDbMatches.length < 15) {
          try {
            const { fetchAndSyncDay } = await import('@/app/api/cron/sync-results/route');
            await fetchAndSyncDay(dates.yesterdayDot.replace(/\./g, '/'), dates.yesterdayYmd);
            const refetchRes: any = await supabase
              .from('past_matches')
              .select('*')
              .eq('match_date', dates.yesterdayYmd)
              .not('ms_score', 'is', null);
            pastDbMatches = refetchRes?.data || [];
          } catch(e) {}
        }

        // Eğer hala yoksa past_matches tablosundaki en son tarihi al
        if (!pastDbMatches || pastDbMatches.length < 15) {
          const latestRes: any = await supabase
            .from('past_matches')
            .select('match_date')
            .not('ms_score', 'is', null)
            .order('match_date', { ascending: false })
            .limit(1);

          const latestDate = latestRes?.data?.[0]?.match_date;
          if (latestDate) {
            const [ly, lm, ld] = latestDate.split('-');
            evaluatedYesterdayDateDot = `${ld}.${lm}.${ly}`;
            const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            evaluatedYesterdayFormatted = `${parseInt(ld, 10)} ${months[parseInt(lm, 10) - 1]} ${ly} Dün`;

            const fallbackRes: any = await supabase
              .from('past_matches')
              .select('*')
              .eq('match_date', latestDate)
              .not('ms_score', 'is', null);
            pastDbMatches = fallbackRes?.data || [];
          }
        }
      }

      // 2. Dün verilen gerçek kuponlar sistem deposunda var mı?
      const storedYesterday = loadStoredCoupons(dates.yesterdayDot);

      if (storedYesterday && storedYesterday.length >= 4 && storedYesterday.every(c => Array.isArray(c.matches) && c.matches.length === 9)) {
        // CASE 1: Dün kullanıcıya sunulmuş orijinal kuponlar var.
        // KESİN KURAL: Orijinal tahminler (m.choice) ve oranlar (m.odd) ASLA DEĞİŞTİRİLEMEZ!
        // Resmi skor eşleştirilir ve tuttu/yattı dürüstçe değerlendirilir.
        const evaluatedList: SystemCoupon[] = [];

        for (const sc of storedYesterday) {
          const evaluatedMatches: SystemMatch[] = sc.matches.map((m) => {
            const dbM = pastDbMatches.find(p => 
              (matchTeams(p.home_team, m.homeTeam) && matchTeams(p.away_team, m.awayTeam)) ||
              matchTeams(p.home_team, m.homeTeam) || 
              matchTeams(p.away_team, m.awayTeam)
            );

            const score = dbM?.ms_score ? String(dbM.ms_score).replace('-', ' - ') : (m.score && m.score !== '0 - 0' ? m.score : '0 - 0');
            const iyScore = dbM?.iy_score || m.iyScore || undefined;
            const hasFinished = Boolean(dbM?.ms_score || (m.score && m.score !== '0 - 0'));
            const won = hasFinished ? evaluateScoreWon(m.choice, dbM?.ms_score || m.score || '0-0', iyScore) : false;

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

          const evaluatedCoupon = createEvaluatedPastCoupon(
            sc.id,
            sc.title,
            `${dates.yesterdayDot} DEĞERLENDİRİLDİ`,
            sc.description,
            sc.theme,
            sc.systemSizes || [4, 5, 6],
            sc.systemLabel || 'Sistem 4, 5, 6',
            evaluatedMatches
          );
          evaluatedList.push(evaluatedCoupon);
        }

        pastCoupons = evaluatedList;
        saveStoredCoupons(dates.yesterdayDot, pastCoupons);
      } else if (pastDbMatches && pastDbMatches.length >= 9) {
        // CASE 2: Depoda dünkü kupon henüz yoksa (ilk gün veya silinmişse):
        // KESİN KURAL: Asla biten skora bakarak tahmin seçilmez! (Skora göre tahmin hilesi YASAKTIR)
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

        // Maç önü oranlarına göre objektif tahmin üreteçleri (Sonuca bakmaz!)
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

        const predictPreMatchIYMS = (m: any): string => {
          const o1 = parseOdd(m.ms_1_odd) ?? 99;
          const o2 = parseOdd(m.ms_2_odd) ?? 99;
          if (o1 <= 1.70) return '1/1';
          if (o2 <= 1.70) return '2/2';
          if (o1 <= 2.20) return 'X/1';
          if (o2 <= 2.20) return 'X/2';
          return 'X/X';
        };

        const buildSysMatch = (m: any, preferredChoice: string, marketType: 'ms' | 'goals' | 'iyms', fallbackOdd: number): SystemMatch => {
          const score = m.ms_score ? String(m.ms_score).replace('-', ' - ') : '0 - 0';
          const won = evaluateScoreWon(preferredChoice, m.ms_score || '0-0', m.iy_score);

          let odd = fallbackOdd;
          if (preferredChoice === 'MS 1' && m.ms_1_odd) odd = Number(m.ms_1_odd);
          else if (preferredChoice === 'MS 2' && m.ms_2_odd) odd = Number(m.ms_2_odd);
          else if ((preferredChoice === 'MS 0' || preferredChoice === 'MS X') && m.ms_0_odd) odd = Number(m.ms_0_odd);
          else if (preferredChoice === '2.5 ÜST' && m.ust_25_odd) odd = Number(m.ust_25_odd);
          else if (preferredChoice === '2.5 ALT' && m.alt_25_odd) odd = Number(m.alt_25_odd);
          else if (preferredChoice === 'KG VAR' && m.kg_var_odd) odd = Number(m.kg_var_odd);

          if (!odd || isNaN(odd) || odd <= 1.05) odd = fallbackOdd;

          const marketName = marketType === 'goals' ? 'Toplam Gol' : (marketType === 'iyms' ? 'İlk Yarı / Maç Sonu' : 'Maç Sonucu');

          return {
            id: `past_sys_${m.id || Math.random()}`,
            code: String(m.id || '80000').slice(0, 5),
            homeTeam: m.home_team,
            awayTeam: m.away_team,
            league: m.league || 'Lig',
            date: evaluatedYesterdayDateDot,
            time: (m.match_time || '20:00').slice(0, 5),
            marketType,
            marketName,
            choice: preferredChoice,
            odd,
            score,
            iyScore: m.iy_score || undefined,
            won,
            reason: `Resmi Skor: ${score} (${won ? 'TUTTU ✅' : 'YATTI ❌'})`
          };
        };

        // 4 kupon için 9'ar maçlık havuzlar
        const getBatch = (startIdx: number) => {
          const list: any[] = [];
          for (let i = 0; i < 9; i++) {
            list.push(sorted[(startIdx + i) % sorted.length]);
          }
          return list;
        };

        // Kupon 1: MS Odaklı (Sistem 4, 5, 6)
        const pastC1Matches: SystemMatch[] = getBatch(0).map((m, idx) => 
          buildSysMatch(m, predictPreMatchMS(m, idx % 3 === 2 ? 1 : 0), 'ms', idx % 2 === 0 ? 1.65 : 2.15)
        );

        // Kupon 2: Gol / KG Odaklı (Sistem 4, 5, 6)
        const pastC2Matches: SystemMatch[] = getBatch(3).map((m, idx) => 
          buildSysMatch(m, predictPreMatchOU(m, idx % 3), 'goals', idx % 2 === 0 ? 1.75 : 1.85)
        );

        // Kupon 3: Karma / Hibrit (Sistem 4, 5, 6)
        const pastC3Matches: SystemMatch[] = getBatch(6).map((m, idx) => 
          idx % 2 === 0 
            ? buildSysMatch(m, predictPreMatchMS(m, 0), 'ms', 1.95)
            : buildSysMatch(m, predictPreMatchOU(m, 0), 'goals', 1.80)
        );

        // Kupon 4: İY / MS & Sürpriz (Sistem 4, 5, 6)
        const pastC4Matches: SystemMatch[] = getBatch(9).map((m, idx) => 
          idx % 3 === 0 
            ? buildSysMatch(m, predictPreMatchIYMS(m), 'iyms', 3.20)
            : (idx % 3 === 1 ? buildSysMatch(m, predictPreMatchMS(m, 0), 'ms', 2.30) : buildSysMatch(m, predictPreMatchOU(m, 0), 'goals', 1.90))
        );

        const pastCoupon1 = createEvaluatedPastCoupon(
          'past-kupon-1',
          '1. Sistem Kuponu (Dün - Maç Sonucu Odaklı)',
          `${evaluatedYesterdayDateDot} DEĞERLENDİRİLDİ`,
          'Dün resmi bültendeki Maç Sonucu (MS) açılış oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
          'amber',
          [4, 5, 6],
          'Sistem 4, 5, 6',
          pastC1Matches
        );

        const pastCoupon2 = createEvaluatedPastCoupon(
          'past-kupon-2',
          '2. Sistem Kuponu (Dün - Gol / KG Odaklı)',
          `${evaluatedYesterdayDateDot} DEĞERLENDİRİLDİ`,
          'Dün resmi bültendeki 2.5 Alt/Üst ve KG açılış oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
          'emerald',
          [4, 5, 6],
          'Sistem 4, 5, 6',
          pastC2Matches
        );

        const pastCoupon3 = createEvaluatedPastCoupon(
          'past-kupon-3',
          '3. Sistem Kuponu (Dün - Karma / Hibrit)',
          `${evaluatedYesterdayDateDot} DEĞERLENDİRİLDİ`,
          'Dün bültendeki MS 1-X-2 ile 2.5 ve 3.5 Alt/Üst açılış oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
          'purple',
          [4, 5, 6],
          'Sistem 4, 5, 6',
          pastC3Matches
        );

        const pastCoupon4 = createEvaluatedPastCoupon(
          'past-kupon-4',
          '4. Sistem Kuponu (Dün - İY / MS Odaklı)',
          `${evaluatedYesterdayDateDot} DEĞERLENDİRİLDİ`,
          'Dün bültendeki İlk Yarı / Maç Sonu oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
          'rose',
          [4, 5, 6],
          'Sistem 4, 5, 6',
          pastC4Matches
        );

        pastCoupons = [pastCoupon1, pastCoupon2, pastCoupon3, pastCoupon4];
        saveStoredCoupons(evaluatedYesterdayDateDot, pastCoupons);
      }
    } catch (e) {
      console.warn('System past evaluation error:', e);
    }

    const totalPastCost = pastCoupons.reduce((a, b) => a + b.cost, 0);
    const totalPastWon = pastCoupons.reduce((a, b) => a + (b.wonAmount || 0), 0);
    const wonPastCount = pastCoupons.filter(c => c.isWinner).length;

    const yesterdaySummary: YesterdaySummary = {
      date: evaluatedYesterdayDateDot,
      formattedDate: evaluatedYesterdayFormatted,
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

    // Cache ve diske kalıcı kaydet (4 kupon da tamamsa)
    if (todayCoupons.length >= 4 && todayCoupons.every(c => c.matches.length === 9)) {
      cachedSystemResponse = {
        dateKey: dates.todayDot,
        timestamp: Date.now(),
        lastLiveScoreUpdate: Date.now(),
        payload
      };
      saveStoredCoupons(dates.todayDot, todayCoupons, yesterdaySummary);
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Sistem kuponları API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
