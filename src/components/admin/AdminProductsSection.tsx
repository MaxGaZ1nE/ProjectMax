import { useEffect, useState } from 'react';
import { adminAPI } from '@services/backend-api';

const inputClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none transition ' +
  'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:border-primary-500 dark:focus:ring-primary-900';

interface Product {
  id: number;
  name: string;
  category: string;
  seller: string;
  shopId?: number;
  price: number;
  stock: number;
  unit?: string;
  status: 'active' | 'inactive';
  images?: string[];
  createdAt: string;
}

export default function AdminProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterStatus, page]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await (adminAPI as any).getAdminProducts(page, 20, searchQuery, filterStatus === 'all' ? '' : filterStatus);
      const data = (response as any)?.data?.data ?? (response as any)?.data ?? [];
      const meta = (response as any)?.data?.meta ?? {};
      setProducts(Array.isArray(data) ? data : []);
      setTotalPages(meta.totalPages ?? 1);
      setTotal(meta.total ?? data.length);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('ไม่สามารถโหลดข้อมูลสินค้าได้');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (productId: number) => {
    setActionLoading(productId);
    try {
      await (adminAPI as any).toggleProductStatus(productId);
      await loadProducts();
    } catch (err) {
      console.error('Error toggling product status:', err);
      alert('ไม่สามารถเปลี่ยนสถานะสินค้าได้');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`ลบสินค้า "${productName}" ใช่ไหม?`)) return;
    setActionLoading(productId);
    try {
      await (adminAPI as any).deleteAdminProduct(productId);
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('ไม่สามารถลบสินค้าได้');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return (
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-10 h-10 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
        />
      );
    }
    return <span className="text-2xl">📦</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">📦 จัดการสินค้า</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">ดูและจัดการสินค้าทั้งหมดในระบบ ({total} รายการ)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
              ค้นหา (ชื่อสินค้า, ชื่อร้านค้า)
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="พิมพ์เพื่อค้นหา..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
              สถานะ
            </label>
            <select
              className={inputClass}
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">🟢 เปิดขาย</option>
              <option value="inactive">⚫ ปิดขาย</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
              หน้า {page}/{totalPages}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm font-medium disabled:opacity-50"
              >
                ← ก่อนหน้า
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm font-medium disabled:opacity-50"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics - from current page data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">รวมสินค้า</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{total}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">เปิดขาย (หน้านี้)</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {products.filter(p => p.status === 'active').length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">ปิดขาย (หน้านี้)</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {products.filter(p => p.status === 'inactive').length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">สินค้าหมด (หน้านี้)</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {products.filter(p => p.stock === 0).length}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">❌ {error}</p>
          <button
            onClick={loadProducts}
            className="mt-2 text-xs text-red-700 dark:text-red-300 underline"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">กำลังโหลดสินค้า...</p>
        </div>
      )}

      {/* Products Table */}
      {!loading && products.length === 0 && !error && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">ไม่พบสินค้า</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">สินค้า</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">หมวดหมู่</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">ร้านค้า</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">ราคา</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">สต็อก</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">สถานะ</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900 dark:text-neutral-100">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getProductImage(product)}
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">ID: {product.id} • {formatDate(product.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{product.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{product.seller}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(product.price)}</p>
                      {product.unit && <p className="text-xs text-neutral-500 dark:text-neutral-400">/{product.unit}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        product.stock > 0
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                          : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                      }`}>
                        {product.stock} {product.unit || ''}{product.stock === 0 ? ' (หมด)' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        product.status === 'active'
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {product.status === 'active' ? '🟢 เปิดขาย' : '⚫ ปิดขาย'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-center flex-wrap">
                        <button
                          onClick={() => handleToggleStatus(product.id)}
                          disabled={actionLoading === product.id}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition disabled:opacity-50 ${
                            product.status === 'active'
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                          title={product.status === 'active' ? 'ปิดขาย' : 'เปิดขาย'}
                        >
                          {actionLoading === product.id ? '...' : product.status === 'active' ? 'ปิดขาย' : 'เปิดขาย'}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          disabled={actionLoading === product.id}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                          title="ลบสินค้า"
                        >
                          ลบ
                        </button>
                      </div>
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
