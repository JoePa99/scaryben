// Diagnostic endpoint to test in-memory state persistence
import { getRequest, setRequest, updateRequest, deleteRequest, getAllRequests } from '../../utils/server-state';

export default function handler(req, res) {
  // This endpoint will create a test request, update it, and retrieve it to ensure state persistence

  try {
    // Create a test ID with timestamp for uniqueness
    const testId = `test-${Date.now()}`;
    
    // Step 1: Create a new test request
    setRequest(testId, {
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
    updateRequest(testId, {
      progress: 50,
      message: 'Test update'
    });
    
    console.log(`[DEBUG] Updated test request ${testId}`);
    
    // Step 3: Retrieve the request
    const request = getRequest(testId);
    
    // Step 4: Get all requests to verify persistence
    const allRequests = getAllRequests();
    
    // Step 5: Delete the test request
    deleteRequest(testId);
    
    console.log(`[DEBUG] Deleted test request ${testId}`);
    
    // Return diagnostics
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      testId,
      testRequest: request,
      stateWorking: !!request,
      requestsBeforeDelete: allRequests.size,
      requestsAfterDelete: getAllRequests().size,
      allKeys: [...getAllRequests().keys()]
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error in state management diagnostic',
      details: error.message
    });
  }
}