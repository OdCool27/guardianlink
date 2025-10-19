/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VerificationResult } from '../types';

/**
 * Interface for the distress verification dialog component
 * Handles user confirmation before triggering emergency protocols
 */
export interface VerificationDialog {
  /**
   * Show the verification dialog to the user
   * @param detectionSource The source of distress detection
   * @param confidence Detection confidence score
   * @param timeoutSeconds Seconds before auto-confirmation
   * @returns Promise resolving to user's response or timeout
   */
  show(
    detectionSource: string, 
    confidence: number, 
    timeoutSeconds?: number
  ): Promise<VerificationResult>;

  /**
   * Hide the verification dialog
   */
  hide(): void;

  /**
   * Check if the dialog is currently visible
   */
  isVisible(): boolean;

  /**
   * Update dialog settings
   * @param settings Dialog configuration
   */
  updateSettings(settings: {
    timeoutSeconds?: number;
    showCountdown?: boolean;
    requireExplicitConfirmation?: boolean;
  }): void;

  /**
   * Set callback for dialog events
   * @param event Event type to listen for
   * @param callback Function to call when event occurs
   */
  on(event: 'show' | 'hide' | 'confirm' | 'dismiss' | 'timeout', callback: () => void): void;

  /**
   * Remove event callback
   * @param event Event type
   * @param callback Function to remove
   */
  off(event: 'show' | 'hide' | 'confirm' | 'dismiss' | 'timeout', callback: () => void): void;
}