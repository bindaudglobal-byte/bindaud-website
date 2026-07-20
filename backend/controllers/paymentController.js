const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { createPayment, verifyPayment } = require('../services/paymentService');
const { validateObjectId } = require('../utils/validators');

const createPaymentRecord = async (req, res, next) => {
  try {
    const payment = await createPayment({
      orderId: req.body.orderId,
      customerId: req.user._id,
      amount: req.body.amount,
      gateway: req.body.gateway || 'cash_on_delivery',
      paymentMethod: req.body.paymentMethod || 'cash_on_delivery',
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const getPayments = async (_req, res, next) => {
  try {
    const payments = await Payment.find().populate('order customer').sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const verifyPaymentRecord = async (req, res, next) => {
  try {
    const payment = await verifyPayment(req.body.transactionId);
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentRecord,
  getPayments,
  verifyPaymentRecord,
};
