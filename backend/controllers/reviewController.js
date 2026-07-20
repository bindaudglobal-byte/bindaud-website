const Review = require('../models/Review');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { validateObjectId } = require('../utils/validators');

const getReviews = async (req, res, next) => {
  try {
    validateObjectId(req.params.productId);
    const reviews = await Review.find({ product: req.params.productId }).populate('customer', 'name email');
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    validateObjectId(req.params.productId);
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const customer = await Customer.findById(req.user._id);
    const review = await Review.create({
      product: product._id,
      customer: customer._id,
      rating: Number(req.body.rating),
      title: req.body.title || '',
      comment: req.body.comment,
    });

    product.reviews.push(review._id);
    const reviews = await Review.find({ product: product._id });
    const average = reviews.reduce((sum, entry) => sum + entry.rating, 0) / reviews.length;
    product.rating = Number(average.toFixed(1));
    await product.save();

    customer.reviews.push(review._id);
    await customer.save();

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.rating = req.body.rating || review.rating;
    review.title = req.body.title || review.title;
    review.comment = req.body.comment || review.comment;
    await review.save();
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
};
