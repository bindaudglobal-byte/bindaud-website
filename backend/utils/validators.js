const { isValidObjectId } = require('mongoose');

const validateObjectId = (id) => {
  if (!isValidObjectId(id)) {
    const error = new Error('Invalid resource id');
    error.statusCode = 400;
    throw error;
  }
};

module.exports = {
  validateObjectId,
};
