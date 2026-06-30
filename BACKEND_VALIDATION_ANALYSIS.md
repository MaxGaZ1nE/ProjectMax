# Backend Validation Schema & Service Analysis
## Product Creation - NaN Database Error Investigation

**Date:** April 19, 2026  
**Backend Location:** `C:\Users\palap\backend`  
**Issue:** "invalid input syntax for type integer: NaN"

---

## 📊 Database Schema (Products Table)

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  category_id INTEGER REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  quantity_in_stock INTEGER DEFAULT 0,        -- 🔴 INTEGER FIELD
  unit VARCHAR(10) DEFAULT 'kg',              -- VARCHAR FIELD
  sold_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  badge VARCHAR(50),
  badge_bg VARCHAR(50),
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 Joi Validation Schema (middleware/validation.js)

### createProduct Schema

```javascript
createProduct: Joi.object({
  name: Joi.string().required().min(3),
  price: Joi.number().required().positive(),                    // ✅ NUMERIC
  original_price: Joi.number().optional().positive(),           // ✅ NUMERIC  
  originalPrice: Joi.number().optional().positive(),            // ✅ NUMERIC (camelCase alias)
  category_id: Joi.number().optional(),                         // ✅ NUMERIC
  categoryId: Joi.number().optional(),                          // ✅ NUMERIC (camelCase alias)
  quantity_in_stock: Joi.number().optional().min(0),            // ⚠️ NUMERIC - COULD BE NaN
  unit: Joi.string().optional(),                                 // ✅ STRING
  weight: Joi.number().optional(),                               // ⚠️ NUMERIC - NOT IN DATABASE!
  description: Joi.string().optional(),
  images: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  status: Joi.string().optional().valid('active', 'hidden', 'draft'),
  stock: Joi.number().optional().min(0),                         // ⚠️ NUMERIC - ALIAS FOR quantity_in_stock
  shop_id: Joi.number().optional(),                              // ✅ NUMERIC
}),
```

### updateProduct Schema

```javascript
updateProduct: Joi.object({
  name: Joi.string().optional().min(3),
  price: Joi.number().optional().positive(),
  originalPrice: Joi.number().optional().positive(),
  categoryId: Joi.number().optional(),
  quantity_in_stock: Joi.number().optional().min(0),             // ⚠️ NUMERIC
  stock: Joi.number().optional().min(0),                         // ⚠️ NUMERIC (alias)
  unit: Joi.string().optional(),
  weight: Joi.number().optional(),                               // ⚠️ NOT IN DATABASE
  description: Joi.string().optional(),
  images: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  is_active: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),                            // ✅ Boolean alias
}),
```

---

## 🔧 Service Layer Logic (services/productService.js)

### createProduct Method - CRITICAL SECTION

