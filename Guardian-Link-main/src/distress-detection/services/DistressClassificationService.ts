/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressAnalysis } from '../types';
import { DistressClassificationService as IDistressClassificationService } from '../interfaces/DistressClassificationService';
import { HuggingFaceClient } from '../utils/huggingface-client';

// Import compromise.js for advanced NLP processing
let nlp: any = null;

// Dynamically import compromise to handle potential loading issues
async function loadNLP() {
  if (!nlp) {
    try {
      const compromise = await import('compromise');
      nlp = compromise.default || compromise;
    } catch (error) {
      console.warn('Failed to load compromise.js, using basic NLP processing:', error);
    }
  }
  return nlp;
}

/**
 * Local NLP processor for distress phrase detection
 */
class LocalNLPProcessor {
  private distressPhrases: string[] = [
    // Direct help requests
    'help me', 'help', 'somebody help', 'please help', 'i need help',
    
    // Stop commands
    'stop', 'stop it', 'please stop', 'dont stop', "don't stop",
    
    // Fear expressions
    'im scared', "i'm scared", 'im afraid', "i'm afraid", 'scared',
    
    // Rejection/resistance
    'leave me alone', 'get away', 'go away', 'let me go', 'dont touch me', "don't touch me",
    
    // Pleading
    'please no', 'please dont', "please don't", 'no please', 'please',
    
    // Harm indicators
    'dont hurt me', "don't hurt me", 'youre hurting me', "you're hurting me", 'it hurts', 'that hurts',
    
    // Distress calls
    'call police', 'call 911', 'emergency', 'someone call', 'call for help'
  ];

  private customPhrases: string[] = [];
  private confidenceThreshold: number = 70;

  constructor() {
    // Initialize with default phrases
  }

  /**
   * Analyze text using regex patterns and word matching
   */
  async analyzeText(text: string): Promise<DistressAnalysis> {
    const normalizedText = text.toLowerCase().trim();
    const detectedPhrases: string[] = [];
    let maxConfidence = 0;

    // Combine default and custom phrases
    const allPhrases = [...this.distressPhrases, ...this.customPhrases];

    // Check for exact phrase matches
    for (const phrase of allPhrases) {
      if (normalizedText.includes(phrase.toLowerCase())) {
        detectedPhrases.push(phrase);
        // Higher confidence for longer, more specific phrases
        const phraseConfidence = Math.min(95, 60 + (phrase.length * 2));
        maxConfidence = Math.max(maxConfidence, phraseConfidence);
      }
    }

    // Check for word proximity (words appearing close together)
    const distressWords = ['help', 'stop', 'scared', 'afraid', 'hurt', 'please', 'no', 'dont', "don't"];
    const urgentWords = ['emergency', 'police', '911', 'call', 'someone'];
    
    const words = normalizedText.split(/\s+/);
    let proximityScore = 0;
    
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];
      
      if (distressWords.includes(currentWord) && (distressWords.includes(nextWord) || urgentWords.includes(nextWord))) {
        proximityScore += 30;
      }
      
