const fs = require('fs');
const code = fs.readFileSync('ProgramLarge.js', 'utf8');

const idx = code.indexOf('var imo_hms1 = matchData[36];');
if (idx !== -1) {
  console.log(code.substring(idx, idx + 2500));
}
