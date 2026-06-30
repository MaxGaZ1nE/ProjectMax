import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { fetchPendingOrders, verifyPayment, rejectPayment, clearError } from '@slices/seller-slice';

export default function SellerOrdersPendingPage() {
  const dispatch = useAppDispatch();
  const pendingOrders = useAppSelector((s) => s.seller.pendingOrders);
  const loading = useAppSelector((s) => s.seller.loading);
  const error = useAppSelector((s) => s.seller.error);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPendingOrders());
  }, [dispatch]);

  const handleApprove = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await dispatch(verifyPayment({ orderId, verified: true })).unwrap();
      // Refresh list
      await dispatch(fetchPendingOrders()).unwrap();
    } catch (err) {
      console.error('Failed to approve:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await dispatch(
        rejectPayment({ orderId, reason: rejectionReason || 'Payment slip rejected' })
      ).unwrap();
      setShowRejectForm(null);
      setRejectionReason('');
      // Refresh list
      await dispatch(fetchPendingOrders()).unwrap();
    } catch (err) {
      console.error('Failed to reject:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">รอตรวจสอบสลิป</h1>
        <p className="text-sm text-neutral-600 mt-1">
          ออเดอร์ที่ลูกค้าอัพโหลดสลิป PromptPay แล้ว รอการตรวจสอบจากคุณ
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

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"></div>
            <p className="text-neutral-600">กำลังโหลด...</p>
          </div>
        </div>
      ) : pendingOrders.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-neutral-600">ไม่มีออเดอร์รอตรวจสอบ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map((order) => (
            <div key={order.id} className="card p-6 space-y-4">
              {/* Order Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-neutral-900">Order #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-neutral-500">
                    {new Date(order.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg text-neutral-900">
                    {formatCurrency(order.totalPrice)}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t border-neutral-200 pt-4">
                <p className="text-sm text-neutral-600">
                  <strong>ลูกค้า:</strong> {order.customerName}
                </p>
                <p className="text-sm text-neutral-600">
                  <strong>เบอร์:</strong> {order.phone}
                </p>
                <p className="text-sm text-neutral-600">
                  <strong>ที่อยู่:</strong> {order.address}
                </p>
              </div>

              {/* Items */}
              <div className="border-t border-neutral-200 pt-4">
                <p className="text-sm font-semibold text-neutral-900 mb-2">รายการสินค้า:</p>
                <ul className="text-sm text-neutral-600 space-y-1">
                  {order.items?.map((item, idx) => (
                    <li key={idx}>
                      • {item.name} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="border-t border-neutral-200 pt-4 flex gap-2">
                <button
                  className="btn btn-success flex-1 disabled:opacity-50"
                  onClick={() => handleApprove(order.id)}
                  disabled={processingId !== null}
                >
                  {processingId === order.id ? 'กำลังอนุมัติ...' : '✓ อนุมัติ'}
                </button>
                <button
                  className="btn btn-outline flex-1 disabled:opacity-50"
                  onClick={() => setShowRejectForm(order.id)}
                  disabled={processingId !== null}
                >
                  ✗ ไม่อนุมัติ
                </button>
              </div>

              {/* Reject Form */}
              {showRejectForm === order.id && (
                <div className="border-t border-neutral-200 pt-4 space-y-3">
                  <p className="text-sm font-semibold text-neutral-900">เหตุผล (ไม่บังคับ):</p>
                  <textarea
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
                    rows={3}
                    placeholder="เช่น: สลิปจำนวนเงินไม่ตรง, ชื่อบัญชีไม่ตรง"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn btn-error flex-1"
                      onClick={() => handleReject(order.id)}
                      disabled={processingId !== null}
                    >
                      ยืนยันไม่อนุมัติ
                    </button>
                    <button
                      className="btn btn-outline flex-1"
                      onClick={() => setShowRejectForm(null)}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}