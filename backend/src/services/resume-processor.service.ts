import Queue from 'bull';
import { Resume } from '../models/resume.model';
import { ResumeParser } from './resume-parser.service';
import { storageService } from './storage.service';
import { PIIRedactor } from '../utils/pii-redactor';
import logger from '../utils/logger';

interface ProcessJobData {
  resumeId: string;
  filePath: string;
  userId: string;
  originalFileName: string;
}

class ResumeProcessor {
  private queue: Queue.Queue<ProcessJobData>;

  constructor() {
    this.queue = new Queue('resume-processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    });

    this.setupQueueHandlers();
  }

  /**
   * Add a resume to the processing queue
   */
  async addToQueue(jobData: ProcessJobData): Promise<void> {
    await this.queue.add(jobData);
  }

  /**
   * Set up queue event handlers
   */
  private setupQueueHandlers(): void {
    this.queue.process(async (job) => {
      const { resumeId, filePath, userId, originalFileName } = job.data;
      logger.info(`Processing resume: ${resumeId}`);

      try {
        // Extract text from file
        const text = await ResumeParser.extractText(filePath);

        // Upload original file to cloud storage
        const fileKey = `resumes/${userId}/${Date.now()}-${originalFileName}`;
        const fileBuffer = await fs.readFile(filePath);
        await storageService.uploadFile(fileBuffer, fileKey, 'application/pdf');

        // Extract metadata and redact PII
        const metadata = ResumeParser.extractMetadata(text);
        const { redactedText, metadata: piiMetadata } = PIIRedactor.extractAndRedact(text);

        // Update resume document
        await Resume.findByIdAndUpdate(resumeId, {
          fileKey,
          content: {
            raw: text,
            redacted: redactedText,
            chunks: [], // Will be populated in the vector embedding phase
          },
          metadata: {
            ...metadata,
            ...piiMetadata,
          },
          processed: true,
        });

        // Clean up temporary file
        await fs.unlink(filePath);
        logger.info(`Successfully processed resume: ${resumeId}`);

      } catch (error) {
        logger.error(`Error processing resume ${resumeId}:`, error);
        
        // Update resume with error status
        await Resume.findByIdAndUpdate(resumeId, {
          error: error instanceof Error ? error.message : 'Unknown error',
          processed: true,
        });

        throw error;
      }
    });

    // Log queue events
    this.queue.on('completed', (job) => {
      logger.info(`Job ${job.id} completed for resume: ${job.data.resumeId}`);
    });

    this.queue.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} failed for resume: ${job?.data.resumeId}`, error);
    });

    this.queue.on('error', (error) => {
      logger.error('Queue error:', error);
    });
  }

  /**
   * Get job progress
   */
  async getProgress(jobId: string): Promise<number> {
    const job = await this.queue.getJob(jobId);
    return job?.progress() || 0;
  }

  /**
   * Clean up the queue
   */
  async cleanup(): Promise<void> {
    await this.queue.clean(0, 'completed');
    await this.queue.clean(0, 'failed');
  }
}

export const resumeProcessor = new ResumeProcessor();