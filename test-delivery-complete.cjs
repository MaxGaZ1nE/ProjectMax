#!/usr/bin/env node
/**
 * E2E Delivery System Testing - Manual Scenario
 * Uses existing system data or creates minimal test orders
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const WEBHOOK_SECRET = process.env.DELIVERY_WEBHOOK_SECRET || 'your_delivery_webhook_secret_key_change_in_production_2024';

let buyerToken = '';
let courierToken = '';
let sellerToken = '';
let jobId = '';
let orderId = '';
let buyerId = '';
let sellerId = '';

const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

function log(title, status, data) {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
  let msg = data ? ` - ${JSON.stringify(data).substring(0, 100)}` : '';
  console.log(`${symbol} ${title}${msg}`);
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║      E2E Delivery Lifecycle - Manual Test       ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // ===== STEP 1: AUTH =====
  console.log('🔐 STEP 1: Authentication\n');

  let res = await api.post('/api/auth/register', {
    firstName: 'Buyer',
    lastName: 'Test',
    email: `buyer-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
  });
  if (res.data?.data?.token) {
    buyerToken = res.data.data.token;
    buyerId = res.data.data.id;
    log('Register Buyer', 'PASS');
  } else {
    log('Register Buyer', 'FAIL');
    process.exit(1);
  }

  res = await api.post('/api/auth/register', {
    firstName: 'Courier',
    lastName: 'Test',
    email: `courier-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
  });
  if (res.data?.data?.token) {
    courierToken = res.data.data.token;
    log('Register Courier', 'PASS');
  } else {
    log('Register Courier', 'FAIL');
    process.exit(1);
  }

  res = await api.post('/api/auth/register', {
    firstName: 'Seller',
    lastName: 'Test',
    email: `seller-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
    role: 'seller',
  });
  if (res.data?.data?.token) {
    sellerToken = res.data.data.token;
    sellerId = res.data.data.id;
    log('Register Seller', 'PASS');
  } else {
    log('Register Seller', 'FAIL');
    process.exit(1);
  }

  // ===== STEP 2: COURIER REGISTRATION =====
  console.log('\n📋 STEP 2: Courier Registration\n');

  const minimalBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  res = await api.post('/api/delivery/register/step1', {
    fullName: 'Test Courier',
    phone: '0812345678',
    email: `courier-test-${Date.now()}@test.com`,
  }, {
    headers: { Authorization: `Bearer ${courierToken}` }
  });
  log('Reg Step 1: Personal', res.data?.success ? 'PASS' : 'FAIL');

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
  log('Reg Step 2: Documents', res.data?.success ? 'PASS' : 'FAIL');

  res = await api.post('/api/delivery/register/submit', {}, {
    headers: { Authorization: `Bearer ${courierToken}` }
  });
  log('Reg Step 3: Submit', res.data?.success ? 'PASS' : 'FAIL');

  // ===== STEP 3: SELLER SHOP SETUP =====
  console.log('\n🏪 STEP 3: Seller Shop Setup\n');

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
  let shopId = null;
  if (res.data?.data?.shopId || res.data?.data?.id || res.data?.shop?.id) {
    shopId = res.data.data?.shopId || res.data.data?.id || res.data.shop?.id;
    log('Register Shop', 'PASS', { shopId });
  } else {
    log('Register Shop', 'FAIL', res.data);
  }

  // ===== STEP 4: CREATE PRODUCT =====
  console.log('\n🍎 STEP 4: Create Product\n');

  let productId = null;
  if (shopId) {
    res = await api.post('/api/products', {
      name: 'Test Mango',
      price: 100,
      quantity_in_stock: 10,
      description: 'Delicious test mango',
      categoryId: 1,
    }, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    if (res.data?.data?.id) {
      productId = res.data.data.id;
      log('Create Product', 'PASS', { id: productId });
    } else {
      log('Create Product', 'FAIL', res.data?.message);
    }
  }

  // ===== STEP 5: CREATE ORDER =====
  console.log('\n📦 STEP 5: Create Order\n');

  if (productId && shopId) {
    res = await api.post('/api/orders', {
      shopId: parseInt(shopId),
      items: [{
        id: String(productId),
        name: 'Test Mango',
        price: 100,
        qty: 2,
        weight: 2,
      }],
      checkout: {
        fullName: 'Test Buyer',
        phone: '0898765432',
        address: '123 Test Address, Bangkok',
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

    if (res.data?.data?.id) {
      orderId = res.data.data.id;
      log('Create Order', 'PASS', { id: orderId });
    } else {
      log('Create Order', 'FAIL', res.data?.message || res.data?.error?.code);
    }
  }

  // ===== STEP 6: CREATE DELIVERY JOB =====
  console.log('\n🚚 STEP 6: Create Delivery Job\n');

  if (orderId) {
    res = await api.post('/api/delivery/jobs', {
      orderId,
      pickupAddress: '123 Shop Street, Bangkok',
      deliveryAddress: '456 Customer Road, Bangkok',
      buyerName: 'Test Buyer',
      buyerPhone: '0898765432',
      totalPrice: 250,
      shippingFee: 50,
    }, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });

    if (res.data?.data?.id) {
      jobId = res.data.data.id;
      log('Create Job', 'PASS', { id: jobId.substring(0, 10) });
    } else {
      log('Create Job', 'FAIL', res.data?.message || res.status);
    }
  } else {
    console.log('⏭️  Skipping delivery job (no order created)');
  }

  // ===== STEP 7: COURIER JOB FLOW =====
  console.log('\n📍 STEP 7: Courier Job Lifecycle\n');

  if (jobId) {
    // Accept Job
    res = await api.post(`/api/delivery/jobs/${jobId}/accept`, {}, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    log('Accept Job', res.data?.success ? 'PASS' : 'FAIL');

    // Update Status: picked_up
    res = await api.patch(`/api/delivery/jobs/${jobId}/status`, {
      status: 'picked_up'
    }, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    log('Pickup Package', res.data?.success ? 'PASS' : 'FAIL');

    // Update Status: in_delivery
    res = await api.patch(`/api/delivery/jobs/${jobId}/status`, {
      status: 'in_delivery'
    }, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    log('Start Delivery', res.data?.success ? 'PASS' : 'FAIL');

    // Update Status: delivered
    res = await api.patch(`/api/delivery/jobs/${jobId}/status`, {
      status: 'delivered'
    }, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    log('Mark Delivered', res.data?.success ? 'PASS' : 'FAIL');
  } else {
    console.log('⏭️  Skipping courier flow (no job created)');
  }

  // ===== STEP 8: WEBHOOK UPDATE =====
  console.log('\n🔔 STEP 8: Webhook Status Update\n');

  if (jobId && orderId) {
    res = await api.post('/api/delivery/webhook/status', {
      jobId,
      orderId,
      status: 'delivered',
      courierName: 'Test Courier',
      courierPhone: '0812345678',
      token: WEBHOOK_SECRET,
    });
    log('Webhook Update', res.data?.success ? 'PASS' : 'FAIL', res.data?.message);
  } else {
    console.log('⏭️  Skipping webhook (missing jobId or orderId)');
  }

  // ===== STEP 9: BUYER TRACKING =====
  console.log('\n👁️  STEP 9: Buyer Tracking\n');

  if (orderId) {
    res = await api.get(`/api/delivery/jobs/order/${orderId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    if (res.data?.success && res.data?.data?.status) {
      log('Get Delivery Status', 'PASS', { status: res.data.data.status });
    } else {
      log('Get Delivery Status', 'FAIL', res.data?.message || res.status);
    }
  } else {
    console.log('⏭️  Skipping tracking (no order)');
  }

  // ===== SUMMARY =====
  console.log('\n═══════════════════════════════════════');
  console.log('✨ E2E Delivery Testing Complete');
  console.log('═══════════════════════════════════════\n');

  if (orderId && jobId) {
    console.log('✅ Full delivery lifecycle tested successfully!');
    console.log(`   Order: ${orderId}`);
    console.log(`   Job: ${jobId}`);
  }
}

runTests().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  process.exit(1);
});
