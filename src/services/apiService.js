import apiClient from '../utils/apiClient';
import { StatusUpdater } from '../utils/statusUpdater';
import { subscribeToProcessUpdates } from '../utils/socketService';

// Submit a question to Benjamin Franklin
export const submitQuestion = async (question, statusCallback, progressCallback) => {
  const statusUpdater = new StatusUpdater(statusCallback);
  
  try {
    // Use the original endpoint - more reliable in production
    statusUpdater.thinking();
    const initialResponse = await apiClient.post('/api/question', { question });
    
    // Get request ID for polling or WebSocket
    const { requestId, statusUrl } = initialResponse.data;
    
    // Set up WebSocket listener for real-time updates
    let unsubscribe;
    let isResolved = false;
    
    console.log(`Setting up web socket and polling for request ID: ${requestId}`);
    
    const result = await new Promise((resolve, reject) => {
      // Set up socket listener
      unsubscribe = subscribeToProcessUpdates(requestId, (update) => {
        console.log(`Socket update received for ${requestId}:`, update);
        
        // Update UI with progress
        if (update.message) {
          statusCallback(update.message);
        }
        if (update.progress && progressCallback) {
          progressCallback(update.progress);
        }
        
        // Handle completion or failure
        if (update.status === 'completed' && !isResolved) {
          console.log(`Request ${requestId} completed via socket`);
          isResolved = true;
          // When completed, fetch the final result
          apiClient.get(`/api/question/${requestId}/result`)
            .then(response => {
              resolve(response.data);
            })
            .catch(error => {
              reject(error);
            });
        } else if (update.status === 'failed' && !isResolved) {
          console.log(`Request ${requestId} failed via socket`);
          isResolved = true;
          reject(new Error('Failed to process your question'));
        }
      });
      
      // Set up fallback polling in case WebSocket fails
      console.log(`Setting up fallback polling for ${requestId}`);
      pollForResult(requestId, statusUpdater, progressCallback)
        .then(result => {
          if (!isResolved) {
            console.log(`Request ${requestId} completed via polling`);
            isResolved = true;
            resolve(result);
          }
        })
        .catch(error => {
          if (!isResolved) {
            console.log(`Request ${requestId} failed via polling: ${error.message}`);
            isResolved = true;
            reject(error);
          }
        });
    });
    
    // Clean up WebSocket listener
    if (unsubscribe) {
      unsubscribe();
    }
    
    statusUpdater.done();
    return result;
  } catch (error) {
    console.error('Error submitting question:', error);
    throw error;
  }
};

// Poll for status and result (fallback if WebSocket doesn't work)
const pollForResult = async (requestId, statusUpdater, progressCallback) => {
  const MAX_POLLS = 300; // 5 minutes at 1 second intervals
  const POLL_INTERVAL = 1000; // 1 second
  
  let pollCount = 0;
  
  while (pollCount < MAX_POLLS) {
    try {
      // Ensure correct endpoint path for the deployed version
      console.log(`Checking status from: /api/question/${requestId}/status`);
      const statusResponse = await apiClient.get(`/api/question/${requestId}/status`);
      const { status, stage, progress, resultReady, message } = statusResponse.data;
      
      // Update the UI with current status
      if (message) {
        statusUpdater.update(message);
      } else {
        // Default status messages based on stage
        switch(stage) {
          case 'thinking':
            statusUpdater.thinking();
            break;
          case 'speaking':
            statusUpdater.speaking();
            break;
          case 'animating':
            statusUpdater.animating();
            break;
        }
      }
      
      // Update progress if callback provided
      if (progressCallback && progress !== undefined) {
        progressCallback(progress);
      }
      
      // If there's an error, throw it
      if (status === 'failed') {
        throw new Error('Failed to process your question');
      }
      
      // If the result is ready, get it and return - use the original endpoint path
      if (resultReady) {
        console.log(`Result is ready, retrieving from /api/question/${requestId}/result`);
        const resultResponse = await apiClient.get(`/api/question/${requestId}/result`);
        return resultResponse.data;
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      pollCount++;
    } catch (error) {
      console.error('Error polling for result:', error);
      throw error;
    }
  }
  
  throw new Error('Request timed out');
};

// Get previous conversation history (for future implementation)
// Not implemented yet
export const getConversationHistory = async () => {
  try {
    // This functionality is not yet implemented
    return { conversations: [] };
  } catch (error) {
    console.error('Error getting conversation history:', error);
    throw error;
  }
};