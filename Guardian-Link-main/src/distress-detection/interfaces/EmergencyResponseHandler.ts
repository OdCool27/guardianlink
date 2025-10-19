/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressContext, DistressEvent } from '../types';

/**
 * Handler for emergency response actions when distress is confirmed
 * Integrates with existing SOS system and manages emergency protocols
 */
export interface EmergencyResponseHandler {
  /**
   * Trigger SOS emergency response with distress context
   * @param context Distress detection context and metadata
   * @returns Promise resolving to SOS activation result
   */
  triggerSOS(context: DistressContext): Promise<void>;

  /**
   * Log distress detection event for audit and analysis
   * @param event Distress event details
   */
  logDistressEvent(event: DistressEvent): void;

  /**
   * Send notifications to emergency contacts with distress details
   * @param context Distress context
   * @param contactIds Optional specific contact IDs to notify
   */
  notifyEmergencyContacts(context: DistressContext, contactIds?: number[]): Promise<void>;

  /**
   * Activate location sharing for emergency response
   * @param context Distress context
   */
  activateLocationSharing(context: DistressContext): Promise<void>;

  /**
   * Check if emergency response is currently active
   */
  isEmergencyActive(): boolean;

  /**
   * Get the current emergency session details
   */
  getCurrentEmergencySession(): any | null;

  /**
   * Set callback for emergency response events
   * @param callback Function to call when emergency events occur
   */
  onEmergencyEvent(callback: (event: EmergencyEvent) => void): void;

  /**
   * Remove emergency event callback
   * @param callback Function to remove
   */
  offEmergencyEvent(callback: (event: EmergencyEvent) => void): void;
}

export interface EmergencyEvent {
  type: 'sos_triggered' | 'contacts_notified' | 'location_shared' | 'emergency_ended';
  timestamp: Date;
  context: DistressContext;
  details?: any;
}