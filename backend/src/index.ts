import express, { type Express } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/error.middleware';
import { corsMiddleware, rateLimiter } from './middleware';
import apiRouter from './routes';
import logger from './utils/logger';

// Initialize express app
const app: Express = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(corsMiddleware);
app.use('/api', rateLimiter);

// Common middleware
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', apiRouter);

// Error handling
app.use(errorHandler);

// Start server
const port = env.PORT;

app.listen(port, () => {
  logger.info(`Server is running on port ${port} in ${env.NODE_ENV} mode`);
});