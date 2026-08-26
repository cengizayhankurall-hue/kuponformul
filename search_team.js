const https = require('https');

function search(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'arsiv.mackolik.com',
      path: `/AjaxHandlers/SearchHandler.ashx?q=${encodeURIComponent(query)}`,
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Search '${query}' raw response:`, data);
        resolve(data);
      });
    }).on('error', reject);
  });
}

async function run() {
  await search('Burnley');
  await search('Real Betis');
}

run();
