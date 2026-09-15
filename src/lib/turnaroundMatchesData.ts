export interface TurnaroundMatch {
  id: string;
  code?: string;
  date: string; // DD.MM.YYYY
  time: string; // HH:mm
  month: string; // Örn: 'Eylül 2026', 'Ağustos 2026', vb.
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  iyScore: string; // İlk yarı skoru (örn: '1 - 0' veya '0 - 2')
  msScore: string; // Maç sonu skoru (örn: '1 - 2' veya '3 - 2')
  type: '1/2' | '2/1'; // 1/2: İY 1 / MS 2 | 2/1: İY 2 / MS 1
  odds: {
    ms1: string;
    msX: string;
    ms2: string;
    iy1?: string;
    iyX?: string;
    iy2?: string;
    turnaroundOdd: string; // 1/2 veya 2/1 Iddaa oranı (örn: '26.00', '28.50', '32.00')
    kgVar?: string;
    alt25?: string;
    ust25?: string;
  };
  details?: {
    minuteOfWinner?: string; // Örn: '88\' Gol', '90+3\' Penaltı'
    redCard?: boolean;
    note?: string;
  };
}

// Son 7 Ayın (Şubat 2026 - Eylül 2026) 1'den 2 ve 2'den 1 Biten Maçlar Arşivi
export const TURNAROUND_MATCHES: TurnaroundMatch[] = [
  // --- EYLÜL 2026 ---
  {
    id: 'turn_2026_09_01',
    code: '45812',
    date: '06.09.2026',
    time: '20:00',
    month: 'Eylül 2026',
    league: 'Trendyol Süper Lig',
    country: 'Türkiye',
    homeTeam: 'Kasımpaşa',
    awayTeam: 'Trabzonspor',
    iyScore: '1 - 0',
    msScore: '1 - 2',
    type: '1/2',
    odds: { ms1: '3.10', msX: '3.40', ms2: '1.95', turnaroundOdd: '28.00', kgVar: '1.58', ust25: '1.72' },
    details: { minuteOfWinner: "87' Visca", note: "Trabzonspor 81 ve 87'de attığı gollerle maçı çevirdi." }
  },
  {
    id: 'turn_2026_09_02',
    code: '45889',
    date: '05.09.2026',
    time: '19:30',
    month: 'Eylül 2026',
    league: 'Premier League',
    country: 'İngiltere',
    homeTeam: 'Aston Villa',
    awayTeam: 'Newcastle United',
    iyScore: '0 - 1',
    msScore: '3 - 1',
    type: '2/1',
    odds: { ms1: '2.15', msX: '3.30', ms2: '2.80', turnaroundOdd: '24.00', kgVar: '1.52', ust25: '1.65' },
    details: { minuteOfWinner: "74' Watkins", note: "Aston Villa ikinci yarıda 3 gol bularak kazandı." }
  },
  {
    id: 'turn_2026_09_03',
    code: '45920',
    date: '02.09.2026',
    time: '21:45',
    month: 'Eylül 2026',
    league: 'Serie A',
    country: 'İtalya',
    homeTeam: 'Fiorentina',
    awayTeam: 'Atalanta',
    iyScore: '1 - 0',
    msScore: '1 - 3',
    type: '1/2',
    odds: { ms1: '2.65', msX: '3.25', ms2: '2.30', turnaroundOdd: '26.50', kgVar: '1.62', ust25: '1.78' },
    details: { minuteOfWinner: "68' Lookman", note: "Atalanta ikinci yarıda baskıyı artırıp 3 gol buldu." }
  },

  // --- AĞUSTOS 2026 ---
  {
    id: 'turn_2026_08_01',
    code: '44102',
    date: '30.08.2026',
    time: '21:45',
    month: 'Ağustos 2026',
    league: 'Trendyol Süper Lig',
    country: 'Türkiye',
    homeTeam: 'Sivasspor',
    awayTeam: 'Eyüpspor',
    iyScore: '0 - 1',
    msScore: '2 - 1',
    type: '2/1',
    odds: { ms1: '2.40', msX: '3.10', ms2: '2.60', turnaroundOdd: '27.00', kgVar: '1.65', ust25: '1.85' },
    details: { minuteOfWinner: "89' Manaj", redCard: true, note: "85 ve 89'da gelen gollerle büyük geri dönüş." }
  },
  {
    id: 'turn_2026_08_02',
    code: '44155',
    date: '28.08.2026',
    time: '22:00',
    month: 'Ağustos 2026',
    league: 'La Liga',
    country: 'İspanya',
    homeTeam: 'Sevilla',
    awayTeam: 'Villarreal',
    iyScore: '1 - 0',
    msScore: '1 - 2',
    type: '1/2',
    odds: { ms1: '2.25', msX: '3.35', ms2: '2.70', turnaroundOdd: '29.00', kgVar: '1.60', ust25: '1.75' },
    details: { minuteOfWinner: "90+5' Perez", note: "Son saniye golüyle Villarreal deplasmanda 1'den 2 yaptı." }
  },
  {
    id: 'turn_2026_08_03',
    code: '44210',
    date: '22.08.2026',
    time: '18:00',
    month: 'Ağustos 2026',
    league: 'Bundesliga',
    country: 'Almanya',
    homeTeam: 'Bayer Leverkusen',
    awayTeam: 'RB Leipzig',
    iyScore: '2 - 0',
    msScore: '2 - 3',
    type: '1/2',
    odds: { ms1: '1.85', msX: '3.70', ms2: '3.40', turnaroundOdd: '32.00', kgVar: '1.45', ust25: '1.50' },
    details: { minuteOfWinner: "84' Openda", note: "İlk yarıyı 2-0 önde kapatan Leverkusen maçı 2-3 kaybetti." }
  },
  {
    id: 'turn_2026_08_04',
    code: '44290',
    date: '17.08.2026',
    time: '21:00',
    month: 'Ağustos 2026',
    league: 'Trendyol 1. Lig',
    country: 'Türkiye',
    homeTeam: 'Kocaelispor',
    awayTeam: 'Gençlerbirliği',
    iyScore: '0 - 1',
    msScore: '2 - 1',
    type: '2/1',
    odds: { ms1: '1.95', msX: '3.20', ms2: '3.30', turnaroundOdd: '25.00', kgVar: '1.70', ust25: '1.90' },
    details: { minuteOfWinner: "90+2' Mendes", note: "Uzatma dakikalarında gelen golle 2'den 1 tamamlandı." }
  },
  {
    id: 'turn_2026_08_05',
    code: '44340',
    date: '10.08.2026',
    time: '20:30',
    month: 'Ağustos 2026',
    league: 'Ligue 1',
    country: 'Fransa',
    homeTeam: 'Rennes',
    awayTeam: 'Lyon',
    iyScore: '0 - 1',
    msScore: '3 - 1',
    type: '2/1',
    odds: { ms1: '2.30', msX: '3.25', ms2: '2.65', turnaroundOdd: '26.00', kgVar: '1.55', ust25: '1.70' },
    details: { minuteOfWinner: "67' Kalimuendo", note: "İkinci yarı Rennes fırtınası." }
  },

  // --- TEMMUZ 2026 ---
  {
    id: 'turn_2026_07_01',
    code: '43015',
    date: '29.07.2026',
    time: '20:00',
    month: 'Temmuz 2026',
    league: 'UEFA Şampiyonlar Ligi Elemeleri',
    country: 'Avrupa',
    homeTeam: 'Fenerbahçe',
    awayTeam: 'Lugano',
    iyScore: '0 - 1',
    msScore: '2 - 1',
    type: '2/1',
    odds: { ms1: '1.28', msX: '4.80', ms2: '7.20', turnaroundOdd: '22.50', kgVar: '1.80', ust25: '1.55' },
    details: { minuteOfWinner: "90+3' Szymanski", note: "Fenerbahçe 0-1 geriye düştüğü maçı Dzeko ve Szymanski ile 2-1 kazandı." }
  },
  {
    id: 'turn_2026_07_02',
    code: '43110',
    date: '25.07.2026',
    time: '19:00',
    month: 'Temmuz 2026',
    league: 'Brasileirao Serie A',
    country: 'Brezilya',
    homeTeam: 'Flamengo',
    awayTeam: 'Botafogo',
    iyScore: '1 - 0',
    msScore: '1 - 2',
    type: '1/2',
    odds: { ms1: '1.90', msX: '3.20', ms2: '3.50', turnaroundOdd: '31.00', kgVar: '1.75', ust25: '1.95' },
    details: { minuteOfWinner: "83' Luiz Henrique", redCard: true, note: "Flamengo 10 kişi kaldıktan sonra Botafogo maçı kopardı." }
  },
  {
    id: 'turn_2026_07_03',
    code: '43220',
    date: '18.07.2026',
    time: '20:30',
    month: 'Temmuz 2026',
    league: 'Allsvenskan',
    country: 'İsveç',
    homeTeam: 'Malmö FF',
    awayTeam: 'BK Häcken',
    iyScore: '0 - 1',
    msScore: '3 - 2',
    type: '2/1',
    odds: { ms1: '1.55', msX: '4.10', ms2: '4.80', turnaroundOdd: '21.00', kgVar: '1.50', ust25: '1.42' },
    details: { minuteOfWinner: "88' Thelin", note: "Bol gollü İsveç klasiğinde Malmö 2'den 1 yaptı." }
  },
  {
    id: 'turn_2026_07_04',
    code: '43350',
    date: '12.07.2026',
    time: '17:30',
    month: 'Temmuz 2026',
    league: 'Eliteserien',
    country: 'Norveç',
    homeTeam: 'Bodo/Glimt',
    awayTeam: 'Brann',
    iyScore: '1 - 0',
    msScore: '1 - 2',
    type: '1/2',
    odds: { ms1: '1.65', msX: '3.80', ms2: '4.20', turnaroundOdd: '34.00', kgVar: '1.52', ust25: '1.48' },
    details: { minuteOfWinner: "86' Finne", note: "Brann deplasmanda büyük sürpriz yaparak maçı çevirdi." }
  },

  // --- HAZİRAN 2026 ---
  {
    id: 'turn_2026_06_01',
    code: '42010',
    date: '28.06.2026',
    time: '22:00',
    month: 'Haziran 2026',
    league: 'MLS',
    country: 'ABD',
    homeTeam: 'Inter Miami',
    awayTeam: 'Columbus Crew',
    iyScore: '1 - 0',
    msScore: '1 - 2',
    type: '1/2',
    odds: { ms1: '1.75', msX: '3.60', ms2: '3.70', turnaroundOdd: '30.00', kgVar: '1.45', ust25: '1.52' },
    details: { minuteOfWinner: "82' Rossi", note: "Columbus ikinci devrede oyunu tamamen domine etti." }
  },
  {
    id: 'turn_2026_06_02',
    code: '42145',
    date: '21.06.2026',
    time: '19:00',
    month: 'Haziran 2026',
    league: 'Brasileirao Serie A',
    country: 'Brezilya',
    homeTeam: 'Palmeiras',
    awayTeam: 'Corinthians',
    iyScore: '0 - 1',
    msScore: '2 - 1',
    type: '2/1',
    odds: { ms1: '1.70', msX: '3.30', ms2: '4.40', turnaroundOdd: '23.00', kgVar: '1.85', ust25: '2.05' },
    details: { minuteOfWinner: "79' Estevao", note: "Derbide geriden gelen Palmeiras 2'den 1 zaferine ulaştı." }
  },
  {
    id: 'turn_2026_06_03',
    code: '42230',
    date: '14.06.2026',
    time: '18:00',
    month: 'Haziran 2026',
    league: 'J1 League',
    country: 'Japonya',
    homeTeam: 'Vissel Kobe',
    awayTeam: 'Kawasaki Frontale',
    iyScore: '1 - 0',
    msScore: '1 - 2',
    type: '1/2',
    odds: { ms1: '2.05', msX: '3.10', ms2: '3.15', turnaroundOdd: '28.00', kgVar: '1.68', ust25: '1.85' },
    details: { minuteOfWinner: "89' Kobayashi", note: "Kawasaki son 10 dakikada 2 gol bularak kazandı." }
  },

  // --- MAYIS 2026 ---
  {
    id: 'turn_2026_05_01',
    code: '41105',
    date: '24.05.2026',
    time: '19:00',
    month: 'Mayıs 2026',
    league: 'Trendyol Süper Lig',
    country: 'Türkiye',
    homeTeam: 'Beşiktaş',
    awayTeam: 'Çaykur Rizespor',
    iyScore: '0 - 1',
    msScore: '3 - 2',
    type: '2/1',
    odds: { ms1: '1.50', msX: '4.00', ms2: '5.20', turnaroundOdd: '22.00', kgVar: '1.55', ust25: '1.48' },
    details: { minuteOfWinner: "90+7' Semih Kılıçsoy", note: "Müthiş 5 gollü maçta Beşiktaş 90+7'de 2'den 1 yaptı." }
  },
  {
    id: 'turn_2026_05_02',
    code: '41190',
    date: '19.05.2026',
    time: '21:45',
    month: 'Mayıs 2026',
    league: 'Premier League',
    country: 'İngiltere',
    homeTeam: 'Tottenham',
    awayTeam: 'Manchester City',
    iyScore: '1 - 0',
    msScore: '1 - 2',
    type: '1/2',
    odds: { ms1: '4.50', msX: '4.20', ms2: '1.55', turnaroundOdd: '24.00', kgVar: '1.50', ust25: '1.45' },
    details: { minuteOfWinner: "72' Haaland", note: "İlk yarıyı önde kapatan Tottenham'a karşı City maçı 1'den 2 çevirdi." }
  },
  {
    id: 'turn_2026_05_03',
    code: '41260',
    date: '15.05.2026',
    time: '22:00',
    month: 'Mayıs 2026',
    league: 'La Liga',
    country: 'İspanya',
    homeTeam: 'Getafe',
    awayTeam: 'Atletico Madrid',
    iyScore: '1 - 0',
    msScore: '1 - 3',
    type: '1/2',
    odds: { ms1: '4.20', msX: '3.20', ms2: '1.80', turnaroundOdd: '27.00', kgVar: '1.95', ust25: '2.10' },
    details: { minuteOfWinner: "64' Griezmann (Hat-trick)", note: "Griezmann'ın 3 golüyle Atletico 1'den 2 yaptı." }
  },
  {
    id: 'turn_2026_05_04',
    code: '41320',
    date: '08.05.2026',
    time: '22:00',
    month: 'Mayıs 2026',
    league: 'UEFA Şampiyonlar Ligi',
    country: 'Avrupa',
    homeTeam: 'Real Madrid',
    awayTeam: 'Bayern Münih',
    iyScore: '0 - 1',
    msScore: '2 - 1',
    type: '2/1',
    odds: { ms1: '1.85', msX: '3.60', ms2: '3.50', turnaroundOdd: '23.50', kgVar: '1.55', ust25: '1.60' },
    details: { minuteOfWinner: "90+1' Joselu", note: "Real Madrid 88 ve 90+1'de attığı 2 golle unutulmaz 2'den 1 geri dönüşe imza attı." }
  },
  {
    id: 'turn_2026_05_05',
    code: '41405',
    date: '03.05.2026',
    time: '16:00',
    month: 'Mayıs 2026',
    league: 'Serie A',
    country: 'İtalya',
    homeTeam: 'Cagliari',
    awayTeam: 'Lecce',
    iyScore: '0 - 1',
    msScore: '2 - 1',
    type: '2/1',
    odds: { ms1: '2.20', msX: '3.10', ms2: '3.00', turnaroundOdd: '26.00', kgVar: '1.78', ust25: '1.95' },
    details: { minuteOfWinner: "86' Lapadula", note: "Küme düşme hattındaki kritik maçta Cagliari 2'den 1 yaptı." }
  },

  // --- NİSAN 2026 ---
  {
    id: 'turn_2026_04_01',
    code: '40090',
    date: '27.04.2026',
    time: '20:00',
    month: 'Nisan 2026',
    league: 'Trendyol Süper Lig',
    country: 'Türkiye',
    homeTeam: 'Adana Demirspor',
    awayTeam: 'Galatasaray',
    iyScore: '1 - 0',
    msScore: '1 - 3',
    type: '1/2',
    odds: { ms1: '5.20', msX: '4.40', ms2: '1.45', turnaroundOdd: '23.00', kgVar: '1.60', ust25: '1.45' },
    details: { minuteOfWinner: "64' Mertens", note: "Galatasaray ikinci devrede vitesi yükseltip 1'den 2 yaptı." }
  },
  {
    id: 'turn_2026_04_02',
    code: '40180',
    date: '21.04.2026',
    time: '18:30',
    month: 'Nisan 2026',
    league: 'Premier League',
    country: 'İngiltere',
    homeTeam: 'Fulham',
    awayTeam: 'Liverpool',
    iyScore: '1 - 0',
    msScore: '1 - 3',
    type: '1/2',
    odds: { ms1: '5.00', msX: '4.20', ms2: '1.50', turnaroundOdd: '22.50', kgVar: '1.62', ust25: '1.50' },
    details: { minuteOfWinner: "72' Jota", note: "İlk yarıyı 1-0 geride kapatan Liverpool ikinci yarıda 3 gol buldu." }
  },
  {
    id: 'turn_2026_04_03',
    code: '40250',
    date: '14.04.2026',
    time: '16:30',
    month: 'Nisan 2026',
    league: 'Bundesliga',
    country: 'Almanya',
    homeTeam: 'Borussia Mönchengladbach',
    awayTeam: 'Borussia Dortmund',
    iyScore: '1 - 0',
    msScore: '1 - 2',
    type: '1/2',
    odds: { ms1: '3.10', msX: '3.70', ms2: '1.95', turnaroundOdd: '25.00', kgVar: '1.42', ust25: '1.48' },
    details: { minuteOfWinner: "60' Sabitzer", redCard: true, note: "Dortmund 10 kişi kalmasına rağmen 1'den 2'yi korudu." }
  },
  {
    id: 'turn_2026_04_04',
    code: '40310',
    date: '07.04.2026',
    time: '20:30',
    month: 'Nisan 2026',
    league: 'Trendyol Süper Lig',
    country: 'Türkiye',
    homeTeam: 'Fenerbahçe',
    awayTeam: 'Adana Demirspor',
    iyScore: '0 - 1',
    msScore: '4 - 2',
    type: '2/1',
    odds: { ms1: '1.25', msX: '5.20', ms2: '8.00', turnaroundOdd: '21.00', kgVar: '1.65', ust25: '1.38' },
    details: { minuteOfWinner: "70' Dzeko", note: "Fenerbahçe devreye 0-1 geride girdi, maçı 4-2 kazandı." }
  },

  // --- MART 2026 ---
  {
    id: 'turn_2026_03_01',
    code: '39080',
    date: '31.03.2026',
    time: '19:00',
    month: 'Mart 2026',
    league: 'Trendyol Süper Lig',
    country: 'Türkiye',
    homeTeam: 'Trabzonspor',
    awayTeam: 'Fenerbahçe',
    iyScore: '0 - 2',
    msScore: '2 - 3',
    type: '1/2',
    odds: { ms1: '3.20', msX: '3.30', ms2: '2.00', turnaroundOdd: '28.00', kgVar: '1.65', ust25: '1.75' },
    details: { minuteOfWinner: "87' Batshuayi", note: "Olaylı derbide Fenerbahçe 87. dakikada maçı kopardı." }
  },
  {
    id: 'turn_2026_03_02',
    code: '39150',
    date: '17.03.2026',
    time: '18:30',
    month: 'Mart 2026',
    league: 'FA Cup',
    country: 'İngiltere',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    iyScore: '1 - 2',
    msScore: '4 - 3',
    type: '2/1',
    odds: { ms1: '3.60', msX: '3.80', ms2: '1.75', turnaroundOdd: '32.00', kgVar: '1.45', ust25: '1.45' },
    details: { minuteOfWinner: "120+1' Amad Diallo", note: "Tarihi maçta Man United 2'den 1 ile turladı." }
  },
  {
    id: 'turn_2026_03_03',
    code: '39220',
    date: '10.03.2026',
    time: '21:45',
    month: 'Mart 2026',
    league: 'Serie A',
    country: 'İtalya',
    homeTeam: 'Juventus',
    awayTeam: 'Atalanta',
    iyScore: '0 - 1',
    msScore: '2 - 2',
    type: '2/1',
    odds: { ms1: '2.10', msX: '3.20', ms2: '3.20', turnaroundOdd: '25.00', kgVar: '1.75', ust25: '1.90' },
    details: { minuteOfWinner: "70' Milik", note: "Yüksek tempolu maçta Juventus ikinci yarıda maçı çevirdi." }
  },
  {
    id: 'turn_2026_03_04',
    code: '39315',
    date: '03.03.2026',
    time: '17:00',
    month: 'Mart 2026',
    league: 'Premier League',
    country: 'İngiltere',
    homeTeam: 'Manchester City',
    awayTeam: 'Manchester United',
    iyScore: '0 - 1',
    msScore: '3 - 1',
    type: '2/1',
    odds: { ms1: '1.25', msX: '5.50', ms2: '9.00', turnaroundOdd: '20.00', kgVar: '1.75', ust25: '1.40' },
    details: { minuteOfWinner: "80' Foden", note: "Rashford'ın şok golüyle 0-1 geriye düşen City, Foden'ın 2 golüyle 2'den 1 yaptı." }
  },

  // --- ŞUBAT 2026 ---
  {
    id: 'turn_2026_02_01',
    code: '38090',
    date: '25.02.2026',
    time: '19:00',
    month: 'Şubat 2026',
    league: 'Trendyol Süper Lig',
    country: 'Türkiye',
    homeTeam: 'Galatasaray',
    awayTeam: 'Antalyaspor',
    iyScore: '2 - 1',
    msScore: '2 - 1',
    type: '2/1',
    odds: { ms1: '1.28', msX: '4.80', ms2: '7.50', turnaroundOdd: '22.00', kgVar: '1.70', ust25: '1.50' },
    details: { minuteOfWinner: "45+1' Kerem Aktürkoğlu", note: "Galatasaray ilk yarıda geriye düştüğü maçı ilk yarı bitmeden çevirdi." }
  },
  {
    id: 'turn_2026_02_02',
    code: '38180',
    date: '18.02.2026',
    time: '22:00',
    month: 'Şubat 2026',
    league: 'Bundesliga',
    country: 'Almanya',
    homeTeam: 'Bochum',
    awayTeam: 'Bayern Münih',
    iyScore: '2 - 1',
    msScore: '3 - 2',
    type: '2/1',
    odds: { ms1: '7.00', msX: '5.00', ms2: '1.30', turnaroundOdd: '35.00', kgVar: '1.60', ust25: '1.40' },
    details: { minuteOfWinner: "78' Stöger", redCard: true, note: "Bochum 0-1 geriye düşmesine rağmen Bayern Münih'i 3-2 devirip 35.00 oran verdi." }
  },
  {
    id: 'turn_2026_02_03',
    code: '38240',
    date: '12.02.2026',
    time: '23:00',
    month: 'Şubat 2026',
    league: 'Premier League',
    country: 'İngiltere',
    homeTeam: 'Crystal Palace',
    awayTeam: 'Chelsea',
    iyScore: '1 - 0',
    msScore: '1 - 3',
    type: '1/2',
    odds: { ms1: '3.80', msX: '3.50', ms2: '1.85', turnaroundOdd: '26.00', kgVar: '1.65', ust25: '1.75' },
    details: { minuteOfWinner: "90+1' Gallagher", note: "Chelsea 90+1 ve 90+4'te attığı 2 golle maçı 1'den 2 yaptı." }
  },
  {
    id: 'turn_2026_02_04',
    code: '38310',
    date: '04.02.2026',
    time: '19:00',
    month: 'Şubat 2026',
    league: 'La Liga',
    country: 'İspanya',
    homeTeam: 'Real Madrid',
    awayTeam: 'Atletico Madrid',
    iyScore: '1 - 0',
    msScore: '1 - 1',
    type: '1/2',
    odds: { ms1: '1.80', msX: '3.60', ms2: '3.80', turnaroundOdd: '28.00', kgVar: '1.60', ust25: '1.70' },
    details: { minuteOfWinner: "90+3' Llorente", note: "Madrid derbisinde son dakika beraberliği." }
  }
];

