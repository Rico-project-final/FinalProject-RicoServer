import { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: IOServer;

export const initializeSocket = (server: HTTPServer) => {
  io = new IOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Admin connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`⚡ Admin disconnected: ${socket.id}`);
    });
  });
};

export const getSocket = () => io;
