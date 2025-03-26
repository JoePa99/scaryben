// Access the pending requests map from the main handler
import { pendingRequests } from '../../question';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId } = req.query;
    
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    const requestData = pendingRequests.get(requestId);
    
    if (!requestData) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (requestData.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Result not yet available',
        status: requestData.status,
        stage: requestData.stage,
        progress: requestData.progress
      });
    }

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
