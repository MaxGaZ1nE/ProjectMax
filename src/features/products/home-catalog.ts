import listProduct, { type Product } from '@/mockItem/listProduct';
import { loadAllProducts } from '@/features/seller-products/seller-products-storage';

// ✅ ใช้ hash เหมือนกันกับ ProductDetail — ห้ามเปลี่ยน algorithm
function hashToNumber(str: string) {
  let num = 0;
  for (let i = 0; i < str.length; i++) num = (num * 31 + str.charCodeAt(i)) >>> 0;
  return Number(num % 1000000000);
}

function sellerToHomeProduct(p: any): Product {
  const idNum = hashToNumber(String(p.id)); // ✅ ต้องเป็น number hash เหมือน ProductDetail
  const img = (p.image && String(p.image).trim()) ? String(p.image).trim() : '/no-image.png';
  const imageArr = Array.isArray(p.image) ? p.image : [img];

  return {
    id: idNum,                              // ✅ number เพื่อให้ /details/:id match ได้
    name: p.name ?? 'สินค้าใหม่',
    image: imageArr,
    price: Number(p.price ?? 0),
    rating: 0,
    reviews: 0,
    originalPrice: undefined,
    categoryId: 'popular',
    badge: `ร้าน ${p.shopId}`,
    badgeBg: 'bg-emerald-600 text-white',
  } as unknown as Product;
}

export function getHomeProducts(): Product[] {
  const base = (listProduct ?? []) as Product[];

  // ✅ กรองเฉพาะ active เท่านั้น
  const sellerProducts = loadAllProducts().filter((p) => p.status === 'active');
  const sellerAsHome = sellerProducts.map(sellerToHomeProduct);

  // ✅ กัน id ชนกับ mock: ถ้า hash ชน mock จะถูกข้าม → เพิ่ม seller ก่อน mock แทน
  const map = new Map<number, Product>();

  // seller ก่อน (priority สูงกว่า)
  for (const s of sellerAsHome) {
    map.set(Number((s as any).id), s);
  }
  // mock ทีหลัง (ถ้า id ไม่ชนกัน)
  for (const b of base) {
    if (!map.has(Number((b as any).id))) {
      map.set(Number((b as any).id), b);
    }
  }

  return Array.from(map.values());
}