/**
 * Global fetch request deduplication and rate limiting system
 * Prevents duplicate simultaneous requests and implements rate limiting
 */

class FetchDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
    this.requestTimestamps = new Map();
    this.rateLimitWindow = 1000; // 1 second
    this.maxRequestsPerWindow = 5;
  }

  /**
   * Generate a unique key for a request
   */
  generateKey(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Check if request should be rate limited
   */
  shouldRateLimit(key) {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(key) || [];
    
    // Remove old timestamps outside the window
    const recentTimestamps = timestamps.filter(
      ts => now - ts < this.rateLimitWindow
    );
    
    if (recentTimestamps.length >= this.maxRequestsPerWindow) {
      console.warn(`Rate limit exceeded for ${key}`);
      return true;
    }
    
    // Update timestamps
    recentTimestamps.push(now);
    this.requestTimestamps.set(key, recentTimestamps);
    
    return false;
  }

  /**
   * Execute a fetch request with deduplication
   */
  async fetch(url, options = {}) {
    const key = this.generateKey(url, options);
    
    // Check rate limiting
    if (this.shouldRateLimit(key)) {
      throw new Error('Rate limit exceeded. Please wait before retrying.');
    }
    
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      console.log(`Deduplicating request: ${key}`);
      return this.pendingRequests.get(key);
    }
    
    // Create new request promise
    const requestPromise = this._executeRequest(url, options)
      .finally(() => {
        // Clean up pending request
        this.pendingRequests.delete(key);
      });
    
    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Internal method to execute the actual fetch
   */
  async _executeRequest(url, options) {
    const timeout = options.timeout || 10000;
    const controller = new AbortController();
    
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Clear all pending requests
   */
  clearAll() {
    this.pendingRequests.clear();
    this.requestTimestamps.clear();
  }

  /**
   * Clear requests for a specific key pattern
   */
  clearPattern(pattern) {
    const keysToDelete = [];
    
    for (const key of this.pendingRequests.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.pendingRequests.delete(key);
      this.requestTimestamps.delete(key);
    });
  }
}

// Global singleton instance
export const fetchDeduplicator = new FetchDeduplicator();

// Export the class for testing/custom instances
export default FetchDeduplicator;