import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';

import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { ContestsPage } from './pages/ContestsPage.js';
import { PerformancePage } from './pages/PerformancePage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { DatabaseDemoPage } from './pages/DatabaseDemoPage.js';
import { AdminPage } from './pages/AdminPage.js';

// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-xs text-slate-400">Loading Rankerz...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-xs text-slate-400">Loading Rankerz...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/leaderboard" replace />;
  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/contests" element={<ContestsPage />} />
                <Route
                  path="/performance"
                  element={
                    <ProtectedRoute>
                      <PerformancePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/database-demo" element={<DatabaseDemoPage />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
