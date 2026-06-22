import { Score } from '../models/Score.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { sanitize, sanitizeObject, validateScore } from '../utils/validation.js';

function toDayKeyUTC(date) {
  return date.toISOString().slice(0, 10);
}

function getYesterdayKeyUTC(now = new Date()) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 1);
  return toDayKeyUTC(d);
}

export async function saveScore(req, res, next) {
  try {
    const { userId, name, college, overall, scores, performanceLevel, strengths, weaknesses, tips, ...rest } = req.body;

    // Security check: restrict non-admins from spoofing other user IDs
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      console.warn(`[SCORE SECURITY] Unauthorized score submission attempt by user ${req.user.id} for user ${userId}`);
      throw new AppError('Forbidden: Cannot save score for another user', 'AUTH_FORBIDDEN', 403);
    }

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      throw new AppError('Valid userId is required', 'VALIDATION_ERROR', 400);
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError('Valid name is required', 'VALIDATION_ERROR', 400);
    }

    // Validate score data
    const scoreValidation = validateScore(overall);
    if (!scoreValidation.valid) {
      throw new AppError(scoreValidation.error, 'VALIDATION_ERROR', 400);
    }

    // Validate scores object
    if (!scores || typeof scores !== 'object') {
      throw new AppError('Valid scores object is required', 'VALIDATION_ERROR', 400);
    }

    const { reading, listening, speaking } = scores;
    if (typeof reading !== 'number' || typeof listening !== 'number' || typeof speaking !== 'number') {
      throw new AppError('All scores must be numbers', 'VALIDATION_ERROR', 400);
    }

    // Validate score ranges
    for (const [key, value] of Object.entries(scores)) {
      if (typeof value !== 'number' || value < 0 || value > 100) {
        throw new AppError(`Score for ${key} must be between 0 and 100`, 'VALIDATION_ERROR', 400);
      }
    }

    // Validate performanceLevel
    const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    if (!performanceLevel || !validLevels.includes(performanceLevel)) {
      throw new AppError('Valid performanceLevel is required', 'VALIDATION_ERROR', 400);
    }

    // Sanitize strings
    const sanitizedName = sanitize(name);
    const sanitizedCollege = sanitize(college || '');

    // Validate and sanitize arrays
    const sanitizedStrengths = Array.isArray(strengths) 
      ? strengths.filter(s => typeof s === 'string' && s.trim().length > 0).map(s => sanitize(s))
      : [];
      
    const sanitizedWeaknesses = Array.isArray(weaknesses)
      ? weaknesses.filter(w => typeof w === 'string' && w.trim().length > 0).map(w => sanitize(w))
      : [];
      
    const sanitizedTips = Array.isArray(tips)
      ? tips.filter(t => typeof t === 'string' && t.trim().length > 0).map(t => sanitize(t))
      : [];

    // Create score object
    const scoreData = {
      userId,
      name: sanitizedName,
      college: sanitizedCollege,
      overall,
      scores: {
        reading: Math.round(reading),
        listening: Math.round(listening),
        speaking: Math.round(speaking),
      },
      performanceLevel,
      strengths: sanitizedStrengths,
      weaknesses: sanitizedWeaknesses,
      tips: sanitizedTips,
      ...rest,
    };

    // Save score
    const score = await Score.create(scoreData);

    // Update user streak
    let streak = null;
    const user = await User.findById(userId);
    if (user) {
      const todayKey = toDayKeyUTC(new Date());
      const lastKey = user.lastAssessmentDate ? toDayKeyUTC(new Date(user.lastAssessmentDate)) : null;

      if (!lastKey) {
        user.streak = 1;
      } else if (lastKey === todayKey) {
        user.streak = Math.max(user.streak || 0, 1);
      } else if (lastKey === getYesterdayKeyUTC()) {
        user.streak = (user.streak || 0) + 1;
      } else {
        user.streak = 1;
      }

      user.lastAssessmentDate = new Date();
      await user.save();
      streak = user.streak;
      console.log(`[SCORE SUCCESS] Saved score for ${user.email}. Current streak: ${streak}`);
    }

    return res.status(201).json({ score, streak });
  } catch (error) {
    next(error);
  }
}

export async function getUserScores(req, res, next) {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      throw new AppError('Valid userId is required', 'VALIDATION_ERROR', 400);
    }

    if (req.user.role !== 'admin' && userId !== req.user.id) {
      throw new AppError('Forbidden: Cannot access scores of another user', 'AUTH_FORBIDDEN', 403);
    }

    const scores = await Score.find({ userId }).sort({ createdAt: -1 });
    return res.json({ scores });
  } catch (error) {
    next(error);
  }
}

export async function getAllScores(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Admin access required', 'AUTH_FORBIDDEN', 403);
    }

    const scores = await Score.find().sort({ createdAt: -1 });
    return res.json({ scores });
  } catch (error) {
    next(error);
  }
}

export async function getLeaderboard(req, res, next) {
  try {
    const { period = 'all' } = req.query;
    
    const validPeriods = ['all', 'weekly', 'monthly'];
    if (!validPeriods.includes(period)) {
      throw new AppError('Invalid period. Must be "all", "weekly", or "monthly"', 'VALIDATION_ERROR', 400);
    }

    let scores = await Score.find().sort({ createdAt: -1 });

    if (period === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      scores = scores.filter((s) => s.createdAt >= weekAgo);
    }

    if (period === 'monthly') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      scores = scores.filter((s) => s.createdAt >= monthAgo);
    }

    const byUser = {};
    for (const score of scores) {
      const key = score.userId;
      if (!byUser[key] || score.overall > byUser[key].overall) {
        byUser[key] = score;
      }
    }

    const leaderboard = Object.values(byUser).sort((a, b) => b.overall - a.overall);
    return res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
}

export async function deleteScore(req, res, next) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      throw new AppError('Valid score ID is required', 'VALIDATION_ERROR', 400);
    }

    const deleted = await Score.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Assessment result not found', 'NOT_FOUND', 404);
    }

    console.log(`[SCORE SUCCESS] Deleted score record ID: ${id}`);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}