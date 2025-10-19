/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Speech processing utilities for noise filtering and transcript cleanup
 */

/**
 * Configuration for speech processing
 */
export interface SpeechProcessingConfig {
  minConfidence: number; // Minimum confidence threshold (0-1)
  minLength: number; // Minimum transcript length
  maxLength: number; // Maximum transcript length
  enableProfanityFilter: boolean;
  enableNoiseWords: boolean;
}

/**
 * Default speech processing configuration
 */
export const DEFAULT_SPEECH_CONFIG: SpeechProcessingConfig = {
  minConfidence: 0.6,
  minLength: 2,
  maxLength: 500,
  enableProfanityFilter: false, // Disabled for distress detection
  enableNoiseWords: true,
};

/**
 * Common noise words and filler words to filter out
 */
const NOISE_WORDS = new Set([
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean',
  'basically', 'actually', 'literally', 'totally',
  'hmm', 'mmm', 'huh', 'yeah', 'ok', 'okay'
]);

/**
 * Words that should never be filtered (important for distress detection)
 */
const PROTECTED_WORDS = new Set([
  'help', 'stop', 'no', 'please', 'scared', 'hurt', 'pain',
  'emergency', 'call', 'police', 'fire', 'ambulance', 'danger',
  'attack', 'assault', 'robbery', 'break', 'in', 'intruder'
]);

/**
 * Speech quality assessment result
 */
export interface SpeechQuality {
  confidence: number;
  clarity: 'high' | 'medium' | 'low';
  hasNoise: boolean;
  wordCount: number;
  estimatedSNR?: number; // Signal-to-noise ratio estimate
}

/**
 * Processed speech result
 */
export interface ProcessedSpeech {
  originalTranscript: string;
  cleanedTranscript: string;
  confidence: number;
  quality: SpeechQuality;
  shouldProcess: boolean;
  filterReasons: string[];
}

/**
 * Assess the quality of speech recognition result
 */
export const assessSpeechQuality = (
  transcript: string,
  confidence: number
): SpeechQuality => {
  const wordCount = transcript.trim().split(/\s+/).length;
  
  // Determine clarity based on confidence and word patterns
  let clarity: 'high' | 'medium' | 'low' = 'low';
  if (confidence >= 0.8) {
    clarity = 'high';
  } else if (confidence >= 0.6) {
    clarity = 'medium';
  }

  // Detect potential noise indicators
  const hasNoise = detectNoise(transcript);
  
  // Estimate signal-to-noise ratio based on confidence and noise indicators
  let estimatedSNR: number | undefined;
  if (confidence > 0) {
    estimatedSNR = Math.max(0, (confidence - 0.3) * 30); // Rough SNR estimate
    if (hasNoise) {
      estimatedSNR *= 0.7; // Reduce SNR if noise detected
    }
  }

  return {
    confidence,
    clarity,
    hasNoise,
    wordCount,
    estimatedSNR,
  };
};

/**
 * Detect noise indicators in transcript
 */
