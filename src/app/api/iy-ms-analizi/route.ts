import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export interface IyMsOutcomeStats {
  key: string;
  label: string;
  count: number;
  rate: number;
  isTopChoice?: boolean;
  isSurpriseValue?: boolean;
}

export interface PastSimilarMatch {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  msScore: string;
  iyScore: string;
  outcome: string;
  ms1: number;
  ms0: number;
  ms2: number;
  iy1: number;
  iy0: number;
  iy2: number;
}

export interface MatchIyMsAnalysis {
  id: string;
  code: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  status?: string;
  score?: string;
  iyScore?: string;
  actualOutcome?: string;
  isTopHit?: boolean;
  isSurpriseHit?: boolean;
  odds: {
    ms1: number;
    ms0: number;
    ms2: number;
    iy1: number;
    iy0: number;
    iy2: number;
    alt25?: string;
    ust25?: string;
    kgVar?: string;
    kgYok?: string;
  };
  openedOdds?: Record<string, string>;
  sampleSize: number;
  matchTier: 'exact_ms_iy' | 'close_ms_iy' | 'ms_only' | 'no_history';
  stats: Record<string, IyMsOutcomeStats>;
  topOutcome: IyMsOutcomeStats | null;
  surpriseOutcome: IyMsOutcomeStats | null;
  recentMatches: PastSimilarMatch[];
}

export interface IyMsPastMatch extends MatchIyMsAnalysis {
  status: string;
  score: string;
  iyScore: string;
  actualOutcome: string;
  isTopHit: boolean;
  isSurpriseHit: boolean;
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'iy_ms_cache.json');
const PUBLIC_CACHE_FILE = path.join(process.cwd(), 'public', 'data', 'iy_ms_cache.json');

