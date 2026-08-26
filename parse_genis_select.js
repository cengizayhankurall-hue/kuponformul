async function parseSelect() {
  const url = 'https://arsiv.mackolik.com/Genis-Iddaa-Programi';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const html = await res.text();
  
  // Find all <select> and <option> tags in HTML
  const selectMatches = html.match(/<select[^>]*>[\s\S]*?<\/select>/gi);
  if (selectMatches) {
    selectMatches.forEach((s, idx) => {
      console.log(`--- SELECT ${idx + 1} ---`);
      console.log(s);
    });
  } else {
    console.log('No <select> tags found directly in HTML string.');
  }

  // Search for ajax functions in HTML
  const scripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
  if (scripts) {
    scripts.forEach((sc) => {
      if (sc.includes('Program') || sc.includes('ashx') || sc.includes('day') || sc.includes('Change')) {
        console.log('--- SCRIPT MATCH ---');
        console.log(sc.substring(0, 500));
      }
    });
  }
}

parseSelect();
