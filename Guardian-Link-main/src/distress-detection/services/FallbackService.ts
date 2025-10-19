/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressSettings } from '../types';
import { ErrorType, errorHandlingService } from './ErrorHandlingService';

/**
 * Fallback modes for different failure scenarios
 */
export enum FallbackMode {
  FULL_FUNCTIONALITY = 'full',
  SPEECH_ONLY = 'speech_only',
  AUDIO_ONLY = 'audio_only',
  LOCAL_PROCESSING_ONLY = 'local_only',
  MANUAL_ONLY = 'manual_only',
  EMERGENCY_FALLBACK = 'emergency'
}

/**
 * System capability status
 */
export interface SystemCapabilities {
  speechRecognition: boolean;
  audioAnalysis: boolean;
  apiProcessing: boolean;
  localProcessing: boolean;
  microphone: boolean;
  emergencyResponse: boolean;
}

/**
 * Fallback configuration
 */
export interface FallbackConfig {
  mode: FallbackMode;
  capabilities: SystemCapabilities;
  limitations: string[];
  recommendations: string[];
  manualSOSAvailable: boolean;
  degradationLevel: 'none' | 'minor' | 'major' | 'critical';
}

/**
 * Service health monitoring
 */
export interface ServiceHealthStatus {
  service: string;
  healthy: boolean;
  lastCheck: Date;
  errorCount: number;
  consecutiveFailures: number;
}

/**
 * Fallback and graceful degradation service
 * Requirements: 1.5, 3.5
 */
export class FallbackService {
  private currentMode: FallbackMode = FallbackMode.FULL_FUNCTIONALITY;
  private serviceHealth: Map<string, ServiceHealthStatus> = new Map();
  private fallbackCallbacks: ((config: FallbackConfig) => void)[] = [];
  private recoveryCallbacks: ((mode: FallbackMode) => void)[] = [];
  
  // Health monitoring
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  constructor() {
    this.initializeServiceHealth();
    this.startHealthMonitoring();
    this.setupErrorHandling();
  }

  /**
   * Initialize service health tracking
   */
  private initializeServiceHealth(): void {
    const services = ['speech', 'audio', 'classification', 'verification', 'permissions', 'emergency'];
    
    services.forEach(service => {
      this.serviceHealth.set(service, {
        service,
        healthy: true,
        lastCheck: new Date(),
        errorCount: 0,
        consecutiveFailures: 0
      });
    });
  }

  /**
   * Setup error handling integration
   */
  private setupErrorHandling(): void {
    errorHandlingService.onError((error) => {
      this.handleServiceError(error.service, error.type);
    });
  }

  /**
   * Handle service errors and trigger fallbacks
   */
  private handleServiceError(service: string, errorType: ErrorType): void {
    const health = this.serviceHealth.get(service);
    if (!health) return;

    health.errorCount++;
    health.consecutiveFailures++;
    health.healthy = false;
    health.lastCheck = new Date();

    console.warn(`Service ${service} reported error: ${errorType}`);

    // Trigger fallback based on error severity and service
    this.evaluateAndTriggerFallback();
  }

  /**
   * Mark service as recovered
   */
  markServiceRecovered(service: string): void {
    const health = this.serviceHealth.get(service);
    if (!health) return;

    health.healthy = true;
    health.consecutiveFailures = 0;
    health.lastCheck = new Date();

    console.log(`Service ${service} recovered`);

    // Check if we can upgrade from current fallback mode
    this.evaluateSystemRecovery();
  }

  /**
   * Evaluate system state and trigger appropriate fallback
   */
  private evaluateAndTriggerFallback(): void {
    const capabilities = this.assessSystemCapabilities();
    const newMode = this.determineFallbackMode(capabilities);

    if (newMode !== this.currentMode) {
      console.log(`Switching from ${this.currentMode} to ${newMode} mode`);
      this.switchToFallbackMode(newMode, capabilities);
    }
  }

  /**
   * Assess current system capabilities
   */
  private assessSystemCapabilities(): SystemCapabilities {
    const speechHealth = this.serviceHealth.get('speech');
    const audioHealth = this.serviceHealth.get('audio');
    const classificationHealth = this.serviceHealth.get('classification');
    const permissionsHealth = this.serviceHealth.get('permissions');
    const emergencyHealth = this.serviceHealth.get('emergency');

    return {
      speechRecognition: speechHealth?.healthy ?? false,
      audioAnalysis: audioHealth?.healthy ?? false,
      apiProcessing: classificationHealth?.healthy ?? false,
      localProcessing: true, // Always available
      microphone: permissionsHealth?.healthy ?? false,
      emergencyResponse: emergencyHealth?.healthy ?? false
    };
  }

