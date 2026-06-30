import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderAPI } from '@/services/backend-api';
import { DeliveryTrackingCard } from '@components/delivery/DeliveryTrackingCard';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  weight: number;
  unit: string;
  image: string;
}

interface OrderCheckout {
  fullName: string;
  phone: string;
  address: string;
  deliveryDate: string;
  deliverySlot: string;
  note?: string;
  paymentMethod: string;
  paymentStatus?: string;
  slipBase64?: string;
}

interface OrderDetail {
  id: string;
  status: string;
  items: OrderItem[];
  checkout: OrderCheckout;
  createdAt: string;
  shopName: string;
  itemsSubtotal: number;
  shippingFee: number;
  grandTotal: number;
}

const formatDateTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const unitLabel = (u: string) => {
  if (u === 'kg') return 'กิโลกรัม';
  if (u === 'g') return 'กรัม';
  if (u === 'box') return 'กล่อง';
  return u;
};

const lineTotal = (it: OrderItem) => {
  const weight = Number(it.weight ?? 0);
  const unit = it.unit;

  let kg = 0;
  if (unit === 'kg') kg = weight;
  else if (unit === 'g') kg = weight / 1000;
  else if (unit === 'box') kg = 0;

  const base = kg > 0 ? it.price * kg : it.price;
  return base * it.qty;
};

const statusText = (status: string, paymentStatus?: string) => {
  const st = (status ?? '').toLowerCase();

  if (st === 'unpaid' && paymentStatus === 'pending_verification') return 'รอตรวจสอบสลิป';
  if (st === 'unpaid') return 'รอชำระ';
  if (st === 'waiting_driver') return 'ที่ต้องจัดส่ง';
  if (st === 'in_delivery') return 'กำลังจัดส่ง';
  if (st === 'delivered') return 'จัดส่งสำเร็จ';
  if (st === 'canceled') return 'ยกเลิก';
  if (st === 'paid') return 'ชำระแล้ว';

  return status || '-';
};

