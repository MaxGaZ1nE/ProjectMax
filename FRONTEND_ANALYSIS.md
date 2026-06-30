# Frontend Codebase Analysis - Qino Fruit Store

**Analysis Date:** April 14, 2026  
**Codebase Location:** `d:\mongkol\qino-template-fruit-store`  
**Primary Technologies:** React, TypeScript, Redux Toolkit, React Router, Tailwind CSS

---

## 1. DATA STRUCTURES & TYPES

### 1.1 Authentication & User

**File:** [src/slices/auth-slice.ts](src/slices/auth-slice.ts)

```typescript
export type Gender = 'male' | 'female' | 'other' | '';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string; // backward compatibility
  phone?: string;
  birthDate?: string; // YYYY-MM-DD
  gender?: Gender;
  address?: string;
  province?: string;
  postalCode?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
  address?: string;
  province?: string;
  postalCode?: string;
};
```

**File:** [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx)
- Context provides: `user`, `token`, `loading`, `error`
- Methods: `register()`, `login()`, `logout()`, `getProfile()`, `updateProfile()`, `changePassword()`
- Token stored in `localStorage` as key `'token'`
- User stored in `localStorage` as key `'user'` (JSON stringified)

---

### 1.2 Cart & Shopping

**File:** [src/slices/cart-slice.ts](src/slices/cart-slice.ts)

```typescript
export type UnitType = 'kg'; // Only kg supported

export type CartItem = {
  id: string; // product id
  name: string;
  price: number;
  image?: string;
  qty: number;
  
  shopId: number;
  shopName: string;
  
  unit: UnitType; // 'kg' only
  weight: number;
  
  sellerProductId?: string; // For seller products
};

type CartState = {
  items: CartItem[];
};
```

**File:** [src/slices/checkout-slice.ts](src/slices/checkout-slice.ts)

```typescript
export type CheckoutDraft = {
  fullName: string;
  phone: string;
  address: string;
  note: string;
  paymentMethod: PaymentMethod; // 'cod' | 'promptpay'
};
```

---

### 1.3 Orders

**File:** [src/slices/order-slice.ts](src/slices/order-slice.ts)

```typescript
export type PaymentMethod = 'cod' | 'promptpay';
export type PaymentStatus = 'none' | 'pending_verification' | 'paid' | 'failed';
export type DeliverySlot = 'morning' | 'afternoon';

export type CheckoutInfo = {
  fullName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: PaymentMethod;
  deliveryDate: string; // YYYY-MM-DD
  deliverySlot: DeliverySlot;
  
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  paidAt?: string;
  slipBase64?: string;
  stockDeducted?: boolean;
};

export type OrderStatus =
  | 'unpaid'      // Awaiting payment
  | 'paid'        // Payment confirmed
  | 'to_ship'     // Ready to ship
  | 'shipping'    // In transit
  | 'delivered'   // Delivered
  | 'claim'       // Claim/complaint raised
  | 'canceled';   // Canceled

export type ClaimStatus = 'requested' | 'approved' | 'rejected' | 'refunded';

export type Claim = {
  status: ClaimStatus;
  reason: string;
  note?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  rejectReason?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  deliveredAt?: string;
  
  shopId: number;
  shopName: string;
  items: OrderItem[];
  
  itemsSubtotal: number; // excluding shipping
  shippingFee: number;
  grandTotal: number; // including shipping
  
  checkout: CheckoutInfo;
  status: OrderStatus;
  
  cancelReason?: string;
  paidAt?: string;
  claim?: Claim;
};

export type OrderItem = CartItem;
```

---

### 1.4 Reviews

**File:** [src/slices/reviews-slice.ts](src/slices/reviews-slice.ts)

```typescript
export type Review = {
  id: string;
  productKey: string; // 'base:123' or 'seller:SELLER_PRODUCT_ID'
  productId?: number;
  
  orderId: string;
  shopId: number;
  
  username: string;
  avatar: string;
  
  rating: number;
  qualityText?: string;
  tasteText?: string;
  body: string;
  image?: string;
  variantText?: string;
  
  createdAt: string;
};

type ReviewsState = {
  reviews: Review[];
  reviewed: string[]; // Stores keys like "${orderId}_${productKey}"
};
```

---

### 1.5 Seller

**File:** [src/slices/seller-slice.ts](src/slices/seller-slice.ts)

```typescript
export type PromptPayType = 'phone' | 'id';

export type SellerProfile = {
  isSeller: boolean;
  shopId: number;
  shopName: string;
  
  ownerName: string;
  phone: string;
  
  promptpay: {
    type: PromptPayType;
    value: string;
  };
  
  addressLine: string;
  province: string;
  postalCode: string;
  
  createdAt: string; // ISO
};
```

---

### 1.6 Followed Shops

**File:** [src/slices/follow-shop-slice.ts](src/slices/follow-shop-slice.ts)

```typescript
export type FollowedShop = {
  shopId: number;
  shopName: string;
  followers: number;
  lastNotificationAt: string; // ISO timestamp
  notificationCount: number;
};
```

---

### 1.7 Configuration

**File:** [src/config/index.ts](src/config/index.ts)

```typescript
export const config = {
  // Environment
  env: import.meta.env.VITE_ENVIRONMENT || 'development',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  
  // API URLs
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // App info
  appName: import.meta.env.VITE_APP_NAME || 'Qino App',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
} as const;
```

**Environment Variables Needed:**
- `VITE_ENVIRONMENT`: 'development' | 'staging' | 'production'
- `VITE_API_URL`: Backend API base URL (default: `http://localhost:3000/api`)
- `VITE_API_TIMEOUT`: Request timeout in ms (default: 30000)
- `VITE_APP_NAME`: Application name
- `VITE_APP_VERSION`: Version string

---

## 2. API CALLS MADE BY FRONTEND

### Backend API Configuration

**File:** [src/services/backend-api.js](src/services/backend-api.js)

```javascript
const API_BASE_URL = 'http://localhost:5000/api'; // Current config
```

**Current Config:** `http://localhost:5000/api` (hardcoded)  
**Should use config:** From [src/config/index.ts](src/config/index.ts) instead

