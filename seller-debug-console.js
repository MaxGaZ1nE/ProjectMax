/**
 * Browser Console Debug Script for 403 Forbidden Error
 * 
 * Copy and paste this into your browser console (F12 → Console tab)
 * to diagnose the seller product creation issue
 */

(async function debugSellerAuth() {
  console.clear();
  console.log('%c🔍 SELLER AUTHENTICATION DEBUG', 'color: blue; font-size: 16px; font-weight: bold');
  console.log('%c' + '='.repeat(60), 'color: blue');

  // Check 1: Token in localStorage
  console.log('\n1️⃣  Checking Token in localStorage:');
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No token found in localStorage');
    console.log('   Solution: Log in again at http://localhost:5175/auth/login');
    return;
  }

  console.log('✅ Token found');
  console.log('   Token length:', token.length);
  console.log('   Token preview:', token.substring(0, 50) + '...');

  // Check 2: Decode and verify token
  console.log('\n2️⃣  Decoding JWT Token:');
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid JWT format (should have 3 parts)');
      return;
    }

    const decoded = JSON.parse(atob(parts[1]));
    console.log('✅ Token decoded successfully:');
    console.log('   User ID:', decoded.id);
    console.log('   Email:', decoded.email);
    console.log('   Role:', decoded.role);
    console.log('   Phone:', decoded.phone);

    // Check if role is seller
    if (decoded.role !== 'seller') {
      console.error(`❌ PROBLEM: Role is "${decoded.role}", but must be "seller"`);
      console.log('   Solution: Log out and log in again with a SELLER account');
      return;
    }
    console.log('✅ Role is correctly set to "seller"');
  } catch (error) {
    console.error('❌ Failed to decode token:', error.message);
    return;
  }

  // Check 3: Check user in localStorage
  console.log('\n3️⃣  Checking User Data in localStorage:');
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    console.warn('⚠️  No user data in localStorage (might be okay)');
  } else {
    try {
      const user = JSON.parse(userStr);
      console.log('✅ User data found:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
    } catch (error) {
      console.error('❌ Failed to parse user data:', error.message);
    }
  }

  // Check 4: Test API call
  console.log('\n4️⃣  Testing API Call to /api/products/seller/my-products:');
  try {
    const response = await fetch('http://localhost:5000/api/products/seller/my-products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response Status:', response.status, response.statusText);

    if (response.ok) {
      console.log('✅ API call successful');
      const data = await response.json();
      console.log('   Products:', data.data?.length || 0);
    } else {
      console.error(`❌ API returned error ${response.status}`);
      const errorData = await response.json();
      console.log('   Error:', errorData.message);
      console.log('   Error Code:', errorData.error?.code);
      console.log('   Details:', errorData.error?.details);

      if (response.status === 403) {
        if (errorData.error?.code === 'NOT_SELLER') {
          console.error('   → Your token does not have seller role');
        } else if (errorData.error?.code === 'NO_SELLER_PROFILE') {
          console.error('   → You have seller role but no shop profile');
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to call API:', error.message);
    console.log('   Check: Is the backend running on http://localhost:5000?');
  }

  // Summary
  console.log('\n' + '%c' + '='.repeat(60), 'color: blue');
  console.log('%c📋 SUMMARY & NEXT STEPS', 'color: blue; font-size: 14px; font-weight: bold');
  console.log('%c' + '='.repeat(60), 'color: blue');

  const token_decoded = JSON.parse(atob(token.split('.')[1]));

  if (token_decoded.role !== 'seller') {
    console.log(`
❌ PROBLEM IDENTIFIED:
Your token has role "${token_decoded.role}" but needs role "seller"

SOLUTION:
1. Seller account must be registered in the backend
2. Run this in backend terminal:
   cd C:\\Users\\palap\\backend
   node quick-seller-fix.js

3. Log out from the app:
   localStorage.clear();
   location.href = '/auth/login';

4. Log in again with the seller account
5. Try adding a product again
    `);
  } else {
    console.log(`
✅ TOKEN LOOKS GOOD!
Your authentication appears to be correct.

The issue might be:
• Browser cache - try: Ctrl+Shift+Delete → Clear all
• Different browser - try incognito/private mode
• Page not reloaded - try: Ctrl+F5 (hard refresh)
• Backend issue - check backend logs

If still not working:
1. Check backend logs for errors
2. Try again in incognito mode
3. Run in backend: node diagnose-seller-issue.js
    `);
  }
})();
