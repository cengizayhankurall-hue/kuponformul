import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { dbService, PastMatch } from '@/lib/supabase';

function parseExcelDate(excelDate: any): Date | null {
  if (!excelDate) return null;
  // If it's a number, it's an Excel serial date
  if (typeof excelDate === 'number') {
    return new Date((excelDate - (25567 + 2)) * 86400 * 1000);
  }
  // If string (e.g. "14.01.2026")
  if (typeof excelDate === 'string') {
    const parts = excelDate.split('.');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
    }
  }
  return null;
}

function parseExcelTime(excelTime: any): string | null {
  if (excelTime == null || excelTime === '') return null;
  
  if (typeof excelTime === 'number') {
    // Excel time is a fraction of 24 hours
    let totalSeconds = Math.round(excelTime * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  }
  
  if (typeof excelTime === 'string') {
    // Check if it looks like "19:30"
    if (excelTime.includes(':')) {
        const parts = excelTime.split(':');
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
        }
    }
  }
  
  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Header row is 1 (index 0) but maybe the user's excel is different
    // Read raw data
    const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    const pastMatches: PastMatch[] = [];
    let lastSeenDateStr = new Date().toISOString().split('T')[0];

    // Sütun yapılarını Excel görseline göre eşleştiriyoruz
    // TARIH, SAAT, LİG, KOD, EV SAHİBİ, DEPLASMAN, İY, MS
    // 0: TARIH, 1: SAAT, 2: LİG, 3: KOD, 4: EV SAHİBİ, 5: DEPLASMAN, 6: İY, 7: MS
    // MS 1 (8), MS 0 (9), MS 2 (10), vb...
    // The exact columns depend on the user's excel file, we'll map common titles if possible or just use indexes if fixed.
    // Assuming fixed indexes based on standard iddaa excel:
    // 0=Tarih, 1=Saat, 2=Lig, 3=Kod, 4=Ev Sahibi, 5=Deplasman, 6=İY, 7=MS, 8=MS1, 9=MS0, 10=MS2, 11=Alt, 12=Üst, vb.

    // find header row index (where 'TARIH' or 'SAAT' appears)
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(data.length, 20); i++) {
        if (data[i] && (data[i].includes('TARIH') || data[i].includes('Tarih') || data[i].includes('SAAT'))) {
            headerRowIdx = i;
            break;
        }
    }

    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 1; // skip header
    const headers = headerRowIdx >= 0 ? data[headerRowIdx] : [];

    // Helper to find column index (strict matching to avoid false positives)
    const findCol = (keys: string[]) => {
        if (headers.length === 0) return -1;
        return headers.findIndex((h: string) => {
            if (!h) return false;
            const hStr = h.toString().toUpperCase().replace(/\s+/g, ''); // remove all spaces
            return keys.some(k => {
                const kStr = k.toUpperCase().replace(/\s+/g, '');
                return hStr === kStr; // require exact match after removing spaces
            });
        });
    };

    // Detect columns
    const colIdx = {
        date: findCol(['TARIH', 'TARİH', 'DATE']),
        time: findCol(['SAAT', 'TIME']),
        league: findCol(['LİG', 'LIG', 'LEAGUE']),
        home: findCol(['EV SAHİBİ', 'EV', 'HOME', 'TAKIM 1', 'TAKIM1']),
        away: findCol(['DEPLASMAN', 'AWAY', 'TAKIM 2', 'TAKIM2']),
        iyScore: findCol(['İY', 'IY', 'HT SCORE', 'HT']),
        msScore: findCol(['MS', 'FT SCORE', 'FT', 'SKOR']),
        ms1: findCol(['MS 1', 'MS1']),
        ms0: findCol(['MS 0', 'MS X', 'MS0', 'MSX']),
        ms2: findCol(['MS 2', 'MS2']),
        iy1: findCol(['İY 1', 'IY 1', 'IY1']),
        iy0: findCol(['İY 0', 'IY 0', 'İY X', 'IY X', 'IYX', 'IY0']),
        iy2: findCol(['İY 2', 'IY 2', 'IY2']),
        cs1x: findCol(['1-X', '1X', 'ÇS 1-X']),
        cs12: findCol(['1-2', '12', 'ÇS 1-2']),
        csx2: findCol(['X-2', 'X2', 'ÇS X-2']),
        alt15: findCol(['1.5 ALT', '1.5ALT']),
        ust15: findCol(['1.5 ÜST', '1.5ÜST', '1.5UST']),
        alt35: findCol(['3.5 ALT', '3.5ALT']),
        ust35: findCol(['3.5 ÜST', '3.5ÜST', '3.5UST']),
        iy15alt: findCol(['İY 1.5 ALT', 'IY 1.5 ALT', 'IY1.5A', 'İY1.5A', 'IY1.5ALT']),
        iy15ust: findCol(['İY 1.5 ÜST', 'IY 1.5 ÜST', 'IY1.5Ü', 'İY1.5Ü', 'IY1.5U', 'IY1.5UST']),
        alt: findCol(['ALT 2.5', '2.5 ALT', '2.5ALT']),
        ust: findCol(['ÜST 2.5', '2.5 ÜST', '2.5ÜST', '2.5UST', 'UST 2.5']),
        kgVar: findCol(['KG VAR', 'KGVAR']),
        kgYok: findCol(['KG YOK', 'KGYOK'])
    };

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const rawDate = colIdx.date >= 0 ? row[colIdx.date] : row[0];
      const parsedDate = parseExcelDate(rawDate);
      if (parsedDate) {
        lastSeenDateStr = parsedDate.toISOString().split('T')[0];
      }

      // Fallbacks mapped to user's Excel structure
      // D:3=TAKIM 1, E:4=TAKIM 2, F:5=IY, G:6=MS
      const homeTeam = colIdx.home >= 0 ? row[colIdx.home] : row[3];
      const awayTeam = colIdx.away >= 0 ? row[colIdx.away] : row[4];
      const msScore = colIdx.msScore >= 0 ? row[colIdx.msScore] : row[6];

      if (homeTeam && awayTeam && msScore && msScore.includes('-')) {
        const iyScore = colIdx.iyScore >= 0 ? row[colIdx.iyScore] : row[5];
        const league = colIdx.league >= 0 ? row[colIdx.league] : row[2];
        const matchTime = colIdx.time >= 0 ? row[colIdx.time] : row[1];
        
        const safeParseOdd = (val: any) => {
            if (val == null || val === '') return null;
            const num = parseFloat(String(val).replace(',', '.'));
            return !isNaN(num) && num > 0 && num <= 999.99 ? num : null;
        };

        const parsedTime = parseExcelTime(colIdx.time >= 0 ? row[colIdx.time] : row[1]);

        pastMatches.push({
          match_date: lastSeenDateStr,
          match_time: parsedTime || undefined,
          home_team: homeTeam,
          away_team: awayTeam,
          league: league || null,
          ms_score: msScore,
          iy_score: iyScore || null,
          ms_1_odd: colIdx.ms1 >= 0 ? safeParseOdd(row[colIdx.ms1]) : safeParseOdd(row[7]),
          ms_0_odd: colIdx.ms0 >= 0 ? safeParseOdd(row[colIdx.ms0]) : safeParseOdd(row[8]),
          ms_2_odd: colIdx.ms2 >= 0 ? safeParseOdd(row[colIdx.ms2]) : safeParseOdd(row[9]),
          iy_1_odd: colIdx.iy1 >= 0 ? safeParseOdd(row[colIdx.iy1]) : safeParseOdd(row[10]),
          iy_0_odd: colIdx.iy0 >= 0 ? safeParseOdd(row[colIdx.iy0]) : safeParseOdd(row[11]),
          iy_2_odd: colIdx.iy2 >= 0 ? safeParseOdd(row[colIdx.iy2]) : safeParseOdd(row[12]),
          kg_var_odd: colIdx.kgVar >= 0 ? safeParseOdd(row[colIdx.kgVar]) : safeParseOdd(row[13]),
          kg_yok_odd: colIdx.kgYok >= 0 ? safeParseOdd(row[colIdx.kgYok]) : safeParseOdd(row[14]),
          cs_1x_odd: colIdx.cs1x >= 0 ? safeParseOdd(row[colIdx.cs1x]) : safeParseOdd(row[15]),
          cs_12_odd: colIdx.cs12 >= 0 ? safeParseOdd(row[colIdx.cs12]) : safeParseOdd(row[16]),
          cs_x2_odd: colIdx.csx2 >= 0 ? safeParseOdd(row[colIdx.csx2]) : safeParseOdd(row[17]),
          iy_15_alt_odd: colIdx.iy15alt >= 0 ? safeParseOdd(row[colIdx.iy15alt]) : safeParseOdd(row[18]),
          iy_15_ust_odd: colIdx.iy15ust >= 0 ? safeParseOdd(row[colIdx.iy15ust]) : safeParseOdd(row[19]),
          alt_15_odd: colIdx.alt15 >= 0 ? safeParseOdd(row[colIdx.alt15]) : safeParseOdd(row[20]),
          ust_15_odd: colIdx.ust15 >= 0 ? safeParseOdd(row[colIdx.ust15]) : safeParseOdd(row[21]),
          alt_25_odd: colIdx.alt >= 0 ? safeParseOdd(row[colIdx.alt]) : safeParseOdd(row[22]),
          ust_25_odd: colIdx.ust >= 0 ? safeParseOdd(row[colIdx.ust]) : safeParseOdd(row[23]),
          alt_35_odd: colIdx.alt35 >= 0 ? safeParseOdd(row[colIdx.alt35]) : safeParseOdd(row[24]),
          ust_35_odd: colIdx.ust35 >= 0 ? safeParseOdd(row[colIdx.ust35]) : safeParseOdd(row[25]),
        });
      }
    }

    // Deduplicate array before inserting to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const uniqueMatchesMap = new Map<string, PastMatch>();
    for (const match of pastMatches) {
        const key = `${match.home_team}-${match.away_team}-${match.match_date}`;
        uniqueMatchesMap.set(key, match);
    }
    const uniquePastMatches = Array.from(uniqueMatchesMap.values());

    if (uniquePastMatches.length > 0) {
      // Chunking if too large
      const CHUNK_SIZE = 500;
      for (let i = 0; i < uniquePastMatches.length; i += CHUNK_SIZE) {
        const chunk = uniquePastMatches.slice(i, i + CHUNK_SIZE);
        const { error } = await dbService.insertPastMatches(chunk);
        if (error) {
          console.error('[Upload] Insert error chunk:', error);
          throw new Error('Veritabanına eklerken hata: ' + error.message);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${uniquePastMatches.length} maç veritabanına başarıyla eklendi. (Düzeltilen Çift Kayıtlar Hariç)` 
    });

  } catch (error: any) {
    console.error('[Upload] Error processing excel:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
