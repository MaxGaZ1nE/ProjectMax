import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { pushNotification } from '@/slices/notification-slice';
import { orderAPI } from '@/services/backend-api';
import ReviewModal from '@/components/reviews/ReviewModal';
import PODViewModal from '@/components/delivery/PODViewModal';
import type { OrderStatus, Order, OrderItem } from '@/slices/order-slice';

type ReviewTarget = { orderId: string; shopId: number; item: OrderItem };

// ✅ ต้องตรงกับใน ReviewModal
function makeProductKey(item: OrderItem): string {
  const sellerProductId = (item as any)?.sellerProductId as string | undefined;
  if (sellerProductId && String(sellerProductId).trim()) {
    return `seller:${String(sellerProductId)}`;
  }
  return `base:${Number((item as any).id)}`;
}

const STATUS_TABS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'ทั้งหมด' },
  { value: 'unpaid',    label: 'รอชำระ' },
  { value: 'waiting_driver',   label: 'รอจัดส่ง' },
  { value: 'in_delivery',  label: 'กำลังจัดส่ง' },
  { value: 'delivered', label: 'ส่งสำเร็จ' },
  { value: 'canceled',  label: 'ยกเลิก' },
];

const statusLabel: Record<string, string> = {
  unpaid:    'รอชำระเงิน',
  paid:      'ชำระแล้ว',
  waiting_driver:   'รอจัดส่ง',
  in_delivery:  'กำลังจัดส่ง',
  delivered: 'ส่งสำเร็จ',
  claim:     'แจ้งปัญหา',
  canceled:  'ยกเลิก',
};

const statusColor: Record<string, string> = {
  unpaid:    'bg-yellow-100 text-yellow-700',
  paid:      'bg-blue-100 text-blue-700',
  waiting_driver:   'bg-blue-100 text-blue-700',
  in_delivery:  'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  claim:     'bg-orange-100 text-orange-700',
  canceled:  'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const reviewed = useAppSelector((s: any) => s.reviews?.reviewed ?? [] as string[]);
  
  // ✅ State for orders from API
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<OrderStatus | 'all'>('all');
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  // POD modal state
  const [podModalOrder, setPodModalOrder] = useState<Order | null>(null);

  // ✅ Fetch orders from Backend on mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await orderAPI.getOrders();
        // orderService.getUserOrders returns normalized array in data.data
        const raw = response.data?.data || response.data || [];
        setAllOrders(Array.isArray(raw) ? raw : []);
      } catch (err: any) {
        console.error('Failed to fetch orders:', err);
        setError(err?.response?.data?.error || err.message || 'ไม่สามารถโหลดคำสั่งซื้อได้');
        setAllOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filtered = useMemo(
    () => tab === 'all' ? allOrders : allOrders.filter((o) => o.status === tab),
    [allOrders, tab]
  );

  // ✅ ยืนยันรับสินค้า → optimistic update
  const handleConfirmDelivered = async (orderId: string) => {
    // optimistic update ก่อน
    setAllOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, status: 'delivered' as OrderStatus } : o)
    );
    dispatch(
      pushNotification({
        type: 'system',
        title: '📦 ได้รับสินค้าแล้ว!',
        message: 'กรุณารีวิวสินค้าเพื่อช่วยผู้ซื้อรายอื่นด้วยนะครับ ⭐',
      })
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-neutral-900">คำสั่งซื้อของฉัน</h1>
          <p className="text-sm text-neutral-500 mt-0.5">รายการทั้งหมด {allOrders.length} รายการ</p>
        </div>

        {/* ✅ Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-neutral-500">กำลังโหลด...</p>
          </div>
        )}

        {/* ✅ Error State */}
        {error && !loading && (
          <div className="card bg-red-50 border border-red-200 text-red-700 p-4 mb-4">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {/* Tabs - hidden if loading */}
        {!loading && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {STATUS_TABS.map((t) => {
              const count = t.value === 'all'
                ? allOrders.length
                : allOrders.filter((o) => o.status === t.value).length;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={[
                    'flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition',
                    tab === t.value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50',
                  ].join(' ')}
                >
                  {t.label}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* List */}
        {!loading && (
          filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-neutral-400 text-sm">ไม่มีคำสั่งซื้อในหมวดนี้</p>
              <Link to="/" className="btn btn-primary mt-4 text-sm inline-block">เริ่มช้อปปิ้ง</Link>
            </div>
          ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <div key={o.id} className="card p-0 overflow-hidden">

                {/* Top */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
                  <div>
                    <div className="text-xs font-medium text-neutral-700">{o.shopName}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{o.id}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[o.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                    {statusLabel[o.status] ?? o.status}
                  </span>
                </div>

                {/* Items — แสดงทุก item พร้อมปุ่มรีวิว */}
                <div className="px-4 py-3 bg-white divide-y divide-neutral-100">
                  {o.items.map((item) => {
                    const productKey = makeProductKey(item);
                    const reviewKey = `${o.id}_${productKey}`;
                    const alreadyReviewed = reviewed.includes(reviewKey);

                    return (
                      <div key={`${item.id}-${item.weight}`} className="flex items-center justify-between gap-3 py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image ?? '/no-image.png'}
                            alt={item.name}
                            className="h-12 w-12 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-neutral-700 truncate">{item.name} × {item.qty}</p>
                            <p className="text-xs text-neutral-400">{item.weight} {item.unit}</p>
                          </div>
                        </div>

                        {/* ✅ ปุ่มรีวิว เฉพาะ delivered */}
                        {o.status === 'delivered' && (
                          <div className="flex-shrink-0">
                            {alreadyReviewed ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                                ✓ รีวิวแล้ว
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setReviewTarget({ orderId: o.id, shopId: o.shopId, item })}
                                className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full font-medium transition"
                              >
                                ⭐ รีวิว
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-200 bg-neutral-50">
                  <div className="text-sm">
                    <span className="text-neutral-500 text-xs">ยอดรวม </span>
                    <span className="font-semibold text-neutral-900">฿{Number(o.grandTotal).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      {new Date(o.createdAt).toLocaleDateString('th-TH', {
                        day: 'numeric', month: 'short', year: '2-digit',
                      })}
                    </span>

                    {/* ✅ POD Badge & View Button */}
                    {o.status === 'delivered' && o.confirmedAt && (
                      <>
                        <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1 border border-green-200">
                          ✅ เซ็นรับแล้ว
                        </span>
                        <button
                          type="button"
                          onClick={() => setPodModalOrder(o)}
                          className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-full font-medium transition"
                        >
                          📸 ดูหลักฐาน
                        </button>
                      </>
                    )}

                    {/* ✅ ปุ่มยืนยันรับสินค้า เมื่อ shipping */}
                    {o.status === 'in_delivery' && (
                      <button
                        type="button"
                        onClick={() => handleConfirmDelivered(o.id)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full font-medium transition"
                      >
                        ✅ ได้รับสินค้าแล้ว
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
          )
        )}

      </div>

      {/* ✅ Review Modal */}
      {reviewTarget && (
        <ReviewModal
          orderId={reviewTarget.orderId}
          shopId={reviewTarget.shopId}
          item={reviewTarget.item}
          onClose={() => setReviewTarget(null)}
        />
      )}

      {/* ✅ POD View Modal */}
      <PODViewModal
        isOpen={podModalOrder !== null}
        signatureImage={podModalOrder?.signatureImage}
        deliveryPhoto={podModalOrder?.deliveryPhoto}
        confirmedAt={podModalOrder?.confirmedAt}
        confirmedBy={podModalOrder?.confirmedBy}
        onClose={() => setPodModalOrder(null)}
      />
    </div>
  );
}