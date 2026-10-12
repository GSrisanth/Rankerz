import http from 'http';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectMongoDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { RedisPubSubService } from './services/redisPubSub.service.js';
import { initSocketIO } from './services/socket.service.js';

async function bootstrap() {
  console.log('===============================================================');
  console.log('  RANKERZ — Real-Time Contest & Exam Leaderboard Platform');
  console.log('  VIT-AP | CSE3009 — NoSQL Databases | Project 5');
  console.log('  Prof. Harapriya Kar');
  console.log('===============================================================');

  try {
    // 1. Connect to MongoDB
    await connectMongoDB();

    // 2. Connect to Redis (Command, Publisher, and Subscriber clients)
    await connectRedis();

    // 3. Initialize Redis Pub/Sub Subscriber
    await RedisPubSubService.initSubscriber();

    // 4. Create Express App & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    // 5. Initialize Socket.IO linked to Redis Pub/Sub stream
    initSocketIO(server);

    // 6. Listen on configured port
    server.listen(config.port, () => {
      console.log(`[Rankerz Server] Listening on http://localhost:${config.port}`);
      console.log(`[Rankerz Server] Client CORS Origin: ${config.clientUrl}`);
    });
  } catch (error) {
    console.error('[Rankerz Server] Bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();
