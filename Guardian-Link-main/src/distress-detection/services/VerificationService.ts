/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VerificationResult, DistressEvent, DistressContext } from '../types';

export interface VerificationState {
  isActive: boolean;
  startTime?: Date;
  timeoutSeconds: number;
  detectionSource: string;
  confidence: number;
  context?: DistressContext;
}

export interface VerificationEventLog {
  id: string;
  timestamp: Date;
  detectionContext: DistressContext;
  verificationResult: VerificationResult;
  timeToResponse?: number; // milliseconds
  sosTriggered: boolean;
}

/**
 * Service for managing distress verification dialogs and timeout handling
 * Handles verification state, timeout logic, and event logging
 * Requirements: 4.3, 4.4, 4.5
 */
export class VerificationService {
  private state: VerificationState = {
    isActive: false,
    timeoutSeconds: 10,
    detectionSource: '',
    confidence: 0
  };

  private eventLog: VerificationEventLog[] = [];
  private timeoutHandle: NodeJS.Timeout | null = null;
  private onResultCallback?: (result: VerificationResult, shouldTriggerSOS: boolean) => void;
  private onTimeoutCallback?: (context: DistressContext) => void;

  /**
   * Initialize verification for a detected distress event
   */
  public startVerification(
    context: DistressContext,
    timeoutSeconds: number = 10,
    onResult?: (result: VerificationResult, shouldTriggerSOS: boolean) => void,
    onTimeout?: (context: DistressContext) => void
  ): void {
    // Clear any existing verification
    this.stopVerification();

    this.state = {
      isActive: true,
      startTime: new Date(),
      timeoutSeconds,
      detectionSource: this.formatDetectionSource(context),
      confidence: context.confidence,
      context
    };

    this.onResultCallback = onResult;
    this.onTimeoutCallback = onTimeout;

    // Set up automatic timeout
    this.timeoutHandle = setTimeout(() => {
      this.handleTimeout();
    }, timeoutSeconds * 1000);

    console.log(`Verification started: ${this.state.detectionSource} (${this.state.confidence}% confidence)`);
  }

  /**
   * Stop active verification and clean up
   */
  public stopVerification(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }

    this.state = {
      isActive: false,
      timeoutSeconds: 10,
      detectionSource: '',
      confidence: 0
    };

