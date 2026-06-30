# 🚀 QINO Fruit Store - Quick Start & Deployment Guide

**Status:** ✅ All Systems Ready  
**Date:** April 14, 2026  

---

## ⚡ QUICK START (5 minutes)

### Prerequisites
- Node.js v14+ installed
- PostgreSQL 12+ running
- npm or yarn

### Step 1: Backend Setup

```bash
# Navigate to backend
cd C:\Users\palap\backend

# Install dependencies
npm install

# Create .env file (copy from example)
cp .env.example .env

# Edit .env with your settings:
# NODE_ENV=development
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=qino_fruit_store
# DB_USER=postgres
# DB_PASSWORD=your_password
# CLIENT_URL=http://localhost:3000
# PORT=5000
```

### Step 2: Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE qino_fruit_store;

# Exit psql
\q

# Run migrations
psql -U postgres -d qino_fruit_store -f C:\Users\palap\backend\migrations\schema.sql

# Seed sample data (optional)
psql -U postgres -d qino_fruit_store -f C:\Users\palap\backend\migrations\sample-data.sql
```

### Step 3: Start Backend

```bash
# From backend directory
npm run dev

# Expected output:
# ╔════════════════════════════════════════╗
# ║   QINO Fruit Store Backend Server      ║
# ╚════════════════════════════════════════╝
#
# ✅ Server running on: http://localhost:5000
# ✅ Client URL: http://localhost:3000
```

### Step 4: Frontend Setup

```bash
# Navigate to frontend
cd D:\mongkol\qino-template-fruit-store

# Install dependencies
npm install

# Create/update .env
# VITE_API_URL=http://localhost:5000/api
# VITE_ENVIRONMENT=development

# Start development server
npm run dev

# Frontend will open at http://localhost:5173 (or similar)
```

### Step 5: Test Connection

```bash
# Test backend health
curl http://localhost:5000/api/health

# Expected response:
# {"status":"OK","timestamp":"2026-04-14T..."}
```

---

## 🧪 COMPREHENSIVE TESTING GUIDE

### Test Suite 1: Authentication (5 tests)

#### Test 1.1: User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "phone": "0987654321",
    "password": "Password@123",
    "firstName": "Test",
    "lastName": "User",
    "role": "customer"
  }'

# Expected: 201 Created
# Response includes: token, user object with token
```

#### Test 1.2: User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Password@123"
  }'

# Expected: 200 OK
# Response: { token, user data }
# Save token for subsequent requests: TOKEN=<your_token_here>
```

#### Test 1.3: Get Profile

```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: User profile with all fields
```

#### Test 1.4: Update Profile

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "UpdatedName",
    "province": "Bangkok",
    "address": "123 Main Street",
    "postalCode": "10110"
  }'

# Expected: 200 OK
# Response: Updated user profile
```

#### Test 1.5: Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: { success: true }
```

---

### Test Suite 2: Products (6 tests)

#### Test 2.1: Get All Products

```bash
# Without parameters
curl "http://localhost:5000/api/products"

# With pagination and sorting
curl "http://localhost:5000/api/products?page=0&limit=20&sort=price_asc"

# With search
curl "http://localhost:5000/api/products?search=mango"

# With category
curl "http://localhost:5000/api/products?category_id=1"

# Expected: 200 OK
# Response: {
#   data: [
#     { id, name, price, images, rating, reviews_count, shop_id, ... }
#   ],
#   pagination: { page, limit }
# }
```

#### Test 2.2: Get Single Product

```bash
curl "http://localhost:5000/api/products/1"

# Expected: 200 OK
# Response: { data: { ...complete product details } }
```

#### Test 2.3: Search Products

```bash
curl "http://localhost:5000/api/products/search?q=apple&category_id=1"

# Expected: 200 OK
# Response: { data: [...products matching search] }
```

#### Test 2.4: Get Categories

```bash
curl "http://localhost:5000/api/categories"

# Expected: 200 OK
# Response: { data: [{ id, name, description }, ...] }
```

#### Test 2.5: Create Product (Seller Only)

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Mango",
    "price": 150,
    "original_price": 200,
    "description": "Sweet and fresh mango",
    "category_id": 1,
    "images": ["url1", "url2"],
    "stock": 100
  }'

# Expected: 201 Created
# Response: { message, data: { id, ...product } }
```

#### Test 2.6: Test Product Sorting

```bash
# Test different sort options
curl "http://localhost:5000/api/products?sort=price_asc"
curl "http://localhost:5000/api/products?sort=price_desc"
curl "http://localhost:5000/api/products?sort=rating"
curl "http://localhost:5000/api/products?sort=newest"

# Verify sorting works correctly for each option
# Response should be ordered according to sort parameter
```

---

### Test Suite 3: Cart Operations (6 tests)

