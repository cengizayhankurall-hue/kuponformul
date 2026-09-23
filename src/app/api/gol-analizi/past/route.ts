import { NextResponse } from 'next/server';
import https from 'https';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface GoalPastMatch {
  id: string;
  matchId: string;
  eventId: string;
  code: string;
  date: string;
  isoDate: string;
  time: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  odd45Ust: number;
  odd45Alt: number | null;
  oddHerIkiYari15Ust: number;
  oddHerIkiYari15Alt: number | null;
  diff: number; // |4.5 Üst - Her İki Yarı 1.5 Üst|
  isCloseDiff: boolean;
  odds: {
    ms1: string;
    ms0: string;
    ms2: string;
    alt25: string;
    ust25: string;
    kgVar: string;
    kgYok: string;
  };
  // Skor ve Sonuç İstatistikleri
  ftScore: string;
  iyScore: string;
  msHome: number;
  msAway: number;
  iyHome: number;
  iyAway: number;
  totalGoals: number;
  htGoals: number;
  shGoals: number;
  isHtOver15: boolean;
  isShOver15: boolean;
  isBothHalves15Ust: boolean;
  isOver25: boolean;
  isOver35: boolean;
  isOver45: boolean;
  isKgVar: boolean;
}

interface SuccessStats {
  total: number;
  ht15Count: number;
  ht15Rate: string;
  bothHalves15Count: number;
  bothHalves15Rate: string;
  over25Count: number;
  over25Rate: string;
  over35Count: number;
  over35Rate: string;
  over45Count: number;
  over45Rate: string;
  kgVarCount: number;
  kgVarRate: string;
}

interface PastApiResponse {
  success: boolean;
  timestamp: number;
  dateRange: string[];
  stats: {
    totalFinished: number;
    totalWithBothOdds: number;
    diff020Count: number;
    diff010Count: number;
    exactMatchCount: number;
    all: SuccessStats;
    closeDiff: SuccessStats; // Fark <= 0.20
    exactDiff: SuccessStats; // Fark === 0.00
  };
  matches: GoalPastMatch[];
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'gol_analizi_past_cache.json');
const PUBLIC_CACHE_FILE = path.join(process.cwd(), 'public', 'data', 'gol_analizi_past_cache.json');
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 dakika

let memoryCache: PastApiResponse | null = null;
let inProgressPromise: Promise<PastApiResponse> | null = null;

const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 40
});

function normalizeText(str: string) {
  return (str || '')
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u').replace(/ş/g, 's').replace(/Ş/g, 's').replace(/ö/g, 'o')
    .replace(/Ö/g, 'o').replace(/ç/g, 'c').replace(/Ç/g, 'c').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function httpsGet(urlStr: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const req = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        agent,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://arsiv.mackolik.com/' },
        timeout: 4500
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode || 200, text: data }));
      });
      req.on('error', () => resolve({ status: 500, text: '' }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 504, text: '' }); });
      req.end();
    } catch { resolve({ status: 500, text: '' }); }
  });
}

function loadCacheFromDisk(): PastApiResponse | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.matches)) {
        return parsed;
      }
    }
    if (fs.existsSync(PUBLIC_CACHE_FILE)) {
      const raw = fs.readFileSync(PUBLIC_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.matches)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading past cache:', e);
  }
  return null;
}

function saveCacheToDisk(data: PastApiResponse) {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');

    const pubDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
    fs.writeFileSync(PUBLIC_CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing past cache to disk:', e);
  }
}

function calculateSuccessStats(matches: GoalPastMatch[]): SuccessStats {
  const total = matches.length;
  if (total === 0) {
    return {
      total: 0,
      ht15Count: 0,
      ht15Rate: '0.0',
      bothHalves15Count: 0,
      bothHalves15Rate: '0.0',
      over25Count: 0,
      over25Rate: '0.0',
      over35Count: 0,
      over35Rate: '0.0',
      over45Count: 0,
      over45Rate: '0.0',
      kgVarCount: 0,
      kgVarRate: '0.0'
    };
  }

  const ht15 = matches.filter(m => m.isHtOver15).length;
  const both15 = matches.filter(m => m.isBothHalves15Ust).length;
  const over25 = matches.filter(m => m.isOver25).length;
  const over35 = matches.filter(m => m.isOver35).length;
  const over45 = matches.filter(m => m.isOver45).length;
  const kgVar = matches.filter(m => m.isKgVar).length;

  return {
    total,
    ht15Count: ht15,
    ht15Rate: ((ht15 / total) * 100).toFixed(1),
    bothHalves15Count: both15,
    bothHalves15Rate: ((both15 / total) * 100).toFixed(1),
    over25Count: over25,
    over25Rate: ((over25 / total) * 100).toFixed(1),
    over35Count: over35,
    over35Rate: ((over35 / total) * 100).toFixed(1),
    over45Count: over45,
    over45Rate: ((over45 / total) * 100).toFixed(1),
    kgVarCount: kgVar,
    kgVarRate: ((kgVar / total) * 100).toFixed(1)
  };
}

