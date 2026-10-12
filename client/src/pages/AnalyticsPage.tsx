import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Layers,
  Users,
  Trophy,
  PieChart as PieIcon,
  Code,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../services/api.js';
import { Contest, ContestAnalytics } from '../types/index.js';

export const AnalyticsPage: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>('');
  const [analytics, setAnalytics] = useState<ContestAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getContests().then((res) => {
      setContests(res.contests);
      if (res.contests.length > 0) {
        setSelectedContestId(res.contests[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedContestId) return;
    setLoading(true);
    api
      .getContestAnalytics(selectedContestId)
      .then((res) => {
        setAnalytics(res.analytics);
      })
      .catch((err) => console.error('Failed to load contest analytics:', err))
      .finally(() => setLoading(false));
  }, [selectedContestId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Contest Analytics &amp; Aggregations
              </h1>
              <p className="text-xs text-slate-500">
                Powered by multi-stage MongoDB Aggregation Pipelines ($match, $group, $bucket, $lookup)
              </p>
            </div>
          </div>
        </div>

        {/* Contest Dropdown */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
          <Layers className="w-4 h-4 text-slate-400" />
          <select
            value={selectedContestId}
            onChange={(e) => setSelectedContestId(e.target.value)}
            className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none"
          >
            {contests.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Average Score
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-indigo-600">
            {analytics?.overview.averageScore || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            of {analytics?.overview.maxScore || 100} pts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Highest Score
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600">
            {analytics?.overview.highestScore || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Top Performer</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Lowest Score
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-700">
            {analytics?.overview.lowestScore || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Threshold</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Participants
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {analytics?.overview.totalParticipants || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">In MongoDB</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Std. Deviation
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-purple-600">
            ±{analytics?.overview.stdDevScore || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Score Spread</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Chart 1: Score Distribution Histogram ($bucket) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Score Distribution Histogram</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Partitioned using MongoDB <code>$bucket</code> aggregation stage
            </p>
          </div>

          <div className="h-64 w-full">
            {analytics?.distribution && analytics.distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1b4b',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading histogram...
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Department Performance ($lookup + $group) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Departmental Performance Comparison</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated via <code>$lookup</code> on Users and <code>$group</code> by Department
            </p>
          </div>

          <div className="h-64 w-full">
            {analytics?.departments && analytics.departments.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.departments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} />
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
                  <Bar
                    dataKey="averageScore"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                    name="Avg Score"
                  />
                  <Bar
                    dataKey="participantCount"
                    fill="#94a3b8"
                    radius={[8, 8, 0, 0]}
                    name="Participants"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading departmental comparison...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Snippet for Academic Demonstration */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2.5">
            <Code className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-bold tracking-wide">
              MongoDB Aggregation Pipeline Source Code (Executed on Database)
            </h4>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
            Advanced NoSQL Feature
          </span>
        </div>

        <pre className="text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed">
{`// MongoDB Score Bucket Aggregation Pipeline ($bucket)
await Participation.aggregate([
  { $match: { contestId: new ObjectId("${selectedContestId}") } },
  {
    $project: {
      currentScore: 1,
      percentage: { $multiply: [{ $divide: ['$currentScore', maxScore] }, 100] }
    }
  },
  {
    $bucket: {
      groupBy: '$percentage',
      boundaries: [0, 20.01, 40.01, 60.01, 80.01, 100.01],
      default: 'Other',
      output: {
        count: { $sum: 1 },
        avgScore: { $avg: '$currentScore' }
      }
    }
  }
]);`}
        </pre>
      </div>
    </div>
  );
};
