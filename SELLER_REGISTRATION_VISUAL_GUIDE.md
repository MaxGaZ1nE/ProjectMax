# Seller Registration Flow - Visual Guide

## 🎯 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     SELLER REGISTRATION FLOW                    │
└─────────────────────────────────────────────────────────────────┘

USER LOGIN
    │
    ↓
AUTHENTICATED? → NO → Redirect to Login
    │
    ├─ YES
    ↓
ALREADY SELLER? → YES → Redirect to Dashboard
    │
    ├─ NO
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: SHOP INFORMATION                                        │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Shop Name (min 2 chars)                                      │
│ ✓ Owner Name (min 2 chars)                                     │
│ ✓ Phone (min 8 digits)                                         │
│ ✓ PromptPay Type (phone or ID card)                            │
│ ✓ PromptPay Value (min 8 chars)                                │
│ ○ Address, Province, Postal Code (optional)                    │
│                                                                 │
│ [← Back] [All Required Fields Valid?] [Next →]                 │
└─────────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: LOCATION PICKER (GOOGLE MAPS)                           │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Search: [_____________________________]  🔍                 │ │
│ │                                                              │ │
│ │ Suggestions:                                               │ │
│ │ • Central World, Bangkok                                   │ │
│ │ • EmQuartier, Bangkok                                      │ │
│ │ • Emporium, Bangkok                                        │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                              │ │
│ │   [              GOOGLE MAP               ]                 │ │
│ │   [ Click on map or search to pin location ]                │ │
│ │   [                 📍                      ]                │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 📍 Selected Location:                                          │
│ Central World Shopping Center, Pathum Wan District             │
│ Coordinates: 13.7454°N, 100.5347°E                            │
│                                                                 │
│ [← Back] [Location Valid?] [Next →]                            │
└─────────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: IDENTITY VERIFICATION                                   │
├─────────────────────────────────────────────────────────────────┤
│ ID Card Number: [_______________________] ✓                     │
│ (13 digits, CheckSum validated)                                 │
│                                                                 │
│ ┌─────────────────────┐  ┌─────────────────────┐               │
│ │  ID Card Front      │  │  ID Card Back       │               │
│ │                     │  │                     │               │
│ │   [📸 Upload]       │  │   [📸 Upload]       │               │
│ │                     │  │                     │               │
│ └─────────────────────┘  └─────────────────────┘               │
│                                                                 │
│ Verification Status:                                           │
│ ✓ ID number valid (CheckSum passed)                            │
│ ✓ Front image uploaded                                         │
│ ✓ Back image uploaded                                          │
│                                                                 │
│ [← Back] [All Required Fields Valid?] [Next →]                 │
└─────────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: REVIEW & SUBMIT                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ STEP 1 SUMMARY:                                                │
│ ├─ Shop Name: ร้านผลไม้สดใหม่                                 │
│ ├─ Owner: John Doe                                             │
│ ├─ Phone: 0851234567                                           │
│ └─ PromptPay: 0851234567                                       │
│                                                                 │
│ STEP 2 SUMMARY:                                                │
│ ├─ Location: Central World                                     │
│ └─ GPS: 13.7454°N, 100.5347°E                                 │
│                                                                 │
│ STEP 3 SUMMARY:                                                │
│ ├─ ID: 1234567890121 ✓                                         │
│ ├─ [Front Image Preview]                                       │
│ └─ [Back Image Preview]                                        │
│                                                                 │
│ [← Back]  [✓ Submit & Send for Approval]                       │
└─────────────────────────────────────────────────────────────────┘
    │
    ↓ Submit successful
┌─────────────────────────────────────────────────────────────────┐
│ APPROVAL WAITING SCREEN                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                          ⏳                                      │
│                  Checking Information...                        │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Status: Pending Review                  Date: 2024-01-15 │   │
│ │ Your information has been submitted to our Admin team.  │   │
│ │ Admin will review within 1-3 business days.             │   │
│ │                                                          │   │
│ │ Timeline:                                                │   │
│ │ ✓ Data Submitted Successfully                            │   │
│ │ ⏳ Admin Review in Progress                              │   │
│ │ - Seller Account Approved                                │   │
│ │                                                          │   │
│ │ Contact: support@qino.com                                │   │
│ │ Email: user@example.com                                  │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ [🔄 Check Status]  [← Go Home]                                 │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─ Admin Approves ─────────────┐
    │                               │
    │                               ↓
    │                  Email: "Your seller account approved!"
    │                               │
    │                               ↓
    │                  User logs in → Goes to Seller Dashboard
    │                               │
    │                               ↓
    │                  Can now upload products
    │
    └─ Admin Rejects ──────────────┐
                                    │
                                    ↓
                       Email: "Please resubmit with..."
                                    │
                                    ↓
                       User can reapply (back to Step 1)
