import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@stores/index';
import { clearCart } from '@/slices/cart-slice';
import { placeOrder, clearLastPlacedOrders, submitPromptPaySlip } from '@/slices/order-slice';
import type { CartItem } from '@/slices/cart-slice';

// ✅ cart persistence utility
import { clearPersistedCart } from '@/utils/cart-persistence';

import generatePayload from 'promptpay-qr';
import * as QRCode from 'qrcode';

import { pushNotification } from '@/slices/notification-slice';

// ✅ stock helpers
import { checkSellerStock, deductSellerStock } from '@/features/seller-products/seller-products-storage';

type Group = {
  shopId: number;
  shopName: string;
  items: CartItem[];
  total: number; // subtotal ต่อร้าน (ไม่รวมส่ง)
};

type DeliverySlot = 'morning' | 'afternoon';

type CheckoutDraft = {
  fullName: string;
  phone: string;
  address: string;
  note: string;
  paymentMethod: 'promptpay';
  deliveryDate: string; // YYYY-MM-DD
  deliverySlot: DeliverySlot;
};

type PayOrderState =
  | { mode: 'pay_order'; orderId: string }
  | {
      mode?: 'new_checkout';
      groups: Group[];
      checkout: CheckoutDraft;

      // ✅ ส่งมาจาก CheckoutPage (รวมค่าส่งแล้ว)
      itemsSubtotal: number;
      shippingFee: number;
      grandTotal: number;
    };

const PROMPTPAY_PHONE = '0858545163';

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ✅ รวม qty ของ sellerProductId เดียวกัน
function buildStockLinesFromCartItems(items: CartItem[]) {
  const map = new Map<string, number>();

  for (const it of items) {
    const sellerProductId = (it as any).sellerProductId as string | undefined;
    if (!sellerProductId) continue;

    const qty = Math.max(0, Number(it.qty ?? 0));
    if (qty <= 0) continue;

    map.set(sellerProductId, (map.get(sellerProductId) ?? 0) + qty);
  }

  return Array.from(map.entries()).map(([sellerProductId, qty]) => ({ sellerProductId, qty }));
}

/**
 * ✅ แบ่งค่าส่งให้แต่ละร้านแบบ "ตามสัดส่วนยอดสินค้า" และทำให้ผลรวมเท่ากับ shippingFee เป๊ะ
 * วิธี: คำนวณค่าดิบ -> floor -> แจกเศษให้ร้านที่ remainder มากสุด
 */
function allocateShippingBySubtotal(groups: Group[], shippingFee: number) {
  const fee = Math.max(0, Math.floor(Number(shippingFee || 0)));
  const subtotalSum = groups.reduce((sum, g) => sum + Math.max(0, Number(g.total || 0)), 0);

  // ถ้าไม่มี subtotal ให้หารเท่ากัน
  if (groups.length === 0) return new Map<number, number>();
  if (subtotalSum <= 0) {
    const base = Math.floor(fee / groups.length);
    let rem = fee - base * groups.length;

    const m = new Map<number, number>();
    for (let i = 0; i < groups.length; i++) {
      const add = rem > 0 ? 1 : 0;
      if (rem > 0) rem -= 1;
      m.set(groups[i].shopId, base + add);
    }
    return m;
  }

  const rows = groups.map((g) => {
    const raw = (fee * Math.max(0, Number(g.total || 0))) / subtotalSum;
    const flo = Math.floor(raw);
    const rem = raw - flo;
    return { shopId: g.shopId, flo, rem };
  });

  let used = rows.reduce((sum, r) => sum + r.flo, 0);
  let left = fee - used;

  // sort remainder desc
  rows.sort((a, b) => b.rem - a.rem);

  const m = new Map<number, number>();
  for (const r of rows) m.set(r.shopId, r.flo);

  let i = 0;
  while (left > 0 && rows.length > 0) {
    const shopId = rows[i % rows.length].shopId;
    m.set(shopId, (m.get(shopId) ?? 0) + 1);
    left -= 1;
    i += 1;
  }

  return m;
}

