/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DistressSettings } from '../types';
import { PrivacyConsentManager, PrivacyConsentState } from '../services/PrivacyConsentManager';
import { PrivacySettingsModal } from './PrivacySettingsModal';

interface PrivacySettingsPanelProps {
  settings: DistressSettings;
  onSettingsChange: (settings: DistressSettings) => void;
  className?: string;
}

/**
 * Privacy settings panel component for integration into main settings
 * Provides quick access to privacy controls and detailed settings modal
 */
export const PrivacySettingsPanel: React.FC<PrivacySettingsPanelProps> = ({
  settings,
  onSettingsChange,
  className = ''
}) => {
  const [consentState, setConsentState] = useState<PrivacyConsentState | null>(null);
  const [showDetailedSettings, setShowDetailedSettings] = useState(false);
  const [consentManager] = useState(() => new PrivacyConsentManager());

  useEffect(() => {
    // Load initial consent state
    setConsentState(consentManager.getConsentState());

    // Subscribe to consent changes
    const handleConsentChange = (state: PrivacyConsentState) => {
      setConsentState(state);
    };

    consentManager.onConsentChange(handleConsentChange);

    return () => {
      consentManager.offConsentChange(handleConsentChange);
    };
  }, [consentManager]);

  const handleQuickToggle = async (setting: 'enabled' | 'localOnly') => {
    if (setting === 'enabled') {
      if (!settings.enabled) {
        // Enabling - check for microphone consent
        if (!consentState?.microphoneConsent) {
          const granted = await consentManager.requestConsent(
            'microphone',
            'Distress detection requires microphone access to monitor for emergency situations.'
          );
          if (!granted) return;
        }
      }

      onSettingsChange({
        ...settings,
        enabled: !settings.enabled
      });
    } else if (setting === 'localOnly') {
      const newMode = settings.nlpProcessing.mode === 'local' ? 'api' : 'local';
      
      if (newMode === 'api') {
        // Switching to API - check for cloud processing consent
        if (!consentState?.cloudProcessingConsent) {
          const granted = await consentManager.requestConsent(
            'cloud-processing',
            'Enhanced AI processing provides better accuracy but requires sending audio transcripts to secure cloud services.'
          );
          if (!granted) return;
        }
      }

      onSettingsChange({
        ...settings,
        nlpProcessing: {
          ...settings.nlpProcessing,
          mode: newMode
        }
      });
    }
  };

  const getPrivacyStatus = () => {
    if (!consentState) return 'loading';
    
    const validation = consentManager.validatePrivacySettings(settings);
    if (validation.errors.length > 0) return 'error';
    if (validation.warnings.length > 0) return 'warning';
    return 'good';
  };

  const getPrivacyStatusText = () => {
    const status = getPrivacyStatus();
    switch (status) {
      case 'loading':
        return 'Loading privacy settings...';
      case 'error':
        return 'Privacy configuration needs attention';
      case 'warning':
        return 'Review privacy settings recommended';
      case 'good':
        return settings.nlpProcessing.mode === 'local' 
          ? 'Maximum privacy protection active'
          : 'Enhanced processing with privacy controls';
      default:
        return 'Privacy settings configured';
    }
  };

  const getPrivacyIcon = () => {
    const status = getPrivacyStatus();
    switch (status) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'good':
        return settings.nlpProcessing.mode === 'local' ? '🔒' : '☁️';
      default:
        return '🔒';
    }
  };

  if (!consentState) {
    return (
      <div className={className} style={{ padding: '1rem', textAlign: 'center' }}>
        <div style={{ color: '#666' }}>Loading privacy settings...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Privacy Status Overview */}
      <div style={{
        padding: '1rem',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        marginBottom: '1rem',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{getPrivacyIcon()}</span>
            <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>
              Privacy & Data Protection
            </h3>
          </div>
          <button
            onClick={() => setShowDetailedSettings(true)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #007AFF',
              background: 'white',
              color: '#007AFF',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Configure
          </button>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
          {getPrivacyStatusText()}
        </p>
      </div>

      {/* Quick Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Distress Detection Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          border: '1px solid #e0e0e0',
          borderRadius: '8px'
        }}>
          <div>
            <div style={{ fontWeight: '500', color: '#333', marginBottom: '0.25rem' }}>
              Distress Detection
            </div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>
              Monitor audio for emergency situations
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={() => handleQuickToggle('enabled')}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: settings.enabled ? '#007AFF' : '#ccc',
              borderRadius: '24px',
              transition: '0.3s',
              '&:before': {
                position: 'absolute',
                content: '""',
                height: '18px',
                width: '18px',
                left: settings.enabled ? '26px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '0.3s'
              }
            }} />
          </label>
        </div>

        {/* Processing Mode Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          opacity: settings.enabled ? 1 : 0.5
        }}>
          <div>
            <div style={{ fontWeight: '500', color: '#333', marginBottom: '0.25rem' }}>
              {settings.nlpProcessing.mode === 'local' ? 'Local Processing' : 'Cloud Processing'}
            </div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>
              {settings.nlpProcessing.mode === 'local' 
                ? 'Maximum privacy - all processing on device'
                : 'Enhanced accuracy - uses secure cloud AI'
              }
            </div>
          </div>
          <button
            onClick={() => handleQuickToggle('localOnly')}
            disabled={!settings.enabled}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #007AFF',
              background: settings.nlpProcessing.mode === 'local' ? '#007AFF' : 'white',
              color: settings.nlpProcessing.mode === 'local' ? 'white' : '#007AFF',
              borderRadius: '6px',
              cursor: settings.enabled ? 'pointer' : 'not-allowed',
              fontSize: '0.85rem'
            }}
          >
            {settings.nlpProcessing.mode === 'local' ? 'Local' : 'Cloud'}
          </button>
        </div>

        {/* Privacy Summary */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f0f8ff',
          border: '1px solid #b3d9ff',
          borderRadius: '8px'
        }}>
          <div style={{ fontWeight: '500', color: '#0066cc', marginBottom: '0.5rem' }}>
            Current Privacy Settings:
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#0066cc', fontSize: '0.85rem' }}>
            <li>Microphone: {consentState.microphoneConsent ? 'Authorized' : 'Not authorized'}</li>
            <li>Processing: {settings.nlpProcessing.mode === 'local' ? 'Local only' : 'Cloud-enhanced'}</li>
            <li>Data storage: {settings.privacy.storeAudioLocally ? `${settings.privacy.dataRetentionDays} days` : 'Disabled'}</li>
            <li>External APIs: {settings.privacy.sendToAPI ? 'Enabled' : 'Disabled'}</li>
          </ul>
        </div>
      </div>

      {/* Detailed Settings Modal */}
      {showDetailedSettings && (
        <PrivacySettingsModal
          isOpen={showDetailedSettings}
          onClose={() => setShowDetailedSettings(false)}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onSave={() => {
            // Settings are already updated via onSettingsChange
            console.log('Privacy settings saved');
          }}
        />
      )}
    </div>
  );
};