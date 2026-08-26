require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'
      }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, text: data }));
    }).on('error', reject);
  });
}

async function test() {
  const dStr = '18/08/2026';
  const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;
  const { status, text: txt } = await httpGet(url);
  console.log('Status:', status, 'Length:', txt.length);
  if (txt.length > 100) {
    const obj = new Function(`return ${txt}`)();
    const groups = obj.m || [];
    let count = 0;
    groups.forEach(g => {
      (g.m || []).forEach(m => {
        if (m && m[1] && m[3]) count++;
      });
    });
    console.log('Total matches parsed:', count);
  }
}

test();
