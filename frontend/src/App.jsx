import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import { LanguageProvider } from './context/LanguageContext';

// Auth & Public Pages
import Login from './pages/Login';
import Home from './pages/Home';

// Lazy loaded protected pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Submit = lazy(() => import('./pages/Submit'));
const OfficerPortal = lazy(() => import('./pages/OfficerPortal'));
const LiveData = lazy(() => import('./pages/LiveData'));
const NotFound = lazy(() => import('./pages/NotFound'));
const IndiaMap = lazy(() => import('./components/IndiaMap'));

// Define ProtectedRoute wrapper
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// VITE_GOOGLE_CLIENT_ID must be set in your `.env` or `.env.local`
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '88655168980-d0rhr17m22r5oe2oa7u9ni9feu6vnj8s.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <LanguageProvider>
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
                  {/* Public Route */}
                  <Route path="/login" element={<Login />} />

                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/submit" element={<Submit />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/officer" element={<OfficerPortal />} />
                  <Route path="/live" element={<LiveData />} />
                  {/* Specific Feature Routes */}
                  <Route path="/map" element={<IndiaMap markers={[]} />} />
                  <Route path="/chat" element={<div>{/* Placeholder for ChatBot.jsx */} <Home /></div>} />

                  {/* Utility Routes */}
                  <Route path="*" element={<Navigate to="/404" replace />} />
                  <Route path="/404" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </LanguageProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;