**Authentication Setup:**
- Token injected via request interceptor from `localStorage.getItem('token')`
- Header format: `Authorization: Bearer {token}`
- Token expiry handling: 401 redirects to `/auth/login`

---

### 2.1 Authentication APIs

**File:** [src/services/backend-api.js](src/services/backend-api.js) (Lines 44-63)

#### Register
```javascript
POST /auth/register
Request Body:
{
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName?: string;
  role?: 'customer' | 'seller'; // default 'customer'
}

Response: { data: { token: string; ...User } }
```

#### Login
```javascript
POST /auth/login
// Accepts either email or phone (detects by format: phone is 8+ digits)
Request Body (email):
{
  email: string;
  password: string;
}
// OR (phone)
{
  phone: string;
  password: string;
}

Response: { data: { token: string; ...User } }
```

#### Get Profile
```javascript
GET /auth/profile
Headers: Authorization: Bearer {token}

Response: { data: { ...User } }
```

#### Update Profile
```javascript
PUT /auth/profile
Headers: Authorization: Bearer {token}
Request Body: Partial<User>

Response: { data: { ...User } }
```

#### Change Password
```javascript
POST /auth/change-password
Headers: Authorization: Bearer {token}
Request Body:
{
  old_password: string;
  new_password: string;
}
```

#### Logout
```javascript
POST /auth/logout
Headers: Authorization: Bearer {token}

Response: { data: { success: true } }
```

---

### 2.2 Product APIs

**File:** [src/services/backend-api.js](src/services/backend-api.js) (Lines 65-93)

#### Get All Products
```javascript
GET /products
Query Params Optional:
- page: number
- limit: number
- category_id?: string | number
- sort?: 'price_asc' | 'price_desc' | 'rating'
- search?: string

Response: { data: { products: Product[]; total: number } }
// OR: { data: Product[] }

Product Structure:
{
  id: number;
  name: string;
  price: number;
  original_price?: number;
  images?: string[];
  rating?: number;
  reviews_count?: number;
  is_featured?: boolean;
  category_id?: string | number;
  shop_id: number;
}
```

#### Get Single Product
```javascript
GET /products/{id}

Response: { data: { ...Product } }
```

#### Search Products
```javascript
GET /products/search
Query Params:
- q: string (required)
- category_id?: number
- price_min?: number
- price_max?: number
- rating_min?: number

Response: { data: Product[] }
```

#### Get Categories
```javascript
GET /categories

Response: { data: Category[] }

Category Structure:
{
  id: string | number;
  name: string;
  description?: string;
  image?: string;
}
```

#### Create Product (Seller)
```javascript
POST /products
Headers: Authorization: Bearer {token}
Request Body:
{
  name: string;
  price: number;
  original_price?: number;
  description?: string;
  category_id: number;
  images: string[]; // base64 or URLs
  stock: number;
}

Response: { data: { id: number; ...Product } }
```

#### Update Product (Seller)
```javascript
PUT /products/{id}
Headers: Authorization: Bearer {token}
Request Body: Partial<Product>

Response: { data: { ...Product } }
```

#### Delete Product (Seller)
```javascript
DELETE /products/{id}
Headers: Authorization: Bearer {token}

Response: { data: { success: true } }
```

---

### 2.3 Cart APIs

**File:** [src/services/backend-api.js](src/services/backend-api.js) (Lines 95-123)

#### Get Cart
```javascript
GET /cart
Headers: Authorization: Bearer {token}

Response: { data: { items: CartItem[] } }

CartItem (from backend):
{
  product_id: number;
  product_name: string;
  shop_id: number;
  shop_name: string;
  price: number;
  quantity: number;
  weight: number;
  images?: string[];
}
```

#### Get Cart Summary
```javascript
GET /cart/summary
Headers: Authorization: Bearer {token}

Response: { data: { total_items: number; subtotal: number; total: number } }
```

#### Add to Cart
```javascript
POST /cart/add
Headers: Authorization: Bearer {token}
Request Body:
{
  product_id: number;
  quantity: number;
  weight?: number; // default 1 kg
}

Response: { data: { items: CartItem[] } }
```

#### Update Cart Item
```javascript
PUT /cart/{product_id}
Headers: Authorization: Bearer {token}
Request Body:
{
  quantity: number;
  weight?: number;
}

Response: { data: { items: CartItem[] } }
```

#### Remove from Cart
```javascript
DELETE /cart/{product_id}
Headers: Authorization: Bearer {token}

Response: { data: { items: CartItem[] } }
```

#### Clear Cart
```javascript
DELETE /cart
Headers: Authorization: Bearer {token}

Response: { data: { success: true } }
```

---

### 2.4 Order APIs

**File:** [src/services/backend-api.js](src/services/backend-api.js) (Lines 125-176)

#### Create Order
```javascript
POST /orders
Headers: Authorization: Bearer {token}
Request Body:
{
  items: Array<{
    product_id: number;
    quantity: number;
    weight: number;
  }>;
  payment_method: 'cod' | 'promptpay';
  
  // Delivery info
  delivery_date: string; // YYYY-MM-DD
  delivery_slot: 'morning' | 'afternoon';
  shipping_fee: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  province: string;
  postal_code: string;
  note?: string;
}

Response: { data: { order_id: string; ...Order } }
```

#### Get User Orders
```javascript
GET /orders
Headers: Authorization: Bearer {token}
Query Params Optional:
- page?: number
- limit?: number
- status?: OrderStatus
- sort?: 'created_at_desc' | 'created_at_asc'

Response: { data: { orders: Order[]; total: number } }
```

#### Get Single Order
```javascript
GET /orders/{order_id}
Headers: Authorization: Bearer {token}

Response: { data: { ...Order } }
```

#### Track Order
```javascript
GET /orders/{order_id}/track
Headers: Authorization: Bearer {token}

Response: { data: { status: OrderStatus; tracking_info: {...} } }
```

#### Verify Payment (PromptPay)
```javascript
POST /orders/{order_id}/verify-payment
Headers: Authorization: Bearer {token}
Request Body:
{
  slip_image_base64: string; // Base64 encoded image
  paid_amount: number;
}

Response: { data: { status: PaymentStatus } }
```

