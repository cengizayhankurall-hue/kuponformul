import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium, { setupLambdaEnvironment } from '@sparticuz/chromium-min';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import tarFs from 'tar-fs';

interface SessionEntry {
  browser: Browser;
  page: Page;
  createdAt: number;
}

const CHROMIUM_PACK_URL = 'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar';

function extractTarBrotli(tarBrPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const readStream = fs.createReadStream(tarBrPath);
      const decompressor = zlib.createBrotliDecompress({ chunkSize: 2 ** 21 });
      const extractStream = tarFs.extract(destDir);

      extractStream.once('finish', () => resolve());
      extractStream.once('error', (err) => reject(err));
      decompressor.once('error', (err) => reject(err));
      readStream.once('error', (err) => reject(err));

      readStream.pipe(decompressor).pipe(extractStream);
    } catch (err) {
      reject(err);
    }
  });
}

async function launchBrowser(): Promise<Browser> {
  const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';

  if (isVercel) {
    const tmpDir = os.tmpdir();
    const chromiumBin = path.join(tmpDir, 'chromium');
    const al2023Dir = path.join(tmpDir, 'al2023');
    const al2023LibPath = path.join(al2023Dir, 'lib');
    const nss3File = path.join(al2023LibPath, 'libnss3.so');

    process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs20.x';
    (chromium as any).setGraphicsMode = false;

    const execPath = await (chromium as any).executablePath(CHROMIUM_PACK_URL);

    // Extract AL2023 shared libraries (libnss3.so, libnspr4.so, etc.)
    const al2023BrPath = path.join(tmpDir, 'chromium-pack', 'al2023.tar.br');
    if (fs.existsSync(al2023BrPath) && !fs.existsSync(nss3File)) {
      try {
        await extractTarBrotli(al2023BrPath, al2023Dir);
        console.log('[NesineBot] Extracted AL2023 libraries successfully to:', al2023Dir);
      } catch (e) {
        console.warn('[NesineBot] Error extracting AL2023 libraries:', e);
      }
    }

    try {
      setupLambdaEnvironment(al2023LibPath);
    } catch {}

    const ldPath = `${al2023LibPath}:${al2023Dir}:${tmpDir}:/usr/lib64:/lib64:/usr/lib`;

    process.env.LD_LIBRARY_PATH = ldPath;
    process.env.FONTCONFIG_PATH = '/tmp/fonts';
    process.env.HOME = '/tmp';

    return await puppeteer.launch({
      args: [
        ...((chromium as any).args || []),
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--single-process'
      ],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: execPath,
      headless: (chromium as any).headless ?? true,
      env: {
        ...process.env,
        LD_LIBRARY_PATH: ldPath,
        FONTCONFIG_PATH: '/tmp/fonts',
        HOME: '/tmp'
      }
    });
  } else {
    const candidatePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Users\\' + (process.env.USERNAME || '') + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      process.env.LOCAL_CHROME_PATH || ''
    ].filter(Boolean);

    let foundPath = candidatePaths.find(p => {
      try { return fs.existsSync(p); } catch { return false; }
    }) || candidatePaths[0];

    return await puppeteer.launch({
      executablePath: foundPath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,800'
      ]
    });
  }
}

// Global persistent session store across Next.js API route invocations
if (!(globalThis as any).__nesineSessions) {
  (globalThis as any).__nesineSessions = new Map<string, SessionEntry>();
}
const sessions: Map<string, SessionEntry> = (globalThis as any).__nesineSessions;

// Clean up old sessions (> 5 mins)
setInterval(async () => {
  const now = Date.now();
  for (const [id, entry] of sessions.entries()) {
    if (now - entry.createdAt > 300000) {
      try { await entry.browser.close(); } catch (e) {}
      sessions.delete(id);
    }
  }
}, 30000);

