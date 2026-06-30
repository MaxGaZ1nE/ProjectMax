# 🚚 ANALYSIS: Separasi Sistem Delivery

## 📊 สรุปภาพรวม

โปรเจคของคุณมี 3 roles รวมกัน ต้องการแยก delivery ออกไป ลิมิต 1 account เหลือ 2 roles (buyer + seller) เท่านั้น

**System Current State:**
- 1 Monolith: Frontend (React) + Backend (Node.js) + Database (PostgreSQL)
- 3 Roles: customer, seller, delivery (all in 1 system)
- Admin manages: sellers + delivery approvals

**System Target State:**
- 2 Separate Systems connected via REST API
- Main System: buyer + seller only
- Delivery System: delivery personnel only
- 1 Account = max 2 roles (buyer or seller, not delivery)

---

## ✅ PHASE 1: MAIN SYSTEM CLEANUP

### 1.1 Database Changes

| Item | Action | Impact |
|------|--------|--------|
| `users.role` constraint | Remove 'delivery' option | Break: Existing delivery accounts |
| `delivery_registrations` table | Delete or archive | Loss: Approval history (unless backed up) |
| `orders.courier_id` field | **KEEP** | Integration: Delivery system uses this |
| `users.isSeller` field | Add (if missing) | Schema: More explicit seller detection |

**Migration file needed:**
```sql
-- Remove delivery role from constraint
ALTER TABLE users 
DROP CONSTRAINT check_role;

ALTER TABLE users 
ADD CONSTRAINT check_role 
CHECK (role IN ('customer', 'seller', 'admin'));

-- Archive old delivery data
CREATE TABLE delivery_registrations_archive AS 
SELECT * FROM delivery_registrations;

-- Keep this for integration
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS courier_id_ref VARCHAR(255);
-- courier_id_ref = delivery system's identifier (not numeric ID)
```

### 1.2 Backend API Changes

#### Endpoints to REMOVE:
```
❌ POST   /api/delivery/register/step1
❌ POST   /api/delivery/register/step2
❌ POST   /api/delivery/register/verify-otp
❌ POST   /api/delivery/register/submit
❌ GET    /api/delivery/register/status
❌ GET    /api/admin/delivery/registrations
❌ POST   /api/admin/delivery/approve/:id
❌ POST   /api/admin/delivery/reject/:id
```

#### Endpoints to ADD (for Delivery System integration):
```
✅ POST   /api/orders/:id/assign-courier
   Body: { deliveryPersonId: "delivery-email@...", estimatedTime: "2h" }
   
✅ GET    /api/orders?status=waiting_driver&assigned=false&limit=20
   For: Delivery system to fetch available orders
   
✅ PATCH  /api/orders/:id/status
   Body: { status: "in_delivery"|"delivered"|"completed", timestamp, notes }
   Auth: API Key from Delivery System
   
✅ GET    /api/orders/:id/delivery-status
   Returns: { status, current_courier, eta, tracking_link }
```

#### Files to DELETE:
```
🗑️  /backend/routes/deliveryRoutes.js
🗑️  /backend/controllers/deliveryRegistrationController.js
🗑️  Lines in /backend/routes/index.js that mount deliveryRoutes
🗑️  Admin endpoints for delivery approval (from adminController.js)
```

#### Files to MODIFY:
```
✏️  /backend/migrations/ → Add new migration for schema changes
✏️  /backend/controllers/adminController.js → Remove delivery approval logic
✏️  /backend/controllers/orderController.js → Add new endpoints above
```

### 1.3 Frontend Changes

#### Pages to DELETE:
```
🗑️  /src/pages/delivery/
    - DeliverySignupPage.tsx
    - CourierDashboardPage.tsx
    - CourierEditProfilePage.tsx
    - CourierChangePasswordPage.tsx
    - CourierBankPage.tsx
    - CourierNotificationsPage.tsx

🗑️  /src/components/delivery/
    - All delivery-related components

🗑️  /src/components/delivery-registration/
    - SellerRegistrationForm.tsx (keep seller registration!)
    - DeliveryRegistrationForm.tsx
```

#### Routes to DELETE:
```
🗑️  /delivery/register
🗑️  /delivery/dashboard
🗑️  /delivery/profile/edit
🗑️  /delivery/profile/change-password
🗑️  /delivery/profile/bank
🗑️  /delivery/profile/notifications
🗑️  All wrapped with <DeliveryGuard>
```

