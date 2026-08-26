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
  console.log("=== STEP 1: Cleaning junk/old records for 2026-07-28 and 2026-07-29 ===");
  const { error: delErr } = await supabase
    .from('past_matches')
    .delete()
    .in('match_date', ['2026-07-28', '2026-07-29']);

  if (delErr) console.error("Delete error:", delErr);
  else console.log("Cleaned existing 2026-07-28 and 2026-07-29 rows from Supabase.");

  console.log("=== STEP 2: Fetching 100% Mackolik Geniş İddaa Programı data for Week 24130 ===");
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

        const time = row[6] ? String(row[6]).trim() : '00:00';
        const msHome = row[8] != undefined && row[8] !== '' ? row[8] : '0';
        const msAway = row[9] != undefined && row[9] !== '' ? row[9] : '0';
        const iyHome = row[11] != undefined && row[11] !== '' ? row[11] : '0';
        const iyAway = row[12] != undefined && row[12] !== '' ? row[12] : '0';
        const league = String(row[26] || 'Diğer').trim();

        // EXACT 1-TO-1 MACKOLIK GENİŞ İDDAA MAPPING
        const record = {
          match_date: formattedDate,
          match_time: time,
          home_team: home,
          away_team: away,
          league: league,
          ms_score: `${msHome}-${msAway}`,
          iy_score: `${iyHome}-${iyAway}`,

          // Maç Sonucu
          ms_1_odd: parseOdd(row[16]),
          ms_0_odd: parseOdd(row[17]),
          ms_2_odd: parseOdd(row[18]),

          // Çifte Şans
          cs_1x_odd: parseOdd(row[19]),
          cs_12_odd: parseOdd(row[20]),
          cs_x2_odd: parseOdd(row[21]),

          // AU 2,5 Gol
          alt_25_odd: parseOdd(row[22]),
          ust_25_odd: parseOdd(row[23]),

          // İlk Yarı Sonucu
          iy_1_odd: parseOdd(row[33]),
          iy_0_odd: parseOdd(row[34]),
          iy_2_odd: parseOdd(row[35]),

          // Karşılıklı Gol
          kg_var_odd: parseOdd(row[39]),
          kg_yok_odd: parseOdd(row[40]),

          // İY 1,5 Gol
          iy_15_alt_odd: parseOdd(row[42]),
          iy_15_ust_odd: parseOdd(row[43]),

          // AU 1,5 Gol
          alt_15_odd: parseOdd(row[44]),
          ust_15_odd: parseOdd(row[45]),

          // AU 3,5 Gol
          alt_35_odd: parseOdd(row[46]),
          ust_35_odd: parseOdd(row[47])
        };

        matchesToInsert.push(record);
      });
    });
  }

  console.log(`Parsed ${matchesToInsert.length} total Geniş İddaa matches.`);

  // Deduplicate by home_team, away_team, match_date
  const uniqueMap = new Map();
  matchesToInsert.forEach(m => {
    const key = `${m.match_date}_${m.home_team.toLowerCase()}_${m.away_team.toLowerCase()}`;
    uniqueMap.set(key, m);
  });

  const finalMatches = Array.from(uniqueMap.values());
  console.log(`Inserting ${finalMatches.length} unique Geniş İddaa matches into Supabase...`);

  const { data: inserted, error: insertErr } = await supabase
    .from('past_matches')
    .upsert(finalMatches, { onConflict: 'home_team,away_team,match_date' })
    .select();

  if (insertErr) {
    console.error("Insert error:", insertErr);
  } else {
    console.log(`Successfully inserted ALL ${inserted.length} Geniş İddaa matches into Supabase!`);
  }

  console.log("\n=== STEP 3: Verifying Haukar & Villanovense in Supabase ===");
  const { data: haukarRow } = await supabase
    .from('past_matches')
    .select('*')
    .ilike('home_team', '%Haukar%')
    .eq('match_date', '2026-07-29');

  const { data: villanovenseRow } = await supabase
    .from('past_matches')
    .select('*')
    .ilike('home_team', '%Villanovense%')
    .eq('match_date', '2026-07-29');

  console.log("Haukar in Supabase:", haukarRow);
  console.log("Villanovense in Supabase:", villanovenseRow);
}

run().catch(console.error);
