import express from 'express';

const fallbackApp = express();
fallbackApp.all('*', (_req, res) => {
  res.status(500).json({
    message: 'API failed to start',
    hint: 'Check Vercel server logs and MONGODB_URI on the server project.'
  });
});

let appPromise = null;

const loadApp = () => {
  if (!appPromise) {
    appPromise = import('../src/app.js')
      .then(({ default: app, ensureReady }) => {
        ensureReady().catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Background initialization failed:', error);
        });
        return app;
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('API bootstrap failed:', error);
        fallbackApp.use((_req, res) => {
          res.status(500).json({
            message: 'API failed to start',
            error: error.message
          });
        });
        return fallbackApp;
      });
  }

  return appPromise;
};

export default async (req, res) => {
  const app = await loadApp();
  return app(req, res);
};
