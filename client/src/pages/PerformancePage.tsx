import React, { useState, useEffect } from 'react';
import {
  Activity,
  Trophy,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { StudentAnalytics } from '../types/index.js';

export const PerformancePage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.getStudentAnalytics();
        setData(res.analytics);
      } catch (err) {
        console.error('Failed to load student analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const chartData =
    data?.history.map((h, i) => ({
      name: h.contestTitle.length > 18 ? `${h.contestTitle.slice(0, 16)}...` : h.contestTitle,
      score: h.currentScore,
      best: h.bestScore,
      max: h.maxScore,
      percentage: Math.round((h.currentScore / h.maxScore) * 100),
    })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">
            {user?.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900">{user?.name}</h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ID: {user?.studentIdCode} • Department: {user?.department} • {user?.email}
            </p>
          </div>
        </div>

        {/* Badges Earned */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Active Contender</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Verified Student</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Contests
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">
            {data?.summary.totalContests || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Participated &amp; Ranked</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Average Score
          </div>
          <div className="mt-2 text-3xl font-black text-indigo-600">
            {data?.summary.averageScore || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all assessments</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Highest Score
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-600">
            {data?.summary.highestScore || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Personal Best</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Submissions
          </div>
          <div className="mt-2 text-3xl font-black text-amber-600">
            {data?.summary.totalAttempts || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Attempts Logged in Mongo</div>
        </div>
      </div>

      {/* Score Trends Line Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Score Progression &amp; Historical Trajectory</span>
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated from MongoDB submission attempts across your contests
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Participate in contests to visualize score progression.
            </div>
          )}
        </div>
      </div>

      {/* Historical Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Recent Submissions Audit Trail
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            MongoDB Persistent Log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="py-3 px-6">Contest</th>
                <th className="py-3 px-4">Attempt #</th>
                <th className="py-3 px-4">Score Awarded</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {!data?.recentSubmissions || data.recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No submissions recorded yet.
                  </td>
                </tr>
              ) : (
                data.recentSubmissions.map((sub: any) => (
                  <tr key={sub._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {sub.contestId?.title || 'Contest'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      Attempt {sub.attemptNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {sub.score} / {sub.maximumScore}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-600">
                      {sub.percentage}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-400 font-mono">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
