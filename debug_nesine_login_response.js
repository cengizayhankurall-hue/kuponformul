const puppeteer = require('puppeteer-core');

async function debugNesineLogin() {
  console.log('Debugging exact Nesine login submit response...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1280,800']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto('https://www.nesine.com', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    // Open login modal
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => {
        const headerEls = Array.from(document.querySelectorAll('header *'));
        const loginEl = headerEls.find(el => (el.innerText?.trim() === 'Giriş Yap' || el.textContent?.trim() === 'Giriş Yap') && el.children.length === 0);
        if (loginEl) loginEl.click();
      });

      await new Promise(r => setTimeout(r, 250));

      const hasCaptcha = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.some(img => img.alt?.toLowerCase() === 'captcha' || (img.src && (img.src.startsWith('data:image/jpeg') || img.src.startsWith('data:image/png'))));
      });

      if (hasCaptcha) break;
    }

    // Inspect inputs and submit button
    const elementsInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        placeholder: i.placeholder,
        testid: i.getAttribute('data-testid'),
        visible: i.offsetParent !== null
      })).filter(i => i.visible && i.type !== 'checkbox');

      const btns = Array.from(document.querySelectorAll('button, a, input[type="submit"]')).map(b => ({
        id: b.id,
        text: b.innerText?.trim(),
        type: (b).type,
        testid: b.getAttribute('data-testid'),
        visible: b.offsetParent !== null
      })).filter(b => b.visible && b.text === 'Giriş Yap');

      return { inputs, btns };
    });

    console.log('Login modal elements info:', JSON.stringify(elementsInfo, null, 2));

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

debugNesineLogin();
