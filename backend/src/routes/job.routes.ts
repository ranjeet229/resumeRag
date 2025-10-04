import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { JobController } from '../controllers/job.controller';
import { createJobSchema, updateJobSchema, searchJobSchema } from '../schemas/job.schema';
import { UserRole } from '../types/user';
import logger from '../utils/logger';

const router = Router();
let jobController: JobController;

// Initialize the controller
JobController.getInstance()
  .then((controller: JobController) => {
    jobController = controller;
    setupRoutes();
  })
  .catch((error: Error) => {
    logger.error('Failed to initialize job controller:', error);
  });

function setupRoutes(): void {
  // Route: /api/jobs
  router.post(
    '/',
    authenticate,
    authorize(UserRole.RECRUITER),
    validate(createJobSchema),
    jobController.createJob.bind(jobController)
  );

  router.put(
    '/:id',
    authenticate,
    authorize(UserRole.RECRUITER),
    validate(updateJobSchema),
    jobController.updateJob.bind(jobController)
  );

  router.get(
    '/',
    authenticate,
    jobController.listJobs.bind(jobController)
  );

  router.get(
    '/:id',
    authenticate,
    jobController.getJob.bind(jobController)
  );

  router.delete(
    '/:id',
    authenticate,
    authorize(UserRole.RECRUITER),
    jobController.deleteJob.bind(jobController)
  );

  router.post(
    '/search',
    authenticate,
    validate(searchJobSchema),
    jobController.searchJobs.bind(jobController)
  );

  router.patch(
    '/:id/status',
    authenticate,
    authorize(UserRole.RECRUITER),
    jobController.updateStatus.bind(jobController)
  );
}

export default router;