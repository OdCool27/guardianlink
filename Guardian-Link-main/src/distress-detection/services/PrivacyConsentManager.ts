/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressSettings } from '../types';

export interface ConsentRecord {
  timestamp: Date;
  version: string;
  consentType: 'microphone' | 'cloud-processing' | 'data-storage';
  granted: boolean;
  userAgent: string;
}

export interface PrivacyConsentState {
  microphoneConsent: boolean;
  cloudProcessingConsent: boolean;
  dataStorageConsent: boolean;
  lastUpdated: Date;
  consentVersion: string;
}

/**
 * Manages user privacy consent and data processing preferences
 * Ensures compliance with privacy requirements and user preferences
 */
export class PrivacyConsentManager {
  private static readonly STORAGE_KEY = 'distress-detection-privacy-consent';
  private static readonly CONSENT_VERSION = '1.0.0';
  private consentCallbacks: Set<(state: PrivacyConsentState) => void> = new Set();

  /**
   * Get current privacy consent state
   */
  getConsentState(): PrivacyConsentState {
    try {
      const stored = localStorage.getItem(PrivacyConsentManager.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated)
        };
      }
    } catch (error) {
      console.error('Error reading consent state:', error);
    }

    // Return default state
    return {
      microphoneConsent: false,
      cloudProcessingConsent: false,
      dataStorageConsent: false,
      lastUpdated: new Date(),
      consentVersion: PrivacyConsentManager.CONSENT_VERSION
    };
  }

  /**
   * Update privacy consent state
   */
  updateConsentState(updates: Partial<PrivacyConsentState>): void {
    const currentState = this.getConsentState();
    const newState: PrivacyConsentState = {
      ...currentState,
      ...updates,
      lastUpdated: new Date(),
      consentVersion: PrivacyConsentManager.CONSENT_VERSION
    };

    try {
      localStorage.setItem(PrivacyConsentManager.STORAGE_KEY, JSON.stringify(newState));
      this.notifyConsentChange(newState);
    } catch (error) {
      console.error('Error saving consent state:', error);
    }
  }

  /**
   * Record a specific consent action
   */
  recordConsent(consentType: ConsentRecord['consentType'], granted: boolean): void {
    const record: ConsentRecord = {
      timestamp: new Date(),
      version: PrivacyConsentManager.CONSENT_VERSION,
      consentType,
      granted,
      userAgent: navigator.userAgent
    };

    // Store consent record
    try {
      const existingRecords = this.getConsentHistory();
      existingRecords.push(record);
      
      // Keep only last 50 records
      const trimmedRecords = existingRecords.slice(-50);
      localStorage.setItem('distress-detection-consent-history', JSON.stringify(trimmedRecords));
    } catch (error) {
      console.error('Error recording consent:', error);
    }

    // Update consent state
    const updates: Partial<PrivacyConsentState> = {};
    switch (consentType) {
      case 'microphone':
        updates.microphoneConsent = granted;
        break;
      case 'cloud-processing':
        updates.cloudProcessingConsent = granted;
        break;
      case 'data-storage':
        updates.dataStorageConsent = granted;
        break;
    }

    this.updateConsentState(updates);
  }

  /**
   * Get consent history
   */
  getConsentHistory(): ConsentRecord[] {
    try {
      const stored = localStorage.getItem('distress-detection-consent-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error reading consent history:', error);
    }
    return [];
  }

  /**
   * Check if user has given required consent for specific features
   */
  hasRequiredConsent(settings: DistressSettings): {
    canUseMicrophone: boolean;
    canUseCloudProcessing: boolean;
    canStoreData: boolean;
    missingConsents: string[];
  } {
    const state = this.getConsentState();
    const missingConsents: string[] = [];

    const canUseMicrophone = state.microphoneConsent;
    if (!canUseMicrophone) {
      missingConsents.push('microphone access');
    }

    const canUseCloudProcessing = settings.nlpProcessing.mode === 'local' || state.cloudProcessingConsent;
    if (settings.nlpProcessing.mode === 'api' && !state.cloudProcessingConsent) {
      missingConsents.push('cloud processing');
    }

    const canStoreData = !settings.privacy.storeAudioLocally || state.dataStorageConsent;
    if (settings.privacy.storeAudioLocally && !state.dataStorageConsent) {
      missingConsents.push('data storage');
    }

    return {
      canUseMicrophone,
      canUseCloudProcessing,
      canStoreData,
      missingConsents
    };
  }

  /**
   * Request consent for specific features
   */
  async requestConsent(
    consentType: ConsentRecord['consentType'],
    reason: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = this.createConsentModal(consentType, reason, (granted: boolean) => {
        this.recordConsent(consentType, granted);
        document.body.removeChild(modal);
        resolve(granted);
      });
      
      document.body.appendChild(modal);
    });
  }

  /**
   * Validate settings against privacy requirements
   */
  validatePrivacySettings(settings: DistressSettings): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for cloud processing without consent
    if (settings.nlpProcessing.mode === 'api') {
      const state = this.getConsentState();
      if (!state.cloudProcessingConsent) {
        errors.push('Cloud processing requires explicit user consent');
      }
      warnings.push('Cloud processing may send data to external AI services');
    }

    // Check for data storage settings
    if (settings.privacy.storeAudioLocally && settings.privacy.dataRetentionDays > 30) {
      warnings.push('Long data retention periods may impact privacy');
    }

    // Check for API data transmission
    if (settings.privacy.sendToAPI && settings.nlpProcessing.mode === 'local') {
      warnings.push('Conflicting settings: API transmission enabled with local processing');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Clear all consent data (for privacy compliance)
   */
  clearAllConsentData(): void {
    try {
      localStorage.removeItem(PrivacyConsentManager.STORAGE_KEY);
      localStorage.removeItem('distress-detection-consent-history');
      localStorage.removeItem('distress-detection-privacy-acknowledged');
      
      const defaultState = this.getConsentState();
      this.notifyConsentChange(defaultState);
    } catch (error) {
      console.error('Error clearing consent data:', error);
    }
  }

  /**
   * Subscribe to consent state changes
   */
  onConsentChange(callback: (state: PrivacyConsentState) => void): void {
    this.consentCallbacks.add(callback);
  }

  /**
   * Unsubscribe from consent state changes
   */
  offConsentChange(callback: (state: PrivacyConsentState) => void): void {
    this.consentCallbacks.delete(callback);
  }

  /**
   * Notify all callbacks about consent changes
   */
  private notifyConsentChange(state: PrivacyConsentState): void {
    this.consentCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in consent change callback:', error);
      }
    });
  }

  /**
   * Create consent request modal
   */
  private createConsentModal(
    consentType: ConsentRecord['consentType'],
    reason: string,
    onResponse: (granted: boolean) => void
  ): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'distress-consent-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 500px;
      margin: 1rem;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

    const { title, description, icon } = this.getConsentModalContent(consentType);

    content.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
        <h2 style="margin: 0 0 1rem 0; color: #333; font-size: 1.5rem;">${title}</h2>
        <p style="color: #666; line-height: 1.5; margin: 0 0 1rem 0;">${description}</p>
        <p style="color: #888; font-size: 0.9rem; margin: 0;">${reason}</p>
      </div>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="deny-consent" style="
          padding: 0.75rem 1.5rem;
          border: 2px solid #ddd;
          background: white;
          color: #666;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        ">Deny</button>
        <button id="grant-consent" style="
          padding: 0.75rem 1.5rem;
          border: none;
          background: #007AFF;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        ">Allow</button>
      </div>
    `;

    const denyButton = content.querySelector('#deny-consent') as HTMLButtonElement;
    const grantButton = content.querySelector('#grant-consent') as HTMLButtonElement;

    denyButton.addEventListener('click', () => onResponse(false));
    grantButton.addEventListener('click', () => onResponse(true));

    // Add hover effects
    grantButton.addEventListener('mouseenter', () => {
      grantButton.style.background = '#0056CC';
    });
    grantButton.addEventListener('mouseleave', () => {
      grantButton.style.background = '#007AFF';
    });

    denyButton.addEventListener('mouseenter', () => {
      denyButton.style.background = '#f5f5f5';
    });
    denyButton.addEventListener('mouseleave', () => {
      denyButton.style.background = 'white';
    });

    modal.appendChild(content);
    return modal;
  }

  /**
   * Get content for consent modal based on type
   */
  private getConsentModalContent(consentType: ConsentRecord['consentType']): {
    title: string;
    description: string;
    icon: string;
  } {
    switch (consentType) {
      case 'microphone':
        return {
          title: 'Microphone Access Required',
          description: 'Distress detection needs microphone access to monitor audio for emergency situations.',
          icon: '🎤'
        };
      case 'cloud-processing':
        return {
          title: 'Cloud Processing Consent',
          description: 'Enhanced AI processing requires sending audio transcripts to secure cloud services for better accuracy.',
          icon: '☁️'
        };
      case 'data-storage':
        return {
          title: 'Data Storage Permission',
          description: 'Store audio samples locally on your device for debugging and improving detection accuracy.',
          icon: '💾'
        };
      default:
        return {
          title: 'Permission Required',
          description: 'This feature requires your consent to function properly.',
          icon: '🔒'
        };
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.consentCallbacks.clear();
  }
}