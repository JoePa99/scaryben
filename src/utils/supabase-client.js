import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for the entire app
// Use environment variables first, fallback to hardcoded values for development only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tgmetgsidyjqgggqukug.supabase.co';

// For the key, try to use the environment variables first
let supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only use the fallback in development or if no key is provided
if (!supabaseKey && (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV)) {
  console.warn('[SUPABASE] Using fallback key - this should only happen in development');
  supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWV0Z3NpZHlqcWdnZ3F1a3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwOTI5MjYsImV4cCI6MjA1ODY2ODkyNn0.XJHEM7Bq99SQaNj2q4VvEY-HNQaSXrw7x1PGrn46MVc';
}

// Function to create a dummy client that just returns errors
// This prevents crashes when Supabase is misconfigured
const createErrorClient = () => {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') }),
      eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') }) })
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') })
  };
};

// Initialize Supabase client
let supabase;

if (!supabaseUrl || !supabaseKey) {
  console.error('[SUPABASE] Missing URL or API key - using dummy client');
  supabase = createErrorClient();
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    console.log(`[SUPABASE] Initialized with URL: ${supabaseUrl}`);
  } catch (error) {
    console.error(`[SUPABASE] Failed to initialize: ${error.message}`);
    supabase = createErrorClient();
  }
}

export default supabase;