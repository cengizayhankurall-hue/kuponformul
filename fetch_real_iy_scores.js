const https = require('https');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const agent = new https.Agent({ rejectUnauthorized: false });

function httpGet(urlStr) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      agent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://arsiv.mackolik.com/'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, text: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function fixIyScores() {
  const dates = ['2026-07-28', '2026-07-29'];

  for (const isoDate of dates) {
    const dStr = isoDate.split('-').reverse().join('/');
    console.log(`Updating IY scores for ${isoDate}...`);
    const { text: liveTxt } = await httpGet(`https://vd.mackolik.com/livedata?date=${dStr}`);
    if (!liveTxt || liveTxt.length < 50) continue;

    const liveJson = JSON.parse(liveTxt);
    const rawMatches = liveJson.m || [];

    const { data: dbMatches } = await supabase
      .from('past_matches')
      .select('id, home_team, away_team, iy_score')
      .eq('match_date', isoDate);

    if (!dbMatches) continue;

    let updated = 0;
    for (const dbM of dbMatches) {
      const hClean = dbM.home_team.toLowerCase().replace(/[^a-z0-9]/g, '');
      const aClean = dbM.away_team.toLowerCase().replace(/[^a-z0-9]/g, '');

      const found = rawMatches.find(lm => {
        if (!lm || !lm[2] || !lm[4]) return false;
        const lh = String(lm[2]).toLowerCase().replace(/[^a-z0-9]/g, '');
        const la = String(lm[4]).toLowerCase().replace(/[^a-z0-9]/g, '');
        return (hClean.includes(lh) || lh.includes(hClean)) && (aClean.includes(la) || la.includes(aClean));
      });

      if (found && found[15] && typeof found[15] === 'object') {
        if (found[15].h1 !== undefined && found[15].h1 !== null && found[15].h2 !== undefined && found[15].h2 !== null) {
          const iy = `${found[15].h1}-${found[15].h2}`;
          if (iy !== dbM.iy_score) {
            await supabase.from('past_matches').update({ iy_score: iy }).eq('id', dbM.id);
            updated++;
          }
        }
      }
    }
    console.log(`Updated ${updated} IY scores for ${isoDate}.`);
  }
}

fixIyScores().catch(console.error);
