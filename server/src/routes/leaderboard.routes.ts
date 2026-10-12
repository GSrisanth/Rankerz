import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { RedisLeaderboardService } from '../services/redisLeaderboard.service.js';
import { User } from '../models/User.js';
import { Participation } from '../models/Participation.js';
import { Contest } from '../models/Contest.js';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

// GET /api/contests/:contestId/leaderboard
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    const departmentFilter = (req.query.department as string) || '';
    const searchQuery = (req.query.search as string)?.trim().toLowerCase() || '';

    // Verify contest exists
    const contest = await Contest.findById(contestId).lean();
    if (!contest) {
      res.status(404).json({ success: false, message: 'Contest not found' });
      return;
    }

    const totalInRedis = await RedisLeaderboardService.getTotalParticipants(contestId);

    // If department filter or search query is applied, we query MongoDB participations joined with Users
    // Otherwise, we leverage the ultra-fast O(log N + M) Redis Sorted Set range query!
    if (departmentFilter && departmentFilter !== 'all' || searchQuery) {
      const matchCriteria: any = { contestId: new Types.ObjectId(contestId) };

      const pipeline: any[] = [
        { $match: matchCriteria },
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student',
          },
        },
        { $unwind: '$student' },
      ];

      if (departmentFilter && departmentFilter !== 'all') {
        pipeline.push({ $match: { 'student.department': departmentFilter } });
      }

      if (searchQuery) {
        pipeline.push({
          $match: {
            $or: [
              { 'student.name': { $regex: searchQuery, $options: 'i' } },
              { 'student.studentIdCode': { $regex: searchQuery, $options: 'i' } },
            ],
          },
        });
      }

      pipeline.push({ $sort: { currentScore: -1, lastUpdatedAt: 1 } });

      const filteredTotal = await Participation.aggregate([...pipeline, { $count: 'count' }]);
      const totalCount = filteredTotal.length > 0 ? filteredTotal[0].count : 0;

      pipeline.push({ $skip: offset }, { $limit: limit });
      const results = await Participation.aggregate(pipeline);

      const items = await Promise.all(
        results.map(async (p, idx) => {
          const rank = await RedisLeaderboardService.getRank(contestId, p.student._id.toString());
          return {
            rank: rank || offset + idx + 1,
            studentId: p.student._id.toString(),
            name: p.student.name,
            studentIdCode: p.student.studentIdCode,
            department: p.student.department,
            score: p.currentScore,
            maxScore: contest.maxScore,
            percentage: Number(((p.currentScore / contest.maxScore) * 100).toFixed(1)),
            attemptsCount: p.attemptsCount,
            lastUpdatedAt: p.lastUpdatedAt,
          };
        })
      );

      res.json({
        success: true,
        source: 'hybrid_filtered',
        totalParticipants: totalCount,
        limit,
        offset,
        contest: {
          id: contest._id,
          title: contest.title,
          maxScore: contest.maxScore,
          status: contest.status,
        },
        leaderboard: items,
      });
      return;
    }

    // Direct Redis Sorted Set Query (Fastest Path - O(log(N) + M))
    const rawLeaderboard = await RedisLeaderboardService.getLeaderboard(contestId, limit, offset);

    if (rawLeaderboard.length === 0) {
      res.json({
        success: true,
        source: 'redis_zset',
        totalParticipants: totalInRedis,
        limit,
        offset,
        contest: {
          id: contest._id,
          title: contest.title,
          maxScore: contest.maxScore,
          status: contest.status,
        },
        leaderboard: [],
      });
      return;
    }

    // Fetch user details for the top ranked student IDs in one bulk MongoDB query
    const studentObjectIds = rawLeaderboard.map((e) => new Types.ObjectId(e.studentId));
    const [users, participations] = await Promise.all([
      User.find({ _id: { $in: studentObjectIds } }).select('name studentIdCode department avatarUrl').lean(),
      Participation.find({ contestId: new Types.ObjectId(contestId), studentId: { $in: studentObjectIds } }).lean(),
    ]);

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const partMap = new Map(participations.map((p) => [p.studentId.toString(), p]));

    const enrichedLeaderboard = rawLeaderboard.map((item) => {
      const user = userMap.get(item.studentId);
      const part = partMap.get(item.studentId);
      const score = item.score;

      return {
        rank: item.rank,
        studentId: item.studentId,
        name: user?.name || 'Anonymous Student',
        studentIdCode: user?.studentIdCode || 'N/A',
        department: user?.department || 'CSE',
        score,
        maxScore: contest.maxScore,
        percentage: Number(((score / contest.maxScore) * 100).toFixed(1)),
        attemptsCount: part?.attemptsCount || 1,
        lastUpdatedAt: part?.lastUpdatedAt || null,
      };
    });

    res.json({
      success: true,
      source: 'redis_zset',
      totalParticipants: totalInRedis,
      limit,
      offset,
      contest: {
        id: contest._id,
        title: contest.title,
        maxScore: contest.maxScore,
        status: contest.status,
      },
      leaderboard: enrichedLeaderboard,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/contests/:contestId/leaderboard/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const studentId = req.user!._id.toString();

    const contest = await Contest.findById(contestId).lean();
    if (!contest) {
      res.status(404).json({ success: false, message: 'Contest not found' });
      return;
    }

    const [rank, score, total] = await Promise.all([
      RedisLeaderboardService.getRank(contestId, studentId),
      RedisLeaderboardService.getScore(contestId, studentId),
      RedisLeaderboardService.getTotalParticipants(contestId),
    ]);

    if (rank === null || score === null) {
      res.json({
        success: true,
        isRanked: false,
        message: 'You have not participated in or registered for this contest yet.',
      });
      return;
    }

    const cleanScore = RedisLeaderboardService.extractRawScore(score);
    const participation = await Participation.findOne({ contestId, studentId }).lean();

    res.json({
      success: true,
      isRanked: true,
      rank,
      score: cleanScore,
      maxScore: contest.maxScore,
      totalParticipants: total,
      attemptsCount: participation?.attemptsCount || 0,
      user: {
        id: studentId,
        name: req.user!.name,
        studentIdCode: req.user!.studentIdCode,
        department: req.user!.department,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/contests/:contestId/participants/:studentId/rank
router.get('/participants/:studentId/rank', async (req: Request, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const studentId = req.params.studentId as string;

    const [rank, score, total] = await Promise.all([
      RedisLeaderboardService.getRank(contestId, studentId),
      RedisLeaderboardService.getScore(contestId, studentId),
      RedisLeaderboardService.getTotalParticipants(contestId),
    ]);

    if (rank === null || score === null) {
      res.status(404).json({ success: false, message: 'Participant not ranked in this contest.' });
      return;
    }

    res.json({
      success: true,
      studentId,
      rank,
      score: RedisLeaderboardService.extractRawScore(score),
      totalParticipants: total,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
