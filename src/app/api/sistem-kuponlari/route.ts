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
    // Dünün resmi maç sonuçları ve açılış oranları
    const pastIyms = (iymsCache?.pastMatches || []).filter((m: any) => isMajorLeague(m.league));

    const pastPool: SystemMatch[] = [];

    pastIyms.forEach((m: any, idx: number) => {
      const topKey = m.topOutcome?.key || '1/1';
      if (!m.openedOdds || !m.openedOdds[topKey]) return;
      const oddVal = parseFloat(String(m.openedOdds[topKey]).replace(',', '.'));
      if (oddVal < 1.30) return;

      pastPool.push({
        id: `past_iyms_${m.id || idx}`,
        code: m.code || String(300 + idx),
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        league: m.league || 'BÜLTEN',
        date: m.date || '06.10.2026',
        time: m.time || '20:00',
        marketType: 'iy_ms',
        marketName: 'İY / MS',
        choice: `${topKey} (İY/MS)`,
        odd: oddVal,
        score: m.score || 'MS',
        iyScore: m.iyScore || 'İY',
        won: m.isTopHit === true,
        reason: `İddaa Açılış Oranı: ${oddVal.toFixed(2)} | Sonuç: İY ${m.iyScore || '-'} / MS ${m.score || '-'} (${m.actualOutcome || ''})`
      });
    });

    function evaluatePastCoupon(
      id: string,
      title: string,
      badge: string,
      description: string,
      theme: 'amber' | 'emerald' | 'purple' | 'cyan',
      systemSizes: number[],
      systemLabel: string,
      neededCount: number,
      selectedCandidates: (SystemMatch | undefined)[]
    ): SystemCoupon {
      const matches = getUniqueMatches(selectedCandidates, pastPool, neededCount);
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
        minOdds: Math.min(...odds),
        maxOdds: Math.max(...odds),
        avgOdds: Number((odds.reduce((a, b) => a + b, 0) / odds.length).toFixed(2)),
        matches,
        payoutTable,
        targetProfitBadge: isWinner ? `${wonAmount.toLocaleString('tr-TR')} TL KAZANDI` : 'İADE ALINAMADI',
        hitCount,
        isWinner,
        wonAmount,
        profit
      };
    }

    // Past Coupon 1 (Hibrit / Karma Vurgun) - Tamamı resmi İddaa İY/MS açılış oranlı maçlar
    const pastC1 = evaluatePastCoupon(
      'past-kupon-1',
      'Hibrit / Karma Vurgun Kuponu (Dün)',
      '06.10.2026 SONUÇLARI',
      'Dün resmi bültende İY/MS açılış oranları bulunan ana lig maçlarından derlenen sistem kuponu sonuçları.',
      'amber',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      10,
      pastPool.slice(0, 10)
    );

    // Past Coupon 2 (İY/MS Değer)
    const pastC2 = evaluatePastCoupon(
      'past-kupon-2',
      'İY/MS & Sürpriz Değer Kuponu (Dün)',
      '06.10.2026 SONUÇLARI',
      'Dün resmi İY/MS oranları açılmış maçların gerçekleşen sonuçları ve kazanç tablosu.',
      'purple',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      10,
      pastPool.slice(0, 10)
    );

    // Past Coupon 3 (Kombine & İY/MS Dengeli)
    const pastC3 = evaluatePastCoupon(
      'past-kupon-3',
      'Kombine & İY/MS Kilidi (Dün)',
      '06.10.2026 SONUÇLARI',
      'Dün bültende resmi oranları bulunan maçların sonuçları.',
      'cyan',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      10,
      pastPool.slice(0, 10)
    );

    // Past Coupon 4 (Büyük Vurgun 9 Maç)
    const pastC4 = evaluatePastCoupon(
      'past-kupon-4',
      'Büyük Vurgun / Çılgın Sistem (Dün)',
      '06.10.2026 SONUÇLARI',
      '420 TL maliyetli 9 maçlık Sistem 3,4,5,6 modelinin dünkü resmi bülten sonuç dökümü.',
      'emerald',
      [3, 4, 5, 6],
      'Sistem 3, 4, 5, 6',
      9,
      pastPool.slice(0, 9)
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

