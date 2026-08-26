const fs = require('fs');
const code = fs.readFileSync('ProgramLarge.js', 'utf8');

const idx = code.indexOf('getProgram:');
if (idx !== -1) {
  console.log(code.substring(idx, idx + 1500));
}
