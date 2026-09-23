const https = require('https');
const fs = require('fs');
const path = require('path');

const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 40
});

function normalizeText(str) {
  return (str || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function httpsGet(urlStr, referer = 'https://arsiv.mackolik.com/Genis-Iddaa-Programi', timeoutMs = 5000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const options = {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        agent: agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Referer': referer,
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: timeoutMs
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode || 200, text: data });
        });
      });

      req.on('error', () => resolve({ status: 500, text: '' }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 504, text: '' });
      });

      req.end();
    } catch {
      resolve({ status: 500, text: '' });
    }
  });
}

const cleanOdds = (val) => {
  if (!val || val === '0,00' || val === '0.00' || val === '-') return '-';
  return String(val).replace(',', '.');
};

function formatDateStr(dStr) {
  if (!dStr) return '';
  const clean = dStr.replace(/\//g, '.').trim();
  return clean;
}

// 1. SCAN UPCOMING 7 DAYS
async function syncUpcoming() {
  console.log('\n--- 1. GELECEK 7 GÜNLÜK BÜLTEN TARANIYOR ---');
  const dates = [];
  for (let i = 0; i <= 6; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    dates.push(`${dd}/${mm}/${yyyy}`);
  }

  const unplayedMatches = [];
  const seenEventIds = new Set();

  await Promise.all(dates.map(async (dayStr) => {
    try {
      const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dayStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;
      const res = await httpsGet(url);
      if (res.status === 200 && res.text && res.text.length > 50) {
        const obj = new Function(`return ${res.text}`)();
        (obj.m || []).forEach((g) => {
          (g.m || []).forEach((m) => {
            const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
            if (state === 0 && m[1] && m[3] && m[50] && String(m[50]).length > 4 && String(m[50]) !== '0') {
              const eventId = String(m[50]);
              if (!seenEventIds.has(eventId)) {
                seenEventIds.add(eventId);
                const rawDate = String(m[7] || dayStr).trim();
                unplayedMatches.push({
                  id: String(m[0]),
                  matchId: String(m[0]),
                  eventId,
                  homeTeam: String(m[1]).trim(),
                  awayTeam: String(m[3]).trim(),
                  league: String(m[26] || 'Diğer').trim(),
                  date: formatDateStr(rawDate),
                  time: String(m[6] || '').trim(),
                  code: String(m[49] || m[4] || String(m[0]).slice(0, 5)),
                  ms1: cleanOdds(m[16]),
                  ms0: cleanOdds(m[17]),
                  ms2: cleanOdds(m[18]),
                  alt25: cleanOdds(m[22]),
                  ust25: cleanOdds(m[23]),
                  kgVar: cleanOdds(m[30] || m[24]),
                  kgYok: cleanOdds(m[31] || m[25])
                });
              }
            }
          });
        });
      }
    } catch (e) {
      console.error('Bülten günü çekilemedi:', dayStr, e.message);
    }
  }));

  console.log(`Gelecek 7 gün için ${unplayedMatches.length} oynanmamış maç bulundu. Oran detayları çekiliyor...`);

  const results = [];
  const concurrency = 35;
  let cursor = 0;

  async function worker() {
    while (cursor < unplayedMatches.length) {
      const match = unplayedMatches[cursor++];
      if (!match) break;

      try {
        const popupUrl = `https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${match.eventId}&s=futbol`;
        const popupRes = await httpsGet(popupUrl);
        if (popupRes.status !== 200 || !popupRes.text || !popupRes.text.trim().startsWith('{')) {
          continue;
        }

        const json = JSON.parse(popupRes.text);
        const bookie = json.data?.matches?.[0]?.bookies?.[0];
        if (!bookie || !Array.isArray(bookie.markets)) {
          continue;
        }

        let odd45Ust = null;
        let odd45Alt = null;
        let oddHerIkiYari15Ust = null;
        let oddHerIkiYari15Alt = null;

        bookie.markets.forEach((mkt) => {
          const normName = normalizeText(mkt.name);

          // 1. Toplam 4.5 Alt / Üst
          if ((normName.includes('4,5') || normName.includes('4.5')) && normName.includes('alt/ust') && !normName.includes('korner') && !normName.includes('kart') && !normName.includes('1. yari') && !normName.includes('2. yari')) {
            const ustOutcome = (mkt.outcomes || []).find((o) => normalizeText(o.name) === 'ust' || o.key === '+4.5');
            if (ustOutcome?.value && ustOutcome.value !== '-') {
              const val = parseFloat(String(ustOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) odd45Ust = val;
            }
            const altOutcome = (mkt.outcomes || []).find((o) => normalizeText(o.name) === 'alt' || o.key === '-4.5');
            if (altOutcome?.value && altOutcome.value !== '-') {
              const val = parseFloat(String(altOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) odd45Alt = val;
            }
          }

          // 2. Her İki Yarı da 1.5 Üst
          if (normName.includes('iki yari') && (normName.includes('1,5') || normName.includes('1.5')) && normName.includes('ust')) {
            const evetOutcome = (mkt.outcomes || []).find((o) => normalizeText(o.name) === 'evet' || o.key === '+1.5' || normalizeText(o.name) === 'ust');
            if (evetOutcome?.value && evetOutcome.value !== '-') {
              const val = parseFloat(String(evetOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) oddHerIkiYari15Ust = val;
            }
          }

          // 3. Her İki Yarı da 1.5 Alt
          if (normName.includes('iki yari') && (normName.includes('1,5') || normName.includes('1.5')) && normName.includes('alt')) {
            const evetOutcome = (mkt.outcomes || []).find((o) => normalizeText(o.name) === 'evet' || o.key === '+1.5' || normalizeText(o.name) === 'alt');
            if (evetOutcome?.value && evetOutcome.value !== '-') {
              const val = parseFloat(String(evetOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) oddHerIkiYari15Alt = val;
            }
          }
        });

        if (odd45Ust !== null && oddHerIkiYari15Ust !== null) {
          const diff = Math.abs(odd45Ust - oddHerIkiYari15Ust);
          const diffRounded = parseFloat(diff.toFixed(2));

          results.push({
            id: match.id,
            matchId: match.matchId,
            eventId: match.eventId,
            code: match.code,
            date: match.date,
            time: match.time,
            league: match.league,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            odd45Ust,
            odd45Alt,
            oddHerIkiYari15Ust,
            oddHerIkiYari15Alt,
            diff: diffRounded,
            isCloseDiff: diffRounded <= 0.20,
            odds: {
              ms1: match.ms1,
              ms0: match.ms0,
              ms2: match.ms2,
              alt25: match.alt25,
              ust25: match.ust25,
              kgVar: match.kgVar,
              kgYok: match.kgYok
            }
          });
        }
      } catch (err) {
        // ignore
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);

  // Sort by lowest diff first, then date & time
  results.sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff;
    if (a.date !== b.date) {
      const [d1, m1, y1] = a.date.split('.').map(Number);
      const [d2, m2, y2] = b.date.split('.').map(Number);
      const t1 = new Date(y1, m1 - 1, d1).getTime();
      const t2 = new Date(y2, m2 - 1, d2).getTime();
      if (t1 !== t2) return t1 - t2;
    }
    return a.time.localeCompare(b.time);
  });

  const availableDates = Array.from(new Set(results.map(m => m.date).filter(Boolean)));
  // sort availableDates chronologically
  availableDates.sort((a, b) => {
    const [d1, m1, y1] = a.split('.').map(Number);
    const [d2, m2, y2] = b.split('.').map(Number);
    return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
  });

  const availableLeagues = Array.from(new Set(results.map(m => m.league).filter(Boolean))).sort();

  const diff020Count = results.filter(m => m.diff <= 0.20).length;
  const diff010Count = results.filter(m => m.diff <= 0.10).length;
  const exactMatchCount = results.filter(m => m.diff === 0.00).length;

  const data = {
    timestamp: Date.now(),
    unplayedCount: unplayedMatches.length,
    matches: results,
    dates: availableDates,
    leagues: availableLeagues,
    stats: {
      totalUnplayed: unplayedMatches.length,
      totalWithBothOdds: results.length,
      diff020Count,
      diff010Count,
      exactMatchCount
    }
  };

  const outDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'gol_analizi_cache.json'), JSON.stringify(data, null, 2), 'utf-8');

  const publicDir = path.join(__dirname, 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'gol_analizi_cache.json'), JSON.stringify(data, null, 2), 'utf-8');

  console.log(`Gelecek Bülten Başarıyla Kaydedildi: ${results.length} maç (Tarihler: ${availableDates.join(', ')})`);
  return data;
}

// 2. SCAN PAST 3-4 DAYS FINISHED MATCHES
async function syncPast() {
  console.log('\n--- 2. GEÇMİŞ BİTEN MAÇLAR VE DOĞRULAMA TARANIYOR ---');
  const pastDates = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    pastDates.push({ dayStr: `${dd}/${mm}/${yyyy}`, formattedDate: `${dd}.${mm}.${yyyy}` });
  }

  const allFinished = [];
  const seenEventIds = new Set();

  await Promise.all(pastDates.map(async ({ dayStr, formattedDate }) => {
    try {
      const liveRes = await httpsGet(`https://vd.mackolik.com/livedata?date=${dayStr}`);
      if (liveRes.status === 200 && liveRes.text && liveRes.text.length > 50) {
        const liveJson = JSON.parse(liveRes.text);
        (liveJson.m || []).forEach((m) => {
          // state 4 = MS (Bitmiş Maç)
          if (m[5] === 4 && m[14] && String(m[14]).length > 3) {
            const eventId = String(m[14]);
            if (!seenEventIds.has(eventId)) {
              seenEventIds.add(eventId);
              allFinished.push({ m, dayStr, formattedDate, eventId });
            }
          }
        });
      }
    } catch (e) {
      console.error('Past livedata hatası:', dayStr, e.message);
    }
  }));

  console.log(`Son 3 günde toplam ${allFinished.length} bitmiş maç bulundu. Oranları taranıyor...`);

  const queue = [...allFinished];
  const results = [];
  const concurrency = 35;

  async function worker() {
    while (queue.length > 0) {
      const item = queue.pop();
      if (!item) break;
      const { m, dayStr, formattedDate, eventId } = item;

      try {
        const popupUrl = `https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${eventId}&s=futbol`;
        const popupRes = await httpsGet(popupUrl);
        if (popupRes.status !== 200 || !popupRes.text || !popupRes.text.trim().startsWith('{')) continue;

        const pJson = JSON.parse(popupRes.text);
        const bookie = pJson.data?.matches?.[0]?.bookies?.[0];
        if (!bookie || !Array.isArray(bookie.markets)) continue;

        let odd45Ust = null;
        let odd45Alt = null;
        let oddHerIkiYari15Ust = null;
        let oddHerIkiYari15Alt = null;

        const odds = {
          ms1: '-',
          ms0: '-',
          ms2: '-',
          alt25: '-',
          ust25: '-',
          kgVar: '-',
          kgYok: '-'
        };

        bookie.markets.forEach((mkt) => {
          const normName = normalizeText(mkt.name);

          // 1. Toplam 4.5 Alt / Üst
          if ((normName.includes('4,5') || normName.includes('4.5')) && normName.includes('alt/ust') && !normName.includes('korner') && !normName.includes('kart') && !normName.includes('1. yari') && !normName.includes('2. yari')) {
            const ustOutcome = (mkt.outcomes || []).find((o) => normalizeText(o.name) === 'ust' || o.key === '+4.5');
            if (ustOutcome?.value && ustOutcome.value !== '-') {
              const val = parseFloat(String(ustOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) odd45Ust = val;
            }
            const altOutcome = (mkt.outcomes || []).find((o) => normalizeText(o.name) === 'alt' || o.key === '-4.5');
            if (altOutcome?.value && altOutcome.value !== '-') {
              const val = parseFloat(String(altOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) odd45Alt = val;
            }
          }

          // 2. Her İki Yarı da 1.5 Üst
          if (normName.includes('iki yari') && (normName.includes('1,5') || normName.includes('1.5')) && normName.includes('ust')) {
            const evetOutcome = (mkt.outcomes || []).find((o) => normalizeText(o.name) === 'evet' || o.key === '+1.5' || normalizeText(o.name) === 'ust');
            if (evetOutcome?.value && evetOutcome.value !== '-') {
              const val = parseFloat(String(evetOutcome.value).replace(',', '.'));
              if (!isNaN(val) && val > 1) oddHerIkiYari15Ust = val;
            }
          }

          // 2.5 Alt / Üst
          if ((normName.includes('2,5') || normName.includes('2.5')) && normName.includes('alt/ust') && !normName.includes('korner') && !normName.includes('kart') && !normName.includes('1. yari')) {
            (mkt.outcomes || []).forEach((o) => {
              const oName = normalizeText(o.name);
              if (oName === 'alt' || o.key === '-2.5') odds.alt25 = String(o.value || '-').replace(',', '.');
              if (oName === 'ust' || o.key === '+2.5') odds.ust25 = String(o.value || '-').replace(',', '.');
            });
          }

          // KG Var / Yok
          if (normName.includes('karsilikli gol') || normName.includes('kg')) {
            (mkt.outcomes || []).forEach((o) => {
              const oName = normalizeText(o.name);
              if (oName === 'var') odds.kgVar = String(o.value || '-').replace(',', '.');
              if (oName === 'yok') odds.kgYok = String(o.value || '-').replace(',', '.');
            });
          }
        });

        if (odd45Ust !== null && oddHerIkiYari15Ust !== null) {
          const diff = parseFloat(Math.abs(odd45Ust - oddHerIkiYari15Ust).toFixed(2));

          const msHome = typeof m[12] === 'number' ? m[12] : parseInt(m[12]) || 0;
          const msAway = typeof m[13] === 'number' ? m[13] : parseInt(m[13]) || 0;
          const iyHome = typeof m[10] === 'number' ? m[10] : parseInt(m[10]) || 0;
          const iyAway = typeof m[11] === 'number' ? m[11] : parseInt(m[11]) || 0;

          const htGoals = iyHome + iyAway;
          const shGoals = (msHome - iyHome) + (msAway - iyAway);
          const totalGoals = msHome + msAway;

          const isHtOver15 = htGoals >= 2;
          const isShOver15 = shGoals >= 2;
          const isBothHalves15Ust = isHtOver15 && isShOver15;
          const isOver25 = totalGoals >= 3;
          const isOver35 = totalGoals >= 4;
          const isOver45 = totalGoals >= 5;
          const isKgVar = msHome > 0 && msAway > 0;

          results.push({
            id: String(m[0]),
            matchId: String(m[0]),
            eventId,
            code: String(m[21] || m[0]),
            date: formattedDate,
            time: String(m[3] || ''),
            league: String(m[2] || 'Diğer').trim(),
            homeTeam: String(m[6] || '').trim(),
            awayTeam: String(m[8] || '').trim(),
            odd45Ust,
            odd45Alt,
            oddHerIkiYari15Ust,
            oddHerIkiYari15Alt,
            diff,
            isCloseDiff: diff <= 0.20,
            odds,
            score: `${msHome} - ${msAway}`,
            halfTimeScore: `${iyHome} - ${iyAway}`,
            status: 'MS',
            totalGoals,
            isUst45Won: isOver45,
            isHerIkiYari15UstWon: isBothHalves15Ust,
            isUst25Won: isOver25,
            isUst35Won: isOver35,
            isKgVarWon: isKgVar
          });
        }
      } catch (e) {
        // ignore
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);

  // Sort by smallest diff first, then date descending
  results.sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff;
    return b.date.localeCompare(a.date);
  });

  const diff020 = results.filter(r => r.diff <= 0.20);
  const diff010 = results.filter(r => r.diff <= 0.10);
  const exact = results.filter(r => r.diff === 0);

  const calculateRates = (list) => {
    const total = list.length;
    if (total === 0) return { total: 0, ust25Rate: 0, ust35Rate: 0, ust45Rate: 0, herIkiYari15Rate: 0, kgVarRate: 0, avgGoals: 0 };
    const u25 = list.filter(m => m.isUst25Won).length;
    const u35 = list.filter(m => m.isUst35Won).length;
    const u45 = list.filter(m => m.isUst45Won).length;
    const hy15 = list.filter(m => m.isHerIkiYari15UstWon).length;
    const kg = list.filter(m => m.isKgVarWon).length;
    const totalG = list.reduce((acc, m) => acc + (m.totalGoals || 0), 0);
    return {
      totalPlayed: total,
      ust25Won: u25,
      ust25Rate: Math.round((u25 / total) * 100),
      ust35Won: u35,
      ust35Rate: Math.round((u35 / total) * 100),
      ust45Won: u45,
      ust45Rate: Math.round((u45 / total) * 100),
      herIkiYari15Won: hy15,
      herIkiYari15Rate: Math.round((hy15 / total) * 100),
      kgVarWon: kg,
      kgVarRate: Math.round((kg / total) * 100),
      avgGoals: Number((totalG / total).toFixed(2))
    };
  };

  const pastData = {
    timestamp: Date.now(),
    dateRange: pastDates.map(d => d.formattedDate),
    stats: {
      totalFinished: allFinished.length,
      totalWithBothOdds: results.length,
      diff020Count: diff020.length,
      diff010Count: diff010.length,
      exactMatchCount: exact.length,
      overallRates: calculateRates(results),
      diff020Rates: calculateRates(diff020),
      exactRates: calculateRates(exact)
    },
    matches: results
  };

  const outDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'gol_analizi_past_cache.json'), JSON.stringify(pastData, null, 2), 'utf-8');

  const publicDir = path.join(__dirname, 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'gol_analizi_past_cache.json'), JSON.stringify(pastData, null, 2), 'utf-8');

  console.log(`Geçmiş Biten Maçlar Kaydedildi: ${results.length} maç (Fark <= 0.20: ${diff020.length} maç)`);
  return pastData;
}

async function main() {
  await syncUpcoming();
  await syncPast();
  console.log('\n✅ TÜM GOL ANALİZİ SENKRONİZASYONU TAMAMLANDI!');
}

main();
