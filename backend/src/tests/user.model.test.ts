import { User, UserRole } from '../models/user.model';
import mongoose from 'mongoose';

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid user', async () => {
      const validUser = new User({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      });

      const savedUser = await validUser.save();
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.role).toBe(UserRole.USER);
      // Password should be hashed
      expect(savedUser.password).not.toBe('password123');
    });

    it('should require email', async () => {
      const userWithoutEmail = new User({
        password: 'password123',
        role: UserRole.USER,
      });

      await expect(userWithoutEmail.save()).rejects.toThrow();
    });

    it('should require valid email format', async () => {
      const userWithInvalidEmail = new User({
        email: 'invalid-email',
        password: 'password123',
        role: UserRole.USER,
      });

      await expect(userWithInvalidEmail.save()).rejects.toThrow();
    });

    it('should require password', async () => {
      const userWithoutPassword = new User({
        email: 'test@example.com',
        role: UserRole.USER,
      });

      await expect(userWithoutPassword.save()).rejects.toThrow();
    });

    it('should hash password before saving', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      });

      const savedUser = await user.save();
      expect(savedUser.password).not.toBe('password123');
      expect(savedUser.password.length).toBeGreaterThan(20); // Hashed password is longer
    });
  });

  describe('Instance Methods', () => {
    let user: any;

    beforeEach(async () => {
      user = new User({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      });
      await user.save();
    });

    it('should compare password correctly', async () => {
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await User.create([
        { email: 'user1@example.com', password: 'pass123', role: UserRole.USER },
        { email: 'admin@example.com', password: 'pass123', role: UserRole.ADMIN },
      ]);
    });

    it('should find user by email', async () => {
      const user = await User.findByEmail('user1@example.com');
      expect(user).toBeDefined();
      expect(user?.email).toBe('user1@example.com');
    });

    it('should return null for non-existent email', async () => {
      const user = await User.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });
});