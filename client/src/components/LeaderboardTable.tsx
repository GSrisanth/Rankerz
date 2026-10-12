import React from 'react';
import {
  Trophy,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  User as UserIcon,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { LeaderboardEntry } from '../types/index.js';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  totalCount: number;
  limit: number;
  offset: number;
  search: string;
  department: string;
  onSearchChange: (search: string) => void;
  onDepartmentChange: (department: string) => void;
  onLimitChange: (limit: number) => void;
  onPageChange: (offset: number) => void;
  onFindMyRank?: () => void;
  currentUserId?: string;
  maxScore: number;
  highlightedStudentId?: string | null;
}

const DEPARTMENTS = ['all', 'CSE', 'ECE', 'AI&ML', 'Data Science', 'IT', 'Mechanical', 'Civil'];

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  totalCount,
  limit,
  offset,
  search,
  department,
  onSearchChange,
  onDepartmentChange,
  onLimitChange,
  onPageChange,
  onFindMyRank,
  currentUserId,
  maxScore,
  highlightedStudentId,
}) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-amber-950 font-black text-xs shadow-sm shadow-amber-300">
          #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-300 text-slate-900 font-black text-xs shadow-sm">
          #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700 text-white font-black text-xs shadow-sm">
          #3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
        {rank}
      </span>
    );
  };

  const renderRankMovement = (delta?: number) => {
    if (!delta || delta === 0) {
      return (
        <span title="No rank change">
          <Minus className="w-3.5 h-3.5 text-slate-300" />
        </span>
      );
    }
    if (delta > 0) {
      return (
        <span className="flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full" title={`Moved up ${delta} positions`}>
          <ArrowUp className="w-3 h-3 mr-0.5" />
          {delta}
        </span>
      );
    }
    return (
      <span className="flex items-center text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full" title={`Moved down ${Math.abs(delta)} positions`}>
        <ArrowDown className="w-3 h-3 mr-0.5" />
        {Math.abs(delta)}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Search, Filters, and Tabs Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Search & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search participant or ID..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Department Select */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={department}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="py-1.5 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-medium"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Quick Views and Actions */}
        <div className="flex items-center space-x-2">
          {/* Top 10 / Top 50 Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => onLimitChange(10)}
              className={`px-3 py-1 rounded-lg transition-all ${
                limit === 10
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top 10
            </button>
            <button
              onClick={() => onLimitChange(50)}
              className={`px-3 py-1 rounded-lg transition-all ${
                limit === 50
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top 50
            </button>
          </div>

          {/* Find My Rank Button */}
          {onFindMyRank && (
            <button
              onClick={onFindMyRank}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Find My Rank</span>
            </button>
          )}
        </div>
      </div>

      {/* Leaderboard Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <th className="py-3 px-4 w-16 text-center">Rank</th>
              <th className="py-3 px-2 w-12 text-center">Shift</th>
              <th className="py-3 px-4">Participant</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4 text-right">Score</th>
              <th className="py-3 px-4 text-right">Percentage</th>
              <th className="py-3 px-4 text-center">Attempts</th>
              <th className="py-3 px-4 text-right">Last Submission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Trophy className="w-8 h-8 text-slate-300" />
                    <p className="font-medium text-slate-600">No participants found in leaderboard</p>
                    <p className="text-xs text-slate-400">
                      {search ? 'Try clearing your search filters' : 'Register and submit scores to populate ranks'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isCurrentUser = currentUserId === entry.studentId;
                const isHighlighted = highlightedStudentId === entry.studentId || entry.isJustUpdated;

                return (
                  <tr
                    key={entry.studentId}
                    id={`rank-row-${entry.studentId}`}
                    className={`transition-colors duration-300 hover:bg-slate-50/70 ${
                      isCurrentUser ? 'bg-indigo-50/40 font-medium' : ''
                    } ${isHighlighted ? 'bg-emerald-50/80 animate-flash-green' : ''}`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {renderRankBadge(entry.rank)}
                      </div>
                    </td>

                    {/* Movement Indicator */}
                    <td className="py-3.5 px-2 text-center">
                      <div className="flex items-center justify-center">
                        {renderRankMovement(entry.rankDelta)}
                      </div>
                    </td>

                    {/* Participant Details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                          {entry.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                            <span>{entry.name}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            {entry.studentIdCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {entry.department}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-extrabold text-slate-900 text-base">
                        {entry.score}
                      </div>
                      <div className="text-[11px] text-slate-400">of {maxScore} pts</div>
                    </td>

                    {/* Percentage Bar */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-semibold text-slate-800">
                        {entry.percentage}%
                      </div>
                      <div className="w-20 ml-auto bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(entry.percentage, 100)}%` }}
                        />
                      </div>
                    </td>

                    {/* Attempts */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {entry.attemptsCount} {entry.attemptsCount === 1 ? 'attempt' : 'attempts'}
                      </span>
                    </td>

                    {/* Last Submission Time */}
                    <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                      {entry.lastUpdatedAt ? (
                        <span title={new Date(entry.lastUpdatedAt).toLocaleString()}>
                          {new Date(entry.lastUpdatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span>Initial</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div>
          Showing <span className="font-semibold text-slate-700">{entries.length}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalCount}</span> ranked participants
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(offset - limit, 0))}
            disabled={offset === 0}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Previous
          </button>
          <span className="px-2 font-semibold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(offset + limit)}
            disabled={offset + limit >= totalCount}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
