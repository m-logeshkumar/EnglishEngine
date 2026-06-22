export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function ensureNumber(value, fallback = 0) {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
}

export function ensureString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export function normalizeAssessmentResult(result = {}, defaults = {}) {
  const score = ensureNumber(result?.score ?? result?.overallScore, 0);
  const overallScore = ensureNumber(result?.overallScore ?? result?.score, 0);

  return {
    ...defaults,
    ...result,

    tips: ensureArray(result?.tips),
    mistakes: ensureArray(result?.mistakes),
    mispronounced: ensureArray(result?.mispronounced),
    missedWords: ensureArray(result?.missedWords),

    score,
    overallScore,

    grammar: ensureNumber(result?.grammar ?? result?.grammarClarity, 0),
    grammarClarity: ensureNumber(result?.grammarClarity ?? result?.grammar, 0),
    fluency: ensureNumber(result?.fluency, 0),
    vocabulary: ensureNumber(result?.vocabulary, 0),
    confidence: ensureNumber(result?.confidence, 0),
    pronunciation: ensureNumber(result?.pronunciation, 0),
    listeningScore: ensureNumber(result?.listeningScore ?? result?.listening, 0),
    accuracy: ensureNumber(result?.accuracy, 0),

    feedback: ensureString(result?.feedback),
    performanceLevel: ensureString(result?.performanceLevel, 'Beginner'),
  };
}
