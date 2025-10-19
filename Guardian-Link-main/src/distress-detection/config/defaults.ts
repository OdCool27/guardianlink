/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressSettings } from '../types';

/**
 * Default configuration settings for distress detection system
 */
export const DEFAULT_DISTRESS_SETTINGS: DistressSettings = {
  enabled: false,
  speechRecognition: {
    enabled: true,
    sensitivity: 70,
    language: 'en-US',
    continuousMode: true,
  },
  audioAnalysis: {
    enabled: true,
    volumeThreshold: 80, // dB above baseline
    spikeDetection: true,
    frequencyAnalysis: true,
  },
  nlpProcessing: {
    mode: 'local',
    confidenceThreshold: 70,
    customPhrases: [],
  },
  verification: {
    timeoutSeconds: 10,
    showCountdown: true,
    requireExplicitConfirmation: false,
  },
  privacy: {
    storeAudioLocally: false,
    sendToAPI: false,
    dataRetentionDays: 7,
  },
};

/**
 * Default distress phrases for local NLP processing
 */
export const DEFAULT_DISTRESS_PHRASES = [
  'help me',
  'help',
  'stop',
  'no',
  'please stop',
  'leave me alone',
  'get away',
  'I\'m scared',
  'please no',
  'don\'t hurt me',
  'call police',
  'call 911',
  'emergency',
  'someone help',
  'get off me',
  'let me go',
];

/**
 * Audio analysis configuration constants
 */
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 44100,
  FFT_SIZE: 2048,
  SMOOTHING_TIME_CONSTANT: 0.8,
  MIN_DECIBELS: -90,
  MAX_DECIBELS: -10,
  VOLUME_SPIKE_THRESHOLD: 20, // dB increase from baseline
  FREQUENCY_BINS: 1024,
  ANALYSIS_INTERVAL: 100, // milliseconds
};

/**
 * Speech recognition configuration constants
 */
export const SPEECH_CONFIG = {
  MAX_ALTERNATIVES: 1,
  INTERIM_RESULTS: true,
  CONTINUOUS: true,
  RESTART_DELAY: 1000, // milliseconds
  MAX_RESTART_ATTEMPTS: 5,
  CONFIDENCE_THRESHOLD: 0.7,
};

/**
 * Verification dialog configuration constants
 */
export const VERIFICATION_CONFIG = {
  DEFAULT_TIMEOUT: 10, // seconds
  MIN_TIMEOUT: 5,
  MAX_TIMEOUT: 30,
  COUNTDOWN_INTERVAL: 1000, // milliseconds
  AUTO_HIDE_DELAY: 2000, // milliseconds after user response
};

/**
 * API configuration for external services
 */
export const API_CONFIG = {
  HUGGING_FACE: {
    BASE_URL: 'https://api-inference.huggingface.co/models',
    SENTIMENT_MODEL: 'distilbert-base-uncased-finetuned-sst-2-english',
    WHISPER_MODEL: 'openai/whisper-base',
    TIMEOUT: 10000, // milliseconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // milliseconds
  },
};

/**
 * Storage keys for persisting settings
 */
export const STORAGE_KEYS = {
  DISTRESS_SETTINGS: 'guardianlink-distress-settings',
  DISTRESS_EVENTS: 'guardianlink-distress-events',
  PERMISSIONS_STATUS: 'guardianlink-permissions-status',
  CUSTOM_PHRASES: 'guardianlink-custom-phrases',
};