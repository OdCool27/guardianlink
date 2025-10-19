/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioAnalysisEngine, AudioMetrics } from '../interfaces/AudioAnalysisEngine';
import { AUDIO_CONFIG } from '../config/defaults';
import { 
  calculateRMS, 
  amplitudeToDecibels, 
  findFrequencyPeaks, 
  calculateSpectralCentroid,
  assessAudioQuality,
  detectSpeechCharacteristics 
} from '../utils/audio-processing';

/**
 * Audio analysis service implementation using Web Audio API
 * Provides real-time audio analysis for distress detection
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
  
  // Analysis state
  private baselineVolume = 0;
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
  
  // Volume tracking for baseline calculation
  private volumeHistory: number[] = [];
  private readonly VOLUME_HISTORY_SIZE = 50;
  
  // Advanced detection state
  private previousVolume = 0;
  private suddenChangeHistory: number[] = [];
  private readonly CHANGE_HISTORY_SIZE = 10;
  private lastSignificantChange = 0;
  
  /**
   * Initialize the audio analysis engine
   */
  async initialize(): Promise<void> {
    try {
      // Check Web Audio API support
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error('Web Audio API is not supported in this browser');
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
    
    // Initialize data arrays
    const bufferLength = this.analyzerNode.frequencyBinCount;
    this.frequencyData = new Uint8Array(bufferLength);
    this.timeData = new Uint8Array(bufferLength);
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
  }
  
  /**
   * Get current audio metrics
   */
  getCurrentMetrics(): AudioMetrics {
    return { ...this.currentMetrics };
  }
  
  /**
   * Main analysis loop using requestAnimationFrame
   */
  private startAnalysisLoop(): void {
    if (!this.analyzing || !this.analyzerNode || !this.frequencyData || !this.timeData) {
      return;
    }
    
    // Get current audio data
    this.analyzerNode.getByteFrequencyData(this.frequencyData);
    this.analyzerNode.getByteTimeDomainData(this.timeData);
    
    // Calculate audio metrics
    this.updateAudioMetrics();
    
    // Assess audio quality before analysis
    const audioQuality = assessAudioQuality(this.timeData, this.frequencyData);
    
    // Only perform analysis if audio quality is sufficient
    if (audioQuality.snr > 10 && !audioQuality.isClipped) {
      this.performDistressAnalysis();
    }
    
    // Schedule next analysis frame
    this.animationFrameId = requestAnimationFrame(() => this.startAnalysisLoop());
  }
  
  /**
   * Update current audio metrics from analyzer data
   */
  private updateAudioMetrics(): void {
    if (!this.frequencyData || !this.timeData) return;
    
    // Calculate RMS volume using utility function
    const rms = calculateRMS(this.timeData);
    const volume = amplitudeToDecibels(rms);
    
    // Update volume history for baseline calculation
    this.volumeHistory.push(volume);
    if (this.volumeHistory.length > this.VOLUME_HISTORY_SIZE) {
      this.volumeHistory.shift();
    }
    
    // Calculate baseline as average of recent volumes
    this.baselineVolume = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;
    
    // Update metrics
    this.currentMetrics = {
      currentVolume: volume,
      peakVolume: Math.max(this.currentMetrics.peakVolume, volume),
      averageVolume: this.baselineVolume,
      frequencyData: new Float32Array(this.frequencyData),
      timestamp: new Date()
    };
  }
  
  /**
   * Analyze audio for distress patterns
   */
  private performDistressAnalysis(): void {
    let distressConfidence = 0;
    const detectionResults: string[] = [];
    
    // Volume spike detection with configurable thresholds
    if (this.settings.spikeDetection) {
      const spikeConfidence = this.detectVolumeSpikeWithThreshold();
      if (spikeConfidence > 0) {
        distressConfidence += spikeConfidence * 0.3;
        detectionResults.push(`Volume spike: ${(spikeConfidence * 100).toFixed(1)}%`);
      }
    }
    
    // Frequency analysis for screaming patterns
    if (this.settings.frequencyAnalysis && this.frequencyData) {
      const screamingConfidence = this.analyzeScreamingPattern();
      if (screamingConfidence > 0) {
        distressConfidence += screamingConfidence * 0.4;
        detectionResults.push(`Screaming pattern: ${(screamingConfidence * 100).toFixed(1)}%`);
      }
    }
    
    // Sudden audio change detection
    const suddenChangeConfidence = this.detectSuddenAudioChanges();
    if (suddenChangeConfidence > 0) {
      distressConfidence += suddenChangeConfidence * 0.3;
      detectionResults.push(`Sudden change: ${(suddenChangeConfidence * 100).toFixed(1)}%`);
    }
    
    // Apply sensitivity adjustment
    distressConfidence *= (this.settings.sensitivity / 100);
    
    // Trigger callback if confidence threshold is met
    if (distressConfidence > 0.3 && this.distressCallback) {
      console.log(`Distress detected: ${(distressConfidence * 100).toFixed(1)}% - ${detectionResults.join(', ')}`);
      this.distressCallback(distressConfidence, this.getCurrentMetrics());
    }
    
    // Update previous volume for change detection
    this.previousVolume = this.currentMetrics.currentVolume;
  }
  
  /**
   * Analyze frequency data for screaming patterns
   */
  private analyzeScreamingPattern(): number {
    if (!this.frequencyData || !this.audioContext) return 0;
    
    const sampleRate = this.audioContext.sampleRate;
    
    // Find frequency peaks to identify dominant frequencies
    const peaks = findFrequencyPeaks(this.frequencyData, sampleRate, 80);
    
    // Calculate spectral centroid (brightness)
    const spectralCentroid = calculateSpectralCentroid(this.frequencyData, sampleRate);
    
    // Check if audio has speech characteristics (to distinguish from screaming)
    const speechAnalysis = detectSpeechCharacteristics(this.frequencyData, sampleRate);
    
    // Screaming typically has:
    // 1. High spectral centroid (bright sound)
    // 2. Energy concentrated in 1-4 kHz range
    // 3. Less speech-like characteristics
    // 4. High-frequency peaks
    
    let screamConfidence = 0;
    
    // High spectral centroid indicates bright, harsh sounds
    if (spectralCentroid > 2000) {
      screamConfidence += Math.min((spectralCentroid - 2000) / 3000, 0.4);
    }
    
    // Check for peaks in scream frequency range (1-4 kHz)
    const screamPeaks = peaks.filter(peak => peak.frequency >= 1000 && peak.frequency <= 4000);
    if (screamPeaks.length > 0) {
      const maxScreamPeak = Math.max(...screamPeaks.map(p => p.magnitude));
      screamConfidence += Math.min(maxScreamPeak / 200, 0.3);
    }
    
    // Inverse correlation with speech characteristics
    if (!speechAnalysis.isSpeechLike) {
      screamConfidence += 0.2;
    } else {
      screamConfidence *= (1 - speechAnalysis.confidence * 0.5);
    }
    
    // Check for very high frequency content (4-8 kHz)
    const highFreqPeaks = peaks.filter(peak => peak.frequency >= 4000 && peak.frequency <= 8000);
    if (highFreqPeaks.length > 0) {
      screamConfidence += 0.1;
    }
    
    return Math.min(screamConfidence, 1.0);
  }
  
  /**
   * Detect volume spikes with configurable thresholds
   */
  private detectVolumeSpikeWithThreshold(): number {
    const currentVolume = this.currentMetrics.currentVolume;
    const baseline = this.baselineVolume;
    
    // Calculate volume increase from baseline
    const volumeIncrease = currentVolume - baseline;
    
    // Apply configurable threshold
    const threshold = this.settings.volumeThreshold;
    
    if (volumeIncrease < threshold) return 0;
    
    // Calculate confidence based on how much the threshold is exceeded
    const maxExpectedIncrease = threshold * 2; // Double threshold = 100% confidence
    const confidence = Math.min(volumeIncrease / maxExpectedIncrease, 1.0);
    
    // Additional check for very sudden spikes (indicates impact or sudden loud noise)
    const suddennessMultiplier = this.calculateSuddenness(currentVolume);
    
    return confidence * suddennessMultiplier;
  }
  
  /**
   * Detect sudden audio changes that might indicate distress
   */
  private detectSuddenAudioChanges(): number {
    const currentVolume = this.currentMetrics.currentVolume;
    const volumeChange = Math.abs(currentVolume - this.previousVolume);
    
    // Track sudden changes in volume
    this.suddenChangeHistory.push(volumeChange);
    if (this.suddenChangeHistory.length > this.CHANGE_HISTORY_SIZE) {
      this.suddenChangeHistory.shift();
    }
    
    // Calculate average change rate
    const avgChange = this.suddenChangeHistory.reduce((a, b) => a + b, 0) / this.suddenChangeHistory.length;
    
    // Detect if current change is significantly above average
    const changeThreshold = Math.max(avgChange * 2, 5); // At least 5dB change
    
    if (volumeChange < changeThreshold) return 0;
    
    // Check for pattern of multiple sudden changes (struggle, impact sounds)
    const recentSuddenChanges = this.suddenChangeHistory.filter(change => change > changeThreshold).length;
    const patternMultiplier = Math.min(recentSuddenChanges / 3, 1.0); // More changes = higher confidence
    
    // Calculate confidence
    const maxExpectedChange = changeThreshold * 3;
    const baseConfidence = Math.min(volumeChange / maxExpectedChange, 1.0);
    
    return baseConfidence * patternMultiplier;
  }
  
  /**
   * Calculate suddenness factor for volume changes
   */
  private calculateSuddenness(currentVolume: number): number {
    const volumeChange = Math.abs(currentVolume - this.previousVolume);
    
    // Very sudden changes (>15dB in one frame) get higher weight
    if (volumeChange > 15) return 1.2;
    if (volumeChange > 10) return 1.1;
    if (volumeChange > 5) return 1.0;
    
    return 0.8; // Gradual changes get lower weight
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
    this.volumeHistory = [];
  }
}