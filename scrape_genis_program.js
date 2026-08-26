async function scrapeGenis() {
  const url = 'https://arsiv.mackolik.com/Genis-Iddaa-Programi';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  console.log('HTML Status:', res.status, 'Length:', html.length);
  
  // Find scripts or handler references in HTML
  const matches = html.match(/[\w\/\.-]+\.ashx[^\s'"]*/g);
  console.log('Found ashx handlers:', matches);

  // Find date parameters or Javascript objects
  const jsObjects = html.match(/var\s+\w+\s*=\s*\{[^}]+\}/g);
  if (jsObjects) {
    console.log('JS Objects count:', jsObjects.length);
    console.log('First JS Object:', jsObjects[0]);
  }
}

scrapeGenis();
