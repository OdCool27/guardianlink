# Frontend-Backend Integration Guide

## Overview
This guide explains how the GuardianLink frontend connects to the Node.js backend running on port 8081.

## Configuration

### Backend Configuration
- **Port**: 8081 (configured in `backend-nodejs/.env`)
- **Base URL**: http://localhost:8081
- **CORS Origins**: Allows requests from http://localhost:5173 and http://localhost:3000

### Frontend Configuration
- **Environment File**: `.env` in `Guardian-Link-main/` directory
- **API URL**: Configured via `VITE_API_URL=http://localhost:8081`

## API Service (`api.ts`)

The `api.ts` file provides a complete TypeScript API client for interacting with the backend.

### Usage Example

```typescript
import api, { authAPI, userAPI, contactsAPI } from './api';

// Authentication
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authAPI.login(email, password);
    // response contains: { token, user }
    api.storage.setAuthToken(response.token);
    api.storage.setUser(response.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Get User Profile
const loadProfile = async () => {
  try {
    const profile = await userAPI.getProfile();
    console.log('User profile:', profile);
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
};

// Add Emergency Contact
const addContact = async () => {
  try {
    await contactsAPI.addContact(
      'John Doe',
      '+1234567890',
      'john@example.com'
    );
  } catch (error) {
    console.error('Failed to add contact:', error);
  }
};
```

## Available API Endpoints

### Authentication (`authAPI`)
- `register(fullName, email, password)` - Register new user
- `login(email, password)` - Login user

### User Management (`userAPI`)
- `getProfile()` - Get current user profile
- `updateProfile(profileData)` - Update user profile
- `updatePassword(currentPassword, newPassword)` - Change password

### Emergency Contacts (`contactsAPI`)
- `getContacts()` - Get all emergency contacts
- `addContact(fullName, phoneNumber, email)` - Add new contact
- `updateContact(contactId, fullName, phoneNumber, email)` - Update contact
- `deleteContact(contactId)` - Delete contact

### SOS Emergency (`sosAPI`)
- `activateSOS(latitude, longitude, contactIds)` - Trigger SOS alert
- `deactivateSOS(sessionId)` - Deactivate SOS

### Companion Mode (`companionAPI`)
- `startCompanion(latitude, longitude, durationMinutes, contactIds)` - Start location sharing
- `updateLocation(sessionId, latitude, longitude)` - Update location
- `stopCompanion(sessionId)` - Stop companion mode
- `getActiveSessions()` - Get all active sessions

### Alert History (`historyAPI`)
- `getHistory()` - Get alert history

### Location Sharing (`locationAPI`)
- `getSession(sessionId)` - Get session details for shared location link

## Storage Helpers

The API module includes localStorage helpers:

```typescript
import { storage } from './api';

// Save auth token
storage.setAuthToken(token);

// Get auth token
const token = storage.getAuthToken();

// Save user data
storage.setUser(userData);

// Get user data
const user = storage.getUser();

// Clear all data (logout)
storage.clearAll();
```

## Integration Steps

### 1. Update Login Component

Add API integration to your login/signup flow in `index.tsx`:

```typescript
import { authAPI, storage } from './api';

// In your login handler
const handleLogin = async () => {
  try {
    const response = await authAPI.login(email, password);
    
    // Save authentication data
    storage.setAuthToken(response.token);
    storage.setUser(response.user);
    
    // Update UI state
    setCurrentUser(response.user);
    setActiveScreen('home');
  } catch (error) {
    console.error('Login failed:', error.message);
    // Show error to user
  }
};
```

### 2. Add Protected Route Logic

Ensure API calls include the authentication token:

```typescript
// The API automatically includes the token from localStorage
// No additional configuration needed!
```

### 3. Integrate Real-time Features (WebSocket)

For live location updates, connect to Socket.IO:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8081');

// Join a companion session
socket.emit('join-session', sessionId);

// Listen for location updates
socket.on('location-update', (data) => {
  console.log('New location:', data);
  // Update map marker
});

// Leave session
socket.emit('leave-session', sessionId);
```

### 4. Handle Errors Globally

Add error handling for common scenarios:

```typescript
const apiCall = async () => {
  try {
    const data = await someAPI.method();
    return data;
  } catch (error) {
    if (error.message.includes('401')) {
      // Unauthorized - clear auth and redirect to login
      storage.clearAll();
      setActiveScreen('login');
    } else if (error.message.includes('500')) {
      // Server error
      console.error('Server error:', error);
    }
    throw error;
  }
};
```

## Testing the Connection

### 1. Start the Backend
```bash
cd backend-nodejs
npm run dev
```
Server should start on http://localhost:8081

### 2. Start the Frontend
```bash
cd Guardian-Link-main
npm run dev
```
Frontend should start on http://localhost:5173

### 3. Test API Connection

Open browser console and run:
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

## Environment Variables Reference

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:8081
VITE_SUPABASE_URL=https://xxsepkjexgfcawowpztc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (`backend-nodejs/.env`)
```env
PORT=8081
NODE_ENV=development
DATABASE_URL=postgresql://...
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Verify `CORS_ORIGIN` in backend `.env` includes your frontend URL
2. Restart the backend server after changing `.env`

### 401 Unauthorized Errors
- Ensure you're calling `storage.setAuthToken(token)` after login
- Check that the token is valid and not expired

### Connection Refused
- Verify backend is running on port 8081
- Check firewall settings
- Ensure both frontend and backend are running

### TypeScript Errors
- Run `npm install` in the frontend directory
- Ensure `vite-env.d.ts` exists with proper type definitions

## Next Steps

1. **Integrate authentication flow** - Update login/signup components
2. **Add real-time updates** - Implement Socket.IO for companion mode
3. **Handle geolocation** - Use browser Geolocation API with companion/SOS features
4. **Add loading states** - Show spinners during API calls
5. **Implement error boundaries** - Catch and display API errors gracefully

## Production Deployment

For production, update environment variables:

**Frontend:**
```env
VITE_API_URL=https://api.guardianlink.com
```

**Backend:**
```env
PORT=443
NODE_ENV=production
CORS_ORIGIN=https://guardianlink.com
```
