/**
 * Delivery API Service
 * Handles all delivery job-related API calls
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

export interface DeliveryJob {
  id: string;
  orderId: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'in_delivery' | 'delivered' | 'cancelled';
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance?: number;
  estimatedEarning?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDeliveryJobPayload {
  orderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  buyerName: string;
  buyerPhone: string;
  totalPrice: number;
  shippingFee?: number;
}

export const deliveryJobAPI = {
  /**
   * ==================== DELIVERY JOBS ====================
   */

  /**
   * Create delivery job (Marketplace → creates job when Seller presses "Ship")
   * POST /delivery/jobs
   */
  async createJob(payload: CreateDeliveryJobPayload): Promise<DeliveryJob> {
    try {
      const response = await api.post('/delivery/jobs', {
        order_id: payload.orderId,
        pickup_address: payload.pickupAddress,
        delivery_address: payload.deliveryAddress,
        buyer_name: payload.buyerName,
        buyer_phone: payload.buyerPhone,
        total_price: payload.totalPrice,
        shipping_fee: payload.shippingFee,
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create delivery job');
    }
  },

  /**
   * Get delivery job by order ID
   * GET /delivery/jobs/order/{orderId}
   */
  async getJobByOrderId(orderId: string): Promise<DeliveryJob> {
    try {
      const response = await api.get(`/delivery/jobs/order/${orderId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch delivery job');
    }
  },

  /**
   * Cancel delivery job (in case order is cancelled)
   * POST /delivery/jobs/{jobId}/cancel
   */
  async cancelJob(jobId: string, reason?: string): Promise<void> {
    try {
      await api.post(`/delivery/jobs/${jobId}/cancel`, {
        reason: reason || 'Order cancelled',
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel delivery job');
    }
  },

  /**
   * Get seller's delivery jobs
   * GET /delivery/jobs/my-shop
   */
  async getMyJobs(status?: string): Promise<DeliveryJob[]> {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/delivery/jobs/my-shop', { params });
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch delivery jobs');
    }
  },

  /**
   * Get single delivery job details
   * GET /delivery/jobs/{jobId}
   */
  async getJob(jobId: string): Promise<DeliveryJob> {
    try {
      const response = await api.get(`/delivery/jobs/${jobId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch delivery job details');
    }
  },

  /**
   * Update delivery job status
   * PUT /delivery/jobs/{jobId}/status
   */
  async updateJobStatus(jobId: string, status: DeliveryJob['status']): Promise<DeliveryJob> {
    try {
      const response = await api.put(`/delivery/jobs/${jobId}/status`, {
        status,
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update delivery job status');
    }
  },
};
