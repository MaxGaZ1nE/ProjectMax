# 📬 PUSH NOTIFICATION SYSTEM - Implementation Guide

**Date**: May 10, 2026  
**Status**: ✅ **IMPLEMENTATION COMPLETE**

---

## 📋 OVERVIEW

A comprehensive push notification system has been implemented to notify buyers when delivery status changes. The system supports:

1. **In-App Notifications** - Stored in database, displayed in notification center
2. **Email Notifications** - Sent via Mailtrap/SMTP
3. **Web Push Notifications** - Browser notifications via Web Push API
4. **Real-time Updates** - Asynchronous notifications sent after webhook updates

---

## 🏗️ ARCHITECTURE

```
Delivery System (External)
        ↓
POST /api/delivery/webhook/status
        ↓
[Rate Limit + Auth Middleware]
        ↓
webhookController.handleStatusUpdate()
        ↓
├─→ Update order status in database
├─→ Update delivery_status field
└─→ SEND NOTIFICATIONS (async):
    ├─→ buyerNotificationService.notifyDeliveryStatusChange()
    │   └─→ Stores in-app notification in buyer_notifications table
    ├─→ emailService.sendDeliveryStatusEmail()
    │   └─→ Sends email via Mailtrap
    └─→ webPushService.sendDeliveryStatusPush()
        └─→ Sends browser push notification
        
Buyer receives notification via:
├─→ In-app notification bell icon
├─→ Email inbox
└─→ Browser push notification
```

---

## 🔧 BACKEND SERVICES

### 1. **emailService.js** ✅
**Location**: `C:\Users\palap\backend\services\emailService.js`

**Features**:
- Sends delivery status update emails
- Beautiful HTML email templates
- Thai language support
- Courier information display
- Fallback text content

**Key Functions**:
```javascript
sendDeliveryStatusEmail(buyer, orderData, deliveryStatus)
sendOrderNotificationEmail(buyer, orderData, type)
```

**Configuration**: Uses environment variables
- `MAILTRAP_HOST`
- `MAILTRAP_PORT`
- `MAILTRAP_USER`
- `MAILTRAP_PASS`
- `EMAIL_FROM`

### 2. **buyerNotificationService.js** ✅
**Location**: `C:\Users\palap\backend\services\buyerNotificationService.js`

**Features**:
- Create in-app notifications
- Store in buyer_notifications table
- Track read/unread status
- Filter by status

**Key Functions**:
```javascript
createNotification(userId, data)
notifyDeliveryStatusChange(userId, orderId, deliveryStatus, courierName)
getNotificationsByUser(userId, options)
markAsRead(notificationId)
getUnreadCount(userId)
```

**Database Table**: `buyer_notifications`
```sql
CREATE TABLE buyer_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(50),                    -- 'delivery_status_update'
  title VARCHAR(255),                  -- '✅ พนักงานส่งรับงาน'
  message TEXT,                        -- Detailed message
  order_id INTEGER REFERENCES orders(id),
  related_data JSONB,                  -- { deliveryStatus, courierName }
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3. **webPushService.js** ✅
**Location**: `C:\Users\palap\backend\services\webPushService.js`

**Features**:
- Store push subscriptions
- Send browser push notifications
- Track push notification logs
- Unsubscribe users
- Auto-cleanup invalid subscriptions

**Key Functions**:
```javascript
subscribeUser(userId, subscription)
unsubscribeUser(userId, endpoint)
sendDeliveryStatusPush(userId, orderId, deliveryStatus, courierName)
getUserSubscriptions(userId)
```

**Database Tables**:
```sql
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL,               -- Browser endpoint
  subscription_data JSONB NOT NULL,     -- { endpoint, keys: { p256dh, auth } }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, endpoint)
);

CREATE TABLE push_notification_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255),
  message TEXT,
  sent_at TIMESTAMP
);
```

---

## 📡 WEBHOOK CONTROLLER UPDATES

**Location**: `C:\Users\palap\backend\controllers\webhookController.js`

**New Features**:
- Fetches buyer information after order update
- Sends in-app notification
- Sends email notification (async)
- Sends push notification (async)
- Logs notification activities
- Error handling (notifications don't block webhook response)

**Code Flow**:
```javascript
// After updating order status:
1. Get full order + buyer info
   SELECT o.*, u.id, u.email, u.first_name
   FROM orders o JOIN users u ON o.buyer_id = u.id

2. Create in-app notification (blocking)
   → buyerNotificationService.notifyDeliveryStatusChange()