async function fetchAndProcessPastMatches(daysBack = 3): Promise<PastApiResponse> {
  const dates: { dayStr: string; isoDate: string }[] = [];
  for (let i = 1; i <= daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    dates.push({ dayStr: `${dd}/${mm}/${yyyy}`, isoDate: `${yyyy}-${mm}-${dd}` });
  }

  const allFinished: { m: any; dayStr: string; isoDate: string; eventId: string }[] = [];
  const seenEventIds = new Set<string>();

  await Promise.all(dates.map(async ({ dayStr, isoDate }) => {
    const liveRes = await httpsGet(`https://vd.mackolik.com/livedata?date=${dayStr}`);
    if (liveRes.status === 200 && liveRes.text && liveRes.text.length > 50) {
      try {
        const liveJson = JSON.parse(liveRes.text);
        (liveJson.m || []).forEach((m: any) => {
          if (m[5] === 4 && m[14]) {
            const eventId = String(m[14]);
            if (!seenEventIds.has(eventId)) {
              seenEventIds.add(eventId);
              allFinished.push({ m, dayStr, isoDate, eventId });
            }
          }
        });
      } catch (e) {}
    }
  }));

  const queue = [...allFinished];
  const results: GoalPastMatch[] = [];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.pop();
      if (!item) break;
      const { m, dayStr, isoDate, eventId } = item;

      const popupRes = await httpsGet(`https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${eventId}&s=futbol`);
      if (popupRes.status !== 200 || !popupRes.text || !popupRes.text.startsWith('{')) continue;

      try {
        const pJson = JSON.parse(popupRes.text);
        const bookie = pJson.data?.matches?.[0]?.bookies?.[0];
        if (!bookie || !Array.isArray(bookie.markets)) continue;

        let odd45Ust: number | null = null;
        let odd45Alt: number | null = null;
        let oddHerIkiYari15Ust: number | null = null;
        let oddHerIkiYari15Alt: number | null = null;

        const odds = {
          ms1: '-',
          ms0: '-',
          ms2: '-',
          alt25: '-',
          ust25: '-',
          kgVar: '-',
          kgYok: '-'
        };

        bookie.markets.forEach((mkt: any) => {
          const normName = normalizeText(mkt.name);

          // MS 1 - X - 2
          if (normName === 'mac sonucu' || normName === 'ms') {
            (mkt.outcomes || []).forEach((o: any) => {
              const oName = normalizeText(o.name);
              if (oName === '1') odds.ms1 = String(o.value || '-');
              if (oName === '0' || oName === 'x') odds.ms0 = String(o.value || '-');
              if (oName === '2') odds.ms2 = String(o.value || '-');
            });
          }

          // 2.5 Alt / Üst
          if ((normName.includes('2,5') || normName.includes('2.5')) && normName.includes('alt/ust') && !normName.includes('korner') && !normName.includes('kart') && !normName.includes('1. yari')) {
            (mkt.outcomes || []).forEach((o: any) => {
              const oName = normalizeText(o.name);
              if (oName === 'alt' || o.key === '-2.5') odds.alt25 = String(o.value || '-');
              if (oName === 'ust' || o.key === '+2.5') odds.ust25 = String(o.value || '-');
            });
          }

          // KG Var / Yok
          if (normName.includes('karsilikli gol') || normName.includes('kg')) {
            (mkt.outcomes || []).forEach((o: any) => {
              const oName = normalizeText(o.name);
              if (oName === 'var') odds.kgVar = String(o.value || '-');
              if (oName === 'yok') odds.kgYok = String(o.value || '-');
            });
          }

          // 4.5 Alt / Üst
          if ((normName.includes('4,5') || normName.includes('4.5')) && normName.includes('alt/ust') && !normName.includes('korner') && !normName.includes('kart') && !normName.includes('1. yari')) {
            (mkt.outcomes || []).forEach((o: any) => {
              const oName = normalizeText(o.name);
              if (oName === 'ust' || o.key === '+4.5') {
                if (o.value && o.value !== '-') {
                  const v = parseFloat(String(o.value).replace(',', '.'));
                  if (!isNaN(v) && v > 1) odd45Ust = v;
                }
              }
              if (oName === 'alt' || o.key === '-4.5') {
                if (o.value && o.value !== '-') {
                  const v = parseFloat(String(o.value).replace(',', '.'));
                  if (!isNaN(v) && v > 1) odd45Alt = v;
                }
              }
            });
          }

          // Her İki Yarı 1.5 Üst
          if (normName.includes('iki yari') && (normName.includes('1,5') || normName.includes('1.5')) && normName.includes('ust')) {
            (mkt.outcomes || []).forEach((o: any) => {
              const oName = normalizeText(o.name);
              if (oName === 'evet' || o.key === '+1.5' || oName === 'ust') {
                if (o.value && o.value !== '-') {
                  const v = parseFloat(String(o.value).replace(',', '.'));
                  if (!isNaN(v) && v > 1) oddHerIkiYari15Ust = v;
                }
              }
              if (oName === 'hayir' || o.key === '-1.5' || oName === 'alt') {
                if (o.value && o.value !== '-') {
                  const v = parseFloat(String(o.value).replace(',', '.'));
                  if (!isNaN(v) && v > 1) oddHerIkiYari15Alt = v;
                }
              }
            });
          }
        });

        if (odd45Ust !== null && oddHerIkiYari15Ust !== null) {
          const diff = Math.abs(odd45Ust - oddHerIkiYari15Ust);
          const msHome = parseInt(m[12]) || 0;
          const msAway = parseInt(m[13]) || 0;
          const ftScore = `${msHome} - ${msAway}`;

          const iyParts = (m[7] || '0-0').split('-');
          const iyHome = parseInt(iyParts[0]) || 0;
          const iyAway = parseInt(iyParts[1]) || 0;
          const iyScore = `${iyHome} - ${iyAway}`;

          const totalGoals = msHome + msAway;
          const htGoals = iyHome + iyAway;
          const shGoals = totalGoals - htGoals;

          const isHtOver15 = htGoals >= 2;
          const isShOver15 = shGoals >= 2;
          const isBothHalves15Ust = isHtOver15 && isShOver15;
          const isOver25 = totalGoals >= 3;
          const isOver35 = totalGoals >= 4;
          const isOver45 = totalGoals >= 5;
          const isKgVar = msHome > 0 && msAway > 0;

          const league = (m[36] && m[36][3]) ? `${m[36][1]} - ${m[36][3]}` : (m[36] && m[36][1]) ? m[36][1] : 'Futbol';

          results.push({
            id: String(m[0]),
            matchId: String(m[0]),
            eventId,
            code: String(m[0]).slice(-4),
            date: dayStr,
            isoDate,
            time: m[16] || '00:00',
            league,
            homeTeam: m[2],
            awayTeam: m[4],
            odd45Ust,
            odd45Alt,
            oddHerIkiYari15Ust,
            oddHerIkiYari15Alt,
            diff: parseFloat(diff.toFixed(2)),
            isCloseDiff: diff <= 0.20,
            odds,
            ftScore,
            iyScore,
            msHome,
            msAway,
            iyHome,
            iyAway,
            totalGoals,
            htGoals,
            shGoals,
            isHtOver15,
            isShOver15,
            isBothHalves15Ust,
            isOver25,
            isOver35,
            isOver45,
            isKgVar
          });
        }
      } catch (e) {}
    }
  }

  await Promise.all(Array(35).fill(null).map(() => worker()));

  // Sort by smallest diff first, then date descending
  results.sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff;
    return b.isoDate.localeCompare(a.isoDate);
  });

  const diff020 = results.filter(r => r.diff <= 0.20);
  const diff010 = results.filter(r => r.diff <= 0.10);
  const exact = results.filter(r => r.diff === 0);

  const response: PastApiResponse = {
    success: true,
    timestamp: Date.now(),
    dateRange: dates.map(d => d.dayStr),
    stats: {
      totalFinished: allFinished.length,
      totalWithBothOdds: results.length,
      diff020Count: diff020.length,
      diff010Count: diff010.length,
      exactMatchCount: exact.length,
      all: calculateSuccessStats(results),
      closeDiff: calculateSuccessStats(diff020),
      exactDiff: calculateSuccessStats(exact)
    },
    matches: results
  };

  saveCacheToDisk(response);
  memoryCache = response;
  return response;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const daysBack = parseInt(searchParams.get('days') || '3', 10);

  if (!forceRefresh) {
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(memoryCache);
    }

    const diskCache = loadCacheFromDisk();
    if (diskCache) {
      memoryCache = diskCache;
      // If disk cache is fresh enough or we don't have active sync
      if (Date.now() - diskCache.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(diskCache);
      }
      // If disk cache is older, serve stale but trigger background refresh
      if (!inProgressPromise) {
        inProgressPromise = fetchAndProcessPastMatches(daysBack)
          .finally(() => { inProgressPromise = null; });
      }
      return NextResponse.json(diskCache);
    }
  }

  if (inProgressPromise) {
    const data = await inProgressPromise;
    return NextResponse.json(data);
  }

  try {
    inProgressPromise = fetchAndProcessPastMatches(daysBack);
    const data = await inProgressPromise;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Past match analysis failed:', error);
    const fallback = loadCacheFromDisk();
    if (fallback) return NextResponse.json(fallback);
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  } finally {
    inProgressPromise = null;
  }
}
