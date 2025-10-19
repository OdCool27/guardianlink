/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DistressDetectionManager } from '../../distress-detection/services/DistressDetectionManager';

// Mock the service dependencies
const mockSpeechService = {
  initialize: vi.fn(() => Promise.resolve()),
  startListening: vi.fn(),
  stopListening: vi.fn(),
  isListening: vi.fn(() => false),
  onResult: vi.fn(),
  onProcessedResult: vi.fn(),
  onError: vi.fn(),
  onStateChange: vi.fn(),
  updateSettings: vi.fn(),
  destroy: vi.fn()
};

const mockAudioService = {
  initialize: vi.fn(() => Promise.resolve()),
  startAnalysis: vi.fn(),
  stopAnalysis: vi.fn(),
  isAnalyzing: vi.fn(() => false),
  onDistressDetected: vi.fn(),
  getCurrentMetrics: vi.fn(() => ({
    peakVolume: 0,
    averageVolume: 0,
    frequencyProfile: [],
    lastUpdate: new Date()
  })),
  updateSettings: vi.fn(),
  destroy: vi.fn()
};

const mockClassificationService = {
  analyzeText: vi.fn(() => Promise.resolve({
    isDistress: false,
    confidence: 0,
    detectedPhrases: [],
    sentiment: 'neutral' as const
  })),
  setProcessingMode: vi.fn(),
  getProcessingMode: vi.fn(() => 'local' as const),
  addCustomPhrase: vi.fn(),
  removeCustomPhrase: vi.fn(),
  getCustomPhrases: vi.fn(() => []),
  setConfidenceThreshold: vi.fn()
};

const mockVerificationService = {
  showVerification: vi.fn(() => Promise.resolve({
    action: 'dismiss' as const,
    timestamp: new Date()
  })),
  hideVerification: vi.fn(),
  isVisible: vi.fn(() => false)
};

const mockEmergencyHandler = {
  triggerSOS: vi.fn(() => Promise.resolve()),
  isEmergencyActive: vi.fn(() => false),
  getEmergencyStats: vi.fn(() => ({
    totalTriggers: 0,
    lastTrigger: null,
    averageResponseTime: 0
  })),
  logDistressEvent: vi.fn()
};

const mockPermissionsManager = {
  requestMicrophonePermission: vi.fn(() => Promise.resolve(true)),
  checkMicrophonePermission: vi.fn(() => Promise.resolve('granted')),
  onPermissionChange: vi.fn()
};

// Mock the service constructors
vi.mock('../../distress-detection/services/SpeechRecognitionService', () => ({
  SpeechRecognitionService: vi.fn(() => mockSpeechService)
}));

vi.mock('../../distress-detection/services/AudioAnalysisService', () => ({
  AudioAnalysisService: vi.fn(() => mockAudioService)
}));

vi.mock('../../distress-detection/services/DistressClassificationService', () => ({
  DistressClassificationService: vi.fn(() => mockClassificationService)
}));

vi.mock('../../distress-detection/services/VerificationService', () => ({
  VerificationService: vi.fn(() => mockVerificationService)
}));

vi.mock('../../distress-detection/services/EmergencyResponseHandler', () => ({
  EmergencyResponseHandler: vi.fn(() => mockEmergencyHandler)
}));

vi.mock('../../distress-detection/services/PermissionsManager', () => ({
  PermissionsManager: vi.fn(() => mockPermissionsManager)
}));

