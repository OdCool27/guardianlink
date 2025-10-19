# Google Maps API Troubleshooting Guide

## Error: "This page didn't load Google Maps correctly"

This error means the API key is configured but Google Maps cannot load properly.

## Common Causes & Solutions

### 1. ✅ **Maps JavaScript API Not Enabled**

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. In the search bar, type: **"Maps JavaScript API"**
4. Click on it and click **"ENABLE"**
5. Wait 1-2 minutes for it to activate

### 2. ✅ **Billing Not Set Up**

Google requires a billing account even for free tier usage (you won't be charged within free limits).

**Solution:**
1. Go to [Google Cloud Console - Billing](https://console.cloud.google.com/billing)
2. Click **"Link a billing account"**
3. Add a payment method (required but you won't be charged within $200/month free tier)
4. Link it to your project

### 3. ✅ **API Key Restrictions**

Your API key might be restricted to specific domains.

**Solution:**
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under **"Application restrictions"**:
   - For development: Select **"None"** (temporarily)
   - Or select **"HTTP referrers"** and add:
     - `http://localhost:3000/*`
     - `http://localhost:3001/*`
     - `http://127.0.0.1:3000/*`
4. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check **"Maps JavaScript API"**
5. Click **"Save"**
6. Wait 5 minutes for changes to propagate

### 4. ✅ **Invalid API Key**

**Solution:**
1. Verify the API key in your `.env` file matches exactly what's in Google Cloud Console
2. No extra spaces or characters
3. Current key in `.env`: `AIzaSyAl5-pRBE2DxX0zPpY6dqYCnXrrqGYuGRY`

### 5. ✅ **Project Quota Exceeded**

If you've hit limits (unlikely for new projects).

**Solution:**
1. Go to [Quotas page](https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/quotas)
2. Check if any quotas are exceeded
3. Request increase if needed

## Quick Fix Steps (Do These First!)

### Step 1: Enable the API
```
1. Visit: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
2. Click "ENABLE"
3. Wait 1-2 minutes
```

### Step 2: Remove API Restrictions (Temporarily)
```
1. Visit: https://console.cloud.google.com/apis/credentials
2. Click your API key
3. Under "Application restrictions" → Select "None"
4. Under "API restrictions" → Select "Don't restrict key"
5. Click "Save"
6. Wait 5 minutes
```

### Step 3: Clear Browser Cache & Test
```
1. Press Ctrl + Shift + Delete (or Cmd + Shift + Delete on Mac)
2. Clear cache and cookies
3. Restart browser
4. Go to http://localhost:3001/
5. Open browser console (F12)
6. Try companion mode again
```

## Verify Your Setup

### Check 1: Is the API Enabled?
Go to: https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/metrics

You should see the API listed as "Enabled"

### Check 2: Browser Console Errors
Open browser console (F12) and look for specific error messages:

**"RefererNotAllowedMapError"**
- Fix: Add `http://localhost:3001/*` to HTTP referrers

**"ApiNotActivatedMapError"**
- Fix: Enable Maps JavaScript API

**"RequestDenied"**
- Fix: Set up billing account

**"InvalidKeyMapError"**
- Fix: Check API key is copied correctly

### Check 3: Test API Key Directly
Open this URL in your browser (replace YOUR_API_KEY):
```
https://maps.googleapis.com/maps/api/js?key=AIzaSyAl5-pRBE2DxX0zPpY6dqYCnXrrqGYuGRY
```

You should see JavaScript code, not an error message.

## Alternative: Use Without Map Visualization

If you can't resolve the Google Maps issue, the app still works! You'll see coordinates instead of a visual map:

```
📍 Current Location
Lat: 40.712776, Lng: -74.005974
Map not available - Google Maps API key not configured
```

All features (location sharing, SOS alerts, companion mode) work perfectly without the visual map.

## After Making Changes

1. **Wait 5-10 minutes** for Google Cloud changes to propagate
2. **Hard refresh** your browser: `Ctrl + Shift + R`
3. **Check browser console** (F12) for new error messages
4. **Test companion mode** again

## Still Not Working?

### Check the exact error in browser console:

1. Open browser (Chrome/Edge)
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. Look for messages starting with "Google Maps"
5. Copy the exact error message

Common error messages and solutions:

| Error | Solution |
|-------|----------|
| `RefererNotAllowedMapError` | Add localhost to HTTP referrers |
| `ApiNotActivatedMapError` | Enable Maps JavaScript API |
| `RequestDenied` | Set up billing account |
| `InvalidKeyMapError` | Check API key copied correctly |
| `BillingNotEnabledMapError` | Link billing account to project |

## Contact Support

If none of these solutions work, provide:
1. The exact error message from browser console
2. Screenshot of your API key settings in Google Cloud Console
3. Confirmation that Maps JavaScript API is enabled

---

**TIP**: For development, temporarily set "Application restrictions" to "None" and "API restrictions" to "Don't restrict key". Add restrictions later for production security.
