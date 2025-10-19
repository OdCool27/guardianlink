/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DistressDetectionManager } from '../../distress-detection/services/DistressDetectionManager';
import { AudioAnalysisService } from '../../distress-detection/services/AudioAnalysisService';
import { DistressClassificationService } from '../../distress-detection/services/DistressClassificationService';

describe('Performance and Load Testing', () => {
  let manager: DistressDetectionManager;

  beforeEach(() => {
    manager = new DistressDetectionManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Audio Processing Performance', () => {
    it('should process audio frames within real-time constraints', async () => {
      const audioService = new AudioAnalysisService();
      await audioService.initialize();

      const frameSize = 1024;
      const sampleRate = 44100;
      const frameDuration = (frameSize / sampleRate) * 1000; // Duration in ms

      const processingTimes: number[] = [];

      // Test 100 consecutive frames
      for (let i = 0; i < 100; i++) {
        const audioData = new Float32Array(frameSize);
        // Fill with synthetic audio data
        for (let j = 0; j < frameSize; j++) {
          audioData[j] = Math.sin(2 * Math.PI * 440 * j / sampleRate); // 440Hz sine wave
        }

        const startTime = performance.now();
        audioService.processAudioFrame(audioData);
        const endTime = performance.now();

        processingTimes.push(endTime - startTime);
      }

      const averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      const maxProcessingTime = Math.max(...processingTimes);

      // Processing should be faster than real-time
      expect(averageProcessingTime).toBeLessThan(frameDuration * 0.5); // 50% of frame duration
      expect(maxProcessingTime).toBeLessThan(frameDuration); // Never exceed frame duration
    });

    it('should handle high-frequency audio analysis without blocking', async () => {
      const audioService = new AudioAnalysisService();
      await audioService.initialize();

      const startTime = performance.now();
      let frameCount = 0;

      // Simulate 1 second of 44.1kHz audio processing
      const totalFrames = Math.floor(44100 / 1024); // ~43 frames per second

      for (let i = 0; i < totalFrames; i++) {
        const audioData = new Float32Array(1024);
        audioService.processAudioFrame(audioData);
        frameCount++;
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(frameCount).toBe(totalFrames);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain performance with continuous monitoring', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      const performanceMetrics: number[] = [];

      // Simulate 10 minutes of continuous monitoring
      for (let minute = 0; minute < 10; minute++) {
        const startTime = performance.now();

        // Simulate 1 minute of activity
        for (let second = 0; second < 60; second++) {
          // Simulate audio processing every 23ms (44.1kHz / 1024 samples)
          for (let frame = 0; frame < 43; frame++) {
            vi.advanceTimersByTime(23);
          }
        }

        const endTime = performance.now();
        performanceMetrics.push(endTime - startTime);
      }

      // Performance should remain consistent over time
      const firstMinute = performanceMetrics[0];
      const lastMinute = performanceMetrics[performanceMetrics.length - 1];
      const performanceDegradation = (lastMinute - firstMinute) / firstMinute;

      expect(performanceDegradation).toBeLessThan(0.2); // Less than 20% degradation
    });
  });

  describe('Speech Processing Performance', () => {
    it('should process speech recognition results quickly', async () => {
      const classificationService = new DistressClassificationService();
      
      const testPhrases = [
        'help me please',
        'I am scared someone help',
        'stop it please stop',
        'leave me alone get away',
        'call 911 emergency',
        'normal conversation text',
        'hello how are you today',
        'the weather is nice outside'
      ];

      const processingTimes: number[] = [];

      for (const phrase of testPhrases) {
        const startTime = performance.now();
        await classificationService.analyzeText(phrase);
        const endTime = performance.now();
        
        processingTimes.push(endTime - startTime);
      }

      const averageTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      const maxTime = Math.max(...processingTimes);

      expect(averageTime).toBeLessThan(50); // Average under 50ms
      expect(maxTime).toBeLessThan(100); // Max under 100ms
    });

    it('should handle concurrent speech analysis requests', async () => {
      const classificationService = new DistressClassificationService();
      
      const concurrentRequests = 10;
      const testPhrase = 'help me please I need assistance';

      const startTime = performance.now();

      const promises = Array(concurrentRequests).fill(0).map(() => 
        classificationService.analyzeText(testPhrase)
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const averageTimePerRequest = totalTime / concurrentRequests;

      expect(results).toHaveLength(concurrentRequests);
      expect(averageTimePerRequest).toBeLessThan(100); // Should handle concurrency efficiently
      expect(totalTime).toBeLessThan(500); // Total time should be reasonable
    });

    it('should process long text inputs efficiently', async () => {
      const classificationService = new DistressClassificationService();
      
      // Create a long text with distress phrases scattered throughout
      const longText = Array(1000).fill('normal conversation text').join(' ') + 
                     ' help me please ' + 
                     Array(1000).fill('more normal text').join(' ') +
                     ' I am scared ' +
                     Array(1000).fill('even more text').join(' ');

      const startTime = performance.now();
      const result = await classificationService.analyzeText(longText);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      expect(result.isDistress).toBe(true);
      expect(result.detectedPhrases.length).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(200); // Should handle long text efficiently
    });
  });

  describe('Memory Usage and Leaks', () => {
    it('should maintain stable memory usage during continuous operation', async () => {
      if (!performance.memory) {
        // Skip test if performance.memory is not available
        return;
      }

      await manager.initialize();
      await manager.startMonitoring();

      const initialMemory = performance.memory.usedJSHeapSize;
      const memorySnapshots: number[] = [initialMemory];

      // Simulate 30 minutes of operation
      for (let minute = 0; minute < 30; minute++) {
        // Simulate various activities
        for (let i = 0; i < 60; i++) {
          // Simulate speech detection every few seconds
          if (i % 5 === 0) {
            const classificationService = manager.getClassificationService();
            await classificationService.analyzeText('normal conversation');
          }

          // Simulate audio processing
          if (i % 2 === 0) {
            const audioService = manager.getAudioService();
            const audioData = new Float32Array(1024);
            audioService.processAudioFrame(audioData);
          }

          vi.advanceTimersByTime(1000);
        }

        // Take memory snapshot every 5 minutes
        if (minute % 5 === 0) {
          memorySnapshots.push(performance.memory.usedJSHeapSize);
        }
      }

      // Check for memory leaks
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;

      expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase over 30 minutes

      // Check that memory doesn't continuously grow
      const memoryGrowthRate = (memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0]) / memorySnapshots.length;
      expect(memoryGrowthRate).toBeLessThan(1024 * 1024); // Less than 1MB growth per snapshot
    });

    it('should cleanup resources properly when stopped', async () => {
      if (!performance.memory) {
        return;
      }

      const initialMemory = performance.memory.usedJSHeapSize;

      await manager.initialize();
      await manager.startMonitoring();

      // Run for a while to allocate resources
      for (let i = 0; i < 100; i++) {
        const audioData = new Float32Array(1024);
        manager.getAudioService().processAudioFrame(audioData);
        vi.advanceTimersByTime(100);
      }

      const runningMemory = performance.memory.usedJSHeapSize;

      // Stop and cleanup
      await manager.stopMonitoring();
      await manager.destroy();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryRecovered = runningMemory - finalMemory;
      const recoveryPercent = (memoryRecovered / (runningMemory - initialMemory)) * 100;

      expect(recoveryPercent).toBeGreaterThan(70); // Should recover at least 70% of allocated memory
    });
  });

  describe('Battery and CPU Usage Optimization', () => {
    it('should reduce processing frequency on mobile devices', async () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      await manager.initialize();
      
      const settings = manager.getCurrentSettings();
      
      // Should use battery-optimized settings on mobile
      expect(settings.audioAnalysis.processingFrequency).toBeLessThan(30); // Lower frequency
      expect(settings.audioAnalysis.bufferSize).toBeLessThan(2048); // Smaller buffers
    });

    it('should adapt processing based on battery level', async () => {
      // Mock battery API
      global.navigator.getBattery = vi.fn(() => Promise.resolve({
        level: 0.2, // 20% battery
        charging: false,
        chargingTime: Infinity,
        dischargingTime: 3600,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));

      await manager.initialize();
      
      // Should automatically reduce processing intensity
      const batteryManager = manager.getBatteryManager();
      expect(batteryManager.getCurrentProcessingLevel()).toBeLessThan(0.5); // Reduced processing
    });

    it('should pause non-critical processing during high CPU usage', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      // Simulate high CPU usage
      const performanceMonitor = manager.getPerformanceMonitor();
      performanceMonitor.simulateHighCPUUsage(90); // 90% CPU usage

      // Should reduce processing frequency
      const audioService = manager.getAudioService();
      expect(audioService.getProcessingFrequency()).toBeLessThan(20); // Reduced from default

      // Critical distress detection should still work
      const audioCallback = vi.fn();
      audioService.onDistressDetected(audioCallback);

      audioCallback({
        confidence: 0.95, // High confidence
        type: 'volume_spike',
        metrics: {
          peakVolume: 100,
          averageVolume: 70,
          frequencyProfile: [150, 300, 400, 250, 200],
          lastUpdate: new Date()
        }
      });

      expect(manager.isVerificationVisible()).toBe(true); // Should still trigger
    });
  });

  describe('Scalability and Load Testing', () => {
    it('should handle multiple simultaneous detection events', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      const detectionEvents = [];

      // Trigger multiple detection events simultaneously
      for (let i = 0; i < 10; i++) {
        detectionEvents.push(
          manager.handleDistressDetected('audio', 0.8 + (i * 0.01), {
            type: 'volume_spike',
            metrics: {
              peakVolume: 85 + i,
              averageVolume: 60,
              frequencyProfile: [120, 250, 180, 200, 160],
              lastUpdate: new Date()
            }
          })
        );
      }

      await Promise.all(detectionEvents);

      // Should handle all events without errors
      expect(manager.getDetectionStats().totalDetections).toBe(10);
      
      // Should only show one verification dialog (latest/highest confidence)
      expect(manager.isVerificationVisible()).toBe(true);
    });

    it('should maintain performance with high detection frequency', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      const startTime = performance.now();
      let processedEvents = 0;

      // Simulate high-frequency detection events for 10 seconds
      const interval = setInterval(() => {
        manager.handleDistressDetected('audio', 0.6, {
          type: 'frequency_pattern',
          metrics: {
            peakVolume: 75,
            averageVolume: 55,
            frequencyProfile: [100, 200, 150, 180, 140],
            lastUpdate: new Date()
          }
        });
        processedEvents++;
      }, 100); // Every 100ms

      vi.advanceTimersByTime(10000); // 10 seconds
      clearInterval(interval);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(processedEvents).toBe(100); // Should process 100 events
      expect(totalTime).toBeLessThan(12000); // Should complete within reasonable time
      
      // System should still be responsive
      expect(manager.isMonitoring()).toBe(true);
    });

    it('should handle stress testing with concurrent operations', async () => {
      await manager.initialize();
      await manager.startMonitoring();

      const operations = [];

      // Concurrent speech analysis
      for (let i = 0; i < 20; i++) {
        operations.push(
          manager.getClassificationService().analyzeText(`test phrase ${i} help me`)
        );
      }

      // Concurrent audio processing
      for (let i = 0; i < 50; i++) {
        operations.push(
          new Promise(resolve => {
            const audioData = new Float32Array(1024);
            manager.getAudioService().processAudioFrame(audioData);
            resolve(true);
          })
        );
      }

      // Concurrent settings updates
      for (let i = 0; i < 10; i++) {
        operations.push(
          new Promise(resolve => {
            manager.updateSettings({
              audioAnalysis: { volumeThreshold: 80 + i }
            });
            resolve(true);
          })
        );
      }

      const startTime = performance.now();
      await Promise.all(operations);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(manager.isMonitoring()).toBe(true); // Should remain stable
    });
  });
});