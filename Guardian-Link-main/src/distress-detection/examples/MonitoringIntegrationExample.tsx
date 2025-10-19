/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MonitoringDashboard } from '../components/MonitoringDashboard';
import { MonitoringStatusDisplay } from '../components/MonitoringStatusDisplay';
import { MonitoringControls } from '../components/MonitoringControls';
import { DistressDetectionManager } from '../services/DistressDetectionManager';
import { useDistressSettings } from '../hooks/useDistressSettings';

/**
 * Example integration of monitoring components into the main GuardianLink app
 * Shows different ways to integrate the monitoring status and controls
 * Requirements: 7.4, 7.5
 */

// Example 1: Full Dashboard Integration
export const FullDashboardExample: React.FC = () => {
  const [manager] = useState(() => new DistressDetectionManager());
  const { settings, updateSettings } = useDistressSettings();

  return (
    <div className="page-content">
      <div className="header">
        <h1>Distress Detection</h1>
      </div>
      
      <MonitoringDashboard
        manager={manager}
        settings={settings}
        onSettingsChange={updateSettings}
        variant="full"
      />
    </div>
  );
};

// Example 2: Compact Dashboard for Home Screen
export const CompactDashboardExample: React.FC = () => {
  const [manager] = useState(() => new DistressDetectionManager());
  const { settings, updateSettings } = useDistressSettings();

  return (
    <div className="home-monitoring-section">
      <h3>AI Protection Status</h3>
      <MonitoringDashboard
        manager={manager}
        settings={settings}
        onSettingsChange={updateSettings}
        variant="compact"
      />
    </div>
  );
};

// Example 3: Persistent Status Indicator
export const PersistentStatusExample: React.FC = () => {
  const [manager] = useState(() => new DistressDetectionManager());

  return (
    <MonitoringStatusDisplay
      manager={manager}
      className="persistent"
      showDetailed={false}
    />
  );
};

// Example 4: Settings Page Integration
export const SettingsPageExample: React.FC = () => {
  const [manager] = useState(() => new DistressDetectionManager());
  const { settings, updateSettings } = useDistressSettings();

  return (
    <div className="settings-section">
      <h2>Distress Detection Settings</h2>
      <p>Configure and monitor your AI-powered safety features.</p>
      
      {/* Status Display */}
      <MonitoringStatusDisplay
        manager={manager}
        showDetailed={true}
      />
      
      {/* Controls */}
      <MonitoringControls
        manager={manager}
        settings={settings}
        onSettingsChange={updateSettings}
        showAdvanced={true}
      />
    </div>
  );
};

// Example 5: Integration with Main App Navigation
export const MainAppIntegrationExample: React.FC = () => {
  const [manager] = useState(() => new DistressDetectionManager());
  const { settings, updateSettings } = useDistressSettings();
  const [activeTab, setActiveTab] = useState('home');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="home-screen">
            {/* Existing home content */}
            <div className="sos-panel">
              {/* Existing SOS button */}
            </div>
            
            {/* Add monitoring status */}
            <div className="monitoring-section">
              <MonitoringStatusDisplay
                manager={manager}
                showDetailed={false}
                className="compact"
              />
            </div>
          </div>
        );
        
      case 'settings':
        return (
          <div className="settings-screen">
            {/* Existing settings */}
            
            {/* Add distress detection section */}
            <div className="settings-section">
              <h2>AI Distress Detection</h2>
              <MonitoringDashboard
                manager={manager}
                settings={settings}
                onSettingsChange={updateSettings}
                variant="full"
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="app">
      {/* Persistent status indicator */}
      <MonitoringStatusDisplay
        manager={manager}
        className="persistent"
        showDetailed={false}
      />
      
      {/* Main content */}
      <div className="main-content">
        {renderTabContent()}
      </div>
      
      {/* Navigation */}
      <nav className="bottom-nav">
        <button 
          className={activeTab === 'home' ? 'active' : ''}
          onClick={() => setActiveTab('home')}
        >
          Home
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>
    </div>
  );
};

// Example 6: Quick Toggle Component for Header
export const QuickToggleExample: React.FC = () => {
  const [manager] = useState(() => new DistressDetectionManager());
  const { settings, updateSettings } = useDistressSettings();
  const [state, setState] = useState(manager.getState());

  useEffect(() => {
    const handleStateChange = (newState: any) => setState(newState);
    manager.onStateChange(handleStateChange);
    return () => manager.offStateChange(handleStateChange);
  }, [manager]);

  const handleQuickToggle = async () => {
    if (state.status === 'active') {
      manager.stopMonitoring();
    } else {
      await manager.startMonitoring();
    }
  };

  return (
    <div className="header-controls">
      <button 
        className={`quick-toggle ${state.status === 'active' ? 'active' : ''}`}
        onClick={handleQuickToggle}
        title="Toggle AI Protection"
      >
        <span className="toggle-icon">
          {state.status === 'active' ? '🛡️' : '🔒'}
        </span>
        <span className="toggle-text">
          AI Protection {state.status === 'active' ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
};

// Example CSS for integration
export const integrationStyles = `
/* Home screen monitoring section */
.home-monitoring-section {
  margin: 16px 0;
  padding: 16px;
  background: var(--surface-secondary);
  border-radius: 12px;
}

.home-monitoring-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Settings integration */
.settings-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-secondary);
}

.settings-section:last-child {
  border-bottom: none;
}

/* Quick toggle in header */
.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quick-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-toggle:hover {
  background: var(--surface-tertiary);
  border-color: var(--accent-primary);
}

.quick-toggle.active {
  background: var(--brand-green);
  border-color: var(--brand-green);
  color: white;
}

.toggle-icon {
  font-size: 14px;
}

.toggle-text {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Persistent status positioning */
.monitoring-status-display.persistent {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .monitoring-status-display.persistent {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
  }
  
  .quick-toggle {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  .toggle-icon {
    font-size: 12px;
  }
}
`;

export default {
  FullDashboardExample,
  CompactDashboardExample,
  PersistentStatusExample,
  SettingsPageExample,
  MainAppIntegrationExample,
  QuickToggleExample,
  integrationStyles
};