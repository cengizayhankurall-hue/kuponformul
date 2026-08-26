require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function cleanWord(w) {
  return w.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/i/g, 'i').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function wordsMatch(w1, w2) {
  if (w1 === w2) return true;
  if (w1.length >= 4 && w2.length >= 4) {
    if (w1.startsWith(w2) || w2.startsWith(w1)) return true;
    if (w1.includes(w2) || w2.includes(w1)) return true;
  }
  const s1 = w1.replace(/sh/g, 's');
  const s2 = w2.replace(/sh/g, 's');
  if (s1 === s2) return true;
  if (s1.length >= 4 && s2.length >= 4 && (s1.startsWith(s2) || s2.startsWith(s1))) return true;
  return false;
}

const ALIASES = [
  ['dac', 'dunajska streda'],
  ['dac 1904', 'dunajska streda']
];

function isTeamMatch(teamA, teamB) {
  if (!teamA || !teamB) return false;
  const rawA = teamA.toLowerCase();
  const rawB = teamB.toLowerCase();

  for (const [a1, a2] of ALIASES) {
    if ((rawA.includes(a1) && rawB.includes(a2)) || (rawA.includes(a2) && rawB.includes(a1))) {
      return true;
    }
  }

  const ignoreWords = new Set(['fc', 'nk', 'kf', 'ask', 'nsi', 'hb', 'fk', 'sk', 'jk', 'cd', 'sc']);
  const wordsA = teamA.split(/[\s\-\.\/]+/).map(cleanWord).filter(w => w.length > 0 && !ignoreWords.has(w));
  const wordsB = teamB.split(/[\s\-\.\/]+/).map(cleanWord).filter(w => w.length > 0 && !ignoreWords.has(w));

  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wordsMatch(wa, wb)) return true;
    }
  }
  return false;
}

function evaluatePick(rawPickLabel, homeGoals, awayGoals, iyHomeGoals, iyAwayGoals) {
  if (!rawPickLabel) return { isEvaluated: false, won: false };
  let label = rawPickLabel.toUpperCase().replace(/,/g, '.').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/İ/g, 'I').replace(/I/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C').replace(/OST/g, 'UST').replace(/\uFFFD/g, 'U').trim();
  const totalGoals = homeGoals + awayGoals;

  if (label.includes('IY') || label.includes('ILK YARI')) {
    if (iyHomeGoals === null || iyAwayGoals === null || isNaN(iyHomeGoals) || isNaN(iyAwayGoals)) {
      return { isEvaluated: false, won: false };
    }
    if (label.endsWith(' 1') || label.endsWith('- 1') || label.endsWith('1') || label.includes(' 1 ') || label.includes(' MS 1')) return { isEvaluated: true, won: iyHomeGoals > iyAwayGoals };
    if (label.endsWith(' X') || label.endsWith('- X') || label.endsWith('X') || label.endsWith(' 0') || label.endsWith('- 0') || label.endsWith('0')) return { isEvaluated: true, won: iyHomeGoals === iyAwayGoals };
    if (label.endsWith(' 2') || label.endsWith('- 2') || label.endsWith('2')) return { isEvaluated: true, won: iyAwayGoals > iyHomeGoals };
  }

  if (label.includes('KG VAR') || label.includes('KG_VAR') || label === 'KG') return { isEvaluated: true, won: homeGoals > 0 && awayGoals > 0 };
  if (label.includes('KG YOK') || label.includes('KG_YOK')) return { isEvaluated: true, won: homeGoals === 0 || awayGoals === 0 };

  if (label.includes('1.5 UST') || label.includes('1.5UST')) return { isEvaluated: true, won: totalGoals > 1.5 };
  if (label.includes('1.5 ALT') || label.includes('1.5ALT')) return { isEvaluated: true, won: totalGoals < 1.5 };
  if (label.includes('2.5 UST') || label.includes('2.5UST')) return { isEvaluated: true, won: totalGoals > 2.5 };
  if (label.includes('2.5 ALT') || label.includes('2.5ALT')) return { isEvaluated: true, won: totalGoals < 2.5 };
  if (label.includes('3.5 UST') || label.includes('3.5UST')) return { isEvaluated: true, won: totalGoals > 3.5 };
  if (label.includes('3.5 ALT') || label.includes('3.5ALT')) return { isEvaluated: true, won: totalGoals < 3.5 };

  if (label.includes('MS 1') || label.includes('MS-1') || label === 'MS1' || label === '1') return { isEvaluated: true, won: homeGoals > awayGoals };
  if (label.includes('MS X') || label.includes('MS-X') || label.includes('MS 0') || label.includes('MS-0') || label === 'MS0' || label === '0' || label === 'X') return { isEvaluated: true, won: homeGoals === awayGoals };
  if (label.includes('MS 2') || label.includes('MS-2') || label === 'MS2' || label === '2') return { isEvaluated: true, won: awayGoals > homeGoals };

  return { isEvaluated: false, won: false };
}

