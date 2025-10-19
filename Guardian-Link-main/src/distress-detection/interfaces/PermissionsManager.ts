/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Manager for handling browser permissions required for distress detection
 * Manages microphone access and user privacy controls
 */
export interface PermissionsManager {
  /**
   * Request microphone permissions from the user
   * @returns Promise resolving to permission grant status
   */
  requestMicrophonePermission(): Promise<boolean>;

  /**
   * Check current microphone permission status
   * @returns Current permission state
   */
  getMicrophonePermissionStatus(): Promise<PermissionState>;

  /**
   * Monitor permission changes and notify callbacks
   * @param callback Function to call when permissions change
   */
  onPermissionChange(callback: (granted: boolean) => void): void;

  /**
   * Remove permission change callback
   * @param callback Function to remove
   */
  offPermissionChange(callback: (granted: boolean) => void): void;

  /**
   * Check if all required permissions are granted
   */
  hasRequiredPermissions(): Promise<boolean>;

  /**
   * Show permission request UI with explanation
   * @param reason Reason for requesting permissions
   */
  showPermissionRequest(reason: string): Promise<boolean>;

  /**
   * Get user-friendly permission status message
   */
  getPermissionStatusMessage(): string;

  /**
   * Handle permission denial and provide guidance
   */
  handlePermissionDenied(): void;
}

export type PermissionState = 'granted' | 'denied' | 'prompt';