**In `/src/routes/index.tsx`:**
```typescript
// BEFORE (lines 54-60, 167-198)
// Delivery: register
{
  path: '/delivery/register',
  element: <MainLayout />,
  children: [{ index: true, element: <DeliverySignupPage /> }],
},
// ... all 5 delivery routes

// AFTER
// ✂️ DELETE ALL DELIVERY ROUTES
```

#### Components to DELETE:
```
🗑️  /src/guards/DeliveryGuard.tsx

✏️  /src/guards/index.ts
    Remove: export { default as DeliveryGuard } from './DeliveryGuard';
```

#### Types to UPDATE:
```
✏️  /src/slices/auth-slice.ts
    
    // BEFORE
    role?: 'admin' | 'seller' | 'customer' | 'delivery';
    
    // AFTER
    role?: 'admin' | 'seller' | 'customer';
    // Removed 'delivery'
```

#### Admin Panel to UPDATE:
```
🗑️  /src/pages/admin/AdminDeliveryApprovalsPage.tsx

✏️  /src/routes/index.tsx
    Remove: {
      path: '/admin/delivery/pending',
      ...
    }

✏️  /src/pages/admin/AdminLayout.tsx
    Remove: Delivery menu item from sidebar
```

#### API Services to UPDATE:
```
✏️  /src/services/backend-api.d.ts
    
    // REMOVE these interfaces:
    export interface DeliveryAPI { ... }
    export interface CourierAPI { ... }
    
    // REMOVE these exports:
    export const deliveryAPI: DeliveryAPI;
    export const courierAPI: CourierAPI;
    
    // ADD these (for integration):
    export interface OrderIntegrationAPI {
      assignCourier: (orderId: string, data: {...}) => Promise<...>;
      updateOrderStatus: (orderId: string, data: {...}) => Promise<...>;
    }
```

#### Navbar to UPDATE:
```
✏️  /src/components/navbar/index.tsx
    
    // Remove any links/menu items for delivery
    // If navbar shows "Delivery Dashboard" or similar → remove
```

---

## 🆕 PHASE 2: CREATE NEW DELIVERY SYSTEM

### 2.1 Backend Project Structure

```
delivery-backend/                    (NEW PROJECT)
├── config/
│   ├── database.js                  (separate DB config)
│   ├── env.js
│   └── constants.js
├── controllers/
│   ├── authController.js            (delivery auth only)
│   ├── deliveryController.js        (dashboard, profile)
│   ├── ordersController.js          (fetch from main API)
│   └── mainSystemAPI.js             (call main system)
├── middleware/
│   ├── auth.js                      (delivery JWT verification)
│   ├── validation.js
│   ├── errorHandler.js
│   └── apiKeyAuth.js                (service-to-service)
├── routes/
│   ├── authRoutes.js                (register, login)
│   ├── deliveryRoutes.js            (profile, orders)
│   ├── ordersRoutes.js              (claim, update status)
│   └── index.js
├── services/
│   ├── authService.js               (token generation)
│   ├── deliveryService.js           (business logic)
│   ├── mainSystemAPI.js             (call main backend)
│   └── emailService.js              (send notifications)
├── migrations/
│   ├── schema.sql                   (delivery_db tables)
│   └── seed.sql
├── models/
│   ├── User.js                      (delivery user)
│   ├── DeliveryAssignment.js
│   └── DeliveryTracking.js
├── utils/
│   ├── logger.js
│   └── validators.js
├── app.js
├── server.js
├── .env                             (SEPARATE from main)
├── package.json
└── README.md
```

**Tables needed in `qino_delivery_db`:**

```sql
-- Delivery Users (independent from main system)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  phone_verified BOOLEAN DEFAULT false,
  approved_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Documents
CREATE TABLE delivery_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(50),
  license_expiry DATE,
  vehicle_registration VARCHAR(50),
  insurance_expiry DATE,
  document_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link orders from main system to delivery personnel
CREATE TABLE delivery_assignments (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,  -- Reference to main_db.orders.id
  user_id INTEGER NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'assigned'  -- assigned, in_progress, completed, cancelled
);

-- Tracking status changes
CREATE TABLE delivery_tracking (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES delivery_assignments(id),
  status VARCHAR(50) NOT NULL,  -- picking_up, in_delivery, delivered
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ratings by customers
CREATE TABLE delivery_ratings (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Environment variables (`.env`):**
```env
# Delivery Backend
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:5432/qino_delivery_db
JWT_SECRET=delivery_secret_key_different_from_main
JWT_EXPIRY=7d

