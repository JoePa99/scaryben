// Main Socket.IO endpoint for Vercel serverless environment
import { Server } from 'socket.io';

// Keep track of whether we've already set up Socket.IO to avoid re-initialization
// Note: In serverless, this won't persist across function invocations,
// but it helps during development and with concurrent requests
let ioInitialized = false;

export default function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket.IO already running');
    res.end('Socket.IO already running');
    return;
  }

  try {
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      // Vercel-optimized settings
      transports: ['polling', 'websocket'],
      pingTimeout: 10000,
      pingInterval: 25000,
      upgradeTimeout: 10000,
    });

    // Store io instance on the server object
    res.socket.server.io = io;

    console.log('Socket.IO server initialized');

    // Set up connection handler
    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle room joining
      socket.on('join', ({ requestId }) => {
        const room = `process:${requestId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      });

      // Handle room leaving
      socket.on('leave', ({ requestId }) => {
        const room = `process:${requestId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    // Mark as initialized
    ioInitialized = true;
    
    res.end('Socket.IO started');
  } catch (error) {
    console.error('Error initializing Socket.IO:', error);
    res.status(500).end(`Error initializing Socket.IO: ${error.message}`);
  }
}