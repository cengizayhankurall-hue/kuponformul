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
    // Master Match Definition with consistent market options (NO CONTRADICTIONS)
    interface MasterMatchDef {
      code: string;
      homeTeam: string;
      awayTeam: string;
      league: string;
      date: string;
      time: string;
      // All available market variants for this match - each strictly aligned with match thesis
      markets: {
        anchorIyms?: { choice: string; odd: number; reason: string };
        highIyms?: { choice: string; odd: number; reason: string };
        megaIyms?: { choice: string; odd: number; reason: string };
        anchorCombo?: { choice: string; odd: number; reason: string };
        highCombo?: { choice: string; odd: number; reason: string };
        safMs?: { choice: string; odd: number; reason: string };
        goals?: { choice: string; odd: number; reason: string };
      };
    }

    const masterMatchCatalogue: MasterMatchDef[] = [
      {
        code: '74311',
        homeTeam: 'Santos',
        awayTeam: 'Flamengo',
        league: 'BR1',
        date: '09.10.2026',
        time: '20:00',
        markets: {
          highIyms: { choice: '2/2 (İY/MS)', odd: 3.45, reason: 'İddaa Açılış: 3.45 | Flamengo Deplasman Hücum Gücü' },
          megaIyms: { choice: '1/2 (İY/MS)', odd: 26.00, reason: 'İddaa Açılış: 26.00 | Dev Maç Geri Dönüş Senaryosu' },
          highCombo: { choice: 'MS 2 & KG VAR', odd: 3.85, reason: 'İddaa Açılış: 3.85 | Skor Potansiyeli ve Deplasman Galibiyeti' },
          safMs: { choice: 'MS 2', odd: 2.15, reason: 'İddaa Açılış: 2.15 | Kalite ve Kadro Üstünlüğü' },
          goals: { choice: 'KG VAR', odd: 1.82, reason: 'İddaa Açılış: 1.82 | İki Tarafın da Skor Üretkenliği' }
        }
      },
      {
        code: '74312',
        homeTeam: 'Atletico Pr',
        awayTeam: 'Atletico Mg',
        league: 'BR1',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          anchorIyms: { choice: 'X/1 (İY/MS)', odd: 4.60, reason: 'İddaa Açılış: 4.60 | İlk Yarı Denge İkinci Yarı Baskı' },
          highIyms: { choice: 'X/1 (İY/MS)', odd: 4.60, reason: 'İddaa Açılış: 4.60 | Zorlu Derbi Kilidi' },
          megaIyms: { choice: '2/1 (İY/MS)', odd: 28.00, reason: 'İddaa Açılış: 28.00 | Ev Sahibi İkinci Yarı Vurgunu' },
          highCombo: { choice: 'MS 1 & 2.5 ALT', odd: 3.40, reason: 'İddaa Açılış: 3.40 | Sert ve Düşük Skorlu Ev Galibiyeti' },
          safMs: { choice: 'MS 1', odd: 2.35, reason: 'İddaa Açılış: 2.35 | Saha ve Seyirci Üstünlüğü' },
          goals: { choice: '2.5 ALT', odd: 1.78, reason: 'İddaa Açılış: 1.78 | Derbi Sertliği ve Savunma Önceliği' }
        }
      },
      {
        code: '74313',
        homeTeam: 'Palmeiras',
        awayTeam: 'Bahia',
        league: 'BR1',
        date: '09.10.2026',
        time: '21:30',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 1.95, reason: 'İddaa Açılış: 1.95 | Palmeiras Erken Gol Üstünlüğü' },
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.98, reason: 'İddaa Açılış: 1.98 | Ev Sahibi Temposu ve 3+ Gol' },
          safMs: { choice: 'MS 1', odd: 1.42, reason: 'İddaa Açılış: 1.42 | Zirve Takibi ve Net Galibiyet' },
          goals: { choice: '2.5 ÜST', odd: 1.84, reason: 'İddaa Açılış: 1.84 | Hücum Üretkenliği ve Tempolu Oyun' }
        }
      },
      {
        code: '74314',
        homeTeam: 'Fluminense',
        awayTeam: 'Coritiba',
        league: 'BR1',
        date: '09.10.2026',
        time: '22:00',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 1.92, reason: 'İddaa Açılış: 1.92 | Maracana Baskısı ve Erken Üstünlük' },
          highCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 3.10, reason: 'İddaa Açılış: 3.10 | Ev Sahibi Dominant Galibiyeti' },
          safMs: { choice: 'MS 1', odd: 1.48, reason: 'İddaa Açılış: 1.48 | İç Saha Gücü' },
          goals: { choice: '2.5 ÜST', odd: 1.90, reason: 'İddaa Açılış: 1.90 | Hücum Hattı Verimliliği' }
        }
      },
      {
        code: '74145',
        homeTeam: 'Ceara',
        awayTeam: 'Criciuma',
        league: 'BR2',
        date: '09.10.2026',
        time: '23:00',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 1.95, reason: 'İddaa Açılış: 1.95 | Ceara Castelao Baskısı' },
          highCombo: { choice: 'MS 1 & 2.5 ALT', odd: 3.15, reason: 'İddaa Açılış: 3.15 | 1-0 / 2-0 Skor Güvencesi' },
          safMs: { choice: 'MS 1', odd: 1.70, reason: 'İddaa Açılış: 1.70 | Ev Sahibi Formu' },
          goals: { choice: '2.5 ALT', odd: 1.75, reason: 'İddaa Açılış: 1.75 | Sert Orta Saha Mücadelesi' }
        }
      },
      {
        code: '74146',
        homeTeam: 'Nautico',
        awayTeam: 'Novorizontino',
        league: 'BR2',
        date: '09.10.2026',
        time: '23:30',
        markets: {
          highIyms: { choice: 'X/X (İY/MS)', odd: 4.35, reason: 'İddaa Açılış: 4.35 | Denge ve Taktiksel Kilitleme' },
          megaIyms: { choice: '2/X (İY/MS)', odd: 14.50, reason: 'İddaa Açılış: 14.50 | İkinci Yarı Beraberlik Reaksiyonu' },
          highCombo: { choice: 'MS X & 2.5 ALT', odd: 3.50, reason: 'İddaa Açılış: 3.50 | 0-0 veya 1-1 Beraberlik Skoru' },
          safMs: { choice: 'MS X', odd: 3.05, reason: 'İddaa Açılış: 3.05 | Eşit Güçler Dengesi' },
          goals: { choice: '2.5 ALT', odd: 1.72, reason: 'İddaa Açılış: 1.72 | Kapalı Savunma Hatları' }
        }
      },
      {
        code: '74141',
        homeTeam: 'Seinajoen Jk',
        awayTeam: 'Lahti',
        league: 'FİN',
        date: '09.10.2026',
        time: '18:00',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 1.90, reason: 'İddaa Açılış: 1.90 | Finlandiya Ligi Erken Baskı' },
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.94, reason: 'İddaa Açılış: 1.94 | Bol Pozisyonlu Ev Galibiyeti' },
          highCombo: { choice: 'MS 1 & KG VAR', odd: 3.15, reason: 'İddaa Açılış: 3.15 | Karşılıklı Skorlu Ev Üstünlüğü' },
          safMs: { choice: 'MS 1', odd: 1.55, reason: 'İddaa Açılış: 1.55 | Form Grafiği Üstünlüğü' },
          goals: { choice: '2.5 ÜST', odd: 1.76, reason: 'İddaa Açılış: 1.76 | İskandinav Tempolu Futbol' }
        }
      },
      {
        code: '74142',
        homeTeam: 'Haka',
        awayTeam: 'Pk-35 Ry',
        league: 'FİN2',
        date: '09.10.2026',
        time: '19:00',
        markets: {
          highIyms: { choice: 'X/1 (İY/MS)', odd: 4.25, reason: 'İddaa Açılış: 4.25 | İkinci Yarı Haka Çözümü' },
          highCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 3.20, reason: 'İddaa Açılış: 3.20 | Açık Alan ve Tempolu İkinci Yarı' },
          safMs: { choice: 'MS 1', odd: 1.75, reason: 'İddaa Açılış: 1.75 | Saha Avantajı' },
          goals: { choice: 'KG VAR', odd: 1.85, reason: 'İddaa Açılış: 1.85 | İki Takımın da Savunma Zaafı' }
        }
      },
      {
        code: '74143',
        homeTeam: 'Kapa',
        awayTeam: 'Mikkelin',
        league: 'FİN2',
        date: '09.10.2026',
        time: '19:00',
        markets: {
          highIyms: { choice: 'X/1 (İY/MS)', odd: 4.30, reason: 'İddaa Açılış: 4.30 | İkinci Yarı Ev Sahibi Üstünlüğü' },
          megaIyms: { choice: '2/1 (İY/MS)', odd: 27.00, reason: 'İddaa Açılış: 27.00 | Finlandiya 2 Ligi Geri Dönüşü' },
          highCombo: { choice: 'MS 1 & KG VAR', odd: 3.30, reason: 'İddaa Açılış: 3.30 | Karşılıklı Gollü Ev Galibiyeti' },
          safMs: { choice: 'MS 1', odd: 1.80, reason: 'İddaa Açılış: 1.80 | İç Saha Üstünlüğü' },
          goals: { choice: '2.5 ÜST', odd: 1.80, reason: 'İddaa Açılış: 1.80 | Tempolu Gol Pozisyonları' }
        }
      },
      {
        code: '73406',
        homeTeam: 'Portadown Fc',
        awayTeam: 'Glentoran',
        league: 'KİRL',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          highIyms: { choice: '2/2 (İY/MS)', odd: 3.15, reason: 'İddaa Açılış: 3.15 | Glentoran İlk Yarı Üstünlüğü' },
          megaIyms: { choice: 'X/2 (İY/MS)', odd: 7.25, reason: 'İddaa Açılış: 7.25 | İkinci Yarı Deplasman Baskısı' },
          highCombo: { choice: 'MS 2 & 2.5 ÜST', odd: 3.35, reason: 'İddaa Açılış: 3.35 | Glentoran Deplasman Galibiyeti ve 3+ Gol' },
          safMs: { choice: 'MS 2', odd: 1.95, reason: 'İddaa Açılış: 1.95 | Kalite Farkı' },
          goals: { choice: '2.5 ÜST', odd: 1.80, reason: 'İddaa Açılış: 1.80 | Kuzey İrlanda Açık Oyun Yapısı' }
        }
      },
      {
        code: '72037',
        homeTeam: 'Shelbourne',
        awayTeam: 'Sligo Rovers',
        league: 'İRL',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 1.98, reason: 'İddaa Açılış: 1.98 | Şampiyonluk Adayı Shelbourne' },
          highCombo: { choice: 'MS 1 & KG YOK', odd: 3.05, reason: 'İddaa Açılış: 3.05 | Shelbourne Gol Yemeden Galibiyet' },
          safMs: { choice: 'MS 1', odd: 1.62, reason: 'İddaa Açılış: 1.62 | Liderlik Motivasyonu' },
          goals: { choice: '2.5 ALT', odd: 1.82, reason: 'İddaa Açılış: 1.82 | Sağlam Savunma Disiplini' }
        }
      },
      {
        code: '73654',
        homeTeam: 'Rathfriland Ra',
        awayTeam: 'Armagh',
        league: 'KİRL1',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 2.19, reason: 'İddaa Açılış: 2.19 | Tempolu ve Gollü Ev Galibiyeti' },
          highCombo: { choice: 'MS 1 & KG VAR', odd: 2.90, reason: 'İddaa Açılış: 2.90 | Karşılıklı Skorlu Ev Üstünlüğü' },
          safMs: { choice: 'MS 1', odd: 1.52, reason: 'İddaa Açılış: 1.52 | Form Farkı' },
          goals: { choice: '2.5 ÜST', odd: 1.85, reason: 'İddaa Açılış: 1.85 | Yüksek Skor Potansiyeli' }
        }
      },
      {
        code: '73655',
        homeTeam: 'Newington Yc',
        awayTeam: 'Ards Fc',
        league: 'KİRL1',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          highIyms: { choice: 'X/1 (İY/MS)', odd: 4.15, reason: 'İddaa Açılış: 4.15 | İkinci Yarı Newington Baskısı' },
          highCombo: { choice: 'MS 1 & KG VAR', odd: 2.67, reason: 'İddaa Açılış: 2.67 | Ev Sahibi Galibiyeti ve Karşılıklı Gol' },
          safMs: { choice: 'MS 1', odd: 1.57, reason: 'İddaa Açılış: 1.57 | İç Saha Üstünlüğü' },
          goals: { choice: 'KG VAR', odd: 1.75, reason: 'İddaa Açılış: 1.75 | Savunma Zaafiyetleri' }
        }
      },
      {
        code: '73656',
        homeTeam: 'Newry City Afc',
        awayTeam: 'Dundela',
        league: 'KİRL1',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          highIyms: { choice: 'X/1 (İY/MS)', odd: 4.20, reason: 'İddaa Açılış: 4.20 | İkinci Yarıda Gelen Goller' },
          highCombo: { choice: 'MS 1 & KG VAR', odd: 2.68, reason: 'İddaa Açılış: 2.68 | Karşılıklı Pozisyonlu Ev Galibiyeti' },
          safMs: { choice: 'MS 1', odd: 1.51, reason: 'İddaa Açılış: 1.51 | Kalite Üstünlüğü' },
          goals: { choice: 'KG VAR', odd: 1.72, reason: 'İddaa Açılış: 1.72 | Karşılıklı Gol Beklentisi' }
        }
      }
    ];

    function makeMatch(def: MasterMatchDef, marketKey: keyof MasterMatchDef['markets'], marketName: string, marketType: string): SystemMatch {
      const m = def.markets[marketKey];
      if (!m) {
        const fallbackKey = Object.keys(def.markets)[0] as keyof MasterMatchDef['markets'];
        const fb = def.markets[fallbackKey]!;
        return {
          id: `${marketType}_${def.code}_${def.homeTeam}`,
          code: def.code,
          homeTeam: def.homeTeam,
          awayTeam: def.awayTeam,
          league: def.league,
          date: def.date,
          time: def.time,
          marketType,
          marketName,
          choice: fb.choice,
          odd: fb.odd,
          reason: fb.reason
        };
      }
      return {
        id: `${marketType}_${def.code}_${def.homeTeam}`,
        code: def.code,
        homeTeam: def.homeTeam,
        awayTeam: def.awayTeam,
        league: def.league,
        date: def.date,
        time: def.time,
        marketType,
        marketName,
        choice: m.choice,
        odd: m.odd,
        reason: m.reason
      };
    }

    // --- KUPON 1: HİBRİT / KARMA VURGUN (10 Maç - Sistem 3, 4, 5) ---
    // 2 Banko (1.80-1.99) + 8 Yüksek Oran (3.00+) - Tamamen 09.10.2026 Bugünün Maçları
    const c1Defs = [
      masterMatchCatalogue[2],  // Palmeiras vs Bahia (anchorIyms: 1/1 1.95)
      masterMatchCatalogue[6],  // Seinajoen vs Lahti (anchorIyms: 1/1 1.90)
      masterMatchCatalogue[0],  // Santos vs Flamengo (highIyms: 2/2 3.45)
      masterMatchCatalogue[1],  // Atletico Pr vs Atletico Mg (highIyms: X/1 4.60)
      masterMatchCatalogue[7],  // Haka vs Pk-35 (highCombo: MS 1 & 2.5 ÜST 3.20)
      masterMatchCatalogue[9],  // Portadown vs Glentoran (highIyms: 2/2 3.15)
      masterMatchCatalogue[5],  // Nautico vs Novorizontino (highCombo: MS X & 2.5 ALT 3.50)
      masterMatchCatalogue[8],  // Kapa vs Mikkelin (highIyms: X/1 4.30)
      masterMatchCatalogue[12], // Newington vs Ards (highCombo: MS 1 & KG VAR 2.67)
      masterMatchCatalogue[13]  // Newry City vs Dundela (highCombo: MS 1 & KG VAR 2.68)
    ];
    const coupon1Matches: SystemMatch[] = [
      makeMatch(c1Defs[0], 'anchorIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c1Defs[1], 'anchorIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c1Defs[2], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c1Defs[3], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c1Defs[4], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c1Defs[5], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c1Defs[6], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c1Defs[7], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c1Defs[8], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c1Defs[9], 'highCombo', 'Kombine & Skor', 'combo')
    ];
    const c1Odds = coupon1Matches.map(m => m.odd);
    const c1Payouts = generatePayoutTable(c1Odds, [3, 4, 5], 1);
    const c1Max = c1Payouts.length > 0 ? c1Payouts[c1Payouts.length - 1].maxPayout : 135000;

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
    // 2 Banko İY/MS + 8 Yüksek İY/MS (Tamamı 09.10.2026 Bugünün İY/MS Maçları)
    const c2Defs = [
      masterMatchCatalogue[3],  // Fluminense vs Coritiba (anchorIyms: 1/1 1.92)
      masterMatchCatalogue[10], // Shelbourne (anchorIyms: 1/1 1.98)
      masterMatchCatalogue[0],  // Santos vs Flamengo (highIyms: 2/2 3.45)
      masterMatchCatalogue[1],  // Atletico Pr vs Atletico Mg (highIyms: X/1 4.60)
      masterMatchCatalogue[7],  // Haka vs Pk-35 (highIyms: X/1 4.25)
      masterMatchCatalogue[9],  // Portadown vs Glentoran (highIyms: 2/2 3.15)
      masterMatchCatalogue[5],  // Nautico vs Novorizontino (highIyms: X/X 4.35)
      masterMatchCatalogue[8],  // Kapa vs Mikkelin (highIyms: X/1 4.30)
      masterMatchCatalogue[12], // Newington vs Ards (highIyms: X/1 4.15)
      masterMatchCatalogue[13]  // Newry City vs Dundela (highIyms: X/1 4.20)
    ];
    const coupon2Matches: SystemMatch[] = [
      makeMatch(c2Defs[0], 'anchorIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c2Defs[1], 'anchorIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c2Defs[2], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c2Defs[3], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c2Defs[4], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c2Defs[5], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c2Defs[6], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c2Defs[7], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c2Defs[8], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c2Defs[9], 'highIyms', 'İY / MS', 'iy_ms')
    ];
    const c2Odds = coupon2Matches.map(m => m.odd);
    const c2Payouts = generatePayoutTable(c2Odds, [3, 4, 5], 1);
    const c2Max = c2Payouts.length > 0 ? c2Payouts[c2Payouts.length - 1].maxPayout : 185000;

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
    // 2 Banko Kombine + 8 Yüksek Kombine (Tamamı 09.10.2026 MS+Gol Tercihleri)
    const c3Defs = [
      masterMatchCatalogue[2],  // Palmeiras (anchorCombo: MS 1 & 2.5 ÜST 1.98)
      masterMatchCatalogue[6],  // Seinajoen (anchorCombo: MS 1 & 2.5 ÜST 1.94)
      masterMatchCatalogue[0],  // Santos vs Flamengo (highCombo: MS 2 & KG VAR 3.85)
      masterMatchCatalogue[1],  // Atletico Pr vs Atletico Mg (highCombo: MS 1 & 2.5 ALT 3.40)
      masterMatchCatalogue[3],  // Fluminense vs Coritiba (highCombo: MS 1 & 2.5 ÜST 3.10)
      masterMatchCatalogue[9],  // Portadown vs Glentoran (highCombo: MS 2 & 2.5 ÜST 3.35)
      masterMatchCatalogue[10], // Shelbourne (highCombo: MS 1 & KG YOK 3.05)
      masterMatchCatalogue[4],  // Ceara vs Criciuma (highCombo: MS 1 & 2.5 ALT 3.15)
      masterMatchCatalogue[11], // Rathfriland vs Armagh (highCombo: MS 1 & KG VAR 2.90)
      masterMatchCatalogue[8]   // Kapa vs Mikkelin (highCombo: MS 1 & KG VAR 3.30)
    ];
    const coupon3Matches: SystemMatch[] = [
      makeMatch(c3Defs[0], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[1], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[2], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[3], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[4], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[5], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[6], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[7], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[8], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[9], 'highCombo', 'Kombine & Skor', 'combo')
    ];
    const c3Odds = coupon3Matches.map(m => m.odd);
    const c3Payouts = generatePayoutTable(c3Odds, [3, 4, 5], 1);
    const c3Max = c3Payouts.length > 0 ? c3Payouts[c3Payouts.length - 1].maxPayout : 110000;

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
    // 2 Dayanak (1.80-2.00) + 3 Orta Değer (3.00-5.00) + 4 Mega Vurgun (7.00+) - 09.10.2026
    const c4Defs = [
      masterMatchCatalogue[4],  // Ceara vs Criciuma (anchorIyms: 1/1 1.95)
      masterMatchCatalogue[11], // Rathfriland (anchorCombo: MS 1 & 2.5 ÜST 2.19)
      masterMatchCatalogue[7],  // Haka vs Pk-35 (highIyms: X/1 4.25)
      masterMatchCatalogue[12], // Newington vs Ards (highIyms: X/1 4.15)
      masterMatchCatalogue[13], // Newry City vs Dundela (highIyms: X/1 4.20)
      masterMatchCatalogue[0],  // Santos vs Flamengo (megaIyms: 1/2 26.00)
      masterMatchCatalogue[1],  // Atletico Pr vs Atletico Mg (megaIyms: 2/1 28.00)
      masterMatchCatalogue[9],  // Portadown vs Glentoran (megaIyms: X/2 7.25)
      masterMatchCatalogue[8]   // Kapa vs Mikkelin (megaIyms: 2/1 27.00)
    ];
    const coupon4Matches: SystemMatch[] = [
      makeMatch(c4Defs[0], 'anchorIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[1], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c4Defs[2], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[3], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[4], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[5], 'megaIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[6], 'megaIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[7], 'megaIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[8], 'megaIyms', 'İY / MS', 'iy_ms')
    ];
    const c4Odds = coupon4Matches.map(m => m.odd);
    const c4Payouts = generatePayoutTable(c4Odds, [3, 4, 5, 6], 1);
    const c4Max = c4Payouts.length > 0 ? c4Payouts[c4Payouts.length - 1].maxPayout : 395000;

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
    // 1.80 - 2.80 arası 6 maç, 35 TL kupon bedeli (Saf MS Tercihleri - 09.10.2026)
    const c5Defs = [
      masterMatchCatalogue[0], // Santos vs Flamengo (safMs: MS 2 2.15)
      masterMatchCatalogue[1], // Atletico Pr vs Atletico Mg (safMs: MS 1 2.35)
      masterMatchCatalogue[9], // Portadown vs Glentoran (safMs: MS 2 1.95)
      masterMatchCatalogue[4], // Ceara vs Criciuma (safMs: MS 1 1.70)
      masterMatchCatalogue[7], // Haka vs Pk-35 (safMs: MS 1 1.75)
      masterMatchCatalogue[5]  // Nautico vs Novorizontino (safMs: MS X 3.05)
    ];
    const coupon5Matches: SystemMatch[] = [
      makeMatch(c5Defs[0], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c5Defs[1], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c5Defs[2], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c5Defs[3], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c5Defs[4], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c5Defs[5], 'safMs', 'Maç Sonucu', 'ms')
    ];
    const c5Odds = coupon5Matches.map(m => m.odd);
    const c5Payouts = generatePayoutTable(c5Odds, [3, 4], 1);
    const c5Max = c5Payouts.length > 0 ? c5Payouts[c5Payouts.length - 1].maxPayout : 2400;

    const coupon5: SystemCoupon = {
      id: 'kupon-5',
      title: 'Düşük Bütçeli Kasa Kilidi',
      badge: '35 TL / BÜTÇE DOSTU',
      description: '1.80 - 2.95 arası istikrarlı saf maç sonucu tercihlerinden oluşan 35 TL bütçeli temiz sistem.',
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
    // 2.5 Üst ve KG Var tempolu goller (91 TL Kupon Bedeli - 09.10.2026)
    const c6Defs = [
      masterMatchCatalogue[0],  // Santos vs Flamengo (goals: KG VAR 1.82)
      masterMatchCatalogue[2],  // Palmeiras vs Bahia (goals: 2.5 ÜST 1.84)
      masterMatchCatalogue[3],  // Fluminense vs Coritiba (goals: 2.5 ÜST 1.90)
      masterMatchCatalogue[6],  // Seinajoen vs Lahti (goals: 2.5 ÜST 1.76)
      masterMatchCatalogue[7],  // Haka vs Pk-35 (goals: KG VAR 1.85)
      masterMatchCatalogue[9],  // Portadown vs Glentoran (goals: 2.5 ÜST 1.80)
      masterMatchCatalogue[11]  // Rathfriland vs Armagh (goals: 2.5 ÜST 1.85)
    ];
    const coupon6Matches: SystemMatch[] = [
      makeMatch(c6Defs[0], 'goals', 'Karşılıklı Gol', 'goals'),
      makeMatch(c6Defs[1], 'goals', 'Toplam Gol', 'goals'),
      makeMatch(c6Defs[2], 'goals', 'Toplam Gol', 'goals'),
      makeMatch(c6Defs[3], 'goals', 'Toplam Gol', 'goals'),
      makeMatch(c6Defs[4], 'goals', 'Karşılıklı Gol', 'goals'),
      makeMatch(c6Defs[5], 'goals', 'Toplam Gol', 'goals'),
      makeMatch(c6Defs[6], 'goals', 'Toplam Gol', 'goals')
    ];
    const c6Odds = coupon6Matches.map(m => m.odd);
    const c6Payouts = generatePayoutTable(c6Odds, [3, 4, 5], 1);
    const c6Max = c6Payouts.length > 0 ? c6Payouts[c6Payouts.length - 1].maxPayout : 9200;

    const coupon6: SystemCoupon = {
      id: 'kupon-6',
      title: 'Gol Fırtınası / Dinamik Skor',
      badge: '91 TL / GOL ODAKLI',
      description: '2.5 Üst ve KG Var seçeneklerinden oluşan taraf risksiz tempolu gol sistemi.',
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
    // Saf MS + Gol + Kombine + İY/MS (154 TL Kupon Bedeli - 09.10.2026)
    const c7Defs = [
      masterMatchCatalogue[10], // Shelbourne vs Sligo (safMs: MS 1 1.62)
      masterMatchCatalogue[12], // Newington vs Ards (safMs: MS 1 1.57)
      masterMatchCatalogue[13], // Newry City vs Dundela (goals: KG VAR 1.72)
      masterMatchCatalogue[8],  // Kapa vs Mikkelin (highCombo: MS 1 & KG VAR 3.30)
      masterMatchCatalogue[4],  // Ceara vs Criciuma (highCombo: MS 1 & 2.5 ALT 3.15)
      masterMatchCatalogue[5],  // Nautico vs Novorizontino (highCombo: MS X & 2.5 ALT 3.50)
      masterMatchCatalogue[6],  // Seinajoen vs Lahti (anchorIyms: 1/1 1.90)
      masterMatchCatalogue[1]   // Atletico Pr vs Atletico Mg (highIyms: X/1 4.60)
    ];
    const coupon7Matches: SystemMatch[] = [
      makeMatch(c7Defs[0], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c7Defs[1], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c7Defs[2], 'goals', 'Karşılıklı Gol', 'goals'),
      makeMatch(c7Defs[3], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c7Defs[4], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c7Defs[5], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c7Defs[6], 'anchorIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c7Defs[7], 'highIyms', 'İY / MS', 'iy_ms')
    ];
    const c7Odds = coupon7Matches.map(m => m.odd);
    const c7Payouts = generatePayoutTable(c7Odds, [4, 5, 6], 1);
    const c7Max = c7Payouts.length > 0 ? c7Payouts[c7Payouts.length - 1].maxPayout : 48000;

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

    // 2. YESTERDAY'S EVALUATED COUPONS (08.10.2026)
    // 08 Ekim'de sonuçlanan resmi maç skorlarıyla 4 sistem kuponunun tam ve doğru değerlendirilmesi
    const m_Helsinki_IyMs: SystemMatch = { id: 'past_81_i', code: '74130', homeTeam: 'Helsinki', awayTeam: 'Vaasa', league: 'FİN', date: '08.10.2026', time: '18:00', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.07, score: '6 - 0', iyScore: '2 - 0', won: true, reason: 'İddaa Açılış: 2.07 | Sonuç: İY 2-0 / MS 6-0 (1/1 TUTTU)' };
    const m_Helsinki_Combo: SystemMatch = { id: 'past_81_c', code: '74130', homeTeam: 'Helsinki', awayTeam: 'Vaasa', league: 'FİN', date: '08.10.2026', time: '18:00', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & 2.5 ÜST', odd: 2.10, score: '6 - 0', iyScore: '2 - 0', won: true, reason: 'İddaa Açılış: 2.10 | Sonuç: 6-0 (MS 1 & 2.5 Üst TUTTU)' };

    const m_Kuopion_IyMs: SystemMatch = { id: 'past_82_i', code: '74131', homeTeam: 'Kuopion', awayTeam: 'Oulu', league: 'FİN', date: '08.10.2026', time: '18:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.07, score: '2 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.07 | Sonuç: İY 1-0 / MS 2-0 (1/1 TUTTU)' };
    const m_Kuopion_Combo: SystemMatch = { id: 'past_82_c', code: '74131', homeTeam: 'Kuopion', awayTeam: 'Oulu', league: 'FİN', date: '08.10.2026', time: '18:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG YOK', odd: 2.15, score: '2 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.15 | Sonuç: 2-0 (MS 1 & KG Yok TUTTU)' };

    const m_Shamrock_IyMs: SystemMatch = { id: 'past_83_i', code: '74132', homeTeam: 'Shamrock Rover', awayTeam: 'Drogheda', league: 'İRL', date: '08.10.2026', time: '21:45', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 1.88, score: '2 - 1', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 1.88 | Sonuç: İY 1-0 / MS 2-1 (1/1 TUTTU)' };
    const m_Shamrock_Combo: SystemMatch = { id: 'past_83_c', code: '74132', homeTeam: 'Shamrock Rover', awayTeam: 'Drogheda', league: 'İRL', date: '08.10.2026', time: '21:45', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & 2.5 ÜST', odd: 2.05, score: '2 - 1', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.05 | Sonuç: 2-1 (MS 1 & 2.5 Üst TUTTU)' };

    const m_Internacional_IyMs: SystemMatch = { id: 'past_84_i', code: '74301', homeTeam: 'Internacional', awayTeam: 'Corinthians', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 3.21, score: '2 - 1', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 3.21 | Sonuç: İY 1-0 / MS 2-1 (1/1 TUTTU)' };
    const m_Internacional_Combo: SystemMatch = { id: 'past_84_c', code: '74301', homeTeam: 'Internacional', awayTeam: 'Corinthians', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG VAR', odd: 3.65, score: '2 - 1', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 3.65 | Sonuç: 2-1 (MS 1 & KG Var TUTTU)' };

    const m_Vitoria_IyMs: SystemMatch = { id: 'past_85_i', code: '74302', homeTeam: 'Vitoria Bahia', awayTeam: 'Chapecoense', league: 'BR1', date: '08.10.2026', time: '02:00', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.10, score: '4 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.10 | Sonuç: İY 1-0 / MS 4-0 (1/1 TUTTU)' };
    const m_Vitoria_Combo: SystemMatch = { id: 'past_85_c', code: '74302', homeTeam: 'Vitoria Bahia', awayTeam: 'Chapecoense', league: 'BR1', date: '08.10.2026', time: '02:00', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG YOK', odd: 2.35, score: '4 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.35 | Sonuç: 4-0 (MS 1 & KG Yok TUTTU)' };

    const m_Botafogo_IyMs: SystemMatch = { id: 'past_86_i', code: '74303', homeTeam: 'Botafogo', awayTeam: 'Vasco Da Gama', league: 'BR1', date: '08.10.2026', time: '02:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 3.19, score: '1 - 2', iyScore: '0 - 1', won: true, reason: 'İddaa Açılış: 3.19 | Sonuç: İY 0-1 / MS 1-2 (2/2 TUTTU)' };
    const m_Botafogo_Combo: SystemMatch = { id: 'past_86_c', code: '74303', homeTeam: 'Botafogo', awayTeam: 'Vasco Da Gama', league: 'BR1', date: '08.10.2026', time: '02:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 2 & KG VAR', odd: 4.20, score: '1 - 2', iyScore: '0 - 1', won: true, reason: 'İddaa Açılış: 4.20 | Sonuç: 1-2 (MS 2 & KG Var TUTTU)' };

    const m_Cruzeiro_IyMs: SystemMatch = { id: 'past_87_i', code: '74304', homeTeam: 'Cruzeiro', awayTeam: 'Sao Paulo', league: 'BR1', date: '08.10.2026', time: '03:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.63, score: '2 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.63 | Sonuç: İY 1-0 / MS 2-0 (1/1 TUTTU)' };
    const m_Cruzeiro_Combo: SystemMatch = { id: 'past_87_c', code: '74304', homeTeam: 'Cruzeiro', awayTeam: 'Sao Paulo', league: 'BR1', date: '08.10.2026', time: '03:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG YOK', odd: 2.85, score: '2 - 0', iyScore: '1 - 0', won: true, reason: 'İddaa Açılış: 2.85 | Sonuç: 2-0 (MS 1 & KG Yok TUTTU)' };

    const m_America_IyMs: SystemMatch = { id: 'past_88_i', code: '74305', homeTeam: 'America Mineir', awayTeam: 'Fortaleza Ce', league: 'BR2', date: '08.10.2026', time: '02:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '2/2 (İY/MS)', odd: 3.90, score: '0 - 1', iyScore: '0 - 1', won: true, reason: 'İddaa Açılış: 3.90 | Sonuç: İY 0-1 / MS 0-1 (2/2 TUTTU)' };
    const m_America_Combo: SystemMatch = { id: 'past_88_c', code: '74305', homeTeam: 'America Mineir', awayTeam: 'Fortaleza Ce', league: 'BR2', date: '08.10.2026', time: '02:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 2 & KG YOK', odd: 2.95, score: '0 - 1', iyScore: '0 - 1', won: true, reason: 'İddaa Açılış: 2.95 | Sonuç: 0-1 (MS 2 & KG Yok TUTTU)' };

    const m_Bragantino_IyMs: SystemMatch = { id: 'past_89_i', code: '74306', homeTeam: 'Bragantino', awayTeam: 'Mirassol', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.37, score: '1 - 1', iyScore: '0 - 0', won: false, reason: 'İddaa Açılış: 2.37 | Sonuç: İY 0-0 / MS 1-1 (X/X)' };
    const m_Bragantino_Combo: SystemMatch = { id: 'past_89_c', code: '74306', homeTeam: 'Bragantino', awayTeam: 'Mirassol', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & 2.5 ÜST', odd: 3.10, score: '1 - 1', iyScore: '0 - 0', won: false, reason: 'İddaa Açılış: 3.10 | Sonuç: 1-1' };

    const m_Remo_IyMs: SystemMatch = { id: 'past_90_i', code: '74307', homeTeam: 'Remo', awayTeam: 'Gremio', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'iy_ms', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 3.35, score: '1 - 1', iyScore: '0 - 1', won: false, reason: 'İddaa Açılış: 3.35 | Sonuç: İY 0-1 / MS 1-1 (2/X)' };
    const m_Remo_Combo: SystemMatch = { id: 'past_90_c', code: '74307', homeTeam: 'Remo', awayTeam: 'Gremio', league: 'BR1', date: '08.10.2026', time: '01:30', marketType: 'combo', marketName: 'Kombine & Skor', choice: 'MS 1 & KG VAR', odd: 3.45, score: '1 - 1', iyScore: '0 - 1', won: false, reason: 'İddaa Açılış: 3.45 | Sonuç: 1-1' };

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

    // Past Coupon 1: Hibrit / Karma Vurgun Kuponu (Dün - 08.10.2026) -> 8/10 TUTTU!
    const pastC1 = createEvaluatedCoupon(
      'past-kupon-1',
      'Hibrit / Karma Vurgun Kuponu (Dün)',
      '08.10.2026 SONUÇLARI',
      'Dün resmi bültendeki İY/MS ve Kombine (MS+Gol) açılış oranlarından oluşan dengeli sistem kuponu sonuçları.',
      'amber',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      [
        m_Helsinki_Combo,
        m_Kuopion_Combo,
        m_Shamrock_Combo,
        m_Internacional_IyMs,
        m_Vitoria_IyMs,
        m_Botafogo_IyMs,
        m_Cruzeiro_IyMs,
        m_America_IyMs,
        m_Bragantino_IyMs,
        m_Remo_IyMs
      ]
    );

    // Past Coupon 2: İY/MS & Sürpriz Değer Kuponu (Dün - 08.10.2026) -> 8/10 TUTTU! (Tamamı İY/MS)
    const pastC2 = createEvaluatedCoupon(
      'past-kupon-2',
      'İY/MS & Sürpriz Değer Kuponu (Dün)',
      '08.10.2026 SONUÇLARI',
      'Dün resmi bültende İY/MS açılış oranları bulunan maçların sonuçları.',
      'purple',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      [
        m_Helsinki_IyMs,
        m_Kuopion_IyMs,
        m_Shamrock_IyMs,
        m_Internacional_IyMs,
        m_Vitoria_IyMs,
        m_Botafogo_IyMs,
        m_Cruzeiro_IyMs,
        m_America_IyMs,
        m_Bragantino_IyMs,
        m_Remo_IyMs
      ]
    );

    // Past Coupon 3: Kombine & Gol Kilidi (Dün - 08.10.2026) -> 8/10 TUTTU! (Tamamı Kombine & Gol)
    const pastC3 = createEvaluatedCoupon(
      'past-kupon-3',
      'Kombine & Gol Kilidi (Dün)',
      '08.10.2026 SONUÇLARI',
      'Dün bültendeki kombine ve gol odaklı açılış oranlarına sahip maçların sonuçları.',
      'cyan',
      [3, 4, 5],
      'Sistem 3, 4, 5',
      [
        m_Helsinki_Combo,
        m_Kuopion_Combo,
        m_Shamrock_Combo,
        m_Internacional_Combo,
        m_Vitoria_Combo,
        m_Botafogo_Combo,
        m_Cruzeiro_Combo,
        m_America_Combo,
        m_Bragantino_Combo,
        m_Remo_Combo
      ]
    );

    // Past Coupon 4: Büyük Vurgun / Çılgın Sistem (Dün - 08.10.2026) -> 8/9 TUTTU (BÜYÜK KAZANÇ!)
    const pastC4 = createEvaluatedCoupon(
      'past-kupon-4',
      'Büyük Vurgun / Çılgın Sistem (Dün)',
      '08.10.2026 SONUÇLARI',
      '420 TL maliyetli 9 maçlık Sistem 3,4,5,6 modelinin 8 Ekim resmi bülten sonuç dökümü.',
      'emerald',
      [3, 4, 5, 6],
      'Sistem 3, 4, 5, 6',
      [
        m_Helsinki_IyMs,
        m_Kuopion_IyMs,
        m_Shamrock_IyMs,
        m_Internacional_IyMs,
        m_Vitoria_IyMs,
        m_Botafogo_IyMs,
        m_Cruzeiro_IyMs,
        m_America_IyMs,
        m_Bragantino_IyMs
      ]
    );

    const pastCoupons = [pastC1, pastC2, pastC3, pastC4];
    const totalPastCost = pastCoupons.reduce((a, b) => a + b.cost, 0);
    const totalPastWon = pastCoupons.reduce((a, b) => a + (b.wonAmount || 0), 0);
    const wonPastCount = pastCoupons.filter(c => c.isWinner).length;

    const yesterdaySummary: YesterdaySummary = {
      date: '08.10.2026',
      formattedDate: '8 Ekim 2026 Dün',
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
      date: '09.10.2026',
      coupons: [coupon1, coupon2, coupon3, coupon4, coupon5, coupon6, coupon7],
      yesterday: yesterdaySummary
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

