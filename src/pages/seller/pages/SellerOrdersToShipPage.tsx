import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { fetchOrdersToShip, updateOrderStatus, clearError } from '@slices/seller-slice';

export default function SellerOrdersToShipPage() {
  const dispatch = useAppDispatch();
  const ordersToShip = useAppSelector((s) => s.seller.ordersToShip);
  const loading = useAppSelector((s) => s.seller.loading);
  const error = useAppSelector((s) => s.seller.error);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [trackingForms, setTrackingForms] = useState<Record<string, { number: string; carrier: string }>>({});

  useEffect(() => {
    dispatch(fetchOrdersToShip());
  }, [dispatch]);

  const handleShip = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      // Update status to shipping
      await dispatch(
        updateOrderStatus({
          orderId,
          status: 'in_delivery',
        })
      ).unwrap();

      // Clear the form
      setTrackingForms((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });

      // Refresh list
      await dispatch(fetchOrdersToShip()).unwrap();
    } catch (err) {
      console.error('Failed to update order status:', err);
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

  const toggleTrackingForm = (orderId: string) => {
    setTrackingForms((prev) => {
      if (prev[orderId]) {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      } else {
        return {
          ...prev,
          [orderId]: { number: '', carrier: 'kerry' },
        };
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">ที่ต้องจัดส่ง</h1>
        <p className="text-sm text-neutral-600 mt-1">
          ออเดอร์ที่ได้รับการชำระเงินแล้ว รอเตรียมส่ง
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
      ) : ordersToShip.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-neutral-600">ไม่มีออเดอร์ที่ต้องจัดส่ง</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersToShip.map((order) => (
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
                  <p className="text-xs text-neutral-500">ชำระแล้ว</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t border-neutral-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">
                    <strong>ชื่อ:</strong> {order.customerName}
                  </p>
                  <p className="text-sm text-neutral-600">
                    <strong>เบอร์:</strong> {order.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 font-medium">ที่อยู่จัดส่ง</p>
                  <p className="text-sm text-neutral-600">{order.address}</p>
                </div>
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

              {/* Shipping Fee & Discount */}
              {(order.shippingFee || order.discount) && (
                <div className="border-t border-neutral-200 pt-4">
                  <div className="text-sm text-neutral-600 space-y-1">
                    {order.shippingFee && (
                      <p>
                        <strong>ค่าส่ง:</strong> {formatCurrency(order.shippingFee)}
                      </p>
                    )}
                    {order.discount && (
                      <p>
                        <strong>ส่วนลด:</strong> -{formatCurrency(order.discount)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tracking Form Toggle */}
              <div className="border-t border-neutral-200 pt-4">
                <button
                  className="text-sm text-primary-600 hover:underline"
                  onClick={() => toggleTrackingForm(order.id)}
                >
                  {trackingForms[order.id] ? '▼ ซ่อนข้อมูลติดตาม' : '▶ เพิ่มข้อมูลติดตาม'}
                </button>

                {trackingForms[order.id] && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-1">
                        บริษัทจัดส่ง
                      </label>
                      <select
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
                        value={trackingForms[order.id]?.carrier || 'kerry'}
                        onChange={(e) =>
                          setTrackingForms((prev) => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], carrier: e.target.value },
                          }))
                        }
                      >
                        <option value="kerry">Kerry Express</option>
                        <option value="thaipost">Thailand Post</option>
                        <option value="flash">Flash Express</option>
                        <option value="j-t">J&T Express</option>
                        <option value="lalamove">Lalamove</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-1">
                        เลขติดตาม (ไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
                        placeholder="เช่น: 1234567890"
                        value={trackingForms[order.id]?.number || ''}
                        onChange={(e) =>
                          setTrackingForms((prev) => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], number: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="border-t border-neutral-200 pt-4">
                <button
                  className="btn btn-primary w-full disabled:opacity-50"
                  onClick={() => handleShip(order.id)}
                  disabled={processingId !== null || !trackingForms[order.id]}
                >
                  {processingId === order.id
                    ? '🚚 กำลังอัปเดต...'
                    : '🚚 ยืนยันการจัดส่ง'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}