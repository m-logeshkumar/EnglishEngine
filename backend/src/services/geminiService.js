import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { normalizeAssessmentResult } from '../utils/normalizer.js';

const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
];

let cachedStatus = null;
let lastStatusAt = 0;
const STATUS_TTL_MS = 5 * 60 * 1000;

function fallbackLevel(score) {
  if (score >= 86) return 'Expert';
  if (score >= 66) return 'Advanced';
  if (score >= 41) return 'Intermediate';
  return 'Beginner';
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function words(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function compareText(transcript, reference) {
  const spoken = words(transcript);
  const target = words(reference);
  const spokenSet = new Set(spoken);

  const correct = [];
  const missed = [];
  for (const w of target) {
    if (spokenSet.has(w)) correct.push(w);
    else missed.push(w);
  }

  const accuracy = target.length ? (correct.length / target.length) * 100 : 0;
  return { spoken, target, correct, missed, accuracy: clamp(accuracy) };
}

function buildFallbackResult(kind, payload = {}, reason = 'Gemini is currently unavailable.') {
  console.warn(`[GEMINI FALLBACK] Kind: ${kind}, Reason: ${reason}`);
  const reasonText = `Using fallback analysis: ${reason}`;
  const tipText = 'Use concise sentence structure, maintain steady pacing, articulate word endings, and self-correct immediately after slips to improve clarity and fluency.';

  if (kind === 'reading') {
    const { transcript = '', referenceText = '' } = payload;
    const cmp = compareText(transcript, referenceText);
    const overallScore = clamp(cmp.accuracy * 0.9 + 10);
    const pronunciation = clamp(overallScore - 2);
    const fluency = clamp(overallScore + (cmp.spoken.length > 20 ? 2 : -4));
    const grammarClarity = clamp(50 + overallScore * 0.45);
    const speechSpeed = clamp(45 + Math.min(cmp.spoken.length, 120) * 0.35);
    const pausesHesitation = clamp(fluency - 3);
    const confidence = clamp(fluency + 1);
    const accentClarity = clamp(pronunciation - 1);
    const wordStress = clamp(pronunciation - 2);

    return normalizeAssessmentResult({
      overallScore,
      pronunciation,
      fluency,
      grammarClarity,
      speechSpeed,
      pausesHesitation,
      confidence,
      accentClarity,
      wordStress,
      mispronounced: [],
      missedWords: cmp.missed.slice(0, 10),
      mistakes: [reasonText, ...(cmp.missed.length ? [`Missed ${cmp.missed.length} word(s) from reference text.`] : [])],
      tips: [tipText, ...(fluency < 60 ? ['Practice reading aloud daily to improve fluency and pacing.'] : [])],
      performanceLevel: fallbackLevel(overallScore),
      feedback: `Self-paced reading evaluation. ${reasonText}`,
    });
  }

  if (kind === 'listening') {
    const { transcript = '', originalText = '' } = payload;
    const cmp = compareText(transcript, originalText);
    const overallScore = clamp(cmp.accuracy * 0.9 + 10);
    const listeningScore = clamp(overallScore + 1);
    const pronunciation = clamp(overallScore - 1);
    const fluency = clamp(overallScore);
    const memoryRetention = clamp(cmp.accuracy - 3);
    const speechClarity = clamp(50 + overallScore * 0.45);
    const accent = clamp(pronunciation - 2);

    return normalizeAssessmentResult({
      overallScore,
      listeningScore,
      accuracy: cmp.accuracy,
      pronunciation,
      fluency,
      memoryRetention,
      speechClarity,
      accent,
      mispronounced: [],
      missedWords: cmp.missed.slice(0, 8),
      mistakes: [reasonText, ...(cmp.missed.length ? [`Missed ${cmp.missed.length} key word(s) from audio.`] : [])],
      tips: [tipText, ...(cmp.accuracy < 60 ? ['Replay audio and summarize key points before recording.'] : [])],
      performanceLevel: fallbackLevel(overallScore),
      feedback: `Listening repetition evaluation. ${reasonText}`,
    });
  }

  const { transcript = '', topic = '' } = payload;
  const spoken = words(transcript);
  const unique = new Set(spoken);
  const topicWords = new Set(words(topic));
  const topicOverlap = spoken.filter((w) => topicWords.has(w)).length;
  const vocabRichness = spoken.length ? (unique.size / spoken.length) * 100 : 0;
  const flowBase = spoken.length >= 80 ? 75 : spoken.length >= 40 ? 62 : 48;
  const topicRelevance = clamp(45 + topicOverlap * 12);
  const overallScore = clamp((flowBase + vocabRichness * 0.4 + topicRelevance * 0.35) / 1.75);

  return normalizeAssessmentResult({
    overallScore,
    fluency: clamp(flowBase),
    vocabulary: clamp(vocabRichness * 0.85 + 25),
    grammar: clamp(overallScore - 2),
    confidence: clamp(overallScore + 1),
    topicRelevance,
    speakingFlow: clamp(flowBase - 1),
    ideaClarity: clamp((topicRelevance + flowBase) / 2),
    wordCount: spoken.length,
    uniqueWordCount: unique.size,
    vocabLevel: vocabRichness > 70 ? 'Advanced' : vocabRichness > 45 ? 'Intermediate' : 'Basic',
    mistakes: [reasonText],
    tips: [tipText, ...(spoken.length < 50 ? ['Speak longer (at least 80-100 words) to improve score reliability.'] : [])],
    performanceLevel: fallbackLevel(overallScore),
    feedback: `Spontaneous speaking (Just A Minute) evaluation. ${reasonText}`,
  });
}

function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
  );
}

