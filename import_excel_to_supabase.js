require('dotenv').config({ path: '.env.local' });
const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase env variables missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

function cleanNumber(val) {
  if (val === undefined || val === null || val === '' || val === '-' || val === 0 || val === '0,00' || val === '0.00') return null;
  const num = Number(String(val).replace(',', '.').trim());
  return isNaN(num) || num === 0 ? null : num;
}

function parseDateTime(val) {
  if (!val) return { date: null, time: '00:00:00' };
  const str = String(val).trim();
  const parts = str.split(' ');
  const datePart = parts[0];
  let timePart = parts[1] ? parts[1].trim() : '00:00';
  if (timePart.length === 5) timePart += ':00';

  if (datePart.includes('.')) {
    const [d, m, y] = datePart.split('.');
    if (d && m && y && y.length === 4) {
      const padD = d.padStart(2, '0');
      const padM = m.padStart(2, '0');
      return { date: `${y}-${padM}-${padD}`, time: timePart };
    }
  } else if (datePart.includes('-')) {
    const [y, m, d] = datePart.split('-');
    if (y && m && d && y.length === 4) {
      const padD = d.padStart(2, '0');
      const padM = m.padStart(2, '0');
      return { date: `${y}-${padM}-${padD}`, time: timePart };
    }
  }
  return { date: null, time: timePart };
}

function parseScore(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (str === '-' || str === '-1' || str.toLowerCase().includes('ert') || str.toLowerCase().includes('ipt')) return null;
  if (str.includes('-')) {
    const [h, a] = str.split('-');
    if (h !== undefined && a !== undefined && !isNaN(Number(h)) && !isNaN(Number(a))) {
      return `${Number(h)} - ${Number(a)}`;
    }
  }
  return str;
}

function parseIYScore(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (str === '-' || str === '-1' || str.toLowerCase().includes('ert') || str.toLowerCase().includes('ipt')) return null;
  if (str.includes('-')) {
    const [h, a] = str.split('-');
    if (h !== undefined && a !== undefined && !isNaN(Number(h)) && !isNaN(Number(a))) {
      return `${Number(h)}-${Number(a)}`;
    }
  }
  return str;
}

async function batchUpsert(chunk, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { error } = await supabase
      .from('past_matches')
      .upsert(chunk, { onConflict: 'home_team,away_team,match_date' });

    if (!error) return chunk.length;
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    } else {
      console.error(`\nUpsert chunk error:`, error.message);
      return 0;
    }
  }
}

