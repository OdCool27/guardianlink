# Distress Detection Settings System

## Overview

The distress detection settings system provides comprehensive configuration management for all aspects of the AI-powered distress detection feature. It includes a user-friendly interface, robust validation, persistence, and import/export capabilities.

## Components

### 1. DistressDetectionSettingsPanel

The main settings panel component that provides a clean, intuitive interface for configuring distress detection.

**Features:**
- Master enable/disable toggle
- Detection method toggles (Speech Recognition, Audio Analysis)
- Sensitivity sliders with real-time feedback
- Processing mode selection (Local vs Cloud AI)
- Validation with error/warning display
- Quick access to advanced settings

**Usage:**
```tsx
import { DistressDetectionSettingsPanel } from './src/distress-detection/components';

<DistressDetectionSettingsPanel
  settings={settings}
  onSettingsChange={handleSettingsChange}
/>
```

### 2. DistressDetectionSettingsModal

A comprehensive modal dialog for detailed configuration of all distress detection parameters.

**Features:**
- Tabbed interface (Speech, Audio, AI Processing, Verification, Privacy)
- Advanced configuration options
- Custom phrase management
- Real-time validation
- Settings reset functionality

**Usage:**
```tsx
import { DistressDetectionSettingsModal } from './src/distress-detection/components';

<DistressDetectionSettingsModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  settings={settings}
  onSettingsChange={handleSettingsChange}
/>
```

### 3. SettingsImportExport

Component for backing up, restoring, and sharing settings configurations.

**Features:**
- Export settings to downloadable JSON file
- Import settings from file
- Automatic backup creation
- Backup history management (last 10 backups)
- Settings validation on import

**Usage:**
```tsx
import { SettingsImportExport } from './src/distress-detection/components';

<SettingsImportExport />
```

## Services

### DistressSettingsManager

Core service class that handles all settings operations including persistence, validation, and migration.

**Key Methods:**
- `getSettings()` - Get current settings
- `updateSettings(settings)` - Update and validate settings
- `resetToDefaults()` - Reset to default configuration
- `exportSettings()` - Export settings to JSON format
- `importSettings(data)` - Import settings from JSON
- `validateSettings(settings)` - Validate settings configuration

**Features:**
- Automatic persistence to localStorage
- Settings validation with detailed error reporting
- Version migration support
- Event-driven architecture with change listeners
- Automatic backup creation

## Hooks

### useDistressSettings

React hook that provides easy access to settings management functionality.

**Returns:**
- `settings` - Current settings object
- `validation` - Current validation state
- `isValid` - Boolean indicating if settings are valid
- `isLoading` - Loading state
- `isSaving` - Saving state
- `updateSettings()` - Function to update settings
- `resetToDefaults()` - Function to reset settings
- `exportToFile()` - Function to export settings to file
- `importFromFile()` - Function to import settings from file

**Usage:**
```tsx
import { useDistressSettings } from './src/distress-detection/hooks';

const MyComponent = () => {
  const {
    settings,
    validation,
    isValid,
    updateSettings,
    exportToFile
  } = useDistressSettings();

  // Use settings in your component
};
```

## Settings Structure

The settings are organized into logical groups:

### Main Settings
- `enabled` - Master enable/disable flag

### Speech Recognition
- `enabled` - Enable speech recognition
- `sensitivity` - Detection sensitivity (0-100)
- `language` - Recognition language
- `continuousMode` - Continuous listening mode

### Audio Analysis
- `enabled` - Enable audio analysis
- `volumeThreshold` - Volume threshold in dB
- `spikeDetection` - Enable volume spike detection
- `frequencyAnalysis` - Enable frequency pattern analysis

### NLP Processing
- `mode` - Processing mode ('local' or 'api')
- `confidenceThreshold` - Confidence threshold (0-100)
- `customPhrases` - Array of custom distress phrases

### Verification
- `timeoutSeconds` - Verification timeout (5-30 seconds)
- `showCountdown` - Show countdown timer
- `requireExplicitConfirmation` - Require explicit user confirmation

