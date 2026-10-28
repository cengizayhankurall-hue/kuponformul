import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function cleanOdds(val: any): number | null {
  if (val === undefined || val === null || val === '' || val === '-' || val === 0 || val === '0,00' || val === '0.00') return null;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) || num === 0 ? null : num;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const days: { dStr: string; isoDate: string; text: string }[] = body.days || [];

    if (!Array.isArray(days) || days.length === 0) {
      return NextResponse.json({ success: false, error: 'Kaydedilecek veri bulunamadı.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Veritabanı bağlantısı kurulamadı.' }, { status: 500 });
    }

    let totalSaved = 0;
    const processedDates: string[] = [];

    for (const dayItem of days) {
      const { isoDate, text } = dayItem;
      if (!text || text.length < 100 || !text.includes('m:[')) {
        continue;
      }

      let obj: any;
      try {
        obj = new Function(`return ${text}`)();
      } catch (e) {
        console.warn(`[Save Matches] JSON parse error for ${isoDate}:`, e);
        continue;
      }

      const groups = obj.m || [];
      const parsedMatches: any[] = [];

      groups.forEach((g: any) => {
        const matchesList = g.m || [];
        matchesList.forEach((m: any) => {
          if (m && m[1] && m[3]) {
            const homeTeam = String(m[1]).trim();
            const awayTeam = String(m[3]).trim();
            const rawTime = String(m[6] || '00:00').trim();
            const matchTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
            const league = String(m[26] || 'Diger').trim();

            const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
            const hasIyScore = (m[11] !== undefined && m[11] !== null && m[11] !== '' && m[12] !== undefined && m[12] !== null && m[12] !== '');
            const isFinished = state === 4 || hasIyScore || m[13] === '2' || (m[13] === '3' && state === 4);

            const homeMS = m[8] !== undefined && m[8] !== null && m[8] !== '' ? String(m[8]).trim() : null;
            const awayMS = m[9] !== undefined && m[9] !== null && m[9] !== '' ? String(m[9]).trim() : null;
            
            const msScore = (isFinished && homeMS !== null && awayMS !== null && homeMS !== '-1' && awayMS !== '-1') 
              ? `${homeMS} - ${awayMS}` 
              : null;

            const homeIY = m[11] !== undefined && m[11] !== null && m[11] !== '' ? String(m[11]).trim() : null;
            const awayIY = m[12] !== undefined && m[12] !== null && m[12] !== '' ? String(m[12]).trim() : null;
            const iyScore = (homeIY !== null && awayIY !== null && homeIY !== '-1' && awayIY !== '-1') 
              ? `${homeIY}-${awayIY}` 
              : null;

            parsedMatches.push({
              match_date: isoDate,
              match_time: matchTime,
              league: league,
              home_team: homeTeam,
              away_team: awayTeam,
              ms_score: msScore,
              iy_score: iyScore,
              ms_1_odd: cleanOdds(m[16]),
              ms_0_odd: cleanOdds(m[17]),
              ms_2_odd: cleanOdds(m[18]),
              cs_1x_odd: cleanOdds(m[19]),
              cs_12_odd: cleanOdds(m[20]),
              cs_x2_odd: cleanOdds(m[21]),
              alt_25_odd: cleanOdds(m[22]),
              ust_25_odd: cleanOdds(m[23]),
              iy_1_odd: cleanOdds(m[33]),
              iy_0_odd: cleanOdds(m[34]),
              iy_2_odd: cleanOdds(m[35]),
              kg_var_odd: cleanOdds(m[39]),
              kg_yok_odd: cleanOdds(m[40]),
              iy_15_alt_odd: cleanOdds(m[42]),
              iy_15_ust_odd: cleanOdds(m[43]),
              alt_15_odd: cleanOdds(m[44]),
              ust_15_odd: cleanOdds(m[45]),
              alt_35_odd: cleanOdds(m[46]),
              ust_35_odd: cleanOdds(m[47])
            });
          }
        });
      });

      // Deduplicate
      const uniqueMap = new Map();
      parsedMatches.forEach(m => {
        const key = `${m.home_team}__${m.away_team}__${m.match_date}`;
        uniqueMap.set(key, m);
      });
      const uniqueMatches = Array.from(uniqueMap.values());

      if (uniqueMatches.length > 0) {
        for (let i = 0; i < uniqueMatches.length; i += 50) {
          const chunk = uniqueMatches.slice(i, i + 50);
          const { error } = await supabase
            .from('past_matches')
            .upsert(chunk, { onConflict: 'home_team,away_team,match_date' });

          if (error) {
            console.error(`[Save Matches] Upsert error on ${isoDate}:`, error.message);
          }
        }
        totalSaved += uniqueMatches.length;
        processedDates.push(isoDate);
      }
    }

    return NextResponse.json({
      success: true,
      count: totalSaved,
      processedDates,
      message: `Toplam ${totalSaved} maç veritabanına başarıyla aktarıldı.`
    });

  } catch (error: any) {
    console.error('[Save Matches] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Kayıt sırasında hata oluştu: ' + error.message },
      { status: 500 }
    );
  }
}
