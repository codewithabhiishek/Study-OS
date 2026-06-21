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

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <FocusProvider>
          <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Today />} />
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
        <Analytics />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
