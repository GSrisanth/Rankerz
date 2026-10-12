import React from 'react';
import { Trophy, Medal, Award, Sparkles, TrendingUp } from 'lucide-react';
import { LeaderboardEntry } from '../types/index.js';

interface PodiumProps {
  entries: LeaderboardEntry[];
  maxScore: number;
}

export const Podium: React.FC<PodiumProps> = ({ entries, maxScore }) => {
  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);

  if (!first && !second && !third) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-b from-indigo-50/60 via-white to-white rounded-3xl border border-indigo-100/80 p-6 md:p-8 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Top Performers Podium
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time top 3 standings computed via Redis Sorted Set (ZSET)
          </p>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Live Rankings</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-4xl mx-auto pt-6">
        {/* Second Place (Silver) */}
        <div className="flex flex-col items-center">
          {second ? (
            <div className="w-full flex flex-col items-center transition-all duration-300 hover:-translate-y-1">
              <div className="relative mb-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-200 via-slate-100 to-slate-300 border-2 border-slate-300 flex items-center justify-center shadow-md">
                  <Medal className="w-8 h-8 text-slate-500" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-700 text-white text-[10px] font-bold shadow">
                  #2
                </div>
              </div>

              <div className="text-center w-full px-1">
                <div className="font-bold text-xs sm:text-sm text-slate-800 truncate" title={second.name}>
                  {second.name}
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  {second.studentIdCode} • {second.department}
                </div>
                <div className="mt-1 flex items-center justify-center space-x-1">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900">
                    {second.score}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">/ {maxScore}</span>
                </div>
              </div>

              {/* Podium Step */}
              <div className="w-full mt-3 h-28 sm:h-36 rounded-t-2xl bg-gradient-to-t from-slate-200 to-slate-100 border-t-2 border-x-2 border-slate-300 flex flex-col items-center justify-center shadow-inner">
                <span className="text-2xl sm:text-3xl font-black text-slate-400">2</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SILVER</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-32 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-xs text-slate-400">
              Awaiting 2nd
            </div>
          )}
        </div>

        {/* First Place (Gold) */}
        <div className="flex flex-col items-center -mt-6">
          {first ? (
            <div className="w-full flex flex-col items-center transition-all duration-300 hover:-translate-y-1">
              <div className="relative mb-3">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-2 border-amber-300 flex items-center justify-center shadow-xl shadow-amber-500/20 animate-pulse-subtle">
                  <Trophy className="w-10 h-10 text-white drop-shadow" />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>LEADER</span>
                </div>
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[11px] font-black shadow">
                  #1
                </div>
              </div>

              <div className="text-center w-full px-1">
                <div className="font-extrabold text-sm sm:text-base text-slate-900 truncate" title={first.name}>
                  {first.name}
                </div>
                <div className="text-[11px] font-mono text-indigo-600 font-semibold truncate">
                  {first.studentIdCode} • {first.department}
                </div>
                <div className="mt-1 flex items-center justify-center space-x-1">
                  <span className="text-lg sm:text-2xl font-black text-indigo-600">
                    {first.score}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ {maxScore}</span>
                </div>
              </div>

              {/* Podium Step */}
              <div className="w-full mt-3 h-36 sm:h-48 rounded-t-2xl bg-gradient-to-t from-amber-200 via-amber-100 to-yellow-50 border-t-4 border-x-2 border-amber-400 flex flex-col items-center justify-center shadow-lg shadow-amber-100/50">
                <span className="text-3xl sm:text-5xl font-black text-amber-500 drop-shadow-sm">1</span>
                <span className="text-xs font-extrabold text-amber-700 uppercase tracking-widest mt-1">CHAMPION</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-44 border border-dashed border-amber-200 rounded-2xl flex items-center justify-center text-xs text-slate-400">
              Awaiting 1st
            </div>
          )}
        </div>

        {/* Third Place (Bronze) */}
        <div className="flex flex-col items-center">
          {third ? (
            <div className="w-full flex flex-col items-center transition-all duration-300 hover:-translate-y-1">
              <div className="relative mb-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-400 to-amber-700 border-2 border-amber-600 flex items-center justify-center shadow-md">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-800 text-white text-[10px] font-bold shadow">
                  #3
                </div>
              </div>

              <div className="text-center w-full px-1">
                <div className="font-bold text-xs sm:text-sm text-slate-800 truncate" title={third.name}>
                  {third.name}
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  {third.studentIdCode} • {third.department}
                </div>
                <div className="mt-1 flex items-center justify-center space-x-1">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900">
                    {third.score}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">/ {maxScore}</span>
                </div>
              </div>

              {/* Podium Step */}
              <div className="w-full mt-3 h-24 sm:h-28 rounded-t-2xl bg-gradient-to-t from-orange-200 to-amber-50 border-t-2 border-x-2 border-amber-500 flex flex-col items-center justify-center shadow-inner">
                <span className="text-2xl sm:text-3xl font-black text-amber-600">3</span>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">BRONZE</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-28 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-xs text-slate-400">
              Awaiting 3rd
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
