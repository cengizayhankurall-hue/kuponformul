const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function parseOdd(val) {
  if (!val || val === '-' || val === '0,00' || val === '0.00' || val === 0) return null;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) || num <= 1.01 ? null : num;
}

async function syncDay(dStr, isoDate) {
  console.log(`Starting sync for ${dStr} (${isoDate})...`);
  const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;

  const data = await new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });

  if (!data || !data.includes('m:[')) {
    console.log(`No match data for ${dStr}`);
    return 0;
  }

  const obj = new Function(`return ${data}`)();
  const groups = obj.m || [];
  const rows = [];

  groups.forEach(g => {
    const list = g.m || [];
    list.forEach(m => {
      if (m && m[1] && m[3]) {
        const homeTeam = String(m[1]).trim();
        const awayTeam = String(m[3]).trim();
        const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
        const hasIy = (m[11] !== undefined && m[11] !== null && m[11] !== '');
        const isFinished = state === 4 || hasIy;

        const hMS = m[8] !== undefined && m[8] !== null && m[8] !== '' ? String(m[8]).trim() : null;
        const aMS = m[9] !== undefined && m[9] !== null && m[9] !== '' ? String(m[9]).trim() : null;
        const msScore = (isFinished && hMS !== null && aMS !== null && hMS !== '-1' && aMS !== '-1')
          ? `${hMS} - ${aMS}`
          : null;

        if (!msScore) return;

        const hIY = m[11] !== undefined && m[11] !== null && m[11] !== '' ? String(m[11]).trim() : null;
        const aIY = m[12] !== undefined && m[12] !== null && m[12] !== '' ? String(m[12]).trim() : null;
        const iyScore = (hIY !== null && aIY !== null && hIY !== '-1' && aIY !== '-1')
          ? `${hIY}-${aIY}`
          : null;

        const rawTime = String(m[6] || '20:00').trim();
        const matchTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
        const league = String(m[26] || 'Diger').trim();

        rows.push({
          match_date: isoDate,
          match_time: matchTime,
          home_team: homeTeam,
          away_team: awayTeam,
          league: league,
          ms_score: msScore,
          iy_score: iyScore,
          ms_1_odd: parseOdd(m[16]),
          ms_0_odd: parseOdd(m[17]),
          ms_2_odd: parseOdd(m[18]),
          cs_1x_odd: parseOdd(m[19]),
          cs_12_odd: parseOdd(m[20]),
          cs_x2_odd: parseOdd(m[21]),
          alt_25_odd: parseOdd(m[22]),
          ust_25_odd: parseOdd(m[23]),
          alt_15_odd: parseOdd(m[44]),
          ust_15_odd: parseOdd(m[45]),
          alt_35_odd: parseOdd(m[46]),
          ust_35_odd: parseOdd(m[47]),
          kg_var_odd: parseOdd(m[39]),
          kg_yok_odd: parseOdd(m[40])
        });
      }
    });
  });

  console.log(`Parsed ${rows.length} finished matches for ${isoDate}`);
  if (rows.length > 0) {
    await supabase.from('past_matches').delete().eq('match_date', isoDate);
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await supabase.from('past_matches').insert(batch);
      if (error) {
        console.error('Insert error batch:', error);
      }
    }
    console.log(`Successfully inserted ${rows.length} rows for ${isoDate}`);
  }
  return rows.length;
}

async function main() {
  await syncDay('18/10/2026', '2026-10-18');
  await syncDay('17/10/2026', '2026-10-17');
  console.log('Sync completed.');
  process.exit(0);
}

main();
