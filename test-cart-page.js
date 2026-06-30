/**
 * Test Cart Page Access Manually (Console Check)
 */

async function testCartPageAccess() {
  try {
    // Simulate CartPage useEffect
    
    // 1. Check if user is authenticated
    const token = localStorage.getItem('token');
    console.log('🔍 Token in storage:', token ? `${token.substring(0, 20)}...` : 'NONE');
    
    if (!token) {
      console.log('❌ NOT AUTHENTICATED - CartPage would redirect to /auth/login');
      return;
    }
    
    // 2. Test get cart API
    const response = await fetch('http://localhost:5000/api/cart', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('✅ Cart API Response:', data);
    
    if (data.success) {
      const items = data.data?.items || [];
      console.log(`✅ Cart loaded successfully - ${items.length} items`);
    } else {
      console.log('❌ Cart API error:', data.message);
    }
    
  } catch (err) {
    console.error('❌ Error testing cart:', err.message);
  }
}

// Auto-run
testCartPageAccess();