#### Cancel Order
```javascript
POST /orders/{order_id}/cancel
Headers: Authorization: Bearer {token}
Request Body:
{
  reason: string;
}

Response: { data: { status: 'canceled' } }
```

#### Claim Order
```javascript
POST /orders/{order_id}/claim
Headers: Authorization: Bearer {token}
Request Body:
{
  reason: string;
  note?: string;
}

Response: { data: { claim: Claim } }
```

---

### 2.5 Review APIs

**File:** [src/services/backend-api.js](src/services/backend-api.js) (Lines 178-215)

#### Submit Review
```javascript
POST /reviews
Headers: Authorization: Bearer {token}
Request Body:
{
  order_id: string;
  product_id: number;
  rating: number; // 1-5
  body: string; // review text
  quality_text?: string; // quality comment
  taste_text?: string; // taste comment
}

Response: { data: { id: string; ...Review } }
```

#### Get Product Reviews
```javascript
GET /products/{product_id}/reviews
Query Params Optional:
- page?: number
- limit?: number
- sort?: 'latest' | 'highest_rating'

Response: { data: { reviews: Review[]; average_rating: number } }
```

#### Get Single Review
```javascript
GET /reviews/{review_id}

Response: { data: { ...Review } }
```

#### Update Review
```javascript
PUT /reviews/{review_id}
Headers: Authorization: Bearer {token}
Request Body: Partial<Review>

Response: { data: { ...Review } }
```

#### Delete Review
```javascript
DELETE /reviews/{review_id}
Headers: Authorization: Bearer {token}

Response: { data: { success: true } }
```

#### Get Shop Rating
```javascript
GET /shops/{shop_id}/rating

Response: { data: { average_rating: number; total_reviews: number } }
```

---

### 2.6 Shop APIs

**File:** [src/services/backend-api.js](src/services/backend-api.js) (Lines 217-253)

#### Get Shop Info
```javascript
GET /shops/{shop_id}

Response: { data: { ...ShopProfile } }

ShopProfile:
{
  id: number;
  name: string;
  owner_name?: string;
  description?: string;
  logo?: string;
  followers_count?: number;
  phone?: string;
  address?: string;
  province?: string;
  rating?: number;
}
```

#### Get Shop Products
```javascript
GET /shops/{shop_id}/products
Query Params Optional:
- page?: number
- limit?: number
- sort?: string

Response: { data: { products: Product[]; total: number } }
```

#### Create Shop (Seller Registration)
```javascript
POST /shops
Headers: Authorization: Bearer {token}
Request Body:
{
  shop_name: string;
  owner_name: string;
  phone: string;
  
  // PromptPay for payment
  promptpay_type: 'phone' | 'id';
  promptpay_value: string;
  
  address_line: string;
  province: string;
  postal_code: string;
}

Response: { data: { shop_id: number; ...ShopProfile } }
```

#### Update Shop Profile (Seller)
```javascript
PUT /shops/profile
Headers: Authorization: Bearer {token}
Request Body: Partial<ShopProfile>

Response: { data: { ...ShopProfile } }
```

#### Get Seller Orders
```javascript
GET /shops/orders
Headers: Authorization: Bearer {token}
Query Params Optional:
- page?: number
- limit?: number
- status?: OrderStatus
- date_from?: string
- date_to?: string

Response: { data: { orders: Order[]; total: number } }
```

#### Update Order Status (Seller)
```javascript
PUT /shops/orders/{order_id}
Headers: Authorization: Bearer {token}
Request Body:
{
  status: 'to_ship' | 'shipping' | 'delivered' | 'canceled';
  note?: string;
}

Response: { data: { status: OrderStatus } }
```

---

### 2.7 Follow Shop APIs

**File:** [src/services/backend-api.js](src/services/backend-api.js) (Lines 255-274)

#### Follow Shop
```javascript
POST /shops/{shop_id}/follow
Headers: Authorization: Bearer {token}

Response: { data: { following: true } }
```

#### Unfollow Shop
```javascript
DELETE /shops/{shop_id}/follow
Headers: Authorization: Bearer {token}

Response: { data: { following: false } }
```

#### Get Followed Shops
```javascript
GET /followed-shops
Headers: Authorization: Bearer {token}
Query Params Optional:
- page?: number
- limit?: number

Response: { data: { shops: FollowedShop[] } }
```

---

### 2.8 Seller Dashboard APIs

**File:** [src/services/backend-api.js](src/services/backend-api.js) (Lines 276-302)

#### Get Dashboard
```javascript
GET /seller/dashboard
Headers: Authorization: Bearer {token}

Response: { data: {
  total_sales: number;
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  summary_by_status: Record<OrderStatus, number>;
} }
```

#### Get Statistics
```javascript
GET /seller/stats
Headers: Authorization: Bearer {token}
Query Params Optional:
- date_from?: string
- date_to?: string
- group_by?: 'daily' | 'weekly' | 'monthly'

Response: { data: { stats: DashboardStat[] } }
```

#### Get Revenue
```javascript
GET /seller/revenue
Headers: Authorization: Bearer {token}
Query Params Optional:
- date_from?: string
- date_to?: string

Response: { data: {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  revenue_by_product: Array<{product_name: string; amount: number}>
} }
```

#### Get Verification Requests
```javascript
GET /seller/verification-requests
Headers: Authorization: Bearer {token}

Response: { data: { requests: VerificationRequest[] } }
```

---

## 3. UI COMPONENTS & DATA USAGE

### 3.1 Main Pages

#### Home Page
**File:** [src/pages/home/home.tsx](src/pages/home/home.tsx)  
**Feature:** [src/features/home/home-content.tsx](src/features/home/home-content.tsx)

**Data Displayed:**
- Product listing with pagination (32 items per page)
- Category filtering (popular, seasonal, imported, rare, processed, byproduct)
- Product cards showing:
  - Image(s)
  - Name
  - Price
  - Rating (stars)
  - Review count
  - Badge (if featured)

**API Calls:**
```javascript
GET /products?page=0&limit=100
```

