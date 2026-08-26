const cheerio = require('cheerio');
const https = require('https');
https.get('https://arsiv.mackolik.com/Iddaa-Programi', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const $ = cheerio.load(data);
    const tr = $('tr.iddaa-played');
    console.log('Finished matches count:', tr.length);
    const first = $('tr[id^="tr-"]').first();
    const tds = first.find('td');
    console.log('First match TDs count:', tds.length);
    console.log('Content:#' + tds.eq(3).text() + ' # ' + tds.eq(4).text() + ' # ' + tds.eq(5).text());
  });
});