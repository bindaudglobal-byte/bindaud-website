const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');
const { getJwtSecret } = require('../config/env');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    let user = await Customer.findById(decoded.id).select('-password');
    if (!user) {
      user = await Admin.findById(decoded.id).select('-password');
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive account' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = auth;
