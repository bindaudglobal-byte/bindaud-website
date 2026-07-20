const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { getMongoUri } = require('./env');

const connectDB = async () => {
  const uri = getMongoUri();

  // Connect
  await mongoose.connect(uri, {
    autoIndex: true,
  });

  // Log connection target (mask credentials)
  try {
    const host = new URL(uri.includes('mongodb+srv') ? `http://${uri.split('@')[1]}` : uri).host;
    logger.info(`MongoDB connected successfully to ${host}`);
  } catch (e) {
    logger.info('MongoDB connected successfully');
  }

  // Ensure default settings exist
  try {
    // Require here to avoid circular deps
    const Setting = require('../models/Setting');
    const existing = await Setting.findOne();
    if (!existing) {
      await Setting.create({});
      logger.info('Default settings document created');
    }
  } catch (seedErr) {
    logger.warn('Failed to seed default settings:', seedErr.message);
  }

  return mongoose.connection;
};

module.exports = connectDB;
