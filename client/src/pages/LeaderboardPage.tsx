import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Trophy,
  Flame,
  Radio,
  RefreshCw,
  PlusCircle,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { Contest, LeaderboardEntry, ScoreUpdateEvent } from '../types/index.js';
import { Podium } from '../components/Podium.js';
import { LeaderboardTable } from '../components/LeaderboardTable.js';
import { SubmitScoreModal } from '../components/SubmitScoreModal.js';
import { SimulateBanner } from '../components/SimulateBanner.js';

export const LeaderboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { joinContest, leaveContest, lastScoreEvent, isConnected } = useSocket();

  // State
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>('');
  const [currentContest, setCurrentContest] = useState<Contest | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [participants, setParticipants] = useState<any[]>([]);

  // Filtering & Pagination
  const [search, setSearch] = useState<string>('');
  const [department, setDepartment] = useState<string>('all');
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Real-time highlights
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<ScoreUpdateEvent | null>(null);
  const [myRankInfo, setMyRankInfo] = useState<any | null>(null);
  const [showMyRankModal, setShowMyRankModal] = useState<boolean>(false);

  // 1. Fetch contests on mount
  useEffect(() => {
    async function loadContests() {
      try {
        const res = await api.getContests();
        setContests(res.contests);

        // Pick contest from searchParams or first live contest or first available
        const paramId = searchParams.get('contestId');
        if (paramId && res.contests.some((c) => c._id === paramId)) {
          setSelectedContestId(paramId);
        } else {
          const live = res.contests.find((c) => c.status === 'live');
          const defaultId = live ? live._id : res.contests[0]?._id || '';
          setSelectedContestId(defaultId);
        }
      } catch (err) {
        console.error('Failed to load contests:', err);
      }
    }
    loadContests();
  }, []);

  // 2. Manage Socket.IO contest room subscription
  useEffect(() => {
    if (!selectedContestId) return;

    joinContest(selectedContestId);
    return () => {
      leaveContest(selectedContestId);
    };
  }, [selectedContestId]);

  // 3. Fetch Leaderboard & Participants
  const fetchLeaderboard = async (isBackground = false) => {
    if (!selectedContestId) return;
    if (!isBackground) setLoading(true);

    try {
      const [contestRes, lbRes, partRes] = await Promise.all([
        api.getContestById(selectedContestId),
        api.getLeaderboard(selectedContestId, {
          limit,
          offset,
          department,
          search,
        }),
        api.getParticipants(selectedContestId),
      ]);

      setCurrentContest(contestRes.contest);
      setEntries(lbRes.leaderboard);
      setTotalCount(lbRes.totalParticipants);
      setParticipants(partRes.participants);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedContestId, limit, offset, department, search]);

  // 4. Handle Real-Time Score Updates from Socket.IO & Redis Pub/Sub
  useEffect(() => {
    if (!lastScoreEvent) return;

    // Only process if event matches currently viewed contest
    if (lastScoreEvent.contestId === selectedContestId) {
      // Show floating real-time toast
      setLiveToast(lastScoreEvent);
      setHighlightedStudentId(lastScoreEvent.studentId);

      // Re-fetch leaderboard in background
      fetchLeaderboard(true);

      // Clear highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedStudentId(null);
        setLiveToast(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [lastScoreEvent, selectedContestId]);

  // 5. Handle Find My Rank
  const handleFindMyRank = async () => {
    if (!selectedContestId || !user) return;
    try {
      const res = await api.getMyRank(selectedContestId);
      setMyRankInfo(res);
      setShowMyRankModal(true);

      if (res.isRanked && res.rank) {
        // Highlight row
        setHighlightedStudentId(user._id);
        setTimeout(() => setHighlightedStudentId(null), 4000);
      }
    } catch (err) {
      console.error('Error finding rank:', err);
    }
  };

  // 6. Handle Rebuild Leaderboard
  const handleRebuild = async () => {
    if (!selectedContestId) return;
    try {
      const res = await api.rebuildLeaderboard(selectedContestId);
      alert(`Redis Sorted Set rebuilt successfully! Restored ${res.restoredCount} participants.`);
      fetchLeaderboard();
    } catch (err: any) {
      alert(`Error rebuilding Redis leaderboard: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Real-time floating update toast */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-indigo-500/30 flex items-center space-x-3.5 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span>⚡ Live Score Update</span>
              <span>•</span>
              <span className="text-emerald-400">Redis Pub/Sub</span>
            </div>
            <div className="text-sm font-semibold text-white">
              {liveToast.studentName} scored <strong>{liveToast.score} pts</strong>
            </div>
            <div className="text-xs text-slate-400">
              New Rank: <strong className="text-white">#{liveToast.newRank}</strong>
              {liveToast.rankDelta > 0 && (
                <span className="text-emerald-400 font-bold ml-1.5">
                  (▲ +{liveToast.rankDelta} positions)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-slate-400 hover:text-white text-xs pl-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Contest Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Live Leaderboard
              </h1>
              <p className="text-xs text-slate-500">
                Sorted Set rank computation in Redis 5 • Sub-millisecond Skip-List ordering
              </p>
            </div>
          </div>
        </div>

        {/* Contest Switcher & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Select Contest Dropdown */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedContestId}
              onChange={(e) => {
                setSelectedContestId(e.target.value);
                setSearchParams({ contestId: e.target.value });
              }}
              className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none"
            >
              {contests.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Submit Score Modal Button */}
          {currentContest && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer hover:shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Score</span>
            </button>
          )}

          {/* Refresh / Rebuild for Admin */}
          {user?.role === 'admin' && (
            <button
              onClick={handleRebuild}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Rebuild Redis Sorted Set from MongoDB persistent records"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Rebuild Cache</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Simulation Banner */}
      {user?.role === 'admin' && (
        <SimulateBanner contestId={selectedContestId} />
      )}

      {/* Contest Details Banner */}
      {currentContest && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  currentContest.status === 'live'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentContest.status === 'completed'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                ● {currentContest.status}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">
                Type: {currentContest.contestType === 'coding_contest' ? 'Coding Contest' : 'Exam'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{currentContest.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{currentContest.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Max Score</div>
              <div className="text-base font-black text-indigo-600">{currentContest.maxScore} pts</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Scoring Policy</div>
              <div className="text-xs font-bold text-slate-800 capitalize">
                {currentContest.scoringRule.replace('_', ' ')}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Tie-Breaking</div>
              <div className="text-xs font-bold text-slate-800 capitalize">
                {currentContest.tieBreakingRule.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Podium Display (Top 3) */}
      {entries.length > 0 && currentContest && (
        <Podium entries={entries} maxScore={currentContest.maxScore} />
      )}

      {/* Interactive Leaderboard Table */}
      {currentContest && (
        <LeaderboardTable
          entries={entries}
          totalCount={totalCount}
          limit={limit}
          offset={offset}
          search={search}
          department={department}
          onSearchChange={setSearch}
          onDepartmentChange={setDepartment}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setOffset(0);
          }}
          onPageChange={setOffset}
          onFindMyRank={user?.role === 'student' ? handleFindMyRank : undefined}
          currentUserId={user?._id}
          maxScore={currentContest.maxScore}
          highlightedStudentId={highlightedStudentId}
        />
      )}

      {/* Submit Score Modal */}
      {currentContest && (
        <SubmitScoreModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          contest={currentContest}
          participants={participants}
          isAdmin={user?.role === 'admin'}
          currentUserId={user?._id}
          onSubmissionSuccess={() => {
            fetchLeaderboard();
          }}
        />
      )}

      {/* Find My Rank Modal */}
      {showMyRankModal && myRankInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-bold text-slate-900">Your Current Standing</h4>
              </div>
              <button
                onClick={() => setShowMyRankModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            {myRankInfo.isRanked ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col items-center justify-center mx-auto text-indigo-600 font-black text-2xl shadow-sm">
                  #{myRankInfo.rank}
                </div>
                <div>
                  <div className="font-bold text-lg text-slate-900">{user?.name}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {user?.studentIdCode} • {user?.department}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400">Current Score:</span>
                    <div className="font-extrabold text-base text-slate-900">
                      {myRankInfo.score} / {myRankInfo.maxScore}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Ranked:</span>
                    <div className="font-extrabold text-base text-slate-900">
                      {myRankInfo.totalParticipants} students
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                You have not registered or participated in this contest yet.
              </div>
            )}

            <button
              onClick={() => setShowMyRankModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
