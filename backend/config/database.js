const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bindaud';

  await mongoose.connect(uri, {
    autoIndex: true,
  });

  logger.info('MongoDB connected successfully');
  return mongoose.connection;
};

module.exports = connectDB;
