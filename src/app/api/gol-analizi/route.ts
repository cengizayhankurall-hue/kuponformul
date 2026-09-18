import { NextResponse } from 'next/server';
import https from 'https';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface GoalMatch {
  id: string;
  matchId: string;
  eventId: string;
  code: string;
  date: string;
  time: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  odd45Ust: number;
  odd45Alt: number | null;
  oddHerIkiYari15Ust: number;
  oddHerIkiYari15Alt: number | null;
  diff: number; // |4.5 Üst - Her İki Yarı 1.5 Üst|
  isCloseDiff: boolean; // diff <= 0.20
  odds: {
    ms1: string;
    ms0: string;
    ms2: string;
    alt25: string;
    ust25: string;
    kgVar: string;
    kgYok: string;
  };
}

interface CachedData {
  timestamp: number;
  unplayedCount: number;
  matches: GoalMatch[];
  dates: string[];
  leagues: string[];
  stats: {
    totalUnplayed: number;
    totalWithBothOdds: number;
    diff020Count: number;
    diff010Count: number;
    exactMatchCount: number;
  };
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'gol_analizi_cache.json');
const CACHE_TTL_MS = 2.5 * 60 * 1000; // 2.5 dakika

let memoryCache: CachedData | null = null;
let inProgressPromise: Promise<CachedData> | null = null;

// Try to load cache from disk on startup
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
      memoryCache = parsed;
    }
  }
} catch (e) {
  // ignore startup cache read error
}

const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 35
});

function normalizeText(str: string): string {
  return (str || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function httpsGet(urlStr: string, referer = 'https://arsiv.mackolik.com/Genis-Iddaa-Programi', timeoutMs = 4500): Promise<{ status: number; text: string }> {
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

      req.on('error', () => resolve({ status: 500, text: '' }));
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

const cleanOdds = (val: any) => {
  if (!val || val === '0,00' || val === '0.00' || val === '-') return '-';
  return String(val).replace(',', '.');
};

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

  const unplayedMatches: Array<{
    id: string;
    matchId: string;
    eventId: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    date: string;
    time: string;
    code: string;
    ms1: string;
    ms0: string;
    ms2: string;
    alt25: string;
    ust25: string;
    kgVar: string;
    kgYok: string;
  }> = [];

  const seenEventIds = new Set<string>();

  // 1. Fetch unplayed matches across dates in parallel
  await Promise.all(dates.map(async (dayStr) => {
    try {
      const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dayStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;
      const res = await httpsGet(url);
      if (res.status === 200 && res.text && res.text.length > 50) {
        const obj = new Function(`return ${res.text}`)();
        (obj.m || []).forEach((g: any) => {
          (g.m || []).forEach((m: any) => {
            const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
            // State 0 = Henüz başlamamış / Oynanmamış
            if (state === 0 && m[1] && m[3] && m[50] && String(m[50]).length > 4 && String(m[50]) !== '0') {
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
                  code: String(m[49] || m[4] || String(m[0]).slice(0, 5)),
                  ms1: cleanOdds(m[16]),
                  ms0: cleanOdds(m[17]),
                  ms2: cleanOdds(m[18]),
                  alt25: cleanOdds(m[22]),
                  ust25: cleanOdds(m[23]),
                  kgVar: cleanOdds(m[30] || m[24]),
                  kgYok: cleanOdds(m[31] || m[25])
                });
              }
            }
          });
        });
      }
    } catch (e) {
      console.error('Bülten günü çekilemedi:', dayStr, e);
    }
  }));

  const results: GoalMatch[] = [];
  const concurrency = 30;
  let cursor = 0;

  async function worker() {
    while (cursor < unplayedMatches.length) {
      const match = unplayedMatches[cursor++];
      if (!match) break;

      try {
        const popupUrl = `https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${match.eventId}&s=futbol`;
        const popupRes = await httpsGet(popupUrl);
        if (popupRes.status !== 200 || !popupRes.text || !popupRes.text.trim().startsWith('{')) {
          continue;
        }

        const json = JSON.parse(popupRes.text);
        const bookie = json.data?.matches?.[0]?.bookies?.[0];
        if (!bookie || !Array.isArray(bookie.markets)) {
          continue;
        }

        let odd45Ust: number | null = null;
        let odd45Alt: number | null = null;
        let oddHerIkiYari15Ust: number | null = null;
        let oddHerIkiYari15Alt: number | null = null;

        bookie.markets.forEach((mkt: any) => {
          const normName = normalizeText(mkt.name);

          // 1. Toplam 4.5 Alt / Üst
          if ((normName.includes('4,5') || normName.includes('4.5')) && normName.includes('alt/ust') && !normName.includes('korner') && !normName.includes('kart') && !normName.includes('1. yari') && !normName.includes('2. yari')) {
            const ustOutcome = (mkt.outcomes || []).find((o: any) => normalizeText(o.name) === 'ust' || o.key === '+4.5');
            if (ustOutcome?.value && ustOutcome.value !== '-') {
              const val = parseFloat(String(ustOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) odd45Ust = val;
            }
            const altOutcome = (mkt.outcomes || []).find((o: any) => normalizeText(o.name) === 'alt' || o.key === '-4.5');
            if (altOutcome?.value && altOutcome.value !== '-') {
              const val = parseFloat(String(altOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) odd45Alt = val;
            }
          }

          // 2. Her İki Yarı da 1.5 Üst (e.g. "İki Yarı da 1,5 Üst", "Her İki Yarı da 1,5 Üst")
          if (normName.includes('iki yari') && (normName.includes('1,5') || normName.includes('1.5')) && normName.includes('ust')) {
            const evetOutcome = (mkt.outcomes || []).find((o: any) => normalizeText(o.name) === 'evet' || o.key === '+1.5' || normalizeText(o.name) === 'ust');
            if (evetOutcome?.value && evetOutcome.value !== '-') {
              const val = parseFloat(String(evetOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) oddHerIkiYari15Ust = val;
            }
          }

          // 3. Her İki Yarı da 1.5 Alt
          if (normName.includes('iki yari') && (normName.includes('1,5') || normName.includes('1.5')) && normName.includes('alt')) {
            const evetOutcome = (mkt.outcomes || []).find((o: any) => normalizeText(o.name) === 'evet' || o.key === '+1.5' || normalizeText(o.name) === 'alt');
            if (evetOutcome?.value && evetOutcome.value !== '-') {
              const val = parseFloat(String(evetOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) oddHerIkiYari15Alt = val;
            }
          }
        });

        // Both odds must exist
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
            odds: {
              ms1: match.ms1,
              ms0: match.ms0,
              ms2: match.ms2,
              alt25: match.alt25,
              ust25: match.ust25,
              kgVar: match.kgVar,
              kgYok: match.kgYok
            }
          });
        }
      } catch (err) {
        // ignore and continue
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);

  // Sort by lowest diff first, then date & time
  results.sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff;
    return a.time.localeCompare(b.time);
  });

  const availableDates = Array.from(new Set(results.map(m => m.date).filter(Boolean)));
  const availableLeagues = Array.from(new Set(results.map(m => m.league).filter(Boolean))).sort();

  const diff020Count = results.filter(m => m.diff <= 0.20).length;
  const diff010Count = results.filter(m => m.diff <= 0.10).length;
  const exactMatchCount = results.filter(m => m.diff === 0.00).length;

  const data: CachedData = {
    timestamp: Date.now(),
    unplayedCount: unplayedMatches.length,
    matches: results,
    dates: availableDates,
    leagues: availableLeagues,
    stats: {
      totalUnplayed: unplayedMatches.length,
      totalWithBothOdds: results.length,
      diff020Count,
      diff010Count,
      exactMatchCount
    }
  };

  memoryCache = data;

  // Persist cache to disk for instant zero-lag loading across server restarts
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf-8');
  } catch (e) {
    // ignore disk write errors
  }

  return data;
}

