import { Request, Response, NextFunction } from 'express';
import { Job } from '../models/job.model';
import { JobStatus } from '../types/job';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { SearchService } from '../services/search.service';
import logger from '../utils/logger';

export class JobController {
  private static instance: JobController;
  private searchService?: SearchService;

  private constructor() {
    this.initializeServices().catch(error => {
      logger.error('Failed to initialize services:', error);
    });
  }

  private async initializeServices(): Promise<void> {
    this.searchService = await SearchService.getInstance();
  }

  public static async getInstance(): Promise<JobController> {
    if (!JobController.instance) {
      JobController.instance = new JobController();
      await JobController.instance.initializeServices();
    }
    return JobController.instance;
  }

  /**
   * Create a new job posting
   */
  async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobData = {
        ...req.body,
        userId: req.user._id,
        status: JobStatus.DRAFT,
      };

      const job = new Job(jobData);
      await job.save();

      res.status(201).json({
        status: 'success',
        data: {
          job,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a job posting
   */
  async updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await Job.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!job) {
        throw new NotFoundError('Job posting not found');
      }

      Object.assign(job, req.body);
      await job.save();

      res.json({
        status: 'success',
        data: {
          job,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single job posting
   */
  async getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        throw new NotFoundError('Job posting not found');
      }

      res.json({
        status: 'success',
        data: {
          job,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a job posting
   */
  async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await Job.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!job) {
        throw new NotFoundError('Job posting not found');
      }

      await job.deleteOne();

      res.json({
        status: 'success',
        message: 'Job posting deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List jobs with filters
   */
  async listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filters } = req.body;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query = this.buildQuery(filters);

      const [jobs, total] = await Promise.all([
        Job.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Job.countDocuments(query),
      ]);

      res.json({
        status: 'success',
        data: {
          jobs,
          page,
          limit,
          total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search jobs
   */
  async searchJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.searchService) {
        throw new Error('Search service not initialized');
      }

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
   * Change job status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const job = await Job.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!job) {
        throw new NotFoundError('Job posting not found');
      }

      if (!Object.values(JobStatus).includes(status)) {
        throw new BadRequestError('Invalid status');
      }

      job.status = status;
      await job.save();

      res.json({
        status: 'success',
        data: {
          job,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build query based on filters
   */
  private buildQuery(filters?: Record<string, any>): Record<string, any> {
    const query: Record<string, any> = {
      status: JobStatus.ACTIVE,
    };

    if (!filters) return query;

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.company) {
      query.company = new RegExp(filters.company, 'i');
    }

    if (filters.location) {
      query.location = new RegExp(filters.location, 'i');
    }

    if (filters.minExperience !== undefined) {
      query['requirements.experience'] = {
        $gte: filters.minExperience,
      };
    }

    if (filters.maxExperience !== undefined) {
      query['requirements.experience'] = {
        ...query['requirements.experience'],
        $lte: filters.maxExperience,
      };
    }

    if (filters.skills?.length) {
      query['requirements.skills'] = {
        $all: filters.skills,
      };
    }

    return query;
  }
}