import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from './auth-slice';

/**
 * ✅ บังคับหน่วยเหลือแค่ Kg เท่านั้นทั้งระบบ
 */
export type UnitType = 'kg';

export type CartItem = {
  id: string; // product id ที่ใช้กับหน้า /details/:id
  name: string;
  price: number;
  image?: string;
  qty: number;

  shopId: number;
  shopName: string;

  unit: UnitType; // ✅ now only 'kg'
  weight: number;

  // ✅ ใหม่: ถ้าสินค้ามาจากผู้ขาย (localStorage) ให้ใส่ id จริงของ seller product
  sellerProductId?: string;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

type AddToCartPayload = Omit<CartItem, 'qty'> & { qty?: number };

function sameKey(
  a: CartItem,
  b: { id: string; unit: UnitType; weight: number; sellerProductId?: string }
) {
  return (
    a.id === b.id &&
    a.unit === b.unit &&
    a.weight === b.weight &&
    (a.sellerProductId ?? '') === (b.sellerProductId ?? '')
  );
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const { id, name, price, image, qty, shopId, shopName, unit, weight, sellerProductId } =
        action.payload;

      // ✅ กันค่าผิดพลาด
      const addQty = Math.max(1, Math.floor(Number(qty ?? 1) || 1));

      const existing = state.items.find((i) => sameKey(i, { id, unit, weight, sellerProductId }));

      if (existing) {
        existing.qty += addQty;
        existing.shopId = shopId;
        existing.shopName = shopName;
      } else {
        state.items.push({
          id,
          name,
          price,
          image,
          qty: addQty,
          shopId,
          shopName,
          unit, // 'kg' เท่านั้น
          weight,
          sellerProductId,
        });
      }
    },

    removeFromCart: (
      state,
      action: PayloadAction<{ id: string; unit: UnitType; weight: number; sellerProductId?: string }>
    ) => {
      const { id, unit, weight, sellerProductId } = action.payload;
      state.items = state.items.filter((i) => !sameKey(i, { id, unit, weight, sellerProductId }));
    },

    setQty: (
      state,
      action: PayloadAction<{ id: string; unit: UnitType; weight: number; qty: number; sellerProductId?: string }>
    ) => {
      const { id, unit, weight, qty, sellerProductId } = action.payload;

      const item = state.items.find((i) => sameKey(i, { id, unit, weight, sellerProductId }));
      if (!item) return;

      item.qty = Math.max(1, Math.floor(Number(qty) || 1));
    },

    /**
     * ✅ คง reducer นี้ไว้เพื่อ backward compatibility (กันไฟล์อื่น import แล้วพัง)
     * แต่ในระบบที่บังคับเป็น Kg อย่างเดียว การเปลี่ยนหน่วยไม่มีความหมายแล้ว
     */
    setUnitWeight: (
      state,
      action: PayloadAction<{
        id: string;
        unit: UnitType;
        weight: number;
        newUnit: UnitType;
        newWeight: number;
        sellerProductId?: string;
      }>
    ) => {
      const { id, unit, weight, newWeight, sellerProductId } = action.payload;

      const item = state.items.find((i) => sameKey(i, { id, unit, weight, sellerProductId }));
      if (!item) return;

      // ✅ อนุญาตให้เปลี่ยน "น้ำหนัก" ได้ (กรณีอนาคตมี UI ให้แก้)
      const safeWeight = Math.max(0, Number(newWeight) || 0);
      if (item.weight === safeWeight) return;

      // หน่วยมีได้แค่ kg อยู่แล้ว
      item.weight = safeWeight;
      item.unit = 'kg';
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
  // ✅ เมื่อ logout → ล้าง cart ทันที
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.items = [];
    });
  },
});

export const { addToCart, removeFromCart, setQty, setUnitWeight, clearCart } = cartSlice.actions;

/**
 * ✅ Memoized Selectors (prevent unnecessary rerenders)
 */
export const selectCartItems = createSelector(
  (state: { cart: CartState }) => state.cart.items,
  (items) => items
);

export const selectCartTotal = createSelector(
  (state: { cart: CartState }) => state.cart.items,
  (items) => items.reduce((total, item) => total + item.price * item.qty, 0)
);

export const selectCartCount = createSelector(
  (state: { cart: CartState }) => state.cart.items,
  (items) => items.length
);

export default cartSlice.reducer;