  /**
   * Determine appropriate fallback mode based on capabilities
   */
  private determineFallbackMode(capabilities: SystemCapabilities): FallbackMode {
    // Emergency fallback if emergency response is down
    if (!capabilities.emergencyResponse) {
      return FallbackMode.EMERGENCY_FALLBACK;
    }

    // No microphone = manual only
    if (!capabilities.microphone) {
      return FallbackMode.MANUAL_ONLY;
    }

    // Both speech and audio failed = manual only
    if (!capabilities.speechRecognition && !capabilities.audioAnalysis) {
      return FallbackMode.MANUAL_ONLY;
    }

    // Only speech works
    if (capabilities.speechRecognition && !capabilities.audioAnalysis) {
      return FallbackMode.SPEECH_ONLY;
    }

    // Only audio works
    if (!capabilities.speechRecognition && capabilities.audioAnalysis) {
      return FallbackMode.AUDIO_ONLY;
    }

    // API processing failed, use local only
    if (capabilities.speechRecognition && capabilities.audioAnalysis && !capabilities.apiProcessing) {
      return FallbackMode.LOCAL_PROCESSING_ONLY;
    }

    // All systems operational
    if (capabilities.speechRecognition && capabilities.audioAnalysis && capabilities.apiProcessing) {
      return FallbackMode.FULL_FUNCTIONALITY;
    }

    // Default to manual if unclear
    return FallbackMode.MANUAL_ONLY;
  }

  /**
   * Switch to fallback mode
   */
  private switchToFallbackMode(mode: FallbackMode, capabilities: SystemCapabilities): void {
    this.currentMode = mode;

    const config = this.createFallbackConfig(mode, capabilities);
    
    // Notify callbacks
    this.fallbackCallbacks.forEach(callback => {
      try {
        callback(config);
      } catch (error) {
        console.error('Fallback callback error:', error);
      }
    });

    // Log fallback activation
    console.warn(`🔄 Fallback activated: ${mode}`, config);
  }

  /**
   * Create fallback configuration
   */
  private createFallbackConfig(mode: FallbackMode, capabilities: SystemCapabilities): FallbackConfig {
    const config: FallbackConfig = {
      mode,
      capabilities,
      limitations: [],
      recommendations: [],
      manualSOSAvailable: true,
      degradationLevel: 'none'
    };

    switch (mode) {
      case FallbackMode.FULL_FUNCTIONALITY:
        config.degradationLevel = 'none';
        break;

      case FallbackMode.SPEECH_ONLY:
        config.limitations = [
          'Audio analysis disabled',
          'Cannot detect non-verbal distress sounds',
          'Reduced detection accuracy'
        ];
        config.recommendations = [
          'Speak clearly if you need help',
          'Use distress phrases like "help me" or "I\'m scared"'
        ];
        config.degradationLevel = 'minor';
        break;

      case FallbackMode.AUDIO_ONLY:
        config.limitations = [
          'Speech recognition disabled',
          'Cannot detect distress phrases',
          'Relies only on audio patterns'
        ];
        config.recommendations = [
          'Make loud noises if you need help',
          'Tap or knock loudly to trigger detection'
        ];
        config.degradationLevel = 'minor';
        break;

      case FallbackMode.LOCAL_PROCESSING_ONLY:
        config.limitations = [
          'AI processing unavailable',
          'Using basic pattern matching only',
          'Reduced accuracy for complex phrases'
        ];
        config.recommendations = [
          'Use simple, clear distress phrases',
          'Speak loudly and clearly'
        ];
        config.degradationLevel = 'minor';
        break;

      case FallbackMode.MANUAL_ONLY:
        config.limitations = [
          'Automatic detection disabled',
          'Manual SOS button only',
          'No background monitoring'
        ];
        config.recommendations = [
          'Use the manual SOS button if you need help',
          'Keep the app visible and accessible'
        ];
        config.degradationLevel = 'major';
        break;

      case FallbackMode.EMERGENCY_FALLBACK:
        config.limitations = [
          'Emergency response system failed',
          'Cannot send automatic alerts',
          'Manual contact required'
        ];
        config.recommendations = [
          'Call emergency services directly: 911',
          'Contact emergency contacts manually',
          'Use alternative communication methods'
        ];
        config.degradationLevel = 'critical';
        config.manualSOSAvailable = false;
        break;
    }

    return config;
  }

