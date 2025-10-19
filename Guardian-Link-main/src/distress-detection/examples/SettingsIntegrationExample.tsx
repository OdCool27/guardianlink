/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DistressDetectionSettingsPanel, 
  SettingsImportExport 
} from '../components';
import { useDistressSettings } from '../hooks';

/**
 * Example integration of distress detection settings into main app
 * Shows how to integrate the settings panel into existing settings screens
 */
export const SettingsIntegrationExample: React.FC = () => {
  const {
    settings,
    validation,
    isValid,
    isLoading,
    isSaving,
    updateSettings,
    resetToDefaults
  } = useDistressSettings();

  const [showAdvanced, setShowAdvanced] = useState(false);

  if (isLoading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        color: '#666'
      }}>
        Loading distress detection settings...
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0'
      }}>
        <h1 style={{ 
          margin: '0 0 0.5rem 0', 
          color: '#333',
          fontSize: '1.5rem'
        }}>
          🛡️ Distress Detection Settings
        </h1>
        <p style={{ 
          margin: 0, 
          color: '#666',
          fontSize: '0.95rem'
        }}>
          Configure AI-powered audio monitoring to automatically detect emergency situations
        </p>
      </div>

      {/* Validation Status */}
      {validation && !isValid && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#fff5f5',
          border: '1px solid #ffcdd2',
          borderRadius: '8px'
        }}>
          <div style={{ 
            fontWeight: '500', 
            color: '#d32f2f',
            marginBottom: '0.5rem'
          }}>
            ⚠️ Configuration Issues
          </div>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '1.25rem',
            color: '#d32f2f',
            fontSize: '0.9rem'
          }}>
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          {validation.warnings.length > 0 && (
            <>
              <div style={{ 
                fontWeight: '500', 
                color: '#f57c00',
                marginTop: '0.75rem',
                marginBottom: '0.25rem'
              }}>
                Warnings:
              </div>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '1.25rem',
                color: '#f57c00',
                fontSize: '0.9rem'
              }}>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Main Settings Panel */}
      <div style={{ marginBottom: '2rem' }}>
        <DistressDetectionSettingsPanel
          settings={settings}
          onSettingsChange={updateSettings}
        />
      </div>

      {/* Advanced Options Toggle */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: '0.75rem 1.5rem',
            border: '1px solid #007AFF',
            background: showAdvanced ? '#007AFF' : 'white',
            color: showAdvanced ? 'white' : '#007AFF',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          {showAdvanced ? '🔼 Hide Advanced Options' : '🔽 Show Advanced Options'}
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div style={{
          padding: '1.5rem',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          backgroundColor: '#fafafa',
          marginBottom: '2rem'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            color: '#333',
            fontSize: '1.1rem'
          }}>
            🔧 Advanced Options
          </h3>
          
          {/* Import/Export */}
          <div style={{ marginBottom: '1.5rem' }}>
            <SettingsImportExport />
          </div>

          {/* Reset Options */}
          <div style={{
            padding: '1rem',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            backgroundColor: '#fff5f5'
          }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: '#d32f2f',
              fontSize: '1rem'
            }}>
              ⚠️ Reset Settings
            </h4>
            <p style={{ 
              margin: '0 0 1rem 0', 
              color: '#666',
              fontSize: '0.9rem'
            }}>
              This will reset all distress detection settings to their default values. 
              This action cannot be undone.
            </p>
            <button
              onClick={resetToDefaults}
              disabled={isSaving}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d32f2f',
                background: '#d32f2f',
                color: 'white',
                borderRadius: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                opacity: isSaving ? 0.6 : 1
              }}
            >
              {isSaving ? 'Resetting...' : 'Reset to Defaults'}
            </button>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div style={{
        padding: '1rem',
        backgroundColor: isValid ? '#e8f5e8' : '#fff5f5',
        border: `1px solid ${isValid ? '#c8e6c9' : '#ffcdd2'}`,
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{ 
          color: isValid ? '#2e7d32' : '#d32f2f',
          fontWeight: '500',
          marginBottom: '0.25rem'
        }}>
          {isSaving ? '💾 Saving settings...' : 
           isValid ? '✅ Settings are valid and saved' : 
           '❌ Please fix configuration issues above'}
        </div>
        {isValid && (
          <div style={{ 
            color: '#666',
            fontSize: '0.85rem'
          }}>
            Your distress detection system is properly configured
          </div>
        )}
      </div>

      {/* Integration Notes */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#e3f2fd',
        border: '1px solid #bbdefb',
        borderRadius: '8px'
      }}>
        <div style={{ 
          fontWeight: '500', 
          color: '#1976d2',
          marginBottom: '0.5rem'
        }}>
          💡 Integration Notes:
        </div>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '1.25rem',
          color: '#1976d2',
          fontSize: '0.85rem'
        }}>
          <li>This settings panel can be integrated into your main app settings</li>
          <li>Use the <code>useDistressSettings</code> hook for state management</li>
          <li>Settings are automatically persisted to localStorage</li>
          <li>Validation happens in real-time with user feedback</li>
          <li>Import/export allows users to share configurations</li>
        </ul>
      </div>
    </div>
  );
};