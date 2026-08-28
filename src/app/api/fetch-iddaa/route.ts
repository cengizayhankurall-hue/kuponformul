import { NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

const agent = new https.Agent({
  rejectUnauthorized: false
});

function httpsGet(urlStr: string, referer = 'https://arsiv.mackolik.com/Genis-Iddaa-Programi', retries = 2): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlStr);
      const options = {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        agent: agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Referer': referer,
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if ((res.statusCode === 502 || res.statusCode === 503) && retries > 0) {
            setTimeout(() => {
              httpsGet(urlStr, referer, retries - 1).then(resolve).catch(reject);
            }, 1000);
          } else {
            resolve({ status: res.statusCode || 200, text: data });
          }
        });
      });

      req.on('error', (err) => {
        if (retries > 0) {
          setTimeout(() => {
            httpsGet(urlStr, referer, retries - 1).then(resolve).catch(reject);
          }, 1000);
        } else {
          resolve({ status: 500, text: '' });
        }
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 504, text: '' });
      });

      req.end();
    } catch (e) {
      resolve({ status: 500, text: '' });
    }
  });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

let iddaaCache: {
  timestamp: number;
  data: any[];
} | null = null;
const CACHE_TTL = 30 * 1000; // 30 saniye canlı önbellek
let inFlightPromise: Promise<any[]> | null = null;

