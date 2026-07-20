const Order = require('../models/Order');
const Product = require('../models/Product');
const generateOrderId = require('../utils/generateOrderId');

const createOrderFromCart = async ({ customer, orderData }) => {
  const products = [];
  let subtotal = 0;

  for (const item of customer.cartItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      continue;
    }

    const effectivePrice = product.salePrice > 0 ? product.salePrice : product.price;
    const itemTotal = effectivePrice * item.quantity;
    subtotal += itemTotal;

    products.push({
      product: product._id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      image: product.images[0]?.url || '',
    });
  }

  const shippingCost = orderData.shippingCost || 250;
  const discount = orderData.discount || 0;
  const total = subtotal + shippingCost - discount;

  const order = await Order.create({
    orderNumber: generateOrderId(),
    customer: customer._id,
    phone: orderData.phone,
    email: orderData.email,
    shippingAddress: orderData.shippingAddress,
    products,
    quantity: products.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    shippingCost,
    discount,
    coupon: orderData.coupon || null,
    total,
    paymentMethod: orderData.paymentMethod || 'cash_on_delivery',
    paymentStatus: 'pending',
    orderStatus: 'pending',
    notes: orderData.notes || '',
  });

  customer.cartItems = [];
  await customer.save();

  return order;
};

const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true });
  return order;
};

module.exports = {
  createOrderFromCart,
  updateOrderStatus,
};
