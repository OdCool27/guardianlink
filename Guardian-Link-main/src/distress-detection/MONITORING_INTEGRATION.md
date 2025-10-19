# Monitoring Status and Controls Integration Guide

This document explains how to integrate the AI distress detection monitoring status display and controls into the GuardianLink application.

## Overview

The monitoring system provides three main components:

1. **MonitoringStatusDisplay** - Shows real-time status, connection indicators, and detection activity
2. **MonitoringControls** - Provides quick enable/disable toggles, pause/resume, and sensitivity controls  
3. **MonitoringDashboard** - Combines both components into a comprehensive interface

## Components

### MonitoringStatusDisplay

Displays the current status of distress detection monitoring with real-time updates.

**Features:**
- Real-time status indicators (Active, Initializing, Error, Inactive)
- Connection status for speech recognition and audio analysis
- Detection activity visualization with recent events
- Performance metrics and statistics
- Expandable detailed view
- Error message display

**Usage:**
```tsx
import { MonitoringStatusDisplay } from '../components/MonitoringStatusDisplay';

<MonitoringStatusDisplay
  manager={distressDetectionManager}
  showDetailed={true}
  className="persistent" // Optional: for fixed positioning
/>
```

### MonitoringControls

Provides interactive controls for managing distress detection.

**Features:**
- Start/Stop monitoring toggle
- Pause/Resume functionality
- Individual feature toggles (speech recognition, audio analysis)
- Sensitivity adjustment sliders
- Performance feedback display
- Error handling with retry options

**Usage:**
```tsx
import { MonitoringControls } from '../components/MonitoringControls';

<MonitoringControls
  manager={distressDetectionManager}
  settings={distressSettings}
  onSettingsChange={handleSettingsChange}
  showAdvanced={true}
/>
```

### MonitoringDashboard

Combines status display and controls into a unified interface.

**Variants:**
- `full` - Complete dashboard with both status and controls
- `compact` - Condensed layout for smaller spaces
- `status-only` - Only the status display
- `controls-only` - Only the controls

**Usage:**
```tsx
import { MonitoringDashboard } from '../components/MonitoringDashboard';

<MonitoringDashboard
  manager={distressDetectionManager}
  settings={distressSettings}
  onSettingsChange={handleSettingsChange}
  variant="full"
/>
```

## Integration Examples

### 1. Home Screen Integration

Add a compact monitoring status to the home screen:

```tsx
// In HomeScreen component
import { MonitoringStatusDisplay } from '../distress-detection/components';

const HomeScreen = () => {
  return (
    <div className="home-screen">
      {/* Existing SOS panel */}
      <div className="sos-panel">
        {/* SOS button */}
      </div>
      
      {/* Add monitoring status */}
      <div className="monitoring-section">
        <h3>AI Protection Status</h3>
        <MonitoringStatusDisplay
          manager={distressDetectionManager}
          showDetailed={false}
          className="compact"
        />
      </div>
    </div>
  );
};
```

### 2. Settings Page Integration

Add full monitoring dashboard to settings:

```tsx
// In SettingsScreen component
import { MonitoringDashboard } from '../distress-detection/components';

const SettingsScreen = () => {
  return (
    <div className="settings-screen">
      {/* Existing settings sections */}
      
      {/* Add distress detection section */}
      <div className="settings-section">
        <h2>AI Distress Detection</h2>
        <p>Configure and monitor your AI-powered safety features.</p>
        
        <MonitoringDashboard
          manager={distressDetectionManager}
          settings={distressSettings}
          onSettingsChange={handleSettingsChange}
          variant="full"
        />
      </div>
    </div>
  );
};
```

### 3. Persistent Status Indicator

Add a persistent status indicator that appears on all screens:

```tsx
// In main App component
import { MonitoringStatusDisplay } from '../distress-detection/components';

const App = () => {
  return (
    <div className="app">
      {/* Persistent monitoring status */}
      <MonitoringStatusDisplay
        manager={distressDetectionManager}
        className="persistent"
        showDetailed={false}
      />
      
      {/* Main app content */}
      <div className="main-content">
        {/* Existing app content */}
      </div>
    </div>
  );
};
```

### 4. Quick Toggle in Header

Add a quick toggle button in the app header:

```tsx
// Quick toggle component
const QuickToggle = ({ manager }) => {
  const [state, setState] = useState(manager.getState());

  useEffect(() => {
    const handleStateChange = (newState) => setState(newState);
    manager.onStateChange(handleStateChange);
    return () => manager.offStateChange(handleStateChange);
  }, [manager]);

  const handleToggle = async () => {
    if (state.status === 'active') {
      manager.stopMonitoring();
    } else {
      await manager.startMonitoring();
    }
  };

  return (
    <button 
      className={`quick-toggle ${state.status === 'active' ? 'active' : ''}`}
      onClick={handleToggle}
    >
      <span className="toggle-icon">
        {state.status === 'active' ? '🛡️' : '🔒'}
      </span>
      AI Protection {state.status === 'active' ? 'ON' : 'OFF'}
    </button>
  );
};
```

## CSS Integration

The components come with their own CSS files that should be imported:

```tsx
import './MonitoringStatusDisplay.css';
import './MonitoringControls.css';
import './MonitoringDashboard.css';
```

### Custom Styling

You can customize the appearance using CSS variables:

```css
:root {
  --monitoring-accent: #3b82f6;
  --monitoring-success: #10b981;
  --monitoring-warning: #f59e0b;
  --monitoring-danger: #ef4444;
}

/* Custom persistent positioning */
.monitoring-status-display.persistent {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

/* Custom compact layout */
.monitoring-dashboard.compact {
  max-width: 500px;
  margin: 0 auto;
}
```

## State Management

The components require a `DistressDetectionManager` instance and settings:

```tsx
import { DistressDetectionManager } from '../distress-detection/services';
import { useDistressSettings } from '../distress-detection/hooks';

const MyComponent = () => {
  const [manager] = useState(() => new DistressDetectionManager());
  const { settings, updateSettings } = useDistressSettings();

  return (
    <MonitoringDashboard
      manager={manager}
      settings={settings}
      onSettingsChange={updateSettings}
    />
  );
};
```

## Responsive Design

All components are responsive and adapt to different screen sizes:

- **Desktop**: Full layout with all features visible
- **Tablet**: Compact layout with collapsible sections
- **Mobile**: Stacked layout with simplified controls

## Accessibility

The components include accessibility features:

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus indicators

## Performance Considerations

- Components use React.memo for optimization
- State updates are debounced to prevent excessive re-renders
- Performance metrics are updated at reasonable intervals (5 seconds)
- Cleanup functions prevent memory leaks

## Requirements Fulfilled

This implementation addresses the following requirements:

**Requirement 7.4**: System Configuration and Controls
- ✅ Settings interface for enabling/disabling audio monitoring
- ✅ Sensitivity level configuration
- ✅ Processing mode selection (local vs API)

**Requirement 7.5**: Monitoring Status Display
- ✅ Current monitoring status clearly displayed
- ✅ Persistent indicator when monitoring is enabled
- ✅ Real-time status updates and connection indicators
- ✅ Detection activity visualization
- ✅ Performance feedback and metrics

## Next Steps

1. Integrate components into main app navigation
2. Add user preferences for monitoring display options
3. Implement notification system for status changes
4. Add analytics tracking for monitoring usage
5. Create user onboarding flow for monitoring features