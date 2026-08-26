const { createClient } = require('@supabase/supabase-js');
const env = require('fs').readFileSync('.env.local', 'utf8').split('\n');
let url = '', key = '';
env.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});
const sb = createClient(url, key);
async function run() {
  const { data, error } = await sb.from('past_matches').select('id').eq('match_date', '1899-12-30');
  console.log('Matches with 1899 date:', data ? data.length : 0);
}
run();
