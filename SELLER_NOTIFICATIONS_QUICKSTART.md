# 🚀 Seller Notifications - Quick Start & Integration

## Quick Start

### Step 1: Run Migration

```bash
cd backend
psql -U postgres -d fruit_store -f migrations/create-seller-notifications.sql
```

### Step 2: Use in Frontend Component

```tsx
import SellerNotificationCenter from '@/components/seller/SellerNotificationCenter';

export default function SellerDashboard() {
  const { shopId, shopName } = useAuth();

  return (
    <div className="p-6">
      <SellerNotificationCenter shopId={shopId} shopName={shopName} />
    </div>
  );
}
```

### Step 3: Create Notifications (Backend)

When orders are created, update the order controller:

```javascript
// controllers/orderController.js
const sellerNotificationService = require('../services/sellerNotificationService');

async function createOrder(req, res, next) {
  try {
    // ... existing order creation code ...
    
    const order = await orderService.createOrder(orderData);
    
    // ✅ Send notification to seller
    await sellerNotificationService.createNotification(
      order.shop_id,
      {
        type: 'order',
        title: `New Order: ${order.id}`,
        message: `Customer ordered ${order.items_count} items - Total: ฿${order.grand_total}`,
        orderId: order.id,
        relatedData: {
          customerId: req.user.id,
          customerName: req.user.first_name,
          itemsCount: order.items_count,
          total: order.grand_total,
          paymentMethod: order.payment_method,
        }
      }
    );

    res.status(201).json({ data: { order } });
  } catch (error) {
    next(error);
  }
}
```

## Integration Patterns

### 1. Order Created Notification

```javascript
// When order is created
await sellerNotificationService.createNotification(shopId, {
  type: 'order',
  title: `New Order from ${customerName}`,
  message: `${itemsCount} items - ฿${total}`,
  orderId: orderId,
  relatedData: {
    customerId: userId,
    customerName: customerName,
    itemsCount: itemsCount,
    total: total,
    items: items
  }
});
```

### 2. Payment Received Notification

```javascript
// When payment is verified
await sellerNotificationService.createNotification(shopId, {
  type: 'payment',
  title: `Payment Received - Order ${orderId}`,
  message: `Amount: ฿${amount} - Payment verified`,
  orderId: orderId,
  relatedData: {
    amount: amount,
    method: paymentMethod,
    orderId: orderId,
    timestamp: new Date().toISOString()
  }
});
```

### 3. Order Status Update Notification

```javascript
// When order status changes
async function updateOrderStatus(orderId, newStatus, shopId) {
  const statusLabels = {
    'to_ship': 'Ready to Ship',
    'shipping': 'On the Way',
    'delivered': 'Delivered',
    'claim': 'Customer Claimed',
    'canceled': 'Canceled'
  };

  await sellerNotificationService.createNotification(shopId, {
    type: 'order_update',
    title: `Order Status Updated - ${statusLabels[newStatus]}`,
    message: `Order ${orderId} is now ${statusLabels[newStatus]}`,
    orderId: orderId,
    relatedData: {
      orderId: orderId,
      oldStatus: oldStatus,
      newStatus: newStatus,
      changedAt: new Date().toISOString()
    }
  });
}
```

### 4. Review Posted Notification

```javascript
// When customer posts a review
await sellerNotificationService.createNotification(shopId, {
  type: 'review',
  title: `New Review - ${rating}★ from ${customerName}`,
  message: reviewText,
  relatedData: {
    productId: productId,
    productName: productName,
    customerId: customerId,
    customerName: customerName,
    rating: rating,
    reviewText: reviewText,
    createdAt: new Date().toISOString()
  }
});
```

### 5. System/Admin Notification

```javascript
// For system announcements
await sellerNotificationService.createNotification(shopId, {
  type: 'system',
  title: 'New Feature Available',
  message: 'You can now use our new inventory management system',
  relatedData: {
    link: '/help/new-inventory',
    feature: 'inventory-management',
    version: '2.0'
  }
});
```

## Frontend Usage

### Get Unread Count Badge

```tsx
import { useAppSelector } from '@stores/index';
import { selectUnreadCountByShop } from '@/slices/seller-notifications-slice';

function NotificationBadge({ shopId }) {
  const unreadCount = useAppSelector(selectUnreadCountByShop(shopId));

  return (
    <div className="relative inline-block">
      <button className="btn btn-ghost">
        🔔 Notifications
      </button>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}
```

### Custom Notification List

```tsx
import { useFetchSellerNotifications } from '@/hooks';

function NotificationList({ shopId }) {
  const { notifications, isLoading, error } = useFetchSellerNotifications(shopId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {notifications.map(n => (
        <div key={n.id} className={`p-3 border rounded ${n.is_read ? 'bg-white' : 'bg-blue-50'}`}>
          <div className="font-semibold text-sm">{n.title}</div>
          {n.message && <div className="text-xs text-gray-600 mt-1">{n.message}</div>}
        </div>
      ))}
    </div>
  );
}
```

