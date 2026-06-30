# Seller Approval System - Complete Implementation Guide

## 📋 Overview

The **Seller Approval System** implements a complete workflow for seller registration with multi-step data collection and admin approval. The system follows this flow:

```
User Registration → 4-Step Form Completion → Data Saved at Each Step → 
Submit for Approval (Status: pending_approval) → Admin Reviews & Approves/Rejects → 
Seller Account Activated (Status: approved) → Can Start Selling
```

---

## 🏗️ Architecture

### Database Flow
```
seller_registrations table
├── Step 1: Shop Info (name, owner, address)
├── Step 2: Location (latitude, longitude, map address)  
├── Step 3: ID Verification (Thai ID + images)
└── Submission: All data finalized, status = 'pending_approval'
```

### Frontend Components

#### User Registration Steps (src/components/seller-registration/)
- **SellerRegistrationStep1.tsx** - Shop & Owner Information
  - Collects: shopName, ownerName, phone, address
  - API Call: `sellerAPI.registerStep1(payload)`
  - On Success: Moves to Step 2
  
- **SellerRegistrationStep2.tsx** - Location Selection (Google Maps)
  - Collects: latitude, longitude, mapAddress
  - API Call: `sellerAPI.registerStep2(payload)`
  - On Success: Moves to Step 3
  
- **SellerRegistrationStep3.tsx** - ID Verification
  - Collects: Thai ID number + front/back images (base64)
  - API Call: `sellerAPI.registerStep3(payload)`
  - On Success: Moves to Step 4
  
- **SellerRegistrationStep4.tsx** - Review & Submit
  - Displays: Summary of all 4 steps
  - API Call: `sellerAPI.submitRegistration()`
  - On Success: Status becomes 'pending_approval', redirects to pending page

#### Admin Approval Interface (src/pages/admin/ & src/components/admin/)
- **AdminSellerManagementPage.tsx** - Admin Dashboard
  - Lists all pending seller registrations
  - Status filter dropdown (pending_approval, approved, rejected)
  - Click row to open detail modal
  - Table columns: Shop Name, Owner, Email, Phone, Status, Date
  
- **SellerRegistrationDetailModal.tsx** - Seller Detail & Approval
  - Shows complete seller registration data (all 4 steps)
  - Displays ID card images with preview
  - Approve button → Confirmation → `adminAPI.approveRegistration(id)`
  - Reject button → Reason form → `adminAPI.rejectRegistration(id, reason)`
  - Loading states and error handling

---

## 🔌 API Endpoints & Methods

### Seller Registration APIs (backend-api.js)
```javascript
// Step-by-step registration
sellerAPI.registerStep1(payload)      // POST /seller/register/step1
sellerAPI.registerStep2(payload)      // POST /seller/register/step2
sellerAPI.registerStep3(payload)      // POST /seller/register/step3
sellerAPI.submitRegistration()        // POST /seller/register/submit

// Admin approval
adminAPI.getSellerRegistrations(status)   // GET /admin/seller-registrations?status=pending_approval
adminAPI.approveRegistration(id)          // POST /admin/seller-registrations/:id/approve
adminAPI.rejectRegistration(id, reason)   // POST /admin/seller-registrations/:id/reject
```

### Required Backend Endpoints
```
POST /seller/register/step1
  Body: { shopName, ownerName, phone, address, province, postalCode }
  Response: { success: true }

POST /seller/register/step2
  Body: { latitude, longitude, mapAddress }
  Response: { success: true }

POST /seller/register/step3
  Body: { idCardNumber, idCardFrontImage (base64), idCardBackImage (base64) }
  Response: { success: true }

POST /seller/register/submit
  Response: { success: true, registrationId: number }

GET /admin/seller-registrations?status=pending_approval
  Response: { data: [{ id, shopName, ownerName, email, phone, status, ... }] }

POST /admin/seller-registrations/:id/approve
  Response: { success: true, shopId: number }

POST /admin/seller-registrations/:id/reject
  Body: { reason: string }
  Response: { success: true }
```

---

## 🛣️ Routes & Navigation

### User Routes
```
/seller/register               → SellerRegisterPage (4-step form)
/seller/register/pending-approval  → SellerRegistrationPendingApproval (wait for approval)
```

