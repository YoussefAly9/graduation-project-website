import app, { ensureReady } from '../server/src/app.js';

// Start DB connect + seed as soon as the serverless function loads.
ensureReady().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Background initialization failed:', error?.message || error);
});

export default app;
