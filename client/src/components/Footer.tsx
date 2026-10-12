import React from 'react';
import { Trophy, Database, Layers, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-slate-900 font-serif">Rankerz</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              High-concurrency Real-Time Contest & Exam Leaderboard Platform powered by Redis Skip-List Sorted Sets and MongoDB persistent document storage.
            </p>
            <div className="text-[11px] font-semibold text-indigo-600">
              Rise through the ranks.
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Academic Project</h4>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li><span className="font-semibold text-slate-700">Course:</span> CSE3009 — NoSQL Databases</li>
              <li><span className="font-semibold text-slate-700">Institution:</span> VIT-AP University (SCOPE)</li>
              <li><span className="font-semibold text-slate-700">Instructor:</span> Prof. Harapriya Kar</li>
              <li><span className="font-semibold text-slate-700">Assignment:</span> DA Mini Project — Project 5</li>
            </ul>
          </div>

          {/* Architecture */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">NoSQL Engine</h4>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span><strong className="text-slate-700">Redis 5:</strong> ZSET Skip-Lists & Pub/Sub</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span><strong className="text-slate-700">MongoDB:</strong> History & Aggregation Pipelines</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span><strong className="text-slate-700">Socket.IO:</strong> Real-time Event Streaming</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span><strong className="text-slate-700">CAP Model:</strong> CP Primary + Fast Ephemeral Cache</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Evaluation Ready</h4>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>✓ Real CRUD Operations on both DBs</li>
              <li>✓ Redis ZADD / ZREVRANGE / ZREVRANK</li>
              <li>✓ Sub-millisecond Rank Computation</li>
              <li>✓ Full Deterministic Tie-Breaking</li>
              <li>✓ 8-Page Submission Report & Viva Guide</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div>
            © 2025 Rankerz Platform. Built for VIT-AP CSE3009 Digital Assignment.
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            <span>All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