// Background refresher helper
function triggerBackgroundRefresh() {
  if (!inProgressPromise) {
    inProgressPromise = scanUpcomingMatches().finally(() => {
      inProgressPromise = null;
    });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const now = Date.now();

    // 1. If we have memory cache:
    if (memoryCache && memoryCache.matches.length > 0) {
      const isStale = now - memoryCache.timestamp > CACHE_TTL_MS;

      // If user forced refresh or cache is stale, trigger background refresh
      if (forceRefresh || isStale) {
        triggerBackgroundRefresh();
      }

      // Return memory cache immediately with 0ms delay (Stale-While-Revalidate)
      return NextResponse.json({
        success: true,
        cachedAt: new Date(memoryCache.timestamp).toISOString(),
        isRefreshing: !!inProgressPromise,
        stats: memoryCache.stats,
        availableDates: memoryCache.dates,
        availableLeagues: memoryCache.leagues,
        matches: memoryCache.matches
      });
    }

    // 2. If no cache yet (first run ever), perform scan or wait for ongoing scan
    triggerBackgroundRefresh();
    const freshData = await inProgressPromise!;

    return NextResponse.json({
      success: true,
      cachedAt: new Date(freshData.timestamp).toISOString(),
      isRefreshing: false,
      stats: freshData.stats,
      availableDates: freshData.dates,
      availableLeagues: freshData.leagues,
      matches: freshData.matches
    });
  } catch (error: any) {
    console.error('Gol Analizi API Hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Veri çekilemedi' },
      { status: 500 }
    );
  }
}
