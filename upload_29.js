require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function parseNum(val) {
  if (val === undefined || val === null || val === '' || val === '-' || val === '0.0' || val === '0,0' || val === '0.00' || val === '0,00') return null;
  const cleaned = String(val).replace(',', '.');
  const num = Number(cleaned);
  return isNaN(num) || num === 0 ? null : num;
}

async function run() {
  const dStr = '29/07/2026';
  const isoDate = '2026-07-29';
  console.log(`[Mackolik Livedata] Fetching results for date: ${dStr}...`);

  const url = `https://vd.mackolik.com/livedata?date=${dStr}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch Mackolik livedata: HTTP ${res.status}`);
  }

  const json = await res.json();
  const rawMatches = json.m || [];
  console.log(`[Mackolik Livedata] Received ${rawMatches.length} raw matches.`);

  const parsedMatches = [];

  for (const m of rawMatches) {
    if (!m || !m[2] || !m[4]) continue;

    const homeTeam = String(m[2]).trim();
    const awayTeam = String(m[4]).trim();
    const matchTime = String(m[16] || '00:00').trim();

    // League name from m[36][1]
    let league = 'Diğer';
    if (m[36] && Array.isArray(m[36]) && m[36][1]) {
      league = String(m[36][1]).trim();
      if (m[36][2]) league += ` ${m[36][2]}`.trim();
    }

    // Skorlar: m[11] = Ev golü, m[12] = Deplasman golü
    let msScore = null;
    if (m[11] !== undefined && m[11] !== null && m[11] !== '' &&
        m[12] !== undefined && m[12] !== null && m[12] !== '') {
      msScore = `${m[11]}-${m[12]}`;
    } else if (typeof m[7] === 'string' && m[7].includes('-')) {
      msScore = m[7].trim();
    }

    // İY Skoru: m[15] objesindeki h1 ve h2
    let iyScore = null;
    if (m[15] && typeof m[15] === 'object') {
      if (m[15].h1 !== undefined && m[15].h1 !== null && m[15].h2 !== undefined && m[15].h2 !== null) {
        iyScore = `${m[15].h1}-${m[15].h2}`;
      }
    }

    // Oranlar: m[18]=MS1, m[19]=MSX, m[20]=MS2, m[21]=Alt2.5, m[22]=Üst2.5
    const ms1 = parseNum(m[18]);
    const msX = parseNum(m[19]);
    const ms2 = parseNum(m[20]);
    const alt25 = parseNum(m[21]);
    const ust25 = parseNum(m[22]);

    parsedMatches.push({
      match_date: isoDate,
      match_time: matchTime,
      league: league,
      home_team: homeTeam,
      away_team: awayTeam,
      iy_score: iyScore,
      ms_score: msScore,
      ms_1_odd: ms1,
      ms_0_odd: msX,
      ms_2_odd: ms2,
      alt_25_odd: alt25,
      ust_25_odd: ust25
    });
  }

  console.log(`[Mackolik Livedata] Successfully parsed ${parsedMatches.length} matches.`);

  // Upload to Supabase in chunks of 50
  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < parsedMatches.length; i += 50) {
    const chunk = parsedMatches.slice(i, i + 50);
    const { data, error } = await supabase
      .from('past_matches')
      .upsert(chunk, {
        onConflict: 'home_team,away_team,match_date'
      });

    if (error) {
      console.error(`Chunk ${i / 50 + 1} insert error:`, error.message);
      errorCount += chunk.length;
    } else {
      insertedCount += chunk.length;
      console.log(`[Supabase] Upserted ${insertedCount}/${parsedMatches.length} matches...`);
    }
  }

  console.log('\n==========================================');
  console.log(`✅ FINISHED: 29.07.2026 Maç Sonuçları Yüklendi!`);
  console.log(`   Toplam Başarılı Yüklenen: ${insertedCount} Maç`);
  if (errorCount > 0) console.log(`   Hatalı/Atlanan: ${errorCount} Maç`);
  console.log('==========================================\n');
}

run().catch(console.error);
