import { z } from 'zod';

// Mock environment schema
const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.string().default('test'),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  MAX_FILE_SIZE: z.string().default('5242880'),
  ALLOWED_FILE_TYPES: z.string(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_BUCKET_NAME: z.string(),
  PINECONE_API_KEY: z.string(),
  PINECONE_ENVIRONMENT: z.string(),
  PINECONE_INDEX: z.string(),
  OPENAI_API_KEY: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

// Mock environment variables for testing
export const env = {
  PORT: '3000',
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://localhost:27017/resumerag_test',
  JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-32chars',
  JWT_EXPIRES_IN: '1h',
  MAX_FILE_SIZE: '5242880',
  ALLOWED_FILE_TYPES: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
  AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  AWS_BUCKET_NAME: 'resumerag-test-bucket',
  PINECONE_API_KEY: 'test-pinecone-key',
  PINECONE_ENVIRONMENT: 'test-env',
  PINECONE_INDEX: 'test-index',
  OPENAI_API_KEY: 'test-openai-key',
  REDIS_URL: 'redis://localhost:6379',
};