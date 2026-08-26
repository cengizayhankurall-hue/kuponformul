const https = require('https');

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

async function run() {
  const data = await getCombo();
  console.log("Combo response keys:", Object.keys(data));
  console.log("Available Days (data.d):", data.d);
  console.log("Available Leagues (data.l count):", data.l ? data.l.length : 0);
  console.log("Available Weeks (data.w):", data.w);
}

run().catch(console.error);
