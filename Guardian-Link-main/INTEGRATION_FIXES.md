# 🔧 Integration Fixes for GuardianLink

## Issues Identified

You've correctly identified three critical issues that need backend integration:

### 1. ❌ Profile shows "Alex Doe" instead of actual user data
**Root Cause:** Line 1313 in `index.tsx` hardcodes the user data:
```typescript
const [user, setUser] = useState({
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  safeword: '',
  status: { emoji: '😊', text: '' }
});
```

**Solution:** Load user data from backend after login

### 2. ❌ Emergency contacts not persisted
**Root Cause:** Line 1327 in `index.tsx` hardcodes contacts in state:
```typescript
const [contacts, setContacts] = useState([
  { id: 1, name: 'Jane Smith', phone: '555-123-4567', email: 'jane.s@example.com' },
]);
```

**Solution:** Load/save contacts from/to backend API

### 3. ❌ Map not loading when SOS is tapped
**Root Cause:** Line 1376 in `index.tsx` references missing environment variable:
```typescript
script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY}&v=beta`;
```

**Solution:** Add Google Maps API key or use alternative mapping solution

---

## 🔨 Quick Fixes

### Fix #1: Load User Profile from Backend

**Where:** `index.tsx` - App component

**Replace this:**
```typescript
const App = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    safeword: '',
    status: { emoji: '😊', text: '' }
  });
```

**With this:**
```typescript
import api, { userAPI, contactsAPI, storage } from './api';

const App = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({
    name: '',
    email: '',
    safeword: '',
    status: { emoji: '😊', text: '' }
  });
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await userAPI.getProfile();
        setUser({
          name: profile.fullName,
          email: profile.email,
          safeword: profile.safeword || '',
          status: {
            emoji: profile.statusEmoji || '😊',
            text: profile.statusText || ''
          }
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        // If unauthorized, sign out
        if (error.message.includes('401')) {
          storage.clearAll();
          onSignOut();
        }
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUserProfile();
  }, [onSignOut]);
```

### Fix #2: Load and Persist Emergency Contacts

**Where:** `index.tsx` - App component

**Replace this:**
```typescript
const [contacts, setContacts] = useState([
  { id: 1, name: 'Jane Smith', phone: '555-123-4567', email: 'jane.s@example.com' },
]);
```

**With this:**
```typescript
const [contacts, setContacts] = useState([]);
const [isLoadingContacts, setIsLoadingContacts] = useState(true);

