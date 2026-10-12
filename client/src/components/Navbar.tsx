import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Trophy,
  Activity,
  Layers,
  BarChart3,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
  Database,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { api } from '../services/api.js';
import { HealthStatus } from '../types/index.js';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);

  useEffect(() => {
    api.getHealthStatus().then(setHealth).catch(() => {});
    const interval = setInterval(() => {
      api.getHealthStatus().then(setHealth).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Contests', path: '/contests', icon: Layers },
    ...(user && user.role === 'student'
      ? [{ name: 'My Performance', path: '/performance', icon: Activity }]
      : []),
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Database Demo', path: '/database-demo', icon: Database },
    ...(user && user.role === 'admin'
      ? [{ name: 'Admin Panel', path: '/admin', icon: Shield }]
      : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl font-bold font-serif tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Rankerz
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Live
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 -mt-1 font-medium tracking-wide">
                  Rise through the ranks.
                </span>
              </div>
            </Link>

            {/* Socket Live Connection Indicator */}
            <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-200 text-xs">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="font-medium text-slate-600">
                  {isConnected ? 'Socket.IO Live' : 'Reconnecting...'}
                </span>
              </div>

              {/* DB Health Pill */}
              <button
                onClick={() => setShowHealthModal(!showHealthModal)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 text-slate-600 transition-colors cursor-pointer"
                title="Click to view database statuses"
              >
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-medium">
                  {health?.status === 'healthy' ? 'Redis + Mongo OK' : 'Checking DBs...'}
                </span>
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(link.path)
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center justify-end space-x-1">
                    <span className="capitalize">{user.role}</span>
                    <span>•</span>
                    <span className="font-mono">{user.department}</span>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {user.name.charAt(0)}
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all hover:shadow"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Database Health Dropdown Modal */}
      {showHealthModal && (
        <div className="absolute right-8 top-18 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Database Engine Status</h4>
            </div>
            <button
              onClick={() => setShowHealthModal(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {/* MongoDB Card */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">MongoDB (Persistent)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {health?.databases.mongodb.status}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                <span>Collections:</span>
                <span className="font-mono text-slate-700">
                  {health?.databases.mongodb.collections.users || 0} users,{' '}
                  {health?.databases.mongodb.collections.contests || 0} contests
                </span>
              </div>
            </div>

            {/* Redis Card */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">Redis (Sorted Sets)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {health?.databases.redis.status}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                <span>Latency / Keys:</span>
                <span className="font-mono text-slate-700">
                  {health?.databases.redis.pingLatencyMs || 0.4}ms • {health?.databases.redis.keysCount || 4} keys
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-1">
              VIT-AP CSE3009 NoSQL Databases • Project 5
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="text-sm font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 font-semibold bg-rose-50 rounded-lg"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-medium border border-slate-300 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
