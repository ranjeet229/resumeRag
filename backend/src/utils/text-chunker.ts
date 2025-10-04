interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
  preserveParagraphs?: boolean;
}

export class TextChunker {
  /**
   * Split text into chunks with optional overlap
   */
  static chunkText(text: string, options: ChunkOptions = {}): string[] {
    const {
      maxChunkSize = 1000,
      overlap = 100,
      preserveParagraphs = true,
    } = options;

    // Clean and normalize text
    const cleanText = this.cleanText(text);

    if (preserveParagraphs) {
      return this.chunkByParagraphs(cleanText, maxChunkSize, overlap);
    }

    return this.chunkBySize(cleanText, maxChunkSize, overlap);
  }

  /**
   * Clean and normalize text
   */
  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
      .replace(/\n\s*/g, '\n')     // Remove spaces after newlines
      .trim();
  }

  /**
   * Split text into chunks by paragraphs
   */
  private static chunkByParagraphs(
    text: string,
    maxChunkSize: number,
    overlap: number
  ): string[] {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentSize = 0;

    for (const paragraph of paragraphs) {
      const paragraphSize = paragraph.length;

      if (currentSize + paragraphSize > maxChunkSize && currentChunk.length > 0) {
        // Store current chunk
        chunks.push(currentChunk.join('\n\n'));
        
        // Start new chunk with overlap
        const overlapSize = currentChunk.join('\n\n').length;
        currentChunk = [];
        currentSize = 0;

        // Add overlap from previous paragraphs if possible
        let overlapText = '';
        for (let i = chunks.length - 1; i >= 0; i--) {
          const chunk = chunks[i];
          overlapText = chunk.slice(Math.max(0, chunk.length - overlap)) + overlapText;
          if (overlapText.length >= overlap) break;
        }
        
        if (overlapText) {
          currentChunk.push(overlapText);
          currentSize += overlapText.length;
        }
      }

      currentChunk.push(paragraph);
      currentSize += paragraphSize;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
    }

    return chunks;
  }

  /**
   * Split text into chunks by size
   */
  private static chunkBySize(
    text: string,
    maxChunkSize: number,
    overlap: number
  ): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentSize = 0;

    for (const word of words) {
      if (currentSize + word.length > maxChunkSize && currentChunk.length > 0) {
        // Store current chunk
        chunks.push(currentChunk.join(' '));
        
        // Start new chunk with overlap
        const overlapWords = currentChunk.slice(
          Math.max(0, currentChunk.length - Math.ceil(overlap / 5))
        );
        currentChunk = [...overlapWords];
        currentSize = overlapWords.join(' ').length;
      }

      currentChunk.push(word);
      currentSize += word.length + 1; // +1 for space
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }
}