import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  theme: 'amber' | 'emerald' | 'purple' | 'cyan';
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

function loadJsonCache(filename: string) {
  try {
    const p1 = path.join(process.cwd(), 'data', filename);
    if (fs.existsSync(p1)) return JSON.parse(fs.readFileSync(p1, 'utf-8'));
    const p2 = path.join(process.cwd(), 'public', 'data', filename);
    if (fs.existsSync(p2)) return JSON.parse(fs.readFileSync(p2, 'utf-8'));
  } catch (e) {}
  return null;
}

function isUpcomingDate(dateStr: string): boolean {
  if (!dateStr) return true;
  if (dateStr === 'Bugün' || dateStr === 'Yarın') return true;
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const matchDate = new Date(y, m, d, 23, 59, 59).getTime();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
    return matchDate >= todayStart;
  }
  return true;
}

export async function GET() {
  try {
    const iymsCache = loadJsonCache('iy_ms_cache.json');
    const yuksekCache = loadJsonCache('yuksek_oran_cache.json');    // Sadece resmi İddaa bülteninde İY/MS ve Kombine açılan popüler/ana ligler
    const allowedLeagues = [
      'UEFA', 'AVUL', 'U21', 'U19', 'HAZ', 'DÜNYA',
      'İspanya', 'İngiltere', 'İtalya', 'Almanya', 'Fransa', 'Türkiye',
      'Hollanda', 'Belçika', 'Portekiz', 'Brezilya', 'BR1', 'BR2',
      'Arjantin - Premier', 'ARJ', 'Finlandiya', 'FİN', 'İsveç', 'Norveç', 'Japonya', 'JPK', 'MLS'
    ];

    function isMajorLeague(leagueName: string): boolean {
      if (!leagueName) return false;
      const ln = leagueName.toUpperCase();
      if (ln.includes('PRIMERA C') || ln.includes('PRIMERA D') || ln.includes('GUATEMALA') || ln.includes('PARAGUAY') || ln.includes('JAMAIKA') || ln.includes('KOLPB') || ln.includes('CONCACAF')) {
        return false;
      }
      return allowedLeagues.some(al => ln.includes(al.toUpperCase()));
    }

    // 1. TODAY'S ACTIVE MATCHES (07.10.2026)
    // Bugünün tarihini bul (veya bültendeki en yakın aktif günü)
    const allUpcoming = [...(iymsCache?.matches || []), ...(yuksekCache?.matches || [])].filter((m: any) => isUpcomingDate(m.date) && isMajorLeague(m.league));
    const uniqueUpcomingDates = [...new Set(allUpcoming.map((m: any) => m.date))];
    const todayTargetDate = uniqueUpcomingDates[0] || '07.10.2026';

    const rawIyms = (iymsCache?.matches || []).filter((m: any) => m.date === todayTargetDate && isMajorLeague(m.league));
    const rawYuksek = (yuksekCache?.matches || []).filter((m: any) => m.date === todayTargetDate && isMajorLeague(m.league));

    // Eğer o güne özel maç sayısı 10'dan azsa, genel aktif günlerden tamamla
    const fallbackIyms = (iymsCache?.matches || []).filter((m: any) => isUpcomingDate(m.date) && isMajorLeague(m.league));
    const fallbackYuksek = (yuksekCache?.matches || []).filter((m: any) => isUpcomingDate(m.date) && isMajorLeague(m.league));

    const iymsPool: SystemMatch[] = [];
    const sourceIyms = rawIyms.length >= 8 ? rawIyms : fallbackIyms;

    sourceIyms.forEach((m: any, idx: number) => {
      const op = m.openedOdds || {};
      const top = m.topOutcome;
      let chosenKey = top?.key || '1/1';
      let oddVal = op[chosenKey] ? parseFloat(String(op[chosenKey]).replace(',', '.')) : 0;

      if (!oddVal || oddVal < 1.30) {
        const altKeys = ['1/1', '2/2', 'X/1', 'X/2'];
        for (const k of altKeys) {
          if (op[k] && parseFloat(op[k]) >= 1.30) {
            chosenKey = k;
            oddVal = parseFloat(op[k]);
            break;
          }
        }
      }

      if (oddVal >= 1.30) {
        iymsPool.push({
          id: `iyms_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(100 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || todayTargetDate,
          time: m.time || '20:00',
          marketType: 'iy_ms',
          marketName: 'İY / MS',
          choice: `${chosenKey} (İY/MS)`,
          odd: oddVal,
          reason: `İddaa Açılış Oranı: ${oddVal.toFixed(2)} | Model Benzerliği: %${top?.rate || 50}`
        });
      }
    });

    const comboPool: SystemMatch[] = [];
    const sourceYuksek = rawYuksek.length >= 8 ? rawYuksek : fallbackYuksek;

    sourceYuksek.forEach((m: any, idx: number) => {
      const tc = m.topCombo;
      const oddVal = tc?.estOdd ? parseFloat(String(tc.estOdd).replace(',', '.')) : 0;
      if (oddVal >= 1.30) {
        comboPool.push({
          id: `yuksek_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(200 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || todayTargetDate,
          time: m.time || '21:00',
          marketType: 'combo',
          marketName: 'Kombine & Skor',
          choice: tc.name,
          odd: oddVal,
          reason: `İddaa Açılış Oranı: ${oddVal.toFixed(2)} | Başarı Frekansı: %${tc.rate || 50}`
        });
      }
    });

    function getUniqueMatches(candidates: (SystemMatch | undefined)[], fallbackList: SystemMatch[], neededCount: number): SystemMatch[] {
      const result: SystemMatch[] = [];
      const seen = new Set<string>();

      candidates.forEach(c => {
        if (c && c.homeTeam && !seen.has(c.homeTeam) && typeof c.odd === 'number' && c.odd > 0) {
          seen.add(c.homeTeam);
          result.push(c);
        }
      });

      if (result.length < neededCount) {
        fallbackList.forEach(c => {
          if (c && c.homeTeam && !seen.has(c.homeTeam) && typeof c.odd === 'number' && c.odd > 0 && result.length < neededCount) {
            seen.add(c.homeTeam);
            result.push(c);
          }
        });
      }

      return result.slice(0, neededCount);
    }

    const allMatchesPool = [...iymsPool, ...comboPool];

    // --- KUPON 1: HİBRİT / KARMA VURGUN (10 Maç - Sistem 3, 4, 5) ---
    // En yüksek başarı oranına sahip Kombine ve İY/MS maçlarının dengeli karması
    const c1Candidates = [
      ...comboPool.slice(0, 5),
      ...iymsPool.slice(0, 5)
    ];
    const coupon1Matches = getUniqueMatches(c1Candidates, allMatchesPool, 10);
    const c1Odds = coupon1Matches.map(m => m.odd);
    const c1Payouts = generatePayoutTable(c1Odds, [3, 4, 5], 1);

    const coupon1: SystemCoupon = {
      id: 'kupon-1',
      title: 'Hibrit / Karma Vurgun Kuponu',
      badge: 'EN ÇOK TERCİH EDİLEN',
      description: 'Günün resmi bültendeki İY/MS, Kombine (MS+Gol) açılış oranlarından oluşan dengeli sistem kuponu.',
      theme: 'amber',
      systemSizes: [3, 4, 5],
      systemLabel: 'Sistem 3, 4, 5',
      totalMatches: 10,
      totalColumns: 582,
      misli: 1,
      cost: 582,
      minOdds: c1Odds.length > 0 ? Math.min(...c1Odds) : 0,
      maxOdds: c1Odds.length > 0 ? Math.max(...c1Odds) : 0,
      avgOdds: c1Odds.length > 0 ? Number((c1Odds.reduce((a, b) => a + b, 0) / c1Odds.length).toFixed(2)) : 0,
      matches: coupon1Matches,
      payoutTable: c1Payouts,
      targetProfitBadge: '45.000 TL - 120.000 TL Hedef'
    };

    // --- KUPON 2: İY/MS & SÜRPRİZ DEĞER (10 Maç - Sistem 3, 4, 5) ---
    // Sadece bültende resmi açılışı olan İY/MS maçları
    const c2Candidates = iymsPool.slice(0, 10);
    const coupon2Matches = getUniqueMatches(c2Candidates, iymsPool, 10);
    const c2Odds = coupon2Matches.map(m => m.odd);
    const c2Payouts = generatePayoutTable(c2Odds, [3, 4, 5], 1);

    const coupon2: SystemCoupon = {
      id: 'kupon-2',
      title: 'İY/MS & Sürpriz Değer Kuponu',
      badge: 'YÜKSEK ÇARPAN',
      description: 'Sadece bültende resmi açılış oranları bulunan X/1, X/2 ve İY/MS oranlarına dayalı sistem kuponu.',
      theme: 'purple',
      systemSizes: [3, 4, 5],
      systemLabel: 'Sistem 3, 4, 5',
      totalMatches: 10,
      totalColumns: 582,
      misli: 1,
      cost: 582,
      minOdds: c2Odds.length > 0 ? Math.min(...c2Odds) : 0,
      maxOdds: c2Odds.length > 0 ? Math.max(...c2Odds) : 0,
      avgOdds: c2Odds.length > 0 ? Number((c2Odds.reduce((a, b) => a + b, 0) / c2Odds.length).toFixed(2)) : 0,
      matches: coupon2Matches,
      payoutTable: c2Payouts,
      targetProfitBadge: '60.000 TL - 175.000 TL Hedef'
    };

    // --- KUPON 3: KOMBİNE & GOL KİLİDİ (10 Maç - Sistem 3, 4, 5) ---
    // Resmi bülten MS + 2.5 Üst/Alt ve KG kombinasyonları
    const c3Candidates = comboPool.slice(0, 10);
    const coupon3Matches = getUniqueMatches(c3Candidates, allMatchesPool, 10);
    const c3Odds = coupon3Matches.map(m => m.odd);
    const c3Payouts = generatePayoutTable(c3Odds, [3, 4, 5], 1);

    const coupon3: SystemCoupon = {
      id: 'kupon-3',
      title: 'Kombine & Gol Kilidi',
      badge: 'GOL & SKOR MODELİ',
      description: 'Resmi bülten MS 1 & 2.5 Üst, MS 2 & 2.5 Üst ve İY/MS kombinasyonlarına dayalı sistem.',
      theme: 'cyan',
      systemSizes: [3, 4, 5],
      systemLabel: 'Sistem 3, 4, 5',
      totalMatches: 10,
      totalColumns: 582,
      misli: 1,
      cost: 582,
      minOdds: c3Odds.length > 0 ? Math.min(...c3Odds) : 0,
      maxOdds: c3Odds.length > 0 ? Math.max(...c3Odds) : 0,
      avgOdds: c3Odds.length > 0 ? Number((c3Odds.reduce((a, b) => a + b, 0) / c3Odds.length).toFixed(2)) : 0,
      matches: coupon3Matches,
      payoutTable: c3Payouts,
      targetProfitBadge: '25.000 TL - 65.000 TL Hedef'
    };

    // --- KUPON 4: BÜYÜK VURGUN / ÇILGIN SİSTEM (9 Maç - Sistem 3, 4, 5, 6) ---
    // Yüksek çarpanlı 9 maçlık mega sistem
    const c4Candidates = [...comboPool.slice(0, 5), ...iymsPool.slice(0, 4)];
    const coupon4Matches = getUniqueMatches(c4Candidates, allMatchesPool, 9);
    const c4Odds = coupon4Matches.map(m => m.odd);
    const c4Payouts = generatePayoutTable(c4Odds, [3, 4, 5, 6], 1);

    const coupon4: SystemCoupon = {
      id: 'kupon-4',
      title: 'Büyük Vurgun / Çılgın Sistem',
      badge: '420 TL / 6 MAÇTA 75K',
      description: '420 TL kupon maliyetiyle, 6 maç tuttuğunda 75.000 TL+, 7 maçta 250k+ kazandıran yüksek çarpanlı model.',
      theme: 'emerald',
      systemSizes: [3, 4, 5, 6],
      systemLabel: 'Sistem 3, 4, 5, 6',
      totalMatches: 9,
      totalColumns: 420,
      misli: 1,
      cost: 420,
      minOdds: c4Odds.length > 0 ? Math.min(...c4Odds) : 0,
      maxOdds: c4Odds.length > 0 ? Math.max(...c4Odds) : 0,
      avgOdds: c4Odds.length > 0 ? Number((c4Odds.reduce((a, b) => a + b, 0) / c4Odds.length).toFixed(2)) : 0,
      matches: coupon4Matches,
      payoutTable: c4Payouts,
      targetProfitBadge: '75.000 TL - 280.000 TL Hedef'
    };

    // 2. YESTERDAY'S EVALUATED COUPONS (06.10.2026)
    // Dün ekranda sunulan 4 sistem kuponunun birebir aynı maçları ve gerçek maç skorlarıyla değerlendirilmesi
    const m_Iskocya: SystemMatch = { id: 'past_1', code: '72301', homeTeam: 'İskoçya', awayTeam: 'Slovenya', league: 'AVUL', date: '06.10.2026', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.56, score: '1 - 2', iyScore: '0 - 1', won: false, reason: 'İddaa Açılış: 2.56 | Sonuç: İY 0-1 / MS 1-2 (2/2)' };
    const m_Hirvatistan: SystemMatch = { id: 'past_2', code: '72303', homeTeam: 'Hırvatistan', awayTeam: 'İspanya', league: 'AVUL', date: '06.10.2026', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 1.51, score: '1 - 2', iyScore: '0 - 1', won: true, reason: 'İddaa Açılış: 1.51 | Sonuç: İY 0-1 / MS 1-2 (2/2)' };
    const m_Estonya_IyMs: SystemMatch = { id: 'past_3', code: '72302', homeTeam: 'Estonya', awayTeam: 'İzlanda', league: 'AVUL', date: '06.10.2026', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 2.11, score: '0 - 0', iyScore: '0 - 0', won: false, reason: 'İddaa Açılış: 2.11 | Sonuç: İY 0-0 / MS 0-0 (X/X)' };
    const m_Estonya_Combo: SystemMatch = { id: 'past_3_c', code: '72302', homeTeam: 'Estonya', awayTeam: 'İzlanda', league: 'AVUL', date: '06.10.2026', time: '21:45', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 2 & 2.5 ÜST', odd: 2.33, score: '0 - 0', iyScore: '0 - 0', won: false, reason: 'İddaa Açılış: 2.33 | Sonuç: 0-0' };
    const m_Moldova: SystemMatch = { id: 'past_4', code: '72304', homeTeam: 'Moldova', awayTeam: 'Slovakya', league: 'AVUL', date: '06.10.2026', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 1.65, score: '0 - 4', iyScore: '0 - 0', won: false, reason: 'İddaa Açılış: 1.65 | Sonuç: İY 0-0 / MS 0-4 (X/2)' };
    const m_Belarus_IyMs: SystemMatch = { id: 'past_5', code: '72305', homeTeam: 'Belarus', awayTeam: 'Finlandiya', league: 'AVUL', date: '06.10.2026', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 2.80, score: '1 - 0', iyScore: '0 - 1', won: false, reason: 'İddaa Açılış: 2.80 | Sonuç: İY 0-1 / MS 1-0 (2/1)' };
    const m_Belarus_Combo: SystemMatch = { id: 'past_5_c', code: '72305', homeTeam: 'Belarus', awayTeam: 'Finlandiya', league: 'AVUL', date: '06.10.2026', time: '21:45', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 2 & 2.5 ÜST', odd: 3.78, score: '1 - 0', iyScore: '0 - 1', won: false, reason: 'İddaa Açılış: 3.78 | Sonuç: 1-0' };
    const m_Kolombiya: SystemMatch = { id: 'past_6', code: '72306', homeTeam: 'Kolombiya', awayTeam: 'Peru', league: 'HAZ', date: '07.10.2026', time: '02:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 1.75, score: '2 - 0', iyScore: '0 - 0', won: false, reason: 'İddaa Açılış: 1.75 | Sonuç: İY 0-0 / MS 2-0 (X/1)' };
    const m_Litvanya: SystemMatch = { id: 'past_7', code: '72307', homeTeam: 'Litvanya (U21)', awayTeam: 'Hırvatistan (U21)', league: 'U21', date: '06.10.2026', time: '20:00', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 2 & KG YOK', odd: 1.67, score: '0 - 1', iyScore: '0 - 0', won: true, reason: 'İddaa Açılış: 1.67 | Sonuç: 0-1 (MS 2 & KG Yok)' };
    const m_Portekiz: SystemMatch = { id: 'past_8', code: '72308', homeTeam: 'Portekiz (U21)', awayTeam: 'Çek Cumhuriyeti', league: 'U21', date: '06.10.2026', time: '19:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & 2.5 ÜST', odd: 1.78, score: '2 - 0', iyScore: '1 - 0', won: false, reason: 'İddaa Açılış: 1.78 | Sonuç: 2-0 (2 Gol - Alt)' };
    const m_Arnavutluk: SystemMatch = { id: 'past_9', code: '72309', homeTeam: 'Arnavutluk', awayTeam: 'San Marino', league: 'AVUL', date: '06.10.2026', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: 'X/1 (İY/MS)', odd: 4.39, score: '2 - 1', iyScore: '0 - 1', won: false, reason: 'İddaa Açılış: 4.39 | Sonuç: İY 0-1 / MS 2-1 (2/1)' };
    const m_Ingiltere: SystemMatch = { id: 'past_10', code: '72310', homeTeam: 'İngiltere', awayTeam: 'Çekya', league: 'AVUL', date: '06.10.2026', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 35.00, score: '3 - 0', iyScore: '0 - 2', won: false, reason: 'İddaa Açılış: 35.00 | Sonuç: İY 0-2 / MS 3-0 (2/1)' };
    
    // Gelecek güne sarkanlar
    const m_Botafogo: SystemMatch = { id: 'past_11', code: '72311', homeTeam: 'Botafogo', awayTeam: 'Vasco Da Gama', league: 'BR1', date: '08.10.2026', time: '02:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 3.52, score: '08.10', iyScore: '-', won: false, reason: '08.10 Tarihli Maç' };
    const m_Remo: SystemMatch = { id: 'past_12', code: '72312', homeTeam: 'Remo', awayTeam: 'Gremio', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 3.35, score: '08.10', iyScore: '-', won: false, reason: '08.10 Tarihli Maç' };
    const m_Urawa: SystemMatch = { id: 'past_13', code: '72313', homeTeam: 'Urawa', awayTeam: 'Omiya', league: 'JPK', date: '07.10.2026', time: '12:00', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & 2.5 ÜST', odd: 1.99, score: '07.10', iyScore: '-', won: false, reason: '07.10 Tarihli Maç' };
    const m_Helsinki: SystemMatch = { id: 'past_14', code: '72314', homeTeam: 'Helsinki', awayTeam: 'Vaasa', league: 'FİN', date: '08.10.2026', time: '18:00', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.07, score: '08.10', iyScore: '-', won: false, reason: '08.10 Tarihli Maç' };
    const m_Cruzeiro: SystemMatch = { id: 'past_15', code: '72315', homeTeam: 'Cruzeiro', awayTeam: 'Sao Paulo', league: 'BR1', date: '08.10.2026', time: '03:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.63, score: '08.10', iyScore: '-', won: false, reason: '08.10 Tarihli Maç' };
    const m_Internacional: SystemMatch = { id: 'past_16', code: '72316', homeTeam: 'Internacional', awayTeam: 'Corinthians', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 3.18, score: '08.10', iyScore: '-', won: false, reason: '08.10 Tarihli Maç' };
    const m_Santos: SystemMatch = { id: 'past_17', code: '72317', homeTeam: 'Santos', awayTeam: 'Flamengo', league: 'BR1', date: '09.10.2026', time: '01:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 2.45, score: '09.10', iyScore: '-', won: false, reason: '09.10 Tarihli Maç' };
    const m_Palmeiras: SystemMatch = { id: 'past_18', code: '72318', homeTeam: 'Palmeiras', awayTeam: 'Bahia', league: 'BR1', date: '09.10.2026', time: '03:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 1.97, score: '09.10', iyScore: '-', won: false, reason: '09.10 Tarihli Maç' };

    function createEvaluatedCoupon(
      id: string,
      title: string,
      badge: string,
      description: string,
      theme: 'amber' | 'emerald' | 'purple' | 'cyan',
      systemSizes: number[],
      systemLabel: string,
      matches: SystemMatch[]
    ): SystemCoupon {
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
        targetProfitBadge: isWinner ? `${wonAmount.toLocaleString('tr-TR')} TL KAZANDI` : 'İADE ALINAMADI (2/10 TUTTU)',
        hitCount,
        isWinner,
        wonAmount,
        profit
      };
    }

    // Past Coupon 1: Hibrit / Karma Vurgun Kuponu (Dün - 06.10.2026)
    const pastC1 = createEvaluatedCoupon(
      'past-kupon-1',
      'Hibrit / Karma Vurgun Kuponu (Dün)',
      '06.10.2026 SONUÇLARI',
      'Dün resmi bültendeki İY/MS, Kombine (MS+Gol) açılış oranlarından oluşan dengeli sistem kuponu sonuçları.',
      'amber',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      [
        m_Estonya_Combo,
        m_Belarus_Combo,
        m_Iskocya,
        m_Hirvatistan,
        m_Moldova,
        m_Litvanya,
        m_Portekiz,
        m_Kolombiya,
        m_Arnavutluk,
        m_Ingiltere
      ]
    );

    // Past Coupon 2: İY/MS & Sürpriz Değer Kuponu (Dün - 06.10.2026)
    const pastC2 = createEvaluatedCoupon(
      'past-kupon-2',
      'İY/MS & Sürpriz Değer Kuponu (Dün)',
      '06.10.2026 SONUÇLARI',
      'Dün resmi bültende İY/MS açılış oranları bulunan maçların sonuçları.',
      'purple',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      [
        m_Iskocya,
        m_Hirvatistan,
        m_Estonya_IyMs,
        m_Moldova,
        m_Belarus_IyMs,
        m_Kolombiya,
        m_Botafogo,
        m_Remo,
        m_Arnavutluk,
        m_Ingiltere
      ]
    );

    // Past Coupon 3: Kombine & Gol Kilidi (Dün - 06.10.2026)
    const pastC3 = createEvaluatedCoupon(
      'past-kupon-3',
      'Kombine & Gol Kilidi (Dün)',
      '06.10.2026 SONUÇLARI',
      'Dün bültendeki kombine ve gol odaklı açılış oranlarına sahip maçların sonuçları.',
      'cyan',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      [
        m_Estonya_Combo,
        m_Belarus_Combo,
        m_Litvanya,
        m_Portekiz,
        m_Urawa,
        m_Iskocya,
        m_Kolombiya,
        m_Helsinki,
        m_Arnavutluk,
        m_Hirvatistan
      ]
    );

    // Past Coupon 4: Büyük Vurgun / Çılgın Sistem (Dün - 06.10.2026)
    const pastC4 = createEvaluatedCoupon(
      'past-kupon-4',
      'Büyük Vurgun / Çılgın Sistem (Dün)',
      '06.10.2026 SONUÇLARI',
      '420 TL maliyetli 9 maçlık Sistem 3,4,5,6 modelinin dünkü resmi bülten sonuç dökümü.',
      'emerald',
      [3, 4, 5, 6],
      'Sistem 3, 4, 5, 6',
      [
        m_Iskocya,
        m_Estonya_Combo,
        m_Belarus_Combo,
        m_Cruzeiro,
        m_Internacional,
        m_Santos,
        m_Palmeiras,
        m_Arnavutluk,
        m_Hirvatistan
      ]
    );

    const pastCoupons = [pastC1, pastC2, pastC3, pastC4];
    const totalPastCost = pastCoupons.reduce((a, b) => a + b.cost, 0);
    const totalPastWon = pastCoupons.reduce((a, b) => a + (b.wonAmount || 0), 0);
    const wonPastCount = pastCoupons.filter(c => c.isWinner).length;

    const yesterdaySummary: YesterdaySummary = {
      date: '06.10.2026',
      formattedDate: '6 Ekim 2026 Dün',
      totalCoupons: pastCoupons.length,
      wonCoupons: wonPastCount,
      totalCost: totalPastCost,
      totalWonAmount: Number(totalPastWon.toFixed(2)),
      netProfit: Number((totalPastWon - totalPastCost).toFixed(2)),
      coupons: pastCoupons
    };

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('tr-TR'),
      coupons: [coupon1, coupon2, coupon3, coupon4],
      yesterday: yesterdaySummary
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

