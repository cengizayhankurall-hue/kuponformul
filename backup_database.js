require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase env missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportTable(tableName, backupDir) {
  console.log(`[Backup] Backing up table "${tableName}"...`);
  let allRows = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + step - 1);

    if (error) {
      console.warn(`Table "${tableName}" select warning/error:`, error.message);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRows.push(...data);
      from += step;
      if (data.length < step) {
        hasMore = false;
      }
      process.stdout.write(`  Fetched ${allRows.length} rows...\r`);
    }
  }

  const filePath = path.join(backupDir, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(allRows, null, 2), 'utf-8');
  console.log(`\n[Backup] Saved ${allRows.length} rows to ${filePath} (${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB)`);
  return allRows.length;
}

async function run() {
  const backupDir = path.join(__dirname, 'backup_db_20260817');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const tables = [
    'past_matches',
    'saved_coupons',
    'iddaa_saved_coupons',
    'user_profiles',
    'news_announcements'
  ];

  console.log(`==================================================`);
  console.log(`SUPABASE VERITABANI TAM YEDEKLEME BASLATILIYOR`);
  console.log(`Klasör: ${backupDir}`);
  console.log(`==================================================`);

  const summary = {};
  for (const table of tables) {
    try {
      summary[table] = await exportTable(table, backupDir);
    } catch (err) {
      console.error(`Error backing up ${table}:`, err);
    }
  }

  fs.writeFileSync(path.join(backupDir, 'backup_summary.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    tables: summary
  }, null, 2));

  console.log(`\n==================================================`);
  console.log(`VERITABANI YEDEKLERI BASARIYLA ALINDI!`);
  console.log(`==================================================`);
  console.log(summary);
}

run().catch(console.error);
