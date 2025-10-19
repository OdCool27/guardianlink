/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DistressSettings } from '../types';
import { PermissionsManager } from '../services/PermissionsManager';
import { PrivacyConsentManager } from '../services/PrivacyConsentManager';
import { PrivacySettingsPanel } from '../components/PrivacySettingsPanel';

/**
 * Example integration showing how to use permissions and privacy components
 * This demonstrates the complete flow from permission request to settings management
 */
export const PrivacyIntegrationExample: React.FC = () => {
  const [settings, setSettings] = useState<DistressSettings>({
    enabled: false,
    speechRecognition: {
      enabled: true,
      sensitivity: 70,
      language: 'en-US',
      continuousMode: true
    },
    audioAnalysis: {
      enabled: true,
      volumeThreshold: 80,
      spikeDetection: true,
      frequencyAnalysis: true
    },
    nlpProcessing: {
      mode: 'local',
      confidenceThreshold: 70,
      customPhrases: []
    },
    verification: {
      timeoutSeconds: 10,
      showCountdown: true,
      requireExplicitConfirmation: false
    },
    privacy: {
      storeAudioLocally: false,
      sendToAPI: false,
      dataRetentionDays: 7
    }
  });

  const [permissionsManager] = useState(() => new PermissionsManager());
  const [consentManager] = useState(() => new PrivacyConsentManager());
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');

  useEffect(() => {
    // Check initial permission status
    checkPermissions();

    // Listen for permission changes
    const handlePermissionChange = (granted: boolean) => {
      setPermissionStatus(granted ? 'granted' : 'denied');
    };

    permissionsManager.onPermissionChange(handlePermissionChange);

    return () => {
      permissionsManager.offPermissionChange(handlePermissionChange);
      permissionsManager.destroy();
      consentManager.destroy();
    };
  }, [permissionsManager, consentManager]);

  const checkPermissions = async () => {
    try {
      const status = await permissionsManager.getMicrophonePermissionStatus();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionStatus('error');
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const granted = await permissionsManager.showPermissionRequest(
        'Distress detection requires microphone access to monitor for emergency situations and provide automatic safety alerts.'
      );
      
      if (granted) {
        // Record consent
        consentManager.recordConsent('microphone', true);
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('denied');
        permissionsManager.handlePermissionDenied();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setPermissionStatus('error');
    }
  };

  const handleSettingsChange = (newSettings: DistressSettings) => {
    // Validate privacy settings
    const validation = consentManager.validatePrivacySettings(newSettings);
    
    if (validation.errors.length > 0) {
      console.error('Privacy validation errors:', validation.errors);
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn('Privacy validation warnings:', validation.warnings);
    }

    setSettings(newSettings);
  };

  const getPermissionStatusDisplay = () => {
    switch (permissionStatus) {
      case 'granted':
        return { icon: '✅', text: 'Microphone access granted', color: '#28a745' };
      case 'denied':
        return { icon: '❌', text: 'Microphone access denied', color: '#dc3545' };
      case 'prompt':
        return { icon: '❓', text: 'Microphone permission required', color: '#ffc107' };
      case 'checking':
        return { icon: '⏳', text: 'Checking permissions...', color: '#6c757d' };
      default:
        return { icon: '⚠️', text: 'Permission status unknown', color: '#dc3545' };
    }
  };

  const statusDisplay = getPermissionStatusDisplay();

  return (
    <div style={{
      maxWidth: '800px',
      margin: '2rem auto',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '2rem' }}>
        Distress Detection Privacy Integration
      </h1>

      {/* Permission Status */}
      <div style={{
        padding: '1.5rem',
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          {statusDisplay.icon}
        </div>
        <h3 style={{ margin: '0 0 1rem 0', color: statusDisplay.color }}>
          {statusDisplay.text}
        </h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          {permissionsManager.getPermissionStatusMessage()}
        </p>
        
        {permissionStatus === 'prompt' && (
          <button
            onClick={handleRequestPermissions}
            style={{
              padding: '0.75rem 2rem',
              border: 'none',
              background: '#007AFF',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Request Microphone Access
          </button>
        )}

        {permissionStatus === 'denied' && (
          <button
            onClick={() => permissionsManager.handlePermissionDenied()}
            style={{
              padding: '0.75rem 2rem',
              border: '2px solid #007AFF',
              background: 'white',
              color: '#007AFF',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Show Permission Guide
          </button>
        )}
      </div>

      {/* Privacy Settings Panel */}
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '1rem'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#333' }}>
          Privacy Settings
        </h2>
        <PrivacySettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      </div>

      {/* Current Settings Display */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
          Current Configuration
        </h3>
        <pre style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '6px',
          border: '1px solid #ddd',
          fontSize: '0.85rem',
          overflow: 'auto'
        }}>
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>

      {/* Consent History */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
          Privacy Actions
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const history = consentManager.getConsentHistory();
              console.log('Consent history:', history);
              alert(`Found ${history.length} consent records. Check console for details.`);
            }}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #6c757d',
              background: 'white',
              color: '#6c757d',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            View Consent History
          </button>
          <button
            onClick={() => {
              if (confirm('This will clear all privacy consent data. Continue?')) {
                consentManager.clearAllConsentData();
                alert('All consent data cleared.');
              }
            }}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dc3545',
              background: 'white',
              color: '#dc3545',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Clear Consent Data
          </button>
        </div>
      </div>
    </div>
  );
};