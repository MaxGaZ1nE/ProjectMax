# 📊 SELLER SYSTEM ANALYSIS - Current State vs What's Needed

**Analysis Date:** April 17, 2026  
**Status:** 50% Complete - Backend API ready, Frontend using mock data

---

## 📋 CURRENT IMPLEMENTATION STATUS

### ✅ **BACKEND - Seller APIs** (70% Complete)

#### Already Implemented:
| Endpoint | Method | Status | Tested |
|----------|--------|--------|--------|
| `/api/seller/register` | POST | ✅ Ready | Yes |
| `/api/seller/profile` | GET | ✅ Ready | Yes |
| `/api/seller/profile` | PUT | ✅ Ready | Yes |
| `/api/seller/stats` | GET | ✅ Ready | Yes |
| `/api/seller/dashboard` | GET | ✅ Ready | Yes |
| `/api/seller/revenue` | GET | ✅ Ready | Yes |
| `/api/seller/shops` | GET | ✅ Ready | Yes |
| `/api/seller/:shopId` | GET | ✅ Ready | Yes |

#### Partially Working / Missing:
| Endpoint | Status | Issue |
|----------|--------|-------|
| Stock management | ⚠️ Partial | Doesn't deduct stock from orders |
| Order tracking | ⚠️ Partial | Incomplete implementation |
| Followers count | ❌ Missing | Not updated when followed |
| Shop ratings | ⚠️ Partial | Not auto-updated with reviews |

---

### ❌ **FRONTEND - Seller Pages** (30% Complete)

#### Pages Created (BUT Using Mock Data):
```
src/pages/seller/
├── SellerDashboardPage.tsx     ❌ Mock data (localStorage)
├── SellerProductsPage.tsx      ❌ Mock data (localStorage)
├── SellerOrdersPendingPage.tsx ❌ Stub "TODO" message
├── SellerOrdersToShipPage.tsx  ❌ Stub "TODO" message
├── SellerSalesPage.tsx         ❌ Stub "TODO" message
├── SellerRegisterPage.tsx      ✅ Connected to backend
└── SellerLayout.tsx            ✅ Layout template
```

#### Storage Classes (Mock):
```
src/features/
├── seller-products/
│   └── seller-products-storage.ts  ❌ Uses localStorage
├── seller-orders/
│   └── seller-orders-storage.ts    ❌ Uses localStorage
```

---

## 🔴 **CRITICAL GAPS - What's Missing**

### **Gap #1: Frontend Not Connected to Backend**
**Files Affected:** All seller pages  
**Impact:** Sellers see fake mock data, changes don't sync to database

**Current Flow (Mock):**
```
Frontend (localStorage) ←→ Mock Data
↑
❌ NOT CONNECTED to Backend API
```

**Should Be:**
```
Frontend (UI Components) ←→ API Service ←→ Backend API ←→ Database
```

**What to do:**
1. Create `src/services/api/sellerAPI.ts` to call backend endpoints
2. Replace localStorage calls with API calls
3. Implement loading/error states
4. Add Redux slices for seller state

---

### **Gap #2: Incomplete Seller Pages**
**Files:** SellerOrdersPendingPage.tsx, SellerOrdersToShipPage.tsx, SellerSalesPage.tsx

**Current:**
```tsx
export const SellerOrdersPendingPage = () => {
  return <div>TODO: List pending orders</div>  // ❌ Stub only!
}
```

**Should be:**
```tsx
export const SellerOrdersPendingPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Fetch orders with paymentStatus=pending_verification
    fetchPendingOrders();
  }, []);
  
  return (
    <div>
      {orders.map(order => (
        <OrderCard 
          order={order}
          onApprove={() => approvePayment(order.id)}
          onReject={() => rejectPayment(order.id)}
        />
      ))}
    </div>
  );
}
```

---

### **Gap #3: API Endpoints Missing from Frontend**

