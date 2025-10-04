import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../app';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '../models/user.model';

let mongo: MongoMemoryServer;

// Create test JWT tokens
export const createTestToken = (userId: string, role: UserRole = UserRole.USER) => {
  return jwt.sign({ id: userId, role }, config.jwtSecret, {
    expiresIn: '1h',
  });
};

// Setup test database before all tests
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);
});

// Clear all collections before each test
beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});

// Create a test client
export const testClient = supertest(app);

// Helper to create authenticated request
export const authenticatedRequest = (token: string) => {
  return testClient.set('Authorization', `Bearer ${token}`);
};

// Helper to create test user
export const createTestUser = async (role: UserRole = UserRole.USER) => {
  const response = await testClient
    .post('/api/auth/register')
    .send({
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      role,
    });
  
  return {
    user: response.body.user,
    token: response.body.token,
  };
};

// Mock file upload
export const mockFileUpload = (fileContent: string = 'test content') => {
  const buffer = Buffer.from(fileContent);
  return {
    originalname: 'test.pdf',
    buffer,
    mimetype: 'application/pdf',
  };
};

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));