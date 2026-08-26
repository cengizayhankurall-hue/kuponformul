const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'arsiv.mackolik.com',
  path: '/Genis-Iddaa-Programi',
  method: 'GET',
  rejectUnauthorized: false,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('genis_iddaa_page.html', data);
    console.log('Saved page HTML, length:', data.length);
    // Find date dropdown options
    const optionMatches = data.match(/<option[^>]*value=["']?([^"'>]+)["']?[^>]*>([^<]+)<\/option>/gi);
    if (optionMatches) {
      console.log('Found options:', optionMatches.slice(0, 20));
    }
  });
}).on('error', console.error);
