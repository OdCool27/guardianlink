/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressSettings, DistressDetectionState } from '../types';

/**
 * Central coordinator for all distress detection activities
 * Manages the lifecycle of speech recognition and audio analysis services
 */
export interface DistressDetectionManager {
  /**
   * Initialize and start distress monitoring
   * @throws Error if permissions are not granted or initialization fails
   */
  startMonitoring(): Promise<void>;

  /**
   * Stop all distress monitoring activities
   */
  stopMonitoring(): void;

  /**
   * Update detection settings and reconfigure services
   * @param settings New distress detection settings
   */
  updateSettings(settings: DistressSettings): void;

  /**
   * Handle distress detection from various sources
   * @param source The detection source (speech or audio)
   * @param confidence Detection confidence score (0-100)
   * @param metadata Additional detection metadata
   */
  handleDistressDetected(
    source: 'speech' | 'audio', 
    confidence: number, 
    metadata?: any
  ): void;

  /**
   * Get current detection state
   */
  getState(): DistressDetectionState;

  /**
   * Subscribe to state changes
   * @param callback Function to call when state changes
   */
  onStateChange(callback: (state: DistressDetectionState) => void): void;

  /**
   * Unsubscribe from state changes
   * @param callback The callback function to remove
   */
  offStateChange(callback: (state: DistressDetectionState) => void): void;
}