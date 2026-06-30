import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { baseApiMiddleware } from '@services/api';
import { pokemonMiddleware } from '@services/pokemon';
import {
  FLUSH, PAUSE, PERSIST, persistReducer,
  persistStore, PURGE, REGISTER, REHYDRATE,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './root-reducer';

const persistConfig = {
  key: 'root_v2', // ✅ เปลี่ยน key → force ล้าง localStorage เก่าทั้งหมด
  version: 2, // ✅ bump version → flush localStorage เก่า (กำจัด notifications ของ seller อื่น)
  storage,
  whitelist: [
    'auth', 'settings', 'cart', 'orders',
    'checkout', 'seller',
    'reviews',
    // ❌ ถอด 'notifications' ออก → notifications ไม่ควร persist ข้าม session
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApiMiddleware, pokemonMiddleware as any),
  devTools: import.meta.env.DEV,
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) =>
  useSelector<RootState, T>(selector);