import { io } from 'socket.io-client';

// Create a singleton instance of the socket connection
let socket;

export const initializeSocket = () => {
  if (!socket) {
    socket = io({
      path: '/api/socketio',
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
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