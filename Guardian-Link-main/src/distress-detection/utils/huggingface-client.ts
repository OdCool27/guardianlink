/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Rate limiter for API requests
 */
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number; // in milliseconds

  constructor(maxRequests: number = 10, timeWindowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMinutes * 60 * 1000;
  }

  /**
   * Check if request is allowed and wait if necessary
   */
  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time until oldest request expires
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest) + 100; // Add 100ms buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot(); // Recursive call to check again
      }
    }
    
    this.requests.push(now);
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}

/**
 * Enhanced Hugging Face API client with comprehensive error handling and rate limiting
 */
export class HuggingFaceClient {
  private apiKey: string = '';
  private baseUrl: string = 'https://api-inference.huggingface.co/models';
  private rateLimiter: RateLimiter;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // Base delay in milliseconds

  constructor(config?: {
    apiKey?: string;
    baseUrl?: string;
    maxRequestsPerMinute?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }) {
    if (config?.apiKey) {
      this.apiKey = config.apiKey;
    }
    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
    if (config?.retryAttempts) {
      this.retryAttempts = config.retryAttempts;
    }
    if (config?.retryDelay) {
      this.retryDelay = config.retryDelay;
    }

    this.rateLimiter = new RateLimiter(config?.maxRequestsPerMinute || 10);
  }

  /**
   * Analyze sentiment using DistilBERT model
   */
  async analyzeSentiment(text: string): Promise<{
    label: string;
    score: number;
  }[]> {
    return this.makeRequest(
      'distilbert-base-uncased-finetuned-sst-2-english',
      { inputs: text },
      'sentiment analysis'
    );
  }

  /**
   * Process audio with Whisper model
   */
  async transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('file', audioBlob);

    return this.makeRequest(
      'openai/whisper-large-v3',
      formData,
      'audio transcription',
      true // isFormData
    );
  }

  /**
   * Classify text for distress detection using a general classification model
   */
  async classifyDistress(text: string): Promise<{
    label: string;
    score: number;
  }[]> {
    return this.makeRequest(
      'facebook/bart-large-mnli',
      {
        inputs: text,
        parameters: {
          candidate_labels: ['distress', 'emergency', 'help needed', 'normal conversation', 'casual talk']
        }
      },
      'distress classification'
    );
  }

  /**
   * Make HTTP request with error handling and retries
   */
  private async makeRequest(
    model: string,
    data: any,
    operation: string,
    isFormData: boolean = false
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Wait for rate limit slot
        await this.rateLimiter.waitForSlot();

        const headers: Record<string, string> = {
          'Authorization': `Bearer ${this.apiKey}`,
        };

        let body: any;
        if (isFormData) {
          body = data;
        } else {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify({
            ...data,
            options: {
              wait_for_model: true,
              use_cache: false
            }
          });
        }

        const response = await fetch(`${this.baseUrl}/${model}`, {
          method: 'POST',
          headers,
          body
        });

        if (response.ok) {
          const result = await response.json();
          return result;
        }

        // Handle specific HTTP errors
        if (response.status === 429) {
          // Rate limited - wait longer
          const waitTime = this.calculateBackoffDelay(attempt) * 2;
          console.warn(`Rate limited for ${operation}, waiting ${waitTime}ms before retry ${attempt}/${this.retryAttempts}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (response.status === 503) {
          // Model loading - wait and retry
          const waitTime = this.calculateBackoffDelay(attempt);
          console.warn(`Model loading for ${operation}, waiting ${waitTime}ms before retry ${attempt}/${this.retryAttempts}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (response.status >= 400 && response.status < 500) {
          // Client error - don't retry
          const errorText = await response.text();
          throw new Error(`Hugging Face API client error (${response.status}): ${errorText}`);
        }

        if (response.status >= 500) {
          // Server error - retry
          const errorText = await response.text();
          lastError = new Error(`Hugging Face API server error (${response.status}): ${errorText}`);
          
          if (attempt < this.retryAttempts) {
            const waitTime = this.calculateBackoffDelay(attempt);
            console.warn(`Server error for ${operation}, retrying in ${waitTime}ms (${attempt}/${this.retryAttempts})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.retryAttempts) {
          const waitTime = this.calculateBackoffDelay(attempt);
          console.warn(`Request failed for ${operation}, retrying in ${waitTime}ms (${attempt}/${this.retryAttempts}):`, error);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
    }

    throw lastError || new Error(`Failed to complete ${operation} after ${this.retryAttempts} attempts`);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number): number {
    return this.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
  }

  /**
   * Update API configuration
   */
  updateConfig(config: {
    apiKey?: string;
    baseUrl?: string;
    maxRequestsPerMinute?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }): void {
    if (config.apiKey !== undefined) {
      this.apiKey = config.apiKey;
    }
    if (config.baseUrl !== undefined) {
      this.baseUrl = config.baseUrl;
    }
    if (config.retryAttempts !== undefined) {
      this.retryAttempts = config.retryAttempts;
    }
    if (config.retryDelay !== undefined) {
      this.retryDelay = config.retryDelay;
    }
    if (config.maxRequestsPerMinute !== undefined) {
      this.rateLimiter = new RateLimiter(config.maxRequestsPerMinute);
    }
  }

  /**
   * Check if API is properly configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.analyzeSentiment('test connection');
      return true;
    } catch (error) {
      console.warn('Hugging Face API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API status and model availability
   */
  async getModelStatus(model: string): Promise<{
    loaded: boolean;
    state: string;
    compute_type: string;
  }> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/${model}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get model status: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Reset rate limiter (useful for testing or configuration changes)
   */
  resetRateLimit(): void {
    this.rateLimiter.reset();
  }
}

/**
 * Default instance for easy usage
 */
export const huggingFaceClient = new HuggingFaceClient();