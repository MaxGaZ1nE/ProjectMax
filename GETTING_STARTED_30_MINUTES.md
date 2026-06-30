# 🎯 Getting Started - First 30 Minutes

## Minute 0-5: Understand What You Got

### You Now Have:
✅ **4-Step Seller Registration Flow** (like Shopee)
  - Basic shop info
  - Google Maps location picker
  - Thai ID card verification
  - Review & submit

✅ **Complete Documentation** (6 guides)
✅ **Production-Ready Code** (TypeScript, tested patterns)
✅ **Security Features** (CheckSum validation, file validation)

### What's NOT Done Yet:
❌ Google Maps API key (you need to create)
❌ Backend endpoints (you need to implement)
❌ Email notifications (you need to set up)
❌ Admin approval dashboard (future)

---

## Minute 5-10: Get Google Maps API Key

### Follow These Steps:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a Project**
   - Click "Select a Project"
   - Click "New Project"
   - Name: "Qino Seller Registration"
   - Click "Create"

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search for and enable:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Geocoding API
   - For each: Click it → "ENABLE"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - **Copy the key** (you'll use this next)

5. **Configure Restrictions**
   - Click "Edit API Key"
   - **Application restrictions**: "HTTP referrers (web sites)"
   - Add:
     ```
     localhost:*
     127.0.0.1:*
     yourdomain.com/*
     www.yourdomain.com/*
     ```
   - **API restrictions**: Select the 3 APIs above
   - Click "Save"

---

## Minute 10-15: Add API Key to Your Project

### Create/Update `.env.local`:

```bash
# In your project root directory
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBi-EzHNULEueas_FjS578qOMAgKGr5fG0
```

**That's it!** (No need to restart yet, we'll test next)

---

## Minute 15-20: Test the Frontend

### Start Development Server:
```bash
npm run dev
```

### Visit the Registration Page:
```
http://localhost:5173/seller/register
```

### What You Should See:
1. **Step 1**: Shop info form
   - Try entering: Shop name, owner, phone
   - Click "Next" button

2. **Step 2**: Google Map should load
   - You should see a world map
   - Try searching for "Bangkok" in address box
   - Try clicking on the map

3. **Step 3**: ID verification form
   - Try entering a test ID: `1234567890121`
   - Should show green checkmark ✓

4. **Step 4**: Review screen
   - All your entered data should display
   - Try clicking submit (will fail without backend)

---

## Minute 20-25: Understand the Code Structure

### Key Files to Know:

**Context** (State Management):
```
src/contexts/SellerRegistrationContext.tsx
  - Stores all form data across steps
  - Provides: step, data, updateData, goNext, goPrev
```

**Components** (UI):
```
src/components/seller-registration/
  ├── SellerRegistrationStep1.tsx     ← Shop info
  ├── SellerRegistrationStep2.tsx     ← Google Maps
  ├── SellerRegistrationStep3.tsx     ← ID verification
  ├── SellerRegistrationStep4.tsx     ← Review & submit
  └── SellerRegistrationFlow.tsx      ← Main container
```

**Page** (Route):
```
src/pages/seller/SellerRegisterPage.tsx
  - Wraps everything with provider
```

**Route** (Navigation):
```
src/routes/index.tsx
  - /seller/register → SellerRegistrationFlow
  - /seller/register/pending-approval → Approval screen
```

---

## Minute 25-30: What's Next?

### Implement Backend (Your Part):

You need to create a backend endpoint:

```
POST /seller/register

Request Body:
{
  shop_name: "ร้านผลไม้สดใหม่",
  owner_name: "John Doe",
  phone: "0851234567",
  address_line: "123 Rama Road",
  province: "Bangkok",
  postal_code: "10110",
  promptpay_type: "phone",
  promptpay_value: "0851234567",
  latitude: 13.7454,
  longitude: 100.5347,
  map_address: "Central World, Bangkok",
  id_card_number: "1234567890121",
  id_card_front_image: "data:image/jpeg;base64,...",
  id_card_back_image: "data:image/jpeg;base64,...",
}

Response:
{
  shop: {
    id: 1,
    shop_name: "ร้านผลไม้สดใหม่",
    owner_name: "John Doe",
    phone: "0851234567",
    ...
  },
  token: "new_jwt_token_with_seller_role"
}
```

### Backend Checklist:

```
[ ] Create POST /seller/register endpoint
[ ] Validate all input fields
[ ] Validate Thai ID checksum (already done on frontend)
[ ] Store shop data in database
[ ] Store ID card images securely
[ ] Generate seller approval record
[ ] Create new JWT token with seller role
[ ] Send email notification to admin
[ ] Return shop info + token
```

---

## 🆘 Troubleshooting (First 30 Mins)

### Problem: "Google is not defined"
**Solution**: 
- Check `.env.local` has API key
- Did you restart dev server after adding it?

### Problem: "Map not loading"
**Solution**:
- Check API key is correct
- Check Maps JavaScript API is enabled in Google Cloud

### Problem: "Address search not working"
**Solution**:
- Check Places API is enabled
- Wait 5 minutes for API activation

### Problem: Components can't find imports
**Solution**:
```bash
# Run from project root
npm install @react-google-maps/api
npm run dev
```

---

## 📚 Need More Help?

### For Quick Help (5 mins):
Read: `QUICK_REFERENCE_SELLER_REGISTRATION.md`

### For Detailed Info (30 mins):
Read: `SELLER_REGISTRATION_GUIDE.md`

### For Google Maps Help:
Read: `GOOGLE_MAPS_SETUP.md`

### For Visual Understanding:
Read: `SELLER_REGISTRATION_VISUAL_GUIDE.md`

---

## 🎯 30-Minute Challenge Checklist

- [ ] Got Google Maps API key
- [ ] Added to `.env.local`
- [ ] Development server running
- [ ] Registration page loads at /seller/register
- [ ] Can fill Step 1 form
- [ ] Can see Google Map on Step 2
- [ ] Can search for addresses
- [ ] Can enter ID number with validation
- [ ] Can upload images
- [ ] Can see review screen
- [ ] Read one documentation guide

**If you checked all ✓ = You're ready to build the backend!**

---

## 🚀 Next Phase (After 30 Mins)

1. **Backend Implementation**
   - Create /seller/register endpoint
   - Validate and store data
   - Send approval request

2. **Testing**
   - Test full end-to-end flow
   - Test error scenarios
   - Test data persistence

3. **Enhancement**
   - Add email notifications
   - Create admin dashboard
   - Add DOPA API integration (optional)

---

## 💡 Pro Tips

1. **Keep `.env.local` Updated**
   - Change API key for production later
   - Never commit this file to git

2. **Test with Real Data**
   - Use real Thai ID for testing (CheckSum validated)
   - Use real Bangkok address for maps

3. **Monitor API Usage**
   - Check Google Cloud Console quota
   - Set up billing alerts

4. **Secure Your Backend**
   - Validate Thai ID again on backend
   - Encrypt ID data at rest
   - Delete after 90 days compliance

---

**You got this! 🎉**

Start at minute 0 and follow the timeline. You'll have a working registration system in 30 minutes!

Any questions? Check the documentation guides or review the code comments.
