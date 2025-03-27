// API route to set up Supabase Row Level Security policies
import supabase from '../../utils/supabase-client';

export default async function handler(req, res) {
  try {
    // Verify connection first
    const { data: connectionTest, error: connectionError } = await supabase
      .from('franklin_requests')
      .select('count(*)')
      .limit(1);

    if (connectionError) {
      return res.status(500).json({
        error: 'Failed to connect to Supabase',
        details: connectionError.message
      });
    }

    // 1. Check if table exists
    const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info');
    
    if (tableError) {
      return res.status(500).json({
        error: 'Failed to get table information',
        details: tableError.message
      });
    }

    if (!tableInfo.table_exists) {
      return res.status(404).json({
        error: 'Table franklin_requests does not exist',
        message: 'Please run the SQL setup script first'
      });
    }

    // 2. Set up RLS policies
    // Enable RLS on the table
    const rlsEnableSQL = 'ALTER TABLE public.franklin_requests ENABLE ROW LEVEL SECURITY;';
    
    // Create RLS policy for full access
    const rlsPolicySQL = `
      DROP POLICY IF EXISTS "Allow full access to franklin_requests" ON public.franklin_requests;
      CREATE POLICY "Allow full access to franklin_requests"
        ON public.franklin_requests
        FOR ALL
        USING (true)
        WITH CHECK (true);
    `;
    
    // Execute the RLS SQL
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: rlsEnableSQL + rlsPolicySQL 
    });

    if (rlsError) {
      return res.status(500).json({
        error: 'Failed to set up RLS policies',
        details: rlsError.message,
        note: 'You may need to run this manually in the Supabase SQL editor'
      });
    }

    // 3. Verify we can still access the table
    const { data: verifyData, error: verifyError } = await supabase
      .from('franklin_requests')
      .select('count(*)')
      .limit(1);

    if (verifyError) {
      return res.status(500).json({
        error: 'Failed to verify RLS setup',
        details: verifyError.message
      });
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Supabase RLS policies set up successfully',
      tableInfo
    });
  } catch (error) {
    console.error('Unhandled error in Supabase RLS setup:', error);
    return res.status(500).json({
      error: 'Unhandled error in Supabase RLS setup',
      details: error.message
    });
  }
}