# Main System Integration (for reading orders)
MAIN_SYSTEM_API_URL=https://api.qino.com
MAIN_SYSTEM_API_KEY=delivery_service_api_key_from_main

# Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@qino.com
SMTP_PASS=...

# CORS
ALLOWED_ORIGINS=https://delivery.qino.com,http://localhost:3000

# Logging
LOG_LEVEL=info
```

### 2.2 Frontend Project Structure

```
delivery-webapp/                     (NEW PROJECT)
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── LogoutPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── orders/
│   │   │   ├── OrdersListPage.tsx
│   │   │   ├── OrderDetailPage.tsx
│   │   │   └── OrderStatusUpdatePage.tsx
│   │   ├── profile/
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── EditProfilePage.tsx
│   │   │   ├── DocumentsPage.tsx
│   │   │   └── EarningsPage.tsx
│   │   └── index.ts
│   ├── components/
│   │   ├── navbar/
│   │   ├── sidebar/
│   │   ├── order-card/
│   │   ├── status-update-form/
│   │   └── map/                     (delivery tracking map)
│   ├── services/
│   │   ├── deliveryAPI.js           (call delivery-backend)
│   │   ├── mainSystemAPI.js         (read-only: orders info)
│   │   └── mapService.js            (Google Maps)
│   ├── slices/                      (Redux)
│   │   ├── authSlice.ts
│   │   ├── ordersSlice.ts
│   │   └── profileSlice.ts
│   ├── guards/
│   │   ├── AuthGuard.tsx
│   │   └── GuestGuard.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── layouts/
│   │   ├── MainLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── config/
│   │   └── constants.ts
│   ├── hooks/
│   └── App.tsx
├── public/
├── .env                             (DIFFERENT API_URL from main)
├── vite.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Routes:**
```
/auth/login              (public)
/auth/register           (public)
/auth/logout             (public)
/dashboard               (protected: authenticated delivery)
/orders                  (protected)
/orders/:id              (protected)
/orders/:id/status       (protected - update form)
/profile                 (protected)
/profile/edit            (protected)
/profile/documents       (protected)
/earnings                (protected)
/401                     (error)
/500                     (error)
```

**Dependencies (package.json):**
```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.12.0",
    "axios": "^1.15.0",
    "@reduxjs/toolkit": "^2.11.2",
    "react-redux": "^9.2.0",
    "@react-google-maps/api": "^2.20.8",
    "react-leaflet": "^5.0.0",
    "formik": "^2.4.9",
    "yup": "^1.7.1"
  }
}
```

---

## 🔗 PHASE 3: INTEGRATION ARCHITECTURE

### API Contract Between Systems

#### 1. Main System → Delivery System (READ)
```
GET https://delivery.qino.com/api/orders?status=waiting_driver
Authorization: Bearer MAIN_SYSTEM_TOKEN
Accept: application/json

Response:
{
  "data": [
    {
      "id": "ORD-001",
      "customer_name": "สมชาย",
      "address": "123 ถนนสุขุมวิท...",
      "items": [
        { "name": "แอปเปิ้ล", "qty": 3, "weight": 1.5 }
      ],
      "total": 350,
      "created_at": "2026-05-09T10:00:00Z"
    }
  ]
}
```

#### 2. Delivery System → Main System (READ ONLY)
```
GET https://api.qino.com/api/orders/ORD-001
Authorization: Bearer DELIVERY_API_KEY
Accept: application/json

Response:
{
  "id": "ORD-001",
  "customer": {
    "name": "สมชาย",
    "phone": "0812345678",
    "address": "123 ถนนสุขุมวิท..."
  },
  "items": [...],
  "status": "waiting_driver",
  "total": 350
}
```

