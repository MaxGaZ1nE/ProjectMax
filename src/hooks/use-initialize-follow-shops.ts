import { useEffect } from 'react';
import { useAppDispatch } from '@stores/index';
import { loadFollowedShops } from '@/slices/follow-shop-slice';
import { getFollowedShopsFromStorage } from '@/utils/followShopStorage';

/**
 * ✅ Hook สำหรับ initialize ระบบติดตามร้านค้า
 * ควรเรียกใช้ที่รูทของแอป (เช่น ใน RootLayout หรือ App)
 */
export function useInitializeFollowShops() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // ✅ โหลด followed shops จาก localStorage
    const followedShops = getFollowedShopsFromStorage();
    if (followedShops.length > 0) {
      dispatch(loadFollowedShops(followedShops));
    }
  }, [dispatch]);
}
