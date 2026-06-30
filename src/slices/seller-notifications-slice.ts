import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type SellerNotificationType = 'order' | 'order_update' | 'payment' | 'review' | 'system';

export type SellerNotification = {
  id: number;
  shop_id: number;
  type: SellerNotificationType;
  title: string;
  message?: string;
  order_id?: string;
  related_data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
};

type SellerNotificationsState = {
  // เก็บการแจ้งเตือนแยกตาม shop_id
  notificationsByShop: Record<number, SellerNotification[]>;
  unreadCountByShop: Record<number, number>;
  loading: boolean;
  error: string | null;
  lastUpdated: Record<number, string>; // timestamp of last fetch per shop
};

const initialState: SellerNotificationsState = {
  notificationsByShop: {},
  unreadCountByShop: {},
  loading: false,
  error: null,
  lastUpdated: {},
};

export const sellerNotificationsSlice = createSlice({
  name: 'sellerNotifications',
  initialState,
  reducers: {
    // ✅ โหลดการแจ้งเตือนของร้านค้า
    loadNotifications: (
      state,
      action: PayloadAction<{
        shopId: number;
        notifications: SellerNotification[];
        unreadCount: number;
      }>
    ) => {
      const { shopId, notifications, unreadCount } = action.payload;
      state.notificationsByShop[shopId] = notifications;
      state.unreadCountByShop[shopId] = unreadCount;
      state.lastUpdated[shopId] = new Date().toISOString();
    },

    // ✅ เพิ่มการแจ้งเตือนใหม่
    addNotification: (
      state,
      action: PayloadAction<{
        shopId: number;
        notification: SellerNotification;
      }>
    ) => {
      const { shopId, notification } = action.payload;
      if (!state.notificationsByShop[shopId]) {
        state.notificationsByShop[shopId] = [];
      }
      state.notificationsByShop[shopId].unshift(notification);
      if (!notification.is_read) {
        state.unreadCountByShop[shopId] = (state.unreadCountByShop[shopId] ?? 0) + 1;
      }
    },

    // ✅ ทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้ว
    markNotificationAsRead: (
      state,
      action: PayloadAction<{
        shopId: number;
        notificationId: number;
      }>
    ) => {
      const { shopId, notificationId } = action.payload;
      const notifications = state.notificationsByShop[shopId];
      if (notifications) {
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification && !notification.is_read) {
          notification.is_read = true;
          notification.read_at = new Date().toISOString();
          state.unreadCountByShop[shopId] = Math.max(
            0,
            (state.unreadCountByShop[shopId] ?? 0) - 1
          );
        }
      }
    },

    // ✅ ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว
    markAllAsRead: (state, action: PayloadAction<number>) => {
      const shopId = action.payload;
      const notifications = state.notificationsByShop[shopId];
      if (notifications) {
        notifications.forEach((n) => {
          if (!n.is_read) {
            n.is_read = true;
            n.read_at = new Date().toISOString();
          }
        });
        state.unreadCountByShop[shopId] = 0;
      }
    },

    // ✅ ลบการแจ้งเตือน
    removeNotification: (
      state,
      action: PayloadAction<{
        shopId: number;
        notificationId: number;
      }>
    ) => {
      const { shopId, notificationId } = action.payload;
      const notifications = state.notificationsByShop[shopId];
      if (notifications) {
        const index = notifications.findIndex((n) => n.id === notificationId);
        if (index !== -1) {
          const notification = notifications[index];
          if (!notification.is_read) {
            state.unreadCountByShop[shopId] = Math.max(
              0,
              (state.unreadCountByShop[shopId] ?? 0) - 1
            );
          }
          notifications.splice(index, 1);
        }
      }
    },

    // ✅ ล้างการแจ้งเตือนทั้งหมดของร้านค้า
    clearAllNotifications: (state, action: PayloadAction<number>) => {
      const shopId = action.payload;
      state.notificationsByShop[shopId] = [];
      state.unreadCountByShop[shopId] = 0;
    },

    // ✅ ล้างการแจ้งเตือนทั้งหมดของทุกร้านค้า (สำหรับ logout)
    clearAllSellerNotifications: (state) => {
      state.notificationsByShop = {};
      state.unreadCountByShop = {};
      state.lastUpdated = {};
    },

    // ✅ สถานะ loading
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // ✅ สถานะ error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  loadNotifications,
  addNotification,
  markNotificationAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  clearAllSellerNotifications,
  setLoading,
  setError,
} = sellerNotificationsSlice.actions;

// ✅ Selectors
export const selectNotificationsByShop = (shopId: number) => (state: any) =>
  state.sellerNotifications?.notificationsByShop?.[shopId] ?? [];

export const selectUnreadCountByShop = (shopId: number) => (state: any) =>
  state.sellerNotifications?.unreadCountByShop?.[shopId] ?? 0;

export const selectIsLoading = (state: any) =>
  state.sellerNotifications?.loading ?? false;

export const selectError = (state: any) =>
  state.sellerNotifications?.error ?? null;

export default sellerNotificationsSlice.reducer;
