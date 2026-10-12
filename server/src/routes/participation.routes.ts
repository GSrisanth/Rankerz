import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Participation } from '../models/Participation.js';
import { Contest } from '../models/Contest.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';
import { RedisLeaderboardService } from '../services/redisLeaderboard.service.js';

const router = Router({ mergeParams: true });

// POST /api/contests/:contestId/register
router.post('/register', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const studentId = req.user!._id;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      res.status(404).json({ success: false, message: 'Contest not found' });
      return;
    }

    if (contest.status === 'completed' || contest.status === 'cancelled') {
      res.status(400).json({ success: false, message: `Cannot register for a ${contest.status} contest.` });
      return;
    }

    // Check existing registration
    let participation = await Participation.findOne({ contestId, studentId });
    if (participation) {
      res.status(400).json({ success: false, message: 'Already registered for this contest.', participation });
      return;
    }

    // Check max participants limit
    const currentCount = await Participation.countDocuments({ contestId });
    if (currentCount >= contest.maxParticipants) {
      res.status(400).json({ success: false, message: 'Contest has reached maximum participant capacity.' });
      return;
    }

    // Create participation record in MongoDB
    participation = await Participation.create({
      contestId: new Types.ObjectId(contestId),
      studentId: new Types.ObjectId(studentId as any),
      currentScore: 0,
      bestScore: 0,
      attemptsCount: 0,
      participationStatus: 'registered',
    });

    // Add participant to Redis Sorted Set with initial score 0
    await RedisLeaderboardService.updateScore(contestId, studentId.toString(), 0);

    res.status(201).json({
      success: true,
      message: 'Successfully registered for contest',
      participation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/contests/:contestId/participants
router.get('/participants', async (req: any, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const participants = await Participation.find({ contestId })
      .populate('studentId', 'name email studentIdCode department')
      .sort({ currentScore: -1 })
      .lean();

    res.json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/contests/:contestId/my-status
router.get('/my-status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const studentId = req.user!._id;

    const participation = await Participation.findOne({ contestId, studentId }).lean();
    const rank = participation
      ? await RedisLeaderboardService.getRank(contestId, studentId.toString())
      : null;

    res.json({
      success: true,
      isRegistered: !!participation,
      participation,
      rank,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