export async function getNesineCaptchaSession(): Promise<{ sessionId: string; captchaImage: string }> {
  const sessionId = crypto.randomUUID();

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      (window as any).chrome = { runtime: {} };
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Block non-essential heavy resources to load super fast
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      const url = req.url();
      if (
        url.includes('google-analytics') ||
        url.includes('clarity') ||
        url.includes('facebook') ||
        url.includes('hotjar') ||
        type === 'media' ||
        type === 'font'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto('https://www.nesine.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 1500));

    // Dismiss any cookie banners if present
    await page.evaluate(() => {
      const cookieBtns = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
      const acceptBtn = cookieBtns.find(b => {
        const t = (b.innerText || '').trim().toLowerCase();
        return t.includes('kabul') || t.includes('izin ver') || t.includes('tamam');
      });
      if (acceptBtn) acceptBtn.click();
    });

    // Poll to click 'Giriş Yap' link in header until login modal opens and captcha appears
    let captchaSrc: string | null = null;
    for (let i = 0; i < 30; i++) {
      await page.evaluate(() => {
        const headerEls = Array.from(document.querySelectorAll('header *'));
        const loginEl = headerEls.find(el =>
          ((el as HTMLElement).innerText?.trim() === 'Giriş Yap' || (el as HTMLElement).textContent?.trim() === 'Giriş Yap')
          && el.children.length === 0
        ) || Array.from(document.querySelectorAll('a, button')).find(el => (el as HTMLElement).innerText?.trim() === 'Giriş Yap');
        if (loginEl) (loginEl as HTMLElement).click();
      });

      await new Promise(r => setTimeout(r, 300));

      captchaSrc = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const c = imgs.find(img =>
          img.src &&
          (img.src.startsWith('data:image/jpeg') || img.src.startsWith('data:image/png') || img.src.startsWith('data:image/jpg')) &&
          !img.src.includes('svg')
        );
        return c ? c.src : null;
      });

      if (captchaSrc) break;
    }

    if (!captchaSrc) {
      throw new Error('Nesine güvenlik kodu (Captcha) alımı zaman aşımına uğradı. Lütfen "Yenile" butonuna basarak tekrar deneyin.');
    }

    sessions.set(sessionId, { browser, page, createdAt: Date.now() });
    console.log(`[NesineBot] Stored session ${sessionId}. Active sessions count: ${sessions.size}`);

    return { sessionId, captchaImage: captchaSrc };

  } catch (err: any) {
    try { await browser.close(); } catch (e) {}
    throw err;
  }
}

