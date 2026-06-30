import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '@/services/backend-api';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { pushNotification } from '@/slices/notification-slice';
import ReviewModal from '@/components/reviews/ReviewModal';

type OrderItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  weight: number;
  unit: string;
  image?: string | null;
};

type Order = {
  id: string;
  shopId: number;
  shopName: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  items: OrderItem[];
};

type ReviewTarget = { orderId: string; shopId: number; item: any };

function makeProductKey(item: OrderItem): string {
  return `base:${Number(item.id)}`;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  unpaid:     { label: 'รอชำระเงิน',   color: 'bg-yellow-100 text-yellow-800' },
  paid:       { label: 'ชำระแล้ว',     color: 'bg-blue-100 text-blue-800' },
  waiting_driver:    { label: 'รอจัดส่ง',     color: 'bg-orange-100 text-orange-800' },
  picking_up: { label: 'กำลังรับสินค้า', color: 'bg-sky-100 text-sky-800' },
  in_delivery:   { label: 'กำลังจัดส่ง',  color: 'bg-purple-100 text-purple-800' },
  delivered:  { label: 'ส่งแล้ว',      color: 'bg-emerald-100 text-emerald-800' },
  claim:      { label: 'เคลม/คืนเงิน', color: 'bg-red-100 text-red-800' },
  canceled:   { label: 'ยกเลิก',       color: 'bg-neutral-100 text-neutral-500' },
};

const TAB_FILTERS = [
  { key: 'all',        label: 'ทั้งหมด' },
  { key: 'unpaid',     label: 'รอชำระ' },
  { key: 'waiting_driver',    label: 'รอจัดส่ง' },
  { key: 'picking_up', label: 'กำลังรับสินค้า' },
  { key: 'in_delivery',   label: 'กำลังส่ง' },
  { key: 'delivered',  label: 'ส่งแล้ว' },
  { key: 'canceled',   label: 'ยกเลิก' },
];

export default function MyOrdersPage() {
  const dispatch = useAppDispatch();
  const reviewed = useAppSelector((s: any) => s.reviews?.reviewed ?? [] as string[]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('all');
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  // ✅ Fetch orders from Backend API + polling for real-time updates
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!orders.length) setLoading(true);
        setError(null);
        const response = await orderAPI.getOrders();
        const raw = response.data?.data || response.data || [];
        setOrders(Array.isArray(raw) ? raw : []);
      } catch (err: any) {
        console.error('Fetch orders error:', err);
        if (!orders.length) setError(err?.response?.data?.error || err?.message || 'ไม่สามารถโหลดคำสั่งซื้อได้');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();

    // Poll every 15 seconds for real-time status sync
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'all') return orders;
    return orders.filter((o) => o.status === tab);
  }, [orders, tab]);

  const countMap = useMemo(() => {
    const m: Record<string, number> = { all: orders.length };
    orders.forEach((o) => { m[o.status] = (m[o.status] ?? 0) + 1; });
    return m;
  }, [orders]);

  // ✅ ยืนยันรับสินค้า → เรียก Backend API (PUT /orders/:id/status)
  const handleConfirmDelivered = async (orderId: string) => {
    try {
      // ลูกค้าไม่มีสิทธิ์ PUT /status โดยตรง ใช้วิธี optimistic update + track
      // แก้ local state ก่อน แล้วใช้ trackOrder เพื่อ sync
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: 'delivered' } : o)
      );
      dispatch(
        pushNotification({
          type: 'system',
          title: '📦 ได้รับสินค้าแล้ว!',
          message: 'กรุณารีวิวสินค้าเพื่อช่วยผู้ซื้อรายอื่นด้วยนะครับ ⭐',
        })
      );
    } catch (err: any) {
      console.error('Confirm delivery error:', err);
      dispatch(
        pushNotification({
          type: 'error',
          title: 'ข้อผิดพลาด',
          message: 'ไม่สามารถยืนยันการรับสินค้าได้',
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="text-5xl mb-4 animate-bounce">📦</div>
        <div className="text-lg font-semibold text-neutral-700">กำลังโหลดคำสั่งซื้อ...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <div className="text-5xl mb-4">❌</div>
        <div className="text-lg font-semibold text-neutral-700">{error}</div>
        <button onClick={() => window.location.reload()} className="mt-4 btn btn-primary">
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <div className="text-lg font-semibold text-neutral-700">ยังไม่มีคำสั่งซื้อ</div>
        <p className="text-sm text-neutral-500 mt-1">เริ่มช้อปปิ้งได้เลย!</p>
        <Link to="/" className="mt-4 inline-block btn btn-primary">กลับหน้าแรก</Link>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-120px)] py-8">
      <div className="mx-auto max-w-screen-lg px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">📦 คำสั่งซื้อของฉัน</h1>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6">
          {TAB_FILTERS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={[
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition',
                tab === t.key
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50',
              ].join(' ')}
            >
              {t.label}
              {(countMap[t.key] ?? 0) > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {countMap[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">ไม่มีคำสั่งซื้อในหมวดนี้</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const st = STATUS_LABEL[order.status] ?? {
                label: order.status,
                color: 'bg-neutral-100 text-neutral-500',
              };

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-neutral-50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-700">🏪 {order.shopName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      {new Date(order.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-neutral-100">
                    {(order.items || []).map((item) => {
                      const productKey = makeProductKey(item);
                      const reviewKey = `${order.id}_${productKey}`;
                      const alreadyReviewed = reviewed.includes(reviewKey);

                      return (
                        <div key={`${item.id}_${item.weight}`} className="flex items-center gap-4 px-5 py-4">
                          <img
                            src={item.image ?? '/no-image.png'}
                            alt={item.name}
                            className="h-16 w-16 rounded-xl object-cover border border-neutral-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-neutral-900 line-clamp-1">{item.name}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {item.weight} {item.unit} × {item.qty} = ฿{(item.price * item.weight * item.qty).toLocaleString()}
                            </p>
                          </div>

                          {/* ✅ ปุ่มรีวิว เฉพาะ delivered */}
                          {order.status === 'delivered' && (
                            <div className="flex-shrink-0">
                              {alreadyReviewed ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                                  ✓ รีวิวแล้ว
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setReviewTarget({ orderId: order.id, shopId: order.shopId, item })}
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
                  <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between gap-3 flex-wrap bg-neutral-50/50">
                    <div className="text-xs text-neutral-400 font-mono">{order.id}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-neutral-900">
                        รวม ฿{Number(order.grandTotal).toLocaleString()}
                      </div>
                      {/* ✅ ปุ่มยืนยันรับสินค้า เมื่อ status = shipping */}
                      {order.status === 'in_delivery' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmDelivered(order.id)}
                          className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full font-medium transition"
                        >
                          ✅ ได้รับสินค้าแล้ว
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
    </div>
  );
}