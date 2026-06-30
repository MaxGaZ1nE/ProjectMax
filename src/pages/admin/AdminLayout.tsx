import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@theme/index';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const adminMenus = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: 'Verify Slips', path: '/admin/orders', icon: '💳' },
    { label: 'Seller Approvals', path: '/admin/sellers/pending', icon: '📝' },
    { label: 'Delivery Approvals', path: '/admin/delivery/pending', icon: '🚚' },
    { label: 'Users', path: '/admin/users', icon: '👥' },
    { label: 'Directory', path: '/admin/directory', icon: '🔍' },
    { label: 'Products', path: '/admin/products', icon: '🛍️' },
    { label: 'Analytics', path: '/admin/analytics', icon: '📈' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login', { replace: true });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#1a6e40]/20 bg-[#1a6e40] backdrop-blur-md dark:border-neutral-800 dark:bg-bg-dark/95 text-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-2xl font-bold tracking-wide">🔐 Admin Panel</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 text-sm font-medium transition whitespace-nowrap"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
