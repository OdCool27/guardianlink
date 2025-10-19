/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  DistressDetectionManager as IDistressDetectionManager,
  SpeechRecognitionEngine,
  AudioAnalysisEngine,
  DistressClassificationService as IDistressClassificationService,
  PermissionsManager as IPermissionsManager
} from '../interfaces';
import { 
  DistressSettings, 
  DistressDetectionState, 
  DistressDetectionStatus,
  DistressEvent,
  DistressContext,
  DistressAnalysis,
  VerificationResult
} from '../types';
import { SpeechRecognitionService } from './SpeechRecognitionService';
import { AudioAnalysisService } from './AudioAnalysisService';
import { DistressClassificationService } from './DistressClassificationService';
import { VerificationService } from './VerificationService';
import { PermissionsManager } from './PermissionsManager';
import { DetectionEventHandler, DetectionCorrelation } from './DetectionEventHandler';
import { errorHandlingService, ErrorType, RecoveryStrategy } from './ErrorHandlingService';
import { DEFAULT_DISTRESS_SETTINGS } from '../config/defaults';

/**
 * Central coordinator for all distress detection activities
 * Manages service lifecycle, detection correlation, and emergency response
 * Requirements: 1.1, 2.5, 3.5
 */
export class DistressDetectionManager implements IDistressDetectionManager {
  // Core services
  private speechService: SpeechRecognitionEngine;
  private audioService: AudioAnalysisEngine;
  private classificationService: IDistressClassificationService;
  private verificationService: VerificationService;
  private permissionsManager: IPermissionsManager;
  private eventHandler: DetectionEventHandler;

  // State management
  private state: DistressDetectionState = {
    status: 'inactive',
    isListening: false,
    isAnalyzing: false
  };

  private settings: DistressSettings = DEFAULT_DISTRESS_SETTINGS;
  private stateChangeCallbacks: ((state: DistressDetectionState) => void)[] = [];
  private verificationCallbacks: ((context: DistressContext) => void)[] = [];

  // Detection configuration
  private confidenceThreshold = 70; // Minimum confidence for verification

  constructor() {
    this.speechService = new SpeechRecognitionService();
    this.audioService = new AudioAnalysisService();
    this.classificationService = new DistressClassificationService();
    this.verificationService = new VerificationService();
    this.permissionsManager = new PermissionsManager();
    this.eventHandler = new DetectionEventHandler();

    this.setupServiceCallbacks();
    this.setupEventHandlerCallbacks();
    this.setupErrorHandling();
  }

