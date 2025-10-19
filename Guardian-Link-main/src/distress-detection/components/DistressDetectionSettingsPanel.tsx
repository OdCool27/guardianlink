/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DistressSettings } from '../types';
import { DEFAULT_DISTRESS_SETTINGS } from '../config';

interface DistressDetectionSettingsPanelProps {
  settings: DistressSettings;
  onSettingsChange: (settings: DistressSettings) => void;
  className?: string;
}

/**
 * Main distress detection settings panel component
 * Provides comprehensive settings interface for all detection options
 */
export const DistressDetectionSettingsPanel: React.FC<DistressDetectionSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  className = ''
}) => {
  const [showDetailedSettings, setShowDetailedSettings] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate settings
  useEffect(() => {
    const errors: string[] = [];
    
    if (settings.speechRecognition.sensitivity < 0 || settings.speechRecognition.sensitivity > 100) {
      errors.push('Speech recognition sensitivity must be between 0-100');
    }
    
    if (settings.audioAnalysis.volumeThreshold < 0 || settings.audioAnalysis.volumeThreshold > 120) {
      errors.push('Volume threshold must be between 0-120 dB');
    }
    
    if (settings.nlpProcessing.confidenceThreshold < 0 || settings.nlpProcessing.confidenceThreshold > 100) {
      errors.push('NLP confidence threshold must be between 0-100');
    }
    
    if (settings.verification.timeoutSeconds < 5 || settings.verification.timeoutSeconds > 30) {
      errors.push('Verification timeout must be between 5-30 seconds');
    }
    
    if (settings.privacy.dataRetentionDays < 1 || settings.privacy.dataRetentionDays > 365) {
      errors.push('Data retention must be between 1-365 days');
    }
    
    setValidationErrors(errors);
  }, [settings]);

  const handleQuickToggle = (setting: 'enabled' | 'speechEnabled' | 'audioEnabled') => {
    switch (setting) {
      case 'enabled':
        onSettingsChange({
          ...settings,
          enabled: !settings.enabled
        });
        break;
      case 'speechEnabled':
        onSettingsChange({
          ...settings,
          speechRecognition: {
            ...settings.speechRecognition,
            enabled: !settings.speechRecognition.enabled
          }
        });
        break;
      case 'audioEnabled':
        onSettingsChange({
          ...settings,
          audioAnalysis: {
            ...settings.audioAnalysis,
            enabled: !settings.audioAnalysis.enabled
          }
        });
        break;
    }
  };

  const handleSensitivityChange = (type: 'speech' | 'audio' | 'nlp', value: number) => {
    switch (type) {
      case 'speech':
        onSettingsChange({
          ...settings,
          speechRecognition: {
            ...settings.speechRecognition,
            sensitivity: value
          }
        });
        break;
      case 'audio':
        onSettingsChange({
          ...settings,
          audioAnalysis: {
            ...settings.audioAnalysis,
            volumeThreshold: value
          }
        });
        break;
      case 'nlp':
        onSettingsChange({
          ...settings,
          nlpProcessing: {
            ...settings.nlpProcessing,
            confidenceThreshold: value
          }
        });
        break;
    }
  };

  const handleProcessingModeChange = (mode: 'local' | 'api') => {
    onSettingsChange({
      ...settings,
      nlpProcessing: {
        ...settings.nlpProcessing,
        mode
      }
    });
  };

  const getStatusIcon = () => {
    if (validationErrors.length > 0) return '⚠️';
    if (!settings.enabled) return '⏸️';
    return '🛡️';
  };

  const getStatusText = () => {
    if (validationErrors.length > 0) return 'Configuration needs attention';
    if (!settings.enabled) return 'Distress detection disabled';
    
    const activeFeatures = [];
    if (settings.speechRecognition.enabled) activeFeatures.push('Speech');
    if (settings.audioAnalysis.enabled) activeFeatures.push('Audio');
    
    return activeFeatures.length > 0 
      ? `Active: ${activeFeatures.join(' + ')} monitoring`
      : 'Enabled but no detection methods active';
  };

  return (
    <div className={className}>
      {/* Status Overview */}
      <div style={{
        padding: '1rem',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        marginBottom: '1rem',
        backgroundColor: validationErrors.length > 0 ? '#fff5f5' : '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{getStatusIcon()}</span>
            <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>
              AI Distress Detection
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
        <p style={{ 
          margin: 0, 
          color: validationErrors.length > 0 ? '#d32f2f' : '#666', 
          fontSize: '0.9rem' 
        }}>
          {getStatusText()}
        </p>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            backgroundColor: '#ffebee', 
            borderRadius: '4px' 
          }}>
            <div style={{ fontSize: '0.85rem', color: '#d32f2f', fontWeight: '500' }}>
              Configuration Issues:
            </div>
            <ul style={{ margin: '0.25rem 0 0 1rem', fontSize: '0.8rem', color: '#d32f2f' }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quick Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Master Toggle */}
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
              Enable Distress Detection
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

        {/* Detection Methods */}
        <div style={{
          padding: '1rem',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          opacity: settings.enabled ? 1 : 0.5
        }}>
          <div style={{ fontWeight: '500', color: '#333', marginBottom: '1rem' }}>
            Detection Methods
          </div>
          
          {/* Speech Recognition */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>Speech Recognition</div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>
                  Detect distress phrases in speech
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                <input
                  type="checkbox"
                  checked={settings.speechRecognition.enabled}
                  onChange={() => handleQuickToggle('speechEnabled')}
                  disabled={!settings.enabled}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: settings.enabled ? 'pointer' : 'not-allowed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.speechRecognition.enabled ? '#007AFF' : '#ccc',
                  borderRadius: '20px',
                  transition: '0.3s'
                }} />
              </label>
            </div>
            
            {/* Speech Sensitivity Slider */}
            {settings.speechRecognition.enabled && (
              <div style={{ marginLeft: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  <span>Sensitivity:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.speechRecognition.sensitivity}
                    onChange={(e) => handleSensitivityChange('speech', parseInt(e.target.value))}
                    disabled={!settings.enabled}
                    style={{ flex: 1 }}
                  />
                  <span>{settings.speechRecognition.sensitivity}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Audio Analysis */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>Audio Analysis</div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>
                  Detect volume spikes and distress sounds
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                <input
                  type="checkbox"
                  checked={settings.audioAnalysis.enabled}
                  onChange={() => handleQuickToggle('audioEnabled')}
                  disabled={!settings.enabled}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: settings.enabled ? 'pointer' : 'not-allowed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.audioAnalysis.enabled ? '#007AFF' : '#ccc',
                  borderRadius: '20px',
                  transition: '0.3s'
                }} />
              </label>
            </div>
            
            {/* Audio Threshold Slider */}
            {settings.audioAnalysis.enabled && (
              <div style={{ marginLeft: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  <span>Threshold:</span>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={settings.audioAnalysis.volumeThreshold}
                    onChange={(e) => handleSensitivityChange('audio', parseInt(e.target.value))}
                    disabled={!settings.enabled}
                    style={{ flex: 1 }}
                  />
                  <span>{settings.audioAnalysis.volumeThreshold}dB</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Processing Mode */}
        <div style={{
          padding: '1rem',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          opacity: settings.enabled ? 1 : 0.5
        }}>
          <div style={{ fontWeight: '500', color: '#333', marginBottom: '0.75rem' }}>
            Processing Mode
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleProcessingModeChange('local')}
              disabled={!settings.enabled}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #007AFF',
                background: settings.nlpProcessing.mode === 'local' ? '#007AFF' : 'white',
                color: settings.nlpProcessing.mode === 'local' ? 'white' : '#007AFF',
                borderRadius: '6px',
                cursor: settings.enabled ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem'
              }}
            >
              Local Processing
            </button>
            <button
              onClick={() => handleProcessingModeChange('api')}
              disabled={!settings.enabled}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #007AFF',
                background: settings.nlpProcessing.mode === 'api' ? '#007AFF' : 'white',
                color: settings.nlpProcessing.mode === 'api' ? 'white' : '#007AFF',
                borderRadius: '6px',
                cursor: settings.enabled ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem'
              }}
            >
              Cloud AI
            </button>
          </div>
          <div style={{ 
            marginTop: '0.5rem', 
            fontSize: '0.8rem', 
            color: '#666',
            textAlign: 'center'
          }}>
            {settings.nlpProcessing.mode === 'local' 
              ? 'Maximum privacy - all processing on device'
              : 'Enhanced accuracy - uses secure cloud AI'
            }
          </div>
        </div>
      </div>

      {/* Detailed Settings Modal - Lazy loaded */}
      {showDetailedSettings && (
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
            padding: '1.5rem',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{ margin: 0 }}>Advanced Settings</h3>
              <button
                onClick={() => setShowDetailedSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              For detailed configuration options, please use the comprehensive settings modal 
              component (DistressDetectionSettingsModal) which provides full access to all 
              distress detection parameters.
            </p>
            <button
              onClick={() => setShowDetailedSettings(false)}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #007AFF',
                background: '#007AFF',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};