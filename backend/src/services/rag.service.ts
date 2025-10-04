import OpenAI from 'openai';
import { RedisCache } from './cache.service';
import { VectorService } from './vector.service';
import { SearchService } from './search.service';
import { ContextOptimizer } from './context-optimizer.service';
import { env } from '../config/env';
import logger from '../utils/logger';

interface SourceCitation {
  text: string;
  resumeId: string;
  score: number;
}

interface RAGResponse {
  answer: string;
  citations: SourceCitation[];
  confidence: number;
}

export class RAGService {
  private static instance: RAGService;
  private openai: OpenAI;
  private cache: RedisCache;
  private vectorService!: VectorService;
  private searchService!: SearchService;
  private contextOptimizer: ContextOptimizer;
  private initialized: boolean = false;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.cache = new RedisCache();
    this.contextOptimizer = new ContextOptimizer();
  }

  private async initialize() {
    if (!this.initialized) {
      this.vectorService = await VectorService.getInstance();
      this.searchService = await SearchService.getInstance();
      this.initialized = true;
    }
  }

  public static async getInstance(): Promise<RAGService> {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
      await RAGService.instance.initialize();
    }
    return RAGService.instance;
  }

  /**
   * Generate an answer to a question using retrieved context
   */
  public async generateAnswer(query: string, filters: Record<string, any> = {}): Promise<RAGResponse> {
    try {
      // Check cache first
      const cacheKey = `rag:${query}:${JSON.stringify(filters)}`;
      const cachedResponse = await this.cache.get(cacheKey);
      
      if (cachedResponse) {
        return JSON.parse(cachedResponse);
      }

      // Retrieve relevant context
      const context = await this.retrieveContext(query, filters);
      
      // Generate answer using context
      const response = await this.generateResponseWithContext(query, context);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(response, context);
      
      // Extract citations from context
      const citations = this.extractCitations(context);
      
      // Prepare final response
      const ragResponse: RAGResponse = {
        answer: response,
        citations,
        confidence,
      };

      // Cache response for 1 hour
      await this.cache.set(cacheKey, JSON.stringify(ragResponse), 3600);

      return ragResponse;
    } catch (error) {
      logger.error('Error generating RAG answer:', error);
      throw error;
    }
  }

  /**
   * Retrieve relevant context for the query
   */
  private async retrieveContext(query: string, filters: Record<string, any>): Promise<Array<{ text: string; resumeId: string; score: number }>> {
    // Get semantic search results
    const searchResults = await this.searchService.search(query, filters);

    // Convert search results to context format
    const context = searchResults.map(result => ({
      text: result.text,
      resumeId: result.id,
      score: result.score,
      metadata: result.metadata
    }));

    // Optimize context using the ContextOptimizer service
    return this.contextOptimizer.optimizeContext(context);

    // Prune context to fit within token limits
    return this.pruneContext(rankedContext);
  }

  /**
   * Generate a response using the retrieved context
   */
  private async generateResponseWithContext(query: string, context: Array<{ text: string; resumeId: string; score: number }>): Promise<string> {
    // Combine context into a single string
    const contextText = context.map(c => c.text).join('\n\n');

    // Create prompt with query and context
    const prompt = this.createPrompt(query, contextText);

    // Generate response using OpenAI
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional resume analysis assistant. Use the provided context to answer questions about resumes. Only make statements that are directly supported by the context. If you're not sure about something, say so. Always maintain professional tone and respect privacy.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more focused answers
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'Unable to generate answer';
  }

  /**
   * Create a prompt combining the query and context
   */
  private createPrompt(query: string, context: string): string {
    return `
Question: ${query}

Context:
${context}

Please provide a concise and accurate answer based solely on the information provided in the context above. If the context doesn't contain enough information to fully answer the question, please indicate what information is missing or uncertain.

Answer:`;
  }

  /**
   * Calculate confidence score for the generated answer
   */
  private calculateConfidence(answer: string, context: Array<{ text: string; resumeId: string; score: number }>): number {
    // Base confidence on context relevance scores
    const avgContextScore = context.reduce((sum, c) => sum + c.score, 0) / context.length;

    // Adjust confidence based on answer length and context coverage
    const answerLength = answer.length;
    const minLength = 10;
    const maxLength = 500;
    const lengthScore = Math.min(Math.max((answerLength - minLength) / (maxLength - minLength), 0), 1);

    // Combine scores with weights
    const confidence = (avgContextScore * 0.7) + (lengthScore * 0.3);
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Extract citations from context
   */
  private extractCitations(context: Array<{ text: string; resumeId: string; score: number }>): SourceCitation[] {
    return context.map(({ text, resumeId, score }) => ({
      text: this.truncateText(text),
      resumeId,
      score,
    }));
  }



  /**
   * Truncate text for citations
   */
  private truncateText(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}