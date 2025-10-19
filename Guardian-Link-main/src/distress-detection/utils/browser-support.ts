/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference path="../types/web-speech-api.d.ts" />

/**
 * Browser support detection utilities for distress detection features
 */

/**
 * Check if Web Speech API is supported in the current browser
 */
export const isSpeechRecognitionSupported = (): boolean => {
  return !!(
    window.SpeechRecognition || 
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition
  );
};

/**
 * Get the SpeechRecognition constructor for the current browser
 */
export const getSpeechRecognitionConstructor = (): typeof SpeechRecognition | null => {
  return (
    window.SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition ||
    null
  );
};

/**
 * Check if Web Audio API is supported in the current browser
 */
export const isWebAudioSupported = (): boolean => {
  return !!(
    window.AudioContext || 
    (window as any).webkitAudioContext ||
    (window as any).mozAudioContext
  );
};

/**
 * Get the AudioContext constructor for the current browser
 */
export const getAudioContextConstructor = (): typeof AudioContext | null => {
  return (
    window.AudioContext ||
    (window as any).webkitAudioContext ||
    (window as any).mozAudioContext ||
    null
  );
};

/**
 * Check if MediaDevices API is supported for microphone access
 */
export const isMediaDevicesSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Check if Permissions API is supported
 */
export const isPermissionsAPISupported = (): boolean => {
  return !!(navigator.permissions && navigator.permissions.query);
};

/**
 * Check if Web Workers are supported
 */
export const isWebWorkersSupported = (): boolean => {
  return typeof Worker !== 'undefined';
};

/**
 * Get comprehensive browser support information
 */
export const getBrowserSupport = () => {
  return {
    speechRecognition: isSpeechRecognitionSupported(),
    webAudio: isWebAudioSupported(),
    mediaDevices: isMediaDevicesSupported(),
    permissions: isPermissionsAPISupported(),
    webWorkers: isWebWorkersSupported(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
  };
};

/**
 * Check if all required features are supported for distress detection
 */
export const isDistressDetectionSupported = (): boolean => {
  return (
    isSpeechRecognitionSupported() &&
    isWebAudioSupported() &&
    isMediaDevicesSupported()
  );
};

/**
 * Get user-friendly error messages for unsupported features
 */
export const getUnsupportedFeatureMessage = (): string | null => {
  if (!isMediaDevicesSupported()) {
    return 'Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Safari.';
  }
  
  if (!isSpeechRecognitionSupported()) {
    return 'Speech recognition is not supported in your browser. Some distress detection features may not work properly.';
  }
  
  if (!isWebAudioSupported()) {
    return 'Audio analysis is not supported in your browser. Some distress detection features may not work properly.';
  }
  
  return null;
};

/**
 * Browser information for debugging and analytics
 */
export const getBrowserInfo = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
  };
};