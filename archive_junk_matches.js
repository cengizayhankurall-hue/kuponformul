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
const key = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  console.log("=== Fetching all rows for July 28 & July 29 ===");
  const { data: rows, error } = await supabase
    .from('past_matches')
    .select('id, match_date, ms_score, ms_1_odd, iy_1_odd, alt_25_odd')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29');

  if (error) {
    console.error(error);
    return;
  }

  const junkIds = [];

  rows.forEach(r => {
    const msParts = r.ms_score ? r.ms_score.split('-') : [];
    const isBasketball = msParts.length === 2 && (parseInt(msParts[0]) > 30 || parseInt(msParts[1]) > 30);
    const hasNoOdds = (!r.ms_1_odd && !r.iy_1_odd && !r.alt_25_odd);

    if (isBasketball || hasNoOdds) {
      junkIds.push(r.id);
    }
  });

  console.log(`Found ${junkIds.length} junk rows to archive to 1970-01-01...`);

  if (junkIds.length > 0) {
    for (let i = 0; i < junkIds.length; i += 100) {
      const batch = junkIds.slice(i, i + 100);
      const { data: updData, error: updErr } = await supabase
        .from('past_matches')
        .update({ match_date: '1970-01-01' })
        .in('id', batch)
        .select('id');

      if (updErr) {
        console.error("Update batch error:", updErr);
      } else {
        console.log(`Archived batch of ${updData ? updData.length : 0} rows.`);
      }
    }
  }

  // Verification after archiving
  const { data: remaining } = await supabase
    .from('past_matches')
    .select('id, match_date, home_team, away_team, ms_score, iy_score, ms_1_odd')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29')
    .order('match_date', { ascending: true });

  console.log(`\nRemaining Clean Geniş İddaa matches in database for 28.07.2026 & 29.07.2026: ${remaining.length}`);

  const burnley = remaining.find(r => r.home_team.includes('Burnley') || r.away_team.includes('Espanyol'));
  const betis = remaining.find(r => r.home_team.includes('Betis') || r.away_team.includes('Lyon'));

  console.log("\n--- Burnley vs Espanyol ---", burnley);
  console.log("--- Real Betis vs Lyon ---", betis);
}

run().catch(console.error);