const detectNoise = (transcript: string): boolean => {
  const lowerTranscript = transcript.toLowerCase();
  
  // Check for repeated characters (often indicates noise)
  const repeatedChars = /(.)\1{3,}/g;
  if (repeatedChars.test(lowerTranscript)) {
    return true;
  }
  
  // Check for excessive punctuation or special characters
  const specialChars = /[^\w\s'-]/g;
  const specialCharCount = (lowerTranscript.match(specialChars) || []).length;
  if (specialCharCount > transcript.length * 0.1) {
    return true;
  }
  
  // Check for very short words that might be noise
  const words = lowerTranscript.split(/\s+/);
  const shortWords = words.filter(word => word.length === 1 && !/[aio]/.test(word));
  if (shortWords.length > words.length * 0.3) {
    return true;
  }
  
  return false;
};

/**
 * Normalize and clean transcript text
 */
export const normalizeTranscript = (transcript: string): string => {
  let cleaned = transcript.trim();
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove excessive punctuation
  cleaned = cleaned.replace(/[.]{2,}/g, '.');
  cleaned = cleaned.replace(/[!]{2,}/g, '!');
  cleaned = cleaned.replace(/[?]{2,}/g, '?');
  
  // Normalize common contractions
  const contractions: Record<string, string> = {
    "won't": "will not",
    "can't": "cannot",
    "n't": " not",
    "'re": " are",
    "'ve": " have",
    "'ll": " will",
    "'d": " would",
    "'m": " am",
  };
  
  Object.entries(contractions).forEach(([contraction, expansion]) => {
    const regex = new RegExp(contraction.replace("'", "'?"), 'gi');
    cleaned = cleaned.replace(regex, expansion);
  });
  
  // Remove or replace common speech artifacts
  cleaned = cleaned.replace(/\b(um|uh|er|ah)\b/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
};

/**
 * Filter noise words while preserving important distress-related words
 */
export const filterNoiseWords = (transcript: string): string => {
  const words = transcript.toLowerCase().split(/\s+/);
  
  const filteredWords = words.filter(word => {
    // Always keep protected words
    if (PROTECTED_WORDS.has(word)) {
      return true;
    }
    
    // Filter out noise words
    if (NOISE_WORDS.has(word)) {
      return false;
    }
    
    // Keep other words
    return true;
  });
  
  return filteredWords.join(' ');
};

/**
 * Apply confidence threshold filtering
 */
export const applyConfidenceFilter = (
  confidence: number,
  minConfidence: number
): { passed: boolean; reason?: string } => {
  if (confidence < minConfidence) {
    return {
      passed: false,
      reason: `Confidence ${confidence.toFixed(2)} below threshold ${minConfidence.toFixed(2)}`,
    };
  }
  
  return { passed: true };
};

/**
 * Apply length filtering
 */
export const applyLengthFilter = (
  transcript: string,
  minLength: number,
  maxLength: number
): { passed: boolean; reason?: string } => {
  const length = transcript.trim().length;
  
  if (length < minLength) {
    return {
      passed: false,
      reason: `Transcript too short: ${length} < ${minLength}`,
    };
  }
  
  if (length > maxLength) {
    return {
      passed: false,
      reason: `Transcript too long: ${length} > ${maxLength}`,
    };
  }
  
  return { passed: true };
};

/**
 * Process speech recognition result with filtering and cleanup
 */
export const processSpeechResult = (
  transcript: string,
  confidence: number,
  config: SpeechProcessingConfig = DEFAULT_SPEECH_CONFIG
): ProcessedSpeech => {
  const filterReasons: string[] = [];
  let shouldProcess = true;
  
  // Assess speech quality
  const quality = assessSpeechQuality(transcript, confidence);
  
  // Apply confidence filtering
  const confidenceFilter = applyConfidenceFilter(confidence, config.minConfidence);
  if (!confidenceFilter.passed) {
    shouldProcess = false;
    filterReasons.push(confidenceFilter.reason!);
  }
  
  // Apply length filtering (before cleaning)
  const lengthFilter = applyLengthFilter(transcript, config.minLength, config.maxLength);
  if (!lengthFilter.passed) {
    shouldProcess = false;
    filterReasons.push(lengthFilter.reason!);
  }
  
  // Clean and normalize transcript
  let cleanedTranscript = normalizeTranscript(transcript);
  
  // Apply noise word filtering if enabled
  if (config.enableNoiseWords) {
    cleanedTranscript = filterNoiseWords(cleanedTranscript);
  }
  
  // Final length check after cleaning
  if (shouldProcess) {
    const finalLengthFilter = applyLengthFilter(cleanedTranscript, config.minLength, config.maxLength);
    if (!finalLengthFilter.passed) {
      shouldProcess = false;
      filterReasons.push(`After cleaning: ${finalLengthFilter.reason}`);
    }
  }
  
  return {
    originalTranscript: transcript,
    cleanedTranscript,
    confidence,
    quality,
    shouldProcess,
    filterReasons,
  };
};

/**
 * Create a speech processing configuration with custom settings
 */
export const createSpeechConfig = (
  overrides: Partial<SpeechProcessingConfig>
): SpeechProcessingConfig => {
  return {
    ...DEFAULT_SPEECH_CONFIG,
    ...overrides,
  };
};

/**
 * Get recommended configuration for distress detection
 */
export const getDistressDetectionConfig = (): SpeechProcessingConfig => {
  return createSpeechConfig({
    minConfidence: 0.5, // Lower threshold for distress scenarios
    minLength: 1, // Allow single words like "help"
    enableProfanityFilter: false, // Don't filter profanity in distress
    enableNoiseWords: false, // Don't filter noise words in distress
  });
};