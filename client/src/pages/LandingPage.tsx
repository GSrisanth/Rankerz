import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Zap,
  Layers,
  Database,
  BarChart2,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Users,
  Sparkles,
  Flame,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Contest } from '../types/index.js';

export const LandingPage: React.FC = () => {
  const [liveContests, setLiveContests] = useState<Contest[]>([]);

  useEffect(() => {
    api.getContests({ status: 'live' }).then((res) => {
      setLiveContests(res.contests);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>VIT-AP • CSE3009 NoSQL Databases • Project 5</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Rise through the ranks with{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Rankerz
            </span>
          </h1>

          {/* Tagline & Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The high-concurrency Real-Time Contest &amp; Exam Leaderboard Platform.
            Sub-millisecond rank computations powered by <strong>Redis Sorted Sets</strong> and complete historical audit records via <strong>MongoDB</strong>.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              to="/leaderboard"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:shadow-indigo-600/35 hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <span>Explore Live Leaderboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/database-demo"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Database Demo &amp; Viva</span>
            </Link>
          </div>

          {/* Architecture Highlights Pill Row */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Redis Sorted Sets (ZSET)</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Redis Pub/Sub Stream</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>MongoDB Aggregations</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>WebSocket Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Featured Contests Banner */}
      {liveContests.length > 0 && (
        <section className="py-12 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Active Contests in Progress</h3>
                  <p className="text-xs text-slate-500">Live rankings computing in Redis right now</p>
                </div>
              </div>

              <Link
                to="/contests"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
              >
                <span>View all contests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveContests.map((contest) => (
                <div
                  key={contest._id}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        ● LIVE NOW
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        Max: {contest.maxScore} pts
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{contest.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{contest.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Duration: <span className="font-semibold text-slate-700">{contest.durationMinutes} mins</span>
                    </div>
                    <Link
                      to={`/leaderboard?contestId=${contest._id}`}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
                    >
                      Watch Live Leaderboard
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feature Pillars Section */}
      <section className="py-16 md:py-24 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Dual-NoSQL Database Architecture
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Why use both Redis and MongoDB? How they complement each other to solve the real-time leaderboard challenge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Redis ZSET */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Redis Sorted Sets (ZSET)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skip-list and hash map dual-indexing enables logarithmic time complexity <code>O(log(N))</code> for inserting scores (<code>ZADD</code>), checking student rank (<code>ZREVRANK</code>), and retrieving top 10/50 views (<code>ZREVRANGE</code>).
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-mono text-red-600 font-semibold">
                Latency: &lt; 0.5 ms in-memory
              </div>
            </div>

            {/* Card 2: Redis Pub/Sub */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Redis Pub/Sub &amp; WebSockets
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When a score is submitted, backend publishes event to channel <code>contest:id:updates</code>. The dedicated Redis subscriber receives it and forwards via Socket.IO room broadcast to instantly animate leaderboard tables without page reload.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-mono text-indigo-600 font-semibold">
                Instant UI Rank Shift Animations
              </div>
            </div>

            {/* Card 3: MongoDB Document Store */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                MongoDB Persistence &amp; Analytics
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Durable source of truth preserving full attempt history, idempotency keys, and compound unique constraints. Powers multi-stage Aggregation pipelines (<code>$match</code>, <code>$group</code>, <code>$bucket</code>, <code>$lookup</code>) for score histograms and department comparisons.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-mono text-emerald-600 font-semibold">
                ACID Document Persistence
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
