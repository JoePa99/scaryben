// Diagnostic endpoint to test Supabase state persistence
import { getRequest, setRequest, updateRequest, deleteRequest, getAllRequests } from '../../utils/server-state';
import supabase from '../../utils/supabase-client';

export default async function handler(req, res) {
  // This endpoint will create a test request, update it, and retrieve it to ensure Supabase integration works

  try {
    // Create a test ID with timestamp for uniqueness
    const testId = `test-${Date.now()}`;
    
    // Step 1: Create a new test request
    await setRequest(testId, {
      status: 'test',
      stage: 'diagnostics',
      progress: 0,
      startTime: Date.now(),
      question: 'Debug test question',
      result: null,
      error: null
    });
    
    console.log(`[DEBUG] Created test request ${testId}`);
    
    // Step 2: Update the request
    await updateRequest(testId, {
      progress: 50,
      message: 'Test update'
    });
    
    console.log(`[DEBUG] Updated test request ${testId}`);
    
    // Step 3: Retrieve the request
    const request = await getRequest(testId);
    
    // Step 4: Get all requests to verify persistence
    const allRequests = await getAllRequests();
    
    // Step 5: Delete the test request
    await deleteRequest(testId);
    
    console.log(`[DEBUG] Deleted test request ${testId}`);
    
    // Check Supabase connection
    let connectionStatus = 'unknown';
    let tableExists = false;
    let dbInfo = null;
    
    try {
      // Check if we can connect to Supabase
      const { data, error } = await supabase.from('franklin_requests').select('count').limit(1);
      
      if (error) {
        connectionStatus = `Error: ${error.message}`;
      } else {
        connectionStatus = 'Connected';
        tableExists = true;
        
        // Get table info
        const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info');
        if (!tableError) {
          dbInfo = tableInfo;
        }
      }
    } catch (error) {
      console.error('Error checking Supabase connection:', error);
      connectionStatus = `Exception: ${error.message}`;
    }
    
    // Get current state after deletion
    const finalRequests = await getAllRequests();
    
    // Return diagnostics
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      testId,
      testRequest: request,
      stateWorking: !!request,
      requestsBeforeDelete: allRequests.length,
      requestsAfterDelete: finalRequests.length,
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        connectionStatus,
        tableExists,
        dbInfo
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!(process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error in state management diagnostic',
      details: error.message
    });
  }
}