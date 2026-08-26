const fs = require('fs');
const html = fs.readFileSync('genis_iddaa_page.html', 'utf8');

console.log("Searching for ProgramDataHandler or Ajax:");
const ajaxMatches = html.match(/.*ProgramDataHandler.*/g);
if (ajaxMatches) {
  ajaxMatches.forEach(m => console.log(m.trim()));
}

console.log("\nSearching for date select options:");
const selectMatch = html.match(/<select[^>]*id=["']?day[^"'>]*["']?[^>]*>([\s\S]*?)<\/select>/i) ||
                    html.match(/<select[^>]*name=["']?day[^"'>]*["']?[^>]*>([\s\S]*?)<\/select>/i);
if (selectMatch) {
  console.log("Select element found:\n", selectMatch[0].substring(0, 1000));
} else {
  // Find all <select> tags
  const selects = html.match(/<select[^>]*>([\s\S]*?)<\/select>/gi);
  if (selects) {
    selects.forEach((s, idx) => console.log(`Select ${idx}:\n`, s));
  }
}
