const express = require('express');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  deleteOrder,
  trackOrder,
} = require('../controllers/orderController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.post('/', auth, createOrder);
router.get('/', auth, getOrders);
router.get('/track/:orderNumber', auth, trackOrder);
router.get('/:id', auth, getOrderById);
router.put('/:id', auth, admin, updateOrder);
router.post('/cancel/:id', auth, cancelOrder);
router.delete('/:id', auth, admin, deleteOrder);

module.exports = router;
