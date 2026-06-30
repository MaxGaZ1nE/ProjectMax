import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearLastPlacedOrders } from '@/slices/order-slice';
import { selectLastPlacedOrders } from '@/slices/order-selectors';
import type { OrderStatus } from '@/slices/order-slice';

const STATUS_STEPS: OrderStatus[] = ['waiting_driver', 'in_delivery', 'delivered'];

const statusLabel: Record<string, string> = {
  pending_payment: 'รอตรวจสลิป',
  unpaid: 'รอชำระเงิน',
  paid: 'ชำระแล้ว',
  waiting_driver: 'รอจัดส่ง',
  in_delivery: 'กำลังจัดส่ง',
  delivered: 'ส่งสำเร็จ',
  claim: 'แจ้งปัญหา',
  canceled: 'ยกเลิก',
};

const slotLabel: Record<string, string> = {
  morning: 'รอบเช้า (09:00–12:00)',
  afternoon: 'รอบบ่าย (13:00–17:00)',
};

const paymentLabel: Record<string, string> = {
  promptpay: 'QR พร้อมเพย์ (PromptPay)',
  // ✅ COD removed - only PromptPay available
};

function StatusBar({ status }: { status: OrderStatus }) {
  const idx = STATUS_STEPS.indexOf(status);
  const isCanceled = status === 'canceled';
  const isUnpaidFlow = status === 'pending_payment' || status === 'unpaid' || status === 'paid';

  if (isCanceled) {
    return (
      <div className="mt-3">
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-red-100 text-red-700 font-medium">
          ✕ ยกเลิกคำสั่งซื้อแล้ว
        </span>
      </div>
    );
  }

  if (isUnpaidFlow) {
    return (
      <div className="mt-3">
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 font-medium">
          ⏳ {status === 'paid' ? 'ชำระแล้ว — รอร้านค้ายืนยัน' : status === 'pending_payment' ? 'รอตรวจสลิป' : 'รอชำระเงิน'}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= idx;
          const active = i === idx;
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2',
                  active ? 'bg-emerald-600 border-emerald-600 text-white'
                    : done ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                    : 'bg-white border-neutral-300 text-neutral-400',
                ].join(' ')}>
                  {done && !active ? '✓' : i + 1}
                </div>
                <span className={[
                  'text-[11px] text-center leading-tight w-16',
                  active ? 'text-emerald-700 font-semibold'
                    : done ? 'text-emerald-600'
                    : 'text-neutral-400',
                ].join(' ')}>
                  {statusLabel[step]}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={[
                  'h-0.5 flex-1 mx-1 mb-5',
                  i < idx ? 'bg-emerald-400' : 'bg-neutral-200',
                ].join(' ')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lastOrders = useSelector(selectLastPlacedOrders);

  const handleGoOrders = () => {
    dispatch(clearLastPlacedOrders());
    navigate('/orders');
  };

  return (
    <div className="bg-neutral-50 py-10 min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">สั่งซื้อสำเร็จ!</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {lastOrders.length > 0
              ? `ได้รับคำสั่งซื้อ ${lastOrders.length} รายการแล้ว`
              : 'ขอบคุณที่ใช้บริการ'}
          </p>
        </div>

        {lastOrders.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-neutral-500 text-sm">ไม่มีออเดอร์ล่าสุด</p>
            <button onClick={handleGoOrders} className="btn btn-primary mt-4 text-sm">
              ดูรายการคำสั่งซื้อทั้งหมด
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {lastOrders.map((o) => {
              const paymentStatus = o.checkout?.paymentStatus;
              const itemsSubtotal = Number(o.itemsSubtotal ?? 0);
              const shippingFee = Number(o.shippingFee ?? 0);
              const grandTotal = Number(o.grandTotal ?? itemsSubtotal + shippingFee);

              return (
                <div key={o.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">

                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
                    <div>
                      <div className="text-xs text-neutral-500">คำสั่งซื้อ</div>
                      <div className="text-sm font-semibold text-neutral-900 mt-0.5">{o.id}</div>
                    </div>
                    <span className={[
                      'text-xs px-2.5 py-1 rounded-full font-semibold',
                      o.status === 'canceled' ? 'bg-red-100 text-red-700'
                        : o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700'
                        : (o.status === 'unpaid' || o.status === 'pending_payment') ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700',
                    ].join(' ')}>
                      {statusLabel[o.status] ?? o.status}
                    </span>
                  </div>

                  <div className="px-5 py-4 space-y-5">

                    {/* Status bar */}
                    <StatusBar status={o.status} />

                    {/* Items */}
                    <div>
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">สินค้า</div>
                      <div className="divide-y divide-neutral-100">
                        {o.items.map((it: any) => {
                          const w = Number(it.weight ?? 0);
                          const q = Number(it.qty ?? it.quantity ?? 1);
                          const p = Number(it.price ?? 0);
                          const lineTotal = (w > 0 ? p * w : p) * q;
                          const displayUnit = it.unit || 'Kg';

                          return (
                            <div key={`${it.id}-${w}`} className="flex items-center gap-3 py-2">
                              {it.image && (
                                <img src={it.image} alt={it.name}
                                  className="h-10 w-10 rounded-lg object-cover border border-neutral-200 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-neutral-900 truncate">{it.name}</div>
                                <div className="text-xs text-neutral-500">
                                  {w} {displayUnit}
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-neutral-900 flex-shrink-0">
                                ฿{lineTotal.toLocaleString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price summary */}
                    <div className="border-t border-neutral-200 pt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between text-neutral-500">
                        <span>ยอดสินค้า</span>
                        <span>฿{itemsSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-neutral-500">
                        <span>ค่าส่ง</span>
                        <span>฿{shippingFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-neutral-900 text-base pt-1 border-t border-neutral-200">
                        <span>ยอดสุทธิ</span>
                        <span className="text-red-600">฿{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Delivery + Payment info */}
                    <div className="border-t border-neutral-200 pt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">ที่อยู่จัดส่ง</div>
                        <div className="text-neutral-800 leading-snug">{o.checkout.address}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">วันจัดส่ง</div>
                        <div className="text-neutral-800">{o.checkout.deliveryDate}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{slotLabel[o.checkout.deliverySlot]}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">ชำระเงิน</div>
                        <div className="text-neutral-800">{paymentLabel[o.checkout.paymentMethod]}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">ร้านค้า</div>
                        <div className="text-neutral-800">{o.shopName}</div>
                      </div>
                    </div>

                    {/* Link to detail */}
                    <Link
                      to={`/orders/${o.id}`}
                      onClick={() => dispatch(clearLastPlacedOrders())}
                      className="block text-center text-sm text-emerald-700 underline underline-offset-4 pt-1"
                    >
                      ดูรายละเอียดคำสั่งซื้อ
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={handleGoOrders} className="btn btn-primary flex-1 text-sm">
                ดูคำสั่งซื้อทั้งหมด
              </button>
              <Link to="/" className="btn flex-1 text-sm text-center">
                ช้อปปิ้งต่อ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}