const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function debugExactNesineSaveFlow() {
  console.log('Running exact debug simulation of Nesine save flow...');
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

    // Wait for checkboxes
    for (let i = 0; i < 20; i++) {
      const ready = await page.evaluate(() => !!document.getElementById('m-c-0-0-0'));
      if (ready) break;
      await new Promise(r => setTimeout(r, 250));
    }

    // Fill 15 matches
    await page.evaluate(() => {
      for (let m = 0; m < 15; m++) {
        const el = document.getElementById(`m-c-${m}-0-0`);
        if (el) el.click();
      }
    });

    await page.screenshot({ path: 'c:\\Users\\ckural\\Desktop\\stt\\step1_filled_matches.png' });
    console.log('Saved step1_filled_matches.png');

    // Click disk button
    const diskBtn = await page.$('button[title="Kaydet"]');
    console.log('Disk button handle found:', !!diskBtn);

    if (diskBtn) {
      await diskBtn.click();
      console.log('Clicked disk button!');
    } else {
      await page.evaluate(() => {
        const btn = document.querySelector('button[title="Kaydet"]') || document.querySelector('.ni-save')?.closest('button') || document.querySelector('.ni-save')?.parentElement;
        if (btn) (btn).click();
      });
      console.log('Clicked disk button via evaluate fallback!');
    }

    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'c:\\Users\\ckural\\Desktop\\stt\\step2_after_disk_click.png' });
    console.log('Saved step2_after_disk_click.png');

    // Inspect ALL open elements / modals in page
    const openModals = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div, section, main, body > *'));
      return allDivs
        .filter(d => {
          const s = window.getComputedStyle(d);
          return s.display !== 'none' && s.visibility !== 'hidden' && d.innerText && (d.innerText.includes('Kaydet') || d.innerText.includes('Kupon') || d.innerText.includes('Giriş'));
        })
        .map(d => ({
          tag: d.tagName,
          className: d.className,
          id: d.id,
          innerText: (d).innerText.slice(0, 150)
        }));
    });

    console.log('Visible elements with key terms:', JSON.stringify(openModals, null, 2));

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

debugExactNesineSaveFlow();
