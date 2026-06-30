import type { FC } from 'react';

import { useAppSelector } from '@stores/index';
import { useAuth } from '@contexts/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * AuthGuard - Protects routes that require authentication
 * Redirects to login page if user is not authenticated
 * 
 * ✅ FIX: ตรวจสอบทั้ง Redux isLoading และ AuthContext loading
 * เพื่อป้องกัน redirect ก่อนที่ auth state จะ initialize เสร็จ
 */
const AuthGuard: FC = () => {
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

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default AuthGuard;
