const fs = require('fs');
const code = fs.readFileSync('ProgramLarge.js', 'utf8');

const regex = /type\s*=\s*([0-9]+)/g;
let m;
while ((m = regex.exec(code)) !== null) {
  console.log("Found type =", m[1]);
}

// Search for week parameter
const weekIdx = code.indexOf('week=');
if (weekIdx !== -1) {
  console.log("Snippet around week=:\n", code.substring(weekIdx - 100, weekIdx + 300));
}
