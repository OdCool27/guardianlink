/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Worker for intensive audio analysis operations
 * Handles FFT analysis, frequency processing, and distress pattern detection
 */

// Import audio processing utilities (will be bundled with worker)
import {
  calculateRMS,
  amplitudeToDecibels,
  findFrequencyPeaks,
  calculateSpectralCentroid,
  assessAudioQuality,
  detectSpeechCharacteristics,
  calculateZeroCrossingRate,
  calculatePeak
} from '../utils/audio-processing';

export interface AudioWorkerMessage {
  type: 'ANALYZE_AUDIO' | 'UPDATE_SETTINGS' | 'RESET_STATE';
  data?: any;
}

export interface AudioAnalysisData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  sampleRate: number;
  timestamp: number;
}

export interface AudioAnalysisResult {
  metrics: {
    currentVolume: number;
    peakVolume: number;
    rms: number;
    spectralCentroid: number;
    zeroCrossingRate: number;
    peaks: Array<{ frequency: number; magnitude: number }>;
    speechCharacteristics: {
      isSpeechLike: boolean;
      confidence: number;
    };
    audioQuality: {
      snr: number;
      clarity: number;
      isClipped: boolean;
    };
  };
  distressAnalysis: {
    volumeSpikeConfidence: number;
    screamingConfidence: number;
    suddenChangeConfidence: number;
    overallConfidence: number;
    detectionReasons: string[];
  };
  timestamp: number;
}

export interface WorkerSettings {
  volumeThreshold: number;
  spikeDetection: boolean;
  frequencyAnalysis: boolean;
  sensitivity: number;
}

// Worker state
let settings: WorkerSettings = {
  volumeThreshold: 15,
  spikeDetection: true,
  frequencyAnalysis: true,
  sensitivity: 70
};

let volumeHistory: number[] = [];
let previousVolume = 0;
let suddenChangeHistory: number[] = [];
let baselineVolume = 0;
let peakVolume = 0;

const VOLUME_HISTORY_SIZE = 50;
const CHANGE_HISTORY_SIZE = 10;

/**
 * Main message handler for the worker
 */
