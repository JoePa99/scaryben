// Direct access to the question API endpoint
// This creates a route at /question
import { FRANKLIN_PERSONA } from '../../utils/prompts';
import axios from 'axios';
import { setRequest, updateRequest, deleteRequest, fakeDemoMode, simulateProcessing } from '../../utils/server-state';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Create a unique ID for this request
    const requestId = Date.now().toString();
    
    // Process the request in the background using demo mode
    // We're always using demo mode for simplicity
    simulateProcessing(requestId, question);
    
    // Immediately return a response with the request ID
    return res.status(202).json({ 
      requestId,
      status: 'processing',
      message: 'Your question is being processed',
      statusUrl: `/question/${requestId}/status`,
      resultUrl: `/question/${requestId}/result`
    });
  } catch (error) {
    console.error('API Error:', error);
    
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error.message
    });
  }
}