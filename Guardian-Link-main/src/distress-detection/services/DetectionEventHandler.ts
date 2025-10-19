/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  DistressEvent, 
  DistressContext, 
  DistressDetectionState 
} from '../types';
import { generateId, saveToStorage, loadFromStorage } from '../utils/storage';

export interface DetectionEventFilter {
  minConfidence?: number;
  maxAge?: number; // milliseconds
  detectionMethods?: ('speech' | 'audio' | 'combined')[];
  sosTriggered?: boolean;
}

export interface DetectionCorrelation {
  primaryEvent: DistressEvent;
  correlatedEvents: DistressEvent[];
  combinedConfidence: number;
  timeSpan: number; // milliseconds between first and last event
}

export interface DetectionMetrics {
  totalEvents: number;
  recentEvents: number;
  averageConfidence: number;
  falsePositiveRate: number;
  responseTime: number; // average time to user response
  detectionsByMethod: Record<string, number>;
  sosTriggeredCount: number;
  correlationRate: number; // percentage of events that were correlated
}

/**
 * Service for handling distress detection events, aggregation, and filtering
 * Manages event correlation, logging, and metrics collection
 * Requirements: 2.5, 3.5, 4.1
 */
export class DetectionEventHandler {
  private events: DistressEvent[] = [];
  private correlationWindow = 5000; // 5 seconds
  private maxEventHistory = 1000;
  private storageKey = 'distress-detection-events';

  // Event filtering and correlation
  private activeCorrelations: Map<string, DetectionCorrelation> = new Map();
  private eventCallbacks: ((event: DistressEvent) => void)[] = [];
  private correlationCallbacks: ((correlation: DetectionCorrelation) => void)[] = [];

  constructor() {
    this.loadEventHistory();
  }

  /**
   * Add a new distress detection event
   * Requirements: 2.5, 3.5
   */
  addEvent(
    detectionMethod: 'speech' | 'audio',
    confidence: number,
    metadata?: {
      transcript?: string;
      audioMetrics?: any;
      location?: { latitude: number; longitude: number; accuracy: number };
      rawData?: any;
    }
  ): DistressEvent {
    const event: DistressEvent = {
      id: generateId(),
      timestamp: new Date(),
      detectionMethod,
      confidence,
      transcript: metadata?.transcript,
      audioMetrics: metadata?.audioMetrics,
      userResponse: 'confirmed', // Will be updated when user responds
      sosTriggered: false, // Will be updated if SOS is triggered
      location: metadata?.location
    };

    // Add to event history
    this.events.push(event);
    this.maintainEventHistoryLimit();

    // Check for correlations with recent events
    const correlation = this.findCorrelations(event);
    if (correlation) {
      this.handleCorrelation(correlation);
    }

    // Notify event listeners
    this.notifyEventListeners(event);

    // Persist to storage
    this.saveEventHistory();

    console.log('Detection event added:', {
      id: event.id,
      method: event.detectionMethod,
      confidence: event.confidence,
      hasCorrelation: !!correlation
    });

    return event;
  }

  /**
   * Update an existing event (e.g., when user responds to verification)
   */
  updateEvent(
    eventId: string, 
    updates: Partial<Pick<DistressEvent, 'userResponse' | 'sosTriggered'>>
  ): boolean {
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      return false;
    }

    this.events[eventIndex] = { ...this.events[eventIndex], ...updates };
    this.saveEventHistory();