self.onmessage = (event: MessageEvent<AudioWorkerMessage>) => {
  const { type, data } = event.data;
  
  try {
    switch (type) {
      case 'ANALYZE_AUDIO':
        const result = analyzeAudioData(data as AudioAnalysisData);
        self.postMessage({
          type: 'ANALYSIS_RESULT',
          data: result
        });
        break;
        
      case 'UPDATE_SETTINGS':
        updateSettings(data as Partial<WorkerSettings>);
        self.postMessage({
          type: 'SETTINGS_UPDATED',
          data: settings
        });
        break;
        
      case 'RESET_STATE':
        resetAnalysisState();
        self.postMessage({
          type: 'STATE_RESET'
        });
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      data: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  }
};

/**
 * Analyze audio data and detect distress patterns
 */
function analyzeAudioData(audioData: AudioAnalysisData): AudioAnalysisResult {
  const { frequencyData, timeData, sampleRate, timestamp } = audioData;
  
  // Calculate basic audio metrics
  const rms = calculateRMS(timeData);
  const currentVolume = amplitudeToDecibels(rms);
  const peak = calculatePeak(timeData);
  const spectralCentroid = calculateSpectralCentroid(frequencyData, sampleRate);
  const zeroCrossingRate = calculateZeroCrossingRate(timeData);
  
  // Update volume tracking
  updateVolumeTracking(currentVolume);
  
  // Find frequency peaks
  const peaks = findFrequencyPeaks(frequencyData, sampleRate, 80);
  
  // Detect speech characteristics
  const speechCharacteristics = detectSpeechCharacteristics(frequencyData, sampleRate);
  
  // Assess audio quality
  const audioQuality = assessAudioQuality(timeData, frequencyData);
  
  // Perform distress analysis
  const distressAnalysis = performDistressAnalysis(
    currentVolume,
    frequencyData,
    timeData,
    sampleRate,
    peaks,
    speechCharacteristics
  );
  
  // Update peak volume
  peakVolume = Math.max(peakVolume, currentVolume);
  
  // Update previous volume for next analysis
  previousVolume = currentVolume;
  
  return {
    metrics: {
      currentVolume,
      peakVolume,
      rms,
      spectralCentroid,
      zeroCrossingRate,
      peaks: peaks.slice(0, 10), // Limit to top 10 peaks
      speechCharacteristics,
      audioQuality
    },
    distressAnalysis,
    timestamp
  };
}

/**
 * Update volume tracking for baseline calculation
 */
function updateVolumeTracking(currentVolume: number): void {
  volumeHistory.push(currentVolume);
  if (volumeHistory.length > VOLUME_HISTORY_SIZE) {
    volumeHistory.shift();
  }
  
  // Calculate baseline as average of recent volumes
  baselineVolume = volumeHistory.reduce((a, b) => a + b, 0) / volumeHistory.length;
}

/**
 * Perform comprehensive distress analysis
 */
function performDistressAnalysis(
  currentVolume: number,
  frequencyData: Uint8Array,
  timeData: Uint8Array,
  sampleRate: number,
  peaks: Array<{ frequency: number; magnitude: number }>,
  speechCharacteristics: { isSpeechLike: boolean; confidence: number }
): {
  volumeSpikeConfidence: number;
  screamingConfidence: number;
  suddenChangeConfidence: number;
  overallConfidence: number;
  detectionReasons: string[];
} {
  const detectionReasons: string[] = [];
  let overallConfidence = 0;
  
  // Volume spike detection
  let volumeSpikeConfidence = 0;
  if (settings.spikeDetection) {
    volumeSpikeConfidence = detectVolumeSpikeWithThreshold(currentVolume);
    if (volumeSpikeConfidence > 0) {
      overallConfidence += volumeSpikeConfidence * 0.3;
      detectionReasons.push(`Volume spike: ${(volumeSpikeConfidence * 100).toFixed(1)}%`);
    }
  }
  
  // Screaming pattern analysis
  let screamingConfidence = 0;
  if (settings.frequencyAnalysis) {
    screamingConfidence = analyzeScreamingPattern(
      frequencyData,
      sampleRate,
      peaks,
      speechCharacteristics
    );
    if (screamingConfidence > 0) {
      overallConfidence += screamingConfidence * 0.4;
      detectionReasons.push(`Screaming pattern: ${(screamingConfidence * 100).toFixed(1)}%`);
    }
  }
  
  // Sudden audio change detection
  const suddenChangeConfidence = detectSuddenAudioChanges(currentVolume);
  if (suddenChangeConfidence > 0) {
    overallConfidence += suddenChangeConfidence * 0.3;
    detectionReasons.push(`Sudden change: ${(suddenChangeConfidence * 100).toFixed(1)}%`);
  }
  
  // Apply sensitivity adjustment
  overallConfidence *= (settings.sensitivity / 100);
  
  return {
    volumeSpikeConfidence,
    screamingConfidence,
    suddenChangeConfidence,
    overallConfidence,
    detectionReasons
  };
}

/**
 * Detect volume spikes with configurable thresholds
 */
function detectVolumeSpikeWithThreshold(currentVolume: number): number {
  const baseline = baselineVolume;
  const volumeIncrease = currentVolume - baseline;
  
  if (volumeIncrease < settings.volumeThreshold) return 0;
  
  // Calculate confidence based on how much the threshold is exceeded
  const maxExpectedIncrease = settings.volumeThreshold * 2;
  const confidence = Math.min(volumeIncrease / maxExpectedIncrease, 1.0);
  
  // Additional check for very sudden spikes
  const suddennessMultiplier = calculateSuddenness(currentVolume);
  
  return confidence * suddennessMultiplier;
}

/**
 * Analyze frequency data for screaming patterns
 */
function analyzeScreamingPattern(
  frequencyData: Uint8Array,
  sampleRate: number,
  peaks: Array<{ frequency: number; magnitude: number }>,
  speechCharacteristics: { isSpeechLike: boolean; confidence: number }
): number {
  const spectralCentroid = calculateSpectralCentroid(frequencyData, sampleRate);
  
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
  if (!speechCharacteristics.isSpeechLike) {
    screamConfidence += 0.2;
  } else {
    screamConfidence *= (1 - speechCharacteristics.confidence * 0.5);
  }
  
  // Check for very high frequency content (4-8 kHz)
  const highFreqPeaks = peaks.filter(peak => peak.frequency >= 4000 && peak.frequency <= 8000);
  if (highFreqPeaks.length > 0) {
    screamConfidence += 0.1;
  }
  
  return Math.min(screamConfidence, 1.0);
}

/**
 * Detect sudden audio changes that might indicate distress
 */
function detectSuddenAudioChanges(currentVolume: number): number {
  const volumeChange = Math.abs(currentVolume - previousVolume);
  
  // Track sudden changes in volume
  suddenChangeHistory.push(volumeChange);
  if (suddenChangeHistory.length > CHANGE_HISTORY_SIZE) {
    suddenChangeHistory.shift();
  }
  
  // Calculate average change rate
  const avgChange = suddenChangeHistory.reduce((a, b) => a + b, 0) / suddenChangeHistory.length;
  
  // Detect if current change is significantly above average
  const changeThreshold = Math.max(avgChange * 2, 5);
  
  if (volumeChange < changeThreshold) return 0;
  
  // Check for pattern of multiple sudden changes
  const recentSuddenChanges = suddenChangeHistory.filter(change => change > changeThreshold).length;
  const patternMultiplier = Math.min(recentSuddenChanges / 3, 1.0);
  
  // Calculate confidence
  const maxExpectedChange = changeThreshold * 3;
  const baseConfidence = Math.min(volumeChange / maxExpectedChange, 1.0);
  
  return baseConfidence * patternMultiplier;
}

/**
 * Calculate suddenness factor for volume changes
 */
function calculateSuddenness(currentVolume: number): number {
  const volumeChange = Math.abs(currentVolume - previousVolume);
  
  if (volumeChange > 15) return 1.2;
  if (volumeChange > 10) return 1.1;
  if (volumeChange > 5) return 1.0;
  
  return 0.8;
}

/**
 * Update worker settings
 */
function updateSettings(newSettings: Partial<WorkerSettings>): void {
  settings = { ...settings, ...newSettings };
}

/**
 * Reset analysis state
 */
function resetAnalysisState(): void {
  volumeHistory = [];
  suddenChangeHistory = [];
  previousVolume = 0;
  baselineVolume = 0;
  peakVolume = 0;
}

// Export types for TypeScript compilation
export {};