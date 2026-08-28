import { NextResponse } from 'next/server';
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false
});

function httpsGet(url: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { agent, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', (err) => reject(err));
  });
}

import { fetchMackolikMatches } from '../fetch-iddaa/route';

// In-memory cache for detailed match odds
const oddsCache: Record<string, { timestamp: number; data: any }> = {};
const ODDS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

async function fetchOddsFromMackolik(targetEventId: string): Promise<any | null> {
  try {
    const url = `https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${targetEventId}&s=futbol`;
    const rawData = await httpsGet(url, {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'
    });
    if (!rawData || !rawData.trim().startsWith('{')) return null;
    const json = JSON.parse(rawData);
    if (json?.data?.matches && json.data.matches.length > 0) {
      return json;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'Match ID is required' }, { status: 400 });
    }

    // Check cache
    const now = Date.now();
    if (oddsCache[eventId] && (now - oddsCache[eventId].timestamp < ODDS_CACHE_TTL)) {
      return NextResponse.json({ success: true, data: oddsCache[eventId].data, cached: true });
    }

    // 1. Try directly with provided eventId
    let resultData = await fetchOddsFromMackolik(eventId);

    // 2. If empty, look up in cached/live bulletin matches to find actual iddaaEventId
    if (!resultData) {
      try {
        const matches = await fetchMackolikMatches();
        const matched = matches.find(m => 
          String(m.id) === eventId || 
          String(m.matchId) === eventId || 
          String(m.code) === eventId || 
          String(m.eventId) === eventId ||
          String(m.iddaaEventId) === eventId
        );

        if (matched) {
          const resolvedEventId = String(matched.iddaaEventId || matched.eventId || matched.id);
          if (resolvedEventId && resolvedEventId !== eventId) {
            resultData = await fetchOddsFromMackolik(resolvedEventId);
          }
        }
      } catch (e) {
        console.warn('Match lookup error:', e);
      }
    }

    // 3. If still empty, check livedata directly for match ID (m[0] -> m[14])
    if (!resultData) {
      try {
        const dObj = new Date();
        const trNow = new Date(dObj.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
        const dd = String(trNow.getDate()).padStart(2, '0');
        const mm = String(trNow.getMonth() + 1).padStart(2, '0');
        const yyyy = trNow.getFullYear();
        const dateStr = `${dd}/${mm}/${yyyy}`;

        const liveRaw = await httpsGet(`https://vd.mackolik.com/livedata?date=${dateStr}`, {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://arsiv.mackolik.com/'
        });

        if (liveRaw && liveRaw.trim().startsWith('{')) {
          const liveJson = JSON.parse(liveRaw);
          const foundMatch = (liveJson.m || []).find((m: any) => String(m[0]) === eventId || String(m[3]) === eventId);
          if (foundMatch && foundMatch[14] && foundMatch[14] !== 0) {
            resultData = await fetchOddsFromMackolik(String(foundMatch[14]));
          }
        }
      } catch (e) {
        console.warn('LiveData lookup error:', e);
      }
    }

    if (!resultData) {
      resultData = { data: { matches: [] } };
    }

    // Store in cache
    oddsCache[eventId] = {
      timestamp: now,
      data: resultData
    };

    return NextResponse.json({ success: true, data: resultData });
  } catch (error: any) {
    console.error('Fetch Match Odds Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
