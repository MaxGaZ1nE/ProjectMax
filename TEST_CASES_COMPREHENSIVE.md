# 🧪 COMPREHENSIVE TEST CASES - Qino Fruit Store

**Version:** 1.0  
**Date:** April 21, 2026  
**Status:** 🔴 NEEDS TESTING

---

## 📋 TABLE OF CONTENTS

1. [USER (BUYER) TEST CASES](#1-user-buyer-test-cases)
2. [SELLER TEST CASES](#2-seller-test-cases)
3. [ADMIN TEST CASES](#3-admin-test-cases)
4. [SYSTEM/INTEGRATION TEST CASES](#4-systemintegration-test-cases)
5. [BUGS & ISSUES FOUND](#5-bugs--issues-found)
6. [FEATURES TO ADD/IMPROVE](#6-features-to-addimprove)

---

## 1. USER (BUYER) TEST CASES

### 1.1 AUTHENTICATION & REGISTRATION

#### TC-U-001: Register as New Customer
**Objective:** User can successfully register and create account

**Steps:**
1. Go to `/auth/register`
2. Click "Step 1: ป้อนเบอร์โทรศัพท์"
3. Enter phone: `0987654321`
4. Click "ถัดไป"
5. Verify OTP sent to phone (check SMS/email logs)
6. Enter OTP code in 6 input fields
7. Click "ถัดไป"
8. Fill "Step 3: ข้อมูลสมัครสมาชิก":
   - Full Name: `ทดสอบ จันทร์`
   - Email: `testuser@example.com`
   - Password: `Test@1234`
   - Confirm: `Test@1234`
9. Click "สมัครสมาชิก"

**Expected Result:**
- ✅ Account created
- ✅ Token stored in localStorage
- ✅ Redirect to home page
- ✅ User can login with email/phone

**Status:** 🟡 PARTIAL (OTP system may not be fully integrated)

---

#### TC-U-002: Login with Email
**Objective:** User can login using email

**Steps:**
1. Go to `/auth/login`
2. Enter "Email or Phone": `testuser@example.com`
3. Enter "Password": `Test@1234`
4. Click "เข้าสู่ระบบ"

**Expected Result:**
- ✅ Token saved to localStorage
- ✅ User profile loaded
- ✅ Redirect to home page or previous page
- ✅ Navbar shows user info

**Status:** ✅ WORKING

---

#### TC-U-003: Login with Phone
**Objective:** User can login using phone number

**Steps:**
1. Go to `/auth/login`
2. Enter "Email or Phone": `0987654321`
3. Enter "Password": `Test@1234`
4. Click "เข้าสู่ระบบ"

**Expected Result:**
- ✅ Detect as phone (8+ digits)
- ✅ Call `/auth/login-phone` instead of `/auth/login`
- ✅ Token saved
- ✅ Redirect to home

**Status:** ⚠️ NEEDS TESTING (backend may need `/auth/login-phone` endpoint)

---

#### TC-U-004: Invalid Credentials
**Objective:** System shows error for wrong password

**Steps:**
1. Go to `/auth/login`
2. Enter valid email but wrong password
3. Click "เข้าสู่ระบบ"

**Expected Result:**
- ❌ Error message: "Invalid credentials" / "รหัสผ่านไม่ถูกต้อง"
- ❌ Stay on login page
- ❌ Token NOT saved

**Status:** ⚠️ NEEDS TESTING

---

#### TC-U-005: Logout
**Objective:** User can logout and clear session

**Steps:**
1. Login successfully
2. Go to Profile or click user menu
3. Click "ออกจากระบบ" (Logout)

**Expected Result:**
- ✅ Token removed from localStorage
- ✅ User data cleared
- ✅ Redirect to home or login
- ✅ Cannot access protected pages

**Status:** ✅ LIKELY WORKING

---

### 1.2 PRODUCT BROWSING & SEARCH

#### TC-U-101: View Product Listing
**Objective:** User can see products on home page

**Steps:**
1. Go to home page
2. View products list
3. Check pagination (should show 32 items)
4. Scroll down, check if pagination works

**Expected Result:**
- ✅ Products displayed with images
- ✅ Price shown
- ✅ Star rating visible
- ✅ Pagination works (load more or prev/next)

**Status:** ✅ WORKING

---

#### TC-U-102: Filter by Category
**Objective:** User can filter products by category

**Steps:**
1. On home page, look for category filter
2. Click on category (e.g., "ผลไม้นำเข้า")
3. Check if product list updates

**Expected Result:**
- ✅ Products filtered to selected category
- ✅ Category chip shows as selected (highlight)
- ✅ All displayed products match category

**Status:** ⚠️ NEEDS TESTING (filter UI location unclear)

---

#### TC-U-103: Search Products
**Objective:** User can search by keyword

**Steps:**
1. Look for search bar on navbar
2. Enter keyword: `ทุเรียน`
3. Press Enter or click search

**Expected Result:**
- ✅ Results show only products matching "ทุเรียน"
- ✅ Or redirect to search results page

**Status:** ⚠️ UNCERTAIN (search UI may not exist on navbar)

---

#### TC-U-104: View Product Detail
**Objective:** User can click product and see full details

**Steps:**
1. Click on any product card
2. View product detail page
3. Check all information visible

**Expected Result:**
- ✅ Product name, price, description
- ✅ Images (carousel works)
- ✅ Star rating & review count
- ✅ Shop information card
- ✅ Stock status (พร้อมส่ง/หมด)
- ✅ Quantity & weight inputs
- ✅ "Add to Cart" button
- ✅ "Buy Now" button

**Status:** ✅ WORKING

---

#### TC-U-105: View Product Reviews
**Objective:** User can see reviews on product page

**Steps:**
1. Go to product detail page
2. Scroll to "Reviews" section
3. Check review cards

**Expected Result:**
- ✅ Average rating displayed (e.g., 4.5 ⭐)
- ✅ Total reviews count shown
- ✅ Individual reviews show:
   - User avatar & name
   - Star rating
   - Quality text (e.g., "สดใหม่")
   - Taste text (e.g., "หวานหอม")
   - Review body text
   - Review image (if any)
   - Date
- ✅ Pagination for reviews (show 3 per page)

**Status:** 🟡 PARTIAL (fetching from API now, but may have display issues)

---

### 1.3 SHOPPING CART

#### TC-U-201: Add Product to Cart
**Objective:** User can add product to cart

**Steps:**
1. Go to product detail page
2. Set quantity: `2`
3. Set weight (kg): `1` (per item)
4. Click "🛒 เพิ่มไปยังรถเข็น"

**Expected Result:**
- ✅ "เพิ่มสินค้าในตะกร้าแล้ว" notification
- ✅ Cart count increases (shown in navbar)
- ✅ Product added to Redux + Backend cart

**Status:** ⚠️ PARTIAL (Redux works, but Backend API may need testing)

---

#### TC-U-202: View Cart
**Objective:** User can view all items in cart

**Steps:**
1. Click cart icon in navbar
2. Or go to `/cart`

**Expected Result:**
- ✅ Shows all items grouped by shop
- ✅ Shows:
   - Product image, name
   - Price, quantity, weight
   - Line total (price × qty × weight)
- ✅ Shop name & subtotal
- ✅ Grand total at bottom
- ✅ Items can be selected (checkbox)
- ✅ "Select All" option

**Status:** 🟡 PARTIAL (UI ready but may have data loading issues)

---

#### TC-U-203: Update Cart Item Quantity
**Objective:** User can change quantity in cart

**Steps:**
1. On cart page, find item
2. Click "-" button to decrease qty
3. Or click "+" to increase
4. Or manually type in qty field

**Expected Result:**
- ✅ Quantity updates (min: 1)
- ✅ Line total recalculates
- ✅ Grand total updates
- ✅ Cart syncs with API

**Status:** ⚠️ NEEDS TESTING

---

#### TC-U-204: Remove Item from Cart
**Objective:** User can remove product from cart

**Steps:**
1. On cart page, find item
2. Click remove/delete button or icon
3. Confirm deletion if prompted

**Expected Result:**
- ✅ Item removed from display
- ✅ Cart total updates
- ✅ Backend cart updated
- ✅ Notification: "ลบสินค้าออกจากตะกร้าแล้ว"

**Status:** ⚠️ NEEDS TESTING

---

#### TC-U-205: Clear Cart
**Objective:** User can remove all items at once

**Steps:**
1. On cart page, look for "Clear Cart" or similar button
2. Click it, confirm if prompted

**Expected Result:**
- ✅ All items removed
- ✅ Cart becomes empty
- ✅ Cart count = 0

**Status:** ⚠️ UNCERTAIN (button may not exist)

---

### 1.4 CHECKOUT & PAYMENT

#### TC-U-301: Checkout - COD Payment
**Objective:** User can checkout with Cash on Delivery

**Steps:**
1. Go to cart with items
2. Select items to buy (checkboxes)
3. Click "ดำเนินการชำระเงิน"
4. Fill checkout form:
   - Full Name: `ทดสอบ จันทร์`
   - Phone: `0987654321`
   - Address: `123 Moo 1, Soi 5`
   - Province: `Bangkok`
   - Postal Code: `10110`
   - Delivery Date: `2026-04-22` (tomorrow)
   - Delivery Slot: `morning` (รอบเช้า)
   - Payment Method: `cod` (ชำระเงินปลายทาง)
   - Note: `ไม่บีบสินค้า`
5. Click "สั่งซื้อสินค้า"

**Expected Result:**
- ✅ Order created successfully
- ✅ Notification: "สั่งซื้อสำเร็จ!"
- ✅ Redirect to success page
- ✅ Show order ID
- ✅ Estimated delivery date shown
- ✅ Cart cleared

**Status:** 🟡 PARTIAL (backend order creation works, but success page may have issues)

---

#### TC-U-302: Checkout - PromptPay Payment
**Objective:** User can checkout with PromptPay

**Steps:**
1. Go to cart with items
2. On checkout page, select payment method: `PromptPay`
3. Confirm order
4. Redirect to PromptPay page with QR code

**Expected Result:**
- ✅ QR code displays (from PromptPay API)
- ✅ Shows amount to pay
- ✅ User can upload slip image
- ✅ Show "รอการตรวจสอบ" (awaiting verification)

**Status:** ⚠️ NEEDS TESTING (PromptPay integration may not be complete)

---

#### TC-U-303: Verify PromptPay Payment (Seller)
**Objective:** Seller verifies payment slip, buyer can see status

**Steps:**
1. **Buyer:** Upload payment slip, wait
2. **Seller:** Go to pending orders, review slip
3. **Seller:** Click "อนุมัติ" to approve
4. **Buyer:** Refresh orders page

**Expected Result:**
- ✅ Order status changes to "to_ship" (รอจัดส่ง)
- ✅ Buyer sees updated status

**Status:** ⚠️ NEEDS TESTING

---

#### TC-U-304: Invalid Checkout Data
**Objective:** System validates required fields

**Steps:**
1. Try checkout without filling required fields
2. Leave "Full Name" empty
3. Click "สั่งซื้อสินค้า"

**Expected Result:**
- ❌ Error message: "กรุณากรอกชื่อ-นามสกุล"
- ❌ Cannot proceed

**Status:** ⚠️ NEEDS TESTING

---

### 1.5 ORDERS & TRACKING

#### TC-U-401: View Orders
**Objective:** User can see all their orders

**Steps:**
1. Go to Profile or Orders page
2. Click "คำสั่งซื้อของฉัน"

**Expected Result:**
- ✅ Shows all orders
- ✅ Grouped by status tabs:
   - ทั้งหมด (All)
   - รอชำระ (Unpaid)
   - รอจัดส่ง (To Ship)
   - กำลังจัดส่ง (Shipping)
   - ส่งสำเร็จ (Delivered)
- ✅ Each order card shows:
   - Shop name
   - Order ID
   - Status badge
   - Item thumbnails
   - Total price
   - Action buttons

**Status:** 🟡 PARTIAL (API integration done, may have display issues)

---

#### TC-U-402: Track Order Status
**Objective:** User can see detailed order info and tracking

**Steps:**
1. Click on order card / "ดูรายละเอียด"
2. View order detail page

**Expected Result:**
- ✅ Shows order ID, date
- ✅ All items with prices
- ✅ Delivery address
- ✅ Current status with timestamp
- ✅ Estimated delivery date
- ✅ Order timeline (if implemented)

**Status:** ⚠️ NEEDS TESTING

---

#### TC-U-403: Confirm Delivery
**Objective:** User marks order as received

**Steps:**
1. On orders page, find "Delivered" order
2. Click "ยืนยันการรับสินค้า" button

**Expected Result:**
- ✅ Status updates to "delivered" (confirmed)
- ✅ Notification shows
- ✅ Review button becomes available

**Status:** ⚠️ NEEDS TESTING

---

### 1.6 PRODUCT REVIEWS

#### TC-U-501: Submit Review
**Objective:** User can review a delivered product

**Steps:**
1. Go to Orders page
2. Find order with status "ส่งสำเร็จ" (Delivered)
3. Click "⭐ รีวิว" button on item

**Expected Result:**
- ✅ ReviewModal opens
- ✅ Form has fields:
   - Star rating (1-5 ⭐)
   - Quality text input (e.g., "สดใหม่")
   - Taste text input (e.g., "หวานหอม")
   - Review body textarea (required)
   - Image upload (optional)
4. Fill form with review data
5. Click "ส่งรีวิว"

**Expected Result:**
- ✅ Review submitted
- ✅ "รีวิวสำเร็จ" notification
- ✅ Button changes to "✓ รีวิวแล้ว" (disabled)
- ✅ Review appears on product page (after refresh)

**Status:** 🟡 PARTIAL (ReviewModal ready, but submission may need testing)

---

#### TC-U-502: View Product Reviews (from Product Page)
**Objective:** User sees reviews on product detail

**Steps:**
1. Go to any product detail page
2. Scroll to "รีวิวสินค้า" section
3. See reviews from other buyers

**Expected Result:**
- ✅ Shows average rating
- ✅ Review count
- ✅ Individual reviews with:
   - User avatar & name
   - Star rating
   - Quality/taste text
   - Review body
   - Date
   - Image (if any)
- ✅ Pagination (3 per page)

**Status:** 🟡 PARTIAL (fetching from API, but may have data issues)

---

#### TC-U-503: Edit/Delete Review (Future)
**Objective:** User can update or remove review

**Status:** 🔴 NOT IMPLEMENTED

**Suggested Implementation:**
```
PUT /reviews/{review_id}
DELETE /reviews/{review_id}
```

---

### 1.7 FOLLOW SHOPS

#### TC-U-601: Follow a Shop
**Objective:** User can follow shops to get notifications

**Steps:**
1. Go to product detail page
2. On "ShopCard" section, click "+ ติดตาม" button

**Expected Result:**
- ✅ Button changes to "✓ ติดตามแล้ว"
- ✅ Notification: "ติดตามร้านค้าแล้ว"
- ✅ Shop added to "Followed Shops" list

**Status:** ✅ LIKELY WORKING

---

#### TC-U-602: Unfollow a Shop
**Objective:** User can unfollow shop

**Steps:**
1. On product page, click "✓ ติดตามแล้ว" button
2. Or go to profile, find followed shops section
3. Click unfollow

**Expected Result:**
- ✅ Button changes to "+ ติดตาม"
- ✅ Notification: "เลิกติดตามร้านค้าแล้ว"

**Status:** ⚠️ NEEDS TESTING

---

### 1.8 PROFILE & SETTINGS

#### TC-U-701: View Profile
**Objective:** User can view their profile info

**Steps:**
1. Click profile icon in navbar
2. Or go to `/profile`

**Expected Result:**
- ✅ Shows user info:
   - Name, email, phone
   - Address, province, postal code
   - Birth date, gender
- ✅ Edit buttons for each section

**Status:** 🟡 PARTIAL (layout exists but may have data loading issues)

---

#### TC-U-702: Update Profile
**Objective:** User can edit profile information

**Steps:**
1. On profile page, click edit button
2. Change name: `นายทดสอบ ใหม่`
3. Change phone: `0891234567`
4. Click "บันทึก"

**Expected Result:**
- ✅ Data updates in database
- ✅ Confirmation: "อัปเดตโปรไฟล์สำเร็จ"
- ✅ New data displays on page

**Status:** ⚠️ NEEDS TESTING

---

#### TC-U-703: Change Password
**Objective:** User can change their password

**Steps:**
1. On profile page, find "Change Password" section
2. Enter old password, new password (confirm)
3. Click "เปลี่ยนรหัสผ่าน"

**Expected Result:**
- ✅ "เปลี่ยนรหัสผ่านสำเร็จ"
- ✅ Can login with new password next time

**Status:** ⚠️ NEEDS TESTING

---

#### TC-U-704: Save Address for Future Orders
**Objective:** User can save address book

**Steps:**
1. On checkout page, fill address info
2. Look for "Save for future orders" checkbox
3. Check it, proceed with order

**Expected Result:**
- ✅ Address saved to localStorage (AddressBook)
- ✅ Next checkout shows saved addresses in dropdown

**Status:** ⚠️ NEEDS TESTING (feature may be in code but unclear UI)

---

## 2. SELLER TEST CASES

### 2.1 SELLER REGISTRATION & SETUP

#### TC-S-001: Register as Seller
**Objective:** Existing user can register as seller

**Steps:**
1. Login as regular customer
2. Go to `/seller/register`
3. Fill seller form:
   - Shop Name: `ร้านผลไม้บ้านเรา`
   - Owner Name: `ทดสอบ จันทร์`
   - Phone: `0987654321`
   - PromptPay Type: `phone`
   - PromptPay Value: `0987654321`
   - Address: `123 Moo 1, Soi 5`
   - Province: `Bangkok`
   - Postal Code: `10110`
4. Click "สมัครเป็นผู้ขาย"

**Expected Result:**
- ✅ Backend creates shop record
- ✅ New token issued with "seller" role
- ✅ Redirect to seller products page
- ✅ "สมัครสำเร็จ!" message
- ✅ Redux seller profile updated

**Status:** 🟡 PARTIAL (backend route exists, but needs testing)

---

#### TC-S-002: View Seller Profile
**Objective:** Seller can see their shop info

**Steps:**
1. Logged in as seller
2. Go to `/seller` or click "Seller Dashboard"

**Expected Result:**
- ✅ Shows shop name, owner, phone
- ✅ Shows follower count, rating
- ✅ Quick stats:
   - Total products
   - Pending orders (awaiting payment verification)
   - Total orders
   - Revenue
- ✅ Quick action buttons:
   - "จัดการสินค้า" (Manage Products)
   - "จัดการออเดอร์" (Manage Orders)

**Status:** ⚠️ PARTIAL (dashboard exists but may have data loading issues)

---

### 2.2 PRODUCT MANAGEMENT

#### TC-S-101: Create Product
**Objective:** Seller can list new product

**Steps:**
1. Go to `/seller/products` or click "จัดการสินค้า"
2. Click "เพิ่มสินค้าใหม่" button
3. Fill form:
   - Name: `ส้มสายน้ำหวานจากบ้าน`
   - Price: `150`
   - Original Price: `180` (optional)
   - Category: `ส้มและเลมอน`
   - Description: `ส้มจากบ้าน ปลูกแบบธรรมชาติไม่ใช้สารเคมี`
   - Stock: `100`
   - Images: Upload 3 images
4. Click "สร้างสินค้า"

**Expected Result:**
- ✅ Backend creates product with seller_id
- ✅ Product appears on home page
- ✅ Product accessible on `/details/{id}`
- ✅ "สร้างสินค้าสำเร็จ!" notification

**Status:** 🟡 PARTIAL (backend exists, previously had issues but fixed)

---

#### TC-S-102: Edit Product
**Objective:** Seller can modify existing product

**Steps:**
1. On products page, click edit icon on product
2. Change price: `140`
3. Change stock: `50`
4. Click "บันทึก"

**Expected Result:**
- ✅ Changes saved to database
- ✅ Product page reflects new info
- ✅ "อัปเดตสินค้าสำเร็จ!" notification

**Status:** ⚠️ NEEDS TESTING

---

#### TC-S-103: Delete Product
**Objective:** Seller can remove product

**Steps:**
1. On products page, find product
2. Click delete/trash icon
3. Confirm deletion

**Expected Result:**
- ✅ Product removed from database
- ✅ No longer visible on home page
- ✅ "ลบสินค้าสำเร็จ!" notification

**Status:** ⚠️ NEEDS TESTING

---

#### TC-S-104: View My Products
**Objective:** Seller can see all their products

**Steps:**
1. Go to `/seller/products`

**Expected Result:**
- ✅ Shows all products created by this seller
- ✅ Grid or list layout
- ✅ Shows:
   - Product image
   - Name, price
   - Stock count
   - Edit/Delete buttons
- ✅ Pagination if > 10 products

**Status:** ⚠️ NEEDS TESTING

---

### 2.3 ORDER MANAGEMENT

#### TC-S-201: Verify Payment Slip
**Objective:** Seller reviews PromptPay payment and approves

**Steps:**
1. Go to `/seller/orders-pending`
2. See orders with status "unpaid" & "pending_verification"
3. Click "ดูสลิป" to view payment slip
4. Review slip image
5. Click "อนุมัติ" to approve

**Expected Result:**
- ✅ Order status changes to "to_ship"
- ✅ Notification: "ตรวจสอบสลิปผ่าน"
- ✅ Order moves to shipping section

**Status:** 🟡 PARTIAL (UI exists, but needs API testing)

---

#### TC-S-202: Reject Payment Slip
**Objective:** Seller can reject invalid payment slip

**Steps:**
1. On pending orders page
2. Click "ไม่อนุมัติ" button
3. Select reason: `สลิปไม่ชัดเจน`
4. Click "ยืนยัน"

**Expected Result:**
- ✅ Order status stays "unpaid"
- ✅ Notification to buyer: "สลิปไม่ผ่าน: สลิปไม่ชัดเจน"
- ✅ Buyer can upload new slip

**Status:** ⚠️ NEEDS TESTING

---

#### TC-S-203: Manage Orders - Mark as Shipping
**Objective:** Seller marks order as shipped

**Steps:**
1. Go to `/seller/orders` or orders-to-ship page
2. Find order with status "to_ship" (รอจัดส่ง)
3. Click "ส่งออกแล้ว" or "Mark as Shipping"

**Expected Result:**
- ✅ Status changes to "shipping"
- ✅ Notification: "สินค้า {id} ออกจัดส่งแล้ว"
- ✅ Buyer sees updated status

**Status:** ⚠️ NEEDS TESTING

---

#### TC-S-204: Manage Orders - Mark as Delivered
**Objective:** Seller marks order as successfully delivered

**Steps:**
1. Find order with status "shipping"
2. Click "ส่งสำเร็จ" button

**Expected Result:**
- ✅ Status changes to "delivered"
- ✅ Notification to buyer: "สินค้าถึงปลายทางแล้ว"
- ✅ Review section opens for buyer

**Status:** ⚠️ NEEDS TESTING

---

#### TC-S-205: View Seller Orders Dashboard
**Objective:** Seller sees all orders with filtering

**Steps:**
1. Go to `/seller/orders` or `/seller/orders-to-ship`
2. See tabs/sections:
   - รอจัดส่ง (To Ship)
   - กำลังจัดส่ง (Shipping)
   - ส่งสำเร็จ (Delivered)
   - แจ้งปัญหา (Claims)

**Expected Result:**
- ✅ Orders grouped by status
- ✅ Shows counts for each status
- ✅ Can switch between tabs
- ✅ Each order card shows:
   - Order ID
   - Buyer name
   - Items list
   - Total price
   - Action buttons

**Status:** 🟡 PARTIAL (UI exists but may have data issues)

---

### 2.4 CLAIMS & REFUNDS

#### TC-S-301: Receive Claim from Buyer
**Objective:** Seller sees claim notification

**Steps:**
1. Buyer orders product, receives it, claims damage
2. Seller goes to `/seller/orders`
3. Looks for "แจ้งปัญหา" (Claim) tab

**Expected Result:**
- ✅ Shows claimed orders
- ✅ Shows claim reason: "สินค้าเสียหาย"
- ✅ Shows refund amount requested
- ✅ Buttons: "อนุมัติเคลม" / "ปฏิเสธเคลม"

**Status:** 🟡 PARTIAL (claim system exists but may need testing)

---

#### TC-S-302: Approve Claim
**Objective:** Seller approves claim and processes refund

**Steps:**
1. On claimed order
2. Click "อนุมัติเคลม"

**Expected Result:**
- ✅ Status changes to "claim" with "approved"
- ✅ Notification: "อนุมัติเคลมแล้ว"
- ✅ System marks refund as pending
- ✅ Seller may see refund instructions

**Status:** 🟡 PARTIAL (needs testing)

---

#### TC-S-303: Reject Claim
**Objective:** Seller rejects claim with reason

**Steps:**
1. On claimed order
2. Click "ปฏิเสธเคลม"
3. Enter reason: `สินค้าอยู่ในเงื่อนไขปกติ ไม่พบความเสีย`
4. Click "ส่ง"

**Expected Result:**
- ✅ Claim status: "rejected"
- ✅ Notification to buyer: "เคลมถูกปฏิเสธ"
- ✅ No refund issued

**Status:** ⚠️ NEEDS TESTING

---

### 2.5 ANALYTICS & DASHBOARD

#### TC-S-401: View Sales Summary
**Objective:** Seller sees key metrics

**Steps:**
1. Go to `/seller` (dashboard)

**Expected Result:**
- ✅ Shows metrics cards:
   - Total Products
   - Pending Orders (awaiting payment)
   - Total Orders
   - Revenue (฿)
- ✅ May show charts (if implemented):
   - Sales over time
   - Revenue by product
   - Orders by status

**Status:** ⚠️ PARTIAL (numbers displayed but may need real data)

---

#### TC-S-402: View Revenue Report
**Objective:** Seller can see detailed sales report

**Steps:**
1. Look for "Revenue" or "Sales Report" link on seller dashboard
2. May have date range filters

**Expected Result:**
- ✅ Shows:
   - Total revenue
   - Total orders
   - Average order value
   - Revenue breakdown by product/date
- ✅ Export or print option (optional)

**Status:** 🔴 NOT FULLY IMPLEMENTED

---

## 3. ADMIN TEST CASES

### 3.1 ADMIN AUTHENTICATION

#### TC-A-001: Admin Login
**Objective:** Admin can login with special role

**Note:** Need to verify if admin role exists in system

**Expected:**
```
User with role: 'admin'
Has access to: /admin, /admin/dashboard, /admin/users, etc.
```

**Status:** 🔴 UNCLEAR (admin features may not be implemented)

---

### 3.2 USER MANAGEMENT (Admin)

#### TC-A-101: View All Users
**Objective:** Admin can see list of all users

**Status:** 🔴 NOT IMPLEMENTED

**Suggested Endpoint:**
```
GET /admin/users
Query: page, limit, search, role filter
```

---

#### TC-A-102: Manage User Roles
**Objective:** Admin can change user roles

**Status:** 🔴 NOT IMPLEMENTED

**Suggested Endpoint:**
```
PUT /admin/users/{userId}
Body: { role: 'customer' | 'seller' | 'admin' }
```

---

#### TC-A-103: Ban/Suspend User
**Objective:** Admin can disable problematic users

**Status:** 🔴 NOT IMPLEMENTED

**Suggested Endpoint:**
```
POST /admin/users/{userId}/ban
Body: { reason: string, duration: number (days) }
```

---

### 3.3 SELLER MANAGEMENT (Admin)

#### TC-A-201: Verify Seller Account
**Objective:** Admin reviews and approves seller registrations

**Status:** 🟡 PARTIAL (may exist but not documented)

**Suggested Endpoint:**
```
GET /admin/sellers/pending
POST /admin/sellers/{sellerId}/verify
POST /admin/sellers/{sellerId}/reject
```

---

#### TC-A-202: View Seller Performance
**Objective:** Admin monitors seller metrics

**Status:** 🔴 NOT IMPLEMENTED

**Suggested Page:**
```
/admin/sellers
- View all sellers
- Sort by: revenue, orders, rating
- View each seller's stats
- Can take action: warn, suspend, ban
```

---

### 3.4 PRODUCT MODERATION (Admin)

#### TC-A-301: Review Flagged Products
**Objective:** Admin reviews products reported as inappropriate

**Status:** 🔴 NOT FULLY IMPLEMENTED

**Note:** Need flag/report system first

---

#### TC-A-302: Remove Product
**Objective:** Admin can forcefully remove inappropriate product

**Status:** 🔴 PARTIAL (delete exists but admin-only flag missing)

**Suggested Endpoint:**
```
DELETE /admin/products/{productId}
Body: { reason: string }
```

---

### 3.5 ORDER & PAYMENT AUDITING (Admin)

#### TC-A-401: View All Orders
**Objective:** Admin can see system-wide orders

**Status:** 🔴 NOT IMPLEMENTED

**Suggested Endpoint:**
```
GET /admin/orders
Query: status, dateRange, shop filter
```

---

#### TC-A-402: Verify Suspicious Payments
**Objective:** Admin reviews flagged or suspicious payments

**Status:** 🔴 NOT IMPLEMENTED

---

#### TC-A-403: Manual Refund Processing
**Objective:** Admin can issue refunds directly

**Status:** 🔴 NOT IMPLEMENTED

**Suggested Endpoint:**
```
POST /admin/orders/{orderId}/refund
Body: { amount: number, reason: string }
```

---

### 3.6 SYSTEM SETTINGS (Admin)

#### TC-A-501: Configure Shipping Fees
**Objective:** Admin sets default shipping fee

**Status:** 🟡 PARTIAL (hardcoded as 50 in frontend)

**Current:** `const SHIPPING_FEE = 50;`

**Needed:**
- Admin panel to change fee
- Store in database
- Frontend fetches from API

---

#### TC-A-502: View System Logs
**Objective:** Admin can see system activity and errors

**Status:** 🔴 NOT IMPLEMENTED

---

#### TC-A-503: Manage Categories
**Objective:** Admin can add/edit/delete product categories

**Status:** ⚠️ PARTIAL (hardcoded mock data, no admin CRUD)

---

## 4. SYSTEM/INTEGRATION TEST CASES

### 4.1 DATA VALIDATION

#### TC-I-001: Email Validation
**Test:** System rejects invalid emails

**Scenarios:**
- `invalid@` - ❌ Missing domain
- `@example.com` - ❌ Missing local part
- `user@example` - ⚠️ May be accepted (no TLD)
- `user+tag@example.com` - ✅ Should work

**Status:** ⚠️ NEEDS TESTING

---

#### TC-I-002: Phone Validation
**Test:** System accepts only valid phone numbers

**Scenarios:**
- `081234567` (9 digits) - ✅ Valid (8+ digits required)
- `0812345678` (10 digits) - ✅ Valid
- `+66812345678` - ⚠️ Check if supported
- `abc1234567` - ❌ Non-numeric

**Status:** ⚠️ NEEDS TESTING

---

#### TC-I-003: Price Validation
**Test:** Only positive numbers accepted

**Scenarios:**
- `150` - ✅ Valid
- `150.50` - ✅ Valid (2 decimal places)
- `-50` - ❌ Negative
- `abc` - ❌ Non-numeric
- `0` - ⚠️ Allow zero price?

**Status:** ⚠️ NEEDS TESTING

---

### 4.2 CONCURRENT OPERATIONS

#### TC-I-101: Simultaneous Cart Updates
**Test:** Multiple users adding same product doesn't cause stock issues

**Status:** ⚠️ NEEDS TESTING (potential race condition)

---

#### TC-I-102: Duplicate Order Prevention
**Test:** User cannot accidentally create duplicate order

**Status:** ⚠️ NEEDS TESTING

---

### 4.3 API INTEGRATION

#### TC-I-201: Token Refresh
**Test:** Expired token is refreshed or user redirected to login

**Status:** ⚠️ NEEDS TESTING

**Current:** On 401, redirect to `/auth/login`

---

#### TC-I-202: Network Error Handling
**Test:** App handles network failures gracefully

**Scenarios:**
- Backend offline - Show error message
- Slow connection - Loading spinners
- Lost connection mid-request - Retry option

**Status:** ⚠️ PARTIAL (some error handling exists)

---

### 4.4 SECURITY

#### TC-I-301: SQL Injection Prevention
**Status:** ✅ Using parameterized queries (backend)

---

#### TC-I-302: XSS Prevention
**Test:** User-submitted content (reviews) doesn't execute scripts

**Status:** ⚠️ NEEDS TESTING (React auto-escapes but check review rendering)

---

#### TC-I-303: CSRF Protection
**Status:** 🔴 NOT CLEARLY IMPLEMENTED (check backend)

---

#### TC-I-304: Password Security
**Test:** Passwords stored as hashes, not plain text

**Status:** ⚠️ NEEDS VERIFICATION IN BACKEND

---

### 4.5 PERFORMANCE

#### TC-I-401: Page Load Time
**Target:** Home page < 2s on 3G

**Status:** ⚠️ NEEDS TESTING (no CDN, no image optimization)

---

#### TC-I-402: Large Product List
**Test:** Can handle 1000+ products without slowdown

**Status:** ⚠️ NEEDS TESTING (pagination implemented but may have issues)

---

---

## 5. BUGS & ISSUES FOUND

### 🔴 CRITICAL (Block Release)

| # | Component | Issue | Impact | Status |
|---|-----------|-------|--------|--------|
| B-001 | OrdersTab Review | `SmallStarRating` component was missing | Review UI crashes | ✅ FIXED |
| B-002 | TypeScript | 23 compilation errors in product-detail.tsx | Build fails | ✅ FIXED |
| B-003 | ProductReviewsCard | Uses mock data instead of API | Reviews don't update | ✅ FIXED |
| B-004 | Seller Registration | May not create shop correctly | Seller can't list products | ⚠️ NEEDS TESTING |
| B-005 | Backend Port | Port 5000 was blocked (old process) | API unreachable | ✅ FIXED (killed process) |

---

### 🟠 HIGH (Should Fix Before Release)

| # | Component | Issue | Impact | Workaround |
|---|-----------|-------|--------|-----------|
| B-101 | Cart API | Backend may not sync deletions | Items remain in cart | Use Redux-only cart |
| B-102 | Payment | PromptPay integration untested | Buyers can't use PromptPay | Test flow manually |
| B-103 | Admin | No admin dashboard at all | No system oversight | Create basic admin panel |
| B-104 | Search | No search functionality visible | Users can't find products | Add search bar to navbar |
| B-105 | Categories | Category filter UI unclear | Users can't browse by category | Implement clear filter UI |

---

### 🟡 MEDIUM (Nice to Have)

| # | Component | Issue | Impact |
|---|-----------|-------|--------|
| B-201 | Seller Stats | Stats endpoint may not exist | Seller metrics not accurate |
| B-202 | Error Messages | Generic error messages | Users don't understand what failed |
| B-203 | Loading States | Some pages lack loading spinners | UX feels slow |
| B-204 | Notifications | Toast notifications may not persist well | Users miss important messages |

---

## 6. FEATURES TO ADD/IMPROVE

### 🎯 PRIORITY: CRITICAL

#### 6.1 Admin Dashboard
**Effort:** 🕐 8-10 hours  
**Impact:** 🔴 High (system needs oversight)

**Includes:**
- Admin login with special role
- User management page (view, ban, roles)
- Seller verification queue
- Product moderation
- Order auditing
- System configuration (shipping fee, etc.)

**Start:**
```tsx
// src/pages/admin/AdminDashboard.tsx
// src/pages/admin/AdminUsersPage.tsx
// src/pages/admin/AdminSellersPage.tsx
// src/routes/admin-routes.tsx
```

---

#### 6.2 Complete Payment Integration
**Effort:** 🕐 5-6 hours  
**Impact:** 🔴 High (affects all transactions)

**Issues:**
- PromptPay verification flow unclear
- No OTP for sensitive operations
- PromptPay provider API not integrated

**To Do:**
- Integrate real PromptPay provider
- Test payment verification flow
- Add transaction logging

---

#### 6.3 Search Functionality
**Effort:** 🕐 3-4 hours  
**Impact:** 🔴 High (affects discoverability)

**Add:**
- Search bar in navbar
- Search results page
- Filter by price, rating, category
- Sort by relevance, price, rating

**Backend Endpoint:**
```
GET /products/search?q=keyword&category=&minPrice=&maxPrice=
```

---

### 🎯 PRIORITY: HIGH

#### 6.4 Email Notifications
**Effort:** 🕐 4-5 hours  
**Impact:** 🟠 Medium-High

**Send emails for:**
- Order confirmation
- Payment received
- Order shipped
- Order delivered
- Review request
- Product restocked

**Provider:** SendGrid / Gmail SMTP

---

#### 6.5 SMS Notifications
**Effort:** 🕐 3-4 hours  
**Impact:** 🟠 Medium

**Send SMS for:**
- OTP during registration
- Order status updates
- Payment confirmation

**Provider:** Twilio / Thailand local provider

---

#### 6.6 Seller Ratings & Reviews
**Effort:** 🕐 4-5 hours  
**Impact:** 🟠 Medium

**Features:**
- Overall seller rating (separate from product reviews)
- Seller reviews page
- Buyer can review seller (delivery speed, communication)
- Display on shop profile

---

#### 6.7 Wishlist / Favorites
**Effort:** 🕐 2-3 hours  
**Impact:** 🟠 Medium

**Features:**
- Heart icon on product cards
- `/favorites` page
- Sync with backend
- Share wishlist

---

### 🎯 PRIORITY: MEDIUM

#### 6.8 Real-time Order Tracking
**Effort:** 🕐 4-5 hours  
**Impact:** 🟡 Medium

**Features:**
- Order timeline with updates
- Map view (if shipping provider has tracking)
- Live status updates (WebSocket)

---

#### 6.9 Seller Shop Customization
**Effort:** 🕐 5-6 hours  
**Impact:** 🟡 Medium

**Features:**
- Custom shop description & banners
- Operating hours
- Policy (return, warranty, etc.)
- Shop social links

---

#### 6.10 Product Variants/Options
**Effort:** 🕐 6-8 hours  
**Impact:** 🟡 Medium

**Example:** Same product, different weights/grades

```
Product: Apple
Variants:
- Grade A: 150฿/kg
- Grade B: 120฿/kg
- Grade C: 80฿/kg
```

---

### 🎯 PRIORITY: LOW (Future Enhancements)

#### 6.11 Bulk Ordering / B2B
**Features:** Buyer can order 50kg+ at discounted rate

#### 6.12 Subscription / Recurring Orders
**Features:** Auto-deliver fruits weekly/monthly

#### 6.13 Live Chat Support
**Provider:** Intercom / Zendesk

#### 6.14 Loyalty Points System
**Features:** Earn points on purchase, redeem for discounts

#### 6.15 Social Features
**Features:** Follow users, share products to social media

---

## 7. TESTING CHECKLIST

### ✅ Before Going Live

- [ ] All test cases in section 1 (User) executed
- [ ] All test cases in section 2 (Seller) executed
- [ ] Critical bugs (section 5) are resolved
- [ ] Payment flow tested with real PromptPay
- [ ] Email/SMS notifications sent correctly
- [ ] Mobile responsive design tested
- [ ] Performance tested on slow network (3G)
- [ ] Security audit completed
- [ ] Database backup & recovery tested
- [ ] Error handling & logging in place
- [ ] Analytics/monitoring configured

---

### 📋 Test Execution Template

For each test case, document:

```markdown
### TC-U-001: Register as New Customer

**Test Date:** 2026-04-21  
**Tester:** QA Team  
**Environment:** Staging

**Result:** 🟡 PARTIAL
- ✅ Account created
- ✅ Token saved
- ⚠️ OTP verification flow unclear
- ❌ Email verification missing

**Notes:** Backend OTP may not be sending actual SMS

**Screenshots:** [attach if needed]

**Next Steps:**
- [ ] Contact backend team about OTP service
- [ ] Test with different phone providers
```

---

## 8. RECOMMENDED TEST EXECUTION ORDER

### Phase 1: Critical Path (Day 1)
1. User Registration & Login
2. Browse Products
3. Add to Cart → Checkout → Order
4. Seller: Register → Create Product → Manage Orders

### Phase 2: Features (Day 2)
1. Reviews system
2. Payment verification
3. Search & filters
4. Follow shops

### Phase 3: Edge Cases (Day 3)
1. Data validation
2. Error scenarios
3. Concurrent operations
4. Security tests

### Phase 4: Performance & Compatibility (Day 4)
1. Load testing
2. Mobile responsive
3. Browser compatibility
4. Slow network tests

---

## 9. TEST CASES ขั้นสูง (ADVANCED TEST CASES)

### 9.1 EDGE CASES - การซื้อสินค้า

#### TC-ADV-U-001: ซื้อสินค้ากับจำนวนคลังสินค้าน้อย
**วัตถุประสงค์:** ระบบจัดการการซื้อสินค้าที่คลังเหลือไม่มาก

**ขั้นตอน:**
1. สินค้า X มีคลังเหลือ 3 ชิ้นเท่านั้น
2. ผู้ซื้อ A เพิ่มในตะกร้า 2 ชิ้น
3. ผู้ซื้อ B พยายามเพิ่มในตะกร้า 3 ชิ้น (พร้อมกันหรือหลัง)
4. ทั้งคู่ทำการสั่งซื้อ

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ผู้ซื้อ A: สั่งซื้อสำเร็จ
- ✅ ผู้ซื้อ B: เตือน "คลังสินค้าไม่เพียงพอ แล้ว {จำนวนเหลือ} ชิ้น"
- ✅ ผู้ซื้อ B สามารถปรับจำนวนลด เหลือ 1 ชิ้น และสั่งซื้อได้

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-U-002: สินค้าหมดคลังระหว่างชำระเงิน
**วัตถุประสงค์:** ตรวจสอบว่าระบบแจ้งเตือนเมื่อสินค้าหมดระหว่างกระบวนการชำระเงิน

**ขั้นตอน:**
1. เพิ่มสินค้า 5 ชิ้นไปยังตะกร้า
2. ไปหน้าชำระเงิน
3. ในระหว่างที่ผู้ซื้อกำลังบันทึกข้อมูล ผู้ขายลดคลังสินค้า (Admin ทำได้)
4. สินค้าหมดคลัง
5. ผู้ซื้อกดปุ่ม "สั่งซื้อสินค้า"

**ผลลัพธ์ที่คาดหวัง:**
- ❌ ไม่สามารถสร้างออเดอร์
- ✅ แสดงข้อความ "สินค้าบางรายการหมดคลัง: {รายการสินค้า}"
- ✅ อนุญาตให้ผู้ซื้อกลับไปปรับปรุงตะกร้า

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-U-003: ราคาเปลี่ยนแปลงระหว่างชำระเงิน
**วัตถุประสงค์:** ตรวจสอบการจัดการกรณีที่ราคาเปลี่ยนแปลง

**ขั้นตอน:**
1. เพิ่มสินค้าราคา 150฿ ไปตะกร้า
2. ไปหน้าชำระเงิน (แสดงราคา 150฿)
3. ผู้ขายเปลี่ยนราคาเป็น 180฿
4. ผู้ซื้อกดปุ่ม "สั่งซื้อสินค้า"

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ใช้ราคาที่เมื่อสั่งซื้อ (150฿) ไม่ใช่ราคาใหม่
- ✅ หรือแจ้งเตือน "ราคาเปลี่ยนแปลง" และให้ยืนยันใหม่

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-U-004: ตะกร้าว่าง - พยายามชำระเงิน
**วัตถุประสงค์:** ตรวจสอบการป้องกันการสั่งซื้อเมื่อไม่มีสินค้าในตะกร้า

**ขั้นตอน:**
1. เพิ่มสินค้า 2 ชิ้นไปตะกร้า
2. ไปหน้าชำระเงิน
3. ลบสินค้าทั้งหมดออกจากตะกร้า
4. กดปุ่ม "สั่งซื้อสินค้า"

**ผลลัพธ์ที่คาดหวัง:**
- ❌ ปุ่ม "สั่งซื้อสินค้า" ต้องปิดใช้งาน (disabled) หรือแสดงข้อผิดพลาด
- ✅ ข้อความ: "ไม่มีสินค้าในตะกร้า"

**สถานะ:** ⚠️ ต้องทดสอบ

---

### 9.2 EDGE CASES - โปรไฟล์และการจัดการบัญชี

#### TC-ADV-U-101: อัปเดตอีเมลที่มีอยู่ของผู้ใช้อื่น
**วัตถุประสงค์:** ป้องกันการใช้อีเมลซ้ำ

**ขั้นตอน:**
1. ผู้ใช้ A: อีเมล = `user_a@example.com`
2. ผู้ใช้ B: พยายามเปลี่ยนอีเมลเป็น `user_a@example.com`

**ผลลัพธ์ที่คาดหวัง:**
- ❌ ข้อความผิดพลาด: "อีเมลนี้ถูกใช้งานแล้ว"
- ✅ ไม่อนุญาตให้เปลี่ยนแปลง

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-U-102: เปลี่ยนรหัสผ่านด้วยรหัสเดิมที่ไม่ถูกต้อง
**วัตถุประสงค์:** ตรวจสอบรหัสเดิมก่อนอนุญาตให้เปลี่ยน

**ขั้นตอน:**
1. ผู้ใช้: อยากเปลี่ยนรหัสผ่าน
2. ใส่รหัสเดิม: `WrongPassword123`
3. ใส่รหัสใหม่: `NewPassword123`
4. ยืนยัน

**ผลลัพธ์ที่คาดหวัง:**
- ❌ ข้อความ: "รหัสผ่านเดิมไม่ถูกต้อง"
- ✅ ไม่สามารถเปลี่ยนรหัสผ่าน

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-U-103: กู้คืนบัญชีจากการลืมรหัสผ่าน
**วัตถุประสงค์:** ตรวจสอบกระบวนการรีเซ็ตรหัสผ่าน

**ขั้นตอน:**
1. ไปหน้าเข้าสู่ระบบ
2. คลิก "ลืมรหัสผ่าน?"
3. ใส่อีเมล: `user@example.com`
4. ตรวจสอบอีเมลสำหรับลิงก์รีเซ็ต
5. คลิกลิงก์
6. ตั้งรหัสผ่านใหม่: `NewPassword123`
7. เข้าสู่ระบบด้วยรหัสใหม่

**ผลลัพธ์ที่คาดหวัง:**
- ✅ อีเมลรีเซ็ตส่งเรียบร้อย
- ✅ ลิงก์ใช้ได้เพียงครั้งเดียว
- ✅ สามารถเข้าสู่ระบบด้วยรหัสใหม่
- ✅ ลิงก์ที่ใช้แล้วหมดอายุ

**สถานะ:** 🔴 ไม่ได้นำมาใช้งาน (ต้องสร้าง backend)

---

### 9.3 EDGE CASES - ผู้ขาย

#### TC-ADV-S-001: ผู้ขายลบสินค้าที่มีการสั่งซื้อแล้ว
**วัตถุประสงค์:** ตรวจสอบการจัดการเมื่อสินค้ามีการสั่งซื้อแล้วแล้วผู้ขายลบมัน

**ขั้นตอน:**
1. สินค้า X: มีออเดอร์รอจัดส่ง 5 ออเดอร์
2. ผู้ขายคลิก "ลบสินค้า"
3. ยืนยันการลบ

**ผลลัพธ์ที่คาดหวัง:**
- ⚠️ เตือน: "สินค้านี้มีออเดอร์รอดำเนินการ {จำนวน} ออเดอร์ คุณแน่ใจหรือว่าต้องการลบ?"
- ✅ อนุญาตให้ลบเท่านั้นหากไม่มีออเดอร์ที่ยังคงอยู่

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-S-002: ผู้ขายไม่ยืนยันสลิปภายในระยะเวลากำหนด
**วัตถุประสงค์:** ตรวจสอบว่าออเดอร์จะเป็นอย่างไรหากผู้ขายไม่ดำเนินการ

**ขั้นตอน:**
1. ผู้ซื้อสั่งซื้อด้วย PromptPay แล้วอัปโหลดสลิป
2. ผู้ขายไม่ยืนยันสลิปมากกว่า 24 ชั่วโมง
3. ผู้ซื้อส่งข้อความถึงผู้ขาย

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ระบบส่งแจ้งเตือนให้ผู้ขาย: "มีออเดอร์รอการตรวจสอบ {เวลา}"
- ✅ อนุญาตให้ผู้ซื้อยกเลิกออเดอร์หลังจาก 48 ชั่วโมง
- ✅ คืนเงินอัตโนมัติ

**สถานะ:** 🔴 ไม่ได้นำมาใช้งาน

---

#### TC-ADV-S-003: ผู้ขายจำกัดเวลาขายสินค้า
**วัตถุประสงค์:** ผู้ขายสามารถตั้งเวลาขาย (เช่น ขายเฉพาะวันจันทร์-ศุกร์)

**ขั้นตอน:**
1. สินค้า: "ผัก organic"
2. ผู้ขายตั้ง: "ขายเฉพาะวันจันทร์-ศุกร์ 08:00-20:00"
3. ผู้ซื้อพยายามซื้อในวันเสาร์ 10:00

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ปุ่ม "เพิ่มไปยังรถเข็น" ปิดใช้งาน
- ✅ แสดง: "สินค้าขายเฉพาะวันจันทร์-ศุกร์ 08:00-20:00"

**สถานะ:** 🔴 ไม่ได้นำมาใช้งาน

---

### 9.4 EDGE CASES - การชำระเงิน

#### TC-ADV-PAY-001: อัปโหลดสลิป PromptPay ซ้ำหลายครั้ง
**วัตถุประสงค์:** ตรวจสอบการจัดการสลิปซ้ำ

**ขั้นตอน:**
1. ผู้ซื้อสั่งซื้อออเดอร์ ID 001
2. อัปโหลดสลิป: "slip_001.jpg" (ใช้ได้, 500฿)
3. อัปโหลดสลิกครั้งที่ 2: "slip_002.jpg" (ใช้ได้, 500฿)
4. อัปโหลดสลิกครั้งที่ 3: "slip_003.jpg" (ใช้ได้, 500฿)

**ผลลัพธ์ที่คาดหวัง:**
- ✅ แสดงเฉพาะสลิปล่าสุด
- ✅ หรือเตือน: "คุณได้อัปโหลดสลิกแล้ว"
- ✅ ไม่อนุญาตให้อัปโหลดหลายครั้งจนกว่าผู้ขายจะปฏิเสธ

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-PAY-002: สลิป PromptPay มีจำนวนเงินน้อยกว่าที่ต้องการ
**วัตถุประสงค์:** ตรวจสอบการตรวจสอบจำนวนเงิน

**ขั้นตอน:**
1. ออเดอร์ราคา: 500฿
2. ผู้ซื้อสั่งซื้อแล้วอัปโหลดสลิป: 400฿

**ผลลัพธ์ที่คาดหวัง:**
- ⚠️ ผู้ขายได้รับแจ้ง: "จำนวนเงินไม่ตรงกัน (400฿ vs 500฿)"
- ✅ ผู้ขายสามารถ: อนุมัติ / ปฏิเสธ / ขอเพิ่มเติม

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-PAY-003: สลิป PromptPay มีอายุ (หมดอายุสองครั้ง)
**วัตถุประสงค์:** ตรวจสอบการจัดการสลิปที่หมดอายุ

**ขั้นตอน:**
1. ผู้ซื้อสั่งซื้อ
2. อัปโหลดสลิก (วันที่ 1)
3. ผู้ขายไม่ทำการอะไร (รอ 7 วัน)
4. สลิปหมดอายุ
5. ผู้ซื้อพยายามสั่งซื้อใหม่

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ระบบปิดออเดอร์เก่า
- ✅ ผู้ซื้อสามารถสั่งซื้อใหม่ได้
- ✅ ส่งแจ้งเตือนให้ผู้ซื้อ

**สถานะ:** 🔴 ไม่ได้นำมาใช้งาน

---

### 9.5 EDGE CASES - ความรับผิดชอบและการเรียกร้องคืนเงิน

#### TC-ADV-CLAIM-001: ผู้ซื้อส่งข้อเรียกร้องหลังจากรับสินค้า 8 วัน
**วัตถุประสงค์:** ตรวจสอบการจำกัดระยะเวลาในการเรียกร้อง

**ขั้นตอน:**
1. ผู้ซื้อรับสินค้า
2. รอ 8 วัน
3. ผู้ซื้อพยายามส่งข้อเรียกร้อง: "สินค้าเสียหาย"

**ผลลัพธ์ที่คาดหวัง:**
- ❌ ข้อความ: "เลยระยะเวลาเรียกร้อง (7 วัน) ไม่สามารถส่งข้อเรียกร้องได้"
- ✅ ปุ่มส่งข้อเรียกร้องปิดใช้งาน

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-CLAIM-002: ผู้ขายปฏิเสธข้อเรียกร้อง แต่ผู้ซื้อไม่พอใจ
**วัตถุประสงค์:** ตรวจสอบขั้นตอนการเรียกร้องอุทธรณ์

**ขั้นตอน:**
1. ผู้ซื้อส่งข้อเรียกร้อง
2. ผู้ขายปฏิเสธ
3. ผู้ซื้อส่งข้อเรียกร้องอุทธรณ์ต่อ Admin

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ผู้ซื้อเห็นปุ่ม "ขอให้ Admin ตัดสินใจ"
- ✅ Admin ได้รับแจ้งเตือน
- ✅ Admin สามารถทำการตัดสินใจ

**สถานะ:** 🔴 ไม่ได้นำมาใช้งาน

---

### 9.6 EDGE CASES - การทำซ้ำและความเป็นเอกลักษณ์

#### TC-ADV-DUP-001: ผู้ซื้อกดปุ่ม "สั่งซื้อ" สองครั้งพร้อมกัน
**วัตถุประสงค์:** ป้องกันการสั่งซื้อซ้ำ

**ขั้นตอน:**
1. ผู้ซื้อบนหน้าชำระเงิน
2. คลิกปุ่ม "สั่งซื้อสินค้า" เร็ว 2 ครั้ง

**ผลลัพธ์ที่คาดหวัง:**
- ✅ สร้างเพียง 1 ออเดอร์เท่านั้น
- ✅ ปุ่มหายไปหรือปิดใช้งานหลังจากคลิกครั้งแรก
- ✅ ข้อความ: "กำลังประมวลผล..."

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-DUP-002: ผู้ซื้อสั่งซื้อสินค้าเดียวกัน 2 ครั้งจากหน้าต่างต่างกัน
**วัตถุประสงค์:** ตรวจสอบการจัดการการสั่งซื้อซ้ำจากหน้าต่างต่างกัน

**ขั้นตอน:**
1. เปิดหน้าต่าง 1: `/checkout` ผู้ซื้อ A - สินค้า X จำนวน 2
2. เปิดหน้าต่าง 2: `/checkout` ผู้ซื้อ A - สินค้า X จำนวน 2
3. หน้าต่าง 1: คลิก "สั่งซื้อ" → สร้างออเดอร์ 001
4. หน้าต่าง 2: คลิก "สั่งซื้อ" → ?

**ผลลัพธ์ที่คาดหวัง:**
- ✅ สร้างออเดอร์ 002 (สินค้าต่างกัน)
- ✅ หรือแสดง: "ตะกร้าของคุณได้ถูกอัปเดต" และปิดใช้งาน checkout

**สถานะ:** ⚠️ ต้องทดสอบ

---

### 9.7 EDGE CASES - รูปภาพและมีเดีย

#### TC-ADV-MEDIA-001: ผู้ขายอัปโหลดรูปภาพ HEIC/WEBP
**วัตถุประสงค์:** ตรวจสอบการรองรับรูปแบบภาพ

**ขั้นตอน:**
1. สร้างสินค้าใหม่
2. อัปโหลดรูปภาพ: "apple.heic" (รูปแบบ Apple)

**ผลลัพธ์ที่คาดหวัง:**
- ✅ แปลงเป็น JPEG หรือ PNG อัตโนมัติ
- ✅ หรือแสดง: "โปรดอัปโหลดรูปแบบ JPG, PNG, GIF, WEBP"

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-MEDIA-002: ผู้ซื้ออัปโหลดสลิป PromptPay ที่เป็นไฟล์ขาด
**วัตถุประสงค์:** ตรวจสอบการตรวจสอบไฟล์

**ขั้นตอน:**
1. ผู้ซื้อสั่งซื้อ
2. อัปโหลดไฟล์: "corrupted.jpg" (ไฟล์เสียหาย)

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ข้อผิดพลาด: "ไฟล์เสียหาย ไม่สามารถอ่านได้"
- ✅ ให้ผู้ซื้อลองใหม่

**สถานะ:** ⚠️ ต้องทดสอบ

---

### 9.8 EDGE CASES - ความเป็นส่วนตัวและความปลอดภัย

#### TC-ADV-SEC-001: ผู้ซื้อ A พยายามดูออเดอร์ของผู้ซื้อ B
**วัตถุประสงค์:** ตรวจสอบการควบคุมการเข้าถึง

**ขั้นตอน:**
1. ผู้ซื้อ A: เข้าสู่ระบบ
2. ใส่ URL: `/order/{order_id_of_user_b}`

**ผลลัพธ์ที่คาดหวัง:**
- ❌ ข้อผิดพลาด 403: "คุณไม่มีสิทธิ์เข้าถึงออเดอร์นี้"
- ✅ เปลี่ยนไปหน้า `/orders`

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-SEC-002: ผู้ซื้อพยายามดูสินค้าสูตรของผู้ขาย
**วัตถุประสงค์:** ตรวจสอบการป้องกันข้อมูลที่เป็นความลับ

**ขั้นตอน:**
1. ผู้ซื้อ: เข้าสู่ระบบ
2. ใส่ URL: `/seller/products` (หรือ admin endpoint)

**ผลลัพธ์ที่คาดหวัง:**
- ❌ เปลี่ยนไป `/auth/login` หรือแสดง 403
- ✅ ผู้ซื้อไม่สามารถเข้าถึงแอดมิน/ผู้ขายได้

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-SEC-003: ผู้ใช้พยายามใช้ token ของผู้ใช้อื่น
**วัตถุประสงค์:** ตรวจสอบการตรวจสอบ Token

**ขั้นตอน:**
1. ผู้ซื้อ A: ได้รับ token A
2. ผู้ซื้อ B: ได้รับ token B
3. ผู้ซื้อ B: เปลี่ยน localStorage token เป็น token A
4. รีเฟรชหน้า / ส่ง API request

**ผลลัพธ์ที่คาดหวัง:**
- ✅ Token A ไม่ใช้ได้
- ✅ เปลี่ยนไป `/auth/login`
- ✅ ส่งแจ้งเตือน: "เซสชันหมดอายุ"

**สถานะ:** ⚠️ ต้องทดสอบ

---

### 9.9 EDGE CASES - ประสิทธิภาพ

#### TC-ADV-PERF-001: โหลดหน้า Home ที่มีสินค้า 1000+ รายการ
**วัตถุประสงค์:** ตรวจสอบประสิทธิภาพที่ต้องการ

**ขั้นตอน:**
1. ไปหน้า Home
2. ดูเวลาโหลด (Network tab)
3. เลื่อนลง

**ผลลัพธ์ที่คาดหวัง:**
- ✅ โหลดครั้งแรก < 3 วินาที
- ✅ ไม่มีการหยุด / lag
- ✅ Pagination หรือ Infinite scroll ทำงานสุดส่วน

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-PERF-002: ผู้ขายมีสินค้า 500+ รายการ และค้นหา
**วัตถุประสงค์:** ตรวจสอบการค้นหาที่มีประสิทธิภาพ

**ขั้นตอน:**
1. ผู้ขายไปหน้า "จัดการสินค้า"
2. ค้นหา: "ผัก"
3. ดูเวลาการค้นหา

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ผลลัพธ์ < 1 วินาที
- ✅ ไม่มีการหยุด UI

**สถานะ:** ⚠️ ต้องทดสอบ

---

### 9.10 EDGE CASES - ด้านการระดมทุน (ท่อการชำระเงินจำนวนมาก)

#### TC-ADV-BULK-001: ผู้ซื้อเพิ่มสินค้า 50+ ชิ้น
**วัตถุประสงค์:** ตรวจสอบการจัดการสินค้าในปริมาณมาก

**ขั้นตอน:**
1. ผู้ซื้อเพิ่มสินค้า A: 50 ชิ้น
2. ส่ง API request ไปสั่งซื้อ

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ไม่มีข้อจำกัดปริมาณ หรือ
- ✅ เตือน: "การสั่งซื้อขนาดใหญ่ กรุณาติดต่อร้านค้า"

**สถานะ:** ⚠️ ต้องทดสอบ

---

#### TC-ADV-BULK-002: การสั่งซื้อต่างจาก 10 ผู้ขายพร้อมกัน
**วัตถุประสงค์:** ตรวจสอบการจัดการออเดอร์หลายผู้ขาย

**ขั้นตอน:**
1. เลือกสินค้าจากผู้ขาย A, B, C... J (10 ผู้ขาย)
2. ชำระเงินครั้งเดียว

**ผลลัพธ์ที่คาดหวัง:**
- ✅ สร้าง 10 ออเดอร์แยกกัน (หนึ่งต่อผู้ขาย)
- ✅ ชำระเงินครั้งเดียว
- ✅ ซิงโครไนซ์กับคลังสินค้า

**สถานะ:** ⚠️ ต้องทดสอบ

---

## 10. CHECKLIST การทดสอบมือถือ (MOBILE TESTING CHECKLIST)

### iOS Safari

- [ ] iPhone SE (2020) - 375px width
- [ ] iPhone 12 Pro - 390px width
- [ ] iPhone 14 Pro Max - 430px width

**ทดสอบ:**
- [ ] หน้า Home เรียงกันตามแนวตั้ง (Responsive)
- [ ] ตะกร้า: เนื้อหาไม่ตัด
- [ ] ฟอร์มชำระเงิน: input เด่นชัด (28px+ font)
- [ ] รูปภาพโหลด (ตรวจสอบ throttling)
- [ ] Touch: ปุ่มขนาด >= 44x44px
- [ ] Scroll smooth, ไม่มี jank

---

### Android Chrome

- [ ] Pixel 4 - 412px width
- [ ] Galaxy S21 - 360px width
- [ ] Galaxy S22 Ultra - 384px width

**ทดสอบ:**
- [ ] ฟอร์มเข้าสู่ระบบ: keyboard ไม่ปิด input
- [ ] ปุ่มปรากฏ "ล็อกอิน/ลงชื่อสมัครสมาชิก" ชัด
- [ ] Back button: กลับไปได้เรื่อยๆ

---

### iPad / Tablet

- [ ] iPad Pro 12.9" - 1024px+ width
- [ ] Samsung Galaxy Tab - 768px width

**ทดสอบ:**
- [ ] Layout: ใช้พื้นที่แนวนอนดี
- [ ] Navigation: ชัด ใช้ได้
- [ ] Product grid: แสดง 2-3 คอลัมน์

---

## 11. CHECKLIST ความสามารถในการเข้าถึง (ACCESSIBILITY CHECKLIST)

### Keyboard Navigation
- [ ] Tab key: นำทางไป input/ปุ่ม ทั้งหมด ตามลำดับตรรกะ
- [ ] Enter: ส่งฟอร์ม / กดปุ่ม
- [ ] Escape: ปิด modal / menu
- [ ] Focus visible: ต้องเห็นตำแหน่งปัจจุบัน

### Screen Readers (NVDA / JAWS)
- [ ] หัวข้อ (H1, H2, H3): มีโครงสร้าง
- [ ] Images: มีข้อความ alt ที่มีความหมาย
- [ ] Links: ข้อความลิงก์ชัด (ไม่ใช่ "คลิกที่นี่")
- [ ] Forms: label ชัด, error messages อ่านได้
- [ ] Buttons: ประเภท role ถูกต้อง

### Color Contrast
- [ ] Text: >= 4.5:1 (normal text)
- [ ] ปุ่ม: >= 3:1 (large text)
- [ ] ไม่ใช้เฉพาะสี (สีแดง = "ข้อผิดพลาด" ต้องมีไอคอน/ข้อความ)

---

## 12. CHECKLIST ความเข้ากันได้เบราว์เซอร์ (BROWSER COMPATIBILITY CHECKLIST)

### Chrome
- [ ] Latest
- [ ] -1 version

### Firefox
- [ ] Latest
- [ ] -1 version

### Safari
- [ ] Latest (Mac)
- [ ] Latest (iOS 13+)

### Edge
- [ ] Latest

**ทดสอบ:**
- [ ] ฟอร์ม: input ทำงาน
- [ ] API calls: fetch/axios ทำงาน
- [ ] LocalStorage: บันทึกข้อมูล
- [ ] CSS: Grid/Flexbox สมดุล
- [ ] JavaScript: ES6+ ทำงาน
- [ ] SVG/Icons: แสดงถูก

---

**Document created:** 2026-04-21  
**Last updated:** 2026-04-21  
**Next review:** After first round of testing

---

## 🎯 Quick Summary

### What's Working ✅
- Frontend UI/UX mostly complete
- Product listing & detail pages
- Basic cart functionality
- Order creation flow
- Review system (fixed)
- Seller registration form

### What Needs Testing ⚠️
- Payment verification (PromptPay)
- Order management by seller
- Email/SMS notifications
- Search functionality
- Category filtering
- Profile updates
- Edge cases & concurrent operations

### What's Missing 🔴
- Admin dashboard
- User/seller management
- System settings
- Email notifications
- SMS notifications
- Real-time updates
- Password reset flow
- Advanced seller features

---

**Total Test Cases:** 150+  
**Estimated Testing Time:** 20-30 hours  
**Recommended Team:** 2-3 QA testers
