import { apiRequest } from './apiClient';

function getPerformanceLevel(score) {
  if (score >= 86) return 'Expert';
  if (score >= 66) return 'Advanced';
  if (score >= 41) return 'Intermediate';
  return 'Beginner';
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeAssessmentResult(result = {}, defaults = {}) {
  const normalized = {
    ...result,
    ...defaults,
    tips: ensureArray(result?.tips),
    mispronounced: ensureArray(result?.mispronounced),
    missedWords: ensureArray(result?.missedWords),
    mistakes: ensureArray(result?.mistakes),
  };

  // Ensure score is set
  if (typeof normalized.overallScore !== 'number') {
    normalized.overallScore = 0;
  }

  // Ensure performanceLevel is set
  if (!normalized.performanceLevel && typeof normalized.overallScore === 'number') {
    normalized.performanceLevel = getPerformanceLevel(normalized.overallScore);
  }

  // Ensure all numeric fields are numbers
  const numericFields = [
    'pronunciation', 'fluency', 'grammarClarity', 'speechSpeed',
    'pausesHesitation', 'confidence', 'accentClarity', 'wordStress',
    'listeningScore', 'accuracy', 'memoryRetention', 'speechClarity',
    'accent', 'vocabulary', 'grammar', 'topicRelevance', 'speakingFlow',
    'ideaClarity', 'wordCount', 'uniqueWordCount'
  ];
  
  for (const field of numericFields) {
    if (typeof normalized[field] !== 'number') {
      normalized[field] = 0;
    }
  }

  return normalized;
}

async function retryRequest(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000))
      ]);
    } catch (err) {
      lastError = err;
      const isRetryable = 
        err.message.includes('timeout') ||
        err.message.includes('429') ||
        err.message.includes('500') ||
        err.message.includes('502') ||
        err.message.includes('503') ||
        err.message.includes('504');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

export async function analyzeReading(transcript, referenceText) {
  try {
    const response = await retryRequest(async () => {
      return await apiRequest('/assessments/reading', {
        method: 'POST',
        body: JSON.stringify({ transcript, referenceText }),
      }, true);
    });
    
    const result = response?.result || {};
    return normalizeAssessmentResult(result);
  } catch (error) {
    console.error('Reading analysis failed:', error);
    return normalizeAssessmentResult({
      overallScore: 0,
      performanceLevel: 'Beginner',
      feedback: 'Analysis service temporarily unavailable. Please try again.',
      tips: ['Please ensure you have a stable internet connection and try again.'],
      mistakes: ['Service temporarily unavailable.'],
      mispronounced: [],
      missedWords: [],
    });
  }
}

export async function analyzeListening(transcript, originalText) {
  try {
    const response = await retryRequest(async () => {
      return await apiRequest('/assessments/listening', {
        method: 'POST',
        body: JSON.stringify({ transcript, originalText }),
      }, true);
    });
    
    const result = response?.result || {};
    return normalizeAssessmentResult(result);
  } catch (error) {
    console.error('Listening analysis failed:', error);
    return normalizeAssessmentResult({
      overallScore: 0,
      performanceLevel: 'Beginner',
      feedback: 'Analysis service temporarily unavailable. Please try again.',
      tips: ['Please ensure you have a stable internet connection and try again.'],
      mistakes: ['Service temporarily unavailable.'],
      mispronounced: [],
      missedWords: [],
    });
  }
}

export async function analyzeJAM(transcript, topic) {
  try {
    const response = await retryRequest(async () => {
      return await apiRequest('/assessments/jam', {
        method: 'POST',
        body: JSON.stringify({ transcript, topic }),
      }, true);
    });
    
    const result = response?.result || {};
    return normalizeAssessmentResult(result);
  } catch (error) {
    console.error('JAM analysis failed:', error);
    return normalizeAssessmentResult({
      overallScore: 0,
      performanceLevel: 'Beginner',
      feedback: 'Analysis service temporarily unavailable. Please try again.',
      tips: ['Please ensure you have a stable internet connection and try again.'],
      mistakes: ['Service temporarily unavailable.'],
      mispronounced: [],
      missedWords: [],
    });
  }
}

export async function getAiStatus() {
  try {
    const response = await retryRequest(async () => {
      return await apiRequest('/assessments/status');
    });
    return response?.status || { ok: false };
  } catch (error) {
    console.error('AI status check failed:', error);
    return { ok: false };
  }
}

export function generateFinalReport(readingResult, listeningResult, jamResult) {
  const normalizedReading = normalizeAssessmentResult(readingResult);
  const normalizedListening = normalizeAssessmentResult(listeningResult);
  const normalizedJam = normalizeAssessmentResult(jamResult);

  const scores = {
    reading: typeof normalizedReading?.overallScore === 'number' ? normalizedReading.overallScore : 0,
    listening: typeof normalizedListening?.overallScore === 'number' ? normalizedListening.overallScore : 0,
    speaking: typeof normalizedJam?.overallScore === 'number' ? normalizedJam.overallScore : 0,
  };
  
  const overall = Math.round((scores.reading + scores.listening + scores.speaking) / 3);
  
  const strengths = [];
  const weaknesses = [];
  
  if (scores.reading >= 70) strengths.push('Reading & Pronunciation');
  else weaknesses.push('Reading & Pronunciation');
  if (scores.listening >= 70) strengths.push('Listening & Comprehension');
  else weaknesses.push('Listening & Comprehension');
  if (scores.speaking >= 70) strengths.push('Speaking & Fluency');
  else weaknesses.push('Speaking & Fluency');

  const allTips = [
    ...ensureArray(normalizedReading?.tips),
    ...ensureArray(normalizedListening?.tips),
    ...ensureArray(normalizedJam?.tips),
  ];

  return {
    overall,
    performanceLevel: getPerformanceLevel(overall),
    scores,
    pronunciation: typeof normalizedReading?.pronunciation === 'number' ? normalizedReading.pronunciation : 0,
    fluency: Math.round(((normalizedReading?.fluency || 0) + (normalizedJam?.fluency || 0)) / 2),
    listening: typeof normalizedListening?.listeningScore === 'number' ? normalizedListening.listeningScore : 0,
    confidence: Math.round(((normalizedReading?.confidence || 0) + (normalizedJam?.confidence || 0)) / 2),
    vocabulary: typeof normalizedJam?.vocabulary === 'number' ? normalizedJam.vocabulary : 0,
    grammar: Math.round(((normalizedReading?.grammarClarity || 0) + (normalizedJam?.grammar || 0)) / 2),
    strengths: strengths.length > 0 ? strengths : ['Keep practicing to build strengths!'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Excellent across all areas!'],
    tips: [...new Set(allTips)].slice(0, 6),
    date: new Date().toISOString(),
  };
}