const https = require('https');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Read Supabase credentials
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
  // DD.MM.YYYY -> YYYY-MM-DD
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

async function run() {
  console.log("=== STEP 1: Deleting corrupt / junk past_matches for 2026-07-28 and 2026-07-29 ===");
  const { error: delError } = await supabase
    .from('past_matches')
    .delete()
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29');

  if (delError) {
    console.error("Delete error:", delError);
  } else {
    console.log("Deleted old records for 28.07.2026 and 29.07.2026 successfully.");
  }

  console.log("\n=== STEP 2: Fetching Mackolik Geniş İddaa Programı data ===");
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

        // Filter only for 2026-07-28 and 2026-07-29 for now
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
    // Deduplicate by home_team, away_team, match_date
    const uniqueMap = new Map();
    matchesToInsert.forEach(m => {
      const key = `${m.match_date}_${m.home_team}_${m.away_team}`;
      uniqueMap.set(key, m);
    });

    const uniqueMatches = Array.from(uniqueMap.values());
    console.log(`Inserting ${uniqueMatches.length} unique matches to Supabase...`);

    const { data: inserted, error: insertError } = await supabase
      .from('past_matches')
      .insert(uniqueMatches)
      .select();

    if (insertError) {
      console.error("Insertion error:", insertError);
    } else {
      console.log(`Successfully inserted ${inserted.length} matches into past_matches!`);
    }
  }

  console.log("\n=== STEP 3: Verification of inserted data ===");
  const { data: verifyData } = await supabase
    .from('past_matches')
    .select('*')
    .gte('match_date', '2026-07-28')
    .lte('match_date', '2026-07-29')
    .order('match_date', { ascending: true });

  console.log(`Total rows in DB now: ${verifyData.length}`);
  verifyData.forEach((m, idx) => {
    console.log(`[${idx+1}] Date:${m.match_date} ${m.match_time} | ${m.home_team} vs ${m.away_team} | MS:${m.ms_score} IY:${m.iy_score}`);
    console.log(`     Odds: MS 1:${m.ms_1_odd} X:${m.ms_0_odd} 2:${m.ms_2_odd} | IY 1:${m.iy_1_odd} X:${m.iy_0_odd} 2:${m.iy_2_odd} | Alt2.5:${m.alt_25_odd} Ust2.5:${m.ust_25_odd} | KG V:${m.kg_var_odd} Y:${m.kg_yok_odd}`);
  });
}

run().catch(console.error);