    this.onResultCallback = undefined;
    this.onTimeoutCallback = undefined;
  }

  /**
   * Handle user response to verification dialog
   */
  public handleUserResponse(result: VerificationResult): void {
    if (!this.state.isActive || !this.state.context) {
      console.warn('No active verification to handle response for');
      return;
    }

    const timeToResponse = this.state.startTime 
      ? Date.now() - this.state.startTime.getTime()
      : undefined;

    // Determine if SOS should be triggered
    const shouldTriggerSOS = result.action === 'confirm';

    // Log the verification event
    this.logVerificationEvent(result, timeToResponse, shouldTriggerSOS);

    // Clear timeout since user responded
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }

    // Notify callback
    if (this.onResultCallback) {
      this.onResultCallback(result, shouldTriggerSOS);
    }

    // Clean up state
    this.stopVerification();

    console.log(`Verification completed: ${result.action} (response time: ${timeToResponse}ms)`);
  }

  /**
   * Handle verification timeout (automatic SOS trigger)
   */
  private handleTimeout(): void {
    if (!this.state.isActive || !this.state.context) {
      return;
    }

    const timeoutResult: VerificationResult = {
      action: 'timeout',
      timestamp: new Date()
    };

    const timeToResponse = this.state.startTime 
      ? Date.now() - this.state.startTime.getTime()
      : undefined;

    // Log timeout event
    this.logVerificationEvent(timeoutResult, timeToResponse, true);

    // Notify timeout callback
    if (this.onTimeoutCallback) {
      this.onTimeoutCallback(this.state.context);
    }

    // Notify result callback
    if (this.onResultCallback) {
      this.onResultCallback(timeoutResult, true);
    }

    console.log(`Verification timed out after ${this.state.timeoutSeconds} seconds - triggering SOS`);

    // Clean up state
    this.stopVerification();
  }

  /**
   * Get current verification state
   */
  public getState(): VerificationState {
    return { ...this.state };
  }

  /**
   * Check if verification is currently active
   */
  public isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Get verification event logs
   */
  public getEventLog(): VerificationEventLog[] {
    return [...this.eventLog];
  }

  /**
   * Clear event log (for privacy)
   */
  public clearEventLog(): void {
    this.eventLog = [];
  }

  /**
   * Get event log filtered by date range
   */
  public getEventLogByDateRange(startDate: Date, endDate: Date): VerificationEventLog[] {
    return this.eventLog.filter(event => 
      event.timestamp >= startDate && event.timestamp <= endDate
    );
  }

  /**
   * Get verification statistics
   */
  public getStatistics(): {
    totalVerifications: number;
    confirmedDistress: number;
    dismissedAlerts: number;
    timeouts: number;
    averageResponseTime: number;
    falsePositiveRate: number;
  } {
    const total = this.eventLog.length;
    const confirmed = this.eventLog.filter(e => e.verificationResult.action === 'confirm').length;
    const dismissed = this.eventLog.filter(e => e.verificationResult.action === 'dismiss').length;
    const timeouts = this.eventLog.filter(e => e.verificationResult.action === 'timeout').length;
    
    const responseTimes = this.eventLog
      .filter(e => e.timeToResponse !== undefined)
      .map(e => e.timeToResponse!);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const falsePositiveRate = total > 0 ? (dismissed / total) * 100 : 0;

    return {
      totalVerifications: total,
      confirmedDistress: confirmed,
      dismissedAlerts: dismissed,
      timeouts,
      averageResponseTime,
      falsePositiveRate
    };
  }

  /**
   * Log verification event for analytics and debugging
   */
  private logVerificationEvent(
    result: VerificationResult, 
    timeToResponse?: number, 
    sosTriggered: boolean = false
  ): void {
    if (!this.state.context) return;

    const logEntry: VerificationEventLog = {
      id: this.generateEventId(),
      timestamp: new Date(),
      detectionContext: { ...this.state.context },
      verificationResult: { ...result },
      timeToResponse,
      sosTriggered
    };

    this.eventLog.push(logEntry);

    // Keep only last 100 events to prevent memory issues
    if (this.eventLog.length > 100) {
      this.eventLog = this.eventLog.slice(-100);
    }

    // Store in localStorage for persistence (optional)
    try {
      const recentEvents = this.eventLog.slice(-10); // Keep only last 10 for storage
      localStorage.setItem('distress-verification-log', JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('Could not save verification log to localStorage:', error);
    }
  }

  /**
   * Format detection source for display
   */
  private formatDetectionSource(context: DistressContext): string {
    const method = context.detectionMethod;
    const confidence = Math.round(context.confidence);
    
    switch (method) {
      case 'speech':
        return `Speech Recognition (${confidence}% confidence)`;
      case 'audio':
        return `Audio Analysis (${confidence}% confidence)`;
      case 'combined':
        return `Speech + Audio Analysis (${confidence}% confidence)`;
      default:
        return `Unknown Detection Method (${confidence}% confidence)`;
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load event log from localStorage on initialization
   */
  public loadPersistedEventLog(): void {
    try {
      const stored = localStorage.getItem('distress-verification-log');
      if (stored) {
        const events = JSON.parse(stored) as VerificationEventLog[];
        // Validate and restore events
        const validEvents = events.filter(event => 
          event.id && event.timestamp && event.verificationResult
        );
        this.eventLog = validEvents;
      }
    } catch (error) {
      console.warn('Could not load verification log from localStorage:', error);
    }
  }

  /**
   * Update verification timeout setting
   */
  public updateTimeoutSeconds(seconds: number): void {
    if (seconds < 5 || seconds > 60) {
      throw new Error('Timeout must be between 5 and 60 seconds');
    }
    
    if (!this.state.isActive) {
      this.state.timeoutSeconds = seconds;
    } else {
      console.warn('Cannot update timeout while verification is active');
    }
  }

  /**
   * Force trigger SOS (emergency override)
   */
  public forceTriggerSOS(): void {
    if (this.state.isActive && this.state.context && this.onTimeoutCallback) {
      this.onTimeoutCallback(this.state.context);
      this.stopVerification();
    }
  }
}