require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOdds() {
  const { data, error } = await supabase
    .from('past_matches')
    .select('home_team, away_team, league, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, alt_25_odd, ust_25_odd')
    .eq('match_date', '2026-07-29')
    .not('ms_1_odd', 'is', null);

  if (error) {
    console.error(error);
  } else {
    console.log(`\nFound ${data.length} matches WITH IDDAA ODDS for 29.07.2026:`);
    data.forEach((m, idx) => {
      console.log(`${idx + 1}. [${m.league}] ${m.home_team} ${m.ms_score} ${m.away_team} (İY: ${m.iy_score}) | MS Oranları: ${m.ms_1_odd} - ${m.ms_0_odd} - ${m.ms_2_odd} | 2.5 Alt/Üst: ${m.alt_25_odd} / ${m.ust_25_odd}`);
    });
  }
}

checkOdds();
