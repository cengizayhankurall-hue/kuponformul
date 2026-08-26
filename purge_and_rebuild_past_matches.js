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
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

function fetchGenisProgram(weekId = '24130') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'arsiv.mackolik.com',
      path: `/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=-1&week=${weekId}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`,
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
  console.log("=== STEP 1: Purging all rows for 2026-07-28 and 2026-07-29 by ID ===");
  
  // Select all rows from past_matches
  const { data: allRows, error: fetchErr } = await supabase.from('past_matches').select('id, match_date');
  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }

  const idsToDelete = allRows
    .filter(r => String(r.match_date).includes('2026-07-28') || String(r.match_date).includes('2026-07-29'))
    .map(r => r.id);

  console.log(`Found ${idsToDelete.length} rows to delete for July 28 and 29.`);

  // Delete in batches of 100
  for (let i = 0; i < idsToDelete.length; i += 100) {
    const batch = idsToDelete.slice(i, i + 100);
    const { error: delErr } = await supabase.from('past_matches').delete().in('id', batch);
    if (delErr) {
      console.error("Batch delete error:", delErr);
    }
  }
  console.log("Purge finished successfully.");

  console.log("\n=== STEP 2: Fetching Geniş İddaa Programı data ===");
  const rawData = await fetchGenisProgram('24130');

  const matchesToInsert = [];

  if (rawData && Array.isArray(rawData.m)) {
    rawData.m.forEach((item) => {
      let rows = Array.isArray(item.m) ? item.m : [item.m || item];
      rows.forEach(row => {
        if (!Array.isArray(row) || row.length < 15) return;

        const home = String(row[1] || '').trim();
        const away = String(row[3] || '').trim();
        const rawDate = row[7];
        const formattedDate = parseDate(rawDate);
        if (!home || !away || !formattedDate) return;

        if (formattedDate !== '2026-07-28' && formattedDate !== '2026-07-29') return;

        const time = row[6] || '00:00';
        const msHome = row[8] != undefined && row[8] !== '' ? row[8] : '0';
        const msAway = row[9] != undefined && row[9] !== '' ? row[9] : '0';
        const iyHome = row[11] != undefined && row[11] !== '' ? row[11] : '0';
        const iyAway = row[12] != undefined && row[12] !== '' ? row[12] : '0';
        const league = row[26] || '';

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
          iy_1_odd: parseOdd(row[29]),
          iy_0_odd: parseOdd(row[30]),
          iy_2_odd: parseOdd(row[31]),
          iy_15_alt_odd: parseOdd(row[33]),
          iy_15_ust_odd: parseOdd(row[34]),
          kg_var_odd: parseOdd(row[39]),
          kg_yok_odd: parseOdd(row[40])
        };

        matchesToInsert.push(record);
      });
    });
  }

  console.log(`Prepared ${matchesToInsert.length} Geniş İddaa matches for insertion.`);

  if (matchesToInsert.length > 0) {
    const uniqueMap = new Map();
    matchesToInsert.forEach(m => {
      const key = `${m.match_date}_${m.home_team}_${m.away_team}`;
      uniqueMap.set(key, m);
    });

    const uniqueMatches = Array.from(uniqueMap.values());
    console.log(`Inserting ${uniqueMatches.length} unique clean Geniş İddaa matches...`);

    const { data: inserted, error: insertError } = await supabase
      .from('past_matches')
      .insert(uniqueMatches)
      .select();

    if (insertError) {
      console.error("Insertion error:", insertError);
    } else {
      console.log(`Successfully inserted ${inserted.length} clean matches!`);
    }
  }

  console.log("\n=== STEP 3: Verification of database after purge and rebuild ===");
  const { data: remainingRows } = await supabase.from('past_matches').select('id, match_date, home_team, away_team, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd');
  const jul28And29 = remainingRows.filter(r => String(r.match_date).includes('2026-07-28') || String(r.match_date).includes('2026-07-29'));

  console.log(`Total clean rows for July 28 and July 29 in past_matches: ${jul28And29.length}`);
  
  // Find Burnley and Real Betis specifically
  const burnley = jul28And29.find(r => r.home_team.includes('Burnley') || r.away_team.includes('Espanyol'));
  const betis = jul28And29.find(r => r.home_team.includes('Betis') || r.away_team.includes('Lyon'));

  console.log("\nBurnley vs Espanyol in DB:");
  console.log(burnley);

  console.log("\nReal Betis vs Lyon in DB:");
  console.log(betis);
}

run().catch(console.error);
