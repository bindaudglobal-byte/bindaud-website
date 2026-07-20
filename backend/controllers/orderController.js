const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { sendOrderConfirmation, sendShippingUpdate } = require('../services/emailService');
const { createOrderFromCart, updateOrderStatus } = require('../services/orderService');
const { validateObjectId } = require('../utils/validators');

const createOrder = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user._id);
    const order = await createOrderFromCart({ customer, orderData: req.body });

    if (order) {
      await sendOrderConfirmation(order);
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const query = req.user?.role === 'admin' || req.user?.role === 'super_admin' ? {} : { customer: req.user._id };
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!req.admin && order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    Object.assign(order, req.body);
    await order.save();

    if (req.body.orderStatus === 'shipped' && order.email) {
      await sendShippingUpdate(order);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = 'cancelled';
    order.paymentStatus = 'refunded';
    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber || req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: { orderNumber: order.orderNumber, orderStatus: order.orderStatus, trackingNumber: order.trackingNumber } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  deleteOrder,
  trackOrder,
};