**User Interactions:**
- Add to cart (calls `POST /cart/add`)
- Filter by category
- Pagination
- Navigate to product detail

**State Used:**
- Redux: `cart` slice (for add to cart)
- Auth context (for authenticated check)

---

#### Product Detail Page
**File:** [src/pages/productDetail/product-detail.tsx](src/pages/productDetail/product-detail.tsx)

**Data Displayed:**
- Single product details
- Images (carousel)
- Price (original & discounted)
- Rating & reviews
- Shop info
- Stock status
- Description

**API Calls Expected:**
```javascript
GET /products/{id}
GET /products/{id}/reviews
GET /shops/{shop_id}
POST /cart/add (on add to cart)
```

---

#### Cart Page
**File:** [src/pages/cart/CartPage.tsx](src/pages/cart/CartPage.tsx)

**Data Displayed:**
- Cart items grouped by shop
- Product details:
  - Image, name, price
  - Quantity & weight (in kg)
  - Line total per item
- Shop subtotal
- Total price
- Selection checkboxes
- Remove/update buttons

**API Calls:**
```javascript
GET /cart
PUT /cart/{product_id} (update qty/weight)
DELETE /cart/{product_id}
POST /orders (on checkout)
```

**Form Fields:**
- Quantity adjustment
- Weight adjustment
- Item selection (checkbox)

---

#### Checkout Page
**File:** [src/pages/checkout/CheckoutPage.tsx](src/pages/checkout/CheckoutPage.tsx)

**Form Fields Collected:**
```javascript
{
  fullName: string;
  phone: string;
  address: string;
  province: string;
  postalCode: string;
  deliveryDate: string; // YYYY-MM-DD (min: tomorrow)
  deliverySlot: 'morning' | 'afternoon';
  paymentMethod: 'cod' | 'promptpay';
  note?: string;
}
```

**Display:**
- Order summary (grouped by shop)
- Line items with totals
- Items subtotal
- Fixed shipping fee (50)
- Grand total
- Delivery address form
- Payment method selection

**API Calls:**
```javascript
POST /orders (create order)
DELETE /cart (after successful order)
```

---

#### Checkout Success Page
**File:** [src/pages/checkout/CheckoutSuccessPage.tsx](src/pages/checkout/CheckoutSuccessPage.tsx)

**Data Displayed:**
- Order confirmation
- Order ID
- Payment status
- Estimated delivery date
- Contact for support

---

#### PromptPay Payment Page
**File:** [src/pages/checkout/PromptPayPaymentPage.tsx](src/pages/checkout/PromptPayPaymentPage.tsx)

**Features:**
- QR code generation from PromptPay
- Slip upload (base64 image)
- Payment amount entry
- Verification of payment

**API Call:**
```javascript
POST /orders/{orderId}/verify-payment
```

---

#### Orders Page
**File:** [src/pages/orders/OrdersPage.tsx](src/pages/orders/OrdersPage.tsx)

**Display:**
- Tabs for order status filtering
- Order cards showing:
  - Shop name & order ID
  - Order status badge (colored)
  - Items list with images
  - Total price
  - Action buttons (review, claim, track)

**Status Tabs:**
- All (default)
- Unpaid (รอชำระ)
- To Ship (รอจัดส่ง)
- Shipping (กำลังจัดส่ง)
- Delivered (ส่งสำเร็จ)
- Canceled (ยกเลิก)

**Data Source:**
- Redux store: `order-slice` (client-side state)
- Could integrate with `GET /orders` API

---

#### Order Detail Page
**File:** [src/pages/orders/OrderDetailPage.tsx](src/pages/orders/OrderDetailPage.tsx)

**Displays:**
- Full order information
- Order timeline
- Payment details
- Shipping address
- Item details
- Claim/review options

---

#### Authentication Pages

**Login Page:**
**File:** [src/pages/auth/login.tsx](src/pages/auth/login.tsx)  
**Feature:** [src/features/auth/login-content.tsx](src/features/auth/login-content.tsx)

**Form Fields:**
```javascript
{
  phoneOrUsername: string; // Email or phone
  password: string;
}
```

Schema validation via [src/features/auth/login-schema.ts](src/features/auth/login-schema.ts)

**API Call:**
```javascript
POST /auth/login
```

---

**Register Page:**
**File:** [src/pages/auth/RegisterPage.tsx](src/pages/auth/RegisterPage.tsx)

**Form Fields Collected:**
```javascript
{
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  // role: 'customer' | 'seller' (optional)
}
```

**API Call:**
```javascript
POST /auth/register
```

---

### 3.2 Seller Pages

#### Seller Registration
**File:** [src/pages/seller/SellerRegisterPage.tsx](src/pages/seller/SellerRegisterPage.tsx)

**Form Fields:**
```javascript
{
  shopName: string;
  ownerName: string;
  phone: string;
  promptpayType: 'phone' | 'id';
  promptpayValue: string;
  addressLine: string;
  province: string;
  postalCode: string;
}
```

**API Call:**
```javascript
POST /shops
```

---

#### Seller Dashboard
**File:** [src/pages/seller/SellerDashboardPage.tsx](src/pages/seller/SellerDashboardPage.tsx)

**Displays:**
- Sales summary
- Revenue statistics
- Order counts by status
- Charts/graphs (if implemented)

**API Calls:**
```javascript
GET /seller/dashboard
GET /seller/stats
GET /seller/revenue
```

---

#### Seller Orders - Pending
**File:** [src/pages/seller/SellerOrdersPendingPage.tsx](src/pages/seller/SellerOrdersPendingPage.tsx)

**Displays:**
- Orders awaiting payment or confirmation
- Action buttons to confirm/reject payment

**API Calls:**
```javascript
GET /shops/orders?status=unpaid
```

---

#### Seller Orders - To Ship
**File:** [src/pages/seller/SellerOrdersToShipPage.tsx](src/pages/seller/SellerOrdersToShipPage.tsx)

**Displays:**
- Orders ready to ship
- Tracking info update option

**API Calls:**
```javascript
GET /shops/orders?status=to_ship
PUT /shops/orders/{orderId} (to mark as shipping)
```

---

