const fs = require('fs');
const html = fs.readFileSync('genis_iddaa_page.html', 'utf8');

const jsMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
if (jsMatches) {
  jsMatches.forEach((s, idx) => {
    if (s.includes('changeDay') || s.includes('dayId') || s.includes('ProgramDataHandler') || s.includes('ProgramLarge')) {
      console.log(`Script ${idx}:\n`, s.substring(0, 1500));
    }
  });
}
