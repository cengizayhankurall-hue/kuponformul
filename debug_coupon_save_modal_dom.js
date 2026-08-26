const puppeteer = require('puppeteer-core');

async function debugCouponSaveModalDOM() {
  console.log('Debugging exact Coupon Save Modal DOM on Nesine Spor Toto...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1920,1080']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto('https://www.nesine.com/sportoto', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Select matches
    await page.evaluate(() => {
      const el1 = document.getElementById('m-c-0-0-0');
      const el2 = document.getElementById('m-c-1-0-1');
      if (el1) el1.click();
      if (el2) el2.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    // Click disk button
    const diskBtn = await page.$('button[title="Kaydet"]');
    console.log('Disk button found:', !!diskBtn);
    if (diskBtn) {
      await diskBtn.click();
      console.log('Clicked Disk button with native Puppeteer click!');
    }

    // Poll for modals over 5 seconds
    for (let sec = 1; sec <= 10; sec++) {
      await new Promise(r => setTimeout(r, 500));
      const modals = await page.evaluate(() => {
        const allModals = Array.from(document.querySelectorAll('.modal, .modal-dialog, .modal-content, [role="dialog"], div[class*="modal"], div[class*="popup"]'));
        return allModals
          .filter(m => m.offsetParent !== null)
          .map(m => ({
            className: m.className,
            id: m.id,
            innerText: m.innerText?.trim(),
            htmlSnippet: m.innerHTML.slice(0, 300)
          }));
      });

      console.log(`[After ${sec * 500}ms] Visible Modals Count: ${modals.length}`);
      if (modals.length > 0) {
        console.log('Modals found:', JSON.stringify(modals, null, 2));
      }
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

debugCouponSaveModalDOM();
