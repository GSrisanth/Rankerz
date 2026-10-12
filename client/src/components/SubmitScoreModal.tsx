import React, { useState } from 'react';
import { Trophy, X, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import { Contest } from '../types/index.js';

interface SubmitScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  contest: Contest;
  participants: any[];
  isAdmin: boolean;
  currentUserId?: string;
  onSubmissionSuccess: (result: any) => void;
}

export const SubmitScoreModal: React.FC<SubmitScoreModalProps> = ({
  isOpen,
  onClose,
  contest,
  participants,
  isAdmin,
  currentUserId,
  onSubmissionSuccess,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    isAdmin && participants.length > 0 ? participants[0].studentId?._id || '' : currentUserId || ''
  );
  const [score, setScore] = useState<number>(Math.floor(contest.maxScore * 0.85));
  const [completionTimeSec, setCompletionTimeSec] = useState<number>(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (score < 0 || score > contest.maxScore) {
        throw new Error(`Score must be between 0 and maximum score of ${contest.maxScore}`);
      }

      const idempotencyKey = `sub_${contest._id}_${selectedStudentId}_${Date.now()}`;
      const res = await api.submitScore(contest._id, {
        studentId: isAdmin ? selectedStudentId : undefined,
        score,
        completionTimeMs: completionTimeSec * 1000,
        idempotencyKey,
      });

      setSuccessResult(res.result);
      onSubmissionSuccess(res.result);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Submit Contest Score</h3>
              <p className="text-xs text-indigo-100 font-medium">{contest.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {successResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">Score Successfully Recorded!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Persisted in MongoDB & updated Redis Sorted Set in real time.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">New Rank</div>
                  <div className="text-2xl font-black text-indigo-600">
                    #{successResult.newRank}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Score</div>
                  <div className="text-2xl font-black text-slate-900">
                    {successResult.currentScore}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Rank Shift</div>
                  <div
                    className={`text-2xl font-black ${
                      successResult.rankDelta > 0
                        ? 'text-emerald-600'
                        : successResult.rankDelta < 0
                        ? 'text-rose-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {successResult.rankDelta > 0
                      ? `▲ +${successResult.rankDelta}`
                      : successResult.rankDelta < 0
                      ? `▼ ${successResult.rankDelta}`
                      : '-'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSuccessResult(null);
                  onClose();
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Participant Selection (For Admin) */}
              {isAdmin && participants.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Participant
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  >
                    {participants.map((p) => (
                      <option key={p.studentId?._id} value={p.studentId?._id}>
                        {p.studentId?.name} ({p.studentId?.studentIdCode} - {p.studentId?.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Score Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Awarded Score
                  </label>
                  <span className="text-xs font-semibold text-indigo-600">
                    Max: {contest.maxScore} pts
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={contest.maxScore}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Completion Time (Tie-breaker factor) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Completion Time (Seconds - Used for deterministic tie-breaker)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10800"
                  value={completionTimeSec}
                  onChange={(e) => setCompletionTimeSec(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tie-breaking rule: Earlier submissions with lower completion time rank higher in Redis Sorted Set.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <span>Evaluating...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit & Broadcast</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
