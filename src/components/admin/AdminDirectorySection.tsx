import { useState, useEffect } from 'react';
import { adminAPI } from '@services/backend-api';

const inputClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none transition ' +
  'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:border-primary-500 dark:focus:ring-primary-900';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  shopName?: string;
  status?: string;
  createdAt?: string;
}

export default function AdminDirectorySection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userType, setUserType] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, userType]);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !userType) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await adminAPI.getUsers(1, 1000, searchQuery, userType);
      const data = (response as any)?.data?.data ?? (response as any)?.data?.users ?? [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error searching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'seller':
        return '🏪';
      case 'customer':
        return '👤';
      case 'shipper':
        return '🚚';
      case 'admin':
        return '👨‍💼';
      default:
        return '👥';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'seller':
        return 'ผู้ขาย';
      case 'customer':
        return 'ผู้ซื้อ';
      case 'shipper':
        return 'ผู้ขนส่ง';
      case 'admin':
        return 'ผู้ดูแลระบบ';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'seller':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      case 'customer':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case 'shipper':
        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200';
      case 'admin':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      default:
        return 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">🔍 ค้นหาข้อมูลผู้ใช้</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">ค้นหาผู้ใช้ตามประเภทและข้อมูลส่วนบุคคล</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
              ค้นหา (ชื่อ, อีเมล, เบอร์โทร)
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="พิมพ์เพื่อค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
              ประเภทผู้ใช้
            </label>
            <select
              className={inputClass}
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              <option value="seller">🏪 ผู้ขาย</option>
              <option value="customer">👤 ผู้ซื้อ</option>
              <option value="shipper">🚚 ผู้ขนส่ง</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
              ผลการค้นหา
            </label>
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {users.length}
            </div>
          </div>
        </div>
      </div>

      {/* Initial State */}
      {!hasSearched && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
          <p className="text-sm text-blue-900 dark:text-blue-200">💡 พิมพ์ชื่อ อีเมล หรือเบอร์โทรเพื่อค้นหาผู้ใช้</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">กำลังค้นหา...</p>
        </div>
      )}

      {/* No Results */}
      {hasSearched && !loading && users.length === 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">ไม่พบผู้ใช้ที่ตรงกับการค้นหา</p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && users.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">ชื่อ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">อีเมล</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">เบอร์โทร</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">ประเภท</th>
                  {userType === 'seller' && (
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">ชื่อร้านค้า</th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">สถานะ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">วันที่ลงทะเบียน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{user.name || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{user.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)} {getRoleLabel(user.role)}
                      </span>
                    </td>
                    {userType === 'seller' && (
                      <td className="px-4 py-3">
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{user.shopName || '-'}</p>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        user.status === 'banned' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                      }`}>
                        {user.status === 'banned' ? '🔒 แบน' : '✅ เปิดใช้'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{formatDate(user.createdAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
