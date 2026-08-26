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

async function fetchOddsPopup(matchId) {
  try {
    const url = `https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.ashx?type=oddspopup&id=${matchId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://arsiv.mackolik.com/'
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const html = await res.text();

    const parsePattern = (pattern) => {
      const match = html.match(pattern);
      return match ? parseNum(match[1]) : null;
    };

    // Parse odds from oddspopup HTML
    const ms1 = parsePattern(/MS\s*1<\/td>\s*<td[^>]*>([\d,\.]+)/i);
    const msX = parsePattern(/MS\s*X<\/td>\s*<td[^>]*>([\d,\.]+)/i);
    const ms2 = parsePattern(/MS\s*2<\/td>\s*<td[^>]*>([\d,\.]+)/i);

    const iy1 = parsePattern(/IY\s*1<\/td>\s*<td[^>]*>([\d,\.]+)/i);
    const iyX = parsePattern(/IY\s*X<\/td>\s*<td[^>]*>([\d,\.]+)/i);
    const iy2 = parsePattern(/IY\s*2<\/td>\s*<td[^>]*>([\d,\.]+)/i);

    const alt25 = parsePattern(/2,5\s*Alt<\/td>\s*<td[^>]*>([\d,\.]+)/i);
    const ust25 = parsePattern(/2,5\s*Üst<\/td>\s*<td[^>]*>([\d,\.]+)/i);

    const kgVar = parsePattern(/KG\s*Var<\/td>\s*<td[^>]*>([\d,\.]+)/i);
    const kgYok = parsePattern(/KG\s*Yok<\/td>\s*<td[^>]*>([\d,\.]+)/i);

    const cs1X = parsePattern(/1-X<\/td>\s*<td[^>]*>([\d,\.]+)/i);
    const cs12 = parsePattern(/1-2<\/td>\s*<td[^>]*>([\d,\.]+)/i);
    const csX2 = parsePattern(/X-2<\/td>\s*<td[^>]*>([\d,\.]+)/i);

    return { ms1, msX, ms2, iy1, iyX, iy2, alt25, ust25, kgVar, kgYok, cs1X, cs12, csX2 };
  } catch (e) {
    return null;
  }
}

async function runEnrichment() {
  console.log('1. Cleaning up existing 2026-07-29 rows in past_matches...');
  await supabase.from('past_matches').delete().eq('match_date', '2026-07-29');

  console.log('2. Fetching Mackolik livedata for 29/07/2026...');
  const res = await fetch('https://vd.mackolik.com/livedata?date=29/07/2026', { cache: 'no-store' });
  const data = await res.json();
  const rawMatches = data.m || [];

  console.log(`Received ${rawMatches.length} raw matches from livedata.`);

  const footballMatches = [];

  for (const m of rawMatches) {
    if (!m || !m[2] || !m[4]) continue;

    const leagueName = m[36] && m[36][1] ? String(m[36][1]) : '';
    const lowerLeague = leagueName.toLowerCase();

    // STRICTLY FILTER OUT BASKETBALL & TENNIS & VOLLEYBALL
    if (lowerLeague.includes('basket') || lowerLeague.includes('nba') ||
        lowerLeague.includes('tenis') || lowerLeague.includes('voley') ||
        lowerLeague.includes('handball') || lowerLeague.includes('hentbol')) {
      continue;
    }

    const matchId = m[0];
    const homeTeam = String(m[2]).trim();
    const awayTeam = String(m[4]).trim();
    const matchTime = String(m[16] || '00:00').trim();

    let league = leagueName;
    if (m[36] && m[36][2]) league += ` ${m[36][2]}`.trim();

    // MS Score: m[11] = home, m[12] = away
    let msScore = null;
    if (m[11] !== undefined && m[11] !== null && String(m[11]).trim() !== '' &&
        m[12] !== undefined && m[12] !== null && String(m[12]).trim() !== '') {
      msScore = `${m[11]}-${m[12]}`;
    } else if (typeof m[7] === 'string' && m[7].includes('-') && !m[7].includes(':')) {
      msScore = m[7].trim();
    }

    // İY Score: m[15] object -> h1 and h2
    let iyScore = null;
    if (m[15] && typeof m[15] === 'object') {
      if (m[15].h1 !== undefined && m[15].h1 !== null && m[15].h2 !== undefined && m[15].h2 !== null) {
        iyScore = `${m[15].h1}-${m[15].h2}`;
      }
    }

    // Livedata Odds
    let ms1 = parseNum(m[18]);
    let msX = parseNum(m[19]);
    let ms2 = parseNum(m[20]);
    let alt25 = parseNum(m[21]);
    let ust25 = parseNum(m[22]);
    let iy1 = null, iyX = null, iy2 = null, kgVar = null, kgYok = null, cs1X = null, cs12 = null, csX2 = null;

    // Try oddspopup for detailed odds if matchId is valid
    if (matchId) {
      const popOdds = await fetchOddsPopup(matchId);
      if (popOdds) {
        if (popOdds.ms1) ms1 = popOdds.ms1;
        if (popOdds.msX) msX = popOdds.msX;
        if (popOdds.ms2) ms2 = popOdds.ms2;
        if (popOdds.alt25) alt25 = popOdds.alt25;
        if (popOdds.ust25) ust25 = popOdds.ust25;

        iy1 = popOdds.iy1;
        iyX = popOdds.iyX;
        iy2 = popOdds.iy2;
        kgVar = popOdds.kgVar;
        kgYok = popOdds.kgYok;
        cs1X = popOdds.cs1X;
        cs12 = popOdds.cs12;
        csX2 = popOdds.csX2;
      }
    }

    footballMatches.push({
      match_date: '2026-07-29',
      match_time: matchTime,
      league: league || 'Diğer',
      home_team: homeTeam,
      away_team: awayTeam,
      iy_score: iyScore,
      ms_score: msScore,
      ms_1_odd: ms1,
      ms_0_odd: msX,
      ms_2_odd: ms2,
      iy_1_odd: iy1,
      iy_0_odd: iyX,
      iy_2_odd: iy2,
      kg_var_odd: kgVar,
      kg_yok_odd: kgYok,
      cs_1x_odd: cs1X,
      cs_12_odd: cs12,
      cs_x2_odd: csX2,
      alt_25_odd: alt25,
      ust_25_odd: ust25
    });
  }

  console.log(`3. Found ${footballMatches.length} FOOTBALL-ONLY matches. Upserting into past_matches...`);

  let count = 0;
  for (let i = 0; i < footballMatches.length; i += 50) {
    const chunk = footballMatches.slice(i, i + 50);
    const { error } = await supabase
      .from('past_matches')
      .upsert(chunk, {
        onConflict: 'home_team,away_team,match_date'
      });

    if (error) {
      console.error(`Chunk error:`, error.message);
    } else {
      count += chunk.length;
      console.log(`Upserted ${count}/${footballMatches.length} football matches...`);
    }
  }

  console.log(`\n✅ FINISHED! Successfully updated ${count} Football matches with full scores and odds for 29.07.2026.`);
}

runEnrichment().catch(console.error);
