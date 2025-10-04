import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Environment variables schema
const envSchema = z.object({
  // Server
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().optional(),

  // MongoDB
  MONGODB_URI: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string(),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number),
  ALLOWED_FILE_TYPES: z.string(),

  // AWS S3
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_BUCKET_NAME: z.string(),

  // Vector DB
  PINECONE_API_KEY: z.string(),
  PINECONE_ENVIRONMENT: z.string(),
  PINECONE_INDEX: z.string(),

  // OpenAI
  OPENAI_API_KEY: z.string(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

// Validate and export environment variables
export const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
  PINECONE_INDEX: process.env.PINECONE_INDEX,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
});