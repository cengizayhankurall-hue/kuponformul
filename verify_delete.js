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
  // Let's delete all rows where ms_1_odd is null AND iy_1_odd is null AND alt_25_odd is null
  const { data: deleted, error } = await supabase
    .from('past_matches')
    .delete()
    .is('ms_1_odd', null)
    .is('iy_1_odd', null)
    .is('alt_25_odd', null)
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29')
    .select('id');

  if (error) {
    console.error(error);
  } else {
    console.log(`Deleted ${deleted.length} junk rows with null odds!`);
  }

  // Also delete any basketball scores (e.g. 0-92, 0-90, 0-100)
  const { data: allJul } = await supabase
    .from('past_matches')
    .select('id, ms_score')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29');

  const bballIds = allJul.filter(r => {
    if (!r.ms_score) return false;
    const parts = r.ms_score.split('-');
    return parts.length === 2 && (parseInt(parts[0]) > 30 || parseInt(parts[1]) > 30);
  }).map(r => r.id);

  if (bballIds.length > 0) {
    const { data: bballDeleted } = await supabase.from('past_matches').delete().in('id', bballIds).select('id');
    console.log(`Deleted ${bballDeleted ? bballDeleted.length : 0} basketball rows!`);
  }

  // Count remaining clean matches
  const { data: remaining } = await supabase
    .from('past_matches')
    .select('id, match_date, home_team, away_team, ms_score, iy_score, ms_1_odd')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29');

  console.log(`Remaining clean Geniş İddaa matches for 28th and 29th: ${remaining.length}`);
}

run();
