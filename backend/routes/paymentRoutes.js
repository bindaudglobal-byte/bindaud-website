const express = require('express');
const { createPaymentRecord, getPayments, verifyPaymentRecord } = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.post('/', auth, createPaymentRecord);
router.get('/', auth, admin, getPayments);
router.post('/verify', auth, verifyPaymentRecord);

module.exports = router;
