/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioAnalysisService } from '../../distress-detection/services/AudioAnalysisService';

describe('AudioAnalysisService', () => {
  let service: AudioAnalysisService;
  let mockAudioContext: any;
  let mockAnalyzer: any;
  let mockMediaStream: any;
  let mockSourceNode: any;

  beforeEach(() => {
    // Mock AnalyserNode
    mockAnalyzer = {
      fftSize: 2048,
      frequencyBinCount: 1024,
      minDecibels: -100,
      maxDecibels: -30,
      smoothingTimeConstant: 0.8,
      getByteFrequencyData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
      getFloatFrequencyData: vi.fn(),
      getFloatTimeDomainData: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn()
    };

    // Mock MediaStreamAudioSourceNode
    mockSourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn()
    };

    // Mock AudioContext
    mockAudioContext = {
      state: 'running',
      sampleRate: 44100,
      currentTime: 0,
      createAnalyser: vi.fn(() => mockAnalyzer),
      createGain: vi.fn(() => ({
        gain: { value: 1 },
        connect: vi.fn(),
        disconnect: vi.fn()
      })),
      createMediaStreamSource: vi.fn(() => mockSourceNode),
      close: vi.fn(),
      resume: vi.fn(),
      suspend: vi.fn()
    };

    // Mock MediaStream
    mockMediaStream = {
      getTracks: vi.fn(() => []),
      getAudioTracks: vi.fn(() => [{ stop: vi.fn() }]),
      getVideoTracks: vi.fn(() => []),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      clone: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    };

    global.AudioContext = vi.fn(() => mockAudioContext);
    global.webkitAudioContext = global.AudioContext;
    
    // Mock getUserMedia
    global.navigator.mediaDevices.getUserMedia = vi.fn(() => Promise.resolve(mockMediaStream));

    service = new AudioAnalysisService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully with microphone access', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
      expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: 44100
        }
      });
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockMediaStream);
    });

    it('should throw error when microphone access is denied', async () => {
      global.navigator.mediaDevices.getUserMedia = vi.fn(() => 
        Promise.reject(new Error('Permission denied'))
      );
      
      await expect(service.initialize()).rejects.toThrow('Permission denied');
    });

    it('should configure analyzer node correctly', async () => {
      await service.initialize();
      expect(mockAnalyzer.fftSize).toBe(2048);
      expect(mockAnalyzer.smoothingTimeConstant).toBe(0.8);
      expect(mockSourceNode.connect).toHaveBeenCalledWith(mockAnalyzer);
    });
  });

  describe('analysis control', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should start analysis when startAnalysis is called', () => {
      const distressCallback = vi.fn();
      service.onDistressDetected(distressCallback);
      
      service.startAnalysis();
      expect(service.isAnalyzing()).toBe(true);
    });

    it('should stop analysis when stopAnalysis is called', () => {
      service.startAnalysis();
      service.stopAnalysis();
      expect(service.isAnalyzing()).toBe(false);
    });

    it('should not start analysis if not initialized', () => {
      const uninitializedService = new AudioAnalysisService();
      expect(() => uninitializedService.startAnalysis()).toThrow('Service not initialized');
    });
  });

  describe('distress detection', () => {
    let distressCallback: any;

    beforeEach(async () => {
      await service.initialize();
      distressCallback = vi.fn();
      service.onDistressDetected(distressCallback);
    });

    it('should detect volume spikes above threshold', () => {
      // Mock high volume data
      const highVolumeData = new Uint8Array(1024).fill(200); // High amplitude
      mockAnalyzer.getByteTimeDomainData.mockImplementation((array: Uint8Array) => {
        array.set(highVolumeData);
      });

      service.startAnalysis();
      
      // Simulate analysis frame
      vi.advanceTimersByTime(100);
      
      expect(distressCallback).toHaveBeenCalledWith(expect.objectContaining({
        confidence: expect.any(Number),
        type: 'volume_spike'
      }));
    });

    it('should detect sudden audio changes', () => {
      let callCount = 0;
      mockAnalyzer.getByteTimeDomainData.mockImplementation((array: Uint8Array) => {
        if (callCount === 0) {
          array.fill(128); // Normal level
        } else {
          array.fill(220); // Sudden spike
        }
        callCount++;
      });

      service.startAnalysis();
      
      // Simulate multiple analysis frames
      vi.advanceTimersByTime(200);
      
      expect(distressCallback).toHaveBeenCalled();
    });

    it('should analyze frequency patterns for screaming detection', () => {
      // Mock frequency data with high energy in scream frequency range (1-4kHz)
      const frequencyData = new Uint8Array(1024).fill(50);
      // Set high energy in scream frequency bins (roughly bins 23-93 for 44.1kHz sample rate)
      for (let i = 23; i < 93; i++) {
        frequencyData[i] = 200;
      }
      
      mockAnalyzer.getByteFrequencyData.mockImplementation((array: Uint8Array) => {
        array.set(frequencyData);
      });

      service.startAnalysis();
      
      vi.advanceTimersByTime(100);
      
      expect(distressCallback).toHaveBeenCalledWith(expect.objectContaining({
        type: 'frequency_pattern'
      }));
    });

    it('should not trigger false positives with normal audio', () => {
      // Mock normal audio levels
      const normalData = new Uint8Array(1024).fill(128); // Neutral level
      mockAnalyzer.getByteTimeDomainData.mockImplementation((array: Uint8Array) => {
        array.set(normalData);
      });
      mockAnalyzer.getByteFrequencyData.mockImplementation((array: Uint8Array) => {
        array.set(normalData);
      });

      service.startAnalysis();
      
      vi.advanceTimersByTime(500);
      
      expect(distressCallback).not.toHaveBeenCalled();
    });
  });

  describe('metrics tracking', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should track current audio metrics', () => {
      service.startAnalysis();
      
      const metrics = service.getCurrentMetrics();
      expect(metrics).toHaveProperty('peakVolume');
      expect(metrics).toHaveProperty('averageVolume');
      expect(metrics).toHaveProperty('frequencyProfile');
      expect(metrics).toHaveProperty('lastUpdate');
    });

    it('should update metrics during analysis', () => {
      const initialMetrics = service.getCurrentMetrics();
      
      service.startAnalysis();
      vi.advanceTimersByTime(100);
      
      const updatedMetrics = service.getCurrentMetrics();
      expect(updatedMetrics.lastUpdate.getTime()).toBeGreaterThan(initialMetrics.lastUpdate.getTime());
    });
  });

  describe('settings management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should update volume threshold settings', () => {
      service.updateSettings({
        volumeThreshold: 90,
        spikeDetection: true,
        frequencyAnalysis: true
      });

      // Settings should be applied (we can't directly test private properties,
      // but we can test the behavior change)
      expect(() => service.updateSettings({
        volumeThreshold: 90,
        spikeDetection: true,
        frequencyAnalysis: true
      })).not.toThrow();
    });

    it('should handle invalid settings gracefully', () => {
      expect(() => service.updateSettings({
        volumeThreshold: -10, // Invalid negative threshold
        spikeDetection: true,
        frequencyAnalysis: true
      })).not.toThrow();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should cleanup resources when destroyed', async () => {
      service.startAnalysis();
      await service.destroy();
      
      expect(service.isAnalyzing()).toBe(false);
      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(mockMediaStream.getAudioTracks()[0].stop).toHaveBeenCalled();
    });

    it('should handle cleanup when not initialized', async () => {
      const uninitializedService = new AudioAnalysisService();
      await expect(uninitializedService.destroy()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle audio context creation failure', async () => {
      global.AudioContext = vi.fn(() => {
        throw new Error('AudioContext creation failed');
      });
      
      const newService = new AudioAnalysisService();
      await expect(newService.initialize()).rejects.toThrow('AudioContext creation failed');
    });

    it('should handle analyzer node creation failure', async () => {
      mockAudioContext.createAnalyser = vi.fn(() => {
        throw new Error('Analyzer creation failed');
      });
      
      await expect(service.initialize()).rejects.toThrow('Analyzer creation failed');
    });
  });
});