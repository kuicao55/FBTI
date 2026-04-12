/**
 * tests/test_scoring.js
 * TDD tests for modules/scoring.js (TasteType 3.1)
 *
 * Uses Node.js built-in test runner (node --test).
 * Loads questions.json and types.json from data/ for integration tests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  selectQuestions,
  calculateScores,
  calculatePercentages,
  determineDominant,
  determineSecondary,
  calculateType
} from '../modules/scoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load test fixtures
const questionsData = JSON.parse(readFileSync(join(projectRoot, 'data', 'questions.json'), 'utf-8'));
const typesData = JSON.parse(readFileSync(join(projectRoot, 'data', 'types.json'), 'utf-8'));

// ---------- selectQuestions ----------

describe('selectQuestions', () => {
  it('returns exactly 24 questions', () => {
    const selected = selectQuestions(questionsData);
    assert.equal(selected.length, 24);
  });

  it('returns question objects with id and dimension fields', () => {
    const selected = selectQuestions(questionsData);
    for (const q of selected) {
      assert.ok(q.id, 'question should have id');
      assert.ok(q.dimension, 'question should have dimension');
    }
  });

  it('distributes 6 stimulus questions', () => {
    const selected = selectQuestions(questionsData);
    const stimulus = selected.filter(q => q.dimension === 'stimulus');
    assert.equal(stimulus.length, 6);
  });

  it('distributes 8 taste questions', () => {
    const selected = selectQuestions(questionsData);
    const taste = selected.filter(q => q.dimension === 'taste');
    assert.equal(taste.length, 8);
  });

  it('distributes 4 philosophy questions', () => {
    const selected = selectQuestions(questionsData);
    const philosophy = selected.filter(q => q.dimension === 'philosophy');
    assert.equal(philosophy.length, 4);
  });

  it('distributes 6 novelty questions', () => {
    const selected = selectQuestions(questionsData);
    const novelty = selected.filter(q => q.dimension === 'novelty');
    assert.equal(novelty.length, 6);
  });

  it('ensures at least 1 H, 1 N, 1 C, 1 M in stimulus questions', () => {
    const selected = selectQuestions(questionsData);
    const stimulus = selected.filter(q => q.dimension === 'stimulus');
    const codes = new Set();
    for (const q of stimulus) {
      for (const opt of q.options) {
        for (const code of Object.keys(opt.scores)) {
          codes.add(code);
        }
      }
    }
    for (const code of ['H', 'N', 'C', 'M']) {
      assert.ok(codes.has(code), `stimulus questions should cover code ${code}`);
    }
  });

  it('ensures at least 1 U, 1 S, 1 W, 1 B, 1 O in taste questions', () => {
    const selected = selectQuestions(questionsData);
    const taste = selected.filter(q => q.dimension === 'taste');
    const codes = new Set();
    for (const q of taste) {
      for (const opt of q.options) {
        for (const code of Object.keys(opt.scores)) {
          codes.add(code);
        }
      }
    }
    for (const code of ['U', 'S', 'W', 'B', 'O']) {
      assert.ok(codes.has(code), `taste questions should cover code ${code}`);
    }
  });

  it('ensures at least 1 A, 1 S in philosophy questions', () => {
    const selected = selectQuestions(questionsData);
    const philosophy = selected.filter(q => q.dimension === 'philosophy');
    const codes = new Set();
    for (const q of philosophy) {
      for (const opt of q.options) {
        for (const code of Object.keys(opt.scores)) {
          codes.add(code);
        }
      }
    }
    for (const code of ['A', 'S']) {
      assert.ok(codes.has(code), `philosophy questions should cover code ${code}`);
    }
  });

  it('ensures at least 2 E, 2 C in novelty questions', () => {
    const selected = selectQuestions(questionsData);
    const novelty = selected.filter(q => q.dimension === 'novelty');
    // Count questions that have at least one option scoring E or C
    let eQuestions = 0;
    let cQuestions = 0;
    for (const q of novelty) {
      let hasE = false;
      let hasC = false;
      for (const opt of q.options) {
        if (opt.scores['E']) hasE = true;
        if (opt.scores['C']) hasC = true;
      }
      if (hasE) eQuestions++;
      if (hasC) cQuestions++;
    }
    assert.ok(eQuestions >= 2, `novelty should have at least 2 questions scoring E, got ${eQuestions}`);
    assert.ok(cQuestions >= 2, `novelty should have at least 2 questions scoring C, got ${cQuestions}`);
  });

  it('returns different selections on multiple calls (randomness)', () => {
    const sets = new Set();
    for (let i = 0; i < 10; i++) {
      const selected = selectQuestions(questionsData);
      sets.add(selected.map(q => q.id).join(','));
    }
    // With 100 questions and 24 selected randomly, it's extremely unlikely
    // all 10 calls produce identical selections
    assert.ok(sets.size > 1, 'selectQuestions should produce different selections');
  });

  it('does not return duplicate questions', () => {
    const selected = selectQuestions(questionsData);
    const ids = selected.map(q => q.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, 'selected questions should not have duplicates');
  });
});

// ---------- calculateScores ----------

describe('calculateScores', () => {
  it('returns nested scores object with all dimensions and codes', () => {
    const selected = selectQuestions(questionsData);
    const answers = selected.map(() => 'A');
    const scores = calculateScores(answers, selected);

    assert.ok(scores.stimulus, 'should have stimulus');
    assert.ok(scores.taste, 'should have taste');
    assert.ok(scores.philosophy, 'should have philosophy');
    assert.ok(scores.novelty, 'should have novelty');

    assert.equal(typeof scores.stimulus.H, 'number');
    assert.equal(typeof scores.stimulus.N, 'number');
    assert.equal(typeof scores.stimulus.C, 'number');
    assert.equal(typeof scores.stimulus.M, 'number');

    assert.equal(typeof scores.taste.U, 'number');
    assert.equal(typeof scores.taste.S, 'number');
    assert.equal(typeof scores.taste.W, 'number');
    assert.equal(typeof scores.taste.B, 'number');
    assert.equal(typeof scores.taste.O, 'number');

    assert.equal(typeof scores.philosophy.A, 'number');
    assert.equal(typeof scores.philosophy.S, 'number');

    assert.equal(typeof scores.novelty.E, 'number');
    assert.equal(typeof scores.novelty.C, 'number');
  });

  it('handles empty scores {} without error', () => {
    // Create a minimal question with an empty-scores option
    const questions = [
      {
        id: 1,
        text: 'test',
        dimension: 'stimulus',
        options: [
          { label: 'A', text: 'neutral', scores: {} },
          { label: 'B', text: 'scoring', scores: { H: 1 } }
        ]
      }
    ];
    const answers = ['A'];
    // Should not throw and all codes should be 0
    const scores = calculateScores(answers, questions);
    assert.equal(scores.stimulus.H, 0);
    assert.equal(scores.stimulus.N, 0);
  });

  it('handles multi-code scores like { "M": 0.5, "N": 0.5 }', () => {
    const questions = [
      {
        id: 1,
        text: 'test',
        dimension: 'stimulus',
        options: [
          { label: 'A', text: 'multi', scores: { M: 0.5, N: 0.5 } }
        ]
      }
    ];
    const answers = ['A'];
    const scores = calculateScores(answers, questions);
    assert.equal(scores.stimulus.M, 0.5);
    assert.equal(scores.stimulus.N, 0.5);
  });

  it('accumulates scores across multiple questions in same dimension', () => {
    const questions = [
      {
        id: 1, text: 'q1', dimension: 'stimulus',
        options: [{ label: 'A', text: 'a', scores: { H: 1 } }]
      },
      {
        id: 2, text: 'q2', dimension: 'stimulus',
        options: [{ label: 'A', text: 'a', scores: { H: 1 } }]
      }
    ];
    const answers = ['A', 'A'];
    const scores = calculateScores(answers, questions);
    assert.equal(scores.stimulus.H, 2);
  });
});

// ---------- calculatePercentages ----------

describe('calculatePercentages', () => {
  it('calculates percentages that sum to ~100 per dimension', () => {
    const scores = {
      stimulus: { H: 3, N: 2, C: 1, M: 0 },
      taste: { U: 2, S: 1, W: 1, B: 0, O: 0 },
      philosophy: { A: 3, S: 1 },
      novelty: { E: 2, C: 4 }
    };
    const percentages = calculatePercentages(scores);

    // stimulus: total=6, H=50, N=33.33, C=16.67, M=0
    assert.ok(Math.abs(percentages.stimulus.H - 50) < 0.01);
    assert.ok(Math.abs(percentages.stimulus.N - 33.33) < 0.1);
    assert.ok(Math.abs(percentages.stimulus.C - 16.67) < 0.1);
    assert.equal(percentages.stimulus.M, 0);

    // philosophy: total=4, A=75, S=25
    assert.equal(percentages.philosophy.A, 75);
    assert.equal(percentages.philosophy.S, 25);
  });

  it('handles zero total in a dimension (all scores zero)', () => {
    const scores = {
      stimulus: { H: 0, N: 0, C: 0, M: 0 },
      taste: { U: 1, S: 0, W: 0, B: 0, O: 0 },
      philosophy: { A: 0, S: 0 },
      novelty: { E: 0, C: 0 }
    };
    const percentages = calculatePercentages(scores);
    // When total is 0, all percentages should be 0
    assert.equal(percentages.stimulus.H, 0);
    assert.equal(percentages.philosophy.A, 0);
    assert.equal(percentages.novelty.E, 0);
  });
});

// ---------- determineDominant ----------

describe('determineDominant', () => {
  it('returns the code with highest percentage', () => {
    const percentages = {
      stimulus: { H: 50, N: 30, C: 15, M: 5 },
      taste: { U: 40, S: 30, W: 20, B: 5, O: 5 },
      philosophy: { A: 60, S: 40 },
      novelty: { E: 70, C: 30 }
    };
    assert.equal(determineDominant(percentages, 'stimulus'), 'H');
    assert.equal(determineDominant(percentages, 'taste'), 'U');
    assert.equal(determineDominant(percentages, 'philosophy'), 'A');
    assert.equal(determineDominant(percentages, 'novelty'), 'E');
  });
});

// ---------- determineSecondary ----------

describe('determineSecondary', () => {
  it('returns second-highest code when it is >= 70% of dominant', () => {
    const percentages = {
      stimulus: { H: 40, N: 30, C: 20, M: 10 }
    };
    // N=30 is 75% of H=40, so secondary = 'N'
    assert.equal(determineSecondary(percentages, 'stimulus', 'H'), 'N');
  });

  it('returns null when second-highest is < 70% of dominant', () => {
    const percentages = {
      stimulus: { H: 80, N: 10, C: 6, M: 4 }
    };
    // N=10 is 12.5% of H=80, so secondary = null
    assert.equal(determineSecondary(percentages, 'stimulus', 'H'), null);
  });

  it('works for philosophy dimension with 2-option threshold', () => {
    const percentages = {
      philosophy: { A: 55, S: 45 }
    };
    // S=45 is ~82% of A=55, so secondary = 'S'
    assert.equal(determineSecondary(percentages, 'philosophy', 'A'), 'S');
  });
});

// ---------- calculateType (main entry point) ----------

describe('calculateType', () => {
  it('returns object with typeCode, scores, dimensionResults', () => {
    const selected = selectQuestions(questionsData);
    const answers = selected.map(() => 'A');
    const result = calculateType(answers, selected, typesData.types);

    assert.ok(result.typeCode, 'should have typeCode');
    assert.ok(result.scores, 'should have scores');
    assert.ok(result.dimensionResults, 'should have dimensionResults');
  });

  it('produces a 4-letter typeCode', () => {
    const selected = selectQuestions(questionsData);
    const answers = selected.map(() => 'A');
    const result = calculateType(answers, selected, typesData.types);

    assert.equal(result.typeCode.length, 4);
  });

  it('typeCode uses valid codes for each dimension', () => {
    const selected = selectQuestions(questionsData);
    const answers = selected.map(() => 'A');
    const result = calculateType(answers, selected, typesData.types);

    const stimulusCodes = ['H', 'N', 'C', 'M'];
    const tasteCodes = ['U', 'S', 'W', 'B', 'O'];
    const philosophyCodes = ['A', 'S'];
    const noveltyCodes = ['E', 'C'];

    assert.ok(stimulusCodes.includes(result.typeCode[0]));
    assert.ok(tasteCodes.includes(result.typeCode[1]));
    assert.ok(philosophyCodes.includes(result.typeCode[2]));
    assert.ok(noveltyCodes.includes(result.typeCode[3]));
  });

  it('dimensionResults contains dominant, secondary, percentages per dimension', () => {
    const selected = selectQuestions(questionsData);
    const answers = selected.map(() => 'A');
    const result = calculateType(answers, selected, typesData.types);

    for (const dim of ['stimulus', 'taste', 'philosophy', 'novelty']) {
      const dr = result.dimensionResults[dim];
      assert.ok(dr.dominant, `${dim} should have dominant`);
      assert.ok(dr.percentages, `${dim} should have percentages`);
      // secondary can be null
      assert.ok(dr.secondary === null || typeof dr.secondary === 'string',
        `${dim} secondary should be null or string`);
    }
  });

  it('with known answers produces a valid type code in types.json', () => {
    const selected = selectQuestions(questionsData);
    const answers = selected.map(() => 'A');
    const result = calculateType(answers, selected, typesData.types);

    assert.ok(typesData.types[result.typeCode],
      `typeCode ${result.typeCode} should exist in types.json`);
  });

  it('backward-compatible: accepts (answers, questions, types) signature', () => {
    const selected = selectQuestions(questionsData);
    const answers = selected.map(() => 'B');
    // Should not throw
    const result = calculateType(answers, selected, typesData.types);
    assert.ok(result.typeCode);
  });

  it('produces different type codes for different answer patterns', () => {
    // Run multiple times with different answer patterns to ensure variety
    const selected = selectQuestions(questionsData);
    const allA = calculateType(selected.map(() => 'A'), selected, typesData.types).typeCode;
    const allB = calculateType(selected.map(() => 'B'), selected, typesData.types).typeCode;
    const allC = calculateType(selected.map(() => 'C'), selected, typesData.types).typeCode;
    const allD = calculateType(selected.map(() => 'D'), selected, typesData.types).typeCode;
    // At least 2 different codes should appear among the 4 patterns
    const codes = new Set([allA, allB, allC, allD]);
    assert.ok(codes.size >= 2, 'different answer patterns should produce different type codes');
  });

  it('handles philosophy questions with only 2 options (A/B)', () => {
    // Create questions where philosophy dimension has only A/B options
    const questions = [
      { id: 1, text: 'q1', dimension: 'stimulus', options: [
        { label: 'A', text: 'a', scores: { H: 1 } }
      ]},
      { id: 2, text: 'q2', dimension: 'taste', options: [
        { label: 'A', text: 'a', scores: { U: 1 } }
      ]},
      { id: 3, text: 'q3', dimension: 'philosophy', options: [
        { label: 'A', text: 'a', scores: { A: 1 } },
        { label: 'B', text: 'b', scores: { S: 1 } }
      ]},
      { id: 4, text: 'q4', dimension: 'novelty', options: [
        { label: 'A', text: 'a', scores: { E: 1 } }
      ]}
    ];
    const answers = ['A', 'A', 'A', 'A'];
    const result = calculateType(answers, questions, {});
    assert.equal(result.typeCode[2], 'A', 'philosophy dominant should be A');
  });
});

// ---------- determineSecondary boundary test ----------

describe('determineSecondary boundary', () => {
  it('returns null when second-highest is exactly 69.9% of dominant', () => {
    const percentages = {
      stimulus: { H: 100, N: 69.9, C: 0, M: 0 }
    };
    assert.equal(determineSecondary(percentages, 'stimulus', 'H'), null);
  });

  it('returns second code when second-highest is exactly 70% of dominant', () => {
    const percentages = {
      stimulus: { H: 100, N: 70, C: 0, M: 0 }
    };
    assert.equal(determineSecondary(percentages, 'stimulus', 'H'), 'N');
  });
});

// ---------- Bug fix: determineSecondary with all-zero percentages ----------

describe('determineSecondary all-zero bug', () => {
  it('returns null when all percentages are zero', () => {
    const percentages = {
      stimulus: { H: 0, N: 0, C: 0, M: 0 }
    };
    // When dominant is 0, no secondary should be returned
    assert.equal(determineSecondary(percentages, 'stimulus', 'H'), null);
  });
});

// ---------- Bug fix: calculateScores inherited property keys ----------

describe('calculateScores inherited keys', () => {
  it('ignores inherited property keys like constructor in option.scores', () => {
    const questions = [
      {
        id: 1, text: 'q1', dimension: 'stimulus',
        options: [
          { label: 'A', text: 'a', scores: { constructor: 1, H: 1 } }
        ]
      }
    ];
    const answers = ['A'];
    // Should not add to constructor or crash; only H should be incremented
    const scores = calculateScores(answers, questions);
    assert.equal(scores.stimulus.H, 1);
    // Verify no pollution — dimScores should only have H, N, C, M
    const keys = Object.keys(scores.stimulus);
    assert.deepEqual(keys.sort(), ['C', 'H', 'M', 'N']);
  });
});

// ---------- Bug fix: selectQuestions undersized pool ----------

describe('selectQuestions undersized pool', () => {
  it('throws when question pool is too small to select required total', () => {
    // Build a minimal questionsData with only 2 stimulus questions (need 6)
    const tinyData = {
      dimensions: ['stimulus'],
      questions: [
        { id: 1, text: 'q1', dimension: 'stimulus', options: [
          { label: 'A', text: 'a', scores: { H: 1 } }
        ]},
        { id: 2, text: 'q2', dimension: 'stimulus', options: [
          { label: 'A', text: 'a', scores: { N: 1 } }
        ]}
      ]
    };
    assert.throws(
      () => selectQuestions(tinyData),
      /insufficient|undersized|not enough|total|minPerTendency/i
    );
  });
});

// ---------- Bug fix: selectQuestions minPerTendency not met ----------

describe('selectQuestions minPerTendency not met', () => {
  it('throws when a code does not have enough questions to meet minPerTendency', () => {
    // Build questionsData where philosophy has no 'S'-scoring question at all
    const noSecondaryData = {
      dimensions: ['stimulus', 'taste', 'philosophy', 'novelty'],
      questions: [
        // stimulus: 6 questions with H, N, C, M coverage
        { id: 1, text: 'q1', dimension: 'stimulus', options: [
          { label: 'A', text: 'a', scores: { H: 1 } },
          { label: 'B', text: 'b', scores: { N: 1 } },
          { label: 'C', text: 'c', scores: { C: 1 } },
          { label: 'D', text: 'd', scores: { M: 1 } }
        ]},
        { id: 2, text: 'q2', dimension: 'stimulus', options: [
          { label: 'A', text: 'a', scores: { H: 1 } },
          { label: 'B', text: 'b', scores: { N: 1 } },
          { label: 'C', text: 'c', scores: { C: 1 } },
          { label: 'D', text: 'd', scores: { M: 1 } }
        ]},
        { id: 3, text: 'q3', dimension: 'stimulus', options: [
          { label: 'A', text: 'a', scores: { H: 1 } },
          { label: 'B', text: 'b', scores: { N: 1 } },
          { label: 'C', text: 'c', scores: { C: 1 } },
          { label: 'D', text: 'd', scores: { M: 1 } }
        ]},
        { id: 4, text: 'q4', dimension: 'stimulus', options: [
          { label: 'A', text: 'a', scores: { H: 1 } },
          { label: 'B', text: 'b', scores: { N: 1 } },
          { label: 'C', text: 'c', scores: { C: 1 } },
          { label: 'D', text: 'd', scores: { M: 1 } }
        ]},
        { id: 5, text: 'q5', dimension: 'stimulus', options: [
          { label: 'A', text: 'a', scores: { H: 1 } },
          { label: 'B', text: 'b', scores: { N: 1 } },
          { label: 'C', text: 'c', scores: { C: 1 } },
          { label: 'D', text: 'd', scores: { M: 1 } }
        ]},
        { id: 6, text: 'q6', dimension: 'stimulus', options: [
          { label: 'A', text: 'a', scores: { H: 1 } },
          { label: 'B', text: 'b', scores: { N: 1 } },
          { label: 'C', text: 'c', scores: { C: 1 } },
          { label: 'D', text: 'd', scores: { M: 1 } }
        ]},
        // taste: 8 questions with U, S, W, B, O
        { id: 10, text: 'q10', dimension: 'taste', options: [
          { label: 'A', text: 'a', scores: { U: 1 } },
          { label: 'B', text: 'b', scores: { S: 1 } },
          { label: 'C', text: 'c', scores: { W: 1 } },
          { label: 'D', text: 'd', scores: { B: 1 } },
          { label: 'E', text: 'e', scores: { O: 1 } }
        ]},
        { id: 11, text: 'q11', dimension: 'taste', options: [
          { label: 'A', text: 'a', scores: { U: 1 } },
          { label: 'B', text: 'b', scores: { S: 1 } },
          { label: 'C', text: 'c', scores: { W: 1 } },
          { label: 'D', text: 'd', scores: { B: 1 } },
          { label: 'E', text: 'e', scores: { O: 1 } }
        ]},
        { id: 12, text: 'q12', dimension: 'taste', options: [
          { label: 'A', text: 'a', scores: { U: 1 } },
          { label: 'B', text: 'b', scores: { S: 1 } },
          { label: 'C', text: 'c', scores: { W: 1 } },
          { label: 'D', text: 'd', scores: { B: 1 } },
          { label: 'E', text: 'e', scores: { O: 1 } }
        ]},
        { id: 13, text: 'q13', dimension: 'taste', options: [
          { label: 'A', text: 'a', scores: { U: 1 } },
          { label: 'B', text: 'b', scores: { S: 1 } },
          { label: 'C', text: 'c', scores: { W: 1 } },
          { label: 'D', text: 'd', scores: { B: 1 } },
          { label: 'E', text: 'e', scores: { O: 1 } }
        ]},
        { id: 14, text: 'q14', dimension: 'taste', options: [
          { label: 'A', text: 'a', scores: { U: 1 } },
          { label: 'B', text: 'b', scores: { S: 1 } },
          { label: 'C', text: 'c', scores: { W: 1 } },
          { label: 'D', text: 'd', scores: { B: 1 } },
          { label: 'E', text: 'e', scores: { O: 1 } }
        ]},
        { id: 15, text: 'q15', dimension: 'taste', options: [
          { label: 'A', text: 'a', scores: { U: 1 } },
          { label: 'B', text: 'b', scores: { S: 1 } },
          { label: 'C', text: 'c', scores: { W: 1 } },
          { label: 'D', text: 'd', scores: { B: 1 } },
          { label: 'E', text: 'e', scores: { O: 1 } }
        ]},
        { id: 16, text: 'q16', dimension: 'taste', options: [
          { label: 'A', text: 'a', scores: { U: 1 } },
          { label: 'B', text: 'b', scores: { S: 1 } },
          { label: 'C', text: 'c', scores: { W: 1 } },
          { label: 'D', text: 'd', scores: { B: 1 } },
          { label: 'E', text: 'e', scores: { O: 1 } }
        ]},
        { id: 17, text: 'q17', dimension: 'taste', options: [
          { label: 'A', text: 'a', scores: { U: 1 } },
          { label: 'B', text: 'b', scores: { S: 1 } },
          { label: 'C', text: 'c', scores: { W: 1 } },
          { label: 'D', text: 'd', scores: { B: 1 } },
          { label: 'E', text: 'e', scores: { O: 1 } }
        ]},
        // philosophy: 4 questions but ALL score only A, never S
        { id: 20, text: 'q20', dimension: 'philosophy', options: [
          { label: 'A', text: 'a', scores: { A: 1 } },
          { label: 'B', text: 'b', scores: { A: 1 } }
        ]},
        { id: 21, text: 'q21', dimension: 'philosophy', options: [
          { label: 'A', text: 'a', scores: { A: 1 } },
          { label: 'B', text: 'b', scores: { A: 1 } }
        ]},
        { id: 22, text: 'q22', dimension: 'philosophy', options: [
          { label: 'A', text: 'a', scores: { A: 1 } },
          { label: 'B', text: 'b', scores: { A: 1 } }
        ]},
        { id: 23, text: 'q23', dimension: 'philosophy', options: [
          { label: 'A', text: 'a', scores: { A: 1 } },
          { label: 'B', text: 'b', scores: { A: 1 } }
        ]},
        // novelty: 6 questions with E, C
        { id: 30, text: 'q30', dimension: 'novelty', options: [
          { label: 'A', text: 'a', scores: { E: 1 } },
          { label: 'B', text: 'b', scores: { C: 1 } }
        ]},
        { id: 31, text: 'q31', dimension: 'novelty', options: [
          { label: 'A', text: 'a', scores: { E: 1 } },
          { label: 'B', text: 'b', scores: { C: 1 } }
        ]},
        { id: 32, text: 'q32', dimension: 'novelty', options: [
          { label: 'A', text: 'a', scores: { E: 1 } },
          { label: 'B', text: 'b', scores: { C: 1 } }
        ]},
        { id: 33, text: 'q33', dimension: 'novelty', options: [
          { label: 'A', text: 'a', scores: { E: 1 } },
          { label: 'B', text: 'b', scores: { C: 1 } }
        ]},
        { id: 34, text: 'q34', dimension: 'novelty', options: [
          { label: 'A', text: 'a', scores: { E: 1 } },
          { label: 'B', text: 'b', scores: { C: 1 } }
        ]},
        { id: 35, text: 'q35', dimension: 'novelty', options: [
          { label: 'A', text: 'a', scores: { E: 1 } },
          { label: 'B', text: 'b', scores: { C: 1 } }
        ]}
      ]
    };
    assert.throws(
      () => selectQuestions(noSecondaryData),
      /minPerTendency|minimum|S/i
    );
  });
});

// ---------- Bug fix: calculateScores negative/non-finite score validation ----------

describe('calculateScores input validation', () => {
  it('throws when an option score is negative', () => {
    const questions = [
      {
        id: 1, text: 'q1', dimension: 'stimulus',
        options: [
          { label: 'A', text: 'a', scores: { H: -1 } }
        ]
      }
    ];
    const answers = ['A'];
    assert.throws(
      () => calculateScores(answers, questions),
      /non-negative|invalid|negative/i
    );
  });

  it('throws when an option score is NaN', () => {
    const questions = [
      {
        id: 1, text: 'q1', dimension: 'stimulus',
        options: [
          { label: 'A', text: 'a', scores: { H: NaN } }
        ]
      }
    ];
    const answers = ['A'];
    assert.throws(
      () => calculateScores(answers, questions),
      /finite|invalid|non-negative/i
    );
  });

  it('throws when an option score is Infinity', () => {
    const questions = [
      {
        id: 1, text: 'q1', dimension: 'stimulus',
        options: [
          { label: 'A', text: 'a', scores: { H: Infinity } }
        ]
      }
    ];
    const answers = ['A'];
    assert.throws(
      () => calculateScores(answers, questions),
      /finite|invalid|non-negative/i
    );
  });
});

// ---------- Bug fix: calculateType with mismatched answers/questions length ----------

describe('calculateType mismatched length', () => {
  it('handles answers array shorter than questions array gracefully', () => {
    // Create a small set of questions
    const questions = [
      { id: 1, text: 'q1', dimension: 'stimulus', options: [
        { label: 'A', text: 'a', scores: { H: 1 } }
      ]},
      { id: 2, text: 'q2', dimension: 'stimulus', options: [
        { label: 'A', text: 'a', scores: { N: 1 } }
      ]},
      { id: 3, text: 'q3', dimension: 'taste', options: [
        { label: 'A', text: 'a', scores: { U: 1 } }
      ]},
      { id: 4, text: 'q4', dimension: 'philosophy', options: [
        { label: 'A', text: 'a', scores: { A: 1 } }
      ]}
    ];
    // Only 2 answers for 4 questions
    const answers = ['A', 'B'];
    // Should not throw — missing answers are treated as undefined/skipped
    const result = calculateType(answers, questions, {});
    assert.ok(result.typeCode);
    assert.ok(result.scores);
  });
});
