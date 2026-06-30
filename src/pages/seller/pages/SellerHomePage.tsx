import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { Link } from 'react-router-dom';
import { fetchSellerOrders, updateShopName } from '@/slices/seller-slice';
import {
  getShopNameFromStorage, setShopNameToStorage,
  getShopAvatarFromStorage, setShopAvatarToStorage,
} from '@/utils/shopStorage';

interface Order {
  id: string; shopId: number; status: string; createdAt: string;
  checkout?: { customer_name?: string; fullName?: string; paymentStatus?: string };
  paymentStatus?: string; grandTotal?: number | string; grand_total?: number | string;
}
interface Seller {
  shopId: number; shopName: string; followersCount?: number; rating?: number; isSeller?: boolean;
}
interface RootState { seller: { profile: Seller | null }; orders: { orders: Order[] } }

/* ── Style tokens ── */
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 14, padding: '20px 24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
};
const labelSt: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#374151' };
const numSt: React.CSSProperties = { fontSize: 32, fontWeight: 800, color: '#111827', marginTop: 4 };
const headingSt: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#111827' };
const subLabelSt: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#6b7280' };

/* ── Icon boxes: solid vivid colored squares with emoji ── */
const iconBoxData = [
  { bg: '#bbf7d0', emoji: '📋' },
  { bg: '#fed7aa', emoji: '⏳' },
  { bg: '#fecdd3', emoji: '🎁' },
  { bg: '#bfdbfe', emoji: '✈️' },
];

const summaryIconData = [
  { bg: '#dcfce7', emoji: '💰' },
  { bg: '#dbeafe', emoji: '📦' },
  { bg: '#f3e8ff', emoji: '📊' },
];

function IconBox({ bg, emoji, size = 48 }: { bg: string; emoji: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 12, backgroundColor: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, flexShrink: 0,
    }}>
      {emoji}
    </div>
  );
}