export default function PromptPayPaymentPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const orders = useAppSelector((s) => (s as any).orders.orders);

  const state = (location.state ?? {}) as PayOrderState;
  const payOrderId = (state as any).mode === 'pay_order' ? (state as any).orderId : undefined;

  const orderToPay = useMemo(() => {
    if (!payOrderId) return null;
    return orders.find((o: any) => o.id === payOrderId) ?? null;
  }, [orders, payOrderId]);

  // ✅ new_checkout
  const groups: Group[] | undefined = !payOrderId ? (location.state?.groups as Group[] | undefined) : undefined;
  const checkout: CheckoutDraft | undefined = !payOrderId ? (location.state?.checkout as CheckoutDraft | undefined) : undefined;

  const passedItemsSubtotal: number | undefined = !payOrderId ? (location.state?.itemsSubtotal as number | undefined) : undefined;
  const passedShippingFee: number | undefined = !payOrderId ? (location.state?.shippingFee as number | undefined) : undefined;
  const passedGrandTotal: number | undefined = !payOrderId ? (location.state?.grandTotal as number | undefined) : undefined;

  // ✅ ล็อคยอดที่ต้องจ่าย
  const lockedAmount = useMemo(() => {
    // pay existing order
    if (orderToPay) {
      return Number((orderToPay as any).grandTotal ?? (orderToPay as any).total ?? 0);
    }

    // new checkout
    if (typeof passedGrandTotal === 'number' && passedGrandTotal > 0) return passedGrandTotal;

    // fallback: subtotal (ถ้าไม่มีข้อมูล)
    const grand = (groups ?? []).reduce((sum, g) => sum + Number(g.total ?? 0), 0);
    return Number(grand || 0);
  }, [orderToPay, groups, passedGrandTotal]);

  const [paidAt, setPaidAt] = useState<string>('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const [qrUrl, setQrUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string>('');

  const canSubmit = lockedAmount > 0 && !!slipFile && !submitting;

  useEffect(() => {
    let canceled = false;

    async function buildQr() {
      try {
        setQrError('');
        setQrUrl('');

        if (!lockedAmount || lockedAmount <= 0) return;

        const payload = generatePayload(PROMPTPAY_PHONE, { amount: lockedAmount });
        const url = await QRCode.toDataURL(payload, {
          width: 260,
          margin: 1,
          errorCorrectionLevel: 'M',
        });

        if (!canceled) setQrUrl(url);
      } catch (e: any) {
        if (!canceled) setQrError(e?.message ?? 'สร้าง QR ไม่สำเร็จ');
      }
    }

    buildQr();
    return () => {
      canceled = true;
    };
  }, [lockedAmount]);

  const onPickSlip = async (f: File | null) => {
    setSlipFile(f);
    if (!f) {
      setSlipPreview('');
      return;
    }
    const preview = await fileToBase64(f);
    setSlipPreview(preview);
  };

  const goToSuccess = () => {
    navigate('/orders/success', { state: { payment: 'promptpay' } });
  };

  const onConfirmPayment = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const slipBase64 = slipFile ? await fileToBase64(slipFile) : '';

      // =========================================================
      // 1) PAY EXISTING ORDER (แนบสลิปให้ออเดอร์เดิม)
      // =========================================================
      if (orderToPay) {
        const stockLines = buildStockLinesFromCartItems((orderToPay as any).items ?? []);
        const alreadyDeducted = Boolean((orderToPay as any)?.checkout?.stockDeducted);

        if (!alreadyDeducted && stockLines.length > 0) {
          const chk = checkSellerStock(stockLines);

          if (!chk.ok) {
            const msg =
              chk.reason === 'not_found'
                ? `สินค้าไม่พบในระบบแล้ว (id: ${chk.sellerProductId})`
                : chk.reason === 'inactive'
                  ? `สินค้า "${chk.name ?? '-'}" ถูกปิดการขาย/ซ่อน`
                  : `สินค้า "${chk.name ?? '-'}" สต็อกไม่พอ (เหลือ ${chk.available ?? 0} / ต้องการ ${chk.requested ?? 0})`;

            alert(`ไม่สามารถยืนยันการชำระเงินได้\n${msg}`);
            return;
          }

          // ✅ ตัดสต็อกจริง "ตอนแนบสลิป"
          deductSellerStock(stockLines);
        }

        // 1.1 อัปโหลดสลิป PromptPay เข้า Backend
        const token = localStorage.getItem('token');
        if (token) {
          const resVerify = await fetch(`http://localhost:5000/api/orders/${(orderToPay as any).id}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              slipBase64: slipBase64,
              paidAmount: lockedAmount
            }),
          });
          if (!resVerify.ok) {
            console.error('Verify payment error for existing order', await resVerify.json());
          }
        }

        // ✅ บันทึกสลิปลง order + set stockDeducted กันซ้ำ
        dispatch(
          submitPromptPaySlip({
            orderId: (orderToPay as any).id,
            paidAmount: lockedAmount,
            paidAt: paidAt || undefined,
            slipBase64,
            stockDeducted: true,
          } as any)
        );

        dispatch(
          pushNotification({
            type: 'payment',
            title: 'ส่งสลิปสำเร็จ',
            message: `ระบบได้รับสลิปแล้ว ยอด ${lockedAmount.toLocaleString()} บาท และกำลังรอตรวจสอบ`,
            link: {
              to: '/profile',
              state: { tab: 'orders', orderTab: 'pending_verification' },
            },
          })
        );

        goToSuccess();
        return;
      }

      // =========================================================
      // 2) NEW CHECKOUT (มาจาก CheckoutPage แล้วแนบสลิป = สร้าง order)
      // =========================================================
      if (!groups || !checkout) return;

      const allItems = groups.flatMap((g) => g.items ?? []);
      const stockLines = buildStockLinesFromCartItems(allItems);

      if (stockLines.length > 0) {
        const chk = checkSellerStock(stockLines);
        if (!chk.ok) {
          alert(`ไม่สามารถยืนยันการชำระเงินได้\nสต็อกไม่พอ`);
          return;
        }
        deductSellerStock(stockLines);
      }

      const itemsSubtotalAll = Number(
        passedItemsSubtotal ?? groups.reduce((sum, g) => sum + Number(g.total ?? 0), 0)
      );
      const shippingFeeAll = Number(passedShippingFee ?? 0);
      const grandTotalAll = Number(passedGrandTotal ?? itemsSubtotalAll + shippingFeeAll);

      const shippingMap = allocateShippingBySubtotal(groups, shippingFeeAll);
      dispatch(clearLastPlacedOrders());

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      for (const g of groups) {
        const gSubtotal = Number(g.total ?? 0);
        const gShippingFee = Number(shippingMap.get(g.shopId) ?? 0);
        const gGrandTotal = gSubtotal + gShippingFee;

        // 2.1 สร้าง Order ใน Backend
        const addressParts = checkout.address.split('\n').filter(Boolean);
        const addressLine = addressParts[0] || '';
        const fallbackProvince = 'กรุงเทพมหานคร';
        const fallbackPostalCode = '10110';

        const orderBody = {
          shopId: g.shopId,
          items: g.items.map(it => ({
            id: String(it.id),
            name: it.name,
            price: Number(it.price),
            qty: Number(it.quantity || (it as any).qty || 1),
            weight: Number(it.weight)
          })),
          checkout: {
            fullName: checkout.fullName.trim() || '',
            phone: checkout.phone.trim() || '',
            address: `${addressLine}, ${fallbackProvince} ${fallbackPostalCode}`.trim(),
            ...(checkout.note && checkout.note.trim() ? { note: checkout.note.trim() } : {}),
            paymentMethod: 'promptpay',
            deliveryDate: checkout.deliveryDate || '',
            deliverySlot: checkout.deliverySlot || 'morning',
          },
          itemsSubtotal: Number(gSubtotal),
          shippingFee: Number(gShippingFee),
          grandTotal: Number(gGrandTotal),
        };

        const resCreate = await fetch('http://localhost:5000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(orderBody),
        });
        const dataCreate = await resCreate.json();
        if (!resCreate.ok) {
          console.error('Create order error', dataCreate);
          throw new Error(dataCreate.message || 'Failed to create order');
        }
        const realOrderId = dataCreate.data.id;

        // 2.2 อัปโหลดสลิป PromptPay เข้า Backend
        const resVerify = await fetch(`http://localhost:5000/api/orders/${realOrderId}/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            slipBase64: slipBase64,
            paidAmount: gGrandTotal
          }),
        });
        const dataVerify = await resVerify.json();
        if (!resVerify.ok) {
          console.error('Verify payment error', dataVerify);
          throw new Error(dataVerify.message || 'Failed to verify payment');
        }

        // 2.3 อัปเดตลง Redux ด้วย Real ID
        dispatch(
          placeOrder({
            id: realOrderId,
            shopId: g.shopId,
            shopName: g.shopName,
            items: g.items,
            checkout: {
              ...checkout,
              paymentStatus: 'pending_verification',
              paidAmount: gGrandTotal,
              paidAt: paidAt || undefined,
              slipBase64,
              stockDeducted: true,
            } as any,
            itemsSubtotal: gSubtotal,
            shippingFee: gShippingFee,
            grandTotal: gGrandTotal,
          } as any)
        );
      }

      dispatch(
        pushNotification({
          type: 'payment',
          title: 'ส่งสลิปสำเร็จ',
          message: `ระบบสร้างคำสั่งซื้อแล้ว และกำลังรอตรวจสอบสลิป ยอด ${grandTotalAll.toLocaleString()} บาท`,
          link: {
            to: '/profile',
            state: { tab: 'orders', orderTab: 'pending_verification' },
          },
        })
      );

      dispatch(clearCart());
      clearPersistedCart();
      goToSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  // state ไม่ครบ: pay order
  if (payOrderId && !orderToPay) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold">ไม่พบออเดอร์ที่ต้องการชำระ</div>
        <Link className="text-primary-600 underline underline-offset-4" to="/profile" state={{ tab: 'orders' }}>
          กลับไปคำสั่งซื้อ
        </Link>
      </div>
    );
  }

  // state ไม่ครบ: new checkout
  if (!payOrderId && (!groups || !checkout)) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold">ไม่พบข้อมูลการชำระเงิน</div>
        <Link className="text-primary-600 underline underline-offset-4" to="/checkout">
          กลับไปหน้า Checkout
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 bg-neutral-50 min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          {orderToPay ? (
            <Link
              className="text-primary-600 hover:text-primary-500 underline underline-offset-4"
              to="/profile"
              state={{ tab: 'orders', orderTab: 'pending_verification' }}
            >
              กลับไปคำสั่งซื้อ
            </Link>
          ) : (
            <Link className="text-primary-600 hover:text-primary-500 underline underline-offset-4" to="/checkout">
              กลับไปหน้า Checkout
            </Link>
          )}

          <div className="text-sm text-neutral-600">PromptPay</div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-neutral-900">
                {orderToPay ? 'ชำระเงินสำหรับออเดอร์' : 'สแกนจ่ายด้วย QR พร้อมเพย์'}
              </div>

              {orderToPay && (
                <div className="mt-1 text-sm text-neutral-600">
                  หมายเลขคำสั่งซื้อ: <span className="font-semibold text-neutral-900">{(orderToPay as any).id}</span>
                </div>
              )}

              <div className="mt-2 text-sm text-neutral-600">
                ยอดที่ต้องชำระ:{' '}
                <span className="font-semibold text-red-600">{lockedAmount.toLocaleString()}</span>
              </div>

              {!orderToPay && typeof passedShippingFee === 'number' && (
                <div className="mt-2 text-xs text-neutral-500">
                  (รวมค่าส่งแล้ว: {Number(passedShippingFee).toLocaleString()} บาท)
                </div>
              )}
            </div>

            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              รอตรวจสอบสลิปหลังแนบ
            </span>
          </div>

          {/* QR */}
          <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="shrink-0">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="PromptPay QR"
                  className="h-36 w-36 rounded-lg border border-neutral-200 bg-white object-contain shadow-sm"
                />
              ) : (
                <div className="h-36 w-36 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-xs text-neutral-500">
                  {qrError ? 'สร้าง QR ไม่สำเร็จ' : 'กำลังสร้าง QR...'}
                </div>
              )}
            </div>

            <div className="flex-1 text-sm text-neutral-700">
              <div className="font-semibold text-neutral-900">ข้อมูลพร้อมเพย์</div>
              <div className="mt-1">เบอร์: {PROMPTPAY_PHONE}</div>
              <div className="mt-1 text-xs text-neutral-500">
                สแกนแล้วควรแสดงยอด {lockedAmount.toLocaleString()} บาทอัตโนมัติ
              </div>

              {qrError && <div className="mt-2 text-xs text-red-600">{qrError}</div>}
            </div>
          </div>

          {/* paid at */}
          <div className="mt-5">
            <div className="text-sm font-semibold text-neutral-900 mb-1">วันเวลาโอน (ถ้ามี)</div>
            <input
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className={inputClass}
            />
            <div className="mt-2 text-xs text-neutral-500">ไม่กรอกก็ได้ (ช่วยให้ตรวจสอบง่ายขึ้น)</div>
          </div>

          {/* slip */}
          <div className="mt-5">
            <div className="text-sm font-semibold text-neutral-900 mb-1">แนบสลิปการโอน</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPickSlip(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />

            {slipPreview && (
              <div className="mt-3">
                <div className="text-xs text-neutral-500 mb-2">ตัวอย่างสลิป</div>
                <img
                  src={slipPreview}
                  alt="slip preview"
                  className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white shadow-sm"
                />
              </div>
            )}
          </div>

          {/* submit */}
          <div className="mt-6 border-t border-neutral-200 pt-4">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={onConfirmPayment}
              className={['btn btn-primary w-full', !canSubmit ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}
            >
              {submitting ? 'กำลังทำรายการ...' : 'ยืนยันการชำระเงิน'}
            </button>

            <div className="mt-2 text-xs text-neutral-500">ยืนยันแล้วระบบจะพาไปหน้า “ส่งสลิปสำเร็จ”</div>
          </div>
        </div>
      </div>
    </div>
  );
}