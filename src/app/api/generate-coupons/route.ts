import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import NodeCache from 'node-cache';
import crypto from 'crypto';

const cache = new NodeCache({ stdTTL: 1800 }); // 30 mins cache

function chunkArray(array: any[], size: number) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

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

export async function POST(request: Request) {
  try {
    const { matches } = await request.json();
    
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json({ success: false, error: 'Matches data is required' }, { status: 400 });
    }

    // Filter to matches with valid MS odds
    const candidateMatches = matches.filter((m: any) => {
      const o1 = parseFloat(m.ms1);
      const o2 = parseFloat(m.ms2);
      return !isNaN(o1) && o1 > 0 && !isNaN(o2) && o2 > 0;
    });

    const matchIds = candidateMatches.map((m: any) => m.homeTeam + m.awayTeam + m.date).join('|');
    const hash = crypto.createHash('md5').update(matchIds).digest('hex');
    const cacheKey = `coupons_v2_${hash}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const MIN_PROBABILITY = 55;
    const MIN_ODD = 1.20;
    const tol = 0.05;
    
    let validPredictions: any[] = [];
    const chunks = chunkArray(candidateMatches, 20);

    for (const chunk of chunks) {
        const promises = chunk.map(async (match: any) => {
            const ms1 = parseFloat(match.ms1) || 0;
            const ms0 = parseFloat(match.msX || match.ms0) || 0;
            const ms2 = parseFloat(match.ms2) || 0;
            const alt25 = parseFloat(match.alt25 || match.alt) || 0;
            const ust25 = parseFloat(match.ust25 || match.ust) || 0;
            const alt15 = parseFloat(match.alt15) || 0;
            const ust15 = parseFloat(match.ust15) || 0;
            const alt35 = parseFloat(match.alt35) || 0;
            const ust35 = parseFloat(match.ust35) || 0;
            const kgVar = parseFloat(match.kgVar) || 0;
            const kgYok = parseFloat(match.kgYok) || 0;

            if (ms1 <= 0 || ms2 <= 0) return null;

            let q = supabase!.from('past_matches').select('ms_score').not('ms_score', 'is', null);
            if (ms1 > 0) q = q.gte('ms_1_odd', ms1 - tol).lte('ms_1_odd', ms1 + tol);
            if (ms0 > 0) q = q.gte('ms_0_odd', ms0 - tol).lte('ms_0_odd', ms0 + tol);
            if (ms2 > 0) q = q.gte('ms_2_odd', ms2 - tol).lte('ms_2_odd', ms2 + tol);

            const { data: list } = await q.limit(500);

            if (!list || list.length < 3) {
              return null;
            }

            const stats = computeStats(list);

            const probabilities = [
                { label: 'MS 1', count: stats.ms1, odd: ms1 },
                { label: 'MS X', count: stats.msX, odd: ms0 },
                { label: 'MS 2', count: stats.ms2, odd: ms2 },
                { label: '2.5 ÜST', count: stats.u25, odd: ust25 || 1.75 },
                { label: '2.5 ALT', count: stats.a25, odd: alt25 || 1.75 },
                { label: '1.5 ÜST', count: stats.u15, odd: ust15 || 1.25 },
                { label: '1.5 ALT', count: stats.a15, odd: alt15 || 2.50 },
                { label: '3.5 ÜST', count: stats.u35, odd: ust35 || 2.40 },
                { label: '3.5 ALT', count: stats.a35, odd: alt35 || 1.35 },
                { label: 'KG VAR', count: stats.kgvar, odd: kgVar || 1.70 },
                { label: 'KG YOK', count: stats.kgyok, odd: kgYok || 1.75 }
            ];

            let bestPick = null;
            let maxProb = 0;

            for (const p of probabilities) {
                if (stats.total > 0 && p.count !== undefined) {
                    const prob = Math.round((p.count / stats.total) * 100);
                    if (prob >= MIN_PROBABILITY && p.odd >= MIN_ODD) {
                        if (prob > maxProb) {
                            maxProb = prob;
                            bestPick = { 
                              ...p, 
                              percent: prob, 
                              match: `${match.homeTeam} - ${match.awayTeam}`, 
                              league: match.league || '',
                              date: match.date, 
                              time: match.time 
                            };
                        }
                    }
                }
            }

            return bestPick;
        });

        const results = await Promise.all(promises);
        results.forEach(r => {
            if (r) validPredictions.push(r);
        });
    }

    validPredictions.sort((a, b) => b.percent - a.percent);

    let couponBanko = { title: "Banko Kupon", odds: 1, matches: [] as any[] };
    let couponIdeal = { title: "İdeal Kupon", odds: 1, matches: [] as any[] };
    
    let usedMatches = new Set();
    let alt35CountBanko = 0;

    // Banko Kupon (Hedef Oran: 2.50 - 4.50, 3-4 Maç)
    for (const p of validPredictions) {
        if (couponBanko.matches.length >= 4) break;
        if (usedMatches.has(p.match)) continue;
        
        // Çeşitlilik kuralı: 3.5 ALT çok domine etmesin (Max 1 tane)
        if (p.label === '3.5 ALT') {
            if (alt35CountBanko >= 1) continue;
            alt35CountBanko++;
        }

        couponBanko.matches.push(p);
        couponBanko.odds *= p.odd;
        usedMatches.add(p.match);
        
        if (couponBanko.odds >= 2.5 && couponBanko.matches.length >= 3) break;
    }

    let alt35CountIdeal = 0;
    // İdeal Kupon (Hedef Oran: 4.00 - 8.00+, 3-4 Maç)
    let idealPool = validPredictions.filter(p => !usedMatches.has(p.match));
    idealPool.sort((a, b) => b.odd - a.odd);

    for (const p of idealPool) {
        if (couponIdeal.matches.length >= 4) break;
        if (usedMatches.has(p.match)) continue;

        // Çeşitlilik kuralı
        if (p.label === '3.5 ALT') {
            if (alt35CountIdeal >= 1) continue;
            alt35CountIdeal++;
        }

        couponIdeal.matches.push(p);
        couponIdeal.odds *= p.odd;
        usedMatches.add(p.match);
        
        if (couponIdeal.odds >= 4.0 && couponIdeal.matches.length >= 3) break;
    }

    if (couponBanko.matches.length === 0) {
      couponBanko.odds = 0;
    } else {
      couponBanko.odds = parseFloat(couponBanko.odds.toFixed(2));
    }

    if (couponIdeal.matches.length === 0) {
      couponIdeal.odds = 0;
    } else {
      couponIdeal.odds = parseFloat(couponIdeal.odds.toFixed(2));
    }

    const payload = { 
        success: true, 
        coupons: [couponBanko, couponIdeal] 
    };

    cache.set(cacheKey, payload);
    return NextResponse.json(payload);

  } catch (error: any) {
    console.error('Generate coupons error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
