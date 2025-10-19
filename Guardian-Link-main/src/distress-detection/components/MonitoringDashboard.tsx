/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MonitoringStatusDisplay } from './MonitoringStatusDisplay';
import { MonitoringControls } from './MonitoringControls';
import { DistressDetectionManager } from '../services/DistressDetectionManager';
import { DistressSettings } from '../types';
import './MonitoringStatusDisplay.css';
import './MonitoringControls.css';
import './MonitoringDashboard.css';

interface MonitoringDashboardProps {
  manager: DistressDetectionManager;
  settings: DistressSettings;
  onSettingsChange: (settings: DistressSettings) => void;
  variant?: 'full' | 'compact' | 'status-only' | 'controls-only';
  className?: string;
}

/**
 * Complete monitoring dashboard combining status display and controls
 * Provides comprehensive monitoring interface for distress detection
 * Requirements: 7.4, 7.5
 */
export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  manager,
  settings,
  onSettingsChange,
  variant = 'full',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const renderStatusOnly = () => (
    <MonitoringStatusDisplay
      manager={manager}
      showDetailed={isExpanded}
      className={variant === 'compact' ? 'compact' : ''}
    />
  );

  const renderControlsOnly = () => (
    <MonitoringControls
      manager={manager}
      settings={settings}
      onSettingsChange={onSettingsChange}
      showAdvanced={showAdvanced}
      className={variant === 'compact' ? 'compact' : ''}
    />
  );

  const renderFullDashboard = () => (
    <div className="monitoring-dashboard-content">
      {/* Header with expand/collapse controls */}
      <div className="dashboard-header">
        <h2>Distress Detection Monitoring</h2>
        <div className="dashboard-controls">
          <button
            className="dashboard-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Toggle advanced view"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 4.5a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4.5z" fill="currentColor"/>
            </svg>
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
          <button
            className="dashboard-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Toggle detailed view"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16"
              className={isExpanded ? 'rotated' : ''}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            Details
          </button>
        </div>
      </div>

      {/* Status Display */}
      <MonitoringStatusDisplay
        manager={manager}
        showDetailed={isExpanded}
        className="dashboard-status"
      />

      {/* Controls */}
      <MonitoringControls
        manager={manager}
        settings={settings}
        onSettingsChange={onSettingsChange}
        showAdvanced={showAdvanced}
        className="dashboard-controls-panel"
      />
    </div>
  );

  const renderCompactDashboard = () => (
    <div className="monitoring-dashboard-content compact">
      <div className="compact-layout">
        <MonitoringStatusDisplay
          manager={manager}
          showDetailed={false}
          className="compact"
        />
        <div className="compact-controls">
          <MonitoringControls
            manager={manager}
            settings={settings}
            onSettingsChange={onSettingsChange}
            showAdvanced={false}
            className="compact"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`monitoring-dashboard ${variant} ${className}`}>
      {variant === 'status-only' && renderStatusOnly()}
      {variant === 'controls-only' && renderControlsOnly()}
      {variant === 'compact' && renderCompactDashboard()}
      {variant === 'full' && renderFullDashboard()}
    </div>
  );
};

export default MonitoringDashboard;