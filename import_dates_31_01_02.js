const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase env missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseOdd(val) {
  if (!val || val === '-' || val === '0,00' || val === '0.00' || val === 0 || val === '0') return null;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
}

function parseScore(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
}

async function fetchDayData(dateStr) {
  console.log(`\nFetching Mackolik Geniş İddaa for date: ${dateStr}...`);
  const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dateStr}&np=0&sport=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'
    }
  });

  const text = await res.text();
  console.log(`Received payload length for ${dateStr}: ${text.length} chars`);

  const parts = text.split(';;');
  console.log(`Raw matches count in payload: ${parts.length}`);

  const rows = [];
  for (const p of parts) {
    if (!p || !p.includes('|')) continue;
    const cols = p.split('|');
    if (cols.length < 15) continue;

    const homeTeam = (cols[1] || '').trim();
    const awayTeam = (cols[3] || '').trim();
    const timeStr = (cols[6] || '').trim();
    const matchDateStr = (cols[7] || dateStr).trim();
    const league = (cols[26] || 'Diğer').trim();

    const homeScore = parseScore(cols[8]);
    const awayScore = parseScore(cols[9]);
    const iyHomeScore = parseScore(cols[11]);
    const iyAwayScore = parseScore(cols[12]);

    const ms1 = parseOdd(cols[16]);
    const ms0 = parseOdd(cols[17]);
    const ms2 = parseOdd(cols[18]);

    const cs1x = parseOdd(cols[19]);
    const cs12 = parseOdd(cols[20]);
    const csx2 = parseOdd(cols[21]);

    const alt25 = parseOdd(cols[22]);
    const ust25 = parseOdd(cols[23]);

    const iy1 = parseOdd(cols[33]);
    const iy0 = parseOdd(cols[34]);
    const iy2 = parseOdd(cols[35]);

    const kgVar = parseOdd(cols[39]);
    const kgYok = parseOdd(cols[40]);

    const iy15Alt = parseOdd(cols[42]);
    const iy15Ust = parseOdd(cols[43]);

    const alt15 = parseOdd(cols[44]);
    const ust15 = parseOdd(cols[45]);

    const alt35 = parseOdd(cols[46]);
    const ust35 = parseOdd(cols[47]);

    if (homeTeam && awayTeam) {
      rows.push({
        home_team: homeTeam,
        away_team: awayTeam,
        match_date: matchDateStr,
        match_time: timeStr,
        league: league,
        home_score: homeScore,
        away_score: awayScore,
        iy_home_score: iyHomeScore,
        iy_away_score: iyAwayScore,
        ms_1_odd: ms1,
        ms_0_odd: ms0,
        ms_2_odd: ms2,
        cs_1x_odd: cs1x,
        cs_12_odd: cs12,
        cs_x2_odd: csx2,
        alt_25_odd: alt25,
        ust_25_odd: ust25,
        iy_1_odd: iy1,
        iy_0_odd: iy0,
        iy_2_odd: iy2,
        kg_var_odd: kgVar,
        kg_yok_odd: kgYok,
        iy_15_alt_odd: iy15Alt,
        iy_15_ust_odd: iy15Ust,
        alt_15_odd: alt15,
        ust_15_odd: ust15,
        alt_35_odd: alt35,
        ust_35_odd: ust35
      });
    }
  }

  return rows;
}

async function run() {
  const dates = ['31/07/2026', '01/08/2026', '02/08/2026'];
  let totalImported = 0;

  for (const d of dates) {
    const rows = await fetchDayData(d);
    console.log(`Parsed ${rows.length} valid matches for ${d}.`);

    if (rows.length > 0) {
      // Upsert in batches of 50
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { data, error } = await supabase
          .from('past_matches')
          .upsert(batch, { onConflict: 'home_team,away_team,match_date' });

        if (error) {
          console.error(`Upsert error for ${d} (batch ${i}):`, error);
        }
      }
      totalImported += rows.length;
      console.log(`Successfully upserted ${rows.length} matches for ${d}.`);
    }
  }

  console.log(`\nAll done! Total imported matches across 3 days: ${totalImported}`);

  // Verification counts from Supabase
  console.log('\n--- VERIFICATION FROM SUPABASE ---');
  for (const d of dates) {
    const { count, error } = await supabase
      .from('past_matches')
      .select('*', { count: 'exact', head: true })
      .eq('match_date', d);
    console.log(`Date: ${d} -> Supabase Match Count: ${count} (Error: ${error ? error.message : 'None'})`);
  }
}

run().catch(console.error);
