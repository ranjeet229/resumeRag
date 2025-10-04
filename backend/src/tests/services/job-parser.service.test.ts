import { JobParser } from '../../services/job-parser.service';
import { EmbeddingService } from '../../services/embedding.service';

jest.mock('../../config/env', () => require('../__mocks__/env'));
jest.mock('../../services/embedding.service');

describe('JobParser', () => {
  let jobParser: JobParser;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup embedding service mock with conditional skill matching
    mockEmbeddingService = {
      getInstance: jest.fn().mockReturnThis(),
      generateEmbedding: jest.fn().mockImplementation((text: string) => {
        const keywords = {
          javascript: [0.8, 0.1, 0.1],
          typescript: [0.8, 0.1, 0.1],
          react: [0.8, 0.1, 0.1],
          'node.js': [0.8, 0.1, 0.1],
          python: [0.8, 0.1, 0.1],
          aws: [0.8, 0.1, 0.1],
          docker: [0.8, 0.1, 0.1],
          kubernetes: [0.8, 0.1, 0.1],
          git: [0.8, 0.1, 0.1],
        };

        // Convert text to lowercase for matching
        const textLower = text.toLowerCase();
        
        // Return matching vector if text contains any of the keywords
        for (const [keyword, vector] of Object.entries(keywords)) {
          if (textLower.includes(keyword)) {
            return Promise.resolve(vector);
          }
        }
        
        // Default vector for non-matching text
        return Promise.resolve([0.1, 0.2, 0.3]);
      }),
    } as unknown as jest.Mocked<EmbeddingService>;

    // Mock the EmbeddingService.getInstance
    (EmbeddingService.getInstance as jest.Mock).mockReturnValue(mockEmbeddingService);

    // Get JobParser instance
    jobParser = JobParser.getInstance();
  });

  describe('parseRequirements', () => {
    it('should parse a complete job description correctly', async () => {
      const jobDescription = `
        Senior Software Engineer
        
        Requirements:
        - 5+ years of experience with JavaScript and TypeScript
        - Strong knowledge of React and Node.js
        - Bachelor's degree in Computer Science or related field
        - Experience with cloud technologies (AWS preferred)
        
        Preferred Qualifications:
        - Experience with Python
        - Master's degree
        - Knowledge of Docker and Kubernetes
        
        Skills:
        - Git
        - Agile methodologies
        - CI/CD pipelines
      `;

      const result = await jobParser.parseRequirements(jobDescription);
      
      // Check skills separately for more specific error messages
      expect(result.skills.required).toEqual(
        expect.arrayContaining(['javascript', 'typescript', 'react', 'node.js', 'git'])
      );
      expect(result.skills.preferred).toEqual(
        expect.arrayContaining(['python', 'docker', 'kubernetes'])
      );
      
      // Check education requirements
      expect(result.education.required[0]).toMatch(/computer science/i);
      expect(result.education.preferred[0]).toMatch(/master/i);
      
      // Check experience details
      expect(result.experience).toEqual({
        years: 5,
        level: 'senior',
      });
    });

    it('should handle missing sections gracefully', async () => {
      const jobDescription = 'Software Developer';

      const result = await jobParser.parseRequirements(jobDescription);

      expect(result).toEqual({
        skills: {
          required: [],
          preferred: [],
        },
        education: {
          required: [],
          preferred: [],
        },
        experience: {
          years: 0,
          level: 'mid',  // Default level when no other indicators are present
        },
        other: ['software developer'],
      });
    });

    it('should correctly identify experience level', async () => {
      const seniorDescription = 'Senior Software Engineer position with 8+ years of experience.';
      const juniorDescription = 'Junior Developer position with 1-2 years of experience.';
      const leadDescription = 'Technical Lead position with 12+ years of experience.';

      const seniorResult = await jobParser.parseRequirements(seniorDescription);
      const juniorResult = await jobParser.parseRequirements(juniorDescription);
      const leadResult = await jobParser.parseRequirements(leadDescription);

      expect(seniorResult.experience.level).toBe('senior');
      expect(seniorResult.experience.years).toBe(8);

      expect(juniorResult.experience.level).toBe('entry');
      expect(juniorResult.experience.years).toBe(1);

      expect(leadResult.experience.level).toBe('lead');
      expect(leadResult.experience.years).toBe(12);
    });

    it('should handle education requirements correctly', async () => {
      const description = `
        Required Education:
        - Bachelor's degree in Computer Science
        
        Preferred Education:
        - Master's in Machine Learning or AI
        - PhD in related field is a plus
      `;

      const result = await jobParser.parseRequirements(description);
      
      expect(result.education.required[0]).toMatch(/computer science/i);
      expect(result.education.preferred).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/machine learning/i),
          expect.stringMatching(/related field/i),
        ])
      );
    });

    it('should extract skills from mixed requirement formats', async () => {
      const description = `
        Required Skills:
        - Strong proficiency in JavaScript and React
        - Experience with version control (Git)
        
        Nice to have:
        - Experience with Python
        - Familiarity with AWS
        
        Additional Skills:
        - Docker
      `;

      const result = await jobParser.parseRequirements(description);

      expect(result.skills.required).toEqual(
        expect.arrayContaining(['javascript', 'react', 'git'])
      );
      expect(result.skills.preferred).toEqual(
        expect.arrayContaining(['python', 'aws'])
      );
      expect(result.skills.required).toContain('docker');
    });
  });
});