/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Test runner configuration and utilities for distress detection tests
 */

import { vi } from 'vitest';

/**
 * Test utilities for mocking browser APIs and services
 */
export class TestUtils {
  /**
   * Create a mock audio context with all required methods
   */
  static createMockAudioContext() {
    return {
      state: 'running',
      sampleRate: 44100,
      currentTime: 0,
      destination: {},
      listener: {},
      createAnalyser: vi.fn(() => ({
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
      })),
      createGain: vi.fn(() => ({
        gain: { value: 1 },
        connect: vi.fn(),
        disconnect: vi.fn()
      })),
      createMediaStreamSource: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn()
      })),
      close: vi.fn(),
      resume: vi.fn(),
      suspend: vi.fn()
    };
  }

  /**
   * Create a mock speech recognition instance
   */
  static createMockSpeechRecognition() {
    return {
      continuous: false,
      interimResults: false,
      lang: 'en-US',
      maxAlternatives: 1,
      serviceURI: '',
      grammars: null,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onaudiostart: null,
      onaudioend: null,
      onend: null,
      onerror: null,
      onnomatch: null,
      onresult: null,
      onsoundstart: null,
      onsoundend: null,
      onspeechstart: null,
      onspeechend: null,
      onstart: null
    };
  }

  /**
   * Create a mock media stream
   */
  static createMockMediaStream() {
    return {
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
  }

  /**
   * Generate synthetic audio data for testing
   */
  static generateSyntheticAudio(length: number, frequency: number = 440, amplitude: number = 0.5): Float32Array {
    const audioData = new Float32Array(length);
    const sampleRate = 44100;
    
    for (let i = 0; i < length; i++) {
      audioData[i] = amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate);
    }
    
    return audioData;
  }

  /**
   * Generate distress audio pattern (high frequency, high amplitude)
   */
  static generateDistressAudio(length: number): Float32Array {
    const audioData = new Float32Array(length);
    const sampleRate = 44100;
    
    for (let i = 0; i < length; i++) {
      // Mix of high frequencies typical of distress sounds
      const freq1 = 2000; // 2kHz
      const freq2 = 3000; // 3kHz
      const noise = (Math.random() - 0.5) * 0.3; // Add some noise
      
      audioData[i] = 0.8 * (
        Math.sin(2 * Math.PI * freq1 * i / sampleRate) * 0.6 +
        Math.sin(2 * Math.PI * freq2 * i / sampleRate) * 0.4 +
        noise
      );
    }
    
    return audioData;
  }

  /**
   * Create a mock speech recognition result event
   */
  static createMockSpeechResult(transcript: string, confidence: number = 0.9, isFinal: boolean = true) {
    return {
      results: [{
        0: { transcript, confidence },
        isFinal,
        length: 1
      }],
      resultIndex: 0
    };
  }

  /**
   * Wait for a specified number of milliseconds (for async tests)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a mock performance.memory object
   */
  static createMockPerformanceMemory() {
    return {
      usedJSHeapSize: 10 * 1024 * 1024, // 10MB
      totalJSHeapSize: 50 * 1024 * 1024, // 50MB
      jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
    };
  }

  /**
   * Setup common mocks for all tests
   */
  static setupCommonMocks() {
    // Mock Web APIs
    global.AudioContext = vi.fn(() => TestUtils.createMockAudioContext());
    global.webkitAudioContext = global.AudioContext;
    
    global.SpeechRecognition = vi.fn(() => TestUtils.createMockSpeechRecognition());
    global.webkitSpeechRecognition = global.SpeechRecognition;
    
    // Mock getUserMedia
    global.navigator.mediaDevices = {
      getUserMedia: vi.fn(() => Promise.resolve(TestUtils.createMockMediaStream()))
    } as any;

    // Mock performance.memory if not available
    if (!performance.memory) {
      Object.defineProperty(performance, 'memory', {
        value: TestUtils.createMockPerformanceMemory(),
        configurable: true
      });
    }

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    global.localStorage = localStorageMock;

    // Mock fetch for API calls
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ label: 'NEGATIVE', score: 0.8 }])
    } as any));

    // Mock Worker
    global.Worker = class MockWorker {
      constructor(public url: string) {}
      postMessage = vi.fn();
      terminate = vi.fn();
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      dispatchEvent = vi.fn();
      onmessage = null;
      onerror = null;
    } as any;
  }

  /**
   * Cleanup mocks after tests
   */
  static cleanupMocks() {
    vi.clearAllMocks();
  }
}