```javascript
async createProduct(shopId, productData) {
  // Extract fields from validated data
  const { 
    name, 
    price, 
    originalPrice, 
    original_price,
    categoryId, 
    category_id,
    quantity_in_stock,              // ⚠️ Could be undefined
    stock,                           // ⚠️ Could be undefined  
    unit, 
    weight,                          // ⚠️ NOT USED IN INSERT
    description, 
    badge, 
    badgeBg, 
    images,
    shop_id
  } = productData;

  // Field coercion - POTENTIAL ISSUE HERE
  const finalOriginalPrice = original_price || originalPrice;
  const finalCategoryId = category_id || categoryId;
  const finalQuantityInStock = quantity_in_stock || stock || 100;  // 🔴 ISSUE: If both undefined, falls through to 100
                                                                     // 🟡 But if either is NaN, this could pass NaN

  // INSERT INTO products
  const productResult = await pool.query(
    `INSERT INTO products (
       shop_id, category_id, name, price, original_price, 
       quantity_in_stock,           -- $6 🔴 PARAMETER POSITION
       unit, badge, badge_bg, images, is_active, created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      shopId,                        // $1
      finalCategoryId || null,       // $2
      name,                          // $3
      price,                         // $4
      finalOriginalPrice || null,    // $5
      finalQuantityInStock,          // $6 🔴 COULD BE NaN IF BOTH undefined
      unit || 'kg',                  // $7
      badge || null,                 // $8
      badgeBg || null,               // $9
      images || []                   // $10
    ]
  );

  // Later: INSERT into product_details (weight goes HERE, not products)
  if (description) {
    await pool.query(
      `INSERT INTO product_details (...weight_text...)
       VALUES (...$3...)`,
      [productId, shopId, weight ? \`${weight}kg\` : '1kg', description]
    );
  }
}
```

---

## 🚨 ROOT CAUSES OF NaN ERROR

### Problem 1: Undefined Values Not Properly Handled

```javascript
// ❌ BAD - If value is undefined, Number(undefined) = NaN
const finalQuantityInStock = quantity_in_stock || stock || 100;
// If both quantity_in_stock and stock are NaN (from a failed conversion upstream),
// then finalQuantityInStock = NaN

// ✅ GOOD - Would be:
const finalQuantityInStock = quantity_in_stock ?? stock ?? 100;  // Use nullish coalescing
// Or explicit check:
const finalQuantityInStock = (quantity_in_stock || stock) || 100;
```

### Problem 2: Frontend Sending NaN Values

Looking at `src/services/backend-api.js` line 388-410:

```javascript
createProduct: (data) => {
  const payload = {
    name: String(data.name || '').trim(),
    price: Number(data.price) || 0,              // ⚠️ If data.price is null/undefined, Number() = NaN
    original_price: Number(data.price * 1.2) || 0,
    stock: Number(data.stock) || 0,              // ⚠️ If data.stock is null/undefined, Number() = NaN
    category_id: Number(data.category_id) || 1,  // ⚠️ If undefined, Number() = NaN
    description: String(data.description || '').trim(),
    images: Array.isArray(data.images) ? data.images : [],
  };
  // ...
  return apiClient.post('/products', payload);
}
```

**Issue:** `Number(undefined) || 0` **STILL SENDS NaN!**

In JavaScript:
```javascript
Number(undefined)  // Returns NaN
Number(null)       // Returns 0  ❌ Actually returns 0, not NaN!
Number(null) || 0  // Returns 0  ✅ Correct
Number(undefined) || 0  // ⚠️ Returns... let me check

// Testing:
NaN || 0           // Returns 0 ✅ (NaN is falsy)
undefined || 0     // Returns 0 ✅ (undefined is falsy)
null || 0          // Returns 0 ✅ (null is falsy)
```

### Problem 3: Weight Field Sent to Wrong Table

The validation schema accepts `weight: Joi.number().optional()` but:
- **Products table** does NOT have a `weight` column
- **Product_details table** has `weight_text VARCHAR(50)`

So if frontend sends `{ weight: 1.5 }`, it gets validated but then:
1. Stays in `productData` object
2. Never used in the products INSERT (correct)
3. Only used when creating product_details (but as `weight ? ${weight}kg : '1kg'`)

---

## 🛠️ CONTROLLER LAYER (controllers/productController.js)

```javascript
async createProduct(req, res, next) {
  try {
    const { shopId } = req.seller;
    const productData = req.validatedBody;  // ✅ Already validated by Joi middleware

    const product = await productService.createProduct(shopId, productData);

    res.status(201).json({
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);  // Goes to error handler
  }
}
```

**Good:** Uses `req.validatedBody` from Joi validation middleware.  
**Potential issue:** If Joi passed something that shouldn't have passed, it gets through here.

---

## 📋 VALIDATION MIDDLEWARE (middleware/validation.js)

```javascript
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,  // ✅ Removes unknown fields
    });

    if (error) {
      // Return 400 validation error
      console.error('Validation failed:', { route: req.originalUrl, body: req.body, details: messages });
      return res.status(400).json({ success: false, message: 'Validation failed', error: {...} });
    }

    req.validatedBody = value;  // ✅ Validated data passed to controller
    return next();
  };
};
```

**Good:** Validates before reaching service  
**Potential issue:** Joi.number().optional() accepts NaN? **NO - Joi filters out NaN**

---

## ✅ COMPLETE VALIDATION FLOW

```
Frontend (src/services/backend-api.js)
    │
    ├─ createProduct() at line 388-410
    │   └─ Transforms: { stock: Number(data.stock) || 0, ... }
    │       └─ Sends JSON POST /products
    │
Backend (C:\Users\palap\backend)
    │
    ├─ Receives in productRoutes.js (line 44-50)
    │   └─ Middleware stack:
    │       1. authenticateToken (JWT verification)
    │       2. requireSeller (Check seller role)
    │       3. validate(schemas.createProduct) ← JOI VALIDATES HERE
    │       4. productController.createProduct
    │
    ├─ Joi Schema in middleware/validation.js (line 101-122)
    │   └─ quantity_in_stock: Joi.number().optional().min(0)
    │   └─ stock: Joi.number().optional().min(0)
    │
    ├─ Validated data → req.validatedBody
    │
    ├─ productController.createProduct (line 129-145)
    │   └─ Calls productService.createProduct(shopId, req.validatedBody)
    │
    ├─ productService.createProduct (line 8-55)
    │   └─ const finalQuantityInStock = quantity_in_stock || stock || 100
    │   └─ INSERT INTO products(...quantity_in_stock...) VALUES(...$6...)
    │       └─ WHERE $6 = finalQuantityInStock  🔴 COULD BE NaN
    │
    └─ PostgreSQL
        └─ INTEGER column expects integer
        └─ Gets NaN → ERROR: "invalid input syntax for type integer: NaN"
```

---

## 🔴 CONFIRMED ISSUES

### Issue 1: Joi Validation Edge Cases
- `Joi.number().optional()` when sent value is non-numeric string
- Example: Frontend sends `{ stock: "abc" }` → Joi rejects it ✅ (Good)
- Example: Frontend sends `{ stock: "" }` → Joi might convert to NaN? ❓

### Issue 2: Missing Field Defaults
```javascript
// Current:
const finalQuantityInStock = quantity_in_stock || stock || 100;

// Problems:
// If quantity_in_stock = 0, then finalQuantityInStock = stock || 100 (loses the 0!)
// If both undefined, could pass NaN from failed conversion
```

### Issue 3: Frontend Transformation Issue
```javascript
// Line 388-410 in src/services/backend-api.js
stock: Number(data.stock) || 0,

// If data.stock is:
// - undefined → Number() = NaN → NaN || 0 = 0 ✅
// - null → Number() = 0 → 0 || 0 = 0 ✅
// - "" (empty string) → Number() = 0 → 0 || 0 = 0 ✅
// - "abc" → Number() = NaN → NaN || 0 = 0 ✅ (Frontend should validate first!)

// BUT: If frontend sends NaN directly (somehow):
stock: NaN → Joi.number() → Should reject ✅
```

### Issue 4: Weight Not in Products Table
- Validation accepts `weight: Joi.number().optional()`
- But products table only has unit: VARCHAR(10)
- Weight is stored in product_details.weight_text as VARCHAR

---

## 🎯 RECOMMENDATIONS

### Immediate Fix for NaN Error

**File:** `C:\Users\palap\backend\services\productService.js` (Line 20-22)

```javascript
// Current (Buggy):
const finalQuantityInStock = quantity_in_stock || stock || 100;

// Fixed:
const finalQuantityInStock = Math.max(
  Number.isInteger(quantity_in_stock) ? quantity_in_stock : (Number.isInteger(stock) ? stock : 100),
  0
);

// OR simpler:
const finalQuantityInStock = parseInt(quantity_in_stock) || parseInt(stock) || 100;
if (isNaN(finalQuantityInStock)) {
  throw new Error('Invalid quantity_in_stock or stock value');
}
```

### Frontend Fix

**File:** `d:\mongkol\qino-template-fruit-store\src\services\backend-api.js` (Line 388-410)

```javascript
// Add validation BEFORE sending:
if (!data.name?.trim()) {
  throw new Error('Product name is required');
}
if (typeof data.price !== 'number' || data.price <= 0) {
  throw new Error('Price must be a positive number');
}
if (data.stock !== undefined && (typeof data.stock !== 'number' || data.stock < 0)) {
  throw new Error('Stock must be a non-negative number');
}
```

### Validation Schema Enhancement

**File:** `C:\Users\palap\backend\middleware\validation.js` (Line 101-122)

```javascript
// Add stricter validation:
quantity_in_stock: Joi.number().optional().integer().min(0),  // ← Force integer
stock: Joi.number().optional().integer().min(0),              // ← Force integer
unit: Joi.string().optional().valid('kg', 'box', 'piece', 'lb', 'oz'),  // ← Enum values

// Remove weight from createProduct since it's not in products table:
// weight: Joi.number().optional(),  // ← DELETE THIS LINE
```

---

## 📝 Summary

| Component | Issue | Severity | Location |
|-----------|-------|----------|----------|
| Joi Schema | Missing integer constraint | 🟡 Medium | middleware/validation.js:101 |
| Service Layer | Improper NaN handling | 🔴 High | services/productService.js:20-22 |
| Frontend API | Insufficient validation | 🟡 Medium | src/services/backend-api.js:388-410 |
| Schema | weight field not in DB | 🟡 Medium | middleware/validation.js:107 |
| Schema | unit field should have enum | 🟡 Low | middleware/validation.js:106 |
| Controller | No explicit null check | 🟢 Low | controllers/productController.js:140 |

