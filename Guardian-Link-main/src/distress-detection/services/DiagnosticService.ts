/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressError, ErrorType, ServiceHealth } from './ErrorHandlingService';
import { isSpeechRecognitionSupported, isWebAudioSupported } from '../utils/browser-support';

/**
 * System diagnostic information
 */
export interface SystemDiagnostics {
  timestamp: Date;
  browser: BrowserInfo;
  permissions: PermissionStatus;
  audioCapabilities: AudioCapabilities;
  networkStatus: NetworkStatus;
  performance: PerformanceMetrics;
  errors: DiagnosticError[];
  services: ServiceDiagnostics[];
}

export interface BrowserInfo {
  userAgent: string;
  vendor: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  speechRecognitionSupported: boolean;
  webAudioSupported: boolean;
  mediaDevicesSupported: boolean;
}

export interface PermissionStatus {
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  notifications: 'granted' | 'denied' | 'default' | 'unknown';
  geolocation: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export interface AudioCapabilities {
  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];
  constraints: MediaTrackConstraints;
  sampleRates: number[];
  channelCounts: number[];
}

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface PerformanceMetrics {
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  timing: {
    navigationStart: number;
    loadEventEnd: number;
    domContentLoadedEventEnd: number;
  };
  cpuUsage?: number;
}

export interface DiagnosticError {
  id: string;
  type: ErrorType;
  message: string;
  timestamp: Date;
  service: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface ServiceDiagnostics {
  name: string;
  status: 'healthy' | 'degraded' | 'failed' | 'recovering';
  uptime: number;
  errorCount: number;
  lastError?: DiagnosticError;
  metrics?: Record<string, any>;
}

/**
 * Diagnostic information collection service
 * Requirements: 1.5, 3.5
 */
export class DiagnosticService {
  private diagnosticHistory: SystemDiagnostics[] = [];
  private maxHistorySize = 50;

  /**
   * Collect comprehensive system diagnostics
   */
  async collectDiagnostics(): Promise<SystemDiagnostics> {
    const diagnostics: SystemDiagnostics = {
      timestamp: new Date(),
      browser: await this.collectBrowserInfo(),
      permissions: await this.collectPermissionStatus(),
      audioCapabilities: await this.collectAudioCapabilities(),
      networkStatus: this.collectNetworkStatus(),
      performance: this.collectPerformanceMetrics(),
      errors: this.collectRecentErrors(),
      services: this.collectServiceDiagnostics()
    };

    // Store in history
    this.diagnosticHistory.push(diagnostics);
    if (this.diagnosticHistory.length > this.maxHistorySize) {
      this.diagnosticHistory.shift();
    }

    return diagnostics;
  }

  /**
   * Collect browser information
   */
  private async collectBrowserInfo(): Promise<BrowserInfo> {
    return {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      speechRecognitionSupported: isSpeechRecognitionSupported(),
      webAudioSupported: isWebAudioSupported(),
      mediaDevicesSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
  }

  /**
   * Collect permission status
   */
  private async collectPermissionStatus(): Promise<PermissionStatus> {
    const permissions: PermissionStatus = {
      microphone: 'unknown',
      notifications: 'unknown',
      geolocation: 'unknown'
    };

    if (navigator.permissions) {
      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        permissions.microphone = micPermission.state as 'granted' | 'denied' | 'prompt';
      } catch (error) {
        console.warn('Could not query microphone permission:', error);
      }

      try {
        const notificationPermission = await navigator.permissions.query({ name: 'notifications' as PermissionName });
        permissions.notifications = notificationPermission.state as 'granted' | 'denied' | 'default';
      } catch (error) {
        console.warn('Could not query notification permission:', error);
      }

      try {
        const geoPermission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        permissions.geolocation = geoPermission.state;
      } catch (error) {
        console.warn('Could not query geolocation permission:', error);
      }
    }

    return permissions;
  }

  /**
   * Collect audio capabilities
   */
  private async collectAudioCapabilities(): Promise<AudioCapabilities> {
    const capabilities: AudioCapabilities = {
      inputDevices: [],
      outputDevices: [],
      constraints: {},
      sampleRates: [],
      channelCounts: []
    };

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        capabilities.inputDevices = devices.filter(device => device.kind === 'audioinput');
        capabilities.outputDevices = devices.filter(device => device.kind === 'audiooutput');
      } catch (error) {
        console.warn('Could not enumerate media devices:', error);
      }
    }

