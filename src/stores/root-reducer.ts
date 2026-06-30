import { combineReducers } from '@reduxjs/toolkit';
import { baseApiReducer } from '@services/api';
import { pokemonQueryReducer } from '@services/pokemon';
import { authReducer, settingsReducer } from '@slices/index';

import cartReducer from '@/slices/cart-slice';
import ordersReducer from '@/slices/order-slice';
import checkoutReducer from '@/slices/checkout-slice';
import sellerReducer from '@/slices/seller-slice';
import notificationsReducer from '@/slices/notification-slice';
import sellerNotificationsReducer from '@/slices/seller-notifications-slice';
import reviewsReducer from '@/slices/reviews-slice';
import followShopsReducer from '@/slices/follow-shop-slice';
import adminUsersReducer from '@/slices/admin-users-slice';
import adminProductsReducer from '@/slices/admin-products-slice';
import adminAnalyticsReducer from '@/slices/admin-analytics-slice';

const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  cart: cartReducer,
  orders: ordersReducer,
  checkout: checkoutReducer,
  notifications: notificationsReducer,
  sellerNotifications: sellerNotificationsReducer, // ✅ การแจ้งเตือนของร้านค้า
  seller: sellerReducer,
  reviews: reviewsReducer,
  followShops: followShopsReducer, // ✅ ระบบติดตามร้านค้า
  adminUsers: adminUsersReducer, // ✅ Admin: User Management
  adminProducts: adminProductsReducer, // ✅ Admin: Product Management
  adminAnalytics: adminAnalyticsReducer, // ✅ Admin: Analytics

  ...baseApiReducer,
  ...pokemonQueryReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;