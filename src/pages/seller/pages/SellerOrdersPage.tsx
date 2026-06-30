import React, { useMemo, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@stores/index';
import type { SellerOrder } from '@services/api/seller-api';
import { deliveryJobAPI } from '@services/api';
import { fetchSellerOrders, updateOrderStatus } from '@slices/seller-slice';

type SellerOrderItem = SellerOrder['items'][number] & { qty?: number };
type SellerOrderWithExtras = SellerOrder & {
  items_subtotal?: number;
  note?: string;
  slip_base64?: string;
  grand_total?: number;
};
import { pushNotification } from '@/slices/notification-slice';
import { useOrderStatusStream } from '@/hooks/useOrderStatusStream';
import { SellerDeliveryStatusCard } from '@components/seller/SellerDeliveryStatusCard';

function formatDateTime(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusMeta(status: string) {
  if (status === 'unpaid') return { text: 'ยังไม่ชำระ', cls: 'bg-yellow-100 text-yellow-800', largeCls: 'bg-yellow-50 border-2 border-yellow-300' };
  if (status === 'pending_payment') return { text: 'รอตรวจสลิป', cls: 'bg-amber-100 text-amber-700', largeCls: 'bg-amber-50 border-2 border-amber-300' };
  if (status === 'paid') return { text: 'ชำระแล้ว', cls: 'bg-emerald-100 text-emerald-700', largeCls: 'bg-emerald-50 border-2 border-emerald-400' };
  if (status === 'waiting_driver') return { text: 'ต้องจัดส่ง', cls: 'bg-sky-100 text-sky-700', largeCls: 'bg-sky-50 border-2 border-sky-400' };
  if (status === 'picking_up') return { text: 'คนส่งกำลังรับสินค้า', cls: 'bg-sky-100 text-sky-700', largeCls: 'bg-sky-50 border-2 border-sky-400' };
  if (status === 'shipped') return { text: 'กำลังจัดส่ง', cls: 'bg-sky-100 text-sky-700', largeCls: 'bg-sky-50 border-2 border-sky-400' };
  if (status === 'completed') return { text: 'ส่งแล้ว', cls: 'bg-green-100 text-green-700', largeCls: 'bg-green-50 border-2 border-green-400' };
  if (status === 'claim') return { text: 'เคลม', cls: 'bg-purple-100 text-purple-700', largeCls: 'bg-purple-50 border-2 border-purple-400' };
  if (status === 'cancelled') return { text: 'ยกเลิก', cls: 'bg-red-100 text-red-700', largeCls: 'bg-red-50 border-2 border-red-400' };
  return { text: status, cls: 'bg-neutral-100 text-neutral-600', largeCls: 'bg-neutral-50 border-2 border-neutral-300' };
}

function calcItemsCount(order: SellerOrderWithExtras) {
  return (order.items ?? []).reduce((sum, it: SellerOrderItem) => sum + Number(it.quantity ?? it.qty ?? 0), 0);
}

function calcOrderTotal(order: SellerOrderWithExtras) {
  return Number(order.totalPrice ?? order.grand_total ?? 0);
}

function OrderModal({
  open,
  order,
  onClose,
}: {
  open: boolean;
  order: SellerOrderWithExtras | null;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const sellerProfile = useAppSelector((s) => s.seller.profile);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  if (!open || !order) return null;

  const s = statusMeta(order.status);
  const total = calcOrderTotal(order);

  const canShip = order.status === 'waiting_driver';
  const canDelivered = order.status === 'shipped';
  const canCancel = order.status !== 'cancelled' && order.status !== 'completed';

  const notifyBuyer = (title: string, message: string) => {
    dispatch(
      pushNotification({
        type: 'order',
        title,
        message,
        link: { to: '/profile', state: { tab: 'orders' } },
      })
    );
  };

  const onSetShipping = async () => {
    if (!canShip) return;
    await dispatch(updateOrderStatus({ orderId: order.id, status: 'shipped' }));
    notifyBuyer('ออเดอร์ถูกจัดส่งแล้ว', `คำสั่งซื้อ ${order.id} ถูกอัปเดตเป็น “กำลังจัดส่ง”`);
    dispatch(fetchSellerOrders());
    onClose();
  };

  const onSetDelivered = async () => {
    if (!canDelivered) return;
    await dispatch(updateOrderStatus({ orderId: order.id, status: 'completed' }));
    notifyBuyer('ออเดอร์ส่งสำเร็จ', `คำสั่งซื้อ ${order.id} ถูกอัปเดตเป็น “ส่งแล้ว”`);
    dispatch(fetchSellerOrders());
    onClose();
  };

  const onCancel = async () => {
    if (!canCancel) return;
    await dispatch(updateOrderStatus({ orderId: order.id, status: 'cancelled' }));
    notifyBuyer('ออเดอร์ถูกยกเลิก', `คำสั่งซื้อ ${order.id} ถูกยกเลิกโดยผู้ขาย`);
    dispatch(fetchSellerOrders());
    onClose();
  };

  const onCreateDeliveryJob = async () => {
    if (!canShip || !sellerProfile) return;
    
    try {
      setLoadingDelivery(true);
      
      // Create delivery job
      await deliveryJobAPI.createJob({
        orderId: order.id,
        pickupAddress: sellerProfile.addressLine || '',
        deliveryAddress: order.address || '',
        buyerName: order.customerName || '',
        buyerPhone: order.phone || '',
        totalPrice: total,
        shippingFee: order.shippingFee,
      });
      
      // Update order status to shipped
      await dispatch(updateOrderStatus({ orderId: order.id, status: 'shipped' }));
      
      notifyBuyer('✅ ส่งงานให้ Courier แล้ว', `คำสั่งซื้อ ${order.id} ถูกส่งให้บริษัทจัดส่งแล้ว`);
      dispatch(
        pushNotification({
          type: 'system',
          title: '✅ ส่งสำเร็จ',
          message: `ส่งงานออเดอร์ ${order.id} ให้ Courier แล้ว`,
        })
      );
      dispatch(fetchSellerOrders());
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ ส่งของไม่สำเร็จ',
          message: err.message || 'เกิดข้อผิดพลาดในการสร้าง Delivery Job',
        })
      );
    } finally {
      setLoadingDelivery(false);
    }
  };

  const itemsSubtotal = order.items_subtotal ?? (total - (order.shippingFee ?? 0));

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-start justify-between p-5 border-b border-neutral-200 bg-white">
            <div>
              <div className="text-lg font-bold text-neutral-900 mb-2">📦 รายละเอียดออเดอร์</div>
              <div className="text-sm text-neutral-600 font-mono mb-3">
                Order ID: <span className="font-bold text-neutral-900">{order.id}</span>
              </div>
              <div className="text-xs text-neutral-500 mb-3">
                📅 {formatDateTime(order.createdAt)}
              </div>
              <div>
                <span className={`inline-block text-sm font-bold px-4 py-2 rounded-lg ${s.largeCls}`}>{s.text}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-bold text-lg"
              aria-label="close"
            >
              ×
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
            <div className="rounded-xl border border-neutral-200 p-4">
              <div className="text-sm font-semibold text-neutral-900 mb-2">ที่อยู่จัดส่ง</div>

              <div className="text-sm text-neutral-700">
                <div className="font-medium">{order.customerName}</div>
                <div className="text-neutral-600">{order.phone}</div>
                <div className="mt-2 whitespace-pre-line">{order.address}</div>

                {order.note && (
                  <div className="mt-2 text-xs text-neutral-500">หมายเหตุ: {order.note}</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 p-4">
              <div className="text-sm font-semibold text-neutral-900 mb-2">สรุปยอด</div>

              <div className="text-sm text-neutral-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600">ค่าสินค้า</span>
                  <span>฿{Number(itemsSubtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">ค่าส่ง</span>
                  <span>฿{Number(order.shippingFee ?? 0).toLocaleString()}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-neutral-200 flex justify-between font-semibold">
                  <span>รวมทั้งสิ้น</span>
                  <span>฿{Number(total).toLocaleString()}</span>
                </div>

                <div className="pt-2 text-xs text-neutral-500">
                  วิธีชำระเงิน: {(order.paymentMethod || '-').toUpperCase()}
                  {order.paymentMethod === 'promptpay' && order.paymentStatus ? (
                    <> • สถานะการชำระ: {order.paymentStatus}</>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 rounded-xl border border-neutral-200 p-4">
              <div className="text-sm font-semibold text-neutral-900 mb-3">รายการสินค้า</div>

              <div className="space-y-2">
                {(order.items ?? []).map((it: SellerOrderItem, idx: number) => (
                  <div
                    key={`${it.productId ?? idx}-${idx}`}
                    className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-900 truncate">{it.name}</div>
                      <div className="text-xs text-neutral-500">
                        ฿{Number(it.price ?? 0).toLocaleString()} • จำนวน {Number(it.quantity ?? it.qty ?? 0)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-neutral-900">
                      ฿{Number(Number(it.price ?? 0) * Number(it.quantity ?? it.qty ?? 0)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {order.slip_base64 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold text-neutral-900 mb-2">สลิป</div>
                  <img
                    src={order.slip_base64}
                    alt="slip"
                    className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white shadow-sm"
                  />
                </div>
              )}
            </div>

            {order.status === 'shipped' && (
              <div className="mt-4">
                <SellerDeliveryStatusCard
                  orderId={order.id}
                  onCancelJob={async () => {
                    try {
                      // Update order status back to waiting_driver
                      await dispatch(updateOrderStatus({ orderId: order.id, status: 'waiting_driver' }));
                      
                      dispatch(
                        pushNotification({
                          type: 'system',
                          title: '✅ ยกเลิกงานส่งแล้ว',
                          message: `ออเดอร์ ${order.id} ถูกส่งคืนไปยัง "ต้องจัดส่ง"`,
                        })
                      );
                      
                      dispatch(fetchSellerOrders());
                      onClose();
                    } catch (error: unknown) {
                      const err = error as { response?: { data?: { message?: string } }; message?: string };
                      dispatch(
                        pushNotification({
                          type: 'error',
                          title: '❌ ยกเลิกไม่สำเร็จ',
                          message: err.message || 'เกิดข้อผิดพลาดในการยกเลิกงาน',
                        })
                      );
                    }
                  }}
                />
              </div>
            )}
          </div>

          <div className="p-5 border-t border-neutral-200 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between bg-white">
            <div className="text-xs text-neutral-500">จัดการสถานะ:</div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"                onClick={onCreateDeliveryJob}
                disabled={!canShip || loadingDelivery}
                className={[
                  'text-xs px-3 py-2 rounded-lg border font-medium',
                  canShip && !loadingDelivery
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-neutral-100 text-neutral-300 cursor-not-allowed',
                ].join(' ')}
              >
                {loadingDelivery ? '⏳ กำลังส่ง...' : '🚚 ส่งของ'}
              </button>

              <button
                type="button"                onClick={onSetShipping}
                disabled={!canShip}
                className={[
                  'text-xs px-3 py-2 rounded-lg border',
                  canShip
                    ? 'border-neutral-200 hover:bg-neutral-50'
                    : 'border-neutral-100 text-neutral-300 cursor-not-allowed',
                ].join(' ')}
              >
                ตั้งเป็น “กำลังจัดส่ง”
              </button>

              <button
                type="button"
                onClick={onSetDelivered}
                disabled={!canDelivered}
                className={[
                  'text-xs px-3 py-2 rounded-lg border',
                  canDelivered
                    ? 'border-neutral-200 hover:bg-neutral-50'
                    : 'border-neutral-100 text-neutral-300 cursor-not-allowed',
                ].join(' ')}
              >
                ตั้งเป็น “ส่งแล้ว”
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={!canCancel}
                className={[
                  'text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600',
                  canCancel ? 'hover:bg-red-50' : 'opacity-40 cursor-not-allowed',
                ].join(' ')}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SellerOrdersPage() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector((s) => s.seller.orders ?? []);
  const loading = useAppSelector((s) => s.seller.loading);

  useEffect(() => {
    dispatch(fetchSellerOrders());
  }, [dispatch]);

  // ✅ SSE: เห็นออเดอร์ใหม่ทันทีเมื่อ Admin approve หรือ Courier เปลี่ยนสถานะ
  useOrderStatusStream(() => {
    dispatch(fetchSellerOrders());
  });

  // Filter & Sort State
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<'all' | '7d' | '30d' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    let result = [...orders].filter(o => o.status !== 'delivered' && o.status !== 'completed' && o.status !== 'cancelled');

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter((o) => o.status === filterStatus);
    }

    // Date filter
    const now = new Date();
    if (filterDate !== 'all') {
      const daysAgo =
        filterDate === '7d'
          ? 7
          : filterDate === '30d'
            ? 30
            : 0;
      
      if (daysAgo > 0) {
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        result = result.filter((o) => new Date(o.createdAt) >= cutoffDate);
      }
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.id || '').toLowerCase().includes(q) ||
          (o.phone || '').includes(q)
      );
    }

    // Sort active orders: oldest first or latest first? Let's keep it default (usually from API order, but we can sort by date)
    // Generally active orders are sorted latest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [orders, filterStatus, filterDate, searchQuery]);

  // Bulk Actions
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    setShowBulkActions(newSet.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkMarkShipping = async () => {
    for (const orderId of Array.from(selectedIds)) {
      const order = orders.find((o) => o.id === orderId);
      if (order?.status === 'waiting_driver') {
        await dispatch(updateOrderStatus({ orderId, status: 'shipped' }));
      }
    }
    dispatch(
      pushNotification({
        type: 'system',
        title: '✅ เปลี่ยนสถานะสำเร็จ',
        message: `อัปเดตออเดอร์เป็น "กำลังจัดส่ง"`,
      })
    );
    setSelectedIds(new Set());
    setShowBulkActions(false);
    dispatch(fetchSellerOrders());
  };

  const selectedOrder = useMemo(() => {
    if (!selectedId) return null;
    return orders.find((o) => o.id === selectedId) ?? null;
  }, [orders, selectedId]);

  const openOrder = (o: SellerOrder) => {
    setSelectedId(o.id);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setSelectedId('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">📦 ออเดอร์</h1>
        <p className="text-neutral-600 mt-1">จัดการคำสั่งซื้อและการจัดส่งสินค้า</p>
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="text-lg font-bold text-neutral-900">
            ออเดอร์ทั้งหมด ({orders.length})
          </div>

          {/* Search & Filters */}
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, ID, เบอร์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 md:flex-none rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none"
            >
              <option value="all">สถานะ: ทั้งหมด</option>
              <option value="unpaid">ยังไม่ชำระ</option>
              <option value="paid">ชำระแล้ว</option>
              <option value="waiting_driver">ต้องจัดส่ง</option>
              <option value="picking_up">คนส่งกำลังรับสินค้า</option>
              <option value="shipped">กำลังจัดส่ง</option>
              <option value="completed">ส่งแล้ว</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value as typeof filterDate)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none"
            >
              <option value="all">เวลา: ทั้งหมด</option>
              <option value="7d">7 วันที่ผ่านมา</option>
              <option value="30d">30 วันที่ผ่านมา</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm font-medium text-blue-900">
                เลือก {selectedIds.size} / {filteredOrders.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkMarkShipping}
                className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                ✈️ เปลี่ยนเป็นจัดส่ง
              </button>
              <button
                onClick={() => {
                  setSelectedIds(new Set());
                  setShowBulkActions(false);
                }}
                className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-neutral-600">
            กำลังโหลดข้อมูล...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-lg">📭 ไม่มีออเดอร์</p>
            <p className="text-sm mt-1">ลองปรับตัวกรองหรือค้นหาใหม่</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((o) => {
              const total = calcOrderTotal(o);
              const itemsCount = calcItemsCount(o);
              const s = statusMeta(o.status);

              const statusSteps = [
                { status: 'unpaid', label: 'รอชำระ', icon: '💳' },
                { status: 'paid', label: 'ชำระแล้ว', icon: '✓' },
                { status: 'waiting_driver', label: 'รอจัดส่ง', icon: '📦' },
                { status: 'picking_up', label: 'รับสินค้า', icon: '🚗' },
                { status: 'shipped', label: 'จัดส่ง', icon: '✈️' },
                { status: 'completed', label: 'ส่งแล้ว', icon: '✅' },
              ];

              const currentStepIndex = statusSteps.findIndex((st) => st.status === o.status);

              return (
                <div
                  key={o.id}
                  className="border border-neutral-200 rounded-xl p-5 hover:shadow-lg hover:border-emerald-300 transition bg-white"
                >
                  {/* Header with Status Badge */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="w-5 h-5 rounded cursor-pointer mt-0.5 accent-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg text-neutral-900">
                          {o.customerName || 'ลูกค้าไม่ระบุชื่อ'}
                        </div>
                        <div className="text-sm text-neutral-600 font-mono mt-1">
                          Order ID: {o.id}
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-bold text-sm flex-shrink-0 whitespace-nowrap ${s.largeCls}`}>
                      {s.text}
                    </div>
                  </div>

                  {/* Status Timeline - Improved */}
                  <div className="mb-5 flex items-center justify-between text-xs gap-1 overflow-x-auto pb-2">
                    {statusSteps.map((step, idx) => (
                      <React.Fragment key={step.status}>
                        <div
                          className={`flex flex-col items-center flex-shrink-0 ${
                            idx <= currentStepIndex ? 'text-emerald-600' : 'text-neutral-400'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ring-2 ${
                              idx <= currentStepIndex
                                ? 'bg-emerald-100 ring-emerald-400'
                                : 'bg-neutral-100 ring-neutral-300'
                            }`}
                          >
                            {step.icon}
                          </div>
                          <span className="text-[11px] font-medium mt-1.5 text-center whitespace-nowrap leading-tight">{step.label}</span>
                        </div>
                        {idx < statusSteps.length - 1 && (
                          <div
                            className={`flex-1 h-1 mx-0.5 flex-shrink-0 min-w-6 rounded-full ${
                              idx < currentStepIndex ? 'bg-emerald-300' : 'bg-neutral-300'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Order Details - Grid Layout */}
                  <div className="grid grid-cols-4 gap-4 mb-5 pb-5 border-b border-neutral-200">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">จำนวน</span>
                      <div className="text-lg font-bold text-neutral-900 mt-1">{itemsCount} ชิ้น</div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">ยอดรวม</span>
                      <div className="text-lg font-bold text-emerald-700 mt-1">฿{Number(total).toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">เบอร์โทร</span>
                      <div className="text-lg font-bold text-neutral-900 mt-1">{o.phone || '-'}</div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">วิธีชำระ</span>
                      <div className="mt-1">
                        {o.paymentMethod === 'promptpay' ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-sm"
                            style={{
                              backgroundColor: o.paymentStatus === 'paid' ? '#ecfdf5' : '#fef3c7',
                              color: o.paymentStatus === 'paid' ? '#065f46' : '#92400e',
                              border: o.paymentStatus === 'paid' ? '1px solid #6ee7b7' : '1px solid #fcd34d'
                            }}>
                            {o.paymentStatus === 'paid' ? '✓' : '!'} {(o.paymentMethod || '').toUpperCase()}
                          </div>
                        ) : (
                          <div className="font-bold text-sm text-neutral-900">{(o.paymentMethod || 'N/A').toUpperCase()}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-neutral-500 mb-4">
                    📅 {formatDateTime(o.createdAt)}
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => openOrder(o)}
                    className="w-full px-4 py-3 text-base font-bold rounded-lg transition transform hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: '#1a5c38',
                      color: '#ffffff',
                      border: '2px solid #1a5c38'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0f3d24';
                      e.currentTarget.style.borderColor = '#0f3d24';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a5c38';
                      e.currentTarget.style.borderColor = '#1a5c38';
                    }}
                  >
                    ดูรายละเอียดและจัดการ →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OrderModal open={open} order={selectedOrder} onClose={close} />
    </div>
  );
}