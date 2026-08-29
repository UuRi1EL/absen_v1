import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { ApiResponse } from './utils/api-response.util.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

// Security & Parsing Middlewares - Allow cross-origin image loading for selfies
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Route
app.get('/health', (_req, res) => {
  return ApiResponse.success(res, 'Teacher Attendance Management System API is healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API v1 Routes
app.use('/api/v1', apiRoutes);

// Centralized Error Handling Middleware
app.use(errorMiddleware);

export default app;
