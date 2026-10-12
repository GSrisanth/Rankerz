import { Types } from 'mongoose';
import { Contest } from '../models/Contest.js';
import { Submission, ISubmission } from '../models/Submission.js';
import { Participation } from '../models/Participation.js';
import { User } from '../models/User.js';
import { RedisLeaderboardService } from './redisLeaderboard.service.js';
import { RedisPubSubService } from './redisPubSub.service.js';

export interface SubmitScoreParams {
  contestId: string;
  studentId: string;
  score: number;
  completionTimeMs?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  idempotencyKey?: string;
  evaluatedBy?: string;
  metadata?: Record<string, any>;
}

export interface ScoreSubmissionResult {
  submission: ISubmission;
  previousRank: number | null;
  newRank: number;
  rankDelta: number;
  currentScore: number;
}

export class ScoreSubmissionService {
  public static async processScoreSubmission(params: SubmitScoreParams): Promise<ScoreSubmissionResult> {
    const {
      contestId,
      studentId,
      score,
      completionTimeMs = 0,
      correctAnswers = 0,
      incorrectAnswers = 0,
      idempotencyKey,
      evaluatedBy,
      metadata = {},
    } = params;

    // 1. Validate Contest
    const contest = await Contest.findById(contestId);
    if (!contest) {
      throw new Error('Contest not found');
    }
    if (contest.status !== 'live' && contest.status !== 'scheduled') {
      throw new Error(`Contest is ${contest.status}. Score submissions are only accepted for live or scheduled contests.`);
    }

    // Validate score bounds
    if (score < 0 || score > contest.maxScore) {
      throw new Error(`Score must be between 0 and maximum allowed score of ${contest.maxScore}`);
    }

    // 2. Validate Student
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student user not found');
    }

    // Check idempotency if key provided
    if (idempotencyKey) {
      const existing = await Submission.findOne({ idempotencyKey });
      if (existing) {
        const rank = (await RedisLeaderboardService.getRank(contestId, studentId)) || 1;
        return {
          submission: existing,
          previousRank: rank,
          newRank: rank,
          rankDelta: 0,
          currentScore: existing.score,
        };
      }
    }

    // 3. Find or register Participation record
    let participation = await Participation.findOne({ contestId, studentId });
    if (!participation) {
      participation = await Participation.create({
        contestId: new Types.ObjectId(contestId),
        studentId: new Types.ObjectId(studentId),
        currentScore: 0,
        bestScore: 0,
        attemptsCount: 0,
        participationStatus: 'in_progress',
      });
    }

    const previousRank = await RedisLeaderboardService.getRank(contestId, studentId);

    // 4. Calculate attempt number & percentage
    const attemptNumber = participation.attemptsCount + 1;
    const percentage = Number(((score / contest.maxScore) * 100).toFixed(2));

    // 5. Persist Historical Submission in MongoDB
    const submission = await Submission.create({
      contestId: new Types.ObjectId(contestId),
      studentId: new Types.ObjectId(studentId),
      score,
      maximumScore: contest.maxScore,
      percentage,
      correctAnswers,
      incorrectAnswers,
      completionTimeMs,
      attemptNumber,
      status: 'evaluated',
      idempotencyKey,
      evaluatedBy: evaluatedBy ? new Types.ObjectId(evaluatedBy) : undefined,
      metadata,
      submittedAt: new Date(),
    });

    // 6. Determine new current score based on contest scoring rules
    let newScore = score;
    if (contest.scoringRule === 'best_attempt') {
      newScore = Math.max(score, participation.bestScore);
    }

    // Update Participation record in MongoDB
    participation.currentScore = newScore;
    participation.bestScore = Math.max(participation.bestScore, score);
    participation.attemptsCount = attemptNumber;
    participation.latestSubmissionId = submission._id as Types.ObjectId;
    participation.lastUpdatedAt = new Date();
    participation.participationStatus = 'submitted';
    await participation.save();

    // 7. Update Redis Sorted Set (ZADD) with deterministic tie-breaker
    await RedisLeaderboardService.updateScore(contestId, studentId, newScore, completionTimeMs);

    // 8. Query new rank from Redis (ZREVRANK + 1)
    const newRank = (await RedisLeaderboardService.getRank(contestId, studentId)) || 1;

    // Rank delta: positive number means rank improved (e.g. was 5, now 2 => delta +3)
    const rankDelta = previousRank ? previousRank - newRank : 0;

    // 9. Publish update event to Redis Pub/Sub
    await RedisPubSubService.publishScoreUpdate({
      type: 'SCORE_UPDATED',
      contestId,
      studentId,
      studentName: student.name,
      studentIdCode: student.studentIdCode,
      department: student.department,
      score: newScore,
      maximumScore: contest.maxScore,
      previousRank,
      newRank,
      rankDelta,
      submittedAt: submission.submittedAt.toISOString(),
    });

    return {
      submission,
      previousRank,
      newRank,
      rankDelta,
      currentScore: newScore,
    };
  }
}
