export type ProductDetail = {
  productId: number;
  shopId: number; // ✅ เพิ่ม: ผูกสินค้ากับร้าน
  sku: string;
  stockText: string;
  fruitType: string;
  originCountry: string;
  shelfLife: string;
  weightText: string;
  shipFrom: string;
  description: string;
  weightDefault?: string;

  // เผื่อใช้โชว์รูปใน dropdown/search
  image?: string;
};

const productDetails: ProductDetail[] = [
  {
    productId: 2,
    shopId: 1,
    sku: 'A:264672',
    stockText: 'สินค้าพร้อมส่ง',
    fruitType: 'ทุเรียน',
    originCountry: 'ไทย',
    shelfLife: '1 เดือน',
    weightText: '100 kg',
    shipFrom: 'จังหวัดนครศรีธรรมราช',
    description: `ทุเรียนหมอนทองสดจากสวน ราคาชาวสวน ไม่ผ่านคนกลาง
หอมหวาน เนื้อแน่น คัดเกรดทุกลูก
ไม่ใช้สารเร่ง ไม่ใช้ยาฆ่าแมลง
ส่งตรงถึงมือลูกค้า`,
  },
  {
    productId: 1,
    shopId: 1,
    sku: 'A:264671',
    stockText: 'สินค้าพร้อมส่ง',
    fruitType: 'ลิ้นจี่',
    originCountry: 'ไทย',
    shelfLife: '2 สัปดาห์',
    weightText: '1 kg',
    shipFrom: 'จังหวัดเชียงใหม่',
    description: 'ลิ้นจี่สดหวานหอม คัดเกรดพรีเมียมจากสวน',
  },
  {
    productId: 3,
    shopId: 1,
    sku: 'A:345231',
    stockText: 'สินค้าพร้อมส่ง',
    fruitType: 'เงาะ',
    originCountry: 'ไทย',
    shelfLife: '2 สัปดาห์',
    weightText: '1 kg',
    shipFrom: 'จังหวัดเชียงใหม่',
    description: 'เงาะสดหวานหอม คัดเกรดพรีเมียมจากสวน',
  },
  {
    productId: 4,
    shopId: 1,
    sku: 'A:234123',
    stockText: 'สินค้าพร้อมส่ง',
    fruitType: 'มังคุด',
    originCountry: 'ไทย',
    shelfLife: '1 สัปดาห์',
    weightText: '5 kg',
    shipFrom: 'จังหวัดเชียงราย',
    description: 'มังคุดสด คัดเกรดพรีเมียมจากสวน',
  },
  {
    productId: 5,
    shopId: 1,
    sku: 'A:123444',
    stockText: 'สินค้าพร้อมส่ง',
    fruitType: 'แตงโม',
    originCountry: 'ไทย',
    shelfLife: '2 สัปดาห์',
    weightText: '1 kg',
    shipFrom: 'จังหวัดนครปฐม',
    description: 'แตงโมสด หวานฉ่ำ จากสวน',
  },
  {
    productId: 6,
    shopId: 1,
    sku: 'A:423122',
    stockText: 'สินค้าพร้อมส่ง',
    fruitType: 'มะม่วง',
    originCountry: 'ไทย',
    shelfLife: '2 สัปดาห์',
    weightText: '1 kg',
    shipFrom: 'จังหวัดหนองบัวลำภู',
    description: 'มะม่วงสด หวานฉ่ำ จากสวน',
  },
  {
    productId: 7,
    shopId: 1,
    sku: 'AA:93122',
    stockText: 'สินค้าพรีออเดอร์',
    fruitType: 'ส้มแมนดาริน นำเข้าจากต่างประเทศ',
    originCountry: 'ไทย',
    shelfLife: '3 สัปดาห์',
    weightText: '100 kg',
    shipFrom: 'ออสเตรเลีย',
    description: 'ส้มแมนดาริน นำเข้าจากประเทศออสเตรเลียหวานฉ่ำ',
  },
];

export default productDetails;

export const productDetailByProductId: Record<number, ProductDetail> = Object.fromEntries(
  productDetails.map((d) => [d.productId, d])
);