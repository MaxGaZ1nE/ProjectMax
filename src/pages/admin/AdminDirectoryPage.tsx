import { useState } from 'react';
import { useAppSelector } from '@stores/index';
import { adminAPI } from '@services/backend-api';

interface DirectoryItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'seller' | 'admin';
  shopName?: string;
  status?: string;
  createdAt: string;
}

export default function AdminDirectoryPage() {
  const user = useAppSelector((s) => s.auth.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'seller' | 'buyer' | 'shipper'>('all');
  const [results, setResults] = useState<DirectoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('กรุณากรอกคำค้นหา');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      // ค้นหาจาก backend API
      const response = await adminAPI.getUsers(1, 1000, searchQuery);
      let data = (response as any)?.data ?? response;
      if (!Array.isArray(data)) data = [];

      // Filter by role
      if (searchType === 'seller') {
        data = data.filter((u: any) => u.role === 'seller');
      } else if (searchType === 'buyer') {
        data = data.filter((u: any) => u.role === 'customer');
      } else if (searchType === 'shipper') {
        data = data.filter((u: any) => u.role === 'shipper');
      }

      const formatted = data.map((u: any) => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        email: u.email,
        phone: u.phone,
        role: u.role,
        shopName: u.shopName,
        status: u.banned ? 'แบน' : 'ใช้งาน',
        createdAt: u.createdAt,
      }));

      setResults(formatted);
      setHasSearched(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message ?? e?.message ?? 'เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setIsSearching(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      seller: 'bg-blue-100 text-blue-800',
      customer: 'bg-green-100 text-green-800',
      shipper: 'bg-orange-100 text-orange-800',
      admin: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<string, string> = {
      seller: '🏪 ผู้ขาย',
      customer: '👤 ผู้ซื้อ',
      shipper: '🚚 ผู้ขนส่ง',
      admin: '🔐 ผู้ดูแล',
    };
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${styles[role] || 'bg-gray-100'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600">⛔ Access Denied: Admin only</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">🔍 ค้นหาข้อมูล</h1>
        <p className="text-neutral-600 mt-1">ค้นหาข้อมูลร้านค้า ผู้ซื้อ และผู้ขนส่ง</p>
      </div>

      {/* Search Box */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="ค้นหา... (ชื่อ, อีเมล, เบอร์โทร)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="px-4 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-600 text-sm"
          />

          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as any)}
            className="px-4 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-600 text-sm"
          >
            <option value="all">ค้นหาทั้งหมด</option>
            <option value="seller">ผู้ขายเท่านั้น</option>
            <option value="buyer">ผู้ซื้อเท่านั้น</option>
            <option value="shipper">ผู้ขนส่งเท่านั้น</option>
          </select>

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-60 text-sm"
          >
            {isSearching ? 'กำลังค้นหา...' : '🔍 ค้นหา'}
          </button>
        </div>

        {/* Tips */}
        <p className="text-xs text-neutral-500">
          💡 ค้นหาแบบปกติ: กรอกชื่อ อีเมล หรือเบอร์โทร (จะค้นหาบางส่วนของข้อมูล)
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !isSearching && (
        <>
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              พบ <strong>{results.length}</strong> ผลลัพธ์ สำหรับ "<strong>{searchQuery}</strong>"
              {searchType !== 'all' && (
                <>
                  {' '}
                  ({
                    searchType === 'seller'
                      ? 'ผู้ขาย'
                      : searchType === 'buyer'
                        ? 'ผู้ซื้อ'
                        : 'ผู้ขนส่ง'
                  })
                </>
              )}
            </p>
          </div>

          {/* Results Table */}
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">ชื่อ</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">อีเมล</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">เบอร์โทร</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">ประเภท</th>
                    {searchType === 'seller' && (
                      <th className="px-4 py-3 text-left font-semibold text-neutral-700">ชื่อร้าน</th>
                    )}
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">สถานะ</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">ลงทะเบียน</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                      <td className="px-4 py-3 font-medium text-neutral-900">{item.name}</td>
                      <td className="px-4 py-3 text-neutral-600 text-xs break-all">{item.email}</td>
                      <td className="px-4 py-3 text-neutral-600 text-xs">{item.phone || '-'}</td>
                      <td className="px-4 py-3">{getRoleBadge(item.role)}</td>
                      {searchType === 'seller' && (
                        <td className="px-4 py-3 text-neutral-900 font-medium">{item.shopName || '-'}</td>
                      )}
                      <td className="px-4 py-3">
                        {item.status === 'แบน' ? (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ❌ {item.status}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ {item.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 text-xs">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-lg p-8 text-center">
              <p className="text-neutral-600">ไม่พบผลลัพธ์ที่ตรงกับการค้นหา</p>
              <p className="text-xs text-neutral-500 mt-2">ลองค้นหาด้วยคำศัพท์อื่น</p>
            </div>
          )}
        </>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div className="bg-blue-50 border border-dashed border-blue-300 rounded-lg p-12 text-center">
          <p className="text-lg font-medium text-blue-900">🔍 กรอกคำค้นหาและคลิก "ค้นหา"</p>
          <p className="text-sm text-blue-700 mt-2">ค้นหาข้อมูลร้านค้า ผู้ซื้อ หรือผู้ขนส่ง</p>
        </div>
      )}
    </div>
  );
}