      if (urgentWords.includes(currentWord)) {
        proximityScore += 25;
      }
    }

    maxConfidence = Math.max(maxConfidence, Math.min(85, proximityScore));

    // Enhanced NLP analysis with compromise.js if available
    const nlpAnalysis = await this.performNLPAnalysis(text);
    if (nlpAnalysis.confidence > maxConfidence) {
      maxConfidence = nlpAnalysis.confidence;
      detectedPhrases.push(...nlpAnalysis.detectedPhrases);
    }

    // Sentiment analysis (basic implementation)
    const sentiment = nlpAnalysis.sentiment || this.analyzeSentiment(normalizedText);
    
    // Boost confidence for negative sentiment with distress indicators
    if (sentiment === 'negative' && detectedPhrases.length > 0) {
      maxConfidence = Math.min(95, maxConfidence + 15);
    }

    const isDistress = maxConfidence >= this.confidenceThreshold;

    return {
      isDistress,
      confidence: maxConfidence,
      detectedPhrases,
      sentiment
    };
  }

  /**
   * Enhanced NLP analysis using compromise.js
   */
  private async performNLPAnalysis(text: string): Promise<{
    confidence: number;
    detectedPhrases: string[];
    sentiment: 'positive' | 'negative' | 'neutral' | null;
  }> {
    const nlpLib = await loadNLP();
    
    if (!nlpLib) {
      return { confidence: 0, detectedPhrases: [], sentiment: null };
    }

    try {
      const doc = nlpLib(text);
      
      // Extract emotional indicators
      const emotions = doc.match('#Negative').out('array');
      const imperatives = doc.match('#Imperative').out('array');
      const questions = doc.match('#Question').out('array');
      
      let confidence = 0;
      const detectedPhrases: string[] = [];
      
      // Check for emotional distress indicators
      if (emotions.length > 0) {
        confidence += emotions.length * 15;
        detectedPhrases.push(...emotions);
      }
      
      // Check for urgent imperatives (commands like "stop", "help")
      if (imperatives.length > 0) {
        const urgentImperatives = imperatives.filter(imp => 
          ['stop', 'help', 'call', 'get'].some(word => imp.toLowerCase().includes(word))
        );
        if (urgentImperatives.length > 0) {
          confidence += urgentImperatives.length * 25;
          detectedPhrases.push(...urgentImperatives);
        }
      }
      
      // Check for distress questions
      if (questions.length > 0) {
        const distressQuestions = questions.filter(q => 
          ['help', 'why', 'what', 'please'].some(word => q.toLowerCase().includes(word))
        );
        if (distressQuestions.length > 0) {
          confidence += distressQuestions.length * 20;
          detectedPhrases.push(...distressQuestions);
        }
      }
      
      // Analyze sentence structure for urgency
      const sentences = doc.sentences().out('array');
      for (const sentence of sentences) {
        const sentenceDoc = nlpLib(sentence);
        
        // Short, urgent sentences
        if (sentence.split(' ').length <= 3 && sentenceDoc.has('#Negative')) {
          confidence += 20;
        }
        
        // Repeated words (sign of distress)
        const words = sentence.toLowerCase().split(' ');
        const wordCounts = words.reduce((acc, word) => {
          acc[word] = (acc[word] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const repeatedWords = Object.entries(wordCounts).filter(([_, count]) => (count as number) > 1);
        if (repeatedWords.length > 0) {
          confidence += repeatedWords.length * 10;
        }
      }
      
      // Determine sentiment using compromise.js
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (doc.has('#Positive')) {
        sentiment = 'positive';
      } else if (doc.has('#Negative') || emotions.length > 0) {
        sentiment = 'negative';
      }
      
      return {
        confidence: Math.min(90, confidence),
        detectedPhrases: [...new Set(detectedPhrases)], // Remove duplicates
        sentiment
      };
      
    } catch (error) {
      console.warn('NLP analysis failed:', error);
      return { confidence: 0, detectedPhrases: [], sentiment: null };
    }
  }

  /**
   * Basic sentiment analysis using word patterns
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const negativeWords = [
      'scared', 'afraid', 'hurt', 'pain', 'stop', 'no', 'help', 'emergency',
      'bad', 'terrible', 'awful', 'horrible', 'wrong', 'dangerous', 'threat'
    ];
    
    const positiveWords = [
      'good', 'great', 'fine', 'okay', 'happy', 'safe', 'thank', 'thanks',
      'yes', 'alright', 'perfect', 'wonderful', 'excellent'
    ];

    const words = text.toLowerCase().split(/\s+/);
    let negativeScore = 0;
    let positiveScore = 0;

    for (const word of words) {
      if (negativeWords.some(neg => word.includes(neg))) {
        negativeScore++;
      }
      if (positiveWords.some(pos => word.includes(pos))) {
        positiveScore++;
      }
    }

    if (negativeScore > positiveScore) {
      return 'negative';
    } else if (positiveScore > negativeScore) {
      return 'positive';
    }
    
    return 'neutral';
  }

  /**
   * Add custom phrases to the detection dictionary
   */
  addCustomPhrases(phrases: string[]): void {
    for (const phrase of phrases) {
      if (!this.customPhrases.includes(phrase)) {
        this.customPhrases.push(phrase);
      }
    }
  }

  /**
   * Remove custom phrases from the detection dictionary
   */
  removeCustomPhrases(phrases: string[]): void {
    this.customPhrases = this.customPhrases.filter(phrase => !phrases.includes(phrase));
  }

  /**
   * Get all monitored phrases
   */
  getDistressPhrases(): string[] {
    return [...this.distressPhrases, ...this.customPhrases];
  }

  /**
   * Update confidence threshold
   */
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(100, threshold));
  }
}



