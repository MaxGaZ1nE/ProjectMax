declare module '@services/backend-api' {
  // ======================
  // 🔹 Generic API Response
  // ======================
  export interface ApiResponse<T = unknown> {
    data: T;
    message?: string;
    success?: boolean;
  }

  // ======================
  // 🔹 User
  // ======================
  export interface User {
    id: string;
    email: string;
    phone?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    province?: string;
    postalCode?: string;
    birthDate?: string;
    gender?: string;
    token?: string;
  }

  // ======================
  // 🔹 AUTH API
  // ======================
  export interface AuthAPI {
    register: (data: Record<string, unknown>) => Promise<ApiResponse<User>>;
    login: (emailOrPhone: string, password: string) => Promise<ApiResponse<User>>;
    getProfile: () => Promise<ApiResponse<User>>;
    updateProfile: (data: Partial<User>) => Promise<ApiResponse<User>>;
    changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<ApiResponse<unknown>>;
    forgotPassword: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    resetPassword: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    verifyOTP: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    resendOTP: () => Promise<ApiResponse<unknown>>;
    logout: () => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 🔹 PRODUCT API
  // ======================
  export interface ProductAPI {
    getProducts: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getProduct: (id: string | number) => Promise<ApiResponse<unknown>>;
    searchProducts: (query: string, filters?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getCategories: () => Promise<ApiResponse<unknown>>;
    createProduct: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    updateProduct: (id: string | number, data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    deleteProduct: (id: string | number) => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 🔹 CART API
  // ======================
  export interface CartAPI {
    getCart: () => Promise<ApiResponse<unknown>>;
    getCartSummary: () => Promise<ApiResponse<unknown>>;
    addToCart: (productId: string | number, quantity: number, weight?: number) => Promise<ApiResponse<unknown>>;
    updateCartItem: (productId: string | number, quantity: number, weight?: number) => Promise<ApiResponse<unknown>>;
    removeFromCart: (productId: string | number) => Promise<ApiResponse<unknown>>;
    clearCart: () => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 🔹 ORDER API
  // ======================
  export interface OrderAPI {
    createOrder: (
      items: unknown[],
      paymentMethod: string,
      orderInfo: Record<string, unknown>
    ) => Promise<ApiResponse<unknown>>;
    getOrders: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getOrder: (orderId: string | number) => Promise<ApiResponse<unknown>>;
    trackOrder: (orderId: string | number) => Promise<ApiResponse<unknown>>;
    verifyPayment: (orderId: string | number, slipImage: string, paidAmount: number) => Promise<ApiResponse<unknown>>;
    cancelOrder: (orderId: string | number, reason: string) => Promise<ApiResponse<unknown>>;
    claimOrder: (orderId: string | number, reason: string, note?: string) => Promise<ApiResponse<unknown>>;
    confirmDelivery: (
      orderId: string | number,
      signatureImage: string,
      deliveryPhoto: string,
      courierId: string,
      courierName: string
    ) => Promise<ApiResponse<unknown>>;
    getPOD: (orderId: string | number) => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 🔹 REVIEW API
  // ======================
  export interface ReviewAPI {
    submitReview: (
      orderId: string | number,
      productId: string | number,
      rating: number,
      body: string,
      qualityText?: string,
      tasteText?: string
    ) => Promise<ApiResponse<unknown>>;
    getProductReviews: (productKey: string, params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getReview: (reviewId: string | number) => Promise<ApiResponse<unknown>>;
    updateReview: (reviewId: string | number, data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    deleteReview: (reviewId: string | number) => Promise<ApiResponse<unknown>>;
    getShopRating: (shopId: string | number) => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 🔹 SHOP API
  // ======================
  export interface ShopAPI {
    getShop: (shopId: string | number) => Promise<ApiResponse<unknown>>;
    getShopProducts: (shopId: string | number, params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    createShop: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    updateShopProfile: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getSellerOrders: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    updateOrderStatus: (orderId: string | number, status: string, note?: string) => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 🔹 SELLER API
  // ======================
  export interface SellerAPI {
    registerSeller: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    registerStep1: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    registerStep2: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    registerStep3: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    submitRegistration: () => Promise<ApiResponse<unknown>>;
    getProfile: () => Promise<ApiResponse<unknown>>;
    updateProfile: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getStats: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getMyProducts: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    createProduct: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    updateProduct: (id: string | number, data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    deleteProduct: (id: string | number) => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 🔹 FOLLOW API
  // ======================
  export interface FollowAPI {
    followShop: (shopId: string | number) => Promise<ApiResponse<unknown>>;
    unfollowShop: (shopId: string | number) => Promise<ApiResponse<unknown>>;
    getFollowedShops: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    checkFollowStatus: (shopId: string | number) => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 🔹 DASHBOARD API
  // ======================
  export interface DashboardAPI {
    getDashboard: () => Promise<ApiResponse<unknown>>;
    getStats: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getRevenue: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getVerificationRequests: () => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 🔹 ADMIN API
  // ======================
  export interface AdminAPI {
    login: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getSellerRegistrations: (status?: string) => Promise<ApiResponse<unknown>>;
    approveRegistration: (id: number) => Promise<ApiResponse<unknown>>;
    rejectRegistration: (id: number, reason: string) => Promise<ApiResponse<unknown>>;
    getSellersStats: () => Promise<ApiResponse<unknown>>;
    getSellerStats: (shopId: string | number) => Promise<ApiResponse<unknown>>;
    getRecentOrders: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    getDeliveryRegistrations: (status?: string) => Promise<ApiResponse<unknown>>;
    approveDeliveryRegistration: (id: number) => Promise<ApiResponse<unknown>>;
    rejectDeliveryRegistration: (id: number, reason: string) => Promise<ApiResponse<unknown>>;
  }

  export interface CourierAPI {
  getAvailableOrders: (params?: Record<string, unknown>) => Promise<{ data: ApiResponse<unknown> }>;
  getMyOrders: (params?: Record<string, unknown>) => Promise<{ data: ApiResponse<unknown> }>;
  claimOrder: (orderId: string) => Promise<{ data: ApiResponse<unknown> }>;
  updateStatus: (orderId: string, status: string) => Promise<{ 
    data: { 
      success: boolean; 
      message?: string; 
      data?: unknown 
    } 
  }>;
}

  // ======================
  // 🚚 DELIVERY API
  // ======================
  export interface DeliveryAPI {
    registerStep1: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    registerStep2: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    verifyOTP: () => Promise<ApiResponse<unknown>>;
    submitRegistration: () => Promise<ApiResponse<unknown>>;
    getRegistrationStatus: () => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 📍 ADDRESS API
  // ======================
  export interface AddressAPI {
    getAddresses: () => Promise<ApiResponse<unknown>>;
    addAddress: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    updateAddress: (id: string | number, data: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    deleteAddress: (id: string | number) => Promise<ApiResponse<unknown>>;
  }

  // ======================
  // 📤 UPLOAD API
  // ======================
  export interface UploadAPI {
    uploadImage: (imageBase64: string) => Promise<ApiResponse<{ url: string }>>;
  }

  export const authAPI: AuthAPI;
  export const productAPI: ProductAPI;
  export const cartAPI: CartAPI;
  export const orderAPI: OrderAPI;
  export const reviewAPI: ReviewAPI;
  export const shopAPI: ShopAPI;
  export const sellerAPI: SellerAPI;
  export const deliveryAPI: DeliveryAPI;
  export const followAPI: FollowAPI;
  export const dashboardAPI: DashboardAPI;
  export const adminAPI: AdminAPI;
  export const courierAPI: CourierAPI;
  export const addressAPI: AddressAPI;
  export const uploadAPI: UploadAPI;
  const apiClient: unknown;
  export default apiClient;
}

declare module '@/services/backend-api' {
  export * from '@services/backend-api';
}
