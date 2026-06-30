export type Product = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string[];
  rating: number;
  reviews: number;
  badge?: string;
  badgeBg?: string;
  categoryId?: string;
  shopId: number;
};


const listProduct: Product[] = [
  {
    id: 1,
    name: 'ลิ้นจี่สด เกรดพรีเมียม',
    originalPrice: 1600,
    price: 1200,
    image: ['/product/lychee.jpg','/product/lychee2.jpg','/product/lychee3.jpg'],
    rating: 4.5,
    reviews: 877,
    badge: '25% OFF',
    badgeBg: 'bg-yellow-300 text-black',
    categoryId: 'popular',
    shopId: 2,
  },
  {
    id: 2,
    name: 'ทุเรียนหมอนทอง คัดสวน',
    originalPrice: 1900,
    price: 1490,
    image: ['/product/durian.jpg','/product/durian2.jpg','/product/durian3.jpg'],
    rating: 5,
    reviews: 738,
    badge: 'BEST DEALS',
    badgeBg: 'bg-blue-500 text-white',
    categoryId: 'popular',
    shopId: 2,
  },
  {
    id: 3,
    name: 'เงาะโรงเรียน สดใหม่',
    originalPrice: 399,
    price: 299,
    image: ['/product/rambutan.jpg'],
    rating: 4,
    reviews: 312,
    badge: 'HOT',
    badgeBg: 'bg-red-500 text-white',
    categoryId: 'popular',
    shopId: 1,
  },
  {
    id: 4,
    name: 'มังคุดคัดเกรด',
    price: 25,
    image: ['/product/mangosteen.jpg','/product/mangosteen2.jpg','/product/mangosteen3.jpg'],
    rating: 4.5,
    reviews: 120,
    categoryId: 'seasonal',
    shopId: 3,
  },

  {
    id: 5,
    name: 'แตงโมสด (คัดเกรด) แตงโมหวานฉ่ำ',
    originalPrice: 1600,
    price: 1200,
    image: ['/product/watermelon.jpg'],
    rating: 4.0,
    reviews: 877,
    badge: '25% OFF',
    badgeBg: 'bg-yellow-300 text-black',
    categoryId: 'popular',
    shopId: 4,
  },
  {
    id: 6,
    name: 'มะม่วงสีทอง พันธุ์ใหญ่',
    originalPrice: 1600,
    price: 1200,
    image: ['/product/mango.jpg'],
    rating: 4.0,
    reviews: 877,
    badge: '25% OFF',
    badgeBg: 'bg-yellow-300 text-black',
    categoryId: 'seasonal',
    shopId: 5,
  },
  {
    id: 7,
    name: 'ส้มแมนดาริน ออสเตรเลีย',
    originalPrice: 450,
    price: 390,
    image: ['/product/org.jpg','/product/org2.jpg','/product/org3.jpg'],
    rating: 4.5,
    reviews: 91,
    badge: 'BEST DEALS',
    badgeBg: 'bg-blue-500 text-white',
    categoryId: 'imported',
    shopId: 3,
  },
  {
    id: 8,
    name: 'สตรอเบอร์รี่เกาหลี',
    originalPrice: 800,
    price: 550,
    image: ['/product/strawberry.jpg'],
    rating: 4.8,
    reviews: 420,
    badge: 'NEW',
    badgeBg: 'bg-green-500 text-white',
    categoryId: 'imported',
    shopId: 2,
  },
  {
    id: 9,
    name: 'มะละกอฮอลแลนด์',
    price: 65,
    image: ['/product/papaya.jpg'],
    rating: 4.2,
    reviews: 50,
    categoryId: 'seasonal',
    shopId: 4,
  },
  {
    id: 10,
    name: 'กล้วยหอมทอง คัดพิเศษ',
    originalPrice: 120,
    price: 89,
    image: ['/product/banana.jpg'],
    rating: 4.7,
    reviews: 211,
    categoryId: 'popular',
    shopId: 1,
  },
  {
    id: 11,
    name: 'องุ่นไร้เมล็ด อเมริกา',
    originalPrice: 950,
    price: 790,
    image: ['/product/grape.jpg'],
    rating: 4.9,
    reviews: 1045,
    badge: 'BEST SELLER',
    badgeBg: 'bg-red-500 text-white',
    categoryId: 'imported',
    shopId: 3,
  },
];

export default listProduct;
