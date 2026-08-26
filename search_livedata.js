const https = require('https');

function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'arsiv.mackolik.com',
      path: path,
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://arsiv.mackolik.com/'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

async function run() {
  const handlers = [
    '/AjaxHandlers/LivedataHandler.ashx?type=ended&date=28/07/2026',
    '/AjaxHandlers/LivedataHandler.ashx?type=ended&date=29/07/2026',
    '/AjaxHandlers/LivedataHandler.ashx?type=bydate&date=28/07/2026',
    '/AjaxHandlers/LivedataHandler.ashx?type=bydate&date=29/07/2026',
    '/AjaxHandlers/LivedataHandler.ashx?type=bydate&date=28.07.2026',
    '/AjaxHandlers/LivedataHandler.ashx?type=bydate&date=29.07.2026',
  ];

  for (const h of handlers) {
    try {
      const data = await fetchUrl(h);
      console.log(`\n=== Handler: ${h} (length: ${data.length}) ===`);
      let parsed;
      try {
        parsed = (new Function('return ' + data))();
      } catch(e) {
        console.log("Could not parse as JS object:", e.message);
        continue;
      }
      if (parsed && parsed.m) {
        console.log("Matches in parsed.m count:", parsed.m.length);
        let foundCount = 0;
        parsed.m.forEach((item, idx) => {
          const row = item.m || item;
          if (!Array.isArray(row)) return;
          const home = String(row[1] || row[2] || '');
          const away = String(row[3] || row[4] || '');
          if (home.toLowerCase().includes('burnley') || away.toLowerCase().includes('espanyol') ||
              home.toLowerCase().includes('betis') || away.toLowerCase().includes('lyon')) {
            foundCount++;
            console.log(`  MATCH: ${home} vs ${away}`);
            row.forEach((val, i) => {
              if (val !== '' && val !== null && val !== undefined) {
                console.log(`    [${i}]: ${JSON.stringify(val)}`);
              }
            });
          }
        });
        if (foundCount === 0) console.log("  No target matches in this response.");
      }
    } catch(e) {
      console.error(h, e.message);
    }
  }
}

run().catch(console.error);
