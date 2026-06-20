import app, { ensureReady } from './app.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await ensureReady();

    app.listen(PORT, () => {
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
