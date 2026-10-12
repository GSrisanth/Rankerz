import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  Database,
  RefreshCw,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Archive,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Contest, HealthStatus } from '../types/index.js';

export const AdminPage: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuildingId, setRebuildingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contestsRes, healthRes] = await Promise.all([
        api.getContests(),
        api.getHealthStatus(),
      ]);
      setContests(contestsRes.contests);
      setHealth(healthRes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (contestId: string, newStatus: string) => {
    try {
      await api.updateContest(contestId, { status: newStatus as any });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update contest status');
    }
  };

  const handleRebuildCache = async (contestId: string) => {
    setRebuildingId(contestId);
    try {
      const res = await api.rebuildLeaderboard(contestId);
      alert(`Redis Sorted Set rebuilt! Restored ${res.restoredCount} participants.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to rebuild cache');
    } finally {
      setRebuildingId(null);
    }
  };

  const handleDeleteContest = async (contestId: string) => {
    if (!window.confirm('Are you sure you want to archive this contest and clear its Redis leaderboard?')) {
      return;
    }
    try {
      await api.deleteContest(contestId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to archive contest');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrative Control Panel
          </h1>
          <p className="text-xs text-slate-500">
            Contest lifecycle management, Redis Sorted Set reconciliation, and database health monitors
          </p>
        </div>
      </div>

      {/* Database Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* MongoDB Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">MongoDB Persistent Engine</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {health?.databases.mongodb.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Database: <code className="font-bold text-slate-700">{health?.databases.mongodb.databaseName}</code>
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400">Users</div>
                <div className="text-lg font-bold text-slate-800">
                  {health?.databases.mongodb.collections.users || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400">Contests</div>
                <div className="text-lg font-bold text-slate-800">
                  {health?.databases.mongodb.collections.contests || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400">Submissions</div>
                <div className="text-lg font-bold text-slate-800">
                  {health?.databases.mongodb.collections.submissions || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Redis Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">Redis In-Memory Engine</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {health?.databases.redis.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Memory Used: <code className="font-bold text-slate-700">{health?.databases.redis.usedMemory}</code>
            </p>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400">Ping Latency</div>
                <div className="text-lg font-bold text-emerald-600">
                  {health?.databases.redis.pingLatencyMs} ms
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400">Sorted Set Keys</div>
                <div className="text-lg font-bold text-indigo-600">
                  {health?.databases.redis.keysCount} keys
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contest Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Contest Lifecycle &amp; Cache Rebuilding</h3>
          </div>
          <span className="text-xs text-slate-400">
            {contests.length} total contests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="py-3 px-6">Contest Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Max Pts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Change Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {contests.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/70">
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    {c.title}
                  </td>
                  <td className="py-4 px-4 font-mono">
                    {c.contestType}
                  </td>
                  <td className="py-4 px-4 font-bold text-indigo-600">
                    {c.maxScore}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        c.status === 'live'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : c.status === 'completed'
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c._id, e.target.value)}
                      className="py-1 px-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => handleRebuildCache(c._id)}
                      disabled={rebuildingId === c._id}
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                      title="Replay MongoDB participations into Redis Sorted Set"
                    >
                      {rebuildingId === c._id ? 'Rebuilding...' : 'Rebuild Redis'}
                    </button>
                    <button
                      onClick={() => handleDeleteContest(c._id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Archive contest and remove Redis Sorted Set key"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
