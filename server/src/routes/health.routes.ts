import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { isMongoHealthy } from '../config/db.js';
import { isRedisHealthy, getRedisClient } from '../config/redis.js';
import { User } from '../models/User.js';
import { Contest } from '../models/Contest.js';
import { Submission } from '../models/Submission.js';
import { Participation } from '../models/Participation.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const mongoOk = isMongoHealthy();
  let redisOk = false;
  let redisPingMs = 0;
  let redisMemory = 'N/A';
  let redisKeysCount = 0;

  try {
    const redis = getRedisClient();
    const t0 = performance.now();
    const pong = await redis.ping();
    redisPingMs = Number((performance.now() - t0).toFixed(2));
    redisOk = pong === 'PONG';

    const info = await redis.info('memory');
    const match = info.match(/used_memory_human:(.*)/);
    if (match) {
      redisMemory = match[1].trim();
    }

    const dbsize = await redis.dbSize();
    redisKeysCount = dbsize;
  } catch {
    redisOk = false;
  }

  // Get database counts
  let counts = { users: 0, contests: 0, submissions: 0, participations: 0 };
  if (mongoOk) {
    try {
      const [u, c, s, p] = await Promise.all([
        User.countDocuments(),
        Contest.countDocuments(),
        Submission.countDocuments(),
        Participation.countDocuments(),
      ]);
      counts = { users: u, contests: c, submissions: s, participations: p };
    } catch {}
  }

  const allHealthy = mongoOk && redisOk;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    databases: {
      mongodb: {
        status: mongoOk ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
        databaseName: mongoose.connection.name || 'rankerz_db',
        collections: counts,
      },
      redis: {
        status: redisOk ? 'connected' : 'disconnected',
        pingLatencyMs: redisPingMs,
        usedMemory: redisMemory,
        keysCount: redisKeysCount,
      },
    },
  });
});

export default router;
