const Payment = require('../models/Payment');
const Order = require('../models/Order');

const createPayment = async ({ orderId, customerId, amount, gateway, paymentMethod }) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const payment = await Payment.create({
    order: order._id,
    customer: customerId,
    amount,
    gateway,
    paymentMethod,
    status: 'pending',
  });

  return payment;
};

const verifyPayment = async (transactionId) => {
  const payment = await Payment.findOne({ transactionId });
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  payment.status = 'succeeded';
  payment.paidAt = new Date();
  await payment.save();

  await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'paid' });

  return payment;
};

module.exports = {
  createPayment,
  verifyPayment,
};
