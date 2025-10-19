/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDistressSettings } from '../hooks/useDistressSettings';

interface SettingsImportExportProps {
  className?: string;
}

/**
 * Settings import/export component
 * Provides UI for backing up, restoring, and sharing settings
 */
export const SettingsImportExport: React.FC<SettingsImportExportProps> = ({
  className = ''
}) => {
  const {
    exportToFile,
    importFromFile,
    getBackupHistory,
    restoreFromBackup,
    createBackup,
    isSaving
  } = useDistressSettings();

  const [showBackupHistory, setShowBackupHistory] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    try {
      exportToFile();
    } catch (error) {
      console.error('Failed to export settings:', error);
      alert('Failed to export settings. Please try again.');
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      const success = await importFromFile();
      if (success) {
        alert('Settings imported successfully!');
      } else {
        alert('Failed to import settings. Please check the file format.');
      }
    } catch (error) {
      console.error('Failed to import settings:', error);
      alert('Failed to import settings. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateBackup = () => {
    try {
      createBackup();
      alert('Backup created successfully!');
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('Failed to create backup. Please try again.');
    }
  };

  const handleRestoreBackup = async (backup: any) => {
    try {
      const success = await restoreFromBackup(backup);
      if (success) {
        alert('Settings restored successfully!');
        setShowBackupHistory(false);
      } else {
        alert('Failed to restore settings from backup.');
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      alert('Failed to restore backup. Please try again.');
    }
  };

  const backupHistory = getBackupHistory();

  return (
    <div className={className}>
      <div style={{
        padding: '1rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1rem' }}>
          Settings Backup & Restore
        </h3>
        
        {/* Export/Import Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleExport}
              disabled={isSaving}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '0.75rem',
                border: '1px solid #007AFF',
                background: '#007AFF',
                color: 'white',
                borderRadius: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                opacity: isSaving ? 0.6 : 1
              }}
            >
              📤 Export Settings
            </button>
            
            <button
              onClick={handleImport}
              disabled={isSaving || isImporting}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '0.75rem',
                border: '1px solid #28a745',
                background: '#28a745',
                color: 'white',
                borderRadius: '6px',
                cursor: (isSaving || isImporting) ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                opacity: (isSaving || isImporting) ? 0.6 : 1
              }}
            >
              {isImporting ? '📥 Importing...' : '📥 Import Settings'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleCreateBackup}
              disabled={isSaving}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '0.75rem',
                border: '1px solid #6c757d',
                background: '#6c757d',
                color: 'white',
                borderRadius: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                opacity: isSaving ? 0.6 : 1
              }}
            >
              💾 Create Backup
            </button>
            
            <button
              onClick={() => setShowBackupHistory(!showBackupHistory)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '0.75rem',
                border: '1px solid #17a2b8',
                background: showBackupHistory ? '#17a2b8' : 'white',
                color: showBackupHistory ? 'white' : '#17a2b8',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              📋 View Backups ({backupHistory.length})
            </button>
          </div>
        </div>

        {/* Backup History */}
        {showBackupHistory && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            backgroundColor: 'white'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#333', fontSize: '0.9rem' }}>
              Backup History
            </h4>
            
            {backupHistory.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                fontSize: '0.85rem',
                padding: '1rem'
              }}>
                No backups available
              </div>
            ) : (
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {backupHistory.map((backup, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem',
                      border: '1px solid #e9ecef',
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#333' }}>
                        Backup #{backupHistory.length - index}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {new Date(backup.timestamp).toLocaleString()}
                      </div>
                      {backup.metadata?.appVersion && (
                        <div style={{ fontSize: '0.7rem', color: '#999' }}>
                          Version: {backup.metadata.appVersion}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleRestoreBackup(backup)}
                      disabled={isSaving}
                      style={{
                        padding: '0.25rem 0.5rem',
                        border: '1px solid #ffc107',
                        background: '#ffc107',
                        color: '#212529',
                        borderRadius: '4px',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        opacity: isSaving ? 0.6 : 1
                      }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '6px',
          fontSize: '0.8rem',
          color: '#0066cc'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
            💡 Tips:
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>Export settings to share configurations between devices</li>
            <li>Create backups before making major changes</li>
            <li>Automatic backups are created when settings are saved</li>
            <li>Only the last 10 backups are kept to save storage space</li>
          </ul>
        </div>
      </div>
    </div>
  );
};