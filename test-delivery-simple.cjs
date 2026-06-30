#!/usr/bin/env node
/**
 * E2E Testing: Delivery System (Simplified)
 * Tests delivery job creation → courier acceptance → status updates → webhook → buyer tracking
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const WEBHOOK_SECRET = process.env.DELIVERY_WEBHOOK_SECRET || 'your_delivery_webhook_secret_key_change_in_production_2024';

let buyerToken = '';
let courierToken = '';
let sellerToken = '';
let jobId = '';
let orderId = '';

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
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  E2E Delivery System Testing           ║');
  console.log('╚════════════════════════════════════════╝\n');

  // ===== AUTH =====
  console.log('🔐 STEP 1: Register Users\n');

  let res = await api.post('/api/auth/register', {
    firstName: 'Test',
    lastName: 'Buyer',
    email: `buyer-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
  });
  buyerToken = res.data?.data?.token || '';
  log('Register Buyer', buyerToken ? 'PASS' : 'FAIL');

  res = await api.post('/api/auth/register', {
    firstName: 'Test',
    lastName: 'Courier',
    email: `courier-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
  });
  courierToken = res.data?.data?.token || '';
  log('Register Courier', courierToken ? 'PASS' : 'FAIL');

  res = await api.post('/api/auth/register', {
    firstName: 'Test',
    lastName: 'Seller',
    email: `seller-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
    role: 'seller',
  });
  sellerToken = res.data?.data?.token || '';
  log('Register Seller', sellerToken ? 'PASS' : 'FAIL');

  if (!buyerToken || !courierToken || !sellerToken) {
    console.log('❌ Missing tokens, cannot continue');
    process.exit(1);
  }

  // ===== COURIER REGISTRATION =====
  console.log('\n📋 STEP 2: Courier Registration\n');

  res = await api.post('/api/delivery/register/step1', {
    fullName: 'Test Courier',
    phone: '0812345678',
    email: `test-${Date.now()}@test.com`,
  }, {
    headers: { Authorization: `Bearer ${courierToken}` }
  });
  log('Step 1: Personal', res.data?.success ? 'PASS' : 'FAIL');

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
  log('Step 2: Documents', res.data?.success ? 'PASS' : 'FAIL');

  res = await api.post('/api/delivery/register/submit', {}, {
    headers: { Authorization: `Bearer ${courierToken}` }
  });
  log('Step 3: Submit', res.data?.success ? 'PASS' : 'FAIL');

  // ===== GET SELLER ORDERS =====
  console.log('\n🏪 STEP 3: Find Existing Order from Seller\n');

  res = await api.get('/api/orders/shop/all', {
    headers: { Authorization: `Bearer ${sellerToken}` }
  });
  
  let existingOrder = null;
  if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
    existingOrder = res.data.data[0];
    orderId = existingOrder.id;
    log('Found Order', 'PASS', { id: orderId, status: existingOrder.status });
  } else {
    log('Find Existing Order', 'SKIP', { message: 'No existing orders' });
    console.log('\n⚠️  Test requires at least one existing order in the system');
    console.log('   Run manual order creation first or check database');
    process.exit(0);
  }

  // ===== CREATE DELIVERY JOB =====
  console.log('\n🚚 STEP 4: Create Delivery Job\n');

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
      log('Create Job', 'PASS', { id: jobId.substring(0, 10) });
    } else {
      log('Create Job', 'FAIL', { msg: res.data?.message });
    }
  }

  // ===== COURIER JOB FLOW =====
  console.log('\n📍 STEP 5: Courier Job Lifecycle\n');

  if (jobId) {
    // Accept
    res = await api.post(`/api/delivery/jobs/${jobId}/accept`, {}, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    log('Accept Job', res.data?.success ? 'PASS' : 'FAIL');

    // Picked up
    res = await api.patch(`/api/delivery/jobs/${jobId}/status`, {
      status: 'picked_up'
    }, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    log('Pickup Package', res.data?.success ? 'PASS' : 'FAIL');

    // In delivery
    res = await api.patch(`/api/delivery/jobs/${jobId}/status`, {
      status: 'in_delivery'
    }, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    log('Start Delivery', res.data?.success ? 'PASS' : 'FAIL');

    // Delivered
    res = await api.patch(`/api/delivery/jobs/${jobId}/status`, {
      status: 'delivered'
    }, {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    log('Mark Delivered', res.data?.success ? 'PASS' : 'FAIL');
  } else {
    console.log('⏭️  Skipping job lifecycle (no job created)');
  }

  // ===== WEBHOOK UPDATE =====
  console.log('\n🔔 STEP 6: Webhook Status Update\n');

  if (jobId && orderId) {
    res = await api.post('/api/delivery/webhook/status', {
      jobId,
      orderId,
      status: 'delivered',
      courierName: 'Test Courier',
      courierPhone: '0812345678',
      token: WEBHOOK_SECRET,
    });
    log('Webhook Update', res.data?.success ? 'PASS' : 'FAIL');
  } else {
    console.log('⏭️  Skipping webhook (no jobId or orderId)');
  }

  // ===== BUYER TRACKING =====
  console.log('\n👁️  STEP 7: Buyer Tracking\n');

  if (orderId) {
    res = await api.get(`/api/delivery/jobs/order/${orderId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    if (res.data?.success || res.status === 200) {
      const status = res.data?.data?.status;
      log('Get Delivery Status', 'PASS', { status });
    } else {
      log('Get Delivery Status', 'FAIL', { msg: res.data?.message });
    }
  } else {
    console.log('⏭️  Skipping tracking (no orderId)');
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
