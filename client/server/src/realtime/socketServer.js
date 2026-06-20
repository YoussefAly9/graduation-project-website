import { onRobotEvent } from './eventBus.js';

/**
 * Attach a Socket.IO server to an existing HTTP server and bridge robot events
 * from the in-process event bus to connected website clients.
 *
 * Socket.IO is imported dynamically so it is ONLY loaded by the standalone
 * server (`server/src/index.js`). The Vercel serverless function never imports
 * this file, so the serverless bundle stays small and clients there use polling.
 *
 * @param {import('http').Server} httpServer
 * @returns {Promise<import('socket.io').Server|null>}
 */
export const attachSocketServer = async (httpServer) => {
  let SocketIOServer;
  try {
    ({ Server: SocketIOServer } = await import('socket.io'));
  } catch (error) {
    // socket.io not installed — fall back to polling silently.
    // eslint-disable-next-line no-console
    console.warn('socket.io not available; realtime push disabled (clients can still poll).');
    return null;
  }

  const io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.SOCKET_CORS_ORIGIN || '*' },
    path: process.env.SOCKET_PATH || '/socket.io'
  });

  io.on('connection', (socket) => {
    // Clients can join a per-order room to receive only their order's events.
    socket.on('subscribe:order', (orderId) => {
      if (orderId) socket.join(`order:${orderId}`);
    });
    socket.on('unsubscribe:order', (orderId) => {
      if (orderId) socket.leave(`order:${orderId}`);
    });
  });

  // Forward every robot event to all clients, plus the order-specific room.
  onRobotEvent((event) => {
    io.emit('robot:event', event);
    if (event.orderId) {
      io.to(`order:${event.orderId}`).emit('order:robot:event', event);
    }
  });

  // eslint-disable-next-line no-console
  console.log('Socket.IO realtime server attached');
  return io;
};

export default attachSocketServer;
