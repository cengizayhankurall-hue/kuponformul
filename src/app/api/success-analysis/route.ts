import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import NodeCache from 'node-cache';

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

function evaluatePrediction(label: string, msScore: string, iyScore: string | undefined | null) {
  if (!msScore || !msScore.includes('-')) return false;
  
  const [msHomeStr, msAwayStr] = msScore.split('-');
  const msHome = parseInt(msHomeStr, 10);
  const msAway = parseInt(msAwayStr, 10);
  const totalGoals = msHome + msAway;
  const kg = msHome > 0 && msAway > 0;
  
  let iyTotal = 0;
  if (iyScore && iyScore.includes('-')) {
    const [iyH, iyA] = iyScore.split('-');
    iyTotal = parseInt(iyH, 10) + parseInt(iyA, 10);
  }

  switch(label) {
    case 'MS 1': return msHome > msAway;
    case 'MS X': return msHome === msAway;
    case 'MS 2': return msHome < msAway;
    case '1.5 ÜST': return totalGoals > 1.5;
    case '1.5 ALT': return totalGoals < 1.5;
    case '2.5 ÜST': return totalGoals > 2.5;
    case '2.5 ALT': return totalGoals < 2.5;
    case '3.5 ÜST': return totalGoals > 3.5;
    case '3.5 ALT': return totalGoals < 3.5;
    case 'KG VAR': return kg;
    case 'KG YOK': return !kg;
    case 'İY 1.5 ÜST': return iyTotal > 1.5;
    case 'İY 1.5 ALT': return iyTotal < 1.5;
    default: return false;
  }
}

function chunkArray(array: any[], size: number) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '3', 10);

    const cacheKey = `success_stats_${days}_v2`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // 1. En son oynanan 3 günün tarihlerini bulalım
    const { data: dateData, error: dateError } = await supabase!
      .from('past_matches')
      .select('match_date')
      .order('match_date', { ascending: false });

    if (dateError) throw dateError;

    // Tekil tarihleri çıkar
    const uniqueDates = Array.from(new Set(dateData.map(d => d.match_date)));
    const targetDates = uniqueDates.slice(0, days);

    if (targetDates.length === 0) {
      return NextResponse.json({ success: true, totalPredictions: 0, successfulPredictions: 0, dailyStats: [] });
    }

    // 2. Bu tarihlerdeki maçları çekelim (oranları boş olmayanları)
    const { data: matches, error: matchError } = await supabase!
      .from('past_matches')
      .select('*')
      .in('match_date', targetDates)
      .not('ms_1_odd', 'is', null)
      .not('ms_score', 'is', null);

    if (matchError) throw matchError;

    const MIN_PROBABILITY = 65;
    const MIN_ODD = 1.20;

    let dailyStats: Record<string, { total: number, success: number }> = {};
    for (const d of targetDates) {
      dailyStats[d as string] = { total: 0, success: 0 };
    }

    // 3. Maçları chunklar halinde analiz edelim
    const chunks = chunkArray(matches || [], 20);
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (match: any) => {
        // Eğer maçın oranları yoksa atla
        if (!match.ms_1_odd || !match.ms_0_odd || !match.ms_2_odd) return;

        const { data: rawStats, error } = await supabase!.rpc('analyze_detailed_odds', {
          p_ms1: match.ms_1_odd,
          p_ms0: match.ms_0_odd,
          p_ms2: match.ms_2_odd,
          p_alt15: match.alt_15_odd || 0,
          p_ust15: match.ust_15_odd || 0,
          p_alt25: match.alt_25_odd || 0,
          p_ust25: match.ust_25_odd || 0,
          p_alt35: match.alt_35_odd || 0,
          p_ust35: match.ust_35_odd || 0,
          p_kgvar: match.kg_var_odd || 0,
          p_kgyok: match.kg_yok_odd || 0,
          p_tolerance: 0.05
        });

        if (!error && rawStats) {
          const ms = rawStats.ms_stats || { total: 0 };

          const probabilities = [
              { label: 'MS 1', count: ms.ms1, total: ms.total, odd: match.ms_1_odd },
              { label: 'MS X', count: ms.msx || ms.msX, total: ms.total, odd: match.ms_0_odd },
              { label: 'MS 2', count: ms.ms2, total: ms.total, odd: match.ms_2_odd },
              { label: '2.5 ÜST', count: ms.u25, total: ms.total, odd: match.ust_25_odd },
              { label: '2.5 ALT', count: ms.a25, total: ms.total, odd: match.alt_25_odd },
              { label: '1.5 ÜST', count: ms.u15, total: ms.total, odd: match.ust_15_odd },
              { label: '1.5 ALT', count: ms.a15, total: ms.total, odd: match.alt_15_odd },
              { label: '3.5 ÜST', count: ms.u35, total: ms.total, odd: match.ust_35_odd },
              { label: '3.5 ALT', count: ms.a35, total: ms.total, odd: match.alt_35_odd },
              { label: 'KG VAR', count: ms.kgvar, total: ms.total, odd: match.kg_var_odd },
              { label: 'KG YOK', count: ms.kgyok, total: ms.total, odd: match.kg_yok_odd }
          ];

          let bestPick = null;
          let maxProb = 0;

          // En yüksek ihtimalli tahmini bul
          for (const p of probabilities) {
              if (p.total && p.total > 0 && p.count !== undefined) {
                  const prob = Math.round((p.count / p.total) * 100);
                  if (prob >= MIN_PROBABILITY && p.odd >= MIN_ODD) {
                      if (prob > maxProb) {
                          maxProb = prob;
                          bestPick = { label: p.label, prob: prob };
                      }
                  }
              }
          }

          if (bestPick) {
             const isSuccess = evaluatePrediction(bestPick.label, match.ms_score, match.iy_score);
             dailyStats[match.match_date].total += 1;
             if (isSuccess) {
                 dailyStats[match.match_date].success += 1;
             }
          }
        }
      });

      await Promise.all(promises);
    }

    let overallTotal = 0;
    let overallSuccess = 0;
    const formattedDailyStats = [];

    for (const date of targetDates) {
        const d = String(date);
        const t = dailyStats[d].total;
        const s = dailyStats[d].success;
        overallTotal += t;
        overallSuccess += s;
        // Format date from YYYY-MM-DD to DD.MM.YYYY
        const [year, month, day] = d.split('-');
        formattedDailyStats.push({
            date: `${day}.${month}.${year}`,
            total: t,
            success: s,
            percent: t > 0 ? Math.round((s / t) * 100) : 0
        });
    }

    const payload = { 
        success: true, 
        overallTotal,
        overallSuccess,
        overallPercent: overallTotal > 0 ? Math.round((overallSuccess / overallTotal) * 100) : 0,
        dailyStats: formattedDailyStats
    };

    cache.set(cacheKey, payload);

    return NextResponse.json(payload);

  } catch (error: any) {
    console.error('[Success Analysis] Exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
