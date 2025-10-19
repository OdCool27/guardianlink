/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DistressSettings } from '../types';
import { DistressSettingsManager } from '../services/DistressSettingsManager';

/**
 * Settings validation result
 */
interface SettingsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Settings change event
 */
interface SettingsChangeEvent {
  previousSettings: DistressSettings;
  newSettings: DistressSettings;
  changedFields: string[];
  timestamp: Date;
}

/**
 * Settings export/import format
 */
interface DistressSettingsExport {
  version: string;
  timestamp: string;
  settings: DistressSettings;
  metadata?: {
    appVersion?: string;
    deviceInfo?: string;
  };
}

/**
 * Hook return type
 */
interface UseDistressSettingsReturn {
  // Current settings
  settings: DistressSettings;
  
  // Validation state
  validation: SettingsValidationResult | null;
  isValid: boolean;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Settings operations
  updateSettings: (newSettings: DistressSettings) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  
  // Import/Export operations
  exportSettings: () => DistressSettingsExport;
  exportToFile: () => void;
  importSettings: (exportData: DistressSettingsExport) => Promise<boolean>;
  importFromFile: () => Promise<boolean>;
  
  // Backup operations
  getBackupHistory: () => DistressSettingsExport[];
  createBackup: () => void;
  restoreFromBackup: (backup: DistressSettingsExport) => Promise<boolean>;
  
  // Event handlers
  onSettingsChange: (callback: (event: SettingsChangeEvent) => void) => () => void;
  onValidation: (callback: (result: SettingsValidationResult) => void) => () => void;
}

/**
 * React hook for distress detection settings management
 * Provides comprehensive settings operations with validation and persistence
 */
export const useDistressSettings = (): UseDistressSettingsReturn => {
  const [settings, setSettings] = useState<DistressSettings | null>(null);
  const [validation, setValidation] = useState<SettingsValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const settingsManagerRef = useRef<DistressSettingsManager | null>(null);

  // Initialize settings manager
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        setIsLoading(true);
        
        // Create settings manager instance
        const manager = new DistressSettingsManager();
        settingsManagerRef.current = manager;
        
        // Load initial settings
        const initialSettings = manager.getSettings();
        setSettings(initialSettings);
        
        // Set up validation listener
        const validationListener = (result: SettingsValidationResult) => {
          setValidation(result);
        };
        manager.onValidation(validationListener);
        
        // Set up change listener to update local state
        const changeListener = (event: SettingsChangeEvent) => {
          setSettings(event.newSettings);
        };
        manager.onSettingsChange(changeListener);
        
      } catch (error) {
        console.error('Failed to initialize distress settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();

    // Cleanup on unmount
    return () => {
      if (settingsManagerRef.current) {
        // Note: In a real implementation, we'd need to track listeners to remove them
        settingsManagerRef.current = null;
      }
    };
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings: DistressSettings): Promise<boolean> => {
    if (!settingsManagerRef.current) return false;
    
    try {
      setIsSaving(true);
      const result = settingsManagerRef.current.updateSettings(newSettings);
      return result.isValid;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    if (!settingsManagerRef.current) return false;
    
    try {
      setIsSaving(true);
      const result = settingsManagerRef.current.resetToDefaults();
      return result.isValid;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Export settings
  const exportSettings = useCallback((): DistressSettingsExport => {
    if (!settingsManagerRef.current) {
      throw new Error('Settings manager not initialized');
    }
    return settingsManagerRef.current.exportSettings();
  }, []);

  // Export to file
  const exportToFile = useCallback((): void => {
    if (!settingsManagerRef.current) return;
    settingsManagerRef.current.exportToFile();
  }, []);

  // Import settings
  const importSettings = useCallback(async (exportData: DistressSettingsExport): Promise<boolean> => {
    if (!settingsManagerRef.current) return false;
    
    try {
      setIsSaving(true);
      const result = settingsManagerRef.current.importSettings(exportData);
      return result.isValid;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Import from file
  const importFromFile = useCallback(async (): Promise<boolean> => {
    if (!settingsManagerRef.current) return false;
    
    try {
      setIsSaving(true);
      const result = await settingsManagerRef.current.importFromFile();
      return result.isValid;
    } catch (error) {
      console.error('Failed to import settings from file:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Get backup history
  const getBackupHistory = useCallback((): DistressSettingsExport[] => {
    if (!settingsManagerRef.current) return [];
    return settingsManagerRef.current.getBackupHistory();
  }, []);

  // Create backup
  const createBackup = useCallback((): void => {
    if (!settingsManagerRef.current) return;
    settingsManagerRef.current.createBackup();
  }, []);

  // Restore from backup
  const restoreFromBackup = useCallback(async (backup: DistressSettingsExport): Promise<boolean> => {
    if (!settingsManagerRef.current) return false;
    
    try {
      setIsSaving(true);
      const result = settingsManagerRef.current.restoreFromBackup(backup);
      return result.isValid;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Event handler registration
  const onSettingsChange = useCallback((callback: (event: SettingsChangeEvent) => void) => {
    if (!settingsManagerRef.current) return () => {};
    
    settingsManagerRef.current.onSettingsChange(callback);
    
    // Return cleanup function
    return () => {
      if (settingsManagerRef.current) {
        settingsManagerRef.current.offSettingsChange(callback);
      }
    };
  }, []);

  const onValidation = useCallback((callback: (result: SettingsValidationResult) => void) => {
    if (!settingsManagerRef.current) return () => {};
    
    settingsManagerRef.current.onValidation(callback);
    
    // Return cleanup function
    return () => {
      if (settingsManagerRef.current) {
        settingsManagerRef.current.offValidation(callback);
      }
    };
  }, []);

  return {
    // Current state
    settings: settings || {} as DistressSettings,
    validation,
    isValid: validation?.isValid ?? true,
    
    // Loading states
    isLoading,
    isSaving,
    
    // Settings operations
    updateSettings,
    resetToDefaults,
    
    // Import/Export operations
    exportSettings,
    exportToFile,
    importSettings,
    importFromFile,
    
    // Backup operations
    getBackupHistory,
    createBackup,
    restoreFromBackup,
    
    // Event handlers
    onSettingsChange,
    onValidation
  };
};