#### 3. Delivery System → Main System (UPDATE)
```
PATCH https://api.qino.com/api/orders/ORD-001/status
Authorization: Bearer DELIVERY_API_KEY
Content-Type: application/json

Body:
{
  "status": "in_delivery",
  "timestamp": "2026-05-09T10:30:00Z",
  "delivered_by": "delivery-person@qino.com",
  "notes": "On the way",
  "current_location": {
    "lat": 13.7563,
    "lng": 100.5018
  }
}

Response:
{
  "success": true,
  "data": { "status": "in_delivery", "updated_at": "..." }
}
```

#### 4. Main System → Delivery System (ASSIGN)
```
POST https://delivery.qino.com/api/orders/ORD-001/assign-courier
Authorization: Bearer MAIN_SYSTEM_TOKEN
Content-Type: application/json

Body:
{
  "delivery_person_id": "dp-123@delivery.qino.com",
  "estimated_time": "30 mins"
}

Response:
{
  "success": true,
  "data": {
    "assignment_id": "ASSIGN-001",
    "order_id": "ORD-001",
    "assigned_at": "2026-05-09T10:35:00Z"
  }
}
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      MAIN SYSTEM                                 │
│  (Buyer + Seller)                                                │
│                                                                  │
│  Frontend: qino.com                                              │
│  Backend: api.qino.com                                           │
│  Database: qino_fruit_store                                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Orders Table                                             │  │
│  │ - id, user_id, status, total                             │  │
│  │ - courier_id_ref (VARCHAR - delivery email)              │  │
│  │ - delivery_status_sync_at (last sync time)               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                          ↑↓ REST API
           (GET /orders, PATCH /orders/:id/status)

┌─────────────────────────────────────────────────────────────────┐
│                    DELIVERY SYSTEM                               │
│  (Delivery Personnel Only)                                       │
│                                                                  │
│  Frontend: delivery.qino.com                                     │
│  Backend: delivery-api.qino.com                                  │
│  Database: qino_delivery_db                                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Delivery Users, Assignments, Tracking                    │  │
│  │ - users (independent, separate JWT)                      │  │
│  │ - delivery_assignments (order_id → user_id)              │  │
│  │ - delivery_tracking (real-time location)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Error Handling & Retry Strategy

```javascript
// Delivery Backend calls Main System
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1s, 2s, 4s exponential

async function updateOrderStatus(orderId, status) {
  let lastError;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios.patch(
        `${MAIN_API_URL}/orders/${orderId}/status`,
        { status, timestamp: new Date() },
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );
      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed: log to event log for manual reconciliation
  await logEventFailure(orderId, status, lastError);
  throw lastError;
}
```

---

## ⚠️ PHASE 4: RISKS & MITIGATIONS

### Risk Matrix

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|-----------|
| Delivery system down, orders can't be assigned | 🔴 HIGH | 🔴 HIGH | Health check + fallback queue |
| Database ID conflicts (courier_id mismatch) | 🔴 HIGH | 🟡 MEDIUM | Use UUID or email instead |
| Data loss during migration | 🔴 HIGH | 🟢 LOW | Backup + test on staging |
| Auth token issues (wrong secret) | 🟡 MEDIUM | 🟢 LOW | Different JWT secrets + docs |
| Order status out-of-sync | 🟡 MEDIUM | 🟡 MEDIUM | Event log + reconciliation job |
| Old clients calling /delivery/* | 🟡 MEDIUM | 🟡 MEDIUM | 301 redirects or 410 responses |
| CORS issues | 🟡 MEDIUM | 🟢 LOW | Proper CORS config + testing |

### Detailed Mitigations

#### 1️⃣ Courier ID Reference Strategy

**Problem:** How to safely reference delivery person in main system?

**Solution:** Use email instead of numeric ID
```sql
-- Main System (qino_fruit_store)
ALTER TABLE orders 
ADD COLUMN courier_email VARCHAR(255) REFERENCES delivery_db.users(email);
-- OR: Use a view from delivery_db

-- Alternative: Use UUID
ALTER TABLE orders 
ADD COLUMN courier_uuid UUID;
-- Delivery system generates UUIDs (not SERIAL)
```

#### 2️⃣ API Key Management

**Problem:** How to secure service-to-service calls?

**Solution:** Use API keys for integration
```javascript
// Main Backend
const DELIVERY_SYSTEM_API_KEY = process.env.DELIVERY_SYSTEM_API_KEY;

