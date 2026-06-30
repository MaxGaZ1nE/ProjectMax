import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { fetchProducts, approveProduct, rejectProduct, deleteProduct, featuredProduct } from '@slices/admin-products-slice';

export default function AdminProductsPage() {
  const dispatch = useAppDispatch();
  const { products, loading, error, total, page, limit } = useAppSelector((state: any) => state.adminProducts);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [actionModal, setActionModal] = useState<{ open: boolean; action?: string }>({ open: false });
  const [rejectReason, setRejectReason] = useState('');

  // ดึงข้อมูลสินค้า
  useEffect(() => {
    dispatch(
      fetchProducts({
        page,
        limit,
        search: searchQuery,
      }) as any
    );
  }, [dispatch, page, limit, searchQuery]);

  const handleApprove = (productId: string) => {
    dispatch(approveProduct(productId) as any);
    setActionModal({ open: false });
  };

  const handleReject = (productId: string) => {
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }
    dispatch(rejectProduct({ productId, reason: rejectReason }) as any);
    setRejectReason('');
    setActionModal({ open: false });
  };

  const handleDelete = (productId: string) => {
    if (window.confirm('แน่ใจหรือว่าต้องการลบสินค้านี้?')) {
      dispatch(deleteProduct({ productId }) as any);
      setActionModal({ open: false });
    }
  };

  const handleFeatured = (productId: string, featured: boolean) => {
    dispatch(featuredProduct({ productId, featured: !featured }) as any);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">🛍️ จัดการสินค้า</h2>
          <p className="text-sm text-neutral-600 mt-1">ทั้งหมด {total} สินค้า</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
        <input
          type="text"
          placeholder="ค้นหาชื่อสินค้า..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-600"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          ❌ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product: any) => (
              <div key={product.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition">
                {/* Product Image */}
                <div className="h-40 bg-neutral-100 flex items-center justify-center">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-neutral-400">📷 ไม่มีรูป</span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-medium text-neutral-900 truncate">{product.name}</h3>
                  <p className="text-sm text-neutral-600">ราคา: ฿{product.price?.toLocaleString()}</p>
                  <p className="text-sm text-neutral-600">คลัง: {product.stock} ชิ้น</p>

                  {/* Status Badge */}
                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        product.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {product.status === 'approved'
                        ? '✅ อนุมัติแล้ว'
                        : product.status === 'rejected'
                          ? '❌ ปฏิเสธ'
                          : '⏳ รอพิจารณา'}
                    </span>
                    {product.featured && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-800">
                        ⭐ Featured
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setActionModal({ open: true });
                      }}
                      className="w-full px-3 py-2 bg-primary-50 border border-primary-200 text-primary-600 rounded text-sm font-medium hover:bg-primary-100"
                    >
                      ⚙️ จัดการ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4">
              <span className="text-sm text-neutral-600">
                หน้า {page} จาก {totalPages}
              </span>
              <div className="flex gap-2">
                <button disabled className="px-3 py-1 rounded border border-neutral-300 text-sm disabled:opacity-50">
                  ← ก่อนหน้า
                </button>
                <button disabled className="px-3 py-1 rounded border border-neutral-300 text-sm disabled:opacity-50">
                  ถัดไป →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600">ไม่พบสินค้า</p>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.open && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-neutral-900">{selectedProduct.name}</h3>

            {selectedProduct.status === 'pending' && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  💡 สินค้านี้รอการพิจารณาจากแอดมิน
                </div>

                <button
                  onClick={() => handleApprove(selectedProduct.id)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium text-sm hover:bg-green-700"
                >
                  ✅ อนุมัติ
                </button>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">ปฏิเสธสินค้า:</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="เหตุผลในการปฏิเสธ..."
                    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                    rows={3}
                  />
                  <button
                    onClick={() => handleReject(selectedProduct.id)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded font-medium text-sm hover:bg-red-700"
                  >
                    ❌ ปฏิเสธ
                  </button>
                </div>
              </>
            )}

            {selectedProduct.status === 'approved' && (
              <>
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                  ✅ สินค้าได้รับการอนุมัติแล้ว
                </div>

                <button
                  onClick={() => handleFeatured(selectedProduct.id, selectedProduct.featured)}
                  className={`w-full px-4 py-2 rounded font-medium text-sm ${
                    selectedProduct.featured
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  {selectedProduct.featured ? '⭐ เอาออกจาก Featured' : '⭐ ทำให้เป็น Featured'}
                </button>
              </>
            )}

            <button
              onClick={() => handleDelete(selectedProduct.id)}
              className="w-full px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded font-medium text-sm hover:bg-red-100"
            >
              🗑️ ลบสินค้า
            </button>

            <button
              onClick={() => setActionModal({ open: false })}
              className="w-full px-4 py-2 bg-neutral-100 text-neutral-900 rounded font-medium text-sm hover:bg-neutral-200"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