  /**
   * Initialize and start distress monitoring
   * Requirements: 1.1
   */
  async startMonitoring(): Promise<void> {
    try {
      this.updateState({ status: 'initializing' });

      // Check and request permissions
      const hasPermissions = await this.permissionsManager.requestMicrophonePermission();
      if (!hasPermissions) {
        throw new Error('Microphone permission is required for distress detection');
      }

      // Initialize services based on settings
      console.log('🔧 Initializing services with settings:', this.settings);
      
      if (this.settings.speechRecognition.enabled) {
        console.log('🎤 Initializing speech recognition...');
        await this.speechService.initialize();
        console.log('🎤 Starting speech listening...');
        this.speechService.startListening();
        this.updateState({ isListening: true });
        console.log('✅ Speech recognition started');
      } else {
        console.log('⚠️ Speech recognition is disabled in settings');
      }

      if (this.settings.audioAnalysis.enabled) {
        console.log('🔊 Initializing audio analysis...');
        await this.audioService.initialize();
        console.log('🔊 Starting audio analysis...');
        this.audioService.startAnalysis();
        this.updateState({ isAnalyzing: true });
        console.log('✅ Audio analysis started');
      } else {
        console.log('⚠️ Audio analysis is disabled in settings');
      }

      this.updateState({ status: 'active' });
      console.log('Distress detection monitoring started successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateState({ 
        status: 'error', 
        errorMessage,
        isListening: false,
        isAnalyzing: false 
      });
      throw error;
    }
  }

  /**
   * Stop all distress monitoring activities
   */
  stopMonitoring(): void {
    try {
      console.log('🛑 Stopping all distress monitoring services...');
      
      // Stop all services
      this.speechService.stopListening();
      this.audioService.stopAnalysis();

      // Clear any pending verifications
      this.verificationService.stopVerification();

      // Reset state
      this.updateState({
        status: 'inactive',
        isListening: false,
        isAnalyzing: false,
        errorMessage: undefined
      });

      console.log('✅ Distress detection monitoring stopped');

    } catch (error) {
      console.error('Error stopping distress detection:', error);
      this.updateState({ 
        status: 'error', 
        errorMessage: 'Failed to stop monitoring properly' 
      });
    }
  }

  /**
   * Completely destroy all services and clean up resources
   */
  destroy(): void {
    try {
      console.log('🗑️ Destroying distress detection manager...');
      
      this.stopMonitoring();
      
      // Destroy services
      if (this.speechService && typeof this.speechService.destroy === 'function') {
        this.speechService.destroy();
      }
      
      // Clear callbacks
      this.stateChangeCallbacks = [];
      this.verificationCallbacks = [];
      
      console.log('✅ Distress detection manager destroyed');
      
    } catch (error) {
      console.error('Error destroying distress detection manager:', error);
    }
  }

  /**
   * Update detection settings and reconfigure services
   */
  updateSettings(newSettings: DistressSettings): void {
    const wasActive = this.state.status === 'active';
    
    // Stop monitoring if active
    if (wasActive) {
      this.stopMonitoring();
    }

    // Update settings
    this.settings = { ...newSettings };
    this.confidenceThreshold = newSettings.nlpProcessing.confidenceThreshold;

    // Update service configurations
    this.speechService.updateSettings({
      language: newSettings.speechRecognition.language,
      continuous: newSettings.speechRecognition.continuousMode
    });

    this.audioService.updateSettings({
      volumeThreshold: newSettings.audioAnalysis.volumeThreshold,
      spikeDetection: newSettings.audioAnalysis.spikeDetection,
      frequencyAnalysis: newSettings.audioAnalysis.frequencyAnalysis
    });

    this.classificationService.setProcessingMode(newSettings.nlpProcessing.mode);

    // Restart monitoring if it was active
    if (wasActive && newSettings.enabled) {
      this.startMonitoring().catch(error => {
        console.error('Failed to restart monitoring after settings update:', error);
      });
    }

    console.log('Distress detection settings updated');
  }

  /**
   * Handle distress detection from various sources
   * Requirements: 2.5, 3.5
   */
  handleDistressDetected(
    source: 'speech' | 'audio', 
    confidence: number, 
    metadata?: any
  ): void {
    // Add event to event handler for correlation and logging
    const distressEvent = this.eventHandler.addEvent(source, confidence, {
      transcript: metadata?.transcript,
      audioMetrics: metadata?.audioMetrics,
      location: metadata?.location,
      rawData: metadata
    });

    // Update state with latest detection
    this.updateState({ lastDetection: distressEvent });

    // Check if confidence meets threshold for verification
    if (confidence >= this.confidenceThreshold) {
      console.log(`Distress detected: ${source} with ${confidence}% confidence (above threshold)`);
    } else {
      console.log(`Distress detected but confidence (${confidence}) below threshold (${this.confidenceThreshold})`);
    }
  }

  /**
   * Get current detection state
   */
  getState(): DistressDetectionState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: DistressDetectionState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Unsubscribe from state changes
   */
  offStateChange(callback: (state: DistressDetectionState) => void): void {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Subscribe to distress detection events (for external verification handling)
   */
  onDistressDetected(callback: (context: DistressContext) => void): void {
    this.verificationCallbacks.push(callback);
  }

  /**
   * Unsubscribe from distress detection events
   */
  offDistressDetected(callback: (context: DistressContext) => void): void {
    const index = this.verificationCallbacks.indexOf(callback);
    if (index > -1) {
      this.verificationCallbacks.splice(index, 1);
    }
  }

  /**
   * Handle verification result from external verification dialog
   */
  public handleExternalVerificationResult(
    result: VerificationResult, 
    shouldTriggerSOS: boolean, 
    context: DistressContext
  ): void {
    this.handleVerificationResult(result, shouldTriggerSOS, context);
  }

  /**
   * Setup callbacks for all services
   */
  private setupServiceCallbacks(): void {
    // Speech recognition callbacks
    this.speechService.onResult((transcript: string, confidence: number) => {
      this.handleSpeechResult(transcript, confidence);
    });

    this.speechService.onError((error: Error) => {
      console.error('Speech recognition error:', error);
      this.handleServiceError('speech', error);
    });

    // Audio analysis callbacks
    this.audioService.onDistressDetected((confidence: number, metrics: any) => {
      this.handleDistressDetected('audio', confidence, { audioMetrics: metrics });
    });

    this.audioService.onError((error: Error) => {
      console.error('Audio analysis error:', error);
      this.handleServiceError('audio', error);
    });
  }

  /**
   * Handle speech recognition results
   */
  private async handleSpeechResult(transcript: string, confidence: number): void {
    try {
      console.log(`🎤 Speech detected: "${transcript}" (confidence: ${confidence}%)`);
      
      // Classify the speech for distress content
      const analysis: DistressAnalysis = await this.classificationService.analyzeText(transcript);
      
      console.log(`🧠 Analysis result:`, {
        isDistress: analysis.isDistress,
        confidence: analysis.confidence,
        detectedPhrases: analysis.detectedPhrases,
        sentiment: analysis.sentiment
      });
      
      if (analysis.isDistress) {
        // Combine speech confidence with classification confidence
        const combinedConfidence = Math.min(100, (confidence + analysis.confidence) / 2);
        
        console.log(`🚨 DISTRESS DETECTED! Combined confidence: ${combinedConfidence}%`);
        
        this.handleDistressDetected('speech', combinedConfidence, {
          transcript,
          analysis,
          detectedPhrases: analysis.detectedPhrases
        });
      } else {
        console.log(`✅ No distress detected in: "${transcript}"`);
      }
    } catch (error) {
      console.error('Error processing speech result:', error);
    }
  }

  /**
   * Setup event handler callbacks for correlation and verification triggering
   * Requirements: 2.5, 3.5, 4.1
   */
  private setupEventHandlerCallbacks(): void {
    // Listen for event correlations to trigger verification
    this.eventHandler.onCorrelation((correlation: DetectionCorrelation) => {
      console.log(`Event correlation detected with ${correlation.combinedConfidence}% confidence`);
      
      if (correlation.combinedConfidence >= this.confidenceThreshold) {
        const context: DistressContext = {
          detectionMethod: 'combined',
          confidence: correlation.combinedConfidence,
          timestamp: correlation.primaryEvent.timestamp,
          transcript: correlation.primaryEvent.transcript,
          audioData: undefined // Could be added if needed
        };

        this.triggerVerification(context);
      }
    });

    // Listen for individual high-confidence events
    this.eventHandler.onEvent((event: DistressEvent) => {
      if (event.confidence >= this.confidenceThreshold && event.detectionMethod !== 'combined') {
        // Check if this event will be correlated (wait a brief moment)
        setTimeout(() => {
          const correlations = this.eventHandler.getActiveCorrelations();
          const isCorrelated = correlations.some(c => 
            c.correlatedEvents.some(e => e.id === event.id)
          );

          // Only trigger verification if not part of a correlation
          if (!isCorrelated) {
            const context: DistressContext = {
              detectionMethod: event.detectionMethod,
              confidence: event.confidence,
              timestamp: event.timestamp,
              transcript: event.transcript,
              audioData: undefined
            };

            this.triggerVerification(context);
          }
        }, 1000); // Wait 1 second for potential correlations
      }
    });
  }

  /**
   * Trigger verification dialog with timeout handling
   * Requirements: 4.1
   */
  private triggerVerification(context: DistressContext): void {
    console.log(`Triggering verification for ${context.detectionMethod} detection with ${context.confidence}% confidence`);

    // If external callbacks are registered, use them instead of internal verification
    if (this.verificationCallbacks.length > 0) {
      this.verificationCallbacks.forEach(callback => callback(context));
      return;
    }

    // Fallback to internal verification service
    this.verificationService.startVerification(
      context,
      this.settings.verification.timeoutSeconds,
      (result: VerificationResult, shouldTriggerSOS: boolean) => {
        this.handleVerificationResult(result, shouldTriggerSOS, context);
      }
    );
  }

  /**
   * Handle verification dialog results
   */
  private handleVerificationResult(
    result: VerificationResult, 
    shouldTriggerSOS: boolean, 
    context: DistressContext
  ): void {
    // Update the event in the event handler
    if (this.state.lastDetection) {
      const userResponse = result.action === 'confirm' ? 'confirmed' : 
                          result.action === 'dismiss' ? 'dismissed' : 'timeout';
      
      this.eventHandler.updateEvent(this.state.lastDetection.id, {
        userResponse,
        sosTriggered: shouldTriggerSOS
      });

      // Update local state
      this.state.lastDetection.userResponse = userResponse;
      this.state.lastDetection.sosTriggered = shouldTriggerSOS;
    }

    if (shouldTriggerSOS) {
      this.triggerEmergencyResponse(context);
    }

    // Notify state change
    this.notifyStateChange();
  }

  /**
   * Trigger emergency response using the EmergencyResponseHandler
   * Requirements: 5.1, 5.2, 5.5
   */
  private async triggerEmergencyResponse(context: DistressContext): Promise<void> {
    try {
      console.log('EMERGENCY: Triggering SOS response for distress detection', {
        method: context.detectionMethod,
        confidence: context.confidence,
        timestamp: context.timestamp
      });

      // Import and use the emergency response handler
      const { emergencyResponseHandler } = await import('./EmergencyResponseHandler');
      
      // Log the distress event
      if (this.state.lastDetection) {
        emergencyResponseHandler.logDistressEvent(this.state.lastDetection);
      }

      // Trigger SOS with distress context
      await emergencyResponseHandler.triggerSOS(context);

      // Notify emergency contacts with distress details
      await emergencyResponseHandler.notifyEmergencyContacts(context);

      // Activate location sharing
      await emergencyResponseHandler.activateLocationSharing(context);

      console.log('✅ Emergency response triggered successfully');

    } catch (error) {
      console.error('❌ Failed to trigger emergency response:', error);
      
      // Update state with error
      this.updateState({
        status: 'error',
        errorMessage: `Emergency response failed: ${error.message}`
      });

      // Still try to show some kind of fallback notification to user
      alert(`Emergency response failed: ${error.message}. Please manually contact emergency services if needed.`);
    }
  }

  /**
   * Setup error handling and recovery
   */
  private setupErrorHandling(): void {
    // Register recovery callbacks with error handling service
    errorHandlingService.onRecovery(async (service: string, strategy: RecoveryStrategy) => {
      return this.executeServiceRecovery(service, strategy);
    });
  }

  /**
   * Execute service-specific recovery strategies
   */
  private async executeServiceRecovery(service: string, strategy: RecoveryStrategy): Promise<boolean> {
    try {
      switch (service) {
        case 'speech':
          return await this.recoverSpeechService(strategy);
        case 'audio':
          return await this.recoverAudioService(strategy);
        case 'classification':
          return await this.recoverClassificationService(strategy);
        case 'verification':
          return await this.recoverVerificationService(strategy);
        case 'permissions':
          return await this.recoverPermissionsService(strategy);
        default:
          console.warn(`Unknown service for recovery: ${service}`);
          return false;
      }
    } catch (error) {
      console.error(`Recovery failed for ${service}:`, error);
      return false;
    }
  }

  /**
   * Recover speech recognition service
   */
  private async recoverSpeechService(strategy: RecoveryStrategy): Promise<boolean> {
    switch (strategy) {
      case RecoveryStrategy.RESTART_SERVICE:
        try {
          this.speechService.stopListening();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.speechService.initialize();
          this.speechService.startListening();
          return true;
        } catch (error) {
          return false;
        }

      case RecoveryStrategy.GRACEFUL_DEGRADATION:
        // Disable speech recognition, continue with audio only
        this.settings.speechRecognition.enabled = false;
        this.updateState({ isListening: false });
        return true;

      default:
        return false;
    }
  }

  /**
   * Recover audio analysis service
   */
  private async recoverAudioService(strategy: RecoveryStrategy): Promise<boolean> {
    switch (strategy) {
      case RecoveryStrategy.RESTART_SERVICE:
        try {
          this.audioService.stopAnalysis();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.audioService.initialize();
          this.audioService.startAnalysis();
          return true;
        } catch (error) {
          return false;
        }

      case RecoveryStrategy.GRACEFUL_DEGRADATION:
        // Disable audio analysis, continue with speech only
        this.settings.audioAnalysis.enabled = false;
        this.updateState({ isAnalyzing: false });
        return true;

      default:
        return false;
    }
  }

  /**
   * Recover classification service
   */
  private async recoverClassificationService(strategy: RecoveryStrategy): Promise<boolean> {
    switch (strategy) {
      case RecoveryStrategy.FALLBACK:
        // Switch to local processing if API fails
        this.settings.nlpProcessing.mode = 'local';
        this.classificationService.setProcessingMode('local');
        return true;

      case RecoveryStrategy.RETRY:
        // Reset API client
        try {
          this.classificationService.setProcessingMode(this.settings.nlpProcessing.mode);
          return true;
        } catch (error) {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Recover verification service
   */
  private async recoverVerificationService(strategy: RecoveryStrategy): Promise<boolean> {
    switch (strategy) {
      case RecoveryStrategy.RESTART_SERVICE:
        this.verificationService.stopVerification();
        return true;

      case RecoveryStrategy.EMERGENCY_FALLBACK:
        // Show manual SOS if verification fails
        this.showManualSOSFallback();
        return true;

      default:
        return false;
    }
  }

  /**
   * Recover permissions service
   */
  private async recoverPermissionsService(strategy: RecoveryStrategy): Promise<boolean> {
    switch (strategy) {
      case RecoveryStrategy.MANUAL_INTERVENTION:
        // Request permissions again
        try {
          const hasPermissions = await this.permissionsManager.requestMicrophonePermission();
          return hasPermissions;
        } catch (error) {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Handle service errors with comprehensive error reporting
   */
  private handleServiceError(service: string, error: Error): void {
    // Determine error type based on error message and service
    let errorType: ErrorType;
    
    if (error.message.includes('permission')) {
      errorType = ErrorType.PERMISSION_DENIED;
    } else if (error.message.includes('not supported')) {
      errorType = ErrorType.BROWSER_UNSUPPORTED;
    } else if (error.message.includes('microphone')) {
      errorType = ErrorType.MICROPHONE_UNAVAILABLE;
    } else if (service === 'speech') {
      errorType = ErrorType.SPEECH_RECOGNITION_FAILED;
    } else if (service === 'audio') {
      errorType = ErrorType.AUDIO_ANALYSIS_FAILED;
    } else if (service === 'classification') {
      errorType = ErrorType.API_ERROR;
    } else {
      errorType = ErrorType.SERVICE_CRASHED;
    }

    // Report error to error handling service
    errorHandlingService.reportError(
      errorType,
      service,
      error.message,
      error,
      {
        settings: this.settings,
        state: this.state,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Show manual SOS fallback for critical failures
   */
  private showManualSOSFallback(): void {
    // Dispatch event for UI to show manual SOS button
    window.dispatchEvent(new CustomEvent('show-manual-sos-fallback', {
      detail: {
        reason: 'Distress detection system failure',
        timestamp: new Date()
      }
    }));
  }



  /**
   * Update internal state and notify listeners
   */
  private updateState(updates: Partial<DistressDetectionState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateChange();
  }

  /**
   * Notify all state change listeners
   */
  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(this.getState());
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * Get detection metrics and statistics
   */
  public getDetectionMetrics() {
    return this.eventHandler.getMetrics(24 * 60 * 60 * 1000); // Last 24 hours
  }

  /**
   * Get recent detection events for debugging
   */
  public getRecentEvents(limit: number = 10): DistressEvent[] {
    return this.eventHandler.getRecentEvents(limit);
  }

  /**
   * Get active correlations between detection events
   */
  public getActiveCorrelations() {
    return this.eventHandler.getActiveCorrelations();
  }

  /**
   * Filter detection events based on criteria
   */
  public filterEvents(filter: any) {
    return this.eventHandler.filterEvents(filter);
  }

  /**
   * Export detection events for analysis
   */
  public exportEvents(format: 'json' | 'csv' = 'json'): string {
    return this.eventHandler.exportEvents(format);
  }

  /**
   * Cleanup old detection events
   */
  public cleanupOldEvents(maxAge?: number): void {
    this.eventHandler.cleanup(maxAge);
  }
}