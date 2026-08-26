import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 * 7 }); // 7 gün kalıcı cache

function computeStats(matchesList: any[]) {
  let ms1 = 0, msX = 0, ms2 = 0;
  let u15 = 0, a15 = 0, u25 = 0, a25 = 0, u35 = 0, a35 = 0;
  let kgvar = 0, kgyok = 0;

  for (const m of matchesList) {
    if (!m.ms_score) continue;
    const parts = m.ms_score.split('-').map((s: string) => parseInt(s.trim(), 10));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) continue;
    const h = parts[0];
    const a = parts[1];
    const tot = h + a;

    if (h > a) ms1++;
    else if (h === a) msX++;
    else ms2++;

    if (tot > 1) u15++; else a15++;
    if (tot > 2) u25++; else a25++;
    if (tot > 3) u35++; else a35++;

    if (h > 0 && a > 0) kgvar++; else kgyok++;
  }

  const total = matchesList.length;
  return { total, ms1, msX, ms2, u15, a15, u25, a25, u35, a35, kgvar, kgyok };
}

function evaluatePick(
  rawPickLabel: string, 
  homeGoals: number, 
  awayGoals: number, 
  iyHomeGoals: number | null, 
  iyAwayGoals: number | null
) {
  if (!rawPickLabel) return { isEvaluated: false, won: false };
  const label = rawPickLabel.toUpperCase().replace(/,/g, '.').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/İ/g, 'I').replace(/I/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C').trim();
  const totalGoals = homeGoals + awayGoals;

  if (label.includes('IY') || label.includes('ILK YARI')) {
    if (iyHomeGoals === null || iyAwayGoals === null || isNaN(iyHomeGoals) || isNaN(iyAwayGoals)) return { isEvaluated: false, won: false };
    if (label.endsWith(' 1') || label.endsWith('1')) return { isEvaluated: true, won: iyHomeGoals > iyAwayGoals };
    if (label.endsWith(' X') || label.endsWith('X') || label.endsWith(' 0')) return { isEvaluated: true, won: iyHomeGoals === iyAwayGoals };
    if (label.endsWith(' 2') || label.endsWith('2')) return { isEvaluated: true, won: iyHomeGoals < iyAwayGoals };
  }

  if (label.includes('KG') || label.includes('KARSILIKLI')) {
    if (label.includes('YOK') || label.includes('NO')) return { isEvaluated: true, won: homeGoals === 0 || awayGoals === 0 };
    if (label.includes('VAR') || label.includes('YES')) return { isEvaluated: true, won: homeGoals > 0 && awayGoals > 0 };
  }

  if (label.includes('CS') || label.includes('CIFTE') || label.includes('ÇŞ')) {
    if (label.includes('1-X') || label.includes('1X') || label.includes('1-0')) return { isEvaluated: true, won: homeGoals >= awayGoals };
    if (label.includes('X-2') || label.includes('X2') || label.includes('0-2')) return { isEvaluated: true, won: awayGoals >= homeGoals };
    if (label.includes('1-2') || label.includes('12')) return { isEvaluated: true, won: homeGoals !== awayGoals };
  }

  if (label.includes('ALT') || label.includes('UST')) {
    const isUst = label.includes('UST');
    if (label.includes('0.5')) return { isEvaluated: true, won: isUst ? totalGoals > 0.5 : totalGoals < 0.5 };
    if (label.includes('1.5')) return { isEvaluated: true, won: isUst ? totalGoals > 1.5 : totalGoals < 1.5 };
    if (label.includes('2.5')) return { isEvaluated: true, won: isUst ? totalGoals > 2.5 : totalGoals < 2.5 };
    if (label.includes('3.5')) return { isEvaluated: true, won: isUst ? totalGoals > 3.5 : totalGoals < 3.5 };
    if (label.includes('4.5')) return { isEvaluated: true, won: isUst ? totalGoals > 4.5 : totalGoals < 4.5 };
  }

  if (label.includes('MS') || label === '1' || label === 'X' || label === '2') {
    if (label.includes('1')) return { isEvaluated: true, won: homeGoals > awayGoals };
    if (label.includes('X') || label.includes('0')) return { isEvaluated: true, won: homeGoals === awayGoals };
    if (label.includes('2')) return { isEvaluated: true, won: homeGoals < awayGoals };
  }

  return { isEvaluated: false, won: false };
}