async function inspectCoupons() {
  console.log('Fetching all saved coupons from iddaa_saved_coupons table...');
  const { data: coupons, error } = await supabase.from('iddaa_saved_coupons').select('*');
  if (error) {
    console.error('Error fetching coupons:', error);
    return;
  }

  console.log(`Found ${coupons.length} coupons in database.`);
  for (const c of coupons) {
    console.log(`\nCoupon ID: ${c.id} | User ID: ${c.user_id} | Created At: ${c.created_at} | Status: ${c.status}`);
    console.log('Matches in coupon:', c.matches);
  }

  // Now evaluate
  const { data: pastMatches } = await supabase.from('past_matches').select('home_team, away_team, ms_score, iy_score, match_date').order('match_date', { ascending: false }).limit(5000);

  for (const coupon of coupons) {
    let allWon = true;
    let anyPending = false;
    let matchesChanged = false;
    let hasLost = false;

    const updatedMatches = coupon.matches.map((m) => {
      const matchResult = pastMatches.find(p => isTeamMatch(p.home_team, m.homeTeam) && isTeamMatch(p.away_team, m.awayTeam));
      if (matchResult && matchResult.ms_score) {
        console.log(`Matched "${m.homeTeam} vs ${m.awayTeam}" with DB match "${matchResult.home_team} vs ${matchResult.away_team}" (Score: ${matchResult.ms_score})`);
        const scores = matchResult.ms_score.split('-').map(Number);
        const iyScores = matchResult.iy_score ? matchResult.iy_score.split('-').map(Number) : [null, null];
        if (scores.length === 2 && !isNaN(scores[0]) && !isNaN(scores[1])) {
          const homeGoals = scores[0];
          const awayGoals = scores[1];
          const iyHomeGoals = (iyScores.length === 2 && iyScores[0] !== null && !isNaN(iyScores[0])) ? iyScores[0] : null;
          const iyAwayGoals = (iyScores.length === 2 && iyScores[1] !== null && !isNaN(iyScores[1])) ? iyScores[1] : null;

          const { isEvaluated, won } = evaluatePick(m.pickLabel, homeGoals, awayGoals, iyHomeGoals, iyAwayGoals);
          if (isEvaluated) {
            m.msScore = matchResult.ms_score;
            m.iyScore = matchResult.iy_score;
            if (won) {
              m.result = 'won';
            } else {
              m.result = 'lost';
              allWon = false;
              hasLost = true;
            }
            matchesChanged = true;
          } else {
            anyPending = true;
          }
        } else {
          anyPending = true;
        }
      } else {
        console.log(`NO DB MATCH FOUND for "${m.homeTeam} vs ${m.awayTeam}"`);
        anyPending = true;
      }

      if (m.result === 'lost') {
        allWon = false;
        hasLost = true;
      }
      return m;
    });

    const newStatus = hasLost ? 'lost' : (anyPending ? 'pending' : 'won');
    console.log(`New evaluated status for coupon ${coupon.id}: ${newStatus}`);

    const { error: updateErr } = await supabase.from('iddaa_saved_coupons').update({ status: newStatus, matches: updatedMatches }).eq('id', coupon.id);
    if (updateErr) {
      console.error('Update error for coupon:', updateErr);
    } else {
      console.log(`Successfully updated coupon ${coupon.id} status to '${newStatus}'! ✅`);
    }
  }
}

inspectCoupons();
