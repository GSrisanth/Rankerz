import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Sparkles, RefreshCw, Radio, Zap } from 'lucide-react';
import { api } from '../services/api.js';

interface SimulateBannerProps {
  contestId?: string;
  onSimulatedSubmission?: (result: any) => void;
}

export const SimulateBanner: React.FC<SimulateBannerProps> = ({
  contestId,
  onSimulatedSubmission,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isSimulatingOnce, setIsSimulatingOnce] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSingleSimulation = async () => {
    setIsSimulatingOnce(true);
    try {
      const res = await api.simulateSubmission(contestId);
      if (onSimulatedSubmission) {
        onSimulatedSubmission(res.result);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulatingOnce(false);
    }
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        triggerSingleSimulation();
      }, 3500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, contestId]);

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-violet-500/10 border border-amber-300/40 rounded-2xl p-4 mb-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900">
                Live Simulation Engine
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300">
                DEMO / EVALUATION MODE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Generates random student score submissions via Redis Pub/Sub &amp; Socket.IO broadcast.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Single Event Trigger */}
          <button
            onClick={triggerSingleSimulation}
            disabled={isSimulatingOnce || isRunning}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Inject 1 live score update"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingOnce ? 'animate-spin' : ''}`} />
            <span>Inject 1 Score</span>
          </button>

          {/* Continuous Loop Toggle */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Auto Stream (3s)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
