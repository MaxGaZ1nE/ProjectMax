import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  qty: number;

  shopId: number;
  shopName: string;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'qty'> & { qty?: number }>) => {
      const { id, name, price, image, qty, shopId, shopName } = action.payload;
        const addQty = qty ?? 1;

    const existing = state.items.find((i) => i.id === id);

  if (existing) {
    existing.qty += addQty;
    // กันกรณีชื่อร้านเปลี่ยน
    existing.shopId = shopId;
    existing.shopName = shopName;
  } else {
    state.items.push({ id, name, price, image, qty: addQty, shopId, shopName });
  }
},

    removeFromCart: (state, action: PayloadAction<{ id: string }>) => {
      state.items = state.items.filter((i) => i.id !== action.payload.id);
    },

    setQty: (state, action: PayloadAction<{ id: string; qty: number }>) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return;
      item.qty = Math.max(1, action.payload.qty);
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, setQty, clearCart } = cartSlice.actions;
export default cartSlice.reducer;