#### Test 3.1: Add to Cart

```bash
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 2,
    "weight": 1
  }'

# Expected: 201 Created
# Response: { success, data: [transformed_cart_items] }
# Verify camelCase format: id, name, price, qty, shopId, shopName, weight
```

#### Test 3.2: Get Cart

```bash
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: {
#   success: true,
#   data: {
#     items: [
#       { id, name, price, qty, shopId, shopName, weight, ... }
#     ],
#     summary: { ... }
#   }
# }
# Verify response format matches frontend expectations
```

#### Test 3.3: Update Cart Item

```bash
curl -X PUT http://localhost:5000/api/cart/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "weight": 1
  }'

# Expected: 200 OK
# Response: { success, data: [updated_cart_items] }
```

#### Test 3.4: Remove from Cart

```bash
curl -X DELETE http://localhost:5000/api/cart/1 \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: { success, data: [remaining_cart_items] }
```

#### Test 3.5: Cart Item Format Validation

```bash
# After adding and getting cart, verify response format:
# Each item should have:
# - id (string, product_id)
# - name (string, product_name)
# - price (number)
# - qty (number, quantity)
# - shopId (number, shop_id)
# - shopName (string, shop_name)
# - weight (number)
# - unit (string, always 'kg')
# - image (string, first image from images array)

# VERIFY NO snake_case IN RESPONSE
```

#### Test 3.6: Clear Cart

```bash
curl -X DELETE http://localhost:5000/api/cart \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: { success: true, message }
```

---

### Test Suite 4: Orders (8 tests)

#### Test 4.1: Create Order (COD)

```bash
# First, cart must have items
# Add items to cart using Test 3.1

curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "product_id": 1, "quantity": 2, "weight": 1 }
    ],
    "payment_method": "cod",
    "delivery_date": "2026-04-20",
    "delivery_slot": "morning",
    "recipient_name": "John Doe",
    "phone": "0987654321",
    "address_line": "123 Main Street",
    "province": "Bangkok",
    "postal_code": "10110",
    "shipping_fee": 50,
    "note": "Please deliver on time"
  }'

# Expected: 201 Created
# Response: { message, data: { 
#   id: "ORD_...",
#   status: "to_ship", ← CRITICAL: Must be "to_ship" for COD
#   payment_method: "cod",
#   items: [...],
#   itemsSubtotal: number,
#   shippingFee: 50,
#   grandTotal: number,
#   checkout: { ...checkout info... }
# }}
```

#### Test 4.2: Create Order (PromptPay)

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "product_id": 2, "quantity": 1, "weight": 1 }
    ],
    "payment_method": "promptpay",
    "delivery_date": "2026-04-21",
    "delivery_slot": "afternoon",
    "recipient_name": "Jane Smith",
    "phone": "0912345678",
    "address_line": "456 Oak Avenue",
    "province": "Bangkok",
    "postal_code": "10120",
    "shipping_fee": 50
  }'

# Expected: 201 Created
# Response: { message, data: { 
#   status: "unpaid", ← CRITICAL: Must be "unpaid" for PromptPay
#   payment_method: "promptpay",
#   ...other fields...
# }}
```

#### Test 4.3: Get User Orders

```bash
curl -X GET "http://localhost:5000/api/orders?page=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: {
#   data: [Order1, Order2, ...],
#   pagination: { page: 0, limit: 20 }
# }
```

#### Test 4.4: Get Single Order

```bash
ORDER_ID="ORD_..." # From Test 4.1 response

curl -X GET "http://localhost:5000/api/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: { data: { ...complete order with items and checkout info... } }
```

#### Test 4.5: Verify PromptPay Payment

```bash
curl -X POST "http://localhost:5000/api/orders/$PROMPTPAY_ORDER_ID/verify-payment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slip_image_base64": "data:image/png;base64,...",
    "paid_amount": 100
  }'

# Expected: 200 OK
# Response: { message, data: { 
#   status: "to_ship", ← Status changes from "unpaid" to "to_ship"
#   payment_status: "paid",
#   paid_at: timestamp,
#   ...
# }}
```

#### Test 4.6: Order Status Initial Value Test

```bash
# Create one COD and one PromptPay order
# Then verify initial status:

# COD Order:
# - Expected initial status: "to_ship"
# - Payment method: "cod"

# PromptPay Order:
# - Expected initial status: "unpaid"
# - Payment method: "promptpay"
# - After payment verification: "to_ship"

# This tests the critical initialization logic
```

#### Test 4.7: Cancel Order

```bash
curl -X POST "http://localhost:5000/api/orders/$ORDER_ID/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Changed my mind" }'

