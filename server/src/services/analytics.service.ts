import { Types } from 'mongoose';
import { Participation } from '../models/Participation.js';
import { Submission } from '../models/Submission.js';
import { Contest } from '../models/Contest.js';
import { User } from '../models/User.js';

export class AnalyticsService {
  /**
   * MongoDB Aggregation Pipeline 1: Contest Performance Summary
   * Uses $match, $group with $avg, $max, $min, $stdDevPop, $sum
   */
  public static async getContestOverview(contestId: string) {
    const contestObjId = new Types.ObjectId(contestId);

    const stats = await Participation.aggregate([
      { $match: { contestId: contestObjId } },
      {
        $group: {
          _id: '$contestId',
          totalParticipants: { $sum: 1 },
          averageScore: { $avg: '$currentScore' },
          highestScore: { $max: '$currentScore' },
          lowestScore: { $min: '$currentScore' },
          totalAttempts: { $sum: '$attemptsCount' },
          stdDevScore: { $stdDevPop: '$currentScore' },
        },
      },
      {
        $project: {
          _id: 0,
          totalParticipants: 1,
          averageScore: { $round: ['$averageScore', 2] },
          highestScore: 1,
          lowestScore: 1,
          totalAttempts: 1,
          stdDevScore: { $round: [{ $ifNull: ['$stdDevScore', 0] }, 2] },
        },
      },
    ]);

    // Also get contest maxScore for reference
    const contest = await Contest.findById(contestId).lean();

    return stats.length > 0
      ? { ...stats[0], maxScore: contest?.maxScore || 100 }
      : {
          totalParticipants: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          totalAttempts: 0,
          stdDevScore: 0,
          maxScore: contest?.maxScore || 100,
        };
  }

  /**
   * MongoDB Aggregation Pipeline 2: Score Distribution Histogram
   * Uses $bucket or $facet to partition scores into intervals: 0-20%, 21-40%, 41-60%, 61-80%, 81-100%
   */
  public static async getScoreDistribution(contestId: string) {
    const contestObjId = new Types.ObjectId(contestId);
    const contest = await Contest.findById(contestId).lean();
    const maxScore = contest?.maxScore || 100;

    const distribution = await Participation.aggregate([
      { $match: { contestId: contestObjId } },
      {
        $project: {
          currentScore: 1,
          percentage: {
            $multiply: [{ $divide: ['$currentScore', maxScore] }, 100],
          },
        },
      },
      {
        $bucket: {
          groupBy: '$percentage',
          boundaries: [0, 20.01, 40.01, 60.01, 80.01, 100.01],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            avgScore: { $avg: '$currentScore' },
          },
        },
      },
    ]);

    const rangeLabels: Record<string, string> = {
      '0': '0 - 20%',
      '20.01': '21 - 40%',
      '40.01': '41 - 60%',
      '60.01': '61 - 80%',
      '80.01': '81 - 100%',
    };

    return [
      { range: '0 - 20%', count: 0 },
      { range: '21 - 40%', count: 0 },
      { range: '41 - 60%', count: 0 },
      { range: '61 - 80%', count: 0 },
      { range: '81 - 100%', count: 0 },
    ].map((bucket) => {
      const match = distribution.find((d) => rangeLabels[String(d._id)] === bucket.range);
      return {
        range: bucket.range,
        count: match ? match.count : 0,
      };
    });
  }

  /**
   * MongoDB Aggregation Pipeline 3: Department Performance Comparison
   * Uses $lookup to join with users collection, $group by department, and $sort by avgScore
   */
  public static async getDepartmentPerformance(contestId: string) {
    const contestObjId = new Types.ObjectId(contestId);

    const deptStats = await Participation.aggregate([
      { $match: { contestId: contestObjId } },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student.department',
          participantCount: { $sum: 1 },
          averageScore: { $avg: '$currentScore' },
          highestScore: { $max: '$currentScore' },
          totalAttempts: { $sum: '$attemptsCount' },
        },
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          participantCount: 1,
          averageScore: { $round: ['$averageScore', 1] },
          highestScore: 1,
          totalAttempts: 1,
        },
      },
      { $sort: { averageScore: -1 } },
    ]);

    return deptStats;
  }

  /**
   * MongoDB Aggregation Pipeline 4: Student Historical Performance & Progress
   */
  public static async getStudentAnalytics(studentId: string) {
    const studentObjId = new Types.ObjectId(studentId);

    // Contests participated in
    const participationHistory = await Participation.aggregate([
      { $match: { studentId: studentObjId } },
      {
        $lookup: {
          from: 'contests',
          localField: 'contestId',
          foreignField: '_id',
          as: 'contest',
        },
      },
      { $unwind: '$contest' },
      {
        $project: {
          _id: 1,
          contestId: '$contest._id',
          contestTitle: '$contest.title',
          contestType: '$contest.contestType',
          maxScore: '$contest.maxScore',
          currentScore: 1,
          bestScore: 1,
          attemptsCount: 1,
          registeredAt: 1,
          lastUpdatedAt: 1,
        },
      },
      { $sort: { registeredAt: -1 } },
    ]);

    // Aggregate summary metrics across all participations
    const summary = await Participation.aggregate([
      { $match: { studentId: studentObjId } },
      {
        $group: {
          _id: '$studentId',
          totalContests: { $sum: 1 },
          averageScore: { $avg: '$currentScore' },
          highestScore: { $max: '$bestScore' },
          totalAttempts: { $sum: '$attemptsCount' },
        },
      },
    ]);

    // Submissions timeline
    const recentSubmissions = await Submission.find({ studentId: studentObjId })
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate('contestId', 'title maxScore')
      .lean();

    return {
      summary: summary[0]
        ? {
            totalContests: summary[0].totalContests,
            averageScore: Math.round(summary[0].averageScore * 10) / 10,
            highestScore: summary[0].highestScore,
            totalAttempts: summary[0].totalAttempts,
          }
        : { totalContests: 0, averageScore: 0, highestScore: 0, totalAttempts: 0 },
      history: participationHistory,
      recentSubmissions,
    };
  }

  /**
   * MongoDB Aggregation Pipeline 5: Global Platform Overview
   */
  public static async getPlatformOverview() {
    const [totalStudents, totalContests, liveContests, totalSubmissions] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Contest.countDocuments({ isArchived: false }),
      Contest.countDocuments({ status: 'live' }),
      Submission.countDocuments(),
    ]);

    const deptDistribution = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $project: { _id: 0, department: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    return {
      totalStudents,
      totalContests,
      liveContests,
      totalSubmissions,
      deptDistribution,
    };
  }
}
