# 🚀 STEP 5: Frontend Integration Guide

> **Connecting React Frontend to Node.js Backend**  
> **Status**: Ready for Implementation  
> **Last Updated**: April 13, 2026

---

## 📋 **สิ่งที่ได้ทำแล้ว**

✅ `src/services/api.js` - API Service Layer (axios)
✅ `src/contexts/AuthContext.jsx` - Auth State Management  
✅ `src/main.tsx` - AuthProvider setup

---

## 🎯 **วิธีใช้ API ในแต่ละ Page/Component**

### **📝 ตัวอย่าง: Login Page**

```jsx
import { useAuth } from '@contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      await login(email, password);
      navigate('/'); // ไปหน้า home หลัง login สำเร็จ
    } catch (err) {
      console.error('Login failed:', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(email, password);
    }}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
};
```

---

## 📂 **Pages ที่ต้อง Update**

### **1️⃣ Auth Pages** 🔐

#### **a) `/pages/auth/Login`**
```jsx
import { useAuth } from '@contexts/AuthContext';

// ซื้อ:
// 1. Get email & password from form
// 2. Call: auth.login(email, password)
// 3. Redirect ไปหน้า home/dashboard
// 4. Handle error from auth.error
```

**Key Functions:**
```javascript
const { login, error, loading } = useAuth();

// Call login
await login(email, password);
```

---

#### **b) `/pages/auth/Register`**
```jsx
import { useAuth } from '@contexts/AuthContext';

// ซื้อ:
// 1. Get form data (email, phone, password, name, role)
// 2. Call: auth.register(email, phone, password, name, role)
// 3. Redirect ไปหน้า login หรือ home
// 4. Handle error
```

**Key Functions:**
```javascript
const { register, error } = useAuth();

// Call register
await register(email, phone, password, firstName, role);
```

---

### **2️⃣ Products Pages** 🛍️

#### **a) `/pages/home` (Product List)**
```jsx
import { productAPI } from '@services/api';

// ซื้อ:
useEffect(() => {
  const fetchProducts = async () => {
    try {
      const response = await productAPI.getProducts({
        page: 1,
        limit: 20,
        category: selectedCategory, // optional
      });
      setProducts(response.data.data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };
  
  fetchProducts();
}, []);
```

---

#### **b) `/pages/productDetail/:id`**
```jsx
import { productAPI } from '@services/api';

useEffect(() => {
  const fetchProduct = async () => {
    const response = await productAPI.getProduct(id);
    setProduct(response.data.data);
  };
  
  fetchProduct();
}, [id]);
```

---

### **3️⃣ Cart Page** 🛒

```jsx
import { cartAPI } from '@services/api';
import { useAuth } from '@contexts/AuthContext';

export const CartPage = () => {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  // Get cart
  useEffect(() => {
    if (!isAuthenticated()) return;
    
    const fetchCart = async () => {
      const response = await cartAPI.getCart();
      setCartItems(response.data.data.items);
    };
    
    fetchCart();
  }, [isAuthenticated]);

  // Add to cart
  const handleAddToCart = async (productId, quantity) => {
    await cartAPI.addToCart(productId, quantity, weight);
  };

  // Update quantity
  const handleUpdateQuantity = async (productId, newQuantity) => {
    await cartAPI.updateCartItem(productId, newQuantity);
  };

  // Remove item
  const handleRemoveItem = async (productId) => {
    await cartAPI.removeFromCart(productId);
  };
};
```

---

### **4️⃣ Checkout Page** 📦

```jsx
import { orderAPI, cartAPI } from '@services/api';
import { useAuth } from '@contexts/AuthContext';

export const CheckoutPage = () => {
  const { user } = useAuth();

  const handleCheckout = async () => {
    // Get cart items
    const cartResponse = await cartAPI.getCart();
    const items = cartResponse.data.data.items;

    // Create order
    const orderResponse = await orderAPI.createOrder(
      items,
      paymentMethod, // 'cod' or 'promptpay'
      {
        delivery_date: deliveryDate,
        delivery_slot: deliverySlot, // 'morning' or 'afternoon'
        shipping_fee: 50,
      }
    );

    // Clear cart after successful order
    await cartAPI.clearCart();
    
    // Redirect to order confirmation
    navigate(`/orders/${orderResponse.data.data.order_id}`);
  };
};
```

---

### **5️⃣ Orders Page** 📋

```jsx
import { orderAPI } from '@services/api';

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const response = await orderAPI.getOrders({
        page: 1,
        status: 'all' // or specific status
      });
      setOrders(response.data.data.orders);
    };
    
    fetchOrders();
  }, []);

  // Track order
  const handleTrackOrder = async (orderId) => {
    const response = await orderAPI.trackOrder(orderId);
    // Show timeline/status
  };

  // Cancel order
  const handleCancelOrder = async (orderId, reason) => {
    await orderAPI.cancelOrder(orderId, reason);
  };

  // Verify payment (PromptPay)
  const handleVerifyPayment = async (orderId, slipImage) => {
    await orderAPI.verifyPayment(orderId, slipImage, totalAmount);
  };
};
```

