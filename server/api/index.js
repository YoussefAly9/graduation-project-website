import app, { ensureReady } from '../src/app.js';

// Safety nets so a failed DB connection can never crash the serverless function.
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught exception:', error);
});

ensureReady().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Background initialization failed:', error);
});

export default app;
