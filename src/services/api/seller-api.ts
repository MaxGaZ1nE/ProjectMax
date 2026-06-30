/**
 * Seller API Service
 * Handles all seller-related API calls
 */

import axios from 'axios';
import { config } from '@config/index';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: config.apiTimeout,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SellerProfile {
  id: number;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  province: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  followersCount: number;
  createdAt: string;
  promptpay?: {
    type: string;
    value: string;
  };
}

export interface SellerProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  weight: number;
  image?: string;
  description?: string;
  isActive: boolean;  // true = visible/active, false = hidden
  createdAt: string;
}

export interface SellerOrder {
  id: string;
  status: 'pending' | 'paid' | 'waiting_driver' | 'shipped' | 'completed' | 'cancelled';
  totalPrice: number;
  customerName: string;
  phone: string;
  paymentStatus: string;
  paymentMethod: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  address: string;
  shippingFee?: number;
  discount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SellerStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  followers: number;
  rating: number;
  monthlyRevenue: number;
  pendingOrders: number;
  toShipOrders: number;
}

export const sellerAPI = {
  /**
   * ==================== PROFILE ====================
   */

  /**
   * Get seller profile
   */
  async getProfile(): Promise<SellerProfile> {
    try {
      const response = await api.get('/seller/profile');
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || 'Failed to fetch profile');
    }
  },

  /**
   * Update seller profile
   */
  async updateProfile(data: Partial<SellerProfile>): Promise<SellerProfile> {
    try {
      const payload = {
        shop_name: data.shopName,
        owner_name: data.ownerName,
        phone: data.phone,
        address_line: data.address,
        province: data.province,
        postal_code: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
      };
      const response = await api.put('/seller/profile', payload);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || 'Failed to update profile');
    }
  },

  /**
   * Register as seller
   */
  async registerSeller(data: Partial<SellerProfile>): Promise<{ shop: SellerProfile; token: string }> {
    try {
      const payload = {
        shop_name: data.shopName,
        owner_name: data.ownerName,
        phone: data.phone,
        address_line: data.address,
        province: data.province,
        postal_code: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
      };
      const response = await api.post('/seller/register', payload);
      return {
        shop: response.data.shop,
        token: response.data.token,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || 'Failed to register as seller');
    }
  },

  /**
   * ==================== PRODUCTS ====================
   */

  /**
   * Get seller's products
   */
  async getProducts(): Promise<SellerProduct[]> {
    try {
      const response = await api.get('/products/seller/my-products');
      // Map is_active → isActive for frontend compatibility
      return (response.data.data || []).map((p: Record<string, unknown>) => ({
        ...p,
        stock: (p.quantity_in_stock as number) ?? (p.stock as number),
        isActive: (p.is_active as boolean) ?? (p.isActive as boolean) ?? true,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      console.error('GET /products/seller/my-products error:', err.response?.status, err.message);
      throw new Error(err.response?.data?.message || `Failed to fetch products: ${err.message}`);
    }
  },

  /**
   * Create new product
   */
  async createProduct(data: {
    name: string;
    price: number;
    stock: number;
    unit?: string;
    weight?: number;
    description?: string;
    image?: string;
  }): Promise<SellerProduct> {
    try {
      // Only send fields that backend recognizes
      const payload = {
        name: data.name,
        price: Number(data.price) || 100,
        quantity_in_stock: Number(data.stock) || 50,
        // Note: unit and weight are NOT in products table, skip them
        description: data.description ? String(data.description).trim() : undefined,
        images: data.image ? String(data.image).trim() : undefined,
      };
      
      // Remove undefined values
      (Object.keys(payload) as (keyof typeof payload)[]).forEach(key => {
        if (payload[key] === undefined) delete payload[key];
      });
      
      const response = await api.post('/products', payload);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || 'Failed to create product');
    }
  },

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    data: Partial<SellerProduct>
  ): Promise<SellerProduct> {
    try {
      const payload: Record<string, unknown> = {};
      
      // Only include fields that backend recognizes (not unit or weight - they're not in products table)
      if (data.name !== undefined) payload.name = String(data.name).trim();
      if (data.price !== undefined) payload.price = Number(data.price) || 100;
      if (data.stock !== undefined) payload.quantity_in_stock = Number(data.stock) || 50;
      if (data.description !== undefined) payload.description = data.description ? String(data.description).trim() : undefined;
      if (data.image !== undefined) payload.image = data.image ? String(data.image).trim() : undefined;
      if (data.isActive !== undefined) payload.is_active = Boolean(data.isActive);
      // Skip: unit, weight - not in products table
      
      const response = await api.put(`/products/${id}`, payload);
      // Map is_active → isActive for frontend compatibility
      const result = response.data.data || response.data;
      return {
        id,  // Ensure id is always preserved
        ...result,
        stock: result.quantity_in_stock ?? result.stock,
        isActive: result.is_active ?? result.isActive ?? true,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Update product error:', err);
      throw new Error(err.response?.data?.message || 'Failed to update product');
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      await api.delete(`/products/${id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || 'Failed to delete product');
    }
  },

  /**
   * ==================== ORDERS ====================
   */

  /**
   * Get seller's orders (with optional filters)
   */
  async getOrders(filters?: {
    status?: string;
    paymentStatus?: string;
    limit?: number;
    page?: number;
  }): Promise<SellerOrder[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.page) params.append('page', String(filters.page));

      const url = `/orders/shop/all${params.toString() ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data.data || [];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.warn('GET /orders/shop/all failed:', err);
      return [];
    }
  },

  /**
   * Get pending orders (awaiting payment verification)
   */
  async getPendingOrders(): Promise<SellerOrder[]> {
    try {
      const response = await api.get('/orders/shop/all?paymentStatus=pending_verification');
      return response.data.data || [];
    } catch {
      console.warn('Failed to fetch pending orders');
      return [];
    }
  },

  /**
   * Get orders to ship
   */
  async getOrdersToShip(): Promise<SellerOrder[]> {
    try {
      const response = await api.get('/orders/shop/all?status=to_ship');
      return response.data.data || [];
    } catch {
      console.warn('Failed to fetch orders to ship');
      return [];
    }
  },

  /**
   * Get order details
   */
  async getOrderById(orderId: string): Promise<SellerOrder> {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || 'Failed to fetch order');
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: 'waiting_driver' | 'shipped' | 'completed' | 'cancelled'
  ): Promise<SellerOrder> {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || 'Failed to update order status');
    }
  },

  /**
   * Verify payment (PromptPay slip verification)
   */
  async verifyPayment(
    orderId: string,
    verified: boolean = true
  ): Promise<SellerOrder> {
    try {
      const response = await api.post(`/orders/${orderId}/verify-payment`, { verified });
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || 'Failed to verify payment');
    }
  },

  /**
   * Reject payment verification
   */
  async rejectPayment(orderId: string, reason?: string): Promise<void> {
    try {
      await api.post(`/orders/${orderId}/verify-payment`, {
        verified: false,
        reason,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || 'Failed to reject payment');
    }
  },

  /**
   * ==================== ANALYTICS ====================
   */

  /**
   * Get seller stats/dashboard summary
   */
  async getStats(): Promise<SellerStats> {
    try {
      const response = await api.get('/seller/stats');
      return response.data.data;
    } catch {
      console.warn('Failed to fetch stats');
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        followers: 0,
        rating: 0,
        monthlyRevenue: 0,
        pendingOrders: 0,
        toShipOrders: 0,
      };
    }
  },

  /**
   * Get dashboard data
   */
  async getDashboard(): Promise<unknown> {
    try {
      const response = await api.get('/seller/dashboard');
      return response.data.data;
    } catch {
      console.warn('Failed to fetch dashboard');
      return null;
    }
  },

  /**
   * Get revenue data
   */
  async getRevenue(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<unknown> {
    try {
      const response = await api.get(`/seller/revenue?period=${period}`);
      return response.data.data;
    } catch {
      console.warn('Failed to fetch revenue');
      return null;
    }
  },

  /**
   * Get shop by ID (public info)
   */
  async getShopById(shopId: number): Promise<Partial<SellerProfile>> {
    try {
      const response = await api.get(`/seller/${shopId}`);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || 'Failed to fetch shop');
    }
  },
};