  /**
   * Evaluate system recovery and upgrade mode if possible
   */
  private evaluateSystemRecovery(): void {
    const capabilities = this.assessSystemCapabilities();
    const optimalMode = this.determineFallbackMode(capabilities);

    // Only upgrade if the optimal mode is better than current
    if (this.isModeBetter(optimalMode, this.currentMode)) {
      console.log(`🔄 System recovery: upgrading from ${this.currentMode} to ${optimalMode}`);
      this.switchToFallbackMode(optimalMode, capabilities);
      
      // Notify recovery callbacks
      this.recoveryCallbacks.forEach(callback => {
        try {
          callback(optimalMode);
        } catch (error) {
          console.error('Recovery callback error:', error);
        }
      });
    }
  }

  /**
   * Check if one mode is better than another
   */
  private isModeBetter(mode1: FallbackMode, mode2: FallbackMode): boolean {
    const modeRanking = {
      [FallbackMode.FULL_FUNCTIONALITY]: 6,
      [FallbackMode.LOCAL_PROCESSING_ONLY]: 5,
      [FallbackMode.SPEECH_ONLY]: 4,
      [FallbackMode.AUDIO_ONLY]: 3,
      [FallbackMode.MANUAL_ONLY]: 2,
      [FallbackMode.EMERGENCY_FALLBACK]: 1
    };

    return modeRanking[mode1] > modeRanking[mode2];
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Perform periodic health check
   */
  private performHealthCheck(): void {
    const now = new Date();
    let healthChanged = false;

    this.serviceHealth.forEach((health, service) => {
      // Check if service has been unhealthy for too long
      if (!health.healthy) {
        const timeSinceLastCheck = now.getTime() - health.lastCheck.getTime();
        
        // If service has been down for more than 2 minutes, consider it failed
        if (timeSinceLastCheck > 120000) {
          if (health.consecutiveFailures < this.MAX_CONSECUTIVE_FAILURES) {
            health.consecutiveFailures = this.MAX_CONSECUTIVE_FAILURES;
            healthChanged = true;
          }
        }
      }
    });

    if (healthChanged) {
      this.evaluateAndTriggerFallback();
    }
  }

  /**
   * Force fallback to specific mode (for testing or manual override)
   */
  forceFallbackMode(mode: FallbackMode): void {
    const capabilities = this.assessSystemCapabilities();
    console.log(`🔧 Forcing fallback mode: ${mode}`);
    this.switchToFallbackMode(mode, capabilities);
  }

  /**
   * Get current fallback configuration
   */
  getCurrentConfig(): FallbackConfig {
    const capabilities = this.assessSystemCapabilities();
    return this.createFallbackConfig(this.currentMode, capabilities);
  }

  /**
   * Get current fallback mode
   */
  getCurrentMode(): FallbackMode {
    return this.currentMode;
  }

  /**
   * Get service health status
   */
  getServiceHealth(): Map<string, ServiceHealthStatus> {
    return new Map(this.serviceHealth);
  }

  /**
   * Subscribe to fallback mode changes
   */
  onFallback(callback: (config: FallbackConfig) => void): void {
    this.fallbackCallbacks.push(callback);
  }

  /**
   * Subscribe to system recovery
   */
  onRecovery(callback: (mode: FallbackMode) => void): void {
    this.recoveryCallbacks.push(callback);
  }

  /**
   * Test fallback scenarios (for development/testing)
   */
  testFallbackScenario(scenario: 'speech_failure' | 'audio_failure' | 'api_failure' | 'microphone_failure' | 'emergency_failure'): void {
    console.log(`🧪 Testing fallback scenario: ${scenario}`);
    
    switch (scenario) {
      case 'speech_failure':
        this.handleServiceError('speech', ErrorType.SPEECH_RECOGNITION_FAILED);
        break;
      case 'audio_failure':
        this.handleServiceError('audio', ErrorType.AUDIO_ANALYSIS_FAILED);
        break;
      case 'api_failure':
        this.handleServiceError('classification', ErrorType.API_ERROR);
        break;
      case 'microphone_failure':
        this.handleServiceError('permissions', ErrorType.MICROPHONE_UNAVAILABLE);
        break;
      case 'emergency_failure':
        this.handleServiceError('emergency', ErrorType.EMERGENCY_RESPONSE_FAILED);
        break;
    }
  }

  /**
   * Reset all services to healthy (for testing)
   */
  resetToHealthy(): void {
    console.log('🔄 Resetting all services to healthy state');
    
    this.serviceHealth.forEach(health => {
      health.healthy = true;
      health.consecutiveFailures = 0;
      health.lastCheck = new Date();
    });

    this.evaluateSystemRecovery();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.fallbackCallbacks = [];
    this.recoveryCallbacks = [];
    this.serviceHealth.clear();
  }
}

// Export singleton instance
export const fallbackService = new FallbackService();