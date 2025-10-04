import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Rate limiting middleware to prevent brute force attacks and abuse.
 * Uses a sliding window approach to track requests.
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // Time window for requests
  max: env.RATE_LIMIT_MAX_REQUESTS, // Max requests per window per IP
  message: {
    error: 'Too many requests, please try again later.',
    code: 429
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});