**Backend has these endpoints but Frontend doesn't use them:**
- ❌ `GET /api/seller/orders` - Get orders for seller
- ❌ `PUT /api/orders/:id/status` - Update order status (seller)
- ❌ `POST /api/orders/:id/verify-payment` - Verify PromptPay
- ❌ `GET /api/seller/products` - Get seller's products
- ❌ `POST /api/products` - Create new product
- ❌ `PUT /api/products/:id` - Update product
- ❌ `DELETE /api/products/:id` - Delete product

---

### **Gap #4: Seller State Management**

**Missing:**
- Redux slice for seller state
- API integration layer
- Loading/error handling
- Real-time updates

---

## 🎯 **What Needs to Be Done - Priority Order**

### **PHASE 1: API Integration (2-3 days)**

**1.1 Create Seller API Service**
```typescript
// src/services/api/sellerAPI.ts
export const sellerAPI = {
  // Profile
  getProfile: () => GET /api/seller/profile,
  updateProfile: (data) => PUT /api/seller/profile,
  registerSeller: (data) => POST /api/seller/register,
  
  // Products
  getProducts: () => GET /api/seller/products,
  createProduct: (data) => POST /api/products,
  updateProduct: (id, data) => PUT /api/products/:id,
  deleteProduct: (id) => DELETE /api/products/:id,
  
  // Orders
  getOrders: (status?) => GET /api/orders?sellerFilter=true,
  getPendingOrders: () => GET /api/orders?paymentStatus=pending,
  getOrdersToShip: () => GET /api/orders?status=to_ship,
  updateOrderStatus: (id, status) => PUT /api/orders/:id/status,
  verifyPayment: (id, slip) => POST /api/orders/:id/verify-payment,
  
  // Analytics
  getStats: () => GET /api/seller/stats,
  getDashboard: () => GET /api/seller/dashboard,
  getRevenue: () => GET /api/seller/revenue,
};
```

**Files to Create:**
- `src/services/api/sellerAPI.ts` (NEW)
- `src/services/api/orderAPI.ts` (UPDATE - for seller endpoints)
- `src/services/api/productAPI.ts` (UPDATE - add seller endpoints)

**Effort:** 1-2 days

---

**1.2 Create Seller Redux Slice**
```typescript
// src/slices/seller-slice.ts
export interface SellerState {
  profile: SellerProfile | null;
  products: SellerProduct[];
  orders: SellerOrder[];
  stats: SellerStats | null;
  loading: boolean;
  error: string | null;
}

export const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {
    setProfile,
    setProducts,
    setOrders,
    setStats,
    setLoading,
    setError,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerProfile.fulfilled, ...)
      .addCase(fetchSellerProducts.fulfilled, ...)
      .addCase(fetchSellerOrders.fulfilled, ...);
  }
});
```

**Files to Create:**
- `src/slices/seller-slice.ts` (NEW)

**Effort:** 1 day

---

### **PHASE 2: Complete Seller Pages (3-4 days)**

**2.1 Update SellerProductsPage**
- ✅ Connected to backend API
- ✅ Display seller's products
- ✅ Add/Edit/Delete products
- ✅ Upload product images
- ✅ Manage stock

**2.2 Update SellerOrdersPendingPage**
- ✅ Fetch orders with paymentStatus=pending_verification
- ✅ Show pending payments
- ✅ Approve/Reject payment verification
- ✅ View customer details
- ✅ Download payment slip

**2.3 Update SellerOrdersToShipPage**
- ✅ Fetch orders with status=to_ship
- ✅ Show order details
- ✅ Update shipping address
- ✅ Get tracking number from carrier
- ✅ Mark as shipped
- ✅ Print label

**2.4 Update SellerSalesPage**
- ✅ Display analytics
- ✅ Revenue charts
- ✅ Top products
- ✅ Order trends
- ✅ Customer stats

**Effort:** 3-4 days

---

### **PHASE 3: Seller Features (2-3 days)**

**3.1 Order Management**
- Order approval/rejection workflow
- Automatic notifications
- Tracking integration
- Refund handling

