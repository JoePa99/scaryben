// Enhanced Socket.IO endpoint optimized for Vercel
import { Server } from 'socket.io';

// Use a module-level variable to store the IO instance between invocations
let ioInstance;

export default function handler(req, res) {
  try {
    // Only handle WebSocket GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if Socket.IO is already set up
    if (res.socket.server.io) {
      console.log('[SOCKET] Socket.IO already initialized');
      
      // Send a successful response
      res.end('Socket.IO already running');
      return;
    }
    
    // Initialize socket server with specific Vercel-friendly config
    const io = new Server(res.socket.server, {
      path: '/api/socketio-vercel',
      transports: ['polling', 'websocket'],
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      // Specific settings for Vercel serverless
      pingTimeout: 20000,
      pingInterval: 25000,
      connectTimeout: 10000,
      // Disable compression for edge environments
      perMessageDeflate: false
    });
    
    // Save socket instance to re-use across API calls
    res.socket.server.io = io;
    
    // Common rooms for connection pooling
    const rooms = new Map();
    
    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('[SOCKET] Client connected:', socket.id);
      
      // Handle joining request-specific rooms
      socket.on('join', ({ requestId }) => {
        if (!requestId) return;
        
        socket.join(`request:${requestId}`);
        rooms.set(requestId, (rooms.get(requestId) || 0) + 1);
        console.log(`[SOCKET] Client ${socket.id} joined room for request ${requestId}`);
      });
      
      // Handle leaving rooms
      socket.on('leave', ({ requestId }) => {
        if (!requestId) return;
        
        socket.leave(`request:${requestId}`);
        const count = rooms.get(requestId) || 0;
        if (count > 0) rooms.set(requestId, count - 1);
        console.log(`[SOCKET] Client ${socket.id} left room for request ${requestId}`);
      });
      
      // Clean up on disconnect
      socket.on('disconnect', () => {
        console.log('[SOCKET] Client disconnected:', socket.id);
      });
    });
    
    // Store for re-use across serverless functions
    ioInstance = io;
    
    console.log('[SOCKET] Socket.IO initialized successfully');
    res.end('Socket.IO initialized');
  } catch (error) {
    console.error('[SOCKET] Error initializing Socket.IO:', error);
    res.status(500).json({ error: 'Failed to initialize Socket.IO', details: error.message });
  }
}

// Export io instance for use in other files
export { ioInstance };