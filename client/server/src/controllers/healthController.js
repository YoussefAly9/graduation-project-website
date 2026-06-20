import mongoose from 'mongoose';

import connectDatabase, { getDbDiagnostics } from '../config/database.js';

export const getStatus = async (_req, res) => {
  // Trigger a connection attempt so the diagnostics reflect the real cause.
  await connectDatabase();

  const database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const diagnostics = getDbDiagnostics();

  res.json({
    status: 'ok',
    database,
    hasMongoUri: diagnostics.hasMongoUri,
    dbError: diagnostics.lastError,
    timestamp: new Date().toISOString()
  });
};
