/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DistressSettings } from '../types';
import { DEFAULT_DISTRESS_SETTINGS, DEFAULT_DISTRESS_PHRASES } from '../config';

interface DistressDetectionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DistressSettings;
  onSettingsChange: (settings: DistressSettings) => void;
}

/**
 * Comprehensive distress detection settings modal
 * Provides detailed configuration for all detection options
 */
export const DistressDetectionSettingsModal: React.FC<DistressDetectionSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<DistressSettings>(settings);
  const [activeTab, setActiveTab] = useState<'speech' | 'audio' | 'nlp' | 'verification' | 'privacy'>('speech');
  const [customPhrase, setCustomPhrase] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const validateSettings = (settingsToValidate: DistressSettings): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (settingsToValidate.speechRecognition.sensitivity < 0 || settingsToValidate.speechRecognition.sensitivity > 100) {
      errors.speechSensitivity = 'Must be between 0-100';
    }
    
    if (settingsToValidate.audioAnalysis.volumeThreshold < 0 || settingsToValidate.audioAnalysis.volumeThreshold > 120) {
      errors.volumeThreshold = 'Must be between 0-120 dB';
    }
    
    if (settingsToValidate.nlpProcessing.confidenceThreshold < 0 || settingsToValidate.nlpProcessing.confidenceThreshold > 100) {
      errors.confidenceThreshold = 'Must be between 0-100';
    }
    
    if (settingsToValidate.verification.timeoutSeconds < 5 || settingsToValidate.verification.timeoutSeconds > 30) {
      errors.verificationTimeout = 'Must be between 5-30 seconds';
    }
    
    if (settingsToValidate.privacy.dataRetentionDays < 1 || settingsToValidate.privacy.dataRetentionDays > 365) {
      errors.dataRetention = 'Must be between 1-365 days';
    }
    
    return errors;
  };

  const handleLocalSettingsChange = (newSettings: DistressSettings) => {
    setLocalSettings(newSettings);
    setValidationErrors(validateSettings(newSettings));
  };

  const handleSave = () => {
    const errors = validateSettings(localSettings);
    if (Object.keys(errors).length === 0) {
      onSettingsChange(localSettings);
      onClose();
    } else {
      setValidationErrors(errors);
    }
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_DISTRESS_SETTINGS);
    setValidationErrors({});
  };

  const addCustomPhrase = () => {
    if (customPhrase.trim() && !localSettings.nlpProcessing.customPhrases.includes(customPhrase.trim())) {
      handleLocalSettingsChange({
        ...localSettings,
        nlpProcessing: {
          ...localSettings.nlpProcessing,
          customPhrases: [...localSettings.nlpProcessing.customPhrases, customPhrase.trim()]
        }
      });
      setCustomPhrase('');
    }
  };

  const removeCustomPhrase = (phrase: string) => {
    handleLocalSettingsChange({
      ...localSettings,
      nlpProcessing: {
        ...localSettings.nlpProcessing,
        customPhrases: localSettings.nlpProcessing.customPhrases.filter(p => p !== phrase)
      }
    });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'speech', label: 'Speech Recognition', icon: '🎤' },
    { id: 'audio', label: 'Audio Analysis', icon: '🔊' },
    { id: 'nlp', label: 'AI Processing', icon: '🧠' },
    { id: 'verification', label: 'Verification', icon: '✅' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>Distress Detection Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e0e0e0',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                background: activeTab === tab.id ? '#f0f8ff' : 'transparent',
                color: activeTab === tab.id ? '#007AFF' : '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                borderBottom: activeTab === tab.id ? '2px solid #007AFF' : '2px solid transparent'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
          {/* Speech Recognition Tab */}
          {activeTab === 'speech' && (
            <div>
              <h3 style={{ marginTop: 0, color: '#333' }}>Speech Recognition Settings</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={localSettings.speechRecognition.enabled}
                    onChange={(e) => handleLocalSettingsChange({
                      ...localSettings,
                      speechRecognition: { ...localSettings.speechRecognition, enabled: e.target.checked }
                    })}
                  />
                  <span style={{ fontWeight: '500' }}>Enable Speech Recognition</span>
                </label>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Sensitivity: {localSettings.speechRecognition.sensitivity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localSettings.speechRecognition.sensitivity}
                    onChange={(e) => handleLocalSettingsChange({
                      ...localSettings,
                      speechRecognition: { ...localSettings.speechRecognition, sensitivity: parseInt(e.target.value) }
                    })}
                    disabled={!localSettings.speechRecognition.enabled}
                    style={{ width: '100%' }}
                  />
                  {validationErrors.speechSensitivity && (
                    <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {validationErrors.speechSensitivity}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                    Higher sensitivity detects more phrases but may increase false positives
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Language
                  </label>
                  <select
                    value={localSettings.speechRecognition.language}
                    onChange={(e) => handleLocalSettingsChange({
                      ...localSettings,
                      speechRecognition: { ...localSettings.speechRecognition, language: e.target.value }
                    })}
                    disabled={!localSettings.speechRecognition.enabled}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="it-IT">Italian</option>
                    <option value="pt-BR">Portuguese</option>
                  </select>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={localSettings.speechRecognition.continuousMode}
                    onChange={(e) => handleLocalSettingsChange({
                      ...localSettings,
                      speechRecognition: { ...localSettings.speechRecognition, continuousMode: e.target.checked }
                    })}
                    disabled={!localSettings.speechRecognition.enabled}
                  />
                  <span>Continuous listening mode</span>
                </label>
              </div>
            </div>
          )}

          {/* Audio Analysis Tab */}
          {activeTab === 'audio' && (
            <div>
              <h3 style={{ marginTop: 0, color: '#333' }}>Audio Analysis Settings</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={localSettings.audioAnalysis.enabled}
                    onChange={(e) => handleLocalSettingsChange({
                      ...localSettings,
                      audioAnalysis: { ...localSettings.audioAnalysis, enabled: e.target.checked }
                    })}
                  />
                  <span style={{ fontWeight: '500' }}>Enable Audio Analysis</span>
                </label>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Volume Threshold: {localSettings.audioAnalysis.volumeThreshold}dB
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={localSettings.audioAnalysis.volumeThreshold}
                    onChange={(e) => handleLocalSettingsChange({
                      ...localSettings,
                      audioAnalysis: { ...localSettings.audioAnalysis, volumeThreshold: parseInt(e.target.value) }
                    })}
                    disabled={!localSettings.audioAnalysis.enabled}
                    style={{ width: '100%' }}
                  />
                  {validationErrors.volumeThreshold && (
                    <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {validationErrors.volumeThreshold}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                    Decibel level above baseline to trigger detection
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={localSettings.audioAnalysis.spikeDetection}
                      onChange={(e) => handleLocalSettingsChange({
                        ...localSettings,
                        audioAnalysis: { ...localSettings.audioAnalysis, spikeDetection: e.target.checked }
                      })}
                      disabled={!localSettings.audioAnalysis.enabled}
                    />
                    <span>Volume spike detection</span>
                  </label>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1.5rem' }}>
                    Detect sudden increases in volume that may indicate distress
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={localSettings.audioAnalysis.frequencyAnalysis}
                      onChange={(e) => handleLocalSettingsChange({
                        ...localSettings,
                        audioAnalysis: { ...localSettings.audioAnalysis, frequencyAnalysis: e.target.checked }
                      })}
                      disabled={!localSettings.audioAnalysis.enabled}
                    />
                    <span>Frequency pattern analysis</span>
                  </label>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1.5rem' }}>
                    Analyze frequency patterns to detect screaming or impact sounds
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NLP Processing Tab */}
          {activeTab === 'nlp' && (
            <div>
              <h3 style={{ marginTop: 0, color: '#333' }}>AI Processing Settings</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Processing Mode
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="radio"
                        name="processingMode"
                        checked={localSettings.nlpProcessing.mode === 'local'}
                        onChange={() => handleLocalSettingsChange({
                          ...localSettings,
                          nlpProcessing: { ...localSettings.nlpProcessing, mode: 'local' }
                        })}
                      />
                      <span>Local Processing</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="radio"
                        name="processingMode"
                        checked={localSettings.nlpProcessing.mode === 'api'}
                        onChange={() => handleLocalSettingsChange({
                          ...localSettings,
                          nlpProcessing: { ...localSettings.nlpProcessing, mode: 'api' }
                        })}
                      />
                      <span>Cloud AI</span>
                    </label>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {localSettings.nlpProcessing.mode === 'local' 
                      ? 'Maximum privacy - all processing on device'
                      : 'Enhanced accuracy - uses secure cloud AI services'
                    }
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Confidence Threshold: {localSettings.nlpProcessing.confidenceThreshold}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localSettings.nlpProcessing.confidenceThreshold}
                    onChange={(e) => handleLocalSettingsChange({
                      ...localSettings,
                      nlpProcessing: { ...localSettings.nlpProcessing, confidenceThreshold: parseInt(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                  {validationErrors.confidenceThreshold && (
                    <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {validationErrors.confidenceThreshold}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                    Minimum confidence level required to trigger distress detection
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Custom Distress Phrases
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={customPhrase}
                      onChange={(e) => setCustomPhrase(e.target.value)}
                      placeholder="Add custom phrase..."
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomPhrase()}
                    />
                    <button
                      onClick={addCustomPhrase}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #007AFF',
                        background: '#007AFF',
                        color: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Add
                    </button>
                  </div>
                  
                  <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                    {/* Default phrases */}
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: '#666' }}>
                      Default phrases:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
                      {DEFAULT_DISTRESS_PHRASES.map(phrase => (
                        <span
                          key={phrase}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            color: '#666'
                          }}
                        >
                          "{phrase}"
                        </span>
                      ))}
                    </div>
                    
                    {/* Custom phrases */}
                    {localSettings.nlpProcessing.customPhrases.length > 0 && (
                      <>
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: '#666' }}>
                          Custom phrases:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {localSettings.nlpProcessing.customPhrases.map(phrase => (
                            <span
                              key={phrase}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                color: '#1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              "{phrase}"
                              <button
                                onClick={() => removeCustomPhrase(phrase)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#1976d2',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  padding: 0
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Tab */}
          {activeTab === 'verification' && (
            <div>
              <h3 style={{ marginTop: 0, color: '#333' }}>Verification Settings</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Timeout: {localSettings.verification.timeoutSeconds} seconds
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={localSettings.verification.timeoutSeconds}
                    onChange={(e) => handleLocalSettingsChange({
                      ...localSettings,
                      verification: { ...localSettings.verification, timeoutSeconds: parseInt(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                  {validationErrors.verificationTimeout && (
                    <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {validationErrors.verificationTimeout}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                    Time to wait for user response before automatically triggering SOS
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={localSettings.verification.showCountdown}
                      onChange={(e) => handleLocalSettingsChange({
                        ...localSettings,
                        verification: { ...localSettings.verification, showCountdown: e.target.checked }
                      })}
                    />
                    <span>Show countdown timer</span>
                  </label>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1.5rem' }}>
                    Display a visual countdown during verification
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={localSettings.verification.requireExplicitConfirmation}
                      onChange={(e) => handleLocalSettingsChange({
                        ...localSettings,
                        verification: { ...localSettings.verification, requireExplicitConfirmation: e.target.checked }
                      })}
                    />
                    <span>Require explicit confirmation</span>
                  </label>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1.5rem' }}>
                    User must actively dismiss the alert (no automatic timeout)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div>
              <h3 style={{ marginTop: 0, color: '#333' }}>Privacy Settings</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={localSettings.privacy.storeAudioLocally}
                      onChange={(e) => handleLocalSettingsChange({
                        ...localSettings,
                        privacy: { ...localSettings.privacy, storeAudioLocally: e.target.checked }
                      })}
                    />
                    <span>Store audio data locally</span>
                  </label>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1.5rem' }}>
                    Keep audio recordings on device for analysis and debugging
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={localSettings.privacy.sendToAPI}
                      onChange={(e) => handleLocalSettingsChange({
                        ...localSettings,
                        privacy: { ...localSettings.privacy, sendToAPI: e.target.checked }
                      })}
                    />
                    <span>Send data to external APIs</span>
                  </label>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1.5rem' }}>
                    Allow sending transcripts to cloud AI services for enhanced processing
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Data Retention: {localSettings.privacy.dataRetentionDays} days
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={localSettings.privacy.dataRetentionDays}
                    onChange={(e) => handleLocalSettingsChange({
                      ...localSettings,
                      privacy: { ...localSettings.privacy, dataRetentionDays: parseInt(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                  {validationErrors.dataRetention && (
                    <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {validationErrors.dataRetention}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                    How long to keep detection events and audio data
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #ccc',
              background: 'white',
              color: '#666',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #ccc',
              background: 'white',
              color: '#666',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={Object.keys(validationErrors).length > 0}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #007AFF',
              background: Object.keys(validationErrors).length > 0 ? '#ccc' : '#007AFF',
              color: 'white',
              borderRadius: '6px',
              cursor: Object.keys(validationErrors).length > 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};