### Privacy
- `storeAudioLocally` - Store audio data locally
- `sendToAPI` - Allow sending data to external APIs
- `dataRetentionDays` - Data retention period (1-365 days)

## Validation Rules

The system includes comprehensive validation:

### Speech Recognition
- Sensitivity must be 0-100
- Warnings for very low (<30) or high (>90) sensitivity

### Audio Analysis
- Volume threshold must be 0-120 dB
- Warning for low threshold (<70 dB)

### NLP Processing
- Confidence threshold must be 0-100
- Warning for low confidence (<50)
- Warning for too many custom phrases (>50)

### Verification
- Timeout must be 5-30 seconds
- Warning for short timeout (<8 seconds)

### Privacy
- Data retention must be 1-365 days
- Warning for inconsistent API/processing settings

### Feature Consistency
- Warning if detection is enabled but no methods are active

## Persistence

Settings are automatically persisted to localStorage with the following features:

- **Automatic Saving**: Settings are saved immediately when changed
- **Version Migration**: Supports migrating settings between versions
- **Backup System**: Automatic backups created on each save
- **Error Recovery**: Falls back to defaults if settings are corrupted

## Import/Export Format

Settings are exported in a structured JSON format:

```json
{
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "settings": {
    "enabled": true,
    "speechRecognition": { ... },
    "audioAnalysis": { ... },
    "nlpProcessing": { ... },
    "verification": { ... },
    "privacy": { ... }
  },
  "metadata": {
    "appVersion": "1.0.0",
    "deviceInfo": "Mozilla/5.0..."
  }
}
```

## Integration Examples

### Basic Integration
```tsx
import { DistressDetectionSettingsPanel, useDistressSettings } from './src/distress-detection';

const SettingsPage = () => {
  const { settings, updateSettings } = useDistressSettings();

  return (
    <div>
      <h2>Distress Detection</h2>
      <DistressDetectionSettingsPanel
        settings={settings}
        onSettingsChange={updateSettings}
      />
    </div>
  );
};
```

### Advanced Integration with Import/Export
```tsx
import { 
  DistressDetectionSettingsPanel, 
  SettingsImportExport,
  useDistressSettings 
} from './src/distress-detection';

const AdvancedSettingsPage = () => {
  const { 
    settings, 
    validation, 
    isValid, 
    updateSettings 
  } = useDistressSettings();

  return (
    <div>
      <h2>Distress Detection Settings</h2>
      
      {!isValid && (
        <div className="validation-errors">
          {validation?.errors.map(error => (
            <div key={error} className="error">{error}</div>
          ))}
        </div>
      )}
      
      <DistressDetectionSettingsPanel
        settings={settings}
        onSettingsChange={updateSettings}
      />
      
      <SettingsImportExport />
    </div>
  );
};
```

## Best Practices

1. **Always use the hook**: Use `useDistressSettings` for state management
2. **Handle validation**: Check `isValid` and display validation errors
3. **Show loading states**: Use `isLoading` and `isSaving` for better UX
4. **Provide feedback**: Show success/error messages for user actions
5. **Enable backups**: Encourage users to create backups before major changes
6. **Validate imports**: Always validate imported settings before applying

## Error Handling

The system includes comprehensive error handling:

- **Validation Errors**: Real-time validation with detailed error messages
- **Storage Errors**: Graceful fallback to defaults if localStorage fails
- **Import Errors**: Detailed error messages for invalid import files
- **Network Errors**: Proper handling of API failures during import/export

## Performance Considerations

- **Lazy Loading**: Modal components are loaded only when needed
- **Debounced Updates**: Settings updates are debounced to prevent excessive saves
- **Efficient Validation**: Validation is optimized to run quickly
- **Memory Management**: Event listeners are properly cleaned up
- **Storage Optimization**: Only essential data is stored, with automatic cleanup

## Security Considerations

- **Input Validation**: All user inputs are validated before processing
- **Safe Parsing**: JSON parsing includes error handling
- **Privacy Protection**: Sensitive data is handled according to privacy settings
- **Access Control**: Settings are scoped to the current user/session