/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DistressClassificationService } from '../../distress-detection/services/DistressClassificationService';

// Mock the compromise.js library
const mockNLP = {
  match: vi.fn(),
  has: vi.fn(),
  sentiment: vi.fn(() => ({ score: 0 })),
  normalize: vi.fn((text: string) => ({ text: () => text.toLowerCase() }))
};

vi.mock('compromise', () => ({
  default: vi.fn(() => mockNLP)
}));

describe('DistressClassificationService', () => {
  let service: DistressClassificationService;

  beforeEach(() => {
    service = new DistressClassificationService();
    vi.clearAllMocks();
    
    // Mock fetch for Hugging Face API calls
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with local processing mode by default', () => {
      expect(service.getProcessingMode()).toBe('local');
    });

    it('should allow switching to API processing mode', () => {
      service.setProcessingMode('api');
      expect(service.getProcessingMode()).toBe('api');
    });
  });

  describe('local distress phrase detection', () => {
    beforeEach(() => {
      service.setProcessingMode('local');
    });

    it('should detect direct help requests', async () => {
      const result = await service.analyzeText('help me please');
      
      expect(result.isDistress).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.detectedPhrases).toContain('help me');
    });

    it('should detect stop commands', async () => {
      const result = await service.analyzeText('stop it please stop');
      
      expect(result.isDistress).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.detectedPhrases).toContain('stop');
    });

    it('should detect fear expressions', async () => {
      const result = await service.analyzeText("I'm scared please help");
      
      expect(result.isDistress).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.detectedPhrases).toContain("i'm scared");
    });

    it('should detect rejection phrases', async () => {
      const result = await service.analyzeText('leave me alone get away');
      
      expect(result.isDistress).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.detectedPhrases).toContain('leave me alone');
    });

    it('should detect pleading expressions', async () => {
      const result = await service.analyzeText('please no please dont');
      
      expect(result.isDistress).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.detectedPhrases).toContain('please no');
    });

    it('should detect harm indicators', async () => {
      const result = await service.analyzeText("don't hurt me that hurts");
      
      expect(result.isDistress).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.detectedPhrases).toContain("don't hurt me");
    });

    it('should detect emergency calls', async () => {
      const result = await service.analyzeText('call 911 emergency');
      
      expect(result.isDistress).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.detectedPhrases).toContain('call 911');
    });

    it('should not detect distress in normal conversation', async () => {
      const result = await service.analyzeText('hello how are you today');
      
      expect(result.isDistress).toBe(false);
      expect(result.confidence).toBeLessThan(0.3);
      expect(result.detectedPhrases).toHaveLength(0);
    });

    it('should handle case insensitive matching', async () => {
      const result = await service.analyzeText('HELP ME PLEASE');
      
      expect(result.isDistress).toBe(true);
      expect(result.detectedPhrases).toContain('help me');
    });

    it('should detect multiple distress phrases', async () => {
      const result = await service.analyzeText('help me please stop I am scared');
      
      expect(result.isDistress).toBe(true);
      expect(result.detectedPhrases.length).toBeGreaterThan(1);
      expect(result.detectedPhrases).toContain('help me');
      expect(result.detectedPhrases).toContain('stop');
    });

    it('should calculate confidence based on phrase count and strength', async () => {
      const singlePhrase = await service.analyzeText('help');
      const multiplePhrases = await service.analyzeText('help me please stop I am scared');
      
      expect(multiplePhrases.confidence).toBeGreaterThan(singlePhrase.confidence);
    });
  });

  describe('sentiment analysis', () => {
    beforeEach(() => {
      service.setProcessingMode('local');
    });

    it('should analyze sentiment of distress text', async () => {
      mockNLP.sentiment.mockReturnValue({ score: -0.8 });
      
      const result = await service.analyzeText('help me I am scared');
      
      expect(result.sentiment).toBe('negative');
    });

    it('should analyze sentiment of neutral text', async () => {
      mockNLP.sentiment.mockReturnValue({ score: 0.1 });
      
      const result = await service.analyzeText('hello how are you');
      
      expect(result.sentiment).toBe('neutral');
    });

    it('should analyze sentiment of positive text', async () => {
      mockNLP.sentiment.mockReturnValue({ score: 0.6 });
      
      const result = await service.analyzeText('I am happy and excited');
      
      expect(result.sentiment).toBe('positive');
    });
  });

  describe('API processing mode', () => {
    beforeEach(() => {
      service.setProcessingMode('api');
    });

    it('should call Hugging Face API for sentiment analysis', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([
          { label: 'NEGATIVE', score: 0.85 }
        ])
      };
      
      global.fetch = vi.fn(() => Promise.resolve(mockResponse as any));
      
      const result = await service.analyzeText('help me please');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('huggingface.co'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('help me please')
        })
      );
      
      expect(result.isDistress).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      
      const result = await service.analyzeText('help me please');
      
      // Should fall back to local processing
      expect(result.isDistress).toBe(true);
      expect(result.detectedPhrases).toContain('help me');
    });

    it('should handle API rate limiting', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' })
      };
      
      global.fetch = vi.fn(() => Promise.resolve(mockResponse as any));
      
      const result = await service.analyzeText('help me please');
      
      // Should fall back to local processing
      expect(result.isDistress).toBe(true);
    });

    it('should combine API sentiment with local phrase detection', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([
          { label: 'NEGATIVE', score: 0.9 }
        ])
      };
      
      global.fetch = vi.fn(() => Promise.resolve(mockResponse as any));
      
      const result = await service.analyzeText('help me I am scared');
      
      expect(result.isDistress).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.detectedPhrases.length).toBeGreaterThan(0);
      expect(result.sentiment).toBe('negative');
    });
  });

  describe('custom phrases', () => {
    it('should allow adding custom distress phrases', () => {
      service.addCustomPhrase('custom emergency phrase');
      
      const phrases = service.getCustomPhrases();
      expect(phrases).toContain('custom emergency phrase');
    });

    it('should detect custom distress phrases', async () => {
      service.addCustomPhrase('code red situation');
      
      const result = await service.analyzeText('we have a code red situation');
      
      expect(result.isDistress).toBe(true);
      expect(result.detectedPhrases).toContain('code red situation');
    });

    it('should remove custom phrases', () => {
      service.addCustomPhrase('temporary phrase');
      service.removeCustomPhrase('temporary phrase');
      
      const phrases = service.getCustomPhrases();
      expect(phrases).not.toContain('temporary phrase');
    });

    it('should clear all custom phrases', () => {
      service.addCustomPhrase('phrase 1');
      service.addCustomPhrase('phrase 2');
      service.clearCustomPhrases();
      
      const phrases = service.getCustomPhrases();
      expect(phrases).toHaveLength(0);
    });
  });

  describe('confidence threshold', () => {
    it('should respect confidence threshold settings', async () => {
      service.setConfidenceThreshold(0.9);
      
      const result = await service.analyzeText('help'); // Lower confidence phrase
      
      expect(result.isDistress).toBe(false); // Should be below threshold
    });

    it('should allow lowering confidence threshold', async () => {
      service.setConfidenceThreshold(0.3);
      
      const result = await service.analyzeText('help'); // Lower confidence phrase
      
      expect(result.isDistress).toBe(true); // Should be above lowered threshold
    });
  });

  describe('text preprocessing', () => {
    it('should handle empty or whitespace-only text', async () => {
      const emptyResult = await service.analyzeText('');
      const whitespaceResult = await service.analyzeText('   \n\t  ');
      
      expect(emptyResult.isDistress).toBe(false);
      expect(whitespaceResult.isDistress).toBe(false);
    });

    it('should normalize text before analysis', async () => {
      const result = await service.analyzeText('  HELP   ME   PLEASE  ');
      
      expect(result.isDistress).toBe(true);
      expect(result.detectedPhrases).toContain('help me');
    });

    it('should handle special characters and punctuation', async () => {
      const result = await service.analyzeText('help! me, please... stop!!!');
      
      expect(result.isDistress).toBe(true);
      expect(result.detectedPhrases).toContain('help me');
      expect(result.detectedPhrases).toContain('stop');
    });
  });

  describe('performance', () => {
    it('should process text quickly for local analysis', async () => {
      const startTime = Date.now();
      await service.analyzeText('help me please stop I am scared');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle long text inputs', async () => {
      const longText = 'help me '.repeat(1000);
      
      const result = await service.analyzeText(longText);
      
      expect(result.isDistress).toBe(true);
      expect(result.detectedPhrases).toContain('help me');
    });
  });
});