// Call Delivery System
axios.patch(
  `${DELIVERY_API_URL}/orders/${id}/status`,
  { status },
  { 
    headers: { 
      'X-API-Key': DELIVERY_SYSTEM_API_KEY,
      'X-Request-ID': generateRequestId()
    } 
  }
);

// Delivery Backend validates
middleware.apiKeyAuth = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== process.env.MAIN_SYSTEM_API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  next();
};
```

#### 3️⃣ Event Log for Reconciliation

**Problem:** What if update fails half-way?

**Solution:** Event sourcing pattern
```sql
-- Both systems maintain event log
CREATE TABLE order_events (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  event_type VARCHAR(50),  -- 'status_updated', 'courier_assigned'
  old_value TEXT,
  new_value TEXT,
  source_system VARCHAR(20),  -- 'main' or 'delivery'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP  -- NULL = not synced yet
);

-- Reconciliation job (hourly)
SELECT * FROM order_events 
WHERE synced_at IS NULL AND created_at < NOW() - INTERVAL '5 minutes'
ORDER BY created_at;
-- Retry syncing these events
```

#### 4️⃣ Health Check Endpoints

**Main System:**
```
GET /api/health
Response: { status: "healthy", timestamp: "..." }
```

**Delivery System:**
```
GET /api/health
Response: { status: "healthy", db: "connected", timestamp: "..." }
```

Delivery system checks main system health before assigning orders:
```javascript
const isMainSystemHealthy = await checkMainSystemHealth();
if (!isMainSystemHealthy) {
  // Queue order assignment for retry
  await queueOrderForRetry(orderId);
}
```

#### 5️⃣ Backward Compatibility

**Option A: Redirect (Recommended)**
```javascript
// Main system routes
app.get('/api/delivery/*', (req, res) => {
  res.status(301).json({
    message: 'Delivery system moved',
    new_url: `https://delivery.qino.com${req.originalUrl}`,
    instructions: 'Go to https://delivery.qino.com to continue'
  });
});
```

**Option B: Deprecation Warning**
```javascript
app.get('/api/delivery/*', (req, res) => {
  res.set('Deprecation', 'true');
  res.set('Sunset', 'Sun, 31 Dec 2025 23:59:59 GMT');
  res.set('Link', '<https://delivery.qino.com/api/...>; rel="successor-version"');
  
  // Still work for 2-3 versions
  next();
});
```

---

## 📋 SUMMARY CHECKLIST

### Phase 1: Main System (Weeks 1-2)

#### Database
- [ ] Create and test migration file
- [ ] Archive delivery_registrations table
- [ ] Update users table constraint (remove 'delivery' role)
- [ ] Add courier_email or courier_uuid column to orders

#### Backend
- [ ] Remove deliveryRoutes.js from router
- [ ] Remove deliveryRegistrationController.js
- [ ] Remove admin delivery approval endpoints
- [ ] Add 3 new integration endpoints:
  - [ ] POST /api/orders/:id/assign-courier
  - [ ] PATCH /api/orders/:id/status
  - [ ] GET /api/orders?status=waiting_driver
- [ ] Setup API key auth middleware
- [ ] Create API key for delivery system
- [ ] Add event logging for order status changes
- [ ] Test APIs on staging
- [ ] Update API documentation

#### Frontend
- [ ] Delete /src/pages/delivery/
- [ ] Delete /src/components/delivery/
- [ ] Delete /src/components/delivery-registration/ (but keep seller registration!)
- [ ] Delete /src/guards/DeliveryGuard.tsx
- [ ] Remove all /delivery/* routes from router
- [ ] Remove delivery pages imports
- [ ] Update User type (remove 'delivery' role)
- [ ] Update auth-slice.ts
- [ ] Remove AdminDeliveryApprovalsPage.tsx
- [ ] Remove /admin/delivery/pending route
- [ ] Update navbar (remove delivery links)
- [ ] Update backend-api.d.ts (remove DeliveryAPI, CourierAPI)
- [ ] Test on staging
- [ ] Run linter, fix imports

### Phase 2: Delivery System (Weeks 2-3)

#### Setup
- [ ] Create new Node.js project: delivery-backend
- [ ] Create new React project: delivery-webapp
- [ ] Setup new database: qino_delivery_db
- [ ] Create database schema (migrations)
- [ ] Configure environment variables

#### Delivery Backend
- [ ] Setup Express app structure
- [ ] Create auth endpoints (register, login)
- [ ] Create delivery profile endpoints
- [ ] Create orders endpoints (list, detail, status update)
- [ ] Integrate with main system API (read-only)
- [ ] Setup JWT auth (different secret)
- [ ] Setup API key auth for main system calls
- [ ] Create health check endpoint
- [ ] Setup logging, error handling
- [ ] Create API documentation
- [ ] Deploy to staging
- [ ] Test all endpoints

#### Delivery Frontend
- [ ] Setup React app structure
- [ ] Create auth pages (login, register)
- [ ] Create dashboard page
- [ ] Create orders list page
- [ ] Create order detail page
- [ ] Create status update form
- [ ] Create profile pages
- [ ] Setup Redux slices
- [ ] Connect to delivery-backend API
- [ ] Add Google Maps integration (optional)
- [ ] Create responsive design
- [ ] Deploy to staging
- [ ] Test user flows

### Phase 3: Integration & Testing (Week 4)

- [ ] Test main → delivery API calls
- [ ] Test delivery → main API calls
- [ ] Test failure scenarios (one system down)
- [ ] Test data consistency
- [ ] Load testing (simulate 100+ concurrent users)
- [ ] Security testing (invalid tokens, API keys)
- [ ] Database transaction testing
- [ ] Rollback procedure testing
- [ ] Document all test results

### Phase 4: Migration & Deployment (Week 5)

#### Migration Strategy for Existing Delivery Accounts
- [ ] Decision: Keep vs Delete vs Archive
- [ ] Prepare notification email/SMS template
- [ ] Create migration script (if needed)
- [ ] Backup database
- [ ] Test migration on staging

#### Pre-Production
- [ ] Final code review
- [ ] Update documentation
- [ ] Create runbooks for ops team
- [ ] Setup monitoring/alerting
- [ ] Prepare communication to users

#### Deployment Order (Critical!)
1. [ ] Deploy delivery-backend to production
2. [ ] Verify deployment
3. [ ] Deploy delivery-frontend to production
4. [ ] Run smoke tests
5. [ ] Verify database connectivity
6. [ ] Run integration tests
7. [ ] **Main system deployment** (at different time)
   - [ ] Deploy main backend changes
   - [ ] Verify /delivery/* routes return 301 redirect
   - [ ] Deploy main frontend changes
8. [ ] Monitor logs and errors
9. [ ] Send notification to users
10. [ ] Monitor order flow (24-48 hours)

### Phase 5: Post-Deployment (Week 6+)

- [ ] Monitor both systems (24/7 for 1 week)
- [ ] Watch for errors in logs
- [ ] Monitor API response times
- [ ] Monitor database performance
- [ ] Gather user feedback
- [ ] Address critical issues (hotfix)
- [ ] Plan for non-critical improvements
- [ ] Archive old delivery data (after 3 months)
- [ ] Deprecate old /delivery/* endpoints (gradual, 3 months)

---

## 📞 Risks to Brief Stakeholders

### For Business
- ⏱️ **Timeline**: 5-6 weeks total
- 💰 **Cost**: New server/DB + development effort
- 📊 **Impact**: Minimal to users (new URL for delivery)
- ⚠️ **Risk**: If not done properly, delivery assignments break

### For Delivery Personnel
- 🆕 New login: https://delivery.qino.com
- 📧 Email notification: "Your account has moved"
- 🔑 Password reset: New password needed (or auto-generated)
- ⏰ Transition period: 2 weeks to migrate

### For Sellers
- ✅ No change needed
- 💚 Order status still visible (synced via API)
- 🚚 Can see delivery person assigned

### For Buyers
- ✅ No change needed
- 📍 Delivery tracking still works

---

## 🎯 Next Steps

1. **Approve this analysis** ✅
2. **Get stakeholder buy-in** (business, ops, dev team)
3. **Assign developers** to each component
4. **Start Phase 1** (main system cleanup)
5. **Weekly sync** to track progress
6. **Staging testing** before production

**Questions to clarify:**
- [ ] Use same database server or different servers?
- [ ] Same domain (api.qino.com) or separate domain (delivery-api.qino.com)?
- [ ] Keep admin panel unified or separate?
- [ ] Do existing delivery accounts migrate or reset?
- [ ] Timeline flexible? Can be 6-8 weeks instead of 5?

