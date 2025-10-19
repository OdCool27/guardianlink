/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference path="../types/web-speech-api.d.ts" />

import { SpeechRecognitionEngine } from '../interfaces/SpeechRecognitionEngine';
import { getSpeechRecognitionConstructor, isSpeechRecognitionSupported } from '../utils/browser-support';
import { 
  processSpeechResult, 
  SpeechProcessingConfig, 
  getDistressDetectionConfig,
  ProcessedSpeech 
} from '../utils/speech-processing';

/**
 * Web Speech API wrapper with continuous listening and error recovery
 */
export class SpeechRecognitionService implements SpeechRecognitionEngine {
  private recognition: SpeechRecognition | null = null;
  private isInitialized = false;
  private listening = false;
  private restartAttempts = 0;
  private maxRestartAttempts = 5;
  private restartDelay = 1000; // Start with 1 second
  private restartTimeout: NodeJS.Timeout | null = null;

  // Callbacks
  private resultCallback: ((transcript: string, confidence: number) => void) | null = null;
  private processedResultCallback: ((result: ProcessedSpeech) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private stateChangeCallback: ((isListening: boolean) => void) | null = null;

  // Settings
  private settings = {
    language: 'en-US',
    continuous: true,
    interimResults: true, // Enable interim results for better responsiveness
  };

  // Speech processing configuration
  private processingConfig: SpeechProcessingConfig = getDistressDetectionConfig();

  /**
   * Initialize the speech recognition engine
   */
  async initialize(): Promise<void> {
    if (!isSpeechRecognitionSupported()) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionConstructor) {
      throw new Error('Unable to access Speech Recognition API');
    }

    try {
      this.recognition = new SpeechRecognitionConstructor();
      this.setupRecognition();
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize speech recognition: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set up speech recognition event handlers and configuration
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    // Configure recognition settings
    this.recognition.continuous = this.settings.continuous;
    this.recognition.interimResults = this.settings.interimResults;
    this.recognition.lang = this.settings.language;

    // Handle successful recognition results
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      try {
        const results = event.results;
        const lastResult = results[results.length - 1];
        
        const transcript = lastResult[0].transcript.trim();
        const confidence = lastResult[0].confidence || 0;
        const isFinal = lastResult.isFinal;
        
        console.log(`🎙️ Speech Recognition ${isFinal ? 'Final' : 'Interim'}: "${transcript}" (confidence: ${confidence})`);
        
        // Show visual feedback in browser (for debugging)
        if (window.showSpeechFeedback && transcript) {
          window.showSpeechFeedback(transcript, confidence, isFinal);
        }
        
        if (transcript) {
          // Process the speech result with filtering and cleanup
          const processedResult = processSpeechResult(transcript, confidence, this.processingConfig);
          
          console.log(`📝 Processed Result:`, processedResult);
          
          // Only process final results for distress detection to avoid false positives
          if (isFinal) {
            // Call raw result callback if set
            if (this.resultCallback) {
              this.resultCallback(transcript, confidence);
            }
            
            // Call processed result callback if set
            if (this.processedResultCallback) {
              this.processedResultCallback(processedResult);
            }
          }
        }
      } catch (error) {
        this.handleError(new Error(`Error processing speech result: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    // Handle recognition start
    this.recognition.onstart = () => {
      console.log('🎙️ Speech recognition started successfully');
      this.listening = true;
      this.restartAttempts = 0; // Reset restart attempts on successful start
      this.notifyStateChange();
    };

    // Handle recognition end
    this.recognition.onend = () => {
      console.log('🎙️ Speech recognition ended');
      this.listening = false;
      this.notifyStateChange();
      
      // Auto-restart if we should be listening (unless manually stopped)
      if (this.isInitialized && this.settings.continuous && this.restartAttempts < this.maxRestartAttempts) {
        console.log('🔄 Auto-restarting speech recognition...');
        this.scheduleRestart();
      }
    };

    // Handle recognition errors
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log(`🚨 Speech recognition error: ${event.error}`);
      const error = this.createErrorFromEvent(event);
      
      // Don't treat 'no-speech' as a critical error in continuous mode
      if (event.error === 'no-speech' && this.settings.continuous) {
        console.log('ℹ️ No speech detected (normal in continuous mode)');
        return;
      }
      
      // Handle permission errors specially
      if (event.error === 'not-allowed') {
        console.error('❌ Microphone permission denied');
        this.handleError(new Error('Microphone permission denied. Please allow microphone access to use speech recognition.'));
        return;
      }
      
      console.error('❌ Speech recognition error:', error);
      this.handleError(error);
    };
  }

  /**
   * Create a descriptive error from a speech recognition error event
   */
  private createErrorFromEvent(event: SpeechRecognitionErrorEvent): Error {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected',
      'aborted': 'Speech recognition was aborted',
      'audio-capture': 'Audio capture failed',
      'network': 'Network error occurred',
      'not-allowed': 'Microphone permission denied',
      'service-not-allowed': 'Speech recognition service not allowed',
      'bad-grammar': 'Grammar error in speech recognition',
      'language-not-supported': 'Language not supported',
    };

    const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
    return new Error(message);
  }

  /**
   * Handle errors with automatic restart logic
   */
  private handleError(error: Error): void {
    if (this.errorCallback) {
      this.errorCallback(error);
    }

    // Attempt restart for recoverable errors
    if (this.shouldAttemptRestart(error)) {
      this.scheduleRestart();
    }
  }

  /**
   * Determine if we should attempt to restart after an error
   */
  private shouldAttemptRestart(error: Error): boolean {
    const nonRecoverableErrors = [
      'Microphone permission denied',
      'Speech recognition service not allowed',
      'Language not supported'
    ];

    return (
      this.isInitialized &&
      this.settings.continuous &&
      this.restartAttempts < this.maxRestartAttempts &&
      !nonRecoverableErrors.some(msg => error.message.includes(msg))
    );
  }

  /**
   * Schedule a restart with exponential backoff
   */
  private scheduleRestart(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    this.restartAttempts++;
    const delay = Math.min(this.restartDelay * Math.pow(2, this.restartAttempts - 1), 30000); // Max 30 seconds

    this.restartTimeout = setTimeout(() => {
      if (this.isInitialized && !this.listening) {
        try {
          this.startListening();
        } catch (error) {
          this.handleError(new Error(`Failed to restart speech recognition: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      }
    }, delay);
  }

  /**
   * Start continuous speech recognition
   */
  startListening(): void {
    console.log('🎤 startListening() called');
    
    if (!this.isInitialized || !this.recognition) {
      console.error('❌ Speech recognition not initialized');
      throw new Error('Speech recognition not initialized');
    }

    if (this.listening) {
      console.log('ℹ️ Already listening, skipping start');
      return; // Already listening
    }

    try {
      console.log('🚀 Starting speech recognition...');
      this.recognition.start();
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
      throw new Error(`Failed to start speech recognition: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop speech recognition
   */
  stopListening(): void {
    console.log('🛑 Stopping speech recognition...');
    
    // Clear any pending restart
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    // Disable continuous mode to prevent auto-restart
    this.settings.continuous = false;
    
    // Stop the recognition
    if (this.recognition && this.listening) {
      this.recognition.stop();
    }
    
    // Force update state
    this.listening = false;
    this.notifyStateChange();
    
    console.log('✅ Speech recognition stopped');
  }

  /**
   * Completely destroy the speech recognition instance
   */
  destroy(): void {
    console.log('🗑️ Destroying speech recognition...');
    
    this.stopListening();
    
    // Clear all callbacks
    this.resultCallback = null;
    this.processedResultCallback = null;
    this.errorCallback = null;
    this.stateChangeCallback = null;
    
    // Destroy recognition instance
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onstart = null;
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition = null;
    }
    
    this.isInitialized = false;
    this.listening = false;
    this.restartAttempts = 0;
    
    console.log('✅ Speech recognition destroyed');
  }

  /**
   * Check if the engine is currently listening
   */
  isListening(): boolean {
    return this.listening;
  }

  /**
   * Set callback for speech recognition results (raw)
   */
  onResult(callback: (transcript: string, confidence: number) => void): void {
    this.resultCallback = callback;
  }

  /**
   * Set callback for processed speech recognition results
   */
  onProcessedResult(callback: (result: ProcessedSpeech) => void): void {
    this.processedResultCallback = callback;
  }

  /**
   * Set callback for speech recognition errors
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Set callback for speech recognition state changes
   */
  onStateChange(callback: (isListening: boolean) => void): void {
    this.stateChangeCallback = callback;
  }

  /**
   * Update speech processing configuration
   */
  updateProcessingConfig(config: Partial<SpeechProcessingConfig>): void {
    this.processingConfig = { ...this.processingConfig, ...config };
  }

  /**
   * Get current processing configuration
   */
  getProcessingConfig(): SpeechProcessingConfig {
    return { ...this.processingConfig };
  }

  /**
   * Update recognition settings
   */
  updateSettings(settings: {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  }): void {
    const wasListening = this.listening;
    
    // Stop if currently listening
    if (wasListening) {
      this.stopListening();
    }

    // Update settings
    if (settings.language !== undefined) {
      this.settings.language = settings.language;
    }
    if (settings.continuous !== undefined) {
      this.settings.continuous = settings.continuous;
    }
    if (settings.interimResults !== undefined) {
      this.settings.interimResults = settings.interimResults;
    }

    // Reconfigure recognition if initialized
    if (this.recognition) {
      this.recognition.continuous = this.settings.continuous;
      this.recognition.interimResults = this.settings.interimResults;
      this.recognition.lang = this.settings.language;
    }

    // Restart if was listening
    if (wasListening && this.isInitialized) {
      setTimeout(() => this.startListening(), 100);
    }
  }

  /**
   * Notify state change listeners
   */
  private notifyStateChange(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback(this.listening);
    }
  }

  /**
   * Clean up resources and stop recognition
   */
  destroy(): void {
    this.stopListening();
    
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    this.recognition = null;
    this.isInitialized = false;
    this.resultCallback = null;
    this.processedResultCallback = null;
    this.errorCallback = null;
    this.stateChangeCallback = null;
  }
}