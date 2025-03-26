import { Server } from 'socket.io';

// Socket.io server instance
let io;

// In production, you'd use a proper in-memory store like Redis
const rooms = new Map();

// Initialize Socket.io server
export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    // Socket is already running
    io = res.socket.server.io;
  } else {
    // Initialize socket server
    io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('New client connected', socket.id);
      
      // Handle room joining
      socket.on('join', ({ requestId }) => {
        const roomName = `request:${requestId}`;
        socket.join(roomName);
        
        // Add to our room tracking
        if (!rooms.has(roomName)) {
          rooms.set(roomName, new Set());
        }
        rooms.get(roomName).add(socket.id);
        
        console.log(`Socket ${socket.id} joined room ${roomName}`);
      });
      
      // Handle room leaving
      socket.on('leave', ({ requestId }) => {
        const roomName = `request:${requestId}`;
        socket.leave(roomName);
        
        // Remove from our room tracking
        if (rooms.has(roomName)) {
          rooms.get(roomName).delete(socket.id);
          if (rooms.get(roomName).size === 0) {
            rooms.delete(roomName);
          }
        }
        
        console.log(`Socket ${socket.id} left room ${roomName}`);
      });
      
      // Clean up on disconnect
      socket.on('disconnect', () => {
        // Remove from all rooms
        for (const [roomName, members] of rooms.entries()) {
          if (members.has(socket.id)) {
            members.delete(socket.id);
            if (members.size === 0) {
              rooms.delete(roomName);
            }
          }
        }
        
        console.log('Client disconnected', socket.id);
      });
    });
  }

  res.end();
}

// Helper function to emit updates to clients
export const emitProcessUpdate = (requestId, data) => {
  if (!io) return;
  
  const roomName = `request:${requestId}`;
  const eventName = `process:${requestId}:update`;
  
  io.to(roomName).emit(eventName, data);
};