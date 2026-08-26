const fs = require('fs');
const code = fs.readFileSync('ProgramLarge.js', 'utf8');

const matches = code.match(/getProgram\s*=\s*function[\s\S]*?\}\;/);
if (matches) {
  console.log("getProgram function:\n", matches[0].substring(0, 2000));
} else {
  // search for ProgramDataHandler
  const handlerIdx = code.indexOf('ProgramDataHandler.ashx');
  if (handlerIdx !== -1) {
    console.log("Snippet around ProgramDataHandler:\n", code.substring(handlerIdx - 200, handlerIdx + 500));
  }
}
