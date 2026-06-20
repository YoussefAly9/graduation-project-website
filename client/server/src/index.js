import http from 'node:http';

import app, { ensureReady } from './app.js';
import { attachSocketServer } from './realtime/socketServer.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await ensureReady();

    // Use an explicit HTTP server so Socket.IO can attach for realtime updates.
    const httpServer = http.createServer(app);
    await attachSocketServer(httpServer);

    httpServer.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`API server ready on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
