const logger = require('../utils/logger');

const errorHandler = (err, _req, res, _next) => {
  logger.error(err.message || 'Unhandled error');

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
