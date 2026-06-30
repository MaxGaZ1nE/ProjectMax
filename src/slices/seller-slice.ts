import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from './auth-slice';
// ✅ FIX 1: แก้ import path ให้ตรงกับ declaration file
import { sellerAPI } from '@services/backend-api';
import type { SellerProduct, SellerOrder, SellerStats } from '@services/api/seller-api';

type SellerAPIOrderActions = {
  getOrders: (filters?: { status?: string; paymentStatus?: string; excludeStatus?: string }) => Promise<{ data?: { data?: unknown } }>;
  getPendingOrders: () => Promise<{ data?: { data?: unknown } }>;
  getOrdersToShip: () => Promise<{ data?: { data?: unknown } }>;
  markShipping: (orderId: string) => Promise<{ data?: { data?: unknown } }>;
  markDelivered: (orderId: string) => Promise<{ data?: { data?: unknown } }>;
  updateOrderStatus: (id: string, status: string) => Promise<unknown>;
  verifyPayment: (id: string, verified?: boolean) => Promise<unknown>;
  rejectPayment: (id: string, reason?: string) => Promise<unknown>;
};

const typedSellerAPI = sellerAPI as unknown as SellerAPIOrderActions;

export type PromptPayType = 'phone' | 'id';

export type SellerProfile = {
  id?: number;
  isSeller: boolean;
  shopId: number;
  shopName: string;
  ownerName: string;
  phone: string;
  shopAvatar?: string; // ✅ Add shop avatar URL
  promptpay: {
    type: PromptPayType;
    value: string;
  };
  addressLine: string;
  province: string;
  postalCode: string;
  rating?: number;
  followersCount?: number;
  createdAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Async Thunks
// ─────────────────────────────────────────────────────────────────────────────

// ✅ FIX 2: fetchSellerProfile จับ 404 แล้ว return null แทน throw
//    ทำให้ user ที่ยังไม่ได้เป็น seller ไม่เห็น error ใน console
export const fetchSellerProfile = createAsyncThunk(
  'seller/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.getProfile();
      return (response as { data?: unknown }).data ?? null;
    } catch (err: unknown) {
      const e = err as { response?: { status?: number }; message?: string };
      // 404 = ยังไม่ได้เป็น seller → ไม่ใช่ error จริง
      if (e?.response?.status === 404) return null;
      // 401 = token หมดอายุ → silent fail
      if (e?.response?.status === 401) return null;
      return rejectWithValue(e?.message ?? 'Failed to fetch seller profile');
    }
  }
);

export const fetchSellerProducts = createAsyncThunk('seller/fetchProducts', async () => {
  return await sellerAPI.getMyProducts();
});

export const fetchSellerOrders = createAsyncThunk(
  'seller/fetchOrders',
  async (filters?: { status?: string; paymentStatus?: string; excludeStatus?: string }) => {
    const response = await typedSellerAPI.getOrders(filters);
    return response.data?.data ?? response.data ?? [];
  }
);

export const fetchPendingOrders = createAsyncThunk('seller/fetchPendingOrders', async () => {
  const response = await typedSellerAPI.getPendingOrders();
  return response.data?.data ?? response.data ?? [];
});

export const fetchOrdersToShip = createAsyncThunk('seller/fetchOrdersToShip', async () => {
  const response = await typedSellerAPI.getOrdersToShip();
  return response.data?.data ?? response.data ?? [];
});

export const fetchSellerStats = createAsyncThunk('seller/fetchStats', async () => {
  return await sellerAPI.getStats();
});

export const createSellerProduct = createAsyncThunk(
  'seller/createProduct',
  async (data: {
    name: string;
    price: number;
    stock: number;
    unit: string;
    weight: number;
    description?: string;
    image?: string;
  }) => {
    return await sellerAPI.createProduct(data);
  }
);

export const updateSellerProduct = createAsyncThunk(
  'seller/updateProduct',
  async (params: { id: string; data: Partial<SellerProduct> }) => {
    return await sellerAPI.updateProduct(params.id, params.data);
  }
);

export const deleteSellerProduct = createAsyncThunk(
  'seller/deleteProduct',
  async (id: string) => {
    await sellerAPI.deleteProduct(id);
    return id;
  }
);

export const markShipping = createAsyncThunk(
  'seller/markShipping',
  async ({ orderId }: { orderId: string }) => {
    const response = await typedSellerAPI.markShipping(orderId);
    return response.data?.data ?? response.data ?? { id: orderId, status: 'shipped' };
  }
);

export const markDelivered = createAsyncThunk(
  'seller/markDelivered',
  async ({ orderId }: { orderId: string }) => {
    const response = await typedSellerAPI.markDelivered(orderId);
    return response.data?.data ?? response.data ?? { id: orderId, status: 'completed' };
  }
);

