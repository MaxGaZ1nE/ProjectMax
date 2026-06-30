# Google Maps API Configuration

## Setup Instructions for Google Maps Integration

### Step 1: Create Google Cloud Project

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name (e.g., "Qino Seller Registration")
4. Click "Create"

### Step 2: Enable Required APIs

1. Go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Maps JavaScript API** - for interactive map display
   - **Places API** - for address autocomplete suggestions
   - **Geocoding API** - for address ↔ coordinates conversion

3. For each API, click on it and press "ENABLE"

### Step 3: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (you'll need it for `.env.local`)
4. Click "Edit API Key" to configure restrictions

### Step 4: Configure API Key Restrictions

1. In API Key settings:
   - **Application restrictions**: Select "HTTP referrers (web sites)"
   - **Add referrers**:
     ```
     localhost:*
     127.0.0.1:*
     yourdomain.com/*
     www.yourdomain.com/*
     ```

2. **API restrictions**: Select "Maps JavaScript API", "Places API", "Geocoding API"

3. Click "Save"

### Step 5: Add to Your Project

Create or update `.env.local` file in project root:

```env
# Google Maps API Key for Seller Registration
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here_copy_from_google_console
```

### Step 6: Verify Setup

1. Start development server: `npm run dev`
2. Navigate to seller registration: http://localhost:5173/seller/register
3. Step 2 should load Google Maps without errors
4. Test address search - should show suggestions from Google Places

## Common Issues & Solutions

### Issue: "Google is not defined"
**Cause**: API key not set or invalid
**Solution**: 
- Check `.env.local` has correct key
- Restart dev server after changing env
- Check browser console for errors

### Issue: "The user has not yet granted access"
**Cause**: API key restrictions too strict
**Solution**:
- Add `localhost:*` to HTTP referrer list
- Save changes and wait 5 minutes
- Clear browser cache and retry

### Issue: Search suggestions not working
**Cause**: Places API not enabled
**Solution**:
- Go to Google Cloud Console
- "APIs & Services" → "Library"
- Search "Places API" and click "ENABLE"

### Issue: Map not showing location
**Cause**: Geocoding API not enabled
**Solution**:
- Go to Google Cloud Console
- "APIs & Services" → "Library"
- Search "Geocoding API" and click "ENABLE"

## Cost Considerations

### Free Tier Limits (Monthly)
- Maps JavaScript API: $7.00 free credit (≈ 28,000 requests)
- Places API: $7.00 free credit (≈ 1,400 requests)
- Geocoding API: $5.00 free credit (≈ 1,000 requests)

### Pricing per 1000 Requests
- Maps JavaScript API: $7.00
- Places API: $5.00
- Geocoding API: $5.00

For production sites with high traffic, set up billing alerts:
1. Google Cloud Console → "Billing"
2. Set budget alert (e.g., $50/month)

## Feature Usage in This Project

### Maps JavaScript API Usage:
- Interactive map rendering
- Click to place markers
- Map panning and zooming

### Places API Usage:
- Address autocomplete suggestions
- Place details (full address, coordinates)

### Geocoding API Usage:
- Convert address → coordinates (forward geocoding)
- Convert coordinates → address (reverse geocoding)

## Testing with Mock Data

If you don't have a Google Maps API key yet, you can temporarily disable the map:

In `SellerRegistrationStep2.tsx`, comment out the `<GoogleMap>` component and use this instead:

```tsx
<div className="bg-neutral-100 rounded-lg h-96 flex items-center justify-center">
  <p className="text-neutral-600">
    🗺️ Google Maps placeholder (configure VITE_GOOGLE_MAPS_API_KEY in .env.local)
  </p>
</div>
```

## Security Best Practices

1. ✅ **Use HTTPS in production**
   - API keys only work over HTTPS (or localhost)

2. ✅ **Rotate keys periodically**
   - Replace API keys every 6-12 months
   - Keep old key for rollback

3. ✅ **Monitor usage**
   - Check "APIs & Services" → "Quotas"
   - Set up email alerts for quota warnings

4. ✅ **Never commit keys to git**
   - Keep `.env.local` in `.gitignore`
   - Use environment variables only

5. ✅ **Use server-side validation**
   - Don't trust client-side validation only
   - Validate addresses on backend

## Next Steps

1. Get Google Maps API Key following this guide
2. Add it to `.env.local`
3. Test seller registration flow at `/seller/register`
4. Monitor usage in Google Cloud Console

For more detailed setup, see [SELLER_REGISTRATION_GUIDE.md](./SELLER_REGISTRATION_GUIDE.md)
