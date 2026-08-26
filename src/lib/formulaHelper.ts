export interface MatchPrediction {
  matchIndex: number; // 0 to 14
  selected: string[]; // ['1', 'X', '2']
  probabilities: number[]; // [pct1, pctx, pct2] (e.g. [60, 25, 15])
}

export interface FilterSettings {
  homeWins: [number, number]; // [min, max]
  draws: [number, number]; // [min, max]
  awayWins: [number, number]; // [min, max]
  maxConsecutiveHome: number;
  maxConsecutiveDraw: number;
  maxConsecutiveAway: number;
  probabilitySum: [number, number]; // [min, max], e.g. [500, 900]
  favoriteLosses?: [number, number]; // [min, max]
}

// İddaa oranlarını (1, X, 2) matematiksel yüzdelere (% olasılıklara) dönüştüren yardımcı fonksiyon
export function calculateOddsProbabilities(odds?: [string, string, string] | string[] | null, fallbackProbs?: [number, number, number] | number[]): [number, number, number] {
  if (!odds || !odds[0] || !odds[1] || !odds[2]) {
    return (fallbackProbs && fallbackProbs.length === 3) ? [fallbackProbs[0], fallbackProbs[1], fallbackProbs[2]] : [34, 33, 33];
  }
  const o1 = parseFloat(String(odds[0]).replace(',', '.')) || 0;
  const oX = parseFloat(String(odds[1]).replace(',', '.')) || 0;
  const o2 = parseFloat(String(odds[2]).replace(',', '.')) || 0;

  if (o1 <= 1 || oX <= 1 || o2 <= 1) {
    return (fallbackProbs && fallbackProbs.length === 3) ? [fallbackProbs[0], fallbackProbs[1], fallbackProbs[2]] : [34, 33, 33];
  }

  const raw1 = 1 / o1;
  const rawX = 1 / oX;
  const raw2 = 1 / o2;
  const total = raw1 + rawX + raw2;

  if (total <= 0) {
    return (fallbackProbs && fallbackProbs.length === 3) ? [fallbackProbs[0], fallbackProbs[1], fallbackProbs[2]] : [34, 33, 33];
  }

  const p1 = Math.round((raw1 / total) * 100);
  const pX = Math.round((rawX / total) * 100);
  const p2 = Math.max(0, 100 - p1 - pX);

  return [p1, pX, p2];
}

// İddaa oranlarına göre 25.000 TL (2.500 Kolon) tavanlı 3 kademeli akıllı Toto kuponu üretici
export function generateSmartIddaaSelections(matches: any[], maxColumns = 2500): string[][] {
  if (!matches || matches.length === 0) return [];

  const analyzed = matches.map((m, idx) => {
    const probs = calculateOddsProbabilities(m.odds, m.probabilities);
    const p1 = probs[0] || 33;
    const px = probs[1] || 33;
    const p2 = probs[2] || 34;

    const sorted = [
      { outcome: '1', prob: p1 },
      { outcome: 'X', prob: px },
      { outcome: '2', prob: p2 }
    ].sort((a, b) => b.prob - a.prob);

    return {
      idx,
      favProb: sorted[0].prob,
      closeness: sorted[0].prob - sorted[2].prob,
      top1: sorted[0].outcome,
      top2: sorted[1].outcome,
      third: sorted[2].outcome
    };
  });

  const ranked = [...analyzed].sort((a, b) => b.favProb - a.favProb);
  const selections: string[][] = new Array(matches.length);

  // 1. En yüksek favori oranına sahip ilk 5 maçı Banko (Tek) yap
  const bankoIndices = new Set(ranked.slice(0, 5).map(r => r.idx));

  // 2. Kalanlardan sürprize en açık / en yakın 2 maçı Kapalı (1-X-2) yap
  const unrankedByCloseness = [...analyzed].filter(a => !bankoIndices.has(a.idx)).sort((a, b) => a.closeness - b.closeness);
  const kapaliIndices = new Set(unrankedByCloseness.slice(0, 2).map(r => r.idx));

  analyzed.forEach(a => {
    if (bankoIndices.has(a.idx)) {
      selections[a.idx] = [a.top1];
    } else if (kapaliIndices.has(a.idx)) {
      selections[a.idx] = ['1', 'X', '2'];
    } else {
      selections[a.idx] = [a.top1, a.top2];
    }
  });

  // 3. Toplam kolon sayısı 2.500 kolonu (25.000 TL) aşıyorsa, güvenli sınıra inene kadar favori çifte şansları tek'e dönüştür
  let currentCols = selections.reduce((acc, curr) => acc * (curr?.length || 1), 1);
  if (currentCols > maxColumns) {
    const remainingChances = ranked.filter(r => selections[r.idx]?.length === 2);
    for (const r of remainingChances) {
      if (currentCols <= maxColumns) break;
      selections[r.idx] = [r.top1];
      currentCols = Math.round(currentCols / 2);
    }
  }

  return selections;
}

