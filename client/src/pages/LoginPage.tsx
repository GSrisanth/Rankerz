import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Lock, Mail, ArrowRight, AlertCircle, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/leaderboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@rankerz.edu');
    setPassword('AdminRankerz@2025');
  };

  const fillStudentCredentials = () => {
    setEmail('arjun.sharma@rankerz.edu');
    setPassword('StudentRankerz@2025');
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100">
        {/* Title */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20 mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to Rankerz
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Rise through the ranks • CSE3009 NoSQL Platform
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs">
          <div className="text-indigo-900 font-bold mb-2 flex items-center space-x-1">
            <span>⚡ Quick Demo Login Credentials:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="py-1.5 px-2 bg-white hover:bg-slate-50 text-indigo-700 font-semibold rounded-lg border border-indigo-200 text-[11px] shadow-sm flex items-center justify-center space-x-1 cursor-pointer transition-colors"
            >
              <Shield className="w-3 h-3 text-indigo-600" />
              <span>Prof. Admin</span>
            </button>
            <button
              type="button"
              onClick={fillStudentCredentials}
              className="py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 text-[11px] shadow-sm flex items-center justify-center space-x-1 cursor-pointer transition-colors"
            >
              <User className="w-3 h-3 text-emerald-600" />
              <span>Student 1</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@rankerz.edu"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          New student?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
