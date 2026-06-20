export const getStatus = async (_req, res) => {
  let database = 'disconnected';

  try {
    const mongoose = (await import('mongoose')).default;
    database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch {
    database = 'disconnected';
  }

  res.json({
    status: 'ok',
    database,
    timestamp: new Date().toISOString()
  });
};

