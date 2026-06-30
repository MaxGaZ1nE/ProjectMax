import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sellerAPI, shopAPI } from '@services/backend-api';

interface SellerProfile {
  id: number;
  shopName: string;
  ownerName: string;
  phone: string;
  followersCount: number;
  rating: number;
}

interface DashboardStats {
  todayOrders: number;
  pendingPayment: number;
  pendingDelivery: number;
  delivered: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  recentOrders: any[];
}

export default function SellerDashboardPage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Fetch seller profile from Backend
        const profileRes = await sellerAPI.getProfile();
        const profileData = profileRes.data?.data ?? profileRes.data;
        
        // ✅ ป้องกัน profile ไม่มีหรือ id/shopId เป็น 0
        const shopId = profileData?.id || profileData?.shopId || profileData?.shop_id;
        if (!profileData || !shopId) {
          throw new Error('ยังไม่มีร้านค้า กรุณาติดต่อ admin');
        }

        setProfile(profileData);

        // ✅ Fetch all shop orders — backend returns { data: [...] } (NOT nested data.data)
        const ordersRes = await shopAPI.getSellerOrders({ limit: 1000 });
        // Handle both { data: { data: [...] } } and { data: [...] } response formats
        const rawData = ordersRes.data;
        const orders: any[] = Array.isArray(rawData?.data) ? rawData.data
          : Array.isArray(rawData) ? rawData
          : rawData?.orders ?? [];

        console.log('📦 Seller dashboard orders count:', orders.length, 'sample:', orders[0]);

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let todayOrders = 0;
        let pendingPayment = 0;
        let pendingDelivery = 0;
        let delivered = 0;
        let totalRevenue = 0;
        let totalOrders = orders.length;

        orders.forEach((o: any) => {
          const orderDate = new Date(o.createdAt || o.created_at);
          if (orderDate >= today) {
            todayOrders++;
          }

          const st = o.status || '';
          const pm = o.paymentMethod || o.payment_method || '';
          const ps = o.paymentStatus || o.payment_status || '';

          if (st === 'unpaid' || ps === 'pending') {
            pendingPayment++;
          } else if (st === 'to_ship') {
            pendingDelivery++;
          } else if (st === 'completed') {
            delivered++;
            totalRevenue += Number(o.grandTotal || o.grand_total || 0);
          }
        });

        const avgOrderValue = delivered > 0 ? totalRevenue / delivered : 0;
        
        // Sort by date DESC and take top 5
        const recentOrders = [...orders]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setStats({
          todayOrders,
          pendingPayment,
          pendingDelivery,
          delivered,
          totalRevenue,
          totalOrders,
          avgOrderValue,
          recentOrders,
        });
      } catch (err: any) {
        console.error('Seller dashboard fetch error:', err);
        setError(err?.response?.data?.error || err?.message || 'ไม่สามารถโหลดข้อมูลร้านค้าได้');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="animate-pulse text-lg font-medium text-emerald-700">⏳ กำลังโหลดข้อมูลร้านค้า...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-10 bg-neutral-50 min-h-[calc(100vh-120px)]">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="card p-6 text-center">
            <div className="text-xl font-semibold text-red-600">❌ {error || 'ไม่พบข้อมูลร้านค้า'}</div>
            <div className="mt-2 text-sm text-neutral-500">กรุณาสมัครเป็นผู้ขายก่อน</div>
            <div className="mt-4 flex justify-center gap-3">
              <Link className="btn btn-primary" to="/seller/register">
                สมัครเป็นผู้ขาย
              </Link>
              <Link className="btn" to="/profile">
                กลับไปหน้าโปรไฟล์
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 bg-neutral-50 min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="card p-6">
          <div className="text-2xl font-semibold text-neutral-900">Seller Dashboard</div>
          <div className="mt-2 text-sm text-neutral-600">
            ร้านของฉัน: <span className="font-semibold">{profile.shopName}</span> (shopId: {profile.id})
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-600">ออเดอร์วันนี้</div>
              <div className="mt-1 text-2xl font-semibold text-blue-600">
                {stats?.todayOrders ?? '0'}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-600">รอตรวจสลิป</div>
              <div className="mt-1 text-2xl font-semibold text-amber-600">
                {stats?.pendingPayment ?? '0'}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-600">ที่ต้องจัดส่ง</div>
              <div className="mt-1 text-2xl font-semibold text-orange-600">
                {stats?.pendingDelivery ?? '0'}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-600">จัดส่งแล้ว</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-600">
                {stats?.delivered ?? '0'}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-600">ยอดขายรวม</div>
              <div className="mt-1 text-2xl font-semibold text-red-600">
                ฿{stats?.totalRevenue.toLocaleString() ?? '0'}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-600">ออเดอร์ทั้งหมด</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-800">
                {stats?.totalOrders ?? '0'}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:col-span-2">
              <div className="text-sm text-neutral-600">ยอดขายเฉลี่ยต่อออเดอร์</div>
              <div className="mt-1 text-2xl font-semibold text-purple-600">
                ฿{stats?.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '0'}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-lg font-semibold text-neutral-900 mb-4">ออเดอร์ล่าสุด</div>
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">รหัสออเดอร์</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">วันที่</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">สถานะ</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-700">ยอดรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {stats?.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                        ยังไม่มีออเดอร์ล่าสุด
                      </td>
                    </tr>
                  ) : (
                    stats?.recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="px-4 py-3 font-medium text-neutral-900">#{o.id}</td>
                        <td className="px-4 py-3 text-neutral-600">
                          {new Date(o.createdAt).toLocaleString('th-TH')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            o.status === 'waiting_driver' ? 'bg-orange-100 text-orange-700' :
                            o.status === 'unpaid' ? 'bg-amber-100 text-amber-700' :
                            'bg-neutral-100 text-neutral-700'
                          }`}>
                            {o.status === 'unpaid' ? 'รอชำระเงิน' :
                             o.status === 'waiting_driver' ? 'ที่ต้องจัดส่ง' :
                             o.status === 'in_delivery' ? 'กำลังจัดส่ง' :
                             o.status === 'delivered' ? 'จัดส่งแล้ว' : o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-neutral-900">
                          ฿{Number(o.grandTotal).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-right">
              <Link to="/seller/orders" className="text-sm font-medium text-primary-600 hover:underline">
                ดูออเดอร์ทั้งหมด →
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-neutral-200">
            <Link className="btn btn-primary" to="/seller/products">
              จัดการสินค้า
            </Link>
            <Link className="btn border-neutral-300" to="/profile">
              กลับไปหน้าโปรไฟล์ผู้ซื้อ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}