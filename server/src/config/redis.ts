import { createClient, RedisClientType } from 'redis';
import { config } from './env.js';

let redisClient: RedisClientType | null = null;
let redisPubClient: RedisClientType | null = null;
let redisSubClient: RedisClientType | null = null;

export async function connectRedis(): Promise<{
  client: RedisClientType;
  publisher: RedisClientType;
  subscriber: RedisClientType;
}> {
  if (redisClient && redisPubClient && redisSubClient) {
    return { client: redisClient, publisher: redisPubClient, subscriber: redisSubClient };
  }

  try {
    // 1. General command client (ZADD, ZREVRANK, ZREVRANGE, ZCARD, etc.)
    redisClient = createClient({ url: config.redisUrl });
    redisClient.on('error', (err) => console.error('[Redis Client Error]', err));

    // 2. Dedicated publisher client
    redisPubClient = createClient({ url: config.redisUrl });
    redisPubClient.on('error', (err) => console.error('[Redis Publisher Error]', err));

    // 3. Dedicated subscriber client
    redisSubClient = createClient({ url: config.redisUrl });
    redisSubClient.on('error', (err) => console.error('[Redis Subscriber Error]', err));

    await Promise.all([
      redisClient.connect(),
      redisPubClient.connect(),
      redisSubClient.connect(),
    ]);

    console.log(`[Redis] Connected successfully to: ${config.redisUrl} (Command, Publisher, and Subscriber clients ready)`);
    return { client: redisClient, publisher: redisPubClient, subscriber: redisSubClient };
  } catch (error) {
    console.error('[Redis] Connection error:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis command client is not connected');
  }
  return redisClient;
}

export function getRedisPublisher(): RedisClientType {
  if (!redisPubClient || !redisPubClient.isOpen) {
    throw new Error('Redis publisher client is not connected');
  }
  return redisPubClient;
}

export function getRedisSubscriber(): RedisClientType {
  if (!redisSubClient || !redisSubClient.isOpen) {
    throw new Error('Redis subscriber client is not connected');
  }
  return redisSubClient;
}

export async function isRedisHealthy(): Promise<boolean> {
  try {
    if (!redisClient || !redisClient.isOpen) return false;
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  const disconnects: Promise<string>[] = [];
  if (redisClient && redisClient.isOpen) disconnects.push(redisClient.quit());
  if (redisPubClient && redisPubClient.isOpen) disconnects.push(redisPubClient.quit());
  if (redisSubClient && redisSubClient.isOpen) disconnects.push(redisSubClient.quit());
  await Promise.all(disconnects);
  console.log('[Redis] Disconnected all clients');
}