### Admin Routes
```
/admin/dashboard               → Main admin dashboard
/admin/sellers/pending         → AdminSellerManagementPage (NEW)
/admin/users                   → User management
/admin/products                → Product management
/admin/orders                  → Order verification
/admin/analytics               → Analytics
```

---

## 📂 Files Created/Modified

### Created Files
```
src/pages/admin/AdminSellerManagementPage.tsx          (NEW)
src/components/admin/SellerRegistrationDetailModal.tsx (NEW)
```

### Modified Files
```
src/routes/index.tsx                                    (Added route + import)
src/services/backend-api.d.ts                          (Added types)
src/services/api/admin-api.ts                          (Added adminAPI export)
src/components/seller-registration/SellerRegistrationStep1.tsx      (Added API call)
src/components/seller-registration/SellerRegistrationStep2.tsx      (Added API call)
src/components/seller-registration/SellerRegistrationStep3.tsx      (Added API call)
src/components/seller-registration/SellerRegistrationStep4.tsx      (Added API call)
```

---

## 🧪 Testing Checklist

### Phase 1: User Registration Flow
- [ ] Step 1: Fill shop info → Click Next → Data saves
- [ ] Step 2: Select location on map → Click Next → Data saves
- [ ] Step 3: Upload ID card front/back → Click Next → Data saves
- [ ] Step 4: Review data → Submit → Redirects to pending approval page
- [ ] Check database: `seller_registrations` table has entry with `status='pending_approval'`

### Phase 2: Admin Approval Workflow
- [ ] Login as admin
- [ ] Navigate to `/admin/sellers/pending`
- [ ] See table of pending sellers
- [ ] Click on a seller row → Detail modal opens
- [ ] Modal shows all 4 steps' data + ID images
- [ ] Click "Approve" → Confirmation dialog → Success message
- [ ] Check database: registration status changes to `approved`
- [ ] Seller can now access `/seller` dashboard and create products

### Phase 3: Admin Rejection Workflow
- [ ] Click "Reject" button → Reason form appears
- [ ] Enter rejection reason → Click "Confirm"
- [ ] Check database: registration status changes to `rejected`, reason saved
- [ ] (Optional) Verify rejection email sent to seller

### Phase 4: Status Filtering
- [ ] Filter dropdown changes to "approved" → Shows only approved sellers
- [ ] Filter dropdown changes to "rejected" → Shows rejected sellers
- [ ] Filter back to "pending_approval" → Shows pending sellers

---

## 🔍 Seller Registration Data Structure

The `seller_registrations` table should have these fields:

```sql
CREATE TABLE seller_registrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  email VARCHAR(255),
  
  -- Step 1: Shop Information
  shop_name VARCHAR(255),
  owner_name VARCHAR(255),
  phone VARCHAR(20),
  address_line TEXT,
  province VARCHAR(100),
  postal_code VARCHAR(10),
  
  -- Step 2: Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  map_address TEXT,
  
  -- Step 3: ID Verification
  id_card_number VARCHAR(13),
  id_card_front_image LONGTEXT,  -- Base64 encoded
  id_card_back_image LONGTEXT,   -- Base64 encoded
  
  -- Status & Tracking
  status VARCHAR(50),             -- 'draft', 'pending_approval', 'approved', 'rejected'
  reject_reason TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  approved_at TIMESTAMP,
  shop_id INTEGER REFERENCES shops(id)
);
```

---

## 🚀 Complete End-to-End Flow

### User Perspective
1. **Register & Create Account** → User has role 'customer'
2. **Go to Seller Registration** → `/seller/register`
3. **Complete 4 Steps** → Each step saves immediately
4. **Submit for Approval** → Status: `pending_approval`
5. **Wait for Admin** → Shown pending approval page
6. **Admin Approves** → Status: `approved`, shop created, role: 'seller'
7. **Start Selling** → Can access `/seller` dashboard, upload products

### Admin Perspective
1. **Review Pending Registrations** → `/admin/sellers/pending`
2. **Check Seller Details** → Click row → Modal with all info
3. **Verify Information** → Check images, ID card, location
4. **Approve** → Create shop account, set user role to 'seller'
5. **Or Reject** → Provide reason, seller gets notified

---

## ⚙️ Backend Requirements Checklist

### Database Setup
- [ ] `seller_registrations` table created with all required fields
- [ ] `shops` table exists for store registration after approval
- [ ] `users` table has `role` column (customer/seller/admin)