    console.log('Detection event updated:', { eventId, updates });
    return true;
  }

  /**
   * Find correlations between the new event and recent events
   * Requirements: 2.5, 3.5
   */
  private findCorrelations(newEvent: DistressEvent): DetectionCorrelation | null {
    const cutoffTime = new Date(newEvent.timestamp.getTime() - this.correlationWindow);
    
    // Find recent events from different detection methods
    const recentEvents = this.events.filter(event => 
      event.id !== newEvent.id &&
      event.timestamp >= cutoffTime &&
      event.detectionMethod !== newEvent.detectionMethod
    );

    if (recentEvents.length === 0) {
      return null;
    }

    // Sort by confidence and take the best correlated event
    const bestCorrelatedEvent = recentEvents
      .sort((a, b) => b.confidence - a.confidence)[0];

    // Calculate combined confidence (weighted average with correlation bonus)
    const combinedConfidence = Math.min(100, 
      (newEvent.confidence + bestCorrelatedEvent.confidence) / 2 + 15 // 15% bonus for correlation
    );

    const timeSpan = Math.abs(
      newEvent.timestamp.getTime() - bestCorrelatedEvent.timestamp.getTime()
    );

    const correlation: DetectionCorrelation = {
      primaryEvent: newEvent.confidence >= bestCorrelatedEvent.confidence ? newEvent : bestCorrelatedEvent,
      correlatedEvents: [newEvent, bestCorrelatedEvent],
      combinedConfidence,
      timeSpan
    };

    return correlation;
  }

  /**
   * Handle detected correlation between events
   * Requirements: 2.5, 3.5, 4.1
   */
  private handleCorrelation(correlation: DetectionCorrelation): void {
    // Store active correlation
    this.activeCorrelations.set(correlation.primaryEvent.id, correlation);

    // Update primary event to reflect combined detection
    const primaryIndex = this.events.findIndex(e => e.id === correlation.primaryEvent.id);
    if (primaryIndex !== -1) {
      this.events[primaryIndex] = {
        ...this.events[primaryIndex],
        detectionMethod: 'combined',
        confidence: correlation.combinedConfidence
      };
    }

    // Notify correlation listeners
    this.notifyCorrelationListeners(correlation);

    console.log('Event correlation detected:', {
      primaryId: correlation.primaryEvent.id,
      correlatedCount: correlation.correlatedEvents.length,
      combinedConfidence: correlation.combinedConfidence,
      timeSpan: correlation.timeSpan
    });
  }

  /**
   * Filter events based on criteria
   */
  filterEvents(filter: DetectionEventFilter): DistressEvent[] {
    return this.events.filter(event => {
      // Confidence filter
      if (filter.minConfidence !== undefined && event.confidence < filter.minConfidence) {
        return false;
      }

      // Age filter
      if (filter.maxAge !== undefined) {
        const age = Date.now() - event.timestamp.getTime();
        if (age > filter.maxAge) {
          return false;
        }
      }

      // Detection method filter
      if (filter.detectionMethods && !filter.detectionMethods.includes(event.detectionMethod)) {
        return false;
      }

      // SOS trigger filter
      if (filter.sosTriggered !== undefined && event.sosTriggered !== filter.sosTriggered) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get aggregated detection metrics
   * Requirements: 2.5, 3.5
   */
  getMetrics(timeWindow?: number): DetectionMetrics {
    const cutoffTime = timeWindow ? new Date(Date.now() - timeWindow) : new Date(0);
    const relevantEvents = this.events.filter(e => e.timestamp >= cutoffTime);

    const totalEvents = relevantEvents.length;
    const recentEvents = this.events.filter(
      e => Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    ).length;

    const averageConfidence = totalEvents > 0 
      ? relevantEvents.reduce((sum, e) => sum + e.confidence, 0) / totalEvents 
      : 0;

    // Calculate false positive rate (dismissed events / total events)
    const dismissedEvents = relevantEvents.filter(e => e.userResponse === 'dismissed').length;
    const falsePositiveRate = totalEvents > 0 ? (dismissedEvents / totalEvents) * 100 : 0;

    // Calculate average response time for events with user responses
    const respondedEvents = relevantEvents.filter(e => 
      e.userResponse === 'confirmed' || e.userResponse === 'dismissed'
    );
    const responseTime = respondedEvents.length > 0
      ? respondedEvents.reduce((sum, e) => {
          // Estimate response time (this would be more accurate with actual response timestamps)
          return sum + 5000; // Placeholder: assume 5 second average response time
        }, 0) / respondedEvents.length
      : 0;

    // Count events by detection method
    const detectionsByMethod = relevantEvents.reduce((counts, event) => {
      counts[event.detectionMethod] = (counts[event.detectionMethod] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const sosTriggeredCount = relevantEvents.filter(e => e.sosTriggered).length;

    // Calculate correlation rate
    const correlatedEvents = relevantEvents.filter(e => e.detectionMethod === 'combined').length;
    const correlationRate = totalEvents > 0 ? (correlatedEvents / totalEvents) * 100 : 0;

    return {
      totalEvents,
      recentEvents,
      averageConfidence,
      falsePositiveRate,
      responseTime,
      detectionsByMethod,
      sosTriggeredCount,
      correlationRate
    };
  }

  /**
   * Get recent events for display or debugging
   */
  getRecentEvents(limit: number = 20): DistressEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get events within a specific time range
   */
  getEventsInRange(startTime: Date, endTime: Date): DistressEvent[] {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Get active correlations
   */
  getActiveCorrelations(): DetectionCorrelation[] {
    return Array.from(this.activeCorrelations.values());
  }

  /**
   * Clear old events and correlations
   */
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): void { // Default: 7 days
    const cutoffTime = new Date(Date.now() - maxAge);
    
    // Remove old events
    const initialCount = this.events.length;
    this.events = this.events.filter(event => event.timestamp >= cutoffTime);
    
    // Remove old correlations
    for (const [id, correlation] of this.activeCorrelations.entries()) {
      if (correlation.primaryEvent.timestamp < cutoffTime) {
        this.activeCorrelations.delete(id);
      }
    }

    const removedCount = initialCount - this.events.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old detection events`);
      this.saveEventHistory();
    }
  }

  /**
   * Subscribe to new detection events
   */
  onEvent(callback: (event: DistressEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Subscribe to event correlations
   */
  onCorrelation(callback: (correlation: DetectionCorrelation) => void): void {
    this.correlationCallbacks.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  offEvent(callback: (event: DistressEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Unsubscribe from correlations
   */
  offCorrelation(callback: (correlation: DetectionCorrelation) => void): void {
    const index = this.correlationCallbacks.indexOf(callback);
    if (index > -1) {
      this.correlationCallbacks.splice(index, 1);
    }
  }

  /**
   * Notify event listeners
   */
  private notifyEventListeners(event: DistressEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  /**
   * Notify correlation listeners
   */
  private notifyCorrelationListeners(correlation: DetectionCorrelation): void {
    this.correlationCallbacks.forEach(callback => {
      try {
        callback(correlation);
      } catch (error) {
        console.error('Error in correlation callback:', error);
      }
    });
  }

  /**
   * Maintain event history size limit
   */
  private maintainEventHistoryLimit(): void {
    if (this.events.length > this.maxEventHistory) {
      const excess = this.events.length - this.maxEventHistory;
      this.events.splice(0, excess);
      console.log(`Removed ${excess} old events to maintain history limit`);
    }
  }

  /**
   * Save event history to persistent storage
   */
  private saveEventHistory(): void {
    try {
      const eventData = {
        events: this.events.slice(-100), // Save only last 100 events
        timestamp: new Date().toISOString()
      };
      saveToStorage(this.storageKey, eventData);
    } catch (error) {
      console.error('Failed to save event history:', error);
    }
  }

  /**
   * Load event history from persistent storage
   */
  private loadEventHistory(): void {
    try {
      const eventData = loadFromStorage(this.storageKey);
      if (eventData && eventData.events) {
        this.events = eventData.events.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
        console.log(`Loaded ${this.events.length} events from storage`);
      }
    } catch (error) {
      console.error('Failed to load event history:', error);
      this.events = [];
    }
  }

  /**
   * Export events for analysis or backup
   */
  exportEvents(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'detectionMethod', 'confidence', 'userResponse', 'sosTriggered'];
      const rows = this.events.map(event => [
        event.id,
        event.timestamp.toISOString(),
        event.detectionMethod,
        event.confidence.toString(),
        event.userResponse,
        event.sosTriggered.toString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Clear all events (for testing or reset)
   */
  clearAllEvents(): void {
    this.events = [];
    this.activeCorrelations.clear();
    this.saveEventHistory();
    console.log('All detection events cleared');
  }
}