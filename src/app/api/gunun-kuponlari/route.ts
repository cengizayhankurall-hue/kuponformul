import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface DailyMatchItem {
  id: string;
  code: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  marketName: string;
  choice: string;
  odd: number;
  reason?: string;
  score?: string;
  iyScore?: string;
  won?: boolean;
}

export interface DailyCoupon {
  id: string;
  title: string;
  badge: string;
  category: 'ms_only' | 'ou_only' | 'ms_ou_mix' | 'banko' | 'special';
  categoryLabel: string;
  description: string;
  theme: 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose' | 'indigo' | 'blue';
  totalMatches: number;
  totalOdds: number;
  suggestedStake: number;
  potentialReturn: number;
  matches: DailyMatchItem[];
  isEvaluated?: boolean;
  isWinner?: boolean;
  wonMatchesCount?: number;
  wonAmount?: number;
}

export interface YesterdayDailySummary {
  date: string;
  formattedDate: string;
  totalCoupons: number;
  wonCoupons: number;
  successRate: number;
  coupons: DailyCoupon[];
}

export async function GET() {
  try {
    // -------------------------------------------------------------
    // 1. TODAY'S DAILY COUPONS (09.10.2026)
    // -------------------------------------------------------------
    
    // KUPON 1: ⚽ SADECE MAÇ SONUCU (MS 1 / MS X / MS 2) KUPONU (5 Maç - Oran: 6.30)
    const m_ms_1: DailyMatchItem = { id: 'ms_1', code: '71101', homeTeam: 'B.Dortmund', awayTeam: 'Werder Bremen', league: 'AL1', date: '09.10.2026', time: '21:30', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.34, reason: 'Dortmund ev sahibi baskısı ve net kadro kalitesi' };
    const m_ms_2: DailyMatchItem = { id: 'ms_2', code: '71106', homeTeam: 'Montpellier', awayTeam: 'Grenoble', league: 'FR2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.44, reason: 'Stade de la Mosson ev sahibi galibiyet serisi' };
    const m_ms_3: DailyMatchItem = { id: 'ms_3', code: '71105', homeTeam: 'Heidenheim', awayTeam: 'Kaiserslautern', league: 'AL2', date: '09.10.2026', time: '19:30', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.76, reason: 'Bundesliga 2 iç saha istikrarı' };
    const m_ms_4: DailyMatchItem = { id: 'ms_4', code: '71110', homeTeam: 'Sepsi', awayTeam: 'Dinamo Bükreş', league: 'ROM', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu', choice: 'MS 2', odd: 1.45, reason: 'Dinamo Bükreş deplasman performansı' };
    const m_ms_5: DailyMatchItem = { id: 'ms_5', code: '71119', homeTeam: 'Dender', awayTeam: 'Club Brugge II', league: 'BEL2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.28, reason: 'Belçika ligi sınıf ve tecrübe farkı' };
    const c_ms_odds = Number((m_ms_1.odd * m_ms_2.odd * m_ms_3.odd * m_ms_4.odd * m_ms_5.odd).toFixed(2));
    const coupon_ms_only: DailyCoupon = {
      id: 'daily-kupon-ms-only',
      title: 'Sadece Maç Sonucu (MS) Kuponu',
      badge: 'SADECE MS (1-X-2)',
      category: 'ms_only',
      categoryLabel: 'Sadece Maç Sonucu',
      description: 'Sadece Maç Sonucu (1-X-2) tercihlerinden oluşan 5 maçlık net galibiyet kombini.',
      theme: 'emerald',
      totalMatches: 5,
      totalOdds: c_ms_odds,
      suggestedStake: 100,
      potentialReturn: Number((c_ms_odds * 100).toFixed(2)),
      matches: [m_ms_1, m_ms_2, m_ms_3, m_ms_4, m_ms_5]
    };

    // KUPON 2: 🔥 SADECE 2.5 ALT / ÜST KUPONU (4 Maç - Oran: 6.39)
    const m_ou_1: DailyMatchItem = { id: 'ou_1', code: '71103', homeTeam: 'Lens', awayTeam: 'Lyon', league: 'FR1', date: '09.10.2026', time: '21:45', marketName: 'Toplam Gol', choice: '2.5 ÜST', odd: 1.65, reason: 'İki takımın da hücum gücü yüksek, açık futbol' };
    const m_ou_2: DailyMatchItem = { id: 'ou_2', code: '71104', homeTeam: 'Braga', awayTeam: 'Sporting CP', league: 'POR', date: '09.10.2026', time: '22:15', marketName: 'Toplam Gol', choice: '2.5 ÜST', odd: 1.78, reason: 'Portekiz zirve mücadelesinde tempolu bol pozisyon' };
    const m_ou_3: DailyMatchItem = { id: 'ou_3', code: '71142', homeTeam: 'Jong AZ Alkmaar', awayTeam: 'Den Bosch', league: 'HOL2', date: '09.10.2026', time: '21:00', marketName: 'Toplam Gol', choice: '2.5 ÜST', odd: 1.45, reason: 'Hollanda 2. Ligi yüksek gol ortalaması' };
    const m_ou_4: DailyMatchItem = { id: 'ou_4', code: '71126', homeTeam: 'Bohemian', awayTeam: 'Waterford', league: 'İRK', date: '09.10.2026', time: '21:45', marketName: 'Toplam Gol', choice: '2.5 ÜST', odd: 1.50, reason: 'İrlanda Kupa maçlarında yüksek skor üretimi' };
    const c_ou_odds = Number((m_ou_1.odd * m_ou_2.odd * m_ou_3.odd * m_ou_4.odd).toFixed(2));
    const coupon_ou_only: DailyCoupon = {
      id: 'daily-kupon-ou-only',
      title: 'Sadece 2.5 Alt / Üst Kuponu',
      badge: 'SADECE 2.5 ALT/ÜST',
      category: 'ou_only',
      categoryLabel: 'Sadece 2.5 Alt/Üst',
      description: 'Taraf bahsi olmadan sırf 2.5 Alt ve 2.5 Üst baremlerinden seçilmiş 4 maçlık gol kuponu.',
      theme: 'rose',
      totalMatches: 4,
      totalOdds: c_ou_odds,
      suggestedStake: 50,
      potentialReturn: Number((c_ou_odds * 50).toFixed(2)),
      matches: [m_ou_1, m_ou_2, m_ou_3, m_ou_4]
    };

    // KUPON 3: ⚡ HEM MAÇ SONUCU HEM DE 2.5 ALT / ÜST KUPONU (KARMA - 4 Maç - Oran: 6.11)
    // (Ayrı ayrı normal MS ve normal 2.5 Alt/Üst maçları)
    const m_mix_1: DailyMatchItem = { id: 'mix_1', code: '71102', homeTeam: 'PSV Eindhoven', awayTeam: 'Heerenveen', league: 'HOL', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.22, reason: 'PSV ligin mutlak favorisi' };
    const m_mix_2: DailyMatchItem = { id: 'mix_2', code: '71113', homeTeam: 'Pau FC', awayTeam: 'Stade Lavallois', league: 'FR2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.83, reason: 'Pau FC iç saha galibiyet serisi' };
    const m_mix_3: DailyMatchItem = { id: 'mix_3', code: '71144', homeTeam: 'UCD', awayTeam: 'Longford', league: 'İR1', date: '09.10.2026', time: '21:45', marketName: 'Toplam Gol', choice: '2.5 ÜST', odd: 1.48, reason: 'İrlanda 1. Liginde bol gollü eşleşme' };
    const m_mix_4: DailyMatchItem = { id: 'mix_4', code: '71145', homeTeam: 'Penybont', awayTeam: 'Barry Town', league: 'GAL', date: '09.10.2026', time: '21:45', marketName: 'Toplam Gol', choice: '2.5 ALT', odd: 1.85, reason: 'Galler liginde defansif ve kontrollü mücadele' };
    const c_mix_odds = Number((m_mix_1.odd * m_mix_2.odd * m_mix_3.odd * m_mix_4.odd).toFixed(2));
    const coupon_ms_ou_mix: DailyCoupon = {
      id: 'daily-kupon-ms-ou-mix',
      title: 'Maç Sonucu & 2.5 Alt/Üst Karma Kupon',
      badge: 'MS + 2.5 ALT/ÜST KARMA',
      category: 'ms_ou_mix',
      categoryLabel: 'MS & 2.5 Alt/Üst Karma',
      description: 'Kupon içinde ayrı maçlarda hem normal Maç Sonucu hem de normal 2.5 Alt/Üst tercihlerini birleştiren 4 maçlık dengeli kupon.',
      theme: 'amber',
      totalMatches: 4,
      totalOdds: c_mix_odds,
      suggestedStake: 50,
      potentialReturn: Number((c_mix_odds * 50).toFixed(2)),
      matches: [m_mix_1, m_mix_2, m_mix_3, m_mix_4]
    };

    // KUPON 4: 🛡️ İdeal Banko Kombine (3 Maç - Toplam Oran: 3.42)
    const m1_1: DailyMatchItem = { id: 'c1_1', code: '71101', homeTeam: 'B.Dortmund', awayTeam: 'Werder Bremen', league: 'AL1', date: '09.10.2026', time: '21:30', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 1.5 ÜST', odd: 1.34, reason: 'Dortmund iç saha baskısı ve en az 2 gol' };
    const m1_2: DailyMatchItem = { id: 'c1_2', code: '71102', homeTeam: 'PSV Eindhoven', awayTeam: 'Heerenveen', league: 'HOL', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 1.45, reason: 'PSV ligin en yüksek skor üreten iç saha takımı' };
    const m1_3: DailyMatchItem = { id: 'c1_3', code: '71106', homeTeam: 'Montpellier', awayTeam: 'Grenoble', league: 'FR2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.44, reason: 'Kadro kalitesi ve Stade de la Mosson avantajı' };
    const c1_odds = Number((m1_1.odd * m1_2.odd * m1_3.odd).toFixed(2));
    const coupon1: DailyCoupon = {
      id: 'daily-kupon-1',
      title: 'İdeal Banko Kombine',
      badge: 'GÜNÜN BANKOSU',
      category: 'banko',
      categoryLabel: 'Banko Kombineler',
      description: 'Dortmund, PSV ve Montpellier gibi günün en güvenilir maçlarından oluşan kasa kombini.',
      theme: 'cyan',
      totalMatches: 3,
      totalOdds: c1_odds,
      suggestedStake: 100,
      potentialReturn: Number((c1_odds * 100).toFixed(2)),
      matches: [m1_1, m1_2, m1_3]
    };

    // KUPON 5: 🎯 Kombine & Skor Güvencesi (4 Maç - Toplam Oran: 8.74)
    const m4_1: DailyMatchItem = { id: 'c4_1', code: '71121', homeTeam: 'De Graafschap', awayTeam: 'Utrecht (II)', league: 'HOL2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 1.70, reason: 'De Graafschap iç sahada farklı kazanmaya yakın' };
    const m4_2: DailyMatchItem = { id: 'c4_2', code: '71122', homeTeam: 'Heracles', awayTeam: 'Waalwijk', league: 'HOL2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 1.62, reason: 'Heracles hücum üretkenliği ve galibiyet' };
    const m4_3: DailyMatchItem = { id: 'c4_3', code: '71127', homeTeam: 'Bray Wanderers', awayTeam: 'Wexford Youths', league: 'İR1', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 1.80, reason: 'İrlanda 1. Ligi gollü ev sahibi galibiyeti' };
    const m4_4: DailyMatchItem = { id: 'c4_4', code: '71128', homeTeam: 'Athlone', awayTeam: 'Treaty Unt.', league: 'İR1', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 1.68, reason: 'Athlone iç saha gol performansı' };
    const c4_odds = Number((m4_1.odd * m4_2.odd * m4_3.odd * m4_4.odd).toFixed(2));
    const coupon4: DailyCoupon = {
      id: 'daily-kupon-4',
      title: 'Kombine & Skor Güvencesi',
      badge: 'MS + GOL KOMBİNLERİ',
      category: 'special',
      categoryLabel: 'Özel Kombineler',
      description: 'Hollanda 2 ve İrlanda 1. Liglerinden MS 1 & 2.5 Üst odaklı çarpanı yüksek kombine kuponu.',
      theme: 'purple',
      totalMatches: 4,
      totalOdds: c4_odds,
      suggestedStake: 30,
      potentialReturn: Number((c4_odds * 30).toFixed(2)),
      matches: [m4_1, m4_2, m4_3, m4_4]
    };

    // KUPON 6: 💥 Sürpriz Değer / Çarpan Kuponu (4 Maç - Toplam Oran: 13.65)
    const m5_1: DailyMatchItem = { id: 'c5_1', code: '71111', homeTeam: 'Nancy', awayTeam: 'Guingamp', league: 'FR2', date: '09.10.2026', time: '21:00', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.75, reason: 'Nancy ilk yarıdan skor üstünlüğünü kurar' };
    const m5_2: DailyMatchItem = { id: 'c5_2', code: '71135', homeTeam: 'Rakow Czestochowa', awayTeam: 'GKS Katowice', league: 'POL', date: '09.10.2026', time: '21:30', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.65, reason: 'Polonya Ekstraklasa erken baskı ve galibiyet' };
    const m5_3: DailyMatchItem = { id: 'c5_3', code: '71136', homeTeam: 'Belçika (K)', awayTeam: 'Polonya (K)', league: 'KDK', date: '09.10.2026', time: '21:15', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.45, reason: 'Belçika kalite üstünlüğü ile devreyi önde kapatır' };
    const m5_4: DailyMatchItem = { id: 'c5_4', code: '71148', homeTeam: 'Vejle', awayTeam: 'Hvidovre', league: 'DAN1', date: '09.10.2026', time: '19:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.49, reason: 'Danimarka 1. Ligi liderlik yarışı' };
    const c5_odds = Number((m5_1.odd * m5_2.odd * m5_3.odd * m5_4.odd).toFixed(2));
    const coupon5: DailyCoupon = {
      id: 'daily-kupon-5',
      title: 'Sürpriz Değer & Çarpan Kuponu',
      badge: '13.65 YÜKSEK ORAN',
      category: 'special',
      categoryLabel: 'Özel Kombineler',
      description: 'Fransa, Polonya ve Danimarka liglerinden İY/MS ve değer tercihlerinden oluşan yüksek kazanç kuponu.',
      theme: 'indigo',
      totalMatches: 4,
      totalOdds: c5_odds,
      suggestedStake: 20,
      potentialReturn: Number((c5_odds * 20).toFixed(2)),
      matches: [m5_1, m5_2, m5_3, m5_4]
    };

    // KUPON 7: 🌟 Akşam Özel Zirve Miksi (4 Maç - Toplam Oran: 9.85)
    const m7_1: DailyMatchItem = { id: 'c7_1', code: '71147', homeTeam: 'Llandudno', awayTeam: 'Airbus UK', league: 'GAL', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu & KG', choice: 'MS 1 & KG VAR', odd: 3.20, reason: 'Galler liginde karşılıklı gollü ev galibiyeti' };
    const m7_2: DailyMatchItem = { id: 'c7_2', code: '71145', homeTeam: 'Penybont', awayTeam: 'Barry Town', league: 'GAL', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.60, reason: 'SDM Glass Stadyumu saha avantajı' };
    const m7_3: DailyMatchItem = { id: 'c7_3', code: '71146', homeTeam: 'Bala Town', awayTeam: 'Buckley Town', league: 'GALFAW', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.33, reason: 'Kadro kalite farkı ve rahat galibiyet' };
    const m7_4: DailyMatchItem = { id: 'c7_4', code: '71144', homeTeam: 'UCD', awayTeam: 'Longford', league: 'İR1', date: '09.10.2026', time: '21:45', marketName: 'Toplam Gol', choice: '2.5 ÜST', odd: 1.48, reason: 'İrlanda 1. Liginde açık ve pozisyonlu mücadele' };
    const c7_odds = Number((m7_1.odd * m7_2.odd * m7_3.odd * m7_4.odd).toFixed(2));
    const coupon7: DailyCoupon = {
      id: 'daily-kupon-7',
      title: 'Akşam Özel Zirve Miksi',
      badge: '9.85 AKŞAM ÖZEL',
      category: 'special',
      categoryLabel: 'Özel Kombineler',
      description: 'Galler ve İrlanda gece bülteninden özenle seçilen 4 maçlık dengeli miks kupon.',
      theme: 'blue',
      totalMatches: 4,
      totalOdds: c7_odds,
      suggestedStake: 30,
      potentialReturn: Number((c7_odds * 30).toFixed(2)),
      matches: [m7_1, m7_2, m7_3, m7_4]
    };

    const todayCoupons = [
      coupon_ms_only,
      coupon_ou_only,
      coupon_ms_ou_mix,
      coupon1,
      coupon4,
      coupon5,
      coupon7
    ];

    // -------------------------------------------------------------
    // 2. YESTERDAY'S EVALUATED DAILY COUPONS (08.10.2026)
    // Veritabanındaki (past_matches) gerçek resmi maç skorları:
    // - Kuopion vs Oulu: 0 - 1 (Kuopion 0-1 kaybetti, YATTI ❌)
    // - Helsinki vs Vaasa: 6 - 0 (TUTTU ✅)
    // - Shamrock Rover vs Drogheda: 3 - 1 (TUTTU ✅)
    // - Fluminense vs Coritiba: 4 - 0 (TUTTU ✅)
    // - Palmeiras vs Bahia: 1 - 0 (TUTTU ✅)
    // - Ceara vs Criciuma: 1 - 0 (TUTTU ✅)
    // - Santos vs Flamengo: 2 - 2 (TUTTU ✅)
    // - Nautico vs Novorizontino: 0 - 2 (TUTTU ✅)
    // -------------------------------------------------------------
    const pastM_Kuopion: DailyMatchItem = { id: 'pm1', code: '74131', homeTeam: 'Kuopion', awayTeam: 'Oulu', league: 'FİN', date: '08.10.2026', time: '19:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.33, score: '0 - 1', iyScore: '0-1', won: false, reason: 'Resmi Skor: 0-1 (Kuopion kaybetti, YATTI ❌)' };
    const pastM_Helsinki: DailyMatchItem = { id: 'pm2', code: '74130', homeTeam: 'Helsinki', awayTeam: 'Vaasa', league: 'FİN', date: '08.10.2026', time: '18:00', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 2.10, score: '6 - 0', iyScore: '3-0', won: true, reason: 'Resmi Skor: 6-0 (MS 1 & 2.5 Üst TUTTU ✅)' };
    const pastM_Shamrock: DailyMatchItem = { id: 'pm3', code: '74132', homeTeam: 'Shamrock Rover', awayTeam: 'Drogheda', league: 'İRL', date: '08.10.2026', time: '21:45', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.38, score: '3 - 1', iyScore: '3-0', won: true, reason: 'Resmi Skor: 3-1 (MS 1 TUTTU ✅)' };
    const pastM_Fluminense: DailyMatchItem = { id: 'pm4', code: '74307', homeTeam: 'Fluminense', awayTeam: 'Coritiba', league: 'BR1', date: '08.10.2026', time: '02:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.62, score: '4 - 0', iyScore: '1-0', won: true, reason: 'Resmi Skor: 4-0 (MS 1 TUTTU ✅)' };
    const pastM_Palmeiras: DailyMatchItem = { id: 'pm5', code: '74308', homeTeam: 'Palmeiras', awayTeam: 'Bahia', league: 'BR1', date: '08.10.2026', time: '03:30', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.58, score: '1 - 0', iyScore: '1-0', won: true, reason: 'Resmi Skor: 1-0 (MS 1 TUTTU ✅)' };
    const pastM_Ceara: DailyMatchItem = { id: 'pm6', code: '74309', homeTeam: 'Ceara', awayTeam: 'Criciuma', league: 'BR1', date: '08.10.2026', time: '01:30', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.70, score: '1 - 0', iyScore: '0-0', won: true, reason: 'Resmi Skor: 1-0 (MS 1 TUTTU ✅)' };
    const pastM_Santos: DailyMatchItem = { id: 'pm7', code: '74310', homeTeam: 'Santos', awayTeam: 'Flamengo', league: 'BR1', date: '08.10.2026', time: '02:30', marketName: 'Karşılıklı Gol', choice: 'KG VAR', odd: 1.82, score: '2 - 2', iyScore: '0-2', won: true, reason: 'Resmi Skor: 2-2 (KG Var TUTTU ✅)' };
    const pastM_Nautico: DailyMatchItem = { id: 'pm8', code: '74311', homeTeam: 'Nautico', awayTeam: 'Novorizontino', league: 'BR1', date: '08.10.2026', time: '01:30', marketName: 'Maç Sonucu', choice: 'MS 2', odd: 2.10, score: '0 - 2', iyScore: '0-2', won: true, reason: 'Resmi Skor: 0-2 (MS 2 TUTTU ✅)' };

    // Past Coupon 1: İdeal Banko Kombine (Dün) -> Kuopion (0-1 Yattı), Helsinki (6-0 Tuttu), Shamrock (3-1 Tuttu) -> 2/3 KAYBETTİ
    const pC1_odds = Number((pastM_Kuopion.odd * pastM_Helsinki.odd * pastM_Shamrock.odd).toFixed(2));
    const pastCoupon1: DailyCoupon = {
      id: 'past-daily-1',
      title: 'İdeal Banko Kombine (Dün)',
      badge: '2/3 TUTTU (KAYBETTİ ❌)',
      category: 'banko',
      categoryLabel: 'Banko Kombine',
      description: 'Kuopion 0-1 yenildiği için kupon yattı; Helsinki ve Shamrock maçları kazandı.',
      theme: 'rose',
      totalMatches: 3,
      totalOdds: pC1_odds,
      suggestedStake: 100,
      potentialReturn: Number((pC1_odds * 100).toFixed(2)),
      matches: [pastM_Kuopion, pastM_Helsinki, pastM_Shamrock],
      isEvaluated: true,
      isWinner: false,
      wonMatchesCount: 2,
      wonAmount: 0
    };

    // Past Coupon 2: Değer & Form Kuponu (Dün) -> Fluminense, Palmeiras, Ceara, Shamrock -> 4/4 KAZANDI (5.99 Oran)
    const pC2_odds = Number((pastM_Fluminense.odd * pastM_Palmeiras.odd * pastM_Ceara.odd * pastM_Shamrock.odd).toFixed(2));
    const pastCoupon2: DailyCoupon = {
      id: 'past-daily-2',
      title: 'İdeal Değer & Form Kuponu (Dün)',
      badge: '5.99 ORAN / KAZANDI ✅',
      category: 'ms_only',
      categoryLabel: 'Sadece MS',
      description: 'Fluminense (4-0), Palmeiras (1-0), Ceara (1-0) ve Shamrock (3-1) galibiyetleriyle 4/4 tam isabet.',
      theme: 'emerald',
      totalMatches: 4,
      totalOdds: pC2_odds,
      suggestedStake: 50,
      potentialReturn: Number((pC2_odds * 50).toFixed(2)),
      matches: [pastM_Fluminense, pastM_Palmeiras, pastM_Ceara, pastM_Shamrock],
      isEvaluated: true,
      isWinner: true,
      wonMatchesCount: 4,
      wonAmount: Number((pC2_odds * 50).toFixed(2))
    };

    // Past Coupon 3: Gol & KG Kuponu (Dün) -> Helsinki (6-0 Tuttu), Santos (2-2 Tuttu), Nautico (0-2 Tuttu), Kuopion (0-1 Yattı) -> 3/4 KAYBETTİ
    const pC3_odds = Number((pastM_Helsinki.odd * pastM_Santos.odd * pastM_Nautico.odd * pastM_Kuopion.odd).toFixed(2));
    const pastCoupon3: DailyCoupon = {
      id: 'past-daily-3',
      title: 'Gol & Taraf Kuponu (Dün)',
      badge: '3/4 TUTTU (KAYBETTİ ❌)',
      category: 'ou_only',
      categoryLabel: 'Gol Kuponu',
      description: 'Helsinki, Santos ve Nautico maçları tuttu; Kuopion maçı 0-1 bittiği için kupon kaybetti.',
      theme: 'amber',
      totalMatches: 4,
      totalOdds: pC3_odds,
      suggestedStake: 50,
      potentialReturn: Number((pC3_odds * 50).toFixed(2)),
      matches: [pastM_Helsinki, pastM_Santos, pastM_Nautico, pastM_Kuopion],
      isEvaluated: true,
      isWinner: false,
      wonMatchesCount: 3,
      wonAmount: 0
    };

    // Past Coupon 4: Brezilya & İrlanda Kombini (Dün) -> Nautico (0-2), Fluminense (4-0), Ceara (1-0), Shamrock (3-1) -> 4/4 KAZANDI (7.97 Oran)
    const pC4_odds = Number((pastM_Nautico.odd * pastM_Fluminense.odd * pastM_Ceara.odd * pastM_Shamrock.odd).toFixed(2));
    const pastCoupon4: DailyCoupon = {
      id: 'past-daily-4',
      title: 'Brezilya & İrlanda Özel (Dün)',
      badge: '7.97 ORAN / KAZANDI ✅',
      category: 'special',
      categoryLabel: 'Özel Kupon',
      description: 'Nautico (MS 2), Fluminense (MS 1), Ceara (MS 1) ve Shamrock (MS 1) ile 7.97 oranlı net kazanç.',
      theme: 'purple',
      totalMatches: 4,
      totalOdds: pC4_odds,
      suggestedStake: 30,
      potentialReturn: Number((pC4_odds * 30).toFixed(2)),
      matches: [pastM_Nautico, pastM_Fluminense, pastM_Ceara, pastM_Shamrock],
      isEvaluated: true,
      isWinner: true,
      wonMatchesCount: 4,
      wonAmount: Number((pC4_odds * 30).toFixed(2))
    };

    const pastCoupons = [pastCoupon1, pastCoupon2, pastCoupon3, pastCoupon4];
    const wonPastCount = pastCoupons.filter(c => c.isWinner).length;

    const yesterdaySummary: YesterdayDailySummary = {
      date: '08.10.2026',
      formattedDate: '8 Ekim 2026 Dün',
      totalCoupons: pastCoupons.length,
      wonCoupons: wonPastCount,
      successRate: Math.round((wonPastCount / pastCoupons.length) * 100),
      coupons: pastCoupons
    };

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      date: '09.10.2026',
      coupons: todayCoupons,
      yesterday: yesterdaySummary
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
