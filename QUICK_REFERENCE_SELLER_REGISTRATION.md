# Quick Reference: Multi-Step Seller Registration

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
npm install @react-google-maps/api
```

### 2. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create Project → Enable APIs (Maps JS, Places, Geocoding)
3. Create API Key → Copy it

### 3. Configure Environment
```bash
# .env.local
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 4. Test the Flow
```bash
npm run dev
# Visit: http://localhost:5173/seller/register
```

---

## 📂 File Structure

```
src/
├── contexts/
│   └── SellerRegistrationContext.tsx       ← State management
├── components/seller-registration/
│   ├── SellerRegistrationFlow.tsx          ← Main component
│   ├── SellerRegistrationStep1.tsx         ← Shop info
│   ├── SellerRegistrationStep2.tsx         ← Google Maps
│   ├── SellerRegistrationStep3.tsx         ← ID verification
│   ├── SellerRegistrationStep4.tsx         ← Review & submit
│   └── SellerRegistrationPendingApproval.tsx ← Approval screen
└── pages/seller/
    └── SellerRegisterPage.tsx              ← Page wrapper
```

---

## 🎯 Component Overview

### SellerRegistrationFlow
Main container handling:
- Step indicator (1-4)
- Current step rendering
- Navigation (back/next)
- Data persistence

```tsx
<SellerRegistrationProvider>
  <SellerRegistrationFlow />
</SellerRegistrationProvider>
```

### SellerRegistrationStep1
**Shop Information**
```
- Shop name (min 2 chars)
- Owner name (min 2 chars)
- Phone (min 8 digits)
- PromptPay (phone or ID)
- Address fields (optional)
```

### SellerRegistrationStep2
**Google Maps Location**
```
- Search address with autocomplete
- Interactive map with click-to-pin
- Reverse geocoding
- GPS coordinates display
```

### SellerRegistrationStep3
**Identity Verification**
```
- ID card number (13 digits + CheckSum validation)
- Front image upload
- Back image upload
- Real-time validation
```

### SellerRegistrationStep4
**Review & Submit**
```
- Summary of all data
- Image previews
- Submit button
- Redirects to approval screen
```

### SellerRegistrationPendingApproval
**Approval Status**
```
- Timeline visualization
- FAQ section
- Email confirmation
- Status check button
```

---

## 🎣 Using the Context Hook

```tsx
import { useSellerRegistration } from '@contexts'

function MyComponent() {
  const { step, data, updateData, goNext, goPrev } = useSellerRegistration()

  return (
    <div>
      <p>Step {step} of 4</p>
      <p>Shop: {data.shopName}</p>
      
      <button onClick={goPrev}>← Back</button>
      <button onClick={goNext}>Next →</button>
    </div>
  )
}
```

### Context Methods
```typescript
// Navigation
goNext(): boolean        // Go to next step (if valid)
goPrev(): boolean        // Go to previous step
canGoNext(): boolean     // Check if can proceed
canGoPrev(): boolean     // Check if can go back

// Data Management
updateData(fields)       // Update form data
setData(data)           // Replace entire data object
resetData()             // Reset to initial state

// Properties
step: number            // Current step (1-4)
data: RegistrationData  // Form data object
```

---

## 📝 Data Structure

```typescript
interface SellerRegistrationData {
  // Step 1
  shopName: string
  ownerName: string
  phone: string
  promptpayType: 'phone' | 'id'
  promptpayValue: string
  addressLine: string
  province: string
  postalCode: string

  // Step 2
  latitude?: number
  longitude?: number
  mapAddress?: string

  // Step 3
  idCardNumber?: string
  idCardFrontImage?: string  // base64
  idCardBackImage?: string   // base64
  idCardVerified?: boolean

  // Step 4
  pendingApproval?: boolean
  submittedAt?: string
}
```

---

## 🔐 Validation Rules

### Step 1: Shop Information
```
✓ Shop name: minimum 2 characters
✓ Owner name: minimum 2 characters
✓ Phone: minimum 8 digits
✓ PromptPay: minimum 8 characters
```

### Step 2: Location
```
✓ Latitude and Longitude required
✓ Can set via map click or address search
```

### Step 3: ID Verification
```
✓ ID number: 13 digits + valid CheckSum
✓ Front image: uploaded
✓ Back image: uploaded
✓ File size: max 5MB each
```

### Step 4: All Previous Steps Valid
```
✓ All Step 1 fields ✓
✓ Location set ✓
✓ ID & images valid ✓
```

---

## 🗺️ Google Maps API Setup

