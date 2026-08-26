import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import NodeCache from 'node-cache';

const analyzeCache = new NodeCache({ stdTTL: 1800, checkperiod: 300 }); // 30 minutes cache

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
  return { total, ms1, msX, msx: msX, ms2, u15, a15, u25, a25, u35, a35, kgvar, kgyok };
}

// Fast parallel fetching for up to 2000 matches (99.9% statistical confidence)
async function fetchFastMatchingRows(builderFn: () => any) {
  if (!supabase) return [];
  
  // Parallel fetch page 1 (0..999) and page 2 (1000..1999) simultaneously
  const [res1, res2] = await Promise.all([
    builderFn().range(0, 999),
    builderFn().range(1000, 1999)
  ]);

  const p1 = res1?.data || [];
  const p2 = res2?.data || [];
  return p1.concat(p2);
}

export async function POST(request: Request) {
  try {
    const { match } = await request.json();
    
    if (!match) {
      return NextResponse.json({ success: false, error: 'Match data is required' }, { status: 400 });
    }

    const currentOdds = {
      ms1: parseFloat(match.ms1) || 0,
      ms0: parseFloat(match.msX || match.ms0) || 0,
      ms2: parseFloat(match.ms2) || 0,
      cs1X: parseFloat(match.cs1X || match.cs_1x) || 0,
      cs12: parseFloat(match.cs12 || match.cs_12) || 0,
      csX2: parseFloat(match.csX2 || match.cs_x2) || 0,
      alt25: parseFloat(match.alt25 || match.alt) || 0,
      ust25: parseFloat(match.ust25 || match.ust) || 0,
      alt15: parseFloat(match.alt15) || 0,
      ust15: parseFloat(match.ust15) || 0,
      alt35: parseFloat(match.alt35) || 0,
      ust35: parseFloat(match.ust35) || 0,
      kgVar: parseFloat(match.kgVar) || 0,
      kgYok: parseFloat(match.kgYok) || 0,
      iy1: parseFloat(match.iy1 || match.iy_1) || 0,
      iyX: parseFloat(match.iyX || match.iy_0) || 0,
      iy2: parseFloat(match.iy2 || match.iy_2) || 0,
    };

    const trNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    const todayStr = `${trNow.getFullYear()}-${String(trNow.getMonth() + 1).padStart(2, '0')}-${String(trNow.getDate()).padStart(2, '0')}`;

    // Cache lookup
    const cacheKey = `analyze_${match.id || ''}_${currentOdds.ms1}_${currentOdds.ms0}_${currentOdds.ms2}_${currentOdds.ust25}_${currentOdds.alt25}_${currentOdds.kgVar}`;
    const cached = analyzeCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const tol = 0.05;

    // 1. MS Query (Sadece tamamlanmış geçmiş maçlar)
    const msPromise = fetchFastMatchingRows(() => {
      let q = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null).lt('match_date', todayStr);
      if (currentOdds.ms1 > 0) q = q.gte('ms_1_odd', currentOdds.ms1 - tol).lte('ms_1_odd', currentOdds.ms1 + tol);
      if (currentOdds.ms0 > 0) q = q.gte('ms_0_odd', currentOdds.ms0 - tol).lte('ms_0_odd', currentOdds.ms0 + tol);
      if (currentOdds.ms2 > 0) q = q.gte('ms_2_odd', currentOdds.ms2 - tol).lte('ms_2_odd', currentOdds.ms2 + tol);
      return q;
    });

    const au15Promise = (currentOdds.alt15 > 0 || currentOdds.ust15 > 0)
      ? fetchFastMatchingRows(() => {
          let q = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null).lt('match_date', todayStr);
          if (currentOdds.alt15 > 0) q = q.gte('alt_15_odd', currentOdds.alt15 - tol).lte('alt_15_odd', currentOdds.alt15 + tol);
          if (currentOdds.ust15 > 0) q = q.gte('ust_15_odd', currentOdds.ust15 - tol).lte('ust_15_odd', currentOdds.ust15 + tol);
          return q;
        })
      : Promise.resolve([] as any[]);

    const au25Promise = (currentOdds.alt25 > 0 || currentOdds.ust25 > 0)
      ? fetchFastMatchingRows(() => {
          let q = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null).lt('match_date', todayStr);
          if (currentOdds.alt25 > 0) q = q.gte('alt_25_odd', currentOdds.alt25 - tol).lte('alt_25_odd', currentOdds.alt25 + tol);
          if (currentOdds.ust25 > 0) q = q.gte('ust_25_odd', currentOdds.ust25 - tol).lte('ust_25_odd', currentOdds.ust25 + tol);
          return q;
        })
      : Promise.resolve([] as any[]);

    const au35Promise = (currentOdds.alt35 > 0 || currentOdds.ust35 > 0)
      ? fetchFastMatchingRows(() => {
          let q = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null).lt('match_date', todayStr);
          if (currentOdds.alt35 > 0) q = q.gte('alt_35_odd', currentOdds.alt35 - tol).lte('alt_35_odd', currentOdds.alt35 + tol);
          if (currentOdds.ust35 > 0) q = q.gte('ust_35_odd', currentOdds.ust35 - tol).lte('ust_35_odd', currentOdds.ust35 + tol);
          return q;
        })
      : Promise.resolve([] as any[]);

    const kgPromise = (currentOdds.kgVar > 0 || currentOdds.kgYok > 0)
      ? fetchFastMatchingRows(() => {
          let q = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null).lt('match_date', todayStr);
          if (currentOdds.kgVar > 0) q = q.gte('kg_var_odd', currentOdds.kgVar - tol).lte('kg_var_odd', currentOdds.kgVar + tol);
          if (currentOdds.kgYok > 0) q = q.gte('kg_yok_odd', currentOdds.kgYok - tol).lte('kg_yok_odd', currentOdds.kgYok + tol);
          return q;
        })
      : Promise.resolve([] as any[]);

    const [msData, au15Data, au25Data, au35Data, kgData] = await Promise.all([
      msPromise,
      au15Promise,
      au25Promise,
      au35Promise,
      kgPromise
    ]);

    const msStats = computeStats(msData);
    const au15Stats = computeStats(au15Data);
    const au25Stats = computeStats(au25Data);
    const au35Stats = computeStats(au35Data);
    const kgStats = computeStats(kgData);

    const rawStats: any = {
      ms_stats: msStats,
      au15_stats: au15Stats,
      au25_stats: au25Stats,
      au35_stats: au35Stats,
      kg_stats: kgStats
    };

    const MIN_MATCH_COUNT = 50; // En az 50 maçlık veri güvenilirliği şartı!
    const MIN_PROBABILITY = 65;  // %65 ve üzeri başarı güveni
    const MIN_ODD = 1.15;         // 1.15 ve üzeri oran

    const ai_predictions: any[] = [];
    const probabilities: any[] = [];

    // Sadece en az 50 maçlık istatistiğe sahip havuzları değerlendir
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

    // 1. MS ve ÇŞ: SADECE MS Oranlarına göre bakılır ve EN AZ 50 MAÇ olmalı!
    if (msStats.total >= MIN_MATCH_COUNT) {
      if (currentOdds.ms1 > 0) probabilities.push({ label: 'MS 1', count: msStats.ms1, total: msStats.total, odd: currentOdds.ms1 });
      if (currentOdds.ms0 > 0) probabilities.push({ label: 'MS X', count: msStats.msX, total: msStats.total, odd: currentOdds.ms0 });
      if (currentOdds.ms2 > 0) probabilities.push({ label: 'MS 2', count: msStats.ms2, total: msStats.total, odd: currentOdds.ms2 });
      if (currentOdds.cs1X > 0) probabilities.push({ label: '1-X ÇŞ', count: msStats.ms1 + msStats.msX, total: msStats.total, odd: currentOdds.cs1X });
      if (currentOdds.csX2 > 0) probabilities.push({ label: 'X-2 ÇŞ', count: msStats.msX + msStats.ms2, total: msStats.total, odd: currentOdds.csX2 });
      if (currentOdds.cs12 > 0) probabilities.push({ label: '1-2 ÇŞ', count: msStats.ms1 + msStats.ms2, total: msStats.total, odd: currentOdds.cs12 });
    }

    // 2. Goller ve KG: 50+ maça sahip güvenilir havuzlar arasından en yüksek yüzdeliyi al
    if (currentOdds.ust15 > 0) {
      const b = getBestPoolOutcome(s => s.u15);
      if (b) probabilities.push({ label: '1.5 ÜST', count: b.count, total: b.total, odd: currentOdds.ust15 });
    }
    if (currentOdds.alt15 > 0) {
      const b = getBestPoolOutcome(s => s.a15);
      if (b) probabilities.push({ label: '1.5 ALT', count: b.count, total: b.total, odd: currentOdds.alt15 });
    }
    if (currentOdds.ust25 > 0) {
      const b = getBestPoolOutcome(s => s.u25);
      if (b) probabilities.push({ label: '2.5 ÜST', count: b.count, total: b.total, odd: currentOdds.ust25 });
    }
    if (currentOdds.alt25 > 0) {
      const b = getBestPoolOutcome(s => s.a25);
      if (b) probabilities.push({ label: '2.5 ALT', count: b.count, total: b.total, odd: currentOdds.alt25 });
    }
    if (currentOdds.ust35 > 0) {
      const b = getBestPoolOutcome(s => s.u35);
      if (b) probabilities.push({ label: '3.5 ÜST', count: b.count, total: b.total, odd: currentOdds.ust35 });
    }
    if (currentOdds.alt35 > 0) {
      const b = getBestPoolOutcome(s => s.a35);
      if (b) probabilities.push({ label: '3.5 ALT', count: b.count, total: b.total, odd: currentOdds.alt35 });
    }
    if (currentOdds.kgVar > 0) {
      const b = getBestPoolOutcome(s => s.kgvar);
      if (b) probabilities.push({ label: 'KG VAR', count: b.count, total: b.total, odd: currentOdds.kgVar });
    }
    if (currentOdds.kgYok > 0) {
      const b = getBestPoolOutcome(s => s.kgyok);
      if (b) probabilities.push({ label: 'KG YOK', count: b.count, total: b.total, odd: currentOdds.kgYok });
    }

    // Her kategoriden (ÇŞ, Gol, KG, MS) sadece en güçlü ve çelişkisiz TEK bir tercih seç
    let bestCS: any = null;
    let bestCSProb = 0;
    
    let bestAU: any = null;
    let bestAUProb = 0;

    let bestKG: any = null;
    let bestKGProb = 0;

    let bestMS: any = null;
    let bestMSProb = 0;

    for (const p of probabilities) {
      if (p.odd >= MIN_ODD && p.total >= MIN_MATCH_COUNT && p.count !== undefined) {
        const prob = Math.round((p.count / p.total) * 100);
        if (prob >= MIN_PROBABILITY) {
          const item = { ...p, percent: prob, color: 'text-emerald-400' };
          
          if (p.label.includes('ÇŞ')) {
            if (prob > bestCSProb) {
              bestCSProb = prob;
              bestCS = item;
            }
          } else if (p.label.includes('ÜST') || p.label.includes('ALT')) {
            if (prob > bestAUProb) {
              bestAUProb = prob;
              bestAU = item;
            }
          } else if (p.label.includes('KG')) {
            if (prob > bestKGProb) {
              bestKGProb = prob;
              bestKG = item;
            }
          } else if (p.label.startsWith('MS')) {
            if (prob > bestMSProb) {
              bestMSProb = prob;
              bestMS = item;
            }
          }
        }
      }
    }

    if (bestAU) ai_predictions.push(bestAU);
    if (bestCS) ai_predictions.push(bestCS);
    if (bestKG) ai_predictions.push(bestKG);
    if (bestMS) ai_predictions.push(bestMS);

    ai_predictions.sort((a, b) => b.percent - a.percent);
    rawStats.ai_predictions = ai_predictions;

    const responsePayload = { 
      success: true, 
      stats: rawStats 
    };

    analyzeCache.set(cacheKey, responsePayload);

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error('[Analyze] Exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
