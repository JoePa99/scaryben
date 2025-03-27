// Enhanced Socket.IO endpoint optimized for Vercel
import { Server } from 'socket.io';

// Create handler
export default async function SocketHandler(req, res) {
  // Check if socket is already initialized
  if (res.socket.server.io) {
    console.log('Socket.IO already initialized');
    res.end('Socket.IO already running');
    return;
  }

  try {
    // Create new server instance
    const io = new Server(res.socket.server, {
      path: '/api/socketio-vercel',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['polling', 'websocket'],
      // Simplified settings for easier debugging
      pingTimeout: 10000,
      pingInterval: 25000,
    });

    // Store the io instance on the server object
    res.socket.server.io = io;

    // Set up connection handler
    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Join specific request channel
      socket.on('join', ({ requestId }) => {
        if (!requestId) return;
        const room = `process:${requestId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      });

      // Leave specific request channel
      socket.on('leave', ({ requestId }) => {
        if (!requestId) return;
        const room = `process:${requestId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      });

      // Cleanup on disconnect
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    // Send messages to specific request
    io.emitToRequest = (requestId, event, data) => {
      if (!requestId) return;
      const room = `process:${requestId}`;
      io.to(room).emit(event, data);
    };

    console.log('Socket.IO server initialized');
    res.end('Socket.IO initialized');
  } catch (error) {
    console.error('Socket initialization error:', error);
    res.status(500).json({ error: error.message });
  }
}