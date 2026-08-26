const fs = require('fs');
const html = fs.readFileSync('genis_iddaa_page.html', 'utf8');

const mackolikVarIdx = html.indexOf('Mackolik.Program');
if (mackolikVarIdx !== -1) {
  console.log("Snippet around Mackolik.Program:\n", html.substring(mackolikVarIdx, mackolikVarIdx + 1500));
}
