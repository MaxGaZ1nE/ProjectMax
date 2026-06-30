export type Shop = {
  id: number;
  name: string;
  avatar: string;
  score: number;
  products: number;
  followers: number;
  activeText: string;
};

const shops: Shop[] = [
  {
    id: 1,
    name: 'ชาวสวนทุ่งร้อยใจ',
    avatar: '/shop-pofiles/shop1.jpg',
    score: 10,
    products: 9,
    followers: 58,
    activeText: '6 เดือน ที่ผ่านมา',
  },
  {
    id: 2,
    name: 'สวนผลไม้บ้านริมคลอง',
    avatar: '/shop-pofiles/shop2.jpg',
    score: 9,
    products: 24,
    followers: 312,
    activeText: '2 เดือน ที่ผ่านมา',
  },
  {
    id: 3,
    name: 'Fruit For You Official',
    avatar: '/shop-pofiles/shop3.jpg',
    score: 10,
    products: 120,
    followers: 1820,
    activeText: '1 สัปดาห์ ที่ผ่านมา',
  },
  {
    id: 4,
    name: 'สวนปันสุขออร์แกนิก',
    avatar: '/shop-pofiles/shop4.jpg',
    score: 8,
    products: 41,
    followers: 640,
    activeText: '3 เดือน ที่ผ่านมา',
  },
  {
    id: 5,
    name: 'ตลาดผลไม้คัดเกรด',
    avatar: '/shop-pofiles/shop5.jpg',
    score: 9,
    products: 77,
    followers: 945,
    activeText: '3 วัน ที่ผ่านมา',
  },
];

export default shops;

// lookup map
export const shopById: Record<number, Shop> = Object.fromEntries(shops.map((s) => [s.id, s]));