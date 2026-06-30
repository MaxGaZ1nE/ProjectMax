import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

export type Review = {
  id: string;

  // ✅ คีย์หลัก ใช้ผูกรีวิวกับสินค้าแบบไม่ชนกัน
  // รูปแบบแนะนำ:
  // - base:123
  // - seller:SELLER_PRODUCT_ID
  productKey: string;

  // (optional) เก็บไว้เพื่อใช้งานอื่น ๆ ได้ แต่ไม่ใช้เป็นตัวผูกหลักแล้ว
  productId?: number;

  orderId: string;
  shopId: number;

  username: string;
  avatar: string;

  rating: number;
  qualityText?: string;
  tasteText?: string;
  body: string;
  image?: string;
  variantText?: string;

  createdAt: string;
};

type ReviewsState = {
  reviews: Review[];

  // ✅ กันรีวิวซ้ำต่อ "ออเดอร์ + สินค้าตัวนั้นจริง ๆ"
  // key: `${orderId}_${productKey}`
  reviewed: string[];
};

const initialState: ReviewsState = {
  reviews: [],
  reviewed: [],
};

type SubmitReviewPayload = Omit<Review, 'id' | 'createdAt'>;

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    submitReview: (state, action: PayloadAction<SubmitReviewPayload>) => {
      const key = `${action.payload.orderId}_${action.payload.productKey}`;
      if (state.reviewed.includes(key)) return;

      state.reviews.unshift({
        ...action.payload,
        id: nanoid(10),
        createdAt: new Date().toLocaleString('th-TH'),
      });

      state.reviewed.push(key);
    },

    // เผื่ออยากมีปุ่มล้างรีวิวในอนาคต
    clearAllReviews: (state) => {
      state.reviews = [];
      state.reviewed = [];
    },
  },
});

export const { submitReview, clearAllReviews } = reviewsSlice.actions;
export default reviewsSlice.reducer;