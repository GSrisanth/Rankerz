import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import contestRoutes from './routes/contest.routes.js';
import participationRoutes from './routes/participation.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import demonstrationRoutes from './routes/demonstration.routes.js';
import healthRoutes from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/contests', contestRoutes);

  // Contest sub-routes
  app.use('/api/contests/:contestId', participationRoutes);
  app.use('/api/contests/:contestId/leaderboard', leaderboardRoutes);
  app.use('/api/contests/:contestId/submissions', submissionRoutes);

  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/demo', demonstrationRoutes);
  app.use('/api/health', healthRoutes);

  // Root welcome / metadata endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Rankerz API',
      tagline: 'Rise through the ranks.',
      course: 'VIT-AP | CSE3009 — NoSQL Databases | Project 5',
      instructor: 'Prof. Harapriya Kar',
      status: 'operational',
      endpoints: {
        health: '/api/health',
        contests: '/api/contests',
        leaderboard: '/api/contests/:contestId/leaderboard',
        analytics: '/api/analytics/overview',
        demonstration: '/api/demo/redis-ops',
      },
    });
  });

  // Central error handling
  app.use(errorHandler);

  return app;
}
