# 📬 Seller Notifications System Documentation

## Overview

ระบบแจ้งเตือนสำหรับร้านค้า (Seller Notifications) ที่แยกข้อมูลการแจ้งเตือนแต่ละร้านค้าเรียบร้อยแล้ว

## Architecture

### Database Schema

```sql
CREATE TABLE seller_notifications (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  type VARCHAR(50) NOT NULL, -- 'order', 'order_update', 'payment', 'review', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  order_id VARCHAR(50) REFERENCES orders(id),
  related_data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notification Types

| Type | Description | Usage |
|------|-------------|-------|
| `order` | New order received | When customer places order |
| `order_update` | Order status changed | When order status changes (shipped, delivered, etc.) |
| `payment` | Payment related | When payment is received or payment verification needed |
| `review` | Product review posted | When customer posts a review |
| `system` | System notifications | General system messages |

## Backend API Endpoints

### 1. Get Notifications

```
GET /api/seller/notifications?limit=20&offset=0&unreadOnly=false
```

**Query Parameters:**
- `limit` (optional, default: 20) - Number of notifications to fetch
- `offset` (optional, default: 0) - Pagination offset
- `unreadOnly` (optional, default: false) - Only get unread notifications

**Response:**
```json
{
  "data": {
    "notifications": [
      {
        "id": 1,
        "shop_id": 5,
        "type": "order",
        "title": "New Order Received",
        "message": "Customer ordered 2 kg of Mango",
        "order_id": "ORD_001",
        "related_data": { "customer": "John", "total": 500 },
        "is_read": false,
        "read_at": null,
        "created_at": "2026-04-18T10:30:00Z",
        "updated_at": "2026-04-18T10:30:00Z"
      }
    ],
    "unreadCount": 5,
    "total": 20
  }
}
```

### 2. Get Unread Count

```
GET /api/seller/notifications/unread-count
```

**Response:**
```json
{
  "data": {
    "unreadCount": 5
  }
}
```

### 3. Get Notifications by Type

```
GET /api/seller/notifications/type/:type?limit=20&offset=0
```

**Parameters:**
- `type` - Notification type (order, order_update, payment, review, system)

### 4. Search Notifications

```
GET /api/seller/notifications/search?keyword=mango&limit=20&offset=0
```

**Query Parameters:**
- `keyword` (required) - Search keyword
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)

### 5. Mark as Read

```
PUT /api/seller/notifications/:notificationId/read
```

**Response:**
```json
{
  "message": "Notification marked as read",
  "data": {
    "notification": { /* notification object */ }
  }
}
```

### 6. Mark All as Read

```
PUT /api/seller/notifications/read-all
```

**Response:**
```json
{
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 5
  }
}
```

### 7. Delete Notification

```
DELETE /api/seller/notifications/:notificationId
```

**Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

### 8. Delete All Notifications

```
DELETE /api/seller/notifications
```

**Response:**
```json
{
  "message": "All notifications deleted successfully",
  "data": {
    "deletedCount": 15
  }
}
```

### 9. Get Notification Stats

```
GET /api/seller/notifications/stats
```

**Response:**
```json
{
  "data": {
    "stats": [
      {
        "type": "order",
        "total": 10,
        "unread": 2,
        "last_notification": "2026-04-18T10:30:00Z"
      }
    ],
    "totalUnread": 5
  }
}
```

## Frontend Implementation

### Redux Slice

The Redux slice (`seller-notifications-slice.ts`) manages seller notifications state:

```typescript
// Types
export type SellerNotification = {
  id: number;
  shop_id: number;
  type: SellerNotificationType;
  title: string;
  message?: string;
  order_id?: string;
  related_data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
};

// Actions
- loadNotifications({ shopId, notifications, unreadCount })
- addNotification({ shopId, notification })
- markNotificationAsRead({ shopId, notificationId })
- markAllAsRead(shopId)
- removeNotification({ shopId, notificationId })
- clearAllNotifications(shopId)
- setLoading(boolean)
- setError(error | null)
```

### Hook: useFetchSellerNotifications

Fetch notifications from API and sync with Redux:

```typescript
import { useFetchSellerNotifications } from '@/hooks';

function MyComponent() {
  const { shopId } = useAuth(); // Assume you get shop ID from auth
  
  const {
    notifications,      // SellerNotification[]
    unreadCount,        // number
    isLoading,          // boolean
    error,              // string | null
    fetchNotifications, // async function
    fetchUnreadCount    // async function
  } = useFetchSellerNotifications(shopId);

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {notifications.map(n => (
        <div key={n.id}>{n.title}</div>
      ))}
    </div>
  );
}
```

### Component: SellerNotificationCenter

Pre-built UI component for displaying seller notifications:

```typescript
import SellerNotificationCenter from '@/components/seller/SellerNotificationCenter';

