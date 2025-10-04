import { PineconeClient, Vector, QueryResponse } from '@pinecone-database/pinecone';
import { env } from '../config/env';
import logger from '../utils/logger';
import { RedisCache } from './cache.service';

export class VectorService {
  private static instance: VectorService;
  private client: PineconeClient;
  private cache: RedisCache;
  private indexName: string;
  private namespace = 'resumes';

  private constructor() {
    this.client = new PineconeClient();
    this.indexName = env.PINECONE_INDEX;
    this.cache = new RedisCache();
  }

  public static async getInstance(): Promise<VectorService> {
    if (!VectorService.instance) {
      VectorService.instance = new VectorService();
      await VectorService.instance.init();
    }
    return VectorService.instance;
  }

  /**
   * Initialize Pinecone client
   */
  private async init(): Promise<void> {
    try {
      await this.client.init({
        apiKey: env.PINECONE_API_KEY,
        environment: env.PINECONE_ENVIRONMENT,
      });
      logger.info('Successfully initialized Pinecone client');
    } catch (error) {
      logger.error('Failed to initialize Pinecone client:', error);
      throw error;
    }
  }

  /**
   * Upsert vectors to Pinecone
   */
  async upsertVectors(vectors: Vector[]): Promise<void> {
    try {
      const index = this.client.Index(this.indexName);
      await index.upsert({
        upsertRequest: {
          vectors,
          namespace: this.namespace,
        },
      });
      logger.info(`Successfully upserted ${vectors.length} vectors`);
    } catch (error) {
      logger.error('Failed to upsert vectors:', error);
      throw error;
    }
  }

  /**
   * Query vectors from Pinecone
   */
  async query(
    queryVector: number[],
    topK: number = 5,
    filter?: object
  ): Promise<QueryResponse> {
    try {
      const cacheKey = `query:${JSON.stringify({ vector: queryVector, topK, filter })}`;
      const cachedResult = await this.cache.get(cacheKey);
      
      if (cachedResult) {
        logger.info('Returning cached query result');
        return JSON.parse(cachedResult);
      }

      const index = this.client.Index(this.indexName);
      const queryResponse = await index.query({
        queryRequest: {
          vector: queryVector,
          topK,
          includeMetadata: true,
          namespace: this.namespace,
          filter,
        },
      });

      // Cache results for 1 hour
      await this.cache.set(cacheKey, JSON.stringify(queryResponse), 3600);
      
      return queryResponse;
    } catch (error) {
      logger.error('Failed to query vectors:', error);
      throw error;
    }
  }

  /**
   * Delete vectors from Pinecone
   */
  async deleteVectors(ids: string[]): Promise<void> {
    try {
      const index = this.client.Index(this.indexName);
      await index.delete1({
        ids,
        namespace: this.namespace,
      });
      logger.info(`Successfully deleted ${ids.length} vectors`);
    } catch (error) {
      logger.error('Failed to delete vectors:', error);
      throw error;
    }
  }
}