import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaymentOrder {
  id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  items_subtotal: string | number;
  shipping_fee: string | number;
  grand_total: string | number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  items: { name: string; qty: number; price: number }[];
}

interface MonthlyEntry {
  month: string; // 'YYYY-MM'
  count: string | number;
  total: string | number;
}

interface Totals {
  count: number;
  revenue: number;
  in_delivery: number;
  itemsTotal: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (n: number | string) =>
  `฿${(Number(n) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const thDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paid:                 { label: 'ชำระแล้ว',         color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  pending_verification: { label: 'รอตรวจสอบ',        color: 'bg-amber-100 text-amber-800 border-amber-200' },
  refunded:             { label: 'คืนเงินแล้ว',       color: 'bg-purple-100 text-purple-800 border-purple-200' },
  failed:               { label: 'ล้มเหลว',           color: 'bg-red-100 text-red-800 border-red-200' },
  none:                 { label: 'ยังไม่ชำระ',        color: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  unpaid:    'ยังไม่ชำระ',
  waiting_driver:   'รอจัดส่ง',
  in_delivery:  'กำลังจัดส่ง',
  delivered: 'ส่งสำเร็จ',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

const TOKEN = () => localStorage.getItem('token') ?? '';

// ─── Component ────────────────────────────────────────────────────────────────
export default function SellerPaymentsPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [monthly, setMonthly] = useState<MonthlyEntry[]>([]);
  const [totals, setTotals] = useState<Totals>({ count: 0, revenue: 0, in_delivery: 0, itemsTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string>('paid');
  const [orderStatus, setOrderStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        paymentStatus,
        status: orderStatus,
        limit: '200',
      });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/seller/payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setOrders(data.data ?? []);
      setMonthly(data.monthlySummary ?? []);
      setTotals(data.totals ?? { count: 0, revenue: 0, in_delivery: 0, itemsTotal: 0 });
    } catch (e: any) {
      setError(e?.message ?? 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [paymentStatus, orderStatus, dateFrom, dateTo]);

  // Client-side search
  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.trim().toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        (o.customer_name ?? '').toLowerCase().includes(q) ||
        (o.customer_phone ?? '').includes(q)
    );
  }, [orders, search]);

  // Monthly chart max
  const monthlyMax = useMemo(
    () => Math.max(...monthly.map((m) => Number(m.total)), 1),
    [monthly]
  );

  // This month total
  const thisMonth = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7);
    const entry = monthly.find((m) => m.month === ym);
    return entry ? Number(entry.total) : 0;
  }, [monthly]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">💳 การชำระเงิน</h1>
        <p className="text-neutral-600 mt-1">ตรวจสอบรายการชำระเงินที่ได้รับจากผู้ซื้อ</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'รายการทั้งหมด',   value: totals.count.toLocaleString(),  icon: '📋', color: 'text-neutral-900'  },
          { label: 'รายรับรวม',        value: money(totals.revenue),          icon: '💰', color: 'text-emerald-700' },
          { label: 'เดือนนี้',         value: money(thisMonth),               icon: '📅', color: 'text-blue-700'    },
          { label: 'ค่าส่งรวม',        value: money(totals.shipping),         icon: '🚚', color: 'text-amber-700'   },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-xs text-neutral-500">{c.label}</div>
            <div className={`text-xl font-bold mt-0.5 ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      {monthly.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 mb-4">📊 รายรับรายเดือน (12 เดือนล่าสุด)</h2>
          <div className="flex items-end gap-1 h-32">
            {monthly.map((m) => {
              const pct = (Number(m.total) / monthlyMax) * 100;
              const label = m.month.slice(5); // 'MM'
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex items-end justify-center h-24">
                    <div
                      className="w-full bg-emerald-500 rounded-t hover:bg-emerald-600 transition-all cursor-default"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                      title={`${m.month}: ${money(m.total)} (${m.count} รายการ)`}
                    />
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-neutral-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                      {money(m.total)}
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-500">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
        {/* Search + date */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="ค้นหา ออเดอร์ ID / ชื่อลูกค้า / เบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <span className="flex items-center text-neutral-500 text-sm">ถึง</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
            >
              ✕ ล้างวันที่
            </button>
          )}
        </div>

        {/* Payment status tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'paid',                 label: '✓ ชำระแล้ว'     },
            { key: 'pending_verification', label: '⏳ รอตรวจสอบ'   },
            { key: 'all',                  label: 'ทั้งหมด'         },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setPaymentStatus(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                paymentStatus === t.key
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="w-px bg-neutral-200 mx-1" />

          {/* Order status */}
          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm outline-none"
          >
            <option value="all">สถานะออเดอร์: ทั้งหมด</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-bold text-neutral-900">
            รายการชำระเงิน ({filtered.length} รายการ)
          </h2>
          {filtered.length > 0 && (
            <span className="text-sm text-emerald-700 font-semibold">
              ยอดรวม: {money(filtered.reduce((s, o) => s + Number(o.grand_total), 0))}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-14 text-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">กำลังโหลด...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-600 text-sm">⚠️ {error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-neutral-500">ไม่มีรายการชำระเงินที่ตรงเงื่อนไข</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[1fr_1.5fr_0.8fr_0.8fr_0.8fr_1fr_80px] gap-4 px-5 py-3 bg-neutral-50 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              <span>ออเดอร์ ID</span>
              <span>ลูกค้า</span>
              <span>ยอดสินค้า</span>
              <span>ค่าส่ง</span>
              <span>ยอดรวม</span>
              <span>วันที่</span>
              <span>สถานะ</span>
            </div>

            {filtered.map((o) => {
              const psBadge = PAYMENT_STATUS_LABELS[o.payment_status] ?? PAYMENT_STATUS_LABELS.none;
              const isExpanded = expandedId === o.id;

              return (
                <div key={o.id}>
                  <div
                    className="grid md:grid-cols-[1fr_1.5fr_0.8fr_0.8fr_0.8fr_1fr_80px] gap-4 px-5 py-4 hover:bg-neutral-50 transition cursor-pointer items-center"
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  >
                    {/* Order ID */}
                    <div>
                      <span className="font-mono text-sm font-semibold text-emerald-700">
                        #{o.id.slice(-8).toUpperCase()}
                      </span>
                      <div className="text-[10px] text-neutral-400 mt-0.5 capitalize">
                        {o.payment_method === 'promptpay' ? 'PromptPay' : o.payment_method}
                      </div>
                    </div>

                    {/* Customer */}
                    <div>
                      <div className="text-sm font-medium text-neutral-900 truncate">
                        {o.customer_name || '—'}
                      </div>
                      {o.customer_phone && (
                        <div className="text-xs text-neutral-500">{o.customer_phone}</div>
                      )}
                    </div>

                    {/* Amounts */}
                    <div className="text-sm text-neutral-700">{money(o.items_subtotal)}</div>
                    <div className="text-sm text-neutral-700">{money(o.shipping_fee)}</div>
                    <div className="text-sm font-bold text-neutral-900">{money(o.grand_total)}</div>

                    {/* Date */}
                    <div className="text-xs text-neutral-500">{thDate(o.created_at)}</div>

                    {/* Status badge */}
                    <div>
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${psBadge.color}`}>
                        {psBadge.label}
                      </span>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </div>
                    </div>
                  </div>

                  {/* Expanded items */}
                  {isExpanded && o.items.length > 0 && (
                    <div className="px-5 pb-4 bg-neutral-50 border-t border-neutral-100">
                      <div className="text-xs font-semibold text-neutral-500 mb-2 pt-3">รายการสินค้า</div>
                      <div className="space-y-1">
                        {o.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-neutral-700">{item.name} × {item.qty}</span>
                            <span className="text-neutral-600 font-medium">{money(item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/seller/orders')}
                        className="mt-3 text-xs text-emerald-600 hover:underline"
                      >
                        ดูออเดอร์ทั้งหมด →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
