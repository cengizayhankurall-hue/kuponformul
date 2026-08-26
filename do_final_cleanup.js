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
  console.log("=== Fetching all 566 rows ===");
  const { data: rows, error } = await supabase
    .from('past_matches')
    .select('id, ms_score, ms_1_odd, iy_1_odd, alt_25_odd')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29');

  if (error) {
    console.error(error);
    return;
  }

  const idsToDelete = [];

  rows.forEach(r => {
    const msParts = r.ms_score ? r.ms_score.split('-') : [];
    const isBball = msParts.length === 2 && (parseInt(msParts[0]) > 30 || parseInt(msParts[1]) > 30);
    const hasNullOdds = !r.ms_1_odd && !r.iy_1_odd && !r.alt_25_odd;

    if (isBball || hasNullOdds) {
      idsToDelete.push(r.id);
    }
  });

  console.log(`Deleting ${idsToDelete.length} junk row IDs in batches...`);

  for (let i = 0; i < idsToDelete.length; i += 50) {
    const batch = idsToDelete.slice(i, i + 50);
    const { error: delErr } = await supabase
      .from('past_matches')
      .delete()
      .in('id', batch);

    if (delErr) console.error("Del error:", delErr);
  }

  console.log("Cleanup done!");

  const { data: remaining } = await supabase
    .from('past_matches')
    .select('id, match_date, home_team, away_team, ms_score, iy_score, ms_1_odd')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29');

  console.log(`Remaining clean rows count: ${remaining.length}`);

  const burnley = remaining.find(r => r.home_team.includes('Burnley') || r.away_team.includes('Espanyol'));
  const betis = remaining.find(r => r.home_team.includes('Betis') || r.away_team.includes('Lyon'));

  console.log("\nBurnley vs Espanyol:", burnley);
  console.log("Real Betis vs Lyon:", betis);
}

run();
