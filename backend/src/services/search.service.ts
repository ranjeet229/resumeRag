import { RedisCache } from './cache.service';
import { VectorService } from './vector.service';
import { EmbeddingService } from './embedding.service';
import logger from '../utils/logger';

export interface SearchResult {
  id: string;
  text: string;
  chunk: string;
  score: number;
  metadata?: Record<string, any>;
  matches?: {
    text: string;
    score: number;
  }[];
}

export interface SearchFilters {
  skills?: string[];
  experienceMin?: number;
  experienceMax?: number;
  location?: string;
  education?: string[];
}

export class SearchService {
  private static instance: SearchService;
  private vectorService: VectorService;
  private embeddingService: EmbeddingService;
  private cache: RedisCache;

  private constructor(
    vectorService: VectorService,
    embeddingService: EmbeddingService
  ) {
    this.vectorService = vectorService;
    this.embeddingService = embeddingService;
    this.cache = new RedisCache();
  }

  public static async getInstance(): Promise<SearchService> {
    if (!SearchService.instance) {
      const vectorService = await VectorService.getInstance();
      const embeddingService = EmbeddingService.getInstance();
      SearchService.instance = new SearchService(vectorService, embeddingService);
    }
    return SearchService.instance;
  }

  /**
   * Search resumes with semantic similarity and filters
   */
  async search(
    query: string,
    filters?: SearchFilters,
    topK: number = 10
  ): Promise<SearchResult[]> {
    try {
      // Check cache first
      const cacheKey = `search:${query}:${JSON.stringify(filters)}:${topK}`;
      const cachedResults = await this.cache.get(cacheKey);

      if (cachedResults) {
        return JSON.parse(cachedResults);
      }

      // Generate query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Build Pinecone filter
      const pineconeFilter = this.buildPineconeFilter(filters);

      // Query vector database
      const searchResults = await this.vectorService.query(
        queryEmbedding,
        topK,
        pineconeFilter
      );

      // Process and rank results
      const results = this.processSearchResults(searchResults);

      // Cache results for 1 hour
      await this.cache.set(cacheKey, JSON.stringify(results), 3600);

      return results;
    } catch (error) {
      logger.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Build Pinecone filter from search filters
   */
  private buildPineconeFilter(filters?: SearchFilters): object | undefined {
    if (!filters) return undefined;

    const filter: any = {};

    if (filters.skills?.length) {
      filter.$and = filters.skills.map(skill => ({
        skills: { $in: [skill.toLowerCase()] },
      }));
    }

    if (filters.experienceMin !== undefined || filters.experienceMax !== undefined) {
      filter.experience = {};
      if (filters.experienceMin !== undefined) {
        filter.experience.$gte = filters.experienceMin;
      }
      if (filters.experienceMax !== undefined) {
        filter.experience.$lte = filters.experienceMax;
      }
    }

    if (filters.location) {
      filter.location = { $eq: filters.location.toLowerCase() };
    }

    if (filters.education?.length) {
      filter.education = {
        $in: filters.education.map(edu => edu.toLowerCase()),
      };
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  /**
   * Process and rank search results
   */
  private processSearchResults(searchResults: any): SearchResult[] {
    return searchResults.matches
      .map((match: any) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
        matches: match.metadata.chunks.map((chunk: string, index: number) => ({
          text: chunk,
          score: match.scores[index],
        })),
      }))
      .sort((a: SearchResult, b: SearchResult) => b.score - a.score);
  }

  /**
   * Clear search cache
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await this.cache.client.keys('search:*');
      if (keys.length > 0) {
        await this.cache.client.del(...keys);
      }
    } catch (error) {
      logger.error('Error clearing search cache:', error);
      throw error;
    }
  }
}