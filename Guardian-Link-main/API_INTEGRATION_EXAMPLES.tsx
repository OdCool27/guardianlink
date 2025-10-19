/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Example: How to integrate API calls into index.tsx
 * 
 * Add this import at the top of index.tsx:
 * import api, { authAPI, userAPI, contactsAPI, companionAPI, sosAPI, historyAPI, storage } from './api';
 */

// ============================================
// EXAMPLE 1: LOGIN INTEGRATION
// ============================================

// Find the handleSignIn function and update it:
const handleSignIn = async () => {
  try {
    // Validate inputs
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    // Call backend API
    const response = await authAPI.login(email, password);
    
    // Save authentication data
    storage.setAuthToken(response.token);
    storage.setUser(response.user);
    
    // Update UI state
    setCurrentUser(response.user);
    setActiveScreen('home');
    
    console.log('Login successful:', response.user);
  } catch (error: any) {
    console.error('Login failed:', error.message);
    alert(`Login failed: ${error.message}`);
  }
};

// ============================================
// EXAMPLE 2: REGISTRATION INTEGRATION
// ============================================

const handleSignUp = async () => {
  try {
    // Validate inputs
    if (!fullName || !email || !password) {
      alert('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Call backend API
    const response = await authAPI.register(fullName, email, password);
    
    // Save authentication data
    storage.setAuthToken(response.token);
    storage.setUser(response.user);
    
    // Update UI state
    setCurrentUser(response.user);
    setActiveScreen('home');
    
    console.log('Registration successful:', response.user);
  } catch (error: any) {
    console.error('Registration failed:', error.message);
    alert(`Registration failed: ${error.message}`);
  }
};

// ============================================
// EXAMPLE 3: LOAD USER PROFILE
// ============================================

// Add useEffect to load user profile on mount
useEffect(() => {
  const loadUserProfile = async () => {
    const token = storage.getAuthToken();
    if (!token) return;

    try {
      const profile = await userAPI.getProfile();
      setCurrentUser(profile);
    } catch (error: any) {
      console.error('Failed to load profile:', error.message);
      // If token is invalid, clear auth and redirect to login
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        storage.clearAll();
        setActiveScreen('login');
      }
    }
  };

  loadUserProfile();
}, []);

// ============================================
// EXAMPLE 4: LOAD EMERGENCY CONTACTS
// ============================================

useEffect(() => {
  const loadContacts = async () => {
    try {
      const contactsData = await contactsAPI.getContacts();
      setContacts(contactsData); // Update your contacts state
    } catch (error: any) {
      console.error('Failed to load contacts:', error.message);
    }
  };

  if (activeScreen === 'contacts') {
    loadContacts();
  }
}, [activeScreen]);

// ============================================
// EXAMPLE 5: ADD EMERGENCY CONTACT
// ============================================

const handleAddContact = async () => {
  try {
    if (!newContact.fullName || !newContact.phoneNumber || !newContact.email) {
      alert('Please fill all contact fields');
      return;
    }

    await contactsAPI.addContact(
      newContact.fullName,
      newContact.phoneNumber,
      newContact.email
    );

    // Reload contacts
    const updatedContacts = await contactsAPI.getContacts();
    setContacts(updatedContacts);

    // Clear form
    setNewContact({ fullName: '', phoneNumber: '', email: '' });
    
    alert('Contact added successfully!');
  } catch (error: any) {
    console.error('Failed to add contact:', error.message);
    alert(`Failed to add contact: ${error.message}`);
  }
};

// ============================================
// EXAMPLE 6: DELETE EMERGENCY CONTACT
// ============================================

const handleDeleteContact = async (contactId: number) => {
  try {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    await contactsAPI.deleteContact(contactId);

    // Reload contacts
    const updatedContacts = await contactsAPI.getContacts();
    setContacts(updatedContacts);
    
    alert('Contact deleted successfully!');
  } catch (error: any) {
    console.error('Failed to delete contact:', error.message);
    alert(`Failed to delete contact: ${error.message}`);
  }
};

// ============================================
// EXAMPLE 7: ACTIVATE SOS
// ============================================

const handleSOSActivation = async () => {
  try {
    // Get current location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Activate SOS with current location
        const response = await sosAPI.activateSOS(latitude, longitude);
        
        // Update UI state
        setSOSActive(true);
        setActiveSession(response.session);
        
        console.log('SOS activated:', response);
        alert('SOS alert sent to your emergency contacts!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enable location services.');
      }
    );
  } catch (error: any) {
    console.error('Failed to activate SOS:', error.message);
    alert(`Failed to activate SOS: ${error.message}`);
  }
};

// ============================================
// EXAMPLE 8: DEACTIVATE SOS
// ============================================

const handleSOSDeactivation = async (sessionId: number) => {
  try {
    await sosAPI.deactivateSOS(sessionId);
    
    // Update UI state
    setSOSActive(false);
    setActiveSession(null);
    
    alert('SOS deactivated. Stay safe!');
  } catch (error: any) {
    console.error('Failed to deactivate SOS:', error.message);
    alert(`Failed to deactivate SOS: ${error.message}`);
  }
};

// ============================================
// EXAMPLE 9: START COMPANION MODE
// ============================================

