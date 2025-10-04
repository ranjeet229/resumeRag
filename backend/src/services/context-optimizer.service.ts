import { TokenCounter } from '../utils/token-counter';
import logger from '../utils/logger';

interface RelevanceScore {
  score: number;
  factors: {
    similarity: number;
    recency?: number;
    length: number;
    uniqueness: number;
  };
}

export interface ContextResult {
  text: string;
  resumeId: string;
  score: number;
  metadata?: Record<string, any>;
}

export class ContextOptimizer {
  private tokenCounter: TokenCounter;
  private maxTokens: number;
  private minRelevanceScore: number;

  constructor(maxTokens: number = 3000, minRelevanceScore: number = 0.6) {
    this.tokenCounter = new TokenCounter();
    this.maxTokens = maxTokens;
    this.minRelevanceScore = minRelevanceScore;
  }

  /**
   * Optimize and prune context for better answer generation
   */
  public optimizeContext(results: ContextResult[]): ContextResult[] {
    try {
      // Calculate relevance scores for each result
      const scoredResults = results.map(result => ({
        ...result,
        relevanceScore: this.calculateRelevanceScore(result)
      }));

      // Filter out low relevance results
      const filteredResults = scoredResults.filter(
        result => result.relevanceScore.score >= this.minRelevanceScore
      );

      // Sort by relevance score
      const sortedResults = filteredResults.sort(
        (a, b) => b.relevanceScore.score - a.relevanceScore.score
      );

      // Deduplicate and merge similar content
      const deduplicatedResults = this.deduplicateResults(sortedResults);

      // Prune to fit token limit
      return this.pruneToTokenLimit(deduplicatedResults);
    } catch (error) {
      logger.error('Error optimizing context:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive relevance score
   */
  private calculateRelevanceScore(result: ContextResult): RelevanceScore {
    // Base similarity score
    const similarity = result.score;

    // Calculate text length score (prefer moderate length snippets)
    const textLength = result.text.length;
    const optimalLength = 200;
    const lengthScore = Math.exp(-(Math.pow(textLength - optimalLength, 2) / (2 * Math.pow(100, 2))));

    // Calculate recency score if available
    let recencyScore = undefined;
    if (result.metadata?.date) {
      const age = Date.now() - new Date(result.metadata.date).getTime();
      recencyScore = Math.exp(-age / (365 * 24 * 60 * 60 * 1000));
    }

    // Calculate uniqueness score (compared to other pieces of context)
    const uniquenessScore = 0.8; // Default for now, implement more sophisticated calculation if needed

    // Combine scores with weights
    const totalScore = (
      similarity * 0.4 +
      lengthScore * 0.3 +
      (recencyScore || 0.5) * 0.1 +
      uniquenessScore * 0.2
    );

    return {
      score: totalScore,
      factors: {
        similarity,
        recency: recencyScore,
        length: lengthScore,
        uniqueness: uniquenessScore
      }
    };
  }

  /**
   * Remove duplicate or highly similar content
   */
  private deduplicateResults(results: Array<ContextResult & { relevanceScore: RelevanceScore }>): ContextResult[] {
    const deduped: ContextResult[] = [];
    const seenContent = new Set<string>();

    for (const result of results) {
      // Normalize text for comparison
      const normalizedText = this.normalizeText(result.text);

      // Skip if we've seen very similar content
      let isDuplicate = false;
      for (const seen of seenContent) {
        if (this.calculateSimilarity(normalizedText, seen) > 0.8) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seenContent.add(normalizedText);
        deduped.push(result);
      }
    }

    return deduped;
  }

  /**
   * Prune context to fit within token limit
   */
  private pruneToTokenLimit(results: ContextResult[]): ContextResult[] {
    let totalTokens = 0;
    const prunedResults: ContextResult[] = [];

    for (const result of results) {
      const tokens = this.tokenCounter.countTokens(result.text);
      
      if (totalTokens + tokens <= this.maxTokens) {
        prunedResults.push(result);
        totalTokens += tokens;
      } else {
        // Try to fit partial content if possible
        const remainingTokens = this.maxTokens - totalTokens;
        if (remainingTokens >= 100) { // Only include if we can fit meaningful content
          const truncatedText = this.truncateToTokens(result.text, remainingTokens);
          prunedResults.push({
            ...result,
            text: truncatedText
          });
        }
        break;
      }
    }

    return prunedResults;
  }

  /**
   * Calculate similarity between two text strings
   */
  private calculateSimilarity(text1: string, text2: string): number {
    // Implement a simple Jaccard similarity for now
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  /**
   * Truncate text to fit within token limit
   */
  private truncateToTokens(text: string, maxTokens: number): string {
    const words = text.split(/\s+/);
    let currentTokens = 0;
    let truncatedWords = [];

    for (const word of words) {
      const wordTokens = this.tokenCounter.countTokens(word);
      if (currentTokens + wordTokens <= maxTokens) {
        truncatedWords.push(word);
        currentTokens += wordTokens;
      } else {
        break;
      }
    }

    return truncatedWords.join(' ') + '...';
  }
}