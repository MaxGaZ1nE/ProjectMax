import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type { CartItem } from '@/slices/cart-slice';
import { logout } from './auth-slice';

export type PaymentMethod = 'promptpay';
export type PaymentStatus = 'none' | 'pending_verification' | 'paid' | 'failed';

export type DeliverySlot = 'morning' | 'afternoon';

export type CheckoutInfo = {
  fullName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: PaymentMethod;

  deliveryDate: string; // YYYY-MM-DD
  deliverySlot: DeliverySlot;

  // PromptPay (optional)
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  paidAt?: string;
  slipBase64?: string;

  // ✅ เพิ่ม: กันตัดสต็อกซ้ำ (สำคัญสำหรับโหมด pay_order ที่แนบสลิปทีหลัง)
  stockDeducted?: boolean;
};

export type OrderItem = CartItem;

export type OrderStatus =
  | 'unpaid'
  | 'pending_payment'
  | 'paid'
  | 'waiting_driver'
  | 'in_delivery'
  | 'delivered'
  | 'completed'
  | 'claim'
  | 'canceled';

export type ClaimStatus = 'requested' | 'approved' | 'rejected' | 'refunded';

export type Claim = {
  status: ClaimStatus;
  reason: string;
  note?: string;

  // ยอดคืนเงิน (ถ้ามี)
  refundAmount?: number;

  // เวลา
  createdAt: string;
  updatedAt: string;

  // เหตุผลที่ปฏิเสธ (ถ้ามี)
  rejectReason?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  deliveredAt?: string; // ✅ เพิ่ม: เวลาส่งสำเร็จ (ใช้ทำรายงานยอดขายตามช่วงเวลา)

  shopId: number;
  shopName: string;
  items: OrderItem[];

  // ✅ เพิ่มยอดแยก
  itemsSubtotal: number; // ยอดรวมสินค้า (ไม่รวมส่ง)
  shippingFee: number; // ค่าส่ง
  grandTotal: number; // ยอดสุทธิ (รวมส่ง)

  checkout: CheckoutInfo;
  status: OrderStatus;

  cancelReason?: string;
  paidAt?: string;

  // ✅ เพิ่ม: เคลม/คืนเงิน
  claim?: Claim;

  // ✅ เพิ่ม: Proof of Delivery (POD)
  signatureImage?: string; // base64 หรือ URL ลายเซ็น
  deliveryPhoto?: string; // URL รูปหลักฐาน
  confirmedAt?: string; // เวลาที่ยืนยันการส่ง
  confirmedBy?: string; // courier_id หรือชื่อ Courier
};

type OrdersState = {
  orders: Order[];
  lastPlacedOrderIds: string[];
};

const initialState: OrdersState = {
  orders: [],
  lastPlacedOrderIds: [],
};

const MAX_ORDERS_TO_KEEP = 50;
const MAX_LAST_PLACED_IDS_TO_KEEP = 10;

const nowIso = () => new Date().toISOString();

