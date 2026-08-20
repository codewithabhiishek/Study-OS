import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import Today from '@/pages/Today';
import Projects from '@/pages/Projects';

import Focus from '@/pages/Focus';
import Review from '@/pages/Review';
import Calendar from '@/pages/Calendar';
import { FocusProvider } from '@/hooks/FocusContext';
import { Analytics } from '@vercel/analytics/react';
import UpdateNotifier from '@/components/updater/UpdateNotifier';

import Landing from '@/pages/Landing';

function App() {
  // Auto-reload PWA on new deployments when running in standalone or browser mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let initialETag = null;

    const checkAppVersion = async () => {
      try {
        const res = await fetch(`/?_v=${Date.now()}`, { cache: 'no-store', method: 'HEAD' });
        const etag = res.headers.get('etag') || res.headers.get('last-modified');
        if (etag) {
          if (initialETag && initialETag !== etag) {
            console.log('[PWA Auto-Update] New version detected! Auto-reloading web app...');
            window.location.reload();
          } else {
            initialETag = etag;
          }
        }
      } catch (err) {
        // Ignore network check errors
        void err;
      }
    };

    checkAppVersion();
    const interval = setInterval(() => {
      if (!document.hidden) checkAppVersion();
    }, 30000);

    const handleVisibilityChange = () => {
      if (!document.hidden) checkAppVersion();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <FocusProvider>
          <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route element={<AppLayout />}>
                <Route path="/today" element={<Today />} />
                <Route path="/app" element={<Navigate to="/today" replace />} />
                <Route path="/projects" element={<Projects />} />

                <Route path="/focus" element={<Focus />} />
                <Route path="/review" element={<Review />} />
                <Route path="/calendar" element={<Calendar />} />
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        </FocusProvider>
        <Toaster />
        <UpdateNotifier />
        <Analytics />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
