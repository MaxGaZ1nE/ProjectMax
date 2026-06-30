import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PaymentMethod } from '@/slices/order-slice';

export type CheckoutDraft = {
  fullName: string;
  phone: string;
  address: string;
  note: string;
  paymentMethod: PaymentMethod;
};

type CheckoutState = {
  draft: CheckoutDraft;
};

const initialState: CheckoutState = {
  draft: {
    fullName: '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'promptpay',
  },
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setCheckoutDraft: (state, action: PayloadAction<CheckoutDraft>) => {
      state.draft = action.payload;
    },
    clearCheckoutDraft: (state) => {
      state.draft = initialState.draft;
    },
  },
});

export const { setCheckoutDraft, clearCheckoutDraft } = checkoutSlice.actions;
export default checkoutSlice.reducer;