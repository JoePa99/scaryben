// Simplified version of the question API for debugging
import supabase from '../../utils/supabase-client';

export default async function handler(req, res) {
  try {
    // Report Supabase connection status
    const tableName = 'franklin_requests';
    
    try {
      // Check if we can connect to Supabase
      const { data, error } = await supabase
        .from(tableName)
        .select('count', { count: 'exact' })
        .limit(1);
      
      if (error) {
        return res.status(500).json({
          error: `Supabase connection error: ${error.message}`,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '[not set]',
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          method: req.method
        });
      }
      
      // Test inserting a record
      const testId = `test-${Date.now()}`;
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({
          request_id: testId,
          status: 'test',
          stage: 'diagnosis',
          question: 'Test question',
          start_time: new Date().toISOString()
        });
      
      if (insertError) {
        return res.status(500).json({
          error: `Supabase insert error: ${insertError.message}`,
          table: tableName,
          requestId: testId
        });
      }
      
      // Return success
      return res.status(200).json({
        message: 'Supabase connection successful',
        table: tableName,
        requestCount: data[0]?.count || 0,
        testId: testId,
        env: {
          nodeEnv: process.env.NODE_ENV,
          vercel: process.env.VERCEL === '1' ? 'Yes' : 'No'
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: `Unexpected error: ${error.message}`,
        stack: error.stack
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: `Server error: ${error.message}`
    });
  }
}