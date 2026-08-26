const https = require('https');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

function fetchGenisProgram(dayStr = '30.07.2026') {
  return new Promise((resolve, reject) => {
    // Try by day parameter first, or by week
    const options = {
      hostname: 'arsiv.mackolik.com',
      path: `/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dayStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`,
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          let parsed = (new Function('return ' + data))();
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function parseOdd(val) {
  if (!val || val === '-' || val === '' || val === '0,00' || val === '0.00') return null;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) || num === 0 ? null : num;
}

function parseDate(dateStr) {
  if (!dateStr || !dateStr.includes('.')) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

async function run() {
  console.log("=== STEP 1: Fetching 30.07.2026 matches from Mackolik Geniş İddaa Programı ===");
  let rawData = await fetchGenisProgram('30.07.2026');

  let matchesToInsert = [];

  const extractMatches = (data) => {
    if (data && Array.isArray(data.m)) {
      data.m.forEach((item) => {
        let rows = Array.isArray(item.m) ? item.m : [item.m || item];
        rows.forEach(row => {
          if (!Array.isArray(row) || row.length < 15) return;

          const home = String(row[1] || '').trim();
          const away = String(row[3] || '').trim();
          const rawDate = row[7] || '30.07.2026';
          const formattedDate = parseDate(rawDate);
          if (!home || !away || !formattedDate) return;

          const time = row[6] ? String(row[6]).trim() : '00:00';
          const msHome = row[8] != undefined && row[8] !== '' ? row[8] : '0';
          const msAway = row[9] != undefined && row[9] !== '' ? row[9] : '0';
          const iyHome = row[11] != undefined && row[11] !== '' ? row[11] : '0';
          const iyAway = row[12] != undefined && row[12] !== '' ? row[12] : '0';
          const league = String(row[26] || 'Diğer').trim();

          const record = {
            match_date: formattedDate,
            match_time: time,
            home_team: home,
            away_team: away,
            league: league,
            ms_score: `${msHome}-${msAway}`,
            iy_score: `${iyHome}-${iyAway}`,

            ms_1_odd: parseOdd(row[16]),
            ms_0_odd: parseOdd(row[17]),
            ms_2_odd: parseOdd(row[18]),

            cs_1x_odd: parseOdd(row[19]),
            cs_12_odd: parseOdd(row[20]),
            cs_x2_odd: parseOdd(row[21]),

            alt_25_odd: parseOdd(row[22]),
            ust_25_odd: parseOdd(row[23]),

            iy_1_odd: parseOdd(row[33]),
            iy_0_odd: parseOdd(row[34]),
            iy_2_odd: parseOdd(row[35]),

            kg_var_odd: parseOdd(row[39]),
            kg_yok_odd: parseOdd(row[40]),

            iy_15_alt_odd: parseOdd(row[42]),
            iy_15_ust_odd: parseOdd(row[43]),

            alt_15_odd: parseOdd(row[44]),
            ust_15_odd: parseOdd(row[45]),

            alt_35_odd: parseOdd(row[46]),
            ust_35_odd: parseOdd(row[47])
          };

          matchesToInsert.push(record);
        });
      });
    }
  };

  extractMatches(rawData);

  console.log(`Parsed ${matchesToInsert.length} matches for 30.07.2026.`);

  if (matchesToInsert.length === 0) {
    console.log("Trying week 24130 or day=-1...");
    const https = require('https');
    const weekData = await new Promise((resolve) => {
      https.get('https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=-1&week=24130&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1', (res) => {
        let d = '';
        res.on('data', chunk => d += chunk);
        res.on('end', () => {
          try { resolve((new Function('return ' + d))()); } catch (e) { resolve(null); }
        });
      });
    });
    extractMatches(weekData);
    matchesToInsert = matchesToInsert.filter(m => m.match_date === '2026-07-30');
    console.log(`Found ${matchesToInsert.length} matches for 2026-07-30 in Week 24130.`);
  }

  if (matchesToInsert.length > 0) {
    const uniqueMap = new Map();
    matchesToInsert.forEach(m => {
      const key = `${m.match_date}_${m.home_team.toLowerCase()}_${m.away_team.toLowerCase()}`;
      uniqueMap.set(key, m);
    });

    const finalMatches = Array.from(uniqueMap.values());
    console.log(`Upserting ${finalMatches.length} unique 30.07.2026 matches into Supabase...`);

    const { data: upserted, error: upsertErr } = await supabase
      .from('past_matches')
      .upsert(finalMatches, { onConflict: 'home_team,away_team,match_date' })
      .select();

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
    } else {
      console.log(`Successfully added/updated ${upserted.length} matches for 30.07.2026 into Supabase!`);
    }

    console.log("\nSample 30.07.2026 matches added:");
    finalMatches.slice(0, 5).forEach((m, idx) => {
      console.log(`${idx + 1}. [${m.league}] ${m.home_team} vs ${m.away_team} | MS: ${m.ms_score} | IY: ${m.iy_score} | MS1: ${m.ms_1_odd}`);
    });
  }
}

run().catch(console.error);
