import { useAppDispatch } from '@stores/index';
import { pushNotification } from '@/slices/notification-slice';
import { addNotificationForShop } from '@/slices/follow-shop-slice';
import { addShopNotificationToStorage } from '@/utils/followShopStorage';

/**
 * ✅ Hook สำหรับส่งแจ้งเตือนให้ผู้ติดตามเมื่อมีสินค้าใหม่หรือเพิ่มสต็อก
 */
export function useSellerNotifications() {
  const dispatch = useAppDispatch();

  /**
   * ✅ ส่งแจ้งเตือนเมื่อมีสินค้าใหม่
   */
  const notifyNewProduct = (shopId: number, shopName: string, productName: string, price: number) => {
    dispatch(
      addNotificationForShop({
        shopId,
        shopName,
        type: 'new_product',
        message: `${productName} - ฿${price}`,
      })
    );

    dispatch(
      pushNotification({
        type: 'system',
        title: `🆕 ${shopName} มีสินค้าใหม่`,
        message: `${productName} - ฿${price.toLocaleString()} บาท`,
        link: { to: `/shop/${shopId}` },
      })
    );

    addShopNotificationToStorage(shopId);
  };

  /**
   * ✅ ส่งแจ้งเตือนเมื่อเพิ่มสต็อก
   */
  const notifyStockAdded = (
    shopId: number,
    shopName: string,
    productName: string,
    addedStock: number
  ) => {
    dispatch(
      addNotificationForShop({
        shopId,
        shopName,
        type: 'stock_added',
        message: `${productName} เพิ่มสต็อก ${addedStock} หน่วย`,
      })
    );

    dispatch(
      pushNotification({
        type: 'system',
        title: `📦 ${shopName} เพิ่มสต็อก`,
        message: `${productName} เพิ่มสต็อก ${addedStock} หน่วย`,
        link: { to: `/shop/${shopId}` },
      })
    );

    addShopNotificationToStorage(shopId);
  };

  return {
    notifyNewProduct,
    notifyStockAdded,
  };
}