// Hamming mesafesi hesaplama (İki kolon arasındaki fark sayısı)
export function getHammingDistance(col1: string[], col2: string[]): number {
  let dist = 0;
  for (let i = 0; i < 15; i++) {
    if (col1[i] !== col2[i]) {
      dist++;
    }
  }
  return dist;
}

// Kartezyen kombinasyon üretici
export function generateAllCombinations(predictions: MatchPrediction[]): string[][] {
  const results: string[][] = [];

  function backtrack(index: number, currentCombo: string[]) {
    if (index === 15) {
      results.push([...currentCombo]);
      return;
    }

    const options = predictions[index]?.selected || [];
    for (const option of options) {
      currentCombo.push(option);
      backtrack(index + 1, currentCombo);
      currentCombo.pop();
    }
  }

  backtrack(0, []);
  return results;
}

// Kolonun verilen filtrelere uyup uymadığını kontrol eder
export function checkFilters(
  combo: string[],
  predictions: MatchPrediction[],
  filters: FilterSettings
): boolean {
  let homeCount = 0;
  let drawCount = 0;
  let awayCount = 0;
  
  let consecutiveHome = 0;
  let consecutiveDraw = 0;
  let consecutiveAway = 0;

  let maxConsecHome = 0;
  let maxConsecDraw = 0;
  let maxConsecAway = 0;

  let probabilitySum = 0;
  let favoriteLossCount = 0;

  for (let i = 0; i < 15; i++) {
    const outcome = combo[i];
    const match = predictions[i];

    // Oynanma Oranı hesaplama
    if (match && match.probabilities) {
      if (outcome === '1') probabilitySum += match.probabilities[0] || 0;
      else if (outcome === 'X') probabilitySum += match.probabilities[1] || 0;
      else if (outcome === '2') probabilitySum += match.probabilities[2] || 0;
    }

    // Sayı sayma
    if (outcome === '1') {
      homeCount++;
      consecutiveHome++;
      maxConsecHome = Math.max(maxConsecHome, consecutiveHome);
      consecutiveDraw = 0;
      consecutiveAway = 0;
    } else if (outcome === 'X') {
      drawCount++;
      consecutiveDraw++;
      maxConsecDraw = Math.max(maxConsecDraw, consecutiveDraw);
      consecutiveHome = 0;
      consecutiveAway = 0;
    } else if (outcome === '2') {
      awayCount++;
      consecutiveAway++;
      maxConsecAway = Math.max(maxConsecAway, consecutiveAway);
      consecutiveHome = 0;
      consecutiveDraw = 0;
    }

    // Favori Yenilgisi (Sürpriz) Kontrolü
    if (match && match.probabilities) {
      let maxProb = -1;
      let favIndex = -1;
      for(let j=0; j<3; j++) {
         if(match.probabilities[j] > maxProb) { maxProb = match.probabilities[j]; favIndex = j; }
      }
      const outcomes = ['1', 'X', '2'];
      const favoriteOutcome = outcomes[favIndex];
      
      let isFavoriteLoss = false;
      if (favoriteOutcome === '1' && outcome === '2') isFavoriteLoss = true; // Ev favoriyken dep kazandı
      else if (favoriteOutcome === '2' && outcome === '1') isFavoriteLoss = true; // Dep favoriyken ev kazandı
      else if (favoriteOutcome === 'X' && outcome !== 'X') isFavoriteLoss = true; // X favoriyken biri kazandı

      if (isFavoriteLoss) {
        favoriteLossCount++;
      }
    }
  }

  // Alt/Üst Limit Kontrolleri
  if (homeCount < filters.homeWins[0] || homeCount > filters.homeWins[1]) return false;
  if (drawCount < filters.draws[0] || drawCount > filters.draws[1]) return false;
  if (awayCount < filters.awayWins[0] || awayCount > filters.awayWins[1]) return false;

  // Ardışıklık Kontrolleri
  if (maxConsecHome > filters.maxConsecutiveHome) return false;
  if (maxConsecDraw > filters.maxConsecutiveDraw) return false;
  if (maxConsecAway > filters.maxConsecutiveAway) return false;

  // Toplam İhtimal/Yüzde Limit Kontrolü
  if (probabilitySum < filters.probabilitySum[0] || probabilitySum > filters.probabilitySum[1]) return false;

  // Favori Yenilgisi Kontrolü
  if (filters.favoriteLosses) {
    if (favoriteLossCount < filters.favoriteLosses[0] || favoriteLossCount > filters.favoriteLosses[1]) return false;
  }

  return true;
}

