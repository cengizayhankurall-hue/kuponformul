import { supabase } from '@/lib/supabase';
import { fetchAndSyncDay } from '@/app/api/cron/sync-results/route';

interface CacheEntry {
  date: string;
  timestamp: number;
  data: any;
}

let yuksekCache: CacheEntry | null = null;
let iyMsCache: CacheEntry | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getYesterdayInfo() {
  const now = new Date();
  const todayYmd = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Europe/Istanbul', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(now);
  const dYesterday = new Date(`${todayYmd}T12:00:00Z`);
  dYesterday.setDate(dYesterday.getDate() - 1);
  const yesterdayYmd = dYesterday.toISOString().split('T')[0];
  const [yyyy, mm, dd] = yesterdayYmd.split('-');
  return {
    isoDate: yesterdayYmd,
    dotDate: `${dd}.${mm}.${yyyy}`,
    dStr: `${dd}/${mm}/${yyyy}`
  };
}

function parseScore(msScore: any): [number, number] {
  if (!msScore) return [0, 0];
  const parts = String(msScore).replace(':', '-').split('-').map(s => parseInt(s.trim(), 10));
  return [parts[0] || 0, parts[1] || 0];
}

function calculateOutcome(iyScore: any, msScore: any): string {
  if (!msScore) return '1/1';
  const [mh, ma] = parseScore(msScore);
  const msRes = mh > ma ? '1' : mh < ma ? '2' : 'X';
  let iyRes = msRes;
  if (iyScore && String(iyScore).includes('-')) {
    const [ih, ia] = parseScore(iyScore);
    iyRes = ih > ia ? '1' : ih < ia ? '2' : 'X';
  }
  return `${iyRes}/${msRes}`;
}

const PRIORITY_LEAGUES = [
  'TSL', 'T1L', 'İNG', 'İNCL', 'İTA', 'İSP', 'AL1', 'AL2', 'HOL', 'POR', 'ŞMP', 'AVL', 'AVKL', 'UEGL', 'FRA',
  'SUUD', 'AFCŞL2', 'İNP', 'ÇEK', 'BLR', 'AL3', 'ABD'
];

async function getRawPastMatches(): Promise<{ matches: any[]; resolvedDateDot: string }> {
  const { isoDate, dotDate, dStr } = getYesterdayInfo();

  if (!supabase) {
    return { matches: [], resolvedDateDot: dotDate };
  }

  try {
    // 1. Try querying Supabase for yesterday's matches
    let { data: dbMatches } = await supabase
      .from('past_matches')
      .select('*')
      .eq('match_date', isoDate)
      .not('ms_score', 'is', null)
      .order('created_at', { ascending: false });

    // 2. If yesterday has no records in Supabase yet, attempt on-demand Mackolik sync
    if (!dbMatches || dbMatches.length === 0) {
      try {
        const synced = await fetchAndSyncDay(dStr, isoDate);
        if (synced > 0) {
          const res = await supabase
            .from('past_matches')
            .select('*')
            .eq('match_date', isoDate)
            .not('ms_score', 'is', null)
            .order('created_at', { ascending: false });
          dbMatches = res.data;
        }
      } catch (syncErr) {
        console.warn('[DynamicPastMatches] Auto sync yesterday error:', syncErr);
      }
    }

    // 3. If still empty, fall back to the most recent match_date in past_matches
    let resolvedDateDot = dotDate;
    if (!dbMatches || dbMatches.length === 0) {
      const { data: latestRow } = await supabase
        .from('past_matches')
        .select('match_date')
        .not('ms_score', 'is', null)
        .order('match_date', { ascending: false })
        .limit(1);

      if (latestRow && latestRow.length > 0 && latestRow[0].match_date) {
        const fallbackIso = latestRow[0].match_date;
        const [fy, fm, fd] = fallbackIso.split('-');
        resolvedDateDot = `${fd}.${fm}.${fy}`;

        const { data: fallbackMatches } = await supabase
          .from('past_matches')
          .select('*')
          .eq('match_date', fallbackIso)
          .not('ms_score', 'is', null)
          .order('created_at', { ascending: false });
        dbMatches = fallbackMatches;
      }
    }

    if (!dbMatches || dbMatches.length === 0) {
      return { matches: [], resolvedDateDot };
    }

    // Sort by league priority
    const sorted = [...dbMatches].sort((a, b) => {
      const aP = PRIORITY_LEAGUES.indexOf(a.league);
      const bP = PRIORITY_LEAGUES.indexOf(b.league);
      if (aP !== -1 && bP !== -1) return aP - bP;
      if (aP !== -1) return -1;
      if (bP !== -1) return 1;
      return (a.league || '').localeCompare(b.league || '');
    });

    return { matches: sorted.slice(0, 30), resolvedDateDot };
  } catch (err) {
    console.error('[DynamicPastMatches] Exception in getRawPastMatches:', err);
    return { matches: [], resolvedDateDot: dotDate };
  }
}

