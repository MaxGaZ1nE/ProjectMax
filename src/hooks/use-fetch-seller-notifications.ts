import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import {
  loadNotifications,
  selectNotificationsByShop,
  selectUnreadCountByShop,
  setLoading,
  setError,
} from '@/slices/seller-notifications-slice';

/**
 * ✅ Hook สำหรับจัดการการแจ้งเตือนของร้านค้าจาก API
 */
export function useFetchSellerNotifications(shopId: number) {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotificationsByShop(shopId));
  const unreadCount = useAppSelector(selectUnreadCountByShop(shopId));
  const isLoading = useAppSelector((s: any) => s.sellerNotifications?.loading);
  const error = useAppSelector((s: any) => s.sellerNotifications?.error);

  /**
   * ✅ ดึงการแจ้งเตือนจากเซิร์ฟเวอร์
   */
  const fetchNotifications = useCallback(async (limit = 20, offset = 0) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/seller/notifications?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      dispatch(
        loadNotifications({
          shopId,
          notifications: data.data.notifications,
          unreadCount: data.data.unreadCount,
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(setError(message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [shopId, dispatch]);

  /**
   * ✅ ดึงจำนวนการแจ้งเตือนที่ยังไม่อ่าน
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/seller/notifications/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      return data.data.unreadCount;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  }, []);

  /**
   * ✅ โหลดการแจ้งเตือนเมื่อ component mount
   */
  useEffect(() => {
    if (shopId) {
      fetchNotifications();
    }
  }, [shopId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
  };
}
