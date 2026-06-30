import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UnpaidStyleOrderCard({
  order,
  onReorder,
  onPayNow,
  onCancel,
  onRequestClaim,
  onConfirmDelivered, // ✅ เพิ่ม prop ใหม่
}: {
  order: any;
  onReorder: () => void;
  onPayNow: () => void;
  onCancel: (reason: string) => void;
  onRequestClaim?: (payload: { orderId: string; reason: string; note?: string; refundAmount?: number }) => void;
  onConfirmDelivered?: (orderId: string) => void; // ✅ เพิ่ม
}) {
  const navigate = useNavigate();
  const [openCancelPanel, setOpenCancelPanel] = useState(false);
  const [reason, setReason] = useState<string>('ต้องการเปลี่ยนที่อยู่จัดส่ง');
  const [openClaimPanel, setOpenClaimPanel] = useState(false);
  const [claimReason, setClaimReason] = useState<string>('สินค้าเสียหาย');
  const [claimNote, setClaimNote] = useState('');
  const [claimRefundAmount, setClaimRefundAmount] = useState<number>(0);

  const cancelReasons = [
    'ต้องการเปลี่ยนที่อยู่จัดส่ง',
    'ต้องการแก้ไขรายละเอียดคำสั่งซื้อ',
    'เจอสินค้าที่ถูกกว่า',
    'ไม่ต้องการซื้อสินค้านี้แล้ว',
    'อื่นๆ',
  ];

  const first = order.items?.[0];
  const total = Number(order.grandTotal ?? order.total ?? 0);
  const paymentStatus = order?.checkout?.paymentStatus as string | undefined;
  const isPendingVerification = paymentStatus === 'pending_verification';
  const claimStatus = (order?.claim?.status ?? '') as string;
  const hasClaim = !!order?.claim;
  const canRequestClaim = order?.status === 'delivered' && typeof onRequestClaim === 'function' && !hasClaim;
  const isClaimOrder = order?.status === 'claim';

  const statusText = useMemo(() => {
    if (order.status === 'pending_payment') return 'รอตรวจสลิป';
    if (order.status === 'unpaid') return 'รอชำระ';
    if (order.status === 'confirmed') return 'รอจัดส่ง';
    if (order.status === 'waiting_driver') return 'รอคนรับงาน';
    if (order.status === 'picking_up') return 'กำลังเข้ารับสินค้า';
    if (order.status === 'in_delivery') return 'กำลังจัดส่ง';
    if (order.status === 'delivered') return 'ส่งสำเร็จ';
    if (order.status === 'completed') return 'เสร็จสิ้น';
    if (order.status === 'claim') {
      if (claimStatus === 'requested') return 'เคลม: รอตรวจสอบ';
      if (claimStatus === 'approved') return 'เคลม: อนุมัติแล้ว';
      if (claimStatus === 'rejected') return 'เคลม: ปฏิเสธ';
      if (claimStatus === 'refunded') return 'เคลม: คืนเงินแล้ว';
      return 'เคลมสินค้า';
    }
    if (order.status === 'canceled') return 'ยกเลิก';
    return order.status;
  }, [order.status, claimStatus]);

  const statusClass = useMemo(() => {
    if (order.status === 'unpaid' && isPendingVerification) return 'text-amber-700';
    if (order.status === 'unpaid') return 'text-red-600';
    if (order.status === 'picking_up') return 'text-sky-700';
    if (order.status === 'canceled') return 'text-neutral-500';
    if (order.status === 'claim') return 'text-amber-700';
    if (order.status === 'delivered') return 'text-emerald-700';
    return 'text-emerald-700';
  }, [order.status, isPendingVerification]);

  return (
    <div className="border border-neutral-200 rounded-md bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-4">
        <div className="font-semibold text-neutral-900">{order.shopName}</div>
        <div className={`text-sm font-semibold ${statusClass}`}>{statusText}</div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* LEFT */}
        <div className="flex-1 min-w-0">
          {/* แสดงรายการสินค้าทั้งหมดพร้อมน้ำหนัก */}
          <div className="space-y-3">
            {order.items?.map((item: any, idx: number) => (
              <div key={`${item.id}_${item.weight}_${idx}`} className="flex gap-3 items-start">
                <div className="h-14 w-14 rounded-md border border-neutral-200 overflow-hidden bg-neutral-50 shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name ?? 'item'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-neutral-400">No img</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-neutral-900 truncate text-sm">{item.name}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-neutral-500">จำนวน: {item.qty}</span>
                    <span className="text-xs text-neutral-500">น้ำหนัก: {item.weight ?? '-'} กก.</span>
                    <span className="text-xs font-medium text-emerald-700">฿{Number(item.price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-neutral-400 mt-2">หมายเลขคำสั่งซื้อ: {order.id}</div>
          {order.status === 'unpaid' && isPendingVerification && (
            <div className="mt-2 text-xs text-amber-700">แนบสลิปแล้ว กำลังรอตรวจสอบ</div>
          )}
          {order.status === 'claim' && order.claim && (
            <div className="mt-2 text-xs text-amber-800">
              เคลม: {order.claim.status}
              {typeof order.claim.refundAmount === 'number'
                ? ` | คืนเงิน: ฿${Number(order.claim.refundAmount).toLocaleString()}`
                : ''}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="border border-neutral-200 rounded-md overflow-hidden">
          <div className="p-4 bg-white flex items-start justify-between gap-4">
            <div className="space-y-1">
              {/* น้ำหนักรวม */}
              <div className="text-xs text-neutral-500">
                น้ำหนักรวม: <span className="font-medium text-neutral-700">{(order.items ?? []).reduce((sum: number, it: any) => sum + (Number(it.weight) || 0) * (Number(it.qty) || 1), 0).toFixed(1)} กก.</span>
              </div>
              {/* ยอดสินค้า */}
              <div className="text-xs text-neutral-500">
                ยอดสินค้า: <span className="font-medium text-neutral-700">฿{Number(order.itemsSubtotal ?? 0).toLocaleString()}</span>
              </div>
              {/* ค่าส่ง */}
              <div className="text-xs text-neutral-500">
                ค่าส่ง: <span className="font-medium text-neutral-700">{Number(order.shippingFee ?? 0) === 0 ? 'ฟรี' : `฿${Number(order.shippingFee).toLocaleString()}`}</span>
              </div>
              {/* ยอดรวมสุทธิ */}
              <div className="text-xs text-neutral-500 pt-1 border-t border-neutral-100">
                รวมคำสั่งซื้อ
              </div>
              <div className="text-2xl font-semibold text-neutral-900">฿{total.toLocaleString()}</div>
            </div>

            <div className="flex flex-col gap-2 items-end">
              {order.status === 'unpaid' ? (
                <>
                  {!isPendingVerification && (
                    <button type="button" onClick={onPayNow}
                      className="h-10 px-4 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800">
                      ชำระเงินตอนนี้
                    </button>
                  )}
                  <button type="button" onClick={() => setOpenCancelPanel((v) => !v)}
                    className="h-10 px-4 rounded-full border border-neutral-300 text-sm hover:bg-neutral-50">
                    ยกเลิกคำสั่งซื้อ
                  </button>
                </>
              ) : (
                <>
                  {/* ✅ ปุ่มยืนยันรับสินค้า เมื่อ delivered */}
                  {order.status === 'delivered' && onConfirmDelivered && (
                    <button
                      type="button"
                      onClick={() => onConfirmDelivered(order.id)}
                      className="h-10 px-4 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                    >
                      ✅ ได้รับสินค้าแล้ว
                    </button>
                  )}

                  {canRequestClaim && (
                    <button type="button"
                      onClick={() => { setOpenClaimPanel((v) => !v); setClaimRefundAmount(total); }}
                      className="h-10 px-4 rounded-full border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-50">
                      ขอเคลม/คืนเงิน
                    </button>
                  )}

                  <button type="button" onClick={() => navigate(`/details/${first?.id ?? ''}`)}
                    className="h-10 px-4 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800">
                    สั่งซื้ออีกครั้ง
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Claim panel */}
          {canRequestClaim && openClaimPanel && (
            <div className="border-t border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-semibold text-amber-900 mb-2">ขอเคลม/คืนเงิน</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-amber-900 mb-1">เหตุผล</div>
                  <select className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none"
                    value={claimReason} onChange={(e) => setClaimReason(e.target.value)}>
                    <option value="สินค้าเสียหาย">สินค้าเสียหาย</option>
                    <option value="คุณภาพไม่ตรงตามที่แจ้ง">คุณภาพไม่ตรงตามที่แจ้ง</option>
                    <option value="ส่งของผิด/ไม่ครบ">ส่งของผิด/ไม่ครบ</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <div className="text-xs text-amber-900 mb-1">ยอดที่ขอคืน (บาท)</div>
                  <input className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none"
                    type="number" min={0} step={1} value={claimRefundAmount}
                    onChange={(e) => setClaimRefundAmount(Number(e.target.value) || 0)} inputMode="numeric" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xs text-amber-900 mb-1">หมายเหตุ (ถ้ามี)</div>
                <textarea className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none"
                  value={claimNote} onChange={(e) => setClaimNote(e.target.value)} rows={3}
                  placeholder="รายละเอียดเพิ่มเติม" />
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setOpenClaimPanel(false)}
                  className="h-10 px-4 rounded-full bg-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-300">
                  ยกเลิก
                </button>
                <button type="button"
                  onClick={() => {
                    onRequestClaim?.({ orderId: order.id, reason: claimReason, note: claimNote || undefined, refundAmount: Math.max(0, Number(claimRefundAmount) || 0) });
                    setOpenClaimPanel(false); setClaimNote(''); setClaimRefundAmount(0); setClaimReason('สินค้าเสียหาย');
                  }}
                  className="h-10 px-4 rounded-full bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700">
                  ยืนยันขอเคลม
                </button>
              </div>
            </div>
          )}

          {/* Cancel panel */}
          {order.status === 'unpaid' && openCancelPanel && (
            <div className="border-t border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm font-semibold text-neutral-900 mb-2">กรุณาเลือกเหตุผลการยกเลิกคำสั่งซื้อ</div>
              <div className="space-y-2">
                {cancelReasons.map((r) => (
                  <label key={r} className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name={`cancel_reason_${order.id}`} checked={reason === r} onChange={() => setReason(r)} className="mt-1" />
                    <div className="text-sm text-neutral-700">{r}</div>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setOpenCancelPanel(false)}
                  className="h-10 px-4 rounded-full bg-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-300">
                  ยังไม่ยกเลิก
                </button>
                <button type="button" onClick={() => { onCancel(reason); setOpenCancelPanel(false); }}
                  className="h-10 px-4 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800">
                  ยกเลิกคำสั่งซื้อ
                </button>
              </div>
            </div>
          )}

          {order.status === 'canceled' && order.cancelReason && (
            <div className="border-t border-neutral-200 bg-white p-4">
              <div className="text-sm text-neutral-600">
                เหตุผลที่ยกเลิก: <span className="font-medium text-neutral-900">{order.cancelReason}</span>
              </div>
            </div>
          )}

          {isClaimOrder && order.claim && (
            <div className="border-t border-neutral-200 bg-white p-4 text-sm text-neutral-700">
              <div className="font-semibold text-neutral-900">สถานะเคลม</div>
              <div className="mt-1">สถานะ: {order.claim.status}</div>
              <div className="mt-1">เหตุผล: {order.claim.reason}</div>
              {order.claim.note && <div className="mt-1">หมายเหตุ: {order.claim.note}</div>}
              {order.claim.rejectReason && <div className="mt-1">เหตุผลที่ปฏิเสธ: {order.claim.rejectReason}</div>}
              {typeof order.claim.refundAmount === 'number' && (
                <div className="mt-1">ยอดคืนเงิน: ฿{Number(order.claim.refundAmount).toLocaleString()}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {order.status !== 'unpaid' && (
        <div className="px-5 py-4 border-t border-neutral-200 flex items-center justify-end">
          <button type="button" onClick={() => navigate(`/details/${first?.id ?? ''}`)}
            className="h-10 px-6 rounded-sm bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800">
            สั่งซื้ออีกครั้ง
          </button>
        </div>
      )}
    </div>
  );
}