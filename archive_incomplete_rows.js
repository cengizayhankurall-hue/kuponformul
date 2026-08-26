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
  const { data: rows } = await supabase
    .from('past_matches')
    .select('id, match_date, home_team, away_team, ms_score, iy_score, iy_1_odd, alt_15_odd')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29');

  console.log("Total rows:", rows.length);

  // Rows that have null iy_1_odd OR null alt_15_odd (incomplete legacy rows)
  const incompleteRows = rows.filter(r => r.iy_1_odd === null || r.alt_15_odd === null);
  console.log(`Incomplete legacy rows count: ${incompleteRows.length}`);

  for (const r of incompleteRows) {
    // Archive them to 1970-01-01
    await supabase.from('past_matches').update({
      match_date: '1970-01-01',
      home_team: `${r.home_team} [JUNK ${r.id.substring(0, 5)}]`
    }).eq('id', r.id);
  }

  console.log("Archived all incomplete legacy rows.");

  const { data: cleanRows } = await supabase
    .from('past_matches')
    .select('id, match_date, home_team, away_team, ms_score, iy_score, ms_1_odd, iy_1_odd, alt_15_odd')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29')
    .order('match_date', { ascending: true });

  console.log(`\nRemaining Clean Matches Count: ${cleanRows.length}`);
}

run();
