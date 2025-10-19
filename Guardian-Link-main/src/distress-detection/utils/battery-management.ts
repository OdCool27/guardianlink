/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Battery-aware processing utilities for mobile optimization
 */

/**
 * Battery status information
 */
export interface BatteryStatus {
  level: number; // 0-1
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

/**
 * Processing schedule configuration based on battery status
 */
export interface ProcessingSchedule {
  frameSkipInterval: number; // How many frames to skip between processing
  workerEnabled: boolean; // Whether to use Web Workers
  analysisDepth: 'minimal' | 'standard' | 'full'; // Level of analysis to perform
  maxQueueSize: number; // Maximum processing queue size
}

/**
 * Battery-aware processing manager
 */
export class BatteryAwareManager {
  private battery: any = null; // BatteryManager API
  private currentSchedule: ProcessingSchedule;
  private onScheduleChange: ((schedule: ProcessingSchedule) => void) | null = null;
  private batteryCheckInterval: number | null = null;
  private readonly checkIntervalMs = 30000; // Check every 30 seconds

  // Default schedules for different battery levels
  private readonly schedules = {
    critical: { // < 10% battery
      frameSkipInterval: 10,
      workerEnabled: false,
      analysisDepth: 'minimal' as const,
      maxQueueSize: 2
    },
    low: { // 10-25% battery
      frameSkipInterval: 5,
      workerEnabled: true,
      analysisDepth: 'minimal' as const,
      maxQueueSize: 3
    },
    medium: { // 25-50% battery
      frameSkipInterval: 3,
      workerEnabled: true,
      analysisDepth: 'standard' as const,
      maxQueueSize: 5
    },
    high: { // > 50% battery or charging
      frameSkipInterval: 2,
      workerEnabled: true,
      analysisDepth: 'full' as const,
      maxQueueSize: 8
    }
  };

  constructor() {
    this.currentSchedule = this.schedules.high; // Default to high performance
  }

  /**
   * Initialize battery monitoring
   */
  async initialize(): Promise<void> {
    try {
      // Check if Battery API is available
      if ('getBattery' in navigator) {
        this.battery = await (navigator as any).getBattery();
        this.setupBatteryEventListeners();
        this.updateProcessingSchedule();
        this.startBatteryMonitoring();
        console.log('Battery-aware processing initialized');
      } else {
        console.log('Battery API not available, using default processing schedule');
      }
    } catch (error) {
      console.warn('Failed to initialize battery monitoring:', error);
    }
  }

  /**
   * Set up battery event listeners
   */
  private setupBatteryEventListeners(): void {
    if (!this.battery) return;

    this.battery.addEventListener('levelchange', () => {
      this.updateProcessingSchedule();
    });

    this.battery.addEventListener('chargingchange', () => {
      this.updateProcessingSchedule();
    });
  }

  /**
   * Start periodic battery monitoring
   */
  private startBatteryMonitoring(): void {
    this.batteryCheckInterval = window.setInterval(() => {
      this.updateProcessingSchedule();
    }, this.checkIntervalMs);
  }

  /**
   * Update processing schedule based on current battery status
   */
  private updateProcessingSchedule(): void {
    const batteryStatus = this.getBatteryStatus();
    const newSchedule = this.calculateOptimalSchedule(batteryStatus);

    // Only update if schedule actually changed
    if (JSON.stringify(newSchedule) !== JSON.stringify(this.currentSchedule)) {
      this.currentSchedule = newSchedule;
      console.log('Processing schedule updated:', newSchedule);
      
      if (this.onScheduleChange) {
        this.onScheduleChange(newSchedule);
      }
    }
  }

  /**
   * Calculate optimal processing schedule based on battery status
   */
  private calculateOptimalSchedule(batteryStatus: BatteryStatus): ProcessingSchedule {
    // If charging, use high performance
    if (batteryStatus.charging) {
      return { ...this.schedules.high };
    }

    // Adjust based on battery level
    if (batteryStatus.level < 0.1) {
      return { ...this.schedules.critical };
    } else if (batteryStatus.level < 0.25) {
      return { ...this.schedules.low };
    } else if (batteryStatus.level < 0.5) {
      return { ...this.schedules.medium };
    } else {
      return { ...this.schedules.high };
    }
  }

  /**
   * Get current battery status
   */
  getBatteryStatus(): BatteryStatus {
    if (this.battery) {
      return {
        level: this.battery.level,
        charging: this.battery.charging,
        chargingTime: this.battery.chargingTime,
        dischargingTime: this.battery.dischargingTime
      };
    }

    // Default values when battery API is not available
    return {
      level: 1.0,
      charging: false,
      chargingTime: Infinity,
      dischargingTime: Infinity
    };
  }

  /**
   * Get current processing schedule
   */
  getCurrentSchedule(): ProcessingSchedule {
    return { ...this.currentSchedule };
  }

  /**
   * Set callback for schedule changes
   */
  onScheduleChanged(callback: (schedule: ProcessingSchedule) => void): void {
    this.onScheduleChange = callback;
  }

