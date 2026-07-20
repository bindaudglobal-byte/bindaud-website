const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const { sendPasswordReset, sendContactForm } = require('../services/emailService');
const { getJwtSecret } = require('../config/env');

const register = async (req, res, next) => {
  try {
    const existingCustomer = await Customer.findOne({ email: req.body.email });
    if (existingCustomer) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const customer = await Customer.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone || '',
      address: req.body.address || {},
    });

    const token = jwt.sign({ id: customer._id }, getJwtSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(201).json({ success: true, token, data: customer.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ email });

    if (!customer || !(await customer.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: customer._id }, getJwtSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({ success: true, token, data: customer.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const logout = (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

const forgotPassword = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ email: req.body.email });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    customer.resetPasswordToken = resetToken;
    customer.resetPasswordExpires = Date.now() + 1000 * 60 * 30;
    await customer.save();

    await sendPasswordReset(customer.email, resetToken);

    res.json({ success: true, message: 'Password reset instructions have been sent' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      resetPasswordToken: req.body.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!customer) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    customer.password = req.body.password;
    customer.resetPasswordToken = null;
    customer.resetPasswordExpires = null;
    await customer.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

const getProfile = (req, res) => {
  res.json({ success: true, data: req.user.toPublicJSON() });
};

const updateProfile = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user._id);
    const allowedFields = ['name', 'phone', 'address'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        customer[field] = req.body[field];
      }
    });

    await customer.save();
    res.json({ success: true, data: customer.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const contactForm = async (req, res, next) => {
  try {
    await sendContactForm({
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
    });

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  contactForm,
};
