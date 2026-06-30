# Seller Registration Multi-Step Flow Guide

## Overview

This implementation provides a comprehensive 4-step seller registration flow similar to Shopee, with advanced features including:

1. **Step 1**: Basic Shop Information (ขั้นตอนที่ 1: ข้อมูลพื้นฐาน)
2. **Step 2**: Location Picker with Google Maps (ขั้นตอนที่ 2: ปักหมุดร้านค้า)
3. **Step 3**: Identity Verification with ID Card (ขั้นตอนที่ 3: ยืนยันตัวตน)
4. **Step 4**: Review & Submit (ขั้นตอนที่ 4: ตรวจสอบและส่งการขอ)
5. **Approval Screen**: Admin Verification Pending (รอการตรวจสอบ)

## Features

### 🗺️ Google Maps Integration
- Interactive map for precise store location pinning
- Address autocomplete using Google Places API
- Click-to-pin functionality on map
- Reverse geocoding to get address from coordinates
- GPS coordinates display

### 🆔 Identity Verification
- **CheckSum Validation**: Thai ID card validation using standard checksum algorithm
- Support for 13-digit Thai ID numbers
- ID card front and back image upload
- Image preview and replacement
- File size validation (max 5MB)
- Automatic data encryption (note: implement in backend)

### 💰 Payment Method
- PromptPay support (phone number or ID card number)
- Radio button selection between payment methods
- Real-time validation

### 📍 Multi-Step Navigation
- Progress indicator with step completion
- Back/Next buttons with validation
- Step-by-step data persistence
- Can't proceed without completing required fields

## Setup Instructions

### 1. Environment Configuration

Add these variables to your `.env.local` file:

```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional: API endpoint configuration
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable these APIs:
   - Maps JavaScript API
   - Places API (for autocomplete)
   - Geocoding API
4. Create an API key (restriction: HTTP referrers)
5. Add your domain to allowed referrers:
   - `localhost:*`
   - `yourdomain.com`
   - `www.yourdomain.com`
6. Copy the API key to `.env.local`

### 3. Backend API Endpoints Required

The frontend expects these endpoints:

```
POST /seller/register
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
  id_card_number: string (validated)
  id_card_front_image: string (base64 or file)
  id_card_back_image: string (base64 or file)
}

Response:
{
  shop: {
    id: number
    shop_name: string
    owner_name: string
    ...
  }
  token: string (new token with seller role)
}
```

## Architecture

### File Structure
```
src/
├── contexts/
│   └── SellerRegistrationContext.tsx       # Context for multi-step state
├── components/
│   └── seller-registration/
│       ├── SellerRegistrationFlow.tsx      # Main flow component
│       ├── SellerRegistrationStep1.tsx     # Basic info step
│       ├── SellerRegistrationStep2.tsx     # Google Maps step
│       ├── SellerRegistrationStep3.tsx     # ID verification step
│       ├── SellerRegistrationStep4.tsx     # Review & submit step
│       └── SellerRegistrationPendingApproval.tsx  # Approval screen
└── pages/
    └── seller/
        └── SellerRegisterPage.tsx          # Page wrapper
```

### State Management

Uses React Context API (`SellerRegistrationContext`) to manage:
- Current step (1-4)
- Form data across all steps
- Navigation (canGoNext, canGoPrev, goNext, goPrev)
- Data persistence

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
  idCardFrontImage?: string
  idCardBackImage?: string
  idCardVerified?: boolean

  // Step 4
  pendingApproval?: boolean
  submittedAt?: string
}
```

## Validation Rules

### Step 1: Basic Information
- Shop Name: minimum 2 characters
- Owner Name: minimum 2 characters
- Phone: minimum 8 digits
- PromptPay Value: minimum 8 characters

### Step 2: Location
- Latitude and Longitude must be set
- Can be set by either:
  - Searching address and selecting from suggestions
  - Clicking directly on map

### Step 3: Identity Verification
- ID Card Number: 13 digits, valid checksum
- Front Image: uploaded and readable
- Back Image: uploaded and readable

### Step 4: Review & Submit
- All data from previous steps must be valid
- Submit button sends all data to backend

## ID Card Validation Algorithm

Uses Thai national ID card checksum validation:

```typescript
validateThaiIDCard(id: string): boolean {
  // Remove formatting
  const cleanId = id.replace(/[-\s]/g, '')
  
  // Must be 13 digits
  if (!/^\d{13}$/.test(cleanId)) return false
  
  // Calculate checksum
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i)) * (13 - i)
  }
  
  const checksum = (11 - (sum % 11)) % 10
  const lastDigit = parseInt(cleanId.charAt(12))
  
  return checksum === lastDigit
}
```