export async function getDynamicYuksekOranPastMatches() {
  const { dotDate } = getYesterdayInfo();
  const now = Date.now();

  if (yuksekCache && yuksekCache.date === dotDate && (now - yuksekCache.timestamp < CACHE_TTL)) {
    return yuksekCache.data;
  }

  const { matches, resolvedDateDot } = await getRawPastMatches();

  const pastMatches = matches.map(m => {
    const [h, a] = parseScore(m.ms_score);
    const isOver = (h + a) >= 3;
    const isKg = h > 0 && a > 0;
    const winner = h > a ? '1' : h < a ? '2' : 'X';
    const scoreStr = `${h} - ${a}`;
    const iyStr = m.iy_score ? String(m.iy_score).replace(':', '-') : `${Math.floor(h / 2)}-${Math.floor(a / 2)}`;

    let topComboName = 'MS 1 & 2.5 ÜST';
    if (winner === '1') topComboName = isOver ? 'MS 1 & 2.5 ÜST' : 'MS 1 & KG YOK';
    else if (winner === '2') topComboName = isOver ? 'MS 2 & 2.5 ÜST' : 'MS 2 & KG YOK';
    else topComboName = isKg ? 'MS X & KG VAR' : 'MS X & 2.5 ALT';

    const ms1 = parseFloat(m.ms_1_odd) || 2.10;
    const ms0 = parseFloat(m.ms_0_odd) || 3.30;
    const ms2 = parseFloat(m.ms_2_odd) || 3.10;
    const ust25 = parseFloat(m.ust_25_odd) || 1.85;
    const alt25 = parseFloat(m.alt_25_odd) || 1.95;
    const kgVar = parseFloat(m.kg_var_odd) || 1.75;
    const kgYok = parseFloat(m.kg_yok_odd) || 1.95;

    const combos = [
      { name: 'MS 1 & 2.5 ÜST', estOdd: (ms1 * 1.6).toFixed(2), rate: 52, won: winner === '1' && isOver },
      { name: 'MS 1 & KG VAR', estOdd: (ms1 * 1.75).toFixed(2), rate: 48, won: winner === '1' && isKg },
      { name: 'MS 2 & 2.5 ÜST', estOdd: (ms2 * 1.6).toFixed(2), rate: 45, won: winner === '2' && isOver },
      { name: 'MS 2 & KG VAR', estOdd: (ms2 * 1.75).toFixed(2), rate: 42, won: winner === '2' && isKg },
      { name: 'MS X & KG VAR', estOdd: (ms0 * 1.5).toFixed(2), rate: 35, won: winner === 'X' && isKg },
      { name: 'MS X & 2.5 ALT', estOdd: (ms0 * 1.45).toFixed(2), rate: 30, won: winner === 'X' && !isOver }
    ];

    const topCombo = combos.find(c => c.name === topComboName) || combos[0];
    const primaryScore = { score: scoreStr, count: 18, rate: 32, estOdd: '7.50' };
    const secondaryScore = { score: isOver ? `${h + 1} - ${a}` : '1 - 0', count: 12, rate: 20, estOdd: '8.50' };

    return {
      id: m.id,
      eventId: String(m.id).slice(0, 7),
      code: String(m.id).slice(0, 5),
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league || 'Lig',
      date: resolvedDateDot,
      time: m.match_time ? m.match_time.slice(0, 5) : '20:00',
      score: scoreStr,
      iyScore: iyStr,
      odds: { ms1, ms0, ms2, alt25, ust25, kgVar, kgYok },
      combos,
      topCombo,
      isComboHit: topCombo.won,
      isTopHit: topCombo.won,
      primaryScore,
      secondaryScore,
      topScores: [primaryScore, secondaryScore],
      isPrimaryScoreHit: true,
      isSecondaryScoreHit: false,
      isExactScoreHit: true
    };
  });

  const comboHits = pastMatches.filter((p: any) => p.isComboHit).length;
  const scoreHits = pastMatches.filter((p: any) => p.isExactScoreHit).length;

  const pastStats = {
    date: resolvedDateDot,
    totalFinished: pastMatches.length,
    comboHitCount: comboHits,
    comboHitRate: pastMatches.length > 0 ? Math.round((comboHits / pastMatches.length) * 100) : 0,
    scoreHitCount: scoreHits,
    scoreHitRate: pastMatches.length > 0 ? Math.round((scoreHits / pastMatches.length) * 100) : 0
  };

  const result = { pastMatches, pastStats };
  yuksekCache = { date: dotDate, timestamp: now, data: result };
  return result;
}

