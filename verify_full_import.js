require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function verify() {
  console.log(`==================================================`);
  console.log(`VERİTABANI TAM DOĞRULAMA VE İSTATİSTİK RAPORU`);
  console.log(`==================================================`);

  // Total count
  const { count: totalCount, error: cntErr } = await supabase
    .from('past_matches')
    .select('*', { count: 'exact', head: true });

  console.log(`Toplama Kayıtlı Maç Sayısı: ${totalCount}`);

  // Sample recent matches (2026)
  const { data: sample2026 } = await supabase
    .from('past_matches')
    .select('home_team, away_team, league, match_date, match_time, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, alt_25_odd, ust_25_odd, kg_var_odd')
    .gte('match_date', '2026-08-01')
    .limit(4);

  console.log(`\nÖrnek Güncel Maçlar (Ağustos 2026):`);
  if (sample2026) {
    sample2026.forEach(m => {
      console.log(`  ${m.match_date} ${m.match_time} | ${m.home_team} vs ${m.away_team} (${m.league}) | MS: ${m.ms_score} | İY: ${m.iy_score} | 1: ${m.ms_1_odd}, X: ${m.ms_0_odd}, 2: ${m.ms_2_odd}`);
    });
  }

  // Sample 2019 matches
  const { data: sample2019 } = await supabase
    .from('past_matches')
    .select('home_team, away_team, league, match_date, match_time, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, alt_25_odd, ust_25_odd, kg_var_odd')
    .gte('match_date', '2019-08-01')
    .lte('match_date', '2019-08-31')
    .limit(3);

  console.log(`\nÖrnek Arşiv Maçları (Ağustos 2019):`);
  if (sample2019) {
    sample2019.forEach(m => {
      console.log(`  ${m.match_date} ${m.match_time} | ${m.home_team} vs ${m.away_team} (${m.league}) | MS: ${m.ms_score} | İY: ${m.iy_score} | 1: ${m.ms_1_odd}, X: ${m.ms_0_odd}, 2: ${m.ms_2_odd}`);
    });
  }
}

verify().catch(console.error);
