export class TokenCounter {
  /**
   * Count tokens in a text string (OpenAI GPT tokenizer approximation)
   * This is a simplified approximation. For production, consider using GPT-specific tokenizers.
   */
  public countTokens(text: string): number {
    // Simple approximation: Split on whitespace and punctuation
    const words = text.split(/\s+|[.,!?;:"\-()[\]{}]/);
    
    // Filter out empty strings
    const validWords = words.filter(word => word.length > 0);
    
    // Add 1 token for each word and additional tokens for long words
    let totalTokens = 0;
    for (const word of validWords) {
      totalTokens += Math.ceil(word.length / 4); // Assume ~4 chars per token average
    }
    
    return Math.max(totalTokens, 1); // Always return at least 1 token
  }

  /**
   * Truncate text to maximum number of tokens
   */
  public truncateToTokens(text: string, maxTokens: number): string {
    if (this.countTokens(text) <= maxTokens) {
      return text;
    }

    const words = text.split(/\s+/);
    let currentTokens = 0;
    let truncatedWords = [];

    for (const word of words) {
      const wordTokens = this.countTokens(word);
      if (currentTokens + wordTokens <= maxTokens) {
        truncatedWords.push(word);
        currentTokens += wordTokens;
      } else {
        break;
      }
    }

    return truncatedWords.join(' ') + '...';
  }

  /**
   * Calculate approximate token usage for a conversation
   * This helps in staying within OpenAI's context limits
   */
  public calculateConversationTokens(messages: Array<{ role: string, content: string }>): number {
    // Base tokens for conversation overhead
    let totalTokens = 3; // Every reply is primed with <|start|>assistant<|message|>

    for (const message of messages) {
      // Add tokens for message role (system, user, assistant)
      totalTokens += 4; // Role formatting tokens

      // Add tokens for the content
      totalTokens += this.countTokens(message.content);
    }

    return totalTokens;
  }
}