---

### **6️⃣ Reviews Page** ⭐

```jsx
import { reviewAPI } from '@services/api';

export const SubmitReviewPage = () => {
  const handleSubmitReview = async () => {
    await reviewAPI.submitReview(
      orderId,
      productId,
      rating, // 1-5
      reviewBody,
      qualityText, // 'good', 'bad', etc.
      tasteText // 'sweet', 'sour', etc.
    );
  };

  // Get product reviews
  useEffect(() => {
    const fetchReviews = async () => {
      const response = await reviewAPI.getProductReviews(productId);
      setReviews(response.data.data.reviews);
    };
    
    fetchReviews();
  }, [productId]);
};
```

---

### **7️⃣ Shop Page** 🏪

```jsx
import { shopAPI } from '@services/api';

export const ShopPage = () => {
  useEffect(() => {
    // Get shop info
    const fetchShop = async () => {
      const response = await shopAPI.getShop(shopId);
      setShop(response.data.data);
    };
    
    // Get shop products
    const fetchProducts = async () => {
      const response = await shopAPI.getShopProducts(shopId);
      setProducts(response.data.data.products);
    };

    fetchShop();
    fetchProducts();
  }, [shopId]);
};
```

---

### **8️⃣ Follow Shop** 💰

```jsx
import { followAPI } from '@services/api';

// Follow
const handleFollowShop = async (shopId) => {
  await followAPI.followShop(shopId);
  setIsFollowed(true);
};

// Unfollow
const handleUnfollowShop = async (shopId) => {
  await followAPI.unfollowShop(shopId);
  setIsFollowed(false);
};

// Get followed shops
useEffect(() => {
  const fetchFollowedShops = async () => {
    const response = await followAPI.getFollowedShops();
    setFollowedShops(response.data.data.followed_shops);
  };
  
  fetchFollowedShops();
}, []);
```

---

### **9️⃣ Seller Dashboard** 📊

```jsx
import { dashboardAPI, shopAPI } from '@services/api';

export const SellerDashboard = () => {
  useEffect(() => {
    const fetchDashboard = async () => {
      const response = await dashboardAPI.getDashboard();
      setStats(response.data.data.stats);
    };
    
    fetchDashboard();
  }, []);

  // Get seller orders
  useEffect(() => {
    const fetchOrders = async () => {
      const response = await shopAPI.getSellerOrders();
      setOrders(response.data.data.orders);
    };
    
    fetchOrders();
  }, []);
};
```

---

## 🔐 **Protected Routes**

สร้าง `ProtectedRoute` component:

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" />;
  }

  return children;
};

// Usage:
<ProtectedRoute requiredRole="seller">
  <SellerDashboard />
</ProtectedRoute>
```

---

## ⚙️ **Error Handling Pattern**

```jsx
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // API call
    const response = await apiCall();
    
    // Success handling
    console.log(response.data);
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message;
    setError(errorMsg);
  } finally {
    setLoading(false);
  }
};
```

---

## 🧪 **Testing Your Integration**

### **Test 1: Authentication**
1. Open login page
2. Enter: `customer@test.com` / `Test@123456`
3. Should redirect to home page
4. Check localStorage → `token` & `user` saved

### **Test 2: API Calls**
1. Open Products page
2. Should fetch from `/api/products`
3. Check Network tab → Status 200

### **Test 3: Protected Routes**
1. Try accessing `/seller` without login
2. Should redirect to login page

### **Test 4: Cart**
1. Add product to cart → POST `/api/cart/add`
2. View cart → GET `/api/cart`
3. Remove item → DELETE `/api/cart/:id`

---

## 📋 **Installation Steps**

1. ✅ Copy `api.js` to `src/services/`
2. ✅ Copy `AuthContext.jsx` to `src/contexts/`
3. ✅ Update `main.tsx` with AuthProvider
4. ✅ Install axios (if not installed):
   ```bash
   npm install axios
   ```

---

## 📝 **File Locations**

```
src/
├── services/
│   └── api.js ← API Service Layer
├── contexts/
│   └── AuthContext.jsx ← Auth State
├── pages/
│   ├── auth/
│   │   ├── Login.tsx ← Use useAuth()
│   │   └── Register.tsx ← Use useAuth()
│   ├── productDetail.tsx ← Use productAPI
│   ├── cart.tsx ← Use cartAPI
│   ├── checkout.tsx ← Use orderAPI
│   └── orders.tsx ← Use orderAPI
└── main.tsx ← AuthProvider wrap
```

---

## 🎨 **Response Format**

Semua API mengembalikan:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "timestamp": "2024-04-13T10:30:00Z"
}
```

**Access data:**
```javascript
const response = await productAPI.getProducts();
const products = response.data.data.products; // Nested .data.data
```

---

## 🚀 **Next Steps**

1. Update Login/Register pages dengan `useAuth()`
2. Update Products page dengan `productAPI.getProducts()`
3. Update Cart dengan `cartAPI`
4. Update Orders dengan `orderAPI`
5. Test setiap page dengan API integration
6. Deploy ke production

---

✨ **Frontend Integration Complete!**
