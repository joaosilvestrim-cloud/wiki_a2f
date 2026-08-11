import { createClient } from '@supabase/supabase-js';
import { 
  checkSupabaseConnectivity, 
  retryWithBackoff, 
  isRetryableNetworkError 
} from '@/lib/networkUtils';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validation flags
let configValidated = false;
let lastConnectivityCheck = null;
let connectivityCheckCache = { connected: false, timestamp: 0 };
const CONNECTIVITY_CACHE_TTL = 30000; // 30 seconds

/**
 * Validate Supabase configuration
 * @throws {Error} If configuration is invalid
 */
const validateConfig = () => {
  if (configValidated) return;

  if (!supabaseUrl) {
    console.error('CRITICAL: VITE_SUPABASE_URL is not configured');
    throw new Error('Supabase URL não configurada. Entre em contato com o suporte técnico.');
  }

  if (!supabaseAnonKey) {
    console.error('CRITICAL: VITE_SUPABASE_ANON_KEY is not configured');
    throw new Error('Chave de API do Supabase não configurada. Entre em contato com o suporte técnico.');
  }

  // Basic URL validation
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('CRITICAL: Invalid Supabase URL format:', supabaseUrl);
    throw new Error('URL do Supabase inválida. Entre em contato com o suporte técnico.');
  }

  console.log('✓ Supabase configuration validated');
  configValidated = true;
};

/**
 * Check Supabase connectivity with caching
 * @param {boolean} useCache - Whether to use cached result
 * @returns {Promise<{connected: boolean, error: string|null}>}
 */
export const validateSupabaseConnection = async (useCache = true) => {
  const now = Date.now();
  
  // Return cached result if valid
  if (useCache && connectivityCheckCache.timestamp > 0 && 
      (now - connectivityCheckCache.timestamp) < CONNECTIVITY_CACHE_TTL) {
    return connectivityCheckCache;
  }

  const result = await checkSupabaseConnectivity(supabaseUrl);
  
  // Update cache
  connectivityCheckCache = {
    ...result,
    timestamp: now,
  };

  if (!result.connected) {
    console.error('Supabase connectivity check failed:', result.error);
  } else {
    console.log('✓ Supabase connection verified');
  }

  return result;
};

/**
 * Create Supabase client with enhanced error handling and retry logic
 */
const createSupabaseClient = () => {
  try {
    validateConfig();

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-application-name': 'intranet-corporativa',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // Wrap auth methods with retry logic
    const originalSignIn = client.auth.signInWithPassword.bind(client.auth);
    
    client.auth.signInWithPassword = async (credentials) => {
      return retryWithBackoff(
        () => originalSignIn(credentials),
        {
          maxRetries: 3,
          baseDelay: 1000,
          shouldRetry: (error) => isRetryableNetworkError(error),
          onRetry: ({ attempt, maxRetries, delay, error }) => {
            console.log(`Login attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
            console.log('Error:', error.message);
          },
        }
      );
    };

    console.log('✓ Supabase client initialized successfully');
    return client;

  } catch (error) {
    console.error('CRITICAL: Failed to initialize Supabase client:', error);
    throw error;
  }
};

// Create and export the client instance
let supabaseInstance = null;

try {
  supabaseInstance = createSupabaseClient();
} catch (error) {
  console.error('Failed to create Supabase instance on module load:', error);
  // Don't throw here - allow the app to load and show proper error messages
}

/**
 * Get Supabase client instance
 * @returns {Object} Supabase client
 * @throws {Error} If client initialization failed
 */
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    throw new Error('Supabase client não inicializado. Verifique a configuração.');
  }
  return supabaseInstance;
};

// Export the client as default (with fallback for error cases)
export const supabase = supabaseInstance || {
  auth: {
    signInWithPassword: async () => {
      throw new Error('Supabase não está configurado corretamente. Entre em contato com o suporte.');
    },
    signOut: async () => {
      throw new Error('Supabase não está configurado corretamente. Entre em contato com o suporte.');
    },
    getSession: async () => {
      throw new Error('Supabase não está configurado corretamente. Entre em contato com o suporte.');
    },
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } }
    }),
  },
  from: () => ({
    select: () => Promise.reject(new Error('Supabase não está configurado corretamente.')),
    insert: () => Promise.reject(new Error('Supabase não está configurado corretamente.')),
    update: () => Promise.reject(new Error('Supabase não está configurado corretamente.')),
    delete: () => Promise.reject(new Error('Supabase não está configurado corretamente.')),
  }),
  storage: {
    from: () => ({
      upload: () => Promise.reject(new Error('Supabase não está configurado corretamente.')),
      download: () => Promise.reject(new Error('Supabase não está configurado corretamente.')),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};

export default supabase;