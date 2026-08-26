require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, count, error } = await supabase
    .from('past_matches')
    .select('id, match_date, match_time, league, home_team, away_team, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd', { count: 'exact' })
    .eq('match_date', '2026-07-29');

  if (error) {
    console.error(error);
  } else {
    console.log(`\nVerified ${data.length} matches in Supabase for 29.07.2026:`);
    data.slice(0, 10).forEach((m, idx) => {
      console.log(`${idx + 1}. [${m.league}] ${m.home_team} ${m.ms_score || '?-?'} ${m.away_team} (İY: ${m.iy_score || '-'}) | Oranlar: ${m.ms_1_odd} - ${m.ms_0_odd} - ${m.ms_2_odd}`);
    });
  }
}

check();
