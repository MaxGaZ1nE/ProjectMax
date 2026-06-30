# 🔧 BUG FIX REPORT & RESOLUTION
## รายงานการแก้ไขข้อบกพร่องและแนวทางแก้ไข

**วันที่จัดทำ:** 5 พฤษภาคม 2566  
**Status:** 🔧 IN PROGRESS

---

## 📋 รายการข้อบกพร่องที่พบ (5 Bugs)

---

## 🐛 BUG #1: Cart Total Not Updated After Delete

### ข้อมูลพื้นฐาน
- **ID:** TC-ORD-04-FAIL-001
- **โมดูล:** การทำการสั่งซื้อ
- **Severity:** 🟡 MEDIUM
- **Priority:** P2
- **Assigned To:** Frontend Team

### ลักษณะของปัญหา
```
เมื่อลบสินค้าออกจากตะกร้า สินค้าจะหายออกจากรายการ แต่ยอดรวมของตะกร้าไม่ได้ลดลง
```

### Steps to Reproduce
1. เพิ่มสินค้า A (ราคา 500 บาท) → ยอดรวม = 500
2. เพิ่มสินค้า B (ราคา 500 บาท) → ยอดรวม = 1,000
3. ลบสินค้า B
4. **ผลลัพธ์:** 
   - ❌ สินค้า B หายจากรายการ
   - ❌ ยอดรวม = 1,000 (ควรเป็น 500)

### Root Cause
```typescript
// CheckoutPage.tsx - Line 287
const onDeleteItem = () => {
  // ❌ ลบสินค้าออกจาก UI เท่านั้น
  const updatedItems = items.filter(item => item.id !== selectedId);
  setItems(updatedItems); // Local state เท่านั้น
  
  // ❌ ไม่เรียก dispatch ไป Redux
  // dispatch(updateCart(updatedItems)); // ← ขาดอย่างนี้
};
```

### Solution (Code Fix)
```typescript
// ✅ แก้ไขให้ dispatch ไป Redux
const onDeleteItem = () => {
  const updatedItems = items.filter(item => item.id !== selectedId);
  
  // ✅ Update Redux store
  dispatch(clearCart());
  updatedItems.forEach(item => {
    dispatch(addToCart(item));
  });
  
  // ✅ Recalculate totals
  recalculateTotals();
};
```

### Expected Result After Fix
1. ✅ สินค้าลบออกจากรายการ
2. ✅ ยอดรวมลดลงตามจำนวนสินค้าที่ลบ
3. ✅ Redux state synchronized

### Estimated Fix Time
- **Coding:** 30 นาที
- **Testing:** 1-1.5 ชม.
- **Review:** 30 นาที
- **Total:** 2-3 ชม.

---

## 🐛 BUG #2: Receipt Verification Pending

### ข้อมูลพื้นฐาน
- **ID:** TC-PAY-06-FAIL-002
- **โมดูล:** การชำระเงิน
- **Severity:** 🔴 HIGH
- **Priority:** P1 (Urgent)
- **Assigned To:** Backend Team

### ลักษณะของปัญหา
```
หลังจากอัปโหลดสลิป ออเดอร์ยังค้างการยืนยัน (ควรยืนยันทันที หรือเรียกแอดมินอนุมัติ)
```

### Steps to Reproduce
1. เลือก PromptPay ✅
2. ได้ QR Code ✅
3. สแกนและโอนเงิน ✅
4. ถ่ายรูปสลิปและอัปโหลด ✅
5. **ผลลัพธ์:** ❌ ออเดอร์ยังค้าง (Status = "PENDING_VERIFICATION")

### Backend Issue
```typescript
// Backend API Response ❌
POST /api/orders/verify-receipt
Response: {
  "status": 202, // Accepted (ไม่ใช่ Accepted)
  "message": "Receipt under verification",
  "orderStatus": "PENDING_VERIFICATION" // ❌ ยังค้าง
}

// ควรเป็น:
// Option 1: Auto-verify (OCR)
// Option 2: Call admin API
// Option 3: Set auto-confirm after 24 ชม.
```

### Solution Options

#### Option A: Auto-Verify with OCR ✅ Recommended
```typescript
// Backend: POST /api/orders/verify-receipt
const verifyReceipt = async (orderId, receiptImage) => {
  // 1. Extract text from image (OCR)
  const ocrResult = await extractTextFromImage(receiptImage);
  
  // 2. Validate receipt details
  const isValid = validateReceiptDetails(
    ocrResult,
    orderId,
    expectedAmount
  );
  
  // 3. Auto-confirm if valid
  if (isValid) {
    await updateOrderStatus(orderId, "CONFIRMED");
    return { status: 201, message: "Order confirmed" };
  } else {
    return { status: 400, message: "Invalid receipt" };
  }
};
```

