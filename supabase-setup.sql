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