import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import type { AppNotification } from '@/slices/notification-slice';
import { markAllRead, markRead, clearAllNotifications } from '@/slices/notification-slice';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function Badge({ type }: { type: AppNotification['type'] }) {
  const cls =
    type === 'payment'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : type === 'in_delivery'
        ? 'border-blue-200 bg-blue-50 text-blue-800'
        : type === 'order'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-neutral-200 bg-neutral-50 text-neutral-700';

  const label =
    type === 'payment'
      ? 'ชำระเงิน'
      : type === 'in_delivery'
        ? 'จัดส่ง'
        : type === 'order'
          ? 'คำสั่งซื้อ'
          : 'ระบบ';

  return (
    <span className={['inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', cls].join(' ')}>
      {label}
    </span>
  );
}

export default function NotificationTab() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const items: AppNotification[] = useSelector((s: any) => s.notifications?.items ?? []);

  const unreadCount = useMemo(() => items.filter((x) => !x.read).length, [items]);

  const onOpen = (n: AppNotification) => {
    // mark read ก่อน
    if (!n.read) dispatch(markRead({ id: n.id }));

    // ถ้ามี link ให้ navigate แบบ state ได้ (ใช้ได้กับ /profile ที่รับ state.tab)
    if (n.link?.to) {
      navigate(n.link.to, { state: n.link.state });
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-700">
        ยังไม่มีการแจ้งเตือน
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="text-sm text-neutral-600">
            ยังไม่อ่าน: <span className="font-semibold text-neutral-900">{unreadCount}</span>
          </div>

          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 px-2.5 py-1 text-xs font-semibold border border-amber-200">
              ใหม่
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" type="button" onClick={() => dispatch(markAllRead())}>
            อ่านแล้วทั้งหมด
          </button>
          <button className="btn" type="button" onClick={() => dispatch(clearAllNotifications())}>
            ล้างทั้งหมด
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {items.map((n) => {
          const rowClass = n.read
            ? 'border-neutral-200 bg-white'
            : 'border-primary-200 bg-primary-50/40';

          return (
            <div key={n.id} className={['rounded-xl border p-4 shadow-sm', rowClass].join(' ')}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge type={n.type} />
                    {!n.read && <span className="inline-flex h-2 w-2 rounded-full bg-primary-600" />}
                  </div>

                  <div className="mt-2 font-semibold text-neutral-900">{n.title}</div>
                  {n.message && <div className="mt-1 text-sm text-neutral-600">{n.message}</div>}

                  <div className="mt-2 text-xs text-neutral-500">{formatTime(n.createdAt)}</div>
                </div>

                <div className="shrink-0 flex flex-wrap items-center gap-2 justify-end">
                  {!n.read && (
                    <button className="btn" type="button" onClick={() => dispatch(markRead({ id: n.id }))}>
                      ทำเครื่องหมายว่าอ่านแล้ว
                    </button>
                  )}

                  {n.link?.to && (
                    <button className="btn btn-primary" type="button" onClick={() => onOpen(n)}>
                      เปิด
                    </button>
                  )}
                </div>
              </div>

              {/* Optional quick link preview */}
              {n.link?.to && (
                <div className="mt-3 text-xs text-neutral-500">
                  ไปที่: <span className="font-medium text-neutral-700">{n.link.to}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-4 text-xs text-neutral-500">
        ทิป: กด “เปิด” เพื่อไปยังหน้าที่เกี่ยวข้อง เช่น คำสั่งซื้อ หรือรอตรวจสอบสลิป
      </div>
    </div>
  );
}