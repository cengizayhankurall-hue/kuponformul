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
      // 1. Bundesliga / Eredivisie / Ligue 1 / Liga Portugal / LaLiga2 (Majörler)
      {
        code: '71101',
        homeTeam: 'B.Dortmund',
        awayTeam: 'Werder Bremen',
        league: 'AL1',
        date: '09.10.2026',
        time: '21:30',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 1.51, reason: 'İddaa Açılış: 1.51 | Signal Iduna Park Erken Baskı' },
          safMs: { choice: 'MS 1', odd: 1.16, reason: 'İddaa Açılış: 1.16 | Net Kadro ve Saha Üstünlüğü' },
          goals: { choice: '2.5 ÜST', odd: 1.24, reason: 'İddaa Açılış: 1.24 | Bundesliga Temposu ve Bol Gol' }
        }
      },
      {
        code: '71102',
        homeTeam: 'PSV Eindhoven',
        awayTeam: 'Heerenveen',
        league: 'HOL',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.45, reason: 'İddaa Açılış: 1.45 | PSV İç Saha Hücum Gücü' },
          safMs: { choice: 'MS 1', odd: 1.14, reason: 'İddaa Açılış: 1.14 | Liderlik Hedefi ve Net Galibiyet' },
          goals: { choice: '2.5 ÜST', odd: 1.20, reason: 'İddaa Açılış: 1.20 | Hollanda Eredivisie Yüksek Skor' }
        }
      },
      {
        code: '71103',
        homeTeam: 'Lens',
        awayTeam: 'Lyon',
        league: 'FR1',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          anchorCombo: { choice: 'KG VAR & 2.5 ÜST', odd: 1.85, reason: 'İddaa Açılış: 1.85 | Fransa Ligue 1 Tempolu Kapışma' },
          highIyms: { choice: 'X/1 (İY/MS)', odd: 4.60, reason: 'İddaa Açılış: 4.60 | İkinci Yarı Bollaert-Delelis Baskısı' },
          goals: { choice: 'KG VAR', odd: 1.62, reason: 'İddaa Açılış: 1.62 | İki Tarafın Karşılıklı Skor Üretkenliği' },
          safMs: { choice: 'MS 1', odd: 2.11, reason: 'İddaa Açılış: 2.11 | Saha ve Seyirci Avantajı' }
        }
      },
      {
        code: '71104',
        homeTeam: 'Braga',
        awayTeam: 'Sporting CP',
        league: 'POR',
        date: '09.10.2026',
        time: '22:15',
        markets: {
          highIyms: { choice: 'X/2 (İY/MS)', odd: 4.75, reason: 'İddaa Açılış: 4.75 | Portekiz Dev Maç İkinci Yarı Kilidi' },
          highCombo: { choice: 'MS 2 & KG VAR', odd: 3.65, reason: 'İddaa Açılış: 3.65 | Sporting Galibiyeti ve Karşılıklı Skor' },
          goals: { choice: '2.5 ÜST', odd: 1.78, reason: 'İddaa Açılış: 1.78 | Tempolu Zirve Mücadelesi' },
          safMs: { choice: 'MS 2', odd: 2.07, reason: 'İddaa Açılış: 2.07 | Lider Formu' }
        }
      },
      {
        code: '71105',
        homeTeam: 'Heidenheim',
        awayTeam: 'Kaiserslautern',
        league: 'AL2',
        date: '09.10.2026',
        time: '19:30',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 2.50, reason: 'İddaa Açılış: 2.50 | Bundesliga 2 Erken Üstünlük' },
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 2.35, reason: 'İddaa Açılış: 2.35 | Ev Sahibi Temposu ve 3+ Gol' },
          safMs: { choice: 'MS 1', odd: 1.76, reason: 'İddaa Açılış: 1.76 | İç Saha Gücü' }
        }
      },
      {
        code: '71106',
        homeTeam: 'Montpellier',
        awayTeam: 'Grenoble',
        league: 'FR2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 2.15, reason: 'İddaa Açılış: 2.15 | Kalite Farkı ve Erken Gol' },
          safMs: { choice: 'MS 1', odd: 1.44, reason: 'İddaa Açılış: 1.44 | Stade de la Mosson Avantajı' },
          anchorCombo: { choice: 'MS 1 & 2.5 ALT', odd: 2.80, reason: 'İddaa Açılış: 2.80 | Kontrollü 2-0 Galibiyeti' }
        }
      },
      {
        code: '71107',
        homeTeam: 'Breda',
        awayTeam: 'Maastricht',
        league: 'HOL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 1.47, reason: 'İddaa Açılış: 1.47 | Breda Net Erken Hakimiyet' },
          safMs: { choice: 'MS 1', odd: 1.14, reason: 'İddaa Açılış: 1.14 | Farklı Sınıf Farkı' },
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.48, reason: 'İddaa Açılış: 1.48 | Farklı Galibiyet ve Çok Gol' }
        }
      },
      {
        code: '71108',
        homeTeam: 'Shelbourne',
        awayTeam: 'Sligo Rovers',
        league: 'İRL',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 1.51, reason: 'İddaa Açılış: 1.51 | Şampiyonluk Adayı Erken Gol' },
          safMs: { choice: 'MS 1', odd: 1.16, reason: 'İddaa Açılış: 1.16 | İrlanda Premier Ligi Zirve Takibi' },
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.70, reason: 'İddaa Açılış: 1.70 | Rahat Galibiyet' }
        }
      },
      {
        code: '71109',
        homeTeam: 'Avellino',
        awayTeam: 'Sampdoria',
        league: 'İTB',
        date: '09.10.2026',
        time: '21:30',
        markets: {
          goals: { choice: 'KG VAR', odd: 1.83, reason: 'İddaa Açılış: 1.83 | İtalya Serie B Çift Taraflı Skor' },
          highIyms: { choice: 'X/1 (İY/MS)', odd: 4.80, reason: 'İddaa Açılış: 4.80 | İkinci Yarı Ev Sahibi Çözümü' }
        }
      },
      {
        code: '71110',
        homeTeam: 'Sepsi',
        awayTeam: 'Dinamo Bükreş',
        league: 'ROM',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          safMs: { choice: 'MS 2', odd: 1.45, reason: 'İddaa Açılış: 1.45 | Dinamo Bükreş Deplasman Üstünlüğü' },
          highIyms: { choice: '2/2 (İY/MS)', odd: 2.25, reason: 'İddaa Açılış: 2.25 | İlk Yarıdan Skor Üstünlüğü' }
        }
      },

      // 2. İY/MS Baremleri Resmi Olarak AÇIK Majör / Avrupa Ligleri
      {
        code: '71111',
        homeTeam: 'Nancy',
        awayTeam: 'Guingamp',
        league: 'FR2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          highIyms: { choice: '1/1 (İY/MS)', odd: 2.75, reason: 'İddaa Açılış: 2.75 | Nancy Marcel Picot Baskısı' },
          safMs: { choice: 'MS 1', odd: 1.79, reason: 'İddaa Açılış: 1.79 | İç Saha Form Grafiği' }
        }
      },
      {
        code: '71112',
        homeTeam: 'Sochaux',
        awayTeam: 'Boulogne',
        league: 'FR2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          highIyms: { choice: 'X/1 (İY/MS)', odd: 4.80, reason: 'İddaa Açılış: 4.80 | Taktiksel İlk Yarı ve İkinci Yarı Golü' },
          safMs: { choice: 'MS 1', odd: 2.04, reason: 'İddaa Açılış: 2.04 | Ev Sahibi Saha Üstünlüğü' }
        }
      },
      {
        code: '71113',
        homeTeam: 'Pau FC',
        awayTeam: 'Stade Lavallois',
        league: 'FR2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          highIyms: { choice: '1/1 (İY/MS)', odd: 2.85, reason: 'İddaa Açılış: 2.85 | Pau FC Erken Üstünlük Hedefi' },
          safMs: { choice: 'MS 1', odd: 1.83, reason: 'İddaa Açılış: 1.83 | İstikrarlı İç Saha Performansı' }
        }
      },
      {
        code: '71114',
        homeTeam: 'Dunkerque',
        awayTeam: 'Annecy',
        league: 'FR2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          highIyms: { choice: 'X/1 (İY/MS)', odd: 4.60, reason: 'İddaa Açılış: 4.60 | Dengeyi Bozan İkinci Yarı Hamlesi' },
          safMs: { choice: 'MS 1', odd: 1.99, reason: 'İddaa Açılış: 1.99 | Ev Sahibi Galibiyet İhtiyacı' }
        }
      },
      {
        code: '71115',
        homeTeam: 'Almere City',
        awayTeam: 'Fc Eindhoven',
        league: 'HOL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 1.65, reason: 'İddaa Açılış: 1.65 | Yanmar Stadion Erken Golü' },
          safMs: { choice: 'MS 1', odd: 1.22, reason: 'İddaa Açılış: 1.22 | Zirve Mücadelesi' },
          goals: { choice: '2.5 ÜST', odd: 1.35, reason: 'İddaa Açılış: 1.35 | Yüksek Skor Beklentisi' }
        }
      },
      {
        code: '71116',
        homeTeam: 'Braunschweig',
        awayTeam: 'Holstein Kiel',
        league: 'AL2',
        date: '09.10.2026',
        time: '19:30',
        markets: {
          highIyms: { choice: '2/2 (İY/MS)', odd: 3.20, reason: 'İddaa Açılış: 3.20 | Holstein Kiel Deplasman Hücum Formu' },
          goals: { choice: '2.5 ÜST', odd: 1.52, reason: 'İddaa Açılış: 1.52 | Bundesliga 2 Tempolu Goller' }
        }
      },
      {
        code: '71117',
        homeTeam: 'Amstetten',
        awayTeam: 'Blau-Weiss Linz',
        league: 'AU2',
        date: '09.10.2026',
        time: '19:30',
        markets: {
          highIyms: { choice: '2/2 (İY/MS)', odd: 2.95, reason: 'İddaa Açılış: 2.95 | Avusturya Ligi Deplasman Baskısı' }
        }
      },
      {
        code: '71118',
        homeTeam: 'Kapfenberg',
        awayTeam: 'Avusturya Wien II',
        league: 'AU2',
        date: '09.10.2026',
        time: '19:30',
        markets: {
          highIyms: { choice: 'X/2 (İY/MS)', odd: 4.90, reason: 'İddaa Açılış: 4.90 | İkinci Yarıda Gelen Wien Galibiyeti' }
        }
      },
      {
        code: '71119',
        homeTeam: 'Dender',
        awayTeam: 'Club Brugge II',
        league: 'BEL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          anchorIyms: { choice: '1/1 (İY/MS)', odd: 1.75, reason: 'İddaa Açılış: 1.75 | Belçika Ligi Net Ev Sahibi Üstünlüğü' },
          safMs: { choice: 'MS 1', odd: 1.28, reason: 'İddaa Açılış: 1.28 | Form Farkı' }
        }
      },
      {
        code: '71120',
        homeTeam: 'Stade Nyonnais',
        awayTeam: 'Aarau',
        league: 'İSV2',
        date: '09.10.2026',
        time: '21:15',
        markets: {
          highIyms: { choice: '2/2 (İY/MS)', odd: 1.85, reason: 'İddaa Açılış: 1.85 | İsviçre Ligi Aarau Kalite Farkı' },
          safMs: { choice: 'MS 2', odd: 1.31, reason: 'İddaa Açılış: 1.31 | Zirve Takibi' }
        }
      },

      // 3. Kombine & Gol Odaklı Ligler (Hollanda 2, İrlanda, Galler)
      {
        code: '71121',
        homeTeam: 'De Graafschap',
        awayTeam: 'Utrecht (II)',
        league: 'HOL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.70, reason: 'İddaa Açılış: 1.70 | De Vijverberg Hücum Fırtınası' },
          safMs: { choice: 'MS 1', odd: 1.44, reason: 'İddaa Açılış: 1.44 | Kalite Üstünlüğü' },
          goals: { choice: '2.5 ÜST', odd: 1.17, reason: 'İddaa Açılış: 1.17 | Bol Pozisyon ve Yüksek Skor' }
        }
      },
      {
        code: '71122',
        homeTeam: 'Heracles',
        awayTeam: 'Waalwijk',
        league: 'HOL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.62, reason: 'İddaa Açılış: 1.62 | Heracles İç Saha Üretkenliği' },
          safMs: { choice: 'MS 1', odd: 1.31, reason: 'İddaa Açılış: 1.31 | Net Ev Galibiyeti' }
        }
      },
      {
        code: '71123',
        homeTeam: 'Volendam',
        awayTeam: 'Vitesse',
        league: 'HOL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          highCombo: { choice: 'MS 1 & KG VAR', odd: 3.30, reason: 'İddaa Açılış: 3.30 | Gollü Ev Sahibi Galibiyeti' },
          goals: { choice: '2.5 ÜST', odd: 1.23, reason: 'İddaa Açılış: 1.23 | Tempolu Açık Futbol' }
        }
      },
      {
        code: '71124',
        homeTeam: 'Roda',
        awayTeam: 'PSV (B)',
        league: 'HOL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.85, reason: 'İddaa Açılış: 1.85 | Parkstad Limburg Galibiyeti ve 3+ Gol' },
          safMs: { choice: 'MS 1', odd: 1.51, reason: 'İddaa Açılış: 1.51 | Liderlik Mücadelesi' }
        }
      },
      {
        code: '71125',
        homeTeam: 'RSC Anderlecht II',
        awayTeam: 'Eupen',
        league: 'BEL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          highCombo: { choice: 'MS 2 & 2.5 ÜST', odd: 2.15, reason: 'İddaa Açılış: 2.15 | Eupen Deplasman Temposu' },
          safMs: { choice: 'MS 2', odd: 1.67, reason: 'İddaa Açılış: 1.67 | Tecrübe Farkı' }
        }
      },
      {
        code: '71126',
        homeTeam: 'Bohemian',
        awayTeam: 'Waterford',
        league: 'İRK',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.85, reason: 'İddaa Açılış: 1.85 | Dalymount Park Baskısı ve 3+ Gol' },
          safMs: { choice: 'MS 1', odd: 1.37, reason: 'İddaa Açılış: 1.37 | Kupa Motivasyonu' },
          goals: { choice: '2.5 ÜST', odd: 1.50, reason: 'İddaa Açılış: 1.50 | Bol Pozisyonlu Oyun' }
        }
      },
      {
        code: '71127',
        homeTeam: 'Bray Wanderers',
        awayTeam: 'Wexford Youths',
        league: 'İR1',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.80, reason: 'İddaa Açılış: 1.80 | Carlisle Grounds Gollü Ev Galibiyeti' },
          safMs: { choice: 'MS 1', odd: 1.38, reason: 'İddaa Açılış: 1.38 | Playoff Hedefi' }
        }
      },
      {
        code: '71128',
        homeTeam: 'Athlone',
        awayTeam: 'Treaty Unt.',
        league: 'İR1',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.68, reason: 'İddaa Açılış: 1.68 | Athlone Hücum Gücü ve 3+ Gol' },
          safMs: { choice: 'MS 1', odd: 1.26, reason: 'İddaa Açılış: 1.26 | Net İç Saha Favorisi' }
        }
      },
      {
        code: '71129',
        homeTeam: 'Cardiff MU',
        awayTeam: 'Trefelin',
        league: 'GAL',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.55, reason: 'İddaa Açılış: 1.55 | Galler Premier Sınıf Farkı' },
          safMs: { choice: 'MS 1', odd: 1.21, reason: 'İddaa Açılış: 1.21 | Farklı Kadro Kalitesi' }
        }
      },
      {
        code: '71130',
        homeTeam: 'Cambrian',
        awayTeam: 'Ammanford',
        league: 'GAL',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          anchorCombo: { choice: 'MS 1 & 2.5 ÜST', odd: 1.58, reason: 'İddaa Açılış: 1.58 | Gollü İç Saha Hakimiyeti' },
          safMs: { choice: 'MS 1', odd: 1.22, reason: 'İddaa Açılış: 1.22 | Zirve Takibi' }
        }
      },

      // 4. Çılgın Sistem / Mega Vurgun Maçları
      {
        code: '71131',
        homeTeam: 'Malaga',
        awayTeam: 'Espanyol',
        league: 'İS1',
        date: '09.10.2026',
        time: '22:00',
        markets: {
          megaIyms: { choice: 'X/2 (İY/MS)', odd: 5.20, reason: 'İddaa Açılış: 5.20 | La Rosaleda İkinci Yarı Espanyol Çözümü' },
          safMs: { choice: 'MS 2', odd: 2.34, reason: 'İddaa Açılış: 2.34 | Kalite Üstünlüğü' }
        }
      },
      {
        code: '71132',
        homeTeam: 'Dordrecht',
        awayTeam: 'Emmen',
        league: 'HOL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          megaIyms: { choice: 'X/2 (İY/MS)', odd: 4.75, reason: 'İddaa Açılış: 4.75 | Emmen İkinci Yarı Deplasman Vurgunu' },
          safMs: { choice: 'MS 2', odd: 1.92, reason: 'İddaa Açılış: 1.92 | Form Grafiği' }
        }
      },
      {
        code: '71133',
        homeTeam: 'Ajax (B)',
        awayTeam: 'VVV Venlo',
        league: 'HOL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          highIyms: { choice: '2/2 (İY/MS)', odd: 2.85, reason: 'İddaa Açılış: 2.85 | Venlo Deplasman Gol Vurgunu' },
          safMs: { choice: 'MS 2', odd: 1.87, reason: 'İddaa Açılış: 1.87 | Tecrübe Üstünlüğü' }
        }
      },
      {
        code: '71134',
        homeTeam: 'Etoile Carouge',
        awayTeam: 'Yverdon',
        league: 'İSV2',
        date: '09.10.2026',
        time: '21:15',
        markets: {
          megaIyms: { choice: 'X/2 (İY/MS)', odd: 4.40, reason: 'İddaa Açılış: 4.40 | İkinci Yarı Yverdon Baskısı' },
          safMs: { choice: 'MS 2', odd: 1.80, reason: 'İddaa Açılış: 1.80 | Lig Formu' }
        }
      },
      {
        code: '71135',
        homeTeam: 'Rakow Czestochowa',
        awayTeam: 'GKS Katowice',
        league: 'POL',
        date: '09.10.2026',
        time: '21:30',
        markets: {
          highIyms: { choice: '1/1 (İY/MS)', odd: 2.65, reason: 'İddaa Açılış: 2.65 | Polonya Ekstraklasa Erken Üstünlük' },
          safMs: { choice: 'MS 1', odd: 1.79, reason: 'İddaa Açılış: 1.79 | Kalite Farkı' }
        }
      },
      {
        code: '71136',
        homeTeam: 'Belçika (K)',
        awayTeam: 'Polonya (K)',
        league: 'KDK',
        date: '09.10.2026',
        time: '21:15',
        markets: {
          highIyms: { choice: '1/1 (İY/MS)', odd: 2.45, reason: 'İddaa Açılış: 2.45 | Uluslararası Turnuva Erken Golü' },
          safMs: { choice: 'MS 1', odd: 1.69, reason: 'İddaa Açılış: 1.69 | Kadro Üstünlüğü' }
        }
      },
      {
        code: '71137',
        homeTeam: 'First Vienna',
        awayTeam: 'St Polten',
        league: 'AU2',
        date: '09.10.2026',
        time: '21:30',
        markets: {
          highIyms: { choice: '1/1 (İY/MS)', odd: 2.80, reason: 'İddaa Açılış: 2.80 | Hohe Warte Baskısı' },
          safMs: { choice: 'MS 1', odd: 1.86, reason: 'İddaa Açılış: 1.86 | İç Saha Hakimiyeti' }
        }
      },
      {
        code: '71138',
        homeTeam: 'P. Bielsko',
        awayTeam: 'Pogon Siedlce',
        league: 'POL1',
        date: '09.10.2026',
        time: '21:30',
        markets: {
          highIyms: { choice: '1/1 (İY/MS)', odd: 2.50, reason: 'İddaa Açılış: 2.50 | Polonya 1. Ligi Erken Üstünlük' },
          safMs: { choice: 'MS 1', odd: 1.66, reason: 'İddaa Açılış: 1.66 | Saha Avantajı' }
        }
      },
      {
        code: '71139',
        homeTeam: 'Waasland Beveren',
        awayTeam: 'Lommel',
        league: 'BEL',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          highIyms: { choice: '1/1 (İY/MS)', odd: 2.45, reason: 'İddaa Açılış: 2.45 | Freethiel Stadyumu Erken Gol' },
          safMs: { choice: 'MS 1', odd: 1.66, reason: 'İddaa Açılış: 1.66 | İç Saha Formu' }
        }
      },

      // 5. Kasa Kilidi / Güvenilir Majörler
      {
        code: '71140',
        homeTeam: 'Union Brescia',
        awayTeam: 'Pro Vercelli',
        league: 'İTC',
        date: '09.10.2026',
        time: '21:30',
        markets: {
          safMs: { choice: 'MS 1', odd: 1.21, reason: 'İddaa Açılış: 1.21 | İtalya Serie C Zirve Lideri' }
        }
      },
      {
        code: '71141',
        homeTeam: 'MC Alger',
        awayTeam: 'Temouchent',
        league: 'CZYR',
        date: '09.10.2026',
        time: '22:00',
        markets: {
          safMs: { choice: 'MS 1', odd: 1.06, reason: 'İddaa Açılış: 1.06 | Net Sınıf Farkı ve Güvence' }
        }
      },

      // 6. Gol Fırtınası / Tempolu Ligler
      {
        code: '71142',
        homeTeam: 'Jong AZ Alkmaar',
        awayTeam: 'Den Bosch',
        league: 'HOL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          goals: { choice: '2.5 ÜST', odd: 1.45, reason: 'İddaa Açılış: 1.45 | Hollanda Ligi Yüksek Skor Garantisi' }
        }
      },
      {
        code: '71143',
        homeTeam: 'Oss',
        awayTeam: 'Helmond Sport',
        league: 'HOL2',
        date: '09.10.2026',
        time: '21:00',
        markets: {
          goals: { choice: '2.5 ÜST', odd: 1.55, reason: 'İddaa Açılış: 1.55 | Karşılıklı Pozisyonlar ve Tempolu Goller' }
        }
      },
      {
        code: '71144',
        homeTeam: 'UCD',
        awayTeam: 'Longford',
        league: 'İR1',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          goals: { choice: '2.5 ÜST', odd: 1.48, reason: 'İddaa Açılış: 1.48 | İrlanda 1. Ligi Açık Futbol' }
        }
      },

      // 7. Karma / Zengin Ligler
      {
        code: '71145',
        homeTeam: 'Penybont',
        awayTeam: 'Barry Town',
        league: 'GAL',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          safMs: { choice: 'MS 1', odd: 1.60, reason: 'İddaa Açılış: 1.60 | SDM Glass Stadyumu Avantajı' }
        }
      },
      {
        code: '71146',
        homeTeam: 'Bala Town',
        awayTeam: 'Buckley Town',
        league: 'GALFAW',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          safMs: { choice: 'MS 1', odd: 1.33, reason: 'İddaa Açılış: 1.33 | Kadro Kalite Farkı' }
        }
      },
      {
        code: '71147',
        homeTeam: 'Llandudno',
        awayTeam: 'Airbus UK',
        league: 'GAL',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          highCombo: { choice: 'MS 1 & KG VAR', odd: 3.20, reason: 'İddaa Açılış: 3.20 | Karşılıklı Skorlu Ev Galibiyeti' }
        }
      },
      {
        code: '71148',
        homeTeam: 'Vejle',
        awayTeam: 'Hvidovre',
        league: 'DAN1',
        date: '09.10.2026',
        time: '19:00',
        markets: {
          safMs: { choice: 'MS 1', odd: 1.49, reason: 'İddaa Açılış: 1.49 | Danimarka 1. Ligi Zirve Adayı' }
        }
      },
      {
        code: '71149',
        homeTeam: 'Sutton United',
        awayTeam: 'Boreham Wood',
        league: 'İBSL',
        date: '09.10.2026',
        time: '21:45',
        markets: {
          safMs: { choice: 'MS 2', odd: 1.52, reason: 'İddaa Açılış: 1.52 | İngiltere Ulusal Ligi Deplasman Formu' }
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
    // 2 Banko + 8 Yüksek Oranlı Majör Avrupa Maçları (Tamamı 09.10.2026)
    const c1Defs = [
      masterMatchCatalogue[0], // B.Dortmund vs Werder Bremen (1/1 1.51)
      masterMatchCatalogue[1], // PSV Eindhoven vs Heerenveen (MS 1 & 2.5 ÜST 1.45)
      masterMatchCatalogue[2], // Lens vs Lyon (KG VAR & 2.5 ÜST 1.85)
      masterMatchCatalogue[3], // Braga vs Sporting CP (MS 2 & KG VAR 3.65)
      masterMatchCatalogue[4], // Heidenheim vs Kaiserslautern (MS 1 & 2.5 ÜST 2.35)
      masterMatchCatalogue[5], // Montpellier vs Grenoble (MS 1 1.44)
      masterMatchCatalogue[6], // Breda vs Maastricht (1/1 1.47)
      masterMatchCatalogue[7], // Shelbourne vs Sligo (MS 1 1.16)
      masterMatchCatalogue[8], // Avellino vs Sampdoria (KG VAR 1.83)
      masterMatchCatalogue[9]  // Sepsi vs Dinamo Bükreş (MS 2 1.45)
    ];
    const coupon1Matches: SystemMatch[] = [
      makeMatch(c1Defs[0], 'anchorIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c1Defs[1], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c1Defs[2], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c1Defs[3], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c1Defs[4], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c1Defs[5], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c1Defs[6], 'anchorIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c1Defs[7], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c1Defs[8], 'goals', 'Karşılıklı Gol', 'goals'),
      makeMatch(c1Defs[9], 'safMs', 'Maç Sonucu', 'ms')
    ];
    const c1Odds = coupon1Matches.map(m => m.odd);
    const c1Payouts = generatePayoutTable(c1Odds, [3, 4, 5], 1);
    const c1Max = c1Payouts.length > 0 ? c1Payouts[c1Payouts.length - 1].maxPayout : 135000;

    const coupon1: SystemCoupon = {
      id: 'kupon-1',
      title: 'Hibrit / Karma Vurgun Kuponu',
      badge: 'EN ÇOK TERCİH EDİLEN',
      description: 'Dortmund, PSV, Lens, Braga ve Montpellier gibi majör lig maçlarından oluşan dengeli hibrit sistem.',
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
    // Tamamı İY/MS baremleri İddaa'da resmi olarak AÇIK maçlar (09.10.2026)
    const c2Defs = [
      masterMatchCatalogue[14], // Almere City vs Fc Eindhoven (1/1 1.65)
      masterMatchCatalogue[18], // Dender vs Club Brugge II (1/1 1.75)
      masterMatchCatalogue[10], // Nancy vs Guingamp (1/1 2.75)
      masterMatchCatalogue[11], // Sochaux vs Boulogne (X/1 4.80)
      masterMatchCatalogue[12], // Pau FC vs Laval (1/1 2.85)
      masterMatchCatalogue[13], // Dunkerque vs Annecy (X/1 4.60)
      masterMatchCatalogue[15], // Braunschweig vs Kiel (2/2 3.20)
      masterMatchCatalogue[16], // Amstetten vs Linz (2/2 2.95)
      masterMatchCatalogue[17], // Kapfenberg vs Wien II (X/2 4.90)
      masterMatchCatalogue[19]  // Stade Nyonnais vs Aarau (2/2 1.85)
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
      description: 'Fransa 2, Almanya 2, Hollanda 2 ve Avusturya gibi İY/MS oranları açık majör liglerden 10 maçlık sistem.',
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
    // Hollanda, İrlanda ve Galler liglerinden MS + 2.5 ÜST / KG Kombinasyonları (09.10.2026)
    const c3Defs = [
      masterMatchCatalogue[20], // De Graafschap vs Utrecht II (MS 1 & 2.5 ÜST 1.70)
      masterMatchCatalogue[21], // Heracles vs Waalwijk (MS 1 & 2.5 ÜST 1.62)
      masterMatchCatalogue[22], // Volendam vs Vitesse (MS 1 & KG VAR 3.30)
      masterMatchCatalogue[23], // Roda vs PSV B (MS 1 & 2.5 ÜST 1.85)
      masterMatchCatalogue[24], // RSC Anderlecht II vs Eupen (MS 2 & 2.5 ÜST 2.15)
      masterMatchCatalogue[25], // Bohemian vs Waterford (MS 1 & 2.5 ÜST 1.85)
      masterMatchCatalogue[26], // Bray Wanderers vs Wexford (MS 1 & 2.5 ÜST 1.80)
      masterMatchCatalogue[27], // Athlone vs Treaty (MS 1 & 2.5 ÜST 1.68)
      masterMatchCatalogue[28], // Cardiff MU vs Trefelin (MS 1 & 2.5 ÜST 1.55)
      masterMatchCatalogue[29]  // Cambrian vs Ammanford (MS 1 & 2.5 ÜST 1.58)
    ];
    const coupon3Matches: SystemMatch[] = [
      makeMatch(c3Defs[0], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[1], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[2], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[3], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[4], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[5], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[6], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[7], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[8], 'anchorCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c3Defs[9], 'anchorCombo', 'Kombine & Skor', 'combo')
    ];
    const c3Odds = coupon3Matches.map(m => m.odd);
    const c3Payouts = generatePayoutTable(c3Odds, [3, 4, 5], 1);
    const c3Max = c3Payouts.length > 0 ? c3Payouts[c3Payouts.length - 1].maxPayout : 110000;

    const coupon3: SystemCoupon = {
      id: 'kupon-3',
      title: 'Kombine & Gol Kilidi',
      badge: 'GOL & SKOR MODELİ',
      description: 'Hollanda 2, İrlanda ve Galler liglerinden MS + 2.5 Üst ve MS & KG kombinasyonlu sistem.',
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
    // Yüksek Çarpanlı Sürpriz İY/MS Tercihleri (09.10.2026)
    const c4Defs = [
      masterMatchCatalogue[37], // P. Bielsko vs Pogon Siedlce (1/1 2.50)
      masterMatchCatalogue[38], // Waasland Beveren vs Lommel (1/1 2.45)
      masterMatchCatalogue[34], // Rakow Czestochowa vs Katowice (1/1 2.65)
      masterMatchCatalogue[35], // Belçika K vs Polonya K (1/1 2.45)
      masterMatchCatalogue[36], // First Vienna vs St Polten (1/1 2.80)
      masterMatchCatalogue[30], // Malaga vs Espanyol (X/2 5.20)
      masterMatchCatalogue[31], // Dordrecht vs Emmen (X/2 4.75)
      masterMatchCatalogue[32], // Ajax B vs VVV Venlo (2/2 2.85)
      masterMatchCatalogue[33]  // Etoile Carouge vs Yverdon (X/2 4.40)
    ];
    const coupon4Matches: SystemMatch[] = [
      makeMatch(c4Defs[0], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[1], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[2], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[3], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[4], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[5], 'megaIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[6], 'megaIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[7], 'highIyms', 'İY / MS', 'iy_ms'),
      makeMatch(c4Defs[8], 'megaIyms', 'İY / MS', 'iy_ms')
    ];
    const c4Odds = coupon4Matches.map(m => m.odd);
    const c4Payouts = generatePayoutTable(c4Odds, [3, 4, 5, 6], 1);
    const c4Max = c4Payouts.length > 0 ? c4Payouts[c4Payouts.length - 1].maxPayout : 395000;

    const coupon4: SystemCoupon = {
      id: 'kupon-4',
      title: 'Büyük Vurgun / Çılgın Sistem',
      badge: '420 TL / 3 KADEMELİ MEGA VURGUN',
      description: 'İspanya, Hollanda, İsviçre ve Polonya liglerinden yüksek çarpanlı İY/MS seçimli 9 maçlık çılgın sistem.',
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
    // Net Favoriler ve Güvenilir Majörler (35 TL Kupon Bedeli - 09.10.2026)
    const c5Defs = [
      masterMatchCatalogue[1],  // PSV Eindhoven (safMs: MS 1 1.14)
      masterMatchCatalogue[0],  // B.Dortmund (safMs: MS 1 1.16)
      masterMatchCatalogue[7],  // Shelbourne (safMs: MS 1 1.16)
      masterMatchCatalogue[6],  // Breda (safMs: MS 1 1.14)
      masterMatchCatalogue[39], // Union Brescia (safMs: MS 1 1.21)
      masterMatchCatalogue[40]  // MC Alger (safMs: MS 1 1.06)
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
      description: 'PSV, Dortmund, Shelbourne ve Brescia gibi günün en güçlü favorilerinden oluşan 35 TL bütçeli sistem.',
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
    // Sadece Gol Liglerinden 2.5 Üst & KG Tercihleri (91 TL Kupon Bedeli - 09.10.2026)
    const c6Defs = [
      masterMatchCatalogue[41], // Jong AZ vs Den Bosch (goals: 2.5 ÜST 1.45)
      masterMatchCatalogue[42], // Oss vs Helmond Sport (goals: 2.5 ÜST 1.55)
      masterMatchCatalogue[15], // Braunschweig vs Holstein Kiel (goals: 2.5 ÜST 1.52)
      masterMatchCatalogue[2],  // Lens vs Lyon (goals: KG VAR 1.62)
      masterMatchCatalogue[3],  // Braga vs Sporting CP (goals: 2.5 ÜST 1.78)
      masterMatchCatalogue[25], // Bohemian vs Waterford (goals: 2.5 ÜST 1.50)
      masterMatchCatalogue[43]  // UCD vs Longford (goals: 2.5 ÜST 1.48)
    ];
    const coupon6Matches: SystemMatch[] = [
      makeMatch(c6Defs[0], 'goals', 'Toplam Gol', 'goals'),
      makeMatch(c6Defs[1], 'goals', 'Toplam Gol', 'goals'),
      makeMatch(c6Defs[2], 'goals', 'Toplam Gol', 'goals'),
      makeMatch(c6Defs[3], 'goals', 'Karşılıklı Gol', 'goals'),
      makeMatch(c6Defs[4], 'goals', 'Toplam Gol', 'goals'),
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
      description: 'Hollanda 2, Almanya 2, Fransa ve Portekiz liglerinden taraf risksiz 2.5 Üst ve KG Var sistemi.',
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
    // Saf MS + Gol + Kombine Dengeli Sepet (154 TL Kupon Bedeli - 09.10.2026)
    const c7Defs = [
      masterMatchCatalogue[44], // Penybont vs Barry Town (safMs: MS 1 1.60)
      masterMatchCatalogue[45], // Bala Town vs Buckley Town (safMs: MS 1 1.33)
      masterMatchCatalogue[26], // Bray Wanderers vs Wexford (safMs: MS 1 1.38)
      masterMatchCatalogue[27], // Athlone vs Treaty (safMs: MS 1 1.26)
      masterMatchCatalogue[46], // Llandudno vs Airbus UK (highCombo: MS 1 & KG VAR 3.20)
      masterMatchCatalogue[12], // Pau FC vs Stade Lavallois (safMs: MS 1 1.83)
      masterMatchCatalogue[47], // Vejle vs Hvidovre (safMs: MS 1 1.49)
      masterMatchCatalogue[48]  // Sutton United vs Boreham Wood (safMs: MS 2 1.52)
    ];
    const coupon7Matches: SystemMatch[] = [
      makeMatch(c7Defs[0], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c7Defs[1], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c7Defs[2], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c7Defs[3], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c7Defs[4], 'highCombo', 'Kombine & Skor', 'combo'),
      makeMatch(c7Defs[5], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c7Defs[6], 'safMs', 'Maç Sonucu', 'ms'),
      makeMatch(c7Defs[7], 'safMs', 'Maç Sonucu', 'ms')
    ];
    const c7Odds = coupon7Matches.map(m => m.odd);
    const c7Payouts = generatePayoutTable(c7Odds, [4, 5, 6], 1);
    const c7Max = c7Payouts.length > 0 ? c7Payouts[c7Payouts.length - 1].maxPayout : 48000;

    const coupon7: SystemCoupon = {
      id: 'kupon-7',
      title: 'Tam Karma / Her Şey Dahil Miks',
      badge: '154 TL / FULL HİBRİT',
      description: 'Galler, İrlanda, Fransa ve Danimarka liglerinden 154 TL bütçeli tam karma sistem modeli.',
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