/**
 * Test data generators for consistent test scenarios
 */
export class TestDataGenerator {
  /**
   * Generate test phrases for distress detection
   */
  static getDistressPhrases(): string[] {
    return [
      'help me please',
      'someone help me',
      'I am scared',
      'stop it please',
      'leave me alone',
      'please no',
      "don't hurt me",
      'call 911',
      'emergency help needed',
      'get away from me'
    ];
  }

  /**
   * Generate normal conversation phrases
   */
  static getNormalPhrases(): string[] {
    return [
      'hello how are you',
      'the weather is nice',
      'what time is it',
      'I am going to the store',
      'have a great day',
      'see you later',
      'thank you very much',
      'good morning everyone',
      'how was your weekend',
      'let me know if you need anything'
    ];
  }

  /**
   * Generate edge case phrases (ambiguous)
   */
  static getEdgeCasePhrases(): string[] {
    return [
      'help me with this problem', // Contains "help me" but not distress
      'stop the music please', // Contains "stop" but not distress
      'I am scared of spiders', // Contains "scared" but not immediate distress
      'please help me understand', // Contains "help me" but educational
      'call 911 for the accident report' // Contains "call 911" but not personal distress
    ];
  }

  /**
   * Generate test audio metrics for different scenarios
   */
  static getTestAudioMetrics(scenario: 'normal' | 'distress' | 'noise') {
    const baseMetrics = {
      lastUpdate: new Date(),
      frequencyProfile: [100, 150, 120, 180, 140]
    };

    switch (scenario) {
      case 'normal':
        return {
          ...baseMetrics,
          peakVolume: 65,
          averageVolume: 45
        };
      
      case 'distress':
        return {
          ...baseMetrics,
          peakVolume: 95,
          averageVolume: 75,
          frequencyProfile: [200, 350, 400, 300, 250] // Higher frequencies
        };
      
      case 'noise':
        return {
          ...baseMetrics,
          peakVolume: 85,
          averageVolume: 70,
          frequencyProfile: [180, 200, 190, 210, 195] // Consistent across frequencies
        };
      
      default:
        return baseMetrics;
    }
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(fn: () => Promise<T> | T): Promise<{ result: T; time: number }> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    
    return {
      result,
      time: endTime - startTime
    };
  }

  /**
   * Run a function multiple times and get statistics
   */
  static async benchmarkFunction<T>(
    fn: () => Promise<T> | T,
    iterations: number = 100
  ): Promise<{
    results: T[];
    times: number[];
    averageTime: number;
    minTime: number;
    maxTime: number;
  }> {
    const results: T[] = [];
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { result, time } = await PerformanceTestUtils.measureExecutionTime(fn);
      results.push(result);
      times.push(time);
    }

    return {
      results,
      times,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    };
  }

  /**
   * Simulate memory pressure for testing
   */
  static simulateMemoryPressure(sizeMB: number = 50): ArrayBuffer[] {
    const buffers: ArrayBuffer[] = [];
    const bufferSize = 1024 * 1024; // 1MB per buffer
    
    for (let i = 0; i < sizeMB; i++) {
      buffers.push(new ArrayBuffer(bufferSize));
    }
    
    return buffers;
  }

  /**
   * Clean up memory pressure simulation
   */
  static cleanupMemoryPressure(buffers: ArrayBuffer[]): void {
    buffers.length = 0; // Clear the array
    if (global.gc) {
      global.gc(); // Force garbage collection if available
    }
  }
}

// Export all utilities
export { TestUtils as default };