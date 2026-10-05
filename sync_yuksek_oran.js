require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

function httpsGet(urlStr, referer = 'https://arsiv.mackolik.com/Genis-Iddaa-Programi', timeoutMs = 6000) {
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

// Analiz Algoritması: MS + Alt/Üst/KG ve Skor Kümeleme
async function analyzeComboAndScore(odds) {
  const { ms1, ms0, ms2, alt25, ust25, kgVar, kgYok } = odds;
  if (!ms1 || !ms0 || !ms2) {
    return { sampleSize: 0, combos: [], topCombo: null, topScores: [], primaryScore: null, secondaryScore: null, scoreStats: {} };
  }

  try {
    const tolMS = 0.08;
    let q = supabase
      .from('past_matches')
      .select('id, match_date, home_team, away_team, league, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, alt_25_odd, ust_25_odd, kg_var_odd, kg_yok_odd')
      .not('ms_score', 'is', null);

    if (ms1 > 0) q = q.gte('ms_1_odd', ms1 - tolMS).lte('ms_1_odd', ms1 + tolMS);
    if (ms0 > 0) q = q.gte('ms_0_odd', ms0 - tolMS).lte('ms_0_odd', ms0 + tolMS);
    if (ms2 > 0) q = q.gte('ms_2_odd', ms2 - tolMS).lte('ms_2_odd', ms2 + tolMS);

    const { data: rows, error } = await q.order('match_date', { ascending: false }).limit(350);
    if (error || !rows || rows.length === 0) {
      return { sampleSize: 0, combos: [], topCombo: null, topScores: [], primaryScore: null, secondaryScore: null, scoreStats: {} };
    }

    let validCount = 0;
    const scoreCounts = {};
    const comboCounts = {
      'MS 1 & 2.5 ÜST': { count: 0, sampleOdds: (ms1 * (ust25 > 0 ? ust25 : 1.80) * 0.85) },
      'MS 1 & 2.5 ALT': { count: 0, sampleOdds: (ms1 * (alt25 > 0 ? alt25 : 1.90) * 0.85) },
      'MS 1 & KG VAR': { count: 0, sampleOdds: (ms1 * (kgVar > 0 ? kgVar : 1.85) * 0.85) },
      'MS 1 & KG YOK': { count: 0, sampleOdds: (ms1 * (kgYok > 0 ? kgYok : 1.90) * 0.85) },
      'MS X & 2.5 ALT': { count: 0, sampleOdds: (ms0 * (alt25 > 0 ? alt25 : 1.70) * 0.85) },
      'MS X & KG VAR': { count: 0, sampleOdds: (ms0 * (kgVar > 0 ? kgVar : 1.85) * 0.85) },
      'MS 2 & 2.5 ÜST': { count: 0, sampleOdds: (ms2 * (ust25 > 0 ? ust25 : 1.80) * 0.85) },
      'MS 2 & 2.5 ALT': { count: 0, sampleOdds: (ms2 * (alt25 > 0 ? alt25 : 1.90) * 0.85) },
      'MS 2 & KG VAR': { count: 0, sampleOdds: (ms2 * (kgVar > 0 ? kgVar : 1.85) * 0.85) },
      'MS 2 & KG YOK': { count: 0, sampleOdds: (ms2 * (kgYok > 0 ? kgYok : 1.90) * 0.85) }
    };

    rows.forEach(r => {
      if (!r.ms_score) return;
      const parts = r.ms_score.split(/[-:]/).map(s => parseInt(s.trim(), 10));
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return;

      const h = parts[0];
      const a = parts[1];
      const totalGoals = h + a;
      const scoreKey = `${h} - ${a}`;
      const isKgVar = h > 0 && a > 0;
      const isOver25 = totalGoals >= 3;

      validCount++;
      scoreCounts[scoreKey] = (scoreCounts[scoreKey] || 0) + 1;

      if (h > a) {
        if (isOver25) comboCounts['MS 1 & 2.5 ÜST'].count++;
        else comboCounts['MS 1 & 2.5 ALT'].count++;
        if (isKgVar) comboCounts['MS 1 & KG VAR'].count++;
        else comboCounts['MS 1 & KG YOK'].count++;
      } else if (h === a) {
        if (!isOver25) comboCounts['MS X & 2.5 ALT'].count++;
        if (isKgVar) comboCounts['MS X & KG VAR'].count++;
      } else {
        if (isOver25) comboCounts['MS 2 & 2.5 ÜST'].count++;
        else comboCounts['MS 2 & 2.5 ALT'].count++;
        if (isKgVar) comboCounts['MS 2 & KG VAR'].count++;
        else comboCounts['MS 2 & KG YOK'].count++;
      }
    });

    if (validCount < 5) {
      return { sampleSize: validCount, combos: [], topCombo: null, topScores: [], primaryScore: null, secondaryScore: null, scoreStats: {} };
    }

    // Skorları sırala
    const sortedScores = Object.entries(scoreCounts)
      .map(([score, count]) => {
        const rate = Math.round((count / validCount) * 100);
        // İddaa piyasa tahmin oranı
        let estOdd = 6.00;
        if (rate >= 30) estOdd = 5.25;
        else if (rate >= 20) estOdd = 6.50;
        else if (rate >= 15) estOdd = 7.50;
        else if (rate >= 10) estOdd = 9.00;
        else estOdd = 12.00;

        return { score, count, rate, estOdd: estOdd.toFixed(2) };
      })
      .sort((a, b) => b.count - a.count);

    const primaryScore = sortedScores[0] || null;
    const secondaryScore = sortedScores[1] || null;

    // Kombinasyonları sırala
    const combos = Object.entries(comboCounts).map(([name, data]) => {
      const rate = Math.round((data.count / validCount) * 100);
      const safeOdds = typeof data.sampleOdds === 'number' && !isNaN(data.sampleOdds) && data.sampleOdds > 1 ? data.sampleOdds : 2.80;
      const estOdd = Math.max(2.20, parseFloat(safeOdds.toFixed(2)));
      return {
        name,
        count: data.count,
        rate,
        estOdd: isNaN(estOdd) ? '2.80' : estOdd.toFixed(2)
      };
    }).sort((a, b) => b.rate - a.rate);

    const topCombo = combos[0] || null;

    return {
      sampleSize: validCount,
      combos: combos.slice(0, 4), // En yüksek 4 kombine
      topCombo,
      topScores: sortedScores.slice(0, 4),
      primaryScore,
      secondaryScore
    };
  } catch (e) {
    return { sampleSize: 0, combos: [], topCombo: null, topScores: [], primaryScore: null, secondaryScore: null, scoreStats: {} };
  }
}

// 1. GELECEK BÜLTEN
async function syncUpcoming() {
  console.log('--- 1. GELECEK BÜLTEN KOMBİNE & SKOR TARANIYOR ---');
  const dates = [];
  for (let i = 0; i <= 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    dates.push(`${dd}/${mm}/${yyyy}`);
  }

  const rawMatches = [];
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
                const ms1 = cleanNum(m[16]);
                const ms0 = cleanNum(m[17]);
                const ms2 = cleanNum(m[18]);
                const alt25 = cleanNum(m[22]);
                const ust25 = cleanNum(m[23]);
                const kgVar = cleanNum(m[39]);
                const kgYok = cleanNum(m[40]);

                if (ms1 > 1.05 && ms0 > 1.05 && ms2 > 1.05) {
                  rawMatches.push({
                    id: String(m[0]),
                    eventId,
                    code: String(m[49] || m[4] || String(m[0]).slice(0, 5)),
                    homeTeam: String(m[1]).trim(),
                    awayTeam: String(m[3]).trim(),
                    league: String(m[26] || 'Diğer').trim(),
                    date: formatDateStr(String(m[7] || dayStr)),
                    time: String(m[6] || '').trim(),
                    odds: { ms1, ms0, ms2, alt25, ust25, kgVar, kgYok }
                  });
                }
              }
            }
          });
        });
      }
    } catch (e) {
      console.error('Bülten günü çekilemedi:', dayStr, e.message);
    }
  }));

  console.log(`Gelecek günlerde ${rawMatches.length} maç bulundu. Analiz ediliyor...`);

  const analyzedMatches = [];
  const concurrency = 25;
  let cursor = 0;

  async function worker() {
    while (cursor < rawMatches.length) {
      const match = rawMatches[cursor++];
      if (!match) break;

      try {
        const analysis = await analyzeComboAndScore(match.odds);
        if (analysis.sampleSize >= 10 && analysis.topCombo && analysis.primaryScore) {
          analyzedMatches.push({
            ...match,
            sampleSize: analysis.sampleSize,
            combos: analysis.combos,
            topCombo: analysis.topCombo,
            topScores: analysis.topScores,
            primaryScore: analysis.primaryScore,
            secondaryScore: analysis.secondaryScore
          });
        }
      } catch (e) {}
    }
  }

  await Promise.all(Array(concurrency).fill(null).map(() => worker()));

  // Başlama saatine göre sırala
  analyzedMatches.sort((a, b) => {
    const timeA = (a.time || '99:99').trim();
    const timeB = (b.time || '99:99').trim();
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    return (b.topCombo?.rate || 0) - (a.topCombo?.rate || 0);
  });

  const dateSet = new Set();
  const leagueSet = new Set();
  analyzedMatches.forEach(m => {
    if (m.date) dateSet.add(m.date);
    if (m.league) leagueSet.add(m.league);
  });

  const sortedDates = Array.from(dateSet).sort((a, b) => {
    const [d1, m1, y1] = a.split('.').map(Number);
    const [d2, m2, y2] = b.split('.').map(Number);
    return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
  });

  console.log(`Gelecek bültende analizi tamamlanan ${analyzedMatches.length} maç listelendi.`);

  return {
    availableDates: sortedDates,
    availableLeagues: Array.from(leagueSet).sort(),
    matches: analyzedMatches
  };
}

