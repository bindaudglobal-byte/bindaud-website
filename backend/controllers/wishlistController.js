const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { validateObjectId } = require('../utils/validators');

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ customer: req.user._id }).populate('products.product');
    res.json({ success: true, data: wishlist || { products: [] } });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    validateObjectId(req.body.productId);
    const product = await Product.findById(req.body.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ customer: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ customer: req.user._id, products: [] });
    }

    const exists = wishlist.products.some((entry) => entry.product.toString() === product._id.toString());
    if (!exists) {
      wishlist.products.push({ product: product._id });
      await wishlist.save();
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer.wishlist.includes(wishlist._id)) {
      customer.wishlist.push(wishlist._id);
      await customer.save();
    }

    res.json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    validateObjectId(req.params.productId);
    const wishlist = await Wishlist.findOne({ customer: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter((entry) => entry.product.toString() !== req.params.productId);
    await wishlist.save();
    res.json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
