import { axiosInstance } from './base-api';

/**
 * Admin API Services
 * สำหรับการจัดการผู้ใช้, สินค้า, หมวดหมู่, และวิเคราะห์ข้อมูล
 */

// ============ USER MANAGEMENT ============
export const adminUserAPI = {
  // ดึงรายชื่อผู้ใช้ทั้งหมด
  getUsers: async (page: number = 1, limit: number = 20, search: string = '', role?: string) => {
    const response = await axiosInstance.get('/admin/users', {
      params: { page, limit, search, role },
    });
    return response.data;
  },

  // ดึงข้อมูลผู้ใช้เพียงคนเดียว
  getUser: async (userId: string) => {
    const response = await axiosInstance.get(`/admin/users/${userId}`);
    return response.data;
  },

  // ดึงข้อมูลผู้ใช้แบบเจาะลึก (พร้อม Role Seller/Delivery)
  getUserDetail: async (userId: string) => {
    const response = await axiosInstance.get(`/admin/users/${userId}/detail`);
    return response.data;
  },

  // ดึงข้อมูล Seller ของ User
  getUserSeller: async (userId: string) => {
    const response = await axiosInstance.get(`/admin/users/${userId}/seller`);
    return response.data;
  },

  // ดึงข้อมูล Delivery ของ User
  getUserDelivery: async (userId: string) => {
    const response = await axiosInstance.get(`/admin/users/${userId}/delivery`);
    return response.data;
  },

  // ดึงข้อมูล Order ของ User
  getUserOrders: async (userId: string, page = 1, limit = 10) => {
    const response = await axiosInstance.get(`/admin/users/${userId}/orders`, {
      params: { page, limit }
    });
    return response.data;
  },

  // อัปเดตข้อมูลผู้ใช้
  updateUser: async (userId: string, data: any) => {
    const response = await axiosInstance.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  // เปลี่ยนบทบาทผู้ใช้
  changeUserRoles: async (userId: string, roles: string[]) => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/roles`, { roles });
    return response.data;
  },

  // ปิดใช้งาน/แบน ผู้ใช้
  banUser: async (userId: string, reason: string, duration?: number) => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/ban`, { reason, duration });
    return response.data;
  },

  // เปิดใช้งาน ผู้ใช้ที่ถูกแบน
  unbanUser: async (userId: string) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/unban`);
    return response.data;
  },

  // ลบผู้ใช้
  deleteUser: async (userId: string) => {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
  },
};

// ============ PRODUCT MANAGEMENT ============
export const adminProductAPI = {
  // ดึงรายชื่อสินค้าทั้งหมด
  getProducts: async (page: number = 1, limit: number = 20, search: string = '', sellerId?: string) => {
    const response = await axiosInstance.get('/admin/products', {
      params: { page, limit, search, sellerId },
    });
    return response.data;
  },

  // ดึงข้อมูลสินค้าเพียงรายการเดียว
  getProduct: async (productId: string) => {
    const response = await axiosInstance.get(`/admin/products/${productId}`);
    return response.data;
  },

  // อนุมัติสินค้า
  approveProduct: async (productId: string) => {
    const response = await axiosInstance.post(`/admin/products/${productId}/approve`);
    return response.data;
  },

  // ปฏิเสธสินค้า
  rejectProduct: async (productId: string, reason: string) => {
    const response = await axiosInstance.post(`/admin/products/${productId}/reject`, { reason });
    return response.data;
  },

  // ลบสินค้า
  deleteProduct: async (productId: string, reason?: string) => {
    const response = await axiosInstance.delete(`/admin/products/${productId}`, {
      data: { reason },
    });
    return response.data;
  },

  // อัปเดตสินค้า
  updateProduct: async (productId: string, data: any) => {
    const response = await axiosInstance.put(`/admin/products/${productId}`, data);
    return response.data;
  },

  // ยักษ์กำหนดฟีเจอร์ (Feature Flag)
  featuredProduct: async (productId: string, featured: boolean) => {
    const response = await axiosInstance.put(`/admin/products/${productId}/featured`, { featured });
    return response.data;
  },
};

// ============ CATEGORY MANAGEMENT ============
export const adminCategoryAPI = {
  // ดึงรายชื่อหมวดหมู่ทั้งหมด
  getCategories: async () => {
    const response = await axiosInstance.get('/admin/categories');
    return response.data;
  },

  // สร้างหมวดหมู่ใหม่
  createCategory: async (data: { name: string; description?: string; image?: string }) => {
    const response = await axiosInstance.post('/admin/categories', data);
    return response.data;
  },

  // อัปเดตหมวดหมู่
  updateCategory: async (categoryId: string, data: any) => {
    const response = await axiosInstance.put(`/admin/categories/${categoryId}`, data);
    return response.data;
  },

  // ลบหมวดหมู่
  deleteCategory: async (categoryId: string) => {
    const response = await axiosInstance.delete(`/admin/categories/${categoryId}`);
    return response.data;
  },
};

// ============ ORDER ANALYTICS ============
export const adminAnalyticsAPI = {
  // ดึงข้อมูลคำสั่งซื้อทั้งหมด
  getOrders: async (page: number = 1, limit: number = 20, filters?: any) => {
    const response = await axiosInstance.get('/admin/analytics/orders', {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  // ดึงสรุปข้อมูล Dashboard
  getDashboardSummary: async (dateRange?: { startDate: string; endDate: string }) => {
    const response = await axiosInstance.get('/admin/analytics/summary', {
      params: dateRange,
    });
    return response.data;
  },

  // ดึงข้อมูลรายได้
  getRevenue: async (dateRange?: { startDate: string; endDate: string }) => {
    const response = await axiosInstance.get('/admin/analytics/revenue', {
      params: dateRange,
    });
    return response.data;
  },

  // ดึงข้อมูลสินค้าขายดี
  getTopProducts: async (limit: number = 10) => {
    const response = await axiosInstance.get('/admin/analytics/top-products', {
      params: { limit },
    });
    return response.data;
  },

  // ดึงข้อมูลผู้ขายขายดี
  getTopSellers: async (limit: number = 10) => {
    const response = await axiosInstance.get('/admin/analytics/top-sellers', {
      params: { limit },
    });
    return response.data;
  },

  // ดึงข้อมูลวิเคราะห์เป็นระดับเวลา
  getAnalyticsTimeline: async (period: 'daily' | 'weekly' | 'monthly', limit: number = 30) => {
    const response = await axiosInstance.get('/admin/analytics/timeline', {
      params: { period, limit },
    });
    return response.data;
  },
};

// ============ SELLER MANAGEMENT ============
export const adminSellerAPI = {
  // ดึงรายชื่อผู้ขายทั้งหมด
  getSellers: async (page: number = 1, limit: number = 20, search: string = '', status?: string) => {
    const response = await axiosInstance.get('/admin/sellers', {
      params: { page, limit, search, status },
    });
    return response.data;
  },

  // ได้ผู้ขายรอการตรวจสอบ
  getPendingSellers: async () => {
    const response = await axiosInstance.get('/admin/sellers/pending');
    return response.data;
  },

  // อนุมัติผู้ขาย
  approveSeller: async (sellerId: string) => {
    const response = await axiosInstance.post(`/admin/sellers/${sellerId}/approve`);
    return response.data;
  },

  // ปฏิเสธผู้ขาย
  rejectSeller: async (sellerId: string, reason: string) => {
    const response = await axiosInstance.post(`/admin/sellers/${sellerId}/reject`, { reason });
    return response.data;
  },

  // เตือนผู้ขาย
  warnSeller: async (sellerId: string, reason: string) => {
    const response = await axiosInstance.post(`/admin/sellers/${sellerId}/warn`, { reason });
    return response.data;
  },

  // แบนผู้ขาย
  banSeller: async (sellerId: string, reason: string, duration?: number) => {
    const response = await axiosInstance.post(`/admin/sellers/${sellerId}/ban`, { reason, duration });
    return response.data;
  },
};

// ============ SELLER REGISTRATION MANAGEMENT ============
export const adminSellerApprovalAPI = {
  // ดึงรายการสมัครผู้ขายทั้งหมด
  getSellerApprovals: async (status?: string) => {
    const response = await axiosInstance.get('/admin/seller-registrations', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  // อนุมัติการสมัครผู้ขาย
  approveSeller: async (id: number | string) => {
    const response = await axiosInstance.post(`/admin/seller-registrations/${id}/approve`);
    return response.data;
  },

  // ปฏิเสธการสมัครผู้ขาย
  rejectSeller: async (id: number | string, reason: string) => {
    const response = await axiosInstance.post(`/admin/seller-registrations/${id}/reject`, { reason });
    return response.data;
  },
};

// ============ DELIVERY REGISTRATION MANAGEMENT ============
export const adminDeliveryApprovalAPI = {
  // ดึงรายการสมัครคนส่งทั้งหมด
  getDeliveryApprovals: async (status?: string) => {
    const response = await axiosInstance.get('/admin/delivery-registrations', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  // อนุมัติการสมัครคนส่ง
  approveDelivery: async (id: number | string) => {
    const response = await axiosInstance.post(`/admin/delivery-registrations/${id}/approve`);
    return response.data;
  },

  // ปฏิเสธการสมัครคนส่ง
  rejectDelivery: async (id: number | string, reason: string) => {
    const response = await axiosInstance.post(`/admin/delivery-registrations/${id}/reject`, { reason });
    return response.data;
  },
};

// ============ SYSTEM SETTINGS ============
export const adminSettingsAPI = {
  // ดึงค่าตั้งระบบ
  getSettings: async () => {
    const response = await axiosInstance.get('/admin/settings');
    return response.data;
  },

  // อัปเดตค่าตั้งระบบ
  updateSettings: async (data: any) => {
    const response = await axiosInstance.put('/admin/settings', data);
    return response.data;
  },

  // ดึงค่าตั้งค่าจัดส่ง
  getShippingSettings: async () => {
    const response = await axiosInstance.get('/admin/settings/shipping');
    return response.data;
  },

  // อัปเดตค่าตั้งค่าจัดส่ง
  updateShippingSettings: async (data: any) => {
    const response = await axiosInstance.put('/admin/settings/shipping', data);
    return response.data;
  },

  // ดึงค่าตั้งการชำระเงิน
  getPaymentSettings: async () => {
    const response = await axiosInstance.get('/admin/settings/payment');
    return response.data;
  },

  // อัปเดตค่าตั้งการชำระเงิน
  updatePaymentSettings: async (data: any) => {
    const response = await axiosInstance.put('/admin/settings/payment', data);
    return response.data;
  },
};
