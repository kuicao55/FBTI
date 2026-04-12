/**
 * modules/scoring.js
 * TasteType 3.1 scoring engine
 *
 * Pure ES Module. No external dependencies.
 * Handles stratified random question selection, cumulative scoring,
 * percentage calculation, and dominant/secondary code determination
 * across 4 dimensions: stimulus, taste, philosophy, novelty.
 */

// Dimension configuration: total questions, codes, minimum per code
const DIMENSION_CONFIG = {
  stimulus:   { total: 6,  codes: ['H', 'N', 'C', 'M'],  minPerTendency: { H: 1, N: 1, C: 1, M: 1 } },
  taste:      { total: 8,  codes: ['U', 'S', 'W', 'B', 'O'], minPerTendency: { U: 1, S: 1, W: 1, B: 1, O: 1 } },
  philosophy: { total: 4,  codes: ['A', 'S'],             minPerTendency: { A: 1, S: 1 } },
  novelty:    { total: 6,  codes: ['E', 'C'],             minPerTendency: { E: 2, C: 2 } }
};

/**
 * Check if a question has at least one option scoring a given code.
 */
function questionScoresCode(question, code) {
  return question.options.some(opt => opt.scores && opt.scores[code] > 0);
}

/**
 * Shuffle an array in place (Fisher-Yates) and return it.
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * selectQuestions(questionsData) — Stratified random sampling
 *
 * Extracts 24 questions from the full pool:
 *   stimulus: 6, taste: 8, philosophy: 4, novelty: 6
 * Ensures minimum representation per tendency code within each dimension.
 *
 * @param {Object} questionsData — { dimensions: [...], questions: [...] }
 * @returns {Array} 24 question objects, shuffled
 */
export function selectQuestions(questionsData) {
  const allQuestions = questionsData.questions;
  const result = [];

  for (const [dimName, config] of Object.entries(DIMENSION_CONFIG)) {
    // Group questions belonging to this dimension
    const pool = allQuestions.filter(q => q.dimension === dimName);

    // Track selected question ids to avoid duplicates
    const selectedIds = new Set();
    const selected = [];

    // Phase 1: For each code, pick minPerTendency questions that score that code
    for (const code of config.codes) {
      const minCount = config.minPerTendency[code] || 0;
      const candidates = shuffle(
        pool.filter(q => !selectedIds.has(q.id) && questionScoresCode(q, code))
      );
      let picked = 0;
      for (let i = 0; i < Math.min(minCount, candidates.length); i++) {
        selected.push(candidates[i]);
        selectedIds.add(candidates[i].id);
        picked++;
      }
      if (picked < minCount) {
        throw new Error(`minPerTendency not met for code "${code}" in dimension "${dimName}": needed ${minCount}, found ${picked}`);
      }
    }

    // Phase 2: Fill remaining slots from this dimension's pool randomly
    const remaining = pool.filter(q => !selectedIds.has(q.id));
    shuffle(remaining);
    const need = config.total - selected.length;
    for (let i = 0; i < need && i < remaining.length; i++) {
      selected.push(remaining[i]);
      selectedIds.add(remaining[i].id);
    }

    if (selected.length < config.total) {
      throw new Error(`Insufficient questions in dimension "${dimName}": needed ${config.total}, found ${selected.length}`);
    }

    result.push(...selected);
  }

  // Shuffle all selected questions together
  return shuffle(result);
}

/**
 * calculateScores(answers, questions) — Cumulative scoring
 *
 * For each question, finds the selected option and adds its scores
 * to the dimension's accumulator. Handles empty scores {} and
 * multi-code scores like { "M": 0.5, "N": 0.5 }.
 *
 * @param {Array<string>} answers — option labels like ['A','B',...]
 * @param {Array<Object>} questions — 24 selected question objects
 * @returns {Object} nested scores { stimulus: {H,N,C,M}, taste: {U,S,W,B,O}, ... }
 */