/**
 * Main distress classification service implementation
 */
export class DistressClassificationService implements IDistressClassificationService {
  private localProcessor: LocalNLPProcessor;
  private apiClient: HuggingFaceClient;
  private processingMode: 'local' | 'api' = 'local';
  private isInitialized: boolean = false;
  private fallbackToLocal: boolean = true;

  constructor() {
    this.localProcessor = new LocalNLPProcessor();
    this.apiClient = new HuggingFaceClient();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      // Local processor is always ready
      this.isInitialized = true;
      
      // Test API connection if configured
      if (this.processingMode === 'api' && this.apiClient.isConfigured()) {
        const isConnected = await this.apiClient.testConnection();
        if (!isConnected && !this.fallbackToLocal) {
          throw new Error('API connection failed and fallback is disabled');
        }
      }
    } catch (error) {
      console.warn('API initialization failed, falling back to local processing:', error);
      this.processingMode = 'local';
      this.isInitialized = true;
    }
  }

  /**
   * Analyze text for distress indicators
   */
  async analyzeText(text: string): Promise<DistressAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.processingMode === 'api' && this.apiClient.isConfigured()) {
        return await this.analyzeWithAPI(text);
      } else {
        return await this.localProcessor.analyzeText(text);
      }
    } catch (error) {
      console.warn('API analysis failed:', error);
      
      if (this.fallbackToLocal) {
        console.info('Falling back to local processing');
        return await this.localProcessor.analyzeText(text);
      } else {
        throw error;
      }
    }
  }

  /**
   * Analyze text using Hugging Face API
   */
  private async analyzeWithAPI(text: string): Promise<DistressAnalysis> {
    // First get local analysis for phrase detection
    const localAnalysis = await this.localProcessor.analyzeText(text);
    
    // Get sentiment and distress classification from API
    const [sentimentResults, distressResults] = await Promise.allSettled([
      this.apiClient.analyzeSentiment(text),
      this.apiClient.classifyDistress(text)
    ]);
    
    // Process API results
    let apiConfidence = 0;
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    // Process sentiment analysis results
    if (sentimentResults.status === 'fulfilled' && sentimentResults.value && sentimentResults.value.length > 0) {
      const result = sentimentResults.value[0];
      if (result.label === 'NEGATIVE') {
        sentiment = 'negative';
        apiConfidence = result.score * 100;
      } else if (result.label === 'POSITIVE') {
        sentiment = 'positive';
        apiConfidence = (1 - result.score) * 50; // Lower confidence for positive sentiment in distress context
      }
    }
    
    // Process distress classification results
    if (distressResults.status === 'fulfilled' && distressResults.value) {
      const distressClassification = distressResults.value as any;
      
      // Look for distress-related labels
      const distressLabels = ['distress', 'emergency', 'help needed'];
      let maxDistressScore = 0;
      
      if (Array.isArray(distressClassification)) {
        // Handle array format
        for (const result of distressClassification) {
          if (result && typeof result === 'object' && 'label' in result && 'score' in result) {
            if (distressLabels.includes(result.label)) {
              maxDistressScore = Math.max(maxDistressScore, (result.score as number) * 100);
            }
          }
        }
      } else if (distressClassification && typeof distressClassification === 'object') {
        // Handle object format with labels and scores arrays
        if ('labels' in distressClassification && 'scores' in distressClassification) {
          const labels = distressClassification.labels as string[];
          const scores = distressClassification.scores as number[];
          
          for (let i = 0; i < labels.length; i++) {
            if (distressLabels.includes(labels[i])) {
              maxDistressScore = Math.max(maxDistressScore, scores[i] * 100);
            }
          }
        }
      }
      
      apiConfidence = Math.max(apiConfidence, maxDistressScore);
    }

    // Combine local and API analysis
    const combinedConfidence = Math.max(localAnalysis.confidence, apiConfidence);
    
    // If local detected phrases and API confirms negative sentiment, boost confidence
    if (localAnalysis.detectedPhrases.length > 0 && sentiment === 'negative') {
      const boostedConfidence = Math.min(95, combinedConfidence + 20);
      return {
        isDistress: boostedConfidence >= 70,
        confidence: boostedConfidence,
        detectedPhrases: localAnalysis.detectedPhrases,
        sentiment
      };
    }

    return {
      isDistress: combinedConfidence >= 70,
      confidence: combinedConfidence,
      detectedPhrases: localAnalysis.detectedPhrases,
      sentiment
    };
  }

  /**
   * Set processing mode
   */
  setProcessingMode(mode: 'local' | 'api'): void {
    this.processingMode = mode;
  }

  /**
   * Update service settings
   */
  updateSettings(settings: {
    confidenceThreshold?: number;
    customPhrases?: string[];
    apiEndpoint?: string;
    apiKey?: string;
  }): void {
    if (settings.confidenceThreshold !== undefined) {
      this.localProcessor.setConfidenceThreshold(settings.confidenceThreshold);
    }
    
    if (settings.customPhrases) {
      // Replace all custom phrases
      this.localProcessor.removeCustomPhrases(this.localProcessor.getDistressPhrases());
      this.localProcessor.addCustomPhrases(settings.customPhrases);
    }
    
    if (settings.apiKey || settings.apiEndpoint) {
      this.apiClient.updateConfig({
        apiKey: settings.apiKey,
        baseUrl: settings.apiEndpoint
      });
    }
  }

  /**
   * Add custom distress phrases
   */
  addCustomPhrases(phrases: string[]): void {
    this.localProcessor.addCustomPhrases(phrases);
  }

  /**
   * Remove custom distress phrases
   */
  removeCustomPhrases(phrases: string[]): void {
    this.localProcessor.removeCustomPhrases(phrases);
  }

  /**
   * Get all monitored distress phrases
   */
  getDistressPhrases(): string[] {
    return this.localProcessor.getDistressPhrases();
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Process audio for enhanced speech recognition (Whisper integration)
   */
  async processAudio(audioBlob: Blob): Promise<{ text: string; confidence: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.processingMode === 'api' && this.apiClient.isConfigured()) {
        const result = await this.apiClient.transcribeAudio(audioBlob);
        return {
          text: result.text || '',
          confidence: result.text ? 85 : 0 // Whisper generally has high confidence
        };
      } else {
        throw new Error('Audio processing requires API mode with Whisper model');
      }
    } catch (error) {
      console.warn('Audio processing failed:', error);
      
      if (this.fallbackToLocal) {
        // Return empty result for local fallback
        return { text: '', confidence: 0 };
      } else {
        throw error;
      }
    }
  }

  /**
   * Enable or disable fallback to local processing
   */
  setFallbackEnabled(enabled: boolean): void {
    this.fallbackToLocal = enabled;
  }

  /**
   * Get current processing mode and configuration status
   */
  getStatus(): {
    mode: 'local' | 'api';
    apiConfigured: boolean;
    fallbackEnabled: boolean;
    initialized: boolean;
  } {
    return {
      mode: this.processingMode,
      apiConfigured: this.apiClient.isConfigured(),
      fallbackEnabled: this.fallbackToLocal,
      initialized: this.isInitialized
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.isInitialized = false;
    // Reset rate limiter
    this.apiClient.resetRateLimit();
  }
}