#### Seller Products
**File:** [src/pages/seller/SellerProductsPage.tsx](src/pages/seller/SellerProductsPage.tsx)

**Displays:**
- List of seller's products
- Create/edit product buttons
- Actions: edit, delete, view details

**API Calls:**
```javascript
GET /products (filtered by seller)
POST /products (create)
PUT /products/{id} (update)
DELETE /products/{id}
```

---

## 4. USER FLOWS

### 4.1 Authentication Flow

```
REGISTER FLOW:
1. User visits /auth/register
2. Fills form: email, phone, firstName, lastName, password
3. Submits → POST /auth/register
4. Server returns: { token, user }
5. Frontend stores in localStorage: 'token', 'user'
6. Sets Redux state: auth.user, auth.token, auth.isAuthenticated = true
7. Redirects to home or dashboard

LOGIN FLOW:
1. User visits /auth/login
2. Fills form: phoneOrUsername, password
3. Submits → Frontend detects email vs phone format
4. POST /auth/login with appropriate body
5. Server returns: { token, user }
6. Same storage & state update as register
7. Redirects to home or intended page

LOGOUT FLOW:
1. User clicks logout
2. POST /auth/logout (optional, may fail gracefully)
3. Clear localStorage: 'token', 'user'
4. Clear Redux state
5. Redirect to /auth/login

PROFILE UPDATE FLOW:
1. User navigates to profile page
2. Views current profile (from Redux state)
3. Edits fields: firstName, lastName, phone, address, province, postalCode, birthDate, gender
4. Submits → PUT /auth/profile
5. Server validates & updates
6. Frontend syncs localStorage & Redux state
7. Shows success message

CHANGE PASSWORD FLOW:
1. User in profile/settings
2. Enters: oldPassword, newPassword
3. Submits → POST /auth/change-password
4. Server validates old password
5. Updates password
6. Shows success or error
```

---

### 4.2 Product Browsing Flow

```
HOME PAGE FLOW:
1. User lands on /
2. Frontend fetches → GET /products?page=0&limit=100
3. Displays products in grid
4. User can:
   a) Filter by category (client-side or re-fetch with filters)
   b) View individual product → navigate to /product-detail/{id}
   c) Add to cart → POST /cart/add (if authenticated)
   d) Logout/go to profile

PRODUCT DETAIL FLOW:
1. User visits /product-detail/{id}
2. Fetches → GET /products/{id}
3. Fetches → GET /products/{id}/reviews
4. Fetches → GET /shops/{shop_id}
5. Displays:
   - Product images (carousel)
   - Name, price, rating
   - Description, stock
   - Shop info with follow button
6. User can:
   a) Adjust quantity & weight (Kg)
   b) Add to cart → POST /cart/add
   c) View reviews
   d) Follow shop → POST /shops/{shop_id}/follow
   e) Navigate to shop profile

SHOP PROFILE FLOW:
1. User clicks shop name/logo
2. Navigates to /shop/{shop_id}
3. Fetches → GET /shops/{shop_id}
4. Fetches → GET /shops/{shop_id}/products
5. Fetches → GET /shops/{shop_id}/rating
6. Displays:
   - Shop info (name, followers, rating)
   - Shop products grid/list
   - Follow/unfollow button
   - Reviews/rating aggregates

SEARCH FLOW (if implemented):
1. User enters search query
2. Submits → GET /products/search?q={query}&category={filter}
3. Results displayed in grid
4. Same interaction as home page
```

---

### 4.3 Shopping & Checkout Flow

```
ADD TO CART FLOW:
1. User on home/product-detail page
2. Clicks "Add to cart" button
3. If not authenticated:
   - Alert: "Please login first"
   - Redirect to /auth/login
4. If authenticated:
   - POST /cart/add { product_id, quantity, weight }
   - Shows toast: "✅ Added to cart" (or error)
   - (Optional) Increment badge on cart icon

CART PAGE FLOW:
1. User navigates to /cart
2. Fetches → GET /cart (if not stored in Redux)
3. Displays items grouped by shop
4. User can:
   a) Select items (checkboxes)
   b) Adjust quantity → PUT /cart/{product_id}
   c) Adjust weight (Kg) → PUT /cart/{product_id}
   d) Remove item → DELETE /cart/{product_id}
   e) Select All / Deselect All
   f) Proceed to checkout with selected items
5. Shows cart subtotal & estimated shipping fee
6. "Checkout" button → navigates to /checkout with selected items

CHECKOUT FLOW:
1. User on /checkout (redirected from cart)
2. If not authenticated: redirect to /auth/login
3. If no items selected: show error & return to /cart
4. Collect form:
   - fullName, phone, address, province, postalCode (required)
   - deliveryDate (min: tomorrow)
   - deliverySlot: 'morning' | 'afternoon'
   - paymentMethod: 'cod' | 'promptpay'
   - note (optional)
5. Shows order summary grouped by shop:
   - Items per shop
   - Subtotal per shop
   - Total shipping fee (fixed 50)
   - Grand total
6. Form validation
7. On submit:
   - POST /orders with all data
   - Redux: placeOrder() action
   - DELETE /cart (clear the cart)
   - Redirect to /checkout-success/{orderId}

PAYMENT METHOD SELECTION:
a) COD (Cash on Delivery):
   - Order status: 'to_ship' (ready for seller to ship)
   - Seller ships immediately
   - UI shows "Awaiting Shipment"

b) PromptPay (QR code payment):
   - Order created with status 'unpaid'
   - Redirect to /payment/promptpay/{orderId}
   - Generate QR code from PromptPay details
   - User scans & transfers
   - User uploads payment slip (base64 image)
   - User enters paid amount
   - POST /orders/{orderId}/verify-payment
   - Server may auto-approve or require manual approval
   - Order status: 'paid' → 'to_ship'

CHECKOUT SUCCESS PAGE:
1. Shows order confirmation:
   - Order ID
   - Order date & time
   - Delivery address
   - Estimated delivery date
   - Payment status (for PromptPay: "Awaiting verification")
2. Buttons:
   - "Track Order" → /orders/{orderId}
   - "Continue Shopping" → /
3. Email confirmation (optional backend feature)
```

---

