const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    envVars[match[1]] = value;
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  console.log("=== Fetching all rows for July 28 and 29 ===");
  const { data: rows, error } = await supabase
    .from('past_matches')
    .select('id, home_team, away_team, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, iy_1_odd, alt_25_odd')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Total rows fetched: ${rows.length}`);

  // Identify junk rows: no odds at all (ms_1_odd is null AND iy_1_odd is null AND alt_25_odd is null) OR basketball scores (e.g. 0-92)
  const junkIds = rows.filter(r => {
    const hasNoOdds = (r.ms_1_odd === null && r.iy_1_odd === null && r.alt_25_odd === null);
    const isBasketballScore = (r.ms_score && (parseInt(r.ms_score.split('-')[1]) > 30 || parseInt(r.ms_score.split('-')[0]) > 30));
    return hasNoOdds || isBasketballScore;
  }).map(r => r.id);

  console.log(`Found ${junkIds.length} junk rows without odds / basketball matches to remove.`);

  if (junkIds.length > 0) {
    for (let i = 0; i < junkIds.length; i += 100) {
      const batch = junkIds.slice(i, i + 100);
      const { error: delErr } = await supabase.from('past_matches').delete().in('id', batch);
      if (delErr) console.error("Del error:", delErr);
    }
    console.log("Cleaned up junk rows successfully!");
  }

  // Verification after cleanup
  const { data: cleanRows } = await supabase
    .from('past_matches')
    .select('id, match_date, home_team, away_team, ms_score, iy_score, ms_1_odd')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29')
    .order('match_date', { ascending: true });

  console.log(`\nRemaining clean Geniş İddaa rows count: ${cleanRows.length}`);
  cleanRows.forEach((r, idx) => {
    console.log(`[${idx+1}] Date:${r.match_date} | ${r.home_team} vs ${r.away_team} | MS:${r.ms_score} IY:${r.iy_score} | MS1:${r.ms_1_odd}`);
  });
}

run();
