import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('dates') || '2026-09-11,2026-09-12,2026-09-13';
    const minOdd = parseFloat(searchParams.get('min_odd') || '1.05');
    const maxOdd = parseFloat(searchParams.get('max_odd') || '1.45');
    const outcomeFilter = searchParams.get('outcome') || 'all'; // 'all', '0', 'reverse'

    const targetDates = dateParam.split(',').map(d => d.trim()).filter(Boolean);

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let allMatches: any[] = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      let query = supabase
        .from('past_matches')
        .select('*');

      if (targetDates.length > 0 && !targetDates.includes('all')) {
        query = query.in('match_date', targetDates);
      }

      const { data, error } = await query.range(from, from + pageSize - 1);

      if (error) {
        console.error('Supabase query error:', error);
        break;
      }

      if (!data || data.length === 0) break;
      allMatches = allMatches.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    let totalFavoritesCount = 0;
    const bustedMatches: any[] = [];
    const dateStats: Record<string, { total: number; favorites: number; busted: number }> = {};

    for (const d of targetDates) {
      dateStats[d] = { total: 0, favorites: 0, busted: 0 };
    }

    for (const m of allMatches) {
      const matchDate = m.match_date;
      if (!dateStats[matchDate]) {
        dateStats[matchDate] = { total: 0, favorites: 0, busted: 0 };
      }
      dateStats[matchDate].total++;

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
      let outcomeType: '0' | 'reverse' = '0';

      // Ev Sahibi Favori (minOdd - maxOdd)
      if (!isNaN(ms1) && ms1 >= minOdd && ms1 <= maxOdd) {
        isFavorite = true;
        totalFavoritesCount++;
        dateStats[matchDate].favorites++;
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
        }
      }
      // Deplasman Favori (minOdd - maxOdd)
      else if (!isNaN(ms2) && ms2 >= minOdd && ms2 <= maxOdd) {
        isFavorite = true;
        totalFavoritesCount++;
        dateStats[matchDate].favorites++;
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
        }
      }

      if (isBusted) {
        dateStats[matchDate].busted++;

        if (outcomeFilter === 'all' || outcomeFilter === outcomeType) {
          bustedMatches.push({
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
    }

    // Sort by date desc, then time asc
    bustedMatches.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.time.localeCompare(b.time);
    });

    const totalBustedCount = Object.values(dateStats).reduce((acc, curr) => acc + curr.busted, 0);
    const overallRate = totalFavoritesCount > 0 ? ((totalBustedCount / totalFavoritesCount) * 100).toFixed(1) : '0';

    return NextResponse.json({
      success: true,
      summary: {
        totalMatchesInPool: allMatches.length,
        totalFavoritesCount,
        totalBustedCount,
        overallBustedRate: overallRate,
        minOdd,
        maxOdd,
        dateStats
      },
      matches: bustedMatches
    });
  } catch (error: any) {
    console.error('Patlayan oranlar error:', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}
