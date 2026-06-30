import { useMemo, useState, useEffect, useTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@contexts/AuthContext';
import { cartAPI } from '@services/backend-api';

interface CartItem {
  id: number;
  product_id: number;
  shop_id: number;
  shop_name: string;
  name: string;
  price: number;
  quantity: number;
  weight: number;
  images?: string[];
  image?: string;
}

type Group = {
  shop_id: number;
  shop_name: string;
  items: CartItem[];
};

const itemKey = (it: CartItem) =>
  `${it.product_id}__${it.weight}`;

function clampInt(value: unknown, fallback = 1) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

const unitLabel = () => 'Kg';

const lineTotal = (it: CartItem) => {
  const kg = Number(it.weight ?? 0);
  const base = kg > 0 ? it.price * kg : it.price;
  return base * it.quantity;
};

function CartItemRow({ item, checked, onToggle, onRemove, onUpdateWeight }: { 
  item: CartItem, 
  checked: boolean, 
  onToggle: () => void, 
  onRemove: () => void, 
  onUpdateWeight: (w: number) => void 
}) {
  const { i18n } = useTranslation();
  const [unit, setUnit] = useState<'Kg' | 'Ton'>('Kg');
  const [inputValue, setInputValue] = useState<number>(item.weight);

  useEffect(() => {
    setInputValue(unit === 'Ton' ? item.weight / 1000 : item.weight);
  }, [item.weight, unit]);

  const commitWeight = (val: number, currentUnit: 'Kg'|'Ton') => {
    let finalKg = currentUnit === 'Ton' ? val * 1000 : val;
    finalKg = Math.max(1, finalKg); // minimum 1 kg
    onUpdateWeight(finalKg);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val) || val <= 0) {
      val = unit === 'Ton' ? 0.001 : 1;
    }
    setInputValue(val);
    commitWeight(val, unit);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as 'Kg' | 'Ton';
    setUnit(newUnit);
  };

  return (
    <div className="px-4 py-4 flex gap-4 items-start">
      {/* checkbox */}
      <div className="pt-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-5 w-5 accent-primary-600 cursor-pointer"
        />
      </div>

      {/* ✅ รูปสินค้า → กดไปหน้า details */}
      <Link
        to={`/details/${item.product_id}`}
        className="h-16 w-16 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 shrink-0 hover:ring-2 hover:ring-emerald-400 transition"
      >
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-neutral-400">
            No img
          </div>
        )}
      </Link>

      {/* info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/details/${item.product_id}`}
          className="font-semibold text-neutral-900 truncate block hover:text-emerald-700 transition"
        >
          {item.name}
        </Link>
        <div className="text-sm font-medium text-emerald-600 mt-1">
          ฿{item.price.toLocaleString()} / Kg
        </div>

        {/* Weight Editor UI mimicking Product Detail */}
        <div className="mt-3 flex items-end gap-3 max-w-xs">
          {/* Amount input */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {i18n.language === 'th' ? 'น้ำหนัก' : 'Weight'}
            </label>
            <div className="flex items-center rounded-lg border border-neutral-300 bg-white shadow-sm overflow-hidden h-9">
              <input
                type="number"
                min={unit === 'Ton' ? 0.001 : 1}
                step={unit === 'Ton' ? 0.1 : 1}
                value={inputValue}
                onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
                onBlur={handleInputBlur}
                className="w-full text-center text-sm font-medium focus:outline-none border-none h-full py-0"
              />
            </div>
          </div>

          {/* Unit dropdown */}
          <div className="w-[80px]">
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {i18n.language === 'th' ? 'หน่วย' : 'Unit'}
            </label>
            <select
              value={unit}
              onChange={handleUnitChange}
              className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-2 h-9 text-sm font-medium text-neutral-700 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
            >
              <option value="Kg">Kg</option>
              <option value="Ton">Ton</option>
            </select>
          </div>
        </div>
      </div>

      {/* total + remove */}
      <div className="text-right">
        <div className="text-sm text-neutral-500">{i18n.language === 'th' ? 'รวม' : 'Total'}</div>
        <div className="text-lg font-semibold text-red-600">
          ฿{lineTotal(item).toLocaleString()}
        </div>
        <button
          type="button"
          title={i18n.language === 'th' ? 'ลบ' : 'Remove'}
          className="btn !px-0 !py-0 mt-2 h-9 w-9 inline-flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-700 transition"
          onClick={onRemove}
          aria-label="remove"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [, startTransition] = useTransition();

  // State for cart data from API
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Fetch cart on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      // Don't redirect, just leave cart empty and show message
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 🔍 Debug logging
        const token = localStorage.getItem('token');
        console.log('🛒 CartPage loading...');
        console.log('   Token exists:', !!token);
        console.log('   Token length:', token?.length || 0);
        
        const response = await cartAPI.getCart();
        
        // Backend CartController returns { data: { items: [...], summary } }
        // Items are already transformed to camelCase by cartController.transformCartItem
        const rawItems = response.data?.data?.items || response.data?.items || [];
        console.log('✅ Cart loaded successfully with', rawItems.length, 'items');
        
        const cartItems = rawItems.map((item: any) => ({
          id: item.product_id || item.id,
          product_id: item.product_id || Number(item.id),
          shop_id: item.shop_id || item.shopId,
          shop_name: item.shop_name || item.shopName || '',
          name: item.product_name || item.name || '',
          price: Number(item.price || 0),
          quantity: item.quantity || item.qty || 1,
          weight: Number(item.weight || 1),
          image: item.images?.[0] || item.image || '/no-image.png',
        }));
        setItems(cartItems);
        setSelected(new Set(cartItems.map(itemKey)));
      } catch (err: any) {
        console.error('❌ Error fetching cart:', err);
        
        // 🔍 Enhanced error logging
        if (err?.response?.status === 401) {
          const errorMsg = 'Your session has expired. Please login again.';
          setError(errorMsg);
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/auth/login');
          }, 2000);
        } else if (err?.response?.status === 403) {
          const errorMsg = 'You do not have permission to access your cart. Please try logging in again.';
          setError(errorMsg);
          console.log('   Status:', err.response.status);
          console.log('   Message:', err.response.data?.message);
        } else {
          const errorMsg = err?.response?.data?.message || 
                          err?.message || 
                          'Failed to fetch cart. Please try again later.';
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isAuthenticated, navigate]);

  const groups: Group[] = useMemo(() => {
    const map = new Map<number, Group>();
    for (const it of items) {
      const g = map.get(it.shop_id) ?? { shop_id: it.shop_id, shop_name: it.shop_name, items: [] };
      g.items.push(it);
      map.set(it.shop_id, g);
    }
    return Array.from(map.values());
  }, [items]);

  const selectedItems = useMemo(() => items.filter((it) => selected.has(itemKey(it))), [items, selected]);
  const selectedTotal = useMemo(() => selectedItems.reduce((sum, it) => sum + lineTotal(it), 0), [selectedItems]);

  const toggleItem = (it: CartItem) => {
    const k = itemKey(it);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(items.map(itemKey)));
  const clearSelection = () => setSelected(new Set());

  const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    try {
      await cartAPI.updateCartItem(productId, newQuantity);
      setItems(items.map(it => 
        it.product_id === productId ? { ...it, quantity: newQuantity } : it
      ));
    } catch (err) {
      console.error('Error updating cart:', err);
      setError('Failed to update cart');
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      await cartAPI.removeFromCart(productId);
      setItems(items.filter(it => it.product_id !== productId));
      setSelected(prev => {
        const next = new Set(prev);
        next.delete(itemKey(items.find(it => it.product_id === productId)!));
        return next;
      });
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart');
    }
  };

  const proceed = () => {
    if (selectedItems.length === 0) return;
    navigate('/checkout', { state: { selectedItems } });
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold">
          {i18n.language === 'th' ? 'กำลังโหลดตะกร้า...' : 'Loading cart...'}
        </div>
      </div>
    );
  }

  if (error) {
    const is403Error = error.includes('403') || error.includes('Forbidden') || error.includes('Permission');
    const is401Error = error.includes('401') || error.includes('expired') || error.includes('session');
    
    return (
      <div className="py-16 text-center px-4">
        <div className="text-xl font-semibold text-red-600 mb-4">{error}</div>
        
        {/* 403 Error - Permission/Auth issue */}
        {is403Error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
            <div className="text-sm text-gray-700 space-y-3">
              <p className="font-semibold text-yellow-800">
                {i18n.language === 'th' ? '⚠️ ไม่สามารถเข้าถึงตะกร้า' : '⚠️ Unable to access cart'}
              </p>
              <p>
                {i18n.language === 'th' 
                  ? 'กรุณาลองเข้าสู่ระบบใหม่ หรือตรวจสอบการเชื่อมต่อ Backend'
                  : 'Please try logging in again or check your connection'}
              </p>
            </div>
          </div>
        )}
        
        {/* 401 Error - Session expired */}
        {is401Error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
            <div className="text-sm text-gray-700 space-y-3">
              <p className="font-semibold text-blue-800">
                {i18n.language === 'th' ? '🔐 เซสชันหมดอายุ' : '🔐 Session Expired'}
              </p>
              <p>
                {i18n.language === 'th' 
                  ? 'กรุณาเข้าสู่ระบบใหม่เพื่อดำเนินการต่อ'
                  : 'Please log in again to continue'}
              </p>
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <Link 
            to="/auth/login" 
            className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            {i18n.language === 'th' ? '🔐 เข้าสู่ระบบใหม่' : '🔐 Login Again'}
          </Link>
          <Link 
            to="/" 
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            {i18n.language === 'th' ? '🛍️ กลับไปเลือกสินค้า' : '🛍️ Continue Shopping'}
          </Link>
        </div>
        
        {/* Debug info */}
        <div className="text-xs text-gray-500 mt-6">
          <p>{i18n.language === 'th' ? 'ข้อมูลข้อผิดพลาด:' : 'Error details:'}</p>
          <p className="font-mono text-left bg-gray-100 rounded p-2 mt-2 inline-block max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold">
          {i18n.language === 'th' ? 'ยังไม่มีสินค้าในตะกร้า' : 'Your cart is empty'}
        </div>
        <Link className="text-primary-600 underline underline-offset-4" to="/">
          {i18n.language === 'th' ? 'กลับไปเลือกสินค้า' : 'Continue shopping'}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 py-10 min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-8">
            <div className="card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-neutral-900">
                    {i18n.language === 'th' ? 'ตะกร้าสินค้า' : 'Shopping Cart'}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {i18n.language === 'th' ? 'เลือกเฉพาะรายการที่ต้องการชำระเงิน' : 'Select items you want to pay for'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={selectAll} className="btn">
                    {i18n.language === 'th' ? 'เลือกทั้งหมด' : 'Select All'}
                  </button>
                  <button type="button" onClick={clearSelection} className="btn">
                    {i18n.language === 'th' ? 'ไม่เลือกทั้งหมด' : 'Deselect All'}
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {groups.map((g) => (
                  <div key={g.shop_id} className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
                    {/* ✅ ชื่อร้าน → ไปหน้าร้าน */}
                    <div className="bg-neutral-50 px-4 py-2">
                      <Link
                        to={`/shop/${g.shop_id}`}
                        className="font-semibold text-neutral-900 hover:text-emerald-700 transition"
                      >
                        🏪 {g.shop_name}
                      </Link>
                    </div>

                    <div className="divide-y divide-neutral-200">
                      {g.items.map((it) => (
                        <CartItemRow 
                          key={itemKey(it)}
                          item={it}
                          checked={selected.has(itemKey(it))}
                          onToggle={() => toggleItem(it)}
                          onRemove={() => handleRemoveItem(it.product_id)}
                          onUpdateWeight={async (newWeight) => {
                            if (newWeight <= 0) {
                              handleRemoveItem(it.product_id);
                              return;
                            }
                            try {
                              // quantity is 1 for wholesale, weight is the dynamic value
                              await cartAPI.updateCartItem(it.product_id, 1, newWeight);
                              setItems((prev) => prev.map(p => p.product_id === it.product_id ? { ...p, weight: newWeight } : p));
                            } catch (err) {
                              console.error('Error updating weight:', err);
                              setError('Failed to update cart item');
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between text-sm">
                <Link className="text-primary-600 hover:text-primary-500 underline underline-offset-4" to="/">
                  {i18n.language === 'th' ? 'กลับไปเลือกสินค้า' : 'Continue shopping'}
                </Link>
                <div className="text-neutral-600">{i18n.language === 'th' ? 'เลือกแล้ว ' : 'Selected '}{selectedItems.length}{i18n.language === 'th' ? ' รายการ' : ' items'}</div>
              </div>
            </div>
          </div>

          {/* RIGHT: summary */}
          <div className="lg:col-span-4">
            <div className="card p-6 sticky top-24">
              <div className="text-lg font-semibold text-neutral-900">{i18n.language === 'th' ? 'สรุปยอดชำระเงิน' : 'Payment summary'}</div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-neutral-600">{i18n.language === 'th' ? 'ยอดรวม (เฉพาะที่เลือก)' : 'Total selected'}</div>
                  <div className="font-semibold text-red-600">{selectedTotal.toLocaleString()}</div>
                </div>
              </div>
              <button
                type="button"
                disabled={selectedItems.length === 0}
                onClick={proceed}
                className={['btn btn-primary w-full mt-5', selectedItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}
              >
                {i18n.language === 'th' ? 'ชำระเงิน' : 'Checkout'}
              </button>
              {selectedItems.length === 0 && (
                <div className="mt-2 text-xs text-neutral-500">{i18n.language === 'th' ? 'กรุณาเลือกสินค้าที่ต้องการชำระเงินก่อน' : 'Please select items to checkout first'}</div>
              )}
              <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
                {i18n.language === 'th' ? 'ทิป: ถ้าซื้อหลายร้าน ระบบจะแยกคำสั่งซื้อเป็นรายร้านตอน Checkout' : 'Tip: If you buy from multiple shops, the system will split orders by shop during checkout'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}