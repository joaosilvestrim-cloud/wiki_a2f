/**
 * Network Connectivity and Retry Utilities
 * Provides functions for checking connectivity and implementing retry logic
 */

import { fetchDeduplicator } from './fetchDeduplicator';

const DEFAULT_TIMEOUT = 5000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MIN_CHECK_INTERVAL = 10000; // Minimum 10 seconds between connectivity checks

// Track last connectivity check to prevent excessive checks
let lastConnectivityCheck = {
  timestamp: 0,
  result: null,
  inProgress: false,
};

/**
 * Check if the browser reports being online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Test actual internet connectivity with a fetch request
 * @param {string} url - URL to test connectivity (defaults to Google DNS)
 * @param {number} timeout - Timeout in milliseconds
 * @param {boolean} useCache - Whether to use cached result
 * @returns {Promise<boolean>}
 */
export const checkInternetConnectivity = async (
  url = 'https://dns.google',
  timeout = DEFAULT_TIMEOUT,
  useCache = true
) => {
  // Use cached result if recent enough
  if (useCache && lastConnectivityCheck.result !== null) {
    const timeSinceLastCheck = Date.now() - lastConnectivityCheck.timestamp;
    if (timeSinceLastCheck < MIN_CHECK_INTERVAL) {
      console.log('Using cached connectivity result');
      return lastConnectivityCheck.result;
    }
  }

  // Prevent simultaneous checks
  if (lastConnectivityCheck.inProgress) {
    console.log('Connectivity check already in progress, waiting...');
    // Wait for ongoing check to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    return lastConnectivityCheck.result ?? false;
  }

  if (!isOnline()) {
    lastConnectivityCheck.result = false;
    lastConnectivityCheck.timestamp = Date.now();
    return false;
  }

  lastConnectivityCheck.inProgress = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    await fetchDeduplicator.fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    lastConnectivityCheck.result = true;
    lastConnectivityCheck.timestamp = Date.now();
    lastConnectivityCheck.inProgress = false;
    
    return true;
  } catch (error) {
    console.warn('Internet connectivity check failed:', error.message);
    
    lastConnectivityCheck.result = false;
    lastConnectivityCheck.timestamp = Date.now();
    lastConnectivityCheck.inProgress = false;
    
    return false;
  }
};

/**
 * Check Supabase connection specifically
 * @param {string} supabaseUrl - Supabase project URL
 * @param {number} timeout - Timeout in milliseconds
 * @param {boolean} useCache - Whether to use cached result
 * @returns {Promise<{connected: boolean, error: string|null}>}
 */
