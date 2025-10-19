/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressAnalysis } from '../types';

/**
 * Service for analyzing text content to detect distress indicators
 * Supports both local NLP processing and external AI API integration
 */
export interface DistressClassificationService {
  /**
   * Analyze text for distress-related content
   * @param text The text to analyze
   * @returns Promise resolving to distress analysis results
   */
  analyzeText(text: string): Promise<DistressAnalysis>;

  /**
   * Set the processing mode (local or API-based)
   * @param mode Processing mode to use
   */
  setProcessingMode(mode: 'local' | 'api'): void;

  /**
   * Update classification settings
   * @param settings Classification configuration
   */
  updateSettings(settings: {
    confidenceThreshold?: number;
    customPhrases?: string[];
    apiEndpoint?: string;
    apiKey?: string;
  }): void;

  /**
   * Add custom distress phrases to the detection dictionary
   * @param phrases Array of phrases to add
   */
  addCustomPhrases(phrases: string[]): void;

  /**
   * Remove custom distress phrases from the detection dictionary
   * @param phrases Array of phrases to remove
   */
  removeCustomPhrases(phrases: string[]): void;

  /**
   * Get the current list of monitored distress phrases
   */
  getDistressPhrases(): string[];

  /**
   * Check if the service is ready for analysis
   */
  isReady(): boolean;

  /**
   * Initialize the service (load models, validate API keys, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Clean up resources
   */
  destroy(): void;
}