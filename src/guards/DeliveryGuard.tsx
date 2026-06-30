import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@stores/index';

export default function DeliveryGuard({ children }: { children: ReactNode }) {
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (user?.role !== 'delivery') {
    return <Navigate to="/delivery/register" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
