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
  const dates = ['2026-07-28', '2026-07-29', '2026-07-30'];
  for (const d of dates) {
    const { count } = await supabase
      .from('past_matches')
      .select('*', { count: 'exact', head: true })
      .eq('match_date', d);
    console.log(`Matches in DB for ${d}: ${count}`);
  }
}

run();
