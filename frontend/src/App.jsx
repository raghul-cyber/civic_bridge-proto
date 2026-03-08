import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import { cn } from './lib/utils';

// Lazy load pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

// Lazy load less frequent or heavier pages
const Submit = lazy(() => import('./pages/Submit'));
const OfficerPortal = lazy(() => import('./pages/OfficerPortal'));
const LiveData = lazy(() => import('./pages/LiveData'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[var(--bg-base)] selection:bg-[var(--accent-cyan)]/20 selection:text-[var(--accent-cyan)]">
        {/* Global Visual Effects */}
        <div className="grain-overlay" />
        <div className="gradient-mesh">
          <div className="blob w-[500px] h-[500px] bg-[var(--accent-cyan)] -top-24 -left-24" />
          <div className="blob w-[300px] h-[300px] bg-[var(--accent-gold)] -bottom-24 -right-24" />
          <div className="blob w-[400px] h-[400px] bg-purple-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <Navbar />

        <main className="pt-16">
          <Suspense fallback={<LoadingSpinner fullPage />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/submit" element={<Submit />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/officer" element={<OfficerPortal />} />
              <Route path="/live" element={<LiveData />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
              <Route path="/404" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        {/* Footer could go here if global */}
      </div>
    </Router>
  );
}

export default App;
