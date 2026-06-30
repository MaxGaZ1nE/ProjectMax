import React from 'react';
import KPICard from '@components/admin/dashboard/KPICard';
import RevenueChart from '@components/admin/dashboard/RevenueChart';
import OrderChart from '@components/admin/dashboard/OrderChart';
import TopSellersTable from '@components/admin/dashboard/TopSellersTable';
import RecentOrdersTable from '@components/admin/dashboard/RecentOrdersTable';
import FinanceSummary from '@components/admin/dashboard/FinanceSummary';

// --- MOCK DATA ---
// อัตรา commission: Seller ถูกหัก 3% | Rider ถูกหัก 3%
// ยอดรวม 125,430 = ค่าสินค้า 116,980 + ค่าส่ง 8,450
// หัก Seller 3% = 3,509  | Seller รับ 97% = 113,471
// หัก Rider  3% =   254  | Rider  รับ 97% = 8,197
// รายได้บริษัท = 3,509 + 254 = 3,763
const KPI_DATA = [
  { title: 'ยอดรายได้รวมวันนี้', value: '฿125,430', change: 12.5, icon: <span className="text-xl">💰</span> },
  { title: 'ต้องโอนให้ Seller (97%)', value: '฿113,471', change: 8.2, icon: <span className="text-xl">🏪</span> },
  { title: 'ต้องโอนให้ Rider (97%)', value: '฿8,197', change: -2.4, icon: <span className="text-xl">🛵</span> },
  { title: 'รายได้บริษัท (GP 3%)', value: '฿3,763', change: 15.3, icon: <span className="text-xl">🏢</span> },
];

const REVENUE_DATA = Array.from({ length: 30 }).map((_, i) => ({
  date: `${i + 1} พ.ค.`,
  revenue: Math.floor(Math.random() * 50000) + 50000,
  commission: Math.floor((Math.floor(Math.random() * 50000) + 50000) * 0.03), // 3% GP
}));

const ORDER_BAR_DATA = Array.from({ length: 7 }).map((_, i) => ({
  day: ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][i],
  orders: Math.floor(Math.random() * 200) + 100,
}));

const ORDER_PIE_DATA = [
  { name: 'รอชำระ', value: 45 },
  { name: 'ชำระแล้ว', value: 120 },
  { name: 'กำลังส่ง', value: 85 },
  { name: 'สำเร็จ', value: 340 },
  { name: 'ยกเลิก', value: 25 },
];

// Seller ถูกหัก 3% → commission = sales * 0.03
const TOP_SELLERS = [
  { id: 'S1', name: 'เจ๊ณี ผลไม้สด', sales: 450000, orders: 1250, commission: Math.round(450000 * 0.03) },
  { id: 'S2', name: 'สวนสมบูรณ์ ทุเรียนพรีเมียม', sales: 380000, orders: 840, commission: Math.round(380000 * 0.03) },
  { id: 'S3', name: 'ผลไม้นำเข้า By แอน', sales: 295000, orders: 920, commission: Math.round(295000 * 0.03) },
  { id: 'S4', name: 'มะม่วงน้ำปลาหวาน ลุงชัย', sales: 185000, orders: 1540, commission: Math.round(185000 * 0.03) },
  { id: 'S5', name: 'Fresh Fruits Market', sales: 150000, orders: 630, commission: Math.round(150000 * 0.03) },
];

// commission = amount * 0.03 (หัก Seller 3%)
const RECENT_ORDERS: any[] = [
  { id: 'ORD-8F29A', buyer: 'สมชาย รักดี', seller: 'เจ๊ณี ผลไม้สด', amount: 1250, commission: Math.round(1250 * 0.03), status: 'completed', time: '10 นาทีที่แล้ว' },
  { id: 'ORD-3C91B', buyer: 'วิภาดา สุขใจ', seller: 'สวนสมบูรณ์', amount: 4500, commission: Math.round(4500 * 0.03), status: 'shipping', time: '25 นาทีที่แล้ว' },
  { id: 'ORD-7D44E', buyer: 'Kittipong T.', seller: 'มะม่วงลุงชัย', amount: 350, commission: Math.round(350 * 0.03), status: 'paid', time: '1 ชั่วโมงที่แล้ว' },
  { id: 'ORD-1A88F', buyer: 'นลินี พันธุทอง', seller: 'ผลไม้นำเข้า By แอน', amount: 2800, commission: Math.round(2800 * 0.03), status: 'pending', time: '2 ชั่วโมงที่แล้ว' },
  { id: 'ORD-9E55C', buyer: 'ธนพล มั่งมี', seller: 'เจ๊ณี ผลไม้สด', amount: 850, commission: Math.round(850 * 0.03), status: 'cancelled', time: '3 ชั่วโมงที่แล้ว' },
];

// pending payout คำนวณจากยอดรวม * 97%
const FINANCE_DATA = {
  pendingSeller: Math.round(345000 * 0.97), // 97% ของค่าสินค้า
  pendingRider: Math.round(28500 * 0.97),   // 97% ของค่าส่ง
  transferredToday: 125400,
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">ภาพรวมระบบ (Admin Dashboard)</h1>
          <p className="text-sm text-neutral-500 mt-1">ข้อมูลสถิติและการเงินของ Fruit For You อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}</p>
        </div>
        <button className="bg-[#1B4332] hover:bg-[#122d21] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
          <span>🔄</span> รีเฟรชข้อมูล
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={REVENUE_DATA} />
        </div>
        <div className="lg:col-span-1">
          <OrderChart barData={ORDER_BAR_DATA} pieData={ORDER_PIE_DATA} />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSellersTable sellers={TOP_SELLERS} />
        <RecentOrdersTable orders={RECENT_ORDERS} />
      </div>

      {/* Finance Summary Row */}
      <div className="grid grid-cols-1">
        <FinanceSummary {...FINANCE_DATA} />
      </div>
    </div>
  );
}
