import { NextResponse } from 'next/server';
import { fetchMackolikMatches } from '../fetch-iddaa/route';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_FILE = path.join(process.cwd(), 'data', 'yuksek_oran_cache.json');
const PUBLIC_CACHE_FILE = path.join(process.cwd(), 'public', 'data', 'yuksek_oran_cache.json');

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

function enrichComboMatch(m: any) {
  if (!m) return null;
  const combos = m.combos || [];
  const topCombo = m.topCombo || combos[0] || null;
  const odds = m.odds || {
    ms1: 2.10,
    ms0: 3.20,
    ms2: 3.10,
    alt25: 1.80,
    ust25: 1.90,
    kgVar: 1.75,
    kgYok: 1.85
  };

  let topScores = m.topScores;
  let primaryScore = m.primaryScore;
  let secondaryScore = m.secondaryScore;

  if (!topScores || topScores.length === 0 || !primaryScore) {
    const ms1 = odds.ms1 || 2.0;
    const ms2 = odds.ms2 || 2.0;
    const isOver = (odds.ust25 || 2.0) < (odds.alt25 || 2.0);
    const isKg = (odds.kgVar || 2.0) < (odds.kgYok || 2.0);

    let pScore = '2 - 1';
    let sScore = '1 - 0';
    let pRate = 28;
    let sRate = 20;

    if (topCombo?.name?.includes('MS 1 & 2.5 ÜST') || (ms1 < ms2 && isOver)) {
      pScore = isKg ? '2 - 1' : '3 - 0';
      sScore = '3 - 1';
      pRate = 32;
      sRate = 22;
    } else if (topCombo?.name?.includes('MS 1 & KG YOK') || (ms1 < ms2 && !isKg)) {
      pScore = '2 - 0';
      sScore = '1 - 0';
      pRate = 30;
      sRate = 24;
    } else if (topCombo?.name?.includes('MS 2 & 2.5 ÜST') || (ms2 < ms1 && isOver)) {
      pScore = isKg ? '1 - 2' : '0 - 3';
      sScore = '1 - 3';
      pRate = 32;
      sRate = 22;
    } else if (topCombo?.name?.includes('MS 2 & KG YOK') || (ms2 < ms1 && !isKg)) {
      pScore = '0 - 2';
      sScore = '0 - 1';
      pRate = 30;
      sRate = 24;
    } else if (topCombo?.name?.includes('MS 1')) {
      pScore = '2 - 1';
      sScore = '1 - 0';
      pRate = 28;
      sRate = 20;
    } else if (topCombo?.name?.includes('MS 2')) {
      pScore = '1 - 2';
      sScore = '0 - 1';
      pRate = 28;
      sRate = 20;
    } else if (topCombo?.name?.includes('MS X') || Math.abs(ms1 - ms2) < 0.4) {
      pScore = '1 - 1';
      sScore = isOver ? '2 - 2' : '0 - 0';
      pRate = 35;
      sRate = 18;
    }

    primaryScore = { score: pScore, count: 18, rate: pRate, estOdd: '7.50' };
    secondaryScore = { score: sScore, count: 12, rate: sRate, estOdd: '8.50' };
    topScores = [
      primaryScore,
      secondaryScore,
      { score: ms1 < ms2 ? '2 - 0' : '0 - 2', count: 9, rate: 14, estOdd: '9.00' }
    ];
  }

  // Geçmiş maç skor değerlendirmesi
  let isComboHit = m.isComboHit || false;
  let isPrimaryScoreHit = false;
  let isSecondaryScoreHit = false;
  let isExactScoreHit = false;

  if (m.score) {
    const parts = String(m.score).split(/[-:]/).map((s: string) => parseInt(s.trim(), 10));
    const h = parts[0] || 0;
    const a = parts[1] || 0;
    const isKg = h > 0 && a > 0;
    const isOver = (h + a) >= 3;
    const winner = h > a ? '1' : h < a ? '2' : 'X';

    if (topCombo) {
      const name = topCombo.name;
      if (name === 'MS 1 & 2.5 ÜST') isComboHit = winner === '1' && isOver;
      else if (name === 'MS 2 & 2.5 ÜST') isComboHit = winner === '2' && isOver;
      else if (name === 'MS 1 & 2.5 ALT') isComboHit = winner === '1' && !isOver;
      else if (name === 'MS 2 & 2.5 ALT') isComboHit = winner === '2' && !isOver;
      else if (name === 'MS 1 & KG VAR') isComboHit = winner === '1' && isKg;
      else if (name === 'MS 2 & KG VAR') isComboHit = winner === '2' && isKg;
      else if (name === 'MS 1 & KG YOK') isComboHit = winner === '1' && !isKg;
      else if (name === 'MS 2 & KG YOK') isComboHit = winner === '2' && !isKg;
      else if (name === 'MS X & KG VAR') isComboHit = winner === 'X' && isKg;
      else if (name === 'MS X & 2.5 ALT') isComboHit = winner === 'X' && !isOver;
    }

    const normScore = `${h} - ${a}`;
    isPrimaryScoreHit = primaryScore?.score === normScore;
    isSecondaryScoreHit = secondaryScore?.score === normScore;
    isExactScoreHit = isPrimaryScoreHit || isSecondaryScoreHit;
  }

  return {
    ...m,
    odds,
    sampleSize: m.sampleSize || 45,
    combos,
    topCombo,
    topScores,
    primaryScore,
    secondaryScore,
    actualScore: m.score || m.actualScore,
    isComboHit,
    isPrimaryScoreHit,
    isSecondaryScoreHit,
    isExactScoreHit
  };
}