## Usage

### Basic Implementation
```tsx
import { SellerRegistrationProvider } from '@contexts/SellerRegistrationContext'
import SellerRegistrationFlow from '@components/seller-registration/SellerRegistrationFlow'

export default function SellerRegisterPage() {
  return (
    <SellerRegistrationProvider>
      <SellerRegistrationFlow />
    </SellerRegistrationProvider>
  )
}
```

### Using the Hook
```tsx
import { useSellerRegistration } from '@contexts/SellerRegistrationContext'

export function MyComponent() {
  const { 
    step, 
    data, 
    updateData, 
    goNext, 
    goPrev,
    canGoNext 
  } = useSellerRegistration()

  return (
    // Your component using context
  )
}
```

## Future Enhancements

### Suggested Improvements

1. **DOPA API Integration** (for Thailand national ID verification)
   - Real-time ID verification from Ministry of Interior
   - Returns full name and date of birth for validation

2. **Backend Image Processing**
   - OCR for ID card number extraction
   - Face detection for ID photos
   - Document liveness detection

3. **Advanced Verification**
   - Video verification for seller identity
   - Bank account verification
   - Tax ID verification

4. **Admin Dashboard**
   - Seller registration approval interface
   - Document review and approval workflow
   - Rejection reason templates
   - Bulk approval/rejection

5. **Enhanced UX**
   - Step-by-step tutorials
   - Real-time validation with helpful messages
   - Saved draft functionality
   - Multi-language support

## Security Considerations

⚠️ **Important Security Notes**:

1. **Data Encryption**
   - All ID card data should be encrypted in transit (HTTPS)
   - Encrypt at rest in database
   - Use industry-standard encryption (AES-256)

2. **API Key Management**
   - Never commit API keys to git
   - Use environment variables only
   - Rotate keys regularly
   - Restrict API key usage by referrer

3. **Image Upload Security**
   - Validate file types on both client and server
   - Scan for malware
   - Compress and optimize images
   - Set file size limits

4. **Data Privacy**
   - Comply with PDPA (Personal Data Protection Act)
   - Clear retention policies
   - User consent for data processing
   - Right to deletion

5. **Admin Access**
   - Implement audit logging for admin actions
   - Separate admin approval interface
   - Two-factor authentication
   - Limited access based on roles

## Testing

### Manual Testing Checklist

- [ ] Step 1: Form validation works (all fields required)
- [ ] Step 1: Data persists when navigating
- [ ] Step 2: Google Maps loads correctly
- [ ] Step 2: Address search returns suggestions
- [ ] Step 2: Clicking map sets coordinates
- [ ] Step 2: Reverse geocoding works
- [ ] Step 3: ID card validation works (13 digits)
- [ ] Step 3: Image upload works (front and back)
- [ ] Step 3: Invalid ID numbers show error
- [ ] Step 4: All data displays correctly
- [ ] Step 4: Submit button works
- [ ] Approval screen displays after submit
- [ ] Back navigation works on all steps
- [ ] Can't proceed without completing step

### Test ID Numbers (Valid Thai IDs)
```
1234567890121
9876543210129
5432109876123
```

## Troubleshooting

### Google Maps not loading
**Issue**: "Cannot find module '@react-google-maps/api'"
**Solution**: Run `npm install @react-google-maps/api`

### API Key error
**Issue**: "Google Maps Platform rejected your request"
**Solution**: 
1. Check API key is valid in Google Cloud Console
2. Verify APIs are enabled (Maps, Places, Geocoding)
3. Check referrer restrictions
4. Test in browser console: `google` object should exist

### Images not uploading
**Issue**: Files not being uploaded to Step 4
**Solution**: Check browser console for file size errors (max 5MB)

### Context not working
**Issue**: "useSellerRegistration must be used within SellerRegistrationProvider"
**Solution**: Ensure component is wrapped with `<SellerRegistrationProvider>`

## Support

For questions or issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check network tab in DevTools
4. Verify all environment variables are set correctly

## References

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Places API Autocomplete](https://developers.google.com/maps/documentation/places/web-service/autocomplete)
- [Thai National ID Card Format](https://en.wikipedia.org/wiki/Thai_national_ID_card)
- [React Context API](https://react.dev/reference/react/useContext)
