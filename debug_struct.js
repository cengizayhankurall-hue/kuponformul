const https = require('https');

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
  const json = await fetchDay('28.07.2026');
  console.log("Type of json:", typeof json);
  console.log("Keys of json:", Object.keys(json));
  console.log("json.m type:", typeof json.m, Array.isArray(json.m));
  console.log("json.m length:", json.m ? json.m.length : null);
  if (json.m && json.m.length > 0) {
    console.log("json.m[0] type/length:", typeof json.m[0], Array.isArray(json.m[0]) ? json.m[0].length : Object.keys(json.m[0]));
    console.log("json.m[0] sample:", json.m[0]);
  }
}

run().catch(console.error);
