import { AppError } from './errorHandler.js';
import { sanitize } from '../utils/validation.js';

export function validateRequest(req, res, next) {
  try {
    // Validate content type for POST/PUT/PATCH requests
    const methods = ['POST', 'PUT', 'PATCH'];
    if (methods.includes(req.method)) {
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        throw new AppError('Content-Type must be application/json', 'VALIDATION_ERROR', 415);
      }
    }

    // Sanitize query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = sanitize(value);
        }
      }
    }

    // Sanitize body parameters (skip nested objects)
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          req.body[key] = sanitize(value);
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}