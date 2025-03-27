// Socket.IO implementation for Vercel serverless
import { Server } from 'socket.io';

// Keep a map of active rooms
const activeRooms = new Map();

// Create Socket.IO server
export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Socket.IO is already running
    if (res.socket.server.io) {
      console.log('[SOCKET] Socket.IO already running');
      res.end('Socket.IO already running');
      return;
    }

    console.log('[SOCKET] Initializing Socket.IO server...');
    
    // Create new Socket.IO server with basic configuration
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      cors: {
        origin: '*',
      },
      transports: ['polling', 'websocket'],
      connectTimeout: 10000,
      pingTimeout: 5000,
      pingInterval: 10000
    });

    // Store the instance on the server
    res.socket.server.io = io;

    // Socket connection handler
    io.on('connection', (socket) => {
      console.log(`[SOCKET] Client connected: ${socket.id}`);

      // Join room handler
      socket.on('join', ({ requestId }) => {
        if (!requestId) return;
        
        // Create room name for this request
        const room = `process:${requestId}`;
        
        // Join the room
        socket.join(room);
        
        // Update the active rooms
        if (!activeRooms.has(room)) {
          activeRooms.set(room, 0);
        }
        activeRooms.set(room, activeRooms.get(room) + 1);
        
        console.log(`[SOCKET] Client ${socket.id} joined room: ${room} (${activeRooms.get(room)} clients)`);
      });

      // Leave room handler
      socket.on('leave', ({ requestId }) => {
        if (!requestId) return;
        
        // Create room name for this request
        const room = `process:${requestId}`;
        
        // Leave the room
        socket.leave(room);
        
        // Update the active rooms
        if (activeRooms.has(room)) {
          const count = activeRooms.get(room) - 1;
          if (count <= 0) {
            activeRooms.delete(room);
          } else {
            activeRooms.set(room, count);
          }
        }
        
        console.log(`[SOCKET] Client ${socket.id} left room: ${room}`);
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
      });
    });

    console.log('[SOCKET] Socket.IO initialized successfully');
    res.end('Socket.IO initialized successfully');
  } catch (error) {
    console.error('[SOCKET] Socket initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize Socket.IO' });
  }
}

// Function to emit updates to a request room
export function emitProcessUpdate(requestId, data) {
  try {
    // Quick sanity check
    if (!requestId || !data) {
      console.warn('[SOCKET] Invalid emit parameters:', { requestId, data });
      return;
    }

    // Try to get the io instance
    const { io } = global._res?.socket?.server || {};
    if (!io) {
      console.warn('[SOCKET] Cannot emit - Socket.IO not initialized');
      return;
    }

    // Create room name for this request
    const room = `process:${requestId}`;
    const eventName = `process:${requestId}:update`;

    // Check if anyone is in the room
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    
    if (roomSize > 0) {
      // Emit the update to the room
      io.to(room).emit(eventName, data);
      console.log(`[SOCKET] Emitted update to ${roomSize} clients in room: ${room}`);
    } else {
      console.log(`[SOCKET] No clients in room: ${room}, update not emitted`);
    }
  } catch (error) {
    console.error('[SOCKET] Error emitting update:', error);
  }
}
