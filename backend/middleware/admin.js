const Admin = require('../models/Admin');

const admin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const adminUser = await Admin.findById(req.user._id);
    if (!adminUser || !adminUser.isActive) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    req.admin = adminUser;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to validate admin access' });
  }
};

module.exports = admin;
