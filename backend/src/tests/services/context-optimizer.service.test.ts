import { ContextOptimizer, ContextResult } from '../../services/context-optimizer.service';

describe('ContextOptimizer', () => {
  let contextOptimizer: ContextOptimizer;

  const mockResults: ContextResult[] = [
    {
      text: 'Experienced software engineer with 5 years of React development experience.',
      resumeId: 'resume1',
      score: 0.95,
      metadata: {
        date: new Date('2023-01-01').toISOString(),
      },
    },
    {
      text: 'Senior software engineer with extensive React development background.',
      resumeId: 'resume2',
      score: 0.85,
      metadata: {
        date: new Date('2023-06-01').toISOString(),
      },
    },
    {
      text: 'Full stack developer with expertise in Node.js and MongoDB.',
      resumeId: 'resume3',
      score: 0.75,
      metadata: {
        date: new Date('2023-09-01').toISOString(),
      },
    },
  ];

  beforeEach(() => {
    contextOptimizer = new ContextOptimizer(1000, 0.6);
  });

  describe('optimizeContext', () => {
    it('should remove duplicate or similar content', () => {
      const results = contextOptimizer.optimizeContext(mockResults);

      // First two results are similar (both about React development)
      // Should only include one of them
      const reactResults = results.filter(r => 
        r.text.toLowerCase().includes('react')
      );
      expect(reactResults).toHaveLength(1);
    });

    it('should prioritize higher scoring results', () => {
      const results = contextOptimizer.optimizeContext(mockResults);

      // Results should be sorted by score
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should respect token limits', () => {
      // Create optimizer with very low token limit
      const tightOptimizer = new ContextOptimizer(10, 0.6);
      const results = tightOptimizer.optimizeContext(mockResults);

      // Should only include truncated content
      expect(results).toHaveLength(1);
      expect(results[0].text.endsWith('...')).toBe(true);
    });

    it('should filter out low relevance results', () => {
      const lowScoreResults = [
        ...mockResults,
        {
          text: 'Irrelevant content',
          resumeId: 'resume4',
          score: 0.3,
          metadata: {},
        },
      ];

      const results = contextOptimizer.optimizeContext(lowScoreResults);

      // Should not include the low scoring result
      expect(results.every(r => r.score >= 0.6)).toBe(true);
    });

    it('should handle empty input', () => {
      const results = contextOptimizer.optimizeContext([]);
      expect(results).toEqual([]);
    });

    it('should handle results without metadata', () => {
      const resultsWithoutMetadata = mockResults.map(({ text, resumeId, score }) => ({
        text,
        resumeId,
        score,
      }));

      const results = contextOptimizer.optimizeContext(resultsWithoutMetadata);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});