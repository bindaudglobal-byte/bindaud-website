const Product = require('../models/Product');
const Customer = require('../models/Customer');

const getCart = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user._id).populate('cartItems.product');
    res.json({ success: true, data: customer.cartItems });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const product = await Product.findById(req.body.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const customer = await Customer.findById(req.user._id);
    const existingItem = customer.cartItems.find((item) => item.product.toString() === product._id.toString());

    if (existingItem) {
      existingItem.quantity += Number(req.body.quantity || 1);
    } else {
      customer.cartItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        quantity: Number(req.body.quantity || 1),
        size: req.body.size || '',
        color: req.body.color || '',
        image: product.images[0]?.url || '',
      });
    }

    await customer.save();
    res.json({ success: true, data: customer.cartItems });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user._id);
    const item = customer.cartItems.find((entry) => entry._id.toString() === req.params.itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    item.quantity = Number(req.body.quantity || 1);
    await customer.save();
    res.json({ success: true, data: customer.cartItems });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user._id);
    customer.cartItems = customer.cartItems.filter((item) => item._id.toString() !== req.params.itemId);
    await customer.save();
    res.json({ success: true, data: customer.cartItems });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user._id);
    customer.cartItems = [];
    await customer.save();
    res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
