import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type FollowedShop = {
  shopId: number;
  shopName: string;
  followers: number; // จำนวนผู้ติดตาม
  lastNotificationAt: string; // ISO timestamp ของการแจ้งเตือนล่าสุด
  notificationCount: number; // จำนวนการแจ้งเตือน
};

type FollowShopsState = {
  shops: FollowedShop[]; // ✅ เปลี่ยนจาก Map เป็น Array เพื่อให้ serializable
};

const initialState: FollowShopsState = {
  shops: [],
};

const followShopsSlice = createSlice({
  name: 'followShops',
  initialState,
  reducers: {
    // ✅ ติดตามร้านค้า
    followShop: (
      state,
      action: PayloadAction<{
        shopId: number;
        shopName: string;
      }>
    ) => {
      const { shopId, shopName } = action.payload;
      if (!state.shops.find((s) => s.shopId === shopId)) {
        state.shops.push({
          shopId,
          shopName,
          followers: 1,
          lastNotificationAt: new Date().toISOString(),
          notificationCount: 0,
        });
      }
    },

    // ✅ เลิกติดตามร้านค้า
    unfollowShop: (state, action: PayloadAction<number>) => {
      state.shops = state.shops.filter((s) => s.shopId !== action.payload);
    },

    // ✅ เพิ่มการแจ้งเตือนสำหรับร้านค้า
    addNotificationForShop: (
      state,
      action: PayloadAction<{
        shopId: number;
        shopName: string;
        type: 'new_product' | 'stock_added';
        message: string;
      }>
    ) => {
      const { shopId } = action.payload;
      const shop = state.shops.find((s) => s.shopId === shopId);

      if (shop) {
        shop.lastNotificationAt = new Date().toISOString();
        shop.notificationCount += 1;
      }
    },

    // ✅ รีเซตการแจ้งเตือน
    resetNotificationCount: (state, action: PayloadAction<number>) => {
      const shop = state.shops.find((s) => s.shopId === action.payload);
      if (shop) {
        shop.notificationCount = 0;
      }
    },

    // ✅ โหลด followed shops
    loadFollowedShops: (state, action: PayloadAction<FollowedShop[]>) => {
      state.shops = action.payload;
    },

    // ✅ อัพเดตจำนวนติดตาม
    updateFollowerCount: (
      state,
      action: PayloadAction<{
        shopId: number;
        count: number;
      }>
    ) => {
      const { shopId, count } = action.payload;
      const shop = state.shops.find((s) => s.shopId === shopId);
      if (shop) {
        shop.followers = count;
      }
    },

    // ✅ ล้างร้านค้าที่ติดตามทั้งหมด (สำหรับ logout)
    clearFollowedShops: (state) => {
      state.shops = [];
    },
  },
});

export const {
  followShop,
  unfollowShop,
  addNotificationForShop,
  resetNotificationCount,
  loadFollowedShops,
  updateFollowerCount,
  clearFollowedShops,
} = followShopsSlice.actions;

export default followShopsSlice.reducer;
