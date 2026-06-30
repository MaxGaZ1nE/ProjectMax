import { useEffect, useMemo, useState } from 'react';

import { useAppDispatch } from '@stores/index';
import { pushNotification } from '@/slices/notification-slice';
import { shopAPI, orderAPI } from '@/services/backend-api';

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
      {children}
    </span>
  );
}

export default function SellerOrdersPendingPage() {
  const dispatch = useAppDispatch();

  // ✅ State from Backend API
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch seller orders from Backend on mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await shopAPI.getSellerOrders({ status: 'unpaid' });
        const data = res.data?.data ?? res.data;
        const ordersList = Array.isArray(data) ? data : data?.orders ?? [];
        setOrders(ordersList);
      } catch (err: any) {
        console.error('Failed to load seller orders:', err);
        setError(err?.response?.data?.error || 'ไม่สามารถโหลดออเดอร์ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ✅ Filter pending verification
  const myPending = useMemo(() => {
    return orders.filter(
      (o: any) =>
        o.status === 'unpaid' &&
        (o.checkout?.paymentStatus ?? o.payment_status ?? 'none') === 'pending_verification'
    );
  }, [orders]);

  const [preview, setPreview] = useState<{ open: boolean; src?: string; orderId?: string }>({ open: false });
  const [rejectReason, setRejectReason] = useState('สลิปไม่ชัดเจน');
  const [rejectFor, setRejectFor] = useState<string | null>(null);

  // ✅ Approve via Backend API
  const approve = async (orderId: string) => {
    try {
      await shopAPI.updateOrderStatus(orderId, 'waiting_driver', 'ตรวจสอบสลิปผ่าน');

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'waiting_driver' } : o
        )
      );

      dispatch(
        pushNotification({
          type: 'payment',
          title: 'ผู้ขายตรวจสอบสลิปแล้ว: ผ่าน',
          message: `คำสั่งซื้อ ${orderId} ตรวจสอบผ่าน กำลังเตรียมจัดส่ง`,
        })
      );
    } catch (err: any) {
      console.error('Approve error:', err);
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ อนุมัติไม่สำเร็จ',
          message: err?.response?.data?.message || 'เกิดข้อผิดพลาด',
        })
      );
    }
  };

  // ✅ Reject via Backend API
  const reject = async (orderId: string, reason: string) => {
    try {
      await shopAPI.updateOrderStatus(orderId, 'unpaid', `สลิปไม่ผ่าน: ${reason}`);

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, checkout: { ...o.checkout, paymentStatus: 'rejected' } }
            : o
        )
      );

      dispatch(
        pushNotification({
          type: 'payment',
          title: 'ผู้ขายตรวจสอบสลิปแล้ว: ไม่ผ่าน',
          message: `คำสั่งซื้อ ${orderId} ไม่ผ่าน (${reason}) กรุณาแนบสลิปใหม่`,
        })
      );
    } catch (err: any) {
      console.error('Reject error:', err);
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ ไม่อนุมัติไม่สำเร็จ',
          message: err?.response?.data?.message || 'เกิดข้อผิดพลาด',
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-pulse text-lg font-medium text-emerald-700">⏳ กำลังโหลดออเดอร์...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xl font-semibold text-neutral-900">รอตรวจสอบสลิป</div>
      <div className="mt-2 text-sm text-neutral-600">เฉพาะออเดอร์ของร้านคุณ</div>

      {error && (
        <div className="mt-3 card bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Badge>{myPending.length} รายการ</Badge>
      </div>

      <div className="mt-4 space-y-3">
        {myPending.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
            ยังไม่มีออเดอร์ที่รอตรวจสอบสลิป
          </div>
        ) : (
          myPending.map((o: any) => (
            <div key={o.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900 break-all">{o.id}</div>
                  <div className="mt-1 text-sm text-neutral-600">
                    ยอดสุทธิ: <span className="font-semibold text-red-600">{Number(o.grandTotal ?? o.grand_total ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">
                    ผู้รับ: <span className="font-medium text-neutral-900">{o.checkout?.fullName || o.full_name || '—'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button type="button" className="btn" onClick={() => setPreview({ open: true, src: o.checkout?.slipBase64 || o.slip_base64, orderId: o.id })}>
                    ดูสลิป
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => approve(o.id)}>
                    อนุมัติ
                  </button>
                  <button type="button" className="btn" onClick={() => setRejectFor(o.id)}>
                    ไม่อนุมัติ
                  </button>
                </div>
              </div>

              {rejectFor === o.id && (
                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-sm font-semibold text-neutral-900">เหตุผลที่ไม่อนุมัติ</div>
                  <select
                    className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  >
                    <option value="สลิปไม่ชัดเจน">สลิปไม่ชัดเจน</option>
                    <option value="ยอดเงินไม่ตรง">ยอดเงินไม่ตรง</option>
                    <option value="วันเวลาโอนไม่ชัดเจน">วันเวลาโอนไม่ชัดเจน</option>
                    <option value="สลิปไม่ถูกต้อง">สลิปไม่ถูกต้อง</option>
                  </select>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button type="button" className="btn" onClick={() => setRejectFor(null)}>
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        reject(o.id, rejectReason);
                        setRejectFor(null);
                      }}
                    >
                      ยืนยันไม่อนุมัติ
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {preview.open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreview({ open: false })} />
          <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl border border-neutral-200 overflow-auto">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="font-semibold text-neutral-900">สลิปของออเดอร์ {preview.orderId}</div>
              <button type="button" onClick={() => setPreview({ open: false })} className="h-9 w-9 rounded-md hover:bg-neutral-50">
                ✕
              </button>
            </div>
            <div className="p-5">
              {preview.src ? (
                <img src={preview.src} alt="slip" className="w-full rounded-lg border border-neutral-200 bg-white" />
              ) : (
                <div className="text-sm text-neutral-600">ไม่พบสลิป</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}