import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { RedisLeaderboardService } from '../services/redisLeaderboard.service.js';

describe('Redis Sorted Set Leaderboard Engine', () => {
  const testContestId = 'test_contest_vit_cse3009';
  const studentA = 'student_test_001';
  const studentB = 'student_test_002';
  const studentC = 'student_test_003';

  beforeAll(async () => {
    await connectRedis();
    await RedisLeaderboardService.clearLeaderboard(testContestId);
  });

  afterAll(async () => {
    await RedisLeaderboardService.clearLeaderboard(testContestId);
    await disconnectRedis();
  });

  it('should add participants and compute ranks in descending order (ZADD, ZREVRANK)', async () => {
    // Student A scores 90, Student B scores 100, Student C scores 80
    await RedisLeaderboardService.updateScore(testContestId, studentA, 90);
    await RedisLeaderboardService.updateScore(testContestId, studentB, 100);
    await RedisLeaderboardService.updateScore(testContestId, studentC, 80);

    const total = await RedisLeaderboardService.getTotalParticipants(testContestId);
    expect(total).toBe(3);

    const rankB = await RedisLeaderboardService.getRank(testContestId, studentB);
    const rankA = await RedisLeaderboardService.getRank(testContestId, studentA);
    const rankC = await RedisLeaderboardService.getRank(testContestId, studentC);

    expect(rankB).toBe(1); // 100 pts -> 1st place
    expect(rankA).toBe(2); // 90 pts  -> 2nd place
    expect(rankC).toBe(3); // 80 pts  -> 3rd place
  });

  it('should dynamically update score and re-rank participant immediately', async () => {
    // Student C submits improved score of 105 pts -> should overtake Student B to rank 1
    await RedisLeaderboardService.updateScore(testContestId, studentC, 105);

    const newRankC = await RedisLeaderboardService.getRank(testContestId, studentC);
    const newRankB = await RedisLeaderboardService.getRank(testContestId, studentB);

    expect(newRankC).toBe(1);
    expect(newRankB).toBe(2);
  });

  it('should handle deterministic tie-breaking based on completion time', async () => {
    const tiedContest = 'test_contest_tiebreak';
    const userFast = 'user_fast';
    const userSlow = 'user_slow';

    // Both score 100 points, but userFast completed in 15 seconds (15,000ms) and userSlow in 120 seconds (120,000ms)
    await RedisLeaderboardService.updateScore(tiedContest, userFast, 100, 15000);
    await RedisLeaderboardService.updateScore(tiedContest, userSlow, 100, 120000);

    const rankFast = await RedisLeaderboardService.getRank(tiedContest, userFast);
    const rankSlow = await RedisLeaderboardService.getRank(tiedContest, userSlow);

    expect(rankFast).toBe(1);
    expect(rankSlow).toBe(2);

    await RedisLeaderboardService.clearLeaderboard(tiedContest);
  });

  it('should retrieve paginated leaderboard with limit and offset (ZRANGE ... REV)', async () => {
    const list = await RedisLeaderboardService.getLeaderboard(testContestId, 2, 0);
    expect(list.length).toBe(2);
    expect(list[0].rank).toBe(1);
    expect(list[0].studentId).toBe(studentC);
    expect(list[1].rank).toBe(2);
    expect(list[1].studentId).toBe(studentB);
  });
});
