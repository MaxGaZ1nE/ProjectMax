# 🛒 Cart Page 403 Error - Solution Guide

## Problem Summary
The cart page shows: **"Request failed with status code 403 (Forbidden)"**

## Root Cause
This error occurs when the backend cannot verify or authenticate the user's JWT token. The 403 status code specifically means:
- **Authentication Failed**: The JWT token is invalid, expired, or not being sent correctly
- The backend's `verifyToken` middleware rejected the request

## Common Causes & Solutions

### ✅ Solution 1: Backend Service Not Running

**Symptoms:**
- Getting 403 errors on all API endpoints
- Recent development/deployment changes

**Fix:**

```bash
# Terminal 1: Start the Backend
cd C:\Users\palap\backend

# Install dependencies (if needed)
npm install

# Start the backend server
npm run dev

# Expected output:
# ✅ Server running on: http://localhost:5000
```

**Verify it's working:**
```bash
# In a new terminal or browser, test the health endpoint:
curl http://localhost:5000/
# Should return: {"status": "running"}
```

### ✅ Solution 2: Invalid/Expired Token

**Symptoms:**
- User was logged in before, now getting 403
- Token stored in localStorage is no longer valid

**Fix:**

1. **Clear stored token:**
   ```javascript
   // Run in browser console
   localStorage.removeItem('token');
   localStorage.removeItem('user');
   ```

2. **Log in again:**
   - Navigate to login page: `/auth/login`
   - Use valid credentials to log in
   - A new token will be generated and stored

3. **Return to cart:**
   - Go back to `/cart`
   - Should now work if backend is running

### ✅ Solution 3: Token Not Being Sent in Request

**Symptoms:**
- Console shows: `No token in localStorage!`
- User appears to be logged in but getting 403

**Fix:**

1. Check browser console (F12 → Console tab)
2. Look for logs starting with `⚠️` (warning signs)
3. If token is missing:
   - Clear browser cache: `Ctrl+Shift+Delete`
   - Log in again
   - Refresh the page

### ✅ Solution 4: JWT Secret Mismatch

**Symptoms:**
- Getting 403 even with a valid-looking token
- Token was created with different backend setup

**Cause:**
The backend uses a JWT secret key. If it changes, all previous tokens become invalid.

**Fix:**
1. Verify backend JWT_SECRET in `.env`:
   ```
   JWT_SECRET=qino_fruit_store_super_secret_key_change_in_production_2024
   ```
2. If changed, users must log in again to get new tokens
3. Or restore the old JWT_SECRET and restart the backend

### ✅ Solution 5: CORS or Connection Issues

**Symptoms:**
- Getting 403 or network errors
- Frontend and backend on different origins

**Fix:**

Verify Backend CORS Configuration (`server.js`):
```javascript
app.use(cors({
  origin: [clientUrl, 'http://localhost:5175', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

Make sure:
- ✅ Frontend is running on `localhost:5175`
- ✅ Backend is running on `localhost:5000`
- ✅ Both are using http:// (not https://)

## Troubleshooting Checklist

```
□ Backend service is running on port 5000
   → Check: curl http://localhost:5000/
   
□ Database connection is working
   → Check: Backend logs should show successful DB connection
   
□ User has valid login credentials
   → Try: Log in with test account if available
   
□ Token is stored in localStorage
   → Check: Browser DevTools → Application → Local Storage
   
□ Token is not expired
   → Check: If older than 7 days, token expires
   
□ Frontend API URL is correct
   → Check: .env.local file has VITE_API_URL=http://localhost:5000/api
```

## Debug Commands

### Check Backend Status
```bash
# Terminal
curl http://localhost:5000/
```

### Check Frontend Configuration
```javascript
// Browser console
console.log(import.meta.env?.VITE_API_URL)
// Should output: http://localhost:5000/api
```

### Check Stored Token
```javascript
// Browser console
console.log('Token:', localStorage.getItem('token'))
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'))
```

### Test API Call with Token
```javascript
// Browser console
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/cart', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log(data))
.catch(e => console.error(e))
```

## Recent Changes Made

### CartPage Component (`src/pages/cart/CartPage.tsx`)
- ✅ Added better error logging
- ✅ Improved error messages for 403 vs 401 errors
- ✅ Added action buttons (Login Again, Continue Shopping)
- ✅ Shows error details for debugging

### Backend API Service (`src/services/backend-api.js`)
- ✅ Enhanced logging with Authorization header info
- ✅ Better error response logging with CORS headers
- ✅ Configured axios with proper CORS settings

### Error Messages
- If 403: Shows "Permission" error with login suggestion
- If 401: Shows "Session expired" error
- Always includes debug info and action buttons

## Need More Help?

1. **Check Backend Logs**
   - Look for errors starting with `❌`
   - Check database connection status
   - Verify JWT verification errors

2. **Check Frontend Logs**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for requests starting with `📡`
   - Check error messages starting with `❌`

3. **Database Issues**
   - Verify PostgreSQL is running
   - Check database connection in backend logs
   - Verify user data exists in `users` table

4. **Token Issues**
   - Tokens expire every 7 days (JWT_EXPIRE=7d)
   - User must log in again to get new token
   - Multiple logins create multiple tokens

## Related Documentation
- [Backend Integration Guide](./BACKEND_INTEGRATION_COMPLETE.md)
- [Quick Start Guide](./QUICK_START_GUIDE.md)
- [Cart Feature Implementation](./CART_FEATURE.md)

---

**Last Updated:** April 20, 2026  
**Status:** ✅ Solution Provided
