// Simplified version of Socket.IO endpoint for debugging
import { Server } from 'socket.io';

export default function handler(req, res) {
  try {
    // Check if Socket.IO is already set up
    if (res.socket.server.io) {
      console.log('[SOCKET] Socket.IO already initialized');
      return res.end('Socket.IO already running');
    }
    
    // Initialize socket server with error handling
    try {
      const io = new Server(res.socket.server, {
        cors: {
          origin: '*',
        },
        path: '/api/socketio-fix'
      });
      
      res.socket.server.io = io;
      
      // Socket.IO connection handling
      io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        
        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
        });
      });
      
      console.log('[SOCKET] Socket.IO initialized successfully');
      return res.end('Socket.IO initialized');
    } catch (socketError) {
      console.error('[SOCKET] Error initializing Socket.IO:', socketError);
      return res.status(500).json({ 
        error: 'Failed to initialize Socket.IO',
        details: socketError.message
      });
    }
  } catch (error) {
    console.error('[SOCKET] Unhandled server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}