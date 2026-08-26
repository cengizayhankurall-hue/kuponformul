require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const agent = new https.Agent({
  rejectUnauthorized: false
});

function httpGet(urlStr, retries = 3) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      agent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if ((res.statusCode === 502 || res.statusCode === 503) && retries > 0) {
          console.warn(`HTTP ${res.statusCode} alindi, 1.5 sn sonra tekrar deneniyor... (${retries} hakki kaldi)`);
          setTimeout(() => {
            httpGet(urlStr, retries - 1).then(resolve).catch(reject);
          }, 1500);
        } else {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', (err) => {
      if (retries > 0) {
        setTimeout(() => {
          httpGet(urlStr, retries - 1).then(resolve).catch(reject);
        }, 1500);
      } else {
        reject(err);
      }
    });

    req.end();
  });
}

function cleanOdds(val) {
  if (val === undefined || val === null || val === '' || val === '-' || val === 0 || val === '0,00' || val === '0.00') return null;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) || num === 0 ? null : num;
}

async function processDate(dStr, isoDate) {
  console.log(`\n==================================================`);
  console.log(`[Genis Iddaa Programi] ${dStr} (${isoDate}) verileri cekiliyor...`);
  console.log(`==================================================`);

  // 1. Clean existing records for isoDate
  const { error: delErr } = await supabase
    .from('past_matches')
    .delete()
    .eq('match_date', isoDate);

  if (delErr) {
    console.error(`${isoDate} silme hatasi:`, delErr.message);
  } else {
    console.log(`Eski ${isoDate} verileri Supabase'den temizlendi.`);
  }

  // 2. Fetch from Mackolik AjaxHandler
  const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;

  const { status, text: txt } = await httpGet(url);

  if (status !== 200) {
    throw new Error(`HTTP ${status} hatasi alindi.`);
  }

  if (txt.length < 100) {
    console.warn(`[Genis Iddaa] ${dStr} icin veri bulunamadi!`);
    return 0;
  }

  const obj = new Function(`return ${txt}`)();
  const groups = obj.m || [];

  const parsedMatches = [];

  groups.forEach((g) => {
    const matchesList = g.m || [];
    matchesList.forEach((m) => {
      if (m && m[1] && m[3]) {
        const homeTeam = String(m[1]).trim();
        const awayTeam = String(m[3]).trim();
        const matchTime = String(m[6] || '00:00').trim();
        const league = String(m[26] || 'Diger').trim();

        // m[8] - m[9] = MS Skoru (orn "2 - 1"), m[11] - m[12] = IY Skoru (orn "1-1")
        const homeMS = m[8] !== undefined && m[8] !== null && m[8] !== '' ? String(m[8]).trim() : null;
        const awayMS = m[9] !== undefined && m[9] !== null && m[9] !== '' ? String(m[9]).trim() : null;
        const msScore = (homeMS !== null && awayMS !== null && homeMS !== '-1' && awayMS !== '-1') ? `${homeMS} - ${awayMS}` : null;

        const homeIY = m[11] !== undefined && m[11] !== null && m[11] !== '' ? String(m[11]).trim() : null;
        const awayIY = m[12] !== undefined && m[12] !== null && m[12] !== '' ? String(m[12]).trim() : null;
        const iyScore = (homeIY !== null && awayIY !== null && homeIY !== '-1' && awayIY !== '-1') ? `${homeIY}-${awayIY}` : null;

        // Oranlar - Resmi Mackolik Genis Iddaa Indeks Haritasi
        const ms1 = cleanOdds(m[16]);
        const msX = cleanOdds(m[17]);
        const ms2 = cleanOdds(m[18]);
        const cs1X = cleanOdds(m[19]);
        const cs12 = cleanOdds(m[20]);
        const csX2 = cleanOdds(m[21]);
        const alt25 = cleanOdds(m[22]);
        const ust25 = cleanOdds(m[23]);
        const iy1 = cleanOdds(m[33]);
        const iyX = cleanOdds(m[34]);
        const iy2 = cleanOdds(m[35]);
        const kgVar = cleanOdds(m[39]);
        const kgYok = cleanOdds(m[40]);
        const iy15Alt = cleanOdds(m[42]);
        const iy15Ust = cleanOdds(m[43]);
        const alt15 = cleanOdds(m[44]);
        const ust15 = cleanOdds(m[45]);
        const alt35 = cleanOdds(m[46]);
        const ust35 = cleanOdds(m[47]);

        parsedMatches.push({
          match_date: isoDate,
          match_time: matchTime,
          league: league,
          home_team: homeTeam,
          away_team: awayTeam,
          ms_score: msScore,
          iy_score: iyScore,
          ms_1_odd: ms1,
          ms_0_odd: msX,
          ms_2_odd: ms2,
          cs_1x_odd: cs1X,
          cs_12_odd: cs12,
          cs_x2_odd: csX2,
          alt_25_odd: alt25,
          ust_25_odd: ust25,
          iy_1_odd: iy1,
          iy_0_odd: iyX,
          iy_2_odd: iy2,
          kg_var_odd: kgVar,
          kg_yok_odd: kgYok,
          iy_15_alt_odd: iy15Alt,
          iy_15_ust_odd: iy15Ust,
          alt_15_odd: alt15,
          ust_15_odd: ust15,
          alt_35_odd: alt35,
          ust_35_odd: ust35
        });
      }
    });
  });

  // Deduplicate matches in memory by home_team, away_team, match_date
  const uniqueMap = new Map();
  parsedMatches.forEach(m => {
    const key = `${m.home_team}__${m.away_team}__${m.match_date}`;
    uniqueMap.set(key, m);
  });
  const uniqueMatches = Array.from(uniqueMap.values());

  console.log(`[Genis Iddaa] ${dStr} -> Toplam ${parsedMatches.length} mactan ${uniqueMatches.length} benzersiz mac ayiklandi.`);

  if (uniqueMatches.length > 0) {
    for (let i = 0; i < uniqueMatches.length; i += 50) {
      const chunk = uniqueMatches.slice(i, i + 50);
      const { error: insErr } = await supabase
        .from('past_matches')
        .upsert(chunk, { onConflict: 'home_team,away_team,match_date' });

      if (insErr) {
        console.error(`Ekleme hatasi (${isoDate} parca ${i}):`, insErr.message);
      }
    }
    console.log(`[Genis Iddaa] ${isoDate} icin ${uniqueMatches.length} mac Supabase'e kaydedildi.`);
  }

  return uniqueMatches.length;
}