// İstatistiksel Özet Hesaplayıcı
export function getTurnaroundStats() {
  const total = TURNAROUND_MATCHES.length;
  const count1to2 = TURNAROUND_MATCHES.filter(m => m.type === '1/2').length;
  const count2to1 = TURNAROUND_MATCHES.filter(m => m.type === '2/1').length;
  
  const leagueCounts: Record<string, number> = {};
  TURNAROUND_MATCHES.forEach(m => {
    leagueCounts[m.league] = (leagueCounts[m.league] || 0) + 1;
  });

  const sortedLeagues = Object.entries(leagueCounts)
    .map(([league, count]) => ({ league, count }))
    .sort((a, b) => b.count - a.count);

  const avgOdds = (
    TURNAROUND_MATCHES.reduce((acc, m) => acc + parseFloat(m.odds.turnaroundOdd || '25'), 0) / total
  ).toFixed(2);

  const months = Array.from(new Set(TURNAROUND_MATCHES.map(m => m.month)));
  const leagues = Array.from(new Set(TURNAROUND_MATCHES.map(m => m.league)));

  return {
    total,
    count1to2,
    count2to1,
    topLeague: sortedLeagues[0] || { league: 'Süper Lig', count: 0 },
    sortedLeagues,
    avgOdds,
    months,
    leagues
  };
}
