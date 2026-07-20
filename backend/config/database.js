const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { getMongoUri } = require('./env');

const connectDB = async () => {
  const uri = getMongoUri();

  await mongoose.connect(uri, {
    autoIndex: true,
  });

  logger.info('MongoDB connected successfully');
  return mongoose.connection;
};

module.exports = connectDB;