function loadCacheFromDisk() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
    if (fs.existsSync(PUBLIC_CACHE_FILE)) {
      const raw = fs.readFileSync(PUBLIC_CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
}

const OUTCOME_KEYS = ['1/1', 'X/1', '2/1', '1/X', 'X/X', '2/X', '1/2', 'X/2', '2/2'];

function calculateOutcomeFromScores(iyScore: string, msScore: string): string | null {
  if (!iyScore || !msScore) return null;
  const iyClean = iyScore.replace('İY:', '').trim();
  const msClean = msScore.replace('MS:', '').trim();
  const iyParts = iyClean.split(/[-:]/).map(s => parseInt(s.trim(), 10));
  const msParts = msClean.split(/[-:]/).map(s => parseInt(s.trim(), 10));

  if (iyParts.length !== 2 || msParts.length !== 2 || isNaN(iyParts[0]) || isNaN(iyParts[1]) || isNaN(msParts[0]) || isNaN(msParts[1])) {
    return null;
  }

  const iyOutcome = iyParts[0] > iyParts[1] ? '1' : (iyParts[0] === iyParts[1] ? 'X' : '2');
  const msOutcome = msParts[0] > msParts[1] ? '1' : (msParts[0] === msParts[1] ? 'X' : '2');

  return `${iyOutcome}/${msOutcome}`;
}

async function analyzeOddsPattern(odds: { ms1: number; ms0: number; ms2: number; iy1: number; iy0: number; iy2: number }): Promise<{
  sampleSize: number;
  matchTier: 'exact_ms_iy' | 'close_ms_iy' | 'ms_only' | 'no_history';
  stats: Record<string, IyMsOutcomeStats>;
  topOutcome: IyMsOutcomeStats | null;
  surpriseOutcome: IyMsOutcomeStats | null;
  recentMatches: PastSimilarMatch[];
}> {
  const emptyStats: Record<string, IyMsOutcomeStats> = {};
  OUTCOME_KEYS.forEach(k => {
    emptyStats[k] = { key: k, label: k, count: 0, rate: 0 };
  });

  if (!supabase) {
    return {
      sampleSize: 0,
      matchTier: 'no_history',
      stats: emptyStats,
      topOutcome: null,
      surpriseOutcome: null,
      recentMatches: []
    };
  }

  const { ms1, ms0, ms2, iy1, iy0, iy2 } = odds;
  if (!ms1 && !ms0 && !ms2) {
    return {
      sampleSize: 0,
      matchTier: 'no_history',
      stats: emptyStats,
      topOutcome: null,
      surpriseOutcome: null,
      recentMatches: []
    };
  }

  try {
    const tolMS = 0.08;
    const tolIY = 0.16;

    let q = supabase
      .from('past_matches')
      .select('id, match_date, home_team, away_team, league, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, iy_1_odd, iy_0_odd, iy_2_odd')
      .not('ms_score', 'is', null)
      .not('iy_score', 'is', null);

    if (ms1 > 0) q = q.gte('ms_1_odd', ms1 - tolMS).lte('ms_1_odd', ms1 + tolMS);
    if (ms0 > 0) q = q.gte('ms_0_odd', ms0 - tolMS).lte('ms_0_odd', ms0 + tolMS);
    if (ms2 > 0) q = q.gte('ms_2_odd', ms2 - tolMS).lte('ms_2_odd', ms2 + tolMS);

    const { data: rawMsData, error } = await q.order('match_date', { ascending: false }).limit(300);

    if (error || !rawMsData || rawMsData.length === 0) {
      return {
        sampleSize: 0,
        matchTier: 'no_history',
        stats: emptyStats,
        topOutcome: null,
        surpriseOutcome: null,
        recentMatches: []
      };
    }

    const exactMsIy: any[] = [];
    const closeMsIy: any[] = [];

    rawMsData.forEach((row: any) => {
      let iyMatchExact = true;
      let iyMatchClose = true;

      if (iy1 > 0 && row.iy_1_odd) {
        const d = Math.abs(row.iy_1_odd - iy1);
        if (d > 0.06) iyMatchExact = false;
        if (d > tolIY) iyMatchClose = false;
      }
      if (iy0 > 0 && row.iy_0_odd) {
        const d = Math.abs(row.iy_0_odd - iy0);
        if (d > 0.06) iyMatchExact = false;
        if (d > tolIY) iyMatchClose = false;
      }
      if (iy2 > 0 && row.iy_2_odd) {
        const d = Math.abs(row.iy_2_odd - iy2);
        if (d > 0.06) iyMatchExact = false;
        if (d > tolIY) iyMatchClose = false;
      }

      if (iyMatchExact) exactMsIy.push(row);
      if (iyMatchClose) closeMsIy.push(row);
    });

    let targetMatches: any[] = [];
    let matchTier: 'exact_ms_iy' | 'close_ms_iy' | 'ms_only' | 'no_history' = 'no_history';

    if (exactMsIy.length >= 5) {
      targetMatches = exactMsIy;
      matchTier = 'exact_ms_iy';
    } else if (closeMsIy.length >= 4) {
      targetMatches = closeMsIy;
      matchTier = 'close_ms_iy';
    } else {
      targetMatches = rawMsData;
      matchTier = 'ms_only';
    }

    const counts: Record<string, number> = {
      '1/1': 0, 'X/1': 0, '2/1': 0,
      '1/X': 0, 'X/X': 0, '2/X': 0,
      '1/2': 0, 'X/2': 0, '2/2': 0
    };

    const recentMatchesList: PastSimilarMatch[] = [];
    let validCount = 0;

    targetMatches.forEach((m: any) => {
      const outcome = calculateOutcomeFromScores(m.iy_score, m.ms_score);
      if (!outcome || counts[outcome] === undefined) return;

      counts[outcome]++;
      validCount++;

      if (recentMatchesList.length < 10) {
        recentMatchesList.push({
          id: m.id || `${m.home_team}-${m.match_date}`,
          date: m.match_date,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          league: m.league,
          msScore: m.ms_score,
          iyScore: m.iy_score,
          outcome,
          ms1: m.ms_1_odd,
          ms0: m.ms_0_odd,
          ms2: m.ms_2_odd,
          iy1: m.iy_1_odd,
          iy0: m.iy_0_odd,
          iy2: m.iy_2_odd
        });
      }
    });

    const finalStats: Record<string, IyMsOutcomeStats> = {};
    let topChoice: IyMsOutcomeStats | null = null;
    let surpriseValueChoice: IyMsOutcomeStats | null = null;
    let maxRate = -1;
    let maxSurpriseRate = -1;

    OUTCOME_KEYS.forEach((key) => {
      const cnt = counts[key] || 0;
      const rate = validCount > 0 ? Math.round((cnt / validCount) * 100) : 0;
      const item: IyMsOutcomeStats = {
        key,
        label: key,
        count: cnt,
        rate
      };

      if (rate > maxRate && cnt > 0) {
        maxRate = rate;
        topChoice = item;
      }

      const isSurprise = ['1/X', '2/X', '1/2', '2/1'].includes(key);
      if (isSurprise && rate >= 12 && cnt >= 2 && rate > maxSurpriseRate) {
        maxSurpriseRate = rate;
        surpriseValueChoice = item;
      }

      finalStats[key] = item;
    });

    if (topChoice) {
      finalStats[(topChoice as any).key].isTopChoice = true;
    }
    if (surpriseValueChoice) {
      finalStats[(surpriseValueChoice as any).key].isSurpriseValue = true;
    }

    return {
      sampleSize: validCount,
      matchTier,
      stats: finalStats,
      topOutcome: topChoice,
      surpriseOutcome: surpriseValueChoice,
      recentMatches: recentMatchesList
    };
  } catch (err) {
    return {
      sampleSize: 0,
      matchTier: 'no_history',
      stats: emptyStats,
      topOutcome: null,
      surpriseOutcome: null,
      recentMatches: []
    };
  }
}

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const cachedData = loadCacheFromDisk();
    if (cachedData && cachedData.matches && cachedData.matches.length > 0) {
      // STRICT FILTER: Sadece gerçek İddaa İY/MS oranları açılmış ve İY/MS oranları eksiksiz olan maçlar
      const isStrictValidMatch = (m: any) => {
        if (!m.odds?.ms1 || !m.odds?.ms0 || !m.odds?.ms2) return false;
        if (!m.odds?.iy1 || !m.odds?.iy0 || !m.odds?.iy2) return false;
        if (m.odds.ms1 <= 1.01 || m.odds.ms0 <= 1.01 || m.odds.ms2 <= 1.01) return false;
        if (m.odds.iy1 <= 1.01 || m.odds.iy0 <= 1.01 || m.odds.iy2 <= 1.01) return false;
        if (!m.openedOdds) return false;
        const validCount = Object.values(m.openedOdds).filter((v: any) => v && v !== '-' && v !== '0,00' && v !== '0.00' && v !== '0').length;
        if (validCount < 7) return false;
        if ((m.sampleSize || 0) < 1) return false;
        return true;
      };

      const validUpcoming = (cachedData.matches || []).filter(isStrictValidMatch);
      const validPast = (cachedData.pastMatches || []).filter(isStrictValidMatch);

      const dateSet = new Set<string>();
      const leagueSet = new Set<string>();
      validUpcoming.forEach((m: any) => {
        if (m.date) dateSet.add(m.date);
        if (m.league) leagueSet.add(m.league);
      });

      const sortedDates = Array.from(dateSet).sort((a, b) => {
        const [d1, m1, y1] = a.split('.').map(Number);
        const [d2, m2, y2] = b.split('.').map(Number);
        return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
      });

      const responsePayload = {
        success: true,
        timestamp: cachedData.timestamp || Date.now(),
        availableDates: sortedDates,
        availableLeagues: Array.from(leagueSet).sort(),
        stats: {
          totalAnalyzed: validUpcoming.length,
          highConfidenceCount: validUpcoming.filter((m: any) => (m.topOutcome?.rate || 0) >= 45).length,
          surpriseCount: validUpcoming.filter((m: any) => !!m.surpriseOutcome).length
        },
        matches: validUpcoming,
        pastStats: cachedData.pastStats,
        pastMatches: validPast
      };

      return NextResponse.json(responsePayload, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      availableDates: [],
      availableLeagues: [],
      stats: { totalAnalyzed: 0, highConfidenceCount: 0, surpriseCount: 0 },
      matches: [],
      pastMatches: []
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ms1 = parseFloat(String(body.ms1 || '').replace(',', '.')) || 0;
    const ms0 = parseFloat(String(body.ms0 || body.msX || '').replace(',', '.')) || 0;
    const ms2 = parseFloat(String(body.ms2 || '').replace(',', '.')) || 0;
    const iy1 = parseFloat(String(body.iy1 || '').replace(',', '.')) || 0;
    const iy0 = parseFloat(String(body.iy0 || body.iyX || '').replace(',', '.')) || 0;
    const iy2 = parseFloat(String(body.iy2 || '').replace(',', '.')) || 0;

    const analysis = await analyzeOddsPattern({ ms1, ms0, ms2, iy1, iy0, iy2 });

    return NextResponse.json({
      success: true,
      odds: { ms1, ms0, ms2, iy1, iy0, iy2 },
      ...analysis
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