async function doFetch(): Promise<any[]> {
  const dObj = new Date();
  const trNow = new Date(dObj.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const dd = String(trNow.getDate()).padStart(2, '0');
  const mm = String(trNow.getMonth() + 1).padStart(2, '0');
  const yyyy = trNow.getFullYear();
  const todayStr = `${dd}/${mm}/${yyyy}`;

  const cleanOdds = (val: any) => {
    if (!val || val === '0,00' || val === '0.00' || val === '-') return '-';
    return String(val).replace(',', '.');
  };

  const cleanScore = (sc: string) => {
    if (!sc) return undefined;
    const parts = sc.split('-');
    if (parts.length === 2) {
      return `${parts[0].trim()} - ${parts[1].trim()}`;
    }
    return sc;
  };

  const parsedMap = new Map<string, any>();

  // 1. Önce Resmi Geniş İddaa Programı (sport=1 SADECE FUTBOL)
  const parseIddaaBulletin = (txt: string, isLiveFeed = false) => {
    try {
      const obj = new Function(`return ${txt}`)();
      (obj.m || []).forEach((g: any) => {
        (g.m || []).forEach((m: any) => {
          if (m[1] && m[3]) {
            const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
            // Biten maçları (State 4 = MS) bültenden çıkar
            if (state === 4) return;

            const isLive = state === 1 || state === 2 || state === 3 || (isLiveFeed && state !== 0);
            const liveScore = isLive 
              ? `${m[8] !== undefined && m[8] !== '' ? m[8] : '0'} - ${m[9] !== undefined && m[9] !== '' ? m[9] : '0'}` 
              : undefined;
            const liveStatus = state === 1 ? '1. Yarı' : state === 2 ? 'Devre Arası' : state === 3 ? '2. Yarı' : (isLive ? 'Canlı' : undefined);
            const liveMinute = isLive ? (m[10] || m[11] || (state === 2 ? 'DA' : undefined)) : undefined;

            const iddaaEventId = String(m[50] || m[14] || m[0]);
            const iddaaCode = String(m[49] || m[4] || String(m[0]).slice(0, 5));

            parsedMap.set(String(m[0]), {
              id: String(m[0]),
              matchId: String(m[0]),
              eventId: iddaaEventId,
              iddaaEventId,
              code: iddaaCode,
              league: String(m[26] || 'Diğer').trim(),
              date: String(m[7] || '').trim(),
              time: String(m[6] || '').trim(),
              homeTeam: String(m[1]).trim(),
              awayTeam: String(m[3]).trim(),
              score: liveScore,
              liveStatus,
              liveMinute,
              ms1: cleanOdds(m[16]),
              msX: cleanOdds(m[17]),
              ms2: cleanOdds(m[18]),
              cs1X: cleanOdds(m[19]),
              cs12: cleanOdds(m[20]),
              csX2: cleanOdds(m[21]),
              alt25: cleanOdds(m[22]),
              ust25: cleanOdds(m[23]),
              iy1: cleanOdds(m[33]),
              iyX: cleanOdds(m[34]),
              iy2: cleanOdds(m[35]),
              kgVar: cleanOdds(m[39]),
              kgYok: cleanOdds(m[40]),
              iyAlt15: cleanOdds(m[42]),
              iyUst15: cleanOdds(m[43]),
              alt15: cleanOdds(m[44]),
              ust15: cleanOdds(m[45]),
              alt35: cleanOdds(m[46]),
              ust35: cleanOdds(m[47]),
              isLive,
              source: 'Maçkolik İddaa'
            });
          }
        });
      });
    } catch (e) {}
  };

  // 1A. np=1 Canlı İddaa Bülteni (Canlı açılış oranları)
  const liveProgRes = await httpsGet(`https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${todayStr}&sort=-1&sortDir=-1&groupId=-1&np=1&sport=1`);
  if (liveProgRes.status === 200 && liveProgRes.text?.length > 100) {
    parseIddaaBulletin(liveProgRes.text, true);
  }

  await sleep(150);

  // 1B. np=0 7 Günlük Resmi Geniş Bülten Maçları (sport=1 Futbol)
  for (let offset = 0; offset <= 6; offset++) {
    const d = new Date();
    const tNow = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    tNow.setDate(tNow.getDate() + offset);
    const dayStr = `${String(tNow.getDate()).padStart(2, '0')}/${String(tNow.getMonth() + 1).padStart(2, '0')}/${tNow.getFullYear()}`;

    const res = await httpsGet(`https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dayStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`);
    if (res.status === 200 && res.text?.length > 100) {
      parseIddaaBulletin(res.text, false);
    }
    await sleep(150);
  }

  // 2. Canlı Sonuçlar (LiveData.aspx) -> SADECE VE SADECE OYNANMAKTA OLAN CANLI FUTBOL MAÇLARI (state 1, 2, 3)!
  // Başlamamış (state 0) dünya maçları veya basketbol maçları ASLA bültene eklenmez!
  try {
    const liveDataRes = await httpsGet('https://arsiv.mackolik.com/LiveScores/LiveData.aspx?group=0', 'https://arsiv.mackolik.com/Canli-Sonuclar');
    if (liveDataRes.status === 200 && liveDataRes.text?.startsWith('{')) {
      const data = JSON.parse(liveDataRes.text);
      (data.m || []).forEach((m: any) => {
        if (m[2] && m[4]) {
          const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
          
          // KESİN KURAL: Sadece oynanmakta olan canlı maçlar (state 1, 2, 3)
          if (state !== 1 && state !== 2 && state !== 3) return;

          const leagueName = (Array.isArray(m[36]) ? (m[36][3] || m[36][9]) : 'Diğer') || 'Diğer';
          const leagueLower = String(leagueName).toLowerCase();
          
          // Basketbol veya diğer sporları filtrele
          if (leagueLower.includes('basket') || leagueLower.includes('voleybol') || leagueLower.includes('hentbol') || leagueLower.includes('tenis')) {
            return;
          }

          const matchId = String(m[0]);
          const existing = parsedMap.get(matchId);

          const liveScore = m[7] ? cleanScore(m[7]) : (existing?.score || undefined);
          const liveStatus = state === 1 ? '1. Yarı' : state === 2 ? 'Devre Arası' : state === 3 ? '2. Yarı' : 'Canlı';
          const liveMinute = m[6] || (state === 2 ? 'DA' : undefined) || existing?.liveMinute;

          if (existing) {
            existing.isLive = true;
            existing.score = liveScore;
            existing.liveStatus = liveStatus;
            existing.liveMinute = liveMinute;
            if (m[14] && m[14] !== 0) {
              existing.eventId = String(m[14]);
              existing.iddaaEventId = String(m[14]);
            }
            if (m[3]) {
              existing.code = String(m[3]);
            }
          } else {
            const matchDate = m[35] ? String(m[35]).replace(/\//g, '.') : todayStr.replace(/\//g, '.');
            const iddaaEventId = String(m[14] || matchId);
            const iddaaCode = String(m[3] || matchId.slice(0, 5));

            parsedMap.set(matchId, {
              id: matchId,
              matchId,
              eventId: iddaaEventId,
              iddaaEventId,
              code: iddaaCode,
              league: String(leagueName).trim(),
              date: matchDate,
              time: String(m[16] || '').trim(),
              homeTeam: String(m[2]).trim(),
              awayTeam: String(m[4]).trim(),
              score: liveScore,
              liveStatus,
              liveMinute,
              ms1: '-',
              msX: '-',
              ms2: '-',
              cs1X: '-',
              cs12: '-',
              csX2: '-',
              alt25: '-',
              ust25: '-',
              isLive: true,
              source: 'Canlı Sonuçlar'
            });
          }
        }
      });
    }
  } catch (e) {
    console.warn('LiveData fetch failed:', e);
  }

  const deduplicated = Array.from(parsedMap.values());
  const parseDateTime = (dStr: string, tStr: string) => {
    const parts = dStr.split('.');
    if (parts.length !== 3) return 0;
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${tStr || '00:00'}:00`).getTime();
  };

  const sorted = deduplicated.sort((a, b) => parseDateTime(a.date, a.time) - parseDateTime(b.date, b.time));
  if (sorted && sorted.length >= 10) {
    iddaaCache = { timestamp: Date.now(), data: sorted };
  }
  return sorted;
}

export async function fetchMackolikMatches(): Promise<any[]> {
  const now = Date.now();
  if (iddaaCache && (now - iddaaCache.timestamp < CACHE_TTL)) {
    return iddaaCache.data;
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  if (iddaaCache && iddaaCache.data.length > 0) {
    inFlightPromise = doFetch().finally(() => { inFlightPromise = null; });
    return iddaaCache.data;
  }

  inFlightPromise = doFetch().finally(() => { inFlightPromise = null; });
  return inFlightPromise;
}

export async function GET() {
  try {
    const matches = await fetchMackolikMatches();
    return NextResponse.json({
      success: true,
      matches: matches || []
    });
  } catch (error: any) {
    console.error('Fetch Iddaa Error:', error);
    return NextResponse.json(
      { success: false, error: 'Maçkolik bülteni çekilemedi: ' + error.message, matches: [] },
      { status: 500 }
    );
  }
}
