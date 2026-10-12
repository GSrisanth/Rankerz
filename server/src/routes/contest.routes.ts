import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Contest } from '../models/Contest.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware.js';
import { RedisLeaderboardService } from '../services/redisLeaderboard.service.js';

const router = Router();

const ContestCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().default(''),
  contestType: z.enum(['exam', 'coding_contest']).default('coding_contest'),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().positive().default(60),
  status: z.enum(['draft', 'scheduled', 'live', 'completed', 'cancelled']).default('scheduled'),
  maxParticipants: z.number().positive().default(500),
  maxScore: z.number().positive().default(100),
  scorePrecision: z.number().min(0).max(2).default(0),
  scoringRule: z.enum(['latest_attempt', 'best_attempt']).default('latest_attempt'),
  tieBreakingRule: z.enum(['earlier_submission', 'fewest_attempts']).default('earlier_submission'),
});

// GET /api/contests
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, type } = req.query;
    const filter: any = { isArchived: false };

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (type && type !== 'all') {
      filter.contestType = type;
    }

    const contests = await Contest.find(filter)
      .sort({ startTime: -1 })
      .populate('createdBy', 'name email')
      .lean();

    res.json({ success: true, count: contests.length, contests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/contests/:contestId
router.get('/:contestId', async (req: Request, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const contest = await Contest.findById(contestId)
      .populate('createdBy', 'name email')
      .lean();

    if (!contest) {
      res.status(404).json({ success: false, message: 'Contest not found' });
      return;
    }

    const totalRanked = await RedisLeaderboardService.getTotalParticipants(contestId);

    res.json({ success: true, contest: { ...contest, totalRanked } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/contests (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = ContestCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.errors,
      });
      return;
    }

    const contest = await Contest.create({
      ...parseResult.data,
      createdBy: req.user!._id,
      startTime: new Date(parseResult.data.startTime),
      endTime: new Date(parseResult.data.endTime),
    });

    res.status(201).json({
      success: true,
      message: 'Contest created successfully',
      contest,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/contests/:contestId (Admin only)
router.patch('/:contestId', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const allowedUpdates = [
      'title',
      'description',
      'status',
      'startTime',
      'endTime',
      'durationMinutes',
      'maxParticipants',
      'maxScore',
      'scoringRule',
      'tieBreakingRule',
    ];

    const updates: any = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        if (key === 'startTime' || key === 'endTime') {
          updates[key] = new Date(req.body[key]);
        } else {
          updates[key] = req.body[key];
        }
      }
    }

    const contest = await Contest.findByIdAndUpdate(req.params.contestId, updates, {
      new: true,
      runValidators: true,
    });

    if (!contest) {
      res.status(404).json({ success: false, message: 'Contest not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Contest updated successfully',
      contest,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/contests/:contestId (Admin only - soft delete / archive)
router.delete('/:contestId', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const contest = await Contest.findByIdAndUpdate(
      contestId,
      { isArchived: true, status: 'cancelled' },
      { new: true }
    );

    if (!contest) {
      res.status(404).json({ success: false, message: 'Contest not found' });
      return;
    }

    // Clean up Redis Sorted Set
    await RedisLeaderboardService.clearLeaderboard(contestId);

    res.json({
      success: true,
      message: 'Contest archived and Redis leaderboard cleared',
      contest,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/contests/:contestId/rebuild-leaderboard (Admin only)
router.post(
  '/:contestId/rebuild-leaderboard',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const contestId = req.params.contestId as string;
      const count = await RedisLeaderboardService.rebuildLeaderboardFromMongo(contestId);

      res.json({
        success: true,
        message: `Successfully rebuilt Redis leaderboard for contest ${contestId}`,
        restoredCount: count,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
