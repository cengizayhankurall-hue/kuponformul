require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function purge() {
  console.log('Purging past_matches table...');
  const { error } = await supabase
    .from('past_matches')
    .delete()
    .gte('match_date', '1900-01-01');

  if (error) {
    console.error('Delete error:', error.message);
  } else {
    console.log('Delete command sent successfully.');
  }

  const { count } = await supabase
    .from('past_matches')
    .select('*', { count: 'exact', head: true });

  console.log(`Current row count in past_matches: ${count}`);
}

purge();
