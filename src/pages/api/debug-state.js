// Diagnostic endpoint to test file-based state persistence
import { getRequest, setRequest, updateRequest, deleteRequest, getAllRequests } from '../../utils/server-state';
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // This endpoint will create a test request, update it, and retrieve it to ensure state persistence
  const FILE_STORAGE = process.env.NODE_ENV === 'production' 
    ? '/tmp/franklin-requests.json' 
    : path.join(process.cwd(), '.franklin-requests.json');

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
    
    // Check file storage
    let fileExists = false;
    let fileSize = 0;
    let fileContent = null;
    
    try {
      if (fs.existsSync(FILE_STORAGE)) {
        fileExists = true;
        const stats = fs.statSync(FILE_STORAGE);
        fileSize = stats.size;
        
        if (fileSize > 0) {
          fileContent = JSON.parse(fs.readFileSync(FILE_STORAGE, 'utf8'));
        }
      }
    } catch (error) {
      console.error('Error checking file storage:', error);
    }
    
    // Return diagnostics
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      testId,
      testRequest: request,
      stateWorking: !!request,
      requestsBeforeDelete: allRequests.size,
      requestsAfterDelete: getAllRequests().size,
      allKeys: [...getAllRequests().keys()],
      fileStorage: {
        path: FILE_STORAGE,
        exists: fileExists,
        size: fileSize,
        content: fileContent,
        writeable: true
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error in state management diagnostic',
      details: error.message
    });
  }
}