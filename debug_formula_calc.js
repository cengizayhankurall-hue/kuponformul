const { generateFormula } = require('./src/lib/formulaHelper');

// Let's test 9 double selections (512 combos)
const predictions = [
  { matchIndex: 0, selected: ['X'], probabilities: [46, 16, 38] },
  { matchIndex: 1, selected: ['1', '2'], probabilities: [47, 23, 30] },
  { matchIndex: 2, selected: ['1', 'X'], probabilities: [35, 23, 42] },
  { matchIndex: 3, selected: ['1'], probabilities: [51, 23, 26] },
  { matchIndex: 4, selected: ['1'], probabilities: [34, 31, 35] },
  { matchIndex: 5, selected: ['2'], probabilities: [58, 14, 28] },
  { matchIndex: 6, selected: ['1', '2'], probabilities: [50, 10, 40] },
  { matchIndex: 7, selected: ['1', '2'], probabilities: [31, 26, 43] },
  { matchIndex: 8, selected: ['1', 'X'], probabilities: [44, 13, 43] },
  { matchIndex: 9, selected: ['X'], probabilities: [42, 21, 37] },
  { matchIndex: 10, selected: ['1', '2'], probabilities: [34, 8, 58] },
  { matchIndex: 11, selected: ['2'], probabilities: [54, 27, 19] },
  { matchIndex: 12, selected: ['1', '2'], probabilities: [45, 25, 30] },
  { matchIndex: 13, selected: ['1', 'X'], probabilities: [50, 25, 25] },
  { matchIndex: 14, selected: ['1', '2'], probabilities: [40, 30, 30] }
];

const filters = {
  homeWins: [3, 9],
  draws: [2, 6],
  awayWins: [2, 7],
  maxConsecutiveHome: 4,
  maxConsecutiveDraw: 3,
  maxConsecutiveAway: 4,
  probabilitySum: [550, 950]
};

const res14 = generateFormula(predictions, filters, 14);
console.log('Result 14G:', {
  totalBeforeFilters: res14.totalBeforeFilters,
  totalAfterFilters: res14.totalAfterFilters,
  columnsCount: res14.columns.length,
  probabilities: res14.probabilities
});

const res15 = generateFormula(predictions, filters, 15);
console.log('Result 15G (Filtreli):', {
  columnsCount: res15.columns.length
});
