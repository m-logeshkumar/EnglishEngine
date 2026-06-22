import { AssessmentContent } from '../models/AssessmentContent.js';
import { AppError } from '../middleware/errorHandler.js';
import { sanitize, validateContent } from '../utils/validation.js';

const ALLOWED_TYPES = ['paragraph', 'topic', 'listening'];

export async function getByType(req, res, next) {
  try {
    const { type } = req.params;
    
    if (!ALLOWED_TYPES.includes(type)) {
      throw new AppError('Invalid content type', 'VALIDATION_ERROR', 400);
    }
    
    const items = await AssessmentContent.find({ type }).sort({ createdAt: -1 });
    return res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function createContent(req, res, next) {
  try {
    const { type } = req.params;
    
    if (!ALLOWED_TYPES.includes(type)) {
      throw new AppError('Invalid content type', 'VALIDATION_ERROR', 400);
    }

    // Admin check
    if (req.user.role !== 'admin') {
      throw new AppError('Admin access required', 'AUTH_FORBIDDEN', 403);
    }

    const { title, text, description, difficulty, audioUrl } = req.body;

    // Validate required fields
    const contentValidation = validateContent(type, req.body);
    if (!contentValidation.valid) {
      throw new AppError(contentValidation.error, 'VALIDATION_ERROR', 400);
    }

    // Sanitize inputs
    const sanitizedTitle = sanitize(title);
    const sanitizedText = sanitize(text);
    const sanitizedDescription = description ? sanitize(description) : '';
    const sanitizedDifficulty = difficulty ? sanitize(difficulty) : 'Beginner';
    const sanitizedAudioUrl = audioUrl ? sanitize(audioUrl) : '';

    const payload = {
      type,
      title: sanitizedTitle,
      text: sanitizedText,
      description: sanitizedDescription,
      difficulty: sanitizedDifficulty,
      audioUrl: sanitizedAudioUrl,
    };

    const created = await AssessmentContent.create(payload);
    console.log(`[CONTENT SUCCESS] Created content: ${created.title} (Type: ${type})`);
    return res.status(201).json({ item: created });
  } catch (error) {
    next(error);
  }
}

export async function deleteContent(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      throw new AppError('Admin access required', 'AUTH_FORBIDDEN', 403);
    }

    if (!id || typeof id !== 'string') {
      throw new AppError('Valid content ID is required', 'VALIDATION_ERROR', 400);
    }

    const deleted = await AssessmentContent.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Content not found', 'NOT_FOUND', 404);
    }

    console.log(`[CONTENT SUCCESS] Deleted content ID: ${id}`);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}