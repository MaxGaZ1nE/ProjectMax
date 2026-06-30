import type { FC } from 'react';

import { useAppSelector } from '@stores/index';
import { useAuth } from '@contexts/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * GuestGuard - Protects routes that should only be accessible to guests
 * Redirects authenticated users to dashboard or return URL
 * 
 * ✅ FIX: ตรวจสอบทั้ง Redux isLoading และ AuthContext loading
 * ป้องกัน redirect ก่อนที่ AuthContext จะ clear stale persist state
 */
const GuestGuard: FC = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { loading: authContextLoading } = useAuth();

  // Show loading while either Redux or AuthContext is still initializing
  if (isLoading || authContextLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to where they came from, or dashboard
    const from = (location.state as { from?: Location })?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};

export default GuestGuard;
