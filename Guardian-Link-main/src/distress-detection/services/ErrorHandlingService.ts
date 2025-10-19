/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressSettings } from '../types';

/**
 * Error types for distress detection system
 */
export enum ErrorType {
  PERMISSION_DENIED = 'permission_denied',
  BROWSER_UNSUPPORTED = 'browser_unsupported',
  MICROPHONE_UNAVAILABLE = 'microphone_unavailable',
  SPEECH_RECOGNITION_FAILED = 'speech_recognition_failed',
  AUDIO_ANALYSIS_FAILED = 'audio_analysis_failed',
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error',
  INITIALIZATION_FAILED = 'initialization_failed',
  SERVICE_CRASHED = 'service_crashed',
  VERIFICATION_TIMEOUT = 'verification_timeout',
  EMERGENCY_RESPONSE_FAILED = 'emergency_response_failed'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  RESTART_SERVICE = 'restart_service',
  FALLBACK = 'fallback',
  GRACEFUL_DEGRADATION = 'graceful_degradation',
  MANUAL_INTERVENTION = 'manual_intervention',
  EMERGENCY_FALLBACK = 'emergency_fallback'
}

/**
 * Structured error information
 */
export interface DistressError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  timestamp: Date;
  service: string;
  context?: Record<string, any>;
  recoveryStrategy: RecoveryStrategy;
  retryCount: number;
  maxRetries: number;
  userNotified: boolean;
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  enableAutoRecovery: boolean;
  notifyUser: boolean;
}

/**
 * Service health status
 */
export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'failed' | 'recovering';
  lastError?: DistressError;
  errorCount: number;
  uptime: number;
  lastHealthCheck: Date;
}

/**
 * Comprehensive error handling service for distress detection system
 * Requirements: 1.5, 3.5
 */
export class ErrorHandlingService {
  private errors: Map<string, DistressError> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private recoveryConfigs: Map<ErrorType, ErrorRecoveryConfig> = new Map();
  private errorCallbacks: ((error: DistressError) => void)[] = [];
  private recoveryCallbacks: ((service: string, strategy: RecoveryStrategy) => Promise<boolean>)[] = [];
  
  // Error statistics
  private errorStats = {
    totalErrors: 0,
    errorsByType: new Map<ErrorType, number>(),
    errorsBySeverity: new Map<ErrorSeverity, number>(),
    recoverySuccessRate: 0
  };

  constructor() {
    this.initializeRecoveryConfigs();
    this.startHealthMonitoring();
  }

  /**
   * Initialize default recovery configurations for different error types
   */
  private initializeRecoveryConfigs(): void {
    // Permission errors - require manual intervention
    this.recoveryConfigs.set(ErrorType.PERMISSION_DENIED, {
      maxRetries: 0,
      baseDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
      enableAutoRecovery: false,
      notifyUser: true
    });

    // Browser support errors - no recovery possible
    this.recoveryConfigs.set(ErrorType.BROWSER_UNSUPPORTED, {
      maxRetries: 0,
      baseDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
      enableAutoRecovery: false,
      notifyUser: true
    });

    // Speech recognition errors - retry with backoff
    this.recoveryConfigs.set(ErrorType.SPEECH_RECOGNITION_FAILED, {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      enableAutoRecovery: true,
      notifyUser: false
    });

    // Audio analysis errors - retry with backoff
    this.recoveryConfigs.set(ErrorType.AUDIO_ANALYSIS_FAILED, {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 15000,
      backoffMultiplier: 2,
      enableAutoRecovery: true,
      notifyUser: false
    });

    // API errors - retry with longer delays
    this.recoveryConfigs.set(ErrorType.API_ERROR, {
      maxRetries: 3,
      baseDelay: 5000,
      maxDelay: 60000,
      backoffMultiplier: 3,
      enableAutoRecovery: true,
      notifyUser: false
    });

    // Network errors - retry with exponential backoff
    this.recoveryConfigs.set(ErrorType.NETWORK_ERROR, {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      enableAutoRecovery: true,
      notifyUser: false
    });

    // Critical errors - immediate notification
    this.recoveryConfigs.set(ErrorType.EMERGENCY_RESPONSE_FAILED, {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
      enableAutoRecovery: true,
      notifyUser: true
    });
  }

  /**
   * Report an error to the error handling system
   */
  reportError(
    type: ErrorType,
    service: string,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ): DistressError {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(type);
    const recoveryStrategy = this.determineRecoveryStrategy(type, severity);
    const config = this.recoveryConfigs.get(type) || this.getDefaultConfig();

    const distressError: DistressError = {
      id: errorId,
      type,
      severity,
      message,
      originalError,
      timestamp: new Date(),
      service,
      context,
      recoveryStrategy,
      retryCount: 0,
      maxRetries: config.maxRetries,
      userNotified: false
    };

    // Store error
    this.errors.set(errorId, distressError);

    // Update statistics
    this.updateErrorStats(distressError);

    // Update service health
    this.updateServiceHealth(service, distressError);

    // Log error
    this.logError(distressError);

    // Notify error callbacks
    this.notifyErrorCallbacks(distressError);

    // Attempt automatic recovery if enabled
    if (config.enableAutoRecovery) {
      this.attemptRecovery(distressError);
    }

    // Notify user if required
    if (config.notifyUser && !distressError.userNotified) {
      this.notifyUser(distressError);
    }

    return distressError;
  }

