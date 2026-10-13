import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  PlusCircle,
  Calendar,
  Clock,
  Trophy,
  CheckCircle,
  AlertCircle,
  X,
  Play,
  Archive,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Contest } from '../types/index.js';

export const ContestsPage: React.FC = () => {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Create Contest Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'coding_contest' | 'exam'>('coding_contest');
  const [newDuration, setNewDuration] = useState(90);
  const [newMaxScore, setNewMaxScore] = useState(100);
  const [newStatus, setNewStatus] = useState<'live' | 'scheduled'>('live');
  const [newScoringRule, setNewScoringRule] = useState<'latest_attempt' | 'best_attempt'>('best_attempt');
  const [newTieRule, setNewTieRule] = useState<'earlier_submission' | 'fewest_attempts'>('earlier_submission');
  const [createError, setCreateError] = useState<string | null>(null);

  // Student registration states
  const [registeredContestIds, setRegisteredContestIds] = useState<Set<string>>(new Set());

  const loadContests = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.getContests({
        status: statusFilter,
        type: typeFilter,
      });
      setContests(res.contests);
    } catch (err: any) {
      console.error('Failed to load contests:', err);
      setLoadError(err?.message || 'Failed to fetch contests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
  }, [statusFilter, typeFilter]);

  const handleRegister = async (contestId: string) => {
    try {
      await api.registerForContest(contestId);
      setRegisteredContestIds((prev) => new Set(prev).add(contestId));
      alert('Successfully registered for contest!');
      loadContests();
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    }
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    try {
      const now = new Date();
      const startTime = now.toISOString();
      const endTime = new Date(now.getTime() + newDuration * 60000).toISOString();

      await api.createContest({
        title: newTitle,
        description: newDesc,
        contestType: newType,
        durationMinutes: newDuration,
        maxScore: newMaxScore,
        status: newStatus,
        scoringRule: newScoringRule,
        tieBreakingRule: newTieRule,
        startTime,
        endTime,
      });

      setIsCreateOpen(false);
      // Reset form
      setNewTitle('');
      setNewDesc('');
      loadContests();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create contest');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Contests &amp; Examinations
              </h1>
              <p className="text-xs text-slate-500">
                Browse, register, and compete in real-time academic assessments
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Contest</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {['all', 'live', 'scheduled', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                statusFilter === st
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {['all', 'coding_contest', 'exam'].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                typeFilter === tp
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tp === 'all' ? 'All Types' : tp === 'coding_contest' ? 'Coding Contests' : 'Exams'}
            </button>
          ))}
        </div>
      </div>

      {/* Connection Notice / Load Error */}
      {loadError && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 font-bold">
              !
            </div>
            <div>
              <div className="font-bold text-sm">Connection Notice</div>
              <div className="text-xs text-amber-700 mt-0.5">{loadError}</div>
            </div>
          </div>
          <button
            onClick={loadContests}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Contests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            No contests match the selected filters.
          </div>
        ) : (
          contests.map((contest) => {
            const isLive = contest.status === 'live';
            const isCompleted = contest.status === 'completed';
            const isRegistered = registeredContestIds.has(contest._id);

            return (
              <div
                key={contest._id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Status & Type Pills */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        isLive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                          : isCompleted
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      ● {contest.status}
                    </span>

                    <span className="text-xs font-mono font-semibold text-slate-400">
                      {contest.contestType === 'coding_contest' ? 'Coding' : 'Exam'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {contest.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    {contest.description}
                  </p>

                  {/* Rules & Meta Chips */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{contest.durationMinutes} mins</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Trophy className="w-3.5 h-3.5 text-slate-400" />
                      <span>{contest.maxScore} max pts</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Scoring: <strong className="text-slate-600">{contest.scoringRule}</strong></span>
                    <span>Tie: <strong className="text-slate-600">{contest.tieBreakingRule}</strong></span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  {user?.role === 'student' && !isCompleted && (
                    <button
                      onClick={() => handleRegister(contest._id)}
                      disabled={isRegistered}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                        isRegistered
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isRegistered ? '✓ Registered' : 'Register'}
                    </button>
                  )}

                  <Link
                    to={`/leaderboard?contestId=${contest._id}`}
                    className="ml-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-600/20"
                  >
                    View Leaderboard
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Contest Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Create New Contest</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateContest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contest Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. CodeSprint 2025"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Overview of contest rules and topics..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="coding_contest">Coding Contest</option>
                    <option value="exam">Examination</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="live">Live (Immediate)</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="600"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maximum Score
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={newMaxScore}
                    onChange={(e) => setNewMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scoring Rule
                  </label>
                  <select
                    value={newScoringRule}
                    onChange={(e: any) => setNewScoringRule(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="best_attempt">Best Attempt</option>
                    <option value="latest_attempt">Latest Attempt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tie-Breaking Rule
                  </label>
                  <select
                    value={newTieRule}
                    onChange={(e: any) => setNewTieRule(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="earlier_submission">Earlier Submission (Fastest)</option>
                    <option value="fewest_attempts">Fewest Attempts</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20"
                >
                  Create Contest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