export default function SellerHomePage() {
  const dispatch = useAppDispatch();
  const seller = useAppSelector((s: RootState) => s.seller.profile);
  const orders = useAppSelector((s: any) => s.seller?.orders ?? []);
  const shopId = seller?.shopId ?? 0;

  const [avatar, setAvatar] = useState<string>(() =>
    seller?.shopAvatar || getShopAvatarFromStorage(shopId, '/shop/shop1.png')
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [shopNameDraft, setShopNameDraft] = useState<string>(() =>
    seller?.shopId ? getShopNameFromStorage(seller.shopId, seller?.shopName ?? 'ร้านของฉัน') : seller?.shopName ?? 'ร้านของฉัน'
  );
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!seller) return;

    const savedName = getShopNameFromStorage(seller.shopId ?? 0);
    if (seller.shopName && seller.shopName !== savedName) {
      setShopNameToStorage(seller.shopId, seller.shopName);
      setShopNameDraft(seller.shopName);
    } else if (savedName && savedName !== seller.shopName) {
      dispatch(updateShopName({ shopName: savedName }));
      setShopNameDraft(savedName);
    }

    if (seller.shopAvatar) {
      setAvatar(seller.shopAvatar);
      setShopAvatarToStorage(seller.shopId, seller.shopAvatar);
    }
  }, [dispatch, seller]);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const r = reader.result as string; setAvatar(r); setShopAvatarToStorage(shopId, r); };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!seller) return;
    dispatch(fetchSellerOrders());
  }, [dispatch, seller?.shopId]);

  const myOrders = useMemo(() => {
    if (!seller) return [];
    if (orders.length === 0) return [];

    const hasShopId = orders.some((o: any) => o?.shopId != null);
    if (hasShopId) {
      return orders.filter((o: any) => Number(o.shopId) === Number(seller.shopId));
    }

    return orders;
  }, [orders, seller]);

  const stats = useMemo(() => {
    const todayOrders = myOrders.filter((o) => {
      const created = new Date(o.createdAt || '');
      return created.toDateString() === new Date().toDateString();
    }).length;

    const pendingPayment = myOrders.filter((o) => {
      const status = String(o.status ?? '').toLowerCase();
      const paymentStatus = String(o.checkout?.paymentStatus ?? o.paymentStatus ?? '').toLowerCase();
      return (
        status === 'pending_payment' ||
        status === 'pending' ||
        status === 'unpaid' ||
        paymentStatus === 'pending'
      );
    }).length;

    const pendingDelivery = myOrders.filter((o) => {
      const status = String(o.status ?? '').toLowerCase();
      return status === 'confirmed' || status === 'paid' || status === 'waiting_driver';
    }).length;

    const deliveredCount = myOrders.filter((o) => {
      const status = String(o.status ?? '').toLowerCase();
      return status === 'delivered' || status === 'completed';
    }).length;

    const revenueOrders = myOrders.filter((o) => {
      const status = String(o.status ?? '').toLowerCase();
      const paymentStatus = String(o.checkout?.paymentStatus ?? o.paymentStatus ?? '').toLowerCase();
      return (
        status === 'paid' ||
        status === 'waiting_driver' ||
        status === 'picking_up' ||
        status === 'in_delivery' ||
        status === 'delivered' ||
        status === 'completed' ||
        paymentStatus === 'verified'
      );
    });

    const totalRevenue = revenueOrders.reduce(
      (sum, o) => sum + Number(o.totalPrice ?? o.grandTotal ?? o.grand_total ?? 0),
      0
    );
    const completedCount = myOrders.filter((o) => String(o.status ?? '').toLowerCase() === 'completed').length;
    const avgOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0;

    return {
      todayOrders,
      pendingPayment,
      pendingDelivery,
      deliveredCount,
      totalRevenue,
      totalOrders: myOrders.length,
      avgOrderValue,
      completedCount,
    };
  }, [myOrders]);

  const saveShopName = () => {
    const next = String(shopNameDraft ?? '').trim(); if (!next) return;
    dispatch(updateShopName({ shopName: next }));
    setShopNameToStorage(seller?.shopId ?? 0, next);
    setIsEditingName(false);
  };

  const metricItems = [
    { label: 'ออเดอร์วันนี้', value: stats.todayOrders, link: '/seller/orders', warn: false },
    { label: 'รอตรวจสลิป', value: stats.pendingPayment, link: '/seller/orders/pending', warn: stats.pendingPayment > 0 },
    { label: 'ที่ต้องจัดส่ง', value: stats.pendingDelivery, link: '/seller/orders/to-ship', warn: stats.pendingDelivery > 0 },
    { label: 'จัดส่งแล้ว', value: stats.deliveredCount, link: '/seller/orders', warn: false },
  ];

  const statusMap: Record<string, { label: string; bg: string; fg: string }> = {
    delivered: { label: '✓ เสร็จสิ้น', bg: '#dcfce7', fg: '#166534' },
    waiting_driver: { label: '📦 รอจัดส่ง', bg: '#dbeafe', fg: '#1e40af' },
    in_delivery: { label: '✈️ จัดส่งแล้ว', bg: '#f3e8ff', fg: '#6b21a8' },
    unpaid: { label: '⏳ รอชำระ', bg: '#fef3c7', fg: '#92400e' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── SHOP PROFILE CARD ── */}
      <div style={card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={avatar} alt="shop" style={{
              width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
              border: '4px solid #1a4d3a', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }} />
            <button onClick={() => fileRef.current?.click()} style={{
              position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
              borderRadius: '50%', backgroundColor: '#1a4d3a', color: '#fff',
              border: '2px solid #fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, cursor: 'pointer',
            }} title="เปลี่ยนรูป">📷</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {!isEditingName ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
                    {seller?.shopName ?? 'ร้านของฉัน'}
                  </h1>
                  <button onClick={() => { setShopNameDraft(seller?.shopName ?? ''); setIsEditingName(true); }}
                    style={{ padding: '4px 12px', fontSize: 13, fontWeight: 600, backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, color: '#374151', cursor: 'pointer' }}>
                    ✏️ แก้ไข
                  </button>
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  <span>shopId: <strong style={{ color: '#111827' }}>{shopId}</strong></span>
                  <span>ผู้ติดตาม: <strong style={{ color: '#111827' }}>{seller?.followersCount ?? 0}</strong></span>
                  <span>คะแนน: <strong style={{ color: '#111827' }}>{seller?.rating ? `${seller.rating.toFixed(1)} ⭐` : 'ยังไม่มี'}</strong></span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>ชื่อร้านค้า</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input value={shopNameDraft} onChange={(e) => setShopNameDraft(e.target.value)} autoFocus
                    placeholder="เช่น ร้านผลไม้สดใหม่"
                    style={{ flex: 1, minWidth: 200, padding: '8px 14px', fontSize: 14, fontWeight: 500, borderRadius: 8, border: '1px solid #d1d5db', outline: 'none', color: '#111827' }} />
                  <button onClick={saveShopName} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, borderRadius: 8, backgroundColor: '#1a4d3a', color: '#fff', border: 'none', cursor: 'pointer' }}>✓ บันทึก</button>
                  <button onClick={() => { setShopNameDraft(seller?.shopName ?? ''); setIsEditingName(false); }} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, borderRadius: 8, backgroundColor: '#e5e7eb', color: '#374151', border: 'none', cursor: 'pointer' }}>✕ ยกเลิก</button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/seller/products" style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8,
              backgroundColor: '#1a4d3a', color: '#fff', textDecoration: 'none', textAlign: 'center',
            }}>+ เพิ่มสินค้า</Link>
            <Link to="/seller/orders" style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8,
              backgroundColor: '#fff', color: '#1a4d3a', border: '2px solid #1a4d3a',
              textDecoration: 'none', textAlign: 'center',
            }}>ดูออเดอร์</Link>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS (4-column) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {metricItems.map((m, i) => (
          <Link key={m.label} to={m.link} style={{ ...card, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={labelSt}>{m.label}</div>
              <div style={numSt}>{m.value}</div>
              {m.warn && (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#d97706', backgroundColor: '#fef3c7', padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>
                  ต้องดำเนินการ
                </div>
              )}
            </div>
            <IconBox bg={iconBoxData[i].bg} emoji={iconBoxData[i].emoji} />
          </Link>
        ))}
      </div>

      {/* ── SUMMARY STATS (3-column) with icons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={labelSt}>ยอดขายรวม</div>
            <div style={{ ...numSt, color: '#1a7a3a' }}>฿{(stats.totalRevenue || 0).toLocaleString('th-TH')}</div>
            <div style={{ ...subLabelSt, marginTop: 4 }}>จากออเดอร์ที่ชำระแล้ว</div>
          </div>
          <IconBox bg={summaryIconData[0].bg} emoji={summaryIconData[0].emoji} size={52} />
        </div>
        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={labelSt}>ออเดอร์ทั้งหมด</div>
            <div style={numSt}>{myOrders.length}</div>
            <div style={{ ...subLabelSt, marginTop: 4 }}>คำสั่งซื้อ</div>
          </div>
          <IconBox bg={summaryIconData[1].bg} emoji={summaryIconData[1].emoji} size={52} />
        </div>
        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={labelSt}>เฉลี่ยต่อออเดอร์</div>
            <div style={numSt}>
              {stats.completedCount > 0 ? `฿${stats.avgOrderValue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}` : '-'}
            </div>
            <div style={{ ...subLabelSt, marginTop: 4 }}>ค่าเฉลี่ยจากคำสั่งซื้อที่สำเร็จ</div>
          </div>
          <IconBox bg={summaryIconData[2].bg} emoji={summaryIconData[2].emoji} size={52} />
        </div>
      </div>

      {/* ── RECENT ORDERS ── */}
      <div style={card}>
        <h2 style={{ ...headingSt, marginBottom: 16 }}>📊 ออเดอร์ล่าสุด</h2>
        {myOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>ยังไม่มีออเดอร์</p>
            <Link to="/seller/products" style={{ fontSize: 14, fontWeight: 700, color: '#1a4d3a', textDecoration: 'underline', marginTop: 8, display: 'inline-block' }}>
              เริ่มเพิ่มสินค้า →
            </Link>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    {['Order ID', 'ลูกค้า', 'ยอด', 'สถานะ', 'วันที่'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: i === 2 ? 'right' : 'left', fontWeight: 800, color: '#111827', fontSize: 14 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myOrders.slice(0, 5).map((order) => {
                    const st = statusMap[order.status] ?? { label: order.status, bg: '#f3f4f6', fg: '#374151' };
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{order.id.slice(0, 8)}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#111827' }}>{order.checkout?.fullName || '-'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#111827' }}>฿{(Number(order.grandTotal) || 0).toLocaleString('th-TH')}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, backgroundColor: st.bg, color: st.fg }}>{st.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500, color: '#6b7280' }}>{new Date(order.createdAt).toLocaleDateString('th-TH')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Link to="/seller/orders" style={{ fontSize: 14, fontWeight: 700, color: '#1a4d3a', textDecoration: 'none' }}>ดูออเดอร์ทั้งหมด →</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
