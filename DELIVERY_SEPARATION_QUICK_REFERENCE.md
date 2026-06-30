# QUICK REFERENCE: Delivery System Separation

## 🎯 HIGH-LEVEL OVERVIEW

```
CURRENT STATE                    →    TARGET STATE

Main System (1 repo)                  Main System (1 repo)
├─ Frontend: React                    ├─ Frontend: React
├─ Backend: Node.js                   ├─ Backend: Node.js  
├─ Database:                          ├─ Database:
│  ├─ users (with delivery role)     │  ├─ users (buyer + seller only)
│  ├─ delivery_registrations        │  ├─ orders (with courier_email)
│  └─ orders (courier_id)            │  └─ ...
├─ Roles: buyer, seller, delivery    └─ Roles: buyer, seller
└─ Routes: /delivery/*                 Routes: /delivery/* → 301 redirect
                                 +
                          Delivery System (NEW)
                          ├─ Frontend: React
                          ├─ Backend: Node.js
                          ├─ Database: delivery_db
                          ├─ Users: delivery personnel only
                          ├─ Domain: delivery.qino.com
                          └─ Auth: separate JWT
                                 ↕️ REST API Integration
```

---

## 📊 FILE DELETION CHECKLIST (Main System)

### Backend
```
🗑️  /backend/routes/deliveryRoutes.js
🗑️  /backend/controllers/deliveryRegistrationController.js
✏️  /backend/routes/index.js (remove deliveryRoutes import)
✏️  /backend/controllers/adminController.js (remove delivery approval logic)
✏️  /backend/migrations/ (add new migration for schema changes)
```

### Frontend - React
```
🗑️  /src/pages/delivery/
    ├─ DeliverySignupPage.tsx
    ├─ CourierDashboardPage.tsx
    ├─ CourierEditProfilePage.tsx
    ├─ CourierChangePasswordPage.tsx
    ├─ CourierBankPage.tsx
    └─ CourierNotificationsPage.tsx

🗑️  /src/components/delivery/
    └─ (all files)

🗑️  /src/components/delivery-registration/
    ├─ DeliveryRegistrationForm.tsx  ⚠️ KEEP seller registration!
    └─ (delete delivery-specific only)

🗑️  /src/guards/DeliveryGuard.tsx

🗑️  /src/pages/admin/AdminDeliveryApprovalsPage.tsx

✏️  /src/routes/index.tsx
    (remove ~30 lines of delivery routes)

✏️  /src/guards/index.ts
    (remove DeliveryGuard export)

✏️  /src/slices/auth-slice.ts
    (remove 'delivery' from role type)

✏️  /src/services/backend-api.d.ts
    (remove DeliveryAPI, CourierAPI interfaces)
```

---

## 🗂️ FILE MODIFICATION CHECKLIST (Main System)

### Routes
```typescript
// ❌ DELETE: /delivery/register, /delivery/dashboard, /delivery/profile/*
// ❌ DELETE: /admin/delivery/pending
// ✅ KEEP: /seller/* (seller routes)
// ✅ KEEP: /orders/* (buyer order routes)
```

### Types & Interfaces
```typescript
// BEFORE
role?: 'admin' | 'seller' | 'customer' | 'delivery'

// AFTER
role?: 'admin' | 'seller' | 'customer'
```

### API Endpoints
```
❌ POST   /api/delivery/register/step1
❌ POST   /api/delivery/register/step2
❌ POST   /api/delivery/register/verify-otp
❌ POST   /api/delivery/register/submit
❌ GET    /api/admin/delivery/registrations
❌ POST   /api/admin/delivery/approve/:id

✅ NEW   POST   /api/orders/:id/assign-courier
✅ NEW   GET    /api/orders?status=waiting_driver
✅ NEW   PATCH  /api/orders/:id/status
✅ NEW   GET    /api/orders/:id/delivery-info
```

### Database
```sql
-- ❌ DELETE
DROP TABLE delivery_registrations;

-- ✏️ MODIFY
ALTER TABLE users 
  DROP CONSTRAINT check_role;
ALTER TABLE users 
  ADD CONSTRAINT check_role 
  CHECK (role IN ('customer', 'seller', 'admin'));
  -- Removed 'delivery'

-- ✅ KEEP
ALTER TABLE orders ADD COLUMN courier_email VARCHAR(255);
-- OR: courier_uuid UUID
```

---

## 🆕 FILES TO CREATE (New Delivery System)

### Backend Project
```
delivery-backend/
├─ controllers/
│  ├─ authController.js ......................... Auth (register, login)
│  ├─ deliveryController.js ..................... Profile, documents
│  └─ ordersController.js ....................... Fetch, assign, status
├─ middleware/
│  ├─ auth.js ................................... JWT verification
│  └─ apiKeyAuth.js ............................. Service-to-service
├─ routes/
│  ├─ authRoutes.js ............................. /auth/*
│  ├─ deliveryRoutes.js ......................... /delivery/*
│  └─ ordersRoutes.js ........................... /orders/*
├─ services/
│  ├─ authService.js ............................ Token generation
│  ├─ mainSystemAPI.js .......................... Call main backend
│  └─ deliveryService.js ........................ Business logic
├─ models/
│  ├─ User.js ................................... Delivery user
│  └─ DeliveryAssignment.js ..................... Order assignments
├─ migrations/
│  └─ schema.sql ................................ Create delivery_db tables
├─ server.js .................................... Entry point
└─ .env ......................................... Config (SEPARATE)
```

