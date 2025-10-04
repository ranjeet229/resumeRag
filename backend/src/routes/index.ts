import { Router } from 'express';
import resumeRouter from './resume.routes';
import jobRouter from './job.routes';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';

const router = Router();

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per window in production
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
router.use(apiLimiter);

// Mount routes
router.use('/resumes', resumeRouter);
router.use('/jobs', jobRouter);

export default router;