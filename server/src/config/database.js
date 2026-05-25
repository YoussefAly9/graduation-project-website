import mongoose from 'mongoose';

const connectDatabase = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    // eslint-disable-next-line no-console
    console.warn('MONGODB_URI is not defined. Skipping MongoDB connection.');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true
    });

    // eslint-disable-next-line no-console
    console.log('MongoDB connected successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error', error);
    throw error;
  }
};

export default connectDatabase;