export const updateOrderStatus = createAsyncThunk(
  'seller/updateOrderStatus',
  async (params: { orderId: string; status: 'waiting_driver' | 'picking_up' | 'shipped' | 'completed' | 'cancelled' | 'paid' | 'unpaid' | 'pending_payment' | 'claim' }) => {
    return await typedSellerAPI.updateOrderStatus(params.orderId, params.status);
  }
);

export const verifyPayment = createAsyncThunk(
  'seller/verifyPayment',
  async (params: { orderId: string; verified?: boolean }) => {
    return await typedSellerAPI.verifyPayment(params.orderId, params.verified);
  }
);

export const rejectPayment = createAsyncThunk(
  'seller/rejectPayment',
  async (params: { orderId: string; reason?: string }) => {
    await typedSellerAPI.rejectPayment(params.orderId, params.reason);
    return params.orderId;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

type SellerState = {
  profile: SellerProfile | null;
  products: SellerProduct[];
  orders: SellerOrder[];
  pendingOrders: SellerOrder[];
  ordersToShip: SellerOrder[];
  stats: SellerStats | null;
  loading: boolean;
  error: string | null;
};

const initialState: SellerState = {
  profile: null,
  products: [],
  orders: [],
  pendingOrders: [],
  ordersToShip: [],
  stats: null,
  loading: false,
  error: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────────────────

export const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {
    registerSeller: (
      state,
      action: PayloadAction<{
        shopId: number;
        shopName: string;
        ownerName: string;
        phone: string;
        promptpayType: PromptPayType;
        promptpayValue: string;
        addressLine: string;
        province: string;
        postalCode: string;
      }>
    ) => {
      state.profile = {
        isSeller: true,
        shopId: action.payload.shopId,
        shopName: action.payload.shopName,
        ownerName: action.payload.ownerName,
        phone: action.payload.phone,
        promptpay: {
          type: action.payload.promptpayType,
          value: action.payload.promptpayValue,
        },
        addressLine: action.payload.addressLine,
        province: action.payload.province,
        postalCode: action.payload.postalCode,
        createdAt: new Date().toISOString(),
      };
    },

    updateSellerProfile: (state, action: PayloadAction<Partial<SellerProfile>>) => {
      if (!state.profile) return;
      state.profile = { ...state.profile, ...action.payload };
    },

    updateShopName: (state, action: PayloadAction<{ shopName: string }>) => {
      const nextName = String(action.payload.shopName ?? '').trim();
      if (!nextName) return;
      if (!state.profile) {
        state.profile = {
          isSeller: true,
          shopId: 0,
          shopName: nextName,
          ownerName: '',
          phone: '',
          promptpay: { type: 'phone', value: '' },
          addressLine: '',
          province: '',
          postalCode: '',
          createdAt: new Date().toISOString(),
        };
      } else {
        state.profile.shopName = nextName;
      }
    },

    logoutSeller: (state) => {
      state.profile = null;
      state.products = [];
      state.orders = [];
      state.pendingOrders = [];
      state.ordersToShip = [];
      state.stats = null;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // ── Fetch Profile ─────────────────────────────────────────────────────────
    builder
      .addCase(fetchSellerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // ✅ แก้แล้ว — อ่านค่า isSeller จาก backend
.addCase(fetchSellerProfile.fulfilled, (state, action) => {
  state.loading = false;
  if (!action.payload) {
    state.profile = null;
    return;
  }
  const p = action.payload as Record<string, unknown> & { user?: Record<string, unknown> };
  const user = p.user as Record<string, unknown> | undefined;

  // ถ้า backend ยังไม่อนุมัติ → isSeller ยังเป็น false
  const isSeller = p.isSeller === true || p.status === 'approved';

  state.profile = {
    ...state.profile,
    id: (p.id ?? p.shopId ?? p.shop_id ?? 0) as number,
    isSeller,                          // ← อ่านจาก backend
    shopId: (p.shopId ?? p.id ?? p.shop_id ?? 0) as number,
    shopName: (p.shopName ?? p.shop_name ?? p.name ?? p.shopname ?? p.title ?? '') as string,
    shopAvatar: (p.shopAvatar ?? p.shop_avatar ?? p.avatar_url ?? p.avatar ?? p.image ?? p.logo ?? '') as string,
    ownerName: (p.ownerName ?? p.owner_name ?? `${(user?.firstName as string | undefined) ?? ''} ${(user?.lastName as string | undefined) ?? ''}`.trim() ?? '') as string,
    phone: (p.phone ?? (user?.phone as string | undefined) ?? '') as string,
    addressLine: (p.address ?? p.addressLine ?? p.address_line ?? '') as string,
    province: (p.province ?? p.province_name ?? '') as string,
    postalCode: (p.postalCode ?? p.postal_code ?? p.zipcode ?? '') as string,
    rating: p.rating as number | undefined,
    followersCount: p.followersCount as number | undefined,
    promptpay: (p.promptpay as SellerProfile['promptpay']) || { type: 'phone', value: '' },
    createdAt: (p.createdAt ?? p.created_at ?? new Date().toISOString()) as string,
  } as SellerProfile;
})
      .addCase(fetchSellerProfile.rejected, (state) => {
        // ✅ FIX: ไม่แสดง error เมื่อ 404/401 (rejectWithValue จะไม่ถูกเรียกในกรณีนั้น)
        state.loading = false;
        state.profile = null;
        // ไม่ set state.error เพื่อไม่ให้ UI แสดง error ที่ไม่จำเป็น
      });

    // ── Fetch Products ────────────────────────────────────────────────────────
    builder
      .addCase(fetchSellerProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = Array.isArray(action.payload) ? action.payload as SellerProduct[] : [];
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.error?.message || 'Failed to fetch products');
      });

    // ── Fetch Orders ──────────────────────────────────────────────────────────
    builder
      .addCase(fetchSellerOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = Array.isArray(action.payload) ? action.payload as SellerOrder[] : [];
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.error?.message || 'Failed to fetch orders');
      });

    // ── Fetch Pending Orders ──────────────────────────────────────────────────
    builder
      .addCase(fetchPendingOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPendingOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingOrders = Array.isArray(action.payload) ? action.payload as SellerOrder[] : [];
      })
      .addCase(fetchPendingOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.error?.message || 'Failed to fetch pending orders');
      });

    // ── Fetch Orders to Ship ──────────────────────────────────────────────────
    builder
      .addCase(fetchOrdersToShip.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOrdersToShip.fulfilled, (state, action) => {
        state.loading = false;
        state.ordersToShip = Array.isArray(action.payload) ? action.payload as SellerOrder[] : [];
      })
      .addCase(fetchOrdersToShip.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.error?.message || 'Failed to fetch orders to ship');
      });

    // ── Fetch Stats ───────────────────────────────────────────────────────────
    builder
      .addCase(fetchSellerStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSellerStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload as unknown as SellerStats;
      })
      .addCase(fetchSellerStats.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.error?.message || 'Failed to fetch stats');
      });

    // ── Create Product ────────────────────────────────────────────────────────
    builder
      .addCase(createSellerProduct.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createSellerProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload as unknown as SellerProduct);
      })
      .addCase(createSellerProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.error?.message || 'Failed to create product');
      });

    // ── Update Product ────────────────────────────────────────────────────────
    builder
      .addCase(updateSellerProduct.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateSellerProduct.fulfilled, (state, action) => {
        state.loading = false;
        const p = action.payload as unknown as SellerProduct;
        const idx = state.products.findIndex((x) => x.id === p.id);
        if (idx !== -1) state.products[idx] = p;
      })
      .addCase(updateSellerProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.error?.message || 'Failed to update product');
      });

    // ── Delete Product ────────────────────────────────────────────────────────
    builder
      .addCase(deleteSellerProduct.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteSellerProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteSellerProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.error?.message || 'Failed to delete product');
      });

    // ── Update Order Status ───────────────────────────────────────────────────
    builder
      .addCase(updateOrderStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const o = action.payload as SellerOrder;
        const update = (list: SellerOrder[]) => {
          const idx = list.findIndex((x) => x.id === o.id);
          if (idx !== -1) list[idx] = o;
        };
        update(state.orders);
        update(state.ordersToShip);
        state.ordersToShip = state.ordersToShip.filter((x) => x.status !== 'shipped');
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update order status';
      });

    // ── Verify Payment ────────────────────────────────────────────────────────
    builder
      .addCase(verifyPayment.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        const o = action.payload as SellerOrder;
        const idx = state.pendingOrders.findIndex((x) => x.id === o.id);
        if (idx !== -1) state.pendingOrders.splice(idx, 1);
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to verify payment';
      });

    // ── Reject Payment ────────────────────────────────────────────────────────
    builder
      .addCase(rejectPayment.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(rejectPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingOrders = state.pendingOrders.filter((o) => o.id !== action.payload);
      })
      .addCase(rejectPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to reject payment';
      });

    // ── Logout ────────────────────────────────────────────────────────────────
    builder.addCase(logout, (state) => {
      state.profile = null;
      state.products = [];
      state.orders = [];
      state.pendingOrders = [];
      state.ordersToShip = [];
      state.stats = null;
      state.loading = false;
      state.error = null;
    });
  },
});

export const { registerSeller, updateSellerProfile, updateShopName, logoutSeller, clearError } =
  sellerSlice.actions;

export default sellerSlice.reducer;