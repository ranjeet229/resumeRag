import cors from 'cors';
import { env } from '../config/env';

/**
 * CORS configuration middleware
 * Allows requests from the configured frontend URL in development
 * In production, only allows requests from specified origins
 */
const corsOptions: cors.CorsOptions = {
  origin: env.NODE_ENV === 'production' 
    ? env.FRONTEND_URL || false // In production, only allow configured frontend URL
    : true, // In development, allow all origins
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // Cache preflight request results for 24 hours
};

export const corsMiddleware = cors(corsOptions);