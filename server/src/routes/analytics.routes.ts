import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/analytics/overview
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const data = await AnalyticsService.getPlatformOverview();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/contests/:contestId
router.get('/contests/:contestId', async (req: Request, res: Response) => {
  try {
    const contestId = req.params.contestId as string;

    const [overview, distribution, departments] = await Promise.all([
      AnalyticsService.getContestOverview(contestId),
      AnalyticsService.getScoreDistribution(contestId),
      AnalyticsService.getDepartmentPerformance(contestId),
    ]);

    res.json({
      success: true,
      contestId,
      analytics: {
        overview,
        distribution,
        departments,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/users/me
router.get('/users/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!._id.toString();
    const analytics = await AnalyticsService.getStudentAnalytics(studentId);

    res.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