export default function DashboardPage() {
  const { shopId, shopName } = useAuth();
  
  return (
    <SellerNotificationCenter 
      shopId={shopId} 
      shopName={shopName}
    />
  );
}
```

Features:
- ✅ Display notifications grouped by type
- ✅ Show unread count with badge
- ✅ Mark individual notification as read
- ✅ Mark all as read button
- ✅ Delete individual notifications
- ✅ Clear all notifications
- ✅ Time formatting (relative time like "2 hours ago")
- ✅ Show additional data in collapsible details

## Usage Examples

### Example 1: Creating a Notification (Backend)

```javascript
// In your order controller
const sellerNotificationService = require('../services/sellerNotificationService');

async function createOrderNotification(orderId, shopId, customerName) {
  const order = await getOrderDetails(orderId); // Get order details
  
  await sellerNotificationService.createNotification(shopId, {
    type: 'order',
    title: `New Order from ${customerName}`,
    message: `Order ${orderId} - Total: ${order.grand_total} THB`,
    orderId: orderId,
    relatedData: {
      customerId: order.user_id,
      customerName: customerName,
      total: order.grand_total,
      items: order.items_count
    }
  });
}
```

### Example 2: Using in Dashboard

```typescript
import { useFetchSellerNotifications } from '@/hooks';
import SellerNotificationCenter from '@/components/seller/SellerNotificationCenter';

export default function SellerDashboard() {
  const { seller } = useAppSelector(s => s.auth);
  const { notifications, unreadCount } = useFetchSellerNotifications(seller.shopId);

  return (
    <div>
      <div className="mb-6">
        <h2>Notifications ({unreadCount} unread)</h2>
      </div>
      
      <SellerNotificationCenter 
        shopId={seller.shopId}
        shopName={seller.shopName}
      />
    </div>
  );
}
```

### Example 3: Show Notification Badge

```typescript
import { useAppSelector } from '@stores/index';
import { selectUnreadCountByShop } from '@/slices/seller-notifications-slice';

function NotificationBell({ shopId }) {
  const unreadCount = useAppSelector(selectUnreadCountByShop(shopId));

  return (
    <div className="relative">
      <button>🔔</button>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </div>
  );
}
```

## Data Separation by Shop ID

Each notification is associated with a specific `shop_id`:

```
Database: seller_notifications table has shop_id column
  ✅ Each shop has its own notifications
  ✅ Queries filter by shop_id automatically
  ✅ No notification leakage between shops

Frontend Redux: notificationsByShop[shopId] = []
  ✅ Notifications grouped by shop ID
  ✅ Multiple shops can have notifications separately
  ✅ Easy to query notifications for specific shop
```

## Migration & Setup

### 1. Run Database Migration

```bash
cd backend
psql -U postgres -d fruit_store -f migrations/create-seller-notifications.sql
```

### 2. Verify Service Layer

The `sellerNotificationService.js` includes:
- ✅ Create notification
- ✅ Get notifications with pagination
- ✅ Get unread count
- ✅ Mark as read (single & all)
- ✅ Delete notification
- ✅ Search notifications
- ✅ Get statistics by type

### 3. Test API Endpoints

```bash
# Get all notifications
curl -X GET http://localhost:5000/api/seller/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get unread count
curl -X GET http://localhost:5000/api/seller/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark as read
curl -X PUT http://localhost:5000/api/seller/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Integration with Order System

When an order is created/updated, automatically create a seller notification:

```javascript
// In orderController.js - after creating order
const sellerNotificationService = require('../services/sellerNotificationService');

await sellerNotificationService.createNotification(shopId, {
  type: 'order',
  title: `New Order: ${orderId}`,
  message: `Total: ${order.grand_total} THB`,
  orderId: orderId,
  relatedData: {
    customerId: order.user_id,
    items: order.items,
    total: order.grand_total
  }
});
```

## Features

✅ **Separated by Shop ID** - Each shop has independent notifications
✅ **Multiple Types** - order, order_update, payment, review, system
✅ **Read Status** - Track read/unread status with timestamps
✅ **Full-Text Search** - Search notifications by title/message
✅ **Pagination** - Handle large notification lists efficiently
✅ **Statistics** - Get stats grouped by notification type
✅ **JSONB Support** - Store related data as JSON
✅ **Timestamps** - Auto-updated created_at and updated_at
✅ **Frontend Component** - Pre-built UI with grouping and filtering
✅ **Redux Integration** - Seamless state management

## Performance Considerations

- **Indexes**: Created on shop_id, created_at, is_read for fast queries
- **Pagination**: Always paginate results for large notification lists
- **Caching**: Consider implementing client-side caching for unread counts
- **Polling**: Frontend polls `/unread-count` endpoint periodically
- **Real-time**: Can be upgraded to WebSocket for real-time updates

## Future Enhancements

- [ ] WebSocket support for real-time notifications
- [ ] Email/SMS notifications
- [ ] Notification preferences/settings
- [ ] Notification templates
- [ ] Bulk notifications
- [ ] Notification categories
- [ ] Archive functionality
- [ ] Push notifications