    // Test supported audio constraints
    if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
      capabilities.constraints = {
        // Only include audio-relevant constraints that are actually supported
        ...(supportedConstraints.echoCancellation && { echoCancellation: true }),
        ...(supportedConstraints.noiseSuppression && { noiseSuppression: true }),
        ...(supportedConstraints.autoGainControl && { autoGainControl: true })
      };
    }

    // Test common sample rates and channel counts
    try {
      capabilities.sampleRates = await this.testAudioSampleRates();
      capabilities.channelCounts = await this.testAudioChannelCounts();
    } catch (error) {
      console.warn('Could not test audio capabilities:', error);
      capabilities.sampleRates = [];
      capabilities.channelCounts = [];
    }

    return capabilities;
  }

  /**
   * Test supported audio sample rates
   */
  private async testAudioSampleRates(): Promise<number[]> {
    const commonRates = [8000, 16000, 22050, 44100, 48000, 96000];
    const supportedRates: number[] = [];

    for (const rate of commonRates) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: rate });
        if (context.sampleRate === rate) {
          supportedRates.push(rate);
        }
        await context.close();
      } catch (error) {
        // Rate not supported
      }
    }

    return supportedRates;
  }

  /**
   * Test supported audio channel counts
   */
  private async testAudioChannelCounts(): Promise<number[]> {
    const supportedCounts: number[] = [];

    for (let channels = 1; channels <= 8; channels++) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: channels }
        });
        
        const track = stream.getAudioTracks()[0];
        const settings = track.getSettings();
        
        if (settings.channelCount === channels) {
          supportedCounts.push(channels);
        }
        
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        // Channel count not supported
        break;
      }
    }

    return supportedCounts;
  }

  /**
   * Collect network status
   */
  private collectNetworkStatus(): NetworkStatus {
    const status: NetworkStatus = {
      online: navigator.onLine
    };

    // Check for Network Information API
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      status.effectiveType = connection.effectiveType;
      status.downlink = connection.downlink;
      status.rtt = connection.rtt;
      status.saveData = connection.saveData;
    }

    return status;
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      timing: {
        navigationStart: performance.timing.navigationStart,
        loadEventEnd: performance.timing.loadEventEnd,
        domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd
      }
    };

    // Memory usage (Chrome only)
    if ((performance as any).memory) {
      metrics.memoryUsage = {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      };
    }

    return metrics;
  }

  /**
   * Collect recent errors from error handling service
   */
  private collectRecentErrors(): DiagnosticError[] {
    // This would integrate with the error handling service
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Collect service diagnostics
   */
  private collectServiceDiagnostics(): ServiceDiagnostics[] {
    // This would integrate with the error handling service
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Generate diagnostic report
   */
  generateDiagnosticReport(diagnostics?: SystemDiagnostics): string {
    const data = diagnostics || this.getLatestDiagnostics();
    if (!data) {
      return 'No diagnostic data available';
    }

    const report = [
      '=== DISTRESS DETECTION SYSTEM DIAGNOSTICS ===',
      `Generated: ${data.timestamp.toISOString()}`,
      '',
      '--- BROWSER INFORMATION ---',
      `User Agent: ${data.browser.userAgent}`,
      `Platform: ${data.browser.platform}`,
      `Language: ${data.browser.language}`,
      `Online: ${data.browser.onLine}`,
      `Speech Recognition: ${data.browser.speechRecognitionSupported ? 'Supported' : 'Not Supported'}`,
      `Web Audio API: ${data.browser.webAudioSupported ? 'Supported' : 'Not Supported'}`,
      `Media Devices: ${data.browser.mediaDevicesSupported ? 'Supported' : 'Not Supported'}`,
      '',
      '--- PERMISSIONS ---',
      `Microphone: ${data.permissions.microphone}`,
      `Notifications: ${data.permissions.notifications}`,
      `Geolocation: ${data.permissions.geolocation}`,
      '',
      '--- AUDIO CAPABILITIES ---',
      `Input Devices: ${data.audioCapabilities.inputDevices.length}`,
      `Output Devices: ${data.audioCapabilities.outputDevices.length}`,
      `Supported Sample Rates: ${data.audioCapabilities.sampleRates.join(', ')}`,
      `Supported Channel Counts: ${data.audioCapabilities.channelCounts.join(', ')}`,
      '',
      '--- NETWORK STATUS ---',
      `Online: ${data.networkStatus.online}`,
      `Connection Type: ${data.networkStatus.effectiveType || 'Unknown'}`,
      `Downlink: ${data.networkStatus.downlink || 'Unknown'} Mbps`,
      `RTT: ${data.networkStatus.rtt || 'Unknown'} ms`,
      '',
      '--- PERFORMANCE ---'
    ];

    if (data.performance.memoryUsage) {
      const memory = data.performance.memoryUsage;
      report.push(
        `Memory Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        `Memory Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        `Memory Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      );
    }

    if (data.errors.length > 0) {
      report.push(
        '',
        '--- RECENT ERRORS ---'
      );
      data.errors.forEach(error => {
        report.push(`${error.timestamp.toISOString()}: [${error.service}] ${error.type} - ${error.message}`);
      });
    }

    if (data.services.length > 0) {
      report.push(
        '',
        '--- SERVICE STATUS ---'
      );
      data.services.forEach(service => {
        report.push(`${service.name}: ${service.status} (${service.errorCount} errors, uptime: ${service.uptime}ms)`);
      });
    }

    return report.join('\n');
  }

  /**
   * Export diagnostics as JSON
   */
  exportDiagnostics(format: 'json' | 'text' = 'json'): string {
    const latest = this.getLatestDiagnostics();
    if (!latest) {
      return format === 'json' ? '{}' : 'No diagnostic data available';
    }

    if (format === 'text') {
      return this.generateDiagnosticReport(latest);
    }

    return JSON.stringify(latest, null, 2);
  }

  /**
   * Get latest diagnostic data
   */
  getLatestDiagnostics(): SystemDiagnostics | null {
    return this.diagnosticHistory.length > 0 ? 
      this.diagnosticHistory[this.diagnosticHistory.length - 1] : 
      null;
  }

  /**
   * Get diagnostic history
   */
  getDiagnosticHistory(): SystemDiagnostics[] {
    return [...this.diagnosticHistory];
  }

  /**
   * Clear diagnostic history
   */
  clearHistory(): void {
    this.diagnosticHistory = [];
  }

  /**
   * Run system health check
   */
  async runHealthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'failed';
    issues: string[];
    recommendations: string[];
  }> {
    const diagnostics = await this.collectDiagnostics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check browser support
    if (!diagnostics.browser.speechRecognitionSupported) {
      issues.push('Speech recognition not supported');
      recommendations.push('Use Chrome, Firefox, or Safari for speech recognition support');
    }

    if (!diagnostics.browser.webAudioSupported) {
      issues.push('Web Audio API not supported');
      recommendations.push('Update your browser to support Web Audio API');
    }

    // Check permissions
    if (diagnostics.permissions.microphone === 'denied') {
      issues.push('Microphone permission denied');
      recommendations.push('Grant microphone permission in browser settings');
    }

    // Check audio devices
    if (diagnostics.audioCapabilities.inputDevices.length === 0) {
      issues.push('No audio input devices detected');
      recommendations.push('Connect a microphone or check audio device settings');
    }

    // Check network
    if (!diagnostics.networkStatus.online) {
      issues.push('No network connection');
      recommendations.push('Check your internet connection for AI features');
    }

    // Check memory usage
    if (diagnostics.performance.memoryUsage) {
      const memoryUsage = diagnostics.performance.memoryUsage.usedJSHeapSize / diagnostics.performance.memoryUsage.jsHeapSizeLimit;
      if (memoryUsage > 0.8) {
        issues.push('High memory usage detected');
        recommendations.push('Close other browser tabs to free up memory');
      }
    }

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'failed';
    if (issues.length === 0) {
      overall = 'healthy';
    } else if (issues.some(issue => 
      issue.includes('not supported') || 
      issue.includes('permission denied') || 
      issue.includes('No audio input')
    )) {
      overall = 'failed';
    } else {
      overall = 'degraded';
    }

    return { overall, issues, recommendations };
  }
}

// Export singleton instance
export const diagnosticService = new DiagnosticService();