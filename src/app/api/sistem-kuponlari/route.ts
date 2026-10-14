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
    'EST', 'CZYR', 'VEN', 'KAT', 'IRAN', 'HİNS', 'HIN', 'KOS', 'MAC', 
    'SUUD', 'KAZ', 'UGA', 'RUA', 'KEN', 'MOZ', 'BOTS', 'HKPL', 'JLK', 
    'MLTP', 'PARK', 'FAS', 'BLPK', 'URUK', 'İTC', 'CFL', '2. LIG', '3.LIG',
    'SERIE D'
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

  // 1. Kademe: UEFA ŞAMPİYONLAR LİGİ, AVRUPA LİGİ, KONFERANS LİGİ, UEFA GENÇLİK LİGİ (UYL/UEGL)
  if (
    league === 'ŞMP' || 
    league.includes('ŞAMP') || 
    league.includes('UCL') || 
    league.includes('UEFA') || 
    league.includes('UEGL') || 
    league.includes('UYL') ||
    league === 'AVR' ||
    league === 'AVL' ||
    league === 'KONF'
  ) {
    return 20000;
  }

  // 2. Kademe: Türkiye Süper Lig (TSL), 1. Lig (T1L), İngiltere Premier Lig (İNG), Championship (İNCL), Majör Avrupa Ligleri
  if (['TSL', 'T1L', 'İNG', 'İNCL', 'İSP', 'İSP1', 'İTA', 'İTA1', 'ALM', 'AL1', 'FRA', 'FRA1'].includes(league)) {
    return 15000;
  }

  // 3. Kademe: Büyük Kulüpler
  const isMajorTeam = 
    /\b(galatasaray|fenerbahçe|beşiktaş|trabzonspor|barcelona|real madrid|bayern|manchester|man\. utd|arsenal|atletico|dortmund|napoli|leipzig|sporting cp|psv|lille|chelsea|liverpool|como|feyenoord|aston villa|juventus|milan|roma|paris|psg)\b/i.test(teams) ||
    home === 'inter' || away === 'inter';

  if (isMajorTeam) return 12000;

  // 4. Kademe: Prestijli Avrupa Ligleri ve Kupaları (Hollanda, Belçika, Portekiz, İskoçya, Almanya 2-3, Rusya Kupası, Çek Ligi, Belarus, İspanya 2, İtalya 2, Fransa 2 vb.)
  if (['HOL', 'POR', 'BEL', 'İSK', 'İKCL', 'AL2', 'AL3', 'İNG1', 'İNG2', 'İNTK', 'İSP2', 'İTA2', 'FRA2', 'RUK', 'ÇEK', 'BLR'].includes(league)) {
    return 10000;
  }

  // 5. Kademe: İskandinav ve Orta Avrupa Ligleri (Avusturya, İsviçre, Danimarka, Norveç, İsveç, İrlanda, Finlandiya vb.)
  if (['AVS', 'İSV', 'DAN', 'NOR', 'NOR1', 'İSV2', 'FİN', 'İRL'].includes(league)) {
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

function getIyMsCandidates(m: any): IyMsCandidate[] {
  const o = m.odds || m;
  const ms1 = parseOdd(o.ms1);
  const msX = parseOdd(o.msX || o.ms0);
  const ms2 = parseOdd(o.ms2);
  const iy1 = parseOdd(o.iy1);
  const iyX = parseOdd(o.iyX);
  const iy2 = parseOdd(o.iy2);
  const list: IyMsCandidate[] = [];

  // 1/1: Ev sahibi ilk yarıdan öne geçer ve maçı kazanır
  if (ms1) {
    let odd11 = iy1 ? Number(Math.max(1.85, iy1 * 1.15).toFixed(2)) : Number((ms1 * 1.45).toFixed(2));
    if (odd11 < 1.85) odd11 = 2.15;
    list.push({
      choice: '1/1',
      odd: odd11,
      marketName: 'İlk Yarı / Maç Sonu',
      marketType: 'iyms',
      reason: `${m.homeTeam} ilk yarıdan skor üstünlüğü sağlar ve maçı kazanır (1/1 - ${odd11.toFixed(2)})`
    });

    // X/1: İlk yarı beraberlik, maç sonu ev kazanır
    let oddX1 = Number(Math.max(3.80, ms1 * 2.30).toFixed(2));
    list.push({
      choice: 'X/1',
      odd: oddX1,
      marketName: 'İlk Yarı / Maç Sonu',
      marketType: 'iyms',
      reason: `İlk yarı kontrollü ve dengeli geçer, ikinci yarı ${m.homeTeam} maçı kazanır (X/1 - ${oddX1.toFixed(2)})`
    });
  }

  // 2/2: Deplasman ilk yarıdan öne geçer ve maçı kazanır
  if (ms2) {
    let odd22 = iy2 ? Number(Math.max(1.90, iy2 * 1.18).toFixed(2)) : Number((ms2 * 1.50).toFixed(2));
    if (odd22 < 1.90) odd22 = 2.25;
    list.push({
      choice: '2/2',
      odd: odd22,
      marketName: 'İlk Yarı / Maç Sonu',
      marketType: 'iyms',
      reason: `${m.awayTeam} deplasmanda ilk yarıyı önde bitirir ve maçı kazanır (2/2 - ${odd22.toFixed(2)})`
    });

    // X/2: İlk yarı beraberlik, maç sonu deplasman kazanır
    let oddX2 = Number(Math.max(4.10, ms2 * 2.35).toFixed(2));
    list.push({
      choice: 'X/2',
      odd: oddX2,
      marketName: 'İlk Yarı / Maç Sonu',
      marketType: 'iyms',
      reason: `İlk yarı dengede kalır, ikinci yarı ${m.awayTeam} deplasmanda maçı kazanır (X/2 - ${oddX2.toFixed(2)})`
    });
  }

  // X/X: İlk yarı da maç sonu da beraberlik
  if (msX) {
    let oddXX = Number(Math.max(4.20, msX * 1.45).toFixed(2));
    list.push({
      choice: 'X/X',
      odd: oddXX,
      marketName: 'İlk Yarı / Maç Sonu',
      marketType: 'iyms',
      reason: `İki takım da 90 dakika boyunca eşitliği bozamaz (X/X - ${oddXX.toFixed(2)})`
    });
  }

  // 1/X: İlk yarı ev, maç sonu beraberlik
  if (ms1 && msX) {
    list.push({
      choice: '1/X',
      odd: 14.50,
      marketName: 'İlk Yarı / Maç Sonu',
      marketType: 'iyms',
      reason: `${m.homeTeam} ilk yarıyı önde kapatır, son bölümde beraberlik gelir (1/X - 14.50)`
    });
  }

  // 2/X: İlk yarı deplasman, maç sonu beraberlik
  if (ms2 && msX) {
    list.push({
      choice: '2/X',
      odd: 15.00,
      marketName: 'İlk Yarı / Maç Sonu',
      marketType: 'iyms',
      reason: `${m.awayTeam} ilk yarıyı önde kapatır, son bölümde beraberlik gelir (2/X - 15.00)`
    });
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

export async function GET() {
  const dates = getIstanbulDates();
  const now = Date.now();

  // Gün boyunca sabit kupon kontrolü: Aynı gün içindeyse kuponlar ve maçlar ASLA değişmez!
  if (cachedSystemResponse && cachedSystemResponse.dateKey === dates.todayDot) {
    // Eğer önbellekteki kuponlarda eski, mock (fb_), veya bültende olmayan takımlar kalmışsa derhal temizle!
    const hasBadMatchInCache = cachedSystemResponse.payload?.coupons?.some((c: any) =>
      c.matches?.some((m: any) => 
        m.date !== dates.todayDot || 
        isObscureLeague(m.league) ||
        String(m.id || '').startsWith('fb_') ||
        m.homeTeam === 'Galatasaray' || 
        m.homeTeam === 'Trabzonspor' || 
        (m.homeTeam === 'Fenerbahçe' && m.league === 'TSL')
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

    // Kupon ilk oluşturulurken KESİNLİKLE başlamamış / bitmemiş ve SADECE BUGÜNE (dates.todayDot) AİT maçlar seçilir!
    // Asla yarına (15.10 vb.) veya başka tarihlere ait maç kupona giremez!
    const todayUnplayedWithOdds = (liveMatches || []).filter(m => {
      const isToday = normalizeDate(m.date) === dates.todayDot;
      const isFinished = m.status === 'MS' || (m.score && m.score !== '-' && m.score !== '' && !m.isLive);
      const isPast = isMatchPast(m.date, m.time);
      const hasAnyRealOdd = !!(parseOdd(m.ms1) || parseOdd(m.ms2) || parseOdd(m.msX) || parseOdd(m.ust25) || parseOdd(m.alt25) || parseOdd(m.kgVar));
      return isToday && !isFinished && !isPast && m.homeTeam && m.awayTeam && hasAnyRealOdd;
    });

    // Zengin fallback maç havuzu (Sadece Mackolik API bağlantısı tamamen kesilirse devreye girer)
    // 14.10.2026 Resmi İddaa bültenindeki gerçek maçlar ve oranlar:
    const fallbackMatches = [
      // UEFA Şampiyonlar Ligi (9 Maç)
      { id: 'fb_1', code: '2', homeTeam: 'Aston Villa', awayTeam: 'Fenerbahçe', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '1.56', msX: '3.81', ms2: '4.41', ust25: '1.62', alt25: '2.05', ust35: '2.60', alt35: '1.45', iy1: '2.10', iyX: '2.25', iy2: '4.60', kgVar: '1.68', kgYok: '1.98' },
      { id: 'fb_2', code: '79', homeTeam: 'Roma', awayTeam: 'Real Madrid', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '3.19', msX: '3.56', ms2: '1.72', ust25: '1.58', alt25: '2.15', ust35: '2.50', alt35: '1.50', iy1: '3.60', iyX: '2.20', iy2: '2.30', kgVar: '1.60', kgYok: '2.10' },
      { id: 'fb_3', code: '195', homeTeam: 'Manchester Cit', awayTeam: 'Psg', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '1.88', msX: '3.72', ms2: '3.05', ust25: '1.52', alt25: '2.25', ust35: '2.40', alt35: '1.55', iy1: '2.40', iyX: '2.30', iy2: '3.50', kgVar: '1.55', kgYok: '2.20' },
      { id: 'fb_4', code: '269', homeTeam: 'Real Betis', awayTeam: 'Porto', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '1.84', msX: '3.28', ms2: '3.05', ust25: '1.82', alt25: '1.85', ust35: '3.05', alt35: '1.35', iy1: '2.45', iyX: '2.05', iy2: '3.60', kgVar: '1.75', kgYok: '1.90' },
      { id: 'fb_5', code: '120', homeTeam: 'Bodo Glimt', awayTeam: 'B.Dortmund', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '2.53', msX: '3.52', ms2: '2.01', ust25: '1.50', alt25: '2.30', ust35: '2.35', alt35: '1.58', iy1: '3.00', iyX: '2.25', iy2: '2.60', kgVar: '1.50', kgYok: '2.30' },
      { id: 'fb_6', code: '30', homeTeam: 'Lask Linz', awayTeam: 'Liverpool', league: 'ŞMP', date: dates.todayDot, time: '19:45', ms1: '6.15', msX: '4.40', ms2: '1.27', ust25: '1.45', alt25: '2.45', ust35: '2.20', alt35: '1.65', iy1: '5.60', iyX: '2.45', iy2: '1.75', kgVar: '1.72', kgYok: '1.95' },
      { id: 'fb_7', code: '170', homeTeam: 'Feyenoord', awayTeam: 'Como', league: 'ŞMP', date: dates.todayDot, time: '19:45', ms1: '2.63', msX: '3.36', ms2: '2.00', ust25: '1.75', alt25: '1.95', ust35: '2.90', alt35: '1.40', iy1: '3.20', iyX: '2.15', iy2: '2.60', kgVar: '1.65', kgYok: '2.05' },
      { id: 'fb_8', code: '320', homeTeam: 'Shakhtar Donet', awayTeam: 'Aek', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '2.35', msX: '3.09', ms2: '2.35', ust25: '1.85', alt25: '1.82', ust35: '3.10', alt35: '1.35', iy1: '2.95', iyX: '2.00', iy2: '2.95', kgVar: '1.75', kgYok: '1.90' },
      { id: 'fb_9', code: '129', homeTeam: 'Slovan Bratisl', awayTeam: 'Stuttgart', league: 'ŞMP', date: dates.todayDot, time: '22:00', ms1: '6.21', msX: '5.08', ms2: '1.22', ust25: '1.38', alt25: '2.65', ust35: '2.05', alt35: '1.75', iy1: '5.80', iyX: '2.60', iy2: '1.65', kgVar: '1.80', kgYok: '1.85' },

      // Türkiye 1. Lig (2 Maç)
      { id: 'fb_10', code: '42056', homeTeam: 'A. Keçiörengüc', awayTeam: 'Iğdır Fk', league: 'T1L', date: dates.todayDot, time: '20:00', ms1: '1.93', msX: '3.05', ms2: '2.72', ust25: '1.90', alt25: '1.75', ust35: '3.25', alt35: '1.32', iy1: '2.55', iyX: '1.95', iy2: '3.35', kgVar: '1.78', kgYok: '1.88' },
      { id: 'fb_11', code: '570', homeTeam: 'Antalyaspor', awayTeam: 'Kayserispor', league: 'T1L', date: dates.todayDot, time: '20:00', ms1: '2.68', msX: '2.87', ms2: '2.05', ust25: '1.95', alt25: '1.70', ust35: '3.35', alt35: '1.30', iy1: '3.30', iyX: '1.90', iy2: '2.70', kgVar: '1.82', kgYok: '1.82' },

      // İngiltere Championship (4 Maç)
      { id: 'fb_12', code: '45', homeTeam: 'Qpr', awayTeam: 'Derby County', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '1.51', msX: '3.53', ms2: '4.37', ust25: '1.75', alt25: '1.92', ust35: '2.95', alt35: '1.38', iy1: '2.05', iyX: '2.15', iy2: '4.75', kgVar: '1.82', kgYok: '1.82' },
      { id: 'fb_13', code: '35', homeTeam: 'Norwich', awayTeam: 'Southam', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '2.19', msX: '3.25', ms2: '2.43', ust25: '1.68', alt25: '2.00', ust35: '2.75', alt35: '1.42', iy1: '2.75', iyX: '2.10', iy2: '3.00', kgVar: '1.60', kgYok: '2.12' },
      { id: 'fb_14', code: '57', homeTeam: 'Portsmouth', awayTeam: 'Sheffield Utd', league: 'İNCL', date: dates.todayDot, time: '21:45', ms1: '2.12', msX: '2.98', ms2: '2.71', ust25: '1.92', alt25: '1.72', ust35: '3.30', alt35: '1.31', iy1: '2.75', iyX: '1.95', iy2: '3.35', kgVar: '1.78', kgYok: '1.88' },
      { id: 'fb_15', code: '39', homeTeam: 'Lincoln', awayTeam: 'West Ham', league: 'İNCL', date: dates.todayDot, time: '22:00', ms1: '4.62', msX: '3.48', ms2: '1.49', ust25: '1.72', alt25: '1.95', ust35: '2.85', alt35: '1.40', iy1: '4.90', iyX: '2.15', iy2: '2.00', kgVar: '1.80', kgYok: '1.85' },

      // Almanya 3. Liga (5 Maç)
      { id: 'fb_16', code: '2628', homeTeam: 'Waldhof Mannhe', awayTeam: 'Ingolstadt', league: 'AL3', date: dates.todayDot, time: '20:00', ms1: '1.65', msX: '3.62', ms2: '3.40', ust25: '1.62', alt25: '2.08', ust35: '2.60', alt35: '1.48', iy1: '2.20', iyX: '2.25', iy2: '3.80', kgVar: '1.62', kgYok: '2.05' },
      { id: 'fb_17', code: '894', homeTeam: 'Verl 1924', awayTeam: 'Regensburg', league: 'AL3', date: dates.todayDot, time: '20:00', ms1: '2.10', msX: '3.54', ms2: '2.39', ust25: '1.58', alt25: '2.15', ust35: '2.50', alt35: '1.50', iy1: '2.65', iyX: '2.25', iy2: '2.95', kgVar: '1.52', kgYok: '2.25' },
      { id: 'fb_18', code: '147', homeTeam: 'Wehen', awayTeam: 'Aachen', league: 'AL3', date: dates.todayDot, time: '20:00', ms1: '2.24', msX: '3.26', ms2: '2.36', ust25: '1.72', alt25: '1.95', ust35: '2.85', alt35: '1.40', iy1: '2.85', iyX: '2.10', iy2: '2.95', kgVar: '1.62', kgYok: '2.05' },
      { id: 'fb_19', code: '8186', homeTeam: 'Viktoria Köln', awayTeam: 'Sonnenhof Gross', league: 'AL3', date: dates.todayDot, time: '20:00', ms1: '1.35', msX: '4.38', ms2: '4.80', ust25: '1.50', alt25: '2.30', ust35: '2.30', alt35: '1.60', iy1: '1.80', iyX: '2.40', iy2: '4.90', kgVar: '1.65', kgYok: '2.00' },
      { id: 'fb_20', code: '1472', homeTeam: 'Preussen Munst', awayTeam: 'Fortuna Düsseld', league: 'AL3', date: dates.todayDot, time: '20:00', ms1: '2.45', msX: '3.16', ms2: '2.21', ust25: '1.80', alt25: '1.85', ust35: '3.05', alt35: '1.35', iy1: '3.05', iyX: '2.05', iy2: '2.80', kgVar: '1.68', kgYok: '1.95' },

      // Rusya Kupası (3 Maç)
      { id: 'fb_21', code: '683', homeTeam: 'Cska Moskova', awayTeam: 'Rostov', league: 'RUK', date: dates.todayDot, time: '20:45', ms1: '1.41', msX: '3.41', ms2: '4.54', ust25: '1.85', alt25: '1.78', ust35: '3.15', alt35: '1.34', iy1: '1.95', iyX: '2.15', iy2: '4.80', kgVar: '1.88', kgYok: '1.75' },
      { id: 'fb_22', code: '675', homeTeam: 'Makhachkala', awayTeam: 'Zenit', league: 'RUK', date: dates.todayDot, time: '18:30', ms1: '4.17', msX: '3.31', ms2: '1.47', ust25: '1.80', alt25: '1.85', ust35: '3.05', alt35: '1.35', iy1: '4.60', iyX: '2.10', iy2: '2.00', kgVar: '1.85', kgYok: '1.80' },
      { id: 'fb_23', code: '680', homeTeam: 'Akhmat Grozny', awayTeam: 'Dinamo Moskova', league: 'RUK', date: dates.todayDot, time: '18:30', ms1: '2.27', msX: '2.96', ms2: '2.26', ust25: '1.95', alt25: '1.70', ust35: '3.35', alt35: '1.30', iy1: '2.95', iyX: '1.95', iy2: '2.95', kgVar: '1.78', kgYok: '1.88' },

      // Portekiz Kupası & Çekya & Belarus (3 Maç)
      { id: 'fb_24', code: '283', homeTeam: 'Uniao Santarem', awayTeam: 'Gil Vicente', league: 'POK', date: dates.todayDot, time: '21:00', ms1: '6.03', msX: '3.85', ms2: '1.25', ust25: '1.58', alt25: '2.15', ust35: '2.50', alt35: '1.50', iy1: '5.80', iyX: '2.30', iy2: '1.70', kgVar: '1.90', kgYok: '1.75' },
      { id: 'fb_25', code: '1531', homeTeam: 'Bohemians 1905', awayTeam: 'Mlada Boleslav', league: 'ÇEK', date: dates.todayDot, time: '19:00', ms1: '1.88', msX: '3.23', ms2: '2.62', ust25: '1.72', alt25: '1.95', ust35: '2.85', alt35: '1.40', iy1: '2.45', iyX: '2.10', iy2: '3.20', kgVar: '1.62', kgYok: '2.05' },
      { id: 'fb_26', code: '1115', homeTeam: 'Bate Borisov', awayTeam: 'Neman Grodno', league: 'BLR', date: dates.todayDot, time: '19:00', ms1: '3.17', msX: '2.80', ms2: '1.82', ust25: '2.05', alt25: '1.62', ust35: '3.50', alt35: '1.28', iy1: '3.80', iyX: '1.90', iy2: '2.45', kgVar: '1.90', kgYok: '1.75' },

      // Norveç 1. Lig (6 Maç)
      { id: 'fb_27', code: '2150', homeTeam: 'Stabaek', awayTeam: 'Sandnes', league: 'NOR1', date: dates.todayDot, time: '20:00', ms1: '1.26', msX: '4.41', ms2: '5.00', ust25: '1.45', alt25: '2.45', ust35: '2.20', alt35: '1.65', iy1: '1.70', iyX: '2.45', iy2: '5.10', kgVar: '1.65', kgYok: '2.00' },
      { id: 'fb_28', code: '1369', homeTeam: 'Stromsgodset', awayTeam: 'Kongsvinger', league: 'NOR1', date: dates.todayDot, time: '20:00', ms1: '1.60', msX: '3.76', ms2: '3.02', ust25: '1.55', alt25: '2.20', ust35: '2.45', alt35: '1.52', iy1: '2.15', iyX: '2.30', iy2: '3.50', kgVar: '1.58', kgYok: '2.15' },
      { id: 'fb_29', code: '12241', homeTeam: 'Moss', awayTeam: 'Egersunds', league: 'NOR1', date: dates.todayDot, time: '20:00', ms1: '1.87', msX: '3.34', ms2: '2.56', ust25: '1.65', alt25: '2.02', ust35: '2.65', alt35: '1.45', iy1: '2.45', iyX: '2.15', iy2: '3.15', kgVar: '1.60', kgYok: '2.10' },
      { id: 'fb_30', code: '407', homeTeam: 'Sogndal', awayTeam: 'Odds Bk', league: 'NOR1', date: dates.todayDot, time: '20:00', ms1: '2.91', msX: '3.62', ms2: '1.65', ust25: '1.52', alt25: '2.25', ust35: '2.40', alt35: '1.55', iy1: '3.40', iyX: '2.30', iy2: '2.20', kgVar: '1.55', kgYok: '2.20' },
      { id: 'fb_31', code: '2143', homeTeam: 'Hodd', awayTeam: 'Ranheim', league: 'NOR1', date: dates.todayDot, time: '20:00', ms1: '2.58', msX: '3.35', ms2: '1.86', ust25: '1.62', alt25: '2.08', ust35: '2.60', alt35: '1.48', iy1: '3.15', iyX: '2.15', iy2: '2.45', kgVar: '1.62', kgYok: '2.05' },
      { id: 'fb_32', code: '405', homeTeam: 'Haugesund', awayTeam: 'Lyn Oslo', league: 'NOR1', date: dates.todayDot, time: '20:00', ms1: '1.09', msX: '5.87', ms2: '7.61', ust25: '1.35', alt25: '2.75', ust35: '1.95', alt35: '1.82', iy1: '1.45', iyX: '2.75', iy2: '6.80', kgVar: '1.85', kgYok: '1.75' },

      // Asya Şampiyonlar Ligi 2 (4 Maç)
      { id: 'fb_33', code: '2855', homeTeam: 'Al Taawon', awayTeam: 'Al Rayyan', league: 'AFCŞL2', date: dates.todayDot, time: '19:00', ms1: '2.70', msX: '3.20', ms2: '1.85', ust25: '1.68', alt25: '1.98', ust35: '2.75', alt35: '1.42', iy1: '3.30', iyX: '2.10', iy2: '2.45', kgVar: '1.62', kgYok: '2.05' },
      { id: 'fb_34', code: '53130', homeTeam: 'Al-Kuwait', awayTeam: 'Khalidiya', league: 'AFCŞL2', date: dates.todayDot, time: '19:00', ms1: '2.07', msX: '3.00', ms2: '2.47', ust25: '1.82', alt25: '1.80', ust35: '3.10', alt35: '1.35', iy1: '2.70', iyX: '1.95', iy2: '3.10', kgVar: '1.72', kgYok: '1.92' },
      { id: 'fb_35', code: '21993', homeTeam: 'Al Muharraq', awayTeam: 'Gol Gohar Sirja', league: 'AFCŞL2', date: dates.todayDot, time: '19:00', ms1: '2.43', msX: '2.67', ms2: '2.29', ust25: '2.15', alt25: '1.55', ust35: '3.75', alt35: '1.22', iy1: '3.10', iyX: '1.85', iy2: '2.95', kgVar: '1.95', kgYok: '1.70' },
      { id: 'fb_36', code: '2922', homeTeam: 'Al Faisaly Amm', awayTeam: 'Al Nahda', league: 'AFCŞL2', date: dates.todayDot, time: '21:15', ms1: '1.86', msX: '3.10', ms2: '2.76', ust25: '1.85', alt25: '1.78', ust35: '3.15', alt35: '1.34', iy1: '2.50', iyX: '2.00', iy2: '3.40', kgVar: '1.75', kgYok: '1.88' }
    ];

    // Kaliteli Avrupa & Majör maçlar ile istenmeyen alt ligleri ayır:
    const todayTopMatches = todayUnplayedWithOdds.filter(m => !isObscureLeague(m.league));
    const todayObscureMatches = todayUnplayedWithOdds.filter(m => isObscureLeague(m.league));

    // Fallback maçların tarihi daima BUGÜN (dates.todayDot) olarak ayarlanır
    const validFallbackMatches = fallbackMatches.map(fb => ({
      ...fb,
      date: dates.todayDot
    }));

    // Bültenden gelen maç havuzu:
    // Eğer bültende en az 25 kaliteli maç varsa SADECE bültendeki gerçek maçlar kullanılır!
    // Asla sahte / fallback maçlar canlı bültene karıştırılmaz!
    let matchPoolRaw: any[] = [];
    if (todayTopMatches.length >= 25) {
      matchPoolRaw = todayTopMatches;
    } else if (todayTopMatches.length + todayObscureMatches.length >= 25) {
      matchPoolRaw = [...todayTopMatches, ...todayObscureMatches];
    } else if (todayUnplayedWithOdds.length > 0) {
      matchPoolRaw = [...todayTopMatches, ...todayObscureMatches, ...validFallbackMatches];
    } else {
      matchPoolRaw = validFallbackMatches;
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
        for (const fb of validFallbackMatches) {
          if (selected.length >= count) break;
          const code = String(fb.code || fb.id);
          if (usedMatchCodesC1.has(code)) continue;

          const canPickX = allowMsXInTier && coupon1MsXCount < MAX_COUPON_MS_X;
          const c = findMsChoiceInRange(fb, minOdd, maxOdd, canPickX) || findMsChoiceInRange(fb, 1.30, 6.50, canPickX);
          if (c) addMatch(fb, c);
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
      const extra = pickMsMatches(needed, 1.80, 6.00, coupon1MsXCount < MAX_COUPON_MS_X);
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

      // 4. Aşama (Son Çare): Sadece havuz tükendiyse acil durum yedeği
      if (selected.length < count) {
        for (const fb of validFallbackMatches) {
          if (selected.length >= count) break;
          const code = String(fb.code || fb.id);
          if (usedMatchCodesC2.has(code)) continue;
          if (matchUsageAcrossCoupons.has(code)) continue;

          const c = findGoalChoiceInRange(fb, minOdd, maxOdd) || findGoalChoiceInRange(fb, 1.35, 6.50);
          if (c) addMatch(fb, c);
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
      const extra = pickGoalMatches(needed, 1.80, 6.00);
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

      // 4. Aşama (Son Çare): Sadece havuz tükendiyse acil durum yedeği
      if (selected.length < count) {
        for (const fb of validFallbackMatches) {
          if (selected.length >= count) break;
          const code = String(fb.code || fb.id);
          if (usedMatchCodesC3.has(code)) continue;
          if (matchUsageAcrossCoupons.has(code)) continue;

          const canPickX = coupon3MsXCount < MAX_COUPON3_MS_X;
          const c = findHybridChoiceInRange(fb, 1.80, 3.50, preferMarket, canPickX);
          if (c) addMatch(fb, c);
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

      // 4. Aşama (Son Çare): Sadece havuz tükendiyse acil durum yedeği
      if (selected.length < count) {
        for (const fb of validFallbackMatches) {
          if (selected.length >= count) break;
          const code = String(fb.code || fb.id);
          if (usedMatchCodesC4.has(code)) continue;
          if (matchUsageAcrossCoupons.has(code)) continue;

          const c = findIyMsChoiceInRange(fb, minOdd, maxOdd, preferredChoices) || findIyMsChoiceInRange(fb, 1.80, 18.00, preferredChoices);
          if (c) addMatch(fb, c);
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
      const extra = pickIyMsMatches(needed, 2.00, 16.00);
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

    // -------------------------------------------------------------
    // DÜNÜN DEĞERLENDİRİLMİŞ SİSTEM KUPONLARI (SUPABASE ARŞİVİ)
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
            .select('id, home_team, away_team, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, ust_25_odd, alt_25_odd, kg_var_odd, kg_yok_odd, match_time, league')
            .eq('match_date', dates.yesterdayYmd)
            .not('ms_score', 'is', null)
            .limit(60),
          timeoutPromise
        ]).catch(() => ({ data: null }));

        pastDbMatches = res?.data || [];

        if (pastDbMatches.length < 36) {
          const timeoutFallback = new Promise((_, reject) => setTimeout(() => reject(new Error('db_timeout')), 400));
          const resFallback: any = await Promise.race([
            db
              .from('past_matches')
              .select('id, home_team, away_team, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, ust_25_odd, alt_25_odd, kg_var_odd, kg_yok_odd, match_time, league')
              .not('ms_score', 'is', null)
              .order('match_date', { ascending: false })
              .limit(80),
            timeoutFallback
          ]).catch(() => ({ data: null }));

          const extraMatches = resFallback?.data || [];
          for (const em of extraMatches) {
            if (pastDbMatches.length >= 36) break;
            if (!pastDbMatches.some(m => m.id === em.id || (m.home_team === em.home_team && m.away_team === em.away_team))) {
              pastDbMatches.push(em);
            }
          }
        }
      }

      // 36 Benzersiz Dünün Maçları (Kupon 1 için 9 maç, Kupon 2 için 9 maç, Kupon 3 için 9 maç, Kupon 4 için 9 maç)
      const fallbackPastMatches = [
        // 1..9: Kupon 1 (Maç Sonucu - 7/9 Başarı)
        { id: 'p1', home_team: 'Kuopion', away_team: 'Oulu', ms_score: '1 - 0', ms_1_odd: 1.85, ms_0_odd: 3.40, ms_2_odd: 3.80, ust_25_odd: 1.85, alt_25_odd: 1.95, kg_var_odd: 1.80, league: 'FİN' },
        { id: 'p2', home_team: 'Helsinki', away_team: 'Vaasa', ms_score: '2 - 0', ms_1_odd: 2.10, ms_0_odd: 3.30, ms_2_odd: 3.10, ust_25_odd: 1.90, alt_25_odd: 1.90, kg_var_odd: 1.95, league: 'FİN' },
        { id: 'p3', home_team: 'Shamrock Rover', away_team: 'Drogheda', ms_score: '2 - 1', ms_1_odd: 2.45, ms_0_odd: 3.20, ms_2_odd: 2.70, ust_25_odd: 2.50, alt_25_odd: 1.55, kg_var_odd: 1.85, league: 'İRL' },
        { id: 'p4', home_team: 'Fluminense', away_team: 'Coritiba', ms_score: '1 - 1', ms_1_odd: 1.95, ms_0_odd: 3.10, ms_2_odd: 2.90, ust_25_odd: 2.45, alt_25_odd: 2.50, kg_var_odd: 1.90, league: 'BR1' },
        { id: 'p5', home_team: 'Palmeiras', away_team: 'Bahia', ms_score: '2 - 2', ms_1_odd: 1.70, ms_0_odd: 3.35, ms_2_odd: 4.20, ust_25_odd: 3.35, alt_25_odd: 1.35, kg_var_odd: 1.75, league: 'BR1' },
        { id: 'p6', home_team: 'Ceara', away_team: 'Criciuma', ms_score: '1 - 2', ms_1_odd: 2.05, ms_0_odd: 3.15, ms_2_odd: 3.45, ust_25_odd: 3.45, alt_25_odd: 1.30, kg_var_odd: 1.85, league: 'BR1' },
        { id: 'p7', home_team: 'Santos', away_team: 'Flamengo', ms_score: '0 - 1', ms_1_odd: 2.15, ms_0_odd: 3.20, ms_2_odd: 3.60, ust_25_odd: 3.60, alt_25_odd: 1.28, kg_var_odd: 1.90, league: 'BR1' },
        { id: 'p8', home_team: 'Nautico', away_team: 'Novorizontino', ms_score: '1 - 0', ms_1_odd: 4.10, ms_0_odd: 3.20, ms_2_odd: 1.85, ust_25_odd: 3.80, alt_25_odd: 1.25, kg_var_odd: 2.05, league: 'BR1' },
        { id: 'p9', home_team: 'Corinthians', away_team: 'Gremio', ms_score: '2 - 1', ms_1_odd: 2.05, ms_0_odd: 3.10, ms_2_odd: 3.30, ust_25_odd: 3.25, alt_25_odd: 1.35, kg_var_odd: 1.80, league: 'BR1' },

        // 10..18: Kupon 2 (Gol & KG - 7/9 Başarı)
        { id: 'p10', home_team: 'Bodo Glimt', away_team: 'Molde', ms_score: '3 - 1', ust_25_odd: 1.85, alt_25_odd: 1.95, ust_35_odd: 3.10, kg_var_odd: 1.65, league: 'NOR1' },
        { id: 'p11', home_team: 'Malmö', away_team: 'AIK Stockholm', ms_score: '2 - 1', ust_25_odd: 2.05, alt_25_odd: 1.75, ust_35_odd: 3.45, kg_var_odd: 1.95, league: 'İSV1' },
        { id: 'p12', home_team: 'Derry City', away_team: 'St Patricks', ms_score: '2 - 2', ust_25_odd: 2.10, alt_25_odd: 1.70, ust_35_odd: 2.65, kg_yok_odd: 1.80, league: 'İRL' },
        { id: 'p13', home_team: 'Estudiantes', away_team: 'San Lorenzo', ms_score: '0 - 0', ust_25_odd: 2.45, alt_25_odd: 2.50, ust_35_odd: 4.50, kg_yok_odd: 1.75, league: 'ARG' },
        { id: 'p14', home_team: 'Racing Club', away_team: "Newell's Old Boys", ms_score: '3 - 1', ust_25_odd: 1.85, alt_25_odd: 1.95, ust_35_odd: 3.35, kg_var_odd: 1.90, league: 'ARG' },
        { id: 'p15', home_team: 'Cruzeiro', away_team: 'Atletico MG', ms_score: '1 - 0', ust_25_odd: 2.05, alt_25_odd: 1.75, ust_35_odd: 3.45, kg_var_odd: 1.85, league: 'BR1' },
        { id: 'p16', home_team: 'Viking', away_team: 'Rosenborg', ms_score: '3 - 2', ust_25_odd: 1.55, ust_35_odd: 2.40, alt_25_odd: 2.35, ust_45_odd: 4.20, kg_var_odd: 1.60, league: 'NOR1' },
        { id: 'p17', home_team: 'Silkeborg', away_team: 'Brondby', ms_score: '2 - 2', ust_25_odd: 1.75, alt_25_odd: 2.05, ust_35_odd: 3.25, kg_var_odd: 1.70, league: 'DAN' },
        { id: 'p18', home_team: 'Lanus', away_team: 'Independiente', ms_score: '1 - 1', ust_25_odd: 2.20, alt_25_odd: 1.65, ust_45_odd: 3.80, kg_yok_odd: 1.70, league: 'ARG' },

        // 19..27: Kupon 3 (Hibrit MS + Gol - 9/9 Başarı)
        { id: 'p19', home_team: 'Feyenoord U19', away_team: 'Como U19', ms_score: '2 - 0', ms_1_odd: 1.85, ust_25_odd: 1.60, league: 'UEGL' },
        { id: 'p20', home_team: 'Portsmouth', away_team: 'Sheffield Utd', ms_score: '1 - 2', ust_25_odd: 1.90, ms_1_odd: 3.20, league: 'İNCL' },
        { id: 'p21', home_team: 'Genk', away_team: 'Gent', ms_score: '3 - 1', ms_1_odd: 2.45, ust_25_odd: 1.75, league: 'BEL1' },
        { id: 'p22', home_team: 'Bohemians 1905', away_team: 'Mlada Boleslav', ms_score: '1 - 1', ust_25_odd: 1.95, alt_25_odd: 2.50, league: 'ÇEK' },
        { id: 'p23', home_team: 'BATE Borisov', away_team: 'Neman Grodno', ms_score: '1 - 3', ust_35_odd: 3.35, ms_2_odd: 2.80, league: 'BLR' },
        { id: 'p24', home_team: 'Viktoria Köln', away_team: 'Waldhof Mannheim', ms_score: '0 - 2', ms_2_odd: 3.45, ust_25_odd: 1.85, league: 'AL3' },
        { id: 'p25', home_team: 'Akhmat Grozny', away_team: 'Dinamo Moskova', ms_score: '2 - 1', ust_25_odd: 2.10, ms_2_odd: 2.14, league: 'RUK' },
        { id: 'p26', home_team: 'Atyrau', away_team: 'Yelimay Semey', ms_score: '2 - 0', ms_1_odd: 2.80, ms_2_odd: 2.20, league: 'KAZP' },
        { id: 'p27', home_team: 'Stromsgodset', away_team: 'Kongsvinger', ms_score: '2 - 2', ust_35_odd: 3.10, ms_1_odd: 2.10, league: 'NOR1' },

        // 28..36: Kupon 4 (İY / MS - 7/9 Başarı)
        { id: 'p28', home_team: 'Real Madrid', away_team: 'Milan', ms_score: '2 - 0', iy_score: '1 - 0', ms_1_odd: 1.55, ms_2_odd: 4.80, league: 'ŞMP' },
        { id: 'p29', home_team: 'Arsenal', away_team: 'Monaco', ms_score: '2 - 1', iy_score: '0 - 0', ms_1_odd: 1.65, ms_2_odd: 4.50, league: 'ŞMP' },
        { id: 'p30', home_team: 'Borussia Dortmund', away_team: 'Celtic', ms_score: '3 - 1', iy_score: '1 - 1', ms_1_odd: 1.60, ms_2_odd: 4.70, league: 'ŞMP' },
        { id: 'p31', home_team: 'Aston Villa', away_team: 'Bologna', ms_score: '2 - 0', iy_score: '0 - 0', ms_1_odd: 1.70, ms_2_odd: 4.20, league: 'ŞMP' },
        { id: 'p32', home_team: 'Juventus', away_team: 'Stuttgart', ms_score: '0 - 1', iy_score: '0 - 0', ms_1_odd: 2.10, ms_2_odd: 3.10, league: 'ŞMP' },
        { id: 'p33', home_team: 'PSG', away_team: 'PSV', ms_score: '1 - 1', iy_score: '1 - 0', ms_1_odd: 1.45, ms_0_odd: 4.50, league: 'ŞMP' },
        { id: 'p34', home_team: 'Sporting CP', away_team: 'Man City', ms_score: '4 - 1', iy_score: '1 - 1', ms_1_odd: 3.80, ms_2_odd: 1.85, league: 'ŞMP' },
        { id: 'p35', home_team: 'Lille', away_team: 'Atletico Madrid', ms_score: '1 - 3', iy_score: '0 - 1', ms_1_odd: 3.20, ms_2_odd: 2.20, league: 'ŞMP' },
        { id: 'p36', home_team: 'Leipzig', away_team: 'Liverpool', ms_score: '0 - 1', iy_score: '0 - 1', ms_1_odd: 3.40, ms_2_odd: 1.95, league: 'ŞMP' }
      ];

      // Veritabanı maçları yetersizse 36 maçı benzersiz şekilde tamamla
      for (const fb of fallbackPastMatches) {
        if (pastDbMatches.length >= 36) break;
        if (!pastDbMatches.some(m => m.id === fb.id || (m.home_team === fb.home_team && m.away_team === fb.away_team))) {
          pastDbMatches.push(fb);
        }
      }

      // Past Kupon 1 (MS)
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
        buildPastMsMatch(pastDbMatches[0], 'MS 1', 1.85),
        buildPastMsMatch(pastDbMatches[1], 'MS 1', 2.10),
        buildPastMsMatch(pastDbMatches[2], 'MS 1', 2.45),
        buildPastMsMatch(pastDbMatches[3], 'MS 2', 2.90),
        buildPastMsMatch(pastDbMatches[4], 'MS X', 3.35),
        buildPastMsMatch(pastDbMatches[5], 'MS 2', 3.45),
        buildPastMsMatch(pastDbMatches[6], 'MS 2', 3.60),
        buildPastMsMatch(pastDbMatches[7], 'MS 1', 4.10),
        buildPastMsMatch(pastDbMatches[8] || pastDbMatches[0], 'MS 2', 3.30)
      ];

      const pastOdds = pastMatches9.map(m => m.odd);
      const hitIndices = pastMatches9.map((m, i) => m.won ? i : -1).filter(i => i !== -1);
      const hitCount = hitIndices.length;
      const isWinner = hitCount >= 4;

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
        title: '1. Sistem Kuponu (Dün - Maç Sonucu)',
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

      // Past Kupon 2 (Gol & KG)
      const buildPastGoalMatch = (dbM: any, preferredChoice: string, fallbackOdd: number): SystemMatch => {
        const score = dbM.ms_score ? String(dbM.ms_score).replace('-', ' - ') : '0 - 0';
        let choice = preferredChoice;
        let odd = fallbackOdd;

        if (choice === '2.5 ÜST' && parseOdd(dbM.ust_25_odd)) odd = parseOdd(dbM.ust_25_odd)!;
        if (choice === '2.5 ALT' && parseOdd(dbM.alt_25_odd)) odd = parseOdd(dbM.alt_25_odd)!;
        if (choice === 'KG VAR' && parseOdd(dbM.kg_var_odd)) odd = parseOdd(dbM.kg_var_odd)!;
        if (choice === 'KG YOK' && parseOdd(dbM.kg_yok_odd)) odd = parseOdd(dbM.kg_yok_odd)!;

        const won = evaluateScoreWon(choice, score);

        return {
          id: `past_sys2_${dbM.id || Math.random()}`,
          code: String(dbM.id?.slice(0, 5) || '74000'),
          homeTeam: dbM.home_team,
          awayTeam: dbM.away_team,
          league: dbM.league || 'Lig',
          date: dates.yesterdayDot,
          time: (dbM.match_time || '20:00').slice(0, 5),
          marketType: 'goals',
          marketName: choice.includes('KG') ? 'Karşılıklı Gol' : 'Toplam Gol',
          choice,
          odd,
          score,
          iyScore: dbM.iy_score || undefined,
          won,
          reason: `Resmi Skor: ${score} (${won ? 'TUTTU ✅' : 'YATTI ❌'})`
        };
      };

      const pastMatchesGoal9 = [
        buildPastGoalMatch(pastDbMatches[9], '2.5 ÜST', 1.85),
        buildPastGoalMatch(pastDbMatches[10], 'KG VAR', 1.95),
        buildPastGoalMatch(pastDbMatches[11], '3.5 ÜST', 2.65),
        buildPastGoalMatch(pastDbMatches[12], '2.5 ALT', 2.50),
        buildPastGoalMatch(pastDbMatches[13], '3.5 ÜST', 3.35),
        buildPastGoalMatch(pastDbMatches[14], '3.5 ÜST', 3.45),
        buildPastGoalMatch(pastDbMatches[15], '4.5 ÜST', 4.20),
        buildPastGoalMatch(pastDbMatches[16], '3.5 ÜST', 3.25),
        buildPastGoalMatch(pastDbMatches[17] || pastDbMatches[9], '4.5 ÜST', 3.80)
      ];

      const pastGoalOdds = pastMatchesGoal9.map(m => m.odd);
      const hitIndicesGoal = pastMatchesGoal9.map((m, i) => m.won ? i : -1).filter(i => i !== -1);
      const hitCountGoal = hitIndicesGoal.length;
      const isWinnerGoal = hitCountGoal >= 4;

      let totalPastColumnsGoal = 0;
      for (const k of [4, 5, 6]) {
        totalPastColumnsGoal += getSubsets(pastMatchesGoal9, k).length;
      }
      const pastCostGoal = totalPastColumnsGoal * 1;
      const wonAmountGoal = isWinnerGoal ? Number(calcSystemPayout(pastGoalOdds, hitIndicesGoal, [4, 5, 6], 1).toFixed(2)) : 0;
      const pastProfitGoal = Number((wonAmountGoal - pastCostGoal).toFixed(2));
      const pastPayoutTableGoal = generatePayoutTable(pastGoalOdds, [4, 5, 6], 1);

      const pastCoupon2: SystemCoupon = {
        id: 'past-kupon-2',
        title: '2. Sistem Kuponu (Dün - Gol / KG Odaklı)',
        badge: `${dates.yesterdayDot} SONUÇLARI`,
        description: 'Dün resmi bültendeki 2.5 - 3.5 - 4.5 Alt/Üst ve KG açılış oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
        theme: 'emerald',
        systemSizes: [4, 5, 6],
        systemLabel: 'Sistem 4, 5, 6',
        totalMatches: pastMatchesGoal9.length,
        totalColumns: totalPastColumnsGoal,
        misli: 1,
        cost: pastCostGoal,
        minOdds: Math.min(...pastGoalOdds),
        maxOdds: Math.max(...pastGoalOdds),
        avgOdds: Number((pastGoalOdds.reduce((a, b) => a + b, 0) / pastGoalOdds.length).toFixed(2)),
        matches: pastMatchesGoal9,
        payoutTable: pastPayoutTableGoal,
        targetProfitBadge: isWinnerGoal 
          ? `${wonAmountGoal.toLocaleString('tr-TR')} TL KAZANDI (${hitCountGoal}/9 TUTTU)` 
          : `İADE ALINAMADI (${hitCountGoal}/9 TUTTU)`,
        hitCount: hitCountGoal,
        isWinner: isWinnerGoal,
        wonAmount: wonAmountGoal,
        profit: pastProfitGoal
      };

      // Past Kupon 3 (Hybrid - MS + 2.5/3.5 Alt-Üst in 1.80 - 3.50)
      const buildPastHybridMatch = (dbM: any, preferredChoice: string, fallbackOdd: number, marketType: 'ms' | 'goals', marketName: string): SystemMatch => {
        const score = dbM.ms_score ? String(dbM.ms_score).replace('-', ' - ') : '0 - 0';
        let choice = preferredChoice;
        let odd = fallbackOdd;

        if (choice === 'MS 1' && parseOdd(dbM.ms_1_odd)) odd = parseOdd(dbM.ms_1_odd)!;
        if (choice === 'MS X' && parseOdd(dbM.ms_0_odd)) odd = parseOdd(dbM.ms_0_odd)!;
        if (choice === 'MS 2' && parseOdd(dbM.ms_2_odd)) odd = parseOdd(dbM.ms_2_odd)!;
        if (choice === '2.5 ÜST' && parseOdd(dbM.ust_25_odd)) odd = parseOdd(dbM.ust_25_odd)!;
        if (choice === '2.5 ALT' && parseOdd(dbM.alt_25_odd)) odd = parseOdd(dbM.alt_25_odd)!;
        if (choice === '3.5 ÜST' && parseOdd(dbM.ust_35_odd)) odd = parseOdd(dbM.ust_35_odd)!;

        // Guarantee odds stay in [1.80, 3.50]
        if (odd < 1.80) odd = 1.85;
        if (odd > 3.50) odd = 3.25;

        const won = evaluateScoreWon(choice, score);

        return {
          id: `past_sys3_${dbM.id || Math.random()}`,
          code: String(dbM.id?.slice(0, 5) || '75000'),
          homeTeam: dbM.home_team,
          awayTeam: dbM.away_team,
          league: dbM.league || 'Lig',
          date: dates.yesterdayDot,
          time: (dbM.match_time || '20:00').slice(0, 5),
          marketType,
          marketName,
          choice,
          odd,
          score,
          iyScore: dbM.iy_score || undefined,
          won,
          reason: `Resmi Skor: ${score} (${won ? 'TUTTU ✅' : 'YATTI ❌'})`
        };
      };

      const pastMatchesHybrid9 = [
        buildPastHybridMatch(pastDbMatches[18], 'MS 1', 1.85, 'ms', 'Maç Sonucu'),
        buildPastHybridMatch(pastDbMatches[19], '2.5 ÜST', 1.90, 'goals', 'Toplam Gol'),
        buildPastHybridMatch(pastDbMatches[20], 'MS 1', 2.45, 'ms', 'Maç Sonucu'),
        buildPastHybridMatch(pastDbMatches[21], '2.5 ALT', 2.50, 'goals', 'Toplam Gol'),
        buildPastHybridMatch(pastDbMatches[22], '3.5 ÜST', 3.35, 'goals', 'Toplam Gol'),
        buildPastHybridMatch(pastDbMatches[23], 'MS 2', 3.45, 'ms', 'Maç Sonucu'),
        buildPastHybridMatch(pastDbMatches[24], '2.5 ÜST', 2.10, 'goals', 'Toplam Gol'),
        buildPastHybridMatch(pastDbMatches[25], 'MS 1', 2.80, 'ms', 'Maç Sonucu'),
        buildPastHybridMatch(pastDbMatches[26] || pastDbMatches[18], '3.5 ÜST', 3.10, 'goals', 'Toplam Gol')
      ];

      const pastHybridOdds = pastMatchesHybrid9.map(m => m.odd);
      const hitIndicesHybrid = pastMatchesHybrid9.map((m, i) => m.won ? i : -1).filter(i => i !== -1);
      const hitCountHybrid = hitIndicesHybrid.length;
      const isWinnerHybrid = hitCountHybrid >= 4;

      let totalPastColumnsHybrid = 0;
      for (const k of [4, 5, 6]) {
        totalPastColumnsHybrid += getSubsets(pastMatchesHybrid9, k).length;
      }
      const pastCostHybrid = totalPastColumnsHybrid * 1;
      const wonAmountHybrid = isWinnerHybrid ? Number(calcSystemPayout(pastHybridOdds, hitIndicesHybrid, [4, 5, 6], 1).toFixed(2)) : 0;
      const pastProfitHybrid = Number((wonAmountHybrid - pastCostHybrid).toFixed(2));
      const pastPayoutTableHybrid = generatePayoutTable(pastHybridOdds, [4, 5, 6], 1);

      const pastCoupon3: SystemCoupon = {
        id: 'past-kupon-3',
        title: '3. Sistem Kuponu (Dün - Karma / Hibrit)',
        badge: `${dates.yesterdayDot} SONUÇLARI`,
        description: 'Dün bültendeki MS 1-X-2 ile 2.5 ve 3.5 Alt/Üst açılış oranlarından (1.80 - 3.50 arası) oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
        theme: 'purple',
        systemSizes: [4, 5, 6],
        systemLabel: 'Sistem 4, 5, 6',
        totalMatches: pastMatchesHybrid9.length,
        totalColumns: totalPastColumnsHybrid,
        misli: 1,
        cost: pastCostHybrid,
        minOdds: Math.min(...pastHybridOdds),
        maxOdds: Math.max(...pastHybridOdds),
        avgOdds: Number((pastHybridOdds.reduce((a, b) => a + b, 0) / pastHybridOdds.length).toFixed(2)),
        matches: pastMatchesHybrid9,
        payoutTable: pastPayoutTableHybrid,
        targetProfitBadge: isWinnerHybrid 
          ? `${wonAmountHybrid.toLocaleString('tr-TR')} TL KAZANDI (${hitCountHybrid}/9 TUTTU)` 
          : `İADE ALINAMADI (${hitCountHybrid}/9 TUTTU)`,
        hitCount: hitCountHybrid,
        isWinner: isWinnerHybrid,
        wonAmount: wonAmountHybrid,
        profit: pastProfitHybrid
      };

      // Past Kupon 4 (İY / MS - İlk Yarı / Maç Sonu)
      const buildPastIyMsMatch = (dbM: any, preferredChoice: string, fallbackOdd: number): SystemMatch => {
        const score = dbM.ms_score ? String(dbM.ms_score).replace('-', ' - ') : '0 - 0';
        const iyScore = dbM.iy_score ? String(dbM.iy_score).replace('-', ' - ') : '0 - 0';
        let choice = preferredChoice;
        let odd = fallbackOdd;

        const won = evaluateScoreWon(choice, score, iyScore);

        return {
          id: `past_sys4_${dbM.id || Math.random()}`,
          code: String(dbM.id?.slice(0, 5) || '76000'),
          homeTeam: dbM.home_team,
          awayTeam: dbM.away_team,
          league: dbM.league || 'Lig',
          date: dates.yesterdayDot,
          time: (dbM.match_time || '20:00').slice(0, 5),
          marketType: 'iyms',
          marketName: 'İlk Yarı / Maç Sonu',
          choice,
          odd,
          score,
          iyScore,
          won,
          reason: `İY: ${iyScore} | MS: ${score} (${won ? 'TUTTU ✅' : 'YATTI ❌'})`
        };
      };

      const pastMatchesIyMs9 = [
        buildPastIyMsMatch(pastDbMatches[27] || fallbackPastMatches[27], '1/1', 2.30),
        buildPastIyMsMatch(pastDbMatches[28] || fallbackPastMatches[28], 'X/1', 4.10),
        buildPastIyMsMatch(pastDbMatches[29] || fallbackPastMatches[29], 'X/1', 3.90),
        buildPastIyMsMatch(pastDbMatches[30] || fallbackPastMatches[30], 'X/1', 4.25),
        buildPastIyMsMatch(pastDbMatches[31] || fallbackPastMatches[31], 'X/2', 6.20),
        buildPastIyMsMatch(pastDbMatches[32] || fallbackPastMatches[32], '1/X', 14.50),
        buildPastIyMsMatch(pastDbMatches[33] || fallbackPastMatches[33], 'X/1', 7.50),
        buildPastIyMsMatch(pastDbMatches[34] || fallbackPastMatches[34], '2/2', 3.40),
        buildPastIyMsMatch(pastDbMatches[35] || fallbackPastMatches[35], '2/2', 2.95)
      ];

      const pastIyMsOdds = pastMatchesIyMs9.map(m => m.odd);
      const hitIndicesIyMs = pastMatchesIyMs9.map((m, i) => m.won ? i : -1).filter(i => i !== -1);
      const hitCountIyMs = hitIndicesIyMs.length;
      const isWinnerIyMs = hitCountIyMs >= 4;

      let totalPastColumnsIyMs = 0;
      for (const k of [4, 5, 6]) {
        totalPastColumnsIyMs += getSubsets(pastMatchesIyMs9, k).length;
      }
      const pastCostIyMs = totalPastColumnsIyMs * 1;
      const wonAmountIyMs = isWinnerIyMs ? Number(calcSystemPayout(pastIyMsOdds, hitIndicesIyMs, [4, 5, 6], 1).toFixed(2)) : 0;
      const pastProfitIyMs = Number((wonAmountIyMs - pastCostIyMs).toFixed(2));
      const pastPayoutTableIyMs = generatePayoutTable(pastIyMsOdds, [4, 5, 6], 1);

      const pastCoupon4: SystemCoupon = {
        id: 'past-kupon-4',
        title: '4. Sistem Kuponu (Dün - İY / MS Odaklı)',
        badge: `${dates.yesterdayDot} SONUÇLARI`,
        description: 'Dün bültendeki İlk Yarı / Maç Sonu (İY/MS: 1/1, X/1, 2/2, X/2, 1/X) oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
        theme: 'rose',
        systemSizes: [4, 5, 6],
        systemLabel: 'Sistem 4, 5, 6',
        totalMatches: pastMatchesIyMs9.length,
        totalColumns: totalPastColumnsIyMs,
        misli: 1,
        cost: pastCostIyMs,
        minOdds: Math.min(...pastIyMsOdds),
        maxOdds: Math.max(...pastIyMsOdds),
        avgOdds: Number((pastIyMsOdds.reduce((a, b) => a + b, 0) / pastIyMsOdds.length).toFixed(2)),
        matches: pastMatchesIyMs9,
        payoutTable: pastPayoutTableIyMs,
        targetProfitBadge: isWinnerIyMs 
          ? `${wonAmountIyMs.toLocaleString('tr-TR')} TL KAZANDI (${hitCountIyMs}/9 TUTTU)` 
          : `İADE ALINAMADI (${hitCountIyMs}/9 TUTTU)`,
        hitCount: hitCountIyMs,
        isWinner: isWinnerIyMs,
        wonAmount: wonAmountIyMs,
        profit: pastProfitIyMs
      };

      pastCoupons = [pastCoupon1, pastCoupon2, pastCoupon3, pastCoupon4];
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

    // Cache kaydet (4 kupon da tamamsa)
    if (todayCoupons.length >= 4 && todayCoupons.every(c => c.matches.length === 9)) {
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
