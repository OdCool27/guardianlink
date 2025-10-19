/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference path="./web-speech-api.d.ts" />

// Core distress detection types and interfaces

export interface DistressSettings {
  enabled: boolean;
  speechRecognition: {
    enabled: boolean;
    sensitivity: number; // 0-100
    language: string;
    continuousMode: boolean;
  };
  audioAnalysis: {
    enabled: boolean;
    volumeThreshold: number; // dB
    spikeDetection: boolean;
    frequencyAnalysis: boolean;
  };
  nlpProcessing: {
    mode: 'local' | 'api';
    confidenceThreshold: number; // 0-100
    customPhrases: string[];
  };
  verification: {
    timeoutSeconds: number;
    showCountdown: boolean;
    requireExplicitConfirmation: boolean;
  };
  privacy: {
    storeAudioLocally: boolean;
    sendToAPI: boolean;
    dataRetentionDays: number;
  };
}

export interface DistressAnalysis {
  isDistress: boolean;
  confidence: number;
  detectedPhrases: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface DistressContext {
  detectionMethod: 'speech' | 'audio' | 'combined';
  confidence: number;
  timestamp: Date;
  audioData?: Blob;
  transcript?: string;
}

export interface DistressEvent {
  id: string;
  timestamp: Date;
  detectionMethod: 'speech' | 'audio' | 'combined';
  confidence: number;
  transcript?: string;
  audioMetrics?: {
    peakVolume: number;
    duration: number;
    frequencyProfile: number[];
  };
  userResponse: 'confirmed' | 'dismissed' | 'timeout';
  sosTriggered: boolean;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface VerificationResult {
  action: 'confirm' | 'dismiss' | 'timeout';
  timestamp: Date;
}

export type DistressDetectionStatus = 'inactive' | 'initializing' | 'active' | 'error';

export interface DistressDetectionState {
  status: DistressDetectionStatus;
  isListening: boolean;
  isAnalyzing: boolean;
  lastDetection?: DistressEvent;
  errorMessage?: string;
}