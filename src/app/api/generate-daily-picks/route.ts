import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache

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

export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase client unavailable' }, { status: 500 });
    }

    const body = await request.json();
    const matches = body.matches || [];
    const leagueFilter = body.league;

    if (!Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json({ success: false, error: 'No matches provided' }, { status: 400 });
    }

    const candidateMatches = matches.filter(m => {
      if (leagueFilter && m.league !== leagueFilter) return false;
      return true;
    });

    const cacheKey = `picks_${candidateMatches.map(m => m.id || m.code).join('_').slice(0, 100)}_${leagueFilter || 'all'}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const bankoPicks: any[] = [];
    const valuePicks: any[] = [];

    const tol = 0.05;
    const chunkSize = 20;

    for (let i = 0; i < candidateMatches.length; i += chunkSize) {
      const chunk = candidateMatches.slice(i, i + chunkSize);
      
      const chunkPromises = chunk.map(async (match) => {
        const ms1 = parseFloat(match.ms1) || 0;
        const ms0 = parseFloat(match.msX || match.ms0) || 0;
        const ms2 = parseFloat(match.ms2) || 0;

        if (ms1 === 0 || ms2 === 0) return null;

        const trNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
        const todayStr = `${trNow.getFullYear()}-${String(trNow.getMonth() + 1).padStart(2, '0')}-${String(trNow.getDate()).padStart(2, '0')}`;

        // 1. MS Query
        let q = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null).lt('match_date', todayStr);
        if (ms1 > 0) q = q.gte('ms_1_odd', ms1 - tol).lte('ms_1_odd', ms1 + tol);
        if (ms0 > 0) q = q.gte('ms_0_odd', ms0 - tol).lte('ms_0_odd', ms0 + tol);
        if (ms2 > 0) q = q.gte('ms_2_odd', ms2 - tol).lte('ms_2_odd', ms2 + tol);

        const alt25Odd = parseFloat(match.alt25 || match.alt) || 0;
        const ust25Odd = parseFloat(match.ust25 || match.ust) || 0;
        const alt15Odd = parseFloat(match.alt15) || 0;
        const ust15Odd = parseFloat(match.ust15) || 0;
        const alt35Odd = parseFloat(match.alt35) || 0;
        const ust35Odd = parseFloat(match.ust35) || 0;
        const kgVarOdd = parseFloat(match.kgVar) || 0;
        const kgYokOdd = parseFloat(match.kgYok) || 0;
        const cs1XOdd = parseFloat(match.cs1X) || 0;
        const cs12Odd = parseFloat(match.cs12) || 0;
        const csX2Odd = parseFloat(match.csX2) || 0;

        // Parallel market queries
        const au15Promise = (alt15Odd > 0 || ust15Odd > 0)
          ? (() => {
              let q15 = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null).lt('match_date', todayStr);
              if (alt15Odd > 0) q15 = q15.gte('alt_15_odd', alt15Odd - tol).lte('alt_15_odd', alt15Odd + tol);
              if (ust15Odd > 0) q15 = q15.gte('ust_15_odd', ust15Odd - tol).lte('ust_15_odd', ust15Odd + tol);
              return q15.limit(500);
            })()
          : Promise.resolve({ data: [] as any[] });

        const au25Promise = (alt25Odd > 0 || ust25Odd > 0)
          ? (() => {
              let q25 = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null).lt('match_date', todayStr);
              if (alt25Odd > 0) q25 = q25.gte('alt_25_odd', alt25Odd - tol).lte('alt_25_odd', alt25Odd + tol);
              if (ust25Odd > 0) q25 = q25.gte('ust_25_odd', ust25Odd - tol).lte('ust_25_odd', ust25Odd + tol);
              return q25.limit(500);
            })()
          : Promise.resolve({ data: [] as any[] });

        const au35Promise = (alt35Odd > 0 || ust35Odd > 0)
          ? (() => {
              let q35 = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null).lt('match_date', todayStr);
              if (alt35Odd > 0) q35 = q35.gte('alt_35_odd', alt35Odd - tol).lte('alt_35_odd', alt35Odd + tol);
              if (ust35Odd > 0) q35 = q35.gte('ust_35_odd', ust35Odd - tol).lte('ust_35_odd', ust35Odd + tol);
              return q35.limit(500);
            })()
          : Promise.resolve({ data: [] as any[] });

        const kgPromise = (kgVarOdd > 0 || kgYokOdd > 0)
          ? (() => {
              let qKg = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null).lt('match_date', todayStr);
              if (kgVarOdd > 0) qKg = qKg.gte('kg_var_odd', kgVarOdd - tol).lte('kg_var_odd', kgVarOdd + tol);
              if (kgYokOdd > 0) qKg = qKg.gte('kg_yok_odd', kgYokOdd - tol).lte('kg_yok_odd', kgYokOdd + tol);
              return qKg.limit(500);
            })()
          : Promise.resolve({ data: [] as any[] });

        const [msRes, au15Res, au25Res, au35Res, kgRes] = await Promise.all([
          q.limit(500),
          au15Promise,
          au25Promise,
          au35Promise,
          kgPromise
        ]);

        const list = msRes?.data || [];
        if (!list || list.length < 3) {
          return null;
        }

        const msStats = computeStats(list);
        const au15Stats = computeStats(au15Res?.data || []);
        const au25Stats = computeStats(au25Res?.data || []);
        const au35Stats = computeStats(au35Res?.data || []);
        const kgStats = computeStats(kgRes?.data || []);

        const MIN_MATCH_COUNT = 50;
        // Tüm geçerli havuzlar (en az 50 maçlık veri içerenler)
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

        // 1. MS Sonuçları ve Çifte Şans: SADECE MS Oranlarına göre bakılır ve EN AZ 50 MAÇ olmalı!
        if (msStats.total >= MIN_MATCH_COUNT) {
          if (ms1 > 0) probabilities.push({ label: 'MS 1', count: msStats.ms1, total: msStats.total, odd: ms1 });
          if (ms0 > 0) probabilities.push({ label: 'MS X', count: msStats.msX, total: msStats.total, odd: ms0 });
          if (ms2 > 0) probabilities.push({ label: 'MS 2', count: msStats.ms2, total: msStats.total, odd: ms2 });
          if (cs1XOdd > 0) probabilities.push({ label: '1-X ÇŞ', count: msStats.ms1 + msStats.msX, total: msStats.total, odd: cs1XOdd });
          if (csX2Odd > 0) probabilities.push({ label: 'X-2 ÇŞ', count: msStats.msX + msStats.ms2, total: msStats.total, odd: csX2Odd });
          if (cs12Odd > 0) probabilities.push({ label: '1-2 ÇŞ', count: msStats.ms1 + msStats.ms2, total: msStats.total, odd: cs12Odd });
        }

        // 2. Goller ve KG: 50+ maça sahip güvenilir havuzlar arasından en yüksek yüzdeliyi al
        if (ust15Odd > 0) {
          const b = getBestPoolOutcome(s => s.u15);
          if (b) probabilities.push({ label: '1.5 ÜST', count: b.count, total: b.total, odd: ust15Odd });
        }
        if (alt15Odd > 0) {
          const b = getBestPoolOutcome(s => s.a15);
          if (b) probabilities.push({ label: '1.5 ALT', count: b.count, total: b.total, odd: alt15Odd });
        }
        if (ust25Odd > 0) {
          const b = getBestPoolOutcome(s => s.u25);
          if (b) probabilities.push({ label: '2.5 ÜST', count: b.count, total: b.total, odd: ust25Odd });
        }
        if (alt25Odd > 0) {
          const b = getBestPoolOutcome(s => s.a25);
          if (b) probabilities.push({ label: '2.5 ALT', count: b.count, total: b.total, odd: alt25Odd });
        }
        if (ust35Odd > 0) {
          const b = getBestPoolOutcome(s => s.u35);
          if (b) probabilities.push({ label: '3.5 ÜST', count: b.count, total: b.total, odd: ust35Odd });
        }
        if (alt35Odd > 0) {
          const b = getBestPoolOutcome(s => s.a35);
          if (b) probabilities.push({ label: '3.5 ALT', count: b.count, total: b.total, odd: alt35Odd });
        }
        if (kgVarOdd > 0) {
          const b = getBestPoolOutcome(s => s.kgvar);
          if (b) probabilities.push({ label: 'KG VAR', count: b.count, total: b.total, odd: kgVarOdd });
        }
        if (kgYokOdd > 0) {
          const b = getBestPoolOutcome(s => s.kgyok);
          if (b) probabilities.push({ label: 'KG YOK', count: b.count, total: b.total, odd: kgYokOdd });
        }

        let bestBanko: any = null;
        let maxBankoProb = 0;

        let bestValue: any = null;
        let maxValueProb = 0;

        for (const p of probabilities) {
            if (p.count === undefined || !p.total || p.total === 0 || p.odd <= 0) continue;
            const prob = Math.round((p.count / p.total) * 100);
            
            // Banko: Oynanabilir mantıklı oran (1.15 - 1.85) ve %70+ ihtimal
            if (p.odd >= 1.15 && p.odd <= 1.85 && prob >= 70 && prob > maxBankoProb) {
                maxBankoProb = prob;
                bestBanko = { ...p, percent: prob, color: 'text-emerald-400' };
            }

            // Value: Değerli/İdeal oran (>= 1.70) ve %50+ ihtimal
            if (p.odd >= 1.70 && prob >= 50 && prob > maxValueProb) {
                maxValueProb = prob;
                bestValue = { ...p, percent: prob, color: 'text-indigo-400' };
            }
        }

        return { 
           match, 
           banko: bestBanko ? { match, prediction: bestBanko } : null,
           value: bestValue ? { match, prediction: bestValue } : null 
        };
      });

      const chunkResults = await Promise.all(chunkPromises);
      chunkResults.forEach(res => {
        if (res) {
            if (res.banko) bankoPicks.push(res.banko);
            if (res.value) valuePicks.push(res.value);
        }
      });
    }

    const sortPicks = (picksArray: any[]) => {
      picksArray.sort((a, b) => {
        if (b.prediction.percent !== a.prediction.percent) {
          return b.prediction.percent - a.prediction.percent;
        }
        return b.prediction.odd - a.prediction.odd;
      });
    };

    sortPicks(bankoPicks);
    sortPicks(valuePicks);

    const payload = {
      success: true,
      bankoPicks,
      valuePicks,
      picks: {
        banko: bankoPicks,
        value: valuePicks
      },
      totalBanko: bankoPicks.length,
      totalValue: valuePicks.length,
    };

    cache.set(cacheKey, payload);

    return NextResponse.json(payload);

  } catch (error: any) {
    console.error('Picks Generation Error:', error);
    return NextResponse.json(
      { success: false, error: 'Tahminler üretilirken hata oluştu: ' + error.message },
      { status: 500 }
    );
  }
}
