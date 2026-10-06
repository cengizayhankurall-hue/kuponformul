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
    const yuksekCache = loadJsonCache('yuksek_oran_cache.json');

    const rawIyms = (iymsCache?.matches || []).filter((m: any) => isUpcomingDate(m.date));
    const rawYuksek = (yuksekCache?.matches || []).filter((m: any) => isUpcomingDate(m.date));

    const iymsPool: SystemMatch[] = [];
    rawIyms.forEach((m: any, idx: number) => {
      const op = m.openedOdds || {};
      const top = m.topOutcome;
      let chosenKey = top?.key || 'X/1';
      let oddVal = op[chosenKey] ? parseFloat(String(op[chosenKey]).replace(',', '.')) : 0;

      // Prefer high-value outcome if available
      if (oddVal < 2.00) {
        if (op['X/1'] && parseFloat(op['X/1']) >= 3.00) {
          chosenKey = 'X/1';
          oddVal = parseFloat(op['X/1']);
        } else if (op['X/2'] && parseFloat(op['X/2']) >= 3.00) {
          chosenKey = 'X/2';
          oddVal = parseFloat(op['X/2']);
        } else if (op['1/1'] && parseFloat(op['1/1']) >= 2.00) {
          chosenKey = '1/1';
          oddVal = parseFloat(op['1/1']);
        } else if (op['2/2'] && parseFloat(op['2/2']) >= 2.00) {
          chosenKey = '2/2';
          oddVal = parseFloat(op['2/2']);
        }
      }

      if (oddVal >= 2.00) {
        iymsPool.push({
          id: `iyms_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(100 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || 'Bugün',
          time: m.time || '20:00',
          marketType: 'iy_ms',
          marketName: 'İY / MS',
          choice: `${chosenKey} (İY/MS)`,
          odd: oddVal,
          reason: `Açılış oranı analizi ve %${top?.rate || 40} model frekansı`
        });
      }
    });

    const comboPool: SystemMatch[] = [];
    rawYuksek.forEach((m: any, idx: number) => {
      const tc = m.topCombo;
      const oddVal = tc?.estOdd ? parseFloat(String(tc.estOdd).replace(',', '.')) : 0;
      if (oddVal >= 2.10) {
        comboPool.push({
          id: `yuksek_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(200 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || 'Bugün',
          time: m.time || '21:00',
          marketType: 'combo',
          marketName: 'Kombine & Skor',
          choice: tc.name,
          odd: oddVal,
          reason: `Bültende açılan oran ile %${tc.rate} model frekansı`
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
    // Bugün (06.10) ve yakın maçlardan karma
    const c1Candidates = [
      comboPool.find(m => m.homeTeam.includes('Estonya')),
      comboPool.find(m => m.homeTeam.includes('Belarus')),
      iymsPool.find(m => m.homeTeam.includes('İskoçya')),
      iymsPool.find(m => m.homeTeam.includes('Lüksemburg')),
      iymsPool.find(m => m.homeTeam.includes('Kazakistan')),
      comboPool.find(m => m.homeTeam.includes('Braintree')),
      comboPool.find(m => m.homeTeam.includes('Shrewsbury')),
      comboPool.find(m => m.homeTeam.includes('Litvanya')),
      comboPool.find(m => m.homeTeam.includes('Portekiz')),
      iymsPool.find(m => m.homeTeam.includes('Kolombiya'))
    ];
    const coupon1Matches = getUniqueMatches(c1Candidates, allMatchesPool, 10);
    const c1Odds = coupon1Matches.map(m => m.odd);
    const c1Payouts = generatePayoutTable(c1Odds, [3, 4, 5], 1);

    const coupon1: SystemCoupon = {
      id: 'kupon-1',
      title: 'Hibrit / Karma Vurgun Kuponu',
      badge: 'EN ÇOK TERCİH EDİLEN',
      description: 'Günün en değerli İY/MS, Kombine (MS+Gol) ve açılış oranı sapmalarından oluşan dengeli sistem kuponu.',
      theme: 'amber',
      systemSizes: [3, 4, 5],
      systemLabel: 'Sistem 3, 4, 5',
      totalMatches: 10,
      totalColumns: 582,
      misli: 1,
      cost: 582,
      minOdds: Math.min(...c1Odds),
      maxOdds: Math.max(...c1Odds),
      avgOdds: Number((c1Odds.reduce((a, b) => a + b, 0) / c1Odds.length).toFixed(2)),
      matches: coupon1Matches,
      payoutTable: c1Payouts,
      targetProfitBadge: '45.000 TL - 120.000 TL Hedef'
    };

    // --- KUPON 2: İY/MS & SÜRPRİZ DEĞER (10 Maç - Sistem 3, 4, 5) ---
    const c2Candidates = [
      iymsPool.find(m => m.homeTeam.includes('İskoçya')),
      iymsPool.find(m => m.homeTeam.includes('Lüksemburg')),
      iymsPool.find(m => m.homeTeam.includes('Kazakistan')),
      iymsPool.find(m => m.homeTeam.includes('Hirvatistan')),
      iymsPool.find(m => m.homeTeam.includes('Estonya')),
      iymsPool.find(m => m.homeTeam.includes('Moldova')),
      iymsPool.find(m => m.homeTeam.includes('Belarus')),
      iymsPool.find(m => m.homeTeam.includes('Kolombiya')),
      iymsPool.find(m => m.homeTeam.includes('Botafogo')),
      iymsPool.find(m => m.homeTeam.includes('Remo'))
    ];
    const coupon2Matches = getUniqueMatches(c2Candidates, iymsPool, 10);
    const c2Odds = coupon2Matches.map(m => m.odd);
    const c2Payouts = generatePayoutTable(c2Odds, [3, 4, 5], 1);

    const coupon2: SystemCoupon = {
      id: 'kupon-2',
      title: 'İY/MS & Sürpriz Değer Kuponu',
      badge: 'YÜKSEK ÇARPAN',
      description: 'Sadece bültende açılan yüksek güvenilirlikli X/1, X/2 ve İY/MS oranlarına dayalı sistem kuponu.',
      theme: 'purple',
      systemSizes: [3, 4, 5],
      systemLabel: 'Sistem 3, 4, 5',
      totalMatches: 10,
      totalColumns: 582,
      misli: 1,
      cost: 582,
      minOdds: Math.min(...c2Odds),
      maxOdds: Math.max(...c2Odds),
      avgOdds: Number((c2Odds.reduce((a, b) => a + b, 0) / c2Odds.length).toFixed(2)),
      matches: coupon2Matches,
      payoutTable: c2Payouts,
      targetProfitBadge: '60.000 TL - 175.000 TL Hedef'
    };

    // --- KUPON 3: KOMBİNE & GOL KİLİDİ (10 Maç - Sistem 3, 4, 5) ---
    const c3Candidates = [
      comboPool.find(m => m.homeTeam.includes('Estonya')),
      comboPool.find(m => m.homeTeam.includes('Belarus')),
      comboPool.find(m => m.homeTeam.includes('Braintree')),
      comboPool.find(m => m.homeTeam.includes('Shrewsbury')),
      comboPool.find(m => m.homeTeam.includes('Litvanya')),
      comboPool.find(m => m.homeTeam.includes('Sheffield')),
      comboPool.find(m => m.homeTeam.includes('Huddersfield')),
      comboPool.find(m => m.homeTeam.includes('Doncaster')),
      comboPool.find(m => m.homeTeam.includes('Blackpool')),
      comboPool.find(m => m.homeTeam.includes('Urawa'))
    ];
    const coupon3Matches = getUniqueMatches(c3Candidates, comboPool, 10);
    const c3Odds = coupon3Matches.map(m => m.odd);
    const c3Payouts = generatePayoutTable(c3Odds, [3, 4, 5], 1);

    const coupon3: SystemCoupon = {
      id: 'kupon-3',
      title: 'Kombine & Gol Kilidi',
      badge: 'GOL & SKOR MODELİ',
      description: 'MS 1 & 2.5 Üst, MS 2 & 2.5 Üst ve KG Yok kombinasyonlarına dayalı istikrarlı sistem.',
      theme: 'cyan',
      systemSizes: [3, 4, 5],
      systemLabel: 'Sistem 3, 4, 5',
      totalMatches: 10,
      totalColumns: 582,
      misli: 1,
      cost: 582,
      minOdds: Math.min(...c3Odds),
      maxOdds: Math.max(...c3Odds),
      avgOdds: Number((c3Odds.reduce((a, b) => a + b, 0) / c3Odds.length).toFixed(2)),
      matches: coupon3Matches,
      payoutTable: c3Payouts,
      targetProfitBadge: '25.000 TL - 65.000 TL Hedef'
    };

    // --- KUPON 4: BÜYÜK VURGUN / ÇILGIN SİSTEM (9 Maç - Sistem 3, 4, 5, 6) ---
    const c4Candidates = [
      iymsPool.find(m => m.homeTeam.includes('İskoçya')),
      iymsPool.find(m => m.homeTeam.includes('Lüksemburg')),
      iymsPool.find(m => m.homeTeam.includes('Kazakistan')),
      comboPool.find(m => m.homeTeam.includes('Estonya')),
      comboPool.find(m => m.homeTeam.includes('Belarus')),
      comboPool.find(m => m.homeTeam.includes('Braintree')),
      iymsPool.find(m => m.homeTeam.includes('Cruzeiro')),
      iymsPool.find(m => m.homeTeam.includes('Internacional')),
      iymsPool.find(m => m.homeTeam.includes('Santos'))
    ];
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
      minOdds: Math.min(...c4Odds),
      maxOdds: Math.max(...c4Odds),
      avgOdds: Number((c4Odds.reduce((a, b) => a + b, 0) / c4Odds.length).toFixed(2)),
      matches: coupon4Matches,
      payoutTable: c4Payouts,
      targetProfitBadge: '75.000 TL - 280.000 TL Hedef'
    };

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('tr-TR'),
      coupons: [coupon1, coupon2, coupon3, coupon4]
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
