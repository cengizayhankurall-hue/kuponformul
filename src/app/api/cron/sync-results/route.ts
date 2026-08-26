import { NextResponse } from 'next/server';
import https from 'https';
import { supabase } from '@/lib/supabase';

const agent = new https.Agent({
  rejectUnauthorized: false
});

function httpGet(urlStr: string, retries = 3): Promise<{ status: number; text: string }> {
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
        'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if ((res.statusCode === 502 || res.statusCode === 503) && retries > 0) {
          setTimeout(() => {
            httpGet(urlStr, retries - 1).then(resolve).catch(reject);
          }, 1500);
        } else {
          resolve({ status: res.statusCode || 200, text: data });
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

function cleanOdds(val: any): number | null {
  if (val === undefined || val === null || val === '' || val === '-' || val === 0 || val === '0,00' || val === '0.00') return null;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) || num === 0 ? null : num;
}

async function fetchAndSyncDay(dStr: string, isoDate: string) {
  const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;

  let txt = '';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: AbortSignal.timeout(10000),
      cache: 'no-store'
    });
    if (res.ok) {
      txt = await res.text();
    }
  } catch (err: any) {
    console.warn(`[Sync Cron] Fetch error for ${dStr}:`, err.message);
  }

  if (!txt || txt.length < 100 || !txt.includes('m:[')) {
    return 0;
  }

  // 1. Delete existing records for isoDate so fresh results replace them
  await supabase!
    .from('past_matches')
    .delete()
    .eq('match_date', isoDate);

  const obj = new Function(`return ${txt}`)();
  const groups = obj.m || [];
  const parsedMatches: any[] = [];

  groups.forEach((g: any) => {
    const matchesList = g.m || [];
    matchesList.forEach((m: any) => {
      if (m && m[1] && m[3]) {
        const homeTeam = String(m[1]).trim();
        const awayTeam = String(m[3]).trim();
        const rawTime = String(m[6] || '00:00').trim();
        const matchTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
        const league = String(m[26] || 'Diger').trim();

        // Match State & Finished Validation:
        // m[5] === 4 -> Finished (MS)
        // m[11] / m[12] !== '' -> Halftime/fulltime scores exist
        const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
        const hasIyScore = (m[11] !== undefined && m[11] !== null && m[11] !== '' && m[12] !== undefined && m[12] !== null && m[12] !== '');
        const isFinished = state === 4 || hasIyScore || m[13] === '2' || (m[13] === '3' && state === 4);

        // MS & IY scores
        const homeMS = m[8] !== undefined && m[8] !== null && m[8] !== '' ? String(m[8]).trim() : null;
        const awayMS = m[9] !== undefined && m[9] !== null && m[9] !== '' ? String(m[9]).trim() : null;
        
        // CRITICAL FIX: Sadece gerçekten bitmiş maçların skorunu al! Oynanmamış maçlara kesinlikle '0 - 0' yazma!
        const msScore = (isFinished && homeMS !== null && awayMS !== null && homeMS !== '-1' && awayMS !== '-1') 
          ? `${homeMS} - ${awayMS}` 
          : null;

        const homeIY = m[11] !== undefined && m[11] !== null && m[11] !== '' ? String(m[11]).trim() : null;
        const awayIY = m[12] !== undefined && m[12] !== null && m[12] !== '' ? String(m[12]).trim() : null;
        const iyScore = (homeIY !== null && awayIY !== null && homeIY !== '-1' && awayIY !== '-1') 
          ? `${homeIY}-${awayIY}` 
          : null;

        // Odds
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

  // Deduplicate
  const uniqueMap = new Map();
  parsedMatches.forEach(m => {
    const key = `${m.home_team}__${m.away_team}__${m.match_date}`;
    uniqueMap.set(key, m);
  });
  const uniqueMatches = Array.from(uniqueMap.values());

  if (uniqueMatches.length > 0) {
    for (let i = 0; i < uniqueMatches.length; i += 50) {
      const chunk = uniqueMatches.slice(i, i + 50);
      await supabase!
        .from('past_matches')
        .upsert(chunk, { onConflict: 'home_team,away_team,match_date' });
    }
  }

  return uniqueMatches.length;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const daysParam = searchParams.get('days') ? parseInt(searchParams.get('days')!, 10) : null;

    const datesToSync: { dStr: string; isoDate: string }[] = [];

    if (dateParam) {
      const [y, m, d] = dateParam.split('-');
      datesToSync.push({
        dStr: `${d}/${m}/${y}`,
        isoDate: dateParam
      });
    } else if (daysParam !== null) {
      // Toplu gün çekme: Biten geçmiş günleri çek (1: Dün, 2: 2 Gün Önce, 3: 3 Gün Önce)
      for (let i = 1; i <= Math.min(daysParam, 7); i++) {
        const t = new Date();
        t.setDate(t.getDate() - i);
        const dd = String(t.getDate()).padStart(2, '0');
        const mm = String(t.getMonth() + 1).padStart(2, '0');
        const yyyy = t.getFullYear();
        datesToSync.push({
          dStr: `${dd}/${mm}/${yyyy}`,
          isoDate: `${yyyy}-${mm}-${dd}`
        });
      }
    } else {
      // Varsayılan: Sadece Dünü çek (i = 1)
      const t = new Date();
      t.setDate(t.getDate() - 1);
      const dd = String(t.getDate()).padStart(2, '0');
      const mm = String(t.getMonth() + 1).padStart(2, '0');
      const yyyy = t.getFullYear();
      datesToSync.push({
        dStr: `${dd}/${mm}/${yyyy}`,
        isoDate: `${yyyy}-${mm}-${dd}`
      });
    }

    let totalSynced = 0;
    const details = [];

    for (const item of datesToSync) {
      const count = await fetchAndSyncDay(item.dStr, item.isoDate);
      totalSynced += count;
      details.push({ date: item.isoDate, matchesSynced: count });
    }

    return NextResponse.json({
      success: true,
      message: `Toplam ${totalSynced} maç veritabanına başarıyla aktarıldı.`,
      totalSynced,
      details
    });

  } catch (error: any) {
    console.error('[Sync Cron] Exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
