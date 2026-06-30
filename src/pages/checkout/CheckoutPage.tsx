import { useMemo, useState, useEffect, useCallback } from 'react';
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

// ✅ cart persistence utility
import { clearPersistedCart } from '@/utils/cart-persistence';
import { cartAPI, addressAPI } from '@/services/backend-api';

type DeliverySlot = 'morning' | 'afternoon';

type Group = {
  shopId: number;
  shopName: string;
  items: CartItem[];
  total: number; // subtotal ต่อร้าน (ไม่รวมส่ง)
};

const lineTotal = (it: CartItem) => {
  const weight = Number(it.weight ?? 0);
  const base = weight > 0 ? it.price * weight : it.price;
  const quantity = Number(it.qty || (it as any).quantity || 1);
  return base * quantity;
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
  lat?: number;
  lng?: number;
};

const LS_SELECTED_ADDRESS_ID = 'ffy_selected_address_id';

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

// -----------------------
// ✅ Real road distance via Google Maps Distance Matrix API (backend)
// Old haversine / straight-line code removed
// -----------------------

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { i18n } = useTranslation();

  const allItems = useAppSelector((s) => s.cart.items);
  const user = useAppSelector((s) => s.auth.user);
  const [fallbackCartItems, setFallbackCartItems] = useState<CartItem[]>([]);
  const [loadingFallbackCart, setLoadingFallbackCart] = useState(false);

  // ✅ Fetch user profile from backend to populate address fields
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();
        const profileData = data.data;

        // Update Redux store with address fields from backend
        dispatch({
          type: 'auth/updateProfile',
          payload: {
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            phone: profileData.phone,
            address: profileData.address || '',
            province: profileData.province || '',
            postalCode: profileData.postal_code || '',
          }
        });
      } catch (error) {
        console.warn('Could not fetch profile:', error);
      }
    };

    if (user?.id) {
      fetchUserProfile();
    }
  }, [dispatch, user?.id]);

  // ✅ รับรายการที่เลือกจากตะกร้าผ่าน route state (ที่ CartPage ส่งมาให้)
  // หากไม่มี ให้ใช้ fallback กลับไปหา cart ใน Redux หรือรีไดเร็กต์
  const passedItems: any[] | undefined = location.state?.selectedItems;

  useEffect(() => {
    if ((!passedItems || passedItems.length === 0) && allItems.length === 0 && !loadingFallbackCart) {
      const fetchCart = async () => {
        setLoadingFallbackCart(true);
        try {
          const res: any = await cartAPI.getCart();
          const rawItems = res.data?.data?.items || res.data?.items || [];
          const cartItems = rawItems.map((item: any) => ({
            id: String(item.product_id || item.id || ''),
            name: item.product_name || item.name || '',
            price: Number(item.price || 0),
            image: item.images?.[0] || item.image || '/no-image.png',
            qty: Number(item.quantity || item.qty || 1),
            shopId: Number(item.shop_id || item.shopId || 0),
            shopName: item.shop_name || item.shopName || '',
            unit: 'kg',
            weight: Number(item.weight || 0),
            sellerProductId: item.seller_product_id || item.sellerProductId || undefined,
          }));
          setFallbackCartItems(cartItems);
        } catch (err) {
          console.warn('Could not fetch fallback cart items:', err);
        } finally {
          setLoadingFallbackCart(false);
        }
      };
      fetchCart();
    }
  }, [passedItems, allItems.length, loadingFallbackCart]);

  const items = useMemo(() => {
    let sourceItems = passedItems && passedItems.length > 0 ? passedItems : allItems;
    if ((!sourceItems || sourceItems.length === 0) && fallbackCartItems.length > 0) {
      sourceItems = fallbackCartItems;
    }

    // Merge สินค้าชนิดเดียวกัน (ใช้ product_id เป็นคีย์)
    const merged = new Map<number, any>();

    for (const it of sourceItems) {
      // support both product_id and productId and id
      const pId = it.product_id || it.productId || it.id;
      const existing = merged.get(pId);

      const qty = Math.max(1, Number(it.quantity || it.qty || 1));
      const wt = Number(it.weight || 0);

      if (existing) {
        // รวม weight และ qty
        existing.weight += wt;
        existing.quantity += qty;
      } else {
        merged.set(pId, { ...it, id: pId, product_id: pId, productId: pId, quantity: qty, weight: wt });
      }
    }

    return Array.from(merged.values());
  }, [allItems, passedItems, fallbackCartItems]);

  // -----------------------
  // Address
  // -----------------------
  const [addressBook, setAddressBook] = useState<AddressItem[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Fetch addresses from backend API
  const fetchAddresses = async () => {
    try {
      setAddressLoading(true);
      const res = await addressAPI.getAddresses();
      const data = res.data?.data || [];
      setAddressBook(data);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
    }
  }, [user?.id]);

  // Re-fetch when modal opens (in case user added new address)
  useEffect(() => {
    if (addressModalOpen && user?.id) {
      fetchAddresses();
    }
  }, [addressModalOpen, user?.id]);

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

  // Auto-select default address when addressBook loads
  useEffect(() => {
    if (!selectedAddressId && addressBook.length > 0) {
      const def = addressBook.find((a) => a.isDefault);
      if (def) setSelectedAddressId(def.id);
      else setSelectedAddressId(addressBook[0].id);
    }
  }, [addressBook, selectedAddressId]);

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
      const shopId = it.shopId || it.shop_id;
      const shopName = it.shopName || it.shop_name;
      const g =
        map.get(shopId) ?? {
          shopId: shopId,
          shopName: shopName,
          items: [],
          total: 0,
        };

      g.items.push(it);
      g.total += lineTotal(it);
      map.set(shopId, g);
    }
    return Array.from(map.values());
  }, [items]);

  const itemsSubtotal = useMemo(
    () => groups.reduce((sum, g) => sum + g.total, 0),
    [groups]
  );

  // -----------------------
  // Shipping fee by kg + km (Google Maps Distance Matrix)
  // -----------------------
  const totalKg = useMemo(() => {
    let kgSum = 0;
    for (const it of items) {
      const w = Number(it.weight ?? 0);
      kgSum += w;
    }
    return Math.max(0, Number(kgSum.toFixed(3)));
  }, [items]);

  const SHIPPING_RULE = {
    MIN_KG: 20, MIN_FEE: 200, RATE_PER_KM: 6, EXTRA_RATE_PER_KG: 12,
  };

  // ✅ State for REAL road distance (from OSRM API via backend)
  const [shippingInfo, setShippingInfo] = useState<{
    distanceKm: number;
    distanceText: string;
    durationText: string;
    shippingFee: number;
  } | null>(null);

  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Fallback fee just in case
  const shippingFee = shippingInfo?.shippingFee || SHIPPING_RULE.MIN_FEE;

  // ✅ Call backend whenever address (with coords) or totalKg changes
  // ✅ Wrap estimateShipping in useCallback to prevent infinite loops
  const estimateShipping = useCallback(async () => {
    try {
      const buyerLat = selectedAddress?.lat;
      const buyerLng = selectedAddress?.lng;

      if (!buyerLat || !buyerLng) {
        setShippingError('ไม่พบพิกัดที่อยู่ กรุณาเพิ่มที่อยู่ก่อน');
        return;
      }

      // ✅ ประกาศ shopId ก่อน แล้วค่อย fetch
      const shopToken = localStorage.getItem('token');
      const shopId = items[0]?.shopId || (items[0] as any)?.shop_id;

      if (!shopId) {
        setShippingError('ไม่พบข้อมูลร้านค้า');
        return;
      }

      setShippingLoading(true);

      const shopRes = await fetch(`http://localhost:5000/api/shops/${shopId}`, {
        headers: { Authorization: `Bearer ${shopToken}` }
      });
      const shopData = await shopRes.json();
      const sellerLat = shopData?.data?.lat;
      const sellerLng = shopData?.data?.lng;

      console.log('✅ พิกัดผู้ซื้อ:', buyerLat, buyerLng);
      console.log('✅ พิกัดร้านค้า:', sellerLat, sellerLng);

      if (!sellerLat || !sellerLng) {
        setShippingError('ร้านค้ายังไม่ได้ปักหมุดที่ตั้งร้าน กรุณาติดต่อร้านค้า');
        setShippingLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        buyerLat: String(buyerLat),
        buyerLng: String(buyerLng),
        sellerLat: String(sellerLat),
        sellerLng: String(sellerLng),
        totalWeight: String(totalKg),
      });

      const res = await fetch(
        `http://localhost:5000/api/orders/estimate-shipping?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const d = data.data;

      setShippingInfo({
        distanceKm: d.distanceKm,
        distanceText: d.distanceText,
        durationText: d.durationText,
        shippingFee: d.shippingFee,
      });
      setShippingError(null);
    } catch (err: any) {
      console.error('Shipping error:', err.message);
      setShippingError(err.message || 'คำนวณค่าส่งไม่สำเร็จ');
      // Fallback
      setShippingInfo(null);
    } finally {
      setShippingLoading(false);
    }
  }, [selectedAddress, items, totalKg]);

  // ✅ useEffect with better dependency management - only call when address or weight really changes
  useEffect(() => {
    if (selectedAddress?.lat && selectedAddress?.lng && items.length > 0) {
      estimateShipping();
    }
  }, [selectedAddress?.lat, selectedAddress?.lng, totalKg, items.length, estimateShipping]);

  const grandTotal = useMemo(() => itemsSubtotal + shippingFee, [itemsSubtotal, shippingFee]);

  // -----------------------
  // other fields
  // -----------------------
  const [note, setNote] = useState('');
  // ✅ PromptPay เป็นวิธีชำระเงินเดียว (ลบ COD ออก)
  const paymentMethod: PaymentMethod = 'promptpay';

  const canSubmit = items.length > 0 && hasShippingInfo && hasDeliveryInfo && shippingFee > 0;


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

  // ✅ ลบ onConfirmCOD ออกไป เนื่องจาก COD ถูกลบออกจากระบบ

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
        groups: groups.map((g) => ({
          ...g,
          items: g.items.map((it: any) => ({
            ...it,
            qty: Number(it.quantity || it.qty || 1)
          }))
        })),
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

              {shippingLoading && (
                <p className="text-neutral-500">⏳ กำลังคำนวณค่าส่ง...</p>
              )}

              {shippingError && (
                <div className="text-red-600 bg-red-50 px-3.5 py-2.5 rounded-lg text-sm border border-red-200">
                  ⚠️ {shippingError}
                </div>
              )}

              {(!selectedAddress?.lat || !selectedAddress?.lng) && !shippingLoading && !shippingError && (
                <div className="mt-2 text-xs font-semibold text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ {i18n.language === 'th' ? 'กรุณาปักหมุดที่อยู่เพื่อความแม่นยำ' : 'Please pin your location for accuracy'}
                </div>
              )}

              {shippingInfo && !shippingLoading && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3.5">
                  <p className="my-1 text-[15px] font-semibold text-neutral-800">
                    📍 ระยะทางจริงบนถนน: {shippingInfo.distanceText}
                  </p>
                  <p className="my-1 text-[15px] font-semibold text-neutral-800">
                    ⏱ เวลาโดยประมาณ: {shippingInfo.durationText}
                  </p>
                  <p className="my-1 text-[15px] font-bold text-green-600">
                    🚚 ค่าจัดส่ง: ฿{shippingInfo.shippingFee.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Weight info box */}
              <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm text-neutral-600">{i18n.language === 'th' ? 'น้ำหนักรวม' : 'Total Weight'}</div>
                <div className="text-lg font-semibold text-neutral-900">{totalKg.toLocaleString()} kg</div>

                <div className="mt-2 text-xs text-neutral-600">{i18n.language === 'th' ? 'ขั้นต่ำคิดน้ำหนัก' : 'Minimum weight charged'}: {SHIPPING_RULE.MIN_KG} kg</div>
                <div className="text-xs text-neutral-600">
                  {i18n.language === 'th' ? 'อัตรา' : 'Rate'}: ระยะทาง x {SHIPPING_RULE.RATE_PER_KM} บาท/กม.
                  {totalKg > SHIPPING_RULE.MIN_KG && ` + น้ำหนักส่วนเกิน x ${SHIPPING_RULE.EXTRA_RATE_PER_KG} บาท/กก.`}
                </div>
                <div className="text-xs text-neutral-600">{i18n.language === 'th' ? 'ค่าส่งขั้นต่ำ' : 'Minimum shipping fee'}: {SHIPPING_RULE.MIN_FEE} บาท</div>
              </div>
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

            {/* วิธีชำระเงิน - PromptPay เท่านั้น */}
            <div className="card p-6">
              <div className="text-lg font-semibold text-neutral-900 mb-4">{i18n.language === 'th' ? 'วิธีชำระเงิน' : 'Payment method'}</div>
              <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
                <div className="font-semibold text-neutral-900">{i18n.language === 'th' ? 'QR พร้อมเพย (PromptPay)' : 'QR PromptPay'}</div>
                <div className="text-sm text-neutral-600 mt-1">{i18n.language === 'th' ? 'ไปหน้าชำระเงินและแนบสลิป' : 'Go to payment page and attach receipt'}</div>
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
                  <div className="text-neutral-600">{i18n.language === 'th' ? 'น้ำหนักรวม' : 'Total Weight'}</div>
                  <div className="font-semibold text-neutral-900">
                    {totalKg} kg
                    {totalKg < 20 && (
                      <span className="text-xs text-red-500 ml-2">(ขั้นต่ำ 20 kg)</span>
                    )}
                  </div>
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
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={onGoPromptPay}
                  className="btn btn-primary w-full"
                >
                  {i18n.language === 'th' ? 'ไปหน้าชำระเงิน (PromptPay)' : 'Go to payment (PromptPay)'}
                </button>

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
                            <div className="text-sm text-neutral-600">{it.weight || 0} kg</div>
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
                {addressLoading ? (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <div className="text-sm text-neutral-500">{i18n.language === 'th' ? 'กำลังโหลดที่อยู่...' : 'Loading addresses...'}</div>
                  </div>
                ) : addressBook.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-neutral-400 text-4xl mb-3">📍</div>
                    <div className="text-sm text-neutral-600 mb-4">
                      {i18n.language === 'th' ? 'ยังไม่มีที่อยู่ในระบบ' : 'No addresses yet'}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/profile', { state: { tab: 'address' } })}
                      className="btn btn-primary"
                    >
                      {i18n.language === 'th' ? '+ เพิ่มที่อยู่ใหม่' : '+ Add New Address'}
                    </button>
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

              <div className="px-5 py-4 border-t border-neutral-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/profile', { state: { tab: 'address' } })}
                  className="h-10 px-4 rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 transition flex items-center gap-1.5"
                >
                  <span className="text-lg leading-none">+</span>
                  {i18n.language === 'th' ? 'เพิ่มที่อยู่ใหม่' : 'Add New Address'}
                </button>
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