// ==============================
// API Service / API Client
// ใช้ axios เรียก Backend APIs
// ==============================

import axios from 'axios';
import { store } from '@stores/index';
import { logout as reduxLogout } from '@slices/auth-slice';

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  import.meta.env?.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

console.log('🔧 Backend API Configuration:');
console.log('   Base URL:', API_BASE_URL);
console.log('   Environment:', import.meta.env?.VITE_ENVIRONMENT || 'unknown');

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false, // ✅ Set to false for token-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

const unwrapData = (response) => response?.data?.data ?? response?.data ?? {};
const normalizeUser = (data) => ({
  id: data?.id,
  email: data?.email || '',
  phone: data?.phone || '',
  role: data?.role || 'customer',
  firstName: data?.first_name || data?.firstName || '',
  lastName: data?.last_name || data?.lastName || '',
  first_name: data?.first_name || data?.firstName || '',
  last_name: data?.last_name || data?.lastName || '',
  address: data?.address || '',
  province: data?.province || '',
  postalCode: data?.postal_code || data?.postalCode || '',
  postal_code: data?.postal_code || data?.postalCode || '',
  birthDate: data?.birth_date || data?.birthDate || '', // ✅ Add birthDate
  birth_date: data?.birth_date || data?.birthDate || '', // ✅ Add birth_date
  gender: data?.gender || '', // ✅ Add gender
  avatar_url: data?.avatar_url || data?.avatarUrl || '', // ✅ Add avatar_url
  avatarUrl: data?.avatar_url || data?.avatarUrl || '', // ✅ Add avatarUrl
  shopId: data?.shopId || data?.shop_id || 0, // ✅ Add shopId for seller check
  isSeller: data?.isSeller ?? (data?.role === 'seller'), // ✅ Add isSeller flag
  token: data?.token,
});