# Expected: 200 OK
# Response: { message, data: { status: "canceled", ... } }
```

#### Test 4.8: Create Claim

```bash
curl -X POST "http://localhost:5000/api/orders/$ORDER_ID/claim" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Product damaged",
    "note": "Box was crushed during delivery"
  }'

# Expected: 200 OK
# Response: { message, data: { claim: { status: "requested", ... } } }
```

---

### Test Suite 5: Reviews (5 tests)

#### Test 5.1: Submit Review

```bash
ORDER_ID="ORD_..." # Must be a delivered order

curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "'$ORDER_ID'",
    "product_id": 1,
    "rating": 5,
    "body": "Excellent quality and taste!",
    "quality_text": "Very fresh",
    "taste_text": "Sweet and juicy"
  }'

# Expected: 201 Created
# Response: { message, data: { id, rating, body, ... } }
```

#### Test 5.2: Get Product Reviews

```bash
curl "http://localhost:5000/api/products/1/reviews?page=0&limit=10"

# Expected: 200 OK
# Response: {
#   data: {
#     reviews: [Review1, Review2, ...],
#     average_rating: 4.5,
#     total_reviews: 8
#   }
# }
```

#### Test 5.3: Get Single Review

```bash
REVIEW_ID="..." # From Test 5.1 response

curl "http://localhost:5000/api/reviews/$REVIEW_ID"

# Expected: 200 OK
# Response: { data: { ...review details... } }
```

#### Test 5.4: Update Review

```bash
curl -X PUT "http://localhost:5000/api/reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "body": "Actually, it was good but delivery was slow"
  }'

# Expected: 200 OK
# Response: { message, data: { ...updated review... } }
```

#### Test 5.5: Delete Review

```bash
curl -X DELETE "http://localhost:5000/api/reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: { message, data: { success: true } }
```

---

### Test Suite 6: Shops & Follow (7 tests)

#### Test 6.1: Get Shop Info

```bash
curl "http://localhost:5000/api/shops/1"

# Expected: 200 OK
# Response: { data: { 
#   id, name, owner_name, description, logo,
#   followers_count, phone, address, province, rating
# }}
```

#### Test 6.2: Get Shop Products

```bash
curl "http://localhost:5000/api/shops/1/products?page=0&limit=20"

# Expected: 200 OK
# Response: { data: { products: [...], pagination: {...} } }
```

#### Test 6.3: Register Shop (Seller)

```bash
# Must use seller token from registration with role: 'seller'
SELLER_TOKEN="..."

curl -X POST http://localhost:5000/api/shops \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shop_name": "Fresh Fruits Store",
    "owner_name": "John Fruit",
    "phone": "0987654321",
    "promptpay_type": "phone",
    "promptpay_value": "0987654321",
    "address_line": "123 Fruit Market",
    "province": "Bangkok",
    "postal_code": "10110"
  }'

# Expected: 201 Created
# Response: { message, data: { shop_id, ...shop details... } }
```

#### Test 6.4: Follow Shop

```bash
curl -X POST "http://localhost:5000/api/shops/1/follow" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: { data: { following: true } }
```

#### Test 6.5: Get Followed Shops

```bash
curl "http://localhost:5000/api/followed-shops?page=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: { data: { shops: [...FollowedShop], pagination: {...} } }
```

#### Test 6.6: Unfollow Shop

```bash
curl -X DELETE "http://localhost:5000/api/shops/1/follow" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# Response: { data: { following: false } }
```

#### Test 6.7: Get Shop Rating

```bash
curl "http://localhost:5000/api/shops/1/rating"

# Expected: 200 OK
# Response: { data: { average_rating: 4.5, total_reviews: 15 } }
```

---

### Test Suite 7: Seller Dashboard (3 tests)

#### Test 7.1: Get Dashboard

```bash
curl "http://localhost:5000/api/seller/dashboard" \
  -H "Authorization: Bearer $SELLER_TOKEN"

# Expected: 200 OK
# Response: { data: {
#   total_sales: number,
#   total_revenue: number,
#   total_orders: number,
#   pending_orders: number,
#   summary_by_status: {
#     unpaid, paid, to_ship, shipping, delivered, canceled, claim
#   }
# }}
```

#### Test 7.2: Get Seller Statistics

```bash
curl "http://localhost:5000/api/seller/stats?date_from=2026-04-01&date_to=2026-04-30" \
  -H "Authorization: Bearer $SELLER_TOKEN"

# Expected: 200 OK
# Response: { data: { stats: [...daily/weekly/monthly stats...] } }
```

#### Test 7.3: Get Seller Orders

```bash
curl "http://localhost:5000/api/seller/orders?page=0&limit=20" \
  -H "Authorization: Bearer $SELLER_TOKEN"

