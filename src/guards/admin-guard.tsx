import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@stores/index';

type AdminGuardProps = {
  children: React.ReactNode;
};

/**
 * Admin Guard - ป้องกันการเข้าหน้า Admin
 * เฉพาะ Admin เท่านั้นที่สามารถเข้าได้
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const auth = useAppSelector((state) => (state as any).auth);
  const user = auth?.user;
  const token = auth?.token;

  // ถ้ายังไม่ login ให้ไปหน้า admin login
  if (!token || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // ถ้าไม่ใช่ admin ให้ไปหน้า home
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // ถ้าเป็น admin ให้ render children
  return <>{children}</>;
}

export default AdminGuard;

