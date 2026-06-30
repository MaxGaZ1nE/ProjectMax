#!/usr/bin/env node
/**
 * E2E Testing: Fruit Marketplace
 * Tests all scenarios from Auth → Delivery → Orders
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
  validateStatus: () => true, // Don't throw on any status
});

function log(title, status, data) {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
  console.log(`\n${symbol} ${title}`);
  if (data) console.log(`   ${JSON.stringify(data).substring(0, 100)}`);
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   E2E Testing: Fruit Marketplace      ║');
  console.log('╚════════════════════════════════════════╝\n');

  // ===== SETUP =====
  console.log('📋 SETUP CHECKS:\n');
  try {
    const health = await api.get('/api/health');
    log('Backend Health Check', 'PASS', { status: health.status });
  } catch (err) {
    log('Backend Health Check', 'FAIL', { error: err.message });
    process.exit(1);
  }

  // ===== SCENARIO 1: Authentication =====
  console.log('\n═══════════════════════════════════════');
  console.log('SCENARIO 1: Authentication');
  console.log('═══════════════════════════════════════\n');

  // Register Buyer
  let res = await api.post('/api/auth/register', {
    firstName: 'Test',
    lastName: 'Buyer',
    email: `buyer-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
  });
  if (res.data?.success && res.data?.data?.token) {
    buyerToken = res.data.data.token;
    log('Register Buyer', 'PASS', { email: res.data.data.email });
  } else {
    log('Register Buyer', 'FAIL', { message: res.data?.message, status: res.status });
  }

  // Register Courier
  res = await api.post('/api/auth/register', {
    firstName: 'Test',
    lastName: 'Courier',
    email: `courier-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
  });
  if (res.data?.success && res.data?.data?.token) {
    courierToken = res.data.data.token;
    log('Register Courier', 'PASS', { email: res.data.data.email });
  } else {
    log('Register Courier', 'FAIL', { message: res.data?.message });
  }

  // Register Seller
  res = await api.post('/api/auth/register', {
    firstName: 'Test',
    lastName: 'Seller',
    email: `seller-${Date.now()}@test.com`,
    phone: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    password: 'test1234',
    role: 'seller',
  });
  if (res.data?.success && res.data?.data?.token) {
    sellerToken = res.data.data.token;
    log('Register Seller', 'PASS', { email: res.data.data.email });
  } else {
    log('Register Seller', 'FAIL', { message: res.data?.message });
  }

  // ===== SCENARIO 2: Delivery Registration =====
  console.log('\n═══════════════════════════════════════');
  console.log('SCENARIO 2: Delivery Registration');
  console.log('═══════════════════════════════════════\n');

  if (!courierToken) {
    console.log('⏭️  Skipping delivery registration (no courier token)');
  } else {
    // Step 1: Save Personal Info
    res = await api.post(
      '/api/delivery/register/step1',
      {
        fullName: 'Test Courier',
        phone: '0812345678',
        email: `courier-${Date.now()}@test.com`,
      },
      { headers: { Authorization: `Bearer ${courierToken}` } }
    );
    if (res.data?.success) {
      log('Delivery Step 1: Personal Info', 'PASS');
    } else {
      log('Delivery Step 1', 'FAIL', { message: res.data?.message, status: res.status });
    }

    // Step 2: Save Documents (with minimal base64 images)
    const minimalBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    res = await api.post(
      '/api/delivery/register/step2',
      {
        idCardNumber: '1234567890123',
        idCardFrontImage: minimalBase64,
        idCardBackImage: minimalBase64,
        drivingLicenseImage: minimalBase64,
        licensePlateNumber: 'ABC-1234',
        vehicleType: 'motorcycle',
        vehicleOwnershipImage: minimalBase64,
        insuranceImage: minimalBase64,
      },
      { headers: { Authorization: `Bearer ${courierToken}` } }
    );
    if (res.data?.success) {
      log('Delivery Step 2: Documents', 'PASS');
    } else {
      log('Delivery Step 2', 'FAIL', { message: res.data?.message });
    }

    // Step 3: Submit Registration
    res = await api.post(
      '/api/delivery/register/submit',
      {},
      { headers: { Authorization: `Bearer ${courierToken}` } }
    );
    if (res.data?.success) {
      log('Delivery Step 3: Submit', 'PASS', { status: res.data?.data?.status });
    } else {
      log('Delivery Step 3', 'FAIL', { message: res.data?.message });
    }

    // Get Registration Status
    res = await api.get('/api/delivery/register/status', {
      headers: { Authorization: `Bearer ${courierToken}` },
    });
    if (res.data?.success) {
      log('Get Delivery Status', 'PASS', { status: res.data?.data?.status });
    } else {
      log('Get Delivery Status', 'FAIL', { message: res.data?.message });
    }
  }

  // ===== SCENARIO 3: Seller & Delivery Jobs =====
  console.log('\n═══════════════════════════════════════');
  console.log('SCENARIO 3: Seller Flow');
  console.log('═══════════════════════════════════════\n');

  if (!sellerToken) {
    console.log('⏭️  Skipping seller flow (no seller token)');
  } else {
    // Get Seller Profile
    res = await api.get('/api/seller/profile', {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    if (res.data?.success || res.status === 200) {
      log('Get Seller Profile', 'PASS');
    } else {
      log('Get Seller Profile', 'FAIL', { message: res.data?.message });
    }

    // Get Orders
    res = await api.get('/api/orders/shop/all', {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    if (res.data?.success || res.status === 200) {
      log('Get Shop Orders', 'PASS', { count: res.data?.data?.length || 0 });
      if (res.data?.data?.length > 0) {
        orderId = res.data.data[0].id;
        console.log(`   Using orderId: ${orderId}`);
      }
    } else {
      log('Get Shop Orders', 'FAIL', { message: res.data?.message });
    }

    // Create Delivery Job (if we have an order)
    if (orderId) {
      res = await api.post(
        '/api/delivery/jobs',
        {
          orderId,
          pickupAddress: '123 Shop Street, Bangkok',
          deliveryAddress: '456 Customer Road, Bangkok',
          buyerName: 'Test Buyer',
          buyerPhone: '0898765432',
          totalPrice: 500,
          shippingFee: 50,
        },
        { headers: { Authorization: `Bearer ${sellerToken}` } }
      );
      if (res.data?.success && res.data?.data?.id) {
        jobId = res.data.data.id;
        log('Create Delivery Job', 'PASS', { jobId: jobId.substring(0, 10) });
      } else {
        log('Create Delivery Job', 'FAIL', { message: res.data?.message, status: res.status });
      }
    }
  }

  // ===== SCENARIO 4: Courier Job Flow =====
  console.log('\n═══════════════════════════════════════');
  console.log('SCENARIO 4: Courier Flow');
  console.log('═══════════════════════════════════════\n');

  if (!courierToken) {
    console.log('⏭️  Skipping courier flow (no courier token)');
  } else {
    // Get Dashboard Stats
    res = await api.get('/api/delivery/dashboard/stats', {
      headers: { Authorization: `Bearer ${courierToken}` },
    });
    if (res.data?.success || res.status === 200) {
      log('Get Courier Dashboard', 'PASS', { todayJobs: res.data?.data?.todayJobs });
    } else {
      log('Get Courier Dashboard', 'FAIL', { message: res.data?.message });
    }

    // List Available Jobs
    res = await api.get('/api/delivery/jobs?status=available', {
      headers: { Authorization: `Bearer ${courierToken}` },
    });
    if (res.data?.success || res.status === 200) {
      log('List Available Jobs', 'PASS', { count: res.data?.data?.jobs?.length || 0 });
      if (res.data?.data?.jobs?.length > 0 && !jobId) {
        jobId = res.data.data.jobs[0].jobId;
        console.log(`   Using jobId: ${jobId}`);
      }
    } else {
      log('List Available Jobs', 'FAIL', { message: res.data?.message });
    }

    // Accept Job (if we have jobId)
    if (jobId) {
      res = await api.post(
        `/api/delivery/jobs/${jobId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${courierToken}` } }
      );
      if (res.data?.success) {
        log('Accept Job', 'PASS', { status: res.data?.data?.status });
      } else {
        log('Accept Job', 'FAIL', { message: res.data?.message, status: res.status });
      }

      // Update Status: picked_up
      res = await api.patch(
        `/api/delivery/jobs/${jobId}/status`,
        { status: 'picked_up' },
        { headers: { Authorization: `Bearer ${courierToken}` } }
      );
      if (res.data?.success) {
        log('Pickup Package', 'PASS', { status: res.data?.data?.status });
      } else {
        log('Pickup Package', 'FAIL', { message: res.data?.message });
      }

      // Update Status: in_delivery
      res = await api.patch(
        `/api/delivery/jobs/${jobId}/status`,
        { status: 'in_delivery' },
        { headers: { Authorization: `Bearer ${courierToken}` } }
      );
      if (res.data?.success) {
        log('Start Delivery', 'PASS', { status: res.data?.data?.status });
      } else {
        log('Start Delivery', 'FAIL', { message: res.data?.message });
      }

      // Update Status: delivered
      res = await api.patch(
        `/api/delivery/jobs/${jobId}/status`,
        { status: 'delivered' },
        { headers: { Authorization: `Bearer ${courierToken}` } }
      );
      if (res.data?.success) {
        log('Mark Delivered', 'PASS', { status: res.data?.data?.status });
      } else {
        log('Mark Delivered', 'FAIL', { message: res.data?.message });
      }
    }
  }

  // ===== SCENARIO 5: Webhook Callback =====
  console.log('\n═══════════════════════════════════════');
  console.log('SCENARIO 5: Webhook Callback');
  console.log('═══════════════════════════════════════\n');

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
      log('Webhook: Status Update', 'PASS', { message: res.data?.message });
    } else {
      log('Webhook: Status Update', 'FAIL', { message: res.data?.message, status: res.status });
    }
  } else {
    console.log('⏭️  Skipping webhook (no jobId or orderId)');
  }

  // ===== SCENARIO 6: Buyer Tracking =====
  console.log('\n═══════════════════════════════════════');
  console.log('SCENARIO 6: Buyer Tracking');
  console.log('═══════════════════════════════════════\n');

  if (orderId) {
    res = await api.get(`/api/delivery/jobs/order/${orderId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (res.data?.success || res.status === 200) {
      log('Get Delivery Status', 'PASS', { status: res.data?.data?.status });
    } else {
      log('Get Delivery Status', 'FAIL', { message: res.data?.message, status: res.status });
    }
  } else {
    console.log('⏭️  Skipping buyer tracking (no orderId)');
  }

  // ===== SUMMARY =====
  console.log('\n═══════════════════════════════════════');
  console.log('✨ E2E Testing Complete');
  console.log('═══════════════════════════════════════\n');
}

runTests().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
