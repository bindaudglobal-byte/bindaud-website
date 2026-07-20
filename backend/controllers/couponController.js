const Coupon = require('../models/Coupon');
const { validateObjectId } = require('../utils/validators');

const getCoupons = async (_req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

const getCouponById = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    Object.assign(coupon, req.body);
    await coupon.save();
    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const validateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    if (!coupon.isActive || coupon.usageCount >= coupon.maxUsage || coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon is not valid' });
    }
    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
