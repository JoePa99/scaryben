# Supabase Setup Instructions

## 1. Run this SQL in Supabase SQL Editor

Copy and paste the following SQL into the Supabase SQL Editor:

```sql
-- Create franklin_requests table
CREATE TABLE IF NOT EXISTS public.franklin_requests (
  request_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  stage TEXT,
  progress INTEGER DEFAULT 0,
  message TEXT,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  question TEXT NOT NULL,
  result JSONB,
  error JSONB
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.franklin_requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_last_updated ON public.franklin_requests (last_updated DESC);

-- Create helper function for debugging
CREATE OR REPLACE FUNCTION get_table_info()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'table_exists', EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'franklin_requests'
    ),
    'row_count', (SELECT COUNT(*) FROM public.franklin_requests),
    'columns', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', column_name,
        'type', data_type
      ))
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'franklin_requests'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 2. Set up RLS (Row Level Security)

We'll set a simple RLS policy to allow full access to the table:

```sql
-- Enable Row Level Security
ALTER TABLE public.franklin_requests ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations
CREATE POLICY "Allow full access to franklin_requests"
  ON public.franklin_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## 3. Add Environment Variables to Vercel

Add these environment variables to your Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL=https://tgmetgsidyjqgggqukug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWV0Z3NpZHlqcWdnZ3F1a3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwOTI5MjYsImV4cCI6MjA1ODY2ODkyNn0.XJHEM7Bq99SQaNj2q4VvEY-HNQaSXrw7x1PGrn46MVc
```

## 4. Test the Setup

After deploying to Vercel, visit `/api/debug-state` to verify that Supabase is working correctly.