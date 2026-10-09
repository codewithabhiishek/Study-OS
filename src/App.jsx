import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { FocusProvider } from '@/hooks/FocusContext';
import { Analytics } from '@vercel/analytics/react';
import UpdateNotifier from '@/components/updater/UpdateNotifier';

const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Today = lazy(() => import('@/pages/Today'));
const Projects = lazy(() => import('@/pages/Projects'));
const Focus = lazy(() => import('@/pages/Focus'));
const Review = lazy(() => import('@/pages/Review'));
const Calendar = lazy(() => import('@/pages/Calendar'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-8 h-8 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(0,255,135,0.4)]" />
      <div className="font-mono text-xs text-[#00FF87] tracking-widest uppercase">
        INITIALIZING // SYSTEM MEMORY <span className="blink">_</span>
      </div>
    </div>
  );
}

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
            <Suspense fallback={<RouteLoadingFallback />}>
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
            </Suspense>
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