export const checkSupabaseConnectivity = async (
  supabaseUrl,
  timeout = DEFAULT_TIMEOUT,
  useCache = true
) => {
  if (!supabaseUrl) {
    return { connected: false, error: 'Supabase URL not configured' };
  }

  if (!isOnline()) {
    return { connected: false, error: 'No internet connection detected' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Test Supabase health endpoint with deduplication
    const response = await fetchDeduplicator.fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal,
      timeout,
    });

    clearTimeout(timeoutId);

    if (response.ok || response.status === 401 || response.status === 404) {
      return { connected: true, error: null };
    }

    return { 
      connected: false, 
      error: `Supabase returned status ${response.status}` 
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { 
        connected: false, 
        error: 'Connection timeout - Supabase may be unreachable' 
      };
    }

    return { 
      connected: false, 
      error: `Connection failed: ${error.message}` 
    };
  }
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
export const calculateBackoffDelay = (attempt, baseDelay = INITIAL_RETRY_DELAY, maxDelay = 10000) => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {number} options.baseDelay - Base delay between retries
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise<any>}
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = MAX_RETRIES,
    baseDelay = INITIAL_RETRY_DELAY,
    shouldRetry = () => true,
    onRetry = () => {},
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        console.error(`Max retries (${maxRetries}) exceeded for operation`);
        throw error;
      }

      // Don't retry if error shouldn't be retried
      if (!shouldRetry(error)) {
        console.log('Error should not be retried, stopping retry logic');
        throw error;
      }

      const delay = calculateBackoffDelay(attempt, baseDelay);
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`);
      
      onRetry({
        attempt: attempt + 1,
        maxRetries,
        delay,
        error,
      });

      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Determine if an error is a network error that should be retried
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isRetryableNetworkError = (error) => {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';
  
  // Don't retry rate limit errors
  if (message.includes('rate limit')) {
    return false;
  }

  // Common network error patterns
  const networkErrorPatterns = [
    'network request failed',
    'failed to fetch',
    'network error',
    'timeout',
    'connection',
    'econnrefused',
    'enotfound',
    'etimedout',
  ];

  return networkErrorPatterns.some(pattern => message.includes(pattern));
};

/**
 * Categorize error type for user-friendly messages
 * @param {Error} error - Error object
 * @returns {string} Error category
 */
export const categorizeError = (error) => {
  if (!error) return 'unknown';

  const message = error.message?.toLowerCase() || '';

  if (!isOnline()) {
    return 'offline';
  }

  if (isRetryableNetworkError(error)) {
    return 'network';
  }

  if (message.includes('invalid login credentials') || 
      message.includes('invalid email') ||
      message.includes('invalid password')) {
    return 'credentials';
  }

  if (message.includes('email not confirmed')) {
    return 'email_not_confirmed';
  }

  if (message.includes('too many requests') || message.includes('rate limit')) {
    return 'rate_limit';
  }

  if (error.status === 500 || message.includes('internal server error')) {
    return 'server';
  }

  return 'unknown';
};

/**
 * Get user-friendly error message based on error category
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error) => {
  const category = categorizeError(error);

  const messages = {
    offline: 'Você está offline. Verifique sua conexão com a internet e tente novamente.',
    network: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    credentials: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.',
    email_not_confirmed: 'Email não confirmado. Verifique sua caixa de entrada.',
    rate_limit: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
    server: 'Erro no servidor. Tente novamente em alguns instantes.',
    unknown: 'Ocorreu um erro inesperado. Tente novamente.',
  };

  return messages[category] || messages.unknown;
};

/**
 * Create a connectivity monitor that checks connection periodically
 * @param {Function} onStatusChange - Callback when connectivity status changes
 * @param {number} interval - Check interval in milliseconds (minimum 10 seconds)
 * @returns {Object} Monitor object with start/stop methods
 */
export const createConnectivityMonitor = (onStatusChange, interval = 30000) => {
  // Enforce minimum interval
  const safeInterval = Math.max(interval, MIN_CHECK_INTERVAL);
  
  let intervalId = null;
  let lastStatus = isOnline();
  let isChecking = false;

  const checkStatus = async () => {
    // Prevent overlapping checks
    if (isChecking) {
      console.log('Connectivity check already in progress, skipping');
      return;
    }

    isChecking = true;

    try {
      const currentStatus = await checkInternetConnectivity('https://dns.google', 5000, true);
      
      if (currentStatus !== lastStatus) {
        lastStatus = currentStatus;
        onStatusChange(currentStatus);
      }
    } catch (error) {
      console.error('Connectivity check error:', error);
    } finally {
      isChecking = false;
    }
  };

  return {
    start: () => {
      if (!intervalId) {
        console.log(`Starting connectivity monitor with ${safeInterval}ms interval`);
        checkStatus(); // Check immediately
        intervalId = setInterval(checkStatus, safeInterval);
      }
    },
    stop: () => {
      if (intervalId) {
        console.log('Stopping connectivity monitor');
        clearInterval(intervalId);
        intervalId = null;
        isChecking = false;
      }
    },
    checkNow: async () => {
      if (!isChecking) {
        await checkStatus();
      }
    },
  };
};

/**
 * Reset connectivity check cache (use sparingly)
 */
export const resetConnectivityCache = () => {
  lastConnectivityCheck = {
    timestamp: 0,
    result: null,
    inProgress: false,
  };
};