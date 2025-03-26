// Direct access to the result API endpoint via /api/question_direct/requestId/[id]/result
import { getRequest } from '../../../../../utils/server-state';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    const requestData = getRequest(id);
    
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
      requestId: id,
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