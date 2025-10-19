/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioAnalysisData, AudioAnalysisResult, WorkerSettings } from '../workers/audio-analysis.worker';

/**
 * Performance metrics for worker monitoring
 */
export interface WorkerPerformanceMetrics {
  averageProcessingTime: number;
  messagesSent: number;
  messagesReceived: number;
  errorsCount: number;
  lastProcessingTime: number;
  workerStartTime: number;
  isHealthy: boolean;
}

/**
 * Worker manager for handling audio analysis Web Worker
 */
export class AudioWorkerManager {
  private worker: Worker | null = null;
  private isInitialized = false;
  private messageId = 0;
  private pendingMessages = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }>();
  
  // Performance monitoring
  private performanceMetrics: WorkerPerformanceMetrics = {
    averageProcessingTime: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errorsCount: 0,
    lastProcessingTime: 0,
    workerStartTime: 0,
    isHealthy: true
  };
  
  private processingTimes: number[] = [];
  private readonly MAX_PROCESSING_TIMES = 100;
  private readonly MESSAGE_TIMEOUT = 5000; // 5 seconds
  
  // Callbacks
  private onAnalysisResult: ((result: AudioAnalysisResult) => void) | null = null;
  private onError: ((error: Error) => void) | null = null;
  private onPerformanceUpdate: ((metrics: WorkerPerformanceMetrics) => void) | null = null;
  
  // Health monitoring
  private healthCheckInterval: number | null = null;
  private lastMessageTime = 0;
  private readonly HEALTH_CHECK_INTERVAL = 10000; // 10 seconds
  private readonly MAX_SILENCE_TIME = 30000; // 30 seconds
  
  /**
   * Initialize the Web Worker
   */
  async initialize(): Promise<void> {
    try {
      // Check Web Worker support
      if (typeof Worker === 'undefined') {
        throw new Error('Web Workers are not supported in this browser');
      }
      
      // Create worker from module
      this.worker = new Worker(
        new URL('../workers/audio-analysis.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      // Set up message handling
      this.setupMessageHandling();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.performanceMetrics.workerStartTime = Date.now();
      this.isInitialized = true;
      
      console.log('AudioWorkerManager initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.handleError(new Error(`Failed to initialize AudioWorkerManager: ${errorMessage}`));
      throw error;
    }
  }
  
  /**
   * Set up message handling for the worker
   */
  private setupMessageHandling(): void {
    if (!this.worker) return;
    
    this.worker.onmessage = (event) => {
      const { type, data, messageId } = event.data;
      this.lastMessageTime = Date.now();
      this.performanceMetrics.messagesReceived++;
      
      try {
        switch (type) {
          case 'ANALYSIS_RESULT':
            this.handleAnalysisResult(data as AudioAnalysisResult, messageId);
            break;
            
          case 'SETTINGS_UPDATED':
            this.resolvePendingMessage(messageId, data);
            break;
            
          case 'STATE_RESET':
            this.resolvePendingMessage(messageId, true);
            break;
            
          case 'ERROR':
            this.handleWorkerError(data, messageId);
            break;
            
          default:
            console.warn(`Unknown message type from worker: ${type}`);
        }
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error('Message handling error'));
      }
    };
    
    this.worker.onerror = (error) => {
      this.performanceMetrics.errorsCount++;
      this.performanceMetrics.isHealthy = false;
      this.handleError(new Error(`Worker error: ${error.message}`));
    };
    
    this.worker.onmessageerror = (error) => {
      this.performanceMetrics.errorsCount++;
      this.handleError(new Error(`Worker message error: ${error}`));
    };
  }
  
  /**
   * Analyze audio data using the Web Worker
   */
  async analyzeAudio(audioData: AudioAnalysisData): Promise<AudioAnalysisResult> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('AudioWorkerManager not initialized');
    }
    
    const startTime = Date.now();
    
    try {
      const result = await this.sendMessage('ANALYZE_AUDIO', audioData);
      
      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.updateProcessingTime(processingTime);
      
      return result;
    } catch (error) {
      this.performanceMetrics.errorsCount++;
      throw error;
    }
  }
  
  /**
   * Update worker settings
   */
  async updateSettings(settings: Partial<WorkerSettings>): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('AudioWorkerManager not initialized');
    }
    
    await this.sendMessage('UPDATE_SETTINGS', settings);
  }
  
  /**
   * Reset worker analysis state
   */
  async resetState(): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('AudioWorkerManager not initialized');
    }
    
    await this.sendMessage('RESET_STATE');
  }
  
  /**
   * Send message to worker with promise-based response
   */
  private sendMessage(type: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }
      
      const messageId = ++this.messageId;
      const timestamp = Date.now();
      
      // Store pending message
      this.pendingMessages.set(messageId, { resolve, reject, timestamp });
      
      // Set timeout for message
      setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId);
          reject(new Error(`Worker message timeout for type: ${type}`));
        }
      }, this.MESSAGE_TIMEOUT);
      
      // Send message
      this.worker.postMessage({ type, data, messageId });
      this.performanceMetrics.messagesSent++;
    });
  }
  
  /**
   * Handle analysis result from worker
   */
  private handleAnalysisResult(result: AudioAnalysisResult, messageId?: number): void {
    if (messageId && this.pendingMessages.has(messageId)) {
      this.resolvePendingMessage(messageId, result);
    }
    
    // Notify callback
    if (this.onAnalysisResult) {
      this.onAnalysisResult(result);
    }
  }
  
  /**
   * Handle worker error
   */
  private handleWorkerError(errorData: any, messageId?: number): void {
    const error = new Error(errorData.message || 'Worker error');
    this.performanceMetrics.errorsCount++;
    
    if (messageId && this.pendingMessages.has(messageId)) {
      this.rejectPendingMessage(messageId, error);
    }
    
    this.handleError(error);
  }
  
  /**
   * Resolve pending message
   */
  private resolvePendingMessage(messageId: number, data: any): void {
    const pending = this.pendingMessages.get(messageId);
    if (pending) {
      this.pendingMessages.delete(messageId);
      pending.resolve(data);
    }
  }
  
  /**
   * Reject pending message
   */
  private rejectPendingMessage(messageId: number, error: Error): void {
    const pending = this.pendingMessages.get(messageId);
    if (pending) {
      this.pendingMessages.delete(messageId);
      pending.reject(error);
    }
  }
  
  /**
   * Update processing time metrics
   */
  private updateProcessingTime(processingTime: number): void {
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > this.MAX_PROCESSING_TIMES) {
      this.processingTimes.shift();
    }
    
    this.performanceMetrics.lastProcessingTime = processingTime;
    this.performanceMetrics.averageProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }
  
  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Update performance metrics every 5 seconds
    setInterval(() => {
      this.updateHealthStatus();
      
      if (this.onPerformanceUpdate) {
        this.onPerformanceUpdate({ ...this.performanceMetrics });
      }
    }, 5000);
  }
  
  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = window.setInterval(() => {
      this.checkWorkerHealth();
    }, this.HEALTH_CHECK_INTERVAL);
  }
  
  /**
   * Check worker health
   */
  private checkWorkerHealth(): void {
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastMessageTime;
    
    // Check if worker has been silent too long
    if (timeSinceLastMessage > this.MAX_SILENCE_TIME && this.performanceMetrics.messagesSent > 0) {
      this.performanceMetrics.isHealthy = false;
      this.handleError(new Error('Worker appears to be unresponsive'));
    }
    
    // Check error rate
    const errorRate = this.performanceMetrics.errorsCount / Math.max(this.performanceMetrics.messagesSent, 1);
    if (errorRate > 0.1) { // More than 10% error rate
      this.performanceMetrics.isHealthy = false;
    }
  }
  
  /**
   * Update health status based on metrics
   */
  private updateHealthStatus(): void {
    const avgProcessingTime = this.performanceMetrics.averageProcessingTime;
    const errorRate = this.performanceMetrics.errorsCount / Math.max(this.performanceMetrics.messagesSent, 1);
    
    // Consider healthy if:
    // - Average processing time < 50ms
    // - Error rate < 5%
    // - Recent activity
    this.performanceMetrics.isHealthy = 
      avgProcessingTime < 50 && 
      errorRate < 0.05 && 
      (Date.now() - this.lastMessageTime) < this.MAX_SILENCE_TIME;
  }
  
  /**
   * Set analysis result callback
   */
  onAnalysisResultReceived(callback: (result: AudioAnalysisResult) => void): void {
    this.onAnalysisResult = callback;
  }
  
  /**
   * Set error callback
   */
  onErrorOccurred(callback: (error: Error) => void): void {
    this.onError = callback;
  }
  
  /**
   * Set performance update callback
   */
  onPerformanceMetricsUpdated(callback: (metrics: WorkerPerformanceMetrics) => void): void {
    this.onPerformanceUpdate = callback;
  }
  
  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): WorkerPerformanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  /**
   * Check if worker is healthy
   */
  isHealthy(): boolean {
    return this.performanceMetrics.isHealthy;
  }
  
  /**
   * Restart worker if unhealthy
   */
  async restartWorker(): Promise<void> {
    console.log('Restarting audio worker...');
    
    // Terminate existing worker
    this.terminate();
    
    // Wait a bit before restarting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reinitialize
    await this.initialize();
  }
  
  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('AudioWorkerManager error:', error);
    
    if (this.onError) {
      this.onError(error);
    }
  }
  
  /**
   * Terminate the worker and clean up resources
   */
  terminate(): void {
    // Clear health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Reject all pending messages
    this.pendingMessages.forEach(({ reject }) => {
      reject(new Error('Worker terminated'));
    });
    this.pendingMessages.clear();
    
    // Terminate worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reset state
    this.isInitialized = false;
    this.messageId = 0;
    this.processingTimes = [];
    this.performanceMetrics = {
      averageProcessingTime: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errorsCount: 0,
      lastProcessingTime: 0,
      workerStartTime: 0,
      isHealthy: true
    };
    
    console.log('AudioWorkerManager terminated');
  }
}