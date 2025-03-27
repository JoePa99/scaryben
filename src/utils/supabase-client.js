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

// Create the client with error handling
try {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (!supabaseKey) {
    throw new Error('Missing Supabase key - please set SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false // Don't persist sessions in serverless
    }
  });
  
  console.log(`[SUPABASE] Initialized with URL: ${supabaseUrl}`);
  
  // Export the client
  export default supabase;
} catch (error) {
  console.error(`[SUPABASE] Failed to initialize: ${error.message}`);
  
  // Create an empty client that returns errors for all operations
  // This prevents the app from crashing completely when Supabase is misconfigured
  const errorClient = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') }),
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') })
  };
  
  export default errorClient;
}