  /**
   * Manually override processing schedule (for testing or user preference)
   */
  overrideSchedule(schedule: Partial<ProcessingSchedule>): void {
    this.currentSchedule = { ...this.currentSchedule, ...schedule };
    
    if (this.onScheduleChange) {
      this.onScheduleChange(this.currentSchedule);
    }
  }

  /**
   * Reset to automatic battery-based scheduling
   */
  resetToAutomatic(): void {
    this.updateProcessingSchedule();
  }

  /**
   * Check if device is likely mobile based on battery and other indicators
   */
  isMobileDevice(): boolean {
    // Check for mobile indicators
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasSmallScreen = window.screen.width <= 768;
    
    return isMobile || (hasTouchScreen && hasSmallScreen);
  }

  /**
   * Get battery optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const batteryStatus = this.getBatteryStatus();
    const recommendations: string[] = [];

    if (!batteryStatus.charging && batteryStatus.level < 0.2) {
      recommendations.push('Consider connecting to a charger for optimal performance');
    }

    if (batteryStatus.level < 0.1) {
      recommendations.push('Battery critically low - using minimal processing mode');
    }

    if (this.isMobileDevice() && !batteryStatus.charging) {
      recommendations.push('Mobile device detected - using battery-optimized settings');
    }

    if (batteryStatus.dischargingTime < 3600) { // Less than 1 hour remaining
      recommendations.push('Low battery time remaining - reducing processing intensity');
    }

    return recommendations;
  }

  /**
   * Calculate estimated processing impact on battery
   */
  getProcessingImpact(): {
    estimatedBatteryDrainPerHour: number;
    recommendedMaxUsageHours: number;
  } {
    const batteryStatus = this.getBatteryStatus();
    const schedule = this.getCurrentSchedule();

    // Estimate battery drain based on processing intensity
    let drainMultiplier = 1.0;
    
    switch (schedule.analysisDepth) {
      case 'minimal':
        drainMultiplier = 0.3;
        break;
      case 'standard':
        drainMultiplier = 0.6;
        break;
      case 'full':
        drainMultiplier = 1.0;
        break;
    }

    if (schedule.workerEnabled) {
      drainMultiplier *= 1.2; // Web Workers add some overhead
    }

    // Base estimate: audio processing uses ~5-10% battery per hour
    const baseDrainPerHour = 0.075; // 7.5% per hour
    const estimatedDrainPerHour = baseDrainPerHour * drainMultiplier;
    
    const recommendedMaxUsageHours = batteryStatus.charging 
      ? Infinity 
      : Math.floor(batteryStatus.level / estimatedDrainPerHour);

    return {
      estimatedBatteryDrainPerHour: estimatedDrainPerHour,
      recommendedMaxUsageHours
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.batteryCheckInterval) {
      clearInterval(this.batteryCheckInterval);
      this.batteryCheckInterval = null;
    }

    // Remove battery event listeners
    if (this.battery) {
      this.battery.removeEventListener('levelchange', this.updateProcessingSchedule);
      this.battery.removeEventListener('chargingchange', this.updateProcessingSchedule);
      this.battery = null;
    }

    this.onScheduleChange = null;
  }
}

/**
 * Intelligent processing frequency adjuster
 */
export class ProcessingFrequencyAdjuster {
  private baseFrequency: number;
  private currentFrequency: number;
  private performanceHistory: number[] = [];
  private readonly maxHistorySize = 20;
  private readonly targetProcessingTime = 16; // Target 16ms for 60fps
  private readonly minFrequency = 5; // Minimum 5fps
  private readonly maxFrequency = 60; // Maximum 60fps

  constructor(baseFrequency: number = 30) {
    this.baseFrequency = baseFrequency;
    this.currentFrequency = baseFrequency;
  }

  /**
   * Adjust frequency based on processing performance
   */
  adjustFrequency(processingTimeMs: number): number {
    this.performanceHistory.push(processingTimeMs);
    
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }

    // Calculate average processing time
    const avgProcessingTime = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;

    // Adjust frequency based on performance
    if (avgProcessingTime > this.targetProcessingTime * 1.5) {
      // Processing is too slow, reduce frequency
      this.currentFrequency = Math.max(this.currentFrequency * 0.8, this.minFrequency);
    } else if (avgProcessingTime < this.targetProcessingTime * 0.5) {
      // Processing is fast, can increase frequency
      this.currentFrequency = Math.min(this.currentFrequency * 1.1, this.maxFrequency);
    }

    return Math.round(this.currentFrequency);
  }

  /**
   * Get current processing frequency
   */
  getCurrentFrequency(): number {
    return Math.round(this.currentFrequency);
  }

  /**
   * Get processing interval in milliseconds
   */
  getProcessingInterval(): number {
    return 1000 / this.currentFrequency;
  }

  /**
   * Reset to base frequency
   */
  reset(): void {
    this.currentFrequency = this.baseFrequency;
    this.performanceHistory = [];
  }

  /**
   * Set new base frequency
   */
  setBaseFrequency(frequency: number): void {
    this.baseFrequency = Math.max(this.minFrequency, Math.min(frequency, this.maxFrequency));
    this.currentFrequency = this.baseFrequency;
  }
}