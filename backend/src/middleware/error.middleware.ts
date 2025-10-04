import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { MongoServerError } from 'mongodb';
import { env } from '../config/env';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', {
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle AppError instances (our custom error class)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      code: err.statusCode,
      ...(env.NODE_ENV === 'development' && { stack: err.stack })
    });
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      })),
      code: 400
    });
    return;
  }

  // Handle file upload errors
  if (err instanceof MulterError) {
    res.status(400).json({
      status: 'error',
      message: 'File Upload Error',
      details: err.message,
      code: 400
    });
    return;
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(422).json({
      status: 'error',
      message: 'Invalid input data',
      details: err.message,
      code: 422
    });
    return;
  }

  // Handle mongoose duplicate key errors
  if (err instanceof MongoServerError && err.code === 11000) {
    res.status(409).json({
      status: 'error',
      message: 'Duplicate value error',
      code: 409
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again.',
      code: 401
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      message: 'Token expired. Please log in again.',
      code: 401
    });
    return;
  }

  // Handle unknown errors
  const statusCode = 500;
  const message = env.NODE_ENV === 'production' 
    ? 'Internal Server Error'
    : err.message;

  res.status(statusCode).json({
    status: 'error',
    message,
    code: statusCode,
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
};