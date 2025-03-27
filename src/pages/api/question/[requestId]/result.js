// Access the pending requests map from our server state module
import { getRequest } from '../../../../utils/server-state';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId } = req.query;
    
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    console.log(`[SERVER] Result request for ID: ${requestId}`);
    const requestData = await getRequest(requestId);
    
    if (!requestData) {
      console.log(`[SERVER] Request ${requestId} not found in database`);
      return res.status(404).json({ error: 'Request not found' });
    }

    if (requestData.status !== 'completed') {
      console.log(`[SERVER] Result not ready for ${requestId}, status: ${requestData.status}`);
      return res.status(400).json({ 
        error: 'Result not yet available',
        status: requestData.status,
        stage: requestData.stage,
        progress: requestData.progress
      });
    }

    console.log(`[SERVER] Returning result for ${requestId}`);
    // Return the complete result
    return res.status(200).json({
      requestId,
      status: 'completed',
      ...requestData.result
    });
  } catch (error) {
    console.error('Result API Error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while fetching result',
      details: error.message 
    });
  }
}