function Timeline({ createdAt, status, paymentStatus }: { createdAt: string; status: string; paymentStatus?: string }) {
  const st = (status ?? '').toLowerCase();
  const pay = (paymentStatus ?? 'none').toLowerCase();

  const steps = [
    {
      title: 'สั่งซื้อสินค้า',
      desc: 'ระบบได้รับคำสั่งซื้อเรียบร้อย',
      time: createdAt,
      state: 'done' as const,
    },
    {
      title: 'ยืนยันการชำระเงิน',
      desc:
        st === 'unpaid' && pay === 'pending_verification'
          ? 'รอตรวจสอบสลิป'
          : st === 'unpaid'
            ? 'ยังไม่ได้ชำระเงิน'
            : 'ตรวจสอบแล้ว',
      time: null as string | null,
      state:
        st === 'unpaid'
          ? ('active' as const)
          : ('done' as const),
    },
    {
      title: 'กำลังเตรียมสินค้า',
      desc: st === 'waiting_driver' ? 'ผู้ขายกำลังเตรียมสินค้าเพื่อจัดส่ง' : 'รอดำเนินการ',
      time: null as string | null,
      state: st === 'waiting_driver' ? ('active' as const) : st === 'in_delivery' || st === 'delivered' ? ('done' as const) : ('todo' as const),
    },
    {
      title: 'อยู่ระหว่างการจัดส่ง',
      desc: 'กำลังจัดส่งไปยังปลายทาง',
      time: null as string | null,
      state: st === 'in_delivery' ? ('active' as const) : st === 'delivered' ? ('done' as const) : ('todo' as const),
    },
    {
      title: 'จัดส่งสำเร็จ',
      desc: 'สินค้าได้รับการจัดส่งเรียบร้อย',
      time: null as string | null,
      state: st === 'delivered' ? ('done' as const) : ('todo' as const),
    },
  ];

  const dotClass = (state: 'done' | 'active' | 'todo') => {
    if (state === 'done') return 'bg-emerald-600';
    if (state === 'active') return 'bg-amber-500';
    return 'bg-neutral-300';
  };

  return (
    <div className="card p-6">
      <div className="text-lg font-semibold text-neutral-900">สถานะคำสั่งซื้อ</div>

      <div className="mt-5 space-y-6">
        {steps.map((s, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full ${dotClass(s.state)}`} />
              {idx !== steps.length - 1 && <div className="w-px flex-1 bg-neutral-200 mt-2" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-neutral-900">{s.title}</div>
                {s.time && <div className="text-xs text-neutral-500">{formatDateTime(s.time)}</div>}
              </div>
              <div className="text-sm text-neutral-600 mt-1">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('ไม่พบเลขออเดอร์');
        setLoading(false);
        return;
      }
      
      try {
        const response = await orderAPI.getOrder(id);
        const data = response.data as { order?: OrderDetail } | OrderDetail | undefined;
        const orderData = (data && typeof data === 'object' && 'order' in data) ? data.order : (data as OrderDetail | undefined);
        setOrder(orderData ?? null);
        setError(null);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        console.error('Fetch order error:', err);
        setError(err?.response?.data?.message || err?.message || 'ไม่สามารถโหลดคำสั่งซื้อได้');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold">⏳ กำลังโหลด...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold">❌ ไม่พบคำสั่งซื้อ</div>
        <div className="text-sm text-neutral-500 mt-2">{error || 'อาจถูกลบ หรือคุณเปิดลิงก์ไม่ถูกต้อง'}</div>
        <Link className="inline-block mt-4 text-emerald-700 underline underline-offset-4" to="/profile" state={{ tab: 'orders' }}>
          กลับไปหน้าคำสั่งซื้อ
        </Link>
      </div>
    );
  }

  const itemsSubtotal = Number(order.itemsSubtotal ?? 0);
  const shippingFee = Number(order.shippingFee ?? 0);
  const grandTotal = Number(order.grandTotal ?? (itemsSubtotal + shippingFee));

  const paymentStatus = order.checkout?.paymentStatus;

  return (
    <div className="bg-neutral-50 py-10 min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link className="text-emerald-700 underline underline-offset-4" to="/profile" state={{ tab: 'orders' }}>
            กลับไปหน้าคำสั่งซื้อ
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Items */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200">
                <div className="text-lg font-semibold text-neutral-900">รายการสินค้า</div>
                <div className="text-sm text-neutral-500">{order.items?.length ?? 0} รายการ</div>
              </div>

              <div className="divide-y divide-neutral-200">
                {order.items.map((it: OrderItem) => (
                  <div key={`${it.id}-${it.unit}-${it.weight}`} className="px-5 py-4 flex gap-3">
                    <img
                      src={it.image}
                      alt={it.name}
                      className="h-12 w-12 rounded-lg object-cover border border-neutral-200"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-neutral-900">{it.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {it.weight} {unitLabel(it.unit)} , จำนวน {it.qty}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        ราคา/หน่วย: {Number(it.price ?? 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600">{lineTotal(it).toLocaleString()}</div>
                      <div className="text-xs text-neutral-500">ยอดรวมรายการ</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-neutral-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-neutral-600">ยอดรวมสินค้า</div>
                  <div className="font-semibold text-neutral-900">{itemsSubtotal.toLocaleString()}</div>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <div className="text-neutral-600">ค่าส่ง</div>
                  <div className="font-semibold text-neutral-900">{shippingFee.toLocaleString()}</div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center justify-between">
                  <div className="text-sm text-neutral-600">ยอดสุทธิ</div>
                  <div className="text-lg font-semibold text-red-600">{grandTotal.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {order.status === 'shipped' || order.status === 'waiting_driver' ? (
              <DeliveryTrackingCard orderId={order.id} />
            ) : null}

            <Timeline createdAt={order.createdAt} status={order.status} paymentStatus={paymentStatus} />
          </div>

          {/* RIGHT: Meta */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card p-6">
              <div className="text-lg font-semibold text-neutral-900">ข้อมูลคำสั่งซื้อ</div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">เลขออเดอร์</span>
                  <span className="font-semibold break-all">{order.id}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">วันที่สั่งซื้อ</span>
                  <span className="font-medium">{formatDateTime(order.createdAt)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">ร้าน</span>
                  <span className="font-medium">{order.shopName}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">สถานะ</span>
                  <span className="inline-flex rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold">
                    {statusText(order.status, paymentStatus)}
                  </span>
                </div>

                {paymentStatus && (
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">สถานะชำระเงิน</span>
                    <span className="font-medium">{paymentStatus}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <div className="text-lg font-semibold text-neutral-900">ข้อมูลจัดส่ง</div>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-neutral-500">ผู้รับ</div>
                  <div className="font-medium text-neutral-900">{order.checkout.fullName}</div>
                </div>

                <div>
                  <div className="text-neutral-500">เบอร์โทร</div>
                  <div className="font-medium text-neutral-900">{order.checkout.phone}</div>
                </div>

                <div>
                  <div className="text-neutral-500">ที่อยู่</div>
                  <div className="font-medium text-neutral-900 whitespace-pre-line">{order.checkout.address}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <div className="text-xs text-neutral-500">วันส่ง</div>
                    <div className="font-semibold text-neutral-900">{order.checkout.deliveryDate}</div>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <div className="text-xs text-neutral-500">รอบส่ง</div>
                    <div className="font-semibold text-neutral-900">{order.checkout.deliverySlot}</div>
                  </div>
                </div>

                {order.checkout.note && (
                  <div>
                    <div className="text-neutral-500">หมายเหตุ</div>
                    <div className="font-medium text-neutral-900">{order.checkout.note}</div>
                  </div>
                )}

                <div>
                  <div className="text-neutral-500">ชำระเงิน</div>
                  <div className="font-medium text-neutral-900">
                    QR พร้อมเพย์ (PromptPay)
                  </div>
                </div>

                {order.checkout.paymentMethod === 'promptpay' && order.checkout.slipBase64 && (
                  <div className="pt-3 border-t border-neutral-200">
                    <div className="text-neutral-500 mb-2">สลิปที่แนบ</div>
                    <img
                      src={order.checkout.slipBase64}
                      alt="slip"
                      className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <Link
              to="/"
              className="block text-center bg-emerald-700 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-emerald-800"
            >
              เลือกซื้อเพิ่ม
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}