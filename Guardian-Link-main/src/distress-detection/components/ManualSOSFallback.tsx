/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FallbackMode, FallbackConfig, fallbackService } from '../services/FallbackService';
import './ManualSOSFallback.css';

interface ManualSOSFallbackProps {
  onSOSTrigger?: () => void;
  onDismiss?: () => void;
  showAlways?: boolean;
}

/**
 * Manual SOS fallback component for critical system failures
 * Requirements: 1.5, 3.5
 */
export const ManualSOSFallback: React.FC<ManualSOSFallbackProps> = ({
  onSOSTrigger,
  onDismiss,
  showAlways = false
}) => {
  const [visible, setVisible] = useState(false);
  const [fallbackConfig, setFallbackConfig] = useState<FallbackConfig | null>(null);
  const [sosTriggered, setSOSTriggered] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    // Listen for fallback mode changes
    const handleFallback = (config: FallbackConfig) => {
      setFallbackConfig(config);
      
      // Show fallback UI for degraded modes or when forced
      const shouldShow = showAlways || 
        config.mode === FallbackMode.MANUAL_ONLY || 
        config.mode === FallbackMode.EMERGENCY_FALLBACK ||
        config.degradationLevel === 'major' ||
        config.degradationLevel === 'critical';
      
      setVisible(shouldShow);
    };

    // Listen for manual SOS fallback events
    const handleManualSOSEvent = (event: CustomEvent) => {
      setVisible(true);
      setFallbackConfig({
        mode: FallbackMode.EMERGENCY_FALLBACK,
        capabilities: {
          speechRecognition: false,
          audioAnalysis: false,
          apiProcessing: false,
          localProcessing: false,
          microphone: false,
          emergencyResponse: false
        },
        limitations: ['Emergency response system failed'],
        recommendations: ['Use manual SOS button', 'Call 911 directly'],
        manualSOSAvailable: true,
        degradationLevel: 'critical'
      });
    };

    fallbackService.onFallback(handleFallback);
    window.addEventListener('show-manual-sos-fallback', handleManualSOSEvent as EventListener);

    // Get current config
    const currentConfig = fallbackService.getCurrentConfig();
    handleFallback(currentConfig);

    return () => {
      window.removeEventListener('show-manual-sos-fallback', handleManualSOSEvent as EventListener);
    };
  }, [showAlways]);

  const handleSOSClick = useCallback(async () => {
    if (sosTriggered) return;

    try {
      setSOSTriggered(true);
      
      // Start countdown
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      // Wait for countdown
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Trigger SOS
      if (onSOSTrigger) {
        onSOSTrigger();
      } else {
        // Default SOS behavior
        await triggerManualSOS();
      }

      // Auto-hide after successful trigger
      setTimeout(() => {
        setVisible(false);
        setSOSTriggered(false);
      }, 2000);

    } catch (error) {
      console.error('Manual SOS failed:', error);
      setSOSTriggered(false);
      setCountdown(null);
      
      // Show error message
      alert('Manual SOS failed. Please call emergency services directly: 911');
    }
  }, [sosTriggered, onSOSTrigger]);

  const handleCancel = useCallback(() => {
    setCountdown(null);
    setSOSTriggered(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  }, [onDismiss]);

  const triggerManualSOS = async (): Promise<void> => {
    // Import emergency response handler
    const { emergencyResponseHandler } = await import('../services/EmergencyResponseHandler');
    
    // Create manual distress context
    const context = {
      detectionMethod: 'combined' as const, // Use 'combined' as closest match for manual
      confidence: 100,
      timestamp: new Date(),
      transcript: 'Manual SOS activation due to system failure'
    };

    // Try to trigger SOS
    await emergencyResponseHandler.triggerSOS(context);
    
    // Log the manual event
    const manualEvent = {
      id: `manual_${Date.now()}`,
      timestamp: new Date(),
      detectionMethod: 'combined' as const, // Use 'combined' as closest match for manual
      confidence: 100,
      transcript: 'Manual SOS - System Fallback',
      userResponse: 'confirmed' as const,
      sosTriggered: true
    };
    
    emergencyResponseHandler.logDistressEvent(manualEvent);
  };

  const getStatusMessage = (): string => {
    if (!fallbackConfig) return '';

    switch (fallbackConfig.mode) {
      case FallbackMode.MANUAL_ONLY:
        return 'Automatic detection unavailable - Manual mode active';
      case FallbackMode.EMERGENCY_FALLBACK:
        return 'Emergency system failure - Manual SOS only';
      case FallbackMode.SPEECH_ONLY:
        return 'Audio detection unavailable - Speech detection only';
      case FallbackMode.AUDIO_ONLY:
        return 'Speech detection unavailable - Audio detection only';
      case FallbackMode.LOCAL_PROCESSING_ONLY:
        return 'AI services unavailable - Local processing only';
      default:
        return 'System degraded - Manual backup available';
    }
  };

  const getUrgencyLevel = (): 'low' | 'medium' | 'high' | 'critical' => {
    if (!fallbackConfig) return 'low';
    
    switch (fallbackConfig.degradationLevel) {
      case 'critical':
        return 'critical';
      case 'major':
        return 'high';
      case 'minor':
        return 'medium';
      default:
        return 'low';
    }
  };

  if (!visible || !fallbackConfig) {
    return null;
  }

  return (
    <div className={`manual-sos-fallback ${getUrgencyLevel()}`} role="alert" aria-live="assertive">
      <div className="fallback-header">
        <div className="status-indicator">
          <span className="status-icon" aria-hidden="true">
            {fallbackConfig.degradationLevel === 'critical' ? '🚨' : '⚠️'}
          </span>
          <h3 className="status-message">{getStatusMessage()}</h3>
        </div>
        
        {fallbackConfig.degradationLevel !== 'critical' && (
          <button
            className="dismiss-button"
            onClick={handleDismiss}
            aria-label="Dismiss fallback notification"
          >
            ×
          </button>
        )}
      </div>

      <div className="fallback-content">
        {fallbackConfig.limitations.length > 0 && (
          <div className="limitations">
            <h4>Current Limitations:</h4>
            <ul>
              {fallbackConfig.limitations.map((limitation, index) => (
                <li key={index}>{limitation}</li>
              ))}
            </ul>
          </div>
        )}

        {fallbackConfig.recommendations.length > 0 && (
          <div className="recommendations">
            <h4>Recommendations:</h4>
            <ul>
              {fallbackConfig.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        )}

        {fallbackConfig.manualSOSAvailable && (
          <div className="manual-sos-section">
            <p className="sos-description">
              If you need emergency assistance, use the manual SOS button below:
            </p>
            
            <button
              className={`manual-sos-button ${sosTriggered ? 'triggered' : ''}`}
              onClick={handleSOSClick}
              disabled={sosTriggered && countdown !== null}
              aria-label="Manual SOS - Emergency assistance"
            >
              {countdown !== null ? (
                <span className="countdown">
                  SOS in {countdown}...
                  <small>Click again to cancel</small>
                </span>
              ) : sosTriggered ? (
                <span className="triggered-text">
                  🚨 SOS Activated
                </span>
              ) : (
                <span className="sos-text">
                  🆘 Manual SOS
                </span>
              )}
            </button>

            {countdown !== null && (
              <button
                className="cancel-button"
                onClick={handleCancel}
                aria-label="Cancel SOS"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {!fallbackConfig.manualSOSAvailable && (
          <div className="emergency-instructions">
            <h4>Emergency Contact Instructions:</h4>
            <p>The emergency response system is unavailable. Please:</p>
            <ul>
              <li>Call emergency services directly: <strong>911</strong></li>
              <li>Contact your emergency contacts manually</li>
              <li>Use alternative communication methods if needed</li>
            </ul>
          </div>
        )}
      </div>

      <div className="fallback-footer">
        <p className="system-status">
          System Status: <span className={`status-badge ${getUrgencyLevel()}`}>
            {fallbackConfig.degradationLevel.toUpperCase()}
          </span>
        </p>
      </div>
    </div>
  );
};

export default ManualSOSFallback;