**3.2 Product Management**
- Bulk upload
- Inventory management
- Price management
- Category management

**3.3 Shop Management**
- Shop customization
- Banner/logo
- Shop policies
- Settings

**Effort:** 2-3 days

---

## 📊 **Implementation Order**

**Recommended Timeline: 1 Week**

```
Monday      │ API Integration (sellerAPI.ts, Redux)     │ 1 day
Tuesday     │ Connect SellerProductsPage                 │ 1 day
Wednesday   │ Complete SellerOrdersPendingPage           │ 1 day
Thursday    │ Complete SellerOrdersToShipPage            │ 1 day
Friday      │ Complete SellerSalesPage + Testing         │ 1 day
```

---

## ✅ **Detailed Implementation Tasks**

### **Task 1: Create sellerAPI.ts** (4-5 hours)

**File:** `src/services/api/sellerAPI.ts`

```typescript
import { api } from './index';

export const sellerAPI = {
  // ==================== PROFILE ====================
  async getProfile() {
    const res = await api.get('/seller/profile');
    return res.data.data;
  },

  async updateProfile(data) {
    const res = await api.put('/seller/profile', {
      shop_name: data.shopName,
      owner_name: data.ownerName,
      phone: data.phone,
      address_line: data.address,
      province: data.province,
      postal_code: data.postalCode,
    });
    return res.data.data;
  },

  async registerSeller(data) {
    const res = await api.post('/seller/register', {
      shop_name: data.shopName,
      owner_name: data.ownerName,
      phone: data.phone,
      address_line: data.address,
      province: data.province,
      postal_code: data.postalCode,
    });
    return res.data;
  },

  // ==================== PRODUCTS ====================
  async getProducts(shopId) {
    // Backend endpoint needed: GET /api/seller/products
    const res = await api.get(`/seller/products?shopId=${shopId}`);
    return res.data.data;
  },

  async createProduct(data) {
    const res = await api.post('/products', {
      name: data.name,
      price: data.price,
      quantity_in_stock: data.stock,
      unit: data.unit,
      weight: data.weight,
      description: data.description,
      image: data.image,
    });
    return res.data.data;
  },

  async updateProduct(id, data) {
    const res = await api.put(`/products/${id}`, {
      name: data.name,
      price: data.price,
      quantity_in_stock: data.stock,
      unit: data.unit,
      weight: data.weight,
      description: data.description,
      image: data.image,
    });
    return res.data.data;
  },

  async deleteProduct(id) {
    await api.delete(`/products/${id}`);
  },

  // ==================== ORDERS ====================
  async getOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await api.get(`/seller/orders?${params}`);
    return res.data.data;
  },

  async getPendingOrders() {
    // Orders waiting for payment verification
    const res = await api.get('/seller/orders?paymentStatus=pending_verification');
    return res.data.data;
  },

  async getOrdersToShip() {
    // Orders ready to ship
    const res = await api.get('/seller/orders?status=to_ship');
    return res.data.data;
  },

  async updateOrderStatus(orderId, status) {
    const res = await api.put(`/orders/${orderId}/status`, { status });
    return res.data.data;
  },

  async verifyPayment(orderId, verified = true) {
    const res = await api.post(`/orders/${orderId}/verify-payment`, { verified });
    return res.data.data;
  },

  // ==================== ANALYTICS ====================
  async getStats() {
    const res = await api.get('/seller/stats');
    return res.data.data;
  },

  async getDashboard() {
    const res = await api.get('/seller/dashboard');
    return res.data.data;
  },

  async getRevenue(period = 'month') {
    const res = await api.get(`/seller/revenue?period=${period}`);
    return res.data.data;
  },
};
```

---

### **Task 2: Create seller-slice.ts** (2-3 hours)

**File:** `src/slices/seller-slice.ts`

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sellerAPI } from '@services/api/sellerAPI';

export interface SellerProfile {
  id: number;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  province: string;
  postalCode: string;
  rating: number;
  followersCount: number;
}

