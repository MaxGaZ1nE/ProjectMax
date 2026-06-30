import { useInitializeFollowShops, useFollowShopNotifications, useInitializeSeller, useSyncCartWithBackend } from '@/hooks';
import React from 'react';

/**
 * ✅ AppInitializer Component
 * ต้องห่วม app ด้วย component นี้เพื่อให้ใช้งานระบบติดตามร้านค้า และ seller system
 */
export function AppInitializer({ children }: { children: React.ReactNode }) {
  useInitializeFollowShops();
  useFollowShopNotifications();
  useInitializeSeller(); // ✅ ดึง seller profile หลังจาก login
  useSyncCartWithBackend(); // ✅ Sync Redux cart with backend to prevent stale data

  return <>{children}</>;
}
