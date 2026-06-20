import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';

import connectDatabase from './config/database.js';
import initializeData from './config/initializeData.js';
import router from './routes/index.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.get("/", (req, res) => {
  res.json({
    message: "Graduation Project Backend API is running successfully"
  });
});

app.use('/api', router);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  res.status(statusCode).json({
    status: 'error',
    message
  });
});

let readyPromise = null;

export const ensureReady = async () => {
  if (!readyPromise) {
    readyPromise = (async () => {
      try {
        const connection = await connectDatabase();
        if (connection) {
          await initializeData();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('App initialization failed:', error.message);
      }
    })();
  }
  return readyPromise;
};

export default app;
