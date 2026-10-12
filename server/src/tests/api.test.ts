import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectMongoDB, disconnectMongoDB } from '../config/db.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { RedisPubSubService } from '../services/redisPubSub.service.js';

describe('Rankerz End-to-End API Integration Tests', () => {
  let app: any;
  let adminToken: string;
  let studentToken: string;
  let sampleContestId: string;

  beforeAll(async () => {
    await connectMongoDB();
    await connectRedis();
    await RedisPubSubService.initSubscriber();
    app = createApp();

    // Login as Admin
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@rankerz.edu',
      password: 'AdminRankerz@2025',
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // Login as Student
    const studentRes = await request(app).post('/api/auth/login').send({
      email: 'arjun.sharma@rankerz.edu',
      password: 'StudentRankerz@2025',
    });
    expect(studentRes.status).toBe(200);
    studentToken = studentRes.body.token;
  });

  afterAll(async () => {
    await disconnectMongoDB();
    await disconnectRedis();
  });

  it('GET /api/health should report MongoDB and Redis as healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.databases.mongodb.status).toBe('connected');
    expect(res.body.databases.redis.status).toBe('connected');
  });

  it('GET /api/contests should list seeded contests', async () => {
    const res = await request(app).get('/api/contests');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.contests.length).toBeGreaterThan(0);
    const liveContest = res.body.contests.find((c: any) => c.status === 'live');
    sampleContestId = liveContest ? liveContest._id : res.body.contests[0]._id;
  });

  it('GET /api/contests/:contestId/leaderboard should return top ranked students from Redis', async () => {
    const res = await request(app).get(`/api/contests/${sampleContestId}/leaderboard?limit=10`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.leaderboard.length).toBeGreaterThan(0);
    expect(res.body.leaderboard[0].rank).toBe(1);
    expect(res.body.leaderboard[0]).toHaveProperty('name');
    expect(res.body.leaderboard[0]).toHaveProperty('score');
  });

  it('GET /api/analytics/contests/:contestId should compute MongoDB aggregation pipelines', async () => {
    const res = await request(app).get(`/api/analytics/contests/${sampleContestId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analytics.overview).toHaveProperty('averageScore');
    expect(res.body.analytics.overview).toHaveProperty('totalParticipants');
    expect(Array.isArray(res.body.analytics.distribution)).toBe(true);
    expect(Array.isArray(res.body.analytics.departments)).toBe(true);
  });

  it('GET /api/demo/redis-ops should demonstrate real Redis Sorted Set commands live', async () => {
    const res = await request(app).get(`/api/demo/redis-ops?contestId=${sampleContestId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.operations.length).toBe(3);
    expect(res.body.operations[0].command).toContain('ZCARD');
  });

  it('POST /api/contests/:contestId/submissions should persist submission and update rank', async () => {
    const contestRes = await request(app).get(`/api/contests/${sampleContestId}`);
    const maxScore = contestRes.body.contest.maxScore || 100;
    const testScore = Math.floor(maxScore * 0.95);

    const res = await request(app)
      .post(`/api/contests/${sampleContestId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        score: testScore,
        completionTimeMs: 45000,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.result).toHaveProperty('newRank');
    expect(res.body.result).toHaveProperty('currentScore');
  });
});
