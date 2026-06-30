import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { fetchDashboardSummary, fetchOrders, fetchTopProducts, fetchTopSellers, fetchTimeline } from '@slices/admin-analytics-slice';

export default function AdminOrdersAnalyticsPage() {
  const dispatch = useAppDispatch();
  const { summary, orders, topProducts, topSellers, loading, error } = useAppSelector((state: any) => state.adminAnalytics);

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // ดึงข้อมูล analytics
  useEffect(() => {
    dispatch(fetchDashboardSummary() as any);
    dispatch(fetchOrders({ page: 1, limit: 10 }) as any);
    dispatch(fetchTopProducts(5) as any);
    dispatch(fetchTopSellers(5) as any);
    dispatch(fetchTimeline({ period, limit: 30 }) as any);
  }, [dispatch, period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">📊 วิเคราะห์ข้อมูล</h2>
          <p className="text-sm text-neutral-600 mt-1">ข้อมูลการขายและคำสั่งซื้อ</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          ❌ {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-2">
          <p className="text-sm text-neutral-600">📦 คำสั่งซื้อทั้งหมด</p>
          <p className="text-3xl font-bold text-neutral-900">{summary?.totalOrders?.toLocaleString() || 0}</p>
          <p className="text-xs text-neutral-500">ออเดอร์</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-2">
          <p className="text-sm text-neutral-600">💰 รายได้ทั้งหมด</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(summary?.totalRevenue || 0)}</p>
          <p className="text-xs text-neutral-500">บาท</p>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-2">
          <p className="text-sm text-neutral-600">👥 ผู้ใช้ทั้งหมด</p>
          <p className="text-3xl font-bold text-blue-600">{summary?.totalUsers?.toLocaleString() || 0}</p>
          <p className="text-xs text-neutral-500">คน</p>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-2">
          <p className="text-sm text-neutral-600">🛍️ สินค้าทั้งหมด</p>
          <p className="text-3xl font-bold text-purple-600">{summary?.totalProducts?.toLocaleString() || 0}</p>
          <p className="text-xs text-neutral-500">รายการ</p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-neutral-900">รูป แบบข้อมูล:</p>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded text-sm font-medium transition ${
                  period === p
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {p === 'daily' ? '📅 รายวัน' : p === 'weekly' ? '📊 รายสัปดาห์' : '📈 รายเดือน'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-900">🏆 สินค้าขายดี</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : topProducts?.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((product: any, idx: number) => (
              <div key={product.id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">#{idx + 1}</div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{product.name}</p>
                  <p className="text-sm text-neutral-600">ขายแล้ว {product.sales} ชิ้น</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">{formatCurrency(product.revenue || 0)}</p>
                  <p className="text-xs text-neutral-500">รายได้</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-600 text-center py-8">ไม่มีข้อมูล</p>
        )}
      </div>

      {/* Top Sellers */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-900">🌟 ผู้ขายขายดี</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : topSellers?.length > 0 ? (
          <div className="space-y-3">
            {topSellers.map((seller: any, idx: number) => (
              <div key={seller.id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">#{idx + 1}</div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{seller.name}</p>
                  <p className="text-sm text-neutral-600">{seller.orderCount} ออเดอร์</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">{formatCurrency(seller.revenue || 0)}</p>
                  <p className="text-xs text-neutral-500">รายได้</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-600 text-center py-8">ไม่มีข้อมูล</p>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-900">📋 คำสั่งซื้อล่าสุด</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : orders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-700">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-700">ลูกค้า</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-700">ผู้ขาย</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-700">ราคา</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-700">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-neutral-600">{order.customerName}</td>
                    <td className="px-4 py-3 text-neutral-600">{order.sellerName}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{formatCurrency(order.total || 0)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'in_delivery'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status === 'delivered'
                          ? '✅ ส่งสำเร็จ'
                          : order.status === 'in_delivery'
                            ? '📦 กำลังส่ง'
                            : '⏳ รอจัดส่ง'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-neutral-600 text-center py-8">ไม่มีข้อมูล</p>
        )}
      </div>
    </div>
  );
}