export const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    placeOrder: (
      state,
      action: PayloadAction<{
        shopId: number;
        shopName: string;
        items: OrderItem[];
        checkout: CheckoutInfo;

        // ✅ เพิ่มจาก checkout page
        itemsSubtotal: number;
        shippingFee: number;
        grandTotal: number;

        // ✅ Optional: order ID from backend (if not provided, generate locally)
        id?: string;
      }>
    ) => {
      const { shopId, shopName, items, checkout, itemsSubtotal, shippingFee, grandTotal, id } = action.payload;

      // ✅ Only PromptPay is available now, so status is always 'unpaid' until payment is verified
      const initialStatus: OrderStatus = 'unpaid';

      const order: Order = {
        id: id || `ORD_${nanoid(10)}`,
        createdAt: nowIso(),
        deliveredAt: undefined,

        shopId,
        shopName,
        items,

        itemsSubtotal,
        shippingFee,
        grandTotal,

        checkout: {
          ...checkout,
          // ✅ Only PromptPay available, so set paymentStatus based on what was provided
          paymentStatus: checkout.paymentStatus ?? 'pending_verification',

          // ✅ ถ้าเป็น promptpay แล้วแนบสลิปมาแล้ว เราถือว่า "ตัดสต็อกแล้ว" (ให้ส่ง true มาจากหน้า promptpay)
          stockDeducted: checkout.stockDeducted ?? false,
        },
        status: initialStatus,
        claim: undefined,
      };

      state.orders.unshift(order);

      if (state.orders.length > MAX_ORDERS_TO_KEEP) {
        state.orders = state.orders.slice(0, MAX_ORDERS_TO_KEEP);
      }

      state.lastPlacedOrderIds = [
        order.id,
        ...state.lastPlacedOrderIds.filter((id) => id !== order.id),
      ];

      if (state.lastPlacedOrderIds.length > MAX_LAST_PLACED_IDS_TO_KEEP) {
        state.lastPlacedOrderIds = state.lastPlacedOrderIds.slice(0, MAX_LAST_PLACED_IDS_TO_KEEP);
      }
    },

    clearLastPlacedOrders: (state) => {
      state.lastPlacedOrderIds = [];
    },

    // ✅ Clear all orders (for logout)
    clearAllOrders: (state) => {
      state.orders = [];
      state.lastPlacedOrderIds = [];
    },

    submitPromptPaySlip: (
      state,
      action: PayloadAction<{
        orderId: string;
        paidAmount: number;
        paidAt?: string;
        slipBase64: string;

        // ✅ เพิ่ม optional: ถ้าหน้า PromptPay "ตัดสต็อกแล้ว" ค่อยส่ง true มา
        stockDeducted?: boolean;
      }>
    ) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o) return;

      o.checkout.paymentMethod = 'promptpay';
      o.checkout.paymentStatus = 'pending_verification';
      o.checkout.paidAmount = action.payload.paidAmount;
      o.checkout.paidAt = action.payload.paidAt;
      o.checkout.slipBase64 = action.payload.slipBase64;

      // ✅ กันตัดสต็อกซ้ำ
      if (typeof action.payload.stockDeducted === 'boolean') {
        o.checkout.stockDeducted = action.payload.stockDeducted;
      }

      o.status = 'unpaid';
    },

    approvePromptPaySlip: (state, action: PayloadAction<{ orderId: string }>) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o) return;

      o.checkout.paymentMethod = 'promptpay';
      o.checkout.paymentStatus = 'paid';

      const now = nowIso();
      o.paidAt = now;
      o.checkout.paidAt = o.checkout.paidAt ?? now;

      o.status = 'waiting_driver';
    },

    rejectPromptPaySlip: (state, action: PayloadAction<{ orderId: string; reason?: string }>) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o) return;

      o.checkout.paymentMethod = 'promptpay';
      o.checkout.paymentStatus = 'failed';
      o.status = 'unpaid';

      if (action.payload.reason) {
        o.cancelReason = `ปฏิเสธสลิป: ${action.payload.reason}`;
      }
    },

    cancelOrder: (state, action: PayloadAction<{ orderId: string; reason: string }>) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o) return;

      o.status = 'canceled';
      o.cancelReason = action.payload.reason;
    },

    markOrderPaid: (state, action: PayloadAction<{ orderId: string }>) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o) return;

      o.status = 'paid';
      o.paidAt = nowIso();

      o.checkout.paymentStatus = 'paid';
      o.checkout.paidAt = o.paidAt;
    },

    markShipping: (state, action: PayloadAction<{ orderId: string }>) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o) return;
      o.status = 'in_delivery';
    },

    markDelivered: (state, action: PayloadAction<{ orderId: string; deliveredAt?: string }>) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o) return;
      o.status = 'delivered';
      o.deliveredAt = action.payload.deliveredAt ?? nowIso();
    },

    /**
     * ✅ ลูกค้า/แอดมินสร้างคำขอเคลม (เปลี่ยนสถานะออเดอร์เป็น claim)
     */
    requestClaim: (
      state,
      action: PayloadAction<{
        orderId: string;
        reason: string;
        note?: string;
        refundAmount?: number; // ถ้าอยากส่งมาเป็นยอดที่ขอคืน
      }>
    ) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o) return;

      const now = nowIso();
      o.status = 'claim';
      o.claim = {
        status: 'requested',
        reason: action.payload.reason,
        note: action.payload.note,
        refundAmount: typeof action.payload.refundAmount === 'number' ? action.payload.refundAmount : undefined,
        createdAt: now,
        updatedAt: now,
      };
    },

    /**
     * ✅ ผู้ขายอนุมัติเคลม (ยังไม่คืนเงินจริง)
     */
    approveClaim: (
      state,
      action: PayloadAction<{
        orderId: string;
        refundAmount?: number; // กำหนดยอดคืนเงินตอนอนุมัติก็ได้
      }>
    ) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o || !o.claim) return;

      o.claim.status = 'approved';
      if (typeof action.payload.refundAmount === 'number') {
        o.claim.refundAmount = action.payload.refundAmount;
      }
      o.claim.updatedAt = nowIso();
      o.status = 'claim';
    },

    /**
     * ✅ ผู้ขายปฏิเสธเคลม (ออเดอร์กลับไป delivered)
     */
    rejectClaim: (state, action: PayloadAction<{ orderId: string; rejectReason: string }>) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o || !o.claim) return;

      o.claim.status = 'rejected';
      o.claim.rejectReason = action.payload.rejectReason;
      o.claim.updatedAt = nowIso();

      // กลับเป็น delivered เพราะปฏิเสธ
      o.status = 'delivered';
    },

    /**
     * ✅ คืนเงินสำเร็จ (ยอดขายสุทธิจะถูกหักจาก refundAmount)
     */
    markRefunded: (
      state,
      action: PayloadAction<{
        orderId: string;
        refundAmount: number;
      }>
    ) => {
      const o = state.orders.find((x) => x.id === action.payload.orderId);
      if (!o) return;

      const now = nowIso();
      o.status = 'claim';

      if (!o.claim) {
        o.claim = {
          status: 'refunded',
          reason: 'คืนเงิน',
          createdAt: now,
          updatedAt: now,
          refundAmount: action.payload.refundAmount,
        };
        return;
      }

      o.claim.status = 'refunded';
      o.claim.refundAmount = Math.max(0, Number(action.payload.refundAmount) || 0);
      o.claim.updatedAt = now;
    },
  },
  // ✅ เมื่อ logout → ล้าง orders ทั้งหมดทันที
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.orders = [];
      state.lastPlacedOrderIds = [];
    });
  },
});

export const {
  placeOrder,
  clearLastPlacedOrders,
  clearAllOrders,
  submitPromptPaySlip,
  approvePromptPaySlip,
  rejectPromptPaySlip,
  cancelOrder,
  markOrderPaid,
  markShipping,
  markDelivered,

  // ✅ claim/refund
  requestClaim,
  approveClaim,
  rejectClaim,
  markRefunded,
} = orderSlice.actions;

export default orderSlice.reducer;