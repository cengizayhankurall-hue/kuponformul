import { NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 40
});

function httpsGet(urlStr: string, referer = 'https://arsiv.mackolik.com/Genis-Iddaa-Programi', timeoutMs = 6000): Promise<{ status: number; text: string }> {
  return new Promise((resolve) => {
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
        timeout: timeoutMs
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode || 200, text: data });
        });
      });

      req.on('error', () => {
        resolve({ status: 500, text: '' });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 504, text: '' });
      });

      req.end();
    } catch {
      resolve({ status: 500, text: '' });
    }
  });
}

// Global In-Memory Cache
interface CachedData {
  timestamp: number;
  unplayedCount: number;
  matches: any[];
}

let cache: CachedData | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
let inProgressPromise: Promise<CachedData> | null = null;

async function scanUpcomingMatches(): Promise<CachedData> {
  const dates: string[] = [];
  for (let i = 0; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    dates.push(`${dd}/${mm}/${yyyy}`);
  }

  const unplayedMatches: any[] = [];
  const seenEventIds = new Set<string>();

  for (const dayStr of dates) {
    const res = await httpsGet(`https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dayStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`);
    if (res.status === 200 && res.text && res.text.length > 100) {
      try {
        const obj = new Function(`return ${res.text}`)();
        (obj.m || []).forEach((g: any) => {
          (g.m || []).forEach((m: any) => {
            const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
            // State 0: Oynanmamış / Başlamamış maçlar
            if (state === 0 && m[1] && m[3] && m[50]) {
              const eventId = String(m[50]);
              if (!seenEventIds.has(eventId)) {
                seenEventIds.add(eventId);
                unplayedMatches.push({
                  id: String(m[0]),
                  matchId: String(m[0]),
                  eventId,
                  homeTeam: String(m[1]).trim(),
                  awayTeam: String(m[3]).trim(),
                  league: String(m[26] || 'Diğer').trim(),
                  date: String(m[7] || dayStr).trim(),
                  time: String(m[6] || '').trim(),
                  code: String(m[49] || m[4] || ''),
                  odds: {
                    ms1: m[16] ? String(m[16]).replace(',', '.') : '-',
                    ms0: m[17] ? String(m[17]).replace(',', '.') : '-',
                    ms2: m[18] ? String(m[18]).replace(',', '.') : '-',
                    alt25: m[22] ? String(m[22]).replace(',', '.') : '-',
                    ust25: m[23] ? String(m[23]).replace(',', '.') : '-',
                    kgVar: m[39] ? String(m[39]).replace(',', '.') : '-',
                    kgYok: m[40] ? String(m[40]).replace(',', '.') : '-'
                  }
                });
              }
            }
          });
        });
      } catch {}
    }
  }

  const results: any[] = [];
  const concurrency = 20;
  let cursor = 0;

  async function worker() {
    while (cursor < unplayedMatches.length) {
      const match = unplayedMatches[cursor++];
      if (!match) break;

      try {
        const popupRes = await httpsGet(`https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${match.eventId}&s=futbol`, 'https://arsiv.mackolik.com/Genis-Iddaa-Programi', 5000);
        if (popupRes.status !== 200 || !popupRes.text || !popupRes.text.trim().startsWith('{')) continue;

        const json = JSON.parse(popupRes.text);
        const bookie = json.data?.matches?.[0]?.bookies?.[0];
        if (!bookie?.markets) continue;

        let odd45Ust: number | null = null;
        let odd45Alt: number | null = null;
        let oddHerIkiYari15Ust: number | null = null;
        let oddHerIkiYari15Alt: number | null = null;

        bookie.markets.forEach((mkt: any) => {
          const mktName = (mkt.name || '').toLowerCase();

          // 4.5 Alt / Üst (Toplam Gol)
          if ((mktName.includes('4,5') || mktName.includes('4.5')) && mktName.includes('alt/üst') && !mktName.includes('korner') && !mktName.includes('kart') && !mktName.includes('1. yarı') && !mktName.includes('2. yarı')) {
            const ust = (mkt.outcomes || []).find((o: any) => o.name === 'Üst' || o.key === '+4.5');
            if (ust?.value && ust.value !== '-') {
              const val = parseFloat(String(ust.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) odd45Ust = val;
            }
            const alt = (mkt.outcomes || []).find((o: any) => o.name === 'Alt' || o.key === '-4.5');
            if (alt?.value && alt.value !== '-') {
              const val = parseFloat(String(alt.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) odd45Alt = val;
            }
          }

          // Her İki Yarı da 1.5 Üst
          if ((mktName.includes('iki yarı') || mktName.includes('her iki yarı')) && (mktName.includes('1,5') || mktName.includes('1.5')) && mktName.includes('üst')) {
            const evet = (mkt.outcomes || []).find((o: any) => o.name === 'Evet' || o.key === '+1.5' || o.name === 'Üst');
            if (evet?.value && evet.value !== '-') {
              const val = parseFloat(String(evet.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) oddHerIkiYari15Ust = val;
            }
          }

          // Her İki Yarı da 1.5 Alt
          if ((mktName.includes('iki yarı') || mktName.includes('her iki yarı')) && (mktName.includes('1,5') || mktName.includes('1.5')) && mktName.includes('alt')) {
            const evet = (mkt.outcomes || []).find((o: any) => o.name === 'Evet' || o.key === '+1.5' || o.name === 'Alt');
            if (evet?.value && evet.value !== '-') {
              const val = parseFloat(String(evet.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) oddHerIkiYari15Alt = val;
            }
          }
        });

        if (odd45Ust !== null && oddHerIkiYari15Ust !== null) {
          const diff = Math.abs(odd45Ust - oddHerIkiYari15Ust);
          const diffRounded = parseFloat(diff.toFixed(2));

          results.push({
            id: match.id,
            matchId: match.matchId,
            eventId: match.eventId,
            code: match.code,
            date: match.date,
            time: match.time,
            league: match.league,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            odd45Ust,
            odd45Alt,
            oddHerIkiYari15Ust,
            oddHerIkiYari15Alt,
            diff: diffRounded,
            isCloseDiff: diffRounded <= 0.20,
            odds: match.odds
          });
        }
      } catch {}
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);

  // Sort results by lowest diff first, then date/time
  results.sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff;
    return a.time.localeCompare(b.time);
  });

  const finalData: CachedData = {
    timestamp: Date.now(),
    unplayedCount: unplayedMatches.length,
    matches: results
  };

  cache = finalData;
  return finalData;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const now = Date.now();
    let data: CachedData;

    if (!forceRefresh && cache && (now - cache.timestamp < CACHE_TTL_MS)) {
      data = cache;
    } else {
      if (!inProgressPromise) {
        inProgressPromise = scanUpcomingMatches().finally(() => {
          inProgressPromise = null;
        });
      }
      data = await inProgressPromise;
    }

    const matches = data.matches;
    const diff020Matches = matches.filter(m => m.diff <= 0.20);
    const diff010Matches = matches.filter(m => m.diff <= 0.10);
    const exactMatches = matches.filter(m => m.diff === 0.00);

    // Extract available distinct dates & leagues
    const dateSet = new Set<string>();
    const leagueSet = new Set<string>();
    matches.forEach(m => {
      if (m.date) dateSet.add(m.date);
      if (m.league) leagueSet.add(m.league);
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUnplayed: data.unplayedCount,
        totalWithBothOdds: matches.length,
        diff020Count: diff020Matches.length,
        diff010Count: diff010Matches.length,
        exactMatchCount: exactMatches.length
      },
      availableDates: Array.from(dateSet),
      availableLeagues: Array.from(leagueSet).sort(),
      matches: matches,
      cachedAt: new Date(data.timestamp).toISOString()
    });
  } catch (error: any) {
    console.error('Gol analizi API hatası:', error);
    return NextResponse.json({ success: false, error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}
