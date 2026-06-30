import { useEffect, useState } from 'react';

interface SellerStats {
  shopId: number;
  shopName: string;
  ownerName: string;
  phone: string;
  bankInfo: {
    bankName: string | null;
    bankAccount: string | null;
    bankHolder: string | null;
  };
  promptpayInfo: {
    type: string | null;
    value: string | null;
  };
  stats: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalShippingFees: number;
    sellerEarnings: number;
  };
  joinedAt: string;
}

interface RecentOrder {
  orderId: string;
  status: string;
  paymentMethod: string;
  shop: {
    shopId: number;
    shopName: string;
    ownerName: string;
    bankInfo: {
      bankName: string | null;
      bankAccount: string | null;
      bankHolder: string | null;
    };
    promptpayInfo: {
      type: string | null;
      value: string | null;
    };
  };
  customer: {
    email: string;
    firstName: string;
    lastName: string;
  };
  delivery: {
    name: string;
    phone: string;
    address: string;
  };
  money: {
    itemsSubtotal: number;
    shippingFee: number;
    total: number;
    sellerEarnings: number;
  };
  items: any[];
  createdAt: string;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'amber' | 'green' | 'red' | 'neutral' }) {
  const cls =
    tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : tone === 'red'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-neutral-200 bg-neutral-50 text-neutral-700';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export function SellerStatsTab() {
  const [sellersList, setSellersList] = useState<SellerStats[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const [sellersRes, ordersRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/sellers/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:5000/api/admin/orders/recent?limit=50', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (sellersRes.ok) {
          const sellersData = await sellersRes.json();
          setSellersList(sellersData.data || []);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setRecentOrders(ordersData.data || []);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">กำลังโหลด...</p>
      </div>
    );
  }

  const totalRevenue = sellersList.reduce((sum, s) => sum + s.stats.totalRevenue, 0);
  const totalShippingFees = sellersList.reduce((sum, s) => sum + s.stats.totalShippingFees, 0);
  const totalSellerEarnings = sellersList.reduce((sum, s) => sum + s.stats.sellerEarnings, 0);

  return (
    <>
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600">จำนวนร้านค้า</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{sellersList.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600">ยอดขายรวม</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600">ค่าส่งรวม</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(totalShippingFees)}</p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600">โอนให้ร้านค้ารวม</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalSellerEarnings)}</p>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-neutral-900">ชื่อร้าน</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-900">เจ้าของ</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-900">ธนาคาร / PromptPay</th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-900">ออเดอร์</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-900">ยอดขาย</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-900">ค่าส่ง</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-900">โอนให้</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sellersList.map((seller) => (
                <tr key={seller.shopId} className="hover:bg-neutral-50 transition">
                  <td className="px-4 py-3 font-medium text-neutral-900">{seller.shopName}</td>
                  <td className="px-4 py-3 text-neutral-600">{seller.ownerName}</td>
                  <td className="px-4 py-3 text-neutral-600 text-xs">
                    {seller.bankInfo?.bankName ? (
                      <div>
                        <div>{seller.bankInfo.bankName}</div>
                        <div className="text-neutral-500">เลขที่: {seller.bankInfo.bankAccount}</div>
                      </div>
                    ) : seller.promptpayInfo?.type ? (
                      <div>
                        <div>PromptPay ({seller.promptpayInfo.type})</div>
                        <div className="text-neutral-500">{seller.promptpayInfo.value}</div>
                      </div>
                    ) : (
                      <span className="text-neutral-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge tone="neutral">{seller.stats.totalOrders}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900">
                    {formatCurrency(seller.stats.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-orange-600">
                    {formatCurrency(seller.stats.totalShippingFees)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">
                    {formatCurrency(seller.stats.sellerEarnings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-neutral-900 mb-4">📋 ออเดอร์ล่าสุด</h2>
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">ออเดอร์</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">ร้านค้า</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">ลูกค้า</th>
                    <th className="px-4 py-3 text-center font-semibold text-neutral-900">สถานะ</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">ยอดขาย</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">ค่าส่ง</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">โอนให้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {recentOrders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-neutral-50 transition">
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {order.orderId.slice(0, 12)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{order.shop.shopName}</td>
                      <td className="px-4 py-3 text-neutral-600 text-xs">
                        <div>{order.delivery.name}</div>
                        <div className="text-neutral-500">{order.customer.email}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          tone={
                            order.status === 'delivered'
                              ? 'green'
                              : order.status === 'cancelled'
                                ? 'red'
                                : 'amber'
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-900">
                        {formatCurrency(order.money.itemsSubtotal)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-orange-600">
                        {formatCurrency(order.money.shippingFee)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">
                        {formatCurrency(order.money.sellerEarnings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SellerStatsTab;
