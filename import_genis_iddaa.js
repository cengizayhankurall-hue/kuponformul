require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function cleanOdds(val) {
  if (val === undefined || val === null || val === '' || val === '-' || val === 0 || val === '0,00' || val === '0.00') return null;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) || num === 0 ? null : num;
}

function parseScore(val1, val2) {
  if (val1 === undefined || val1 === null || val2 === undefined || val2 === null) return null;
  const s1 = String(val1).trim();
  const s2 = String(val2).trim();

  if (s1 === '' || s1 === '-' || s1 === '-1' || s1 === 'v' ||
      s2 === '' || s2 === '-' || s2 === '-1' || s2 === 'v') {
    return null;
  }
  return `${s1}-${s2}`;
}

async function processDate(dStr, isoDate) {
  console.log(`\n==================================================`);
  console.log(`[Geniş İddaa Programı] ${dStr} verileri çekiliyor...`);
  console.log(`==================================================`);

  // 1. Temizlik
  const { error: delErr } = await supabase
    .from('past_matches')
    .delete()
    .eq('match_date', isoDate);

  if (delErr) {
    console.error(`${isoDate} silme hatası:`, delErr.message);
  } else {
    console.log(`Eski ${isoDate} verileri Supabase'den temizlendi.`);
  }

  // 2. Geniş İddaa Programı Handler'dan Çekme (np=0: Geniş İddaa Programı / Sonuçlanmış Bütün Maçlar)
  const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} hatası alındı.`);
  }

  const txt = await res.text();
  if (txt.length < 100) {
    console.warn(`[Geniş İddaa] ${dStr} için veri bulunamadı!`);
    return;
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
        const league = String(m[26] || 'Diğer').trim();

        // İY Skoru & MS Skoru
        let iyScore = parseScore(m[12], m[13]);
        let msScore = parseScore(m[14], m[15]);

        // Oranlar
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
          cs_1x_odd: cs1X,
          cs_12_odd: cs12,
          cs_x2_odd: csX2,
          alt_25_odd: alt25,
          ust_25_odd: ust25,
          iy_1_odd: iy1,
          iy_0_odd: iyX,
          iy_2_odd: iy2,
          kg_var_odd: kgVar,
          kg_yok_odd: kgYok
        });
      }
    });
  });

  console.log(`[Geniş İddaa] ${dStr} için ${parsedMatches.length} adet Geniş İddaa bülten maçı ayrıştırıldı.`);

  // 3. Supabase'e Yükleme
  let inserted = 0;
  for (let i = 0; i < parsedMatches.length; i += 50) {
    const chunk = parsedMatches.slice(i, i + 50);
    const { error } = await supabase.from('past_matches').upsert(chunk, {
      onConflict: 'home_team,away_team,match_date'
    });

    if (error) {
      console.error(`Chunk ${i / 50 + 1} upsert hatası:`, error.message);
    } else {
      inserted += chunk.length;
    }
  }

  console.log(`✅ [Supabase] ${isoDate} tarihli ${inserted} Geniş İddaa maçı başarıyla veritabanına aktarıldı!`);

  // Örnek Maçlar
  console.log(`\n--- Geniş İddaa Örnek Maçlar (${dStr}) ---`);
  parsedMatches.slice(0, 10).forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.league}] ${m.home_team} ${m.ms_score || '?-?'} ${m.away_team} (İY: ${m.iy_score || '-'}) | MS: ${m.ms_1_odd} - ${m.ms_0_odd} - ${m.ms_2_odd} | 2.5 Alt/Üst: ${m.alt_25_odd} / ${m.ust_25_odd}`);
  });
}

async function run() {
  await processDate('28.07.2026', '2026-07-28');
  await processDate('29.07.2026', '2026-07-29');
}

run().catch(console.error);