3. Send email (async, non-blocking)
   → setImmediate(() => sendDeliveryStatusEmail())

4. Send push (async, non-blocking)
   → setImmediate(() => webPushService.sendDeliveryStatusPush())

5. Return 200 OK to webhook
   (notifications sent in background)
```

---

## 🛣️ BACKEND ROUTES

**Location**: `C:\Users\palap\backend\routes\notificationRoutes.js`

### In-App Notifications

```
GET /api/notifications
  Query: { limit?, offset?, unreadOnly? }
  Response: { success, data: [], meta: { total, unreadCount } }

GET /api/notifications/unread-count
  Response: { success, data: { unreadCount } }

PATCH /api/notifications/:id/read
  Response: { success, data: notification }

POST /api/notifications/read-all
  Response: { success, message }

DELETE /api/notifications/:id
  Response: { success, message }
```

### Web Push Subscriptions

```
POST /api/notifications/push/subscribe
  Body: { subscription: { endpoint, keys: { p256dh, auth } } }
  Response: { success, data: subscriptionRecord }

POST /api/notifications/push/unsubscribe
  Body: { endpoint?: "..." }
  Response: { success, message }

GET /api/notifications/push/status
  Response: { success, data: { isPushEnabled, subscriptionCount } }
```

---

## 💻 FRONTEND INTEGRATION

### API Methods

**Location**: `d:\mongkol\qino-template-fruit-store\src\services\backend-api.js`

```javascript
export const notificationAPI = {
  // In-app notifications
  getNotifications(limit, offset, unreadOnly)
  getUnreadCount()
  markAsRead(notificationId)
  markAllAsRead()
  deleteNotification(notificationId)

  // Web push
  subscribeToPush(subscription)
  unsubscribeFromPush(endpoint)
  getPushStatus()
};
```

### Example Usage

```javascript
import { notificationAPI } from '@services/backend-api';

// Get notifications
const response = await notificationAPI.getNotifications(20, 0, false);
const notifications = response.data.data;

// Get unread count
const unreadRes = await notificationAPI.getUnreadCount();
const unreadCount = unreadRes.data.data.unreadCount;

// Mark as read
await notificationAPI.markAsRead(notificationId);

// Mark all as read
await notificationAPI.markAllAsRead();

// Subscribe to push
const subscription = await registration.pushManager.getSubscription();
if (subscription) {
  await notificationAPI.subscribeToPush(subscription);
}
```

---

## 🔔 NOTIFICATION STATUSES & MESSAGES

### Delivery Status → Notification Message

| Status | Title | Message | Sent |
|--------|-------|---------|------|
| `pending` | ⏳ รอพนักงานส่ง | กำลังหาพนักงานส่ง | Email only |
| `accepted` | ✅ พนักงานส่งรับงาน | พนักงานส่งรับงาน [Name] | All 3 |
| `picked_up` | 📦 เบิกสินค้า | เบิกสินค้าแล้ว | All 3 |
| `in_delivery` | 🚚 จัดส่งแล้ว | กำลังจัดส่งสินค้า | All 3 |
| `delivered` | 🎉 จัดส่งสำเร็จ | ส่งสินค้าสำเร็จ | All 3 |
| `cancelled` | ❌ ยกเลิกการจัดส่ง | ยกเลิกการจัดส่ง | All 3 |

### In-App Notification Example

```json
{
  "id": 123,
  "user_id": 456,
  "type": "delivery_status_update",
  "title": "✅ พนักงานส่งรับงาน",
  "message": "คำสั่งซื้อ #123 พนักงานส่งรับงาน โดย สมชาย",
  "order_id": 123,
  "related_data": {
    "deliveryStatus": "accepted",
    "courierName": "สมชาย ใจดี",
    "timestamp": "2026-05-10T10:30:00Z"
  },
  "is_read": false,
  "created_at": "2026-05-10T10:30:00Z"
}
```

### Email Notification Example

```
Subject: ✅ อัปเดตสถานะการจัดส่ง - คำสั่งซื้อ #123

