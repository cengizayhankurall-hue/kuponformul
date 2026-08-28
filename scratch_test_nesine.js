const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080', '--ignore-certificate-errors', '--ignore-certificate-errors-spki-list']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://www.nesine.com/sportoto', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));

    console.log('Current URL:', page.url());
    console.log('Page Title:', await page.title());

    const pageInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ id: i.id, type: i.type, name: i.name, className: i.className }));
      const btns = Array.from(document.querySelectorAll('button, a')).map(b => ({ text: (b.innerText || '').trim(), title: b.getAttribute('title'), className: b.className }));
      return { inputsCount: inputs.length, sampleInputs: inputs.slice(0, 10), btnsCount: btns.length, sampleBtns: btns.filter(b => b.text || b.title).slice(0, 15) };
    });

    console.log('Page info:', JSON.stringify(pageInfo, null, 2));

    // Click 15 checkboxes for column 0
    for (let i = 0; i < 15; i++) {
      await page.evaluate((idx) => {
        const el = document.getElementById(`m-c-${idx}-0-0`);
        if (el) el.click();
      }, i);
      await new Promise(r => setTimeout(r, 50));
    }

    await new Promise(r => setTimeout(r, 1000));

    // Find all buttons on the page
    const btnInfo = await page.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll('button, a, div, span, input, i'));
      const results = [];
      for (const el of allEls) {
        const text = (el.innerText || '').trim();
        const title = el.getAttribute('title') || '';
        const aria = el.getAttribute('aria-label') || '';
        const cls = typeof el.className === 'string' ? el.className : '';
        const html = el.outerHTML.slice(0, 150);

        if (
          text.toLowerCase().includes('hemen oyna') ||
          text.toLowerCase().includes('kaydet') ||
          title.toLowerCase().includes('kaydet') ||
          cls.includes('save') ||
          cls.includes('disk') ||
          cls.includes('ni-save')
        ) {
          results.push({ tag: el.tagName, text, title, aria, cls, html });
        }
      }
      return results;
    });

    console.log('Buttons found:', JSON.stringify(btnInfo, null, 2));

    // Try clicking the disk button
    console.log('Trying to click disk button...');
    const clicked = await page.evaluate(() => {
      // 1. Try selector with title
      const titleBtn = document.querySelector('button[title*="Kaydet"], a[title*="Kaydet"], [title*="Kaydet"]');
      if (titleBtn) {
        titleBtn.click();
        return { method: 'title', html: titleBtn.outerHTML };
      }

      // 2. Try selector with class ni-save
      const niSave = document.querySelector('.ni-save');
      if (niSave) {
        const parentBtn = niSave.closest('button') || niSave.closest('a') || niSave.parentElement;
        if (parentBtn) {
          parentBtn.click();
          return { method: 'ni-save', html: parentBtn.outerHTML };
        }
      }

      // 3. Find Hemen Oyna sibling/predecessor
      const visibleBtns = Array.from(document.querySelectorAll('a, button')).filter(el => el.offsetParent !== null);
      const playIdx = visibleBtns.findIndex(el => (el.innerText || '').trim().toLowerCase() === 'hemen oyna');
      if (playIdx >= 1) {
        visibleBtns[playIdx - 1].click();
        return { method: 'hemen-oyna-sibling', html: visibleBtns[playIdx - 1].outerHTML };
      }

      return { method: 'none' };
    });

    console.log('Click result:', clicked);

    await new Promise(r => setTimeout(r, 1500));

    // Check if modal or input opened
    const modalCheck = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])')).filter(i => i.offsetParent !== null);
      const modals = Array.from(document.querySelectorAll('.modal, [class*="modal"], [class*="popup"], [role="dialog"]')).filter(m => m.offsetParent !== null);
      return {
        inputsCount: inputs.length,
        inputs: inputs.map(i => ({ placeholder: i.placeholder, className: i.className, outerHTML: i.outerHTML })),
        modalsCount: modals.length,
        modals: modals.map(m => m.className)
      };
    });

    console.log('Modal check after click:', JSON.stringify(modalCheck, null, 2));

  } finally {
    await browser.close();
  }
}

test().catch(console.error);