// 2. DÜNÜN SONUÇLARI
async function syncPast() {
  console.log('\n--- 2. DÜNÜN BİTEN MAÇLARI VE SKOR BAŞARISI TARANIYOR ---');
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const dayStr = `${dd}/${mm}/${yyyy}`;
  const formattedDate = `${dd}.${mm}.${yyyy}`;

  let liveRaw = '';
  try {
    const lRes = await httpsGet(`https://vd.mackolik.com/livedata?date=${dayStr}`);
    liveRaw = lRes.text;
  } catch (e) {
    console.error('Dünün verileri çekilemedi:', e.message);
    return { pastMatches: [], pastStats: null, date: formattedDate };
  }

  const finishedMatches = [];
  const seenEventIds = new Set();

  if (liveRaw && liveRaw.length > 50) {
    try {
      const lObj = JSON.parse(liveRaw);
      (lObj.m || []).forEach(m => {
        if (m[5] === 4 && m[14]) {
          const eventId = String(m[14]);
          if (!seenEventIds.has(eventId)) {
            seenEventIds.add(eventId);
            finishedMatches.push(m);
          }
        }
      });
    } catch (e) {}
  }

  console.log(`Dün (${formattedDate}) toplam ${finishedMatches.length} bitmiş maç adayı bulundu. Oranları taranıyor...`);

  function extractOddsFromPopup(popupJson) {
    const markets = popupJson?.data?.matches?.[0]?.bookies?.[0]?.markets || [];
    let ms1 = 0, ms0 = 0, ms2 = 0, alt25 = 0, ust25 = 0, kgVar = 0, kgYok = 0;
    markets.forEach(mkt => {
      const n = normalizeText(mkt.name);
      if (n === 'mac sonucu' || n === 'ms') {
        (mkt.outcomes || []).forEach(o => {
          const on = normalizeText(o.name);
          if (on === '1') ms1 = cleanNum(o.value);
          if (on === '0' || on === 'x') ms0 = cleanNum(o.value);
          if (on === '2') ms2 = cleanNum(o.value);
        });
      }
      if ((n.includes('2,5') || n.includes('2.5')) && n.includes('alt/ust') && !n.includes('korner') && !n.includes('kart') && !n.includes('1. yari')) {
        (mkt.outcomes || []).forEach(o => {
          const on = normalizeText(o.name);
          if (on === 'alt' || o.key === '-2.5') alt25 = cleanNum(o.value);
          if (on === 'ust' || o.key === '+2.5') ust25 = cleanNum(o.value);
        });
      }
      if (n.includes('karsilikli gol') || n === 'kg') {
        (mkt.outcomes || []).forEach(o => {
          const on = normalizeText(o.name);
          if (on === 'var') kgVar = cleanNum(o.value);
          if (on === 'yok') kgYok = cleanNum(o.value);
        });
      }
    });
    return { ms1, ms0, ms2, alt25, ust25, kgVar, kgYok };
  }

  const pastResults = [];
  const concurrency = 20;
  let cursor = 0;

  async function pastWorker() {
    while (cursor < finishedMatches.length) {
      const m = finishedMatches[cursor++];
      if (!m) break;

      const eventId = String(m[14]);
      const id = String(m[0]);

      try {
        const popupUrl = `https://arsiv.mackolik.com/AjaxHandlers/IddaaHandler.aspx?command=oddspopup&e=${eventId}&s=futbol`;
        const popupRes = await httpsGet(popupUrl);
        let odds = {
          ms1: cleanNum(m[18]),
          ms0: cleanNum(m[19]),
          ms2: cleanNum(m[20]),
          alt25: cleanNum(m[21]),
          ust25: cleanNum(m[22]),
          kgVar: cleanNum(m[39]),
          kgYok: cleanNum(m[40])
        };

        if (popupRes.status === 200 && popupRes.text && popupRes.text.trim().startsWith('{')) {
          const pJson = JSON.parse(popupRes.text);
          const pOdds = extractOddsFromPopup(pJson);
          if (pOdds.ms1 > 0) odds.ms1 = pOdds.ms1;
          if (pOdds.ms0 > 0) odds.ms0 = pOdds.ms0;
          if (pOdds.ms2 > 0) odds.ms2 = pOdds.ms2;
          if (pOdds.alt25 > 0) odds.alt25 = pOdds.alt25;
          if (pOdds.ust25 > 0) odds.ust25 = pOdds.ust25;
          if (pOdds.kgVar > 0) odds.kgVar = pOdds.kgVar;
          if (pOdds.kgYok > 0) odds.kgYok = pOdds.kgYok;
        }

        if (odds.ms1 > 1.01 && odds.ms0 > 1.01 && odds.ms2 > 1.01) {
          const analysis = await analyzeComboAndScore(odds);
          if (analysis && analysis.sampleSize >= 5 && analysis.topCombo && analysis.primaryScore) {
            const msHome = typeof m[12] === 'number' ? m[12] : parseInt(m[12]) || 0;
            const msAway = typeof m[13] === 'number' ? m[13] : parseInt(m[13]) || 0;
            const actualScore = `${msHome} - ${msAway}`;

            let iyScore = '0 - 0';
            if (m[7] && String(m[7]).includes('-')) {
              iyScore = String(m[7]).trim();
            } else if (m[31] !== undefined && m[32] !== undefined) {
              iyScore = `${m[31]} - ${m[32]}`;
            }

            const league = (m[36] && m[36][3]) ? `${m[36][1]} - ${m[36][3]}` : (m[36] && m[36][1]) ? m[36][1] : 'Futbol';

            const h = msHome;
            const a = msAway;
            const totalGoals = h + a;
            const isOver25 = totalGoals >= 3;
            const isKgVar = h > 0 && a > 0;

            // Top Combo Hit Kontrolü
            let isComboHit = false;
            if (analysis.topCombo.name === 'MS 1 & 2.5 ÜST' && h > a && isOver25) isComboHit = true;
            else if (analysis.topCombo.name === 'MS 1 & 2.5 ALT' && h > a && !isOver25) isComboHit = true;
            else if (analysis.topCombo.name === 'MS 1 & KG VAR' && h > a && isKgVar) isComboHit = true;
            else if (analysis.topCombo.name === 'MS 1 & KG YOK' && h > a && !isKgVar) isComboHit = true;
            else if (analysis.topCombo.name === 'MS X & 2.5 ALT' && h === a && !isOver25) isComboHit = true;
            else if (analysis.topCombo.name === 'MS X & KG VAR' && h === a && isKgVar) isComboHit = true;
            else if (analysis.topCombo.name === 'MS 2 & 2.5 ÜST' && h < a && isOver25) isComboHit = true;
            else if (analysis.topCombo.name === 'MS 2 & 2.5 ALT' && h < a && !isOver25) isComboHit = true;
            else if (analysis.topCombo.name === 'MS 2 & KG VAR' && h < a && isKgVar) isComboHit = true;
            else if (analysis.topCombo.name === 'MS 2 & KG YOK' && h < a && !isKgVar) isComboHit = true;

            const isPrimaryScoreHit = analysis.primaryScore?.score === actualScore;
            const isSecondaryScoreHit = analysis.secondaryScore?.score === actualScore;
            const isExactScoreHit = isPrimaryScoreHit || isSecondaryScoreHit;

            pastResults.push({
              id,
              eventId,
              code: String(m[0]).slice(-4),
              homeTeam: String(m[2] || '').trim(),
              awayTeam: String(m[4] || '').trim(),
              league,
              date: formattedDate,
              time: String(m[16] || '').trim(),
              odds,
              actualScore,
              iyScore,
              status: 'MS',
              sampleSize: analysis.sampleSize,
              combos: analysis.combos,
              topCombo: analysis.topCombo,
              topScores: analysis.topScores,
              primaryScore: analysis.primaryScore,
              secondaryScore: analysis.secondaryScore,
              isComboHit,
              isPrimaryScoreHit,
              isSecondaryScoreHit,
              isExactScoreHit
            });
          }
        }
      } catch (e) {
        console.error('pastWorker error:', e);
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => pastWorker());
  await Promise.all(workers);

  // Başlama saatine göre sırala
  pastResults.sort((a, b) => {
    const timeA = (a.time || '99:99').trim();
    const timeB = (b.time || '99:99').trim();
    return timeA.localeCompare(timeB);
  });

  const totalFinished = pastResults.length;
  const comboHitCount = pastResults.filter(r => r.isComboHit).length;
  const scoreHitCount = pastResults.filter(r => r.isExactScoreHit).length;
  const comboHitRate = totalFinished > 0 ? Math.round((comboHitCount / totalFinished) * 100) : 0;
  const scoreHitRate = totalFinished > 0 ? Math.round((scoreHitCount / totalFinished) * 100) : 0;

  const pastStats = {
    date: formattedDate,
    totalFinished,
    comboHitCount,
    comboHitRate,
    scoreHitCount,
    scoreHitRate
  };

  console.log(`Dün (${formattedDate}) ${totalFinished} maç değerlendirildi. (Kombine İsabet: ${comboHitCount}/${totalFinished} - %${comboHitRate}, Skor İsabet: ${scoreHitCount}/${totalFinished} - %${scoreHitRate})`);

  return {
    pastStats,
    pastMatches: pastResults
  };
}

async function main() {
  console.log('=== YÜKSEK ORAN VE SKOR ANALİZİ SENKRONİZASYONU BAŞLADI ===');
  const future = await syncUpcoming();
  const past = await syncPast();

  const finalPayload = {
    success: true,
    timestamp: Date.now(),
    availableDates: future.availableDates,
    availableLeagues: future.availableLeagues,
    stats: {
      totalAnalyzed: future.matches.length,
      highConfidenceCount: future.matches.filter(m => (m.topCombo?.rate || 0) >= 45).length
    },
    matches: future.matches,
    pastStats: past.pastStats,
    pastMatches: past.pastMatches
  };

  const dataDir = path.join(process.cwd(), 'data');
  const publicDataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });

  const cacheFile = path.join(dataDir, 'yuksek_oran_cache.json');
  const publicCacheFile = path.join(publicDataDir, 'yuksek_oran_cache.json');

  fs.writeFileSync(cacheFile, JSON.stringify(finalPayload, null, 2), 'utf-8');
  fs.writeFileSync(publicCacheFile, JSON.stringify(finalPayload, null, 2), 'utf-8');

  console.log(`🎉 YÜKSEK ORAN ANALİZİ TAMAMLANDI! (${future.matches.length} Gelecek Maç, ${past.pastMatches.length} Dünün Maçı)`);
}

main().catch(console.error);
