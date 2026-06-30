export const LS_SELLER_PRODUCTS_KEY = 'ffy_seller_products_v1';

export type SellerProductStatus = 'draft' | 'active' | 'hidden';

export type SellerProduct = {
  id: string; // string id (nanoid/uuid)
  shopId: number;

  name: string;
  price: number;

  unit: 'kg' | 'g' | 'box';
  weight: number;

  stock: number; // จำนวนคงเหลือ
  status: SellerProductStatus;

  image?: string; // base64/url
  description?: string;

  createdAt: string;
  updatedAt?: string;
};

function makeId() {
  return `SP_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function loadAllProducts(): SellerProduct[] {
  try {
    const raw = localStorage.getItem(LS_SELLER_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SellerProduct[]) : [];
  } catch {
    return [];
  }
}

export function loadProductsByShop(shopId: number): SellerProduct[] {
  return loadAllProducts().filter((p) => Number(p.shopId) === Number(shopId));
}

export function saveAllProducts(items: SellerProduct[]) {
  localStorage.setItem(LS_SELLER_PRODUCTS_KEY, JSON.stringify(items));
}

export function findSellerProductById(id: string): SellerProduct | null {
  const all = loadAllProducts();
  return all.find((p) => p.id === id) ?? null;
}

/* =========================
   ✅ CRUD for seller products
   ========================= */

export function createProduct(input: {
  shopId: number;
  name: string;
  price: number;
  unit: 'kg' | 'g' | 'box';
  weight: number;
  stock: number;
  status?: SellerProductStatus; // default draft
  image?: string;
  description?: string;
}): SellerProduct {
  const now = new Date().toISOString();

  const p: SellerProduct = {
    id: makeId(),
    shopId: Number(input.shopId),
    name: String(input.name ?? '').trim() || 'สินค้าใหม่',
    price: Number(input.price ?? 0),
    unit: input.unit,
    weight: Number(input.weight ?? 0),
    stock: Math.max(0, Number(input.stock ?? 0)),
    status: input.status ?? 'draft',
    image: input.image,
    description: input.description,
    createdAt: now,
    updatedAt: now,
  };

  const all = loadAllProducts();
  all.unshift(p);
  saveAllProducts(all);
  return p;
}

export function updateProduct(
  id: string,
  patch: Partial<Omit<SellerProduct, 'id' | 'createdAt'>>
): SellerProduct | null {
  const all = loadAllProducts();
  const idx = all.findIndex((x) => x.id === id);
  if (idx === -1) return null;

  const next: SellerProduct = {
    ...all[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  // sanitize
  next.name = String(next.name ?? '').trim() || 'สินค้าใหม่';
  next.price = Number(next.price ?? 0);
  next.weight = Number(next.weight ?? 0);
  next.stock = Math.max(0, Number(next.stock ?? 0));
  next.shopId = Number(next.shopId ?? 0);

  all[idx] = next;
  saveAllProducts(all);
  return next;
}

export function deleteProduct(id: string) {
  const all = loadAllProducts();
  const next = all.filter((x) => x.id !== id);
  saveAllProducts(next);
}

export function setProductStatus(id: string, status: SellerProductStatus) {
  return updateProduct(id, { status });
}

export function updateStock(id: string, stock: number) {
  return updateProduct(id, { stock: Math.max(0, Number(stock ?? 0)) });
}

/* =========================
   ✅ Stock helpers for checkout
   ========================= */

export type StockLine = { sellerProductId: string; qty: number };

export type StockCheckResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'not_found' | 'inactive' | 'insufficient';
      sellerProductId: string;
      name?: string;
      available?: number;
      requested?: number;
    };

export function checkSellerStock(lines: StockLine[]): StockCheckResult {
  const all = loadAllProducts();

  for (const ln of lines) {
    const qty = Math.max(0, Number(ln.qty || 0));
    if (!ln.sellerProductId || qty <= 0) continue;

    const p = all.find((x) => x.id === ln.sellerProductId);
    if (!p) {
      return { ok: false, reason: 'not_found', sellerProductId: ln.sellerProductId };
    }

    if ((p.status ?? 'draft') !== 'active') {
      return {
        ok: false,
        reason: 'inactive',
        sellerProductId: ln.sellerProductId,
        name: p.name,
      };
    }

    const available = Number(p.stock ?? 0);
    if (available < qty) {
      return {
        ok: false,
        reason: 'insufficient',
        sellerProductId: ln.sellerProductId,
        name: p.name,
        available,
        requested: qty,
      };
    }
  }

  return { ok: true };
}

export function deductSellerStock(lines: StockLine[]) {
  const all = loadAllProducts();
  const next = all.map((p) => ({ ...p }));

  for (const ln of lines) {
    const qty = Math.max(0, Number(ln.qty || 0));
    if (!ln.sellerProductId || qty <= 0) continue;

    const idx = next.findIndex((x) => x.id === ln.sellerProductId);
    if (idx === -1) continue;

    next[idx].stock = Math.max(0, Number(next[idx].stock ?? 0) - qty);
    next[idx].updatedAt = new Date().toISOString();
  }

  saveAllProducts(next);
}