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

  it('distributes 8 stimulus questions', () => {
    const selected = selectQuestions(questionsData);
    const stimulus = selected.filter(q => q.dimension.startsWith('stimulus'));
    assert.equal(stimulus.length, 8);
  });

  it('distributes 8 taste questions', () => {
    const selected = selectQuestions(questionsData);
    const taste = selected.filter(q => q.dimension.startsWith('taste'));
    assert.equal(taste.length, 8);
  });

  it('distributes 4 philosophy questions', () => {
    const selected = selectQuestions(questionsData);
    const philosophy = selected.filter(q => q.dimension.startsWith('philosophy'));
    assert.equal(philosophy.length, 4);
  });

  it('distributes 4 novelty questions', () => {
    const selected = selectQuestions(questionsData);
    const novelty = selected.filter(q => q.dimension.startsWith('novelty'));
    assert.equal(novelty.length, 4);
  });

  it('ensures at least 2 H, 2 N, 2 C, 2 M primaryTag in stimulus questions', () => {
    const selected = selectQuestions(questionsData);
    const stimulus = selected.filter(q => q.dimension.startsWith('stimulus'));
    const tagCount = { H: 0, N: 0, C: 0, M: 0 };
    for (const q of stimulus) {
      // dimension format: "stimulus-H" -> extract the tag letter after dash
      const tag = q.dimension.split('-').slice(1).join('-');
      if (tag in tagCount) tagCount[tag]++;
    }
    assert.ok(tagCount.H >= 2, `stimulus should have at least 2 H-tagged questions, got ${tagCount.H}`);
    assert.ok(tagCount.N >= 2, `stimulus should have at least 2 N-tagged questions, got ${tagCount.N}`);
    assert.ok(tagCount.C >= 2, `stimulus should have at least 2 C-tagged questions, got ${tagCount.C}`);
    assert.ok(tagCount.M >= 2, `stimulus should have at least 2 M-tagged questions, got ${tagCount.M}`);
  });

  it('ensures at least 1 of each primaryTag in taste questions', () => {
    const selected = selectQuestions(questionsData);
    const taste = selected.filter(q => q.dimension.startsWith('taste'));
    const tagCount = { U: 0, S: 0, W: 0, B: 0, O: 0 };
    for (const q of taste) {
      const tag = q.dimension.split('-').slice(1).join('-');
      if (tag in tagCount) tagCount[tag]++;
    }
    for (const code of ['U', 'S', 'W', 'B', 'O']) {
      assert.ok(tagCount[code] >= 1, `taste should have at least 1 ${code}-tagged question, got ${tagCount[code]}`);
    }
  });

  it('ensures at least 2 A, 2 S primaryTag in philosophy questions', () => {
    const selected = selectQuestions(questionsData);
    const philosophy = selected.filter(q => q.dimension.startsWith('philosophy'));
    const tagCount = { A: 0, S: 0 };
    for (const q of philosophy) {
      const tag = q.dimension.split('-').slice(1).join('-');
      if (tag in tagCount) tagCount[tag]++;
    }
    assert.ok(tagCount.A >= 2, `philosophy should have at least 2 A-tagged questions, got ${tagCount.A}`);
    assert.ok(tagCount.S >= 2, `philosophy should have at least 2 S-tagged questions, got ${tagCount.S}`);
  });

  it('ensures at least 2 E, 2 C primaryTag in novelty questions', () => {
    const selected = selectQuestions(questionsData);
    const novelty = selected.filter(q => q.dimension.startsWith('novelty'));
    const tagCount = { E: 0, C: 0 };
    for (const q of novelty) {
      const tag = q.dimension.split('-').slice(1).join('-');
      if (tag in tagCount) tagCount[tag]++;
    }
    assert.ok(tagCount.E >= 2, `novelty should have at least 2 E-tagged questions, got ${tagCount.E}`);
    assert.ok(tagCount.C >= 2, `novelty should have at least 2 C-tagged questions, got ${tagCount.C}`);
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

    assert.equal(typeof scores.stimulus.H, 'object');
    assert.ok('sum' in scores.stimulus.H && 'count' in scores.stimulus.H && 'avg' in scores.stimulus.H);
    assert.equal(typeof scores.stimulus.N, 'object');
    assert.equal(typeof scores.stimulus.C, 'object');
    assert.equal(typeof scores.stimulus.M, 'object');

    assert.equal(typeof scores.taste.U, 'object');
    assert.equal(typeof scores.taste.S, 'object');
    assert.equal(typeof scores.taste.W, 'object');
    assert.equal(typeof scores.taste.B, 'object');
    assert.equal(typeof scores.taste.O, 'object');

    assert.equal(typeof scores.philosophy.A, 'object');
    assert.equal(typeof scores.philosophy.S, 'object');

    assert.equal(typeof scores.novelty.E, 'object');
    assert.equal(typeof scores.novelty.C, 'object');
  });

  it('handles empty scores {} without error', () => {
    // Create a minimal question with an empty-scores option
    const questions = [
      {
        id: 1,
        text: 'test',
        dimension: 'stimulus-H',
        options: [
          { label: 'A', text: 'neutral', scores: {} },
          { label: 'B', text: 'scoring', scores: { H: 1 } }
        ]
      }
    ];
    const answers = ['A'];
    // Should not throw and all codes should be 0
    const scores = calculateScores(answers, questions);
    assert.equal(scores.stimulus.H.sum, 0);
    assert.equal(scores.stimulus.H.count, 0);
    assert.equal(scores.stimulus.H.avg, 0);
    assert.equal(scores.stimulus.N.sum, 0);
    assert.equal(scores.stimulus.N.count, 0);
    assert.equal(scores.stimulus.N.avg, 0);
  });

  it('handles multi-code scores like { "M": 0.5, "N": 0.5 }', () => {
    const questions = [
      {
        id: 1,
        text: 'test',
        dimension: 'stimulus-M',
        options: [
          { label: 'A', text: 'multi', scores: { M: 0.5, N: 0.5 } }
        ]
      }
    ];
    const answers = ['A'];
    const scores = calculateScores(answers, questions);
    assert.equal(scores.stimulus.M.avg, 0.5);
    assert.equal(scores.stimulus.M.sum, 0.5);
    assert.equal(scores.stimulus.M.count, 1);
    assert.equal(scores.stimulus.N.avg, 0.5);
    assert.equal(scores.stimulus.N.sum, 0.5);
    assert.equal(scores.stimulus.N.count, 1);
  });

  it('accumulates scores across multiple questions in same dimension', () => {
    const questions = [
      {
        id: 1, text: 'q1', dimension: 'stimulus-H',
        options: [{ label: 'A', text: 'a', scores: { H: 1 } }]
      },
      {
        id: 2, text: 'q2', dimension: 'stimulus-H',
        options: [{ label: 'A', text: 'a', scores: { H: 1 } }]
      }
    ];
    const answers = ['A', 'A'];
    const scores = calculateScores(answers, questions);
    assert.equal(scores.stimulus.H.sum, 2);
    assert.equal(scores.stimulus.H.count, 2);
    assert.equal(scores.stimulus.H.avg, 1);
  });

  it('computes cumulative average correctly', () => {
    const questions = [
      {
        id: 1, text: 'q1', dimension: 'stimulus-H',
        options: [{ label: 'A', text: 'a', scores: { H: 3 } }]
      },
      {
        id: 2, text: 'q2', dimension: 'stimulus-H',
        options: [{ label: 'A', text: 'a', scores: { H: 1 } }]
      },
      {
        id: 3, text: 'q3', dimension: 'stimulus-H',
        options: [{ label: 'A', text: 'a', scores: { H: 2 } }]
      }
    ];
    const answers = ['A', 'A', 'A'];
    const scores = calculateScores(answers, questions);
    assert.equal(scores.stimulus.H.sum, 6);
    assert.equal(scores.stimulus.H.count, 3);
    assert.equal(scores.stimulus.H.avg, 2);
  });

  it('counts explicit zero scores toward count (lowering avg)', () => {
    const questions = [
      {
        id: 1, text: 'q1', dimension: 'stimulus-H',
        options: [{ label: 'A', text: 'a', scores: { H: 3, M: 0 } }]
      },
      {
        id: 2, text: 'q2', dimension: 'stimulus-H',
        options: [{ label: 'A', text: 'a', scores: { H: 0, M: 3 } }]
      }
    ];
    const answers = ['A', 'A'];
    const scores = calculateScores(answers, questions);
    // H: first Q gives H:3, second Q gives H:0 → avg = 3/2 = 1.5
    assert.equal(scores.stimulus.H.sum, 3);
    assert.equal(scores.stimulus.H.count, 2);
    assert.equal(scores.stimulus.H.avg, 1.5);
    // M: first Q gives M:0, second Q gives M:3 → avg = 3/2 = 1.5
    assert.equal(scores.stimulus.M.sum, 3);
    assert.equal(scores.stimulus.M.count, 2);
    assert.equal(scores.stimulus.M.avg, 1.5);
  });

  it('code with fewer ratings can beat code with more ratings via higher avg', () => {
    const questions = [
      {
        id: 1, text: 'q1', dimension: 'stimulus-H',
        options: [{ label: 'A', text: 'a', scores: { H: 3 } }]
      },
      {
        id: 2, text: 'q2', dimension: 'stimulus-H',
        options: [{ label: 'A', text: 'a', scores: { H: 3 } }]
      },
      {
        id: 3, text: 'q3', dimension: 'stimulus-H',
        options: [{ label: 'A', text: 'a', scores: { N: 3 } }]
      }
    ];
    const answers = ['A', 'A', 'A'];
    const scores = calculateScores(answers, questions);
    const percentages = calculatePercentages(scores);
    // H: avg=3, N: avg=3 → both have same avg → equal percentage
    // This proves N isn't penalized for being scored fewer times
    assert.equal(scores.stimulus.H.avg, 3);
    assert.equal(scores.stimulus.N.avg, 3);
    assert.ok(Math.abs(percentages.stimulus.H - percentages.stimulus.N) < 0.01,
      'codes with same avg should have same percentage regardless of count');
  });
});

