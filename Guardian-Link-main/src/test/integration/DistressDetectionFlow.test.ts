/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DistressDetectionManager } from '../../distress-detection/services/DistressDetectionManager';
import { SpeechRecognitionService } from '../../distress-detection/services/SpeechRecognitionService';
import { AudioAnalysisService } from '../../distress-detection/services/AudioAnalysisService';
import { DistressClassificationService } from '../../distress-detection/services/DistressClassificationService';

describe('Distress Detection Integration Flow', () => {
  let manager: DistressDetectionManager;
  let mockEmergencyHandler: any;

  beforeEach(() => {
    // Mock emergency handler to track SOS triggers
    mockEmergencyHandler = {
      triggerSOS: vi.fn(() => Promise.resolve()),
      isEmergencyActive: vi.fn(() => false),
      getEmergencyStats: vi.fn(() => ({
        totalTriggers: 0,
        lastTrigger: null,
        averageResponseTime: 0
      })),
      logDistressEvent: vi.fn()
    };

    // Mock permissions
    global.navigator.permissions = {
      query: vi.fn(() => Promise.resolve({ state: 'granted' }))
    } as any;

    manager = new DistressDetectionManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('End-to-End Distress Detection Flow', () => {
    it('should detect speech distress and trigger SOS after user confirmation', async () => {
      // Initialize the system
      await manager.initialize();
      await manager.startMonitoring();

      // Simulate speech recognition result with distress phrase
      const speechService = manager.getSpeechService();
      const speechCallback = vi.fn();
      speechService.onProcessedResult(speechCallback);

      // Trigger speech detection with distress content
      const mockSpeechResult = {
        transcript: 'help me please someone help',
        confidence: 0.9,
        isDistress: true,
        distressConfidence: 0.85,
        detectedPhrases: ['help me', 'someone help'],
        sentiment: 'negative' as const
      };

      speechCallback(mockSpeechResult);

      // Verification dialog should appear
      expect(manager.isVerificationVisible()).toBe(true);

      // Simulate user confirming distress
      const verificationService = manager.getVerificationService();
      const confirmResult = {
        action: 'confirm' as const,
        timestamp: new Date()
      };

      // Trigger confirmation
      await verificationService.handleUserResponse(confirmResult);

      // SOS should be triggered
      expect(mockEmergencyHandler.triggerSOS).toHaveBeenCalledWith(
        expect.objectContaining({
          detectionMethod: 'speech',
          confidence: 0.85,
          transcript: 'help me please someone help'
        })
      );
    });

    it('should detect audio distress and trigger SOS after timeout', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      // Simulate audio analysis detecting distress
      const audioService = manager.getAudioService();
      const audioCallback = vi.fn();
      audioService.onDistressDetected(audioCallback);

      // Trigger audio distress detection
      const mockAudioResult = {
        confidence: 0.88,
        type: 'volume_spike' as const,
        metrics: {
          peakVolume: 95,
          averageVolume: 65,
          frequencyProfile: [120, 250, 300, 180, 220],
          lastUpdate: new Date()
        }
      };

      audioCallback(mockAudioResult);

      // Verification dialog should appear
      expect(manager.isVerificationVisible()).toBe(true);

      // Simulate timeout (no user response)
      vi.advanceTimersByTime(10000); // 10 second timeout

      // SOS should be triggered automatically
      expect(mockEmergencyHandler.triggerSOS).toHaveBeenCalledWith(
        expect.objectContaining({
          detectionMethod: 'audio',
          confidence: 0.88,
          audioMetrics: mockAudioResult.metrics
        })
      );
    });

    it('should combine speech and audio detection for higher confidence', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      // First, trigger speech detection
      const speechCallback = vi.fn();
      manager.getSpeechService().onProcessedResult(speechCallback);

      speechCallback({
        transcript: 'help',
        confidence: 0.7,
        isDistress: true,
        distressConfidence: 0.65, // Lower confidence
        detectedPhrases: ['help'],
        sentiment: 'negative'
      });

      // Then quickly trigger audio detection
      const audioCallback = vi.fn();
      manager.getAudioService().onDistressDetected(audioCallback);

      audioCallback({
        confidence: 0.70,
        type: 'frequency_pattern',
        metrics: {
          peakVolume: 88,
          averageVolume: 60,
          frequencyProfile: [150, 300, 250, 200, 180],
          lastUpdate: new Date()
        }
      });

      // Should show verification with combined higher confidence
      expect(manager.isVerificationVisible()).toBe(true);
      
      const verificationContext = manager.getLastVerificationContext();
      expect(verificationContext.detectionMethod).toBe('combined');
      expect(verificationContext.confidence).toBeGreaterThan(0.75); // Combined confidence
    });

    it('should continue monitoring after false alarm dismissal', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      // Trigger detection
      const audioCallback = vi.fn();
      manager.getAudioService().onDistressDetected(audioCallback);

      audioCallback({
        confidence: 0.75,
        type: 'volume_spike',
        metrics: {
          peakVolume: 85,
          averageVolume: 55,
          frequencyProfile: [100, 200, 150, 180, 160],
          lastUpdate: new Date()
        }
      });

      // User dismisses as false alarm
      const verificationService = manager.getVerificationService();
      await verificationService.handleUserResponse({
        action: 'dismiss',
        timestamp: new Date()
      });

      // Should continue monitoring
      expect(manager.isMonitoring()).toBe(true);
      expect(mockEmergencyHandler.triggerSOS).not.toHaveBeenCalled();

      // Should be able to detect again
      audioCallback({
        confidence: 0.85,
        type: 'volume_spike',
        metrics: {
          peakVolume: 95,
          averageVolume: 65,
          frequencyProfile: [120, 250, 300, 180, 220],
          lastUpdate: new Date()
        }
      });

      expect(manager.isVerificationVisible()).toBe(true);
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle missing Web Speech API gracefully', async () => {
      // Simulate browser without Web Speech API
      global.SpeechRecognition = undefined;
      global.webkitSpeechRecognition = undefined;

      const manager = new DistressDetectionManager();
      
      // Should initialize with audio-only mode
      await manager.initialize();
      
      const status = manager.getStatus();
      expect(status.speechRecognition.available).toBe(false);
      expect(status.audioAnalysis.available).toBe(true);
    });

    it('should handle missing Web Audio API gracefully', async () => {
      // Simulate browser without Web Audio API
      global.AudioContext = undefined;
      global.webkitAudioContext = undefined;

      const manager = new DistressDetectionManager();
      
      // Should initialize with speech-only mode
      await manager.initialize();
      
      const status = manager.getStatus();
      expect(status.speechRecognition.available).toBe(true);
      expect(status.audioAnalysis.available).toBe(false);
    });

    it('should provide manual SOS fallback when APIs unavailable', async () => {
      // Simulate browser with no audio APIs
      global.SpeechRecognition = undefined;
      global.webkitSpeechRecognition = undefined;
      global.AudioContext = undefined;
      global.webkitAudioContext = undefined;

      const manager = new DistressDetectionManager();
      
      // Should still allow manual SOS
      expect(() => manager.triggerManualSOS()).not.toThrow();
      expect(mockEmergencyHandler.triggerSOS).toHaveBeenCalledWith(
        expect.objectContaining({
          detectionMethod: 'manual'
        })
      );
    });
  });

  describe('Mobile Device Testing', () => {
    beforeEach(() => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true
      });
    });

    it('should adapt processing for mobile battery constraints', async () => {
      await manager.initialize();
      
      // Should use battery-aware settings
      const settings = manager.getCurrentSettings();
      expect(settings.audioAnalysis.processingFrequency).toBeLessThan(60); // Lower frequency for battery
    });

    it('should handle mobile permission model', async () => {
      // Mock mobile permission behavior
      global.navigator.mediaDevices.getUserMedia = vi.fn(() => 
        Promise.reject(new Error('NotAllowedError'))
      );

      const manager = new DistressDetectionManager();
      
      await expect(manager.initialize()).rejects.toThrow('NotAllowedError');
    });

    it('should optimize memory usage on mobile', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      // Should use smaller buffer sizes
      const audioService = manager.getAudioService();
      const metrics = audioService.getCurrentMetrics();
      
      // Memory usage should be reasonable for mobile
      expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB limit
    });
  });

  describe('Performance Testing', () => {
    it('should process audio analysis within performance limits', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      const startTime = performance.now();
      
      // Simulate continuous audio processing
      const audioService = manager.getAudioService();
      for (let i = 0; i < 100; i++) {
        audioService.processAudioFrame(new Float32Array(1024));
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process 100 frames in reasonable time
      expect(processingTime).toBeLessThan(1000); // 1 second for 100 frames
    });

    it('should handle continuous monitoring without memory leaks', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      // Simulate 1 hour of monitoring
      for (let i = 0; i < 3600; i++) {
        // Simulate speech results every second
        if (i % 10 === 0) {
          const speechCallback = vi.fn();
          manager.getSpeechService().onProcessedResult(speechCallback);
          speechCallback({
            transcript: 'normal conversation',
            confidence: 0.8,
            isDistress: false,
            distressConfidence: 0.1,
            detectedPhrases: [],
            sentiment: 'neutral'
          });
        }

        vi.advanceTimersByTime(1000);
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should maintain real-time processing under load', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      const processingTimes: number[] = [];

      // Test processing time under various loads
      for (let load = 1; load <= 10; load++) {
        const startTime = performance.now();
        
        // Simulate concurrent processing
        const promises = Array(load).fill(0).map(() => {
          return manager.getClassificationService().analyzeText('test phrase for analysis');
        });

        await Promise.all(promises);
        
        const endTime = performance.now();
        processingTimes.push(endTime - startTime);
      }

      // Processing time should scale reasonably with load
      const maxTime = Math.max(...processingTimes);
      expect(maxTime).toBeLessThan(500); // Should complete within 500ms even under load
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary service failures', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      // Simulate speech service failure
      const speechService = manager.getSpeechService();
      speechService.simulateError(new Error('Temporary network error'));

      // Should attempt recovery
      vi.advanceTimersByTime(5000); // Wait for recovery attempt

      expect(manager.getStatus().speechRecognition.status).toBe('recovering');
      
      // Simulate successful recovery
      speechService.simulateRecovery();
      
      expect(manager.getStatus().speechRecognition.status).toBe('active');
    });

    it('should maintain partial functionality when one service fails', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      // Permanently disable speech recognition
      const speechService = manager.getSpeechService();
      speechService.simulateError(new Error('Permanent failure'));
      speechService.disable();

      // Audio analysis should still work
      const audioCallback = vi.fn();
      manager.getAudioService().onDistressDetected(audioCallback);

      audioCallback({
        confidence: 0.85,
        type: 'volume_spike',
        metrics: {
          peakVolume: 95,
          averageVolume: 65,
          frequencyProfile: [120, 250, 300, 180, 220],
          lastUpdate: new Date()
        }
      });

      expect(manager.isVerificationVisible()).toBe(true);
    });

    it('should handle API rate limiting gracefully', async () => {
      await manager.initialize();
      
      const classificationService = manager.getClassificationService();
      classificationService.setProcessingMode('api');

      // Mock rate limiting response
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' })
      } as any));

      // Should fall back to local processing
      const result = await classificationService.analyzeText('help me please');
      
      expect(result.isDistress).toBe(true); // Should still detect using local processing
      expect(classificationService.getProcessingMode()).toBe('local'); // Should switch to local
    });
  });
});