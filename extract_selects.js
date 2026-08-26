const fs = require('fs');
const html = fs.readFileSync('genis_iddaa_page.html', 'utf8');

const selectRegex = /<select[^>]*>([\s\S]*?)<\/select>/gi;
let m;
while ((m = selectRegex.exec(html)) !== null) {
  console.log("------------------- SELECT -------------------");
  console.log(m[0]);
}
