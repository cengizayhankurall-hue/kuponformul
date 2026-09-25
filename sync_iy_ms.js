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

function httpsGet(urlStr, referer = 'https://arsiv.mackolik.com/Genis-Iddaa-Programi', timeoutMs = 7000) {
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

function calculateOutcomeFromScores(iyScore, msScore) {
  if (!iyScore || !msScore) return null;
  const iyClean = iyScore.replace('İY:', '').trim();
  const msClean = msScore.replace('MS:', '').trim();
  const iyParts = iyClean.split(/[-:]/).map(s => parseInt(s.trim(), 10));
  const msParts = msClean.split(/[-:]/).map(s => parseInt(s.trim(), 10));

  if (iyParts.length !== 2 || msParts.length !== 2 || isNaN(iyParts[0]) || isNaN(iyParts[1]) || isNaN(msParts[0]) || isNaN(msParts[1])) {
    return null;
  }

  const iyOutcome = iyParts[0] > iyParts[1] ? '1' : (iyParts[0] === iyParts[1] ? 'X' : '2');
  const msOutcome = msParts[0] > msParts[1] ? '1' : (msParts[0] === msParts[1] ? 'X' : '2');

  return `${iyOutcome}/${msOutcome}`;
}

const OUTCOME_KEYS = ['1/1', 'X/1', '2/1', '1/X', 'X/X', '2/X', '1/2', 'X/2', '2/2'];

async function analyzeOdds(odds) {
  const { ms1, ms0, ms2, iy1, iy0, iy2 } = odds;
  const emptyStats = {};
  OUTCOME_KEYS.forEach(k => { emptyStats[k] = { key: k, count: 0, rate: 0 }; });

  if (!ms1 && !ms0 && !ms2) {
    return { sampleSize: 0, matchTier: 'no_history', stats: emptyStats, topOutcome: null, surpriseOutcome: null, recentMatches: [] };
  }

  try {
    const tolMS = 0.08;
    const tolIY = 0.16;

    let q = supabase
      .from('past_matches')
      .select('id, match_date, home_team, away_team, league, ms_score, iy_score, ms_1_odd, ms_0_odd, ms_2_odd, iy_1_odd, iy_0_odd, iy_2_odd')
      .not('ms_score', 'is', null)
      .not('iy_score', 'is', null);

    if (ms1 > 0) q = q.gte('ms_1_odd', ms1 - tolMS).lte('ms_1_odd', ms1 + tolMS);
    if (ms0 > 0) q = q.gte('ms_0_odd', ms0 - tolMS).lte('ms_0_odd', ms0 + tolMS);
    if (ms2 > 0) q = q.gte('ms_2_odd', ms2 - tolMS).lte('ms_2_odd', ms2 + tolMS);

    const { data: rawMsData, error } = await q.order('match_date', { ascending: false }).limit(300);

    if (error || !rawMsData || rawMsData.length === 0) {
      return { sampleSize: 0, matchTier: 'no_history', stats: emptyStats, topOutcome: null, surpriseOutcome: null, recentMatches: [] };
    }

    const exactMsIy = [];
    const closeMsIy = [];

    rawMsData.forEach((row) => {
      let iyMatchExact = true;
      let iyMatchClose = true;

      if (iy1 > 0 && row.iy_1_odd) {
        const d = Math.abs(row.iy_1_odd - iy1);
        if (d > 0.06) iyMatchExact = false;
        if (d > tolIY) iyMatchClose = false;
      }
      if (iy0 > 0 && row.iy_0_odd) {
        const d = Math.abs(row.iy_0_odd - iy0);
        if (d > 0.06) iyMatchExact = false;
        if (d > tolIY) iyMatchClose = false;
      }
      if (iy2 > 0 && row.iy_2_odd) {
        const d = Math.abs(row.iy_2_odd - iy2);
        if (d > 0.06) iyMatchExact = false;
        if (d > tolIY) iyMatchClose = false;
      }

      if (iyMatchExact) exactMsIy.push(row);
      if (iyMatchClose) closeMsIy.push(row);
    });

    let targetMatches = [];
    let matchTier = 'no_history';

    if (exactMsIy.length >= 5) {
      targetMatches = exactMsIy;
      matchTier = 'exact_ms_iy';
    } else if (closeMsIy.length >= 4) {
      targetMatches = closeMsIy;
      matchTier = 'close_ms_iy';
    } else {
      targetMatches = rawMsData;
      matchTier = 'ms_only';
    }

    const counts = { '1/1': 0, 'X/1': 0, '2/1': 0, '1/X': 0, 'X/X': 0, '2/X': 0, '1/2': 0, 'X/2': 0, '2/2': 0 };
    const recentMatchesList = [];
    let validCount = 0;

    targetMatches.forEach((m) => {
      const outcome = calculateOutcomeFromScores(m.iy_score, m.ms_score);
      if (!outcome || counts[outcome] === undefined) return;

      counts[outcome]++;
      validCount++;

      if (recentMatchesList.length < 10) {
        recentMatchesList.push({
          id: m.id || `${m.home_team}-${m.match_date}`,
          date: m.match_date,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          league: m.league,
          msScore: m.ms_score,
          iyScore: m.iy_score,
          outcome,
          ms1: m.ms_1_odd,
          ms0: m.ms_0_odd,
          ms2: m.ms_2_odd,
          iy1: m.iy_1_odd,
          iy0: m.iy_0_odd,
          iy2: m.iy_2_odd
        });
      }
    });

    const finalStats = {};
    let topChoice = null;
    let surpriseValueChoice = null;
    let maxRate = -1;
    let maxSurpriseRate = -1;

    OUTCOME_KEYS.forEach((key) => {
      const cnt = counts[key] || 0;
      const rate = validCount > 0 ? Math.round((cnt / validCount) * 100) : 0;
      const item = { key, count: cnt, rate };

      if (rate > maxRate && cnt > 0) {
        maxRate = rate;
        topChoice = item;
      }

      const isSurprise = ['1/X', '2/X', '1/2', '2/1'].includes(key);
      if (isSurprise && rate >= 12 && cnt >= 2 && rate > maxSurpriseRate) {
        maxSurpriseRate = rate;
        surpriseValueChoice = item;
      }

      finalStats[key] = item;
    });

    return {
      sampleSize: validCount,
      matchTier,
      stats: finalStats,
      topOutcome: topChoice,
      surpriseOutcome: surpriseValueChoice,
      recentMatches: recentMatchesList
    };
  } catch (err) {
    return { sampleSize: 0, matchTier: 'no_history', stats: emptyStats, topOutcome: null, surpriseOutcome: null, recentMatches: [] };
  }
}

// 1. SCAN UPCOMING (TODAY + 5 DAYS)
async function syncUpcoming() {
  console.log('--- 1. GELECEK BÜLTEN MAÇLARI ÇEKİLİYOR (BUGÜNDEN İTİBAREN) ---');
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
  const seenIds = new Set();

  await Promise.all(dates.map(async (dayStr) => {
    try {
      const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dayStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;
      const res = await httpsGet(url);
      if (res.status === 200 && res.text && res.text.length > 50) {
        const obj = new Function(`return ${res.text}`)();
        (obj.m || []).forEach((g) => {
          (g.m || []).forEach((m) => {
            const state = typeof m[5] === 'number' ? m[5] : parseInt(m[5]) || 0;
            if (state === 0 && m[1] && m[3]) {
              const id = String(m[0] || `${m[1]}-${m[3]}`);
              if (!seenIds.has(id)) {
                seenIds.add(id);
                const ms1 = cleanNum(m[16]);
                const ms0 = cleanNum(m[17]);
                const ms2 = cleanNum(m[18]);
                const iy1 = cleanNum(m[33]);
                const iy0 = cleanNum(m[34]);
                const iy2 = cleanNum(m[35]);

                // SADECE HEM MS (1-0-2) HEM DE İY (1-0-2) ORANLARI AÇILMIŞ MAÇLAR
                if (ms1 > 0 && ms0 > 0 && ms2 > 0 && iy1 > 0 && iy0 > 0 && iy2 > 0) {
                  rawMatches.push({
                    id,
                    code: String(m[49] || m[4] || id.slice(0, 5)),
                    homeTeam: String(m[1]).trim(),
                    awayTeam: String(m[3]).trim(),
                    league: String(m[26] || 'Diğer').trim(),
                    date: formatDateStr(String(m[7] || dayStr)),
                    time: String(m[6] || '').trim(),
                    odds: { ms1, ms0, ms2, iy1, iy0, iy2 }
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

  console.log(`Bültende HEM MS HEM İY ORANI AÇIK ${rawMatches.length} maç bulundu. 388k arşivde analiz ediliyor...`);

  const analyzedMatches = [];
  const concurrency = 30;
  let cursor = 0;

  async function worker() {
    while (cursor < rawMatches.length) {
      const match = rawMatches[cursor++];
      if (!match) break;

      const analysis = await analyzeOdds(match.odds);
      // SADECE EN AZ 1 BENZER MAÇ BULUNANLARI EKLE (0 BENZER MAÇLILARI GÖSTERME)
      if (analysis.sampleSize > 0) {
        analyzedMatches.push({
          id: match.id,
          code: match.code,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
          date: match.date,
          time: match.time,
          odds: match.odds,
          sampleSize: analysis.sampleSize,
          matchTier: analysis.matchTier,
          stats: analysis.stats,
          topOutcome: analysis.topOutcome,
          surpriseOutcome: analysis.surpriseOutcome,
          recentMatches: analysis.recentMatches
        });
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);

  analyzedMatches.sort((a, b) => {
    const rateA = a.topOutcome?.rate || 0;
    const rateB = b.topOutcome?.rate || 0;
    if (rateB !== rateA) return rateB - rateA;
    return (b.sampleSize || 0) - (a.sampleSize || 0);
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

  const highConfidenceCount = analyzedMatches.filter(m => (m.topOutcome?.rate || 0) >= 45).length;
  const surpriseCount = analyzedMatches.filter(m => !!m.surpriseOutcome).length;

  return {
    availableDates: sortedDates,
    availableLeagues: Array.from(leagueSet).sort(),
    stats: {
      totalAnalyzed: analyzedMatches.length,
      highConfidenceCount,
      surpriseCount
    },
    matches: analyzedMatches
  };
}

// 2. SCAN YESTERDAY'S FINISHED MATCHES (DÜNÜN SONUÇLARI)
async function syncPast() {
  console.log('\n--- 2. DÜNÜN (1 GÜN ÖNCESİ) BİTEN İY/MS MAÇLARI ÇEKİLİYOR ---');
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const dayStr = `${dd}/${mm}/${yyyy}`;
  const formattedDate = `${dd}.${mm}.${yyyy}`;

  let programRaw = '';
  let liveRaw = '';

  try {
    const [pRes, lRes] = await Promise.all([
      httpsGet(`https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dayStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`),
      httpsGet(`https://vd.mackolik.com/livedata?date=${dayStr}`)
    ]);
    programRaw = pRes.text;
    liveRaw = lRes.text;
  } catch (e) {
    console.error('Dünün verileri çekilemedi:', e.message);
    return { pastMatches: [], pastStats: null, date: formattedDate };
  }

  const liveMap = new Map();
  if (liveRaw && liveRaw.length > 50) {
    try {
      const lObj = JSON.parse(liveRaw);
      (lObj.m || []).forEach(m => {
        liveMap.set(String(m[0]), m);
        if (m[14]) liveMap.set(String(m[14]), m);
      });
    } catch (e) {}
  }

  const finishedMatchesToAnalyze = [];
  const seenIds = new Set();

  if (programRaw && programRaw.length > 50) {
    try {
      const pObj = new Function(`return ${programRaw}`)();
      (pObj.m || []).forEach(g => {
        (g.m || []).forEach(m => {
          const ms1 = cleanNum(m[16]);
          const ms0 = cleanNum(m[17]);
          const ms2 = cleanNum(m[18]);
          const iy1 = cleanNum(m[33]);
          const iy0 = cleanNum(m[34]);
          const iy2 = cleanNum(m[35]);

          if (ms1 > 0 && ms0 > 0 && ms2 > 0 && iy1 > 0 && iy0 > 0 && iy2 > 0) {
            const id = String(m[0]);
            if (!seenIds.has(id)) {
              seenIds.add(id);
              const live = liveMap.get(id);
              if (live && live[5] === 4) {
                const msHome = typeof live[12] === 'number' ? live[12] : parseInt(live[12]) || 0;
                const msAway = typeof live[13] === 'number' ? live[13] : parseInt(live[13]) || 0;
                const msScore = `${msHome} - ${msAway}`;

                let iyScore = '0 - 0';
                if (live[7] && String(live[7]).includes('-')) {
                  iyScore = String(live[7]).trim();
                } else if (live[31] !== undefined && live[32] !== undefined) {
                  iyScore = `${live[31]} - ${live[32]}`;
                }

                const actualOutcome = calculateOutcomeFromScores(iyScore, msScore);
                if (actualOutcome) {
                  finishedMatchesToAnalyze.push({
                    id,
                    code: String(m[49] || m[4] || id.slice(0, 5)),
                    homeTeam: String(m[1]).trim(),
                    awayTeam: String(m[3]).trim(),
                    league: String(m[26] || 'Diğer').trim(),
                    date: formattedDate,
                    time: String(m[6] || live[16] || '').trim(),
                    odds: { ms1, ms0, ms2, iy1, iy0, iy2 },
                    msScore,
                    iyScore,
                    actualOutcome
                  });
                }
              }
            }
          }
        });
      });
    } catch (e) {}
  }

  console.log(`Dün (${formattedDate}) İY/MS oranlı ${finishedMatchesToAnalyze.length} bitmiş maç bulundu. Analiz ediliyor...`);

  const pastResults = [];
  const concurrency = 30;
  let cursor = 0;

  async function pastWorker() {
    while (cursor < finishedMatchesToAnalyze.length) {
      const match = finishedMatchesToAnalyze[cursor++];
      if (!match) break;

      const analysis = await analyzeOdds(match.odds);
      // SADECE EN AZ 1 BENZER MAÇ BULUNANLARI AL (0 benzer maçlıları gösterme)
      if (analysis.sampleSize > 0) {
        const isTopHit = analysis.topOutcome ? (analysis.topOutcome.key === match.actualOutcome) : false;
        const isSurpriseHit = analysis.surpriseOutcome ? (analysis.surpriseOutcome.key === match.actualOutcome) : false;

        pastResults.push({
          id: match.id,
          code: match.code,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
          date: match.date,
          time: match.time,
          status: 'MS',
          score: match.msScore,
          iyScore: match.iyScore,
          actualOutcome: match.actualOutcome,
          isTopHit,
          isSurpriseHit,
          odds: match.odds,
          sampleSize: analysis.sampleSize,
          matchTier: analysis.matchTier,
          stats: analysis.stats,
          topOutcome: analysis.topOutcome,
          surpriseOutcome: analysis.surpriseOutcome,
          recentMatches: analysis.recentMatches
        });
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => pastWorker());
  await Promise.all(workers);

  // Sort by top hit first, then sampleSize
  pastResults.sort((a, b) => {
    if (a.isTopHit !== b.isTopHit) return a.isTopHit ? -1 : 1;
    return (b.sampleSize || 0) - (a.sampleSize || 0);
  });

  const topHitCount = pastResults.filter(m => m.isTopHit).length;
  const surpriseHitCount = pastResults.filter(m => m.isSurpriseHit).length;
  const topHitRate = pastResults.length > 0 ? Math.round((topHitCount / pastResults.length) * 100) : 0;

  const outcomeCounts = {};
  OUTCOME_KEYS.forEach(k => { outcomeCounts[k] = 0; });
  pastResults.forEach(m => {
    if (m.actualOutcome && outcomeCounts[m.actualOutcome] !== undefined) {
      outcomeCounts[m.actualOutcome]++;
    }
  });

  const pastStats = {
    date: formattedDate,
    totalFinished: pastResults.length,
    topHitCount,
    topHitRate,
    surpriseHitCount,
    outcomeCounts
  };

  console.log(`Dünün Biten Maçları Kaydedildi: ${pastResults.length} maç (Top Tahmin İsabeti: ${topHitCount}/${pastResults.length} - %${topHitRate})`);

  return {
    pastMatches: pastResults,
    pastStats,
    date: formattedDate
  };
}

async function main() {
  const upcomingData = await syncUpcoming();
  const pastData = await syncPast();

  const payload = {
    success: true,
    timestamp: Date.now(),
    availableDates: upcomingData.availableDates,
    availableLeagues: upcomingData.availableLeagues,
    stats: upcomingData.stats,
    matches: upcomingData.matches,
    pastStats: pastData.pastStats,
    pastMatches: pastData.pastMatches
  };

  const cachePath1 = path.join(__dirname, 'data', 'iy_ms_cache.json');
  const cachePath2 = path.join(__dirname, 'public', 'data', 'iy_ms_cache.json');

  if (!fs.existsSync(path.dirname(cachePath1))) fs.mkdirSync(path.dirname(cachePath1), { recursive: true });
  if (!fs.existsSync(path.dirname(cachePath2))) fs.mkdirSync(path.dirname(cachePath2), { recursive: true });

  fs.writeFileSync(cachePath1, JSON.stringify(payload, null, 2), 'utf-8');
  fs.writeFileSync(cachePath2, JSON.stringify(payload, null, 2), 'utf-8');

  console.log(`\n🎉 İY/MS ANALİZİ TAMAMLANDI! (Gelecek Bülten: ${upcomingData.matches.length} maç, Dünün Sonuçları: ${pastData.pastMatches.length} maç)`);
}

main();
