# 🚀 Quick Start: Admin Courier Page Testing

## 📋 Checklist

### Step 1: Verify Backend Updates
```bash
cd C:\Users\palap\backend

# Check new webhook secret is in .env
grep DELIVERY_WEBHOOK_SECRET .env
# Output: DELIVERY_WEBHOOK_SECRET=14ef29be50ac4f4af5e11f0a6086a674

# Restart server (if running)
npm start
```

### Step 2: Login to Admin Panel
1. Open browser: `http://localhost:5175/admin/login`
2. Enter credentials:
   - Admin ID: `admin`
   - Password: `admin123`
3. Click Login

### Step 3: Navigate to Couriers Page
1. After login, you're at dashboard
2. Go to: `http://localhost:5175/admin/couriers`
3. Or look for navigation link in admin menu

### Step 4: Test Features

#### 4a. View Pending Couriers
- [ ] Page loads successfully
- [ ] Table shows pending courier registrations
- [ ] See columns: Name, Email, Phone, License Plate, Status, Created Date, Actions

#### 4b. Filter by Status
- [ ] Click "รอการอนุมัติ" (pending) - shows pending only
- [ ] Click "อนุมัติแล้ว" (approved) - shows approved only
- [ ] Click "ปฏิเสธ" (rejected) - shows rejected only
- [ ] Click "ทั้งหมด" (all) - shows all statuses

#### 4c. View Courier Details
- [ ] Click "👁️ ดู" button for a pending courier
- [ ] Modal opens showing:
  - Personal info (name, email, phone, ID)
  - Vehicle info (type, license plate)
  - Registration timeline
  - OTP verification status
  - Document images (click toggle to view)
- [ ] Close button works

#### 4d. Approve Courier
1. Click "👁️ ดู" on a pending courier
2. Modal opens
3. Click "✓ อนุมัติ" button
4. [ ] Confirm dialog appears (optional)
5. [ ] Success message shown
6. [ ] Modal closes
7. [ ] Table refreshes
8. [ ] Courier status changed to "อนุมัติแล้ว"

#### 4e. Reject Courier
1. Click "✕ ปฏิเสธ" button on a pending courier (on table row)
2. Reject modal opens with:
   - Courier name display
   - Reason text area
   - Cancel/Reject buttons
3. [ ] Enter rejection reason
4. [ ] Click "✓ ปฏิเสธ"
5. [ ] Success message shown
6. [ ] Modal closes
7. [ ] Table refreshes
8. [ ] Courier status changed to "ปฏิเสธ"
9. [ ] Rejection reason stored and visible on next view

### Step 5: Test Error Scenarios

#### 5a. Missing Admin Role
1. Logout from admin account
2. Login as regular user
3. Try to access: `http://localhost:5175/admin/couriers`
4. [ ] See error message: "⛔ Access Denied: Admin only"

#### 5b. Network Error
1. Stop backend server
2. Try to load couriers page
3. [ ] Error message displayed: "ไม่สามารถโหลดข้อมูลได้"
4. [ ] "✓ ลองใหม่อีกครั้ง" button works

#### 5c. Empty State
1. Filter to status with no couriers
2. [ ] See message: "📋 ไม่พบข้อมูล"
3. [ ] Helpful message: "ไม่มีพนักงานส่งที่อยู่ในสถานะนี้"

---

## 🔐 Security Testing

### Test 1: Rate Limiting (20 req/min per IP)
```bash
# Run this in PowerShell
$uri = "http://localhost:5000/api/delivery/webhook/status"
$body = @{
    jobId = "test-123"
    orderId = "order-123"
    status = "delivered"
    token = "14ef29be50ac4f4af5e11f0a6086a674"
} | ConvertTo-Json

# Send 21 requests quickly
for ($i = 0; $i -lt 21; $i++) {
    Write-Host "Request $($i+1)..."
    $response = Invoke-WebRequest -Uri $uri -Method POST `
      -ContentType "application/json" -Body $body -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 429) {
        Write-Host "✓ Rate limit hit at request $($i+1)"
        break
    }
}
```

**Expected Result**:
- [ ] First 20 requests succeed (200 OK)
- [ ] 21st request returns 429 Too Many Requests
- [ ] Response contains error: `"code": "RATE_LIMIT_EXCEEDED"`

### Test 2: Webhook Secret Validation
```bash
# Wrong secret
curl -X POST http://localhost:5000/api/delivery/webhook/status \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "123",
    "orderId": "456",
    "status": "delivered",
    "token": "wrong_secret_here"
  }'
```

**Expected Result**:
- [ ] Response: 403 Forbidden
- [ ] Message: "Invalid webhook token"
- [ ] Error code: `INVALID_TOKEN`

### Test 3: Missing Webhook Secret
```bash
curl -X POST http://localhost:5000/api/delivery/webhook/status \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "123",
    "orderId": "456",
    "status": "delivered"
  }'
```

**Expected Result**:
- [ ] Response: 401 Unauthorized
- [ ] Message: "Webhook token required"
- [ ] Error code: `NO_TOKEN`

---

## 📊 Data to Check

After testing, verify in database:

### Delivery Registrations Table
```sql
-- Check a courier's approval status
SELECT id, full_name, status, reviewed_by, reviewed_at, reject_reason 
FROM delivery_registrations 
WHERE id = 1;

-- Check all pending
SELECT id, full_name, status FROM delivery_registrations 
WHERE status = 'pending_approval';

-- Check approved
SELECT id, full_name, status FROM delivery_registrations 
WHERE status = 'approved';
```

### Users Table
```sql
-- Approved couriers should have role = 'delivery'
SELECT id, email, role FROM users 
WHERE role = 'delivery' 
AND id IN (
  SELECT user_id FROM delivery_registrations 
  WHERE status = 'approved'
);
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Page shows "Access Denied" | Ensure logged in as admin (ID: `admin`, Password: `admin123`) |
| No couriers shown | Check if any exist with `status = 'pending_approval'` in database |
| Images not loading | Check image URLs in database and S3/storage service |
| Approve button doesn't work | Check browser console for errors, verify backend is running |
| Status doesn't change after approve | Reload page manually, check for errors in response |
| Rate limit not working | Restart backend server to reload .env, check rate limiting middleware |

---

## 📞 Support

If you encounter issues:

1. **Check Backend Logs**:
   ```bash
   # Server running in another terminal
   # Look for errors like: "Unauthorized", "Invalid token", "Rate limit"
   ```

2. **Check Browser Console**:
   ```javascript
   // Open DevTools (F12) → Console
   // Look for API errors, network failures, etc.
   ```

3. **Check Network Requests**:
   - Open DevTools → Network tab
   - Click action button
   - Check request/response details
   - Look for status codes (200, 403, 429, 500)

4. **Restart Both Servers**:
   ```bash
   # Terminal 1: Backend
   cd C:\Users\palap\backend
   npm start
   
   # Terminal 2: Frontend
   cd d:\mongkol\qino-template-fruit-store
   npm run dev
   ```

---

## ✅ Test Completion Checklist

- [ ] Can access admin panel
- [ ] Couriers page loads without errors
- [ ] Status filters work correctly
- [ ] Can view courier details
- [ ] Can approve couriers
- [ ] Can reject couriers with reason
- [ ] Rate limiting works (429 after 20 requests)
- [ ] Webhook secret validation works
- [ ] Non-admin users blocked from page
- [ ] Database records updated correctly

**When all items are checked** ✅ **IMPLEMENTATION IS COMPLETE**

