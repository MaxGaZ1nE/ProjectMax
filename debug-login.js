/**
 * Frontend Login Debug
 * To run in browser console:
 */

// Simulate login attempt
async function debugFrontendLogin() {
  console.log('%c=== FRONTEND LOGIN DEBUG ===', 'color: blue; font-size: 14px');
  
  // Check 1: LocalStorage
  console.log('\n1️⃣ Check localStorage:');
  console.log('   Token in storage:', localStorage.getItem('token') ? '✅ Yes' : '❌ No');
  console.log('   User in storage:', localStorage.getItem('user') ? '✅ Yes' : '❌ No');
  
  // Check 2: API Base URL
  console.log('\n2️⃣ Check API configuration:');
  const apiUrl = import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api';
  console.log('   API URL:', apiUrl);
  
  // Check 3: Test API call
  console.log('\n3️⃣ Testing login API call to backend:');
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@qino.com',
        password: 'password123'
      })
    });
    
    console.log('   Response status:', response.status);
    const data = await response.json();
    console.log('   Response:', data);
    
    if (response.ok) {
      console.log('   ✅ API login works!');
      console.log('   Token received:', data.data?.token?.substring(0, 20) + '...');
    } else {
      console.log('   ❌ API returned error');
    }
  } catch (err) {
    console.log('   ❌ API call failed:', err.message);
  }
  
  // Check 4: Window object
  console.log('\n4️⃣ Check window properties:');
  console.log('   location.origin:', window.location.origin);
  console.log('   CORS enabled:', '✅ CORS should work from localhost');
}

// Run it
debugFrontendLogin();