  /**
   * Attempt to recover from an error
   */
  private async attemptRecovery(error: DistressError): Promise<boolean> {
    const config = this.recoveryConfigs.get(error.type);
    if (!config || error.retryCount >= error.maxRetries) {
      return false;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, error.retryCount),
      config.maxDelay
    );

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    // Increment retry count
    error.retryCount++;
    this.errors.set(error.id, error);

    console.log(`Attempting recovery for ${error.service} (attempt ${error.retryCount}/${error.maxRetries})`);

    // Execute recovery strategy
    try {
      const success = await this.executeRecoveryStrategy(error);
      
      if (success) {
        console.log(`✅ Recovery successful for ${error.service}`);
        this.markErrorResolved(error.id);
        return true;
      } else {
        console.log(`❌ Recovery failed for ${error.service}`);
        
        // Try again if retries remaining
        if (error.retryCount < error.maxRetries) {
          return this.attemptRecovery(error);
        } else {
          // Max retries reached, escalate
          this.escalateError(error);
          return false;
        }
      }
    } catch (recoveryError) {
      console.error(`Recovery attempt failed for ${error.service}:`, recoveryError);
      
      // Try again if retries remaining
      if (error.retryCount < error.maxRetries) {
        return this.attemptRecovery(error);
      } else {
        this.escalateError(error);
        return false;
      }
    }
  }

  /**
   * Execute the appropriate recovery strategy
   */
  private async executeRecoveryStrategy(error: DistressError): Promise<boolean> {
    // Notify recovery callbacks
    for (const callback of this.recoveryCallbacks) {
      try {
        const success = await callback(error.service, error.recoveryStrategy);
        if (success) {
          return true;
        }
      } catch (callbackError) {
        console.error('Recovery callback failed:', callbackError);
      }
    }

    return false;
  }

  /**
   * Escalate error when recovery fails
   */
  private escalateError(error: DistressError): void {
    console.error(`🚨 Error escalation: ${error.service} - ${error.message}`);
    
    // Update service health to failed
    const health = this.serviceHealth.get(error.service);
    if (health) {
      health.status = 'failed';
      health.lastError = error;
    }

    // Notify user of critical failure
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.notifyUser(error, true);
    }

    // Trigger fallback mechanisms
    this.triggerFallbackMechanisms(error);
  }

  /**
   * Trigger fallback mechanisms for critical failures
   */
  private triggerFallbackMechanisms(error: DistressError): void {
    switch (error.type) {
      case ErrorType.EMERGENCY_RESPONSE_FAILED:
        // Show manual SOS button
        this.showManualSOSFallback();
        break;
        
      case ErrorType.SPEECH_RECOGNITION_FAILED:
        // Fall back to audio-only detection
        this.enableAudioOnlyMode();
        break;
        
      case ErrorType.AUDIO_ANALYSIS_FAILED:
        // Fall back to speech-only detection
        this.enableSpeechOnlyMode();
        break;
        
      default:
        // Generic fallback - show error guidance
        this.showErrorGuidance(error);
    }
  }

  /**
   * Mark an error as resolved
   */
  markErrorResolved(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      // Update service health
      const health = this.serviceHealth.get(error.service);
      if (health) {
        health.status = 'healthy';
        health.lastError = undefined;
      }

      // Remove from active errors
      this.errors.delete(errorId);
      
      console.log(`✅ Error resolved: ${error.service} - ${error.message}`);
    }
  }

  /**
   * Get service health status
   */
  getServiceHealth(service: string): ServiceHealth | undefined {
    return this.serviceHealth.get(service);
  }

  /**
   * Get all service health statuses
   */
  getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values());
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      ...this.errorStats,
      errorsByType: Object.fromEntries(this.errorStats.errorsByType),
      errorsBySeverity: Object.fromEntries(this.errorStats.errorsBySeverity)
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): DistressError[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Subscribe to error notifications
   */
  onError(callback: (error: DistressError) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Subscribe to recovery attempts
   */
  onRecovery(callback: (service: string, strategy: RecoveryStrategy) => Promise<boolean>): void {
    this.recoveryCallbacks.push(callback);
  }

  /**
   * Update recovery configuration for an error type
   */
  updateRecoveryConfig(type: ErrorType, config: Partial<ErrorRecoveryConfig>): void {
    const existing = this.recoveryConfigs.get(type) || this.getDefaultConfig();
    this.recoveryConfigs.set(type, { ...existing, ...config });
  }

  // Private helper methods

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.EMERGENCY_RESPONSE_FAILED:
        return ErrorSeverity.CRITICAL;
      case ErrorType.PERMISSION_DENIED:
      case ErrorType.BROWSER_UNSUPPORTED:
        return ErrorSeverity.HIGH;
      case ErrorType.SPEECH_RECOGNITION_FAILED:
      case ErrorType.AUDIO_ANALYSIS_FAILED:
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.LOW;
    }
  }

  private determineRecoveryStrategy(type: ErrorType, severity: ErrorSeverity): RecoveryStrategy {
    switch (type) {
      case ErrorType.PERMISSION_DENIED:
      case ErrorType.BROWSER_UNSUPPORTED:
        return RecoveryStrategy.MANUAL_INTERVENTION;
      case ErrorType.EMERGENCY_RESPONSE_FAILED:
        return RecoveryStrategy.EMERGENCY_FALLBACK;
      case ErrorType.SPEECH_RECOGNITION_FAILED:
      case ErrorType.AUDIO_ANALYSIS_FAILED:
        return RecoveryStrategy.RESTART_SERVICE;
      case ErrorType.API_ERROR:
      case ErrorType.NETWORK_ERROR:
        return RecoveryStrategy.RETRY;
      default:
        return severity === ErrorSeverity.CRITICAL ? 
          RecoveryStrategy.EMERGENCY_FALLBACK : 
          RecoveryStrategy.GRACEFUL_DEGRADATION;
    }
  }

  private getDefaultConfig(): ErrorRecoveryConfig {
    return {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      enableAutoRecovery: true,
      notifyUser: false
    };
  }

  private updateErrorStats(error: DistressError): void {
    this.errorStats.totalErrors++;
    
    const typeCount = this.errorStats.errorsByType.get(error.type) || 0;
    this.errorStats.errorsByType.set(error.type, typeCount + 1);
    
    const severityCount = this.errorStats.errorsBySeverity.get(error.severity) || 0;
    this.errorStats.errorsBySeverity.set(error.severity, severityCount + 1);
  }

  private updateServiceHealth(service: string, error: DistressError): void {
    let health = this.serviceHealth.get(service);
    
    if (!health) {
      health = {
        service,
        status: 'healthy',
        errorCount: 0,
        uptime: Date.now(),
        lastHealthCheck: new Date()
      };
      this.serviceHealth.set(service, health);
    }

    health.errorCount++;
    health.lastError = error;
    health.lastHealthCheck = new Date();
    
    // Update status based on error severity and frequency
    if (error.severity === ErrorSeverity.CRITICAL) {
      health.status = 'failed';
    } else if (health.errorCount > 5) {
      health.status = 'degraded';
    } else {
      health.status = 'recovering';
    }
  }

  private logError(error: DistressError): void {
    const logLevel = error.severity === ErrorSeverity.CRITICAL ? 'error' : 
                    error.severity === ErrorSeverity.HIGH ? 'warn' : 'info';
    
    console[logLevel](`[${error.service}] ${error.type}: ${error.message}`, {
      errorId: error.id,
      timestamp: error.timestamp,
      context: error.context,
      originalError: error.originalError
    });
  }

  private notifyErrorCallbacks(error: DistressError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error callback failed:', callbackError);
      }
    });
  }

  private notifyUser(error: DistressError, isEscalation: boolean = false): void {
    // This will be implemented by the UI notification system
    console.warn(`User notification: ${error.message}`);
    error.userNotified = true;
  }

  private showManualSOSFallback(): void {
    console.warn('🚨 Emergency response failed - showing manual SOS fallback');
    // This will trigger UI to show manual SOS button
  }

  private enableAudioOnlyMode(): void {
    console.warn('🔊 Speech recognition failed - falling back to audio-only detection');
    // This will be handled by the distress detection manager
  }

  private enableSpeechOnlyMode(): void {
    console.warn('🎤 Audio analysis failed - falling back to speech-only detection');
    // This will be handled by the distress detection manager
  }

  private showErrorGuidance(error: DistressError): void {
    console.warn(`💡 Showing error guidance for: ${error.type}`);
    // This will trigger UI to show troubleshooting guidance
  }

  private startHealthMonitoring(): void {
    // Periodic health check every 30 seconds
    setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }

  private performHealthCheck(): void {
    const now = new Date();
    
    this.serviceHealth.forEach((health, service) => {
      health.lastHealthCheck = now;
      
      // Reset error count if service has been healthy for a while
      if (health.status === 'healthy' && health.errorCount > 0) {
        const timeSinceLastError = health.lastError ? 
          now.getTime() - health.lastError.timestamp.getTime() : 
          Infinity;
        
        // Reset error count after 5 minutes of no errors
        if (timeSinceLastError > 5 * 60 * 1000) {
          health.errorCount = 0;
        }
      }
    });
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();