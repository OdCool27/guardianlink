# Google Maps API Setup Guide

## Why You Need This

The companion mode and SOS features use Google Maps to display your real-time location. Without a Google Maps API key, the map cannot load.

## Current Status ⚠️

Your app is now showing:
- ✅ **Location coordinates** (latitude/longitude) 
- ⚠️ **No visual map** (requires API key)

## Quick Fix Applied ✅

I've updated the app to show your coordinates even without a map, so companion mode still works! You'll see:

```
📍 Current Location
Lat: 40.712776, Lng: -74.005974
Map not available - Google Maps API key not configured
```

## How to Get a Google Maps API Key (Free)

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### Step 2: Create or Select a Project
1. Click the project dropdown at the top
2. Click "New Project"
3. Name it "GuardianLink" (or anything you like)
4. Click "Create"

### Step 3: Enable Maps JavaScript API
1. In the search bar, type "Maps JavaScript API"
2. Click on "Maps JavaScript API"
3. Click "Enable"

### Step 4: Create API Key
1. Go to "Credentials" in the left menu
2. Click "+ CREATE CREDENTIALS"
3. Select "API key"
4. Copy the API key that appears

### Step 5: (Optional but Recommended) Secure Your API Key
1. Click "Restrict Key"
2. Under "Application restrictions":
   - For development: Select "HTTP referrers"
   - Add: `http://localhost:3000/*`
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose "Maps JavaScript API"
4. Click "Save"

### Step 6: Add to Your App
1. Open your `.env` file at:
   ```
   c:\Users\odane\Desktop\Projects\Guardian-Link-main\Guardian-Link-main\.env
   ```

2. Replace this line:
   ```
   VITE_GOOGLE_MAPS_API_KEY=
   ```
   
   With:
   ```
   VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
   ```

3. **Restart the frontend** (important!):
   - Stop the frontend server (Ctrl+C)
   - Start it again:
     ```powershell
     Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force; cd "c:\Users\odane\Desktop\Projects\Guardian-Link-main\Guardian-Link-main"; npm run dev
     ```

4. **Refresh the browser** (Ctrl+F5 or Cmd+Shift+R)

## Pricing 💰

Google Maps has a **FREE tier**:
- **$200 USD credit per month**
- Maps JavaScript API costs: **$7 per 1,000 loads**
- This means: **~28,500 free map loads per month**

For a personal safety app with normal usage, you'll likely stay within the free tier.

## Verification

After adding your API key:

1. Start companion mode
2. You should see a **full interactive map** instead of just coordinates
3. The map will show your real-time location with a marker
4. Check the browser console (F12) - there should be no Google Maps errors

## Troubleshooting

### "This page can't load Google Maps correctly"
- Your API key is invalid or hasn't been enabled yet
- Wait a few minutes after creating the key (it needs to propagate)
- Make sure Maps JavaScript API is enabled in your Google Cloud project

### Map still not showing
- Make sure you restarted the frontend server after adding the key
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console (F12) for specific error messages

### Billing warnings
- Don't worry! You won't be charged unless you explicitly upgrade
- Google requires a payment method but won't charge within free tier
- Set up billing alerts at $1 to be safe

## Alternative: Continue Without Maps

The app now works without a Google Maps API key! You'll see:
- ✅ Coordinates being tracked and updated
- ✅ Location shared with emergency contacts
- ✅ Full companion mode functionality
- ⚠️ No visual map (just coordinates)

This is perfectly fine for testing or if you don't need the visual map display.

## Next Steps

1. **For Testing**: Continue using the app as-is (coordinates are shown)
2. **For Production**: Get a Google Maps API key following the steps above
3. **For Deployment**: Make sure to restrict your API key to your production domain

---

**Need Help?** Check the browser console (F12) for specific error messages related to Google Maps.
