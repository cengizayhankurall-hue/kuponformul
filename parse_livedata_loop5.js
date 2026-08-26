const fs = require('fs');
const code = fs.readFileSync('ProgramLarge.js', 'utf8');

const idx = code.indexOf('writeProgramByDate: function');
if (idx !== -1) {
  console.log(code.substring(idx + 10000, idx + 13000));
}
