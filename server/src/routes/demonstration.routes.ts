import { Router, Request, Response } from 'express';
import { getRedisClient } from '../config/redis.js';
import { RedisLeaderboardService } from '../services/redisLeaderboard.service.js';
import { ScoreSubmissionService } from '../services/scoreSubmission.service.js';
import { Contest } from '../models/Contest.js';
import { Participation } from '../models/Participation.js';
import { User } from '../models/User.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/demo/redis-ops
// Runs real Redis commands live and returns command syntax, result, and latency
router.get('/redis-ops', async (req: Request, res: Response) => {
  try {
    const contestId = req.query.contestId as string;
    const redis = getRedisClient();

    let targetContestId = contestId;
    if (!targetContestId) {
      const firstContest = await Contest.findOne({ isArchived: false });
      targetContestId = firstContest?._id.toString() || 'default_contest';
    }

    const key = RedisLeaderboardService.getKey(targetContestId);

    // 1. ZCARD Demo
    const t0 = performance.now();
    const totalCount = await redis.zCard(key);
    const zcardTimeMs = Number((performance.now() - t0).toFixed(3));

    // 2. ZREVRANGE with WITHSCORES (Top 5)
    const t1 = performance.now();
    const rawTop5 = (await redis.sendCommand(['ZREVRANGE', key, '0', '4', 'WITHSCORES'])) as string[];
    const top5: { value: string; score: number }[] = [];
    for (let i = 0; i < rawTop5.length; i += 2) {
      top5.push({ value: rawTop5[i], score: parseFloat(rawTop5[i + 1]) });
    }
    const zrangeTimeMs = Number((performance.now() - t1).toFixed(3));

    // 3. ZREVRANK & ZSCORE for first member
    let rankResult = null;
    let sampleStudentId = top5[0]?.value;

    if (sampleStudentId) {
      const t2 = performance.now();
      const zrevRank = await redis.zRevRank(key, sampleStudentId);
      const zscore = await redis.zScore(key, sampleStudentId);
      const rankLookupTimeMs = Number((performance.now() - t2).toFixed(3));

      rankResult = {
        member: sampleStudentId,
        zeroBasedIndex: zrevRank,
        calculatedRank: zrevRank !== null && zrevRank !== undefined ? zrevRank + 1 : null,
        score: zscore,
        executionTimeMs: rankLookupTimeMs,
      };
    }

    res.json({
      success: true,
      contestId: targetContestId,
      operations: [
        {
          command: `ZCARD ${key}`,
          description: 'Counts the total number of elements in the Sorted Set in O(1) time complexity.',
          result: totalCount,
          executionTimeMs: zcardTimeMs,
          academicJustification: 'Enables constant-time retrieval of active leaderboard participants without scanning a table.',
        },
        {
          command: `ZREVRANGE ${key} 0 4 WITHSCORES`,
          description: 'Retrieves top 5 highest-scoring elements in descending order with scores in O(log(N) + M) time complexity.',
          result: top5,
          executionTimeMs: zrangeTimeMs,
          academicJustification: 'Skip-list index enables high-concurrency sub-millisecond retrieval of podium and paginated views.',
        },
        {
          command: sampleStudentId ? `ZREVRANK ${key} "${sampleStudentId}"` : 'ZREVRANK (No participants found)',
          description: 'Determines the 0-based rank of a specific student by score in descending order in O(log(N)) time.',
          result: rankResult,
          executionTimeMs: rankResult?.executionTimeMs || 0,
          academicJustification: 'Allows individual students to check "My Rank" instantly among tens of thousands of competitors without sorting the entire dataset.',
        },
      ],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/demo/simulate-submission
// Simulates live student activity for academic presentation and real-time Socket.IO demo
router.post('/simulate-submission', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.body;
    let targetContest = contestId ? await Contest.findById(contestId) : await Contest.findOne({ status: 'live' });

    if (!targetContest) {
      targetContest = await Contest.findOne({ isArchived: false }).sort({ startTime: -1 });
    }

    if (!targetContest) {
      res.status(404).json({ success: false, message: 'No contests available for simulation.' });
      return;
    }

    // Pick a random participant registered for this contest, or pick any student
    const participations = await Participation.find({ contestId: targetContest._id }).limit(50);
    let targetStudentId: string;

    if (participations.length > 0) {
      const randomIndex = Math.floor(Math.random() * participations.length);
      targetStudentId = participations[randomIndex].studentId.toString();
    } else {
      const randomStudent = await User.findOne({ role: 'student' });
      if (!randomStudent) {
        res.status(404).json({ success: false, message: 'No students found to simulate submission.' });
        return;
      }
      targetStudentId = randomStudent._id.toString();
    }

    // Generate simulated score
    const max = targetContest.maxScore;
    const simulatedScore = Math.floor(Math.random() * (max * 0.4)) + Math.floor(max * 0.6); // 60% to 100%
    const simulatedTime = Math.floor(Math.random() * 240000) + 15000;

    const result = await ScoreSubmissionService.processScoreSubmission({
      contestId: targetContest._id.toString(),
      studentId: targetStudentId,
      score: simulatedScore,
      completionTimeMs: simulatedTime,
      evaluatedBy: req.user!._id.toString(),
      metadata: { simulated: true, timestamp: new Date().toISOString() },
    });

    res.json({
      success: true,
      simulated: true,
      contestId: targetContest._id,
      contestTitle: targetContest.title,
      result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/demo/cap-analysis
router.get('/cap-analysis', (req: Request, res: Response) => {
  res.json({
    success: true,
    academicTopic: 'CAP Theorem Analysis: Redis vs MongoDB in Rankerz',
    dimensions: [
      {
        database: 'Redis (In-Memory Data Store)',
        capClassification: 'Typically CP (Consistency & Partition Tolerance under default Sentinel/Cluster sync) or AP (with async replica lag)',
        roleInRankerz: 'Live Leaderboard (Sorted Sets) and Score Ingestion Pub/Sub',
        dataModel: 'Key-Value / Sorted Set (Skip List + Hash Map)',
        readLatency: '< 1 millisecond (In-memory)',
        writeLatency: '< 1 millisecond (In-memory)',
        partitionBehavior: 'When network partitions occur, isolated Redis nodes reject writes or accept split-brain async updates. In Rankerz, Redis acts as a fast ephemeral cache that can be 100% reconstructed from MongoDB.',
      },
      {
        database: 'MongoDB (Document Store)',
        capClassification: 'CP (Strongly Consistent primary with Majority Write Concern) or AP (Read from secondaries with eventual consistency)',
        roleInRankerz: 'Persistent Source of Truth, Submissions Audit Trail & Analytical Aggregations',
        dataModel: 'JSON-like BSON Documents with dynamic schema',
        readLatency: '5 - 20 milliseconds (Disk + WiredTiger cache)',
        writeLatency: '5 - 30 milliseconds (Journaling + Disk commit)',
        partitionBehavior: 'During network partitions, MongoDB primary steps down if it loses majority contact, preventing stale writes and preserving ACID guarantees for exam submissions.',
      },
    ],
    crossDatabaseConsistencyStrategy: {
      strategy: 'Two-Tiered Hybrid Consistency with Administrative Self-Healing',
      primaryStore: 'MongoDB (Persistent durable source of truth)',
      acceleratorStore: 'Redis (Low-latency real-time rank computation)',
      atomicityNote: 'MongoDB and Redis are independent database engines and do NOT offer automatic distributed two-phase commits out of the box.',
      failureHandling: 'If Redis goes down or drops data, the backend safely falls back to MongoDB. Administrators can click "Rebuild Redis Leaderboard" anytime to replay all valid participation records into Redis Sorted Sets in O(N).',
    },
  });
});

// POST /api/demo/seed
// Triggers the standard database seeding directly inside the running server environment
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const { runSeedLogic } = await import('../scripts/seed.js');
    const result = await runSeedLogic();
    res.json({
      success: true,
      message: 'Cloud databases seeded successfully!',
      usersCount: result.usersCount,
      contestsCount: result.contestsCount,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Seeding failed',
    });
  }
});

export default router;

