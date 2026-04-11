/**
 * modules/scoring.js
 * 评分引擎
 */

export function calculateType(answers, questions, types) {
  // answers: array of 'A'|'B'|'C'|'D' strings (length 16)
  // questions: array from data/questions.json (used for validation)
  // types: types object from data/types.json (used for validation/extensibility)

  // Fallback for invalid/incomplete answers — returns 'SCNU' with zero scores
  if (!answers || answers.length < 16) {
    return {
      typeCode: 'SCNU',
      scores: { stimulus: 0, crunch: 0, neophilic: 0, umami: 0 },
      dimensionResults: { stimulus: 'M', crunch: 'W', neophilic: 'T', umami: 'P' }
    };
  }

  // Validate answers length against questions
  if (!questions || answers.length !== questions.length) {
    throw new Error(`Expected ${questions?.length ?? 16} answers, got ${answers.length}`);
  }

  // Dimension scoring map: [startIndex, endIndex, thresholds, resultMap]
  // Dim1 stimulus (Q1-Q4, indices 0-3): A=+1, D=+0.5, B/C=+0 → S if >= 2.5 else M
  // Dim2 crunch (Q5-Q8, indices 4-7): A/C=+1, B=-0.5, D=0 → C if >= 2.5 else W
  // Dim3 neophilic (Q9-Q12, indices 8-11): A=+1, B=-1, C/D=0 → N if >= 1 else T
  // Dim4 umami (Q13-Q16, indices 12-15): A=+1, B=-1, C/D=0 → U if >= 1 else P

  // Dimension 1: Stimulus (indices 0-3)
  let stimulus = 0;
  for (let i = 0; i < 4; i++) {
    const a = answers[i];
    if (a === 'A') stimulus += 1;
    else if (a === 'D') stimulus += 0.5;
    // B and C contribute 0
  }
  const stimulusResult = stimulus >= 2.5 ? 'S' : 'M';

  // Dimension 2: Crunch (indices 4-7)
  let crunch = 0;
  for (let i = 4; i < 8; i++) {
    const a = answers[i];
    if (a === 'A' || a === 'C') crunch += 1;
    else if (a === 'B') crunch -= 0.5;
    // D contributes 0
  }
  const crunchResult = crunch >= 2.5 ? 'C' : 'W';

  // Dimension 3: Neophilic (indices 8-11)
  let neophilic = 0;
  for (let i = 8; i < 12; i++) {
    const a = answers[i];
    if (a === 'A') neophilic += 1;
    else if (a === 'B') neophilic -= 1;
    // C and D contribute 0
  }
  const neophilicResult = neophilic >= 1 ? 'N' : 'T';

  // Dimension 4: Umami (indices 12-15)
  let umami = 0;
  for (let i = 12; i < 16; i++) {
    const a = answers[i];
    if (a === 'A') umami += 1;
    else if (a === 'B') umami -= 1;
    // C and D contribute 0
  }
  const umamiResult = umami >= 1 ? 'U' : 'P';

  const typeCode = stimulusResult + crunchResult + neophilicResult + umamiResult;
  const scores = { stimulus, crunch, neophilic, umami };
  const dimensionResults = { stimulus: stimulusResult, crunch: crunchResult, neophilic: neophilicResult, umami: umamiResult };

  return { typeCode, scores, dimensionResults };
}
