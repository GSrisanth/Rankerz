import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { RedisPubSubService, ScoreUpdateEvent } from './redisPubSub.service.js';
import { isAllowedOrigin } from '../config/cors.js';

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Socket origin ${origin} not allowed by CORS`));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket: Socket) => {
    // Client joins a specific contest room to receive live leaderboard updates
    socket.on('join_contest', (contestId: string) => {
      if (contestId) {
        socket.join(`contest:${contestId}`);
      }
    });

    socket.on('leave_contest', (contestId: string) => {
      if (contestId) {
        socket.leave(`contest:${contestId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean up handled automatically by Socket.IO
    });
  });

  // Connect Redis Pub/Sub subscriber to Socket.IO room broadcast
  RedisPubSubService.addListener((event: ScoreUpdateEvent) => {
    if (!io) return;
    const room = `contest:${event.contestId}`;
    io.to(room).emit('score_update', event);
  });

  console.log('[Socket.IO] Initialized and linked to Redis Pub/Sub stream');
  return io;
}

export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }
  return io;
}
