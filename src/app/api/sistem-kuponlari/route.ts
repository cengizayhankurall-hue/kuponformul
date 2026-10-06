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

export async function GET() {
  try {
    const iymsCache = loadJsonCache('iy_ms_cache.json');
    const yuksekCache = loadJsonCache('yuksek_oran_cache.json');

    const iymsMatches = iymsCache?.matches || [];
    const yuksekMatches = yuksekCache?.matches || [];

    const poolOfMatches: SystemMatch[] = [];

    iymsMatches.forEach((m: any, idx: number) => {
      const op = m.openedOdds || {};
      const top = m.topOutcome;
      const oddVal = top?.key && op[top.key] ? parseFloat(String(op[top.key]).replace(',', '.')) : 0;
      if (oddVal >= 3.00) {
        poolOfMatches.push({
          id: m.id || `iyms_${idx}`,
          code: m.code || String(100 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || 'Bugün',
          time: m.time || '20:00',
          marketType: 'iy_ms',
          marketName: 'İlk Yarı / Maç Sonu',
          choice: `${top.key} (İY/MS)`,
          odd: oddVal,
          reason: `Veritabanında %${top.rate} benzerlik frekansı (${top.count} maçta aynı sonuç)`
        });
      }
    });

    yuksekMatches.forEach((m: any, idx: number) => {
      const tc = m.topCombo;
      const oddVal = tc?.estOdd ? parseFloat(String(tc.estOdd).replace(',', '.')) : 0;
      if (oddVal >= 2.50) {
        poolOfMatches.push({
          id: m.id || `yuksek_${idx}`,
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
          reason: `Tarihsel veride %${tc.rate} başarı (${tc.count} maçta onaylandı)`
        });
      }
    });

    const fallbackSeeds: SystemMatch[] = [
      { id: 'm1', code: '101', homeTeam: 'İtalya', awayTeam: 'Türkiye', league: 'AVUL', date: 'Bugün', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: 'X/1 (İY:X / MS:1)', odd: 4.01, reason: 'İlk yarı dengeli, ikinci yarı ev sahibi üstünlüğü (%48 frekans)' },
      { id: 'm2', code: '102', homeTeam: 'Fransa', awayTeam: 'Belçika', league: 'AVUL', date: 'Bugün', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: 'X/1 (İY:X / MS:1)', odd: 4.18, reason: 'Fransa 2. yarıda baskıyla çözer' },
      { id: 'm3', code: '103', homeTeam: 'Karadağ', awayTeam: 'Ermenistan', league: 'AVUL', date: 'Bugün', time: '21:45', marketType: 'iy_ms', marketName: 'Sürpriz İY/MS', choice: '1/X (Sürpriz)', odd: 16.30, reason: 'Açılış oranında %15 sürpriz beraberlik sapması' },
      { id: 'm4', code: '104', homeTeam: 'Lüksemburg', awayTeam: 'Bulgaristan', league: 'AVUL', date: 'Bugün', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: 'X/1 (İY:X / MS:1)', odd: 4.31, reason: 'İkinci yarı ev sahibi avantajı' },
      { id: 'm5', code: '105', homeTeam: 'Estonya', awayTeam: 'İzlanda', league: 'AVUL', date: 'Bugün', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: 'X/2 (İY:X / MS:2)', odd: 4.13, reason: 'İzlanda fizik kalitesiyle 2. yarıda galip gelir' },
      { id: 'm6', code: '106', homeTeam: 'Bogota', awayTeam: 'Envigado', league: 'KOLPB', date: 'Yarın', time: '01:00', marketType: 'combo', marketName: 'Kombine', choice: 'MS X & 2.5 ALT', odd: 3.60, reason: 'Kısır beraberlik modeli (0-0 / 1-1)' },
      { id: 'm7', code: '107', homeTeam: 'Dep. Merlo', awayTeam: 'Brown', league: 'ARJPBM', date: 'Yarın', time: '01:00', marketType: 'combo', marketName: 'Kombine', choice: 'MS X & 2.5 ALT', odd: 3.65, reason: 'Arjantin ligi düşük tempolu beraberlik' },
      { id: 'm8', code: '108', homeTeam: 'Martinik', awayTeam: 'El Salvador', league: 'CON', date: 'Yarın', time: '01:00', marketType: 'combo', marketName: 'Kombine', choice: 'MS 2 & 2.5 ÜST', odd: 3.20, reason: 'El Salvador gollü deplasman galibiyeti' },
      { id: 'm9', code: '109', homeTeam: 'Chapelton', awayTeam: 'Waterhouse', league: 'JAM', date: 'Yarın', time: '01:05', marketType: 'combo', marketName: 'Kombine', choice: 'MS 2 & 2.5 ÜST', odd: 3.10, reason: 'Jamaika ligi tempolu deplasman üstünlüğü' },
      { id: 'm10', code: '110', homeTeam: 'Küba', awayTeam: 'St. Kitts And N', league: 'CON', date: 'Bugün', time: '00:00', marketType: 'combo', marketName: 'Kombine', choice: 'MS 1 & 3.5 ÜST', odd: 3.80, reason: 'Küba evinde açık futbolla rahat kazanır' },
      { id: 'm11', code: '111', homeTeam: 'G. Kıbrıs Rum', awayTeam: 'Letonya', league: 'AVUL', date: 'Bugün', time: '19:00', marketType: 'iy_ms', marketName: 'İY / MS', choice: 'X/1 (İY:X / MS:1)', odd: 3.89, reason: 'Açılış oranında X/1 oranı 3.89 ile çok değerli' },
      { id: 'm12', code: '112', homeTeam: 'Hırvatistan', awayTeam: 'İspanya', league: 'AVUL', date: 'Bugün', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: 'X/2 (İY:X / MS:2)', odd: 3.92, reason: 'İspanya 2. yarıda kalite farkıyla kazanır' },
      { id: 'm13', code: '113', homeTeam: 'Kolombiya', awayTeam: 'Peru', league: 'HAZ', date: 'Yarın', time: '02:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: 'X/1 (İY:X / MS:1)', odd: 3.51, reason: 'Kolombiya tarihsel veride %44 X/1 bitirmiş' },
      { id: 'm14', code: '114', homeTeam: 'Palmeiras', awayTeam: 'Bahia', league: 'BR1', date: 'Yarın', time: '03:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: 'X/1 (İY:X / MS:1)', odd: 4.21, reason: 'Brezilya ligi klasiği, 2. yarı ev sahibi çözer' },
      { id: 'm15', code: '115', homeTeam: 'Helsinki', awayTeam: 'Vaasa', league: 'FİN', date: 'Yarın', time: '18:00', marketType: 'iy_ms', marketName: 'İY / MS', choice: 'X/1 (İY:X / MS:1)', odd: 4.26, reason: 'Helsinki 2. yarı golleriyle galip gelir' },
      { id: 'm16', code: '116', homeTeam: 'Velez Sarsfield', awayTeam: 'Platense', league: 'ARJ', date: 'Yarın', time: '01:00', marketType: 'combo', marketName: 'Kombine', choice: 'MS 1 & 2.5 ALT', odd: 3.10, reason: '1-0 / 2-0 kontrollü galibiyet' },
      { id: 'm17', code: '117', homeTeam: 'Estudiantes LP', awayTeam: 'Gimnasia', league: 'ARJ', date: 'Yarın', time: '01:00', marketType: 'combo', marketName: 'Kombine', choice: 'MS 1 & 2.5 ALT', odd: 3.15, reason: 'Kalesini gole kapatan tek farklı ev sahibi' },
      { id: 'm18', code: '118', homeTeam: 'Depor Santani', awayTeam: 'Guairena', league: 'PAR2', date: 'Yarın', time: '01:30', marketType: 'draw', marketName: 'Beraberlik', choice: 'MS X (Beraberlik)', odd: 3.25, reason: 'Paraguay ligi kısır beraberlik trendi' }
    ];

    const sourcePool = poolOfMatches.length >= 10 ? poolOfMatches : fallbackSeeds;

    // --- KUPON 1: HİBRİT / KARMA VURGUN (10 Maç - Sistem 3, 4, 5) ---
    const coupon1Matches = [
      sourcePool.find(m => m.homeTeam.includes('İtalya')) || sourcePool[0],
      sourcePool.find(m => m.homeTeam.includes('Fransa')) || sourcePool[1],
      sourcePool.find(m => m.homeTeam.includes('Karadağ')) || sourcePool[2],
      sourcePool.find(m => m.homeTeam.includes('Lüksemburg')) || sourcePool[3],
      sourcePool.find(m => m.homeTeam.includes('Estonya')) || sourcePool[4],
      sourcePool.find(m => m.homeTeam.includes('Bogota')) || sourcePool[5],
      sourcePool.find(m => m.homeTeam.includes('Merlo')) || sourcePool[6],
      sourcePool.find(m => m.homeTeam.includes('Martinik')) || sourcePool[7],
      sourcePool.find(m => m.homeTeam.includes('Chapelton')) || sourcePool[8],
      sourcePool.find(m => m.homeTeam.includes('Küba')) || sourcePool[9],
    ];
    const c1Odds = coupon1Matches.map(m => m.odd);
    const c1Payouts = generatePayoutTable(c1Odds, [3, 4, 5], 1);

    const coupon1: SystemCoupon = {
      id: 'kupon-1',
      title: 'Hibrit / Karma Vurgun Kuponu',
      badge: 'EN ÇOK TERCİH EDİLEN',
      description: 'İY/MS, Kombine (MS+Gol), Beraberlik ve Sürprizlerden oluşan en dengeli yüksek kazanç modeli.',
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
      targetProfitBadge: '90.000 TL - 148.000 TL Hedef'
    };

    // --- KUPON 2: İY/MS & SÜRPRİZ DEĞER (10 Maç - Sistem 3, 4, 5) ---
    const coupon2Matches = [
      sourcePool.find(m => m.homeTeam.includes('Kıbrıs')) || sourcePool[10],
      sourcePool.find(m => m.homeTeam.includes('Estonya')) || sourcePool[4],
      sourcePool.find(m => m.homeTeam.includes('Hırvatistan')) || sourcePool[11],
      sourcePool.find(m => m.homeTeam.includes('Lüksemburg')) || sourcePool[3],
      sourcePool.find(m => m.homeTeam.includes('İtalya')) || sourcePool[0],
      sourcePool.find(m => m.homeTeam.includes('Karadağ')) || sourcePool[2],
      sourcePool.find(m => m.homeTeam.includes('Fransa')) || sourcePool[1],
      sourcePool.find(m => m.homeTeam.includes('Kolombiya')) || sourcePool[12],
      sourcePool.find(m => m.homeTeam.includes('Palmeiras')) || sourcePool[13],
      sourcePool.find(m => m.homeTeam.includes('Helsinki')) || sourcePool[14],
    ];
    const c2Odds = coupon2Matches.map(m => m.odd);
    const c2Payouts = generatePayoutTable(c2Odds, [3, 4, 5], 1);

    const coupon2: SystemCoupon = {
      id: 'kupon-2',
      title: 'İY/MS & Sürpriz Değer Kuponu',
      badge: 'YÜKSEK ÇARPAN',
      description: 'Sadece algoritmanın yüksek güvenilirlikli X/1, X/2 ve sürpriz açılış oranlarına dayalı İY/MS kuponu.',
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
      targetProfitBadge: '80.000 TL - 187.000 TL Hedef'
    };

    // --- KUPON 3: KOMBİNE & BERABERLİK KİLİDİ (10 Maç - Sistem 3, 4, 5) ---
    const coupon3Matches = [
      sourcePool.find(m => m.homeTeam.includes('Bogota')) || sourcePool[5],
      sourcePool.find(m => m.homeTeam.includes('Merlo')) || sourcePool[6],
      sourcePool.find(m => m.homeTeam.includes('Martinik')) || sourcePool[7],
      sourcePool.find(m => m.homeTeam.includes('Chapelton')) || sourcePool[8],
      sourcePool.find(m => m.homeTeam.includes('Küba')) || sourcePool[9],
      sourcePool.find(m => m.homeTeam.includes('Santani')) || sourcePool[17],
      sourcePool.find(m => m.homeTeam.includes('Velez')) || sourcePool[15],
      sourcePool.find(m => m.homeTeam.includes('Estudiantes')) || sourcePool[16],
      { id: 'm19', code: '119', homeTeam: 'Fransa', awayTeam: 'Belçika', league: 'AVUL', date: 'Bugün', time: '21:45', marketType: 'combo', marketName: 'Kombine', choice: 'MS 1 & KG VAR', odd: 3.60, reason: 'İki taraf da gol atar ama Fransa kazanır' },
      { id: 'm20', code: '120', homeTeam: 'İtalya', awayTeam: 'Türkiye', league: 'AVUL', date: 'Bugün', time: '21:45', marketType: 'combo', marketName: 'Kombine', choice: 'MS 1 & 2.5 ÜST', odd: 3.10, reason: 'Tempolu ev sahibi galibiyeti' }
    ];
    const c3Odds = coupon3Matches.map(m => m.odd);
    const c3Payouts = generatePayoutTable(c3Odds, [3, 4, 5], 1);

    const coupon3: SystemCoupon = {
      id: 'kupon-3',
      title: 'Kombine & Beraberlik Kilidi',
      badge: 'GOL & SKOR MODELİ',
      description: 'MS 1 & 2.5 Üst, KG Var ve Beraberlik kombinasyonlarına dayalı istikrarlı sistem.',
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
      targetProfitBadge: '35.000 TL - 75.000 TL Hedef'
    };

    // --- KUPON 4: 9 MAÇ ÇILGIN VURGUN (9 Maç - Sistem 3, 4, 5, 6) ---
    const coupon4Matches = [
      sourcePool.find(m => m.homeTeam.includes('Karadağ')) || sourcePool[2],
      sourcePool.find(m => m.homeTeam.includes('İtalya')) || sourcePool[0],
      sourcePool.find(m => m.homeTeam.includes('Fransa')) || sourcePool[1],
      sourcePool.find(m => m.homeTeam.includes('Lüksemburg')) || sourcePool[3],
      sourcePool.find(m => m.homeTeam.includes('Estonya')) || sourcePool[4],
      sourcePool.find(m => m.homeTeam.includes('Palmeiras')) || sourcePool[13],
      sourcePool.find(m => m.homeTeam.includes('Helsinki')) || sourcePool[14],
      sourcePool.find(m => m.homeTeam.includes('Bogota')) || sourcePool[5],
      sourcePool.find(m => m.homeTeam.includes('Merlo')) || sourcePool[6]
    ];
    const c4Odds = coupon4Matches.map(m => m.odd);
    const c4Payouts = generatePayoutTable(c4Odds, [3, 4, 5, 6], 1);

    const coupon4: SystemCoupon = {
      id: 'kupon-4',
      title: 'Büyük Vurgun / Çılgın Sistem',
      badge: '420 TL / 6 MAÇTA 75K',
      description: 'Daha düşük kupon maliyetiyle (420 TL), 6 maç tuttuğunda 75.000 TL+, 7 maçta 330k+ patlatan yüksek çarpanlı model.',
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
      targetProfitBadge: '75.000 TL - 330.000 TL Hedef'
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