export interface SellerProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  weight: number;
  image?: string;
}

export interface SellerOrder {
  id: string;
  status: 'pending' | 'to_ship' | 'shipped' | 'delivered';
  totalPrice: number;
  customerName: string;
  paymentStatus: string;
  createdAt: string;
}

interface SellerState {
  profile: SellerProfile | null;
  products: SellerProduct[];
  orders: SellerOrder[];
  stats: any;
  loading: boolean;
  error: string | null;
}

const initialState: SellerState = {
  profile: null,
  products: [],
  orders: [],
  stats: null,
  loading: false,
  error: null,
};

export const fetchSellerProfile = createAsyncThunk(
  'seller/fetchProfile',
  async () => {
    return await sellerAPI.getProfile();
  }
);

export const fetchSellerProducts = createAsyncThunk(
  'seller/fetchProducts',
  async (shopId: number) => {
    return await sellerAPI.getProducts(shopId);
  }
);

export const fetchSellerOrders = createAsyncThunk(
  'seller/fetchOrders',
  async (filters: any) => {
    return await sellerAPI.getOrders(filters);
  }
);

export const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchSellerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      });
  },
});

export default sellerSlice.reducer;
```

---

### **Task 3: Update SellerProductsPage** (1-2 days)

```typescript
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { fetchSellerProducts } from '@slices/seller-slice';
import { sellerAPI } from '@services/api/sellerAPI';

export const SellerProductsPage = () => {
  const dispatch = useAppDispatch();
  const { profile, products, loading, error } = useAppSelector(s => s.seller);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      dispatch(fetchSellerProducts(profile.id));
    }
  }, [dispatch, profile]);

  const handleAddProduct = async (data) => {
    try {
      await sellerAPI.createProduct(data);
      // Refresh products list
      dispatch(fetchSellerProducts(profile!.id));
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('ยืนยันการลบสินค้า?')) {
      try {
        await sellerAPI.deleteProduct(id);
        dispatch(fetchSellerProducts(profile!.id));
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  return (
    <div className="seller-products-page">
      <header>
        <h1>ร้านค้าของฉัน - สินค้า</h1>
        <button onClick={() => setShowForm(true)}>+ เพิ่มสินค้า</button>
      </header>

      {showForm && (
        <ProductForm
          onSubmit={handleAddProduct}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading && <div>กำลังโหลด...</div>}
      {error && <div className="error">{error}</div>}

      <div className="products-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={() => {}}
            onDelete={() => handleDeleteProduct(product.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 🚀 **Quick Start - Do This First**

**If you only have 1-2 days, do this minimum:**

1. ✅ Create `sellerAPI.ts` (4-5 hours)
2. ✅ Create `seller-slice.ts` (2-3 hours)
3. ✅ Update `SellerProductsPage.tsx` to use API (2-3 hours)

**Result:** Seller can manage products connected to real backend (Week 1)

---

## 📋 **Next Steps**

**Ready to start?** Pick one:

**Option A:** Start with API Integration (easy, high impact)
- Create sellerAPI.ts → Create seller-slice.ts → Update SellerProductsPage

**Option B:** Start with fixing pending/orders pages (complex, but important)
- Fix SellerOrdersPendingPage → Fix SellerOrdersToShipPage → Connect to API

**Option C:** Do both in parallel (if 2+ developers)
- Dev 1: API integration
- Dev 2: Complete seller pages

---

**Files to Create/Edit:**
```
CREATE: src/services/api/sellerAPI.ts
CREATE: src/slices/seller-slice.ts
EDIT:   src/pages/seller/SellerProductsPage.tsx
EDIT:   src/pages/seller/SellerOrdersPendingPage.tsx
EDIT:   src/pages/seller/SellerOrdersToShipPage.tsx
EDIT:   src/pages/seller/SellerSalesPage.tsx
EDIT:   src/routes/index.tsx (if routes need updating)
```

Total Effort: 1 week (full implementation)  
Minimum Effort: 2 days (API + product management)
