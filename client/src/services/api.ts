import {
  User,
  Contest,
  LeaderboardEntry,
  ContestAnalytics,
  StudentAnalytics,
  HealthStatus,
  Submission,
  Participation,
} from '../types/index.js';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('rankerz_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    studentIdCode: string;
    department: string;
  }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateProfile(updates: { name?: string; department?: string }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  // Contests
  async getContests(params?: { status?: string; type?: string }): Promise<{ count: number; contests: Contest[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    const res = await fetch(`${API_BASE}/contests?${query.toString()}`);
    return handleResponse(res);
  },

  async getContestById(contestId: string): Promise<{ contest: Contest }> {
    const res = await fetch(`${API_BASE}/contests/${contestId}`);
    return handleResponse(res);
  },

  async createContest(data: Partial<Contest>): Promise<{ contest: Contest }> {
    const res = await fetch(`${API_BASE}/contests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateContest(contestId: string, updates: Partial<Contest>): Promise<{ contest: Contest }> {
    const res = await fetch(`${API_BASE}/contests/${contestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteContest(contestId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/contests/${contestId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async rebuildLeaderboard(contestId: string): Promise<{ restoredCount: number; message: string }> {
    const res = await fetch(`${API_BASE}/contests/${contestId}/rebuild-leaderboard`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Leaderboard (Redis Sorted Set)
  async getLeaderboard(
    contestId: string,
    params?: { limit?: number; offset?: number; department?: string; search?: string }
  ): Promise<{
    source: string;
    totalParticipants: number;
    limit: number;
    offset: number;
    contest: { id: string; title: string; maxScore: number; status: string };
    leaderboard: LeaderboardEntry[];
  }> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    if (params?.department) query.append('department', params.department);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/contests/${contestId}/leaderboard?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getMyRank(contestId: string): Promise<{
    isRanked: boolean;
    rank?: number;
    score?: number;
    maxScore?: number;
    totalParticipants?: number;
    attemptsCount?: number;
    user?: any;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/contests/${contestId}/leaderboard/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Participation
  async registerForContest(contestId: string): Promise<{ participation: Participation; message: string }> {
    const res = await fetch(`${API_BASE}/contests/${contestId}/register`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getMyStatus(contestId: string): Promise<{ isRegistered: boolean; participation: any; rank: number | null }> {
    const res = await fetch(`${API_BASE}/contests/${contestId}/my-status`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getParticipants(contestId: string): Promise<{ count: number; participants: any[] }> {
    const res = await fetch(`${API_BASE}/contests/${contestId}/participants`);
    return handleResponse(res);
  },

  // Submissions
  async submitScore(
    contestId: string,
    data: { studentId?: string; score: number; completionTimeMs?: number; idempotencyKey?: string }
  ): Promise<{ result: any; message: string }> {
    const res = await fetch(`${API_BASE}/contests/${contestId}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getSubmissions(contestId: string, params?: { limit?: number; offset?: number }): Promise<{ total: number; submissions: Submission[] }> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset !== undefined) query.append('offset', String(params.offset));

    const res = await fetch(`${API_BASE}/contests/${contestId}/submissions?${query.toString()}`);
    return handleResponse(res);
  },

  // Analytics (MongoDB Aggregations)
  async getPlatformOverview(): Promise<{ data: any }> {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    return handleResponse(res);
  },

  async getContestAnalytics(contestId: string): Promise<{ contestId: string; analytics: ContestAnalytics }> {
    const res = await fetch(`${API_BASE}/analytics/contests/${contestId}`);
    return handleResponse(res);
  },

  async getStudentAnalytics(): Promise<{ analytics: StudentAnalytics }> {
    const res = await fetch(`${API_BASE}/analytics/users/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Demonstrations & Viva
  async getRedisOps(contestId?: string): Promise<{ operations: any[]; contestId: string }> {
    const url = contestId ? `${API_BASE}/demo/redis-ops?contestId=${contestId}` : `${API_BASE}/demo/redis-ops`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async simulateSubmission(contestId?: string): Promise<{ result: any; contestTitle: string }> {
    const res = await fetch(`${API_BASE}/demo/simulate-submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ contestId }),
    });
    return handleResponse(res);
  },

  async getCapAnalysis(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/cap-analysis`);
    return handleResponse(res);
  },

  // Health
  async getHealthStatus(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },
};
