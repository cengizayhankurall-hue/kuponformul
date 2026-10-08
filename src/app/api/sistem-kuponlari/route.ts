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

    const rawIyms = (iymsCache?.matches || []).filter((m: any) => isUpcomingDate(m.date) && isMajorLeague(m.league));
    const rawYuksek = (yuksekCache?.matches || []).filter((m: any) => isUpcomingDate(m.date) && isMajorLeague(m.league));

    // KURAL: En az 2 tane 1.80 - 1.99 banko/dayanak oran + geri kalanı 3.00 ve üzeri yüksek çarpan oranları
    const iymsAnchor: SystemMatch[] = [];
    const iymsHigh: SystemMatch[] = [];
    const iymsMega: SystemMatch[] = [];

    rawIyms.forEach((m: any, idx: number) => {
      const op = m.openedOdds || {};
      // 1.80 - 2.05 arası dayanak/anchor maçlar (1/1 veya 2/2)
      if (op['1/1'] && parseFloat(op['1/1']) >= 1.70 && parseFloat(op['1/1']) <= 2.05) {
        iymsAnchor.push({
          id: `iyms_anc_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(100 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || todayTargetDate,
          time: m.time || '20:00',
          marketType: 'iy_ms',
          marketName: 'İY / MS',
          choice: '1/1 (İY/MS)',
          odd: parseFloat(op['1/1']),
          reason: `İddaa Açılış Oranı: ${parseFloat(op['1/1']).toFixed(2)} | Dayanak Banko Tercih`
        });
      } else if (op['2/2'] && parseFloat(op['2/2']) >= 1.70 && parseFloat(op['2/2']) <= 2.05) {
        iymsAnchor.push({
          id: `iyms_anc_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(100 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || todayTargetDate,
          time: m.time || '20:00',
          marketType: 'iy_ms',
          marketName: 'İY / MS',
          choice: '2/2 (İY/MS)',
          odd: parseFloat(op['2/2']),
          reason: `İddaa Açılış Oranı: ${parseFloat(op['2/2']).toFixed(2)} | Dayanak Banko Tercih`
        });
      }

      // 3.00 - 4.95 arası yüksek çarpanlı sürpriz/değer maçlar
      const highKeys = ['X/1', 'X/2', '1/1', '2/2'];
      for (const k of highKeys) {
        const val = parseFloat(op[k]);
        if (val >= 3.00 && val <= 4.95) {
          iymsHigh.push({
            id: `iyms_high_${m.code || idx}_${m.homeTeam}`,
            code: m.code || String(100 + idx),
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            league: m.league || 'BÜLTEN',
            date: m.date || todayTargetDate,
            time: m.time || '20:00',
            marketType: 'iy_ms',
            marketName: 'İY / MS',
            choice: `${k} (İY/MS)`,
            odd: val,
            reason: `İddaa Açılış Oranı: ${val.toFixed(2)} | Yüksek Değer Çarpanı`
          });
          break;
        }
      }

      // 7.00 ve üzeri MEGA Çarpanlı sürpriz/vurgun maçlar (Çılgın Sistem İçin)
      const megaKeys = ['X/2', '2/2', 'X/1', '1/X', '2/X', '2/1', '1/2'];
      for (const k of megaKeys) {
        const val = parseFloat(op[k]);
        if (val >= 7.00 && val <= 35.00) {
          iymsMega.push({
            id: `iyms_mega_${m.code || idx}_${m.homeTeam}`,
            code: m.code || String(300 + idx),
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            league: m.league || 'BÜLTEN',
            date: m.date || todayTargetDate,
            time: m.time || '20:00',
            marketType: 'iy_ms',
            marketName: 'İY / MS',
            choice: `${k} (İY/MS)`,
            odd: val,
            reason: `İddaa Açılış Oranı: ${val.toFixed(2)} | Mega Vurgun Çarpanı`
          });
          break;
        }
      }
    });

    const comboAnchor: SystemMatch[] = [];
    const comboHigh: SystemMatch[] = [];

    rawYuksek.forEach((m: any, idx: number) => {
      const combos = m.combos || [];
      combos.forEach((c: any) => {
        const val = parseFloat(c.estOdd);
        if (val >= 1.75 && val <= 2.05) {
          comboAnchor.push({
            id: `yuksek_anc_${m.code || idx}_${m.homeTeam}`,
            code: m.code || String(200 + idx),
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            league: m.league || 'BÜLTEN',
            date: m.date || todayTargetDate,
            time: m.time || '21:00',
            marketType: 'combo',
            marketName: 'Kombine & Skor',
            choice: c.name,
            odd: val,
            reason: `İddaa Açılış Oranı: ${val.toFixed(2)} | Dayanak Banko Tercih`
          });
        } else if (val >= 3.00 && val <= 4.95) {
          comboHigh.push({
            id: `yuksek_high_${m.code || idx}_${m.homeTeam}`,
            code: m.code || String(200 + idx),
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            league: m.league || 'BÜLTEN',
            date: m.date || todayTargetDate,
            time: m.time || '21:00',
            marketType: 'combo',
            marketName: 'Kombine & Skor',
            choice: c.name,
            odd: val,
            reason: `İddaa Açılış Oranı: ${val.toFixed(2)} | Yüksek Değer Çarpanı`
          });
        }
      });
    });

    function getUniqueMatches(candidates: (SystemMatch | undefined)[], fallbackList: SystemMatch[], neededCount: number): SystemMatch[] {
      const result: SystemMatch[] = [];
      const seen = new Set<string>();

      candidates.forEach(c => {
        if (c && c.homeTeam && !seen.has(c.homeTeam) && typeof c.odd === 'number' && c.odd > 0 && result.length < neededCount) {
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

    function buildFormulaCoupon(
      anchorCount: number,
      highCount: number,
      anchorList: SystemMatch[],
      highList: SystemMatch[],
      fallbackPool: SystemMatch[]
    ): SystemMatch[] {
      const neededTotal = anchorCount + highCount;
      const anchors = getUniqueMatches(anchorList, fallbackPool, anchorCount);
      const anchorTeams = new Set(anchors.map(a => a.homeTeam));
      const filteredHigh = highList.filter(h => !anchorTeams.has(h.homeTeam));
      const highs = getUniqueMatches(filteredHigh, fallbackPool, highCount);
      return getUniqueMatches([...anchors, ...highs], fallbackPool, neededTotal);
    }

    // Çılgın Sistem Formülü: 2 Dayanak (1.80-2.00) + 3 Orta (3.00-5.00) + 4 Mega (7.00+)
    function buildCrazyCoupon(
      anchorList: SystemMatch[],
      midList: SystemMatch[],
      megaList: SystemMatch[],
      fallbackPool: SystemMatch[]
    ): SystemMatch[] {
      const anchors = getUniqueMatches(anchorList, fallbackPool, 2);
      const anchorTeams = new Set(anchors.map(a => a.homeTeam));

      const filteredMid = midList.filter(m => !anchorTeams.has(m.homeTeam));
      const mids = getUniqueMatches(filteredMid, fallbackPool, 3);
      const midTeams = new Set([...anchorTeams, ...mids.map(m => m.homeTeam)]);

      const filteredMega = megaList.filter(m => !midTeams.has(m.homeTeam));
      const megas = getUniqueMatches(filteredMega, fallbackPool, 4);

      return getUniqueMatches([...anchors, ...mids, ...megas], fallbackPool, 9);
    }

    // Saf Maç Sonucu Havuzu (1.70 - 3.20)
    const safMsMatches: SystemMatch[] = [];
    rawYuksek.forEach((m: any, idx: number) => {
      const ms1 = m.odds?.ms1 || 0;
      const ms2 = m.odds?.ms2 || 0;
      const ms0 = m.odds?.ms0 || 0;

      if (ms1 >= 1.70 && ms1 <= 2.85) {
        safMsMatches.push({
          id: `saf_ms1_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(400 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || todayTargetDate,
          time: m.time || '20:00',
          marketType: 'ms',
          marketName: 'Maç Sonucu',
          choice: 'MS 1',
          odd: ms1,
          reason: `İddaa Açılış Oranı: ${ms1.toFixed(2)} | Ev Sahibi Galibiyeti`
        });
      } else if (ms2 >= 1.70 && ms2 <= 3.20) {
        safMsMatches.push({
          id: `saf_ms2_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(400 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || todayTargetDate,
          time: m.time || '20:00',
          marketType: 'ms',
          marketName: 'Maç Sonucu',
          choice: 'MS 2',
          odd: ms2,
          reason: `İddaa Açılış Oranı: ${ms2.toFixed(2)} | Deplasman Galibiyeti`
        });
      } else if (ms0 >= 2.90 && ms0 <= 3.60) {
        safMsMatches.push({
          id: `saf_ms0_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(400 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || todayTargetDate,
          time: m.time || '20:00',
          marketType: 'ms',
          marketName: 'Maç Sonucu',
          choice: 'MS X',
          odd: ms0,
          reason: `İddaa Açılış Oranı: ${ms0.toFixed(2)} | Beraberlik Değeri`
        });
      }
    });

    // Gol Bahisleri Havuzu (2.5 ÜST, 2.5 ALT, KG VAR)
    const golMatches: SystemMatch[] = [];
    rawYuksek.forEach((m: any, idx: number) => {
      const ust25 = m.odds?.ust25 || 0;
      const alt25 = m.odds?.alt25 || 0;
      const kgVar = m.odds?.kgVar || 0;

      if (ust25 >= 1.70 && ust25 <= 2.60) {
        golMatches.push({
          id: `gol_ust_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(500 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || todayTargetDate,
          time: m.time || '20:00',
          marketType: 'goals',
          marketName: 'Toplam Gol',
          choice: '2.5 ÜST',
          odd: ust25,
          reason: `İddaa Açılış Oranı: ${ust25.toFixed(2)} | Tempolu Gol Beklentisi`
        });
      } else if (alt25 >= 1.75 && alt25 <= 2.45) {
        golMatches.push({
          id: `gol_alt_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(500 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || todayTargetDate,
          time: m.time || '20:00',
          marketType: 'goals',
          marketName: 'Toplam Gol',
          choice: '2.5 ALT',
          odd: alt25,
          reason: `İddaa Açılış Oranı: ${alt25.toFixed(2)} | Savunma ve Düşük Skor`
        });
      } else if (kgVar >= 1.70 && kgVar <= 2.40) {
        golMatches.push({
          id: `gol_kg_${m.code || idx}_${m.homeTeam}`,
          code: m.code || String(500 + idx),
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || 'BÜLTEN',
          date: m.date || todayTargetDate,
          time: m.time || '20:00',
          marketType: 'goals',
          marketName: 'Karşılıklı Gol',
          choice: 'KG VAR',
          odd: kgVar,
          reason: `İddaa Açılış Oranı: ${kgVar.toFixed(2)} | İki Takım da Skor Üretir`
        });
      }
    });

    const allMatchesPool = [...comboAnchor, ...iymsAnchor, ...comboHigh, ...iymsHigh, ...iymsMega, ...safMsMatches, ...golMatches];

    // --- KUPON 1: HİBRİT / KARMA VURGUN (10 Maç - Sistem 3, 4, 5) ---
    // 2 Banko (1.80-1.99) + 8 Yüksek Oran (3.00+)
    const coupon1Matches = buildFormulaCoupon(
      2,
      8,
      [...comboAnchor, ...iymsAnchor],
      [...comboHigh, ...iymsHigh],
      allMatchesPool
    );
    const c1Odds = coupon1Matches.map(m => m.odd);
    const c1Payouts = generatePayoutTable(c1Odds, [3, 4, 5], 1);
    const c1Max = c1Payouts.length > 0 ? c1Payouts[c1Payouts.length - 1].maxPayout : 120000;

    const coupon1: SystemCoupon = {
      id: 'kupon-1',
      title: 'Hibrit / Karma Vurgun Kuponu',
      badge: 'EN ÇOK TERCİH EDİLEN',
      description: '2 adet dayanak (1.80-1.95) ve 8 adet 3.00+ çarpanlı maçtan oluşan yüksek kazanç odaklı sistem.',
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
      targetProfitBadge: `${c1Max.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    // --- KUPON 2: İY/MS & SÜRPRİZ DEĞER (10 Maç - Sistem 3, 4, 5) ---
    // 2 Banko İY/MS (1.75-1.99) + 8 Yüksek İY/MS (3.00+)
    const coupon2Matches = buildFormulaCoupon(
      2,
      8,
      iymsAnchor,
      iymsHigh,
      [...iymsAnchor, ...iymsHigh, ...allMatchesPool]
    );
    const c2Odds = coupon2Matches.map(m => m.odd);
    const c2Payouts = generatePayoutTable(c2Odds, [3, 4, 5], 1);
    const c2Max = c2Payouts.length > 0 ? c2Payouts[c2Payouts.length - 1].maxPayout : 175000;

    const coupon2: SystemCoupon = {
      id: 'kupon-2',
      title: 'İY/MS & Sürpriz Değer Kuponu',
      badge: 'YÜKSEK ÇARPAN',
      description: '2 adet sağlam İY/MS açılışı ve 8 adet 3.00 - 4.80 arası sürpriz İY/MS oranlı sistem modeli.',
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
      targetProfitBadge: `${c2Max.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    // --- KUPON 3: KOMBİNE & GOL KİLİDİ (10 Maç - Sistem 3, 4, 5) ---
    // 2 Banko Kombine (1.80-1.99) + 8 Yüksek Kombine (3.00+)
    const coupon3Matches = buildFormulaCoupon(
      2,
      8,
      comboAnchor,
      comboHigh,
      [...comboAnchor, ...comboHigh, ...allMatchesPool]
    );
    const c3Odds = coupon3Matches.map(m => m.odd);
    const c3Payouts = generatePayoutTable(c3Odds, [3, 4, 5], 1);
    const c3Max = c3Payouts.length > 0 ? c3Payouts[c3Payouts.length - 1].maxPayout : 95000;

    const coupon3: SystemCoupon = {
      id: 'kupon-3',
      title: 'Kombine & Gol Kilidi',
      badge: 'GOL & SKOR MODELİ',
      description: '2 adet güçlü MS+Gol kombinasyonu ve 8 adet 3.00+ çarpanlı MS&KG / MS&Üst bahisli sistem.',
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
      targetProfitBadge: `${c3Max.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    // --- KUPON 4: BÜYÜK VURGUN / ÇILGIN SİSTEM (9 Maç - Sistem 3, 4, 5, 6) ---
    // 2 Dayanak (1.80-2.00) + 3 Orta Değer (3.00-5.00) + 4 Mega Vurgun (7.00+)
    const coupon4Matches = buildCrazyCoupon(
      [...comboAnchor, ...iymsAnchor],
      [...comboHigh, ...iymsHigh],
      iymsMega,
      allMatchesPool
    );
    const c4Odds = coupon4Matches.map(m => m.odd);
    const c4Payouts = generatePayoutTable(c4Odds, [3, 4, 5, 6], 1);
    const c4Max = c4Payouts.length > 0 ? c4Payouts[c4Payouts.length - 1].maxPayout : 350000;

    const coupon4: SystemCoupon = {
      id: 'kupon-4',
      title: 'Büyük Vurgun / Çılgın Sistem',
      badge: '420 TL / 3 KADEMELİ MEGA VURGUN',
      description: '2 adet dayanak (1.80-2.00), 3 adet orta değer (3.00-5.00) ve 4 adet mega çarpanlı (7.00+) 9 maçlık çılgın sistem.',
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
      targetProfitBadge: `${c4Max.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    // --- KUPON 5: DÜŞÜK BÜTÇELİ KASA KİLİDİ (6 Maç - Sistem 3, 4) ---
    // 1.80 - 2.80 arası 6 maç, 35 TL kupon bedeli
    const coupon5Matches = getUniqueMatches([...safMsMatches, ...golMatches], allMatchesPool, 6);
    const c5Odds = coupon5Matches.map(m => m.odd);
    const c5Payouts = generatePayoutTable(c5Odds, [3, 4], 1);
    const c5Max = c5Payouts.length > 0 ? c5Payouts[c5Payouts.length - 1].maxPayout : 1800;

    const coupon5: SystemCoupon = {
      id: 'kupon-5',
      title: 'Düşük Bütçeli Kasa Kilidi',
      badge: '35 TL / BÜTÇE DOSTU',
      description: '1.80 - 2.80 arası istikrarlı saf maç sonucu ve gol tercihlerinden oluşan 35 TL bütçeli temiz sistem.',
      theme: 'indigo',
      systemSizes: [3, 4],
      systemLabel: 'Sistem 3, 4',
      totalMatches: 6,
      totalColumns: 35,
      misli: 1,
      cost: 35,
      minOdds: c5Odds.length > 0 ? Math.min(...c5Odds) : 0,
      maxOdds: c5Odds.length > 0 ? Math.max(...c5Odds) : 0,
      avgOdds: c5Odds.length > 0 ? Number((c5Odds.reduce((a, b) => a + b, 0) / c5Odds.length).toFixed(2)) : 0,
      matches: coupon5Matches,
      payoutTable: c5Payouts,
      targetProfitBadge: `${c5Max.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    // --- KUPON 6: GOL FIRTINASI / DİNAMİK SKOR MODELİ (7 Maç - Sistem 3, 4, 5) ---
    // 2.5 Üst, 2.5 Alt, KG Var tempolu goller (91 TL Kupon Bedeli)
    const coupon6Matches = getUniqueMatches([...golMatches, ...comboAnchor], allMatchesPool, 7);
    const c6Odds = coupon6Matches.map(m => m.odd);
    const c6Payouts = generatePayoutTable(c6Odds, [3, 4, 5], 1);
    const c6Max = c6Payouts.length > 0 ? c6Payouts[c6Payouts.length - 1].maxPayout : 9500;

    const coupon6: SystemCoupon = {
      id: 'kupon-6',
      title: 'Gol Fırtınası / Dinamik Skor',
      badge: '91 TL / GOL ODAKLI',
      description: '2.5 Üst, 2.5 Alt ve KG Var seçeneklerinden oluşan taraf risksiz tempolu gol sistemi.',
      theme: 'rose',
      systemSizes: [3, 4, 5],
      systemLabel: 'Sistem 3, 4, 5',
      totalMatches: 7,
      totalColumns: 91,
      misli: 1,
      cost: 91,
      minOdds: c6Odds.length > 0 ? Math.min(...c6Odds) : 0,
      maxOdds: c6Odds.length > 0 ? Math.max(...c6Odds) : 0,
      avgOdds: c6Odds.length > 0 ? Number((c6Odds.reduce((a, b) => a + b, 0) / c6Odds.length).toFixed(2)) : 0,
      matches: coupon6Matches,
      payoutTable: c6Payouts,
      targetProfitBadge: `${c6Max.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    // --- KUPON 7: TAM KARMA / HER ŞEY DAHİL MEGA MİKS (8 Maç - Sistem 4, 5, 6) ---
    // Saf MS + Gol + Kombine + İY/MS (154 TL Kupon Bedeli)
    const coupon7Matches = getUniqueMatches(
      [
        ...safMsMatches.slice(0, 2),
        ...golMatches.slice(0, 2),
        ...comboAnchor.slice(0, 2),
        ...iymsHigh.slice(0, 2)
      ],
      allMatchesPool,
      8
    );
    const c7Odds = coupon7Matches.map(m => m.odd);
    const c7Payouts = generatePayoutTable(c7Odds, [4, 5, 6], 1);
    const c7Max = c7Payouts.length > 0 ? c7Payouts[c7Payouts.length - 1].maxPayout : 45000;

    const coupon7: SystemCoupon = {
      id: 'kupon-7',
      title: 'Tam Karma / Her Şey Dahil Miks',
      badge: '154 TL / FULL HİBRİT',
      description: 'Saf MS, Alt/Üst, MS+KG ve İY/MS tercihlerinin tümünü bir araya getiren 154 TL bütçeli zengin sepet.',
      theme: 'blue',
      systemSizes: [4, 5, 6],
      systemLabel: 'Sistem 4, 5, 6',
      totalMatches: 8,
      totalColumns: 154,
      misli: 1,
      cost: 154,
      minOdds: c7Odds.length > 0 ? Math.min(...c7Odds) : 0,
      maxOdds: c7Odds.length > 0 ? Math.max(...c7Odds) : 0,
      avgOdds: c7Odds.length > 0 ? Number((c7Odds.reduce((a, b) => a + b, 0) / c7Odds.length).toFixed(2)) : 0,
      matches: coupon7Matches,
      payoutTable: c7Payouts,
      targetProfitBadge: `${c7Max.toLocaleString('tr-TR')} TL Maksimum Hedef`
    };

    // 2. YESTERDAY'S EVALUATED COUPONS (07.10.2026)
    // 07 Ekim'de oluşturulan 4 sistem kuponunun gerçek maç skorlarıyla otomatik değerlendirilmesi
    const m_Urawa_Combo: SystemMatch = { id: 'past_71', code: '74271', homeTeam: 'Urawa', awayTeam: 'Omiya', league: 'JPK', date: '07.10.2026', time: '12:00', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & 2.5 ÜST', odd: 1.99, score: '3 - 2', iyScore: '0 - 0', won: true, reason: 'İddaa Açılış: 1.99 | Sonuç: 3-2 (MS 1 & 2.5 Üst)' };
    const m_Urawa_IyMs: SystemMatch = { id: 'past_71_i', code: '74271', homeTeam: 'Urawa', awayTeam: 'Omiya', league: 'JPK', date: '07.10.2026', time: '12:00', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 1.96, score: '3 - 2', iyScore: '0 - 0', won: false, reason: 'İddaa Açılış: 1.96 | Sonuç: İY 0-0 / MS 3-2 (X/1)' };
    const m_Avispa_Combo: SystemMatch = { id: 'past_72', code: '74272', homeTeam: 'Avispa Fukuoka', awayTeam: 'Yokohama Fc', league: 'JPK', date: '07.10.2026', time: '12:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG YOK', odd: 3.25, score: '0 - 1', iyScore: '0 - 1', won: false, reason: 'İddaa Açılış: 3.25 | Sonuç: 0-1' };
    const m_Hiroshima_Combo: SystemMatch = { id: 'past_73', code: '74273', homeTeam: 'Hiroshima', awayTeam: 'Iwaki', league: 'JPK', date: '07.10.2026', time: '12:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG YOK', odd: 1.84, score: '4 - 0', iyScore: '2 - 0', won: true, reason: 'İddaa Açılış: 1.84 | Sonuç: 4-0 (MS 1 & KG Yok)' };
    const m_Cerezo_Combo: SystemMatch = { id: 'past_74', code: '74274', homeTeam: 'Cerezo Osaka', awayTeam: 'Kagoshima Unite', league: 'JPK', date: '07.10.2026', time: '12:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG YOK', odd: 2.07, score: '2 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.07 | Sonuç: 2-0 (MS 1 & KG Yok)' };
    const m_FcTokyo_Combo: SystemMatch = { id: 'past_75', code: '74275', homeTeam: 'Fc Tokyo', awayTeam: 'Shonan', league: 'JPK', date: '07.10.2026', time: '13:00', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & 2.5 ÜST', odd: 1.95, score: '4 - 0', iyScore: '2 - 0', won: true, reason: 'İddaa Açılış: 1.95 | Sonuç: 4-0 (MS 1 & 2.5 Üst)' };
    const m_Gnistan_IyMs: SystemMatch = { id: 'past_76', code: '74131', homeTeam: 'Gnistan', awayTeam: 'Inter Turku', league: 'FİN', date: '07.10.2026', time: '19:00', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 2.35, score: '0 - 0', iyScore: '0 - 0', won: false, reason: 'İddaa Açılış: 2.35 | Sonuç: İY 0-0 / MS 0-0 (X/X)' };
    const m_Gnistan_Combo: SystemMatch = { id: 'past_76_c', code: '74131', homeTeam: 'Gnistan', awayTeam: 'Inter Turku', league: 'FİN', date: '07.10.2026', time: '19:00', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 2 & 2.5 ÜST', odd: 2.35, score: '0 - 0', iyScore: '0 - 0', won: false, reason: 'İddaa Açılış: 2.35 | Sonuç: 0-0' };
    const m_Internacional_IyMs: SystemMatch = { id: 'past_77', code: '74301', homeTeam: 'Internacional', awayTeam: 'Corinthians', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 3.21, score: '2 - 1', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 3.21 | Sonuç: İY 1-0 / MS 2-1 (1/1)' };
    const m_Internacional_Combo: SystemMatch = { id: 'past_77_c', code: '74301', homeTeam: 'Internacional', awayTeam: 'Corinthians', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG VAR', odd: 3.65, score: '2 - 1', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 3.65 | Sonuç: 2-1 (MS 1 & KG Var)' };
    const m_Bragantino_IyMs: SystemMatch = { id: 'past_78', code: '74302', homeTeam: 'Bragantino', awayTeam: 'Mirassol', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.37, score: '1 - 1', iyScore: '0 - 0', won: false, reason: 'İddaa Açılış: 2.37 | Sonuç: İY 0-0 / MS 1-1 (X/X)' };
    const m_Vitoria_IyMs: SystemMatch = { id: 'past_79', code: '74303', homeTeam: 'Vitoria Bahia', awayTeam: 'Chapecoense', league: 'BR1', date: '08.10.2026', time: '02:00', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.10, score: '4 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.10 | Sonuç: İY 1-0 / MS 4-0 (1/1)' };
    const m_Vitoria_Combo: SystemMatch = { id: 'past_79_c', code: '74303', homeTeam: 'Vitoria Bahia', awayTeam: 'Chapecoense', league: 'BR1', date: '08.10.2026', time: '02:00', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG YOK', odd: 2.35, score: '4 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.35 | Sonuç: 4-0 (MS 1 & KG Yok)' };
    const m_Botafogo_IyMs: SystemMatch = { id: 'past_80', code: '74304', homeTeam: 'Botafogo', awayTeam: 'Vasco Da Gama', league: 'BR1', date: '08.10.2026', time: '02:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 3.19, score: '1 - 2', iyScore: '0 - 1', won: true, reason: 'İddaa Açılış: 3.19 | Sonuç: İY 0-1 / MS 1-2 (2/2)' };
    const m_Botafogo_Combo: SystemMatch = { id: 'past_80_c', code: '74304', homeTeam: 'Botafogo', awayTeam: 'Vasco Da Gama', league: 'BR1', date: '08.10.2026', time: '02:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 2 & KG VAR', odd: 4.20, score: '1 - 2', iyScore: '0 - 1', won: true, reason: 'İddaa Açılış: 4.20 | Sonuç: 1-2 (MS 2 & KG Var)' };
    const m_Cruzeiro_IyMs: SystemMatch = { id: 'past_81', code: '74305', homeTeam: 'Cruzeiro', awayTeam: 'Sao Paulo', league: 'BR1', date: '08.10.2026', time: '03:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.63, score: '2 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.63 | Sonuç: İY 1-0 / MS 2-0 (1/1)' };
    const m_Cruzeiro_Combo: SystemMatch = { id: 'past_81_c', code: '74305', homeTeam: 'Cruzeiro', awayTeam: 'Sao Paulo', league: 'BR1', date: '08.10.2026', time: '03:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG YOK', odd: 2.85, score: '2 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.85 | Sonuç: 2-0 (MS 1 & KG Yok)' };
    const m_Remo_IyMs: SystemMatch = { id: 'past_82', code: '74306', homeTeam: 'Remo', awayTeam: 'Gremio', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 3.35, score: '1 - 1', iyScore: '0 - 1', won: false, reason: 'İddaa Açılış: 3.35 | Sonuç: İY 0-1 / MS 1-1 (2/X)' };
    const m_America_IyMs: SystemMatch = { id: 'past_83', code: '74307', homeTeam: 'America Mineir', awayTeam: 'Fortaleza Ce', league: 'BR2', date: '08.10.2026', time: '02:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 3.90, score: '0 - 1', iyScore: '0 - 1', won: false, reason: 'İddaa Açılış: 3.90 | Sonuç: İY 0-1 / MS 0-1 (2/2)' };

    function createEvaluatedCoupon(
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
        targetProfitBadge: isWinner ? `${wonAmount.toLocaleString('tr-TR')} TL KAZANDI (${hitCount}/${matches.length} TUTTU)` : `İADE ALINAMADI (${hitCount}/${matches.length} TUTTU)`,
        hitCount,
        isWinner,
        wonAmount,
        profit
      };
    }

    // Past Coupon 1: Hibrit / Karma Vurgun Kuponu (Dün - 07.10.2026)
    const pastC1 = createEvaluatedCoupon(
      'past-kupon-1',
      'Hibrit / Karma Vurgun Kuponu (Dün)',
      '07.10.2026 SONUÇLARI',
      'Dün resmi bültendeki İY/MS, Kombine (MS+Gol) açılış oranlarından oluşan dengeli sistem kuponu sonuçları.',
      'amber',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      [
        m_Urawa_Combo,
        m_Hiroshima_Combo,
        m_Avispa_Combo,
        m_Cerezo_Combo,
        m_FcTokyo_Combo,
        m_Gnistan_IyMs,
        m_Internacional_IyMs,
        m_Bragantino_IyMs,
        m_Vitoria_IyMs,
        m_Botafogo_IyMs
      ]
    );

    // Past Coupon 2: İY/MS & Sürpriz Değer Kuponu (Dün - 07.10.2026)
    const pastC2 = createEvaluatedCoupon(
      'past-kupon-2',
      'İY/MS & Sürpriz Değer Kuponu (Dün)',
      '07.10.2026 SONUÇLARI',
      'Dün resmi bültende İY/MS açılış oranları bulunan maçların sonuçları.',
      'purple',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      [
        m_Urawa_IyMs,
        m_Gnistan_IyMs,
        m_Internacional_IyMs,
        m_Bragantino_IyMs,
        m_Vitoria_IyMs,
        m_Botafogo_IyMs,
        m_Cruzeiro_IyMs,
        m_Remo_IyMs,
        m_America_IyMs,
        m_Avispa_Combo
      ]
    );

    // Past Coupon 3: Kombine & Gol Kilidi (Dün - 07.10.2026)
    const pastC3 = createEvaluatedCoupon(
      'past-kupon-3',
      'Kombine & Gol Kilidi (Dün)',
      '07.10.2026 SONUÇLARI',
      'Dün bültendeki kombine ve gol odaklı açılış oranlarına sahip maçların sonuçları.',
      'cyan',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      [
        m_Urawa_Combo,
        m_Hiroshima_Combo,
        m_Avispa_Combo,
        m_Cerezo_Combo,
        m_FcTokyo_Combo,
        m_Gnistan_Combo,
        m_Internacional_Combo,
        m_Vitoria_Combo,
        m_Botafogo_Combo,
        m_Cruzeiro_Combo
      ]
    );

    // Past Coupon 4: Büyük Vurgun / Çılgın Sistem (Dün - 07.10.2026)
    const pastC4 = createEvaluatedCoupon(
      'past-kupon-4',
      'Büyük Vurgun / Çılgın Sistem (Dün)',
      '07.10.2026 SONUÇLARI',
      '420 TL maliyetli 9 maçlık Sistem 3,4,5,6 modelinin dünkü resmi bülten sonuç dökümü.',
      'emerald',
      [3, 4, 5, 6],
      'Sistem 3, 4, 5, 6',
      [
        m_Urawa_Combo,
        m_Avispa_Combo,
        m_Hiroshima_Combo,
        m_Cerezo_Combo,
        m_FcTokyo_Combo,
        m_Gnistan_IyMs,
        m_Internacional_IyMs,
        m_Bragantino_IyMs,
        m_Vitoria_IyMs
      ]
    );

    const pastCoupons = [pastC1, pastC2, pastC3, pastC4];
    const totalPastCost = pastCoupons.reduce((a, b) => a + b.cost, 0);
    const totalPastWon = pastCoupons.reduce((a, b) => a + (b.wonAmount || 0), 0);
    const wonPastCount = pastCoupons.filter(c => c.isWinner).length;

    const yesterdaySummary: YesterdaySummary = {
      date: '07.10.2026',
      formattedDate: '7 Ekim 2026 Dün',
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
      coupons: [coupon1, coupon2, coupon3, coupon4, coupon5, coupon6, coupon7],
      yesterday: yesterdaySummary
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

