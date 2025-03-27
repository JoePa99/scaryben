import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tgmetgsidyjqgggqukug.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWV0Z3NpZHlqcWdnZ3F1a3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwOTI5MjYsImV4cCI6MjA1ODY2ODkyNn0.XJHEM7Bq99SQaNj2q4VvEY-HNQaSXrw7x1PGrn46MVc';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`[SUPABASE] Initialized with URL: ${supabaseUrl}`);

export default supabase;