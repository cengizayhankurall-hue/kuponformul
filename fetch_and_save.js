const https = require('https');
const fs = require('fs');

function fetchDay(day) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'arsiv.mackolik.com',
      path: `/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${day}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`,
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          let parsed = (new Function('return ' + data))();
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const day of ['28.07.2026', '29.07.2026']) {
    const json = await fetchDay(day);
    if (json && Array.isArray(json.m)) {
      console.log(`\nDay ${day}: found ${json.m.length} matches`);
      const summary = json.m.map((row, idx) => {
        return {
          idx,
          id: row[0],
          home: row[1],
          away: row[3],
          code: row[5],
          time: row[6],
          date: row[7],
          msHome: row[8],
          msAway: row[9],
          iyHome: row[11],
          iyAway: row[12],
          ms1: row[16],
          msX: row[17],
          ms2: row[18],
          iy1: row[29],
          iyX: row[30],
          iy2: row[31]
        };
      });
      fs.writeFileSync(`matches_${day}.json`, JSON.stringify(summary, null, 2));
      console.log(`Saved ${summary.length} matches to matches_${day}.json`);
    } else {
      console.log(`Day ${day}: json.m is not array or null`);
    }
  }
}

run().catch(console.error);
