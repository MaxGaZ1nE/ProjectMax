import type { Review } from '@/slices/reviews-slice';

// ✅ mock รีวิวสำหรับสินค้าจำลองเท่านั้น (base)
// ถ้าคุณไม่อยากมี mock เลย ให้ export เป็น [] ได้
const productReviews: Review[] = [
  {
    id: 'mock-1',
    productKey: 'base:1',
    productId: 1,
    orderId: 'mock-order',
    shopId: 1,
    username: 'ลูกค้าตัวอย่าง',
    avatar: '/user/avatar.png',
    rating: 5,
    qualityText: 'สด',
    tasteText: 'หวาน',
    body: 'สินค้าดีมาก ส่งไว',
    createdAt: '2026-04-11',
  },
];

export default productReviews;