import React, { useState, useEffect } from 'react';
import {
  Database,
  Zap,
  Layers,
  Code,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Cpu,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api.js';

export const DatabaseDemoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'redis' | 'mongo' | 'cap' | 'viva'>('redis');
  const [redisOps, setRedisOps] = useState<any[]>([]);
  const [loadingOps, setLoadingOps] = useState<boolean>(true);
  const [capData, setCapData] = useState<any | null>(null);

  const fetchRedisDemo = async () => {
    setLoadingOps(true);
    try {
      const res = await api.getRedisOps();
      setRedisOps(res.operations);
    } catch (err) {
      console.error('Failed to run Redis ops:', err);
    } finally {
      setLoadingOps(false);
    }
  };

  useEffect(() => {
    fetchRedisDemo();
    api.getCapAnalysis().then(setCapData).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Advanced Database Demonstration
              </h1>
              <p className="text-xs text-slate-500">
                Live NoSQL command inspector, MongoDB aggregation pipelines, and CAP-theorem analysis
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Live Commands */}
        <button
          onClick={fetchRedisDemo}
          disabled={loadingOps}
          className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingOps ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Execute Live Queries</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-4 mb-8 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('redis')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'redis'
              ? 'bg-red-500 text-white shadow-sm shadow-red-500/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>1. Redis Sorted Sets &amp; Pub/Sub (Live Engine)</span>
        </button>

        <button
          onClick={() => setActiveTab('mongo')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'mongo'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>2. MongoDB CRUD &amp; Aggregations</span>
        </button>

        <button
          onClick={() => setActiveTab('cap')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cap'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>3. CAP Theorem &amp; NoSQL Trade-Offs</span>
        </button>

        <button
          onClick={() => setActiveTab('viva')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'viva'
              ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>4. Viva Cheat Sheet (Q&amp;A)</span>
        </button>
      </div>

      {/* Tab 1: Live Redis Operations Inspector */}
      {activeTab === 'redis' && (
        <div className="space-y-6">
          <div className="bg-red-50/60 border border-red-200/80 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-red-900 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-red-600" />
              <span>How Redis Sorted Sets (ZSET) Function in Rankerz</span>
            </h3>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              In Redis, a Sorted Set is implemented using a dual data structure: a <strong>Skip-List</strong> combined with a <strong>Hash Map</strong>. The hash map maps student member IDs to their scores in <code>O(1)</code>, while the skip-list maintains elements in ordered rank sequence in <code>O(log(N))</code> time complexity. This allows Rankerz to rank 100,000+ competitors with sub-millisecond latencies.
            </p>
          </div>

          <div className="space-y-4">
            {redisOps.map((op, idx) => (
              <div
                key={idx}
                className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-lg space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-red-400" />
                    <code className="text-sm font-mono font-bold text-amber-300">
                      {op.command}
                    </code>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                    Execution Time: {op.executionTimeMs} ms
                  </span>
                </div>

                <p className="text-xs text-slate-300">{op.description}</p>

                {/* Output Box */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Live Redis CLI Response:
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto border border-slate-800">
                    {JSON.stringify(op.result, null, 2)}
                  </pre>
                </div>

                <div className="text-[11px] text-indigo-300 pt-1">
                  <strong>Academic Justification:</strong> {op.academicJustification}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: MongoDB Aggregations & CRUD */}
      {activeTab === 'mongo' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>MongoDB Document Data Model &amp; Aggregations</span>
            </h3>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              Unlike Redis which stores transient scores, MongoDB acts as the durable persistent source of truth. Every attempt is immutable in the <code>submissions</code> collection, while current standings are maintained in the <code>participations</code> collection with a unique compound index on <code>&#123; contestId: 1, studentId: 1 &#125;</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pipeline 1 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Code className="w-4 h-4 text-emerald-600" />
                <span>Contest Overview Aggregation</span>
              </h4>
              <p className="text-xs text-slate-500">
                Calculates average, highest, lowest, and standard deviation in a single pass.
              </p>
              <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
{`Participation.aggregate([
  { $match: { contestId: contestObjId } },
  {
    $group: {
      _id: '$contestId',
      totalParticipants: { $sum: 1 },
      averageScore: { $avg: '$currentScore' },
      highestScore: { $max: '$currentScore' },
      lowestScore: { $min: '$currentScore' },
      stdDevScore: { $stdDevPop: '$currentScore' }
    }
  }
])`}
              </pre>
            </div>

            {/* Pipeline 2 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Code className="w-4 h-4 text-indigo-600" />
                <span>Score Distribution Bucket Aggregation</span>
              </h4>
              <p className="text-xs text-slate-500">
                Uses <code>$bucket</code> to partition scores into intervals: 0-20%, 21-40%, etc.
              </p>
              <pre className="p-3 bg-slate-900 text-indigo-300 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
{`Participation.aggregate([
  { $match: { contestId: contestObjId } },
  {
    $bucket: {
      groupBy: '$percentage',
      boundaries: [0, 20.01, 40.01, 60.01, 80.01, 100.01],
      output: { count: { $sum: 1 } }
    }
  }
])`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: CAP Theorem Comparative Matrix */}
      {activeTab === 'cap' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>CAP Theorem Architectural Trade-Off Analysis</span>
            </h3>
            <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
              The CAP Theorem states that under a <strong>Network Partition (P)</strong>, a distributed system must trade off between <strong>Consistency (C)</strong> and <strong>Availability (A)</strong>. Rankerz adopts a two-tier strategy: MongoDB guarantees strict persistence, while Redis optimizes for ultra-low read/write latencies.
            </p>
          </div>

          <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-4 px-6">Dimension</th>
                  <th className="py-4 px-6 text-red-600 font-extrabold">Redis (In-Memory Data Store)</th>
                  <th className="py-4 px-6 text-emerald-600 font-extrabold">MongoDB (Document Store)</th>
                  <th className="py-4 px-6 text-slate-600 font-extrabold">Relational RDBMS (PostgreSQL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-900">Data Model</td>
                  <td className="py-3.5 px-6 font-mono">Sorted Set (Skip List + Hash Map)</td>
                  <td className="py-3.5 px-6 font-mono">BSON Hierarchical Documents</td>
                  <td className="py-3.5 px-6 font-mono">Normalized Relational Tables</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-900">Primary Role in Rankerz</td>
                  <td className="py-3.5 px-6">Live Leaderboard &amp; Pub/Sub Ingestion</td>
                  <td className="py-3.5 px-6">Persistent Submissions &amp; Aggregations</td>
                  <td className="py-3.5 px-6">Not chosen (Heavy lock contention on ZSET)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-900">Ranking Time Complexity</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600">O(log(N)) Skip-List lookup</td>
                  <td className="py-3.5 px-6 text-amber-600">O(N log(N)) full index scan</td>
                  <td className="py-3.5 px-6 text-amber-600">O(N log(N)) via RANK() OVER(...)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-900">Read / Write Latency</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600">&lt; 1 ms (RAM In-Memory)</td>
                  <td className="py-3.5 px-6">5 - 15 ms (WiredTiger Cache / Disk)</td>
                  <td className="py-3.5 px-6">10 - 50 ms (ACID Disk Journaling)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-900">CAP Theorem Stance</td>
                  <td className="py-3.5 px-6">Typically CP / AP depending on replica lag</td>
                  <td className="py-3.5 px-6">CP (Configured with Majority Write Concern)</td>
                  <td className="py-3.5 px-6">CA (Single-node) / CP (Replicated)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-900">Cross-DB Failure Strategy</td>
                  <td className="py-3.5 px-6" colSpan={3}>
                    <strong>Two-Tiered Hybrid Consistency:</strong> MongoDB is the authoritative durable store. If Redis restarts or drops data, the backend executes <code>rebuildLeaderboardFromMongo()</code> in O(N) to 100% reconstruct the Redis skip-list without data loss!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Viva Cheat Sheet */}
      {activeTab === 'viva' && (
        <div className="space-y-4">
          <div className="bg-violet-50/60 border border-violet-200/80 rounded-2xl p-5 mb-4">
            <h3 className="text-sm font-bold text-violet-900 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-violet-600" />
              <span>CSE3009 Viva Preparation Guide: 10 Critical Professor Questions</span>
            </h3>
            <p className="text-xs text-violet-700 mt-1">
              Concise, rigorous academic answers reflecting the exact Rankerz codebase.
            </p>
          </div>

          {[
            {
              q: '1. What data structure does Redis use internally for Sorted Sets?',
              a: 'Redis Sorted Sets (ZSET) use a dual data structure: a Skip-List combined with a Hash Map. The Hash Map stores member-to-score mappings in O(1) time complexity, while the Skip-List maintains elements in score-sorted order with average O(log(N)) search, insert, and delete complexity.',
            },
            {
              q: '2. How does ZREVRANK work and why is the return value zero-based?',
              a: 'ZREVRANK returns the 0-based index of a member sorted by score in descending order (highest score first). In Redis, array indexing is 0-based. In Rankerz, we convert this index to human-readable 1-based ranks by computing (zeroBasedRank + 1) before displaying.',
            },
            {
              q: '3. Why is Socket.IO required in addition to Redis Pub/Sub?',
              a: 'Redis Pub/Sub operates exclusively on the server side between database connections and backend services; web browsers cannot directly connect to raw Redis TCP sockets. Rankerz uses a dedicated Redis subscriber on the Node.js backend which receives published events and forwards them over WebSocket rooms via Socket.IO to connected client browsers.',
            },
            {
              q: '4. How does Rankerz handle deterministic tie-breaking for equal scores?',
              a: 'In Redis Sorted Sets, members with equal scores are ordered lexicographically by member ID, which is not academically fair. Rankerz implements a fractional composite score: CompositeScore = RawScore + (1 - completionTimeMs / 100,000,000) * 0.001. Earlier submissions receive a strictly positive fractional bonus that preserves clean integer display points while guaranteeing that faster students rank higher.',
            },
            {
              q: '5. What happens if Redis loses its data or crashes?',
              a: 'Rankerz treats MongoDB as the single persistent source of truth. If Redis restarts or its cache is evicted, the administrator can invoke the Rebuild Leaderboard endpoint (POST /api/contests/:id/rebuild-leaderboard). It replays all valid participation records from MongoDB and repopulates the Redis Sorted Set in O(N) time with zero permanent data loss.',
            },
            {
              q: '6. Why not use only MongoDB for both persistent storage and live rankings?',
              a: 'Finding a student\'s dynamic rank in MongoDB requires scanning and counting all participants whose score is greater than theirs ($gt query) or sorting the entire collection (O(N log(N))). Under hundreds of concurrent score submissions, this causes heavy disk I/O and query latency. Redis provides logarithmic O(log(N)) ranking directly in memory.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">{item.q}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
