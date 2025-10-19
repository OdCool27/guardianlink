/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Speech recognition engine interface for converting speech to text
 * Manages continuous listening and handles Web Speech API interactions
 */
export interface SpeechRecognitionEngine {
  /**
   * Initialize the speech recognition engine
   * @throws Error if Web Speech API is not supported or permissions denied
   */
  initialize(): Promise<void>;

  /**
   * Start continuous speech recognition
   */
  startListening(): void;

  /**
   * Stop speech recognition
   */
  stopListening(): void;

  /**
   * Check if the engine is currently listening
   */
  isListening(): boolean;

  /**
   * Set callback for speech recognition results
   * @param callback Function to call with transcribed text
   */
  onResult(callback: (transcript: string, confidence: number) => void): void;

  /**
   * Set callback for speech recognition errors
   * @param callback Function to call when errors occur
   */
  onError(callback: (error: Error) => void): void;

  /**
   * Set callback for speech recognition state changes
   * @param callback Function to call when listening state changes
   */
  onStateChange(callback: (isListening: boolean) => void): void;

  /**
   * Update recognition settings
   * @param settings Recognition configuration
   */
  updateSettings(settings: {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  }): void;

  /**
   * Clean up resources and stop recognition
   */
  destroy(): void;
}