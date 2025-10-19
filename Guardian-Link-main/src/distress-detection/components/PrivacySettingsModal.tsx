/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DistressSettings } from '../types';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DistressSettings;
  onSettingsChange: (settings: DistressSettings) => void;
  onSave: () => void;
}

/**
 * Privacy settings modal component for distress detection
 * Provides comprehensive privacy controls and consent management
 */
export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onSave
}) => {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [hasReadNotice, setHasReadNotice] = useState(false);

  useEffect(() => {
    // Check if user has previously acknowledged privacy notice
    const acknowledged = localStorage.getItem('distress-detection-privacy-acknowledged');
    setHasReadNotice(acknowledged === 'true');
  }, []);

  const handlePrivacySettingChange = (key: keyof DistressSettings['privacy'], value: any) => {
    const updatedSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: value
      }
    };
    onSettingsChange(updatedSettings);
  };

  const handleNLPModeChange = (mode: 'local' | 'api') => {
    const updatedSettings = {
      ...settings,
      nlpProcessing: {
        ...settings.nlpProcessing,
        mode
      }
    };
    onSettingsChange(updatedSettings);
  };

  const handleSave = () => {
    // Mark privacy notice as acknowledged if API processing is enabled
    if (settings.nlpProcessing.mode === 'api' || settings.privacy.sendToAPI) {
      localStorage.setItem('distress-detection-privacy-acknowledged', 'true');
      setHasReadNotice(true);
    }
    onSave();
    onClose();
  };

  const showAPIWarning = settings.nlpProcessing.mode === 'api' || settings.privacy.sendToAPI;

  if (!isOpen) return null;

  return (
    <div className="distress-privacy-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div className="distress-privacy-modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: '1rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
            Privacy & Data Settings
          </h2>
          <p style={{ color: '#666', margin: '0.5rem 0 0 0' }}>
            Control how your audio data is processed and stored
          </p>
        </div>

        {/* Processing Mode Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.1rem' }}>
            Processing Mode
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              border: '2px solid',
              borderColor: settings.nlpProcessing.mode === 'local' ? '#007AFF' : '#e0e0e0',
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: settings.nlpProcessing.mode === 'local' ? '#f0f8ff' : 'white'
            }}>
              <input
                type="radio"
                name="processingMode"
                value="local"
                checked={settings.nlpProcessing.mode === 'local'}
                onChange={() => handleNLPModeChange('local')}
                style={{ marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
                  🔒 Local Processing (Recommended)
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  All audio analysis happens on your device. No data is sent to external servers.
                  Maximum privacy protection.
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              border: '2px solid',
              borderColor: settings.nlpProcessing.mode === 'api' ? '#007AFF' : '#e0e0e0',
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: settings.nlpProcessing.mode === 'api' ? '#f0f8ff' : 'white'
            }}>
              <input
                type="radio"
                name="processingMode"
                value="api"
                checked={settings.nlpProcessing.mode === 'api'}
                onChange={() => handleNLPModeChange('api')}
                style={{ marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
                  ☁️ Cloud Processing (Enhanced Accuracy)
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  Uses advanced AI models for better detection accuracy. Audio transcripts may be
                  sent to secure AI services.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Data Storage Settings */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.1rem' }}>
            Data Storage
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              border: '1px solid #e0e0e0',
              borderRadius: '8px'
            }}>
              <input
                type="checkbox"
                checked={settings.privacy.storeAudioLocally}
                onChange={(e) => handlePrivacySettingChange('storeAudioLocally', e.target.checked)}
              />
              <div>
                <div style={{ fontWeight: '500', color: '#333' }}>
                  Store audio samples locally
                </div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>
                  Keep audio samples on device for debugging and improvement
                </div>
              </div>
            </label>

            <div style={{
              padding: '1rem',
              border: '1px solid #e0e0e0',
              borderRadius: '8px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '500', color: '#333' }}>Data retention period:</span>
              </label>
              <select
                value={settings.privacy.dataRetentionDays}
                onChange={(e) => handlePrivacySettingChange('dataRetentionDays', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              >
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
              <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Audio data will be automatically deleted after this period
              </div>
            </div>
          </div>
        </div>

        {/* API Warning */}
        {showAPIWarning && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: '600', color: '#856404', marginBottom: '0.25rem' }}>
                  External Data Processing
                </div>
                <div style={{ color: '#856404', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  With cloud processing enabled, audio transcripts may be sent to AI services.
                  Data is encrypted and processed securely, but consider your privacy preferences.
                </div>
                <button
                  onClick={() => setShowPrivacyNotice(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007AFF',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    marginTop: '0.5rem'
                  }}
                >
                  Read detailed privacy notice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          marginTop: '2rem'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid #ddd',
              background: 'white',
              color: '#666',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={showAPIWarning && !hasReadNotice}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: (showAPIWarning && !hasReadNotice) ? '#ccc' : '#007AFF',
              color: 'white',
              borderRadius: '8px',
              cursor: (showAPIWarning && !hasReadNotice) ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Save Settings
          </button>
        </div>

        {/* Privacy Notice Modal */}
        {showPrivacyNotice && (
          <PrivacyNoticeModal
            onClose={() => setShowPrivacyNotice(false)}
            onAccept={() => {
              setHasReadNotice(true);
              setShowPrivacyNotice(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

interface PrivacyNoticeModalProps {
  onClose: () => void;
  onAccept: () => void;
}

/**
 * Detailed privacy notice modal
 */
const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({ onClose, onAccept }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'auto',
        margin: '1rem'
      }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>
          Privacy Notice - Distress Detection
        </h2>

        <div style={{ color: '#555', lineHeight: '1.6', marginBottom: '2rem' }}>
          <h3 style={{ color: '#333', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Data Collection and Processing
          </h3>
          <p>
            When you enable cloud-based distress detection, the following data may be processed:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
            <li>Audio transcripts (converted speech-to-text)</li>
            <li>Audio analysis metadata (volume levels, frequency patterns)</li>
            <li>Detection confidence scores and timestamps</li>
          </ul>

          <h3 style={{ color: '#333', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Third-Party Services
          </h3>
          <p>
            We may use the following secure AI services for enhanced detection:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
            <li><strong>Hugging Face Inference API:</strong> For advanced natural language processing</li>
            <li><strong>OpenAI Whisper:</strong> For improved speech recognition accuracy</li>
          </ul>

          <h3 style={{ color: '#333', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Data Security
          </h3>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
            <li>All data is transmitted using encrypted connections (HTTPS/TLS)</li>
            <li>No raw audio files are sent to external services</li>
            <li>Data is processed in real-time and not permanently stored by AI services</li>
            <li>You can switch to local processing at any time</li>
          </ul>

          <h3 style={{ color: '#333', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Your Rights
          </h3>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
            <li>You can disable cloud processing at any time</li>
            <li>You can request deletion of any stored data</li>
            <li>You have full control over data retention periods</li>
            <li>Local processing is always available as an alternative</li>
          </ul>

          <div style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <strong>Important:</strong> Emergency situations take priority. If distress is detected
            and confirmed, emergency protocols will activate regardless of privacy settings to
            ensure your safety.
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid #ddd',
              background: 'white',
              color: '#666',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Close
          </button>
          <button
            onClick={onAccept}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: '#007AFF',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};