import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { pushNotification } from '@/slices/notification-slice';
import { shopAPI } from '@services/backend-api';

// Redux actions still used for claim/refund (backend endpoints not yet available)
import {
  requestClaim,
  approveClaim,
  rejectClaim,
  markRefunded,
} from '@/slices/order-slice';

const slotLabel: Record<string, string> = {
  morning: 'รอบเช้า (09:00–12:00)',
  afternoon: 'รอบบ่าย (13:00–17:00)',
};

type TabType = 'waiting_driver' | 'in_delivery' | 'delivered' | 'claim';

export default function SellerOrdersToShipPage() {
  const dispatch = useAppDispatch();

  // ✅ State from Backend API
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<TabType>('waiting_driver');

  const [cancelFor, setCancelFor] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('สินค้าหมด');

  // claim ui
  const [claimFor, setClaimFor] = useState<string | null>(null);
  const [claimReason, setClaimReason] = useState('สินค้าเสียหาย');
  const [claimNote, setClaimNote] = useState('');
  const [claimRefundAmount, setClaimRefundAmount] = useState<number>(0);

  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('ไม่เข้าเงื่อนไขการเคลม');

  const [refundFor, setRefundFor] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);

  // ✅ Fetch seller orders from Backend API
  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const res = await shopAPI.getSellerOrders();
      const data = res.data?.data ?? res.data;
      const ordersList = Array.isArray(data) ? data : data?.orders ?? [];
      setOrders(ordersList);
    } catch (err: any) {
      console.error('Failed to load seller orders:', err);
      setError(err?.response?.data?.error || 'ไม่สามารถโหลดออเดอร์ได้');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    };
    init();
  }, [fetchOrders]);

  const toShip = useMemo(
    () => orders.filter((o: any) => o.status === 'waiting_driver'),
    [orders]
  );

  const shipping = useMemo(
    () => orders.filter((o: any) => o.status === 'in_delivery'),
    [orders]
  );

  const delivered = useMemo(
    () => orders.filter((o: any) => o.status === 'delivered'),
    [orders]
  );

  const claims = useMemo(
    () => orders.filter((o: any) => o.status === 'claim'),
    [orders]
  );

  const displayed = tab === 'waiting_driver' ? toShip : tab === 'in_delivery' ? shipping : tab === 'delivered' ? delivered : claims;

  // ✅ Mark Shipping via Backend API
  const handleMarkShipping = async (orderId: string) => {
    try {
      await shopAPI.updateOrderStatus(orderId, 'in_delivery', 'ส่งออกจากร้านแล้ว');
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'in_delivery' } : o));
      dispatch(
        pushNotification({
          type: 'order',
          title: 'สินค้าของคุณกำลังจัดส่ง',
          message: `คำสั่งซื้อ ${orderId} ออกจัดส่งแล้ว`,
        })
      );
    } catch (err: any) {
      console.error('Mark shipping error:', err);
      dispatch(pushNotification({ type: 'error', title: '❌ เปลี่ยนสถานะไม่สำเร็จ', message: err?.response?.data?.message || 'เกิดข้อผิดพลาด' }));
    }
  };

  // ✅ Mark Delivered via Backend API
  const handleMarkDelivered = async (orderId: string) => {
    try {
      await shopAPI.updateOrderStatus(orderId, 'delivered', 'ส่งถึงปลายทางแล้ว');
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'delivered', deliveredAt: new Date().toISOString() } : o));
      dispatch(
        pushNotification({
          type: 'order',
          title: 'จัดส่งสำเร็จ',
          message: `คำสั่งซื้อ ${orderId} ส่งถึงปลายทางแล้ว`,
        })
      );
    } catch (err: any) {
      console.error('Mark delivered error:', err);
      dispatch(pushNotification({ type: 'error', title: '❌ เปลี่ยนสถานะไม่สำเร็จ', message: err?.response?.data?.message || 'เกิดข้อผิดพลาด' }));
    }
  };

  // ✅ Cancel via Backend API
  const handleCancel = async (orderId: string, reason: string) => {
    try {
      await shopAPI.updateOrderStatus(orderId, 'cancelled', `ยกเลิก: ${reason}`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      dispatch(
        pushNotification({
          type: 'order',
          title: 'คำสั่งซื้อถูกยกเลิก',
          message: `คำสั่งซื้อ ${orderId} ถูกยกเลิก (${reason})`,
        })
      );
    } catch (err: any) {
      console.error('Cancel error:', err);
      dispatch(pushNotification({ type: 'error', title: '❌ ยกเลิกไม่สำเร็จ', message: err?.response?.data?.message || 'เกิดข้อผิดพลาด' }));
    }
    setCancelFor(null);
  };

  // Claim/Refund still uses Redux (backend claim endpoints not yet available)
  const handleRequestClaim = (orderId: string) => {
    const amount = Math.max(0, Number(claimRefundAmount) || 0);
    dispatch(requestClaim({ orderId, reason: claimReason, note: claimNote || undefined, refundAmount: amount > 0 ? amount : undefined }));
    dispatch(pushNotification({ type: 'order', title: 'มีการขอเคลมสินค้า', message: `คำสั่งซื้อ ${orderId} ถูกขอเคลม (${claimReason})` }));
    setClaimFor(null);
    setClaimNote('');
    setClaimRefundAmount(0);
    setClaimReason('สินค้าเสียหาย');
  };

  const handleApproveClaim = (orderId: string) => {
    dispatch(approveClaim({ orderId }));
    dispatch(pushNotification({ type: 'order', title: 'อนุมัติเคลมแล้ว', message: `คำสั่งซื้อ ${orderId} อนุมัติเคลมแล้ว` }));
  };

  const handleRejectClaim = (orderId: string) => {
    dispatch(rejectClaim({ orderId, rejectReason: rejectReasonText }));
    dispatch(pushNotification({ type: 'order', title: 'ปฏิเสธการเคลม', message: `คำสั่งซื้อ ${orderId} ถูกปฏิเสธการเคลม (${rejectReasonText})` }));
    setRejectFor(null);
    setRejectReasonText('ไม่เข้าเงื่อนไขการเคลม');
  };

  const handleRefunded = (orderId: string) => {
    const amount = Math.max(0, Number(refundAmount) || 0);
    dispatch(markRefunded({ orderId, refundAmount: amount }));
    dispatch(pushNotification({ type: 'order', title: 'คืนเงินสำเร็จ (จำลอง)', message: `คำสั่งซื้อ ${orderId} คืนเงินแล้ว จำนวน ฿${amount.toLocaleString()}` }));
    setRefundFor(null);
    setRefundAmount(0);
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
      <div className="text-xl font-semibold text-neutral-900">จัดการออเดอร์</div>
      <div className="mt-1 text-sm text-neutral-600">จัดส่ง, ส่งสำเร็จ, และเคลม/คืนเงิน</div>

      {error && (
        <div className="mt-3 card bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('waiting_driver')}
          className={[
            'text-sm px-4 py-2 rounded-full border transition',
            tab === 'waiting_driver'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50',
          ].join(' ')}
        >
          รอจัดส่ง ({toShip.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('in_delivery')}
          className={[
            'text-sm px-4 py-2 rounded-full border transition',
            tab === 'in_delivery'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50',
          ].join(' ')}
        >
          กำลังจัดส่ง ({shipping.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('delivered')}
          className={[
            'text-sm px-4 py-2 rounded-full border transition',
            tab === 'delivered'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50',
          ].join(' ')}
        >
          ส่งสำเร็จ ({delivered.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('claim')}
          className={[
            'text-sm px-4 py-2 rounded-full border transition',
            tab === 'claim'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50',
          ].join(' ')}
        >
          เคลม/คืนเงิน ({claims.length})
        </button>
      </div>

      {/* List */}
      <div className="mt-4 space-y-4">
        {displayed.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
            {tab === 'waiting_driver'
              ? 'ยังไม่มีออเดอร์ที่ต้องจัดส่ง'
              : tab === 'in_delivery'
              ? 'ยังไม่มีออเดอร์ที่กำลังจัดส่ง'
              : tab === 'delivered'
              ? 'ยังไม่มีออเดอร์ที่จัดส่งสำเร็จ'
              : 'ยังไม่มีออเดอร์ที่อยู่ในสถานะเคลม/คืนเงิน'}
          </div>
        ) : (
          displayed.map((o: any) => {
            const checkout = o.checkout ?? {};
            const fullName = checkout.fullName || o.recipient_name || o.full_name || '—';
            const phone = checkout.phone || o.recipient_phone || '—';
            const address = checkout.address || o.delivery_address || '—';
            const deliveryDate = checkout.deliveryDate || o.delivery_date || '—';
            const deliverySlot = checkout.deliverySlot || o.delivery_slot || '—';
            const paymentMethod = checkout.paymentMethod || o.payment_method || '—';
            const items = o.items ?? [];
            const grandTotal = Number(o.grandTotal ?? o.grand_total ?? 0);

            return (
            <div key={o.id} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 bg-neutral-50">
                <div>
                  <div className="text-xs text-neutral-500">คำสั่งซื้อ</div>
                  <div className="text-sm font-semibold text-neutral-900 break-all">{o.id ?? o.order_number}</div>
                  {(o.createdAt || o.created_at) && (
                    <div className="text-xs text-neutral-500 mt-1">สร้างเมื่อ: {new Date(o.createdAt || o.created_at).toLocaleString()}</div>
                  )}
                  {(o.deliveredAt || o.delivered_at) && (
                    <div className="text-xs text-neutral-500 mt-1">ส่งสำเร็จเมื่อ: {new Date(o.deliveredAt || o.delivered_at).toLocaleString()}</div>
                  )}
                </div>

                <span
                  className={[
                    'text-xs px-2.5 py-1 rounded-full font-medium',
                    o.status === 'waiting_driver'
                      ? 'bg-blue-100 text-blue-700'
                      : o.status === 'in_delivery'
                      ? 'bg-indigo-100 text-indigo-700'
                      : o.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-700'
                      : o.status === 'claim'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-neutral-100 text-neutral-700',
                  ].join(' ')}
                >
                  {o.status === 'waiting_driver'
                    ? 'รอจัดส่ง'
                    : o.status === 'in_delivery'
                    ? 'กำลังจัดส่ง'
                    : o.status === 'delivered'
                    ? 'ส่งสำเร็จ'
                    : o.status === 'claim'
                    ? `เคลม (${o.claim?.status ?? '-'})`
                    : o.status}
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* Buyer + Delivery info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">ผู้รับ</div>
                    <div className="font-medium text-neutral-900">{fullName}</div>
                    <div className="text-neutral-600 mt-0.5">{phone}</div>
                    <div className="text-neutral-600 mt-0.5 leading-snug">{address}</div>
                  </div>

                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <div className="text-xs text-neutral-500">วันส่ง</div>
                    <div className="font-semibold text-neutral-900">{deliveryDate}</div>

                    <div className="text-xs text-neutral-500 mt-2">รอบส่ง</div>
                    <div className="font-semibold text-neutral-900">
                      {slotLabel[deliverySlot] ?? deliverySlot}
                    </div>

                    <div className="text-xs text-neutral-500 mt-2">ชำระเงิน</div>
                    <div className="font-semibold text-neutral-900">
                      PromptPay
                    </div>
                  </div>
                </div>

                {/* Items */}
                {items.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-neutral-500 mb-2">สินค้า</div>
                  <div className="space-y-1.5">
                    {items.map((it: any) => (
                      <div key={`${it.id}-${it.unit}-${it.weight}`} className="flex items-center gap-3">
                        {it.image && (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="h-9 w-9 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 flex justify-between gap-2 text-sm">
                          <span className="text-neutral-700 truncate">
                            {it.name} × {it.qty}
                          </span>
                          <span className="text-neutral-500 flex-shrink-0">
                            {it.weight} Kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center text-sm border-t border-neutral-200 pt-3">
                  <span className="text-neutral-500">ยอดสุทธิ</span>
                  <span className="font-semibold text-red-600 text-base">
                    ฿{grandTotal.toLocaleString()}
                  </span>
                </div>

                {/* Claim info */}
                {o.claim && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="font-semibold">ข้อมูลเคลม</div>
                    <div className="mt-1">สถานะ: {o.claim.status}</div>
                    <div className="mt-1">เหตุผล: {o.claim.reason}</div>
                    {o.claim.note && <div className="mt-1">หมายเหตุ: {o.claim.note}</div>}
                    {typeof o.claim.refundAmount === 'number' && (
                      <div className="mt-1">ยอดคืนเงิน: ฿{Number(o.claim.refundAmount).toLocaleString()}</div>
                    )}
                    {o.claim.rejectReason && <div className="mt-1">เหตุผลที่ปฏิเสธ: {o.claim.rejectReason}</div>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {o.status === 'waiting_driver' && (
                    <>
                      <button type="button" className="btn btn-primary text-sm" onClick={() => handleMarkShipping(o.id)}>
                        ส่งออกแล้ว (เปลี่ยนเป็นกำลังจัดส่ง)
                      </button>

                      <button
                        type="button"
                        className="btn text-sm text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setCancelFor(o.id)}
                      >
                        ยกเลิก order
                      </button>
                    </>
                  )}

                  {o.status === 'in_delivery' && (
                    <button type="button" className="btn btn-primary text-sm" onClick={() => handleMarkDelivered(o.id)}>
                      ยืนยันส่งสำเร็จ
                    </button>
                  )}

                  {/* ✅ สร้างเคลมจาก delivered (จำลอง) */}
                  {o.status === 'delivered' && (
                    <button
                      type="button"
                      className="btn text-sm border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => {
                        setClaimFor(o.id);
                        setClaimRefundAmount(grandTotal);
                      }}
                    >
                      สร้างคำขอเคลม/คืนเงิน
                    </button>
                  )}

                  {/* ✅ จัดการเคลม */}
                  {o.status === 'claim' && (
                    <>
                      {o.claim?.status === 'requested' && (
                        <>
                          <button
                            type="button"
                            className="btn text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleApproveClaim(o.id)}
                          >
                            อนุมัติเคลม
                          </button>

                          <button
                            type="button"
                            className="btn text-sm border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => setRejectFor(o.id)}
                          >
                            ปฏิเสธเคลม
                          </button>

                          <button
                            type="button"
                            className="btn text-sm border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() => {
                              setRefundFor(o.id);
                              setRefundAmount(Number(o.claim?.refundAmount ?? grandTotal));
                            }}
                          >
                            คืนเงินแล้ว (จำลอง)
                          </button>
                        </>
                      )}

                      {o.claim?.status === 'approved' && (
                        <button
                          type="button"
                          className="btn text-sm border-amber-200 text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            setRefundFor(o.id);
                            setRefundAmount(Number(o.claim?.refundAmount ?? grandTotal));
                          }}
                        >
                          คืนเงินแล้ว (จำลอง)
                        </button>
                      )}

                      {o.claim?.status === 'refunded' && (
                        <div className="text-sm text-emerald-700 font-semibold">สถานะ: คืนเงินแล้ว</div>
                      )}
                    </>
                  )}
                </div>

                {/* Cancel form */}
                {cancelFor === o.id && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 mt-2">
                    <div className="text-sm font-semibold text-red-700 mb-2">เหตุผลที่ยกเลิก</div>
                    <select
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-400"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    >
                      <option value="สินค้าหมด">สินค้าหมด</option>
                      <option value="ไม่สามารถจัดส่งในพื้นที่ได้">ไม่สามารถจัดส่งในพื้นที่ได้</option>
                      <option value="ผู้ซื้อติดต่อไม่ได้">ผู้ซื้อติดต่อไม่ได้</option>
                      <option value="สินค้าเสียหาย">สินค้าเสียหาย</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button" className="btn text-sm" onClick={() => setCancelFor(null)}>
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        className="btn text-sm bg-red-600 text-white border-red-600 hover:bg-red-700"
                        onClick={() => handleCancel(o.id, cancelReason)}
                      >
                        ยืนยันยกเลิก order
                      </button>
                    </div>
                  </div>
                )}

                {/* Request claim form */}
                {claimFor === o.id && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mt-2">
                    <div className="text-sm font-semibold text-amber-900 mb-2">สร้างคำขอเคลม/คืนเงิน</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-amber-900 mb-1">เหตุผล</div>
                        <select
                          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none"
                          value={claimReason}
                          onChange={(e) => setClaimReason(e.target.value)}
                        >
                          <option value="สินค้าเสียหาย">สินค้าเสียหาย</option>
                          <option value="คุณภาพไม่ตรงตามที่แจ้ง">คุณภาพไม่ตรงตามที่แจ้ง</option>
                          <option value="ส่งของผิด/ไม่ครบ">ส่งของผิด/ไม่ครบ</option>
                          <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                      </div>

                      <div>
                        <div className="text-xs text-amber-900 mb-1">ยอดคืนเงิน (บาท)</div>
                        <input
                          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none"
                          type="number"
                          min={0}
                          step={1}
                          value={claimRefundAmount}
                          onChange={(e) => setClaimRefundAmount(Number(e.target.value) || 0)}
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-amber-900 mb-1">หมายเหตุ (ถ้ามี)</div>
                      <textarea
                        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none"
                        value={claimNote}
                        onChange={(e) => setClaimNote(e.target.value)}
                        rows={3}
                        placeholder="เช่น รูปสินค้าเสียหาย, รายละเอียดเพิ่มเติม"
                      />
                    </div>

                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button" className="btn text-sm" onClick={() => setClaimFor(null)}>
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        className="btn text-sm bg-amber-600 text-white border-amber-600 hover:bg-amber-700"
                        onClick={() => handleRequestClaim(o.id)}
                      >
                        ยืนยันขอเคลม
                      </button>
                    </div>
                  </div>
                )}

                {/* Reject claim form */}
                {rejectFor === o.id && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 mt-2">
                    <div className="text-sm font-semibold text-red-700 mb-2">ปฏิเสธการเคลม</div>

                    <div className="text-xs text-red-700 mb-1">เหตุผลที่ปฏิเสธ</div>
                    <input
                      className="w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm outline-none"
                      value={rejectReasonText}
                      onChange={(e) => setRejectReasonText(e.target.value)}
                    />

                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button" className="btn text-sm" onClick={() => setRejectFor(null)}>
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        className="btn text-sm bg-red-600 text-white border-red-600 hover:bg-red-700"
                        onClick={() => handleRejectClaim(o.id)}
                      >
                        ยืนยันปฏิเสธ
                      </button>
                    </div>
                  </div>
                )}

                {/* Refund form */}
                {refundFor === o.id && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mt-2">
                    <div className="text-sm font-semibold text-emerald-800 mb-2">คืนเงินแล้ว (จำลอง)</div>

                    <div className="text-xs text-emerald-800 mb-1">ยอดคืนเงิน (บาท)</div>
                    <input
                      className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm outline-none"
                      type="number"
                      min={0}
                      step={1}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value) || 0)}
                      inputMode="numeric"
                    />

                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button" className="btn text-sm" onClick={() => setRefundFor(null)}>
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        className="btn text-sm bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleRefunded(o.id)}
                      >
                        ยืนยันคืนเงินแล้ว
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}