```

---

## 📊 Step Indicator Visual

```
Each Step Shows Progress:

START:
┌──1──┐─────┐─────┐─────┐
│ 1   │  2  │  3  │  4  │
└──1──┘─────┘─────┘─────┘
 Active

STEP 2:
┌──✓──┐──2──┐─────┐─────┐
│ ✓   │  2  │  3  │  4  │
└──✓──┘──2──┘─────┘─────┘
 Done  Active

STEP 3:
┌──✓──┐──✓──┐──3──┐─────┐
│ ✓   │  ✓  │  3  │  4  │
└──✓──┘──✓──┘──3──┘─────┘
 Done  Done Active

STEP 4:
┌──✓──┐──✓──┐──✓──┐──4──┐
│ ✓   │  ✓  │  ✓  │  4  │
└──✓──┘──✓──┘──✓──┘──4──┘
 Done  Done Done Active
```

---

## 🗺️ Google Maps Step Detail

```
ADDRESS SEARCH FLOW:

User Types "Central World"
        ↓
API Autocomplete Request
        ↓
Google Places API
        ↓
Returns Suggestions:
• Central World, Bangkok
• CentralWorld, Yaowarat
• Central Westville, Bangkok
        ↓
User Clicks One
        ↓
Get Full Address & Coordinates
        ↓
Show on Map with Pin 📍
        ↓
Display GPS Coordinates
        ↓
Ready to Continue


CLICK-ON-MAP FLOW:

User Clicks on Map
        ↓
Get Lat/Lng from Click
        ↓
Place Marker 📍
        ↓
Reverse Geocode (Lat/Lng → Address)
        ↓
Display Address
        ↓
Display GPS Coordinates
        ↓
Ready to Continue
```

---

## 🆔 ID Verification Step Detail

```
ID CARD VALIDATION:

User Enters: 1234567890121
        ↓
CheckSum Validation:
├─ Length = 13? YES ✓
├─ All Digits? YES ✓
├─ Calculate Checksum:
│  ├─ Take first 12 digits
│  ├─ Multiply by position weight (13-i)
│  ├─ Sum all results
│  ├─ Calculate: (11 - (sum % 11)) % 10
│  ├─ Compare with 13th digit
│  └─ VALID ✓
└─ Display: ✓ เลขประจำตัวถูกต้อง (Green)

If Invalid: 1234567890120
        ↓
Display: ✗ เลขประจำตัวไม่ถูกต้อง (Red)


IMAGE UPLOAD FLOW:

Click Upload Area
        ↓
File Dialog Opens
        ↓
User Selects Image
        ↓
Validate:
├─ Is Image? YES ✓
├─ Size < 5MB? YES ✓
└─ Valid ✓
        ↓
Read as Base64
        ↓
Show Preview Thumbnail
        ↓
Store in Context
        ↓
Show "Change Image" Button
```

---

## 💾 Data Persistence Flow

```
Step 1 Form
    ↓ On Each Input
    ↓ updateData({ fieldName: value })
    │
Context State
    │ Stores: { shopName, ownerName, phone, ... }
    │
    ↓ Navigation to Step 2
    │
Step 2 Form
    ↓ Access data via useSellerRegistration()
    ↓ data.shopName, data.ownerName, etc.
    │
Context State
    │ Stores: { ...previousData, latitude, longitude, ... }
    │
    ↓ Navigation to Step 3
    │
Step 3 Form
    ↓ Access all previous data
    │
Context State
    │ Stores: { ...previousData, idCardNumber, images, ... }
    │
    ↓ Navigation to Step 4
    │
Step 4 Form
    ↓ Display all data in summary
    ↓ Submit to Backend with Complete Data
