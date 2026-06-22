import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import { validateRequest } from './middleware/validate.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Trust proxy for rate limiting behind Render/reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", env.clientOrigin || 'http://localhost:3000'],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: env.clientOrigin || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { 
    success: false, 
    message: 'Too many requests from this IP, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global rate limiter
app.use('/api', limiter);
app.use(limiter);

// Apply stricter rate limiter to auth routes
app.use('/api/auth', authLimiter);
app.use('/auth', authLimiter);

// Request parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// Root endpoint for Render health checks
app.get('/', (_req, res) => {
  res.status(200).send('VoiceIQ Backend is active.');
});

// Health check (not rate limited)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'voiceiq-backend', environment: env.nodeEnv });
});
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'voiceiq-backend', environment: env.nodeEnv });
});

// Routes with validation
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/content', validateRequest, contentRoutes);
app.use('/content', validateRequest, contentRoutes);

app.use('/api/scores', validateRequest, scoreRoutes);
app.use('/scores', validateRequest, scoreRoutes);

app.use('/api/assessments', validateRequest, assessmentRoutes);
app.use('/assessments', validateRequest, assessmentRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;