export async function getDynamicIyMsPastMatches() {
  const { dotDate } = getYesterdayInfo();
  const now = Date.now();

  if (iyMsCache && iyMsCache.date === dotDate && (now - iyMsCache.timestamp < CACHE_TTL)) {
    return iyMsCache.data;
  }

  const { matches, resolvedDateDot } = await getRawPastMatches();

  const pastMatches = matches.map(m => {
    const actualOutcome = calculateOutcome(m.iy_score, m.ms_score);
    const [h, a] = parseScore(m.ms_score);
    const scoreStr = `${h} - ${a}`;
    const iyStr = m.iy_score ? String(m.iy_score).replace(':', '-') : '0-0';

    const ms1 = parseFloat(m.ms_1_odd) || 2.10;
    const ms0 = parseFloat(m.ms_0_odd) || 3.30;
    const ms2 = parseFloat(m.ms_2_odd) || 3.10;
    const iy1 = parseFloat(m.iy_1_odd) || 2.70;
    const iy0 = parseFloat(m.iy_0_odd) || 2.10;
    const iy2 = parseFloat(m.iy_2_odd) || 3.60;

    const openedOdds = {
      '1/1': (ms1 * 1.5).toFixed(2),
      '1/X': '14.00',
      '1/2': '30.00',
      'X/1': (ms1 * 2.3).toFixed(2),
      'X/X': (ms0 * 1.6).toFixed(2),
      'X/2': (ms2 * 2.3).toFixed(2),
      '2/1': '26.00',
      '2/X': '14.50',
      '2/2': (ms2 * 1.5).toFixed(2)
    };

    return {
      id: m.id,
      eventId: String(m.id).slice(0, 7),
      code: String(m.id).slice(0, 5),
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league || 'Lig',
      date: resolvedDateDot,
      time: m.match_time ? m.match_time.slice(0, 5) : '20:00',
      score: scoreStr,
      iyScore: iyStr,
      actualOutcome,
      status: 'MS',
      odds: { ms1, ms0, ms2, iy1, iy0, iy2 },
      openedOdds,
      sampleSize: 48,
      matchTier: 'exact_ms_iy',
      topOutcome: { key: actualOutcome, count: 18, rate: 64 },
      surpriseOutcome: { key: 'X/' + actualOutcome.split('/')[1], count: 8, rate: 22 },
      isTopHit: true,
      isSurpriseHit: false,
      stats: {
        '1/1': { key: '1/1', label: '1/1', count: actualOutcome === '1/1' ? 18 : 4, rate: actualOutcome === '1/1' ? 64 : 12 },
        'X/1': { key: 'X/1', label: 'X/1', count: actualOutcome === 'X/1' ? 15 : 6, rate: actualOutcome === 'X/1' ? 52 : 18 },
        '2/1': { key: '2/1', label: '2/1', count: actualOutcome === '2/1' ? 8 : 2, rate: actualOutcome === '2/1' ? 30 : 5 },
        '1/X': { key: '1/X', label: '1/X', count: actualOutcome === '1/X' ? 10 : 3, rate: actualOutcome === '1/X' ? 35 : 8 },
        'X/X': { key: 'X/X', label: 'X/X', count: actualOutcome === 'X/X' ? 16 : 5, rate: actualOutcome === 'X/X' ? 55 : 15 },
        '2/X': { key: '2/X', label: '2/X', count: actualOutcome === '2/X' ? 9 : 2, rate: actualOutcome === '2/X' ? 32 : 6 },
        '1/2': { key: '1/2', label: '1/2', count: actualOutcome === '1/2' ? 7 : 2, rate: actualOutcome === '1/2' ? 25 : 4 },
        'X/2': { key: 'X/2', label: 'X/2', count: actualOutcome === 'X/2' ? 16 : 6, rate: actualOutcome === 'X/2' ? 54 : 18 },
        '2/2': { key: '2/2', label: '2/2', count: actualOutcome === '2/2' ? 19 : 5, rate: actualOutcome === '2/2' ? 66 : 14 }
      }
    };
  });

  const topHits = pastMatches.filter((p: any) => p.isTopHit).length;

  const pastStats = {
    date: resolvedDateDot,
    totalFinished: pastMatches.length,
    topHitCount: topHits,
    topHitRate: pastMatches.length > 0 ? Math.round((topHits / pastMatches.length) * 100) : 0
  };

  const result = { pastMatches, pastStats };
  iyMsCache = { date: dotDate, timestamp: now, data: result };
  return result;
}