// Load contacts on mount
useEffect(() => {
  const loadContacts = async () => {
    try {
      const contactsData = await contactsAPI.getContacts();
      setContacts(contactsData.map(c => ({
        id: c.id,
        name: c.fullName,
        phone: c.phoneNumber,
        email: c.email
      })));
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  loadContacts();
}, []);
```

**Update addContact function:**
```typescript
const addContact = async () => {
  const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
  const newContact = { id: newId, name: '', phone: '', email: '' };
  setContacts([...contacts, newContact]);
  
  // Note: This adds a temporary contact. Save to backend when user fills it out.
};
```

**Update removeContact function:**
```typescript
const removeContact = async (id) => {
  try {
    await contactsAPI.deleteContact(id);
    setContacts(contacts.filter(contact => contact.id !== id));
    showToast('Contact deleted successfully!');
  } catch (error) {
    console.error('Failed to delete contact:', error);
    showToast('Failed to delete contact');
  }
};
```

**Update handleContactChange to save on blur:**
```typescript
const handleContactChange = (id, e) => {
  const { name, value } = e.target;
  setContacts(prevContacts => 
    prevContacts.map(contact => 
      contact.id === id ? { ...contact, [name]: value } : contact
    )
  );
};

// Add a new function to save contact
const saveContact = async (contact) => {
  try {
    if (!contact.name || !contact.phone || !contact.email) {
      showToast('Please fill all contact fields');
      return;
    }

    // Check if this is a new contact (no backend ID) or update
    if (contact.id > 1000) { // Temporary IDs are high numbers
      const result = await contactsAPI.addContact(
        contact.name,
        contact.phone,
        contact.email
      );
      // Update with real ID from backend
      setContacts(prev => prev.map(c => 
        c.id === contact.id ? { ...c, id: result.id } : c
      ));
      showToast('Contact added successfully!');
    } else {
      await contactsAPI.updateContact(
        contact.id,
        contact.name,
        contact.phone,
        contact.email
      );
      showToast('Contact updated successfully!');
    }
  } catch (error) {
    console.error('Failed to save contact:', error);
    showToast('Failed to save contact');
  }
};
```

### Fix #3: Fix Google Maps API Key

**Option A: Add Google Maps API Key (Recommended)**

1. Get a Google Maps API key:
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Enable "Maps JavaScript API"
   - Create credentials (API key)
   - Restrict the key to your domain

2. Add to `.env`:
```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

3. Update `index.tsx` line 1376:
```typescript
script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&v=beta`;
```

4. Update `vite-env.d.ts`:
```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string; // Add this line
}
```

**Option B: Use OpenStreetMap (Free Alternative)**

If you don't want to use Google Maps, use Leaflet.js with OpenStreetMap:

1. Install Leaflet:
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

2. Replace Google Maps initialization with Leaflet in HomeScreen component

---

## 🚀 Complete Integration Steps

### Step 1: Import API Client

At the top of `index.tsx`, add:
```typescript
import api, { authAPI, userAPI, contactsAPI, companionAPI, sosAPI, historyAPI, storage } from './api';
```

### Step 2: Update Login to Save User Data

In `GuardianLinkApp` component, update `handleLogin`:
```typescript
const handleLogin = (userData, token) => {
  storage.setAuthToken(token);
  storage.setUser(userData);
  setAuthStatus({ isAuthenticated: true, screen: 'landing' });
};
```

### Step 3: Update SignInScreen

Replace the mock login in `SignInScreen`:
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);
  
  try {
    const response = await authAPI.login(email, password);
    onLogin(response.user, response.token);
  } catch (error: any) {
    setError(error.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

### Step 4: Update SignUpScreen

Replace the mock registration:
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  
  // Validation
  if (password !== confirmPassword) {
    setError(t('auth.passwordValidationError'));
    return;
  }
  
  setIsLoading(true);
  
  try {
    const response = await authAPI.register(fullName, email, password);
    onLogin(response.user, response.token);
  } catch (error: any) {
    setError(error.message || 'Registration failed');
  } finally {
    setIsLoading(false);
  }
};
```

### Step 5: Update Settings Save

In `handleSubmit` function (Settings):
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    await userAPI.updateProfile({
      fullName: user.name,
      safeword: user.safeword,
      statusEmoji: user.status.emoji,
      statusText: user.status.text,
      theme: settings.theme,
      sosAlertsEnabled: settings.notifications.sos,
      companionUpdatesEnabled: settings.notifications.companion,
      statusUpdatesEnabled: settings.notifications.status,
    });
    
    showToast(t('settings.saveSuccess'));
    setProfileSubScreen('main');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings');
  }
};
```

### Step 6: Update SOS Activation

In `handleStartSos` function:
```typescript
const handleStartSos = () => {
  setSosCountdown(5);
  countdownTimerRef.current = setInterval(() => {
    setSosCountdown(prev => (prev > 1 ? prev - 1 : 0));
  }, 1000);

  sosActivationTimeoutRef.current = setTimeout(async () => {
    clearInterval(countdownTimerRef.current);
    setSosCountdown(null);
    
    // Get current location
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const contactIds = contacts.map(c => c.id);
        
        // Activate SOS via API
        await sosAPI.activateSOS(latitude, longitude, contactIds);
        
        setIsSosActive(true);
        
        // Automatically start companion mode
        if (contactIds.length > 0) {
          handleStartCompanionMode(contactIds, 60);
        }
        
        document.body.classList.add('sos-flash');
        setTimeout(() => document.body.classList.remove('sos-flash'), 500);
      } catch (error) {
        console.error('Failed to activate SOS:', error);
        alert('Failed to activate SOS alert');
      }
    });
  }, 5000);
};
```

### Step 7: Update Companion Mode

In `handleStartCompanionMode` function:
```typescript
const handleStartCompanionMode = async (selectedContactIds, durationInMinutes) => {
  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      const { latitude, longitude } = position.coords;
      
      // Start companion mode via API
      const response = await companionAPI.startCompanion(
        latitude,
        longitude,
        durationInMinutes,
        selectedContactIds
      );
      
      const durationInSeconds = durationInMinutes * 60;
      const endTime = Date.now() + durationInSeconds * 1000;
      
      const sharedWithNames = contacts
        .filter(c => selectedContactIds.includes(c.id))
        .map(c => c.name);

      setCompanionSession({
        isActive: true,
        sharedWith: sharedWithNames,
        endTime: endTime,
        sessionId: response.session.id
      });

      setTimeLeft(durationInSeconds);
      setCurrentPosition({ lat: latitude, lng: longitude });

      // Start location tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (newPosition) => {
          const newCoords = {
            lat: newPosition.coords.latitude,
            lng: newPosition.coords.longitude,
          };
          setCurrentPosition(newCoords);
          
          // Update location on backend
          try {
            await companionAPI.updateLocation(
              response.session.id,
              newCoords.lat,
              newCoords.lng
            );
          } catch (error) {
            console.error('Failed to update location:', error);
          }
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    } catch (error) {
      console.error('Failed to start companion mode:', error);
      alert('Failed to start companion mode');
    }
  });
};
```

---

## 📝 Summary of Changes Needed

1. ✅ Add API imports at top of `index.tsx`
2. ✅ Update `App` component to load user profile from backend
3. ✅ Update `App` component to load contacts from backend
4. ✅ Update login/signup screens to use real API
5. ✅ Update contact save/delete to use API
6. ✅ Update settings save to use API
7. ✅ Update SOS activation to use API
8. ✅ Update companion mode to use API
9. ✅ Add Google Maps API key to `.env` or use Leaflet alternative
10. ✅ Update `vite-env.d.ts` with Google Maps key type

---

## 🧪 Testing After Integration

1. **Profile Test:**
   - Sign up with new account
   - Profile should show your actual name and email
   - Update settings and refresh - should persist

2. **Contacts Test:**
   - Add emergency contact
   - Refresh page
   - Contact should still be there

3. **Map Test:**
   - Tap SOS button
   - Map should load and show your location
   - Location marker should appear

---

## 🆘 Quick Help

If you want me to make these changes directly to your `index.tsx` file, let me know and I'll update it with all the integrations!
