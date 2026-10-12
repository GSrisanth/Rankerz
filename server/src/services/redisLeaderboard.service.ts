import { getRedisClient } from '../config/redis.js';
import { Participation } from '../models/Participation.js';

export interface LeaderboardEntry {
  studentId: string;
  rank: number;
  score: number;
  rawScore?: number;
}

export class RedisLeaderboardService {
  /**
   * Generates key for contest Sorted Set
   * Namespace: contest:{contestId}:leaderboard
   */
  public static getKey(contestId: string): string {
    return `contest:${contestId}:leaderboard`;
  }

  /**
   * Calculates a tie-breaking composite score for Redis Sorted Set
   * Primary: score (integer or decimal)
   * Secondary: Earlier submission / lower completion time gets fractional bonus
   * Composite = rawScore + (1 - (completionTimeMs / 100,000,000)) * 0.001
   */
  public static calculateCompositeScore(rawScore: number, completionTimeMs: number = 0): number {
    const cappedTime = Math.min(Math.max(completionTimeMs, 0), 100000000);
    // Fractional bonus is strictly between 0.00000001 and 0.00099999, never altering raw integer points
    const timeBonus = (1 - cappedTime / 100000000) * 0.001;
    return Number((rawScore + timeBonus).toFixed(7));
  }

  /**
   * Extracts clean display score from composite score
   */
  public static extractRawScore(compositeScore: number): number {
    return Math.floor(compositeScore * 100) / 100;
  }

  /**
   * Adds or updates a participant's score in the Redis Sorted Set (ZADD)
   */
  public static async updateScore(
    contestId: string,
    studentId: string,
    rawScore: number,
    completionTimeMs: number = 0
  ): Promise<number> {
    const redis = getRedisClient();
    const key = this.getKey(contestId);
    const score = this.calculateCompositeScore(rawScore, completionTimeMs);

    await redis.zAdd(key, [{ score, value: studentId }]);
    return score;
  }

  /**
   * Retrieves participant's current 1-based rank (ZREVRANK + 1)
   */
  public static async getRank(contestId: string, studentId: string): Promise<number | null> {
    const redis = getRedisClient();
    const key = this.getKey(contestId);

    const zeroBasedRank = await redis.zRevRank(key, studentId);
    if (zeroBasedRank === null || zeroBasedRank === undefined) {
      return null;
    }
    return zeroBasedRank + 1; // Convert 0-based index to 1-based rank
  }

  /**
   * Retrieves participant's composite score (ZSCORE)
   */
  public static async getScore(contestId: string, studentId: string): Promise<number | null> {
    const redis = getRedisClient();
    const key = this.getKey(contestId);

    const score = await redis.zScore(key, studentId);
    return score !== null && score !== undefined ? score : null;
  }

  /**
   * Retrieves total number of ranked participants in contest (ZCARD)
   */
  public static async getTotalParticipants(contestId: string): Promise<number> {
    const redis = getRedisClient();
    const key = this.getKey(contestId);

    return await redis.zCard(key);
  }

  /**
   * Retrieves paginated leaderboard from Redis Sorted Set using ZREVRANGE key start stop WITHSCORES
   * Guaranteed compatible across all Redis versions (Redis 2.8+ through Redis 7.x+)
   */
  public static async getLeaderboard(
    contestId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    const redis = getRedisClient();
    const key = this.getKey(contestId);

    const start = offset;
    const stop = offset + limit - 1;

    // Use standard ZREVRANGE command with WITHSCORES
    const raw = (await redis.sendCommand([
      'ZREVRANGE',
      key,
      String(start),
      String(stop),
      'WITHSCORES',
    ])) as string[];

    const results: LeaderboardEntry[] = [];
    let rankIndex = 0;

    for (let i = 0; i < raw.length; i += 2) {
      const studentId = raw[i];
      const compositeScore = parseFloat(raw[i + 1]);
      const rank = offset + rankIndex + 1;
      rankIndex++;

      results.push({
        studentId,
        rank,
        score: Math.floor(compositeScore),
        rawScore: compositeScore,
      });
    }

    return results;
  }

  /**
   * Removes a participant from the Sorted Set (ZREM)
   */
  public static async removeParticipant(contestId: string, studentId: string): Promise<number> {
    const redis = getRedisClient();
    const key = this.getKey(contestId);

    return await redis.zRem(key, studentId);
  }

  /**
   * Drops the entire Sorted Set for a contest (DEL)
   */
  public static async clearLeaderboard(contestId: string): Promise<number> {
    const redis = getRedisClient();
    const key = this.getKey(contestId);

    return await redis.del(key);
  }

  /**
   * Rebuilds Redis Sorted Set safely from MongoDB persistent Participation records
   */
  public static async rebuildLeaderboardFromMongo(contestId: string): Promise<number> {
    const redis = getRedisClient();
    const key = this.getKey(contestId);

    // Fetch all active participations for this contest
    const participations = await Participation.find({ contestId }).lean();

    // Clear stale key
    await redis.del(key);

    if (participations.length === 0) {
      return 0;
    }

    const members = participations.map((p) => ({
      value: p.studentId.toString(),
      score: this.calculateCompositeScore(p.currentScore, 0),
    }));

    // Batch insert using zAdd
    await redis.zAdd(key, members);
    return members.length;
  }
}
