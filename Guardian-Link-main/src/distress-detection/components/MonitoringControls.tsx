/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DistressDetectionState, DistressSettings } from '../types';
import { DistressDetectionManager } from '../services/DistressDetectionManager';

interface MonitoringControlsProps {
  manager: DistressDetectionManager;
  settings: DistressSettings;
  onSettingsChange: (settings: DistressSettings) => void;
  className?: string;
  showAdvanced?: boolean;
}

interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  batteryLevel?: number;
  processingLatency: number;
}

/**
 * Monitoring controls and feedback component
 * Provides quick enable/disable toggles, pause/resume, sensitivity controls
 * Requirements: 7.4, 7.5
 */
export const MonitoringControls: React.FC<MonitoringControlsProps> = ({
  manager,
  settings,
  onSettingsChange,
  className = '',
  showAdvanced = false
}) => {
  const [state, setState] = useState<DistressDetectionState>({
    status: 'inactive',
    isListening: false,
    isAnalyzing: false
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    processingLatency: 0
  });

  // Subscribe to state changes
  useEffect(() => {
    const handleStateChange = (newState: DistressDetectionState) => {
      setState(newState);
    };

    manager.onStateChange(handleStateChange);
    setState(manager.getState());

    return () => {
      manager.offStateChange(handleStateChange);
    };
  }, [manager]);

  // Monitor performance metrics
  useEffect(() => {
    const updatePerformanceMetrics = () => {
      // Simulate performance monitoring
      // In a real implementation, this would gather actual metrics
      setPerformanceMetrics({
        cpuUsage: Math.random() * 30 + 10, // 10-40%
        memoryUsage: Math.random() * 50 + 20, // 20-70MB
        processingLatency: Math.random() * 100 + 50, // 50-150ms
        batteryLevel: 'getBattery' in navigator ? undefined : Math.random() * 100
      });
    };

    const interval = setInterval(updatePerformanceMetrics, 5000);
    updatePerformanceMetrics();

    return () => clearInterval(interval);
  }, []);

  // Get battery level if available
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setPerformanceMetrics(prev => ({
            ...prev,
            batteryLevel: battery.level * 100
          }));
        };
        
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        
        return () => battery.removeEventListener('levelchange', updateBattery);
      });
    }
  }, []);

  const handleToggleMonitoring = async () => {
    setIsLoading(true);
    try {
      if (state.status === 'active') {
        manager.stopMonitoring();
      } else {
        await manager.startMonitoring();
      }
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      // Resume monitoring
      manager.startMonitoring();
      setIsPaused(false);
    } else {
      // Pause monitoring
      manager.stopMonitoring();
      setIsPaused(true);
    }
  };

  const handleSensitivityChange = (type: 'speech' | 'audio', value: number) => {
    const newSettings = { ...settings };
    
    if (type === 'speech') {
      newSettings.speechRecognition.sensitivity = value;
    } else {
      newSettings.audioAnalysis.volumeThreshold = value;
    }
    
    onSettingsChange(newSettings);
    manager.updateSettings(newSettings);
  };

  const handleFeatureToggle = (feature: 'speech' | 'audio', enabled: boolean) => {
    const newSettings = { ...settings };
    
    if (feature === 'speech') {
      newSettings.speechRecognition.enabled = enabled;
    } else {
      newSettings.audioAnalysis.enabled = enabled;
    }
    
    onSettingsChange(newSettings);
    manager.updateSettings(newSettings);
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'active':
        return '#10b981'; // green
      case 'initializing':
        return '#f59e0b'; // yellow
      case 'error':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getPerformanceStatus = () => {
    const { cpuUsage, memoryUsage, processingLatency } = performanceMetrics;
    
    if (cpuUsage > 80 || memoryUsage > 100 || processingLatency > 200) {
      return { status: 'poor', color: '#ef4444', text: 'Performance Issues' };
    } else if (cpuUsage > 50 || memoryUsage > 70 || processingLatency > 150) {
      return { status: 'fair', color: '#f59e0b', text: 'Moderate Load' };
    } else {
      return { status: 'good', color: '#10b981', text: 'Optimal' };
    }
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <div className={`monitoring-controls ${className}`}>
      {/* Main Toggle Control */}
      <div className="main-control">
        <div className="control-header">
          <h3>Distress Detection</h3>
          <div className="status-badge" style={{ backgroundColor: getStatusColor() }}>
            {state.status}
          </div>
        </div>
        
        <div className="toggle-controls">
          <button
            className={`toggle-btn primary ${state.status === 'active' ? 'active' : ''}`}
            onClick={handleToggleMonitoring}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="spinner-small"></div>
            ) : (
              <>
                <span className="toggle-icon">
                  {state.status === 'active' ? '⏹️' : '▶️'}
                </span>
                {state.status === 'active' ? 'Stop' : 'Start'} Monitoring
              </>
            )}
          </button>

          {state.status === 'active' && (
            <button
              className={`toggle-btn secondary ${isPaused ? 'paused' : ''}`}
              onClick={handlePauseResume}
            >
              <span className="toggle-icon">
                {isPaused ? '▶️' : '⏸️'}
              </span>
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
        </div>
      </div>

      {/* Feature Controls */}
      <div className="feature-controls">
        <h4>Detection Features</h4>
        
        <div className="feature-item">
          <div className="feature-header">
            <label className="feature-label">
              <input
                type="checkbox"
                checked={settings.speechRecognition.enabled}
                onChange={(e) => handleFeatureToggle('speech', e.target.checked)}
              />
              <span className="feature-icon">🎤</span>
              Speech Recognition
            </label>
            <span className={`connection-indicator ${state.isListening ? 'active' : 'inactive'}`}>
              {state.isListening ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {settings.speechRecognition.enabled && (
            <div className="sensitivity-control">
              <label>Sensitivity: {settings.speechRecognition.sensitivity}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.speechRecognition.sensitivity}
                onChange={(e) => handleSensitivityChange('speech', parseInt(e.target.value))}
                className="sensitivity-slider"
              />
            </div>
          )}
        </div>

        <div className="feature-item">
          <div className="feature-header">
            <label className="feature-label">
              <input
                type="checkbox"
                checked={settings.audioAnalysis.enabled}
                onChange={(e) => handleFeatureToggle('audio', e.target.checked)}
              />
              <span className="feature-icon">🔊</span>
              Audio Analysis
            </label>
            <span className={`connection-indicator ${state.isAnalyzing ? 'active' : 'inactive'}`}>
              {state.isAnalyzing ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {settings.audioAnalysis.enabled && (
            <div className="sensitivity-control">
              <label>Volume Threshold: {settings.audioAnalysis.volumeThreshold}dB</label>
              <input
                type="range"
                min="60"
                max="120"
                value={settings.audioAnalysis.volumeThreshold}
                onChange={(e) => handleSensitivityChange('audio', parseInt(e.target.value))}
                className="sensitivity-slider"
              />
            </div>
          )}
        </div>
      </div>

      {/* Performance Feedback */}
      <div className="performance-feedback">
        <h4>Performance</h4>
        
        <div className="performance-status">
          <div className="performance-indicator" style={{ backgroundColor: performanceStatus.color }}>
            {performanceStatus.text}
          </div>
        </div>

        {showAdvanced && (
          <div className="performance-metrics">
            <div className="metric-row">
              <span className="metric-label">CPU Usage:</span>
              <span className="metric-value">{performanceMetrics.cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Memory:</span>
              <span className="metric-value">{performanceMetrics.memoryUsage.toFixed(1)}MB</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Latency:</span>
              <span className="metric-value">{performanceMetrics.processingLatency.toFixed(0)}ms</span>
            </div>
            {performanceMetrics.batteryLevel !== undefined && (
              <div className="metric-row">
                <span className="metric-label">Battery:</span>
                <span className="metric-value">{performanceMetrics.batteryLevel.toFixed(0)}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {state.status === 'error' && state.errorMessage && (
        <div className="error-feedback">
          <div className="error-header">
            <span className="error-icon">⚠️</span>
            <span className="error-title">Error</span>
          </div>
          <p className="error-message">{state.errorMessage}</p>
          <button 
            className="retry-btn"
            onClick={handleToggleMonitoring}
            disabled={isLoading}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default MonitoringControls;