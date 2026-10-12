export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  studentIdCode: string;
  department: string;
  avatarUrl?: string;
  createdAt: string;
}

export type ContestStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
export type ContestType = 'exam' | 'coding_contest';

export interface Contest {
  _id: string;
  title: string;
  description: string;
  contestType: ContestType;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ContestStatus;
  maxParticipants: number;
  maxScore: number;
  scorePrecision: number;
  scoringRule: 'latest_attempt' | 'best_attempt';
  tieBreakingRule: 'earlier_submission' | 'fewest_attempts';
  totalRanked?: number;
  createdBy?: {
    name: string;
    email: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  studentIdCode: string;
  department: string;
  score: number;
  maxScore: number;
  percentage: number;
  attemptsCount: number;
  lastUpdatedAt: string | null;
  rankDelta?: number;
  isJustUpdated?: boolean;
}

export interface ScoreUpdateEvent {
  type: 'SCORE_UPDATED' | 'LEADERBOARD_RESET' | 'CONTEST_STATUS_CHANGED';
  contestId: string;
  studentId: string;
  studentName: string;
  studentIdCode: string;
  department: string;
  score: number;
  maximumScore: number;
  previousRank?: number | null;
  newRank: number;
  rankDelta: number;
  submittedAt: string;
}

export interface Submission {
  _id: string;
  contestId: string | { _id: string; title: string; maxScore: number };
  studentId: string | { _id: string; name: string; studentIdCode: string; department: string };
  score: number;
  maximumScore: number;
  percentage: number;
  completionTimeMs: number;
  attemptNumber: number;
  status: string;
  submittedAt: string;
}

export interface Participation {
  _id: string;
  contestId: string;
  studentId: string;
  currentScore: number;
  bestScore: number;
  attemptsCount: number;
  participationStatus: string;
  registeredAt: string;
  lastUpdatedAt: string;
}

export interface ContestOverviewStats {
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalAttempts: number;
  stdDevScore: number;
  maxScore: number;
}

export interface ScoreBucket {
  range: string;
  count: number;
}

export interface DepartmentStat {
  department: string;
  participantCount: number;
  averageScore: number;
  highestScore: number;
  totalAttempts: number;
}

export interface ContestAnalytics {
  overview: ContestOverviewStats;
  distribution: ScoreBucket[];
  departments: DepartmentStat[];
}

export interface StudentAnalytics {
  summary: {
    totalContests: number;
    averageScore: number;
    highestScore: number;
    totalAttempts: number;
  };
  history: Array<{
    _id: string;
    contestId: string;
    contestTitle: string;
    contestType: string;
    maxScore: number;
    currentScore: number;
    bestScore: number;
    attemptsCount: number;
    registeredAt: string;
  }>;
  recentSubmissions: Submission[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  databases: {
    mongodb: {
      status: 'connected' | 'disconnected';
      databaseName: string;
      collections: {
        users: number;
        contests: number;
        submissions: number;
        participations: number;
      };
    };
    redis: {
      status: 'connected' | 'disconnected';
      pingLatencyMs: number;
      usedMemory: string;
      keysCount: number;
    };
  };
}
