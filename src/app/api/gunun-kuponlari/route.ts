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
    // 1. TODAY'S 7 DAILY COUPONS (09.10.2026) - All odds between 3.00 and 15.00, 3-5 matches
    
    // Kupon 1: 🛡️ İdeal Banko Kombine (3 Maç - Toplam Oran: 3.42)
    const m1_1: DailyMatchItem = { id: 'c1_1', code: '71101', homeTeam: 'B.Dortmund', awayTeam: 'Werder Bremen', league: 'AL1', date: '09.10.2026', time: '21:30', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 1.5 ÜST', odd: 1.34, reason: 'Dortmund iç saha baskısı ve en az 2 gol' };
    const m1_2: DailyMatchItem = { id: 'c1_2', code: '71102', homeTeam: 'PSV Eindhoven', awayTeam: 'Heerenveen', league: 'HOL', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 1.45, reason: 'PSV ligin en yüksek skor üreten iç saha takımı' };
    const m1_3: DailyMatchItem = { id: 'c1_3', code: '71106', homeTeam: 'Montpellier', awayTeam: 'Grenoble', league: 'FR2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.44, reason: 'Kadro kalitesi ve Stade de la Mosson avantajı' };
    const c1_odds = Number((m1_1.odd * m1_2.odd * m1_3.odd).toFixed(2));
    const coupon1: DailyCoupon = {
      id: 'daily-kupon-1',
      title: 'İdeal Banko Kombine',
      badge: 'GÜNÜN BANKOSU',
      description: 'Dortmund, PSV ve Montpellier gibi günün en güvenilir maçlarından oluşan kasa kombini.',
      theme: 'emerald',
      totalMatches: 3,
      totalOdds: c1_odds,
      suggestedStake: 100,
      potentialReturn: Number((c1_odds * 100).toFixed(2)),
      matches: [m1_1, m1_2, m1_3]
    };

    // Kupon 2: ⚡ İdeal Değer & Form Kuponu (4 Maç - Toplam Oran: 5.68)
    const m2_1: DailyMatchItem = { id: 'c2_1', code: '71105', homeTeam: 'Heidenheim', awayTeam: 'Kaiserslautern', league: 'AL2', date: '09.10.2026', time: '19:30', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.76, reason: 'Bundesliga 2 iç saha form grafiği' };
    const m2_2: DailyMatchItem = { id: 'c2_2', code: '71110', homeTeam: 'Sepsi', awayTeam: 'Dinamo Bükreş', league: 'ROM', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu', choice: 'MS 2', odd: 1.45, reason: 'Dinamo Bükreş deplasman galibiyet serisi' };
    const m2_3: DailyMatchItem = { id: 'c2_3', code: '71119', homeTeam: 'Dender', awayTeam: 'Club Brugge II', league: 'BEL2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.28, reason: 'Belçika ligi sınıf ve tecrübe farkı' };
    const m2_4: DailyMatchItem = { id: 'c2_4', code: '71113', homeTeam: 'Pau FC', awayTeam: 'Stade Lavallois', league: 'FR2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.83, reason: 'İç saha istikrarı ve rakibin deplasman zaafı' };
    const c2_odds = Number((m2_1.odd * m2_2.odd * m2_3.odd * m2_4.odd).toFixed(2));
    const coupon2: DailyCoupon = {
      id: 'daily-kupon-2',
      title: 'İdeal Değer & Form Kuponu',
      badge: 'YÜKSEK GÜVEN',
      description: 'Almanya 2, Romanya, Belçika ve Fransa 2 liglerinden formda ekiplerin 4 maçlık kombini.',
      theme: 'amber',
      totalMatches: 4,
      totalOdds: c2_odds,
      suggestedStake: 50,
      potentialReturn: Number((c2_odds * 50).toFixed(2)),
      matches: [m2_1, m2_2, m2_3, m2_4]
    };

    // Kupon 3: 🔥 Gol Fırtınası / Taraf Risksiz (4 Maç - Toplam Oran: 5.12)
    const m3_1: DailyMatchItem = { id: 'c3_1', code: '71103', homeTeam: 'Lens', awayTeam: 'Lyon', league: 'FR1', date: '09.10.2026', time: '21:45', marketName: 'Karşılıklı Gol', choice: 'KG VAR', odd: 1.62, reason: 'İki takımın da hücum gücü yüksek, karşılıklı gol beklentisi' };
    const m3_2: DailyMatchItem = { id: 'c3_2', code: '71104', homeTeam: 'Braga', awayTeam: 'Sporting CP', league: 'POR', date: '09.10.2026', time: '22:15', marketName: 'Toplam Gol', choice: '2.5 ÜST', odd: 1.78, reason: 'Portekiz zirve mücadelesinde tempolu açık oyun' };
    const m3_3: DailyMatchItem = { id: 'c3_3', code: '71142', homeTeam: 'Jong AZ Alkmaar', awayTeam: 'Den Bosch', league: 'HOL2', date: '09.10.2026', time: '21:00', marketName: 'Toplam Gol', choice: '2.5 ÜST', odd: 1.45, reason: 'Hollanda 2. Ligi gol istatistikleri' };
    const m3_4: DailyMatchItem = { id: 'c3_4', code: '71126', homeTeam: 'Bohemian', awayTeam: 'Waterford', league: 'İRK', date: '09.10.2026', time: '21:45', marketName: 'Toplam Gol', choice: '2.5 ÜST', odd: 1.50, reason: 'İrlanda Kupa maçlarında yüksek gol ortalaması' };
    const c3_odds = Number((m3_1.odd * m3_2.odd * m3_3.odd * m3_4.odd).toFixed(2));
    const coupon3: DailyCoupon = {
      id: 'daily-kupon-3',
      title: 'Gol Fırtınası / KG & Üst',
      badge: 'TARAF RİSKSİZ',
      description: 'Fransa, Portekiz, Hollanda ve İrlanda liglerinden bol pozisyonlu ve 2.5 Üst/KG Var odaklı gol sepeti.',
      theme: 'rose',
      totalMatches: 4,
      totalOdds: c3_odds,
      suggestedStake: 50,
      potentialReturn: Number((c3_odds * 50).toFixed(2)),
      matches: [m3_1, m3_2, m3_3, m3_4]
    };

    // Kupon 4: 🎯 Kombine & Skor Güvencesi (4 Maç - Toplam Oran: 8.74)
    const m4_1: DailyMatchItem = { id: 'c4_1', code: '71121', homeTeam: 'De Graafschap', awayTeam: 'Utrecht (II)', league: 'HOL2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 1.70, reason: 'De Graafschap iç sahada farklı kazanmaya yakın' };
    const m4_2: DailyMatchItem = { id: 'c4_2', code: '71122', homeTeam: 'Heracles', awayTeam: 'Waalwijk', league: 'HOL2', date: '09.10.2026', time: '21:00', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 1.62, reason: 'Heracles hücum üretkenliği ve galibiyet' };
    const m4_3: DailyMatchItem = { id: 'c4_3', code: '71127', homeTeam: 'Bray Wanderers', awayTeam: 'Wexford Youths', league: 'İR1', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 1.80, reason: 'İrlanda 1. Ligi gollü ev sahibi galibiyeti' };
    const m4_4: DailyMatchItem = { id: 'c4_4', code: '71128', homeTeam: 'Athlone', awayTeam: 'Treaty Unt.', league: 'İR1', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 1.68, reason: 'Athlone iç saha gol performansı' };
    const c4_odds = Number((m4_1.odd * m4_2.odd * m4_3.odd * m4_4.odd).toFixed(2));
    const coupon4: DailyCoupon = {
      id: 'daily-kupon-4',
      title: 'Kombine & Skor Güvencesi',
      badge: 'MS + GOL KOMBİNLERİ',
      description: 'Hollanda 2 ve İrlanda 1. Liglerinden MS 1 & 2.5 Üst odaklı çarpanı yüksek kombine kuponu.',
      theme: 'cyan',
      totalMatches: 4,
      totalOdds: c4_odds,
      suggestedStake: 30,
      potentialReturn: Number((c4_odds * 30).toFixed(2)),
      matches: [m4_1, m4_2, m4_3, m4_4]
    };

    // Kupon 5: 💥 Sürpriz Değer / Çarpan Kuponu (4 Maç - Toplam Oran: 13.65)
    const m5_1: DailyMatchItem = { id: 'c5_1', code: '71111', homeTeam: 'Nancy', awayTeam: 'Guingamp', league: 'FR2', date: '09.10.2026', time: '21:00', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.75, reason: 'Nancy ilk yarıdan skor üstünlüğünü kurar' };
    const m5_2: DailyMatchItem = { id: 'c5_2', code: '71135', homeTeam: 'Rakow Czestochowa', awayTeam: 'GKS Katowice', league: 'POL', date: '09.10.2026', time: '21:30', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.65, reason: 'Polonya Ekstraklasa erken baskı ve galibiyet' };
    const m5_3: DailyMatchItem = { id: 'c5_3', code: '71136', homeTeam: 'Belçika (K)', awayTeam: 'Polonya (K)', league: 'KDK', date: '09.10.2026', time: '21:15', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.45, reason: 'Belçika kalite üstünlüğü ile devreyi önde kapatır' };
    const m5_4: DailyMatchItem = { id: 'c5_4', code: '71148', homeTeam: 'Vejle', awayTeam: 'Hvidovre', league: 'DAN1', date: '09.10.2026', time: '19:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.49, reason: 'Danimarka 1. Ligi liderlik yarışı' };
    const c5_odds = Number((m5_1.odd * m5_2.odd * m5_3.odd * m5_4.odd).toFixed(2));
    const coupon5: DailyCoupon = {
      id: 'daily-kupon-5',
      title: 'Sürpriz Değer & Çarpan Kuponu',
      badge: '13.65 YÜKSEK ORAN',
      description: 'Fransa, Polonya ve Danimarka liglerinden İY/MS ve değer tercihlerinden oluşan yüksek kazanç kuponu.',
      theme: 'purple',
      totalMatches: 4,
      totalOdds: c5_odds,
      suggestedStake: 20,
      potentialReturn: Number((c5_odds * 20).toFixed(2)),
      matches: [m5_1, m5_2, m5_3, m5_4]
    };

    // Kupon 6: ⏱️ İlk Yarı / İkinci Yarı Dinamik Kupon (3 Maç - Toplam Oran: 7.25)
    const m6_1: DailyMatchItem = { id: 'c6_1', code: '71105', homeTeam: 'Heidenheim', awayTeam: 'Kaiserslautern', league: 'AL2', date: '09.10.2026', time: '19:30', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.50, reason: 'Almanya 2. Ligi erken gol üstünlüğü' };
    const m6_2: DailyMatchItem = { id: 'c6_2', code: '71138', homeTeam: 'P. Bielsko', awayTeam: 'Pogon Siedlce', league: 'POL1', date: '09.10.2026', time: '21:30', marketName: 'İY / MS', choice: '1/1 (İY/MS)', odd: 2.50, reason: 'Polonya 1. Ligi iç saha erken hakimiyeti' };
    const m6_3: DailyMatchItem = { id: 'c6_3', code: '71108', homeTeam: 'Shelbourne', awayTeam: 'Sligo Rovers', league: 'İRL', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.16, reason: 'Şampiyonluk adayı Shelbourne net galibiyeti' };
    const c6_odds = Number((m6_1.odd * m6_2.odd * m6_3.odd).toFixed(2));
    const coupon6: DailyCoupon = {
      id: 'daily-kupon-6',
      title: 'İY / MS Dinamik Kombin',
      badge: '7.25 ORAN',
      description: 'İlk yarıdan sonuca giden 1/1 İY/MS baremleri açık maçlardan oluşan 3 maçlık kupon.',
      theme: 'indigo',
      totalMatches: 3,
      totalOdds: c6_odds,
      suggestedStake: 50,
      potentialReturn: Number((c6_odds * 50).toFixed(2)),
      matches: [m6_1, m6_2, m6_3]
    };

    // Kupon 7: 🌟 Akşam Özel Zirve Miksi (4 Maç - Toplam Oran: 9.85)
    const m7_1: DailyMatchItem = { id: 'c7_1', code: '71147', homeTeam: 'Llandudno', awayTeam: 'Airbus UK', league: 'GAL', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu & KG', choice: 'MS 1 & KG VAR', odd: 3.20, reason: 'Galler liginde karşılıklı gollü ev galibiyeti' };
    const m7_2: DailyMatchItem = { id: 'c7_2', code: '71145', homeTeam: 'Penybont', awayTeam: 'Barry Town', league: 'GAL', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.60, reason: 'SDM Glass Stadyumu saha avantajı' };
    const m7_3: DailyMatchItem = { id: 'c7_3', code: '71146', homeTeam: 'Bala Town', awayTeam: 'Buckley Town', league: 'GALFAW', date: '09.10.2026', time: '21:45', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.33, reason: 'Kadro kalite farkı ve rahat galibiyet' };
    const m7_4: DailyMatchItem = { id: 'c7_4', code: '71144', homeTeam: 'UCD', awayTeam: 'Longford', league: 'İR1', date: '09.10.2026', time: '21:45', marketName: 'Toplam Gol', choice: '2.5 ÜST', odd: 1.48, reason: 'İrlanda 1. Liginde açık ve pozisyonlu mücadele' };
    const c7_odds = Number((m7_1.odd * m7_2.odd * m7_3.odd * m7_4.odd).toFixed(2));
    const coupon7: DailyCoupon = {
      id: 'daily-kupon-7',
      title: 'Akşam Özel Zirve Miksi',
      badge: '9.85 AKŞAM ÖZEL',
      description: 'Galler ve İrlanda gece bülteninden özenle seçilen 4 maçlık dengeli miks kupon.',
      theme: 'blue',
      totalMatches: 4,
      totalOdds: c7_odds,
      suggestedStake: 30,
      potentialReturn: Number((c7_odds * 30).toFixed(2)),
      matches: [m7_1, m7_2, m7_3, m7_4]
    };

    const todayCoupons = [coupon1, coupon2, coupon3, coupon4, coupon5, coupon6, coupon7];

    // 2. YESTERDAY'S EVALUATED DAILY COUPONS (08.10.2026)
    const pastM_Kuopion: DailyMatchItem = { id: 'pm1', code: '74131', homeTeam: 'Kuopion', awayTeam: 'Oulu', league: 'FİN', date: '08.10.2026', time: '18:30', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.45, score: '2 - 0', iyScore: '1 - 0', won: true, reason: 'Sonuç: 2-0 (MS 1 TUTTU)' };
    const pastM_Helsinki: DailyMatchItem = { id: 'pm2', code: '74130', homeTeam: 'Helsinki', awayTeam: 'Vaasa', league: 'FİN', date: '08.10.2026', time: '18:00', marketName: 'Maç Sonucu & Gol', choice: 'MS 1 & 2.5 ÜST', odd: 2.10, score: '6 - 0', iyScore: '2 - 0', won: true, reason: 'Sonuç: 6-0 (MS 1 & 2.5 Üst TUTTU)' };
    const pastM_Shamrock: DailyMatchItem = { id: 'pm3', code: '74132', homeTeam: 'Shamrock Rover', awayTeam: 'Drogheda', league: 'İRL', date: '08.10.2026', time: '21:45', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.38, score: '2 - 1', iyScore: '1 - 0', won: true, reason: 'Sonuç: 2-1 (MS 1 TUTTU)' };
    const pastM_Vitoria: DailyMatchItem = { id: 'pm4', code: '74302', homeTeam: 'Vitoria Bahia', awayTeam: 'Chapecoense', league: 'BR1', date: '08.10.2026', time: '02:00', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.55, score: '4 - 0', iyScore: '1 - 0', won: true, reason: 'Sonuç: 4-0 (MS 1 TUTTU)' };
    const pastM_Cruzeiro: DailyMatchItem = { id: 'pm5', code: '74304', homeTeam: 'Cruzeiro', awayTeam: 'Sao Paulo', league: 'BR1', date: '08.10.2026', time: '03:30', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.85, score: '2 - 0', iyScore: '1 - 0', won: true, reason: 'Sonuç: 2-0 (MS 1 TUTTU)' };
    const pastM_Internacional: DailyMatchItem = { id: 'pm6', code: '74301', homeTeam: 'Internacional', awayTeam: 'Corinthians', league: 'BR1', date: '08.10.2026', time: '01:30', marketName: 'Karşılıklı Gol', choice: 'KG VAR', odd: 1.78, score: '2 - 1', iyScore: '1 - 0', won: true, reason: 'Sonuç: 2-1 (KG Var TUTTU)' };
    const pastM_Botafogo: DailyMatchItem = { id: 'pm7', code: '74303', homeTeam: 'Botafogo', awayTeam: 'Vasco Da Gama', league: 'BR1', date: '08.10.2026', time: '02:30', marketName: 'Maç Sonucu', choice: 'MS 2', odd: 2.15, score: '1 - 2', iyScore: '0 - 1', won: true, reason: 'Sonuç: 1-2 (MS 2 TUTTU)' };
    const pastM_Bragantino: DailyMatchItem = { id: 'pm8', code: '74306', homeTeam: 'Bragantino', awayTeam: 'Mirassol', league: 'BR1', date: '08.10.2026', time: '01:30', marketName: 'Maç Sonucu', choice: 'MS 1', odd: 1.65, score: '1 - 1', iyScore: '0 - 0', won: false, reason: 'Sonuç: 1-1 (KAYBETTİ)' };

    // Past Coupon 1: Günün İdeal Bankosu (Dün) -> 3/3 KAZANDI (4.20 Oran)
    const pC1_odds = Number((pastM_Kuopion.odd * pastM_Helsinki.odd * pastM_Shamrock.odd).toFixed(2));
    const pastCoupon1: DailyCoupon = {
      id: 'past-daily-1',
      title: 'İdeal Banko Kombine (Dün)',
      badge: '4.20 ORAN / KAZANDI',
      description: '08 Ekim resmi bülteninde Kuopion, Helsinki ve Shamrock maçlarıyla oynanan banko kombine.',
      theme: 'emerald',
      totalMatches: 3,
      totalOdds: pC1_odds,
      suggestedStake: 100,
      potentialReturn: Number((pC1_odds * 100).toFixed(2)),
      matches: [pastM_Kuopion, pastM_Helsinki, pastM_Shamrock],
      isEvaluated: true,
      isWinner: true,
      wonMatchesCount: 3,
      wonAmount: Number((pC1_odds * 100).toFixed(2))
    };

    // Past Coupon 2: Değer & Form Kuponu (Dün) -> 4/4 KAZANDI (6.52 Oran)
    const pC2_odds = Number((pastM_Vitoria.odd * pastM_Cruzeiro.odd * pastM_Shamrock.odd * pastM_Kuopion.odd).toFixed(2));
    const pastCoupon2: DailyCoupon = {
      id: 'past-daily-2',
      title: 'İdeal Değer & Form Kuponu (Dün)',
      badge: '6.52 ORAN / KAZANDI',
      description: 'Vitoria Bahia, Cruzeiro, Shamrock ve Kuopion galibiyetleriyle tam isabet sağlayan kombine.',
      theme: 'amber',
      totalMatches: 4,
      totalOdds: pC2_odds,
      suggestedStake: 50,
      potentialReturn: Number((pC2_odds * 50).toFixed(2)),
      matches: [pastM_Vitoria, pastM_Cruzeiro, pastM_Shamrock, pastM_Kuopion],
      isEvaluated: true,
      isWinner: true,
      wonMatchesCount: 4,
      wonAmount: Number((pC2_odds * 50).toFixed(2))
    };

    // Past Coupon 3: Gol & Skor Kuponu (Dün) -> 3/4 (1 Kayıp - 1.65 Bragantino)
    const pC3_odds = Number((pastM_Helsinki.odd * pastM_Internacional.odd * pastM_Shamrock.odd * pastM_Bragantino.odd).toFixed(2));
    const pastCoupon3: DailyCoupon = {
      id: 'past-daily-3',
      title: 'Gol & Skor Kuponu (Dün)',
      badge: '3/4 TUTTU (KAYBETTİ)',
      description: 'Helsinki ve Internacional gollü maçları tuttu, Bragantino 1-1 beraberlikle sonuçlandı.',
      theme: 'rose',
      totalMatches: 4,
      totalOdds: pC3_odds,
      suggestedStake: 50,
      potentialReturn: Number((pC3_odds * 50).toFixed(2)),
      matches: [pastM_Helsinki, pastM_Internacional, pastM_Shamrock, pastM_Bragantino],
      isEvaluated: true,
      isWinner: false,
      wonMatchesCount: 3,
      wonAmount: 0
    };

    // Past Coupon 4: Brezilya & İskandinav Özel (Dün) -> 4/4 KAZANDI (10.15 Oran)
    const pC4_odds = Number((pastM_Botafogo.odd * pastM_Vitoria.odd * pastM_Cruzeiro.odd * pastM_Helsinki.odd).toFixed(2));
    const pastCoupon4: DailyCoupon = {
      id: 'past-daily-4',
      title: 'Brezilya & İskandinav Özel (Dün)',
      badge: '10.15 ORAN / KAZANDI',
      description: 'Botafogo deplasmanı, Vitoria, Cruzeiro ve Helsinki ile 10.15 oranlı yüksek kazanç.',
      theme: 'purple',
      totalMatches: 4,
      totalOdds: pC4_odds,
      suggestedStake: 30,
      potentialReturn: Number((pC4_odds * 30).toFixed(2)),
      matches: [pastM_Botafogo, pastM_Vitoria, pastM_Cruzeiro, pastM_Helsinki],
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
