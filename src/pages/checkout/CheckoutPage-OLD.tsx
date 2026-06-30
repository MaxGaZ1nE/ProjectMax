import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@stores/index';
import type { CartItem } from '@/slices/cart-slice';
import { clearCart } from '@/slices/cart-slice';
import { placeOrder, clearLastPlacedOrders } from '@/slices/order-slice';
import type { PaymentMethod } from '@/slices/order-slice';

import { pushNotification } from '@/slices/notification-slice';

// ✅ stock helpers (ตัดสต็อกจริง)
import { checkSellerStock, deductSellerStock } from '@/features/seller-products/seller-products-storage';

type DeliverySlot = 'morning' | 'afternoon';

type Group = {
  shopId: number;
  shopName: string;
  items: CartItem[];
  total: number; // subtotal ต่อร้าน (ไม่รวมส่ง)
};

const lineTotal = (it: CartItem) => {
  const weight = Number(it.weight ?? 0);
  const unit = it.unit;

  let kg = 0;
  if (unit === 'kg') kg = weight;
  else if (unit === 'g') kg = weight / 1000;
  else kg = 0;

  const base = kg > 0 ? it.price * kg : it.price;
  return base * it.qty;
};

const unitLabel = (u: CartItem['unit']) => {
  if (u === 'kg') return 'กิโลกรัม';
  if (u === 'g') return 'กรัม';
  if (u === 'box') return 'กล่อง';
  return u;
};

// ✅ สำคัญ: รวม sellerProductId เข้า key กันชน (สินค้า mock กับ seller จะไม่ชนกัน)
const itemKey = (it: CartItem) =>
  `${it.id}__${it.unit}__${it.weight}__${(it as any).sellerProductId ?? ''}`;

type AddressItem = {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  province: string;
  postalCode: string;
  isDefault?: boolean;
};

const LS_ADDRESS_BOOK_KEY = 'ffy_address_book_v1';
const LS_SELECTED_ADDRESS_ID = 'ffy_selected_address_id';

