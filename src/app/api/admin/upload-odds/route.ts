import { NextResponse } from 'next/server';
import { supabase, isMockMode } from '@/lib/supabase';

// Memory storage for mock mode fallback
let mockPastMatches: any[] = [];

// Helper to convert date format from DD.MM.YYYY to YYYY-MM-DD
function parseDate(dateStr: string): string {
  try {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } catch (e) {}
  return dateStr;
}

// Helper to clean numeric values (convert "1,82" to 1.82)
function cleanNum(val: any): number | null {
  if (val === undefined || val === null || val === '' || val === '-') return null;
  const cleaned = String(val).replace(',', '.');
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matches } = body;

    if (!Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json({ success: false, error: 'Maç listesi boş olamaz.' }, { status: 400 });
    }

    const processedMatches = matches.map((m: any) => {
      return {
        match_date: parseDate(m.date),
        match_time: m.time || '',
        league: m.league || 'Diğer',
        home_team: m.homeTeam || '',
        away_team: m.awayTeam || '',
        iy_score: m.iyScore || null,
        ms_score: m.msScore || null,
        ms1: cleanNum(m.ms1),
        msX: cleanNum(m.msX),
        ms2: cleanNum(m.ms2),
        iy1: cleanNum(m.iy1),
        iyX: cleanNum(m.iyX),
        iy2: cleanNum(m.iy2),
        kg_var: cleanNum(m.kgVar),
        kg_yok: cleanNum(m.kgYok),
        cs_1x: cleanNum(m.cs1X),
        cs_12: cleanNum(m.cs12),
        cs_x2: cleanNum(m.csX2),
        iy_alt_15: cleanNum(m.iyAlt15),
        iy_ust_15: cleanNum(m.iyUst15),
        alt_15: cleanNum(m.alt15),
        ust_15: cleanNum(m.ust15),
        alt_25: cleanNum(m.alt25),
        ust_25: cleanNum(m.ust25),
        alt_35: cleanNum(m.alt35),
        ust_35: cleanNum(m.ust35),
        tg_0_1: cleanNum(m.tg01),
        tg_2_3: cleanNum(m.tg23),
        tg_4_5: cleanNum(m.tg45),
        tg_6_plus: cleanNum(m.tg6Plus)
      };
    });

    if (isMockMode) {
      // Mock Mode: UPSERT by matching home_team, away_team, date, time
      processedMatches.forEach((m) => {
        const idx = mockPastMatches.findIndex(
          (x) => x.home_team === m.home_team &&
                 x.away_team === m.away_team &&
                 x.match_date === m.match_date &&
                 x.match_time === m.match_time
        );
        if (idx !== -1) {
          mockPastMatches[idx] = { ...mockPastMatches[idx], ...m };
        } else {
          mockPastMatches.push(m);
        }
      });

      return NextResponse.json({
        success: true,
        message: `${processedMatches.length} maç mock hafızaya upsert edildi.`,
        inserted: processedMatches.length,
        isMock: true
      });
    }

    // Supabase Mode: Upsert to table past_matches using unique key home_team, away_team, match_date, match_time
    const { data, error } = await supabase!
      .from('past_matches')
      .upsert(processedMatches, {
        onConflict: 'home_team,away_team,match_date,match_time'
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `${processedMatches.length} maç veritabanına başarıyla yüklendi / güncellendi.`,
      inserted: processedMatches.length
    });

  } catch (error: any) {
    console.error('Upload Odds Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