describe('DistressDetectionManager', () => {
  let manager: DistressDetectionManager;

  beforeEach(() => {
    manager = new DistressDetectionManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize all services successfully', async () => {
      await manager.initialize();

      expect(mockPermissionsManager.requestMicrophonePermission).toHaveBeenCalled();
      expect(mockSpeechService.initialize).toHaveBeenCalled();
      expect(mockAudioService.initialize).toHaveBeenCalled();
    });

    it('should handle permission denial gracefully', async () => {
      mockPermissionsManager.requestMicrophonePermission.mockResolvedValue(false);

      await expect(manager.initialize()).rejects.toThrow('Microphone permission denied');
    });

    it('should handle service initialization failures', async () => {
      mockSpeechService.initialize.mockRejectedValue(new Error('Speech service failed'));

      await expect(manager.initialize()).rejects.toThrow('Speech service failed');
    });

    it('should set up event listeners for services', async () => {
      await manager.initialize();

      expect(mockSpeechService.onProcessedResult).toHaveBeenCalled();
      expect(mockAudioService.onDistressDetected).toHaveBeenCalled();
      expect(mockSpeechService.onError).toHaveBeenCalled();
    });
  });

  describe('monitoring control', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should start monitoring when startMonitoring is called', async () => {
      await manager.startMonitoring();

      expect(mockSpeechService.startListening).toHaveBeenCalled();
      expect(mockAudioService.startAnalysis).toHaveBeenCalled();
      expect(manager.isMonitoring()).toBe(true);
    });

    it('should stop monitoring when stopMonitoring is called', () => {
      manager.startMonitoring();
      manager.stopMonitoring();

      expect(mockSpeechService.stopListening).toHaveBeenCalled();
      expect(mockAudioService.stopAnalysis).toHaveBeenCalled();
      expect(manager.isMonitoring()).toBe(false);
    });

    it('should not start monitoring if not initialized', async () => {
      const uninitializedManager = new DistressDetectionManager();
      
      await expect(uninitializedManager.startMonitoring()).rejects.toThrow('Manager not initialized');
    });

    it('should handle service start failures gracefully', async () => {
      mockSpeechService.startListening.mockImplementation(() => {
        throw new Error('Failed to start speech recognition');
      });

      await expect(manager.startMonitoring()).rejects.toThrow('Failed to start speech recognition');
    });
  });

  describe('distress detection', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.startMonitoring();
    });

    it('should handle speech-based distress detection', async () => {
      mockClassificationService.analyzeText.mockResolvedValue({
        isDistress: true,
        confidence: 0.85,
        detectedPhrases: ['help me'],
        sentiment: 'negative'
      });

      // Simulate speech result callback
      const speechCallback = mockSpeechService.onProcessedResult.mock.calls[0][0];
      await speechCallback({
        transcript: 'help me please',
        confidence: 0.9,
        isDistress: true,
        distressConfidence: 0.85,
        detectedPhrases: ['help me'],
        sentiment: 'negative'
      });

      expect(mockVerificationService.showVerification).toHaveBeenCalledWith(
        'speech',
        0.85,
        expect.any(Object)
      );
    });

    it('should handle audio-based distress detection', async () => {
      // Simulate audio distress callback
      const audioCallback = mockAudioService.onDistressDetected.mock.calls[0][0];
      audioCallback({
        confidence: 0.78,
        type: 'volume_spike',
        metrics: {
          peakVolume: 95,
          averageVolume: 65,
          frequencyProfile: [120, 250, 180],
          lastUpdate: new Date()
        }
      });

      expect(mockVerificationService.showVerification).toHaveBeenCalledWith(
        'audio',
        0.78,
        expect.any(Object)
      );
    });

    it('should combine multiple detection sources', async () => {
      // First trigger speech detection
      mockClassificationService.analyzeText.mockResolvedValue({
        isDistress: true,
        confidence: 0.75,
        detectedPhrases: ['help'],
        sentiment: 'negative'
      });

      const speechCallback = mockSpeechService.onProcessedResult.mock.calls[0][0];
      await speechCallback({
        transcript: 'help',
        confidence: 0.8,
        isDistress: true,
        distressConfidence: 0.75,
        detectedPhrases: ['help'],
        sentiment: 'negative'
      });

      // Then trigger audio detection within correlation window
      const audioCallback = mockAudioService.onDistressDetected.mock.calls[0][0];
      audioCallback({
        confidence: 0.70,
        type: 'frequency_pattern',
        metrics: {
          peakVolume: 88,
          averageVolume: 60,
          frequencyProfile: [150, 300, 200],
          lastUpdate: new Date()
        }
      });

      // Should show verification with combined confidence
      expect(mockVerificationService.showVerification).toHaveBeenCalledWith(
        'combined',
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should filter out low confidence detections', async () => {
      mockClassificationService.analyzeText.mockResolvedValue({
        isDistress: true,
        confidence: 0.45, // Below default threshold
        detectedPhrases: ['maybe help'],
        sentiment: 'neutral'
      });

      const speechCallback = mockSpeechService.onProcessedResult.mock.calls[0][0];
      await speechCallback({
        transcript: 'maybe help',
        confidence: 0.6,
        isDistress: true,
        distressConfidence: 0.45,
        detectedPhrases: ['maybe help'],
        sentiment: 'neutral'
      });

      expect(mockVerificationService.showVerification).not.toHaveBeenCalled();
    });
  });

  describe('verification handling', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.startMonitoring();
    });

    it('should trigger SOS when user confirms distress', async () => {
      mockVerificationService.showVerification.mockResolvedValue({
        action: 'confirm',
        timestamp: new Date()
      });

      // Trigger distress detection
      const audioCallback = mockAudioService.onDistressDetected.mock.calls[0][0];
      audioCallback({
        confidence: 0.85,
        type: 'volume_spike',
        metrics: {
          peakVolume: 95,
          averageVolume: 65,
          frequencyProfile: [120, 250, 180],
          lastUpdate: new Date()
        }
      });

      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async handling

      expect(mockEmergencyHandler.triggerSOS).toHaveBeenCalled();
    });

    it('should continue monitoring when user dismisses alert', async () => {
      mockVerificationService.showVerification.mockResolvedValue({
        action: 'dismiss',
        timestamp: new Date()
      });

      // Trigger distress detection
      const audioCallback = mockAudioService.onDistressDetected.mock.calls[0][0];
      audioCallback({
        confidence: 0.85,
        type: 'volume_spike',
        metrics: {
          peakVolume: 95,
          averageVolume: 65,
          frequencyProfile: [120, 250, 180],
          lastUpdate: new Date()
        }
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockEmergencyHandler.triggerSOS).not.toHaveBeenCalled();
      expect(manager.isMonitoring()).toBe(true);
    });

    it('should trigger SOS on verification timeout', async () => {
      mockVerificationService.showVerification.mockResolvedValue({
        action: 'timeout',
        timestamp: new Date()
      });

      // Trigger distress detection
      const audioCallback = mockAudioService.onDistressDetected.mock.calls[0][0];
      audioCallback({
        confidence: 0.85,
        type: 'volume_spike',
        metrics: {
          peakVolume: 95,
          averageVolume: 65,
          frequencyProfile: [120, 250, 180],
          lastUpdate: new Date()
        }
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockEmergencyHandler.triggerSOS).toHaveBeenCalled();
    });
  });

  describe('settings management', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should update speech recognition settings', () => {
      const settings = {
        speechRecognition: {
          enabled: true,
          sensitivity: 80,
          language: 'es-ES',
          continuousMode: true
        }
      };

      manager.updateSettings(settings);

      expect(mockSpeechService.updateSettings).toHaveBeenCalledWith({
        language: 'es-ES',
        continuous: true
      });
    });

    it('should update audio analysis settings', () => {
      const settings = {
        audioAnalysis: {
          enabled: true,
          volumeThreshold: 85,
          spikeDetection: true,
          frequencyAnalysis: false
        }
      };

      manager.updateSettings(settings);

      expect(mockAudioService.updateSettings).toHaveBeenCalledWith({
        volumeThreshold: 85,
        spikeDetection: true,
        frequencyAnalysis: false
      });
    });

    it('should update NLP processing settings', () => {
      const settings = {
        nlpProcessing: {
          mode: 'api' as const,
          confidenceThreshold: 75,
          customPhrases: ['emergency code']
        }
      };

      manager.updateSettings(settings);

      expect(mockClassificationService.setProcessingMode).toHaveBeenCalledWith('api');
      expect(mockClassificationService.setConfidenceThreshold).toHaveBeenCalledWith(0.75);
    });

    it('should disable services when settings are disabled', () => {
      const settings = {
        speechRecognition: { enabled: false },
        audioAnalysis: { enabled: false }
      };

      manager.updateSettings(settings);

      expect(mockSpeechService.stopListening).toHaveBeenCalled();
      expect(mockAudioService.stopAnalysis).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should handle speech recognition errors', () => {
      const errorCallback = mockSpeechService.onError.mock.calls[0][0];
      const error = new Error('Speech recognition failed');

      errorCallback(error);

      // Should attempt to restart or handle gracefully
      expect(mockSpeechService.startListening).toHaveBeenCalled();
    });

    it('should handle service restart failures', () => {
      mockSpeechService.startListening.mockImplementation(() => {
        throw new Error('Restart failed');
      });

      const errorCallback = mockSpeechService.onError.mock.calls[0][0];
      errorCallback(new Error('Initial error'));

      // Should handle restart failure gracefully
      expect(() => errorCallback(new Error('Test error'))).not.toThrow();
    });

    it('should provide fallback when all services fail', async () => {
      mockSpeechService.initialize.mockRejectedValue(new Error('Speech failed'));
      mockAudioService.initialize.mockRejectedValue(new Error('Audio failed'));

      const fallbackManager = new DistressDetectionManager();
      
      // Should still allow manual SOS triggering
      expect(() => fallbackManager.triggerManualSOS()).not.toThrow();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.startMonitoring();
    });

    it('should cleanup all resources when destroyed', async () => {
      await manager.destroy();

      expect(mockSpeechService.destroy).toHaveBeenCalled();
      expect(mockAudioService.destroy).toHaveBeenCalled();
      expect(manager.isMonitoring()).toBe(false);
    });

    it('should handle cleanup when services are not initialized', async () => {
      const uninitializedManager = new DistressDetectionManager();
      
      await expect(uninitializedManager.destroy()).resolves.not.toThrow();
    });
  });

  describe('status and metrics', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should provide current status information', () => {
      const status = manager.getStatus();

      expect(status).toHaveProperty('isMonitoring');
      expect(status).toHaveProperty('speechRecognition');
      expect(status).toHaveProperty('audioAnalysis');
      expect(status).toHaveProperty('lastActivity');
    });

    it('should track detection statistics', () => {
      const stats = manager.getDetectionStats();

      expect(stats).toHaveProperty('totalDetections');
      expect(stats).toHaveProperty('falsePositives');
      expect(stats).toHaveProperty('confirmedDistress');
      expect(stats).toHaveProperty('averageConfidence');
    });

    it('should update activity timestamp on detection', async () => {
      const initialStatus = manager.getStatus();
      
      // Trigger detection
      const audioCallback = mockAudioService.onDistressDetected.mock.calls[0][0];
      audioCallback({
        confidence: 0.85,
        type: 'volume_spike',
        metrics: {
          peakVolume: 95,
          averageVolume: 65,
          frequencyProfile: [120, 250, 180],
          lastUpdate: new Date()
        }
      });

      const updatedStatus = manager.getStatus();
      expect(updatedStatus.lastActivity.getTime()).toBeGreaterThan(initialStatus.lastActivity.getTime());
    });
  });
});