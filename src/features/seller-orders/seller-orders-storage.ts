/* eslint-disable @typescript-eslint/no-explicit-any */

export const LS_SELLER_ORDERS_KEY = 'ffy_seller_orders_v1';

export type OrderStatus = 'pending' | 'paid' | 'waiting_driver' | 'shipped' | 'completed' | 'cancelled';

export type OrderAddress = {
  fullName: string;
  phone: string;
  address1: string; // บ้านเลขที่, ถนน
  subdistrict?: string;
  district?: string;
  province?: string;
  postcode?: string;
  note?: string;
};

export type OrderItem = {
  sellerProductId: string; // อ้างอิงสินค้าในร้าน
  name: string;
  unit: string;
  price: number;
  qty: number;
  image?: string;
};

export type SellerOrder = {
  id: string;
  shopId: number;

  status: OrderStatus;

  address: OrderAddress;
  items: OrderItem[];

  shippingFee?: number;
  discount?: number;

  paymentMethod?: string;
  slipImage?: string;

  createdAt: string;
  updatedAt?: string;
};

function makeId() {
  return `SO_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function loadAllOrders(): SellerOrder[] {
  try {
    const raw = localStorage.getItem(LS_SELLER_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SellerOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveAllOrders(items: SellerOrder[]) {
  localStorage.setItem(LS_SELLER_ORDERS_KEY, JSON.stringify(items));
}

export function loadOrdersByShop(shopId: number): SellerOrder[] {
  return loadAllOrders()
    .filter((o) => Number(o.shopId) === Number(shopId))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function findOrderById(id: string): SellerOrder | null {
  const all = loadAllOrders();
  return all.find((o) => o.id === id) ?? null;
}

export function createOrder(input: {
  shopId: number;
  address: OrderAddress;
  items: OrderItem[];
  status?: OrderStatus;
  shippingFee?: number;
  discount?: number;
  paymentMethod?: string;
  slipImage?: string;
}): SellerOrder {
  const now = new Date().toISOString();

  const o: SellerOrder = {
    id: makeId(),
    shopId: Number(input.shopId),
    status: input.status ?? 'pending',
    address: input.address,
    items: Array.isArray(input.items) ? input.items : [],
    shippingFee: Number(input.shippingFee ?? 0),
    discount: Number(input.discount ?? 0),
    paymentMethod: input.paymentMethod,
    slipImage: input.slipImage,
    createdAt: now,
    updatedAt: now,
  };

  const all = loadAllOrders();
  all.unshift(o);
  saveAllOrders(all);
  return o;
}

export function updateOrder(
  id: string,
  patch: Partial<Omit<SellerOrder, 'id' | 'createdAt'>>
): SellerOrder | null {
  const all = loadAllOrders();
  const idx = all.findIndex((x) => x.id === id);
  if (idx === -1) return null;

  const next: SellerOrder = {
    ...all[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  next.shopId = Number(next.shopId ?? 0);
  next.shippingFee = Number(next.shippingFee ?? 0);
  next.discount = Number(next.discount ?? 0);

  all[idx] = next;
  saveAllOrders(all);
  return next;
}

export function setOrderStatus(id: string, status: OrderStatus) {
  return updateOrder(id, { status });
}

export function deleteOrder(id: string) {
  const all = loadAllOrders();
  const next = all.filter((x) => x.id !== id);
  saveAllOrders(next);
}

export function calcOrderTotal(order: SellerOrder) {
  const itemsTotal = (order.items ?? []).reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0), 0);
  const shipping = Number(order.shippingFee ?? 0);
  const discount = Number(order.discount ?? 0);
  return Math.max(0, itemsTotal + shipping - discount);
}