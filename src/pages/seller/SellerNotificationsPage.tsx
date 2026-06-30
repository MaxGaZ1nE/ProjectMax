import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@stores/index';

// ─── Types ────────────────────────────────────────────────────────────────────
type NotifType = 'order' | 'order_update' | 'payment' | 'review' | 'system';

interface SellerNotif {
  id: number;
  shop_id: number;
  type: NotifType;
  title: string;
  message?: string;
  order_id?: string;
  related_data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

interface NotifStats {
  total: number;
  unread: number;
  byType: Record<NotifType, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TOKEN = () => localStorage.getItem('token') ?? '';

const API = {
  fetch: (path: string) =>
    fetch(`/api/seller/notifications${path}`, {
      headers: { Authorization: `Bearer ${TOKEN()}` },
    }).then((r) => r.json()),
  put: (path: string) =>
    fetch(`/api/seller/notifications${path}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${TOKEN()}` },
    }).then((r) => r.json()),
  delete: (path: string) =>
    fetch(`/api/seller/notifications${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${TOKEN()}` },
    }).then((r) => r.json()),
};

function relativeTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (m < 1) return 'เพิ่งแล้ว';
    if (m < 60) return `${m} นาทีที่แล้ว`;
    if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
    if (d < 7) return `${d} วันที่แล้ว`;
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const TYPE_CONFIG: Record<
  NotifType,
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  order:        { label: 'ออเดอร์ใหม่',    icon: '🛒', color: 'text-emerald-800', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  order_update: { label: 'อัปเดตออเดอร์',  icon: '📦', color: 'text-blue-800',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  payment:      { label: 'ชำระเงิน',        icon: '💳', color: 'text-amber-800',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  review:       { label: 'รีวิวสินค้า',    icon: '⭐', color: 'text-purple-800',  bg: 'bg-purple-50',  border: 'border-purple-200'  },
  system:       { label: 'ระบบ',            icon: '🔔', color: 'text-neutral-700', bg: 'bg-neutral-50', border: 'border-neutral-200' },
};

const ALL_TYPES: NotifType[] = ['order', 'payment', 'order_update', 'review', 'system'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SellerNotificationsPage() {
  const navigate = useNavigate();
  const seller = useAppSelector((s: any) => s.seller?.profile);
  const shopId = seller?.shopId;

  const [notifs, setNotifs] = useState<SellerNotif[]>([]);
  const [stats, setStats] = useState<NotifStats>({ total: 0, unread: 0, byType: {} as Record<NotifType, number> });
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<NotifType | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // ── Fetch ──
  const load = useCallback(async () => {
    if (!shopId) return;
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        API.fetch(`?limit=100&unreadOnly=${unreadOnly ? 'true' : 'false'}`),
        API.fetch('/stats'),
      ]);
      setNotifs(listRes?.data?.notifications ?? []);
      if (statsRes?.data) {
        const s = statsRes.data;
        setStats({
          total: s.total ?? 0,
          unread: s.totalUnread ?? 0,
          byType: s.byType ?? {},
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [shopId, unreadOnly]);

  useEffect(() => { load(); }, [load]);

  // ── Mark one as read ──
  const markRead = async (id: number) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    try { await API.put(`/${id}/read`); } catch { /* ignore */ }
  };

  // ── Mark all as read ──
  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setStats((prev) => ({ ...prev, unread: 0 }));
    try { await API.put('/read-all'); } catch { /* ignore */ }
  };

  // ── Delete one ──
  const deleteNotif = async (id: number, isRead: boolean) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    if (!isRead) setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    try { await API.delete(`/${id}`); } catch { /* ignore */ }
  };

  // ── Delete all ──
  const deleteAll = async () => {
    if (!window.confirm('ต้องการลบการแจ้งเตือนทั้งหมดใช่หรือไม่?')) return;
    setNotifs([]);
    setStats({ total: 0, unread: 0, byType: {} as Record<NotifType, number> });
    try { await API.delete('/'); } catch { /* ignore */ }
  };

  // ── Click notification → go to order ──
  const handleClick = async (n: SellerNotif) => {
    if (!n.is_read) await markRead(n.id);
    const orderId = n.order_id ?? (n.related_data?.orderId as string | undefined);
    if (orderId) navigate(`/seller/orders`);
  };

  // ── Filtered list ──
  const filtered = useMemo(
    () => notifs.filter((n) => activeType === 'all' || n.type === activeType),
    [notifs, activeType]
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">🔔 การแจ้งเตือน</h1>
          <p className="text-neutral-600 mt-1">
            ติดตามออเดอร์ การชำระเงิน และการจัดส่งของร้านคุณ
          </p>
        </div>
        <div className="flex gap-2">
          {stats.unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="px-4 py-2 text-sm bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition"
            >
              ✓ อ่านทั้งหมด ({stats.unread})
            </button>
          )}
          {notifs.length > 0 && (
            <button
              type="button"
              onClick={deleteAll}
              className="px-4 py-2 text-sm border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition"
            >
              🗑 ลบทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'ทั้งหมด',     value: stats.total,  icon: '📋', color: 'text-neutral-900'  },
          { label: 'ยังไม่อ่าน', value: stats.unread, icon: '🔴', color: 'text-red-600'       },
          { label: 'ออเดอร์',     value: (stats.byType?.order ?? 0) + (stats.byType?.order_update ?? 0), icon: '🛒', color: 'text-emerald-700' },
          { label: 'ชำระเงิน',   value: stats.byType?.payment ?? 0, icon: '💳', color: 'text-amber-700'   },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-xs text-neutral-500">{c.label}</div>
            <div className={`text-2xl font-bold mt-0.5 ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* All tab */}
        <button
          type="button"
          onClick={() => setActiveType('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
            activeType === 'all'
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
          }`}
        >
          ทั้งหมด {notifs.length > 0 && `(${notifs.length})`}
        </button>

        {ALL_TYPES.map((t) => {
          const cfg = TYPE_CONFIG[t];
          const count = notifs.filter((n) => n.type === t).length;
          if (count === 0) return null;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActiveType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                activeType === t
                  ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {cfg.icon} {cfg.label} ({count})
            </button>
          );
        })}

        {/* Unread toggle */}
        <label className="ml-auto flex items-center gap-2 cursor-pointer text-sm text-neutral-600 select-none">
          <div
            onClick={() => setUnreadOnly((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition ${unreadOnly ? 'bg-emerald-500' : 'bg-neutral-300'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${unreadOnly ? 'left-4' : 'left-0.5'}`} />
          </div>
          เฉพาะที่ยังไม่อ่าน
        </label>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-10 text-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">กำลังโหลด...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center bg-white rounded-xl border border-neutral-200">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-neutral-600 font-medium">ไม่มีการแจ้งเตือน</p>
            <p className="text-neutral-400 text-sm mt-1">
              {unreadOnly ? 'ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน' : 'การแจ้งเตือนจะปรากฏเมื่อมีออเดอร์หรือกิจกรรมใหม่'}
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
            const hasOrder = !!(n.order_id ?? n.related_data?.orderId);
            return (
              <div
                key={n.id}
                className={`group relative rounded-xl border transition-shadow hover:shadow-md overflow-hidden ${
                  n.is_read
                    ? 'bg-white border-neutral-200'
                    : `${cfg.bg} ${cfg.border}`
                }`}
              >
                {/* Unread indicator bar */}
                {!n.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-current opacity-40 rounded-l-xl" />
                )}

                <div className="flex items-start gap-4 p-4 pl-5">
                  {/* Icon */}
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${cfg.bg} border ${cfg.border}`}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      {!n.is_read && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </div>

                    <p className="font-semibold text-neutral-900 text-sm mt-1 leading-snug">
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-sm text-neutral-600 mt-0.5 leading-relaxed">{n.message}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-neutral-400">{relativeTime(n.created_at)}</span>
                      {n.order_id && (
                        <span className="text-xs text-neutral-500 font-mono">
                          ออเดอร์ #{n.order_id}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasOrder && (
                      <button
                        type="button"
                        onClick={() => handleClick(n)}
                        className="text-xs px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition whitespace-nowrap"
                      >
                        ดูออเดอร์ →
                      </button>
                    )}
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="text-xs px-2.5 py-1.5 border border-neutral-300 text-neutral-600 rounded-lg hover:bg-neutral-50 transition whitespace-nowrap"
                      >
                        ✓ อ่านแล้ว
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotif(n.id, n.is_read)}
                      className="text-xs text-red-400 hover:text-red-600 transition px-1"
                      aria-label="delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* Full-row click to open order */}
                {hasOrder && (
                  <button
                    type="button"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onClick={() => handleClick(n)}
                    aria-label="เปิดออเดอร์"
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Refresh hint */}
      {!loading && (
        <div className="text-center">
          <button
            type="button"
            onClick={load}
            className="text-sm text-neutral-400 hover:text-emerald-600 transition"
          >
            🔄 รีเฟรช
          </button>
        </div>
      )}
    </div>
  );
}
