const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const dates = ['2026-07-31', '2026-08-01', '2026-08-02'];
  for (const d of dates) {
    const { data, error } = await supabase
      .from('past_matches')
      .select('home_team, away_team, league, match_time, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, alt_25_odd, ust_25_odd')
      .eq('match_date', d)
      .limit(5);

    console.log(`\n--- Sample matches for ${d} ---`);
    data.forEach(m => {
      console.log(`${m.home_team} vs ${m.away_team} (${m.league}) | MS: ${m.ms_score} | İY: ${m.iy_score} | MS1: ${m.ms_1_odd}, MSX: ${m.ms_0_odd}, MS2: ${m.ms_2_odd}`);
    });
  }
}

run().catch(console.error);
