#!/usr/bin/env node
/**
 * E2E Testing: Fruit Marketplace (Complete Flow)
 * Creates sample data and tests full delivery lifecycle
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const WEBHOOK_SECRET = process.env.DELIVERY_WEBHOOK_SECRET || 'your_delivery_webhook_secret_key_change_in_production_2024';

let buyerToken = '';
let courierToken = '';
let sellerToken = '';
let jobId = '';
let orderId = '';
let shopId = '';

const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

function log(title, status, data) {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
  let msg = data ? ` - ${JSON.stringify(data).substring(0, 120)}` : '';
  if (data?.error?.details) {
    msg += ` | Details: ${JSON.stringify(data.error.details)}`;
  }
  console.log(`${symbol} ${title}${msg}`);
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  E2E Full Delivery Lifecycle Testing  ║');
  console.log('╚════════════════════════════════════════╝\n');

  // ===== SETUP =====
  console.log('📋 SETUP\n');
  try {
    const health = await api.get('/api/health');
    log('Backend Health', 'PASS');
  } catch (err) {
    log('Backend Health', 'FAIL', { error: err.message });
    process.exit(1);
  }

  // ===== SCENARIO 1: Auth =====
  console.log('\n📝 SCENARIO 1: Authentication\n');

  let res = await api.post('/api/auth/register', {
    firstName: 'Test',
    lastName: 'Buyer',
    email: `buyer-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
  });
  if (res.data?.success && res.data?.data?.token) {
    buyerToken = res.data.data.token;
    log('Buyer Registration', 'PASS');
  } else {
    log('Buyer Registration', 'FAIL', { msg: res.data?.message });
    process.exit(1);
  }

  res = await api.post('/api/auth/register', {
    firstName: 'Test',
    lastName: 'Courier',
    email: `courier-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
  });
  if (res.data?.success && res.data?.data?.token) {
    courierToken = res.data.data.token;
    log('Courier Registration', 'PASS');
  } else {
    log('Courier Registration', 'FAIL', { msg: res.data?.message });
    process.exit(1);
  }

  const sellerEmail = `seller-${Date.now()}@test.com`;
  res = await api.post('/api/auth/register', {
    firstName: 'Test',
    lastName: 'Seller',
    email: sellerEmail,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
    role: 'seller',
  });
  if (res.data?.success && res.data?.data?.token) {
    sellerToken = res.data.data.token;
    log('Seller Registration', 'PASS');
  } else {
    log('Seller Registration', 'FAIL', { msg: res.data?.message });
    process.exit(1);
  }

  // ===== SCENARIO 2: Create Shop & Order =====
  console.log('\n🏪 SCENARIO 2: Create Shop & Order\n');

  res = await api.post('/api/seller/register', {
    shopName: `Test Shop ${Date.now()}`,
    ownerName: 'Test Seller',
    phone: '0812345678',
    promptpayType: 'phone',
    promptpayValue: '0812345678',
    addressLine: '123 Shop Street',
    province: 'Bangkok',
    postalCode: '10000',
  }, {
    headers: { Authorization: `Bearer ${sellerToken}` }
  });
  if (res.data?.success || res.status === 201) {
    shopId = res.data?.data?.id || 'test_shop';
    log('Register Shop', 'PASS');
  } else {
    log('Register Shop', 'FAIL', { msg: res.data?.message });
    shopId = null;
  }

  // Create a sample product
  let productId = '';
  if (shopId) {
    res = await api.post('/api/products', {
      name: 'Test Mango',
      description: 'Sweet mango',
      price: 100,
      quantity_in_stock: 10,
      categoryId: 1,
    }, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    if (res.data?.success || res.status === 201 || res.data?.data?.id) {
      productId = res.data?.data?.id;
      console.log(`   Created product: ${productId}, response:`, res.data?.data);
      log('Create Product', 'PASS');
    } else {
      log('Create Product', 'FAIL', { msg: res.data?.message });
    }
  }

  // Create an order as buyer
  if (productId) {
    res = await api.post('/api/orders', {
      shopId: parseInt(shopId) || 1,
      items: [{
        id: String(productId), // ✅ Must be string
        name: 'Test Mango',
        price: 100,
        qty: 2,
        weight: 2,
      }],
      checkout: {
        fullName: 'Test Buyer',
        phone: '0898765432',
        address: '123 Test Street, Bangkok',
        note: 'Please deliver to door',
        paymentMethod: 'promptpay',
        deliveryDate: new Date().toISOString().split('T')[0],
        deliverySlot: 'morning',
      },
      itemsSubtotal: 200,
      shippingFee: 50,
      grandTotal: 250,
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    if (res.data?.success || res.status === 201 || res.data?.data?.id) {
      orderId = res.data?.data?.id || res.data?.data?.orderId;
      log('Create Order', 'PASS');
    } else {
      log('Create Order', 'FAIL', res.data);
    }
  } else {
    console.log('⏭️ Skipping order creation (no product)');
  }

  // ===== SCENARIO 3: Delivery Registration =====
  console.log('\n📋 SCENARIO 3: Courier Registration\n');

  res = await api.post('/api/delivery/register/step1', {
    fullName: 'Test Courier',
    phone: '0812345678',
    email: sellerEmail,
  }, {
    headers: { Authorization: `Bearer ${courierToken}` }
  });
  if (res.data?.success || res.status === 200) {
    log('Step 1: Personal Info', 'PASS');
  } else {
    log('Step 1', 'FAIL', { msg: res.data?.message });
  }

  const minimalBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  res = await api.post('/api/delivery/register/step2', {
    idCardNumber: '1234567890123',
    idCardFrontImage: minimalBase64,
    idCardBackImage: minimalBase64,
    drivingLicenseImage: minimalBase64,
    licensePlateNumber: 'ABC-1234',
    vehicleType: 'motorcycle',
    vehicleOwnershipImage: minimalBase64,
    insuranceImage: minimalBase64,
  }, {
    headers: { Authorization: `Bearer ${courierToken}` }
  });
  if (res.data?.success || res.status === 200) {
    log('Step 2: Documents', 'PASS');
  } else {
    log('Step 2', 'FAIL', { msg: res.data?.message });
  }

  res = await api.post('/api/delivery/register/submit', {}, {
    headers: { Authorization: `Bearer ${courierToken}` }
  });
  if (res.data?.success || res.status === 200) {
    log('Step 3: Submit', 'PASS');
  } else {
    log('Step 3', 'FAIL', { msg: res.data?.message });
  }

  // ===== SCENARIO 4: Create Delivery Job =====
  console.log('\n🚚 SCENARIO 4: Create Delivery Job\n');

  if (orderId) {
    res = await api.post('/api/delivery/jobs', {
      orderId,
      pickupAddress: '123 Shop Street, Bangkok',
      deliveryAddress: '456 Customer Road, Bangkok',
      buyerName: 'Test Buyer',
      buyerPhone: '0898765432',
      totalPrice: 500,
      shippingFee: 50,
    }, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    if (res.data?.success && res.data?.data?.id) {
      jobId = res.data.data.id;
      log('Create Job', 'PASS', { jobId: jobId.substring(0, 10) });
    } else {
      log('Create Job', 'FAIL', { msg: res.data?.message, status: res.status });
    }
  }

  // ===== SCENARIO 5: Courier Accepts & Updates Status =====
  console.log('\n📍 SCENARIO 5: Courier Job Lifecycle\n');

  if (jobId) {
    res = await api.post(`/api/delivery/jobs/${jobId}/accept`, {}, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    if (res.data?.success) {
      log('Accept Job', 'PASS');
    } else {
      log('Accept Job', 'FAIL', { msg: res.data?.message, status: res.status });
    }

    // Picked up
    res = await api.patch(`/api/delivery/jobs/${jobId}/status`, {
      status: 'picked_up'
    }, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    if (res.data?.success) {
      log('Pickup Package', 'PASS');
    } else {
      log('Pickup Package', 'FAIL', { msg: res.data?.message });
    }

    // In delivery
    res = await api.patch(`/api/delivery/jobs/${jobId}/status`, {
      status: 'in_delivery'
    }, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    if (res.data?.success) {
      log('Start Delivery', 'PASS');
    } else {
      log('Start Delivery', 'FAIL', { msg: res.data?.message });
    }

    // Delivered
    res = await api.patch(`/api/delivery/jobs/${jobId}/status`, {
      status: 'delivered'
    }, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    if (res.data?.success) {
      log('Mark Delivered', 'PASS');
    } else {
      log('Mark Delivered', 'FAIL', { msg: res.data?.message });
    }
  }

  // ===== SCENARIO 6: Webhook Update =====
  console.log('\n🔔 SCENARIO 6: Webhook Status Update\n');

  if (jobId && orderId) {
    res = await api.post('/api/delivery/webhook/status', {
      jobId,
      orderId,
      status: 'delivered',
      courierName: 'Test Courier',
      courierPhone: '0812345678',
      token: WEBHOOK_SECRET,
    });
    if (res.data?.success) {
      log('Webhook Update', 'PASS');
    } else {
      log('Webhook Update', 'FAIL', { msg: res.data?.message, status: res.status });
    }
  }

  // ===== SCENARIO 7: Buyer Tracking =====
  console.log('\n👁️  SCENARIO 7: Buyer Tracking\n');

  if (orderId) {
    res = await api.get(`/api/delivery/jobs/order/${orderId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    if (res.data?.success || res.status === 200) {
      const status = res.data?.data?.status;
      log('Get Delivery Status', 'PASS', { status });
    } else {
      log('Get Delivery Status', 'FAIL', { msg: res.data?.message, status: res.status });
    }
  }

  // ===== SUMMARY =====
  console.log('\n═══════════════════════════════════════');
  console.log('✨ E2E Testing Complete');
  console.log('═══════════════════════════════════════\n');
}

runTests().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  process.exit(1);
});