const handleStartCompanion = async (durationMinutes: number, selectedContactIds: number[]) => {
  try {
    if (selectedContactIds.length === 0) {
      alert('Please select at least one contact');
      return;
    }

    // Get current location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Start companion mode
        const response = await companionAPI.startCompanion(
          latitude,
          longitude,
          durationMinutes,
          selectedContactIds
        );
        
        // Update UI state
        setCompanionActive(true);
        setActiveSession(response.session);
        
        // Start location tracking interval
        startLocationTracking(response.session.id);
        
        console.log('Companion mode started:', response);
        alert('Companion mode activated! Location sharing started.');
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enable location services.');
      }
    );
  } catch (error: any) {
    console.error('Failed to start companion mode:', error.message);
    alert(`Failed to start companion mode: ${error.message}`);
  }
};

// ============================================
// EXAMPLE 10: UPDATE LOCATION (COMPANION MODE)
// ============================================

let locationTrackingInterval: any = null;

const startLocationTracking = (sessionId: number) => {
  // Update location every 5 seconds
  locationTrackingInterval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          await companionAPI.updateLocation(sessionId, latitude, longitude);
          console.log('Location updated:', { latitude, longitude });
        } catch (error: any) {
          console.error('Failed to update location:', error.message);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  }, 5000); // Update every 5 seconds
};

const stopLocationTracking = () => {
  if (locationTrackingInterval) {
    clearInterval(locationTrackingInterval);
    locationTrackingInterval = null;
  }
};

// ============================================
// EXAMPLE 11: STOP COMPANION MODE
// ============================================

const handleStopCompanion = async (sessionId: number) => {
  try {
    await companionAPI.stopCompanion(sessionId);
    
    // Stop location tracking
    stopLocationTracking();
    
    // Update UI state
    setCompanionActive(false);
    setActiveSession(null);
    
    alert('Companion mode stopped.');
  } catch (error: any) {
    console.error('Failed to stop companion mode:', error.message);
    alert(`Failed to stop companion mode: ${error.message}`);
  }
};

// ============================================
// EXAMPLE 12: LOAD ALERT HISTORY
// ============================================

useEffect(() => {
  const loadHistory = async () => {
    try {
      const historyData = await historyAPI.getHistory();
      setAlertHistory(historyData); // Update your history state
    } catch (error: any) {
      console.error('Failed to load history:', error.message);
    }
  };

  if (activeScreen === 'history') {
    loadHistory();
  }
}, [activeScreen]);

// ============================================
// EXAMPLE 13: UPDATE USER PROFILE
// ============================================

const handleUpdateProfile = async () => {
  try {
    await userAPI.updateProfile({
      fullName: currentUser.fullName,
      profileImageUrl: currentUser.profileImageUrl,
      statusEmoji: currentUser.statusEmoji,
      statusText: currentUser.statusText,
      safeword: currentUser.safeword,
      theme: currentUser.theme,
      language: currentUser.language,
      sosAlertsEnabled: currentUser.sosAlertsEnabled,
      companionUpdatesEnabled: currentUser.companionUpdatesEnabled,
      statusUpdatesEnabled: currentUser.statusUpdatesEnabled,
      elderlyMode: currentUser.elderlyMode,
    });

    alert('Profile updated successfully!');
  } catch (error: any) {
    console.error('Failed to update profile:', error.message);
    alert(`Failed to update profile: ${error.message}`);
  }
};

// ============================================
// EXAMPLE 14: CHANGE PASSWORD
// ============================================

const handleChangePassword = async (currentPassword: string, newPassword: string) => {
  try {
    await userAPI.updatePassword(currentPassword, newPassword);
    
    alert('Password changed successfully!');
    
    // Clear password fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  } catch (error: any) {
    console.error('Failed to change password:', error.message);
    alert(`Failed to change password: ${error.message}`);
  }
};

// ============================================
// EXAMPLE 15: SIGN OUT
// ============================================

const handleSignOut = () => {
  // Clear all authentication data
  storage.clearAll();
  
  // Reset UI state
  setCurrentUser(null);
  setActiveScreen('login');
  setSOSActive(false);
  setCompanionActive(false);
  setActiveSession(null);
  
  // Stop any active tracking
  stopLocationTracking();
  
  console.log('User signed out');
};

// ============================================
// EXAMPLE 16: WEBSOCKET FOR REAL-TIME UPDATES
// ============================================

import { io } from 'socket.io-client';

const socket = io('http://localhost:8081');

// Connect to WebSocket
useEffect(() => {
  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  // Listen for location updates (for viewing shared sessions)
  socket.on('location-update', (data) => {
    console.log('Location update received:', data);
    // Update map marker with new location
  });

  return () => {
    socket.disconnect();
  };
}, []);

// Join a session to receive real-time updates
const joinSession = (sessionId: number) => {
  socket.emit('join-session', sessionId);
};

// Leave a session
const leaveSession = (sessionId: number) => {
  socket.emit('leave-session', sessionId);
};

/**
 * INTEGRATION CHECKLIST:
 * 
 * 1. ✅ Created .env file with VITE_API_URL
 * 2. ✅ Created api.ts with all API methods
 * 3. ✅ Created vite-env.d.ts for TypeScript types
 * 4. ✅ Created API_INTEGRATION_GUIDE.md for reference
 * 5. ⏳ Add import statement to index.tsx
 * 6. ⏳ Replace mock functions with real API calls
 * 7. ⏳ Add error handling and loading states
 * 8. ⏳ Test each integration point
 * 9. ⏳ Install socket.io-client: npm install socket.io-client
 * 10. ⏳ Implement WebSocket for real-time features
 */
