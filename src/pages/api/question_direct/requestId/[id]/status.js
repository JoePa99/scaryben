// Direct access to the status API endpoint via /api/question_direct/requestId/[id]/status
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

    // Return the current status without the full result
    const { result, ...statusData } = requestData;
    
    return res.status(200).json({
      requestId: id,
      ...statusData,
      resultReady: requestData.status === 'completed'
    });
  } catch (error) {
    console.error('Status API Error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while fetching status',
      details: error.message 
    });
  }
}