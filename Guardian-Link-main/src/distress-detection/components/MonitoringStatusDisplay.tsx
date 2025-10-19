/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DistressDetectionState, DistressEvent } from '../types';
import { DistressDetectionManager } from '../services/DistressDetectionManager';

interface MonitoringStatusDisplayProps {
  manager: DistressDetectionManager;
  className?: string;
  showDetailed?: boolean;
}

interface DetectionMetrics {
  totalDetections: number;
  speechDetections: number;
  audioDetections: number;
  falsePositives: number;
  averageConfidence: number;
  lastDetectionTime?: Date;
}

/**
 * Persistent monitoring status display component
 * Shows real-time status, connection indicators, and detection activity
 * Requirements: 7.4, 7.5
 */
export const MonitoringStatusDisplay: React.FC<MonitoringStatusDisplayProps> = ({
  manager,
  className = '',
  showDetailed = false
}) => {
  const [state, setState] = useState<DistressDetectionState>({
    status: 'inactive',
    isListening: false,
    isAnalyzing: false
  });
  
  const [metrics, setMetrics] = useState<DetectionMetrics>({
    totalDetections: 0,
    speechDetections: 0,
    audioDetections: 0,
    falsePositives: 0,
    averageConfidence: 0
  });

  const [recentEvents, setRecentEvents] = useState<DistressEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Subscribe to state changes
  useEffect(() => {
    const handleStateChange = (newState: DistressDetectionState) => {
      setState(newState);
    };

    manager.onStateChange(handleStateChange);

    // Initial state
    setState(manager.getState());

    return () => {
      manager.offStateChange(handleStateChange);
    };
  }, [manager]);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      try {
        const detectionMetrics = manager.getDetectionMetrics();
        const events = manager.getRecentEvents(5);
        
        setMetrics(detectionMetrics);
        setRecentEvents(events);
      } catch (error) {
        console.error('Failed to update monitoring metrics:', error);
      }
    };

    // Update immediately
    updateMetrics();

    // Update every 5 seconds when active
    const interval = setInterval(() => {
      if (state.status === 'active') {
        updateMetrics();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [manager, state.status]);

  const getStatusIcon = () => {
    switch (state.status) {
      case 'active':
        return '🟢';
      case 'initializing':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚫';
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case 'active':
        return 'Active';
      case 'initializing':
        return 'Starting...';
      case 'error':
        return 'Error';
      default:
        return 'Inactive';
    }
  };

  const getConnectionStatus = () => {
    const connections = [];
    
    if (state.isListening) {
      connections.push('🎤 Speech');
    }
    
    if (state.isAnalyzing) {
      connections.push('🔊 Audio');
    }

    return connections.length > 0 ? connections.join(' • ') : 'No connections';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence)}%`;
  };

  return (
    <div className={`monitoring-status-display ${className}`}>
      {/* Compact Status Indicator */}
      <div 
        className={`status-indicator ${state.status} ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="status-main">
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{getStatusText()}</span>
          {state.status === 'active' && (
            <div className="activity-pulse"></div>
          )}
        </div>
        
        {showDetailed && (
          <button 
            className="expand-toggle"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              className={isExpanded ? 'rotated' : ''}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>
        )}
      </div>

      {/* Connection Status */}
      {state.status === 'active' && (
        <div className="connection-status">
          <span className="connection-text">{getConnectionStatus()}</span>
        </div>
      )}

      {/* Error Message */}
      {state.status === 'error' && state.errorMessage && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{state.errorMessage}</span>
        </div>
      )}

      {/* Detailed View */}
      {showDetailed && isExpanded && (
        <div className="detailed-status">
          {/* Detection Statistics */}
          <div className="metrics-section">
            <h4>Detection Activity</h4>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Total Detections</span>
                <span className="metric-value">{metrics.totalDetections}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Speech</span>
                <span className="metric-value">{metrics.speechDetections}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Audio</span>
                <span className="metric-value">{metrics.audioDetections}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Avg Confidence</span>
                <span className="metric-value">
                  {formatConfidence(metrics.averageConfidence)}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {recentEvents.length > 0 && (
            <div className="activity-section">
              <h4>Recent Activity</h4>
              <div className="activity-list">
                {recentEvents.map((event) => (
                  <div key={event.id} className="activity-item">
                    <div className="activity-info">
                      <span className="activity-type">
                        {event.detectionMethod === 'speech' ? '🎤' : '🔊'} 
                        {event.detectionMethod}
                      </span>
                      <span className="activity-confidence">
                        {formatConfidence(event.confidence)}
                      </span>
                    </div>
                    <span className="activity-time">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Detection */}
          {state.lastDetection && (
            <div className="last-detection">
              <h4>Last Detection</h4>
              <div className="detection-details">
                <div className="detection-method">
                  {state.lastDetection.detectionMethod === 'speech' ? '🎤' : '🔊'} 
                  {state.lastDetection.detectionMethod}
                </div>
                <div className="detection-confidence">
                  Confidence: {formatConfidence(state.lastDetection.confidence)}
                </div>
                <div className="detection-time">
                  {formatTime(state.lastDetection.timestamp)}
                </div>
                {state.lastDetection.transcript && (
                  <div className="detection-transcript">
                    "{state.lastDetection.transcript}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonitoringStatusDisplay;