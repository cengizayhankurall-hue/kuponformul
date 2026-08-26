require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function parseDate(dateStr) {
  try {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } catch (e) {}
  return dateStr;
}

function cleanOdds(val) {
  if (!val || val === '0,00' || val === '0.00' || val === '-' || val === 0) return null;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) || num === 0 ? null : num;
}

async function runFix() {
  console.log('1. Cleaning up 2026-07-29 rows in past_matches...');
  const { error: delErr } = await supabase
    .from('past_matches')
    .delete()
    .eq('match_date', '2026-07-29');

  if (delErr) console.error('Delete error:', delErr);
  else console.log('Successfully cleaned 2026-07-29 rows.');

  console.log('\n2. Fetching Mackolik Football Program for 29.07.2026...');
  const dateStr = '29.07.2026';
  
  // Try ProgramDataHandler endpoints (type 6, type 2, type 1)
  let rawText = '';
  const endpoints = [
    `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dateStr}&sort=-1&sortDir=-1&groupId=-1&np=1&sport=1`,
    `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=2&sortValue=DATE&day=${dateStr}&sort=-1&sortDir=-1&groupId=-1&np=1&sport=1`,
    `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=1&sortValue=DATE&day=${dateStr}&sort=-1&sortDir=-1&groupId=-1&np=1&sport=1`
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': 'https://arsiv.mackolik.com/'
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const txt = await res.text();
        if (txt.length > 500) {
          rawText = txt;
          console.log(`Successfully fetched from ${ep} (length: ${txt.length})`);
          break;
        }
      }
    } catch (e) {
      console.warn('Endpoint failed:', ep, e.message);
    }
  }

  const parsedMatches = [];

  if (rawText.length > 500) {
    const obj = new Function(`return ${rawText}`)();
    const groups = obj.m || [];

    groups.forEach((g) => {
      const matchesList = g.m || [];
      matchesList.forEach((m) => {
        if (m[1] && m[3]) {
          const homeTeam = String(m[1]).trim();
          const awayTeam = String(m[3]).trim();
          const league = String(m[26] || 'Diğer').trim();
          const time = String(m[6] || '00:00').trim();
          const date = String(m[7] || dateStr).trim();

          let msScore = null;
          let iyScore = null;

          let hMS = m[14]; let aMS = m[15];
          let hIY = m[12]; let aIY = m[13];

          if (hMS !== null && hMS !== undefined && String(hMS).trim() !== '' &&
              aMS !== null && aMS !== undefined && String(aMS).trim() !== '') {
             msScore = `${hMS}-${aMS}`;
          }
          if (hIY !== null && hIY !== undefined && String(hIY).trim() !== '' &&
              aIY !== null && aIY !== undefined && String(aIY).trim() !== '') {
             iyScore = `${hIY}-${aIY}`;
          }

          parsedMatches.push({
            match_date: parseDate(date),
            match_time: time,
            league: league,
            home_team: homeTeam,
            away_team: awayTeam,
            iy_score: iyScore,
            ms_score: msScore,
            ms_1_odd: cleanOdds(m[16]),
            ms_0_odd: cleanOdds(m[17]),
            ms_2_odd: cleanOdds(m[18]),
            iy_1_odd: cleanOdds(m[33]),
            iy_0_odd: cleanOdds(m[34]),
            iy_2_odd: cleanOdds(m[35]),
            kg_var_odd: cleanOdds(m[39]),
            kg_yok_odd: cleanOdds(m[40]),
            cs_1x_odd: cleanOdds(m[19]),
            cs_12_odd: cleanOdds(m[20]),
            cs_x2_odd: cleanOdds(m[21]),
            alt_25_odd: cleanOdds(m[22]),
            ust_25_odd: cleanOdds(m[23])
          });
        }
      });
    });
  }

  // If ProgramDataHandler didn't return text yet, use livedata with detailed odds mapping & football filter
  if (parsedMatches.length === 0) {
    console.log('Fetching from Mackolik livedata with strict football filtering...');
    const liveRes = await fetch('https://vd.mackolik.com/livedata?date=29/07/2026', { cache: 'no-store' });
    const liveJson = await liveRes.json();
    const rawMatches = liveJson.m || [];

    for (const m of rawMatches) {
      if (!m || !m[2] || !m[4]) continue;

      const leagueName = m[36] && m[36][1] ? String(m[36][1]) : '';
      const lowerLeague = leagueName.toLowerCase();

      // STRICTLY FILTER OUT NON-FOOTBALL (Basketball, Tennis, Volleyball, etc.)
      if (lowerLeague.includes('basket') || lowerLeague.includes('nba') ||
          lowerLeague.includes('tenis') || lowerLeague.includes('voley') ||
          lowerLeague.includes('handball') || lowerLeague.includes('hentbol')) {
        continue;
      }

      const homeTeam = String(m[2]).trim();
      const awayTeam = String(m[4]).trim();
      const matchTime = String(m[16] || '00:00').trim();

      let league = leagueName;
      if (m[36] && m[36][2]) league += ` ${m[36][2]}`.trim();

      // Skorlar
      let msScore = null;
      if (m[11] !== undefined && m[11] !== null && String(m[11]).trim() !== '' &&
          m[12] !== undefined && m[12] !== null && String(m[12]).trim() !== '') {
        msScore = `${m[11]}-${m[12]}`;
      } else if (typeof m[7] === 'string' && m[7].includes('-') && !m[7].includes(':')) {
        msScore = m[7].trim();
      }

      // İY Skor (m[15] objesinden veya h1/h2)
      let iyScore = null;
      if (m[15] && typeof m[15] === 'object') {
        if (m[15].h1 !== undefined && m[15].h1 !== null && m[15].h2 !== undefined && m[15].h2 !== null) {
          iyScore = `${m[15].h1}-${m[15].h2}`;
        }
      }

      // Oranlar: m[18]=MS1, m[19]=MSX, m[20]=MS2, m[21]=Alt2.5, m[22]=Üst2.5
      const ms1 = cleanOdds(m[18]);
      const msX = cleanOdds(m[19]);
      const ms2 = cleanOdds(m[20]);
      const alt25 = cleanOdds(m[21]);
      const ust25 = cleanOdds(m[22]);

      parsedMatches.push({
        match_date: '2026-07-29',
        match_time: matchTime,
        league: league || 'Diğer',
        home_team: homeTeam,
        away_team: awayTeam,
        iy_score: iyScore,
        ms_score: msScore,
        ms_1_odd: ms1,
        ms_0_odd: msX,
        ms_2_odd: ms2,
        alt_25_odd: alt25,
        ust_25_odd: ust25
      });
    }
  }

  console.log(`3. Upserting ${parsedMatches.length} FOOTBALL-ONLY matches into past_matches...`);

  let insertedCount = 0;
  for (let i = 0; i < parsedMatches.length; i += 50) {
    const chunk = parsedMatches.slice(i, i + 50);
    const { data, error } = await supabase
      .from('past_matches')
      .upsert(chunk, {
        onConflict: 'home_team,away_team,match_date'
      });

    if (error) {
      console.error(`Chunk ${i / 50 + 1} insert error:`, error.message);
    } else {
      insertedCount += chunk.length;
      console.log(`Upserted ${insertedCount}/${parsedMatches.length} matches...`);
    }
  }

  console.log('\n==========================================');
  console.log(`✅ COMPLETE: 29.07.2026 Maç Sonuçları Tamamen Düzeltildi!`);
  console.log(`   Futbol Maç Sayısı: ${insertedCount}`);
  console.log('==========================================\n');
}

runFix().catch(console.error);
