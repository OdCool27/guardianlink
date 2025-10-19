/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioAnalysisEngine, AudioMetrics } from '../interfaces/AudioAnalysisEngine';
import { AUDIO_CONFIG } from '../config/defaults';
import { AudioWorkerManager, WorkerPerformanceMetrics } from './AudioWorkerManager';
import { AudioAnalysisResult } from '../workers/audio-analysis.worker';
import { 
  calculateRMS, 
  amplitudeToDecibels
} from '../utils/audio-processing';
import { 
  CircularBuffer, 
  MemoryUsageMonitor, 
  AudioBufferPool 
} from '../utils/memory-management';
import { 
  BatteryAwareManager, 
  ProcessingFrequencyAdjuster,
  ProcessingSchedule 
} from '../utils/battery-management';

/**
 * Audio analysis service implementation using Web Audio API with Web Worker optimization
 * Provides real-time audio analysis for distress detection with performance optimization,
 * memory management, and battery-aware processing
 */
export class AudioAnalysisService implements AudioAnalysisEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyzerNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  
  private isInitialized = false;
  private analyzing = false;
  private animationFrameId: number | null = null;
  
  // Audio data buffers
  private frequencyData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;
  
  // Web Worker for intensive processing
  private workerManager: AudioWorkerManager | null = null;
  private useWebWorker = true;
  
  // Analysis state
  private currentMetrics: AudioMetrics = {
    currentVolume: 0,
    peakVolume: 0,
    averageVolume: 0,
    frequencyData: new Float32Array(0),
    timestamp: new Date()
  };
  
  // Settings
  private settings = {
    volumeThreshold: AUDIO_CONFIG.VOLUME_SPIKE_THRESHOLD,
    spikeDetection: true,
    frequencyAnalysis: true,
    sensitivity: 70
  };
  
  // Callbacks
  private distressCallback: ((confidence: number, metrics: AudioMetrics) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private performanceCallback: ((metrics: WorkerPerformanceMetrics) => void) | null = null;
  
  // Performance optimization
  private processingQueue: Array<{ frequencyData: Uint8Array; timeData: Uint8Array; timestamp: number }> = [];
  private isProcessing = false;
  private maxQueueSize = 5;
  private frameSkipCounter = 0;
  private frameSkipInterval = 2; // Process every 3rd frame for performance
  
  // Memory management
  private volumeBuffer: CircularBuffer<number>;
  private memoryMonitor: MemoryUsageMonitor;
  private audioBufferPool: AudioBufferPool;
  
  // Battery management
  private batteryManager: BatteryAwareManager;
  private frequencyAdjuster: ProcessingFrequencyAdjuster;
  private lastProcessingTime = 0;
  
  // Cleanup tracking
  private cleanupInterval: number | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60000; // Cleanup every minute
  
  constructor() {
    // Initialize memory management
    this.volumeBuffer = new CircularBuffer<number>(50);
    this.memoryMonitor = new MemoryUsageMonitor();
    this.audioBufferPool = new AudioBufferPool(2048); // Default FFT size
    
    // Initialize battery management
    this.batteryManager = new BatteryAwareManager();
    this.frequencyAdjuster = new ProcessingFrequencyAdjuster(30); // 30fps base
    
    // Set up battery-aware processing
    this.batteryManager.onScheduleChanged((schedule: ProcessingSchedule) => {
      this.applyProcessingSchedule(schedule);
    });
    
    // Set up memory monitoring
    this.memoryMonitor.onMemoryWarningCallback((memoryInfo) => {
      this.handleMemoryWarning(memoryInfo);
    });
  }
  
  /**
   * Initialize the audio analysis engine
   */
  async initialize(): Promise<void> {
    try {
      // Check Web Audio API support
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error('Web Audio API is not supported in this browser');
      }
      
      // Initialize Web Worker for intensive processing
      if (this.useWebWorker) {
        try {
          this.workerManager = new AudioWorkerManager();
          await this.workerManager.initialize();
          
          // Set up worker callbacks
          this.workerManager.onAnalysisResultReceived((result: AudioAnalysisResult) => {
            this.handleWorkerAnalysisResult(result);
          });
          
          this.workerManager.onErrorOccurred((error: Error) => {
            console.warn('Worker error, falling back to main thread:', error);
            this.useWebWorker = false;
          });
          
          this.workerManager.onPerformanceMetricsUpdated((metrics: WorkerPerformanceMetrics) => {
            if (this.performanceCallback) {
              this.performanceCallback(metrics);
            }
          });
          
          console.log('Web Worker initialized for audio processing');
        } catch (error) {
          console.warn('Failed to initialize Web Worker, using main thread:', error);
          this.useWebWorker = false;
        }
      }
      
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: AUDIO_CONFIG.SAMPLE_RATE
        }
      });
      
      // Create audio processing nodes
      this.setupAudioNodes();
      
      // Initialize battery and memory management
      await this.batteryManager.initialize();
      this.memoryMonitor.startMonitoring();
      
      // Start periodic cleanup
      this.startPeriodicCleanup();
      
      this.isInitialized = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during audio initialization';
      this.handleError(new Error(`Failed to initialize audio analysis: ${errorMessage}`));
      throw error;
    }
  }
  
  /**
   * Set up Web Audio API nodes for processing
   */
  private setupAudioNodes(): void {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('Audio context or media stream not available');
    }
    
    // Create source node from media stream
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // Create analyzer node for frequency analysis
    this.analyzerNode = this.audioContext.createAnalyser();
    this.analyzerNode.fftSize = AUDIO_CONFIG.FFT_SIZE;
    this.analyzerNode.smoothingTimeConstant = AUDIO_CONFIG.SMOOTHING_TIME_CONSTANT;
    this.analyzerNode.minDecibels = AUDIO_CONFIG.MIN_DECIBELS;
    this.analyzerNode.maxDecibels = AUDIO_CONFIG.MAX_DECIBELS;
    
    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;
    
    // Connect nodes: source -> gain -> analyzer
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.analyzerNode);
    
    // Initialize data arrays with proper buffer type
    const bufferLength = this.analyzerNode.frequencyBinCount;
    this.frequencyData = new Uint8Array(new ArrayBuffer(bufferLength));
    this.timeData = new Uint8Array(new ArrayBuffer(bufferLength));
  }
  
  /**
   * Start real-time audio analysis
   */
  startAnalysis(): void {
    if (!this.isInitialized) {
      this.handleError(new Error('Audio analysis engine not initialized'));
      return;
    }
    
    if (this.analyzing) {
      return; // Already analyzing
    }
    
    this.analyzing = true;
    this.startAnalysisLoop();
  }
  
  /**
   * Stop audio analysis
   */
  stopAnalysis(): void {
    this.analyzing = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Check if currently analyzing
   */
  isAnalyzing(): boolean {
    return this.analyzing;
  }
  
  /**
   * Set distress detection callback
   */
  onDistressDetected(callback: (confidence: number, audioMetrics: AudioMetrics) => void): void {
    this.distressCallback = callback;
  }
  
  /**
   * Set error callback
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }
  
  /**
   * Update analysis settings
   */
  updateSettings(settings: {
    volumeThreshold?: number;
    spikeDetection?: boolean;
    frequencyAnalysis?: boolean;
    sensitivity?: number;
  }): void {
    this.settings = { ...this.settings, ...settings };
    
    // Update worker settings if using Web Worker
    if (this.useWebWorker && this.workerManager) {
      this.workerManager.updateSettings(this.settings).catch(error => {
        console.warn('Failed to update worker settings:', error);
      });
    }
  }
  
  /**
   * Get current audio metrics
   */
  getCurrentMetrics(): AudioMetrics {
    return { ...this.currentMetrics };
  }
  
  /**
   * Main analysis loop using requestAnimationFrame with performance optimization
   */
  private startAnalysisLoop(): void {
    if (!this.analyzing || !this.analyzerNode || !this.frequencyData || !this.timeData) {
      return;
    }
    
    // Get current audio data
    if (this.frequencyData && this.timeData) {
      this.analyzerNode.getByteFrequencyData(this.frequencyData as any);
      this.analyzerNode.getByteTimeDomainData(this.timeData as any);
    }
    
    // Update basic metrics (lightweight operation)
    this.updateBasicMetrics();
    
    // Performance optimization: Skip frames for intensive processing
    this.frameSkipCounter++;
    if (this.frameSkipCounter >= this.frameSkipInterval) {
      this.frameSkipCounter = 0;
      
      // Queue data for processing (Web Worker or main thread)
      this.queueAudioDataForProcessing();
    }
    
    // Schedule next analysis frame
    this.animationFrameId = requestAnimationFrame(() => this.startAnalysisLoop());
  }
  
  /**
   * Update basic audio metrics (lightweight operation for main thread)
   */
  private updateBasicMetrics(): void {
    if (!this.timeData) return;
    
    // Calculate RMS volume using utility function (lightweight)
    const rms = calculateRMS(this.timeData);
    const volume = amplitudeToDecibels(rms);
    
    // Store volume in circular buffer for efficient memory usage
    this.volumeBuffer.push(volume);
    
    // Update basic metrics
    this.currentMetrics = {
      currentVolume: volume,
      peakVolume: Math.max(this.currentMetrics.peakVolume, volume),
      averageVolume: this.volumeBuffer.average(),
      frequencyData: this.frequencyData ? new Float32Array(this.frequencyData) : new Float32Array(0),
      timestamp: new Date()
    };
  }
  
  /**
   * Queue audio data for intensive processing with memory optimization
   */
  private queueAudioDataForProcessing(): void {
    if (!this.frequencyData || !this.timeData || !this.audioContext) return;
    
    // Use buffer pool for memory efficiency
    const frequencyDataCopy = this.audioBufferPool.getFrequencyBuffer();
    const timeDataCopy = this.audioBufferPool.getTimeBuffer();
    
    // Copy data to pooled buffers
    for (let i = 0; i < this.frequencyData.length; i++) {
      frequencyDataCopy[i] = this.frequencyData[i];
    }
    for (let i = 0; i < this.timeData.length; i++) {
      timeDataCopy[i] = this.timeData[i];
    }
    
    // Add to processing queue
    this.processingQueue.push({
      frequencyData: frequencyDataCopy,
      timeData: timeDataCopy,
      timestamp: Date.now()
    });
    
    // Limit queue size based on current battery/memory constraints
    if (this.processingQueue.length > this.maxQueueSize) {
      const oldItem = this.processingQueue.shift();
      if (oldItem) {
        // Return buffers to pool
        this.audioBufferPool.returnFrequencyBuffer(oldItem.frequencyData);
        this.audioBufferPool.returnTimeBuffer(oldItem.timeData);
      }
    }
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processAudioQueue();
    }
  }
  
  /**
   * Process queued audio data with performance monitoring
   */
  private async processAudioQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0 || !this.audioContext) {
      return;
    }
    
    this.isProcessing = true;
    const startTime = performance.now();
    
    try {
      const audioData = this.processingQueue.shift();
      if (!audioData) return;
      
      if (this.useWebWorker && this.workerManager) {
        // Use Web Worker for intensive processing
        await this.workerManager.analyzeAudio({
          frequencyData: audioData.frequencyData,
          timeData: audioData.timeData,
          sampleRate: this.audioContext.sampleRate,
          timestamp: audioData.timestamp
        });
      } else {
        // Fallback to main thread processing (simplified)
        this.performMainThreadAnalysis(audioData);
      }
      
      // Return buffers to pool for reuse
      this.audioBufferPool.returnFrequencyBuffer(audioData.frequencyData);
      this.audioBufferPool.returnTimeBuffer(audioData.timeData);
      
    } catch (error) {
      console.warn('Audio processing error:', error);
    } finally {
      // Update performance metrics
      const processingTime = performance.now() - startTime;
      this.lastProcessingTime = processingTime;
      
      // Adjust processing frequency based on performance
      const newFrequency = this.frequencyAdjuster.adjustFrequency(processingTime);
      this.frameSkipInterval = Math.max(1, Math.floor(60 / newFrequency) - 1);
      
      this.isProcessing = false;
      
      // Process next item in queue if available
      if (this.processingQueue.length > 0) {
        // Use setTimeout to prevent blocking
        setTimeout(() => this.processAudioQueue(), 0);
      }
    }
  }
  
  /**
   * Handle analysis result from Web Worker
   */
  private handleWorkerAnalysisResult(result: AudioAnalysisResult): void {
    // Update metrics with worker results
    this.currentMetrics.averageVolume = result.metrics.currentVolume; // Use worker's baseline calculation
    this.currentMetrics.peakVolume = Math.max(this.currentMetrics.peakVolume, result.metrics.peakVolume);
    
    // Trigger distress callback if confidence threshold is met
    if (result.distressAnalysis.overallConfidence > 0.3 && this.distressCallback) {
      console.log(`Distress detected (Worker): ${(result.distressAnalysis.overallConfidence * 100).toFixed(1)}% - ${result.distressAnalysis.detectionReasons.join(', ')}`);
      this.distressCallback(result.distressAnalysis.overallConfidence, this.getCurrentMetrics());
    }
  }
  
  /**
   * Simplified main thread analysis (fallback)
   */
  private performMainThreadAnalysis(audioData: { frequencyData: Uint8Array; timeData: Uint8Array; timestamp: number }): void {
    // Simplified analysis for main thread fallback
    const rms = calculateRMS(audioData.timeData);
    const volume = amplitudeToDecibels(rms);
    
    // Basic volume spike detection
    const volumeIncrease = volume - this.currentMetrics.averageVolume;
    if (volumeIncrease > this.settings.volumeThreshold && this.distressCallback) {
      const confidence = Math.min(volumeIncrease / (this.settings.volumeThreshold * 2), 1.0);
      console.log(`Distress detected (Main Thread): ${(confidence * 100).toFixed(1)}% - Volume spike`);
      this.distressCallback(confidence, this.getCurrentMetrics());
    }
  }
  
  /**
   * Set performance metrics callback
   */
  onPerformanceMetrics(callback: (metrics: WorkerPerformanceMetrics) => void): void {
    this.performanceCallback = callback;
  }
  
  /**
   * Get Web Worker performance metrics
   */
  getWorkerPerformanceMetrics(): WorkerPerformanceMetrics | null {
    return this.workerManager ? this.workerManager.getPerformanceMetrics() : null;
  }
  
  /**
   * Check if using Web Worker for processing
   */
  isUsingWebWorker(): boolean {
    return this.useWebWorker && this.workerManager !== null;
  }
  
  /**
   * Force restart of Web Worker (for error recovery)
   */
  async restartWorker(): Promise<void> {
    if (this.workerManager) {
      await this.workerManager.restartWorker();
    }
  }
  
  /**
   * Apply processing schedule from battery manager
   */
  private applyProcessingSchedule(schedule: ProcessingSchedule): void {
    this.frameSkipInterval = schedule.frameSkipInterval;
    this.maxQueueSize = schedule.maxQueueSize;
    
    // Adjust Web Worker usage based on battery
    if (!schedule.workerEnabled && this.useWebWorker) {
      console.log('Disabling Web Worker due to low battery');
      this.useWebWorker = false;
    } else if (schedule.workerEnabled && !this.useWebWorker && this.workerManager) {
      console.log('Re-enabling Web Worker');
      this.useWebWorker = true;
    }
    
    // Update worker settings if available
    if (this.workerManager && this.useWebWorker) {
      const workerSettings = {
        ...this.settings,
        sensitivity: schedule.analysisDepth === 'minimal' ? 50 : 
                    schedule.analysisDepth === 'standard' ? 70 : 90
      };
      
      this.workerManager.updateSettings(workerSettings).catch(error => {
        console.warn('Failed to update worker settings for battery optimization:', error);
      });
    }
  }
  
  /**
   * Handle memory warning by reducing memory usage
   */
  private handleMemoryWarning(memoryInfo: any): void {
    console.warn('Memory usage high, optimizing...', memoryInfo);
    
    // Clear processing queue to free memory
    this.processingQueue.forEach(item => {
      this.audioBufferPool.returnFrequencyBuffer(item.frequencyData);
      this.audioBufferPool.returnTimeBuffer(item.timeData);
    });
    this.processingQueue = [];
    
    // Reduce queue size
    this.maxQueueSize = Math.max(2, Math.floor(this.maxQueueSize * 0.5));
    
    // Increase frame skip interval
    this.frameSkipInterval = Math.min(10, this.frameSkipInterval * 2);
    
    // Clear buffer pool
    this.audioBufferPool.clear();
    
    // Force garbage collection if available
    this.memoryMonitor.forceGarbageCollection();
  }
  
  /**
   * Start periodic cleanup to prevent memory leaks
   */
  private startPeriodicCleanup(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.performPeriodicCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }
  
  /**
   * Perform periodic cleanup operations
   */
  private performPeriodicCleanup(): void {
    // Clean up old volume history
    if (this.volumeBuffer.getSize() > 100) {
      // Reset buffer if it gets too large
      const recentValues = this.volumeBuffer.toArray().slice(-50);
      this.volumeBuffer.clear();
      recentValues.forEach(value => this.volumeBuffer.push(value));
    }
    
    // Clean up processing queue if it's stale
    const now = Date.now();
    this.processingQueue = this.processingQueue.filter(item => {
      const age = now - item.timestamp;
      if (age > 5000) { // Remove items older than 5 seconds
        this.audioBufferPool.returnFrequencyBuffer(item.frequencyData);
        this.audioBufferPool.returnTimeBuffer(item.timeData);
        return false;
      }
      return true;
    });
    
    // Log performance statistics
    const memoryStats = this.memoryMonitor.getMemoryStats();
    const batteryStatus = this.batteryManager.getBatteryStatus();
    const bufferStats = this.audioBufferPool.getStats();
    
    console.log('Performance cleanup:', {
      memoryUsage: `${(memoryStats.current * 100).toFixed(1)}%`,
      batteryLevel: `${(batteryStatus.level * 100).toFixed(1)}%`,
      buffersInUse: bufferStats.totalBuffersInUse,
      queueSize: this.processingQueue.length,
      processingFrequency: this.frequencyAdjuster.getCurrentFrequency()
    });
  }
  
  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    current: number;
    average: number;
    peak: number;
    isHighUsage: boolean;
  } {
    return this.memoryMonitor.getMemoryStats();
  }
  
  /**
   * Get battery status and optimization info
   */
  getBatteryInfo(): {
    status: any;
    schedule: ProcessingSchedule;
    recommendations: string[];
    processingImpact: any;
  } {
    return {
      status: this.batteryManager.getBatteryStatus(),
      schedule: this.batteryManager.getCurrentSchedule(),
      recommendations: this.batteryManager.getOptimizationRecommendations(),
      processingImpact: this.batteryManager.getProcessingImpact()
    };
  }
  
  /**
   * Get current processing performance metrics
   */
  getProcessingMetrics(): {
    frequency: number;
    lastProcessingTime: number;
    queueSize: number;
    frameSkipInterval: number;
    usingWebWorker: boolean;
  } {
    return {
      frequency: this.frequencyAdjuster.getCurrentFrequency(),
      lastProcessingTime: this.lastProcessingTime,
      queueSize: this.processingQueue.length,
      frameSkipInterval: this.frameSkipInterval,
      usingWebWorker: this.isUsingWebWorker()
    };
  }
  
  /**
   * Handle errors and notify callback
   */
  private handleError(error: Error): void {
    console.error('AudioAnalysisService error:', error);
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopAnalysis();
    
    // Stop periodic cleanup
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Terminate Web Worker
    if (this.workerManager) {
      this.workerManager.terminate();
      this.workerManager = null;
    }
    
    // Clean up memory management
    this.memoryMonitor.destroy();
    this.batteryManager.destroy();
    this.volumeBuffer.clear();
    
    // Return all buffers to pool and clear
    this.processingQueue.forEach(item => {
      this.audioBufferPool.returnFrequencyBuffer(item.frequencyData);
      this.audioBufferPool.returnTimeBuffer(item.timeData);
    });
    this.processingQueue = [];
    this.audioBufferPool.clear();
    this.isProcessing = false;
    
    // Disconnect audio nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    if (this.analyzerNode) {
      this.analyzerNode.disconnect();
      this.analyzerNode = null;
    }
    
    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
    this.frequencyData = null;
    this.timeData = null;
  }
}