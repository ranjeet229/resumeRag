import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { ResumeController } from '../controllers/resume.controller';
import { uploadResumeSchema, searchResumeSchema } from '../schemas/resume.schema';
import { UserRole } from '../types/user';
import logger from '../utils/logger';

const router = Router();
let resumeController: ResumeController;

// Initialize the controller
ResumeController.getInstance()
  .then((controller: ResumeController) => {
    resumeController = controller;
    setupRoutes();
  })
  .catch((error: Error) => {
    logger.error('Failed to initialize resume controller:', error);
  });

function setupRoutes(): void {
  // Route: /api/resumes
  router.post(
    '/upload',
    authenticate,
    upload.single('resume'),
    validate(uploadResumeSchema),
    resumeController.uploadResume.bind(resumeController)
  );

  router.post(
    '/bulk',
    authenticate,
    upload.array('resumes', 10),
    resumeController.uploadBulkResumes.bind(resumeController)
  );

  router.post(
    '/zip',
    authenticate,
    upload.single('zip'),
    resumeController.uploadZip.bind(resumeController)
  );

  router.get(
    '/',
    authenticate,
    validate(searchResumeSchema),
    resumeController.searchResumes.bind(resumeController)
  );

  router.get(
    '/:id',
    authenticate,
    resumeController.getResume.bind(resumeController)
  );

  router.delete(
    '/:id',
    authenticate,
    resumeController.deleteResume.bind(resumeController)
  );

  // Admin routes
  router.get(
    '/all',
    authenticate,
    authorize(UserRole.ADMIN),
    resumeController.getAllResumes.bind(resumeController)
  );
}

export default router;