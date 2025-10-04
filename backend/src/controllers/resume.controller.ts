import { Request, Response, NextFunction } from 'express';
import { Resume } from '../models/resume.model';
import { resumeProcessor } from '../services/resume-processor.service';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { SearchService } from '../services/search.service';
import { storageService } from '../services/storage.service';
import logger from '../utils/logger';

export class ResumeController {
  private searchService: SearchService;

  constructor() {
    SearchService.getInstance().then(service => {
      this.searchService = service;
    }).catch(error => {
      logger.error('Failed to initialize SearchService:', error);
    });
  }

export class ResumeController {
  /**
   * Upload a single resume
   */
  async uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        throw new BadRequestError('No file uploaded');
      }

      // Create resume document
      const resume = new Resume({
        userId: req.user._id,
        originalFileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileKey: '', // Will be updated after processing
      });

      await resume.save();

      // Add to processing queue
      await resumeProcessor.addToQueue({
        resumeId: resume._id.toString(),
        filePath: file.path,
        userId: req.user._id,
        originalFileName: file.originalname,
      });

      res.status(202).json({
        status: 'success',
        message: 'Resume upload queued for processing',
        data: {
          resumeId: resume._id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple resumes
   */
  async uploadBulkResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new BadRequestError('No files uploaded');
      }

      const resumes = [];
      for (const file of files) {
        // Create resume document
        const resume = new Resume({
          userId: req.user._id,
          originalFileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          fileKey: '', // Will be updated after processing
        });

        await resume.save();
        resumes.push(resume);

        // Add to processing queue
        await resumeProcessor.addToQueue({
          resumeId: resume._id.toString(),
          filePath: file.path,
          userId: req.user._id,
          originalFileName: file.originalname,
        });
      }

      res.status(202).json({
        status: 'success',
        message: `${files.length} resumes queued for processing`,
        data: {
          resumeIds: resumes.map(r => r._id),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload resumes in a ZIP file
   */
  async uploadZip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        throw new BadRequestError('No ZIP file uploaded');
      }

      // Process will be handled by the resume processor service
      const resume = new Resume({
        userId: req.user._id,
        originalFileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileKey: '', // Will be updated after processing
      });

      await resume.save();

      // Add to processing queue with ZIP flag
      await resumeProcessor.addToQueue({
        resumeId: resume._id.toString(),
        filePath: file.path,
        userId: req.user._id,
        originalFileName: file.originalname,
        isZip: true,
      });

      res.status(202).json({
        status: 'success',
        message: 'ZIP file queued for processing',
        data: {
          resumeId: resume._id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search resumes with filters
   */
  async searchResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, filters } = req.body;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const results = await this.searchService.search(query, filters);

      res.json({
        status: 'success',
        data: {
          results,
          page,
          limit,
          total: results.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single resume by ID
   */
  async getResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resume = await Resume.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!resume) {
        throw new NotFoundError('Resume not found');
      }

      res.json({
        status: 'success',
        data: {
          resume,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a resume
   */
  async deleteResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resume = await Resume.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!resume) {
        throw new NotFoundError('Resume not found');
      }

      // Delete from vector database
      if (resume.vectorIds?.length) {
        await this.searchService.deleteVectors(resume.vectorIds);
      }

      // Delete from cloud storage
      if (resume.fileKey) {
        await storageService.deleteFile(resume.fileKey);
      }

      // Delete document
      await resume.deleteOne();

      res.json({
        status: 'success',
        message: 'Resume deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all resumes (admin only)
   */
  async getAllResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const resumes = await Resume.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Resume.countDocuments();

      res.json({
        status: 'success',
        data: {
          resumes,
          page,
          limit,
          total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}