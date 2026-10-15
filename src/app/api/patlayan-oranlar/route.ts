import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Memory cache for ultra-fast responses (<5ms)
let cachedData: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 dakika

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('dates');
    const isDefaultQuery = !dateParam || dateParam === 'latest_3_days' || dateParam === 'all';
    const now = Date.now();

    if (isDefaultQuery && cachedData && now - lastCacheTime < CACHE_TTL_MS) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=300'
        }
      });
    }

    if (!supabaseUrl || !supabaseKey) {
      if (cachedData) return NextResponse.json(cachedData);
      return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let targetDates: string[] = [];

    if (dateParam && dateParam !== 'latest_3_days' && dateParam !== 'all') {
      targetDates = dateParam.split(',').map(d => d.trim()).filter(Boolean);
    } else {
      // Dinamik olarak veritabanındaki son 3 günü hızlıca çek
      const { data: latestDateRows, error: dateErr } = await supabase
        .from('past_matches')
        .select('match_date')
        .order('match_date', { ascending: false })
        .limit(300);

      if (dateErr) {
        console.error('Tarih çekme hatası:', dateErr);
      }

      const distinct = Array.from(new Set(latestDateRows?.map(r => r.match_date).filter(Boolean) || []));
      targetDates = distinct.slice(0, 3);
    }

    // Yalnızca gerekli sütunları seç (SELECT * yerine) ve tek sorguda en fazla 1500 maç çek
    let query = supabase
      .from('past_matches')
      .select('id, match_date, match_time, league, home_team, away_team, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, iy_1_odd, iy_0_odd, iy_2_odd, alt_25_odd, ust_25_odd, kg_var_odd, kg_yok_odd')
      .not('ms_score', 'is', null);

    if (targetDates.length > 0) {
      query = query.in('match_date', targetDates);
    }

    const { data: allMatches, error } = await query
      .order('match_date', { ascending: false })
      .limit(1500);

    if (error) {
      console.error('Supabase query error:', error);
      if (cachedData) return NextResponse.json(cachedData);
      return NextResponse.json({ error: 'Veri çekilemedi' }, { status: 500 });
    }

    const matchesList = allMatches || [];

    // Pool counts per date
    const datePoolCounts: Record<string, number> = {};
    for (const d of targetDates) {
      datePoolCounts[d] = 0;
    }

    const favoriteMatches: any[] = [];

    for (const m of matchesList) {
      const matchDate = m.match_date;
      if (datePoolCounts[matchDate] !== undefined) {
        datePoolCounts[matchDate]++;
      } else {
        datePoolCounts[matchDate] = 1;
      }

      if (!m.ms_score || !m.ms_score.includes('-')) continue;
      const scoreParts = m.ms_score.replace(':', '-').split('-');
      if (scoreParts.length < 2) continue;
      const hGoals = parseInt(scoreParts[0].trim(), 10);
      const aGoals = parseInt(scoreParts[1].trim(), 10);
      if (isNaN(hGoals) || isNaN(aGoals)) continue;

      const ms1 = parseFloat(m.ms_1_odd);
      const ms0 = parseFloat(m.ms_0_odd);
      const ms2 = parseFloat(m.ms_2_odd);

      let isFavorite = false;
      let isBusted = false;
      let favoriteType: 'MS 1 (Ev Sahibi)' | 'MS 2 (Deplasman)' | '' = '';
      let favoriteOdd = 0;
      let actualResult = '';
      let outcomeType: '0' | 'reverse' | 'won' = 'won';

      // Ev Sahibi Favori (1.05 - 1.45)
      if (!isNaN(ms1) && ms1 >= 1.05 && ms1 <= 1.45) {
        isFavorite = true;
        favoriteType = 'MS 1 (Ev Sahibi)';
        favoriteOdd = ms1;

        if (hGoals <= aGoals) {
          isBusted = true;
          if (hGoals === aGoals) {
            actualResult = 'MS 0 (Berabere)';
            outcomeType = '0';
          } else {
            actualResult = 'MS 2 (Deplasman Galibiyeti)';
            outcomeType = 'reverse';
          }
        } else {
          actualResult = 'MS 1 (Favori Kazandı)';
          outcomeType = 'won';
        }
      }
      // Deplasman Favori (1.05 - 1.45)
      else if (!isNaN(ms2) && ms2 >= 1.05 && ms2 <= 1.45) {
        isFavorite = true;
        favoriteType = 'MS 2 (Deplasman)';
        favoriteOdd = ms2;

        if (aGoals <= hGoals) {
          isBusted = true;
          if (hGoals === aGoals) {
            actualResult = 'MS 0 (Berabere)';
            outcomeType = '0';
          } else {
            actualResult = 'MS 1 (Ev Sahibi Galibiyeti)';
            outcomeType = 'reverse';
          }
        } else {
          actualResult = 'MS 2 (Favori Kazandı)';
          outcomeType = 'won';
        }
      }

      if (isFavorite) {
        favoriteMatches.push({
          id: m.id,
          date: m.match_date,
          time: m.match_time ? m.match_time.slice(0, 5) : '',
          league: m.league || 'Bilinmeyen Lig',
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          score: m.ms_score,
          iyScore: m.iy_score || '-',
          favoriteType,
          favoriteOdd,
          isBusted,
          actualResult,
          outcomeType,
          odds: {
            ms1: !isNaN(ms1) ? ms1.toFixed(2) : '-',
            ms0: !isNaN(ms0) ? ms0.toFixed(2) : '-',
            ms2: !isNaN(ms2) ? ms2.toFixed(2) : '-',
            iy1: m.iy_1_odd ? parseFloat(m.iy_1_odd).toFixed(2) : '-',
            iy0: m.iy_0_odd ? parseFloat(m.iy_0_odd).toFixed(2) : '-',
            iy2: m.iy_2_odd ? parseFloat(m.iy_2_odd).toFixed(2) : '-',
            alt25: m.alt_25_odd ? parseFloat(m.alt_25_odd).toFixed(2) : '-',
            ust25: m.ust_25_odd ? parseFloat(m.ust_25_odd).toFixed(2) : '-',
            kgVar: m.kg_var_odd ? parseFloat(m.kg_var_odd).toFixed(2) : '-',
            kgYok: m.kg_yok_odd ? parseFloat(m.kg_yok_odd).toFixed(2) : '-'
          }
        });
      }
    }

    // Sort favorite matches: date desc, time asc
    favoriteMatches.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.time.localeCompare(b.time);
    });

    const responsePayload = {
      success: true,
      distinctDates: targetDates,
      totalMatchesInPool: matchesList.length,
      datePoolCounts,
      favorites: favoriteMatches
    };

    if (isDefaultQuery) {
      cachedData = responsePayload;
      lastCacheTime = now;
    }

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=300'
      }
    });
  } catch (error: any) {
    console.error('Patlayan oranlar api error:', error);
    if (cachedData) return NextResponse.json(cachedData);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}
