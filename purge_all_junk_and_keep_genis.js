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
  console.log("=== Fetching ALL rows for July 28 and July 29 with pagination ===");
  let allRows = [];
  let from = 0;
  const step = 1000;

  while (true) {
    const { data: page, error } = await supabase
      .from('past_matches')
      .select('id, match_date, home_team, away_team, ms_score, iy_score, ms_1_odd, iy_1_odd, alt_25_odd')
      .gte('match_date', '2026-07-28')
      .lte('match_date', '2026-07-29')
      .range(from, from + step - 1);

    if (error) {
      console.error(error);
      break;
    }
    if (!page || page.length === 0) break;
    allRows = allRows.concat(page);
    if (page.length < step) break;
    from += step;
  }

  console.log(`Total rows fetched across all pages: ${allRows.length}`);

  // Identify junk rows:
  // 1. Basketball matches (ms_score has numbers > 30)
  // 2. Rows with missing odds (ms_1_odd is null AND iy_1_odd is null AND alt_25_odd is null)
  // 3. Rows with iy_score === '0-0' when ms_score is non-zero AND ms_1_odd is null (legacy duplicate scrapings)
  // 4. Team names containing '(K)', 'U18', 'U19', 'U20', 'U23' that have no odds
  const junkIds = [];
  const keepIds = [];

  allRows.forEach(r => {
    const msParts = r.ms_score ? r.ms_score.split('-') : [];
    const isBasketball = msParts.length === 2 && (parseInt(msParts[0]) > 30 || parseInt(msParts[1]) > 30);
    const hasNoOdds = (r.ms_1_odd === null && r.iy_1_odd === null && r.alt_25_odd === null);

    if (isBasketball || hasNoOdds) {
      junkIds.push(r.id);
    } else {
      keepIds.push(r);
    }
  });

  console.log(`Junk rows to purge: ${junkIds.length}`);
  console.log(`Clean rows to keep: ${keepIds.length}`);

  // Delete junk rows in batches
  for (let i = 0; i < junkIds.length; i += 200) {
    const batch = junkIds.slice(i, i + 200);
    const { error: delErr } = await supabase.from('past_matches').delete().in('id', batch);
    if (delErr) console.error("Batch delete error:", delErr);
  }

  console.log("Junk rows purged!");

  // Verify remaining rows
  const { data: finalRows } = await supabase
    .from('past_matches')
    .select('id, match_date, home_team, away_team, ms_score, iy_score, ms_1_odd, iy_1_odd, alt_25_odd')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29')
    .order('match_date', { ascending: true });

  console.log(`\nFinal Clean Geniş İddaa matches in past_matches: ${finalRows.length}`);

  const burnley = finalRows.find(r => r.home_team.includes('Burnley') || r.away_team.includes('Espanyol'));
  const betis = finalRows.find(r => r.home_team.includes('Betis') || r.away_team.includes('Lyon'));

  console.log("\nBurnley vs Espanyol check:", burnley);
  console.log("Real Betis vs Lyon check:", betis);
}

run().catch(console.error);
