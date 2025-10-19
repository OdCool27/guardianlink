/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressSettings } from '../types';
import { DEFAULT_DISTRESS_SETTINGS, STORAGE_KEYS } from '../config';
import { saveDistressSettings, loadDistressSettings, saveToStorage, loadFromStorage } from '../utils/storage';

/**
 * Settings version for migration support
 */
const SETTINGS_VERSION = '1.0.0';

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
 * Comprehensive settings manager for distress detection
 * Handles persistence, validation, migration, import/export
 */
export class DistressSettingsManager {
  private settings: DistressSettings;
  private changeListeners: ((event: SettingsChangeEvent) => void)[] = [];
  private validationListeners: ((result: SettingsValidationResult) => void)[] = [];

  constructor() {
    this.settings = this.loadSettings();
    this.validateAndNotify();
  }

  /**
   * Get current settings
   */
  getSettings(): DistressSettings {
    return { ...this.settings };
  }

  /**
   * Update settings with validation
   */
  updateSettings(newSettings: DistressSettings): SettingsValidationResult {
    const validation = this.validateSettings(newSettings);
    
    if (validation.isValid) {
      const previousSettings = { ...this.settings };
      const changedFields = this.getChangedFields(previousSettings, newSettings);
      
      this.settings = { ...newSettings };
      this.saveSettings();
      
      // Notify change listeners
      const changeEvent: SettingsChangeEvent = {
        previousSettings,
        newSettings: this.settings,
        changedFields,
        timestamp: new Date()
      };
      
      this.changeListeners.forEach(listener => {
        try {
          listener(changeEvent);
        } catch (error) {
          console.error('Error in settings change listener:', error);
        }
      });
    }
    
    // Notify validation listeners
    this.validationListeners.forEach(listener => {
      try {
        listener(validation);
      } catch (error) {
        console.error('Error in validation listener:', error);
      }
    });
    
    return validation;
  }

  /**
   * Reset settings to defaults
   */
  resetToDefaults(): SettingsValidationResult {
    return this.updateSettings(DEFAULT_DISTRESS_SETTINGS);
  }

  /**
   * Validate settings
   */
  validateSettings(settings: DistressSettings): SettingsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Speech recognition validation
    if (settings.speechRecognition.sensitivity < 0 || settings.speechRecognition.sensitivity > 100) {
      errors.push('Speech recognition sensitivity must be between 0-100');
    }
    if (settings.speechRecognition.sensitivity < 30) {
      warnings.push('Low speech sensitivity may miss distress phrases');
    }
    if (settings.speechRecognition.sensitivity > 90) {
      warnings.push('High speech sensitivity may cause false positives');
    }

    // Audio analysis validation
    if (settings.audioAnalysis.volumeThreshold < 0 || settings.audioAnalysis.volumeThreshold > 120) {
      errors.push('Volume threshold must be between 0-120 dB');
    }
    if (settings.audioAnalysis.volumeThreshold < 70) {
      warnings.push('Low volume threshold may cause false positives');
    }

    // NLP processing validation
    if (settings.nlpProcessing.confidenceThreshold < 0 || settings.nlpProcessing.confidenceThreshold > 100) {
      errors.push('NLP confidence threshold must be between 0-100');
    }
    if (settings.nlpProcessing.confidenceThreshold < 50) {
      warnings.push('Low confidence threshold may increase false positives');
    }
    if (settings.nlpProcessing.customPhrases.length > 50) {
      warnings.push('Too many custom phrases may impact performance');
    }

    // Verification validation
    if (settings.verification.timeoutSeconds < 5 || settings.verification.timeoutSeconds > 30) {
      errors.push('Verification timeout must be between 5-30 seconds');
    }
    if (settings.verification.timeoutSeconds < 8) {
      warnings.push('Short verification timeout may not give enough time to respond');
    }

    // Privacy validation
    if (settings.privacy.dataRetentionDays < 1 || settings.privacy.dataRetentionDays > 365) {
      errors.push('Data retention must be between 1-365 days');
    }
    if (settings.privacy.sendToAPI && settings.nlpProcessing.mode === 'local') {
      warnings.push('API data sending enabled but processing mode is local');
    }

