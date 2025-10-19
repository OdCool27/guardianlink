/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmergencyResponseHandler, EmergencyEvent } from '../interfaces/EmergencyResponseHandler';
import { DistressContext, DistressEvent } from '../types';
import { sosAPI } from '../../../api';

/**
 * Implementation of emergency response handler for distress detection
 * Integrates with existing SOS system and manages emergency protocols
 */
export class EmergencyResponseHandlerImpl implements EmergencyResponseHandler {
  private eventCallbacks: ((event: EmergencyEvent) => void)[] = [];
  private currentSession: any = null;
  private isActive: boolean = false;

  /**
   * Trigger SOS emergency response with distress context
   */
  async triggerSOS(context: DistressContext): Promise<void> {
    try {
      // Get current location
      const location = await this.getCurrentLocation();
      
      // Call the distress-specific SOS API
      const response = await sosAPI.activateSOSWithDistress(
        location.latitude,
        location.longitude,
        {
          detectionMethod: context.detectionMethod,
          confidence: context.confidence,
          timestamp: context.timestamp,
          transcript: context.transcript,
          audioMetrics: context.audioMetrics
        }
      );

      // Store session information
      this.currentSession = {
        sessionId: response.sessionId,
        startTime: new Date(),
        context: context,
        location: location
      };
      this.isActive = true;

      // Emit emergency event
      this.emitEvent({
        type: 'sos_triggered',
        timestamp: new Date(),
        context: context,
        details: {
          sessionId: response.sessionId,
          location: location
        }
      });

      console.log('✅ Distress SOS triggered successfully', {
        sessionId: response.sessionId,
        detectionMethod: context.detectionMethod,
        confidence: context.confidence
      });

    } catch (error) {
      console.error('❌ Failed to trigger distress SOS:', error);
      throw new Error(`Failed to trigger emergency response: ${error.message}`);
    }
  }

  /**
   * Log distress detection event for audit and analysis
   */
  logDistressEvent(event: DistressEvent): void {
    try {
      // Store in localStorage for local audit trail
      const existingLogs = this.getStoredEvents();
      existingLogs.push({
        ...event,
        timestamp: event.timestamp.toISOString()
      });

      // Keep only last 100 events to prevent storage bloat
      const recentLogs = existingLogs.slice(-100);
      localStorage.setItem('distress_events_log', JSON.stringify(recentLogs));

      console.log('📝 Distress event logged:', {
        id: event.id,
        detectionMethod: event.detectionMethod,
        confidence: event.confidence,
        sosTriggered: event.sosTriggered
      });

    } catch (error) {
      console.error('❌ Failed to log distress event:', error);
    }
  }

  /**
   * Send notifications to emergency contacts with distress details
   */
  async notifyEmergencyContacts(context: DistressContext, contactIds?: number[]): Promise<void> {
    try {
      // The notification is handled by the backend when SOS is triggered
      // This method can be used for additional frontend notifications if needed
      
      this.emitEvent({
        type: 'contacts_notified',
        timestamp: new Date(),
        context: context,
        details: {
          contactIds: contactIds
        }
      });

      console.log('📧 Emergency contacts notified', {
        detectionMethod: context.detectionMethod,
        contactIds: contactIds
      });

    } catch (error) {
      console.error('❌ Failed to notify emergency contacts:', error);
      throw new Error(`Failed to notify contacts: ${error.message}`);
    }
  }

  /**
   * Activate location sharing for emergency response
   */
  async activateLocationSharing(context: DistressContext): Promise<void> {
    try {
      // Location sharing is automatically activated when SOS is triggered
      // The backend creates a tracking session that can be shared
      
      this.emitEvent({
        type: 'location_shared',
        timestamp: new Date(),
        context: context,
        details: {
          sessionId: this.currentSession?.sessionId
        }
      });

      console.log('📍 Location sharing activated for emergency response');

    } catch (error) {
      console.error('❌ Failed to activate location sharing:', error);
      throw new Error(`Failed to activate location sharing: ${error.message}`);
    }
  }

  /**
   * Check if emergency response is currently active
   */
  isEmergencyActive(): boolean {
    return this.isActive && this.currentSession !== null;
  }

  /**
   * Get the current emergency session details
   */
  getCurrentEmergencySession(): any | null {
    return this.currentSession;
  }

  /**
   * Set callback for emergency response events
   */
  onEmergencyEvent(callback: (event: EmergencyEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove emergency event callback
   */
  offEmergencyEvent(callback: (event: EmergencyEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * End the current emergency session
   */
  endEmergencySession(): void {
    if (this.currentSession) {
      this.emitEvent({
        type: 'emergency_ended',
        timestamp: new Date(),
        context: this.currentSession.context,
        details: {
          sessionId: this.currentSession.sessionId,
          duration: Date.now() - this.currentSession.startTime.getTime()
        }
      });

      this.currentSession = null;
      this.isActive = false;
    }
  }

  /**
   * Get stored distress events from localStorage
   */
  private getStoredEvents(): any[] {
    try {
      const stored = localStorage.getItem('distress_events_log');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve stored events:', error);
      return [];
    }
  }

  /**
   * Get current location using Geolocation API
   */
  private async getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.warn('Failed to get current location:', error.message);
          // Fallback to default location (could be last known location)
          resolve({
            latitude: 0,
            longitude: 0,
            accuracy: 0
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  /**
   * Emit event to all registered callbacks
   */
  private emitEvent(event: EmergencyEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in emergency event callback:', error);
      }
    });
  }

  /**
   * Get emergency response statistics
   */
  getEmergencyStats(): {
    totalEvents: number;
    sosTriggered: number;
    falsePositives: number;
    lastEvent?: Date;
  } {
    const events = this.getStoredEvents();
    const sosEvents = events.filter(e => e.sosTriggered);
    const falsePositives = events.filter(e => e.userResponse === 'dismissed');
    
    return {
      totalEvents: events.length,
      sosTriggered: sosEvents.length,
      falsePositives: falsePositives.length,
      lastEvent: events.length > 0 ? new Date(events[events.length - 1].timestamp) : undefined
    };
  }

  /**
   * Clear stored event logs (for privacy/maintenance)
   */
  clearEventLogs(): void {
    localStorage.removeItem('distress_events_log');
    console.log('🗑️ Distress event logs cleared');
  }
}

// Export singleton instance
export const emergencyResponseHandler = new EmergencyResponseHandlerImpl();