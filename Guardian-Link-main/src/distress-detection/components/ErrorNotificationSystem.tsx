/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DistressError, ErrorSeverity, ErrorType, RecoveryStrategy, errorHandlingService } from '../services/ErrorHandlingService';
import TroubleshootingGuide from './TroubleshootingGuide';
import './ErrorNotificationSystem.css';

interface ErrorNotification {
  error: DistressError;
  visible: boolean;
  autoHideTimeout?: NodeJS.Timeout;
}

interface ErrorNotificationSystemProps {
  maxNotifications?: number;
  autoHideDelay?: number;
  showRecoveryActions?: boolean;
}

/**
 * User-friendly error notification system
 * Requirements: 1.5, 3.5
 */
export const ErrorNotificationSystem: React.FC<ErrorNotificationSystemProps> = ({
  maxNotifications = 3,
  autoHideDelay = 10000,
  showRecoveryActions = true
}) => {
  const [notifications, setNotifications] = useState<Map<string, ErrorNotification>>(new Map());
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [troubleshootingErrorType, setTroubleshootingErrorType] = useState<ErrorType | undefined>();

  useEffect(() => {
    // Subscribe to error notifications
    const handleError = (error: DistressError) => {
      // Only show user-facing errors
      if (shouldShowToUser(error)) {
        addNotification(error);
      }
    };

    errorHandlingService.onError(handleError);

    return () => {
      // Cleanup timeouts
      notifications.forEach(notification => {
        if (notification.autoHideTimeout) {
          clearTimeout(notification.autoHideTimeout);
        }
      });
    };
  }, []);

  const shouldShowToUser = (error: DistressError): boolean => {
    // Show critical and high severity errors
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      return true;
    }

    // Show permission and browser support errors
    if (error.type === ErrorType.PERMISSION_DENIED || error.type === ErrorType.BROWSER_UNSUPPORTED) {
      return true;
    }

    // Show emergency response failures
    if (error.type === ErrorType.EMERGENCY_RESPONSE_FAILED) {
      return true;
    }

    return false;
  };

  const addNotification = useCallback((error: DistressError) => {
    setNotifications(prev => {
      const newNotifications = new Map(prev);
      
      // Remove oldest notification if at max capacity
      if (newNotifications.size >= maxNotifications) {
        const oldestKey = Array.from(newNotifications.keys())[0];
        const oldest = newNotifications.get(oldestKey) as ErrorNotification | undefined;
        if (oldest && oldest.autoHideTimeout) {
          clearTimeout(oldest.autoHideTimeout);
        }
        newNotifications.delete(oldestKey);
      }

      // Add auto-hide timeout for non-critical errors
      let autoHideTimeout: NodeJS.Timeout | undefined;
      if (error.severity !== ErrorSeverity.CRITICAL && autoHideDelay > 0) {
        autoHideTimeout = setTimeout(() => {
          hideNotification(error.id);
        }, autoHideDelay);
      }

      newNotifications.set(error.id, {
        error,
        visible: true,
        autoHideTimeout
      });

      return newNotifications;
    });
  }, [maxNotifications, autoHideDelay]);

  const hideNotification = useCallback((errorId: string) => {
    setNotifications(prev => {
      const newNotifications = new Map(prev);
      const notification = newNotifications.get(errorId) as ErrorNotification | undefined;
      
      if (notification) {
        if (notification.autoHideTimeout) {
          clearTimeout(notification.autoHideTimeout);
        }
        newNotifications.delete(errorId);
      }
      
      return newNotifications;
    });
  }, []);

  const handleRetry = useCallback(async (error: DistressError) => {
    try {
      // For manual retry, we'll report a new recovery attempt
      // Since attemptRecovery is private, we'll trigger a new error report to restart recovery
      errorHandlingService.reportError(
        error.type,
        error.service,
        `Manual retry attempt: ${error.message}`,
        error.originalError,
        { ...error.context, manualRetry: true }
      );
      
      hideNotification(error.id);
    } catch (retryError) {
      console.error('Manual retry failed:', retryError);
    }
  }, [hideNotification]);

  const handleDismiss = useCallback((errorId: string) => {
    hideNotification(errorId);
  }, [hideNotification]);

  const handleShowTroubleshooting = useCallback((error: DistressError) => {
    setTroubleshootingErrorType(error.type);
    setShowTroubleshooting(true);
  }, []);

  const getErrorIcon = (error: DistressError): string => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return '🚨';
      case ErrorSeverity.HIGH:
        return '⚠️';
      case ErrorSeverity.MEDIUM:
        return '⚡';
      default:
        return 'ℹ️';
    }
  };

  const getErrorTitle = (error: DistressError): string => {
    switch (error.type) {
      case ErrorType.PERMISSION_DENIED:
        return 'Microphone Permission Required';
      case ErrorType.BROWSER_UNSUPPORTED:
        return 'Browser Not Supported';
      case ErrorType.MICROPHONE_UNAVAILABLE:
        return 'Microphone Unavailable';
      case ErrorType.SPEECH_RECOGNITION_FAILED:
        return 'Speech Recognition Issue';
      case ErrorType.AUDIO_ANALYSIS_FAILED:
        return 'Audio Analysis Issue';
      case ErrorType.API_ERROR:
        return 'AI Service Error';
      case ErrorType.NETWORK_ERROR:
        return 'Network Connection Issue';
      case ErrorType.EMERGENCY_RESPONSE_FAILED:
        return 'Emergency Response Failed';
      default:
        return 'System Error';
    }
  };

  const getUserFriendlyMessage = (error: DistressError): string => {
    switch (error.type) {
      case ErrorType.PERMISSION_DENIED:
        return 'Please allow microphone access to enable distress detection. Click the microphone icon in your browser\'s address bar.';
      case ErrorType.BROWSER_UNSUPPORTED:
        return 'Your browser doesn\'t support the required features. Please use Chrome, Firefox, or Safari for the best experience.';
      case ErrorType.MICROPHONE_UNAVAILABLE:
        return 'No microphone detected. Please connect a microphone or check your audio settings.';
      case ErrorType.SPEECH_RECOGNITION_FAILED:
        return 'Having trouble with speech recognition. The system will keep trying to reconnect automatically.';
      case ErrorType.AUDIO_ANALYSIS_FAILED:
        return 'Audio analysis temporarily unavailable. Speech detection is still working.';
      case ErrorType.API_ERROR:
        return 'AI services are temporarily unavailable. Using local processing instead.';
      case ErrorType.NETWORK_ERROR:
        return 'Network connection issues detected. Some features may be limited.';
      case ErrorType.EMERGENCY_RESPONSE_FAILED:
        return 'Emergency response system failed. Please use the manual SOS button if you need help.';
      default:
        return error.message;
    }
  };

  const getRecoveryActions = (error: DistressError): Array<{ label: string; action: () => void; primary?: boolean }> => {
    const actions: Array<{ label: string; action: () => void; primary?: boolean }> = [];

    switch (error.type) {
      case ErrorType.PERMISSION_DENIED:
        actions.push({
          label: 'Grant Permission',
          action: () => {
            // Trigger permission request
            navigator.mediaDevices.getUserMedia({ audio: true })
              .then(() => hideNotification(error.id))
              .catch(console.error);
          },
          primary: true
        });
        break;

      case ErrorType.SPEECH_RECOGNITION_FAILED:
      case ErrorType.AUDIO_ANALYSIS_FAILED:
        if (error.retryCount < error.maxRetries) {
          actions.push({
            label: 'Retry Now',
            action: () => handleRetry(error),
            primary: true
          });
        }
        break;

      case ErrorType.EMERGENCY_RESPONSE_FAILED:
        actions.push({
          label: 'Manual SOS',
          action: () => {
            // Trigger manual SOS
            window.dispatchEvent(new CustomEvent('manual-sos-trigger'));
            hideNotification(error.id);
          },
          primary: true
        });
        break;

      case ErrorType.NETWORK_ERROR:
      case ErrorType.API_ERROR:
        actions.push({
          label: 'Retry Connection',
          action: () => handleRetry(error),
          primary: true
        });
        break;
    }

    // Add troubleshooting action for complex errors
    if ([
      ErrorType.PERMISSION_DENIED,
      ErrorType.BROWSER_UNSUPPORTED,
      ErrorType.MICROPHONE_UNAVAILABLE,
      ErrorType.SPEECH_RECOGNITION_FAILED,
      ErrorType.AUDIO_ANALYSIS_FAILED
    ].includes(error.type)) {
      actions.push({
        label: 'Troubleshoot',
        action: () => handleShowTroubleshooting(error)
      });
    }

    // Always add dismiss action for non-critical errors
    if (error.severity !== ErrorSeverity.CRITICAL) {
      actions.push({
        label: 'Dismiss',
        action: () => handleDismiss(error.id)
      });
    }

    return actions;
  };

  const notificationArray = Array.from(notifications.values());

  if (notificationArray.length === 0) {
    return null;
  }

  return (
    <>
      <div className="error-notification-system">
        {notificationArray.map(({ error, visible }) => (
        <div
          key={error.id}
          className={`error-notification ${error.severity} ${visible ? 'visible' : 'hidden'}`}
          role="alert"
          aria-live="assertive"
        >
          <div className="error-header">
            <span className="error-icon" aria-hidden="true">
              {getErrorIcon(error)}
            </span>
            <h3 className="error-title">{getErrorTitle(error)}</h3>
            {error.severity !== ErrorSeverity.CRITICAL && (
              <button
                className="error-close"
                onClick={() => handleDismiss(error.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            )}
          </div>

          <div className="error-content">
            <p className="error-message">{getUserFriendlyMessage(error)}</p>
            
            {error.retryCount > 0 && (
              <p className="error-retry-info">
                Retry attempt {error.retryCount} of {error.maxRetries}
              </p>
            )}

            {showRecoveryActions && (
              <div className="error-actions">
                {getRecoveryActions(error).map((action, index) => (
                  <button
                    key={index}
                    className={`error-action ${action.primary ? 'primary' : 'secondary'}`}
                    onClick={action.action}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error.severity === ErrorSeverity.CRITICAL && (
            <div className="error-critical-warning">
              <strong>Critical Error:</strong> Some safety features may not be available.
            </div>
          )}
          </div>
        ))}
      </div>

      <TroubleshootingGuide
        visible={showTroubleshooting}
        onClose={() => setShowTroubleshooting(false)}
        errorType={troubleshootingErrorType}
      />
    </>
  );
};

export default ErrorNotificationSystem;