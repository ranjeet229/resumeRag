import express, { type Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { connectDB } from './config/database';
import logger from './utils/logger';

// Initialize express app
const app: Express = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes will be added here in Phase 2

// Error handling middleware will be added in Phase 2

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${env.NODE_ENV} mode`);
});