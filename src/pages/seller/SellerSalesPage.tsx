import { useEffect, useMemo, useState } from 'react';
import { shopAPI, sellerAPI } from '@services/backend-api';

type RangeKey = 'all' | 'today' | 'last7' | 'thisMonth';

function money(n: number) {
  return `฿${(Number(n) || 0).toLocaleString()}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfThisMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SellerSalesPage() {
  // ✅ State from Backend API
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [range, setRange] = useState<RangeKey>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // ✅ Fetch seller orders from Backend API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        // ✅ ดึงทุกสถานะ แล้วกรอง client-side ต่อการ (delivered / waiting_driver / in_delivery)
        const res = await shopAPI.getSellerOrders({ limit: 1000 });
        const rawData = res.data;
        const data = Array.isArray(rawData?.data) ? rawData.data
          : Array.isArray(rawData) ? rawData
          : rawData?.orders ?? [];
        
        // เรียงจากใหม่ไปเก่า
        data.sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime());
        
        setOrders(data);
      } catch (err: any) {
        console.error('Failed to load seller orders:', err);
        setError(err?.response?.data?.error || 'ไม่สามารถโหลดออเดอร์ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const delivered = useMemo(() => orders.filter((o: any) => o.status === 'delivered' || o.status === 'completed'), [orders]);
  const toShip = useMemo(() => orders.filter((o: any) => o.status === 'waiting_driver' || o.status === 'confirmed'), [orders]);
  const shipping = useMemo(() => orders.filter((o: any) => o.status === 'in_delivery' || o.status === 'picking_up'), [orders]);

  // ✅ ฟิลเตอร์ตาม deliveredAt (เพราะยอดขายเกิดตอนส่งสำเร็จ)
  const deliveredInRange = useMemo(() => {
    if (range === 'all') return delivered;

    const now = new Date();
    let from: Date;

    if (range === 'today') from = startOfToday();
    else if (range === 'last7') {
      from = new Date(now);
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);
    } else {
      from = startOfThisMonth();
    }

    return delivered.filter((o: any) => {
      const dateStr = o.deliveredAt || o.delivered_at;
      const t = dateStr ? new Date(dateStr).getTime() : NaN;
      if (!Number.isFinite(t)) return false;
      return t >= from.getTime() && t <= now.getTime();
    });
  }, [delivered, range]);

  const grossSales = useMemo(
    () => deliveredInRange.reduce((sum: number, o: any) => sum + Number(o.grandTotal ?? o.grand_total ?? 0), 0),
    [deliveredInRange]
  );

  // ✅ คืนเงินที่ "ทำเสร็จแล้ว" เท่านั้น
  const refundedAmount = useMemo(() => {
    return deliveredInRange.reduce((sum: number, o: any) => {
      const c = o.claim;
      if (!c) return sum;
      if (c.status !== 'refunded') return sum;
      return sum + Math.max(0, Number(c.refundAmount ?? 0) || 0);
    }, 0);
  }, [deliveredInRange]);

  const netSales = Math.max(0, grossSales - refundedAmount);

  const totalToShip = useMemo(() => toShip.reduce((sum: number, o: any) => sum + Number(o.grandTotal ?? o.grand_total ?? 0), 0), [toShip]);
  const totalShipping = useMemo(() => shipping.reduce((sum: number, o: any) => sum + Number(o.grandTotal ?? o.grand_total ?? 0), 0), [shipping]);

  const rangeLabel =
    range === 'all' ? 'ทั้งหมด' : range === 'today' ? 'วันนี้' : range === 'last7' ? '7 วันล่าสุด' : 'เดือนนี้';

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-pulse text-lg font-medium text-emerald-700">⏳ กำลังโหลดข้อมูลยอดขาย...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="text-xl font-semibold text-neutral-900">ยอดขาย</div>
        <div className="mt-3 card bg-red-50 border border-red-200 text-red-700 p-3 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xl font-semibold text-neutral-900">ยอดขาย</div>
      <div className="mt-2 text-sm text-neutral-600">
        ยอดขายนับเมื่อ "จัดส่งสำเร็จ (delivered)" เท่านั้น (สามารถหักคืนเงินได้)
      </div>

      {/* ฟิลเตอร์ */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {([
          { key: 'all', label: 'ทั้งหมด' },
          { key: 'today', label: 'วันนี้' },
          { key: 'last7', label: '7 วันล่าสุด' },
          { key: 'thisMonth', label: 'เดือนนี้' },
        ] as const).map((x) => {
          const active = range === x.key;
          return (
            <button
              key={x.key}
              type="button"
              onClick={() => setRange(x.key)}
              className={[
                'btn',
                active ? 'btn-primary' : '',
              ].join(' ')}
            >
              {x.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs text-emerald-800">ยอดขายสุทธิ ({rangeLabel})</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-900">{money(netSales)}</div>
          <div className="mt-1 text-xs text-emerald-800">ออเดอร์ส่งสำเร็จ: {deliveredInRange.length} รายการ</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-xs text-neutral-600">ยอดขายรวมก่อนหักคืนเงิน ({rangeLabel})</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{money(grossSales)}</div>
          <div className="mt-1 text-xs text-neutral-600">คืนเงินแล้ว: {money(refundedAmount)}</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-600">รอจัดส่ง (to_ship)</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{money(totalToShip)}</div>
          <div className="mt-1 text-xs text-neutral-600">ออเดอร์: {toShip.length} รายการ</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-600">กำลังจัดส่ง (shipping)</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{money(totalShipping)}</div>
          <div className="mt-1 text-xs text-neutral-600">ออเดอร์: {shipping.length} รายการ</div>
        </div>
      </div>

      {/* ประวัติการขาย */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">ประวัติการขาย (สำเร็จ/ยกเลิก)</h2>
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          {deliveredInRange.length === 0 && orders.filter(o => o.status === 'cancelled').length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              ไม่มีประวัติออเดอร์ในช่วงเวลานี้
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-xs">Order ID</th>
                    <th className="px-4 py-3 font-medium text-xs">ผู้ซื้อ</th>
                    <th className="px-4 py-3 font-medium text-xs">ยอดรวม</th>
                    <th className="px-4 py-3 font-medium text-xs">สถานะ</th>
                    <th className="px-4 py-3 font-medium text-xs">วันที่</th>
                    <th className="px-4 py-3 font-medium text-xs text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders
                    .filter((o: any) => o.status === 'delivered' || o.status === 'completed' || o.status === 'cancelled')
                    .slice(0, 15) // จำกัดแค่ 15 รายการเพื่อไม่ให้รก
                    .map((o: any) => (
                      <tr key={o.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-neutral-500">{o.id.substring(0, 8)}</td>
                        <td className="px-4 py-3 font-medium text-neutral-900">{o.customerName || '-'}</td>
                        <td className="px-4 py-3 font-medium text-emerald-700">{money(o.grandTotal ?? o.grand_total ?? 0)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                            o.status === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-200' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}>
                            {o.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'สำเร็จ'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500">
                          {new Date(o.createdAt || o.created_at).toLocaleString('th-TH', { 
                            dateStyle: 'short', timeStyle: 'short' 
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="text-emerald-600 hover:text-emerald-800 text-xs font-medium border border-emerald-200 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100 text-center text-xs text-neutral-500">
                แสดงประวัติการขายล่าสุด (สูงสุด 15 รายการ)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900">รายละเอียดออเดอร์</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-neutral-500 font-mono">Order ID</div>
                  <div className="font-bold text-neutral-900">{selectedOrder.id}</div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-lg ${
                    selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedOrder.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'ส่งสำเร็จ'}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 mb-4 border border-neutral-100">
                <div className="text-sm font-bold text-neutral-900 mb-2">ข้อมูลผู้ซื้อ</div>
                <div className="text-sm text-neutral-700">
                  <span className="font-medium">{selectedOrder.customerName || '-'}</span>
                  <div className="text-neutral-500 mt-1">เบอร์โทร: {selectedOrder.phone || '-'}</div>
                  <div className="mt-2 text-xs text-neutral-600 bg-white p-2 border border-neutral-200 rounded">{selectedOrder.address || '-'}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-neutral-900 mb-2">รายการสินค้า</div>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm py-2 border-b border-neutral-100 last:border-0">
                      <div className="text-neutral-800 font-medium">
                        {item.name}
                        <div className="text-xs text-neutral-500 font-normal">฿{Number(item.price || 0)} x {Number(item.quantity || item.qty || 1)}</div>
                      </div>
                      <div className="font-semibold text-neutral-900">
                        {money(Number(item.price || 0) * Number(item.quantity || item.qty || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>ค่าสินค้าสุทธิ</span>
                  <span>{money(selectedOrder.itemsSubtotal || selectedOrder.items_subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>ค่าจัดส่ง</span>
                  <span>{money(selectedOrder.shippingFee || selectedOrder.shipping_fee || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-emerald-700 mt-2">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span>{money(selectedOrder.grandTotal || selectedOrder.grand_total || 0)}</span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end rounded-b-2xl">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-sm font-semibold rounded-lg transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}