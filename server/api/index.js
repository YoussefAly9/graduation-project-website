import app, { ensureReady } from '../src/app.js';

// Kick off DB connection in the background; never block or crash the cold start.
ensureReady().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Background initialization failed:', error?.message || error);
});

export default app;