async function run() {
  const filePath = path.join(__dirname, 'oran.xlsb');
  console.log(`==================================================`);
  console.log(`[Excel to Supabase] Dosya Okunuyor: ${filePath}`);
  console.log(`==================================================`);

  const startTime = Date.now();
  const wb = xlsx.readFile(filePath, {
    dense: true,
    cellFormula: false,
    cellHTML: false,
    cellText: false,
    raw: true
  });
  
  const sheet = wb.Sheets['Arsiv'] || wb.Sheets[wb.SheetNames[0]];
  const rows = sheet['!data'] || xlsx.utils.sheet_to_json(sheet, { header: 1, raw: true });

  console.log(`Excel'den toplam ${rows.length} satır okundu (${((Date.now() - startTime) / 1000).toFixed(1)} sn).`);
  
  const parsedMatches = [];
  let skippedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const rowObj = rows[i];
    if (!rowObj) continue;
    
    // In dense mode, rowObj is an array of cell objects or raw values
    const getVal = (colIdx) => {
      const cell = rowObj[colIdx];
      if (cell === undefined || cell === null) return undefined;
      return cell.v !== undefined ? cell.v : cell;
    };

    const homeTeam = getVal(5) ? String(getVal(5)).trim() : null;
    const awayTeam = getVal(6) ? String(getVal(6)).trim() : null;
    const rawDate = getVal(35); // TARİH-SAAT
    const league = getVal(34) ? String(getVal(34)).trim() : 'Diger';

    if (!homeTeam || !awayTeam || !rawDate) {
      skippedCount++;
      continue;
    }

    const { date, time } = parseDateTime(rawDate);
    if (!date) {
      skippedCount++;
      continue;
    }

    const iyScore = parseIYScore(getVal(3));
    const msScore = parseScore(getVal(4));

    const item = {
      match_date: date,
      match_time: time,
      home_team: homeTeam,
      away_team: awayTeam,
      league: league,
      ms_score: msScore,
      iy_score: iyScore,
      ms_1_odd: cleanNumber(getVal(7)),
      ms_0_odd: cleanNumber(getVal(8)),
      ms_2_odd: cleanNumber(getVal(9)),
      iy_1_odd: cleanNumber(getVal(10)),
      iy_0_odd: cleanNumber(getVal(11)),
      iy_2_odd: cleanNumber(getVal(12)),
      cs_1x_odd: cleanNumber(getVal(13)),
      cs_12_odd: cleanNumber(getVal(14)),
      cs_x2_odd: cleanNumber(getVal(15)),
      alt_15_odd: cleanNumber(getVal(16)),
      ust_15_odd: cleanNumber(getVal(17)),
      alt_25_odd: cleanNumber(getVal(18)),
      ust_25_odd: cleanNumber(getVal(19)),
      alt_35_odd: cleanNumber(getVal(20)),
      ust_35_odd: cleanNumber(getVal(21)),
      alt_45_odd: cleanNumber(getVal(22)),
      ust_45_odd: cleanNumber(getVal(23)),
      iy_05_alt_odd: cleanNumber(getVal(24)),
      iy_05_ust_odd: cleanNumber(getVal(25)),
      iy_15_alt_odd: cleanNumber(getVal(26)),
      iy_15_ust_odd: cleanNumber(getVal(27)),
      tg_0_1_odd: cleanNumber(getVal(28)),
      tg_2_3_odd: cleanNumber(getVal(29)),
      tg_4_5_odd: cleanNumber(getVal(30)),
      tg_6_plus_odd: cleanNumber(getVal(31)),
      kg_var_odd: cleanNumber(getVal(32)),
      kg_yok_odd: cleanNumber(getVal(33))
    };

    parsedMatches.push(item);
  }

  console.log(`Parse Edilen Maç: ${parsedMatches.length} | Atlanan Boş/Geçersiz: ${skippedCount}`);

  // Deduplicate in-memory by key
  const uniqueMap = new Map();
  parsedMatches.forEach(m => {
    const key = `${m.home_team}__${m.away_team}__${m.match_date}`;
    uniqueMap.set(key, m);
  });
  const uniqueList = Array.from(uniqueMap.values());
  console.log(`Benzersiz Maç Sayısı: ${uniqueList.length}`);

  // High-concurrency batch insert into Supabase
  const CHUNK_SIZE = 500;
  const CONCURRENCY = 6;
  const chunks = [];
  for (let i = 0; i < uniqueList.length; i += CHUNK_SIZE) {
    chunks.push(uniqueList.slice(i, i + CHUNK_SIZE));
  }

  console.log(`\n${uniqueList.length} maç, ${chunks.length} paket halinde (eşzamanlı ${CONCURRENCY} bağlantı ile) yükleniyor...`);

  let successCount = 0;
  const importStart = Date.now();

  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const currentBatch = chunks.slice(i, i + CONCURRENCY);
    const results = await Promise.all(currentBatch.map(chunk => batchUpsert(chunk)));
    results.forEach(cnt => successCount += cnt);

    const percent = ((successCount / uniqueList.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - importStart) / 1000).toFixed(0);
    const speed = (successCount / (elapsed || 1)).toFixed(0);
    console.log(`  [${percent}%] ${successCount}/${uniqueList.length} maç yüklendi (${speed} maç/sn, geçen süre: ${elapsed} sn)`);
  }

  console.log(`\n==================================================`);
  console.log(`TAMAMLANDI! Toplam ${successCount} maç Supabase veritabanına başarıyla aktarıldı.`);
  console.log(`Toplam Geçen Süre: ${((Date.now() - startTime) / 1000).toFixed(1)} saniye.`);
  console.log(`==================================================`);
}

run().catch(console.error);
