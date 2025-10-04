import { RAGService } from '../../services/rag.service';
import { SearchService, SearchResult } from '../../services/search.service';
import { VectorService } from '../../services/vector.service';
import OpenAI from 'openai';

jest.mock('../../services/search.service');
jest.mock('../../services/vector.service');
jest.mock('openai');

describe('RAGService', () => {
  let ragService: RAGService;
  let mockSearchService: jest.Mocked<SearchService>;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockSearchResults: SearchResult[] = [
    {
      id: 'resume1',
      text: 'Experienced software engineer with 5 years of React development',
      chunk: 'Experienced software engineer with 5 years of React development',
      score: 0.95,
      metadata: {
        experience: 5,
        skills: ['react', 'javascript']
      }
    },
    {
      id: 'resume2',
      text: 'Full stack developer with expertise in Node.js and MongoDB',
      chunk: 'Full stack developer with expertise in Node.js and MongoDB',
      score: 0.85,
      metadata: {
        experience: 3,
        skills: ['node.js', 'mongodb']
      }
    }
  ];

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock OpenAI
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Mocked answer based on provided context'
              }
            }]
          })
        }
      }
    } as unknown as jest.Mocked<OpenAI>;

    // Mock SearchService
    mockSearchService = {
      search: jest.fn().mockResolvedValue(mockSearchResults)
    } as unknown as jest.Mocked<SearchService>;

    // Mock SearchService.getInstance
    (SearchService.getInstance as jest.Mock).mockResolvedValue(mockSearchService);
    
    // Mock VectorService.getInstance
    (VectorService.getInstance as jest.Mock).mockResolvedValue({});

    // Get RAGService instance
    ragService = await RAGService.getInstance();
  });

  describe('generateAnswer', () => {
    it('should generate an answer with proper citations', async () => {
      const query = 'What are the candidate\'s React experience?';
      const response = await ragService.generateAnswer(query);

      expect(response).toMatchObject({
        answer: expect.any(String),
        citations: expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('React'),
            resumeId: 'resume1',
            score: expect.any(Number)
          })
        ]),
        confidence: expect.any(Number)
      });

      expect(mockSearchService.search).toHaveBeenCalledWith(query, {});
    });

    it('should apply filters when provided', async () => {
      const query = 'Find Node.js developers';
      const filters = {
        experience: { min: 2, max: 5 },
        skills: ['node.js']
      };

      await ragService.generateAnswer(query, filters);

      expect(mockSearchService.search).toHaveBeenCalledWith(query, filters);
    });

    it('should calculate confidence based on context relevance', async () => {
      const query = 'What are the candidate\'s skills?';
      const response = await ragService.generateAnswer(query);

      // High confidence expected due to relevant mock results
      expect(response.confidence).toBeGreaterThan(0.8);
    });

    it('should handle cases with no relevant context', async () => {
      // Mock search service to return no results
      mockSearchService.search.mockResolvedValueOnce([]);

      const query = 'What are the candidate\'s skills in quantum computing?';
      const response = await ragService.generateAnswer(query);

      expect(response.confidence).toBeLessThan(0.5);
      expect(response.citations).toHaveLength(0);
    });

    it('should use proper prompting for answer generation', async () => {
      const query = 'What are the candidate\'s skills?';
      await ragService.generateAnswer(query);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('resume analysis assistant')
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(query)
            })
          ])
        })
      );
    });
  });
});