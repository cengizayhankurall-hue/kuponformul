require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function parseDate(dateStr) {
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } catch (e) {}
  return dateStr;
}

async function fetchLiveResults() {
  const d = '28/07/2026';
  console.log(`Fetching livedata results for ${d}...`);
  const url = `https://vd.mackolik.com/livedata?date=${d}`;
  
  const res = await fetch(url, { cache: 'no-store' });
  const liveData = await res.json();
  
  const parsedMatches = [];
  if (liveData && Array.isArray(liveData.m)) {
    for (const item of liveData.m) {
      const homeTeam = String(item[2] || '');
      const awayTeam = String(item[4] || '');
      const league = item[36] && item[36][1] ? `${item[36][1]} ${item[36][2] || ''}` : 'Canlı Lig';
      
      const homeGoals = item[12] !== undefined && item[12] !== null ? item[12] : (item[29] !== undefined && item[29] !== null ? item[29] : null);
      const awayGoals = item[13] !== undefined && item[13] !== null ? item[13] : (item[30] !== undefined && item[30] !== null ? item[30] : null);
      
      let msScore = null;
      if (homeGoals !== null && awayGoals !== null) {
          msScore = `${homeGoals}-${awayGoals}`;
      }
      
      // Let's assume IY scores aren't easily available here, but MS is enough for most evaluations.
      
      const ms1 = parseFloat(item[18]) || null;
      const msX = parseFloat(item[19]) || null;
      const ms2 = parseFloat(item[20]) || null;
      
      parsedMatches.push({
          match_date: parseDate(d),
          match_time: null,
          league: league,
          home_team: homeTeam,
          away_team: awayTeam,
          ms_score: msScore,
          ms_1_odd: ms1,
          ms_0_odd: msX,
          ms_2_odd: ms2
      });
    }
  }
  
  console.log(`Found ${parsedMatches.length} matches. Upserting to past_matches...`);
  
  let insertedCount = 0;
  for (let i = 0; i < parsedMatches.length; i += 100) {
    const chunk = parsedMatches.slice(i, i + 100);
    const { data, error } = await supabase
      .from('past_matches')
      .upsert(chunk, {
        onConflict: 'home_team,away_team,match_date'
      });
      
    if (error) {
       console.error('Error inserting chunk:', error);
    } else {
       insertedCount += chunk.length;
       console.log(`Inserted ${insertedCount}/${parsedMatches.length}...`);
    }
  }
  console.log('Done!');
}

fetchLiveResults().catch(console.error);
