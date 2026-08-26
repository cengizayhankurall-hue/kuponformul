require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function parseDate(dateStr) {
  try {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } catch (e) {}
  return dateStr;
}

function cleanNum(val) {
  if (val === undefined || val === null || val === '' || val === '-') return null;
  const cleaned = String(val).replace(',', '.');
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

async function fetchAndUploadForDate(dateStr) {
  console.log(`Fetching data for ${dateStr} from Mackolik...`);
  const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dateStr}&sort=-1&sortDir=-1&groupId=-1&np=1&sport=1`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*'
    },
    cache: 'no-store'
  });
  
  if (!res.ok) throw new Error(`HTTP status ${res.status}`);
  const txt = await res.text();
  console.log('Response length:', txt.length);
  if (txt.length < 500) console.log('Response text:', txt);
  
  const obj = new Function(`return ${txt}`)();
  
  const parsedMatches = [];
  const groups = obj.m || [];
  
  groups.forEach((g) => {
    const matchesList = g.m || [];
    matchesList.forEach((m) => {
      if (m[1] && m[3]) {
        const homeTeam = String(m[1]);
        const awayTeam = String(m[3]);
        const league = String(m[26] || 'Diğer');
        const time = String(m[6] || '');
        const date = String(m[7] || '');
        
        let msScore = null;
        let iyScore = null;
        
        let hMS = m[14]; let aMS = m[15];
        let hIY = m[12]; let aIY = m[13];
        
        if (hMS !== null && hMS !== undefined && hMS !== '' && aMS !== null && aMS !== undefined && aMS !== '') {
           msScore = `${hMS}-${aMS}`;
        }
        if (hIY !== null && hIY !== undefined && hIY !== '' && aIY !== null && aIY !== undefined && aIY !== '') {
           iyScore = `${hIY}-${aIY}`;
        }
        
        const cleanOdds = (val) => {
          if (!val || val === '0,00' || val === '0.00' || val === '-') return null;
          return Number(String(val).replace(',', '.'));
        };
        
        parsedMatches.push({
          match_date: parseDate(date || dateStr),
          match_time: time,
          league: league,
          home_team: homeTeam,
          away_team: awayTeam,
          iy_score: iyScore,
          ms_score: msScore,
          ms_1_odd: cleanOdds(m[16]),
          ms_0_odd: cleanOdds(m[17]),
          ms_2_odd: cleanOdds(m[18]),
          iy_1_odd: cleanOdds(m[33]),
          iy_0_odd: cleanOdds(m[34]),
          iy_2_odd: cleanOdds(m[35]),
          kg_var_odd: cleanOdds(m[39]),
          kg_yok_odd: cleanOdds(m[40]),
          cs_1x_odd: cleanOdds(m[19]),
          cs_12_odd: cleanOdds(m[20]),
          cs_x2_odd: cleanOdds(m[21]),
          alt_25_odd: cleanOdds(m[22]),
          ust_25_odd: cleanOdds(m[23])
        });
      }
    });
  });

  console.log(`Found ${parsedMatches.length} matches for ${dateStr}. Upserting into past_matches...`);

  let insertedCount = 0;
  for (let i = 0; i < parsedMatches.length; i += 100) {
    const chunk = parsedMatches.slice(i, i + 100);
    const { data, error } = await supabase
      .from('past_matches')
      .upsert(chunk, {
        onConflict: 'home_team,away_team,match_date'
      });
      
    if (error) {
       console.error('Error inserting chunk:', error);
    } else {
       insertedCount += chunk.length;
       console.log(`Inserted ${insertedCount}/${parsedMatches.length}...`);
    }
  }
  
  console.log(`Done! All results for ${dateStr} added/updated.`);
  return parsedMatches.length;
}

const targetDate = process.argv[2] || '29.07.2026';
fetchAndUploadForDate(targetDate).catch(console.error);
