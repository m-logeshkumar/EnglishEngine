import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(message, errorCode = 'SERVER_ERROR', statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.isOperational = true;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, req, res, next) {
  // Log error with details
  console.error(`[ERROR] ${err.name}: ${err.message}`);
  console.error(`[ERROR] Path: ${req.method} ${req.path}`);
  if (err.stack && env.nodeEnv !== 'production') {
    console.error(`[ERROR] Stack: ${err.stack}`);
  }

  // Default error values
  let statusCode = 500;
  let errorCode = 'SERVER_ERROR';
  let message = 'An internal server error occurred';

  // Handle specific error types
  if (err.isOperational) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Invalid ID format';
  } else if (err.name === 'MongoError' && err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ERROR';
    message = 'Duplicate entry found';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Token expired';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    message = 'Too many requests, please try again later';
  }

  // Remove stack traces in production
  const response = {
    success: false,
    message,
    errorCode,
  };

  if (env.nodeEnv !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 'NOT_FOUND', 404));
};