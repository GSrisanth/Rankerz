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

/**
 * Determines the API base URL.
 * 1. In local development (localhost / 127.0.0.1): defaults to '/api' which Vite proxies to port 5000.
 * 2. In production (Vercel, preview deployments, etc.):
 *    - Uses VITE_API_URL if it is an absolute http(s) URL.
 *    - Defaults directly to the deployed Render backend: 'https://rankerz.onrender.com/api'.
 *    - Never resolves to relative '/api' in production to avoid hitting Vercel's static server.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      const envUrl = import.meta.env.VITE_API_URL?.trim();
      if (envUrl && envUrl.startsWith('http')) {
        const trimmed = envUrl.replace(/\/+$/, '');
        return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
      }
      return '/api';
    }
  }

  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl && envUrl.startsWith('http')) {
    const trimmed = envUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }

  return 'https://rankerz.onrender.com/api';
}

export const API_BASE = getApiBaseUrl();

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('rankerz_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      const text = await res.text().catch(() => '');
      if (!res.ok) {
        throw new Error(text || `Server returned HTTP ${res.status}: ${res.statusText}`);
      }
      return {} as T;
    }
  } else {
    // Non-JSON response (e.g. HTML 404, 502 Bad Gateway)
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          'API endpoint returned 404 Not Found. Please verify backend availability at https://rankerz.onrender.com.'
        );
      }
      throw new Error(`Server returned HTTP ${res.status}: ${text.slice(0, 150) || res.statusText}`);
    }
    return text as unknown as T;
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed with status ${res.status}`);
  }
  return data;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, init);
    return await handleResponse<T>(res);
  } catch (err: any) {
    if (err?.name === 'TypeError' && (err?.message === 'Failed to fetch' || err?.message?.includes('fetch') || err?.message?.includes('NetworkError'))) {
      throw new Error(
        'Unable to reach Rankerz backend. The Render service may be waking up from cold sleep (takes ~30-50s on free tier). Please retry in a moment.'
      );
    }
    throw err;
  }
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User }> {
    return request<{ token: string; user: User }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    studentIdCode: string;
    department: string;
  }): Promise<{ token: string; user: User }> {
    return request<{ token: string; user: User }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
  },

  async updateProfile(updates: { name?: string; department?: string }): Promise<{ user: User }> {
    return request<{ user: User }>(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
  },

  // Contests
  async getContests(params?: { status?: string; type?: string }): Promise<{ count: number; contests: Contest[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    const queryString = query.toString();
    const url = queryString ? `${API_BASE}/contests?${queryString}` : `${API_BASE}/contests`;
    return request<{ count: number; contests: Contest[] }>(url);
  },

  async getContestById(contestId: string): Promise<{ contest: Contest }> {
    return request<{ contest: Contest }>(`${API_BASE}/contests/${contestId}`);
  },

  async createContest(data: Partial<Contest>): Promise<{ contest: Contest }> {
    return request<{ contest: Contest }>(`${API_BASE}/contests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
  },

  async updateContest(contestId: string, updates: Partial<Contest>): Promise<{ contest: Contest }> {
    return request<{ contest: Contest }>(`${API_BASE}/contests/${contestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
  },

  async deleteContest(contestId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${API_BASE}/contests/${contestId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
  },

  async rebuildLeaderboard(contestId: string): Promise<{ restoredCount: number; message: string }> {
    return request<{ restoredCount: number; message: string }>(`${API_BASE}/contests/${contestId}/rebuild-leaderboard`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
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
    const queryString = query.toString();
    const url = queryString ? `${API_BASE}/contests/${contestId}/leaderboard?${queryString}` : `${API_BASE}/contests/${contestId}/leaderboard`;

    return request<{
      source: string;
      totalParticipants: number;
      limit: number;
      offset: number;
      contest: { id: string; title: string; maxScore: number; status: string };
      leaderboard: LeaderboardEntry[];
    }>(url, {
      headers: { ...getAuthHeader() },
    });
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
    return request<{
      isRanked: boolean;
      rank?: number;
      score?: number;
      maxScore?: number;
      totalParticipants?: number;
      attemptsCount?: number;
      user?: any;
      message?: string;
    }>(`${API_BASE}/contests/${contestId}/leaderboard/me`, {
      headers: { ...getAuthHeader() },
    });
  },

  // Participation
  async registerForContest(contestId: string): Promise<{ participation: Participation; message: string }> {
    return request<{ participation: Participation; message: string }>(`${API_BASE}/contests/${contestId}/register`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
  },

  async getMyStatus(contestId: string): Promise<{ isRegistered: boolean; participation: any; rank: number | null }> {
    return request<{ isRegistered: boolean; participation: any; rank: number | null }>(`${API_BASE}/contests/${contestId}/my-status`, {
      headers: { ...getAuthHeader() },
    });
  },

  async getParticipants(contestId: string): Promise<{ count: number; participants: any[] }> {
    return request<{ count: number; participants: any[] }>(`${API_BASE}/contests/${contestId}/participants`);
  },

  // Submissions
  async submitScore(
    contestId: string,
    data: { studentId?: string; score: number; completionTimeMs?: number; idempotencyKey?: string }
  ): Promise<{ result: any; message: string }> {
    return request<{ result: any; message: string }>(`${API_BASE}/contests/${contestId}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
  },

  async getSubmissions(contestId: string, params?: { limit?: number; offset?: number }): Promise<{ total: number; submissions: Submission[] }> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    const queryString = query.toString();
    const url = queryString ? `${API_BASE}/contests/${contestId}/submissions?${queryString}` : `${API_BASE}/contests/${contestId}/submissions`;

    return request<{ total: number; submissions: Submission[] }>(url);
  },

  // Analytics (MongoDB Aggregations)
  async getPlatformOverview(): Promise<{ data: any }> {
    return request<{ data: any }>(`${API_BASE}/analytics/overview`);
  },

  async getContestAnalytics(contestId: string): Promise<{ contestId: string; analytics: ContestAnalytics }> {
    return request<{ contestId: string; analytics: ContestAnalytics }>(`${API_BASE}/analytics/contests/${contestId}`);
  },

  async getStudentAnalytics(): Promise<{ analytics: StudentAnalytics }> {
    return request<{ analytics: StudentAnalytics }>(`${API_BASE}/analytics/users/me`, {
      headers: { ...getAuthHeader() },
    });
  },

  // Demonstrations & Viva
  async getRedisOps(contestId?: string): Promise<{ operations: any[]; contestId: string }> {
    const url = contestId ? `${API_BASE}/demo/redis-ops?contestId=${contestId}` : `${API_BASE}/demo/redis-ops`;
    return request<{ operations: any[]; contestId: string }>(url);
  },

  async simulateSubmission(contestId?: string): Promise<{ result: any; contestTitle: string }> {
    return request<{ result: any; contestTitle: string }>(`${API_BASE}/demo/simulate-submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ contestId }),
    });
  },

  async getCapAnalysis(): Promise<any> {
    return request<any>(`${API_BASE}/demo/cap-analysis`);
  },

  // Health
  async getHealthStatus(): Promise<HealthStatus> {
    return request<HealthStatus>(`${API_BASE}/health`);
  },
};