export async function GET(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase client unavailable' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const daysAgoParam = searchParams.get('daysAgo');

    let targetDateStr = '';

    if (dateParam) {
      targetDateStr = dateParam;
    } else {
      const daysAgo = parseInt(daysAgoParam || '1', 10) || 1;
      const now = new Date();
      const trNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
      trNow.setDate(trNow.getDate() - daysAgo);
      const yyyy = trNow.getFullYear();
      const mm = String(trNow.getMonth() + 1).padStart(2, '0');
      const dd = String(trNow.getDate()).padStart(2, '0');
      targetDateStr = `${yyyy}-${mm}-${dd}`;
    }

    const cacheKey = `yesterday_picks_v70_exact_${targetDateStr}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    let formattedDate = targetDateStr;
    try {
      formattedDate = new Date(`${targetDateStr}T12:00:00Z`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch(e) {}

    // 1. Fetch past matches for targetDate
    let { data: pastMatches } = await supabase
      .from('past_matches')
      .select('*')
      .eq('match_date', targetDateStr)
      .not('ms_score', 'is', null)
      .neq('ms_score', '0 - 0')
      .limit(300);

    if (!pastMatches || pastMatches.length === 0) {
      const payload = { 
        success: true, 
        targetDate: targetDateStr, 
        formattedDate, 
        picks: [], 
        totalPicks: 0, 
        wonPicks: 0, 
        successRate: 0 
      };
      cache.set(cacheKey, payload);
      return NextResponse.json(payload);
    }

    const evaluatedPicks: any[] = [];
    const chunkSize = 25;
    const tol = 0.05;

    for (let i = 0; i < pastMatches.length; i += chunkSize) {
      const chunk = pastMatches.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async (match) => {
        const ms1 = parseFloat(match.ms_1_odd) || 0;
        const ms0 = parseFloat(match.ms_0_odd) || 0;
        const ms2 = parseFloat(match.ms_2_odd) || 0;
        const alt25 = parseFloat(match.alt_25_odd) || 0;
        const ust25 = parseFloat(match.ust_25_odd) || 0;
        const alt15 = parseFloat(match.alt_15_odd) || 0;
        const ust15 = parseFloat(match.ust_15_odd) || 0;
        const alt35 = parseFloat(match.alt_35_odd) || 0;
        const ust35 = parseFloat(match.ust_35_odd) || 0;
        const kgVar = parseFloat(match.kg_var_odd) || 0;
        const kgYok = parseFloat(match.kg_yok_odd) || 0;
        const cs1X = parseFloat(match.cs_1x_odd) || 0;
        const csX2 = parseFloat(match.cs_x2_odd) || 0;
        const cs12 = parseFloat(match.cs_12_odd) || 0;

        const MIN_MATCH_COUNT = 50;
        const tol = 0.05;

        let q = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null);
        if (ms1 > 0) q = q.gte('ms_1_odd', ms1 - tol).lte('ms_1_odd', ms1 + tol);
        if (ms0 > 0) q = q.gte('ms_0_odd', ms0 - tol).lte('ms_0_odd', ms0 + tol);
        if (ms2 > 0) q = q.gte('ms_2_odd', ms2 - tol).lte('ms_2_odd', ms2 + tol);

        // Parallel market queries for yesterday matches
        const au15Promise = (alt15 > 0 || ust15 > 0)
          ? supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null)
              .gte('alt_15_odd', (alt15 || 0) - tol).lte('alt_15_odd', (alt15 || 0) + tol)
              .limit(1000)
          : Promise.resolve({ data: [] as any[] });

        const au25Promise = (alt25 > 0 || ust25 > 0)
          ? supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null)
              .gte('alt_25_odd', (alt25 || 0) - tol).lte('alt_25_odd', (alt25 || 0) + tol)
              .limit(1000)
          : Promise.resolve({ data: [] as any[] });

        const au35Promise = (alt35 > 0 || ust35 > 0)
          ? supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null)
              .gte('alt_35_odd', (alt35 || 0) - tol).lte('alt_35_odd', (alt35 || 0) + tol)
              .limit(1000)
          : Promise.resolve({ data: [] as any[] });

        const kgPromise = (kgVar > 0 || kgYok > 0)
          ? supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null)
              .gte('kg_var_odd', (kgVar || 0) - tol).lte('kg_var_odd', (kgVar || 0) + tol)
              .limit(1000)
          : Promise.resolve({ data: [] as any[] });

        const [msRes, au15Res, au25Res, au35Res, kgRes] = await Promise.all([
          q.limit(1000),
          au15Promise,
          au25Promise,
          au35Promise,
          kgPromise
        ]);

        const msStats = computeStats(msRes?.data || []);
        const au15Stats = computeStats(au15Res?.data || []);
        const au25Stats = computeStats(au25Res?.data || []);
        const au35Stats = computeStats(au35Res?.data || []);
        const kgStats = computeStats(kgRes?.data || []);

        const reliablePools = [msStats, au15Stats, au25Stats, au35Stats, kgStats].filter(s => s && s.total >= MIN_MATCH_COUNT);

        const getBestPoolOutcome = (getter: (s: any) => number) => {
          let maxProb = 0;
          let best: { count: number; total: number } | null = null;
          for (const s of reliablePools) {
            const prob = getter(s) / s.total;
            if (prob > maxProb) {
              maxProb = prob;
              best = { count: getter(s), total: s.total };
            }
          }
          return best;
        };

        const probabilities: any[] = [];

        // 1. MS ve ÇŞ: Sadece MS havuzu ve en az 50 maç
        if (msStats.total >= MIN_MATCH_COUNT) {
          if (ms1 > 0) probabilities.push({ label: 'MS 1', count: msStats.ms1, total: msStats.total, odd: ms1 });
          if (ms0 > 0) probabilities.push({ label: 'MS X', count: msStats.msX, total: msStats.total, odd: ms0 });
          if (ms2 > 0) probabilities.push({ label: 'MS 2', count: msStats.ms2, total: msStats.total, odd: ms2 });
          if (cs1X > 0) probabilities.push({ label: '1-X ÇŞ', count: msStats.ms1 + msStats.msX, total: msStats.total, odd: cs1X });
          if (csX2 > 0) probabilities.push({ label: 'X-2 ÇŞ', count: msStats.msX + msStats.ms2, total: msStats.total, odd: csX2 });
          if (cs12 > 0) probabilities.push({ label: '1-2 ÇŞ', count: msStats.ms1 + msStats.ms2, total: msStats.total, odd: cs12 });
        }

        // 2. Goller ve KG: 50+ maçlık havuzlardan en yüksek yüzdeliyi al
        if (ust15 > 0) {
          const b = getBestPoolOutcome(s => s.u15);
          if (b) probabilities.push({ label: '1.5 ÜST', count: b.count, total: b.total, odd: ust15 });
        }
        if (alt15 > 0) {
          const b = getBestPoolOutcome(s => s.a15);
          if (b) probabilities.push({ label: '1.5 ALT', count: b.count, total: b.total, odd: alt15 });
        }
        if (ust25 > 0) {
          const b = getBestPoolOutcome(s => s.u25);
          if (b) probabilities.push({ label: '2.5 ÜST', count: b.count, total: b.total, odd: ust25 });
        }
        if (alt25 > 0) {
          const b = getBestPoolOutcome(s => s.a25);
          if (b) probabilities.push({ label: '2.5 ALT', count: b.count, total: b.total, odd: alt25 });
        }
        if (ust35 > 0) {
          const b = getBestPoolOutcome(s => s.u35);
          if (b) probabilities.push({ label: '3.5 ÜST', count: b.count, total: b.total, odd: ust35 });
        }
        if (alt35 > 0) {
          const b = getBestPoolOutcome(s => s.a35);
          if (b) probabilities.push({ label: '3.5 ALT', count: b.count, total: b.total, odd: alt35 });
        }
        if (kgVar > 0) {
          const b = getBestPoolOutcome(s => s.kgvar);
          if (b) probabilities.push({ label: 'KG VAR', count: b.count, total: b.total, odd: kgVar });
        }
        if (kgYok > 0) {
          const b = getBestPoolOutcome(s => s.kgyok);
          if (b) probabilities.push({ label: 'KG YOK', count: b.count, total: b.total, odd: kgYok });
        }

        let bestPick: any = null;
        let maxProb = 0;

        for (const p of probabilities) {
          // Birebir aynı kıstas: 1.15 - 1.85 arası oran ve %70+ başarı güveni
          if (!p.odd || p.odd < 1.15 || p.odd > 1.85 || !p.total || p.total < MIN_MATCH_COUNT) continue;
          const prob = Math.round((p.count / p.total) * 100);
          if (prob >= 70 && prob > maxProb) {
            maxProb = prob;
            bestPick = { ...p, percent: prob };
          }
        }

        if (bestPick && match.ms_score && match.ms_score.includes('-')) {
          const scores = match.ms_score.split('-').map(Number);
          const iyScores = match.iy_score ? match.iy_score.split('-').map(Number) : [null, null];
          const evalRes = evaluatePick(bestPick.label, scores[0], scores[1], iyScores[0], iyScores[1]);
          if (evalRes.isEvaluated) {
            return {
              homeTeam: match.home_team,
              awayTeam: match.away_team,
              league: match.league || '',
              time: match.match_time ? match.match_time.slice(0, 5) : '',
              msScore: match.ms_score,
              iyScore: match.iy_score,
              pickLabel: bestPick.label,
              pickOdd: bestPick.odd,
              percent: bestPick.percent,
              won: evalRes.won
            };
          }
        }
        return null;
      });

      const chunkResults = await Promise.all(chunkPromises);
      chunkResults.forEach(r => {
        if (r) evaluatedPicks.push(r);
      });
    }

    evaluatedPicks.sort((a, b) => b.percent - a.percent);

    const totalPicks = evaluatedPicks.length;
    const wonPicks = evaluatedPicks.filter(p => p.won).length;
    const successRate = totalPicks > 0 ? Math.round((wonPicks / totalPicks) * 100) : 0;

    const payload = {
      success: true,
      targetDate: targetDateStr,
      formattedDate,
      totalPicks,
      wonPicks,
      successRate,
      picks: evaluatedPicks
    };

    cache.set(cacheKey, payload);

    return NextResponse.json(payload);

  } catch (error: any) {
    console.error('[Yesterday Picks Performance API Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
