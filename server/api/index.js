import app, { ensureReady } from '../src/app.js';

ensureReady().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Background initialization failed:', error);
});

export default app;