# Expected: 200 OK
# Response: { data: { orders: [...], pagination: {...} } }
```

---

## ✅ Post-Test Validation Checklist

### Response Format Validation

- [ ] All responses follow structure: `{ success, message, data }`
- [ ] Cart items use camelCase: `id, name, price, qty, shopId, shopName, weight`
- [ ] No snake_case in cart responses
- [ ] User profile uses camelCase: `firstName, lastName, birthDate, postalCode, etc.`
- [ ] Timestamps use ISO format
- [ ] Numbers are properly typed (not strings)

### Data Integrity Checks

- [ ] Order initial status: COD→"to_ship", PromptPay→"unpaid"
- [ ] After payment: status changes to "to_ship"
- [ ] Cart totals calculated correctly
- [ ] Product sorting works with all options
- [ ] Pagination works correctly
- [ ] Shop followers count increments/decrements

### Error Handling

- [ ] 400 Bad Request for invalid input
- [ ] 401 Unauthorized for missing/invalid token
- [ ] 404 Not Found for non-existent resources
- [ ] 500 Server Error with meaningful message
- [ ] No sensitive data in error responses

---

## 📦 PRODUCTION DEPLOYMENT

### Backend Deployment (Windows Server)

```bash
# 1. Build Production Setup
npm install --production

# 2. Update .env for Production
NODE_ENV=production
DB_HOST=production-db-host
DB_NAME=qino_fruit_store
CLIENT_URL=https://your-frontend-domain.com
PORT=5000

# 3. Run Migrations (if needed)
psql -h production-db-host -U postgres -d qino_fruit_store -f migrations/schema.sql

# 4. Start with PM2 (recommended for production)
npm install -g pm2
pm2 start server.js --name "qino-backend"
pm2 save
pm2 startup

# 5. Setup Reverse Proxy (nginx/IIS)
# Configure to forward requests to localhost:5000
```

### Frontend Deployment

```bash
# 1. Build for Production
npm run build

# 2. Update environment for production
VITE_API_URL=https://your-backend-domain.com/api
VITE_ENVIRONMENT=production

# 3. Deploy dist/ folder to hosting
# - Netlify, Vercel, AWS S3 + CloudFront, etc.
```

### Database Backup

```bash
# Automated daily backup
pg_dump -U postgres qino_fruit_store > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres qino_fruit_store < backup_20260414.sql
```

---

## 🔐 Security Pre-Deployment Checklist

- [ ] Remove debug logs from controllers
- [ ] Enable HTTPS on frontend and backend
- [ ] Test CORS configuration with production URLs
- [ ] Verify JWT token expiry (7 days)
- [ ] Check password requirements (minimum 8 chars, mixed case, numbers)
- [ ] Enable rate limiting on auth endpoints
- [ ] Setup database backups
- [ ] Enable SQL query logging
- [ ] Setup error monitoring (Sentry, DataDog, etc.)
- [ ] A/B test with subset of users first

---

## 📊 Monitoring & Maintenance

### Log Files to Monitor

```bash
# Backend logs (with Winston or Morgan)
tail -f logs/error.log
tail -f logs/access.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql.log
```

### Performance Metrics

- API response time: < 200ms (typical)
- Database query time: < 50ms (typical)
- Cart operations: < 100ms
- Product search: < 500ms

### Health Checks

```bash
# Schedule health checks every 5 minutes
curl -f http://localhost:5000/api/health || send_alert
curl -f https://frontend-domain.com || send_alert
```

---

## 🆘 Troubleshooting Common Issues

### Issue: CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
```bash
# Check backend .env
CLIENT_URL=http://localhost:3000  # Must match frontend URL

# Restart backend
npm run dev
```

### Issue: JWT Token Invalid

**Error:** `401 Unauthorized - Invalid or expired token`

**Solution:**
- Clear browser cookies/localStorage
- Re-login to get fresh token
- Check token expiry (7 days default)

### Issue: Cart Items Wrong Format

**Error:** Backend returns snake_case instead of camelCase

**Solution:**
- Ensure transformCartItem() function is being used
- Check cartController is properly updated
- Restart backend server

### Issue: Product Sort Not Working

**Error:** Sorting doesn't apply to results

**Solution:**
- Verify parseSortParam() function in productController
- Check database indexes exist
- Test with explicit sort parameter

### Issue: Database Connection Failed

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Start PostgreSQL service
net start postgresql-x64-14  # Windows

# Or check service:
psql -U postgres
# If successful, exit and check connection string in .env
```

---

## 📞 Support Resources

- **Frontend Errors:** Check browser console (F12)
- **Backend Errors:** Check terminal/log files
- **Database Errors:** Check PostgreSQL logs
- **API Errors:** Review `BACKEND_INTEGRATION_COMPLETE.md`

---

**Document Version:** 1.0  
**Last Updated:** April 14, 2026  
**Status:** ✅ Ready for Production

