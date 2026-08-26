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

// In-memory cache for detailed match odds
const oddsCache: Record<string, { timestamp: number; data: any }> = {};
const ODDS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

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

    const url = `https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${eventId}&s=futbol`;

    const rawData = await httpsGet(url, {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'
    });

    const data = JSON.parse(rawData);

    // Store in cache
    oddsCache[eventId] = {
      timestamp: now,
      data: data
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Fetch Match Odds Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
