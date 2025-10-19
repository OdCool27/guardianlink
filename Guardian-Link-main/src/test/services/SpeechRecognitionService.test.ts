/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpeechRecognitionService } from '../../distress-detection/services/SpeechRecognitionService';

describe('SpeechRecognitionService', () => {
  let service: SpeechRecognitionService;
  let mockRecognition: any;

  beforeEach(() => {
    // Create a mock SpeechRecognition instance
    mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: 'en-US',
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onresult: null,
      onerror: null,
      onend: null,
      onstart: null
    };

    // Mock the global SpeechRecognition constructor
    global.SpeechRecognition = vi.fn(() => mockRecognition);
    global.webkitSpeechRecognition = global.SpeechRecognition;

    service = new SpeechRecognitionService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully when speech recognition is supported', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
      expect(global.SpeechRecognition).toHaveBeenCalled();
      expect(mockRecognition.continuous).toBe(true);
      expect(mockRecognition.interimResults).toBe(false);
      expect(mockRecognition.lang).toBe('en-US');
    });

    it('should throw error when speech recognition is not supported', async () => {
      global.SpeechRecognition = undefined as any;
      global.webkitSpeechRecognition = undefined as any;
      
      const newService = new SpeechRecognitionService();
      await expect(newService.initialize()).rejects.toThrow('Speech recognition is not supported');
    });

    it('should set up event listeners during initialization', async () => {
      await service.initialize();
      expect(mockRecognition.addEventListener).toHaveBeenCalledWith('result', expect.any(Function));
      expect(mockRecognition.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRecognition.addEventListener).toHaveBeenCalledWith('end', expect.any(Function));
      expect(mockRecognition.addEventListener).toHaveBeenCalledWith('start', expect.any(Function));
    });
  });

  describe('listening control', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should start listening when startListening is called', () => {
      service.startListening();
      expect(mockRecognition.start).toHaveBeenCalled();
    });

    it('should stop listening when stopListening is called', () => {
      service.startListening();
      service.stopListening();
      expect(mockRecognition.stop).toHaveBeenCalled();
    });

    it('should not start if already listening', () => {
      service.startListening();
      mockRecognition.start.mockClear();
      service.startListening();
      expect(mockRecognition.start).not.toHaveBeenCalled();
    });
  });

  describe('result processing', () => {
    let resultCallback: any;
    let processedResultCallback: any;

    beforeEach(async () => {
      await service.initialize();
      resultCallback = vi.fn();
      processedResultCallback = vi.fn();
      service.onResult(resultCallback);
      service.onProcessedResult(processedResultCallback);
    });

    it('should process speech results and call callbacks', () => {
      const mockEvent = {
        results: [{
          0: { transcript: 'help me please', confidence: 0.9 },
          isFinal: true,
          length: 1
        }],
        resultIndex: 0
      };

      // Simulate the result event
      const resultHandler = mockRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')[1];
      resultHandler(mockEvent);

      expect(resultCallback).toHaveBeenCalledWith('help me please', 0.9);
      expect(processedResultCallback).toHaveBeenCalled();
    });

    it('should handle multiple alternatives in results', () => {
      const mockEvent = {
        results: [{
          0: { transcript: 'help me', confidence: 0.9 },
          1: { transcript: 'hello me', confidence: 0.3 },
          isFinal: true,
          length: 2
        }],
        resultIndex: 0
      };

      const resultHandler = mockRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')[1];
      resultHandler(mockEvent);

      expect(resultCallback).toHaveBeenCalledWith('help me', 0.9);
    });

    it('should filter out low confidence results', () => {
      const mockEvent = {
        results: [{
          0: { transcript: 'unclear speech', confidence: 0.2 },
          isFinal: true,
          length: 1
        }],
        resultIndex: 0
      };

      const resultHandler = mockRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')[1];
      resultHandler(mockEvent);

      expect(resultCallback).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    let errorCallback: any;

    beforeEach(async () => {
      await service.initialize();
      errorCallback = vi.fn();
      service.onError(errorCallback);
    });

    it('should handle speech recognition errors', () => {
      const mockError = { error: 'network', message: 'Network error occurred' };
      
      const errorHandler = mockRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'error')[1];
      errorHandler(mockError);

      expect(errorCallback).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should attempt automatic restart on recoverable errors', async () => {
      vi.useFakeTimers();
      
      const mockError = { error: 'network', message: 'Network error' };
      const errorHandler = mockRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'error')[1];
      
      service.startListening();
      errorHandler(mockError);

      // Fast-forward time to trigger restart
      vi.advanceTimersByTime(1000);
      
      expect(mockRecognition.start).toHaveBeenCalledTimes(2); // Initial + restart
      
      vi.useRealTimers();
    });

    it('should not restart on non-recoverable errors', () => {
      const mockError = { error: 'not-allowed', message: 'Permission denied' };
      const errorHandler = mockRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'error')[1];
      
      service.startListening();
      mockRecognition.start.mockClear();
      errorHandler(mockError);

      expect(mockRecognition.start).not.toHaveBeenCalled();
    });
  });

  describe('settings management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should update language settings', () => {
      service.updateSettings({ language: 'es-ES' });
      expect(mockRecognition.lang).toBe('es-ES');
    });

    it('should update continuous mode settings', () => {
      service.updateSettings({ continuous: false });
      expect(mockRecognition.continuous).toBe(false);
    });

    it('should update interim results settings', () => {
      service.updateSettings({ interimResults: true });
      expect(mockRecognition.interimResults).toBe(true);
    });
  });

  describe('state management', () => {
    let stateCallback: any;

    beforeEach(async () => {
      await service.initialize();
      stateCallback = vi.fn();
      service.onStateChange(stateCallback);
    });

    it('should track listening state correctly', () => {
      expect(service.isListening()).toBe(false);
      
      service.startListening();
      const startHandler = mockRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'start')[1];
      startHandler();
      
      expect(service.isListening()).toBe(true);
      expect(stateCallback).toHaveBeenCalledWith(true);
    });

    it('should update state when recognition ends', () => {
      service.startListening();
      const startHandler = mockRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'start')[1];
      startHandler();
      
      const endHandler = mockRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'end')[1];
      endHandler();
      
      expect(service.isListening()).toBe(false);
      expect(stateCallback).toHaveBeenCalledWith(false);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should cleanup resources when destroyed', () => {
      service.startListening();
      service.destroy();
      
      expect(mockRecognition.stop).toHaveBeenCalled();
      expect(service.isListening()).toBe(false);
    });

    it('should remove event listeners on cleanup', () => {
      service.destroy();
      expect(mockRecognition.removeEventListener).toHaveBeenCalledWith('result', expect.any(Function));
      expect(mockRecognition.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRecognition.removeEventListener).toHaveBeenCalledWith('end', expect.any(Function));
      expect(mockRecognition.removeEventListener).toHaveBeenCalledWith('start', expect.any(Function));
    });
  });
});