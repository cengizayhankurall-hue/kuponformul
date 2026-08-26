const fs = require('fs');
const code = fs.readFileSync('ProgramLarge.js', 'utf8');

const idx = code.indexOf('for (var i = 0;');
if (idx !== -1) {
  console.log("Found for loop:\n", code.substring(idx, idx + 2000));
} else {
  const matches = code.match(/for\s*\([^\)]*livedata[^\)]*\)[\s\S]*?\{/g);
  console.log("Matches:", matches);
}
