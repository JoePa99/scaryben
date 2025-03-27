// Debug endpoint to view all pending requests and state
import { getAllRequests } from '../../utils/server-state';

export default async function handler(req, res) {
  // Return all request data in development or if explicitly requested in production
  try {
    const requests = await getAllRequests();

    // Format requests for display
    const formattedRequests = {};
    requests.forEach(data => {
      const requestId = data.request_id;
      // Create a safe copy of the request data to avoid exposing sensitive information
      formattedRequests[requestId] = {
        requestId,
        status: data.status,
        stage: data.stage,
        progress: data.progress,
        question: data.question,
        startTime: data.start_time,
        lastUpdated: data.last_updated,
        endTime: data.end_time,
        error: data.error,
        resultReady: data.status === 'completed',
        // Only include basic info about the result
        resultAvailable: !!data.result
      };
    });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      totalRequests: requests.length,
      requests: formattedRequests
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error fetching request data',
      details: error.message
    });
  }
}