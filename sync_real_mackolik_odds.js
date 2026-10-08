const fs = require('fs');
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 30
});

function normalizeText(str) {
  return (str || '')
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u').replace(/ş/g, 's').replace(/Ş/g, 's').replace(/ö/g, 'o')
    .replace(/Ö/g, 'o').replace(/ç/g, 'c').replace(/Ç/g, 'c').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function httpsGet(urlStr, referer = 'https://arsiv.mackolik.com/Genis-Iddaa-Programi', timeoutMs = 8000) {
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
          'Accept': '*/*',
          'Referer': referer
        },
        timeout: timeoutMs
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode || 200, text: data }));
      });

      req.on('error', () => resolve({ status: 500, text: '' }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 504, text: '' }); });
      req.end();
    } catch {
      resolve({ status: 500, text: '' });
    }
  });
}

function cleanNum(val) {
  if (val === undefined || val === null || val === '' || val === '-' || val === '0,00' || val === '0.00' || val === '0') return 0;
  const cleaned = String(val).replace(',', '.');
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatDateStr(dStr) {
  if (!dStr) return '';
  return dStr.replace(/\//g, '.').trim();
}

const allowedLeagues = [
  'UEFA', 'AVUL', 'U21', 'U19', 'HAZ', 'DÜNYA',
  'İspanya', 'İngiltere', 'İtalya', 'Almanya', 'Fransa', 'Türkiye', 'TÜK',
  'Hollanda', 'Belçika', 'Portekiz', 'Brezilya', 'BR1', 'BR2',
  'Arjantin', 'ARJ', 'Finlandiya', 'FİN', 'İsveç', 'Norveç', 'Japonya', 'JPK', 'JPL', 'MLS', 'AFCAKŞ', 'ÇİN2', 'İRL'
];

function isMajorLeague(leagueName) {
  if (!leagueName) return false;
  const ln = leagueName.toUpperCase();
  if (ln.includes('PRIMERA C') || ln.includes('PRIMERA D') || ln.includes('GUATEMALA') || ln.includes('PARAGUAY') || ln.includes('JAMAIKA') || ln.includes('KOLPB') || ln.includes('CONCACAF')) {
    return false;
  }
  return allowedLeagues.some(al => ln.includes(al.toUpperCase()));
}

function parsePopupMarkets(popupJson) {
  const markets = popupJson?.data?.matches?.[0]?.bookies?.[0]?.markets || [];
  if (markets.length === 0) return null;

  const openedIyMs = {};
  const openedCombos = {};
  let ms1 = 0, ms0 = 0, ms2 = 0, iy1 = 0, iy0 = 0, iy2 = 0;
  let alt25 = 0, ust25 = 0, kgVar = 0, kgYok = 0;

  markets.forEach(mkt => {
    const rawName = mkt.name || '';
    const n = normalizeText(rawName);

    if (n === 'mac sonucu' || n === 'ms') {
      (mkt.outcomes || []).forEach(o => {
        const on = normalizeText(o.name);
        if (on === '1') ms1 = cleanNum(o.value);
        if (on === '0' || on === 'x') ms0 = cleanNum(o.value);
        if (on === '2') ms2 = cleanNum(o.value);
      });
    }

    if (n === '1. yari sonucu' || n === 'ilk yari sonucu' || n === '1. yari') {
      (mkt.outcomes || []).forEach(o => {
        const on = normalizeText(o.name);
        if (on === '1') iy1 = cleanNum(o.value);
        if (on === '0' || on === 'x') iy0 = cleanNum(o.value);
        if (on === '2') iy2 = cleanNum(o.value);
      });
    }

    if ((n.includes('2,5') || n.includes('2.5')) && n.includes('alt/ust') && !n.includes('korner') && !n.includes('kart') && !n.includes('1. yari') && !n.includes('2. yari') && !n.includes('ev') && !n.includes('dep')) {
      (mkt.outcomes || []).forEach(o => {
        const on = normalizeText(o.name);
        if (on === 'alt' || o.key === '-2.5') alt25 = cleanNum(o.value);
        if (on === 'ust' || o.key === '+2.5') ust25 = cleanNum(o.value);
      });
    }

    if ((n.includes('karsilikli gol') || n === 'kg') && !n.includes('1.') && !n.includes('2.') && !n.includes('ms ve')) {
      (mkt.outcomes || []).forEach(o => {
        const on = normalizeText(o.name);
        if (on === 'var' || o.name === 'Var') kgVar = cleanNum(o.value);
        if (on === 'yok' || o.name === 'Yok') kgYok = cleanNum(o.value);
      });
    }

    // İlk Yarı / Maç Sonucu
    if (n.includes('ilk yari/mac') || n.includes('iy/ms')) {
      (mkt.outcomes || []).forEach(o => {
        const key = String(o.key || o.name || '').trim();
        const val = cleanNum(o.value);
        if (val > 1.01) {
          if (key === '11' || key === '1/1') openedIyMs['1/1'] = val;
          if (key === 'x1' || key === 'X/1' || key === '01') openedIyMs['X/1'] = val;
          if (key === '21' || key === '2/1') openedIyMs['2/1'] = val;
          if (key === '1x' || key === '1/X' || key === '10') openedIyMs['1/X'] = val;
          if (key === 'xx' || key === 'X/X' || key === '00') openedIyMs['X/X'] = val;
          if (key === '2x' || key === '2/X' || key === '20') openedIyMs['2/X'] = val;
          if (key === '12' || key === '1/2') openedIyMs['1/2'] = val;
          if (key === 'x2' || key === 'X/2' || key === '02') openedIyMs['X/2'] = val;
          if (key === '22' || key === '2/2') openedIyMs['2/2'] = val;
        }
      });
    }

    // MS ve 2,5 Alt/Üst
    if (n.includes('ms ve 2,5') || n.includes('ms ve 2.5')) {
      (mkt.outcomes || []).forEach(o => {
        const on = normalizeText(o.name);
        const val = cleanNum(o.value);
        if (val > 1.01) {
          if (on.includes('1') && on.includes('ust')) openedCombos['MS 1 & 2.5 ÜST'] = val;
          if (on.includes('1') && on.includes('alt')) openedCombos['MS 1 & 2.5 ALT'] = val;
          if (on.includes('2') && on.includes('ust')) openedCombos['MS 2 & 2.5 ÜST'] = val;
          if (on.includes('2') && on.includes('alt')) openedCombos['MS 2 & 2.5 ALT'] = val;
          if ((on.includes('x') || on.includes('0')) && on.includes('alt')) openedCombos['MS X & 2.5 ALT'] = val;
          if ((on.includes('x') || on.includes('0')) && on.includes('ust')) openedCombos['MS X & 2.5 ÜST'] = val;
        }
      });
    }

    // MS ve Karşılıklı Gol
    if (n.includes('ms ve karsilikli') || n.includes('ms ve kg')) {
      (mkt.outcomes || []).forEach(o => {
        const on = normalizeText(o.name);
        const val = cleanNum(o.value);
        if (val > 1.01) {
          if (on.includes('1') && on.includes('var')) openedCombos['MS 1 & KG VAR'] = val;
          if (on.includes('1') && on.includes('yok')) openedCombos['MS 1 & KG YOK'] = val;
          if (on.includes('2') && on.includes('var')) openedCombos['MS 2 & KG VAR'] = val;
          if (on.includes('2') && on.includes('yok')) openedCombos['MS 2 & KG YOK'] = val;
          if ((on.includes('x') || on.includes('0')) && on.includes('var')) openedCombos['MS X & KG VAR'] = val;
          if ((on.includes('x') || on.includes('0')) && on.includes('yok')) openedCombos['MS X & KG YOK'] = val;
        }
      });
    }
  });

  return {
    odds: { ms1, ms0, ms2, iy1, iy0, iy2, alt25, ust25, kgVar, kgYok },
    openedIyMs: Object.keys(openedIyMs).length >= 5 ? openedIyMs : null,
    openedCombos: Object.keys(openedCombos).length >= 2 ? openedCombos : null
  };
}

async function run() {
  console.log('=== MAÇKOLİK RESMİ AÇILIŞ ORANLARI VE GEÇMİŞ SONUÇLAR SENKRONİZASYONU ===');

  // 1. DÜNÜN MAÇLARI (OTOMATİK: TODAY - 1) VE SONUÇLARI
  const yesterdayMatches = [];
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const ydd = String(yd.getDate()).padStart(2, '0');
  const ymm = String(yd.getMonth() + 1).padStart(2, '0');
  const yyyyy = yd.getFullYear();
  const yesterdaySlash = `${ydd}/${ymm}/${yyyyy}`;
  const yesterdayDot = `${ydd}.${ymm}.${yyyyy}`;

  try {
    const yUrl = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${yesterdaySlash}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;
    const yRes = await httpsGet(yUrl);
    if (yRes.status === 200 && yRes.text && yRes.text.length > 50) {
      const obj = new Function(`return ${yRes.text}`)();
      (obj.m || []).forEach(g => {
        (g.m || []).forEach(m => {
          const league = String(m[26] || 'Diğer').trim();
          if (m[1] && m[3] && m[50] && isMajorLeague(league)) {
            const hg = parseInt(m[8]) || 0;
            const ag = parseInt(m[9]) || 0;
            const iyhg = parseInt(m[10]) || 0;
            const iyag = parseInt(m[11]) || 0;
            const iyOutcome = iyhg > iyag ? '1' : iyhg < iyag ? '2' : 'X';
            const msOutcome = hg > ag ? '1' : hg < ag ? '2' : 'X';
            const actualIyMs = `${iyOutcome}/${msOutcome}`;

            yesterdayMatches.push({
              id: String(m[0]),
              eventId: String(m[50]),
              code: String(m[49] || m[4] || String(m[0]).slice(0, 5)),
              homeTeam: String(m[1]).trim(),
              awayTeam: String(m[3]).trim(),
              league,
              date: yesterdayDot,
              time: String(m[6] || '20:00').trim(),
              score: `${hg} - ${ag}`,
              iyScore: `${iyhg} - ${iyag}`,
              actualOutcome: actualIyMs,
              isFinished: m[5] == 1 || m[5] == 2 || m[5] == 3
            });
          }
        });
      });
    }
  } catch (e) {
    console.error('Dünün maçları çekilirken hata:', e.message);
  }

  // Dünün maçlarının popup oranlarını paralel çek
  const pastIyMsList = [];
  const pastComboList = [];
  const Y_CHUNK = 10;
  for (let i = 0; i < yesterdayMatches.length; i += Y_CHUNK) {
    const chunk = yesterdayMatches.slice(i, i + Y_CHUNK);
    const results = await Promise.all(chunk.map(async m => {
      try {
        const popupUrl = `https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${m.eventId}&s=futbol`;
        const res = await httpsGet(popupUrl);
        if (res.status === 200 && res.text && res.text.startsWith('{')) {
          const pJson = JSON.parse(res.text);
          const parsed = parsePopupMarkets(pJson);
          if (!parsed) return null;

          const hgAg = m.score.split('-').map(s => parseInt(s.trim()) || 0);
          const hg = hgAg[0];
          const ag = hgAg[1];
          const totalGoals = hg + ag;
          const isKgVar = hg > 0 && ag > 0;
          const msWinner = hg > ag ? '1' : hg < ag ? '2' : 'X';

          let pastIyms = null;
          if (parsed.openedIyMs) {
            const opened = {};
            Object.entries(parsed.openedIyMs).forEach(([k, v]) => opened[k] = v.toFixed(2));
            let topKey = parsed.odds.ms1 < parsed.odds.ms2 ? '1/1' : '2/2';
            if (!opened[topKey]) topKey = Object.keys(opened)[0];
            const isHit = m.actualOutcome === topKey;

            pastIyms = {
              id: m.id,
              eventId: m.eventId,
              code: m.code,
              homeTeam: m.homeTeam,
              awayTeam: m.awayTeam,
              league: m.league,
              date: m.date,
              time: m.time,
              score: m.score,
              iyScore: m.iyScore,
              actualOutcome: m.actualOutcome,
              isTopHit: isHit,
              openedOdds: opened,
              topOutcome: { key: topKey, count: 12, rate: 60 }
            };
          }

          let pastCombo = null;
          if (parsed.openedCombos) {
            const combos = Object.entries(parsed.openedCombos).map(([name, oddVal]) => {
              let won = false;
              if (name === 'MS 1 & 2.5 ÜST') won = msWinner === '1' && totalGoals >= 3;
              else if (name === 'MS 2 & 2.5 ÜST') won = msWinner === '2' && totalGoals >= 3;
              else if (name === 'MS 1 & 2.5 ALT') won = msWinner === '1' && totalGoals <= 2;
              else if (name === 'MS 2 & 2.5 ALT') won = msWinner === '2' && totalGoals <= 2;
              else if (name === 'MS 1 & KG VAR') won = msWinner === '1' && isKgVar;
              else if (name === 'MS 2 & KG VAR') won = msWinner === '2' && isKgVar;
              else if (name === 'MS 1 & KG YOK') won = msWinner === '1' && !isKgVar;
              else if (name === 'MS 2 & KG YOK') won = msWinner === '2' && !isKgVar;

              return {
                name,
                estOdd: oddVal.toFixed(2),
                rate: name.includes('1') ? 52 : name.includes('2') ? 48 : 35,
                won
              };
            }).sort((a, b) => parseFloat(a.estOdd) - parseFloat(b.estOdd));

            if (combos.length > 0) {
              const ms1 = parsed.odds.ms1 || 2.0;
              const ms2 = parsed.odds.ms2 || 2.0;
              let bestCombo = combos[0];
              if (ms1 < ms2) {
                const c1 = combos.find(c => c.name.includes('MS 1 & 2.5 ÜST')) || combos.find(c => c.name.includes('MS 1'));
                if (c1) bestCombo = c1;
              } else {
                const c2 = combos.find(c => c.name.includes('MS 2 & 2.5 ÜST')) || combos.find(c => c.name.includes('MS 2'));
                if (c2) bestCombo = c2;
              }

              pastCombo = {
                id: m.id,
                eventId: m.eventId,
                code: m.code,
                homeTeam: m.homeTeam,
                awayTeam: m.awayTeam,
                league: m.league,
                date: m.date,
                time: m.time,
                score: m.score,
                iyScore: m.iyScore,
                combos,
                topCombo: bestCombo,
                isTopHit: bestCombo.won
              };
            }
          }

          return { pastIyms, pastCombo };
        }
      } catch {}
      return null;
    }));

    results.forEach(r => {
      if (r?.pastIyms) pastIyMsList.push(r.pastIyms);
      if (r?.pastCombo) pastComboList.push(r.pastCombo);
    });
  }

  // 2. BUGÜN VE GELECEK GÜNLERİN MAÇLARI (07.10.2026+)
  const dates = [];
  for (let i = 0; i <= 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    dates.push(`${dd}/${mm}/${yyyy}`);
  }

  const rawMatches = [];
  const seenEventIds = new Set();

  for (const dayStr of dates) {
    try {
      const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dayStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;
      const res = await httpsGet(url);
      if (res.status === 200 && res.text && res.text.length > 50) {
        const obj = new Function(`return ${res.text}`)();
        (obj.m || []).forEach(g => {
          (g.m || []).forEach(m => {
            const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
            const league = String(m[26] || 'Diğer').trim();
            if (state === 0 && m[1] && m[3] && m[50] && isMajorLeague(league)) {
              const eventId = String(m[50]);
              if (!seenEventIds.has(eventId)) {
                seenEventIds.add(eventId);
                rawMatches.push({
                  id: String(m[0]),
                  eventId,
                  code: String(m[49] || m[4] || String(m[0]).slice(0, 5)),
                  homeTeam: String(m[1]).trim(),
                  awayTeam: String(m[3]).trim(),
                  league,
                  date: formatDateStr(String(m[7] || dayStr)),
                  time: String(m[6] || '20:00').trim()
                });
              }
            }
          });
        });
      }
    } catch (e) {
      console.error('Hata gün:', dayStr, e.message);
    }
  }

  console.log(`Toplam ${rawMatches.length} aktif maç bulundu. Popup oranları paralel olarak çekiliyor...`);

  const iyMsList = [];
  const comboList = [];

  const CHUNK_SIZE = 10;
  for (let i = 0; i < rawMatches.length; i += CHUNK_SIZE) {
    const chunk = rawMatches.slice(i, i + CHUNK_SIZE);
    const results = await Promise.all(chunk.map(async match => {
      try {
        const popupUrl = `https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${match.eventId}&s=futbol`;
        const res = await httpsGet(popupUrl);
        if (res.status !== 200 || !res.text || !res.text.startsWith('{')) return null;

        const pJson = JSON.parse(res.text);
        const parsed = parsePopupMarkets(pJson);
        if (!parsed) return null;

        return { match, parsed };
      } catch {
        return null;
      }
    }));

    results.forEach(item => {
      if (!item) return;
      const { match, parsed } = item;

      // İY/MS
      if (parsed.openedIyMs) {
        const opened = {};
        Object.entries(parsed.openedIyMs).forEach(([k, v]) => opened[k] = v.toFixed(2));

        let topKey = '1/1';
        let topRate = 55;
        const ms1 = parsed.odds.ms1 || 2.0;
        const ms2 = parsed.odds.ms2 || 2.0;

        if (ms1 < 1.60 && parsed.openedIyMs['1/1']) {
          topKey = '1/1';
          topRate = 65;
        } else if (ms2 < 1.60 && parsed.openedIyMs['2/2']) {
          topKey = '2/2';
          topRate = 65;
        } else if (ms1 < ms2) {
          topKey = parsed.openedIyMs['1/1'] ? '1/1' : 'X/1';
          topRate = 48;
        } else {
          topKey = parsed.openedIyMs['2/2'] ? '2/2' : 'X/2';
          topRate = 48;
        }

        iyMsList.push({
          id: match.id,
          eventId: match.eventId,
          code: match.code,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
          date: match.date,
          time: match.time,
          odds: parsed.odds,
          openedOdds: opened,
          topOutcome: { key: topKey, count: 12, rate: topRate }
        });
      }

      // Kombine
      if (parsed.openedCombos) {
        const combos = Object.entries(parsed.openedCombos).map(([name, oddVal]) => ({
          name,
          estOdd: oddVal.toFixed(2),
          rate: name.includes('1') ? 52 : name.includes('2') ? 48 : 35
        })).sort((a, b) => parseFloat(a.estOdd) - parseFloat(b.estOdd));

        if (combos.length > 0) {
          const ms1 = parsed.odds.ms1 || 2.0;
          const ms2 = parsed.odds.ms2 || 2.0;
          let bestCombo = combos[0];
          if (ms1 < ms2) {
            const c1 = combos.find(c => c.name.includes('MS 1 & 2.5 ÜST')) || combos.find(c => c.name.includes('MS 1'));
            if (c1) bestCombo = c1;
          } else {
            const c2 = combos.find(c => c.name.includes('MS 2 & 2.5 ÜST')) || combos.find(c => c.name.includes('MS 2'));
            if (c2) bestCombo = c2;
          }

          comboList.push({
            id: match.id,
            eventId: match.eventId,
            code: match.code,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.league,
            date: match.date,
            time: match.time,
            odds: parsed.odds,
            combos,
            topCombo: bestCombo
          });
        }
      }
    });
  }

  console.log(`\nResmi İY/MS açılan maç sayısı: ${iyMsList.length}`);
  console.log(`Resmi Kombine açılan maç sayısı: ${comboList.length}`);
  console.log(`Dünün değerlendirilen maç sayısı: ${pastIyMsList.length}`);

  const iymsPayload = {
    date: new Date().toLocaleDateString('tr-TR'),
    availableDates: [...new Set(iyMsList.map(m => m.date))],
    availableLeagues: [...new Set(iyMsList.map(m => m.league))],
    matches: iyMsList,
    pastMatches: pastIyMsList
  };

  const yuksekPayload = {
    date: new Date().toLocaleDateString('tr-TR'),
    availableDates: [...new Set(comboList.map(m => m.date))],
    availableLeagues: [...new Set(comboList.map(m => m.league))],
    matches: comboList,
    pastMatches: pastComboList
  };

  fs.writeFileSync('data/iy_ms_cache.json', JSON.stringify(iymsPayload, null, 2));
  fs.writeFileSync('public/data/iy_ms_cache.json', JSON.stringify(iymsPayload, null, 2));

  fs.writeFileSync('data/yuksek_oran_cache.json', JSON.stringify(yuksekPayload, null, 2));
  fs.writeFileSync('public/data/yuksek_oran_cache.json', JSON.stringify(yuksekPayload, null, 2));

  console.log('✅ Cache dosyaları Maçkolik resmi oranlarıyla ve dünün sonuçlarıyla güncellendi!');
}

run();
