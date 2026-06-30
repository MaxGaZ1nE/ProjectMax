const LS_SHOP_NAME_KEY   = 'ffy_shop_name_';
const LS_SHOP_AVATAR_KEY = 'ffy_shop_avatar_';

// ── ชื่อร้าน ──────────────────────────────────
export function getShopNameFromStorage(shopId: number, fallback?: string) {
  const key = `${LS_SHOP_NAME_KEY}${Number(shopId)}`;
  const saved = localStorage.getItem(key);
  return (saved && saved.trim()) || fallback || '';
}

export function setShopNameToStorage(shopId: number, shopName: string) {
  const key = `${LS_SHOP_NAME_KEY}${Number(shopId)}`;
  localStorage.setItem(key, String(shopName ?? '').trim());
  // ✅ broadcast ให้หน้าอื่น (shop page) รับรู้การเปลี่ยนแปลงทันที
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: shopName }));
}

// ── รูปร้าน ────────────────────────────────────
export function getShopAvatarFromStorage(shopId: number, fallback?: string) {
  const key = `${LS_SHOP_AVATAR_KEY}${Number(shopId)}`;
  return localStorage.getItem(key) ?? fallback ?? '/shop/shop1.png';
}

export function setShopAvatarToStorage(shopId: number, dataUrl: string) {
  const key = `${LS_SHOP_AVATAR_KEY}${Number(shopId)}`;
  localStorage.setItem(key, dataUrl);
  // ✅ broadcast ให้หน้าอื่น (shop page) รับรู้การเปลี่ยนแปลงทันที
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: dataUrl }));
}