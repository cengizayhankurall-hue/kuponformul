const path = require('path');
const xlsx = require('xlsx');

async function run() {
  const filePath = path.join(__dirname, 'oran.xlsb');
  const fullWb = xlsx.readFile(filePath, { sheetRows: 2 });
  const firstSheet = fullWb.Sheets['Arsiv'];
  const rows = xlsx.utils.sheet_to_json(firstSheet, { header: 1 });

  const headers = rows[0];
  const sampleRow = rows[1];

  console.log(`Total Columns: ${headers.length}`);
  console.log('\n--- ALL COLUMNS & SAMPLE VALUES ---');
  headers.forEach((h, idx) => {
    if (h || (sampleRow && sampleRow[idx] !== undefined)) {
      console.log(`[Col ${idx}] Header: "${h || 'EMPTY'}" | Sample: ${sampleRow ? JSON.stringify(sampleRow[idx]) : 'N/A'}`);
    }
  });
}

run().catch(console.error);
