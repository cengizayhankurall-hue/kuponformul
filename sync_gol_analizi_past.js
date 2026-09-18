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
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u').replace(/ş/g, 's').replace(/Ş/g, 's').replace(/ö/g, 'o')
    .replace(/Ö/g, 'o').replace(/ç/g, 'c').replace(/Ç/g, 'c').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function httpsGet(urlStr) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const req = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        agent,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://arsiv.mackolik.com/' },
        timeout: 4500
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, text: data }));
      });
      req.on('error', () => resolve({ status: 500, text: '' }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 504, text: '' }); });
      req.end();
    } catch { resolve({ status: 500, text: '' }); }
  });
}

async function syncPastMatches(daysBack = 3) {
  const dates = [];
  for (let i = 1; i <= daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    dates.push({ dayStr: `${dd}/${mm}/${yyyy}`, isoDate: `${yyyy}-${mm}-${dd}` });
  }

  console.log(`Son ${daysBack} günün (${dates.map(d => d.dayStr).join(', ')}) biten maçları çekiliyor...`);

  const allFinished = [];
  const seenEventIds = new Set();

  await Promise.all(dates.map(async ({ dayStr, isoDate }) => {
    const liveRes = await httpsGet(`https://vd.mackolik.com/livedata?date=${dayStr}`);
    if (liveRes.status === 200 && liveRes.text && liveRes.text.length > 50) {
      try {
        const liveJson = JSON.parse(liveRes.text);
        (liveJson.m || []).forEach((m) => {
          if (m[5] === 4 && m[14]) {
            const eventId = String(m[14]);
            if (!seenEventIds.has(eventId)) {
              seenEventIds.add(eventId);
              allFinished.push({ m, dayStr, isoDate, eventId });
            }
          }
        });
      } catch (e) {}
    }
  }));

  console.log(`Toplam ${allFinished.length} tekil biten maç bulundu. Oranlar taranıyor...`);

  const queue = [...allFinished];
  const results = [];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.pop();
      if (!item) break;
      const { m, dayStr, isoDate, eventId } = item;

      const popupRes = await httpsGet(`https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${eventId}&s=futbol`);
      if (popupRes.status !== 200 || !popupRes.text || !popupRes.text.startsWith('{')) continue;

      try {
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

        bookie.markets.forEach(mkt => {
          const normName = normalizeText(mkt.name);

          // MS 1 - X - 2
          if (normName === 'mac sonucu' || normName === 'ms') {
            (mkt.outcomes || []).forEach(o => {
              const oName = normalizeText(o.name);
              if (oName === '1') odds.ms1 = String(o.value || '-');
              if (oName === '0' || oName === 'x') odds.ms0 = String(o.value || '-');
              if (oName === '2') odds.ms2 = String(o.value || '-');
            });
          }

          // 2.5 Alt / Üst
          if ((normName.includes('2,5') || normName.includes('2.5')) && normName.includes('alt/ust') && !normName.includes('korner') && !normName.includes('kart') && !normName.includes('1. yari')) {
            (mkt.outcomes || []).forEach(o => {
              const oName = normalizeText(o.name);
              if (oName === 'alt' || o.key === '-2.5') odds.alt25 = String(o.value || '-');
              if (oName === 'ust' || o.key === '+2.5') odds.ust25 = String(o.value || '-');
            });
          }

          // 4.5 Alt / Üst
          if ((normName.includes('4,5') || normName.includes('4.5')) && normName.includes('alt/ust') && !normName.includes('korner') && !normName.includes('kart') && !normName.includes('1. yari')) {
            (mkt.outcomes || []).forEach(o => {
              const oName = normalizeText(o.name);
              if (oName === 'ust' || o.key === '+4.5') {
                if (o.value && o.value !== '-') {
                  const v = parseFloat(String(o.value).replace(',', '.'));
                  if (!isNaN(v) && v > 1) odd45Ust = v;
                }
              }
              if (oName === 'alt' || o.key === '-4.5') {
                if (o.value && o.value !== '-') {
                  const v = parseFloat(String(o.value).replace(',', '.'));
                  if (!isNaN(v) && v > 1) odd45Alt = v;
                }
              }
            });
          }

          // Her İki Yarı 1.5 Üst
          if (normName.includes('iki yari') && (normName.includes('1,5') || normName.includes('1.5')) && normName.includes('ust')) {
            (mkt.outcomes || []).forEach(o => {
              const oName = normalizeText(o.name);
              if (oName === 'evet' || o.key === '+1.5' || oName === 'ust') {
                if (o.value && o.value !== '-') {
                  const v = parseFloat(String(o.value).replace(',', '.'));
                  if (!isNaN(v) && v > 1) oddHerIkiYari15Ust = v;
                }
              }
              if (oName === 'hayir' || o.key === '-1.5' || oName === 'alt') {
                if (o.value && o.value !== '-') {
                  const v = parseFloat(String(o.value).replace(',', '.'));
                  if (!isNaN(v) && v > 1) oddHerIkiYari15Alt = v;
                }
              }
            });
          }
        });

        if (odd45Ust !== null && oddHerIkiYari15Ust !== null) {
          const diff = Math.abs(odd45Ust - oddHerIkiYari15Ust);
          const msHome = parseInt(m[12]) || 0;
          const msAway = parseInt(m[13]) || 0;
          const ftScore = `${msHome} - ${msAway}`;

          const iyParts = (m[7] || '0-0').split('-');
          const iyHome = parseInt(iyParts[0]) || 0;
          const iyAway = parseInt(iyParts[1]) || 0;
          const iyScore = `${iyHome} - ${iyAway}`;

          const totalGoals = msHome + msAway;
          const htGoals = iyHome + iyAway;
          const shGoals = totalGoals - htGoals;

          const isHtOver15 = htGoals >= 2;
          const isShOver15 = shGoals >= 2;
          const isBothHalves15Ust = isHtOver15 && isShOver15;
          const isOver25 = totalGoals >= 3;
          const isOver35 = totalGoals >= 4;
          const isOver45 = totalGoals >= 5;

          const league = (m[36] && m[36][3]) ? `${m[36][1]} - ${m[36][3]}` : (m[36] && m[36][1]) ? m[36][1] : 'Futbol';

          results.push({
            id: String(m[0]),
            matchId: String(m[0]),
            eventId,
            code: String(m[0]).slice(-4),
            date: dayStr,
            isoDate,
            time: m[16] || '00:00',
            league,
            homeTeam: m[2],
            awayTeam: m[4],
            odd45Ust,
            odd45Alt,
            oddHerIkiYari15Ust,
            oddHerIkiYari15Alt,
            diff: parseFloat(diff.toFixed(2)),
            isCloseDiff: diff <= 0.20,
            odds,
            // Skor ve Sonuç İstatistikleri
            ftScore,
            iyScore,
            msHome,
            msAway,
            iyHome,
            iyAway,
            totalGoals,
            htGoals,
            shGoals,
            isHtOver15,
            isShOver15,
            isBothHalves15Ust,
            isOver25,
            isOver35,
            isOver45
          });
        }
      } catch (e) {}
    }
  }

  await Promise.all(Array(30).fill(null).map(() => worker()));

  // Sort by smallest diff first, then date descending
  results.sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff;
    return b.isoDate.localeCompare(a.isoDate);
  });

  const diff020 = results.filter(r => r.diff <= 0.20);
  const diff010 = results.filter(r => r.diff <= 0.10);
  const exact = results.filter(r => r.diff === 0);

  const stats = {
    totalFinished: allFinished.length,
    totalWithBothOdds: results.length,
    diff020Count: diff020.length,
    diff010Count: diff010.length,
    exactMatchCount: exact.length,
    // Başarı İstatistikleri (Tüm Oranlı Maçlar)
    all: {
      total: results.length,
      ht15Count: results.filter(r => r.isHtOver15).length,
      ht15Rate: results.length ? ((results.filter(r => r.isHtOver15).length / results.length) * 100).toFixed(1) : '0',
      over25Count: results.filter(r => r.isOver25).length,
      over25Rate: results.length ? ((results.filter(r => r.isOver25).length / results.length) * 100).toFixed(1) : '0',
      over35Count: results.filter(r => r.isOver35).length,
      over35Rate: results.length ? ((results.filter(r => r.isOver35).length / results.length) * 100).toFixed(1) : '0',
      over45Count: results.filter(r => r.isOver45).length,
      over45Rate: results.length ? ((results.filter(r => r.isOver45).length / results.length) * 100).toFixed(1) : '0',
      bothHalves15Count: results.filter(r => r.isBothHalves15Ust).length,
      bothHalves15Rate: results.length ? ((results.filter(r => r.isBothHalves15Ust).length / results.length) * 100).toFixed(1) : '0'
    },
    // Başarı İstatistikleri (Fark <= 0.20 Olan Maçlar)
    closeDiff: {
      total: diff020.length,
      ht15Count: diff020.filter(r => r.isHtOver15).length,
      ht15Rate: diff020.length ? ((diff020.filter(r => r.isHtOver15).length / diff020.length) * 100).toFixed(1) : '0',
      over25Count: diff020.filter(r => r.isOver25).length,
      over25Rate: diff020.length ? ((diff020.filter(r => r.isOver25).length / diff020.length) * 100).toFixed(1) : '0',
      over35Count: diff020.filter(r => r.isOver35).length,
      over35Rate: diff020.length ? ((diff020.filter(r => r.isOver35).length / diff020.length) * 100).toFixed(1) : '0',
      over45Count: diff020.filter(r => r.isOver45).length,
      over45Rate: diff020.length ? ((diff020.filter(r => r.isOver45).length / diff020.length) * 100).toFixed(1) : '0',
      bothHalves15Count: diff020.filter(r => r.isBothHalves15Ust).length,
      bothHalves15Rate: diff020.length ? ((diff020.filter(r => r.isBothHalves15Ust).length / diff020.length) * 100).toFixed(1) : '0'
    }
  };

  const cacheData = {
    timestamp: Date.now(),
    dateRange: dates.map(d => d.dayStr),
    stats,
    matches: results
  };

  const p1 = path.join(process.cwd(), 'data', 'gol_analizi_past_cache.json');
  const p2 = path.join(process.cwd(), 'public', 'data', 'gol_analizi_past_cache.json');

  fs.writeFileSync(p1, JSON.stringify(cacheData, null, 2), 'utf-8');
  fs.writeFileSync(p2, JSON.stringify(cacheData, null, 2), 'utf-8');

  console.log(`✅ TAMAMLANDI! Son ${daysBack} gün için ${results.length} oranlı biten maç yazıldı. (Fark <= 0.20 olan ${diff020.length} maç)`);
  console.log('İstatistikler (Fark <= 0.20):', stats.closeDiff);
}

syncPastMatches(3);
