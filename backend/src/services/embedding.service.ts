import OpenAI from 'openai';
import { RedisCache } from './cache.service';
import { TextChunker } from '../utils/text-chunker';
import { env } from '../config/env';
import logger from '../utils/logger';

export class EmbeddingService {
  private static instance: EmbeddingService;
  private openai: OpenAI;
  private cache: RedisCache;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.cache = new RedisCache();
  }

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Generate embeddings for text with caching
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Check cache first
      const cacheKey = `embedding:${text}`;
      const cachedEmbedding = await this.cache.get(cacheKey);
      
      if (cachedEmbedding) {
        return JSON.parse(cachedEmbedding);
      }

      // Generate new embedding
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.replace(/\n/g, ' '),
      });

      const embedding = response.data[0].embedding;

      // Cache the result for 24 hours
      await this.cache.set(cacheKey, JSON.stringify(embedding), 86400);

      return embedding;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple chunks of text
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }

  /**
   * Process a document: chunk it and generate embeddings
   */
  async processDocument(text: string): Promise<{
    chunks: string[];
    embeddings: number[][];
  }> {
    // Chunk the text
    const chunks = TextChunker.chunkText(text, {
      maxChunkSize: 1000,
      overlap: 100,
      preserveParagraphs: true,
    });

    // Generate embeddings for all chunks
    const embeddings = await this.generateEmbeddings(chunks);

    return { chunks, embeddings };
  }
}