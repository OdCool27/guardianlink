# 🚀 How to Test the GuardianLink App

## ✅ Current Status

Both frontend and backend are now **RUNNING**!

### Backend Server
- **Status**: ✅ Running
- **URL**: http://localhost:8081
- **Port**: 8081
- **Database**: Connected to Supabase PostgreSQL
- **WebSocket**: Ready on port 8081

### Frontend Server
- **Status**: ✅ Running  
- **URL**: http://localhost:3000
- **Port**: 3000
- **Build Tool**: Vite
- **Framework**: React 19.2.0 with TypeScript

## 🌐 Access the Application

### Option 1: Local Access
Open your browser and go to:
```
http://localhost:3000
```

### Option 2: Network Access (from other devices on same network)
```
http://172.20.10.2:3000
```

## 🧪 Testing Guide

### 1. Test Backend Health Check

Open browser console (F12) and run:
```javascript
fetch('http://localhost:8081/health')
  .then(res => res.json())
  .then(data => console.log('Backend status:', data));
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-18T..."
}
```

### 2. Test User Registration

1. Click **"Create an Account"** on the login screen
2. Fill in:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `Test@1234`
   - Confirm Password: `Test@1234`
3. Click **Sign Up**

**What to expect:**
- If backend integration is complete: User created, redirected to home
- If not integrated: May see mock behavior or error

### 3. Test User Login

1. Enter credentials:
   - Email: `test@example.com`
   - Password: `Test@1234`
2. Click **Sign In**

**What to expect:**
- Success: JWT token saved, redirected to home screen
- Error: Check console for API errors

### 4. Test Emergency Contacts

1. Navigate to **Contacts** tab
2. Click **Add Contact**
3. Fill in contact details:
   - Full Name: `Emergency Contact`
   - Phone: `+1234567890`
   - Email: `contact@example.com`
4. Save

**Backend endpoint:** `POST /api/contacts`

### 5. Test SOS Feature

1. Go to **Home** screen
2. Click the **SOS** button
3. Allow location permission if prompted

**What happens:**
- Location captured
- SOS alert sent to backend: `POST /api/sos/activate`
- Email/SMS sent to emergency contacts
- Companion session started

### 6. Test Companion Mode

1. Go to **Home** screen
2. Click **Companion Mode** button
3. Select contacts to share with
4. Set duration (e.g., 30 minutes)
5. Click **Start Sharing**

**What happens:**
- Backend: `POST /api/companion/start`
- Location sharing begins
- Selected contacts receive notification
- Real-time location updates every 5 seconds

### 7. Test Alert History

1. Navigate to **History** tab
2. View all SOS/companion events

**Backend endpoint:** `GET /api/history`

### 8. Test User Settings

1. Navigate to **Profile** → **Settings**
2. Update:
   - Profile picture
   - Username
   - Email
   - Safeword
   - Theme (Light/Dark/Automatic)
   - Language
   - Notification preferences
3. Click **Save Settings**

**Backend endpoint:** `PUT /api/user/profile`

## 🔍 Debugging Tips

### Check Backend Connection

In browser console:
```javascript
// Test API connection
fetch('http://localhost:8081/health')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
```

### Check Environment Variables

In browser console:
```javascript
// Should show: http://localhost:8081
console.log('API URL:', import.meta.env.VITE_API_URL);
```

### Check Authentication Token

In browser console:
```javascript
// Check if user is logged in
console.log('Auth Token:', localStorage.getItem('authToken'));
console.log('User Data:', localStorage.getItem('user'));
```

### Check Network Requests

1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by **Fetch/XHR**
4. Perform an action (login, add contact, etc.)
5. Check request/response

## ⚠️ Common Issues & Solutions

### CORS Errors
**Problem:** `Access to fetch at 'http://localhost:8081' from origin 'http://localhost:3000' has been blocked by CORS`

**Solution:** Backend CORS is already configured for port 3000. If still seeing errors:
1. Restart backend server
2. Clear browser cache
3. Check backend `.env` has: `CORS_ORIGIN=http://localhost:5173,http://localhost:3000`

### 401 Unauthorized
**Problem:** API returns 401 after login

**Solution:**
1. Check token is saved: `localStorage.getItem('authToken')`
2. Try logging in again
3. Check backend JWT_SECRET is configured

### Cannot Access Camera/Location
**Problem:** Browser blocks camera/location access

**Solution:**
1. Click browser address bar lock icon
2. Allow location/camera permissions
3. Reload page

### Backend Not Responding
**Problem:** `ERR_CONNECTION_REFUSED`

**Solution:**
Check backend is running:
```bash
# In another terminal
cd backend-nodejs
npm run dev
```

### Frontend Not Loading
**Problem:** Blank page or errors

**Solution:**
1. Check browser console for errors
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart frontend: `npm run dev`

## 📱 Testing on Mobile Device

### Same WiFi Network
1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On mobile browser, go to: `http://[YOUR-IP]:3000`
3. Example: `http://172.20.10.2:3000`

**Note:** Geolocation and camera work better on mobile devices!

## 🎯 Feature Checklist

Test each feature and check off:

- [ ] User Registration
- [ ] User Login
- [ ] User Logout
- [ ] Add Emergency Contact
- [ ] Edit Emergency Contact
- [ ] Delete Emergency Contact
- [ ] Activate SOS
- [ ] Deactivate SOS
- [ ] Start Companion Mode
- [ ] Location updates during companion mode
- [ ] Stop Companion Mode
- [ ] View Alert History
- [ ] Update Profile Picture
- [ ] Update User Settings
- [ ] Change Password
- [ ] Theme switching (Light/Dark/Auto)
- [ ] Language switching (EN/ES/FR/PT/ZH/JA/AR)
- [ ] Email notifications (SOS)
- [ ] SMS notifications (SOS)
- [ ] WhatsApp notifications (via Twilio)
- [ ] Real-time location sharing (WebSocket)

## 🔧 Integration Status

### ✅ Completed
- Backend API running
- Frontend running
- Database connected
- Environment configured
- API client created
- CORS configured

### ⏳ Pending Integration
- Replace mock functions in `index.tsx` with real API calls
- Connect login/signup to backend
- Integrate emergency contacts CRUD
- Connect SOS activation
- Integrate companion mode
- Add WebSocket for real-time updates
- Handle authentication state
- Add error handling UI

## 📚 Next Steps

1. **Integrate API calls** - Replace mock functions in `index.tsx` with calls from `api.ts`
2. **Test each feature** - Use this checklist
3. **Add error handling** - Show user-friendly error messages
4. **Add loading states** - Show spinners during API calls
5. **Test edge cases** - Network errors, invalid inputs, etc.

## 🆘 Need Help?

Refer to these guides:
- **API_INTEGRATION_GUIDE.md** - How to integrate backend APIs
- **API_INTEGRATION_EXAMPLES.tsx** - Code examples for each feature
- **BACKEND_CONNECTION_READY.md** - Configuration reference

## ✨ Happy Testing!

Your GuardianLink app is now running in development mode. The frontend hot-reloads when you make changes, and the backend auto-restarts with nodemon.

**Frontend**: http://localhost:3000  
**Backend**: http://localhost:8081  
**Database**: Connected to Supabase  

Enjoy building! 🚀
