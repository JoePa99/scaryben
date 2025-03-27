// Socket service with polling fallback for Vercel deployment
import { io as socketIO } from 'socket.io-client';

// Track whether we've already logged socket errors
let socketErrorLogged = false;
// Force polling mode for Vercel deployment
let pollingActive = true; // Set to true to force polling mode
let socketConnected = false;

// Create a singleton instance of the socket connection
let socket;

// Callbacks for status updates (used by polling fallback)
const eventCallbacks = new Map();

// Set up reference to socket.io client, but allow it to be disabled
let io = socketIO;

// Detect if we're running in production environment
if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
  console.log('Running on Vercel deployment, forcing polling mode');
  pollingActive = true;
}

export const initializeSocket = () => {
  // If we've already tried and failed, don't keep trying
  if (socketErrorLogged && !socketConnected) {
    return null;
  }
  
  // If we don't have socket.io or we're in polling fallback mode, don't try to connect
  if (!io || pollingActive) {
    if (!socketErrorLogged) {
      console.log('Socket.IO not available, will use polling instead');
      socketErrorLogged = true;
      pollingActive = true;
    }
    return null;
  }

  // If we already have a socket, return it
  if (socket) {
    return socket;
  }

  try {
    // Try to create a socket
    socket = io({
      path: '/api/socketio-vercel',
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout:
      10000,
      forceNew: true
    });

    // Detect connection success
    socket.on('connect', () => {
      console.log('Socket connected successfully');
      socketConnected = true;
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      socketConnected = false;
    });

    // Handle errors by enabling polling fallback
    socket.on('connect_error', (err) => {
      if (!socketErrorLogged) {
        console.error('Socket connection error, switching to polling:', err.message);
        socketErrorLogged = true;
        pollingActive = true;
        socket = null;
      }
    });

    return socket;
  } catch (error) {
    if (!socketErrorLogged) {
      console.error('Error initializing socket, using polling instead:', error.message);
      socketErrorLogged = true;
      pollingActive = true;
    }
    return null;
  }
};

// Function to start polling for status updates
const startPolling = (requestId) => {
  if (!pollingActive) return;
  
  const pollInterval = setInterval(async () => {
    try {
      // Make a request to the status API
      const statusUrl = `/api/question/${requestId}/status`;
      const response = await fetch(statusUrl);
      
      if (!response.ok) {
        throw new Error(`Status API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      // Get the callback for this request
      const callback = eventCallbacks.get(requestId);
      if (callback) {
        // Call the callback with the status data
        callback(data);
        
        // If request is completed or failed, stop polling
        if (data.status === 'completed' || data.status === 'failed') {
          console.log(`Request ${requestId} ${data.status}, stopping polling`);
          clearInterval(pollInterval);
          eventCallbacks.delete(requestId);
        }
      }
    } catch (error) {
      console.error(`Error polling for request ${requestId}:`, error.message);
    }
  }, 2000); // Poll every 2 seconds
  
  // Store the interval ID for cleanup
  return pollInterval;
};

export const subscribeToProcessUpdates = (requestId, callback) => {
  // Try to use Socket.IO first
  const socket = initializeSocket();
  
  if (socket && socketConnected) {
    // Socket.IO is available, use it
    console.log(`Using Socket.IO for request ${requestId} updates`);
    
    // Create a unique event name for this request
    const eventName = `process:${requestId}:update`;
    
    // Subscribe to status updates
    socket.on(eventName, callback);
    
    // Request to join the room for this request
    socket.emit('join', { requestId });
    
    // Return a cleanup function
    return () => {
      socket.off(eventName);
      socket.emit('leave', { requestId });
    };
  } else {
    // Socket.IO not available, use polling fallback
    console.log(`Using polling fallback for request ${requestId} updates`);
    
    // Store the callback for use by the polling function
    eventCallbacks.set(requestId, callback);
    
    // Start polling
    const pollInterval = startPolling(requestId);
    
    // Return a cleanup function
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      eventCallbacks.delete(requestId);
    };
  }
};

export default {
  initializeSocket,
  subscribeToProcessUpdates,
};