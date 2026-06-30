# 🔧 Seller Product Creation - 403 Forbidden Error Fix

**Problem:** Getting "Forbidden" error when trying to add products on the seller page  
**Status:** ✅ DIAGNOSED - Root cause identified  
**Date:** April 20, 2026

---

## 📋 Problem Analysis

### Error Flow
```
User clicks "Add Product"
    ↓
Frontend calls: GET /products/seller/my-products (to refresh list)
    ↓
Backend middleware requireSeller checks:
    - Is user.role === 'seller'? ❌ NO
    ↓
Backend returns: 403 Forbidden
    ↓
Frontend displays error: "Forbidden"
```

### Root Cause
Your authentication token is **missing the `seller` role**, even though you're on the seller page. This happens when:

1. **Token is outdated** - You logged in before your account was set to seller role
2. **Session corrupted** - Old token stored in browser localStorage
3. **Wrong account logged in** - You're logged in as a customer, not a seller

---

## ✅ Solution

### Step 1: Clear Browser Data
Clear all local storage to remove old tokens:

**In Browser Console (Press F12, then Console tab):**
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 2: Log Out
Click the logout button in the app (if available), or:
```javascript
// In browser console
localStorage.removeItem('token');
localStorage.removeItem('user');
location.href = '/auth/login';
```

### Step 3: Verify Seller Account

Make sure you're logging in with a **seller account**, not a customer account:

**Valid Seller Test Accounts:**
- shop1@qino.com
- shop2@qino.com  
- shop3@qino.com
- shop4@qino.com
- shop5@qino.com

**Important:** These accounts may need password reset first

### Step 4: Reset Password (If Needed)

If you can't remember the password, run this in the backend:

```bash
cd C:\Users\palap\backend

# Reset password for shop1@qino.com (user ID 101)
node -e "
const pool = require('./db');
const { hashPassword } = require('./utils/auth');

async function reset() {
  const hashed = await hashPassword('testpassword123');
  await pool.query('UPDATE users SET password_hash = \$1 WHERE id = \$2', [hashed, 101]);
  console.log('✅ Password reset for shop1@qino.com to: testpassword123');
  process.exit(0);
}
reset();
"
```

### Step 5: Log In Again

1. Go to `/auth/login`
2. Log in with:
   - **Email:** shop1@qino.com
   - **Password:** testpassword123 (or your new password)
3. You should see a new token in localStorage with `role: seller`

### Step 6: Verify Token

In browser console, check your token:
```javascript
const token = localStorage.getItem('token');
if (token) {
  const decoded = JSON.parse(atob(token.split('.')[1]));
  console.log('Token role:', decoded.role);
  console.log('Token user ID:', decoded.id);
}
```

You should see: `Token role: seller`

---

## 🔍 Debugging Steps

If the issue persists:

### 1. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try to add a product
4. Look for failed request to `/api/products/seller/my-products`
5. Click on the request and check:
   - **Request Headers** → Authorization header present?
   - **Response** → What exact error message?

### 2. Check Console Tab
Look for red errors, especially:
```
❌ API Error Response: {
  status: 403,
  message: "Forbidden",
  error: { code: 'NOT_SELLER' }  // or 'NO_SELLER_PROFILE'
}
```

### 3. Verify Backend is Running
```bash
curl http://localhost:5000/
# Should return: {"message": "QINO Fruit Store Backend Server", "status": "running"}
```

---

## 🛠️ Forced Fix (Complete Reset)

If nothing works, completely reset authentication:

### In Backend:
```bash
cd C:\Users\palap\backend

# 1. Check who you're logged in as
node list-users.js

# 2. Pick a seller account and reset its password
# For example, user ID 101 (shop1@qino.com)
node -e "
const bcrypt = require('bcrypt');
const pool = require('./db');

async function resetPassword() {
  const password = 'testpassword123';
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  const result = await pool.query(
    'UPDATE users SET password_hash = \$1 WHERE id = \$2 RETURNING email',
    [hashed, 101]
  );
  console.log('✅ Password reset for:', result.rows[0].email);
  console.log('✅ New password: testpassword123');
  process.exit(0);
}
resetPassword().catch(e => { console.error(e); process.exit(1); });
"
```

### In Browser:
1. Press F12 to open DevTools
2. Go to **Application** tab
3. Click **Local Storage**
4. **Delete all entries**
5. Go to `/auth/login`
6. Log in with credentials from step above
7. Try adding a product again

---

## 📝 Verification Checklist

After implementing the fix:

- [ ] Logged out completely (localStorage cleared)
- [ ] Logged back in with a seller account
- [ ] Token shows `role: seller` in browser console
- [ ] Page loads without "Forbidden" error
- [ ] Can see the product list
- [ ] Can add a new product successfully
- [ ] Product appears in the list immediately

---

## 🆘 If Still Not Working

1. **Check backend logs:**
   ```bash
   # Look for errors in the running backend process
   # Terminal window showing backend output
   ```

2. **Test API directly:**
   ```bash
   cd C:\Users\palap\backend
   node test-seller-product-creation.js
   ```

3. **Verify seller data:**
   ```bash
   cd C:\Users\palap\backend
   node diagnose-seller-issue.js
   ```

4. **Contact support** with output from above commands

---

## 📚 Related Commands

```bash
# List all users and their roles
node list-users.js

# Check shops are all active
node check-shops-active.js

# Full diagnostic
node diagnose-seller-issue.js

# Test product creation programmatically
node test-seller-product-creation.js
```

---

**Summary:** The issue is a stale/wrong authentication token. Clear browser data and log in again with a valid seller account. If you continue to have issues, run the diagnostic commands provided.
