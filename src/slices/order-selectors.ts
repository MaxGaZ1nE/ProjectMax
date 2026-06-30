import type { RootState } from '@/stores';
import type { Order } from '@/slices/order-slice';

export const selectAllOrders = (state: RootState): Order[] => state.orders.orders;

export const selectLastPlacedOrders = (state: RootState): Order[] => {
  const orders = state.orders.orders;
  const ids = state.orders.lastPlacedOrderIds;

  if (ids.length === 0) return [];

  const map = new Map<string, Order>();
  for (const o of orders) map.set(o.id, o);

  const result: Order[] = [];
  for (const id of ids) {
    const order = map.get(id);
    if (order) result.push(order);
  }

  return result;
};