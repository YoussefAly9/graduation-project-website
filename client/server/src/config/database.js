import mongoose from 'mongoose';

// Fail fast instead of buffering queries for 10s when the DB is unreachable.
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

// Prevent unhandled 'error' events on the connection from crashing the process.
mongoose.connection.on('error', (error) => {
  // eslint-disable-next-line no-console
  console.error('MongoDB connection event error:', error.message);
});

let connectionPromise = null;
let lastConnectionError = null;

export const getDbDiagnostics = () => ({
  hasMongoUri: Boolean(process.env.MONGODB_URI),
  readyState: mongoose.connection.readyState,
  lastError: lastConnectionError
});

const connectDatabase = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    // eslint-disable-next-line no-console
    console.warn('MONGODB_URI is not defined. Skipping MongoDB connection.');
    return null;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        autoIndex: process.env.NODE_ENV !== 'production'
      })
      .then((conn) => {
        // eslint-disable-next-line no-console
        console.log('MongoDB connected successfully');
        lastConnectionError = null;
        return conn.connection;
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('MongoDB connection error:', error.message);
        lastConnectionError = error.message;
        connectionPromise = null;
        return null;
      });
  }

  return connectionPromise;
};

export default connectDatabase;