// Add request interceptor - เพิ่ม token ไปใน header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Try both Bearer and plain token formats based on backend expectation
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📡 ${config.method?.toUpperCase() || 'REQUEST'} ${config.url}`);
      console.log(`   Authorization: Bearer ${token.substring(0, 30)}...`);
    } else {
      console.warn(`⚠️ ${config.method?.toUpperCase() || 'REQUEST'} ${config.url} - No token in localStorage!`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error response for debugging
    if (error.response) {
      console.error('❌ API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        message: error.response.data?.message || error.response.data?.error,
        requestHeaders: {
          authorization: error.config?.headers?.Authorization ? `Bearer ${error.config.headers.Authorization.substring(7, 37)}...` : 'NOT_SET',
          contentType: error.config?.headers?.['Content-Type'],
        },
        responseHeaders: {
          corsHeader: error.response.headers?.['access-control-allow-origin'],
          contentType: error.response.headers?.['content-type'],
        },
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('❌ No response from server:', {
        message: error.message,
        url: error.config?.url,
        request: error.request,
      });
    } else {
      console.error('❌ Request setup error:', error.message);
    }
    
    // ✅ Handle token expiry: 401 (no token) or 403 with INVALID_TOKEN (expired/invalid JWT)
    const status = error.response?.status;
    const errorCode = error.response?.data?.error?.code;
    const isTokenExpired = status === 401 || (status === 403 && errorCode === 'INVALID_TOKEN');

    if (isTokenExpired) {
      console.warn('⚠️ Token expired/invalid - clearing auth state');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // ✅ Clear Redux state
      store.dispatch(reduxLogout());

      // ✅ Also clear persisted Redux auth state synchronously
      // This prevents redux-persist from rehydrating stale isAuthenticated:true on page reload
      try {
        const persistKey = 'persist:root_v2';
        const persisted = localStorage.getItem(persistKey);
        if (persisted) {
          const parsed = JSON.parse(persisted);
          parsed.auth = JSON.stringify({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          localStorage.setItem(persistKey, JSON.stringify(parsed));
        }
      } catch (e) {
        // ignore parse errors
      }

      // ✅ Do NOT use window.location.href (causes race condition with persist flush)
      // React Router's AuthGuard will handle the redirect via Redux state change
    } else if (status === 403) {
      console.warn('⚠️ Access Forbidden (403) - Check permissions or token validity');
    }
    return Promise.reject(error);
  }
);

// ==============================
// 🔐 AUTHENTICATION APIs
// ==============================

export const authAPI = {
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return { ...response, normalizedData: normalizeUser(unwrapData(response)) };
  },
  login: (emailOrPhone, password) => {
    // Backend has separate login endpoints for email vs phone
    const isPhone = /^[0-9]{8,}$/.test(emailOrPhone);
    if (isPhone) {
      return apiClient.post('/auth/login-phone', { phone: emailOrPhone, password })
        .then((response) => ({ ...response, normalizedData: normalizeUser(unwrapData(response)) }));
    }
    return apiClient.post('/auth/login', { email: emailOrPhone, password })
      .then((response) => ({ ...response, normalizedData: normalizeUser(unwrapData(response)) }));
  },
  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return { ...response, normalizedData: normalizeUser(unwrapData(response)) };
  },
  updateProfile: async (data) => {
  try {
    console.log("📤 SEND:", data);

    const response = await apiClient.put('/auth/profile', data);

    const normalized = normalizeUser(unwrapData(response));

    console.log("✅ SUCCESS:", normalized);

    return {
      ...response,
      normalizedData: normalized,
    };

  } catch (error) {
    console.error("❌ ERROR:", error.response?.data || error.message);

    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      "อัปเดตโปรไฟล์ไม่สำเร็จ"
    );
  }
},
  changePassword: (data) =>
    apiClient.post('/auth/change-password', {
      old_password: data.currentPassword || data.oldPassword,
      new_password: data.newPassword,
    }),
  forgotPassword: (data) =>
    apiClient.post('/auth/forgot-password', data),
  resetPassword: (data) =>
    apiClient.post('/auth/reset-password', data),
  verifyOTP: (data) =>
    apiClient.post('/auth/verify-otp', data),
  resendOTP: () =>
    apiClient.post('/auth/resend-otp'),
  logout: () => {
    // Backend doesn't have a logout endpoint; just clear local state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve({ data: { message: 'logged out' } });
  },
};

// ==============================
// 🛍️ PRODUCTS APIs
// ==============================

export const productAPI = {
  // Get all products with filters
  getProducts: (params = {}) =>
    apiClient.get('/products', { params }),
  
  // Get single product
  getProduct: (id) => apiClient.get(`/products/${id}`),
  
  // Search products
  searchProducts: (query, filters = {}) =>
    apiClient.get('/products/search', {
      params: { q: query, ...filters },
    }),
  
  // Get categories
  getCategories: () => apiClient.get('/products/categories'),
  
  // Seller: Create product
  createProduct: (data) =>
    apiClient.post('/products', data),
  
  // Seller: Update product
  updateProduct: (id, data) =>
    apiClient.put(`/products/${id}`, data),
  
  // Seller: Delete product
  deleteProduct: (id) =>
    apiClient.delete(`/products/${id}`),
};

// ==============================
// 🛒 CART APIs
// ==============================

export const cartAPI = {
  // Get cart
  getCart: () => apiClient.get('/cart'),
  
  // Get cart summary
  getCartSummary: () => apiClient.get('/cart/summary'),
  
  // Add to cart
  addToCart: (productId, quantity, weight = 1) =>
    apiClient.post('/cart/add', {
      product_id: productId,
      quantity,
      weight,
    }),
  
  // Update cart item
  updateCartItem: (productId, quantity, weight = 1) =>
    apiClient.put(`/cart/${productId}`, {
      quantity,
      weight,
    }),
  
  // Remove from cart
  removeFromCart: (productId) =>
    apiClient.delete(`/cart/${productId}`),
  
  // Clear cart
  clearCart: () => apiClient.delete('/cart'),
};

// ==============================
// 📦 ORDERS APIs
// ==============================

export const orderAPI = {
  // Create order - format matches Backend Joi: { shopId, items, checkout, itemsSubtotal, shippingFee, grandTotal }
  createOrder: (items, paymentMethod, orderInfo) =>
    apiClient.post('/orders', {
      shopId: orderInfo.shopId,
      items,
      checkout: orderInfo.checkout,
      itemsSubtotal: orderInfo.itemsSubtotal,
      shippingFee: orderInfo.shippingFee,
      grandTotal: orderInfo.grandTotal,
    }),
  
  // Get user orders
  getOrders: (params = {}) =>
    apiClient.get('/orders', { params }),
  
  // Get single order
  getOrder: (orderId) =>
    apiClient.get(`/orders/${orderId}`),
  
  // Track order
  trackOrder: (orderId) =>
    apiClient.get(`/orders/${orderId}/track`),
  
  // Verify payment - field names match Backend Joi: { slipBase64, paidAmount }
  verifyPayment: (orderId, slipImage, paidAmount) =>
    apiClient.post(`/orders/${orderId}/verify-payment`, {
      slipBase64: slipImage,
      paidAmount: paidAmount,
    }),
  
  // Cancel order
  cancelOrder: (orderId, reason) =>
    apiClient.post(`/orders/${orderId}/claim`, { reason }),
  
  // Claim order
  claimOrder: (orderId, reason, note) =>
    apiClient.post(`/orders/${orderId}/claim`, { reason, note }),

  // Complete order
  completeOrder: (orderId) =>
    apiClient.put(`/orders/${orderId}/complete`),

  // Confirm delivery with POD (signature + photo)
  confirmDelivery: (orderId, signatureImage, deliveryPhoto, courierId, courierName) =>
    apiClient.post(`/orders/${orderId}/confirm-delivery`, {
      signature_image: signatureImage,
      delivery_photo: deliveryPhoto,
      courier_id: courierId,
      courier_name: courierName,
    }),

  // Get POD details
  getPOD: (orderId) =>
    apiClient.get(`/orders/${orderId}/pod`),
};

// ==============================
// ⭐ REVIEWS APIs
// ==============================

export const reviewAPI = {
  // Submit review
  submitReview: (orderId, productId, rating, body, qualityText, tasteText) =>
    apiClient.post('/reviews', {
      order_id: orderId,
      product_id: productId,
      rating,
      body,
      quality_text: qualityText,
      taste_text: tasteText,
    }),
  
  // Get product reviews — productKey เช่น 'base:123' หรือ 'seller:ABC'
  getProductReviews: (productKey, params = {}) =>
    apiClient.get(`/reviews/product/${productKey}`, { params }),
  
  // Get single review
  getReview: (reviewId) =>
    apiClient.get(`/reviews/${reviewId}`),
  
  // Update review
  updateReview: (reviewId, data) =>
    apiClient.put(`/reviews/${reviewId}`, data),
  
  // Delete review
  deleteReview: (reviewId) =>
    apiClient.delete(`/reviews/${reviewId}`),
  
  // Get shop rating
  getShopRating: (shopId) =>
    apiClient.get(`/reviews/rating/shop/${shopId}`),

  // Check if user can review a product
  checkEligibility: (productId) =>
    apiClient.get(`/reviews/eligibility/${productId}`),

  // Get shop reviews (with product name)
  getShopReviews: (shopId, params = {}) =>
    apiClient.get(`/reviews/shop/${shopId}`, { params }),
};

// ==============================
// 🏪 SHOPS APIs
// ==============================

export const shopAPI = {
  // Get shop info
  getShop: (shopId) =>
    apiClient.get(`/shops/${shopId}`),
  
  // Get shop products
  getShopProducts: (shopId, params = {}) =>
    apiClient.get(`/shops/${shopId}/products`, { params }),
  
  // Seller: Create shop
  createShop: (data) =>
    apiClient.post('/shops', data),
  
  // Seller: Update shop profile
  updateShopProfile: (data) =>
    apiClient.put('/shops/profile', data),
  
  // Seller: Get orders
  getSellerOrders: (params = {}) =>
    apiClient.get('/orders/shop/all', { params }),
  
  // Seller: Update order status
  updateOrderStatus: (orderId, status, note) =>
    apiClient.put(`/orders/${orderId}/status`, { status, note }),
};

// ==============================
// 💰 FOLLOW SHOPS APIs
// ==============================

export const followAPI = {
  // Follow shop
  followShop: (shopId) =>
    apiClient.post(`/follow/${shopId}`),
  
  // Unfollow shop
  unfollowShop: (shopId) =>
    apiClient.delete(`/follow/${shopId}`),
  
  // Get followed shops
  getFollowedShops: (params = {}) =>
    apiClient.get('/follow', { params }),
  
  // Check follow status
  checkFollowStatus: (shopId) =>
    apiClient.get(`/follow/${shopId}/check`),

  // Get shop followers count
  getFollowersCount: (shopId) =>
    apiClient.get(`/follow/${shopId}/count`),

  // Get shop followers list
  getFollowersList: (shopId) =>
    apiClient.get(`/follow/${shopId}/followers`),
};

// ==============================
// 📊 SELLER APIs
// ==============================

export const sellerAPI = {
  // Register as seller (Legacy single-step)
  registerSeller: (data) =>
    apiClient.post('/seller/register', data),

  // Multi-step Registration Endpoints
  registerStep1: (data) => apiClient.post('/seller/register/step1', data),
  registerStep2: (data) => apiClient.post('/seller/register/step2', data),
  registerStep3: (data) => apiClient.post('/seller/register/step3', data),
  submitRegistration: () => apiClient.post('/seller/register/submit'),
  getRegistrationStatus: () => apiClient.get('/seller/register/status'),

  // Get seller profile
  getProfile: () => {
    // Try /seller/profile first, fall back to /auth/me
    return apiClient.get('/seller/profile').catch(err => {
      if (err.response?.status === 404) {
        console.warn('⚠️ /seller/profile not found, trying /auth/me...');
        return apiClient.get('/auth/me');
      }
      throw err;
    });
  },

  // Update seller profile
  updateProfile: (data) =>
    apiClient.put('/seller/profile', data),

  // Get seller stats (dashboard)
  getStats: (params = {}) =>
    apiClient.get('/seller/stats', { params }),

  // Get seller products
  getMyProducts: (params = {}) => {
    // Use /products/seller/my-products (correct endpoint)
    return apiClient.get('/products/seller/my-products', { params });
  },

  // Create product
  createProduct: (data) => {
    // Transform to match backend expectations
    const stockValue = Number(data.stock) || Number(data.quantity_in_stock) || 0;
    const priceValue = Number(data.price) || 0;
    
    const payload = {
      name: String(data.name || '').trim(),
      price: priceValue,
      original_price: priceValue * 1.2,
      unit: String(data.unit || 'kg').trim(),
      quantity_in_stock: stockValue,
      category_id: Number(data.category_id) || 1,
      description: String(data.description || '').trim(),
      images: Array.isArray(data.images) ? data.images : [],
    };
    
    // Only add shop_id if it's a valid number
    if (data.shop_id && Number(data.shop_id) > 0) {
      payload.shop_id = Number(data.shop_id);
    }
    
    console.log('✅ Sanitized payload:', payload);
    
    // Validate before sending
    if (!payload.name) {
      throw new Error('Product name is required');
    }
    if (payload.price <= 0) {
      throw new Error('Price must be greater than 0');
    }
    if (payload.quantity_in_stock < 0) {
      throw new Error('Stock cannot be negative');
    }
    
    // Try /products endpoint (backend should extract shop from JWT token)
    return apiClient.post('/products', payload);
  },

  // Update product
  updateProduct: (id, data) => {
    const payload = {};
    // Transform field names to match backend expectations
    if (data.name !== undefined) payload.name = data.name;
    if (data.price !== undefined) payload.price = data.price;
    if (data.stock !== undefined) payload.quantity_in_stock = data.stock;
    if (data.quantity_in_stock !== undefined) payload.quantity_in_stock = data.quantity_in_stock;
    if (data.unit !== undefined) payload.unit = data.unit;
    if (data.weight !== undefined) payload.weight = data.weight;
    if (data.description !== undefined) payload.description = data.description;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    if (data.images !== undefined) payload.images = data.images;
    if (data.category_id !== undefined) payload.category_id = data.category_id;
    return apiClient.put(`/products/${id}`, payload);
  },

  // Delete product
  deleteProduct: (id) =>
    apiClient.delete(`/products/${id}`),

  // Get seller orders
  getOrders: (params = {}) =>
    apiClient.get('/orders/shop/all', { params }),

  // Get orders pending payment verification
  getPendingOrders: (params = {}) =>
    apiClient.get('/orders/shop/pending', { params }),

  // Get orders to ship
  getOrdersToShip: (params = {}) =>
    apiClient.get('/orders/shop/to-ship', { params }),

  // Get single order
  getOrder: (orderId) =>
    apiClient.get(`/orders/${orderId}`),

  // Update order status
  updateOrderStatus: (orderId, status, note = '') =>
    apiClient.put(`/orders/${orderId}/status`, { status, note }),

  // Mark order as shipping
  markShipping: (orderId) =>
    apiClient.put(`/orders/${orderId}/status`, { status: 'in_delivery' }),

  // Mark order as delivered
  markDelivered: (orderId) =>
    apiClient.put(`/orders/${orderId}/status`, { status: 'delivered' }),

  // ==============================
  // Multi-step Registration
  // ==============================
  
  registerStep1: (data) =>
    apiClient.post('/seller/register/step1', data),
  
  registerStep2: (data) =>
    apiClient.post('/seller/register/step2', data),
  
  registerStep3: (data) =>
    apiClient.post('/seller/register/step3', data),
  
  submitRegistration: () =>
    apiClient.post('/seller/register/submit'),
  
  getRegistrationStatus: () =>
    apiClient.get('/seller/register/status'),
};

export const dashboardAPI = {
  // Get dashboard stats
  getDashboard: () =>
    apiClient.get('/seller/dashboard'),
  
  // Get detailed stats
  getStats: (params = {}) =>
    apiClient.get('/seller/stats', { params }),
  
  // Get revenue
  getRevenue: (params = {}) =>
    apiClient.get('/seller/revenue', { params }),
  
  // Get verification requests
  getVerificationRequests: () =>
    apiClient.get('/seller/verification-requests'),
};

// ==============================
// 🔑 ADMIN APIs
// ==============================

export const adminAPI = {
  // Login
  login: (data) =>
    apiClient.post('/admin/login', data),
  
  // ============ USER MANAGEMENT ============
  getUsers: (page = 1, limit = 20, search = '', role = '') =>
    apiClient.get('/admin/users', { params: { page, limit, search, role } }),
  
  getUser: (userId) =>
    apiClient.get(`/admin/users/${userId}`),
  
  changeUserRoles: (userId, roles) =>
    apiClient.patch(`/admin/users/${userId}/roles`, { roles }),
  
  banUser: (userId, reason, duration) =>
    apiClient.patch(`/admin/users/${userId}/ban`, { reason, duration }),
  
  unbanUser: (userId) =>
    apiClient.post(`/admin/users/${userId}/unban`),
  
  deleteUser: (userId) =>
    apiClient.delete(`/admin/users/${userId}`),

  // ============ ACCOUNT DEACTIVATION ============
  deactivateAccount: (userId, reason) =>
    apiClient.post(`/admin/users/${userId}/deactivate`, { reason }),

  reactivateAccount: (userId) =>
    apiClient.post(`/admin/users/${userId}/reactivate`, {}),

  getAccountStatus: (userId) =>
    apiClient.get(`/admin/users/${userId}/account-status`),
  
  // Seller registrations (Approvals)
  getSellerRegistrations: (status) =>
    apiClient.get('/admin/seller-registrations', { params: status ? { status } : {} }),
  
  approveRegistration: (id) =>
    apiClient.post(`/admin/seller-registrations/${id}/approve`),
  
  rejectRegistration: (id, reason) =>
    apiClient.post(`/admin/seller-registrations/${id}/reject`, { reason }),
    
  // Delivery registrations (Approvals)
  getDeliveryRegistrations: (status) =>
    apiClient.get('/admin/delivery-registrations', { params: status ? { status } : {} }),
  
  approveDeliveryRegistration: (id) =>
    apiClient.post(`/admin/delivery-registrations/${id}/approve`),
  
  rejectDeliveryRegistration: (id, reason) =>
    apiClient.post(`/admin/delivery-registrations/${id}/reject`, { reason }),
  
  // Stats
  getSellersStats: () =>
    apiClient.get('/admin/sellers/stats'),
  
  getSellerStats: (shopId) =>
    apiClient.get(`/admin/sellers/${shopId}/stats`),
  
  getRecentOrders: (params = {}) =>
    apiClient.get('/admin/orders/recent', { params }),

  // ── Payment Slip Management ──
  getPaymentSlips: () =>
    apiClient.get('/admin/payment-slips'),

  approvePayment: (orderId) =>
    apiClient.put(`/admin/orders/${orderId}/approve`),

  rejectPayment: (orderId, reason) =>
    apiClient.put(`/admin/orders/${orderId}/reject`, { reason }),

  // ============ PRODUCTS MANAGEMENT ============
  getAdminProducts: (page = 1, limit = 20, search = '', status = '') =>
    apiClient.get('/admin/products', { params: { page, limit, search, status } }),

  deleteAdminProduct: (productId) =>
    apiClient.delete(`/admin/products/${productId}`),

  toggleProductStatus: (productId) =>
    apiClient.put(`/admin/products/${productId}/toggle-status`),
};

// ==============================
// 📊 STATISTICS APIs (Admin — GET only)
// ==============================

export const statisticsAPI = {
  getSummary: (params = {}) =>
    apiClient.get('/statistics/summary', { params }),

  getSalesChart: (params = {}) =>
    apiClient.get('/statistics/sales-chart', { params }),

  getOrderStatus: (params = {}) =>
    apiClient.get('/statistics/order-status', { params }),

  getTopProducts: (params = {}) =>
    apiClient.get('/statistics/top-products', { params }),
};

// ==============================
// 🚚 DELIVERY REGISTRATION APIs
// ==============================

export const deliveryAPI = {
  // ============ DELIVERY REGISTRATION (Multi-step) ============
  registerStep1: (data) =>
    apiClient.post('/delivery/register/step1', data),

  registerStep2: (data) =>
    apiClient.post('/delivery/register/step2', data),

  verifyOTP: () =>
    apiClient.post('/delivery/register/verify-otp'),

  submitRegistration: () =>
    apiClient.post('/delivery/register/submit'),

  getRegistrationStatus: () =>
    apiClient.get('/delivery/register/status'),
};

// ==============================
// 🚚 COURIER APIs (Order Lifecycle)
// ==============================

export const courierAPI = {
  // Get orders available for pickup (status=to_ship, no courier)
  getAvailableOrders: (params = {}) =>
    apiClient.get('/orders/courier/available', { params }),

  // Get orders assigned to current courier
  getMyOrders: (params = {}) =>
    apiClient.get('/orders/courier/my', { params }),

  // Claim an unclaimed order
  claimOrder: (orderId) =>
    apiClient.patch(`/orders/${orderId}/claim`),

  // Update delivery status (picking_up → shipping → delivered)
  updateStatus: (orderId, status) =>
    apiClient.patch(`/orders/${orderId}/courier-status`, { status }),
};

// ==============================
// 🏠 ADDRESS APIs
// ==============================

export const addressAPI = {
  getAddresses: () => apiClient.get('/addresses'),
  addAddress: (data) => apiClient.post('/addresses', data),
  updateAddress: (id, data) => apiClient.put(`/addresses/${id}`, data),
  deleteAddress: (id) => apiClient.delete(`/addresses/${id}`),
};

// ==============================
// 📤 UPLOAD APIs
// ==============================

export const uploadAPI = {
  uploadImage: (imageBase64) => apiClient.post('/upload', { imageBase64 }),
};

// ==============================
// 📬 NOTIFICATION APIs
// ==============================

export const notificationAPI = {
  // Get notifications
  getNotifications: (limit = 20, offset = 0, unreadOnly = false) =>
    apiClient.get('/notifications', { params: { limit, offset, unreadOnly } }),

  // Get unread count
  getUnreadCount: () =>
    apiClient.get('/notifications/unread-count'),

  // Mark notification as read
  markAsRead: (notificationId) =>
    apiClient.patch(`/notifications/${notificationId}/read`),

  // Mark all notifications as read
  markAllAsRead: () =>
    apiClient.post('/notifications/read-all'),

  // Delete notification
  deleteNotification: (notificationId) =>
    apiClient.delete(`/notifications/${notificationId}`),

  // ============ PUSH NOTIFICATIONS ============

  // Subscribe to push notifications
  subscribeToPush: (subscription) =>
    apiClient.post('/notifications/push/subscribe', { subscription }),

  // Unsubscribe from push notifications
  unsubscribeFromPush: (endpoint = null) =>
    apiClient.post('/notifications/push/unsubscribe', { endpoint }),

  // Check push notification status
  getPushStatus: () =>
    apiClient.get('/notifications/push/status'),
};

// ==============================
// Default export
// ==============================

export default {
  authAPI,
  productAPI,
  cartAPI,
  orderAPI,
  reviewAPI,
  sellerAPI,
  deliveryAPI,
  courierAPI,
  adminAPI,
  addressAPI,
  uploadAPI,
  notificationAPI,
  apiClient,
};