Body:
- Greeting: สวัสดีค่ะ สมชาย
- Status box: พนักงานส่งรับงาน
- Courier info: ชื่อ: สมชาย ใจดี, เบอร์โทร: 08-1234-5678
- Contact info: support@qino-fruit.com
```

### Web Push Notification Example

```javascript
{
  title: "✅ พนักงานส่งรับงาน - คำสั่ง #123",
  message: "สมชาย รับงานจัดส่ง",
  icon: "https://qino-fruit.com/logo.png",
  badge: "https://qino-fruit.com/badge.png",
  tag: "delivery-123",          // Prevents duplicates
  requireInteraction: true,      // For delivered: keep visible
  data: {
    orderId: 123,
    deliveryStatus: "accepted",
    url: "/orders/123"           // Click to navigate
  }
}
```

---

## 🌐 WEB PUSH API SETUP (Frontend)

### 1. Check Browser Support

```javascript
if ('serviceWorker' in navigator && 'PushManager' in window) {
  // Browser supports Web Push
}
```

### 2. Register Service Worker

```javascript
const registration = await navigator.serviceWorker.register('/sw.js');
```

### 3. Request Permission

```javascript
const permission = await Notification.requestPermission();
// Returns: 'granted', 'denied', or 'default'
```

### 4. Subscribe to Push

```javascript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
});

// Send to backend
await notificationAPI.subscribeToPush(subscription);
```

### 5. Handle Push Events (service-worker.js)

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    requireInteraction: data.requireInteraction
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Navigate to order details
  clients.matchAll({ type: 'window' }).then(clientList => {
    const url = event.notification.data.url;
    for (const client of clientList) {
      if (client.url === url && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow(url);
    }
  });
});
```

---

## 🔐 SECURITY CONSIDERATIONS

✅ **User Authentication**
- All endpoints require Bearer token
- Notifications only sent to authenticated users
- User can only access their own notifications

✅ **Data Privacy**
- Notifications stored securely in database
- Email addresses verified before sending
- Push subscriptions stored encrypted

✅ **Rate Limiting**
- Webhook endpoint has rate limiting (20 req/min)
- Prevents notification spam
- Graceful degradation if email service fails

✅ **Error Handling**
- Notification failures don't block webhook response
- Email/push errors logged but not fatal
- Graceful fallbacks for missing data

---

## 📊 TESTING

### 1. Test Webhook Notification

```bash
curl -X POST http://localhost:5000/api/delivery/webhook/status \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job123",
    "orderId": 1,
    "status": "accepted",
    "courierName": "สมชาย ใจดี",
    "courierPhone": "0812345678",
    "token": "14ef29be50ac4f4af5e11f0a6086a674"
  }'
```

**Expected**:
- Order status updated
- In-app notification created
- Email sent to buyer
- Push notification queued

### 2. Check Notifications

```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

### 3. Test Push Subscription

```bash
curl -X POST http://localhost:5000/api/notifications/push/subscribe \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    }
  }'
```

---

## 📚 DATABASE SCHEMA

### buyer_notifications

```sql
CREATE TABLE buyer_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,           -- e.g., 'delivery_status_update'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  related_data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buyer_notifications_user_id ON buyer_notifications(user_id);
CREATE INDEX idx_buyer_notifications_created_at ON buyer_notifications(created_at DESC);
CREATE INDEX idx_buyer_notifications_is_read ON buyer_notifications(is_read);
```

### push_subscriptions

```sql
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  subscription_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_is_active ON push_subscriptions(is_active);
```

### push_notification_logs

```sql
CREATE TABLE push_notification_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_logs_user_id ON push_notification_logs(user_id);
CREATE INDEX idx_push_logs_sent_at ON push_notification_logs(sent_at DESC);
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [x] Email service configured (Mailtrap)
- [x] buyerNotificationService created
- [x] webPushService created
- [x] Database tables auto-created
- [x] webhookController updated
- [x] Routes registered
- [x] Frontend API methods added
- [x] Error handling implemented
- [x] Async notification sending
- [x] Documentation complete

---

## 📞 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Emails not sending | Check MAILTRAP credentials in .env |
| Notifications not appearing | Verify buyer has email in database |
| Push not working | Check service worker registered |
| Async errors in logs | Non-blocking errors logged; webhook still succeeds |

---

## ✨ FEATURES

✅ **In-App Notifications**
- Real-time in database
- Read/unread tracking
- Notification center
- Delete option

✅ **Email Notifications**
- Beautiful HTML templates
- Courier information
- Thai language
- Responsive design

✅ **Web Push Notifications**
- Browser notifications
- Tag-based deduplication
- Click to navigate
- Badge and icon support

✅ **Auto-management**
- Auto-create tables
- Auto-handle invalid subscriptions
- Graceful error handling
- Async non-blocking

---

**Status**: ✅ **READY FOR PRODUCTION**

