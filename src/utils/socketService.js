import { io } from 'socket.io-client';

// Create a singleton instance of the socket connection
let socket;

export const initializeSocket = () => {
  if (!socket) {
    // Try the new Vercel-optimized endpoint first
    socket = io({
      path: '/api/socketio-vercel',
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      // Vercel-specific optimizations
      forceNew: true,
      reconnection: true
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully using Vercel-optimized endpoint');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      
      // Fallback to the previous endpoint
      if (!socket.connected) {
        console.log('Trying fallback Socket.IO endpoint...');
        socket = io({
          path: '/api/socketio-fix',
          transports: ['polling', 'websocket'], 
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 20000
        });
        
        socket.on('connect', () => {
          console.log('Socket connected successfully using fallback endpoint');
        });
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  }

  return socket;
};

export const subscribeToProcessUpdates = (requestId, callback) => {
  const socket = initializeSocket();
  
  if (!socket) return () => {};

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
};

export default {
  initializeSocket,
  subscribeToProcessUpdates,
};