### Frontend Project
```
delivery-webapp/
├─ pages/
│  ├─ auth/ ...................................... Login, register
│  ├─ dashboard/ ................................. Main dashboard
│  ├─ orders/ .................................... List, detail, update
│  └─ profile/ ................................... Edit, documents
├─ components/
│  ├─ navbar/ .................................... Navigation
│  └─ order-card/ ............................... Order display
├─ services/
│  ├─ deliveryAPI.js ............................ Call delivery-backend
│  └─ mainSystemAPI.js .......................... Read orders from main
├─ guards/
│  ├─ AuthGuard.tsx ............................. Login check
│  └─ GuestGuard.tsx ............................ Redirect if logged in
├─ slices/ ....................................... Redux state
├─ routes/index.tsx ............................. Route definitions
└─ .env ......................................... Config (DIFFERENT API_URL)
```

### Database
```sql
-- New database: qino_delivery_db

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE,
  phone VARCHAR UNIQUE,
  password_hash VARCHAR,
  is_approved BOOLEAN,
  approved_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE delivery_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  license_number VARCHAR,
  vehicle_registration VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE delivery_assignments (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50),  -- from main system
  user_id INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP
);

CREATE TABLE delivery_tracking (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES delivery_assignments(id),
  status VARCHAR,  -- picking_up, in_delivery, delivered
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMP
);
```

---

## 🔗 INTEGRATION API ENDPOINTS

### Calls FROM Delivery TO Main System
```
GET  /api/orders?status=waiting_driver
     └─> Fetch available orders

GET  /api/orders/:id
     └─> Get order details

PATCH /api/orders/:id/status
     └─> Update delivery status
     Body: { status: "in_delivery"|"delivered", timestamp, notes }
```

### Calls FROM Main TO Delivery System
```
POST /api/orders/:id/assign-courier
     Body: { delivery_person_id: "email@delivery.qino.com" }

GET  /api/orders/:id/delivery-info
     └─> Get current delivery status
```

### Authentication
```
Main System       → Delivery System:  X-API-Key header
Delivery System   → Main System:      X-API-Key header
Users            → Either System:    Bearer JWT token (different secrets!)
```

---

## ⚠️ CRITICAL DECISIONS TO MAKE

| Question | Option A | Option B |
|----------|----------|----------|
| **Database Location** | Same server, different DB | Different server |
| **Domain** | delivery.qino.com | api-delivery.qino.com |
| **Courier Reference** | Use email (string) | Use UUID |
| **Existing Delivery Accounts** | Delete/disable | Auto-migrate |
| **Admin Panel** | Keep unified | Separate |
| **Timeline** | 5-6 weeks | 8-10 weeks |

---

## 📅 TIMELINE BREAKDOWN

```
Week 1-2: MAIN SYSTEM CLEANUP
├─ Database migration
├─ Backend route removal
├─ Frontend cleanup
└─ Testing on staging

Week 2-3: NEW DELIVERY SYSTEM BUILD
├─ Backend project setup
├─ Frontend project setup
├─ Database schema
└─ Integration APIs

Week 4: INTEGRATION & TESTING
├─ End-to-end tests
├─ Load testing
├─ Security testing
└─ Documentation

Week 5: PRODUCTION DEPLOYMENT
├─ Deploy delivery backend
├─ Deploy delivery frontend
├─ Deploy main system changes
└─ Monitor 24/7

Week 6+: STABILIZATION
├─ Bug fixes
├─ Performance tuning
├─ User onboarding
└─ Post-mortem
```

---

## ❌ COMMON PITFALLS TO AVOID

| Pitfall | Problem | Prevention |
|---------|---------|-----------|
| Using numeric IDs across databases | Courier ID 5 in main ≠ user 5 in delivery | Use UUID or email |
| No event log | Order status gets out of sync | Implement event sourcing |
| Same JWT secret | Security breach | Use different secrets |
| No API retry logic | One network hiccup breaks everything | Add exponential backoff |
| Incomplete migration | Old delivery data lost | Backup and archive first |
| No monitoring | Can't detect failures in prod | Setup alerts and dashboards |
| Tight coupling | One system down breaks other | Async messaging/queues |

---

## ✅ SUCCESS CRITERIA

- [ ] All /delivery/* routes removed from main system
- [ ] Delivery backend deployed and accessible
- [ ] Delivery frontend deployed and accessible
- [ ] Orders can be assigned to delivery personnel
- [ ] Delivery status updates sync to main system
- [ ] No data loss during migration
- [ ] Both systems can handle 100+ concurrent users
- [ ] All API calls retry on failure
- [ ] Monitoring alerts setup and working
- [ ] Documentation complete
- [ ] Stakeholders trained
- [ ] Zero-downtime deployment achieved

---

## 📞 WHO NEEDS TO DO WHAT

| Role | Tasks |
|------|-------|
| **Backend Dev** | Remove delivery endpoints, add integration APIs, setup delivery-backend |
| **Frontend Dev** | Delete delivery pages, create delivery webapp, setup integration |
| **DBA** | Run migrations, create new database, setup replication/backup |
| **DevOps** | Setup new server, configure CORS, setup monitoring, manage domains |
| **QA** | Test all removed functionality, test new APIs, load testing |
| **PM** | Plan timeline, communicate to stakeholders, manage risks |
| **Security** | Review API auth, audit JWT/API keys, check for vulnerabilities |

---

## 📚 DOCUMENTATION NEEDED

- [ ] API documentation for integration endpoints
- [ ] Database schema documentation
- [ ] Environment variables guide
- [ ] Deployment runbook
- [ ] Rollback procedure
- [ ] Monitoring dashboard setup
- [ ] User onboarding guide (for delivery personnel)
- [ ] Troubleshooting guide

