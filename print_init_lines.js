const fs = require('fs');
const html = fs.readFileSync('genis_iddaa_page.html', 'utf8');

const lines = html.split('\n');
lines.forEach((line, i) => {
  if (line.includes('Mackolik.Program.') && line.includes('=')) {
    console.log(`L${i+1}: ${line.trim()}`);
  }
});
