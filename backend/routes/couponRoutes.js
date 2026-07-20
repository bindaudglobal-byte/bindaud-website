const express = require('express');
const {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.get('/validate/:code', validateCoupon);
router.get('/', auth, admin, getCoupons);
router.get('/:id', auth, admin, getCouponById);
router.post('/', auth, admin, createCoupon);
router.put('/:id', auth, admin, updateCoupon);
router.delete('/:id', auth, admin, deleteCoupon);

module.exports = router;