// Formüllü Kupon Üretim Çekirdeği (Greedy Set Cover)
export function generateFormula(
  predictions: MatchPrediction[],
  filters: FilterSettings,
  guarantee: 15 | 14 | 13 | 12
): { columns: string[][]; totalBeforeFilters: number; totalAfterFilters: number; probabilities?: Record<number, number> } {
  
  // 1. Tüm ana tahmin kombinasyonlarını üret
  const allCombos = generateAllCombinations(predictions);
  const totalBeforeFilters = allCombos.length;

  // 2. Kombinasyonları filtrelerden geçir
  const filteredCombos = allCombos.filter(combo => checkFilters(combo, predictions, filters));
  const totalAfterFilters = filteredCombos.length;

  if (totalAfterFilters === 0) {
    return { columns: [], totalBeforeFilters, totalAfterFilters };
  }

  const M = totalAfterFilters;
  
  // Eğer 15 Garanti (Tam Kupon) isteniyorsa, filtrelerden geçen her şeyi oyna
  if (guarantee === 15) {
    return { 
      columns: filteredCombos, 
      totalBeforeFilters, 
      totalAfterFilters,
      probabilities: { 15: 100, 14: 100, 13: 100, 12: 100 }
    };
  }

  // İzin verilen maksimum hata mesafesi (Hamming Distance)
  // 14 Garanti -> 1 maça kadar hata payı (fark <= 1)
  // 13 Garanti -> 2 maça kadar hata payı (fark <= 2)
  // 12 Garanti -> 3 maça kadar hata payı (fark <= 3)
  const allowedDistance = 15 - guarantee;

  // Açgözlü Küme Kapsama (Greedy Set Cover) Algoritması
  const U = [...filteredCombos]; // Henüz kapsanmamış kombinasyonlar
  const C: string[][] = []; // Seçilen kuponlar

  while (U.length > 0) {
    let bestCol: string[] | null = null;
    let bestCoveredIndices: number[] = [];
    let maxCoverCount = 0;

    // Hızlandırmak için: Eğer kalan küme çok büyükse, tüm adayları denemek yerine 
    // sadece henüz kapatılmamış elemanları aday olarak kullanırız.
    // Bu, Greedy Set Cover için standart ve hızlı bir yaklaşımdır.
    const searchPool = U.length > 1000 ? U.slice(0, 500) : U;

    for (let i = 0; i < searchPool.length; i++) {
      const candidate = searchPool[i];
      let coverCount = 0;
      const coveredIndices: number[] = [];

      for (let j = 0; j < U.length; j++) {
        if (getHammingDistance(candidate, U[j]) <= allowedDistance) {
          coverCount++;
          coveredIndices.push(j);
        }
      }

      if (coverCount > maxCoverCount) {
        maxCoverCount = coverCount;
        bestCol = candidate;
        bestCoveredIndices = coveredIndices;
      }

      // Teorik üst sınır kontrolü (14 garanti için en fazla 31 eleman kaplayabilir)
      if (guarantee === 14 && coverCount === 31) {
        break;
      }
    }

    if (!bestCol) {
      // Güvenlik çıkışı
      bestCol = U[0];
      bestCoveredIndices = [0];
    }

    C.push(bestCol);

    // Kapsanan elemanları U listesinden çıkar (indis kaymaması için sondan başa doğru sileriz)
    bestCoveredIndices.sort((a, b) => b - a);
    for (const idx of bestCoveredIndices) {
      U.splice(idx, 1);
    }
  }

  // Başarı İhtimallerini Hesapla (Filtre Şartlarına ve Garanti Seviyesine Göre)
  const probabilities: Record<number, number> = { 15: 0, 14: 0, 13: 0, 12: 0 };
  let count15 = 0;
  let count14 = 0;
  let count13 = 0;
  let count12 = 0;

  for (let j = 0; j < M; j++) {
    let minDist = 15;
    for (let i = 0; i < C.length; i++) {
      const dist = getHammingDistance(filteredCombos[j], C[i]);
      if (dist < minDist) minDist = dist;
      if (minDist === 0) break; // Tam isabet
    }
    
    if (minDist === 0) count15++;
    if (minDist <= 1) count14++;
    if (minDist <= 2) count13++;
    if (minDist <= 3) count12++;
  }

  if (guarantee === 14) {
    probabilities[15] = Math.min(100, parseFloat(((count15 / M) * 100).toFixed(2)));
    probabilities[14] = 100;
    probabilities[13] = 100;
    probabilities[12] = 100;
  } else if (guarantee === 13) {
    probabilities[15] = Math.min(100, parseFloat(((count15 / M) * 100).toFixed(2)));
    probabilities[14] = Math.min(100, parseFloat(((count14 / M) * 100).toFixed(2)));
    probabilities[13] = 100;
    probabilities[12] = 100;
  } else if (guarantee === 12) {
    probabilities[15] = Math.min(100, parseFloat(((count15 / M) * 100).toFixed(2)));
    probabilities[14] = Math.min(100, parseFloat(((count14 / M) * 100).toFixed(2)));
    probabilities[13] = Math.min(100, parseFloat(((count13 / M) * 100).toFixed(2)));
    probabilities[12] = 100;
  }

  return {
    columns: C,
    totalBeforeFilters,
    totalAfterFilters,
    probabilities
  };
}
