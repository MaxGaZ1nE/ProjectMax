import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourierNavbar from '@/components/delivery/CourierNavbar';

const btnClass =
  'bg-[#1a6e40] hover:bg-[#166534] text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm text-sm';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: string;
  relatedOrderId?: string;
  relatedLink?: string;
}

export default function CourierNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const json = await res.json();
      setNotifications(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('ไม่สามารถโหลด Notification ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, orderId?: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );

      if (orderId) {
        navigate(`/orders/${orderId}`);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (notifications.every((n) => n.read)) return;

    setMarking(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setMarking(false);
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
      if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
      if (days < 7) return `${days} วันที่แล้ว`;

      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pb-12 font-sans">
        <CourierNavbar />
        <div className="max-w-2xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-neutral-500">⏳ กำลังโหลด...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-12 font-sans">
      <CourierNavbar />

      <div className="max-w-2xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0]">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 p-6 border-b border-[#e0e0e0]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="text-neutral-500 hover:text-neutral-700 text-2xl"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Notification</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-neutral-500">มี {unreadCount} รายการที่ยังไม่อ่าน</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={marking}
                className={`${btnClass} ${marking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {marking ? '⏳ กำลัง...' : '✓ อ่านทั้งหมด'}
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 m-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-neutral-500 text-lg">📭 ไม่มี Notification</p>
              <p className="text-neutral-400 text-sm mt-2">ข้อมูลจะปรากฏที่นี่เมื่อมี Notification ใหม่</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e0e0e0]">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id, notif.relatedOrderId)}
                  className={`w-full text-left p-4 hover:bg-neutral-50 transition ${
                    notif.read ? 'bg-white' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notif.read && (
                      <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${notif.read ? 'text-neutral-700' : 'text-neutral-900'}`}>
                          {notif.title}
                        </p>
                        <span className="text-xs text-neutral-500 flex-shrink-0">
                          {formatDateTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{notif.message}</p>
                      {notif.relatedOrderId && (
                        <p className="text-xs text-blue-600 mt-2">📦 Order ID: {notif.relatedOrderId}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