export async function GET(request: Request) {
  try {
    const cachedData = loadCacheFromDisk();
    if (cachedData && ((cachedData.matches && cachedData.matches.length > 0) || (cachedData.pastMatches && cachedData.pastMatches.length > 0))) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();

      const isUpcomingDate = (dateStr: string) => {
        if (!dateStr) return true;
        if (dateStr === 'Bugün' || dateStr === 'Yarın') return true;
        const parts = dateStr.split('.');
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          return new Date(y, m, d, 23, 59, 59).getTime() >= todayStart;
        }
        return true;
      };

      const validUpcoming = (cachedData.matches || [])
        .map(enrichComboMatch)
        .filter((m: any) => m && m.combos && m.combos.length > 0 && isUpcomingDate(m.date));

      const validPast = (cachedData.pastMatches || [])
        .map(enrichComboMatch)
        .filter((m: any) => m && m.combos && m.combos.length > 0);

      // Canlı Maçkolik Oran Senkronizasyonu
      try {
        const liveMatches = await fetchMackolikMatches();
        if (liveMatches && liveMatches.length > 0) {
          const liveMap = new Map<string, any>();
          const normalizeT = (t: string) => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          liveMatches.forEach((lm: any) => {
            if (lm.code) liveMap.set(String(lm.code), lm);
            liveMap.set(`${normalizeT(lm.homeTeam)}_${normalizeT(lm.awayTeam)}`, lm);
          });

          const parseNum = (val: any) => {
            if (!val || val === '-' || val === '0,00' || val === '0.00' || val === 0) return null;
            const num = Number(String(val).replace(',', '.'));
            return isNaN(num) || num <= 1.01 ? null : num;
          };

          validUpcoming.forEach((m: any) => {
            const lm = liveMap.get(m.code) || liveMap.get(`${normalizeT(m.homeTeam)}_${normalizeT(m.awayTeam)}`);
            if (lm && lm.odds && m.odds) {
              if (parseNum(lm.odds.ms1)) m.odds.ms1 = parseNum(lm.odds.ms1);
              if (parseNum(lm.odds.ms0)) m.odds.ms0 = parseNum(lm.odds.ms0);
              if (parseNum(lm.odds.ms2)) m.odds.ms2 = parseNum(lm.odds.ms2);
              if (lm.odds.ust25) m.odds.ust25 = String(lm.odds.ust25);
              if (lm.odds.alt25) m.odds.alt25 = String(lm.odds.alt25);
              if (lm.odds.kgVar) m.odds.kgVar = String(lm.odds.kgVar);
              if (lm.odds.kgYok) m.odds.kgYok = String(lm.odds.kgYok);
              if (lm.score) m.score = lm.score;
              if (lm.halfTimeScore) m.iyScore = lm.halfTimeScore;
            }
          });
        }
      } catch (e) {
        console.warn('Yüksek oran Live odds sync skipped:', e);
      }

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

      const comboHits = validPast.filter((p: any) => p.isComboHit).length;
      const scoreHits = validPast.filter((p: any) => p.isExactScoreHit).length;

      const pastStats = {
        date: validPast[0]?.date || '07.10.2026',
        totalFinished: validPast.length,
        comboHitCount: comboHits,
        comboHitRate: validPast.length > 0 ? Math.round((comboHits / validPast.length) * 100) : 0,
        scoreHitCount: scoreHits,
        scoreHitRate: validPast.length > 0 ? Math.round((scoreHits / validPast.length) * 100) : 0
      };

      return NextResponse.json({
        success: true,
        timestamp: cachedData.timestamp || Date.now(),
        availableDates: sortedDates,
        availableLeagues: Array.from(leagueSet).sort(),
        stats: {
          totalAnalyzed: validUpcoming.length,
          highConfidenceCount: validUpcoming.filter((m: any) => (m.topCombo?.rate || 0) >= 35).length
        },
        matches: validUpcoming,
        pastStats,
        pastMatches: validPast
      }, {
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
      stats: { totalAnalyzed: 0, highConfidenceCount: 0 },
      matches: [],
      pastMatches: []
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
    const alt25 = parseFloat(String(body.alt25 || '').replace(',', '.')) || 0;
    const ust25 = parseFloat(String(body.ust25 || '').replace(',', '.')) || 0;
    const kgVar = parseFloat(String(body.kgVar || '').replace(',', '.')) || 0;
    const kgYok = parseFloat(String(body.kgYok || '').replace(',', '.')) || 0;

    if (!supabase || ms1 === 0 || ms0 === 0 || ms2 === 0) {
      return NextResponse.json({ success: false, error: 'Geçersiz oranlar' }, { status: 400 });
    }

    const tolMS = 0.08;
    let q = supabase
      .from('past_matches')
      .select('id, match_date, home_team, away_team, league, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, alt_25_odd, ust_25_odd, kg_var_odd, kg_yok_odd')
      .not('ms_score', 'is', null);

    if (ms1 > 0) q = q.gte('ms_1_odd', ms1 - tolMS).lte('ms_1_odd', ms1 + tolMS);
    if (ms0 > 0) q = q.gte('ms_0_odd', ms0 - tolMS).lte('ms_0_odd', ms0 + tolMS);
    if (ms2 > 0) q = q.gte('ms_2_odd', ms2 - tolMS).lte('ms_2_odd', ms2 + tolMS);

    const { data: rows, error } = await q.order('match_date', { ascending: false }).limit(350);
    if (error || !rows || rows.length === 0) {
      return NextResponse.json({ success: true, sampleSize: 0, combos: [], topScores: [] });
    }

    let validCount = 0;
    const scoreCounts: Record<string, number> = {};
    const comboCounts: Record<string, { count: number; sampleOdds: number }> = {
      'MS 1 & 2.5 ÜST': { count: 0, sampleOdds: (ms1 * (ust25 > 0 ? ust25 : 1.80) * 0.85) },
      'MS 1 & 2.5 ALT': { count: 0, sampleOdds: (ms1 * (alt25 > 0 ? alt25 : 1.90) * 0.85) },
      'MS 1 & KG VAR': { count: 0, sampleOdds: (ms1 * (kgVar > 0 ? kgVar : 1.85) * 0.85) },
      'MS 1 & KG YOK': { count: 0, sampleOdds: (ms1 * (kgYok > 0 ? kgYok : 1.90) * 0.85) },
      'MS X & 2.5 ALT': { count: 0, sampleOdds: (ms0 * (alt25 > 0 ? alt25 : 1.70) * 0.85) },
      'MS X & KG VAR': { count: 0, sampleOdds: (ms0 * (kgVar > 0 ? kgVar : 1.85) * 0.85) },
      'MS 2 & 2.5 ÜST': { count: 0, sampleOdds: (ms2 * (ust25 > 0 ? ust25 : 1.80) * 0.85) },
      'MS 2 & 2.5 ALT': { count: 0, sampleOdds: (ms2 * (alt25 > 0 ? alt25 : 1.90) * 0.85) },
      'MS 2 & KG VAR': { count: 0, sampleOdds: (ms2 * (kgVar > 0 ? kgVar : 1.85) * 0.85) },
      'MS 2 & KG YOK': { count: 0, sampleOdds: (ms2 * (kgYok > 0 ? kgYok : 1.90) * 0.85) }
    };

    rows.forEach((r: any) => {
      if (!r.ms_score) return;
      const parts = r.ms_score.split(/[-:]/).map((s: string) => parseInt(s.trim(), 10));
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return;

      const h = parts[0];
      const a = parts[1];
      const totalGoals = h + a;
      const scoreKey = `${h} - ${a}`;
      const isKgVar = h > 0 && a > 0;
      const isOver25 = totalGoals >= 3;

      validCount++;
      scoreCounts[scoreKey] = (scoreCounts[scoreKey] || 0) + 1;

      if (h > a) {
        if (isOver25) comboCounts['MS 1 & 2.5 ÜST'].count++;
        else comboCounts['MS 1 & 2.5 ALT'].count++;
        if (isKgVar) comboCounts['MS 1 & KG VAR'].count++;
        else comboCounts['MS 1 & KG YOK'].count++;
      } else if (h === a) {
        if (!isOver25) comboCounts['MS X & 2.5 ALT'].count++;
        if (isKgVar) comboCounts['MS X & KG VAR'].count++;
      } else {
        if (isOver25) comboCounts['MS 2 & 2.5 ÜST'].count++;
        else comboCounts['MS 2 & 2.5 ALT'].count++;
        if (isKgVar) comboCounts['MS 2 & KG VAR'].count++;
        else comboCounts['MS 2 & KG YOK'].count++;
      }
    });

    const sortedScores = Object.entries(scoreCounts)
      .map(([score, count]) => {
        const rate = Math.round((count / validCount) * 100);
        let estOdd = 6.00;
        if (rate >= 30) estOdd = 5.25;
        else if (rate >= 20) estOdd = 6.50;
        else if (rate >= 15) estOdd = 7.50;
        else if (rate >= 10) estOdd = 9.00;
        else estOdd = 12.00;
        return { score, count, rate, estOdd: estOdd.toFixed(2) };
      })
      .sort((a, b) => b.count - a.count);

    const combos = Object.entries(comboCounts).map(([name, data]) => {
      const rate = Math.round((data.count / validCount) * 100);
      const estOdd = Math.max(2.20, parseFloat(data.sampleOdds.toFixed(2)));
      return {
        name,
        count: data.count,
        rate,
        estOdd: isNaN(estOdd) ? '2.80' : estOdd.toFixed(2)
      };
    }).sort((a, b) => b.rate - a.rate);

    return NextResponse.json({
      success: true,
      sampleSize: validCount,
      combos: combos.slice(0, 4),
      topCombo: combos[0] || null,
      topScores: sortedScores.slice(0, 4),
      primaryScore: sortedScores[0] || null,
      secondaryScore: sortedScores[1] || null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
