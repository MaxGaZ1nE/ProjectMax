import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@stores/index';
import { approvePromptPaySlip, rejectPromptPaySlip } from '@slices/order-slice';
import { pushNotification } from '@slices/notification-slice';

const inputClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none transition ' +
  'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:border-primary-500 dark:focus:ring-primary-900';

function Badge({ children, tone }: { children: React.ReactNode; tone: 'amber' | 'green' | 'red' | 'neutral' }) {
  const cls =
    tone === 'green'
      ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
      : tone === 'amber'
        ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
        : tone === 'red'
          ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200'
          : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

interface AdminSlipsSectionProps {
  orders: any[];
}

export default function AdminSlipsSection({ orders }: AdminSlipsSectionProps) {
  const dispatch = useAppDispatch();
  
  const [previewSlip, setPreviewSlip] = useState<{
    open: boolean;
    orderId?: string;
    src?: string;
  }>({ open: false });

  const [rejectModal, setRejectModal] = useState<{ open: boolean; orderId?: string }>({
    open: false,
  });
  const [rejectReason, setRejectReason] = useState('สลิปไม่ชัดเจน');

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ออเดอร์ที่รอตรวจสอบสลิป
  const allPendingOrders = useMemo(() => {
    return orders.filter(
      (o: any) =>
        o.status === 'unpaid' &&
        (o.checkout?.paymentStatus ?? 'none') === 'pending_verification' &&
        o.checkout?.slipBase64
    );
  }, [orders]);

  // ออเดอร์ที่อนุมัติแล้ว
  const allApprovedOrders = useMemo(() => {
    return orders.filter(
      (o: any) =>
        o.checkout?.paymentStatus === 'verified' &&
        o.checkout?.slipBase64
    );
  }, [orders]);

  // ออเดอร์ที่ไม่อนุมัติ
  const allRejectedOrders = useMemo(() => {
    return orders.filter(
      (o: any) =>
        o.checkout?.paymentStatus === 'rejected' &&
        o.checkout?.slipBase64
    );
  }, [orders]);

  // ฟิลเตอร์ตามสถานะ
  const filteredOrders = useMemo(() => {
    let result = [];
    if (filterStatus === 'pending') {
      result = allPendingOrders;
    } else if (filterStatus === 'approved') {
      result = allApprovedOrders;
    } else if (filterStatus === 'rejected') {
      result = allRejectedOrders;
    } else {
      result = [...allPendingOrders, ...allApprovedOrders, ...allRejectedOrders];
    }

    // ค้นหาตามหมายเลขออเดอร์หรือชื่อลูกค้า
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o: any) =>
          o.id.toLowerCase().includes(q) ||
          (o.checkout?.customer_name || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [allPendingOrders, allApprovedOrders, allRejectedOrders, filterStatus, searchQuery]);

  const openSlip = (orderId: string, src?: string) => {
    setPreviewSlip({ open: true, orderId, src });
  };

  const closeSlip = () => setPreviewSlip({ open: false });

  const onApprove = (orderId: string) => {
    dispatch(approvePromptPaySlip({ orderId }));
    dispatch(
      pushNotification({
        type: 'payment',
        title: '✅ อนุมัติสลิป',
        message: `ออเดอร์ ${orderId.slice(0, 8)} อนุมัติแล้ว กำลังเตรียมจัดส่ง`,
      })
    );
  };

  const onRejectClick = (orderId: string) => {
    setRejectModal({ open: true, orderId });
    setRejectReason('สลิปไม่ชัดเจน');
  };

  const onRejectConfirm = () => {
    if (!rejectModal.orderId) return;
    dispatch(
      rejectPromptPaySlip({
        orderId: rejectModal.orderId,
        reason: rejectReason,
      })
    );
    dispatch(
      pushNotification({
        type: 'error',
        title: '❌ ไม่อนุมัติสลิป',
        message: `ออเดอร์ ${rejectModal.orderId.slice(0, 8)} ไม่อนุมัติแล้ว`,
      })
    );
    setRejectModal({ open: false });
    setRejectReason('สลิปไม่ชัดเจน');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">รอตรวจสอบ</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1">{allPendingOrders.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">อนุมัติแล้ว</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">{allApprovedOrders.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">ไม่อนุมัติ</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-500 mt-1">{allRejectedOrders.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">รวมทั้งหมด</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{filteredOrders.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5 block">
              ค้นหาตามหมายเลขออเดอร์หรือชื่อลูกค้า
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="กรุณากรอก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5 block">
              สถานะ
            </label>
            <select
              className={inputClass}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">ไม่พบออเดอร์</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {filteredOrders.map((order: any) => (
              <div key={order.id} className="p-6 space-y-4">
                {/* Order Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">ออเดอร์ #{order.id.slice(0, 8)}</h3>
                      <Badge
                        tone={
                          order.checkout?.paymentStatus === 'pending_verification'
                            ? 'amber'
                            : order.checkout?.paymentStatus === 'verified'
                              ? 'green'
                              : 'red'
                        }
                      >
                        {order.checkout?.paymentStatus === 'pending_verification'
                          ? '⏳ รอตรวจสอบ'
                          : order.checkout?.paymentStatus === 'verified'
                            ? '✅ อนุมัติ'
                            : '❌ ไม่อนุมัติ'}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(order.totalPrice)}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">ชื่อลูกค้า</p>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{order.checkout?.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">เบอร์โทรศัพท์</p>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{order.checkout?.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">ที่อยู่</p>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{order.checkout?.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">จำนวนสินค้า</p>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{(order.items || []).length} รายการ</p>
                    </div>
                  </div>
                </div>

                {/* Slip Preview */}
                {order.checkout?.slipBase64 && (
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">สลิปการชำระเงิน</p>
                    <img
                      src={order.checkout.slipBase64}
                      alt="slip"
                      className="max-w-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 cursor-pointer hover:shadow-lg transition"
                      onClick={() => openSlip(order.id, order.checkout.slipBase64)}
                    />
                  </div>
                )}

                {/* Actions */}
                {order.checkout?.paymentStatus === 'pending_verification' && (
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => openSlip(order.id, order.checkout?.slipBase64)}
                      className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-medium text-sm text-neutral-900 dark:text-neutral-100"
                    >
                      👁️ ดูสลิปใหญ่
                    </button>
                    <button
                      onClick={() => onApprove(order.id)}
                      className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 font-medium text-sm"
                    >
                      ✅ อนุมัติสลิป
                    </button>
                    <button
                      onClick={() => onRejectClick(order.id)}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-500 font-medium text-sm"
                    >
                      ❌ ไม่อนุมัติ
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slip Preview Modal */}
      {previewSlip.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">สลิปการชำระเงิน</h3>
              <button
                onClick={closeSlip}
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-2xl"
              >
                ×
              </button>
            </div>
            {previewSlip.src && (
              <img src={previewSlip.src} alt="slip" className="w-full" />
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-sm w-full space-y-4 p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg">ไม่อนุมัติสลิป</h3>
            <div>
              <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5 block">
                เหตุผล
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="เหตุผลการไม่อนุมัติ"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRejectModal({ open: false })}
                className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-medium text-neutral-900 dark:text-neutral-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={onRejectConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-500 font-medium"
              >
                ไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