export function calculateScores(answers, questions) {
  const scores = {
    stimulus:   { H: 0, N: 0, C: 0, M: 0 },
    taste:      { U: 0, S: 0, W: 0, B: 0, O: 0 },
    philosophy: { A: 0, S: 0 },
    novelty:    { E: 0, C: 0 }
  };

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const answer = answers[i];
    if (!answer || !question) continue;

    const option = question.options.find(opt => opt.label === answer);
    if (!option) continue;

    const dimScores = scores[question.dimension];
    if (!dimScores) continue;

    for (const [code, value] of Object.entries(option.scores)) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new Error(`Invalid score value for code "${code}" in question ${question.id}: expected finite non-negative number, got ${value}`);
      }
      if (Object.prototype.hasOwnProperty.call(dimScores, code)) {
        dimScores[code] += value;
      }
    }
  }

  return scores;
}

/**
 * calculatePercentages(scores) — Percentage per code
 *
 * For each dimension, percentage = (code score / dimension total) * 100.
 * If dimension total is 0, all percentages are 0.
 *
 * @param {Object} scores — output of calculateScores
 * @returns {Object} same structure with percentages instead of raw scores
 */
export function calculatePercentages(scores) {
  const percentages = {};

  for (const [dimName, dimScores] of Object.entries(scores)) {
    const total = Object.values(dimScores).reduce((sum, v) => sum + v, 0);
    percentages[dimName] = {};
    for (const [code, value] of Object.entries(dimScores)) {
      percentages[dimName][code] = total > 0 ? (value / total) * 100 : 0;
    }
  }

  return percentages;
}

/**
 * determineDominant(percentages, dimension) — Highest percentage code
 *
 * @param {Object} percentages — output of calculatePercentages
 * @param {string} dimension — dimension name
 * @returns {string} the code with the highest percentage in that dimension
 */
export function determineDominant(percentages, dimension) {
  const dimPct = percentages[dimension];
  let dominant = null;
  let maxPct = -1;
  for (const [code, pct] of Object.entries(dimPct)) {
    if (pct > maxPct) {
      maxPct = pct;
      dominant = code;
    }
  }
  return dominant;
}

/**
 * determineSecondary(percentages, dimension, dominantCode) — Second-highest if close
 *
 * Returns the second-highest code if its percentage >= dominant * 0.7.
 * Otherwise returns null.
 *
 * @param {Object} percentages — output of calculatePercentages
 * @param {string} dimension — dimension name
 * @param {string} dominantCode — the dominant code for this dimension
 * @returns {string|null} second code or null
 */
export function determineSecondary(percentages, dimension, dominantCode) {
  const dimPct = percentages[dimension];
  const dominantPct = dimPct[dominantCode];

  let secondCode = null;
  let secondPct = -1;

  for (const [code, pct] of Object.entries(dimPct)) {
    if (code !== dominantCode && pct > secondPct) {
      secondPct = pct;
      secondCode = code;
    }
  }

  if (dominantPct > 0 && secondPct >= dominantPct * 0.7) {
    return secondCode;
  }
  return null;
}

/**
 * calculateType(answers, questions, types) — Main entry point
 *
 * Backward-compatible signature: (answers, questions, types).
 * Calculates scores, percentages, dominant + secondary per dimension,
 * and builds a typeCode from dominant letters.
 *
 * @param {Array<string>} answers — option labels
 * @param {Array<Object>} questions — 24 selected questions
 * @param {Object} types — types lookup (for backward compat, not used for calculation)
 * @returns {{ typeCode: string, scores: Object, dimensionResults: Object }}
 */
export function calculateType(answers, questions, types) {
  const scores = calculateScores(answers, questions);
  const percentages = calculatePercentages(scores);

  const dimensionResults = {};
  const typeCodeParts = [];

  // Build typeCode in order: stimulus + taste + philosophy + novelty
  const dimensionOrder = ['stimulus', 'taste', 'philosophy', 'novelty'];

  for (const dim of dimensionOrder) {
    const dominant = determineDominant(percentages, dim);
    const secondary = determineSecondary(percentages, dim, dominant);
    dimensionResults[dim] = {
      dominant,
      secondary,
      percentages: percentages[dim]
    };
    typeCodeParts.push(dominant);
  }

  const typeCode = typeCodeParts.join('');

  return {
    typeCode,
    scores,
    dimensionResults
  };
}