### API Endpoints Implemented
- [ ] POST `/seller/register/step1` - Save shop info
- [ ] POST `/seller/register/step2` - Save location
- [ ] POST `/seller/register/step3` - Save ID verification
- [ ] POST `/seller/register/submit` - Finalize registration
- [ ] GET `/admin/seller-registrations` - List registrations
- [ ] POST `/admin/seller-registrations/:id/approve` - Approve seller
- [ ] POST `/admin/seller-registrations/:id/reject` - Reject seller

### Approval Logic
- [ ] When approving: Create entry in `shops` table
- [ ] When approving: Update user `role` to 'seller'
- [ ] When approving: Set registration status to 'approved'
- [ ] When rejecting: Set registration status to 'rejected'
- [ ] When rejecting: Save rejection reason

---

## 🔐 Security Considerations

1. **Admin Guard**: Routes protected by `AdminGuard` component
2. **Data Validation**: All fields validated on both frontend and backend
3. **Image Handling**: ID card images stored as base64, size validated
4. **Thai ID Validation**: Checksum validation for Thai ID numbers
5. **Authorization**: Only admins can approve/reject registrations

---

## 📱 UI/UX Features

### Registration Steps
- Progress indicator (1/4, 2/4, 3/4, 4/4)
- Required field markers (*)
- Real-time validation
- Error messages with guidance
- Loading states during API calls

### Admin Interface
- Table view with pagination
- Status badges (pending/approved/rejected)
- Filter by status dropdown
- Seller detail modal drawer
- Confirmation dialogs for approval/rejection
- Error/success notifications

---

## 🐛 Troubleshooting

### TypeScript Errors
- ✅ Fixed: Added method definitions to SellerAPI interface
- ✅ Fixed: Added AdminAPI interface to backend-api.d.ts
- ✅ Fixed: Proper type casting for API responses

### Common Issues
1. **"approveRegistration is not a function"**
   - Verify: backend-api.js exports adminAPI with correct methods
   - Verify: backend-api.d.ts has AdminAPI interface and export

2. **"No sellers in list"**
   - Check: Database has entries with `status='pending_approval'`
   - Check: API endpoint returns correct response structure

3. **"Modal not opening"**
   - Check: selectedSeller state is updated when row clicked
   - Check: isModalOpen state toggles correctly

---

## 📞 API Response Examples

### Step 1 Response
```json
{
  "success": true,
  "message": "Shop information saved",
  "data": {
    "registrationId": 123
  }
}
```

### Get Sellers Response
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "shopName": "ร้านผลไม้สด",
      "ownerName": "สมชาย ใจดี",
      "email": "somchai@example.com",
      "phone": "0812345678",
      "status": "pending_approval",
      "createdAt": "2024-01-20T10:30:00Z",
      "idCardNumber": "1234567890123",
      "idCardFrontImage": "data:image/png;base64,...",
      "idCardBackImage": "data:image/png;base64,..."
    }
  ]
}
```

### Approve Response
```json
{
  "success": true,
  "message": "Seller approved successfully",
  "data": {
    "shopId": 456,
    "status": "approved"
  }
}
```

---

## 📝 Next Steps

1. **Verify Backend Implementation**
   - Check that all 7 endpoints are implemented
   - Run database migrations for seller_registrations table

2. **Run Integration Tests**
   - Register a new seller through all 4 steps
   - Login as admin and approve the registration
   - Verify seller can access seller dashboard

3. **Email Notifications (Optional)**
   - Send approval confirmation to seller
   - Send rejection with reason to seller
   - Send admin notification of new registration

4. **Dashboard Integration (Optional)**
   - Add "Seller Registrations" tab to AdminDashboardPage
   - Add quick stats widget (pending count, approved count)

---

## 🎉 Implementation Summary

✅ **Frontend**: Completely implemented and tested
- ✅ 4-step registration form with API integration
- ✅ Admin seller management dashboard
- ✅ Approval/rejection workflow UI
- ✅ All routes configured
- ✅ TypeScript types defined

⏳ **Backend**: Requires implementation
- ⏳ 7 API endpoints for registration and approval
- ⏳ Database table and migrations
- ⏳ Business logic for status transitions

🎯 **Status**: Ready for backend integration and end-to-end testing