### 4.4 Order Management Flow

```
VIEW ORDERS FLOW:
1. User navigates to /orders
2. Gets orders from Redux store (orderSlice.orders)
3. Or fetches → GET /orders
4. Displays tabs for filtering by status
5. Shows order cards grouped by status

ORDER DETAIL VIEW:
1. User clicks on order card
2. Navigates to /orders/{orderId}
3. Displays:
   - Order timeline
   - Items per shop
   - Payment details
   - Delivery address
   - Order status
4. Buttons:
   - "Track" (if shipping)
   - "Received" (if delivered - marks as received)
   - "Return/Claim" (if delivered)
   - "Cancel" (if unpaid/pending)

MARK AS RECEIVED:
1. User on /orders/{orderId} with status 'delivered'
2. Clicks "I received this package"
3. Redux: markDelivered({ orderId })
4. (Optional) Syncs with backend → PUT /orders/{orderId} or similar
5. Status changes to 'delivered'
6. Shows notification: "📦 ได้รับสินค้าแล้ว"
7. "Please review" prompt

FILE CLAIM/COMPLAINT:
1. User on order with received status
2. Clicks "Claim/Report Issue"
3. Form appears:
   - reason: dropdown or text
   - note: detailed explanation (optional)
4. Submits → POST /orders/{orderId}/claim
5. Redux: requestClaim({ orderId, reason, note })
6. Order status changes to 'claim'
7. Shows claim status: "Requested" → awaiting seller response

CLAIM APPROVAL (Seller View):
1. Seller sees pending claim on dashboard
2. Reviews claim details
3. Can approve (grant refund) or reject
4. If approved:
   - POST /seller/claims/{claimId}/approve with refundAmount
   - Claim status: 'approved'
5. If rejected:
   - POST /seller/claims/{claimId}/reject with reason
   - Claim status: 'rejected'

CANCEL ORDER:
1. User on unpaid order
2. Clicks "Cancel Order"
3. Enters reason
4. Submits → POST /orders/{orderId}/cancel
5. Redux: cancelOrder({ orderId, reason })
6. Status changes to 'canceled'
```

---

### 4.5 Review Flow

```
SUBMIT REVIEW:
1. User on /orders with delivered status
2. Item shows button: "Write Review"
3. Clicks → ReviewModal opens
4. Fills form:
   - rating: 1-5 stars (required)
   - body: review text (required)
   - qualityText: quality comment (optional)
   - tasteText: taste comment (optional)
5. Uploads photo (optional)
6. Submits:
   - Redux: submitReview() action (stores locally)
   - POST /reviews (sends to backend)
   - {
       order_id, product_id, rating, body,
       quality_text, taste_text, image
     }
7. Response: { id, createdAt }
8. Redux marks as reviewed: reviewed.push(`${orderId}_${productKey}`)
9. Shows success & review appears on:
   - Order detail page
   - Product detail page (/products/{id}/reviews)

REVIEW VISIBILITY:
1. Reviews for base products: productKey = 'base:{productId}'
2. Reviews for seller products: productKey = 'seller:{sellerProductId}'
3. Prevents duplicate reviews for same order+product combo

VIEW PRODUCT REVIEWS:
1. User on /product-detail/{id}
2. Section "Reviews" shows:
   - Average rating (stars)
   - Total review count
   - List of reviews (latest/highest first):
     - User avatar & name
     - Rating stars
     - Review date
     - Review body
     - Quality/Taste tags
     - Review image (if any)
```

---

### 4.6 Seller/Shop Flow

```
REGISTER AS SELLER:
1. User with customer account navigates to /seller/register
2. Fills form:
   - shopName
   - ownerName
   - phone
   - promptpayType: 'phone' | 'id'
   - promptpayValue
   - addressLine, province, postalCode
3. Submits → POST /shops
4. Backend creates shop & links to user
5. Redux: registerSeller() action
6. Redirects to /seller/dashboard
7. User can now:
   - Manage products
   - View sales & revenue
   - Manage orders
   - Update shop profile

SELLER DASHBOARD:
1. User visits /seller/dashboard
2. Fetches:
   - GET /seller/dashboard (summary)
   - GET /seller/stats (detailed)
   - GET /seller/revenue
3. Displays:
   - Total sales (amount)
   - Total revenue (after fees)
   - Total orders
   - Orders by status (pie/bar chart)
   - Revenue trend (line chart)
4. Can navigate to:
   - Pending orders (unpaid)
   - To-ship orders
   - Completed orders
   - Products list

MANAGE PRODUCTS:
1. User navigates to /seller/products
2. Fetches list of seller's products
3. Can:
   a) Create new product:
      - POST /products with name, price, images, description, stock
   b) Edit existing:
      - GET /products/{id} (pre-fill form)
      - PUT /products/{id} with updated data
   c) Delete:
      - DELETE /products/{id}
   d) View analytics (sales, views)

MANAGE ORDERS:
1. Seller views /seller/orders
2. Can filter by status:
   - Pending (awaiting payment verification)
   - To Ship (ready for shipment)
   - Shipped
   - Delivered
   - Canceled
3. For each order can:
   a) View details
   b) Verify payment (for PromptPay orders):
      - Review uploaded slip
      - Approve or reject
   c) Update shipping status:
      - POST /shops/orders/{orderId}
      - PUT /shops/orders/{orderId} { status, note }
   d) Print shipping label (if implemented)
   e) Handle claims (approve/reject with refund)

MANAGE SHOP PROFILE:
1. Seller on settings/profile
2. Can update:
   - shopName
   - ownerName
   - phone
   - address details
   - PromptPay info
3. Submits → PUT /shops/profile
4. Redux: updateSellerProfile() action

FOLLOW SHOP FLOW:
1. User on shop profile or product detail
2. Clicks "Follow Shop" button
3. If authenticated:
   - POST /shops/{shop_id}/follow
   - Redux: followShop() action
   - Button changes to "Following"
4. User can unfollow:
   - DELETE /shops/{shop_id}/follow
   - Redux: unfollowShop() action
5. Followed shops appear in:
   - /followed-shops page
   - Notifications for new products
```

---

