import { analyzeWithGemini, getGeminiStatus } from '../services/geminiService.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateAssessmentInput } from '../utils/validation.js';

export async function getAiStatus(req, res, next) {
  try {
    const status = await getGeminiStatus();
    return res.json({ status });
  } catch (error) {
    next(new AppError('Failed to fetch AI status', 'SERVER_ERROR', 500));
  }
}

export async function analyzeReading(req, res, next) {
  try {
    const { transcript, referenceText } = req.body;
    
    // Input validation
    const validationError = validateAssessmentInput(transcript, referenceText);
    if (validationError) {
      throw new AppError(validationError, 'VALIDATION_ERROR', 400);
    }

    const result = await analyzeWithGemini('reading', { transcript, referenceText });
    return res.json({ result });
  } catch (error) {
    next(error);
  }
}

export async function analyzeListening(req, res, next) {
  try {
    const { transcript, originalText } = req.body;
    
    // Input validation
    const validationError = validateAssessmentInput(transcript, originalText);
    if (validationError) {
      throw new AppError(validationError, 'VALIDATION_ERROR', 400);
    }

    const result = await analyzeWithGemini('listening', { transcript, originalText });
    return res.json({ result });
  } catch (error) {
    next(error);
  }
}

export async function analyzeJam(req, res, next) {
  try {
    const { transcript, topic } = req.body;
    
    // Input validation
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 3) {
      throw new AppError('Transcript must be at least 3 characters long', 'VALIDATION_ERROR', 400);
    }
    
    if (transcript.length > 10000) {
      throw new AppError('Transcript exceeds maximum length of 10000 characters', 'VALIDATION_ERROR', 400);
    }
    
    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      throw new AppError('Valid topic is required', 'VALIDATION_ERROR', 400);
    }

    const result = await analyzeWithGemini('jam', { transcript, topic });
    return res.json({ result });
  } catch (error) {
    next(error);
  }
}