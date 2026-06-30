import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { addNotificationForShop } from '@/slices/follow-shop-slice';
import { pushNotification } from '@/slices/notification-slice';
import { addShopNotificationToStorage } from '@/utils/followShopStorage';
import { loadAllProducts, type SellerProduct } from '@/features/seller-products/seller-products-storage';

/**
 * ✅ Hook สำหรับเฝ้าระวังการเปลี่ยนแปลงสินค้าของ shop ที่ติดตาม
 * เมื่อมีสินค้าใหม่หรือเพิ่มสต็อก จะส่งการแจ้งเตือน
 */
export function useFollowShopNotifications() {
  const dispatch = useAppDispatch();
  const followedShopsFromStore = useAppSelector((s) => s.followShops?.shops);

  const checkNewProducts = useCallback(() => {
    if (!followedShopsFromStore || followedShopsFromStore.length === 0) return;

    // ✅ โหลดสินค้าทั้งหมด
    const allProducts = loadAllProducts();

    // ✅ ตรวจสอบแต่ละร้านที่ติดตาม
    for (const shop of followedShopsFromStore) {
      const shopProducts = allProducts.filter((p: SellerProduct) => p.shopId === shop.shopId);

      if (shopProducts.length > 0) {
        // ✅ เฝ้าระวังสินค้าใหม่ (ตรวจวันที่สร้าง)
        shopProducts.forEach((product: SellerProduct) => {
          const lastNotified = new Date(shop.lastNotificationAt);
          const productCreated = new Date(product.createdAt);

          // ถ้าสินค้าถูกสร้างหลังจากการแจ้งเตือนล่าสุด
          if (productCreated > lastNotified) {
            dispatch(
              addNotificationForShop({
                shopId: shop.shopId,
                shopName: shop.shopName,
                type: 'new_product',
                message: `${product.name} - ฿${product.price}`,
              })
            );

            dispatch(
              pushNotification({
                type: 'system',
                title: `${shop.shopName} มีสินค้าใหม่`,
                message: `${product.name} - ฿${product.price}`,
                link: { to: '/shop/' + shop.shopId },
              })
            );

            addShopNotificationToStorage(shop.shopId);
          }
        });
      }
    }
  }, [followedShopsFromStore, dispatch]);

  // ✅ ตรวจสอบทุกครั้ง 30 วินาที
  useEffect(() => {
    const interval = setInterval(checkNewProducts, 30000);
    return () => clearInterval(interval);
  }, [checkNewProducts]);

  return {
    checkNewProducts,
  };
}

/**
 * ✅ Hook สำหรับจัดการการแจ้งเตือนร้านค้า
 */
export function useShopFollowManager() {
  const followedShopsFromStore = useAppSelector((s) => s.followShops?.shops);
  const followedShops = useMemo(() => followedShopsFromStore ?? [], [followedShopsFromStore]);

  const getFollowedShopsWithNotifications = useCallback(() => {
    return followedShops.slice().sort((a, b) => {
      // ✅ ร้านที่มีการแจ้งเตือนมากขึ้นมาก่อน
      if (b.notificationCount !== a.notificationCount) {
        return b.notificationCount - a.notificationCount;
      }
      // ✅ ถ้าเท่ากัน เรียงตามเวลาแจ้งเตือนล่าสุด
      return new Date(b.lastNotificationAt).getTime() - new Date(a.lastNotificationAt).getTime();
    });
  }, [followedShops]);

  return {
    followedShops: followedShops,
    totalFollowedShops: followedShops.length,
    totalNotifications: followedShops.reduce(
      (sum, shop) => sum + shop.notificationCount,
      0
    ),
    getFollowedShopsWithNotifications,
  };
}
