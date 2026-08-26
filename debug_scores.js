async function debugScores() {
  const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=28.07.2026&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi'
    }
  });

  const txt = await res.text();
  const obj = new Function(`return ${txt}`)();
  const groups = obj.m || [];

  groups.forEach(g => {
    (g.m || []).forEach(m => {
      console.log(`[${m[1]} vs ${m[3]}]`);
      console.log(`  m[10]: ${JSON.stringify(m[10])}, m[11]: ${JSON.stringify(m[11])}, m[12]: ${JSON.stringify(m[12])}, m[13]: ${JSON.stringify(m[13])}, m[14]: ${JSON.stringify(m[14])}, m[15]: ${JSON.stringify(m[15])}, m[16]: ${JSON.stringify(m[16])}`);
    });
  });
}

debugScores();