#### Option B: Admin Approval Flow
```typescript
// Backend: Call admin API
const verifyReceipt = async (orderId, receiptImage) => {
  // 1. Save receipt to database
  await saveReceipt(orderId, receiptImage);
  
  // 2. Notify admin
  await notifyAdmin({
    type: "RECEIPT_VERIFICATION",
    orderId: orderId,
    amount: orderAmount
  });
  
  // 3. Auto-confirm after 24 hours if not reviewed
  await scheduleAutoConfirm(orderId, 24 * 60 * 60 * 1000);
  
  return { status: 202, message: "Waiting for verification" };
};
```

### Estimated Fix Time
- **Option A (OCR):** 4-5 ชม.
- **Option B (Admin):** 2-3 ชม.
- **Recommended:** Go with Option B (faster) + transition to Option A later

---

## 🐛 BUG #3: Incorrect Shipping Distance

### ข้อมูลพื้นฐาน
- **ID:** TC-SHP-02-FAIL-003
- **โมดูล:** การขนส่ง
- **Severity:** 🟡 MEDIUM
- **Priority:** P2
- **Assigned To:** Backend Team

### ลักษณะของปัญหา
```
ระยะทางที่คำนวณจาก API ผิด (ไม่ใช่เส้นทางที่ดีที่สุด)
ตัวอย่าง: ผู้ซื้อที่กรุงเทพ → ร้านที่ปทุมธานี
ระยะจริง: ~15 km
API บอก: 25 km ❌
```

### Root Cause
```
OSRM API ใช้เส้นทางที่ไม่ optimal
ควรใช้ Google Maps Distance Matrix API แทน (ให้ผลที่แม่นยำกว่า)
```

### Current Implementation
```typescript
// Backend: estimateShipping
const estimateShipping = async (buyerLat, buyerLng, sellerLat, sellerLng) => {
  // ❌ ใช้ OSRM (ได้ผลไม่แม่นยำ)
  const response = await fetch(`
    https://router.project-osrm.org/route/v1/driving/
    ${sellerLng},${sellerLat};
    ${buyerLng},${buyerLat}?overview=false
  `);
  
  const data = await response.json();
  const distanceKm = data.routes[0].distance / 1000; // ❌ บ่อย ผิด
  
  return distanceKm;
};
```

### Solution (Use Google Maps)
```typescript
// ✅ ใช้ Google Maps Distance Matrix API (แม่นยำกว่า)
const estimateShipping = async (buyerLat, buyerLng, sellerLat, sellerLng) => {
  const response = await fetch(`
    https://maps.googleapis.com/maps/api/distancematrix/json?
    origins=${sellerLat},${sellerLng}&
    destinations=${buyerLat},${buyerLng}&
    key=${GOOGLE_MAPS_API_KEY}
  `);
  
  const data = await response.json();
  const distanceMeters = data.rows[0].elements[0].distance.value;
  const distanceKm = distanceMeters / 1000; // ✅ แม่นยำ
  
  return {
    distanceKm: distanceKm,
    distanceText: data.rows[0].elements[0].distance.text,
    durationText: data.rows[0].elements[0].duration.text
  };
};
```

### Estimated Fix Time
- **Implementation:** 1 ชม.
- **Testing:** 1 ชม.
- **Total:** 1-2 ชม.

---

## 🐛 BUG #4: CSV Export UTF-8 Encoding Issue

### ข้อมูลพื้นฐาน
- **ID:** TC-RPT-05-FAIL-004
- **โมดูล:** การออกรายงาน (CSV Export)
- **Severity:** 🟡 MEDIUM
- **Priority:** P2
- **Assigned To:** Backend Team

### ลักษณะของปัญหา
```
ดาวน์โหลด CSV สำเร็จ แต่เปิดใน Excel ข้อความไทยแสดงเป็น ??? หรือ symbol ผิดเพี้ยน
```

### Root Cause
```
Response headers ไม่ได้ set charset=utf-8
Browser/Excel ตีความ encoding ผิด
```

### Current Code ❌
```javascript
// Backend: Export CSV endpoint
app.get('/api/reports/export-csv', (req, res) => {
  const csvContent = generateCSV(orders); // ← ไม่ set encoding
  
  res.header('Content-Type', 'text/csv'); // ❌ ขาด charset
  res.send(csvContent);
});
```

### Fixed Code ✅
```javascript
// ✅ Set UTF-8 encoding
app.get('/api/reports/export-csv', (req, res) => {
  const csvContent = generateCSV(orders);
  
  // ✅ Add UTF-8 BOM for Excel
  const bom = '\uFEFF'; // UTF-8 BOM
  const csvWithBom = bom + csvContent;
  
  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.header('Content-Disposition', 'attachment; filename="report.csv"');
  res.send(Buffer.from(csvWithBom, 'utf8'));
});
```

### Estimated Fix Time
- **Coding:** 15 นาที
- **Testing:** 30 นาที
- **Total:** 30-45 นาที