## 5. CURRENT BACKEND INTEGRATION

### 5.1 API Configuration Issues

**Current Status:** ⚠️ **HARDCODED & INCONSISTENT**

**In [src/services/backend-api.js](src/services/backend-api.js) (Line 8):**
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

**Should Use Configuration:**
From [src/config/index.ts](src/config/index.ts):
```javascript
// Not currently used in backend-api.js
const apiUrl = config.apiUrl; // 'http://localhost:3000/api'
```

**Issues:**
1. Backend API hardcoded to `localhost:5000` instead of `localhost:3000`
2. Config system exists but not utilized
3. Environment variables defined but not used by axios client
4. Two different API base URLs in the codebase:
   - backend-api.js: `http://localhost:5000/api`
   - config/index.ts: `http://localhost:3000/api` (default)

**Recommendation:** Update [src/services/backend-api.js](src/services/backend-api.js) to import and use config:
```javascript
import { config } from '@config/index';
const API_BASE_URL = config.apiUrl;
```

---

### 5.2 Redux Toolkit Query Alternative

**File:** [src/services/api/base-api.ts](src/services/api/base-api.ts)

The codebase has RTK Query setup but it's not fully integrated:

```typescript
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Auth', 'Dashboard', 'Settings'],
  endpoints: () => ({}),
});
```

**Current Usage:**
- Only user API endpoints injected via [src/services/user/user.query.ts](src/services/user/user.query.ts)
- Exports: `useGetCurrentUserQuery`, `useUpdateUserMutation`, etc.

**Partial Integration:**
- Auth endpoints still use axios (backend-api.js)
- Product/cart/order endpoints still use axios
- Could migrate to RTK Query for consistency

---

### 5.3 API Request Flow

```
Frontend Flow:
1. Component uses context (AuthContext) or makes direct axios call
2. axios instance (backend-api.js) adds auth token from localStorage
3. Request sent to backend
4. Response parsed & handled in component
5. State updated (Redux or local state)
6. Component re-renders

Missing:
- Error boundary handling
- Request retry logic
- Cache management (currently per-component)
- Centralized error handling
- Loading states management
```

---

### 5.4 Authentication Token Management

**Storage:**
- Token: `localStorage.getItem('token')`
- User: `localStorage.getItem('user')` (JSON stringified)

**Adding Token to Requests:**

In [src/services/backend-api.js](src/services/backend-api.js) (Lines 18-30):
```javascript
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

**Token Expiry Handling:**

In [src/services/backend-api.js](src/services/backend-api.js) (Lines 32-43):
```javascript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
```

**Issues:**
- No refresh token mechanism
- Hard redirect on 401 (should use React Router)
- No loading state during 401 redirect

---

### 5.5 Frontend-Backend Endpoint Mapping

| Feature | Frontend Page | API Calls | Request Body | Expected Response |
|---------|-----------|-----------|--------------|------------------|
| **Register** | /auth/register | POST /auth/register | {email, phone, password, firstName, lastName?, role?} | {data: {token, user}} |
| **Login** | /auth/login | POST /auth/login | {email or phone, password} | {data: {token, user}} |
| **Profile** | /profile | GET /auth/profile | - | {data: {user}} |
| **Update Profile** | /profile/edit | PUT /auth/profile | {firstName?, lastName?, ...} | {data: {user}} |
| **Products** | /home | GET /products | query: page, limit, category | {data: {products, total}} |
| **Product Detail** | /product-detail/:id | GET /products/{id} | - | {data: {product}} |
| **Product Search** | /search | GET /products/search | query: q, filters | {data: {products}} |
| **Cart** | /cart | GET /cart | - | {data: {items}} |
| **Add to Cart** | /home, /product-detail | POST /cart/add | {product_id, quantity, weight} | {data: {items}} |
| **Update Cart** | /cart | PUT /cart/{id} | {quantity, weight} | {data: {items}} |
| **Remove Cart** | /cart | DELETE /cart/{id} | - | {data: {items}} |
| **Create Order** | /checkout | POST /orders | {items, payment_method, delivery_*} | {data: {order_id, order}} |
| **Get Orders** | /orders | GET /orders | query: page, limit, status | {data: {orders, total}} |
| **Get Order Detail** | /orders/:id | GET /orders/{id} | - | {data: {order}} |
| **Verify Payment** | /payment/promptpay | POST /orders/{id}/verify-payment | {slip_image_base64, paid_amount} | {data: {status}} |
| **Submit Review** | /orders/:id | POST /reviews | {order_id, product_id, rating, body, ...} | {data: {review}} |
| **Get Reviews** | /product-detail | GET /products/{id}/reviews | query: page, limit | {data: {reviews, avg_rating}} |
| **Follow Shop** | /product-detail, /shop | POST /shops/{id}/follow | - | {data: {following: true}} |
| **Seller Register** | /seller/register | POST /shops | {shop_name, owner_name, phone, promptpay_*, address_*} | {data: {shop_id, shop}} |
| **Seller Dashboard** | /seller/dashboard | GET /seller/dashboard | - | {data: {sales, revenue, stats}} |
| **Seller Products** | /seller/products | GET /products (filtered) | query: seller_id | {data: {products}} |
| **Seller Orders** | /seller/orders/* | GET /shops/orders | query: page, limit, status | {data: {orders, total}} |
| **Update Order Status** | /seller/orders/* | PUT /shops/orders/{id} | {status, note} | {data: {order}} |

---

## 6. KEY OBSERVATIONS & NOTES

### 6.1 Frontend Strengths
- ✅ Clean Redux Toolkit setup for state management
- ✅ TypeScript types defined for most core entities
- ✅ Context API for auth (simple & effective)
- ✅ Responsive UI with Tailwind CSS
- ✅ i18n support (Thai/English)
- ✅ Form validation with Formik & Yup

### 6.2 Frontend Gaps/Recommendations

**API Integration:**
- ⚠️ Hardcoded base URL (should use config)
- ⚠️ Mix of axios + RTK Query (should standardize)
- ⚠️ No centralized error handling
- ⚠️ No request retry logic (network failures unhandled)

**State Management:**
- ⚠️ Redux for orders/cart but also localStorage
- ⚠️ Could benefit from more RTK Query endpoints
- ⚠️ No cache invalidation strategy between features

**UX/Functionality:**
- ⚠️ No loading skeleton states
- ⚠️ No offline mode detection
- ⚠️ No optimistic updates
- ⚠️ Review image upload may miss backend validation

**Tests:**
- ⚠️ Minimal test coverage (test files exist but may not be comprehensive)

---

### 6.3 Redux Store Structure

**File:** [src/stores/index.ts](src/stores/index.ts)

Expected reducers:
```typescript
{
  auth: authReducer           // [auth-slice.ts]
  cart: cartReducer           // [cart-slice.ts]
  orders: orderReducer        // [order-slice.ts]
  checkout: checkoutReducer   // [checkout-slice.ts]
  reviews: reviewsReducer     // [reviews-slice.ts]
  seller: sellerReducer       // [seller-slice.ts]
  followShops: followShopsReducer // [follow-shop-slice.ts]
  notifications: notificationReducer // [notification-slice.ts]
  settings: settingsReducer   // [settings-slice.ts]
  
  // RTK Query
  [baseApi.reducerPath]: baseApi.reducer
}

