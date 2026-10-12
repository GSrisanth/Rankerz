import { Router, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Submission } from '../models/Submission.js';
import { Contest } from '../models/Contest.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';
import { ScoreSubmissionService } from '../services/scoreSubmission.service.js';

const router = Router({ mergeParams: true });

const SubmissionInputSchema = z.object({
  studentId: z.string().optional(),
  score: z.number().min(0, 'Score cannot be negative'),
  completionTimeMs: z.number().min(0).optional(),
  correctAnswers: z.number().min(0).optional(),
  incorrectAnswers: z.number().min(0).optional(),
  idempotencyKey: z.string().optional(),
});

// POST /api/contests/:contestId/submissions
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const parseResult = SubmissionInputSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.errors,
      });
      return;
    }

    const {
      studentId: targetStudentId,
      score,
      completionTimeMs,
      correctAnswers,
      incorrectAnswers,
      idempotencyKey,
    } = parseResult.data;

    // Authorization rule:
    // If student, they can only submit for their own student ID
    // If admin, they can evaluate/submit for any participant
    let effectiveStudentId = req.user!._id.toString();
    if (req.user!.role === 'admin' && targetStudentId) {
      effectiveStudentId = targetStudentId;
    } else if (req.user!.role !== 'admin' && targetStudentId && targetStudentId !== effectiveStudentId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized. Students cannot submit scores on behalf of other participants.',
      });
      return;
    }

    const result = await ScoreSubmissionService.processScoreSubmission({
      contestId,
      studentId: effectiveStudentId,
      score,
      completionTimeMs: completionTimeMs || Math.floor(Math.random() * 300000) + 10000,
      correctAnswers,
      incorrectAnswers,
      idempotencyKey,
      evaluatedBy: req.user!._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: 'Score submitted and leaderboard updated in real time',
      result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/contests/:contestId/submissions
router.get('/', async (req: any, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const submissions = await Submission.find({ contestId })
      .populate('studentId', 'name studentIdCode department')
      .sort({ submittedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const total = await Submission.countDocuments({ contestId });

    res.json({
      success: true,
      total,
      limit,
      offset,
      submissions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/contests/:contestId/submissions/my
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contestId = req.params.contestId as string;
    const studentId = req.user!._id;

    const submissions = await Submission.find({ contestId, studentId })
      .sort({ submittedAt: -1 })
      .lean();

    res.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
