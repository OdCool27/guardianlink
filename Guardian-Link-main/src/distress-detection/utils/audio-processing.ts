/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Audio processing utilities for distress detection
 */

/**
 * Convert linear amplitude to decibels
 */
export function amplitudeToDecibels(amplitude: number): number {
  return 20 * Math.log10(Math.max(amplitude, 0.0001));
}

/**
 * Convert decibels to linear amplitude
 */
export function decibelsToAmplitude(decibels: number): number {
  return Math.pow(10, decibels / 20);
}

/**
 * Calculate RMS (Root Mean Square) from time domain data
 */
export function calculateRMS(timeData: any): number {
  let sum = 0;
  for (let i = 0; i < timeData.length; i++) {
    const sample = (timeData[i] - 128) / 128;
    sum += sample * sample;
  }
  return Math.sqrt(sum / timeData.length);
}

/**
 * Calculate peak amplitude from time domain data
 */
export function calculatePeak(timeData: Uint8Array | Uint8Array<ArrayBufferLike>): number {
  let peak = 0;
  for (let i = 0; i < timeData.length; i++) {
    const sample = Math.abs((timeData[i] - 128) / 128);
    peak = Math.max(peak, sample);
  }
  return peak;
}

/**
 * Apply smoothing to a value using exponential moving average
 */
export function smoothValue(currentValue: number, newValue: number, smoothingFactor: number): number {
  return currentValue * smoothingFactor + newValue * (1 - smoothingFactor);
}

/**
 * Detect frequency peaks in FFT data
 */
export function findFrequencyPeaks(frequencyData: any, sampleRate: number, minPeakHeight: number = 100): Array<{ frequency: number; magnitude: number }> {
  const peaks: Array<{ frequency: number; magnitude: number }> = [];
  const binSize = sampleRate / (frequencyData.length * 2);
  
  for (let i = 1; i < frequencyData.length - 1; i++) {
    const current = frequencyData[i];
    const prev = frequencyData[i - 1];
    const next = frequencyData[i + 1];
    
    // Check if current bin is a local maximum and above threshold
    if (current > prev && current > next && current > minPeakHeight) {
      peaks.push({
        frequency: i * binSize,
        magnitude: current
      });
    }
  }
  
  return peaks.sort((a, b) => b.magnitude - a.magnitude);
}

/**
 * Calculate spectral centroid (brightness measure)
 */
export function calculateSpectralCentroid(frequencyData: any, sampleRate: number): number {
  let weightedSum = 0;
  let magnitudeSum = 0;
  const binSize = sampleRate / (frequencyData.length * 2);
  
  for (let i = 0; i < frequencyData.length; i++) {
    const frequency = i * binSize;
    const magnitude = frequencyData[i];
    
    weightedSum += frequency * magnitude;
    magnitudeSum += magnitude;
  }
  
  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
}

/**
 * Calculate zero crossing rate from time domain data
 */
export function calculateZeroCrossingRate(timeData: Uint8Array | Uint8Array<ArrayBufferLike>): number {
  let crossings = 0;
  let prevSign = timeData[0] >= 128;
  
  for (let i = 1; i < timeData.length; i++) {
    const currentSign = timeData[i] >= 128;
    if (currentSign !== prevSign) {
      crossings++;
    }
    prevSign = currentSign;
  }
  
  return crossings / timeData.length;
}

/**
 * Detect if audio contains speech-like characteristics
 */
export function detectSpeechCharacteristics(frequencyData: any, sampleRate: number): {
  isSpeechLike: boolean;
  confidence: number;
} {
  // Speech typically has energy concentrated in 300-3400 Hz range
  const speechStart = Math.floor((300 / (sampleRate / 2)) * frequencyData.length);
  const speechEnd = Math.floor((3400 / (sampleRate / 2)) * frequencyData.length);
  
  let speechEnergy = 0;
  let totalEnergy = 0;
  
  for (let i = 0; i < frequencyData.length; i++) {
    const energy = frequencyData[i];
    totalEnergy += energy;
    
    if (i >= speechStart && i <= speechEnd) {
      speechEnergy += energy;
    }
  }
  
  const speechRatio = totalEnergy > 0 ? speechEnergy / totalEnergy : 0;
  const isSpeechLike = speechRatio > 0.4; // 40% of energy in speech range
  
  return {
    isSpeechLike,
    confidence: speechRatio
  };
}

/**
 * Audio quality assessment
 */
export interface AudioQuality {
  snr: number; // Signal-to-noise ratio estimate
  clarity: number; // 0-1 scale
  isClipped: boolean;
}

/**
 * Assess audio quality for processing
 */
export function assessAudioQuality(timeData: any, frequencyData: any): AudioQuality {
  // Check for clipping (samples at maximum values)
  let clippedSamples = 0;
  for (let i = 0; i < timeData.length; i++) {
    if (timeData[i] <= 1 || timeData[i] >= 254) {
      clippedSamples++;
    }
  }
  const isClipped = (clippedSamples / timeData.length) > 0.01; // More than 1% clipped
  
  // Estimate SNR by comparing signal energy to noise floor
  const rms = calculateRMS(timeData);
  const lowFreqBins = Array.from(frequencyData).slice(0, 10) as number[]; // Low frequency bins as noise estimate
  const noiseFloor = Math.min(...lowFreqBins);
  const snr = amplitudeToDecibels(rms) - amplitudeToDecibels(noiseFloor / 255);
  
  // Calculate clarity based on spectral characteristics
  const spectralCentroid = calculateSpectralCentroid(frequencyData, 44100);
  const clarity = Math.min(spectralCentroid / 4000, 1.0); // Normalize to 0-1
  
  return {
    snr: Math.max(snr, 0),
    clarity,
    isClipped
  };
}