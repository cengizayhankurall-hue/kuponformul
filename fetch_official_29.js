require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function cleanOdds(val) {
  if (!val || val === '0,00' || val === '0.00' || val === '-' || val === 0) return null;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) || num === 0 ? null : num;
}

async function updateOddsFromMackolik() {
  console.log('Fetching official odds from Mackolik archive for 29.07.2026...');
  
  // Fetch type 6 archive
  const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=29.07.2026&sort=-1&sortDir=-1&groupId=-1&np=1&sport=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': 'https://arsiv.mackolik.com/Canli-Sonuclar'
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    console.error('Mackolik archive error status:', res.status);
    return;
  }

  const txt = await res.text();
  console.log('Mackolik archive text length:', txt.length);

  if (txt.length < 500) {
    console.log('Archive text response:', txt);
    return;
  }

  const obj = new Function(`return ${txt}`)();
  const groups = obj.m || [];
  const updates = [];

  groups.forEach((g) => {
    const matchesList = g.m || [];
    matchesList.forEach((m) => {
      if (m[1] && m[3]) {
        const homeTeam = String(m[1]).trim();
        const awayTeam = String(m[3]).trim();
        const league = String(m[26] || 'Diğer').trim();
        const time = String(m[6] || '00:00').trim();

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

        const ms1 = cleanOdds(m[16]);
        const msX = cleanOdds(m[17]);
        const ms2 = cleanOdds(m[18]);
        const iy1 = cleanOdds(m[33]);
        const iyX = cleanOdds(m[34]);
        const iy2 = cleanOdds(m[35]);
        const kgVar = cleanOdds(m[39]);
        const kgYok = cleanOdds(m[40]);
        const cs1X = cleanOdds(m[19]);
        const cs12 = cleanOdds(m[20]);
        const csX2 = cleanOdds(m[21]);
        const alt25 = cleanOdds(m[22]);
        const ust25 = cleanOdds(m[23]);

        updates.push({
          match_date: '2026-07-29',
          match_time: time,
          league: league,
          home_team: homeTeam,
          away_team: awayTeam,
          iy_score: iyScore,
          ms_score: msScore,
          ms_1_odd: ms1,
          ms_0_odd: msX,
          ms_2_odd: ms2,
          iy_1_odd: iy1,
          iy_0_odd: iyX,
          iy_2_odd: iy2,
          kg_var_odd: kgVar,
          kg_yok_odd: kgYok,
          cs_1x_odd: cs1X,
          cs_12_odd: cs12,
          cs_x2_odd: csX2,
          alt_25_odd: alt25,
          ust_25_odd: ust25
        });
      }
    });
  });

  console.log(`Found ${updates.length} matches with full odds in Mackolik archive.`);

  if (updates.length > 0) {
    let count = 0;
    for (let i = 0; i < updates.length; i += 50) {
      const chunk = updates.slice(i, i + 50);
      const { error } = await supabase.from('past_matches').upsert(chunk, { onConflict: 'home_team,away_team,match_date' });
      if (error) console.error('Upsert error:', error.message);
      else count += chunk.length;
    }
    console.log(`Successfully upserted ${count} matches with full odds!`);
  }
}

updateOddsFromMackolik().catch(console.error);
