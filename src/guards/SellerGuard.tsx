import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@stores/index';

export default function SellerGuard({ children }: { children: ReactNode }) {
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (user?.role !== 'seller' && (!user?.shopId || user.shopId === 0)) {
    return <Navigate to="/seller/register" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}