export async function saveNesineCouponWithSession(
  sessionId: string,
  username: string,
  pass: string,
  captcha: string,
  couponName: string,
  columns: Array<Array<string>>
): Promise<{ success: boolean; message: string }> {
  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error('Oturum süresi doldu veya yenilendi. Lütfen güvenlik kodunu yenileyip tekrar deneyin.');
  }

  const { browser, page } = session;

  try {
    // Fill inputs using React-compatible native value setter + keyboard events
    const inputInfo = await page.evaluate((u: string, p: string, c: string) => {
      const allInputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      const visibleInputs = allInputs.filter(input => {
        if (input.type === 'hidden' || input.type === 'checkbox' || input.type === 'radio') return false;
        const style = window.getComputedStyle(input);
        return style.display !== 'none' && style.visibility !== 'hidden' && input.offsetWidth > 0;
      });

      const textInputs = visibleInputs.filter(i => i.type === 'text' || i.type === 'email' || i.type === 'number' || i.type === 'tel');
      const passInput = visibleInputs.find(i => i.type === 'password');
      const userInput = textInputs[0];
      const captchaInput = textInputs.length > 1 ? textInputs[textInputs.length - 1] : null;

      // React-compatible fill: use native value descriptor setter
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      const fillReact = (el: HTMLInputElement, val: string) => {
        el.focus();
        if (nativeSetter) {
          nativeSetter.call(el, val);
        } else {
          el.value = val;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };

      if (userInput) fillReact(userInput, u);
      if (passInput) fillReact(passInput, p);
      if (captchaInput && captchaInput !== userInput) fillReact(captchaInput, c);

      return {
        userFilled: !!userInput,
        passFilled: !!passInput,
        captchaFilled: !!(captchaInput && captchaInput !== userInput),
        visibleInputCount: visibleInputs.length
      };
    }, username, pass, captcha);

    console.log('[NesineBot] Form filled (React native setter):', inputInfo);

    // Physical keyboard typing fallback for React listeners
    await page.evaluate(() => {
      const allInputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      const visible = allInputs.filter(i => {
        if (i.type === 'hidden' || i.type === 'checkbox' || i.type === 'radio') return false;
        const s = window.getComputedStyle(i);
        return s.display !== 'none' && s.visibility !== 'hidden' && i.offsetWidth > 0;
      });
      const texts = visible.filter(i => i.type === 'text' || i.type === 'email' || i.type === 'number' || i.type === 'tel');
      if (texts[0]) { texts[0].focus(); texts[0].select(); }
    });

    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(username, { delay: 10 });

    await page.evaluate(() => {
      const allInputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      const pass = allInputs.find(i => {
        const s = window.getComputedStyle(i);
        return i.type === 'password' && s.display !== 'none' && i.offsetWidth > 0;
      });
      if (pass) { pass.focus(); pass.select(); }
    });
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(pass, { delay: 10 });

    await page.evaluate(() => {
      const allInputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      const texts = allInputs.filter(i => {
        const s = window.getComputedStyle(i);
        return (i.type === 'text' || i.type === 'email') && s.display !== 'none' && i.offsetWidth > 0;
      });
      if (texts.length > 1) { texts[texts.length - 1].focus(); texts[texts.length - 1].select(); }
    });
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(captcha, { delay: 10 });

    console.log('[NesineBot] Keyboard typing complete.');
    await new Promise(r => setTimeout(r, 400));

    // Set up listener for the actual Nesine Login API response
    const loginResponsePromise = page.waitForResponse(
      res => res.url().includes('/Auth/Login') && res.request().method() === 'POST',
      { timeout: 12000 }
    ).catch(() => null);

    // Click 'GİRİŞ' submit button via page.evaluate
    const submitClicked = await page.evaluate(() => {
      const btnsList = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]')) as HTMLElement[];
      const btn = btnsList.find(b => {
        const style = window.getComputedStyle(b);
        const visible = style.display !== 'none' && style.visibility !== 'hidden' && b.offsetWidth > 0;
        const text = (b.innerText || b.getAttribute('value') || '').toUpperCase().replace(/\s+/g, '');
        return visible && (text.includes('GİRİŞ') || text.includes('GIRIS') || text === 'LOGIN') && !b.closest('header');
      });
      if (btn) { btn.click(); return true; }
      return false;
    });

    console.log('[NesineBot] Login submit clicked:', submitClicked);

    // Await the actual Login API response from Nesine server
    const loginRes = await loginResponsePromise;
    if (loginRes) {
      const loginData = await loginRes.json().catch(() => null);
      console.log('[NesineBot] Login API JSON:', JSON.stringify(loginData));

      if (loginData) {
        if (loginData.el && loginData.el.length > 0) {
          const msg = loginData.el.map((e: any) => e.m).filter(Boolean).join(' ');
          throw new Error(`Nesine Giriş Hatası: ${msg || 'Giriş yapılamadı.'}`);
        }
        if (loginData.sc && loginData.sc !== 200 && loginData.sc !== 0) {
          throw new Error(`Nesine Giriş Hatası: Kod ${loginData.sc}`);
        }
      }
    }

    // Wait 2 seconds for session cookies to settle
    await new Promise(r => setTimeout(r, 2000));

    console.log('[NesineBot] Login successful! Navigating to Spor Toto...');

    await page.goto('https://www.nesine.com/sportoto', { waitUntil: 'domcontentloaded', timeout: 25000 });

    // Wait for Spor Toto checkboxes to load
    let sportotoReady = false;
    for (let i = 0; i < 40; i++) {
      sportotoReady = await page.evaluate(() => !!document.getElementById('m-c-0-0-0'));
      if (sportotoReady) break;
      await new Promise(r => setTimeout(r, 250));
    }

    if (!sportotoReady) {
      throw new Error('Spor Toto sayfası yüklenemedi. Lütfen tekrar deneyin.');
    }

    const totalCols = columns.length;
    const totalBatches = Math.ceil(totalCols / 4);
    let savedCount = 0;

    // Nesine için kısa ve standart isim formatı (Örn: ST_A8K_1)
    const runId = Math.random().toString(36).substring(2, 5).toUpperCase();

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const currentBatch = columns.slice(batchIdx * 4, (batchIdx + 1) * 4);

      // 1. Clear existing checkboxes
      await page.evaluate(() => {
        const checked = Array.from(document.querySelectorAll('input[type="checkbox"][id^="m-c-"]:checked')) as HTMLInputElement[];
        checked.forEach(c => c.click());
      });
      await new Promise(r => setTimeout(r, 300));

      // 2. Fill batch columns
      for (let colIdx = 0; colIdx < currentBatch.length; colIdx++) {
        const column = currentBatch[colIdx];
        for (let matchIdx = 0; matchIdx < 15; matchIdx++) {
          if (matchIdx >= column.length) break;
          const pred = String(column[matchIdx]).toUpperCase();
          const choices: number[] = [];
          if (pred.includes('1')) choices.push(0);
          if (pred.includes('X') || pred.includes('0')) choices.push(1);
          if (pred.includes('2')) choices.push(2);

          for (const choiceIdx of choices) {
            const inputId = `m-c-${matchIdx}-${colIdx}-${choiceIdx}`;
            await page.evaluate((id) => {
              const el = document.getElementById(id) as HTMLInputElement;
              if (el && !el.checked) el.click();
            }, inputId);
          }
        }
      }

      await new Promise(r => setTimeout(r, 600));

      // Dismiss any warning modal (Tamam/Kapat)
      await page.evaluate(() => {
        const modalBtns = Array.from(document.querySelectorAll('button, a')).filter(btn => {
          const t = ((btn as HTMLElement).innerText || '').trim().toLowerCase();
          return t === 'tamam' || t === 'kapat' || t === 'vazgeç';
        }) as HTMLElement[];
        modalBtns.forEach(btn => btn.click());
      });

      await new Promise(r => setTimeout(r, 400));

      // 3. Find and click Disk/Save button
      console.log(`[NesineBot] Finding disk button and opening modal for batch ${batchIdx + 1}/${totalBatches}...`);
      
      let modalInputFound = false;
      for (let attempt = 1; attempt <= 20; attempt++) {
        modalInputFound = await page.evaluate(() => {
          const visibleInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'))
            .filter(el => (el as HTMLElement).offsetParent !== null);
          return visibleInputs.length > 0;
        });

        if (modalInputFound) break;

        // Click disk button
        await page.evaluate(() => {
          const visibleBtns = Array.from(document.querySelectorAll('a, button'))
            .filter(el => (el as HTMLElement).offsetParent !== null) as HTMLElement[];
          const playIndex = visibleBtns.findIndex(el => (el.innerText || '').trim().toLowerCase() === 'hemen oyna');
          
          let diskBtn: HTMLElement | null = null;
          if (playIndex >= 1) {
            diskBtn = visibleBtns[playIndex - 1];
          }
          if (!diskBtn) {
            diskBtn = (document.querySelector('button[title="Kaydet"]') ||
              document.querySelector('.ni-save')?.closest('button') ||
              document.querySelector('.ni-save')?.parentElement) as HTMLElement | null;
          }
          if (diskBtn) diskBtn.click();
        });

        await new Promise(r => setTimeout(r, 600));
      }

      if (!modalInputFound) {
        throw new Error('Nesine kupon kaydetme ("Kupon Adı") penceresi açılamadı. Lütfen tekrar deneyin.');
      }

      // 4. Set up listener for the actual Nesine Save Coupon network response
      const saveResponsePromise = page.waitForResponse(
        res => (res.url().includes('SavedCoupon') || res.url().includes('Save')) && res.request().method() === 'POST',
        { timeout: 8000 }
      ).catch(() => null);

      // Fill Coupon Name & Click the Yellow Kaydet button inside visible modal
      const cName = totalBatches > 1 ? `ST_${runId}_${batchIdx + 1}` : `ST_${runId}`;
      console.log(`[NesineBot] Batch ${batchIdx + 1}: Setting coupon name "${cName}"...`);

      const inputFilled = await page.evaluate((name) => {
        const modalInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'))
          .filter(el => (el as HTMLElement).offsetParent !== null) as HTMLInputElement[];
        
        if (modalInputs.length === 0) return false;
        const nameInput = modalInputs[modalInputs.length - 1];

        // Fill value with React-compatible setter
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(nameInput, name);
        } else {
          nameInput.value = name;
        }
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }, cName);

      if (!inputFilled) {
        throw new Error('Kupon adı giriş kutusu bulunamadı.');
      }

      // Wait 500ms for React state update before clicking Kaydet button
      await new Promise(r => setTimeout(r, 500));

      const saveBtnClicked = await page.evaluate(() => {
        const allVisibleEls = Array.from(document.querySelectorAll('button, a, span, div, input[type="button"], input[type="submit"]'))
          .filter(el => (el as HTMLElement).offsetParent !== null && (el as HTMLElement).innerText) as HTMLElement[];
        
        const kaydetBtn = allVisibleEls.find(btn => {
          const t = (btn.innerText || btn.getAttribute('value') || '').trim().toLowerCase();
          return t === 'kaydet' && btn.children.length === 0;
        }) || allVisibleEls.find(btn => {
          const t = (btn.innerText || btn.getAttribute('value') || '').trim().toLowerCase();
          return t === 'kaydet';
        });

        if (kaydetBtn) {
          kaydetBtn.click();
          return true;
        }
        return false;
      });

      if (!saveBtnClicked) {
        throw new Error('Modal içerisindeki "Kaydet" butonuna basılamadı.');
      }

      console.log(`[NesineBot] Kaydet button clicked for batch ${batchIdx + 1}. Awaiting save API response...`);

      // 5. Await actual Save network response from Nesine server
      const saveRes = await saveResponsePromise;
      if (saveRes) {
        const resText = await saveRes.text().catch(() => '');
        console.log(`[NesineBot] Save API HTTP ${saveRes.status()}: ${resText.slice(0, 300)}`);
      } else {
        console.log('[NesineBot] No SavedCoupon response intercepted within timeout, waiting confirmation...');
      }

      await new Promise(r => setTimeout(r, 3000));
      savedCount += currentBatch.length;

      // If there are more batches remaining, reload the page to clear the success popup
      if (batchIdx + 1 < totalBatches) {
        console.log(`[NesineBot] Batch ${batchIdx + 1} done. Refreshing Spor Toto page for batch ${batchIdx + 2}...`);
        await page.goto('https://www.nesine.com/sportoto', { waitUntil: 'domcontentloaded', timeout: 25000 });
        for (let i = 0; i < 30; i++) {
          const ready = await page.evaluate(() => !!document.getElementById('m-c-0-0-0'));
          if (ready) break;
          await new Promise(r => setTimeout(r, 250));
        }
      }
    }

    sessions.delete(sessionId);
    await browser.close();

    return {
      success: true,
      message: `Tebrikler! ${savedCount} kolon (${savedCount * 10} TL) başarıyla Nesine hesabınıza ("Kayıtlı Kuponlarım") kaydedildi.`
    };

  } catch (err: any) {
    sessions.delete(sessionId);
    try { await browser.close(); } catch (e) {}
    throw err;
  }
}

