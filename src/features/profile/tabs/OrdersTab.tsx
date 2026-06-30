import { useMemo, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@stores/index';
import type { RootState } from '@stores/root-reducer';
import { addToCart } from '@/slices/cart-slice';
import { cancelOrder, requestClaim, markDelivered, type OrderItem, type Order } from '@/slices/order-slice';
import { pushNotification } from '@/slices/notification-slice';

import OrderTabButton from '../components/OrderTabButton';
import UnpaidStyleOrderCard from '../components/UnpaidStyleOrderCard';
import ReviewModal from '@/components/reviews/ReviewModal';
import { orderAPI } from '@/services/backend-api';
import { useOrderStatusStream } from '@/hooks/useOrderStatusStream';

type OrderTabKey =
  | 'all' | 'paid' | 'unpaid' | 'pending_verification'
  | 'waiting_driver' | 'picking_up' | 'in_delivery' | 'delivered' | 'completed' | 'claim' | 'canceled';

type ProfileNavState = {
  tab?: 'account' | 'address' | 'password' | 'notification' | 'orders';
  orderTab?: OrderTabKey;
};

type ReviewTarget = { orderId: string; shopId: number; item: OrderItem };

// ✅ ต้องตรงกับใน ReviewModal
function makeProductKey(item: OrderItem): string {
  const sellerProductId = (item as Record<string, unknown>)?.sellerProductId as string | undefined;
  if (sellerProductId && String(sellerProductId).trim()) {
    return `seller:${String(sellerProductId)}`;
  }
  return `base:${Number((item as Record<string, unknown>).id)}`;
}

export default function OrdersTab() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Keep Redux orders for backwards compatibility during migration, but use backend ones primarily
  const reduxOrders = useAppSelector((s: RootState) => s.orders.orders ?? []);
  const reviewed = useAppSelector((s: RootState) => s.reviews?.reviewed ?? [] as string[]);

  const [orderTab, setOrderTab] = useState<OrderTabKey>(() => {
    const st = (location.state ?? {}) as ProfileNavState;
    return st.orderTab ?? 'waiting_driver';
  });
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  // Fetch orders from backend
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!allOrders.length && !reduxOrders.length) setLoading(true);
        const response = await orderAPI.getOrders();
        const raw = response.data?.data || response.data || [];
        // Make sure to match the type expected by components
        setAllOrders(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        // Fallback to Redux orders if backend fails
        setAllOrders(reduxOrders);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    
    // Poll every 15 seconds as fallback
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  // ✅ SSE: real-time status update — refetch immediately on any order status change
  useOrderStatusStream((_orderId, _status) => {
    const fetchOrders = async () => {
      try {
        const response = await orderAPI.getOrders();
        const raw = response.data?.data || response.data || [];
        setAllOrders(Array.isArray(raw) ? raw : []);
      } catch { /* ignore */ }
    };
    fetchOrders();
  });

  const getPaymentStatus = useCallback(
    (o: Order) => (o?.checkout?.paymentStatus ?? o?.paymentStatus ?? 'none') as string,
    []
  );

  const counts = useMemo(() => {
    // If backend hasn't loaded yet and we have redux orders, use those for counts
    const ordersToUse = allOrders.length > 0 ? allOrders : reduxOrders;
    
    const all = ordersToUse.length;
    const paid = ordersToUse.filter((o: Order) => o.status === 'paid').length;
    const pending = ordersToUse.filter(
      (o: Order) => o.status === 'pending_payment' || (o.status === 'unpaid' && getPaymentStatus(o) === 'pending_verification') || (o.paymentStatus === 'pending_verification')
    ).length;
    const unpaid = ordersToUse.filter(
      (o: Order) => o.status === 'unpaid' && getPaymentStatus(o) !== 'pending_verification' && o.paymentStatus !== 'pending_verification'
    ).length;
    const toShip = ordersToUse.filter((o: Order) => o.status === 'waiting_driver' || o.status === 'to_ship').length;
    const pickingUp = ordersToUse.filter((o: Order) => o.status === 'picking_up').length;
    const shipping = ordersToUse.filter((o: Order) => o.status === 'in_delivery' || o.status === 'shipping').length;
    const delivered = ordersToUse.filter((o: Order) => o.status === 'delivered').length;
    const completed = ordersToUse.filter((o: Order) => o.status === 'completed').length;
    const claim = ordersToUse.filter((o: Order) => o.status === 'claim').length;
    const canceled = ordersToUse.filter((o: Order) => o.status === 'canceled').length;
    return { all, paid, unpaid, pending, toShip, pickingUp, shipping, delivered, completed, claim, canceled };
  }, [allOrders, reduxOrders, getPaymentStatus]);

  const filteredOrders = useMemo(() => {
    const ordersToUse = allOrders.length > 0 ? allOrders : reduxOrders;
    
    if (orderTab === 'all') return ordersToUse;
    if (orderTab === 'pending_verification') {
      return ordersToUse.filter(
        (o: Order) => o.status === 'pending_payment' || (o.status === 'unpaid' && getPaymentStatus(o) === 'pending_verification') || (o.paymentStatus === 'pending_verification')
      );
    }
    if (orderTab === 'unpaid') {
      return ordersToUse.filter(
        (o: Order) => o.status === 'unpaid' && getPaymentStatus(o) !== 'pending_verification' && o.paymentStatus !== 'pending_verification'
      );
    }
    // Handle renamed statuses for backward compatibility
    if (orderTab === 'to_ship') {
      return ordersToUse.filter((o: Order) => o.status === 'waiting_driver' || o.status === 'to_ship');
    }
    if (orderTab === 'shipping') {
      return ordersToUse.filter((o: Order) => o.status === 'in_delivery' || o.status === 'shipping');
    }
    return ordersToUse.filter((o: Order) => o.status === orderTab);
  }, [allOrders, reduxOrders, orderTab, getPaymentStatus]);

  const onReorder = (order: Order) => {
    order.items.forEach((it: OrderItem) => {
      dispatch(addToCart({
        id: String(it.id), name: it.name, price: it.price,
        image: it.image, qty: it.qty, shopId: it.shopId,
        shopName: it.shopName, unit: it.unit, weight: it.weight,
      }));
    });
    navigate('/cart');
  };

  const onPayNow = (orderId: string) => {
    navigate('/checkout/promptpay', { state: { mode: 'pay_order', orderId } });
  };

  const onRequestClaim = (payload: { orderId: string; reason: string; note?: string; refundAmount?: number }) => {
    dispatch(requestClaim(payload));
    setOrderTab('claim');
  };

  // ✅ ยืนยันรับสินค้า → completed → แสดงปุ่มรีวิว
  const onConfirmDelivered = async (orderId: string) => {
    try {
      await orderAPI.completeOrder(orderId);
      dispatch(markDelivered({ orderId })); // Use this locally if it exists, or just refetch
      dispatch(pushNotification({
        type: 'system',
        title: '📦 ได้รับสินค้าแล้ว!',
        message: 'กรุณารีวิวสินค้าเพื่อช่วยผู้ซื้อรายอื่นด้วยนะครับ ⭐',
      }));
      setOrderTab('completed'); // wait, there is no completed tab? Let's stay or move to 'delivered'
    } catch (err) {
      console.error('Failed to complete order:', err);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <OrderTabButton active={orderTab === 'all'} onClick={() => setOrderTab('all')}>
            ประวัติทั้งหมด ({counts.all})
          </OrderTabButton>
          <OrderTabButton active={orderTab === 'paid'} onClick={() => setOrderTab('paid')}>
            ชำระแล้ว ({counts.paid})
          </OrderTabButton>
          <OrderTabButton active={orderTab === 'unpaid'} onClick={() => setOrderTab('unpaid')}>
            รอชำระ ({counts.unpaid})
          </OrderTabButton>
          <OrderTabButton active={orderTab === 'pending_verification'} onClick={() => setOrderTab('pending_verification')}>
            รอตรวจสอบสลิป ({counts.pending})
          </OrderTabButton>
          <OrderTabButton active={orderTab === 'waiting_driver'} onClick={() => setOrderTab('waiting_driver')}>
            ที่ต้องจัดส่ง ({counts.toShip})
          </OrderTabButton>
          <OrderTabButton active={orderTab === 'picking_up'} onClick={() => setOrderTab('picking_up')}>
            กำลังรับสินค้า ({counts.pickingUp})
          </OrderTabButton>
          <OrderTabButton active={orderTab === 'in_delivery'} onClick={() => setOrderTab('in_delivery')}>
            กำลังจัดส่ง ({counts.shipping})
          </OrderTabButton>
          <OrderTabButton active={orderTab === 'delivered'} onClick={() => setOrderTab('delivered')}>
            ส่งสำเร็จ ({counts.delivered})
          </OrderTabButton>
          <OrderTabButton active={orderTab === 'completed'} onClick={() => setOrderTab('completed')}>
            เสร็จสิ้น ({counts.completed})
          </OrderTabButton>
          <OrderTabButton active={orderTab === 'claim'} onClick={() => setOrderTab('claim')}>
            เคลมสินค้า ({counts.claim})
          </OrderTabButton>
          <OrderTabButton active={orderTab === 'canceled'} onClick={() => setOrderTab('canceled')}>
            ยกเลิก ({counts.canceled})
          </OrderTabButton>
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin inline-block w-8 h-8 border-[3px] border-emerald-600 border-t-transparent rounded-full mb-3" />
              <div className="text-neutral-500 font-medium">กำลังโหลดข้อมูลคำสั่งซื้อ...</div>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
            ยังไม่มีรายการในแท็บนี้
          </div>
        ) : (
          filteredOrders.map((o: Order) => (
            <div key={o.id} className="space-y-2">
              <UnpaidStyleOrderCard
                order={o}
                onReorder={() => onReorder(o)}
                onPayNow={() => onPayNow(o.id)}
                onCancel={(reason) => dispatch(cancelOrder({ orderId: o.id, reason }))}
                onRequestClaim={onRequestClaim}
                onConfirmDelivered={onConfirmDelivered}
              />

              {/* ✅ ปุ่มรีวิวแต่ละ item เมื่อ completed */}
              {o.status === 'completed' && (
                <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
                  <p className="text-xs font-semibold text-orange-700 mb-2">⭐ รีวิวสินค้าของคุณ</p>
                  <div className="flex flex-col gap-2">
                    {o.items.map((item: OrderItem) => {
                      const productKey = makeProductKey(item);
                      const reviewKey = `${o.id}_${productKey}`;
                      const alreadyReviewed = reviewed.includes(reviewKey);

                      return (
                        <div key={`${item.id}_${item.weight}`} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={item.image ?? '/no-image.png'}
                              alt={item.name}
                              className="h-10 w-10 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
                            />
                            <p className="text-sm text-neutral-700 truncate">{item.name}</p>
                          </div>

                          {alreadyReviewed ? (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                              ✓ รีวิวแล้ว
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setReviewTarget({ orderId: o.id, shopId: o.shopId, item })}
                              className="flex-shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full font-medium transition"
                            >
                              ⭐ รีวิว
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
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