// ---------- calculatePercentages ----------

describe('calculatePercentages', () => {
  it('calculates percentages that sum to ~100 per dimension', () => {
    const scores = {
      stimulus: { H: { sum: 6, count: 2, avg: 3 }, N: { sum: 4, count: 2, avg: 2 }, C: { sum: 2, count: 2, avg: 1 }, M: { sum: 0, count: 1, avg: 0 } },
      taste: { U: { sum: 2, count: 1, avg: 2 }, S: { sum: 1, count: 1, avg: 1 }, W: { sum: 1, count: 1, avg: 1 }, B: { sum: 0, count: 0, avg: 0 }, O: { sum: 0, count: 0, avg: 0 } },
      philosophy: { A: { sum: 3, count: 1, avg: 3 }, S: { sum: 1, count: 1, avg: 1 } },
      novelty: { E: { sum: 2, count: 1, avg: 2 }, C: { sum: 4, count: 1, avg: 4 } }
    };
    const percentages = calculatePercentages(scores);

    // stimulus: avg total=3+2+1+0=6, H=50, N=33.33, C=16.67, M=0
    assert.ok(Math.abs(percentages.stimulus.H - 50) < 0.01);
    assert.ok(Math.abs(percentages.stimulus.N - 33.33) < 0.1);
    assert.ok(Math.abs(percentages.stimulus.C - 16.67) < 0.1);
    assert.equal(percentages.stimulus.M, 0);

    // philosophy: avg total=3+1=4, A=75, S=25
    assert.equal(percentages.philosophy.A, 75);
    assert.equal(percentages.philosophy.S, 25);
  });

  it('handles zero total in a dimension (all avgs zero)', () => {
    const scores = {
      stimulus: { H: { sum: 0, count: 0, avg: 0 }, N: { sum: 0, count: 0, avg: 0 }, C: { sum: 0, count: 0, avg: 0 }, M: { sum: 0, count: 0, avg: 0 } },
      taste: { U: { sum: 1, count: 1, avg: 1 }, S: { sum: 0, count: 0, avg: 0 }, W: { sum: 0, count: 0, avg: 0 }, B: { sum: 0, count: 0, avg: 0 }, O: { sum: 0, count: 0, avg: 0 } },
      philosophy: { A: { sum: 0, count: 0, avg: 0 }, S: { sum: 0, count: 0, avg: 0 } },
      novelty: { E: { sum: 0, count: 0, avg: 0 }, C: { sum: 0, count: 0, avg: 0 } }
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
      { id: 1, text: 'q1', dimension: 'stimulus-H', options: [
        { label: 'A', text: 'a', scores: { H: 1 } }
      ]},
      { id: 2, text: 'q2', dimension: 'taste-U', options: [
        { label: 'A', text: 'a', scores: { U: 1 } }
      ]},
      { id: 3, text: 'q3', dimension: 'philosophy-A', options: [
        { label: 'A', text: 'a', scores: { A: 1 } },
        { label: 'B', text: 'b', scores: { S: 1 } }
      ]},
      { id: 4, text: 'q4', dimension: 'novelty-E', options: [
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
        id: 1, text: 'q1', dimension: 'stimulus-H',
        options: [
          { label: 'A', text: 'a', scores: { constructor: 1, H: 1 } }
        ]
      }
    ];
    const answers = ['A'];
    // Should not add to constructor or crash; only H should be incremented
    const scores = calculateScores(answers, questions);
    assert.equal(scores.stimulus.H.sum, 1);
    // Verify no pollution — dimScores should only have H, N, C, M
    const keys = Object.keys(scores.stimulus);
    assert.deepEqual(keys.sort(), ['C', 'H', 'M', 'N']);
  });
});

// ---------- Bug fix: selectQuestions undersized pool ----------

describe('selectQuestions undersized pool', () => {
  it('throws when question pool is too small to select required total', () => {
    // Build a minimal questionsData with only 2 stimulus questions (need 8)
    const tinyData = {
      dimensions: ['stimulus'],
      questions: [
        { id: 1, text: 'q1', dimension: 'stimulus-H', options: [
          { label: 'A', text: 'a', scores: { H: 1 } }
        ]},
        { id: 2, text: 'q2', dimension: 'stimulus-N', options: [
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
    // Build questionsData where philosophy has no 'S'-tagged questions at all
    // (minPerTendency requires A:2 and S:2, but all philosophy questions are tagged A)
    const noSecondaryData = {
      dimensions: ['stimulus', 'taste', 'philosophy', 'novelty'],
      questions: [
        // stimulus: 8 questions with H, N, C, M coverage (2 each)
        { id: 1, text: 'q1', dimension: 'stimulus-H', options: [
          { label: 'A', text: 'a', scores: { H: 1 } }
        ]},
        { id: 2, text: 'q2', dimension: 'stimulus-H', options: [
          { label: 'A', text: 'a', scores: { H: 1 } }
        ]},
        { id: 3, text: 'q3', dimension: 'stimulus-N', options: [
          { label: 'A', text: 'a', scores: { N: 1 } }
        ]},
        { id: 4, text: 'q4', dimension: 'stimulus-N', options: [
          { label: 'A', text: 'a', scores: { N: 1 } }
        ]},
        { id: 5, text: 'q5', dimension: 'stimulus-C', options: [
          { label: 'A', text: 'a', scores: { C: 1 } }
        ]},
        { id: 6, text: 'q6', dimension: 'stimulus-C', options: [
          { label: 'A', text: 'a', scores: { C: 1 } }
        ]},
        { id: 7, text: 'q7', dimension: 'stimulus-M', options: [
          { label: 'A', text: 'a', scores: { M: 1 } }
        ]},
        { id: 8, text: 'q8', dimension: 'stimulus-M', options: [
          { label: 'A', text: 'a', scores: { M: 1 } }
        ]},
        // taste: 8 questions with U, S, W, B, O (at least 1 each)
        { id: 10, text: 'q10', dimension: 'taste-U', options: [
          { label: 'A', text: 'a', scores: { U: 1 } }
        ]},
        { id: 11, text: 'q11', dimension: 'taste-S', options: [
          { label: 'A', text: 'a', scores: { S: 1 } }
        ]},
        { id: 12, text: 'q12', dimension: 'taste-W', options: [
          { label: 'A', text: 'a', scores: { W: 1 } }
        ]},
        { id: 13, text: 'q13', dimension: 'taste-B', options: [
          { label: 'A', text: 'a', scores: { B: 1 } }
        ]},
        { id: 14, text: 'q14', dimension: 'taste-O', options: [
          { label: 'A', text: 'a', scores: { O: 1 } }
        ]},
        { id: 15, text: 'q15', dimension: 'taste-U', options: [
          { label: 'A', text: 'a', scores: { U: 1 } }
        ]},
        { id: 16, text: 'q16', dimension: 'taste-S', options: [
          { label: 'A', text: 'a', scores: { S: 1 } }
        ]},
        { id: 17, text: 'q17', dimension: 'taste-W', options: [
          { label: 'A', text: 'a', scores: { W: 1 } }
        ]},
        // philosophy: 4 questions but ALL are A-tagged, NO S-tagged
        // minPerTendency requires A:2, S:2 — S will fail
        { id: 20, text: 'q20', dimension: 'philosophy-A', options: [
          { label: 'A', text: 'a', scores: { A: 1 } },
          { label: 'B', text: 'b', scores: { S: 1 } }
        ]},
        { id: 21, text: 'q21', dimension: 'philosophy-A', options: [
          { label: 'A', text: 'a', scores: { A: 1 } }
        ]},
        { id: 22, text: 'q22', dimension: 'philosophy-A', options: [
          { label: 'A', text: 'a', scores: { A: 1 } }
        ]},
        { id: 23, text: 'q23', dimension: 'philosophy-A', options: [
          { label: 'A', text: 'a', scores: { A: 1 } }
        ]},
        // novelty: 4 questions with E, C (2 each)
        { id: 30, text: 'q30', dimension: 'novelty-E', options: [
          { label: 'A', text: 'a', scores: { E: 1 } }
        ]},
        { id: 31, text: 'q31', dimension: 'novelty-E', options: [
          { label: 'A', text: 'a', scores: { E: 1 } }
        ]},
        { id: 32, text: 'q32', dimension: 'novelty-C', options: [
          { label: 'A', text: 'a', scores: { C: 1 } }
        ]},
        { id: 33, text: 'q33', dimension: 'novelty-C', options: [
          { label: 'A', text: 'a', scores: { C: 1 } }
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
        id: 1, text: 'q1', dimension: 'stimulus-H',
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
        id: 1, text: 'q1', dimension: 'stimulus-H',
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
        id: 1, text: 'q1', dimension: 'stimulus-H',
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
      { id: 1, text: 'q1', dimension: 'stimulus-H', options: [
        { label: 'A', text: 'a', scores: { H: 1 } }
      ]},
      { id: 2, text: 'q2', dimension: 'stimulus-N', options: [
        { label: 'A', text: 'a', scores: { N: 1 } }
      ]},
      { id: 3, text: 'q3', dimension: 'taste-U', options: [
        { label: 'A', text: 'a', scores: { U: 1 } }
      ]},
      { id: 4, text: 'q4', dimension: 'novelty-E', options: [
        { label: 'A', text: 'a', scores: { E: 1 } }
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
