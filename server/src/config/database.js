import mongoose from 'mongoose';

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

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== 'production'
    });

    // eslint-disable-next-line no-console
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error', error.message);
    return null;
  }
};

export default connectDatabase;
