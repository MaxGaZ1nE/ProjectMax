import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { fetchSellerStats, fetchSellerOrders, clearError } from '@slices/seller-slice';
import { useOrderStatusStream } from '@/hooks/useOrderStatusStream';

export default function SellerSalesPage() {
  const dispatch = useAppDispatch();
  const stats = useAppSelector((s) => s.seller.stats);
  const orders = useAppSelector((s) => s.seller.orders);
  const loading = useAppSelector((s) => s.seller.loading);
  const error = useAppSelector((s) => s.seller.error);

  useEffect(() => {
    dispatch(fetchSellerStats());
    dispatch(fetchSellerOrders());

    const interval = setInterval(() => {
      dispatch(fetchSellerOrders());
    }, 15000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // ✅ SSE: ส่วนผู้ขายเห็นสถานะทันทีเมื่อ Admin approve หรือ Courier เปลี่ยนสถานะ
  useOrderStatusStream(() => {
    dispatch(fetchSellerOrders());
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  // Calculate stats from orders
  // ✅ Only PromptPay is available (COD removed), so check for 'verified' payment status
  const paidOrders = orders.filter(
    (o) => o.paymentStatus === 'verified'
  );
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Calculate history orders (only completed/delivered/cancelled)
  const historyOrders = orders
    .filter((o) => o.status === 'completed' || o.status === 'delivered' || o.status === 'cancelled')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statsCards = [
    {
      label: 'ยอดขายรวม',
      value: formatCurrency(stats?.totalRevenue || totalRevenue),
      icon: '💰',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'จำนวนออเดอร์',
      value: stats?.totalOrders || orders.length,
      icon: '📦',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'ค่าเฉลี่ยต่อออเดอร์',
      value: formatCurrency(avgOrderValue),
      icon: '📊',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'จำนวนผู้ติดตาม',
      value: stats?.followers || 0,
      icon: '👥',
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  const statusGroups = [
    {
      label: 'รอตรวจสอบ/รอรับงาน',
      count: orders.filter((o) => o.status === 'pending_payment' || o.status === 'confirmed' || o.status === 'waiting_driver').length,
      icon: '⏳',
    },
    {
      label: 'กำลังเข้ารับ/จัดส่ง',
      count: orders.filter((o) => o.status === 'picking_up' || o.status === 'in_delivery' || o.status === 'shipped').length,
      icon: '🚚',
    },
    {
      label: 'ส่งสำเร็จ/ยกเลิก',
      count: historyOrders.length,
      icon: '✅',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">สรุปยอดขาย</h1>
        <p className="text-sm text-neutral-600 mt-1">
          ข้อมูลรายได้และสถิติประจำวัน
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => dispatch(clearError())}
          >
            ปิด
          </button>
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"></div>
            <p className="text-neutral-600">กำลังโหลด...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((card, idx) => (
              <div key={idx} className={`card p-6 ${card.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-opacity-80">{card.label}</p>
                    <p className="text-2xl font-bold mt-2">{card.value}</p>
                  </div>
                  <span className="text-3xl">{card.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Status Overview */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">สถานะออเดอร์</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {statusGroups.map((group, idx) => (
                <div key={idx} className="border border-neutral-200 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-2">{group.icon}</p>
                  <p className="text-2xl font-bold text-neutral-900">{group.count}</p>
                  <p className="text-sm text-neutral-600 mt-1">{group.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Table */}
          {historyOrders.length > 0 && (
            <div className="card p-0 overflow-auto">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">ประวัติการขาย (สำเร็จแล้ว)</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-6 py-3 text-left font-semibold text-neutral-900">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-neutral-900">
                        ลูกค้า
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-neutral-900">
                        ยอด
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-neutral-900">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-neutral-900">
                        วันที่
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyOrders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                        <td className="px-6 py-3 font-mono text-xs text-neutral-600">
                          {order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-3 text-neutral-900">{order.customerName}</td>
                        <td className="px-6 py-3 text-right font-semibold text-neutral-900">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'delivered'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.status === 'completed'
                              ? 'เสร็จสิ้น'
                              : order.status === 'delivered'
                                ? 'ส่งสำเร็จ'
                                : order.status === 'cancelled'
                                  ? 'ยกเลิกแล้ว'
                                  : order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-neutral-600 text-xs">
                          {new Date(order.createdAt).toLocaleDateString('th-TH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {historyOrders.length > 10 && (
                <div className="px-6 py-3 border-t border-neutral-200 text-center text-sm text-neutral-600">
                  แสดง 10 จาก {historyOrders.length} ออเดอร์
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {historyOrders.length === 0 && !loading && (
            <div className="card p-8 text-center">
              <p className="text-neutral-600">ยังไม่มีประวัติการขายที่สำเร็จ</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}