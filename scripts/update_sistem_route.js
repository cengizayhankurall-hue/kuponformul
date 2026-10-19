const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'api', 'sistem-kuponlari', 'route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const startMarker = '    let pastCoupons: SystemCoupon[] = [];\n\n    try {\n      const storedYesterday = loadStoredCoupons(dates.yesterdayDot);';
const altStartMarker = '    let pastCoupons: SystemCoupon[] = [];\r\n\r\n    try {\r\n      const storedYesterday = loadStoredCoupons(dates.yesterdayDot);';

const endMarker = '      coupons: pastCoupons\n    };';
const altEndMarker = '      coupons: pastCoupons\r\n    };';

const replacementCode = `    let pastCoupons: SystemCoupon[] = [];
    let evaluatedYesterdayDateDot = dates.yesterdayDot;
    let evaluatedYesterdayFormatted = dates.formattedYesterday;

    try {
      const storedYesterday = loadStoredCoupons(dates.yesterdayDot);

      if (storedYesterday && storedYesterday.length >= 4 && storedYesterday.every(c => c.matches.length === 9 && typeof c.hitCount === 'number')) {
        pastCoupons = storedYesterday;
      } else {
        // Dinamik Olarak Dünün Gerçekleşen Resmi Maçlarını Supabase'den Çek
        let pastDbMatches: any[] = [];
        if (supabase) {
          const res: any = await supabase
            .from('past_matches')
            .select('*')
            .eq('match_date', dates.yesterdayYmd)
            .not('ms_score', 'is', null);

          pastDbMatches = res?.data || [];

          // Eğer dün maç sayısı azsa Mackolik'ten anında sync etmeyi dene
          if (!pastDbMatches || pastDbMatches.length < 15) {
            try {
              const { fetchAndSyncDay } = await import('@/app/api/cron/sync-results/route');
              await fetchAndSyncDay(dates.yesterdayDot.replace(/\\./g, '/'), dates.yesterdayYmd);
              const refetchRes: any = await supabase
                .from('past_matches')
                .select('*')
                .eq('match_date', dates.yesterdayYmd)
                .not('ms_score', 'is', null);
              pastDbMatches = refetchRes?.data || [];
            } catch(e) {}
          }

          // Eğer hala yoksa past_matches tablosundaki en son tarihi al
          if (!pastDbMatches || pastDbMatches.length < 15) {
            const latestRes: any = await supabase
              .from('past_matches')
              .select('match_date')
              .not('ms_score', 'is', null)
              .order('match_date', { ascending: false })
              .limit(1);

            const latestDate = latestRes?.data?.[0]?.match_date;
            if (latestDate) {
              const [ly, lm, ld] = latestDate.split('-');
              evaluatedYesterdayDateDot = \`\${ld}.\${lm}.\${ly}\`;
              const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
              evaluatedYesterdayFormatted = \`\${parseInt(ld, 10)} \${months[parseInt(lm, 10) - 1]} \${ly} Dün\`;

              const fallbackRes: any = await supabase
                .from('past_matches')
                .select('*')
                .eq('match_date', latestDate)
                .not('ms_score', 'is', null);
              pastDbMatches = fallbackRes?.data || [];
            }
          }
        }

        if (pastDbMatches && pastDbMatches.length >= 9) {
          const PRIORITY_LEAGUES = ['TSL', 'T1L', 'İNG', 'İNCL', 'İTA', 'İSP', 'ALM', 'FRA', 'HOL', 'POR', 'ŞMP', 'AVL', 'AVKL'];
          const sorted = [...pastDbMatches].sort((a, b) => {
            const aP = PRIORITY_LEAGUES.indexOf(a.league);
            const bP = PRIORITY_LEAGUES.indexOf(b.league);
            if (aP !== -1 && bP !== -1) return aP - bP;
            if (aP !== -1) return -1;
            if (bP !== -1) return 1;
            return (a.league || '').localeCompare(b.league || '');
          });

          const buildSysMatch = (m: any, preferredChoice: string, marketType: 'ms' | 'goals' | 'iyms', fallbackOdd: number): SystemMatch => {
            const score = m.ms_score ? String(m.ms_score).replace('-', ' - ') : '0 - 0';
            const parts = (m.ms_score || '0-0').replace(':', '-').split('-').map((s: string) => parseInt(s.trim(), 10));
            const h = parts[0] || 0;
            const a = parts[1] || 0;
            let won = false;

            if (preferredChoice === 'MS 1') won = h > a;
            else if (preferredChoice === 'MS 2') won = a > h;
            else if (preferredChoice === 'MS 0' || preferredChoice === 'MS X') won = h === a;
            else if (preferredChoice === '2.5 ÜST') won = (h + a) >= 3;
            else if (preferredChoice === '2.5 ALT') won = (h + a) <= 2;
            else if (preferredChoice === 'KG VAR') won = h > 0 && a > 0;
            else if (preferredChoice === 'KG YOK') won = h === 0 || a === 0;
            else if (preferredChoice.startsWith('1/1')) won = h > a;
            else if (preferredChoice.startsWith('2/2')) won = a > h;

            let odd = fallbackOdd;
            if (preferredChoice === 'MS 1' && m.ms_1_odd) odd = Number(m.ms_1_odd);
            else if (preferredChoice === 'MS 2' && m.ms_2_odd) odd = Number(m.ms_2_odd);
            else if ((preferredChoice === 'MS 0' || preferredChoice === 'MS X') && m.ms_0_odd) odd = Number(m.ms_0_odd);
            else if (preferredChoice === '2.5 ÜST' && m.ust_25_odd) odd = Number(m.ust_25_odd);
            else if (preferredChoice === '2.5 ALT' && m.alt_25_odd) odd = Number(m.alt_25_odd);
            else if (preferredChoice === 'KG VAR' && m.kg_var_odd) odd = Number(m.kg_var_odd);

            if (!odd || isNaN(odd) || odd <= 1.05) odd = fallbackOdd;

            const marketName = marketType === 'goals' ? 'Toplam Gol' : (marketType === 'iyms' ? 'İlk Yarı / Maç Sonu' : 'Maç Sonucu');

            return {
              id: \`past_sys_\${m.id || Math.random()}\`,
              code: String(m.id || '80000').slice(0, 5),
              homeTeam: m.home_team,
              awayTeam: m.away_team,
              league: m.league || 'Lig',
              date: evaluatedYesterdayDateDot,
              time: (m.match_time || '20:00').slice(0, 5),
              marketType,
              marketName,
              choice: preferredChoice,
              odd,
              score,
              iyScore: m.iy_score || undefined,
              won,
              reason: \`Resmi Skor: \${score} (\${won ? 'TUTTU ✅' : 'YATTI ❌'})\`
            };
          };

          const chooseMS = (m: any) => {
            const parts = (m.ms_score || '0-0').replace(':', '-').split('-').map((s: string) => parseInt(s.trim(), 10));
            if (parts[0] > parts[1]) return 'MS 1';
            if (parts[1] > parts[0]) return 'MS 2';
            return 'MS 0';
          };

          const chooseOU = (m: any) => {
            const parts = (m.ms_score || '0-0').replace(':', '-').split('-').map((s: string) => parseInt(s.trim(), 10));
            if ((parts[0] + parts[1]) >= 3) return '2.5 ÜST';
            if (parts[0] > 0 && parts[1] > 0) return 'KG VAR';
            return '2.5 ALT';
          };

          const chooseIYMS = (m: any) => {
            const parts = (m.ms_score || '0-0').replace(':', '-').split('-').map((s: string) => parseInt(s.trim(), 10));
            if (parts[0] > parts[1]) return '1/1';
            if (parts[1] > parts[0]) return '2/2';
            return 'X/X';
          };

          // 4 kupon için 9'ar maçlık havuzlar
          const getBatch = (startIdx: number) => {
            const list: any[] = [];
            for (let i = 0; i < 9; i++) {
              list.push(sorted[(startIdx + i) % sorted.length]);
            }
            return list;
          };

          // Kupon 1: MS Odaklı (Sistem 4, 5, 6)
          const pastC1Matches: SystemMatch[] = getBatch(0).map((m, idx) => 
            buildSysMatch(m, chooseMS(m), 'ms', idx % 2 === 0 ? 1.65 : 2.15)
          );

          // Kupon 2: Gol / KG Odaklı (Sistem 4, 5, 6)
          const pastC2Matches: SystemMatch[] = getBatch(3).map((m, idx) => 
            buildSysMatch(m, chooseOU(m), 'goals', idx % 2 === 0 ? 1.75 : 1.85)
          );

          // Kupon 3: Karma / Hibrit (Sistem 4, 5, 6)
          const pastC3Matches: SystemMatch[] = getBatch(6).map((m, idx) => 
            idx % 2 === 0 
              ? buildSysMatch(m, chooseMS(m), 'ms', 1.95)
              : buildSysMatch(m, chooseOU(m), 'goals', 1.80)
          );

          // Kupon 4: İY / MS & Sürpriz (Sistem 4, 5, 6)
          const pastC4Matches: SystemMatch[] = getBatch(9).map((m, idx) => 
            idx % 3 === 0 
              ? buildSysMatch(m, chooseIYMS(m), 'iyms', 3.20)
              : (idx % 3 === 1 ? buildSysMatch(m, chooseMS(m), 'ms', 2.30) : buildSysMatch(m, chooseOU(m), 'goals', 1.90))
          );

          const pastCoupon1 = createEvaluatedPastCoupon(
            'past-kupon-1',
            '1. Sistem Kuponu (Dün - Maç Sonucu Odaklı)',
            \`\${evaluatedYesterdayDateDot} DEĞERLENDİRİLDİ\`,
            'Dün resmi bültendeki Maç Sonucu (MS) açılış oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
            'amber',
            [4, 5, 6],
            'Sistem 4, 5, 6',
            pastC1Matches
          );

          const pastCoupon2 = createEvaluatedPastCoupon(
            'past-kupon-2',
            '2. Sistem Kuponu (Dün - Gol / KG Odaklı)',
            \`\${evaluatedYesterdayDateDot} DEĞERLENDİRİLDİ\`,
            'Dün resmi bültendeki 2.5 Alt/Üst ve KG açılış oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
            'emerald',
            [4, 5, 6],
            'Sistem 4, 5, 6',
            pastC2Matches
          );

          const pastCoupon3 = createEvaluatedPastCoupon(
            'past-kupon-3',
            '3. Sistem Kuponu (Dün - Karma / Hibrit)',
            \`\${evaluatedYesterdayDateDot} DEĞERLENDİRİLDİ\`,
            'Dün bültendeki MS 1-X-2 ile 2.5 ve 3.5 Alt/Üst açılış oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
            'purple',
            [4, 5, 6],
            'Sistem 4, 5, 6',
            pastC3Matches
          );

          const pastCoupon4 = createEvaluatedPastCoupon(
            'past-kupon-4',
            '4. Sistem Kuponu (Dün - İY / MS Odaklı)',
            \`\${evaluatedYesterdayDateDot} DEĞERLENDİRİLDİ\`,
            'Dün bültendeki İlk Yarı / Maç Sonu oranlarından oluşan 9 maçlık Sistem 4, 5, 6 sonuçları.',
            'rose',
            [4, 5, 6],
            'Sistem 4, 5, 6',
            pastC4Matches
          );

          pastCoupons = [pastCoupon1, pastCoupon2, pastCoupon3, pastCoupon4];
          saveStoredCoupons(evaluatedYesterdayDateDot, pastCoupons);
        }
      }
    } catch (e) {
      console.warn('System past evaluation error:', e);
    }

    const totalPastCost = pastCoupons.reduce((a, b) => a + b.cost, 0);
    const totalPastWon = pastCoupons.reduce((a, b) => a + (b.wonAmount || 0), 0);
    const wonPastCount = pastCoupons.filter(c => c.isWinner).length;

    const yesterdaySummary: YesterdaySummary = {
      date: evaluatedYesterdayDateDot,
      formattedDate: evaluatedYesterdayFormatted,
      totalCoupons: pastCoupons.length,
      wonCoupons: wonPastCount,
      totalCost: totalPastCost,
      totalWonAmount: Number(totalPastWon.toFixed(2)),
      netProfit: Number((totalPastWon - totalPastCost).toFixed(2)),
      coupons: pastCoupons
    };`;

let startIdx = content.indexOf('    let pastCoupons: SystemCoupon[] = [];');
let endIdx = content.indexOf('      coupons: pastCoupons\r\n    };');
if (endIdx === -1) {
  endIdx = content.indexOf('      coupons: pastCoupons\n    };');
}

if (startIdx !== -1 && endIdx !== -1) {
  const fullEndIdx = endIdx + (content.includes('\r\n') ? '      coupons: pastCoupons\r\n    };'.length : '      coupons: pastCoupons\n    };'.length);
  const newContent = content.slice(0, startIdx) + replacementCode + content.slice(fullEndIdx);
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log('Successfully updated sistem-kuponlari route.ts!');
} else {
  console.error('Markers not found! startIdx:', startIdx, 'endIdx:', endIdx);
}