### Notification Bell with Dropdown

```tsx
import { useState } from 'react';
import { useFetchSellerNotifications } from '@/hooks';
import { useAppDispatch } from '@stores/index';
import { markNotificationAsRead } from '@/slices/seller-notifications-slice';

function NotificationBellDropdown({ shopId }) {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { notifications, unreadCount } = useFetchSellerNotifications(shopId);

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      dispatch(markNotificationAsRead({ 
        shopId, 
        notificationId: notification.id 
      }));
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border">
          <div className="p-4 border-b font-semibold">
            Notifications ({unreadCount} new)
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                  !n.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{n.title}</div>
                    {n.message && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {n.message}
                      </div>
                    )}
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t">
            <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Data Isolation Example

### Shop 1 (shopId: 1)
```json
{
  "notifications": [
    { "id": 1, "shop_id": 1, "title": "New Order", "is_read": false },
    { "id": 3, "shop_id": 1, "title": "Payment Received", "is_read": true }
  ]
}
```

### Shop 2 (shopId: 2)
```json
{
  "notifications": [
    { "id": 2, "shop_id": 2, "title": "New Review", "is_read": false }
  ]
}
```

When seller with shopId=1 accesses API:
```
GET /api/seller/notifications
Response: Only notifications with shop_id=1 ✅

When seller with shopId=2 accesses API:
GET /api/seller/notifications
Response: Only notifications with shop_id=2 ✅
```

**No data leakage!** Each seller only sees their own shop's notifications.

## Testing Examples

### Test Creating Notification

```javascript
const sellerNotificationService = require('../services/sellerNotificationService');

// Test: Create notification
const notification = await sellerNotificationService.createNotification(1, {
  type: 'order',
  title: 'Test Order',
  message: 'Test message',
  relatedData: { test: true }
});

console.log(notification);
// Output: { id: 1, shop_id: 1, type: 'order', title: 'Test Order', ... }
```

### Test Unread Count

```javascript
// Get unread count for shop 1
const count = await sellerNotificationService.getUnreadCount(1);
console.log(`Unread: ${count}`); // Unread: 3
```

### Test Mark as Read

```javascript
// Mark notification 5 as read
const result = await sellerNotificationService.markAsRead(5, 1);
console.log(result.is_read); // true
```

### Test Search

```javascript
// Search for "order" in shop 1
const results = await sellerNotificationService.searchNotifications(1, 'order');
console.log(results.length); // Returns matching notifications
```

## API Testing with cURL

```bash
# 1. Get all notifications
curl -X GET "http://localhost:5000/api/seller/notifications?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Get unread count
curl -X GET "http://localhost:5000/api/seller/notifications/unread-count" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Mark notification as read
curl -X PUT "http://localhost:5000/api/seller/notifications/1/read" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Mark all as read
curl -X PUT "http://localhost:5000/api/seller/notifications/read-all" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Get notifications by type
curl -X GET "http://localhost:5000/api/seller/notifications/type/order" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Search notifications
curl -X GET "http://localhost:5000/api/seller/notifications/search?keyword=mango" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 7. Get statistics
curl -X GET "http://localhost:5000/api/seller/notifications/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 8. Delete notification
curl -X DELETE "http://localhost:5000/api/seller/notifications/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 9. Delete all
curl -X DELETE "http://localhost:5000/api/seller/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notification Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Trigger Event (Order Created, Payment Received, etc.)        │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Backend Service Creates Notification                         │
│    - sellerNotificationService.createNotification()             │
│    - Inserts into DB with shop_id                               │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Notification Stored in Database                              │
│    - seller_notifications table                                 │
│    - Indexed by shop_id for fast retrieval                      │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Frontend Fetches Notifications (Periodic or On-Demand)       │
│    - useFetchSellerNotifications hook                           │
│    - GET /api/seller/notifications                              │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Redux Store Updated                                          │
│    - loadNotifications() action                                 │
│    - Organized by shop_id                                       │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Component Renders Notifications                              │
│    - SellerNotificationCenter displays them                     │
│    - Grouped by type with badges                                │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Tips

1. **Use Pagination**: Don't load all notifications at once
   ```typescript
   const { notifications } = useFetchSellerNotifications(shopId);
   // Automatically paginated with limit=20
   ```

2. **Implement Polling**: Periodically check for new notifications
   ```typescript
   useEffect(() => {
     const interval = setInterval(() => {
       fetchUnreadCount(); // Light-weight check
     }, 30000); // Every 30 seconds
     
     return () => clearInterval(interval);
   }, [fetchUnreadCount]);
   ```

3. **Cache Unread Counts**: Don't refetch if recently loaded
   ```typescript
   const lastFetch = useRef<number>(0);
   const CACHE_DURATION = 5000; // 5 seconds
   ```

4. **Lazy Load Details**: Expandable details for JSONB data
   ```tsx
   <details>
     <summary>Show details</summary>
     <pre>{JSON.stringify(notification.related_data, null, 2)}</pre>
   </details>
   ```
