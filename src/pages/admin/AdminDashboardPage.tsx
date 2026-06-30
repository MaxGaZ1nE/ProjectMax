import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@stores/index';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminSellersSection from '@components/admin/AdminSellersSection';
import AdminDeliverySection from '@components/admin/AdminDeliverySection';
import AdminUsersSection from '@components/admin/AdminUsersSection';
import AdminDirectorySection from '@components/admin/AdminDirectorySection';
import AdminProductsSection from '@components/admin/AdminProductsSection';
import Dashboard from './Dashboard';



interface Order {
  id: string;
  status: string;
  checkout?: {
    slipBase64?: string;
    paymentStatus?: string;
    customer_name?: string;
  };
}

interface AuthState {
  auth?: { user?: { role: string } };
  orders?: { orders?: Order[] };
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state: AuthState) => state.auth?.user);
  const ordersState = useAppSelector((state: AuthState) => state.orders);
  
  // ป้องกัน orders เป็น error object
  const orders = useMemo(() => {
    if (!ordersState) return [];
    if (Array.isArray(ordersState?.orders)) return ordersState.orders;
    return [];
  }, [ordersState]);

  // ถ้าไม่ใช่ admin ให้ไป home
  useEffect(() => {
    if (user && user?.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // ✅ NEW: Unified section state
  const [activeSection, setActiveSection] = useState<'dashboard' | 'slips' | 'sellers' | 'delivery' | 'users' | 'directory' | 'products'>('dashboard');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* 🎯 Quick Menu Cards - Always Visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8 sticky top-[73px] z-30 bg-neutral-50 dark:bg-neutral-950 py-4">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`rounded-lg p-4 text-left hover:shadow-lg transition border-2 ${
              activeSection === 'dashboard'
                ? 'bg-emerald-100 dark:bg-emerald-900 border-emerald-400 shadow-md'
                : 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 border-emerald-200 dark:border-emerald-700'
            }`}
          >
            <p className="text-2xl">📈</p>
            <p className={`text-xs font-medium mt-2 ${
              activeSection === 'dashboard' 
                ? 'text-emerald-900 dark:text-emerald-100' 
                : 'text-emerald-900 dark:text-emerald-300'
            }`}>สถิติ (Dashboard)</p>
          </button>
          <button
            onClick={() => setActiveSection('slips')}
            className={`rounded-lg p-4 text-left hover:shadow-lg transition border-2 ${
              activeSection === 'slips'
                ? 'bg-blue-100 dark:bg-blue-900 border-blue-400 shadow-md'
                : 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700'
            }`}
          >
            <p className="text-2xl">📊</p>
            <p className={`text-xs font-medium mt-2 ${
              activeSection === 'slips' 
                ? 'text-blue-900 dark:text-blue-100' 
                : 'text-blue-900 dark:text-blue-300'
            }`}>ตรวจสอบสลิป</p>
          </button>
          <button
            onClick={() => setActiveSection('sellers')}
            className={`rounded-lg p-4 text-left hover:shadow-lg transition border-2 ${
              activeSection === 'sellers'
                ? 'bg-amber-100 dark:bg-amber-900 border-amber-400 shadow-md'
                : 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 border-amber-200 dark:border-amber-700'
            }`}
          >
            <p className="text-2xl">📝</p>
            <p className={`text-xs font-medium mt-2 ${
              activeSection === 'sellers' 
                ? 'text-amber-900 dark:text-amber-100' 
                : 'text-amber-900 dark:text-amber-300'
            }`}>ยืนยันผู้ขาย</p>
          </button>
          <button
            onClick={() => setActiveSection('delivery')}
            className={`rounded-lg p-4 text-left hover:shadow-lg transition border-2 ${
              activeSection === 'delivery'
                ? 'bg-teal-100 dark:bg-teal-900 border-teal-400 shadow-md'
                : 'bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800 border-teal-200 dark:border-teal-700'
            }`}
          >
            <p className="text-2xl">🚚</p>
            <p className={`text-xs font-medium mt-2 ${
              activeSection === 'delivery' 
                ? 'text-teal-900 dark:text-teal-100' 
                : 'text-teal-900 dark:text-teal-300'
            }`}>ยืนยันคนส่ง</p>
          </button>
          <button
            onClick={() => setActiveSection('users')}
            className={`rounded-lg p-4 text-left hover:shadow-lg transition border-2 ${
              activeSection === 'users'
                ? 'bg-purple-100 dark:bg-purple-900 border-purple-400 shadow-md'
                : 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700'
            }`}
          >
            <p className="text-2xl">👥</p>
            <p className={`text-xs font-medium mt-2 ${
              activeSection === 'users' 
                ? 'text-purple-900 dark:text-purple-100' 
                : 'text-purple-900 dark:text-purple-300'
            }`}>จัดการผู้ใช้</p>
          </button>
          <button
            onClick={() => setActiveSection('directory')}
            className={`rounded-lg p-4 text-left hover:shadow-lg transition border-2 ${
              activeSection === 'directory'
                ? 'bg-green-100 dark:bg-green-900 border-green-400 shadow-md'
                : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700'
            }`}
          >
            <p className="text-2xl">🔍</p>
            <p className={`text-xs font-medium mt-2 ${
              activeSection === 'directory' 
                ? 'text-green-900 dark:text-green-100' 
                : 'text-green-900 dark:text-green-300'
            }`}>ค้นหาข้อมูล</p>
          </button>
          <button
            onClick={() => setActiveSection('products')}
            className={`rounded-lg p-4 text-left hover:shadow-lg transition border-2 ${
              activeSection === 'products'
                ? 'bg-orange-100 dark:bg-orange-900 border-orange-400 shadow-md'
                : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700'
            }`}
          >
            <p className="text-2xl">📦</p>
            <p className={`text-xs font-medium mt-2 ${
              activeSection === 'products' 
                ? 'text-orange-900 dark:text-orange-100' 
                : 'text-orange-900 dark:text-orange-300'
            }`}>สินค้า</p>
          </button>
        </div>
        
        {/* 📈 Dashboard Section */}
        {activeSection === 'dashboard' && <Dashboard />}

        {/* 📊 Slips Section */}
        {activeSection === 'slips' && <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-800"><AdminOrdersPage /></div>}

        {/* 📝 Sellers Section */}
        {activeSection === 'sellers' && <AdminSellersSection />}

        {/* 🚚 Delivery Section */}
        {activeSection === 'delivery' && <AdminDeliverySection />}

        {/* 👥 Users Section */}
        {activeSection === 'users' && <AdminUsersSection />}

        {/* 🔍 Directory Section */}
        {activeSection === 'directory' && <AdminDirectorySection />}

        {/* 📦 Products Section */}
        {activeSection === 'products' && <AdminProductsSection />}
      </div>
    </div>
  );
}
