import { ResumeService } from '../services/resume.service';
import { Resume } from '../models/resume.model';
import { mockFileUpload } from '../test/setup';

describe('Resume Service', () => {
  let resumeService: ResumeService;
  const userId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    resumeService = new ResumeService();
  });

  describe('uploadSingle', () => {
    it('should upload a single resume', async () => {
      const file = mockFileUpload('test resume content');
      const result = await resumeService.uploadSingle(file, userId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('filename', 'test.pdf');
      expect(result).toHaveProperty('status', 'success');

      // Verify resume was saved to database
      const savedResume = await Resume.findById(result.id);
      expect(savedResume).toBeDefined();
      expect(savedResume?.userId.toString()).toBe(userId);
    });

    it('should handle invalid file types', async () => {
      const file = {
        ...mockFileUpload(),
        mimetype: 'text/plain',
      };

      await expect(resumeService.uploadSingle(file, userId))
        .rejects.toThrow('Invalid file type');
    });

    it('should handle large files', async () => {
      const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const file = {
        ...mockFileUpload(),
        buffer: largeContent,
      };

      await expect(resumeService.uploadSingle(file, userId))
        .rejects.toThrow('File too large');
    });
  });

  describe('uploadBulk', () => {
    it('should process multiple resumes from ZIP', async () => {
      const zipFile = {
        ...mockFileUpload(),
        originalname: 'resumes.zip',
        mimetype: 'application/zip',
      };

      const results = await resumeService.uploadBulk(zipFile, userId);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Verify all resumes were saved
      for (const result of results) {
        const savedResume = await Resume.findById(result.id);
        expect(savedResume).toBeDefined();
        expect(savedResume?.userId.toString()).toBe(userId);
      }
    });

    it('should handle invalid ZIP files', async () => {
      const invalidZip = mockFileUpload('not a zip file');
      await expect(resumeService.uploadBulk(invalidZip, userId))
        .rejects.toThrow();
    });
  });

  describe('extractText', () => {
    it('should extract text from PDF', async () => {
      const file = mockFileUpload('sample PDF content');
      const text = await resumeService.extractText(file);
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
    });

    it('should handle extraction errors', async () => {
      const corruptedFile = {
        ...mockFileUpload(),
        buffer: Buffer.from('corrupted content'),
      };

      await expect(resumeService.extractText(corruptedFile))
        .rejects.toThrow();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Create some test resumes
      await Resume.create([
        {
          userId,
          filename: 'dev1.pdf',
          content: 'Experienced JavaScript developer with React',
          vector: [], // Mock vector
        },
        {
          userId,
          filename: 'dev2.pdf',
          content: 'Python developer with machine learning experience',
          vector: [], // Mock vector
        },
      ]);
    });

    it('should perform semantic search', async () => {
      const results = await resumeService.search('React developer', userId);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // First result should be the JavaScript/React developer
      expect(results[0].content).toContain('JavaScript');
      expect(results[0].content).toContain('React');
    });

    it('should filter by user ID', async () => {
      const otherUserId = '507f1f77bcf86cd799439012';
      const results = await resumeService.search('developer', otherUserId);
      expect(results.length).toBe(0);
    });

    it('should paginate results', async () => {
      const page1 = await resumeService.search('developer', userId, { page: 1, limit: 1 });
      const page2 = await resumeService.search('developer', userId, { page: 2, limit: 1 });

      expect(page1.length).toBe(1);
      expect(page2.length).toBe(1);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });
});