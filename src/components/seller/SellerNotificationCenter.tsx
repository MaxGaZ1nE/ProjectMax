import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { useFetchSellerNotifications } from '@/hooks/use-fetch-seller-notifications';
import {
  markNotificationAsRead,
  removeNotification,
  markAllAsRead,
  clearAllNotifications,
  selectNotificationsByShop,
  selectUnreadCountByShop,
} from '@/slices/seller-notifications-slice';
import type { SellerNotification, SellerNotificationType } from '@/slices/seller-notifications-slice';

type SellerNotificationCenterProps = {
  shopId: number;
  shopName?: string;
};

function getTypeBadgeColor(type: SellerNotificationType) {
  switch (type) {
    case 'order':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'order_update':
      return 'border-blue-200 bg-blue-50 text-blue-800';
    case 'payment':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'review':
      return 'border-purple-200 bg-purple-50 text-purple-800';
    case 'system':
      return 'border-neutral-200 bg-neutral-50 text-neutral-700';
    default:
      return 'border-neutral-200 bg-neutral-50 text-neutral-700';
  }
}

function getTypeLabel(type: SellerNotificationType) {
  switch (type) {
    case 'order':
      return 'คำสั่งซื้อใหม่';
    case 'order_update':
      return 'อัปเดตคำสั่งซื้อ';
    case 'payment':
      return 'ชำระเงิน';
    case 'review':
      return 'รีวิวสินค้า';
    case 'system':
      return 'ระบบ';
    default:
      return 'แจ้งเตือน';
  }
}

function formatTime(iso: string) {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'เพิ่งแล้ว';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  } catch {
    return iso;
  }
}

export default function SellerNotificationCenter({
  shopId,
  shopName = 'ร้านค้า',
}: SellerNotificationCenterProps) {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, isLoading, error } = useFetchSellerNotifications(shopId);

  const groupedNotifications = useMemo(() => {
    const groups: Record<SellerNotificationType, SellerNotification[]> = {
      order: [],
      order_update: [],
      payment: [],
      review: [],
      system: [],
    };

    notifications.forEach((n: SellerNotification) => {
      if (groups[n.type]) {
        groups[n.type].push(n);
      }
    });

    return groups;
  }, [notifications]);

  const handleMarkAsRead = useCallback(
    (notificationId: number) => {
      dispatch(markNotificationAsRead({ shopId, notificationId }));
    },
    [dispatch, shopId]
  );

  const handleDelete = useCallback(
    (notificationId: number) => {
      dispatch(removeNotification({ shopId, notificationId }));
    },
    [dispatch, shopId]
  );

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllAsRead(shopId));
  }, [dispatch, shopId]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('คุณแน่ใจหรือว่าต้องการลบการแจ้งเตือนทั้งหมด?')) {
      dispatch(clearAllNotifications(shopId));
    }
  }, [dispatch, shopId]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <div className="font-semibold">เกิดข้อผิดพลาด</div>
        <div className="mt-1">{error}</div>
      </div>
    );
  }

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-neutral-600">กำลังโหลด...</div>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-700">
        <div className="text-center">ยังไม่มีการแจ้งเตือน</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-sm font-medium text-neutral-900">การแจ้งเตือน {shopName}</div>
            <div className="text-xs text-neutral-500 mt-1">
              ยังไม่อ่าน: <span className="font-semibold text-neutral-900">{unreadCount}</span>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 px-2.5 py-1 text-xs font-semibold border border-amber-200">
              ใหม่
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              className="btn btn-sm"
              type="button"
              onClick={handleMarkAllAsRead}
            >
              อ่านแล้วทั้งหมด
            </button>
          )}
          {notifications.length > 0 && (
            <button
              className="btn btn-sm btn-outline"
              type="button"
              onClick={handleClearAll}
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Notifications grouped by type */}
      <div className="space-y-6">
        {Object.entries(groupedNotifications).map(([type, notifs]) => {
          if (notifs.length === 0) return null;

          return (
            <div key={type} className="space-y-3">
              <div className="text-sm font-semibold text-neutral-900 sticky top-0 bg-white/80 backdrop-blur-sm py-2">
                {getTypeLabel(type as SellerNotificationType)} ({notifs.length})
              </div>

              <div className="space-y-2">
                {notifs.map((notification) => {
                  const rowClass = notification.is_read
                    ? 'border-neutral-200 bg-white'
                    : 'border-primary-200 bg-primary-50/40';

                  return (
                    <div
                      key={notification.id}
                      className={['rounded-lg border p-4 shadow-sm hover:shadow transition-shadow', rowClass].join(' ')}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={[
                                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                getTypeBadgeColor(notification.type),
                              ].join(' ')}
                            >
                              {getTypeLabel(notification.type)}
                            </span>
                            {!notification.is_read && (
                              <span className="inline-flex h-2 w-2 rounded-full bg-primary-600" />
                            )}
                          </div>

                          <div className="font-semibold text-neutral-900 text-sm md:text-base">
                            {notification.title}
                          </div>
                          {notification.message && (
                            <div className="mt-1 text-sm text-neutral-600">
                              {notification.message}
                            </div>
                          )}

                          <div className="mt-2 text-xs text-neutral-500">
                            {formatTime(notification.created_at)}
                          </div>

                          {notification.order_id && (
                            <div className="mt-2 text-xs">
                              <span className="text-neutral-500">Order ID: </span>
                              <span className="font-mono text-neutral-700">{notification.order_id}</span>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-wrap items-center gap-2 justify-end">
                          {!notification.is_read && (
                            <button
                              className="btn btn-sm btn-ghost"
                              type="button"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              อ่านแล้ว
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                            type="button"
                            onClick={() => handleDelete(notification.id)}
                          >
                            ลบ
                          </button>
                        </div>
                      </div>

                      {notification.related_data && (
                        <div className="mt-3 pt-3 border-t border-neutral-200 text-xs text-neutral-500">
                          <details className="cursor-pointer">
                            <summary className="font-semibold text-neutral-700 hover:text-neutral-900">
                              รายละเอียดเพิ่มเติม
                            </summary>
                            <pre className="mt-2 bg-neutral-100 p-2 rounded overflow-auto text-xs">
                              {JSON.stringify(notification.related_data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