    // Feature consistency validation
    if (settings.enabled && !settings.speechRecognition.enabled && !settings.audioAnalysis.enabled) {
      warnings.push('Distress detection enabled but no detection methods are active');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export settings to JSON
   */
  exportSettings(): DistressSettingsExport {
    return {
      version: SETTINGS_VERSION,
      timestamp: new Date().toISOString(),
      settings: this.getSettings(),
      metadata: {
        appVersion: '1.0.0', // Could be dynamic
        deviceInfo: navigator.userAgent
      }
    };
  }

  /**
   * Import settings from JSON
   */
  importSettings(exportData: DistressSettingsExport): SettingsValidationResult {
    try {
      // Validate export format
      if (!exportData.version || !exportData.settings) {
        return {
          isValid: false,
          errors: ['Invalid settings export format'],
          warnings: []
        };
      }

      // Check version compatibility
      if (exportData.version !== SETTINGS_VERSION) {
        const migratedSettings = this.migrateSettings(exportData.settings, exportData.version);
        return this.updateSettings(migratedSettings);
      }

      return this.updateSettings(exportData.settings);
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to import settings: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Export settings as downloadable file
   */
  exportToFile(): void {
    const exportData = this.exportSettings();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `distress-detection-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Import settings from file
   */
  importFromFile(): Promise<SettingsValidationResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve({
            isValid: false,
            errors: ['No file selected'],
            warnings: []
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const exportData = JSON.parse(e.target?.result as string);
            resolve(this.importSettings(exportData));
          } catch (error) {
            resolve({
              isValid: false,
              errors: [`Failed to parse settings file: ${error.message}`],
              warnings: []
            });
          }
        };
        
        reader.onerror = () => {
          resolve({
            isValid: false,
            errors: ['Failed to read settings file'],
            warnings: []
          });
        };
        
        reader.readAsText(file);
      };
      
      input.click();
    });
  }

  /**
   * Add settings change listener
   */
  onSettingsChange(listener: (event: SettingsChangeEvent) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove settings change listener
   */
  offSettingsChange(listener: (event: SettingsChangeEvent) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Add validation listener
   */
  onValidation(listener: (result: SettingsValidationResult) => void): void {
    this.validationListeners.push(listener);
  }

  /**
   * Remove validation listener
   */
  offValidation(listener: (result: SettingsValidationResult) => void): void {
    const index = this.validationListeners.indexOf(listener);
    if (index > -1) {
      this.validationListeners.splice(index, 1);
    }
  }

  /**
   * Get settings backup history
   */
  getBackupHistory(): DistressSettingsExport[] {
    try {
      const history = loadFromStorage('distress-settings-backup-history') || [];
      return history.slice(-10); // Keep last 10 backups
    } catch (error) {
      console.error('Failed to load backup history:', error);
      return [];
    }
  }

  /**
   * Create settings backup
   */
  createBackup(): void {
    try {
      const backup = this.exportSettings();
      const history = this.getBackupHistory();
      
      history.push(backup);
      
      // Keep only last 10 backups
      const trimmedHistory = history.slice(-10);
      
      saveToStorage('distress-settings-backup-history', trimmedHistory);
    } catch (error) {
      console.error('Failed to create settings backup:', error);
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(backup: DistressSettingsExport): SettingsValidationResult {
    return this.importSettings(backup);
  }

  /**
   * Private methods
   */

  private loadSettings(): DistressSettings {
    try {
      const stored = loadDistressSettings();
      const migrated = this.migrateSettings(stored, this.getStoredVersion());
      return migrated;
    } catch (error) {
      console.error('Failed to load settings, using defaults:', error);
      return DEFAULT_DISTRESS_SETTINGS;
    }
  }

  private saveSettings(): void {
    try {
      saveDistressSettings(this.settings);
      this.saveVersion();
      this.createBackup();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private getStoredVersion(): string {
    return loadFromStorage('distress-settings-version') || '1.0.0';
  }

  private saveVersion(): void {
    saveToStorage('distress-settings-version', SETTINGS_VERSION);
  }

  private migrateSettings(settings: DistressSettings, fromVersion: string): DistressSettings {
    // Future migration logic would go here
    // For now, just merge with defaults to ensure all properties exist
    return {
      ...DEFAULT_DISTRESS_SETTINGS,
      ...settings,
      speechRecognition: {
        ...DEFAULT_DISTRESS_SETTINGS.speechRecognition,
        ...settings.speechRecognition
      },
      audioAnalysis: {
        ...DEFAULT_DISTRESS_SETTINGS.audioAnalysis,
        ...settings.audioAnalysis
      },
      nlpProcessing: {
        ...DEFAULT_DISTRESS_SETTINGS.nlpProcessing,
        ...settings.nlpProcessing
      },
      verification: {
        ...DEFAULT_DISTRESS_SETTINGS.verification,
        ...settings.verification
      },
      privacy: {
        ...DEFAULT_DISTRESS_SETTINGS.privacy,
        ...settings.privacy
      }
    };
  }

  private getChangedFields(oldSettings: DistressSettings, newSettings: DistressSettings): string[] {
    const changes: string[] = [];
    
    // Compare top-level properties
    if (oldSettings.enabled !== newSettings.enabled) changes.push('enabled');
    
    // Compare nested objects
    this.compareObjects(oldSettings.speechRecognition, newSettings.speechRecognition, 'speechRecognition', changes);
    this.compareObjects(oldSettings.audioAnalysis, newSettings.audioAnalysis, 'audioAnalysis', changes);
    this.compareObjects(oldSettings.nlpProcessing, newSettings.nlpProcessing, 'nlpProcessing', changes);
    this.compareObjects(oldSettings.verification, newSettings.verification, 'verification', changes);
    this.compareObjects(oldSettings.privacy, newSettings.privacy, 'privacy', changes);
    
    return changes;
  }

  private compareObjects(oldObj: any, newObj: any, prefix: string, changes: string[]): void {
    for (const key in newObj) {
      if (Array.isArray(newObj[key])) {
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
          changes.push(`${prefix}.${key}`);
        }
      } else if (oldObj[key] !== newObj[key]) {
        changes.push(`${prefix}.${key}`);
      }
    }
  }

  private validateAndNotify(): void {
    const validation = this.validateSettings(this.settings);
    this.validationListeners.forEach(listener => {
      try {
        listener(validation);
      } catch (error) {
        console.error('Error in validation listener:', error);
      }
    });
  }
}