async function run() {
  const dates = [
    { dStr: '04/08/2026', isoDate: '2026-08-04' },
    { dStr: '05/08/2026', isoDate: '2026-08-05' },
    { dStr: '06/08/2026', isoDate: '2026-08-06' }
  ];

  for (const item of dates) {
    await processDate(item.dStr, item.isoDate);
  }

  console.log(`\n==================================================`);
  console.log(`VERITABANI DOGRULAMA KONTROLU (04-05-06 AGUSTOS)`);
  console.log(`==================================================`);
  for (const item of dates) {
    const { count, error } = await supabase
      .from('past_matches')
      .select('*', { count: 'exact', head: true })
      .eq('match_date', item.isoDate);

    console.log(`Tarih: ${item.dStr} (${item.isoDate}) -> Supabase Kayit Sayisi: ${count}`);

    const { data: sample } = await supabase
      .from('past_matches')
      .select('home_team, away_team, league, match_time, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd')
      .eq('match_date', item.isoDate)
      .limit(4);

    console.log(`\nOrnek Maclar (${item.dStr}):`);
    if (sample && sample.length > 0) {
      sample.forEach(m => {
        console.log(`  ${m.home_team} vs ${m.away_team} (${m.league}) | MS: ${m.ms_score} | IY: ${m.iy_score} | MS1: ${m.ms_1_odd}, MSX: ${m.ms_0_odd}, MS2: ${m.ms_2_odd}`);
      });
    } else {
      console.log('  (Mac bulunamadi)');
    }
  }
}

run().catch(console.error);
