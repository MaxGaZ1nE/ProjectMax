import type { FollowedShop } from '@/slices/follow-shop-slice';

const LS_FOLLOWED_SHOPS_KEY = 'ffy_followed_shops_v1';

/**
 * ✅ โหลด followed shops จาก localStorage
 */
export function getFollowedShopsFromStorage(): FollowedShop[] {
  try {
    const data = localStorage.getItem(LS_FOLLOWED_SHOPS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse followed shops from storage:', e);
    return [];
  }
}

/**
 * ✅ บันทึก followed shops ลง localStorage
 */
export function saveFollowedShopsToStorage(shops: FollowedShop[]) {
  try {
    localStorage.setItem(LS_FOLLOWED_SHOPS_KEY, JSON.stringify(shops));
    // ✅ broadcast ให้หน้าอื่นรับรู้
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: LS_FOLLOWED_SHOPS_KEY,
        newValue: JSON.stringify(shops),
      })
    );
  } catch (e) {
    console.error('Failed to save followed shops to storage:', e);
  }
}

/**
 * ✅ เพิ่มร้านค้าที่ติดตาม
 */
export function addFollowedShopToStorage(shop: FollowedShop) {
  const shops = getFollowedShopsFromStorage();
  const exists = shops.find((s) => s.shopId === shop.shopId);
  
  if (!exists) {
    shops.push(shop);
    saveFollowedShopsToStorage(shops);
  }
}

/**
 * ✅ ลบร้านค้าที่ติดตาม
 */
export function removeFollowedShopFromStorage(shopId: number) {
  const shops = getFollowedShopsFromStorage();
  const filtered = shops.filter((s) => s.shopId !== shopId);
  saveFollowedShopsToStorage(filtered);
}

/**
 * ✅ ตรวจสอบว่ากำลังติดตามร้านค้าหรือไม่
 */
export function isFollowingShop(shopId: number): boolean {
  const shops = getFollowedShopsFromStorage();
  return shops.some((s) => s.shopId === shopId);
}

/**
 * ✅ เพิ่มการแจ้งเตือนให้ร้านค้า
 */
export function addShopNotificationToStorage(
  shopId: number
) {
  const shops = getFollowedShopsFromStorage();
  const shop = shops.find((s) => s.shopId === shopId);
  
  if (shop) {
    shop.lastNotificationAt = new Date().toISOString();
    shop.notificationCount = (shop.notificationCount ?? 0) + 1;
    saveFollowedShopsToStorage(shops);
  }
}
