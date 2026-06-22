import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    
    if (!auth) {
      throw new AppError('Authorization header required', 'UNAUTHORIZED', 401);
    }

    if (!auth.startsWith('Bearer ')) {
      throw new AppError('Invalid authorization format. Use Bearer token.', 'UNAUTHORIZED', 401);
    }

    const token = auth.split(' ')[1];
    if (!token || token.length < 10) {
      throw new AppError('Invalid token format', 'UNAUTHORIZED', 401);
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret);
      
      // Validate payload
      if (!payload.id || !payload.email || !payload.role) {
        throw new AppError('Invalid token payload', 'UNAUTHORIZED', 401);
      }

      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };
      
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 'UNAUTHORIZED', 401);
      }
      if (err.name === 'JsonWebTokenError') {
        throw new AppError('Invalid token', 'UNAUTHORIZED', 401);
      }
      throw new AppError('Authentication failed', 'UNAUTHORIZED', 401);
    }
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 'AUTH_FORBIDDEN', 403));
  }
  return next();
}