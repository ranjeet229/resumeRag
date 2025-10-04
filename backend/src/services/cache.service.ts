import Redis from 'ioredis';
import logger from '../utils/logger';

export class RedisCache {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Successfully connected to Redis');
    });
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.set(key, value, 'EX', ttl);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
      throw error;
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset(keyValues: Record<string, string>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.client.pipeline();
      
      Object.entries(keyValues).forEach(([key, value]) => {
        if (ttl) {
          pipeline.set(key, value, 'EX', ttl);
        } else {
          pipeline.set(key, value);
        }
      });

      await pipeline.exec();
    } catch (error) {
      logger.error('Redis mset error:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  async clear(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error) {
      logger.error('Redis clear error:', error);
      throw error;
    }
  }
}