import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from './auth-slice';

export type NotificationType = 'order' | 'payment' | 'in_delivery' | 'system' | 'error';

export type AppNotificationLink = {
  to: string; // path เช่น "/profile"
  state?: unknown; // เช่น { tab: "orders", orderTab: "pending_verification" }
};

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  createdAt: string; // ISO
  read: boolean;
  link?: AppNotificationLink;
};

type NotificationsState = {
  items: AppNotification[];
};

const initialState: NotificationsState = {
  items: [],
};

function makeId() {
  return `NTF_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushNotification: (
      state,
      action: PayloadAction<{
        type: NotificationType;
        title: string;
        message?: string;
        link?: AppNotificationLink;
      }>
    ) => {
      state.items.unshift({
        id: makeId(),
        type: action.payload.type,
        title: action.payload.title,
        message: action.payload.message,
        link: action.payload.link,
        createdAt: new Date().toISOString(),
        read: false,
      });

      // เก็บล่าสุด 50 อัน
      if (state.items.length > 50) state.items = state.items.slice(0, 50);
    },

    markRead: (state, action: PayloadAction<{ id: string }>) => {
      const n = state.items.find((x) => x.id === action.payload.id);
      if (n) n.read = true;
    },

    markAllRead: (state) => {
      state.items.forEach((n) => {
        n.read = true;
      });
    },

    clearAllNotifications: (state) => {
      state.items = [];
    },
  },
  // ✅ เมื่อ logout → ล้าง notifications ทั้งหมดทันที
  // เพื่อไม่ให้ notifications ของ user/seller คนก่อนค้างอยู่
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.items = [];
    });
  },
});

export const { pushNotification, markRead, markAllRead, clearAllNotifications } = notificationsSlice.actions;

export default notificationsSlice.reducer;