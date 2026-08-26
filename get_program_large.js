const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'cm.mackolik.com',
  path: '/js5/Mackolik/ProgramLarge.js?v=2.169',
  method: 'GET',
  rejectUnauthorized: false
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('ProgramLarge.js', data);
    console.log('Saved ProgramLarge.js, length:', data.length);
  });
}).on('error', console.error);
