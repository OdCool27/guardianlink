/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    const errorObj: any = new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    // Preserve additional error data (like existingSession)
    if (error.existingSession) {
      errorObj.existingSession = error.existingSession;
    }
    throw errorObj;
  }
  return response.json();
};

// API request helper
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  return handleResponse(response);
};

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  // Register a new user
  register: async (fullName: string, email: string, password: string) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
  },

  // Login user
  login: async (email: string, password: string) => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};

// ============================================
// USER API
// ============================================
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return apiRequest('/api/user/me', { method: 'GET' });
  },

  // Update user profile
  updateProfile: async (profileData: {
    fullName?: string;
    profileImageUrl?: string;
    statusEmoji?: string;
    statusText?: string;
    safeword?: string;
    theme?: string;
    language?: string;
    sosAlertsEnabled?: boolean;
    companionUpdatesEnabled?: boolean;
    statusUpdatesEnabled?: boolean;
    elderlyMode?: boolean;
  }) => {
    return apiRequest('/api/user/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Update settings
  updateSettings: async (settings: {
    theme?: string;
    language?: string;
    sosAlertsEnabled?: boolean;
    companionUpdatesEnabled?: boolean;
    statusUpdatesEnabled?: boolean;
    elderlyMode?: boolean;
  }) => {
    return apiRequest('/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Update password
  updatePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest('/api/user/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ============================================
// EMERGENCY CONTACTS API
// ============================================
export const contactsAPI = {
  // Get all emergency contacts
  getContacts: async () => {
    return apiRequest('/api/contacts', { method: 'GET' });
  },

  // Add a new emergency contact
  addContact: async (fullName: string, phoneNumber: string, email: string) => {
    return apiRequest('/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ fullName, phoneNumber, email }),
    });
  },

  // Update emergency contact
  updateContact: async (
    contactId: number,
    fullName: string,
    phoneNumber: string,
    email: string
  ) => {
    return apiRequest(`/api/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify({ fullName, phoneNumber, email }),
    });
  },

  // Delete emergency contact
  deleteContact: async (contactId: number) => {
    return apiRequest(`/api/contacts/${contactId}`, { method: 'DELETE' });
  },
};

// ============================================
// SOS API
// ============================================
export const sosAPI = {
  // Activate SOS emergency
  activateSOS: async (latitude: number, longitude: number, contactIds?: number[]) => {
    return apiRequest('/api/sos/activate', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, contactIds }),
    });
  },

  // Activate SOS emergency with distress detection context
  activateSOSWithDistress: async (
    latitude: number, 
    longitude: number, 
    distressContext: {
      detectionMethod: 'speech' | 'audio' | 'combined';
      confidence: number;
      timestamp: Date;
      transcript?: string;
      audioMetrics?: {
        peakVolume: number;
        duration: number;
        frequencyProfile: number[];
      };
    },
    contactIds?: number[]
  ) => {
    return apiRequest('/api/sos/activate-distress', {
      method: 'POST',
      body: JSON.stringify({ 
        latitude, 
        longitude, 
        distressContext,
        contactIds 
      }),
    });
  },

  // Deactivate SOS emergency
  deactivateSOS: async (sessionId: number) => {
    return apiRequest('/api/sos/deactivate', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },

  // Mark user as safe
  markSafe: async (safeword: string) => {
    return apiRequest('/api/sos/mark-safe', {
      method: 'POST',
      body: JSON.stringify({ safeword }),
    });
  },
};

// ============================================
// COMPANION MODE API
// ============================================
export const companionAPI = {
  // Start companion mode
  startCompanion: async (
    latitude: number,
    longitude: number,
    durationMinutes: number,
    contactIds: number[]
  ) => {
    return apiRequest('/api/companion/start', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, durationMinutes, contactIds }),
    });
  },

  // Update location during companion mode
  updateLocation: async (sessionId: number, latitude: number, longitude: number) => {
    return apiRequest('/api/companion/location', {
      method: 'POST',
      body: JSON.stringify({ sessionId, latitude, longitude }),
    });
  },

  // Stop companion mode
  stopCompanion: async (sessionId: number) => {
    return apiRequest('/api/companion/stop', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },

  // Get active sessions
  getActiveSessions: async () => {
    return apiRequest('/api/companion/active-sessions', { method: 'GET' });
  },

  // Get current user's active session
  getActiveSession: async () => {
    return apiRequest('/api/companion/my-active-session', { method: 'GET' });
  },

  // Get sessions shared with me (as a companion)
  getSharedWithMe: async () => {
    return apiRequest('/api/companion/shared-with-me', { method: 'GET' });
  },
};

// ============================================
// HISTORY API
// ============================================
export const historyAPI = {
  // Get alert history
  getHistory: async () => {
    return apiRequest('/api/history', { method: 'GET' });
  },
};

// ============================================
// LOCATION API (for viewing shared sessions)
// ============================================
export const locationAPI = {
  // Get session details for viewing shared location
  getSession: async (sessionId: string) => {
    return apiRequest(`/location/${sessionId}`, { method: 'GET' });
  },
};

// ============================================
// STORAGE HELPERS
// ============================================
export const storage = {
  setAuthToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },

  getAuthToken: () => {
    return localStorage.getItem('authToken');
  },

  removeAuthToken: () => {
    localStorage.removeItem('authToken');
  },

  setUser: (user: any) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => {
    localStorage.removeItem('user');
  },

  clearAll: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

export default {
  auth: authAPI,
  user: userAPI,
  contacts: contactsAPI,
  sos: sosAPI,
  companion: companionAPI,
  history: historyAPI,
  location: locationAPI,
  storage,
};