Middlewares:
  baseApi.middleware // For RTK Query
```

---

### 6.4 Recommended Backend Response Format

Based on current frontend usage, backend should return:

```javascript
// Successful response
{
  success: true,
  message?: string,
  data: {
    // Specific response data
  }
}

// Error response
{
  success: false,
  message: string,
  error?: {
    code: string,
    details?: {}
  }
}

// Paginated response
{
  success: true,
  data: {
    items: [],
    total: number,
    page: number,
    limit: number
  }
}
```

---

### 6.5 Currently Used Technologies

**Package.json Dependencies:**
- React 19.2.0
- React Router v7.12.0
- Redux Toolkit + React-Redux
- Axios
- Tailwind CSS 4.1.18
- TypeScript 5.9.3
- Formik + Yup (form validation)
- i18next (internationalization)
- QRCode + PromptPay-QR (payment QR)
- Swiper (image carousel)
- Redux-Persist (persist store to localStorage)

---

## 7. COMPLETE API ENDPOINT REFERENCE

### Summary by Method

**GET Endpoints (read-only):**
- GET /auth/profile
- GET /products
- GET /products/{id}
- GET /products/search
- GET /products/{id}/reviews
- GET /reviews/{id}
- GET /categories
- GET /cart
- GET /cart/summary
- GET /orders
- GET /orders/{id}
- GET /orders/{id}/track
- GET /shops/{id}
- GET /shops/{id}/products
- GET /shops/{id}/rating
- GET /followed-shops
- GET /seller/dashboard
- GET /seller/stats
- GET /seller/revenue
- GET /seller/verification-requests
- GET /shops/orders

**POST Endpoints (create/execute):**
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/change-password
- POST /products (seller)
- POST /cart/add
- POST /orders
- POST /orders/{id}/verify-payment
- POST /orders/{id}/cancel
- POST /orders/{id}/claim
- POST /reviews
- POST /shops
- POST /shops/{id}/follow

**PUT Endpoints (update):**
- PUT /auth/profile
- PUT /products/{id} (seller)
- PUT /cart/{id}
- PUT /reviews/{id}
- PUT /shops/profile (seller)
- PUT /shops/orders/{id} (seller)

**DELETE Endpoints:**
- DELETE /products/{id} (seller)
- DELETE /cart/{id}
- DELETE /cart
- DELETE /reviews/{id}
- DELETE /shops/{id}/follow

---

## 8. FLOW DIAGRAMS (ASCII)

### Authentication Flow
```
[Login/Register Page]
         ↓
  User submits credentials
         ↓
POST /auth/login or /auth/register
         ↓
Server validates & returns {token, user}
         ↓
localStorage.setItem('token', token)
localStorage.setItem('user', JSON.stringify(user))
         ↓
Redux: setUser(), setToken(), login()
         ↓
Redirect to "/" or intended destination
```

### Shopping Flow
```
[Home] ← GET /products
   ↓ (click product)
[Product Detail] ← GET /products/{id}, GET /products/{id}/reviews
   ↓ (add to cart)
POST /cart/add
   ↓
[Cart] ← GET /cart
   ↓ (select items, checkout)
[Checkout] (collect delivery info)
   ↓ (submit order)
POST /orders (+ DELETE /cart)
   ↓ (choose payment method)
─→ COD: Order status = 'to_ship', redirect to [Checkout Success]
─→ PromptPay: Redirect to [PromptPay Payment]
      ↓ (upload slip)
      POST /orders/{id}/verify-payment
      ↓
      Order status = 'unpaid' (awaiting verification)
      ↓
      [Checkout Success]
```

### Order Lifecycle
```
Order Created (POST /orders)
     ↓
   [COD] → status='to_ship'  [PromptPay] → status='unpaid'
     ↓                             ↓
  Seller ships           Backend verifies slip
(PUT /shops/orders/{id})  (POST /orders/{id}/verify-payment)
     ↓                             ↓
status='shipping'              status='paid'
     ↓                             ↓
Seller marks delivered      Seller ships
(PUT /shops/orders/{id})    (PUT /shops/orders/{id})
     ↓                             ↓
status='delivered'         status='shipping'
     ↓                             ↓
                            Seller marks delivered
                            (PUT /shops/orders/{id})
                                   ↓
                         status='delivered'
                                   ↓
         ┌─────────────────────┬───┘
         ↓                     ↓
    User can review      User can claim/complain
    (POST /reviews)      (POST /orders/{id}/claim)
         ↓                     ↓
   Review posted         claim.status='requested'
   (visible on           (awaits seller approval)
   product page)              ↓
                         Seller reviews claim
                         (PUT /sellers/claims/{id}/approve)
                              ↓
                      claim.status='approved'
                      refund_amount issued
```

---

## DOCUMENT VERSION

- **Version:** 1.0
- **Last Updated:** April 14, 2026
- **Created By:** Frontend Analysis Assistant
- **Scope:** Qino Fruit Store - React/TypeScript Frontend
