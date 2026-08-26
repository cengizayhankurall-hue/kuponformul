const https = require('https');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const agent = new https.Agent({
  rejectUnauthorized: false
});

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
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'
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

function cleanOdds(val) {
  if (val === undefined || val === null || val === '' || val === '-' || val === 0 || val === '0,00' || val === '0.00') return null;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) || num === 0 ? null : num;
}

function normalize(s) {
  if (!s) return '';
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function processGenisDate(dStr, isoDate) {
  console.log(`\n==================================================`);
  console.log(`[Geniş İddaa + Skor Eşleştirme] ${dStr} (${isoDate})...`);
  console.log(`==================================================`);

  // 1. Geniş İddaa Programı Çek
  const genisUrl = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;
  const { text: genisTxt } = await httpGet(genisUrl);
  const genisObj = new Function(`return ${genisTxt}`)();
  const genisGroups = genisObj.m || [];

  const genisMatches = [];
  genisGroups.forEach((g) => {
    (g.m || []).forEach((m) => {
      if (m && m[1] && m[3]) {
        const homeTeam = String(m[1]).trim();
        const awayTeam = String(m[3]).trim();
        const matchTime = String(m[6] || '00:00').trim();
        const league = String(m[26] || 'Diğer').trim();

        genisMatches.push({
          match_date: isoDate,
          match_time: matchTime,
          league: league,
          home_team: homeTeam,
          away_team: awayTeam,
          iy_score: null,
          ms_score: null,
          ms_1_odd: cleanOdds(m[16]),
          ms_0_odd: cleanOdds(m[17]),
          ms_2_odd: cleanOdds(m[18]),
          cs_1x_odd: cleanOdds(m[19]),
          cs_12_odd: cleanOdds(m[20]),
          cs_x2_odd: cleanOdds(m[21]),
          alt_25_odd: cleanOdds(m[22]),
          ust_25_odd: cleanOdds(m[23]),
          iy_1_odd: cleanOdds(m[33]),
          iy_0_odd: cleanOdds(m[34]),
          iy_2_odd: cleanOdds(m[35]),
          kg_var_odd: cleanOdds(m[39]),
          kg_yok_odd: cleanOdds(m[40])
        });
      }
    });
  });

  console.log(`Geniş İddaa Bülteninden ${genisMatches.length} maç çekildi.`);

  // 2. Canlı Skor / Maç Sonuçları Çek
  const liveUrl = `https://vd.mackolik.com/livedata?date=${dStr.replace(/\./g, '/')}`;
  try {
    const { text: liveTxt } = await httpGet(liveUrl);
    if (liveTxt && liveTxt.length > 50) {
      const liveJson = JSON.parse(liveTxt);
      const rawLive = liveJson.m || [];

      // Eşleştir
      for (const gm of genisMatches) {
        const normHome = normalize(gm.home_team);
        const normAway = normalize(gm.away_team);

        const found = rawLive.find(lm => {
          if (!lm || !lm[2] || !lm[4]) return false;
          const lHome = normalize(lm[2]);
          const lAway = normalize(lm[4]);
          return (normHome.includes(lHome) || lHome.includes(normHome)) &&
                 (normAway.includes(lAway) || lAway.includes(normAway));
        });

        if (found) {
          // MS Score
          if (found[11] !== undefined && found[11] !== null && String(found[11]).trim() !== '' &&
              found[12] !== undefined && found[12] !== null && String(found[12]).trim() !== '') {
            gm.ms_score = `${found[11]}-${found[12]}`;
          } else if (typeof found[7] === 'string' && found[7].includes('-') && !found[7].includes(':')) {
            gm.ms_score = found[7].trim();
          }

          // İY Score
          if (found[15] && typeof found[15] === 'object') {
            if (found[15].h1 !== undefined && found[15].h1 !== null && found[15].h2 !== undefined && found[15].h2 !== null) {
              gm.iy_score = `${found[15].h1}-${found[15].h2}`;
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Livedata fetch warning:', e.message);
  }

  // 3. Supabase Temizlik ve Yükleme
  await supabase.from('past_matches').delete().eq('match_date', isoDate);

  let inserted = 0;
  for (let i = 0; i < genisMatches.length; i += 50) {
    const chunk = genisMatches.slice(i, i + 50);
    const { error } = await supabase.from('past_matches').upsert(chunk, {
      onConflict: 'home_team,away_team,match_date'
    });
    if (error) console.error('Upsert error:', error.message);
    else inserted += chunk.length;
  }

  console.log(`✅ [Supabase] ${isoDate} tarihli ${inserted} Geniş İddaa bülten maçı skor ve oranlarıyla kaydedildi!`);

  console.log(`\n--- Örnek Maçlar (${dStr}) ---`);
  genisMatches.slice(0, 10).forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.league}] ${m.home_team} ${m.ms_score || '?-?'} ${m.away_team} (İY: ${m.iy_score || '-'}) | MS Oranları: ${m.ms_1_odd} - ${m.ms_0_odd} - ${m.ms_2_odd} | 2.5 Alt/Üst: ${m.alt_25_odd} / ${m.ust_25_odd}`);
  });
}

async function run() {
  await processGenisDate('28.07.2026', '2026-07-28');
  await processGenisDate('29.07.2026', '2026-07-29');
}

run().catch(console.error);