---

## 🐛 BUG #5: PDF Export Memory Overflow

### ข้อมูลพื้นฐาน
- **ID:** TC-RPT-06-FAIL-005
- **โmoดูล:** การออกรายงาน (PDF Export)
- **Severity:** 🟡 MEDIUM
- **Priority:** P2
- **Assigned To:** Backend Team

### ลักษณะของปัญหา
```
เมื่อเลือกรายงานข้อมูลจำนวนมาก → ระบบใช้หน่วยความจำเกิน
→ PDF corrupt → ไฟล์ดาวน์โหลดมาไม่สามารถเปิดได้
```

### Current Implementation ❌
```javascript
// ❌ Load ทั้งหมด ไปยัง memory
app.get('/api/reports/export-pdf', async (req, res) => {
  // ❌ เอา data ทั้งหมดลงใน memory
  const orders = await Order.find({});
  
  // ❌ สร้าง PDF ในหน่วยความจำทั้งหมด
  const doc = new PDFDocument();
  orders.forEach(order => {
    doc.text(order.id + ': ' + order.items.length + ' items');
  });
  
  // ❌ ถ้ามี data มาก → Out of Memory Error
  res.pipe(doc);
  doc.end();
});
```

### Solution: Streaming PDF ✅
```javascript
// ✅ Stream PDF (ไม่เก็บทั้งหมดใน memory)
app.get('/api/reports/export-pdf', async (req, res) => {
  const doc = new PDFDocument();
  
  res.header('Content-Type', 'application/pdf');
  res.header('Content-Disposition', 'attachment; filename="report.pdf"');
  
  doc.pipe(res);
  
  // ✅ Query paginated
  let page = 0;
  const pageSize = 100;
  let hasMore = true;
  
  while (hasMore) {
    // ✅ ดึง data เป็น batch เล็ก ๆ
    const orders = await Order.find({})
      .skip(page * pageSize)
      .limit(pageSize);
    
    if (orders.length === 0) {
      hasMore = false;
    } else {
      // ✅ เขียนลง PDF ทีละ batch
      orders.forEach(order => {
        doc.text(order.id + ': ' + order.items.length + ' items');
      });
      
      page++;
    }
  }
  
  doc.end();
});
```

### Alternative: Async Queue
```javascript
// ✅ ใช้ async queue เพื่อcontrol memory
const Queue = require('async/queue');

app.get('/api/reports/export-pdf', async (req, res) => {
  const doc = new PDFDocument();
  res.pipe(doc);
  
  let cursor = 0;
  const batchSize = 50;
  
  const q = Queue(async (batch) => {
    batch.forEach(order => {
      doc.text(order.id);
    });
  }, 1); // concurrency = 1
  
  // ✅ Add batches to queue
  while (true) {
    const batch = await Order.find({})
      .skip(cursor)
      .limit(batchSize);
    
    if (batch.length === 0) break;
    
    q.push(batch);
    cursor += batchSize;
  }
  
  q.drain = () => doc.end();
});
```

### Estimated Fix Time
- **Implementation:** 2-3 ชม.
- **Testing:** 1-1.5 ชม.
- **Total:** 2-3 ชม.

---

## 🔧 Fix Timeline

| Bug | Priority | Est. Time | Owner | Target Date |
|-----|----------|-----------|-------|-------------|
| #1 | P2 | 2-3 ชม. | Frontend | May 6 EOD |
| #2 | P1 | 2-3 ชม. | Backend | May 6 AM |
| #3 | P2 | 1-2 ชม. | Backend | May 6 EOD |
| #4 | P2 | 30 นาที | Backend | May 6 EOD |
| #5 | P2 | 2-3 ชม. | Backend | May 7 EOD |

**Total Estimated Time:** 8-13.5 ชม.

---

## ✅ Re-Test Plan

**วันที่:** May 7-8, 2026  
**Time:** 1 วันเต็ม

### Test Cases to Re-Test:
- [x] TC-ORD-04 (Bug #1)
- [x] TC-PAY-06 (Bug #2)
- [x] TC-SHP-02 (Bug #3)
- [x] TC-RPT-05 (Bug #4)
- [x] TC-RPT-06 (Bug #5)

### Expected Result:
- ✅ ทั้งหมด 5 test cases ผ่าน
- ✅ Pass Rate: 100%
- ✅ Ready for Production

---

## 📞 Communication Plan

### Daily Standup: 9:00 AM
- Update status on each bug
- Identify blockers
- Adjust timeline if needed

### Status Updates: Every 4 hours
- 1:00 PM
- 5:00 PM
- Before EOD

### Escalation Path:
- Developer → Tech Lead → Project Manager

---

**Document Date:** 5 พฤษภาคม 2566  
**Status:** 🔧 IN PROGRESS  
**Next Review:** May 6, 2026