async function requestWithTimeoutAndRetry(genAI, modelName, prompt, timeoutMs = 15000, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const apiCall = model.generateContent(prompt);
      const result = await Promise.race([apiCall, timeoutPromise(timeoutMs)]);
      return result;
    } catch (err) {
      attempt++;
      const statusStr = String(err.status || err.statusCode || '');
      const isRetryable =
        statusStr.includes('429') ||
        statusStr.includes('500') ||
        statusStr.includes('502') ||
        statusStr.includes('503') ||
        statusStr.includes('504') ||
        err.message.includes('429') ||
        err.message.includes('500') ||
        err.message.includes('503') ||
        err.message.includes('rate limit') ||
        err.message.includes('timed out') ||
        err.message.includes('overloaded');

      if (!isRetryable || attempt >= maxRetries) {
        throw err;
      }
      
      const backoffMs = Math.pow(2, attempt) * 1000;
      console.warn(`[GEMINI RETRY] Transient error on model ${modelName}. Attempt ${attempt}/${maxRetries}. Retrying in ${backoffMs}ms. Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

function safeNormalizeResponse(parsed) {
  const result = {
    overallScore: 0,
    performanceLevel: 'Beginner',
    feedback: '',
    tips: [],
    mistakes: [],
    mispronounced: [],
    missedWords: [],
    pronunciation: 0,
    fluency: 0,
    grammarClarity: 0,
    speechSpeed: 0,
    pausesHesitation: 0,
    confidence: 0,
    accentClarity: 0,
    wordStress: 0,
    listeningScore: 0,
    accuracy: 0,
    memoryRetention: 0,
    speechClarity: 0,
    accent: 0,
    vocabulary: 0,
    grammar: 0,
    topicRelevance: 0,
    speakingFlow: 0,
    ideaClarity: 0,
    wordCount: 0,
    uniqueWordCount: 0,
    vocabLevel: 'Basic',
  };

  // Copy all values from parsed, but ensure they're valid
  for (const key of Object.keys(result)) {
    if (parsed && typeof parsed[key] !== 'undefined' && parsed[key] !== null) {
      if (typeof result[key] === 'number' && typeof parsed[key] === 'number') {
        result[key] = clamp(parsed[key]);
      } else if (Array.isArray(result[key]) && Array.isArray(parsed[key])) {
        result[key] = parsed[key];
      } else if (typeof result[key] === 'string' && typeof parsed[key] === 'string') {
        result[key] = parsed[key];
      }
    }
  }

  // Ensure score is set
  if (!result.overallScore && parsed && typeof parsed.overallScore === 'number') {
    result.overallScore = clamp(parsed.overallScore);
  }

  // Ensure performanceLevel is set
  if (!result.performanceLevel || result.performanceLevel === '') {
    result.performanceLevel = fallbackLevel(result.overallScore);
  }

  // Ensure arrays are arrays
  result.tips = Array.isArray(result.tips) ? result.tips : [];
  result.mistakes = Array.isArray(result.mistakes) ? result.mistakes : [];
  result.mispronounced = Array.isArray(result.mispronounced) ? result.mispronounced : [];
  result.missedWords = Array.isArray(result.missedWords) ? result.missedWords : [];

  return result;
}

export async function analyzeWithGemini(kind, payload) {
  if (!env.geminiApiKey) {
    return buildFallbackResult(kind, payload, 'GEMINI_API_KEY is missing.');
  }

  const genAI = new GoogleGenerativeAI(env.geminiApiKey);

  const prompt = `You are an English speaking assessment engine.
You will assess the user's transcript and return the result ONLY as a JSON object matching the detailed JSON schema specifications. Do not include any explanations, markdown comments, or formatting outside the JSON code block.

Assessment type: ${kind}.
Payload: ${JSON.stringify(payload)}

Required fields in the returned JSON:
- overallScore (0-100 integer)
- performanceLevel (One of: "Beginner", "Intermediate", "Advanced", "Expert")
- feedback (A detailed descriptive paragraph explaining their performance)
- tips (Array of strings, containing clear actionable advice for improvement)
- mistakes (Array of strings, detailing specific speech patterns, pronunciation, or grammar errors made)
${
  kind === 'reading' || kind === 'listening'
    ? `- mispronounced (Array of objects, each containing: { expected: string, actual: string })
- missedWords (Array of strings)
- pronunciation (0-100 integer)
- fluency (0-100 integer)
- grammarClarity (0-100 integer)
- speechSpeed (0-100 integer)
- pausesHesitation (0-100 integer)
- confidence (0-100 integer)
- accentClarity (0-100 integer)
- wordStress (0-100 integer)`
    : ''
}
${
  kind === 'listening'
    ? `- listeningScore (0-100 integer)
- accuracy (0-100 integer)
- memoryRetention (0-100 integer)
- speechClarity (0-100 integer)
- accent (0-100 integer)`
    : ''
}
${
  kind === 'jam'
    ? `- fluency (0-100 integer)
- vocabulary (0-100 integer)
- grammar (0-100 integer)
- confidence (0-100 integer)
- topicRelevance (0-100 integer)
- speakingFlow (0-100 integer)
- ideaClarity (0-100 integer)
- wordCount (integer)
- uniqueWordCount (integer)
- vocabLevel (One of: "Basic", "Intermediate", "Advanced")`
    : ''
}
`;

  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      console.log(`[GEMINI REQUEST] Attempting analysis using model: ${modelName}`);
      const result = await requestWithTimeoutAndRetry(genAI, modelName, prompt, 15000, 3);
      const rawText = result.response.text().trim();
      
      const normalized = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed = JSON.parse(normalized);
      
      // Strict validation checks
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed Gemini output is not an object.');
      }
      
      const normalizedResult = safeNormalizeResponse(parsed);
      console.log(`[GEMINI SUCCESS] Model ${modelName} processed request successfully.`);
      return normalizedResult;
    } catch (err) {
      console.error(`[GEMINI ERROR] Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  const reason = lastError?.message || 'No supported Gemini model responded successfully.';
  return buildFallbackResult(kind, payload, reason);
}

export async function getGeminiStatus(force = false) {
  const now = Date.now();
  if (!force && cachedStatus && now - lastStatusAt < STATUS_TTL_MS) {
    return cachedStatus;
  }

  if (!env.geminiApiKey) {
    cachedStatus = {
      ok: false,
      provider: 'gemini',
      mode: 'fallback',
      model: null,
      reason: 'GEMINI_API_KEY is missing.',
      checkedAt: new Date().toISOString(),
    };
    lastStatusAt = now;
    return cachedStatus;
  }

  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const result = await requestWithTimeoutAndRetry(
        genAI,
        modelName,
        'Respond with exactly: OK',
        5000,
        2
      );
      const text = result.response.text().trim();

      const ok = text.toUpperCase().includes('OK');
      if (ok) {
        cachedStatus = {
          ok: true,
          provider: 'gemini',
          mode: 'live',
          model: modelName,
          reason: 'Gemini responded successfully.',
          checkedAt: new Date().toISOString(),
        };
        lastStatusAt = now;
        return cachedStatus;
      }
    } catch (err) {
      lastError = err;
    }
  }

  cachedStatus = {
    ok: false,
    provider: 'gemini',
    mode: 'fallback',
    model: null,
    reason: lastError?.message || 'No supported Gemini model responded successfully.',
    checkedAt: new Date().toISOString(),
  };
  lastStatusAt = now;
  return cachedStatus;
}