```

---

## ➡️ Navigation State Machine

```
             Next Button Clicked
                      ↓
            canGoNext() Check
                      ↓
        ┌─────────────┴─────────────┐
        │                           │
     FALSE                        TRUE
        │                           │
    Button Disabled          Step++ Action
        │                           │
        └──────────┬────────────────┘
                   │
              User Sees
              Next Step
              
              
             Back Button Clicked
                      ↓
            canGoPrev() Check
                      ↓
        ┌─────────────┴─────────────┐
        │                           │
     FALSE                        TRUE
        │                           │
    Button Disabled          Step-- Action
        │                           │
        └──────────┬────────────────┘
                   │
              User Sees
              Previous Step
              (Data Preserved)
```

---

## 🔐 Data Encryption & Security

```
FRONTEND:
┌────────────────────────────────────┐
│ SellerRegistrationStep3.tsx        │
│ └─ ID Card Number (Plain Text)    │
│ └─ Image Files (Base64)           │
│    └─ Convert to Data URL         │
│       └─ Store in Context         │
└────────────────────────────────────┘
            ↓ HTTPS
NETWORK:
┌────────────────────────────────────┐
│ Encrypted in Transit (TLS 1.3)    │
└────────────────────────────────────┘
            ↓
BACKEND:
┌────────────────────────────────────┐
│ POST /seller/register              │
│ ├─ Validate all data              │
│ ├─ Encrypt data at rest (AES-256) │
│ ├─ Store in secure database       │
│ ├─ Virus scan images              │
│ └─ Create approval request        │
└────────────────────────────────────┘
            ↓
ADMIN:
┌────────────────────────────────────┐
│ Admin Dashboard                    │
│ ├─ View encrypted data             │
│ ├─ Review images                   │
│ ├─ Approve/Reject                  │
│ └─ Data deleted after 90 days      │
└────────────────────────────────────┘
```

---

## 📱 Responsive Layout

```
DESKTOP (1024px+):
┌─────────────────────────────────┐
│ Step Indicator                  │
├─────────────────────────────────┤
│ Form Content                    │
│ ┌────────────────────────────┐  │
│ │ Input Fields               │  │
│ │ [←] [Content] [→]         │  │
│ │ Grid: 2 Columns           │  │
│ └────────────────────────────┘  │
└─────────────────────────────────┘


TABLET (768px):
┌────────────────────────────┐
│ Step Indicator             │
├────────────────────────────┤
│ Form Content               │
│ ┌──────────────────────┐   │
│ │ Input Fields         │   │
│ │ [←] [Content] [→]   │   │
│ │ Grid: 1-2 Columns   │   │
│ └──────────────────────┘   │
└────────────────────────────┘


MOBILE (320px):
┌──────────────┐
│ Step Indicator
├──────────────┤
│ Form Content │
│┌────────────┐│
││ Input      ││
││ Fields     ││
│└────────────┘│
│ [← Back]     │
│ [Next →]     │
└──────────────┘
Grid: 1 Column
```

---

## 🎨 Color Scheme

```
Primary: 🔵 #2563eb (Primary Blue)
  └─ Used for active buttons, links, borders

Emerald: 🟢 #059669 (Emerald Green)
  └─ Used for success states, checkmarks

Red: 🔴 #dc2626 (Red)
  └─ Used for errors, invalid states

Neutral: ⚫ #1f2937 (Dark Gray)
  └─ Used for text, content

Light: ⚪ #f3f4f6 (Light Gray)
  └─ Used for backgrounds

Amber: 🟡 #d97706 (Amber)
  └─ Used for warnings, pending states
```

---

## 📈 Step Completion Requirements

```
STEP 1: ✅ REQUIRED
├─ Shop name: 2+ characters
├─ Owner name: 2+ characters  
├─ Phone: 8+ digits
├─ PromptPay Type: Selected
└─ PromptPay Value: 8+ characters

STEP 2: ✅ REQUIRED
├─ Latitude: Set
├─ Longitude: Set
└─ Map Address: Obtained

STEP 3: ✅ REQUIRED
├─ ID Number: Valid (13 digits + checksum)
├─ Front Image: Uploaded
└─ Back Image: Uploaded

STEP 4: ✅ READY TO SUBMIT
└─ All previous steps valid
```

---

**Visual Guide Complete** ✨
For implementation details, see [SELLER_REGISTRATION_GUIDE.md](./SELLER_REGISTRATION_GUIDE.md)
