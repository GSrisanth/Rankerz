import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true, // Build indexes automatically in development
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected');
}

export function isMongoHealthy(): boolean {
  return mongoose.connection.readyState === 1;
}
