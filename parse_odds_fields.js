const fs = require('fs');
const code = fs.readFileSync('ProgramLarge.js', 'utf8');

const idx = code.indexOf('var macSonuc1 = matchData[8];');
if (idx !== -1) {
  console.log(code.substring(idx, idx + 2500));
}