function loadAddressBook(): AddressItem[] {
  try {
    const raw = localStorage.getItem(LS_ADDRESS_BOOK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMinDeliveryDate(cutoffHour = 18) {
  const now = new Date();
  const isAfterCutoff = now.getHours() >= cutoffHour;
  const min = new Date(now);
  if (isAfterCutoff) min.setDate(min.getDate() + 1);
  return toYMD(min);
}

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
function allocateShippingBySubtotal(groups: { shopId: number; total: number }[], shippingFee: number) {
  const fee = Math.max(0, Math.floor(Number(shippingFee || 0)));
  const subtotalSum = groups.reduce((sum, g) => sum + Math.max(0, Number(g.total || 0)), 0);

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
export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { i18n } = useTranslation();

  const allItems = useAppSelector((s) => s.cart.items);
  const user = useAppSelector((s) => s.auth.user);

  // ✅ รับรายการที่เลือกจากตะกร้า
  const selectedKeys: string[] | undefined = location.state?.selectedKeys;

  const items = useMemo(() => {
    if (!selectedKeys || selectedKeys.length === 0) return allItems;
    const set = new Set(selectedKeys);
    return allItems.filter((it) => set.has(itemKey(it)));
  }, [allItems, selectedKeys]);

  // -----------------------
  // Address
  // -----------------------
  const addressBook = useMemo(() => loadAddressBook(), []);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const fallbackFullName = useMemo(() => {
    const fn = (user?.firstName ?? '').trim();
    const ln = (user?.lastName ?? '').trim();
    const combined = `${fn} ${ln}`.trim();
    return combined || (user?.name ?? '');
  }, [user]);

  const fallbackPhone = (user as any)?.phone ?? '';
  const fallbackAddress = (user as any)?.address ?? '';
  const fallbackProvince = (user as any)?.province ?? '';
  const fallbackPostalCode = (user as any)?.postalCode ?? '';

  const initialSelectedAddressId = useMemo(() => {
    const saved = localStorage.getItem(LS_SELECTED_ADDRESS_ID) ?? '';
    if (saved) return saved;

    const def = addressBook.find((a) => a.isDefault);
    return def?.id ?? '';
  }, [addressBook]);

  const [selectedAddressId, setSelectedAddressId] = useState(initialSelectedAddressId);

  useEffect(() => {
    if (selectedAddressId) localStorage.setItem(LS_SELECTED_ADDRESS_ID, selectedAddressId);
  }, [selectedAddressId]);

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) return null;
    return addressBook.find((a) => a.id === selectedAddressId) ?? null;
  }, [addressBook, selectedAddressId]);

  const shipFullName = selectedAddress?.recipientName ?? fallbackFullName;
  const shipPhone = selectedAddress?.phone ?? fallbackPhone;

  const shipAddress = useMemo(() => {
    if (selectedAddress) {
      const tail = `${selectedAddress.province} ${selectedAddress.postalCode}`.trim();
      return `${selectedAddress.addressLine}${tail ? `
${tail}` : ''}`.trim();
    }
    const tail = `${fallbackProvince} ${fallbackPostalCode}`.trim();
    return `${fallbackAddress}${tail ? `
${tail}` : ''}`.trim();
  }, [selectedAddress, fallbackAddress, fallbackProvince, fallbackPostalCode]);

  const hasShippingInfo =
    shipFullName.trim().length >= 2 &&
    shipPhone.trim().length >= 8 &&
    shipAddress.trim().length >= 10;

  // -----------------------
  // Delivery
  // -----------------------
  const CUTOFF_HOUR = 18;
  const minDeliveryDate = useMemo(() => getMinDeliveryDate(CUTOFF_HOUR), []);
  const [deliveryDate, setDeliveryDate] = useState<string>(minDeliveryDate);
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>('morning');

  useEffect(() => {
    if (deliveryDate < minDeliveryDate) setDeliveryDate(minDeliveryDate);
  }, [deliveryDate, minDeliveryDate]);

  const hasDeliveryInfo = deliveryDate.trim().length > 0 && !!deliverySlot;

  // -----------------------
  // Groups + subtotal
  // -----------------------
  const groups: Group[] = useMemo(() => {
    const map = new Map<number, Group>();
    for (const it of items) {
      const g =
        map.get(it.shopId) ?? {
          shopId: it.shopId,
          shopName: it.shopName,
          items: [],
          total: 0,
        };

      g.items.push(it);
      g.total += lineTotal(it);
      map.set(it.shopId, g);
    }
    return Array.from(map.values());
  }, [items]);

  const itemsSubtotal = useMemo(
    () => groups.reduce((sum, g) => sum + g.total, 0),
    [groups]
  );

  // -----------------------
  // Shipping fee by kg + km + min
  // -----------------------
  const totalKg = useMemo(() => {
    let kgSum = 0;
    for (const it of items) {
      const w = Number(it.weight ?? 0);
      let kg = 0;
      if (it.unit === 'kg') kg = w;
      else if (it.unit === 'g') kg = w / 1000;
      else kg = 0;

      kgSum += kg * it.qty;
    }
    return Math.max(0, Number(kgSum.toFixed(3)));
  }, [items]);

  // ✅ ระยะทาง (km) แบบจำลอง
  const [distanceKm, setDistanceKm] = useState<number>(10);

  const SHIPPING_RULE = useMemo(() => {
    return {
      MIN_KG: 20,
      MIN_FEE: 200,
      BASE_FEE: 0,
      BAHT_PER_KG: 6,
      BAHT_PER_KM: 12,
    };
  }, []);

  const shippingFee = useMemo(() => {
    const km = Math.max(0, Number(distanceKm || 0));
    const billableKg = Math.max(totalKg, SHIPPING_RULE.MIN_KG);

    const fee =
      SHIPPING_RULE.BASE_FEE +
      billableKg * SHIPPING_RULE.BAHT_PER_KG +
      km * SHIPPING_RULE.BAHT_PER_KM;

    return Math.ceil(Math.max(SHIPPING_RULE.MIN_FEE, fee));
  }, [distanceKm, totalKg, SHIPPING_RULE]);

  const grandTotal = useMemo(() => itemsSubtotal + shippingFee, [itemsSubtotal, shippingFee]);

  // -----------------------
  // other fields
  // -----------------------
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  const canSubmit = items.length > 0 && hasShippingInfo && hasDeliveryInfo && distanceKm > 0;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold">
          {i18n.language === 'th' ? 'ยังไม่มีสินค้าในรายการชำระเงิน' : 'No items in checkout'}
        </div>
        <Link className="text-primary-600 underline underline-offset-4" to="/cart">
          {i18n.language === 'th' ? 'กลับไปตะกร้า' : 'Back to cart'}
        </Link>
      </div>
    );
  }

  // -----------------------
  // ✅ Stock validation/deduct helpers
  // -----------------------

  // ✅ รวม qty ตาม sellerProductId (สำคัญมาก เพื่อไม่เช็ค/ตัดสต็อกพลาด)
  const buildSellerStockItems = () => {
    const map = new Map<string, number>();

    for (const it of items) {
      const sellerProductId = (it as any).sellerProductId as string | undefined;
      if (!sellerProductId) continue;

      const qty = Math.max(0, Number(it.qty ?? 0));
      if (qty <= 0) continue;

      map.set(String(sellerProductId), (map.get(String(sellerProductId)) ?? 0) + qty);
    }

    return Array.from(map.entries()).map(([sellerProductId, qty]) => ({ sellerProductId, qty }));
  };

  const validateSellerStockOrThrow = () => {
    const sellerItems = buildSellerStockItems();
    if (sellerItems.length === 0) return;

    const check = checkSellerStock(sellerItems);

    if (!check.ok) {
      if (check.reason === 'not_found') {
        throw new Error('ไม่พบสินค้าในคลังผู้ขาย (อาจถูกลบ/ซ่อน)');
      }

      if (check.reason === 'inactive') {
        throw new Error(`สินค้า "${check.name ?? ''}" ถูกปิดการขาย/ซ่อน กรุณาลบออกจากตะกร้า`);
      }

      if (check.reason === 'insufficient') {
        throw new Error(
          `สต็อกไม่พอ: ${check.name ?? ''}\n` +
            `เหลือ ${check.available ?? 0} ต้องการ ${check.requested ?? 0}\n` +
            `กรุณาปรับจำนวนในตะกร้า`
        );
      }

      throw new Error('สต็อกไม่พอ');
    }
  };

  const deductSellerStockNow = () => {
    const sellerItems = buildSellerStockItems();
    if (sellerItems.length === 0) return;
    deductSellerStock(sellerItems);
  };

  const onConfirmCOD = () => {
    if (!canSubmit) return;

    // ✅ สมจริง: เช็คสต็อกและตัดสต็อกทันที เพราะ COD สร้างออเดอร์ทันที
    try {
      validateSellerStockOrThrow();
      deductSellerStockNow();
    } catch (e: any) {
      alert(e?.message ?? 'สั่งซื้อไม่ได้ เนื่องจากสต็อกไม่พอ');
      return;
    }

    dispatch(clearLastPlacedOrders());

// ✅ แบ่งค่าส่งต่อร้าน
const shippingMap = allocateShippingBySubtotal(groups, shippingFee);

for (const g of groups) {
  const gSubtotal = g.total;
  const gShippingFee = Number(shippingMap.get(g.shopId) ?? 0);
  const gGrandTotal = gSubtotal + gShippingFee;

  dispatch(
    placeOrder({
      shopId: g.shopId,
      shopName: g.shopName,
      items: g.items,
      checkout: {
        fullName: shipFullName,
        phone: shipPhone,
        address: shipAddress,
        note,
        paymentMethod: 'cod',
        deliveryDate,
        deliverySlot,
      },

      // ✅ ยอดต่อร้าน
      itemsSubtotal: gSubtotal,
      shippingFee: gShippingFee,
      grandTotal: gGrandTotal,
    })
  );
}

    dispatch(
      pushNotification({
        type: 'order',
        title: 'สั่งซื้อสำเร็จ',
        message: `ยอดสินค้า ${itemsSubtotal.toLocaleString()} + ค่าส่ง ${shippingFee.toLocaleString()} = ${grandTotal.toLocaleString()} บาท (COD)`,
        link: { to: '/profile', state: { tab: 'orders', orderTab: 'waiting_driver' } },
      })
    );

    dispatch(clearCart());
    navigate('/orders/success', { state: { payment: 'cod' } });
  };

  const onGoPromptPay = () => {
    if (!canSubmit) return;

    // ✅ สมจริง: เช็คสต็อกก่อนพาไปจ่าย (กันสต็อกหมด)
    // (ตัดสต็อกจริงควรทำตอน “แนบสลิป/สร้างออเดอร์จริง” ใน PromptPayPaymentPage)
    try {
      validateSellerStockOrThrow();
    } catch (e: any) {
      alert(e?.message ?? 'ไปชำระเงินไม่ได้ เนื่องจากสต็อกไม่พอ');
      return;
    }

    navigate('/checkout/promptpay', {
      state: {
        groups: groups.map((g) => ({ ...g })),
        checkout: {
          fullName: shipFullName,
          phone: shipPhone,
          address: shipAddress,
          note,
          paymentMethod: 'promptpay',
          deliveryDate,
          deliverySlot,
        },

        shippingFee,
        itemsSubtotal,
        grandTotal,
      },
    });
  };

  return (
    <div className="py-10 bg-neutral-50 min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link className="text-primary-600 hover:text-primary-500 underline underline-offset-4" to="/cart">
            {i18n.language === 'th' ? 'กลับไปตะกร้า' : 'Back to cart'}
          </Link>
          <div className="text-sm text-neutral-600">{i18n.language === 'th' ? 'ชำระเงิน' : 'Checkout'}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-7 space-y-6">
            {/* ที่อยู่จัดส่ง */}
            <div className="card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-neutral-900">{i18n.language === 'th' ? 'ที่อยู่จัดส่ง' : 'Delivery Address'}</div>
                  <div className="mt-1 text-xs text-neutral-500">{i18n.language === 'th' ? 'ตรวจสอบข้อมูลเพื่อการจัดส่งที่ถูกต้อง' : 'Verify address for correct delivery'}</div>
                </div>

                <button type="button" onClick={() => setAddressModalOpen(true)} className="btn">
                  {i18n.language === 'th' ? 'เปลี่ยน' : 'Change'}
                </button>
              </div>

              <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="font-semibold text-neutral-900">
                  {shipFullName} ({shipPhone})
                </div>
                <div className="mt-1 text-sm text-neutral-700 whitespace-pre-line">{shipAddress}</div>
              </div>

              {!hasShippingInfo && (
                <div className="mt-3 text-sm text-red-600">{i18n.language === 'th' ? 'กรุณาเพิ่มหรือเลือกที่อยู่ให้ครบก่อนทำรายการ' : 'Please complete the address before proceeding'}</div>
              )}
            </div>

            {/* ค่าส่ง */}
            <div className="card p-6">
              <div className="text-lg font-semibold text-neutral-900 mb-4">{i18n.language === 'th' ? 'ค่าส่ง (ขายส่ง)' : 'Shipping Fee'}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-neutral-700 mb-1">{i18n.language === 'th' ? 'ระยะทาง (ก็ม.)' : 'Distance (km)'}</div>
                  <input
                    type="number"
                    min={1}
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className={inputClass}
                    placeholder={i18n.language === 'th' ? 'เช่น 25' : 'e.g. 25'}
                  />
                  <div className="mt-2 text-xs text-neutral-500">
                    {i18n.language === 'th' ? 'ตอนนี้เป็นโหมดจำลอง (ไม่มีแผนที่) คุณกรอกระยะทางเอง' : 'Currently in demo mode (no map). You can enter distance manually'}
                  </div>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-sm text-neutral-600">{i18n.language === 'th' ? 'น้ำหนักรวม' : 'Total Weight'}</div>
                  <div className="text-lg font-semibold text-neutral-900">{totalKg.toLocaleString()} kg</div>

                  <div className="mt-2 text-xs text-neutral-600">{i18n.language === 'th' ? 'ขั้นต่ำต้นคิดน้ำหนัก' : 'Minimum weight charged'}: {SHIPPING_RULE.MIN_KG} kg</div>
                  <div className="text-xs text-neutral-600">
                    {i18n.language === 'th' ? 'อัตรา' : 'Rate'}: {SHIPPING_RULE.BAHT_PER_KG} บาท/กก. + {SHIPPING_RULE.BAHT_PER_KM} บาท/ก็ม.
                  </div>
                  <div className="text-xs text-neutral-600">{i18n.language === 'th' ? 'ค่าส่งขั้นต่ำ' : 'Minimum shipping fee'}: {SHIPPING_RULE.MIN_FEE} บาท</div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-neutral-600">{i18n.language === 'th' ? 'ค่าส่งประมาณการ' : 'Estimated shipping'}</div>
                  <div className="font-semibold text-red-600">{shippingFee.toLocaleString()} บาท</div>
                </div>
              </div>

              {distanceKm <= 0 && <div className="mt-3 text-sm text-red-600">{i18n.language === 'th' ? 'กรุณากรอกระยะทางให้ถูกต้อง' : 'Please enter a valid distance'}</div>}
            </div>

            {/* รอบจัดส่ง */}
            <div className="card p-6">
              <div className="text-lg font-semibold text-neutral-900 mb-4">{i18n.language === 'th' ? 'รอบจัดส่ง' : 'Delivery Slot'}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-neutral-700 mb-1">{i18n.language === 'th' ? 'วันที่ต้องการให้ส่ง' : 'Desired delivery date'}</div>
                  <input
                    type="date"
                    min={minDeliveryDate}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className={inputClass}
                  />
                  <div className="mt-2 text-xs text-neutral-500">
                    สั่งหลัง {String(CUTOFF_HOUR).padStart(2, '0')}:00 วันส่งเร็วสุดจะเป็นวันถัดไป
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-neutral-700 mb-1">{i18n.language === 'th' ? 'รอบส่ง' : 'Delivery slot'}</div>
                  <select
                    value={deliverySlot}
                    onChange={(e) => setDeliverySlot(e.target.value as DeliverySlot)}
                    className={inputClass}
                  >
                    <option value="morning">{i18n.language === 'th' ? 'รอบเช้า (09:00-12:00)' : 'Morning slot (09:00-12:00)'}</option>
                    <option value="afternoon">{i18n.language === 'th' ? 'รอบบ่าย (13:00-17:00)' : 'Afternoon slot (13:00-17:00)'}</option>
                  </select>
                </div>
              </div>

              {!hasDeliveryInfo && (
                <div className="mt-3 text-sm text-red-600">{i18n.language === 'th' ? 'กรุณาเลือกวันส่งและรอบส่งก่อนทำรายการ' : 'Please select delivery date and slot before proceeding'}</div>
              )}
            </div>

            {/* วิธีชำระเงิน */}
            <div className="card p-6">
              <div className="text-lg font-semibold text-neutral-900 mb-4">{i18n.language === 'th' ? 'วิธีชำระเงิน' : 'Payment method'}</div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-neutral-900">{i18n.language === 'th' ? 'เก็บเงินปลายทาง (COD)' : 'Cash on Delivery (COD)'}</div>
                    <div className="text-sm text-neutral-600">{i18n.language === 'th' ? 'ชำระเงินเมื่อได้รับสินค้า' : 'Pay when you receive your order'}</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'promptpay'}
                    onChange={() => setPaymentMethod('promptpay')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-neutral-900">{i18n.language === 'th' ? 'QR พร้อมเพย (PromptPay)' : 'QR PromptPay'}</div>
                    <div className="text-sm text-neutral-600">{i18n.language === 'th' ? 'ไปหน้าชำระเงินและแนบสลิป' : 'Go to payment page and attach receipt'}</div>
                  </div>
                </label>
              </div>
            </div>

            {/* หมายเหตุ */}
            <div className="card p-6">
              <div className="text-lg font-semibold text-neutral-900 mb-3">{i18n.language === 'th' ? 'หมายเหตุ' : 'Note'}</div>
              <input
                className={inputClass}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={i18n.language === 'th' ? 'เช่น ฝากไว้หน้าบ้าน, โทรก่อนส่ง' : 'e.g. leave at front door, call before delivery'}
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card p-6">
              <div className="text-lg font-semibold text-neutral-900 mb-4">{i18n.language === 'th' ? 'สรุปยอด' : 'Order summary'}</div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-neutral-600">{i18n.language === 'th' ? 'ยอดสินค้า' : 'Subtotal'}</div>
                  <div className="font-semibold text-neutral-900">{itemsSubtotal.toLocaleString()}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-neutral-600">{i18n.language === 'th' ? 'ค่าส่ง' : 'Shipping'}</div>
                  <div className="font-semibold text-neutral-900">{shippingFee.toLocaleString()}</div>
                </div>

                <div className="h-px bg-neutral-200" />

                <div className="flex items-center justify-between">
                  <div className="text-neutral-600">{i18n.language === 'th' ? 'ยอดสุทธิ' : 'Grand total'}</div>
                  <div className="text-lg font-semibold text-red-600">{grandTotal.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-5">
                {paymentMethod === 'cod' ? (
                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={onConfirmCOD}
                    className="btn btn-primary w-full"
                  >
                    {i18n.language === 'th' ? 'ยืนยันสั่งซื้อ' : 'Confirm order'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={onGoPromptPay}
                    className="btn btn-primary w-full"
                  >
                    {i18n.language === 'th' ? 'ไปหน้าชำระเงิน (PromptPay)' : 'Go to payment (PromptPay)'}
                  </button>
                )}

                {!canSubmit && (
                  <div className="mt-2 text-xs text-neutral-500">
                    {i18n.language === 'th' ? 'กรุณากรอกที่อยู่ เลือกรอบส่ง และระยะทางให้ครบก่อน' : 'Please complete address, select delivery slot, and enter distance'}
                  </div>
                )}
              </div>
            </div>

            {/* สรุปตามร้าน */}
            <div className="card p-6">
              <div className="text-sm font-semibold text-neutral-900">{i18n.language === 'th' ? 'สรุปรายการสินค้า' : 'Products summary'}</div>
              <div className="mt-3 space-y-4">
                {groups.map((g) => (
                  <div key={g.shopId} className="rounded-lg border border-neutral-200 overflow-hidden bg-white">
                    <div className="bg-neutral-50 px-4 py-2 font-semibold text-neutral-900">{g.shopName}</div>
                    <div className="divide-y divide-neutral-200">
                      {g.items.map((it) => (
                        <div key={itemKey(it)} className="px-4 py-3 flex gap-3">
                          <img
                            src={it.image}
                            alt={it.name}
                            className="h-12 w-12 rounded-lg object-cover border border-neutral-200"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate text-neutral-900">{it.name}</div>
                      <div className="text-sm text-neutral-600">ฤิๆ {unitLabel(it.unit)} , จำนวน {it.qty}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-right text-neutral-900">
                            {lineTotal(it).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="px-4 py-2 flex items-center justify-between bg-neutral-50">
                      <div className="text-sm text-neutral-600">รวมร้านนี้</div>
                      <div className="text-sm font-semibold text-red-600">{g.total.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Address Modal */}
        {addressModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setAddressModalOpen(false)} />

            <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl border border-neutral-200">
              <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="font-semibold text-neutral-900">{i18n.language === 'th' ? 'ที่อยู่ของฉัน' : 'My addresses'}</div>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="h-9 w-9 rounded-md hover:bg-neutral-50"
                  aria-label="close"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-3 max-h-[60vh] overflow-auto">
                {addressBook.length === 0 ? (
                  <div className="text-sm text-neutral-600">
                    {i18n.language === 'th' ? 'ยังไม่มีที่อยู่ในระบบ กรุณาไปเพิ่มที่อยู่ในหน้าโปรไฟล (แท็บ ที่อยู่)' : 'No addresses yet. Please add addresses in your profile (Address tab)'}
                  </div>
                ) : (
                  addressBook.map((a) => (
                    <label
                      key={a.id}
                      className="flex gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="addr"
                        checked={selectedAddressId === a.id}
                        onChange={() => setSelectedAddressId(a.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-neutral-900">
                          {a.recipientName} ({a.phone}){' '}
                          {a.isDefault && (
                            <span className="ml-2 text-xs text-emerald-700 font-semibold">{i18n.language === 'th' ? 'ค่าเริ่มต้น' : 'Default'}</span>
                          )}
                        </div>

                        <div className="mt-1 text-sm text-neutral-700 whitespace-pre-line">
                          {`${a.addressLine}\n${a.province} ${a.postalCode}`.trim()}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="px-5 py-4 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setAddressModalOpen(false)} className="btn btn-primary">
                  {i18n.language === 'th' ? 'ยืนยัน' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}