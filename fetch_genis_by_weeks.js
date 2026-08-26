const https = require('https');
const fs = require('fs');

function getCombo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'arsiv.mackolik.com',
      path: '/AjaxHandlers/ProgramComboHandler.ashx?sport=1&type=6&sortValue=DATE&week=-1&day=-1&sortDir=-1&groupId=-1&np=0',
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

function fetchProgram(day, week, np = 0) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'arsiv.mackolik.com',
      path: `/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${day}&week=${week}&sort=-1&sortDir=-1&groupId=-1&np=${np}&sport=1`,
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
  const combo = await getCombo();
  console.log("Days:", combo.d);
  console.log("Weeks:", combo.w.slice(0, 5));

  // Loop over weeks 24130, 24129, etc.
  for (const w of combo.w.slice(0, 4)) {
    const weekId = w[0];
    const weekText = w[1];
    console.log(`\n=================== WEEK ${weekId} (${weekText}) ===================`);
    
    // Fetch day = -1 for this week
    const data = await fetchProgram('-1', weekId, 0);
    if (data && Array.isArray(data.m)) {
      console.log(`np=0 total matches: ${data.m.length}`);
      data.m.forEach((row, i) => {
        if (!Array.isArray(row)) return;
        const code = row[5];
        const date = row[7];
        const time = row[6];
        const home = row[1];
        const away = row[3];
        const msHome = row[8];
        const msAway = row[9];
        const iyHome = row[11];
        const iyAway = row[12];
        const ms1 = row[16];
        const msX = row[17];
        const ms2 = row[18];
        console.log(`[${i+1}] Code:${code} | Date:${date} ${time} | ${home} ${iyHome}-${iyAway} (${msHome}-${msAway}) ${away} | Odds: 1:${ms1} X:${msX} 2:${ms2}`);
      });
    }
  }
}

run().catch(console.error);
