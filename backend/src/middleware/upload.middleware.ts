import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import { BadRequestError } from '../utils/errors';
import { env } from '../config/env';

// Allowed file types from environment variables
const ALLOWED_FILE_TYPES = env.ALLOWED_FILE_TYPES.split(',');
const MAX_FILE_SIZE = env.MAX_FILE_SIZE;

// File filter function
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(new BadRequestError(`File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`));
    return;
  }
  cb(null, true);
};

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/temp'));
  },
  filename: (_req, file, cb) => {
    // Create a unique file name to prevent collisions
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Upload configurations for different scenarios
export const uploadConfig = {
  single: upload.single('resume'),
  bulk: upload.array('resumes', 10), // Allow up to 10 files
  zip: upload.single('zip'),
};