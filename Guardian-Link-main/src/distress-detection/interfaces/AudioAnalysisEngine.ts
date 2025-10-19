/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Audio analysis engine interface for detecting distress patterns in audio
 * Uses Web Audio API for real-time audio processing and analysis
 */
export interface AudioAnalysisEngine {
  /**
   * Initialize the audio analysis engine
   * @throws Error if Web Audio API is not supported or microphone access denied
   */
  initialize(): Promise<void>;

  /**
   * Start real-time audio analysis
   */
  startAnalysis(): void;

  /**
   * Stop audio analysis
   */
  stopAnalysis(): void;

  /**
   * Check if the engine is currently analyzing audio
   */
  isAnalyzing(): boolean;

  /**
   * Set callback for distress detection in audio
   * @param callback Function to call when distress patterns are detected
   */
  onDistressDetected(callback: (confidence: number, audioMetrics: AudioMetrics) => void): void;

  /**
   * Set callback for audio analysis errors
   * @param callback Function to call when errors occur
   */
  onError(callback: (error: Error) => void): void;

  /**
   * Update analysis settings
   * @param settings Audio analysis configuration
   */
  updateSettings(settings: {
    volumeThreshold?: number;
    spikeDetection?: boolean;
    frequencyAnalysis?: boolean;
    sensitivity?: number;
  }): void;

  /**
   * Get current audio metrics
   */
  getCurrentMetrics(): AudioMetrics;

  /**
   * Clean up resources and stop analysis
   */
  destroy(): void;
}

export interface AudioMetrics {
  currentVolume: number;
  peakVolume: number;
  averageVolume: number;
  frequencyData: Float32Array;
  timestamp: Date;
}