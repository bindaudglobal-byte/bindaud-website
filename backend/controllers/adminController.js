const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

const createAdmin = async (req, res, next) => {
  try {
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'An admin user already exists' });
    }

    const admin = await Admin.create({
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || 'super_admin',
    });

    res.status(201).json({ success: true, data: admin.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'super-secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({ success: true, token, admin: admin.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const getAdminProfile = (req, res) => {
  res.json({ success: true, data: req.admin.toPublicJSON() });
};

const getDashboard = async (_req, res, next) => {
  try {
    const [products, orders, customers, admins] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Customer.countDocuments(),
      Admin.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        products,
        orders,
        customers,
        admins,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAdmin,
  loginAdmin,
  getAdminProfile,
  getDashboard,
};
