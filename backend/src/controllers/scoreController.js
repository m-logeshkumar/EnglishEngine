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
    const { userId, userName, college, overall, reading, listening, speaking, performanceLevel, report } = req.body;

    // Security check: restrict non-admins from spoofing other user IDs
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      console.warn(`[SCORE SECURITY] Unauthorized score submission attempt by user ${req.user.id} for user ${userId}`);
      throw new AppError('Forbidden: Cannot save score for another user', 'AUTH_FORBIDDEN', 403);
    }

    // Sanitize values
    const sanitizedUserName = sanitize(userName);
    const sanitizedCollege = sanitize(college || '');

    // Create score object matching Score schema
    const scoreData = {
      userId,
      userName: sanitizedUserName,
      college: sanitizedCollege,
      overall: Math.round(overall),
      reading: Math.round(reading),
      listening: Math.round(listening),
      speaking: Math.round(speaking),
      performanceLevel,
      report,
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