const https = require('https');
const fs = require('fs');
const path = require('path');

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

function httpsGet(urlStr) {
  return new Promise((resolve) => {
    https.get(urlStr, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 10000
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode || 200, text: d }));
    }).on('error', (err) => resolve({ status: 500, text: '' }));
  });
}

function cleanOdds(val) {
  if (!val || val === '0,00' || val === '0.00' || val === '-') return '-';
  return String(val).replace(',', '.');
}

async function run() {
  console.log('Fetching live and 7-day Mackolik bulletin from local IP...');
  const parsedMap = new Map();

  const parseBulletin = (txt, isLiveFeed = false) => {
    try {
      const obj = new Function('return ' + txt)();
      (obj.m || []).forEach((g) => {
        (g.m || []).forEach((m) => {
          if (m[1] && m[3]) {
            const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
            if (state === 4) return; // finished

            const isLive = state === 1 || state === 2 || state === 3 || (isLiveFeed && state !== 0);
            const liveScore = isLive 
              ? `${m[8] !== undefined && m[8] !== '' ? m[8] : '0'} - ${m[9] !== undefined && m[9] !== '' ? m[9] : '0'}` 
              : undefined;
            const liveStatus = state === 1 ? '1. Yarı' : state === 2 ? 'Devre Arası' : state === 3 ? '2. Yarı' : (isLive ? 'Canlı' : undefined);
            const liveMinute = isLive ? (m[10] || m[11] || (state === 2 ? 'DA' : undefined)) : undefined;

            parsedMap.set(String(m[0]), {
              id: String(m[0]),
              eventId: String(m[0]),
              code: String(m[4] || String(m[0]).slice(0, 5)),
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
    } catch (e) {
      console.warn('Parse error:', e.message);
    }
  };

  // 7 days
  for (let offset = 0; offset <= 6; offset++) {
    const d = new Date();
    const tNow = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    tNow.setDate(tNow.getDate() + offset);
    const dayStr = `${String(tNow.getDate()).padStart(2, '0')}/${String(tNow.getMonth() + 1).padStart(2, '0')}/${tNow.getFullYear()}`;

    const res = await httpsGet(`https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dayStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`);
    if (res.status === 200 && res.text && res.text.includes('m:[')) {
      parseBulletin(res.text, false);
      console.log(`Fetched day ${dayStr}: total matches so far = ${parsedMap.size}`);
    }
  }

  const allMatches = Array.from(parsedMap.values());
  console.log(`Total parsed matches: ${allMatches.length}`);

  if (allMatches.length > 0) {
    const outPath = path.join(process.cwd(), 'public', 'data', 'iddaa_bulletin.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(allMatches, null, 2), 'utf-8');
    console.log(`Saved ${allMatches.length} matches to ${outPath}`);
  }
}

run();
