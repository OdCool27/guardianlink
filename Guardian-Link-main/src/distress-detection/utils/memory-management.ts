/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory management utilities for efficient audio processing
 */

/**
 * Circular buffer for efficient memory usage with audio data
 */
export class CircularBuffer<T> {
  private buffer: T[];
  private head = 0;
  private tail = 0;
  private size = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Add item to buffer (overwrites oldest if full)
   */
  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    
    if (this.size < this.capacity) {
      this.size++;
    } else {
      // Buffer is full, move head forward
      this.head = (this.head + 1) % this.capacity;
    }
  }

  /**
   * Get item at index (0 = oldest, size-1 = newest)
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.size) {
      return undefined;
    }
    
    const actualIndex = (this.head + index) % this.capacity;
    return this.buffer[actualIndex];
  }

  /**
   * Get the newest item
   */
  getNewest(): T | undefined {
    if (this.size === 0) return undefined;
    const newestIndex = (this.tail - 1 + this.capacity) % this.capacity;
    return this.buffer[newestIndex];
  }

  /**
   * Get the oldest item
   */
  getOldest(): T | undefined {
    if (this.size === 0) return undefined;
    return this.buffer[this.head];
  }

  /**
   * Get all items as array (oldest to newest)
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Get current size
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Get capacity
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Check if buffer is full
   */
  isFull(): boolean {
    return this.size === this.capacity;
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Calculate average of numeric values in buffer
   */
  average(): number {
    if (this.size === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (typeof item === 'number') {
        sum += item;
      }
    }
    
    return sum / this.size;
  }

  /**
   * Find maximum value in buffer
   */
  max(): T | undefined {
    if (this.size === 0) return undefined;
    
    let maxItem = this.get(0);
    for (let i = 1; i < this.size; i++) {
      const item = this.get(i);
      if (item !== undefined && maxItem !== undefined && item > maxItem) {
        maxItem = item;
      }
    }
    
    return maxItem;
  }

  /**
   * Find minimum value in buffer
   */
  min(): T | undefined {
    if (this.size === 0) return undefined;
    
    let minItem = this.get(0);
    for (let i = 1; i < this.size; i++) {
      const item = this.get(i);
      if (item !== undefined && minItem !== undefined && item < minItem) {
        minItem = item;
      }
    }
    
    return minItem;
  }
}

/**
 * Memory usage monitor for tracking and optimizing memory consumption
 */
export class MemoryUsageMonitor {
  private memorySnapshots: CircularBuffer<number>;
  private readonly maxSnapshots = 100;
  private monitoringInterval: number | null = null;
  private onMemoryWarning: ((usage: MemoryInfo) => void) | null = null;
  private readonly warningThreshold = 0.8; // 80% of available memory

  constructor() {
    this.memorySnapshots = new CircularBuffer<number>(this.maxSnapshots);
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = window.setInterval(() => {
      this.checkMemoryUsage();
    }, intervalMs);
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check current memory usage
   */
  private checkMemoryUsage(): void {
    const memoryInfo = this.getMemoryInfo();
    if (memoryInfo) {
      const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
      this.memorySnapshots.push(usageRatio);

      // Trigger warning if usage is high
      if (usageRatio > this.warningThreshold && this.onMemoryWarning) {
        this.onMemoryWarning(memoryInfo);
      }
    }
  }

  /**
   * Get current memory information
   */
  getMemoryInfo(): MemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory as MemoryInfo;
    }
    return null;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    current: number;
    average: number;
    peak: number;
    isHighUsage: boolean;
  } {
    const current = this.memorySnapshots.getNewest() || 0;
    const average = this.memorySnapshots.average();
    const peak = this.memorySnapshots.max() || 0;
    const isHighUsage = current > this.warningThreshold;

    return {
      current,
      average,
      peak,
      isHighUsage
    };
  }

  /**
   * Set memory warning callback
   */
  onMemoryWarningCallback(callback: (usage: MemoryInfo) => void): void {
    this.onMemoryWarning = callback;
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.memorySnapshots.clear();
    this.onMemoryWarning = null;
  }
}

/**
 * Memory info interface (from Performance API)
 */
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Audio data buffer pool for reusing typed arrays
 */
export class AudioBufferPool {
  private frequencyBuffers: Uint8Array[] = [];
  private timeBuffers: Uint8Array[] = [];
  private readonly maxPoolSize = 10;
  private readonly bufferSize: number;

  constructor(bufferSize: number) {
    this.bufferSize = bufferSize;
  }

  /**
   * Get a frequency data buffer from pool or create new one
   */
  getFrequencyBuffer(): Uint8Array {
    const buffer = this.frequencyBuffers.pop();
    if (buffer) {
      // Clear the buffer before reuse
      buffer.fill(0);
      return buffer;
    }
    return new Uint8Array(this.bufferSize);
  }

  /**
   * Get a time domain buffer from pool or create new one
   */
  getTimeBuffer(): Uint8Array {
    const buffer = this.timeBuffers.pop();
    if (buffer) {
      // Clear the buffer before reuse
      buffer.fill(0);
      return buffer;
    }
    return new Uint8Array(this.bufferSize);
  }

  /**
   * Return frequency buffer to pool
   */
  returnFrequencyBuffer(buffer: Uint8Array | Uint8Array<ArrayBufferLike>): void {
    if (this.frequencyBuffers.length < this.maxPoolSize && buffer.length === this.bufferSize) {
      // Create a proper Uint8Array if needed
      const properBuffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      this.frequencyBuffers.push(properBuffer);
    }
  }

  /**
   * Return time buffer to pool
   */
  returnTimeBuffer(buffer: Uint8Array | Uint8Array<ArrayBufferLike>): void {
    if (this.timeBuffers.length < this.maxPoolSize && buffer.length === this.bufferSize) {
      // Create a proper Uint8Array if needed
      const properBuffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      this.timeBuffers.push(properBuffer);
    }
  }

  /**
   * Clear all buffers from pool
   */
  clear(): void {
    this.frequencyBuffers = [];
    this.timeBuffers = [];
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    frequencyBuffersAvailable: number;
    timeBuffersAvailable: number;
    totalBuffersInUse: number;
  } {
    return {
      frequencyBuffersAvailable: this.frequencyBuffers.length,
      timeBuffersAvailable: this.timeBuffers.length,
      totalBuffersInUse: (this.maxPoolSize * 2) - (this.frequencyBuffers.length + this.timeBuffers.length)
    };
  }
}