### Required APIs
- ✅ Maps JavaScript API
- ✅ Places API (autocomplete)
- ✅ Geocoding API (address ↔ coordinates)

### API Key Restrictions
```
HTTP referrers:
- localhost:*
- 127.0.0.1:*
- yourdomain.com/*
- www.yourdomain.com/*
```

### Troubleshooting
```
❌ Map not loading
→ Check VITE_GOOGLE_MAPS_API_KEY in .env.local
→ Restart dev server after changing .env

❌ "Google is not defined"
→ API key invalid or missing
→ Check browser console errors

❌ Search not working
→ Places API not enabled
→ Enable in Google Cloud Console

❌ Address not found
→ Geocoding API not enabled
→ Enable in Google Cloud Console
```

See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for complete setup guide.

---

## 🚦 Routes

```
GET /seller/register
  ↓ (Multi-step flow with 4 steps)
  ↓
POST /seller/register (submit)
  ↓
GET /seller/register/pending-approval
  ↓ (Admin reviews and approves)
  ↓
/seller (Seller dashboard - if approved)
```

---

## 🔄 API Endpoints Required

### POST /seller/register
```
Request:
{
  shop_name: string
  owner_name: string
  phone: string
  address_line: string
  province: string
  postal_code: string
  promptpay_type: 'phone' | 'id'
  promptpay_value: string
  latitude: number
  longitude: number
  map_address: string
  id_card_number: string
  id_card_front_image: string (base64)
  id_card_back_image: string (base64)
}

Response:
{
  shop: { id, shop_name, ... }
  token: string (seller role)
}
```

---

## 🧪 Test Data

### Valid Thai ID Numbers
```
1234567890121
9876543210129
5432109876123
```

### Testing Checklist
```
[ ] Step 1: Form validation works
[ ] Step 1: Data persists to step 2
[ ] Step 2: Google Map loads
[ ] Step 2: Address search works
[ ] Step 2: Click on map sets location
[ ] Step 3: ID validation works
[ ] Step 3: Image upload works
[ ] Step 4: All data displays
[ ] Step 4: Submit works
[ ] Approval screen shows after submit
[ ] Back button works on all steps
[ ] Can't proceed without completing step
```

---

## 🎨 Styling

Uses **Tailwind CSS** with custom classes:
```tsx
const inputClass = 
  'w-full rounded-lg border border-neutral-300 bg-white ' +
  'px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200'

// Usage
<input className={inputClass} />
```

---

## 📱 Responsive Design

Components use responsive Tailwind classes:
```tsx
// Example from Step 1
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {/* Single column on mobile, 2 columns on small screens */}
</div>
```

---

## 🔗 Related Documentation

1. **[SELLER_REGISTRATION_GUIDE.md](./SELLER_REGISTRATION_GUIDE.md)**
   - Complete implementation guide
   - Architecture details
   - Security considerations
   - Future enhancements

2. **[GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)**
   - Google Maps API key setup
   - Step-by-step instructions
   - Troubleshooting

3. **[MULTI_STEP_SELLER_REGISTRATION_COMPLETE.md](./MULTI_STEP_SELLER_REGISTRATION_COMPLETE.md)**
   - What's implemented
   - Testing checklist
   - Technical stack

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| API key error | Check VITE_GOOGLE_MAPS_API_KEY in .env.local |
| Map not loading | Restart dev server, enable Maps JS API |
| Search not working | Enable Places API in Google Cloud Console |
| Image upload fails | Check file size (max 5MB), file type |
| ID validation fails | Use exactly 13 digits with valid checksum |
| Context not found | Wrap component with SellerRegistrationProvider |

---

## 🚀 Deployment Checklist

```
[ ] Update API endpoints for production
[ ] Add Google Maps API key for production domain
[ ] Enable HTTPS (required for Google Maps)
[ ] Configure API key with proper referrer restrictions
[ ] Set up admin approval dashboard
[ ] Implement email notifications
[ ] Test entire flow end-to-end
[ ] Set up error monitoring/logging
[ ] Configure backup/disaster recovery
[ ] Document admin approval process
[ ] Train admin staff on approval workflow
```

---

## 📞 Quick Links

- 📖 [React Context API Docs](https://react.dev/reference/react/useContext)
- 🗺️ [Google Maps API Docs](https://developers.google.com/maps/documentation/javascript)
- 📍 [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- 🎨 [Tailwind CSS](https://tailwindcss.com)

---

**Last Updated**: 2024
**Status**: ✅ Ready for Development
